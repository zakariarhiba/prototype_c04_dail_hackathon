import { resetState } from "@/app/lib/store";

// Deliberately not session-gated: it's the demo bootstrap/reset utility
// (also how the seeded users table gets (re)populated), not a role-gated
// write per docs/01-system-design.md §10. Gating it would lock a fresh
// database out of ever logging in.
export async function POST() {
  await resetState();
  return Response.json({ ok: true });
}
