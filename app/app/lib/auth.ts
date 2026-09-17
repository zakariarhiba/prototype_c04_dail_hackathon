// v2 real session (docs/01-system-design.md §10): a signed, HTTP-only
// cookie, no OAuth/SSO. Real session *enforcement*, not real identity
// verification — see §10/§8 for what's deliberately still out of scope
// (password policy, recovery, rate limiting, audit-grade logging).

export const SESSION_COOKIE = "c04_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function sessionSecret(): string {
  // Demo-grade default so the app runs out of the box; override via env for
  // anything longer-lived than this prototype.
  return process.env.SESSION_SECRET ?? "c04-dev-session-secret-not-for-production";
}

function base64url(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = "";
  for (const b of arr) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64urlDecode(s: string): Uint8Array<ArrayBuffer> {
  const padded = s.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(s.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function hmacKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(sessionSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export type SessionPayload = {
  sub: string;
  name: string;
  role: "clerk" | "approver";
  iat: number;
};

export async function signSession(payload: SessionPayload): Promise<string> {
  const data = encoder.encode(JSON.stringify(payload));
  const key = await hmacKey();
  const sig = await crypto.subtle.sign("HMAC", key, data);
  return `${base64url(data)}.${base64url(sig)}`;
}

// Pure verification (no cookie access) so it can run in the proxy (edge
// runtime) as well as route handlers.
export async function verifySession(token: string | null | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  const [dataB64, sigB64] = token.split(".");
  if (!dataB64 || !sigB64) return null;
  let data: Uint8Array<ArrayBuffer>;
  let sig: Uint8Array<ArrayBuffer>;
  try {
    data = base64urlDecode(dataB64);
    sig = base64urlDecode(sigB64);
  } catch {
    return null;
  }
  const key = await hmacKey();
  const ok = await crypto.subtle.verify("HMAC", key, sig, data);
  if (!ok) return null;
  try {
    return JSON.parse(decoder.decode(data)) as SessionPayload;
  } catch {
    return null;
  }
}

// Password hashing (PBKDF2-SHA256, Web Crypto — portable to edge/node).
// Demo-grade: fine for two seeded prototype users, not a real credential
// store (see §10's "not real identity verification" note).
const PBKDF2_ITERATIONS = 100_000;

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    key,
    256
  );
  return `${base64url(salt)}:${base64url(bits)}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltB64, hashB64] = stored.split(":");
  if (!saltB64 || !hashB64) return false;
  const salt = base64urlDecode(saltB64);
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    key,
    256
  );
  return base64url(bits) === hashB64;
}
