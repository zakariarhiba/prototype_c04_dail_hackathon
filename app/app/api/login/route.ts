import { verifyLogin } from "@/app/lib/store";
import { setSessionCookie } from "@/app/lib/session";

export async function POST(request: Request) {
  const body = await request.json();
  const username = typeof body.username === "string" ? body.username.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!username || !password) {
    return Response.json({ ok: false, error: "Username and password are required." }, { status: 400 });
  }

  const user = await verifyLogin(username, password);
  if (!user) {
    return Response.json({ ok: false, error: "Invalid username or password." }, { status: 401 });
  }

  await setSessionCookie({ sub: user.id, name: user.name, role: user.role, iat: Date.now() });
  return Response.json({ ok: true, user: { name: user.name, role: user.role } });
}
