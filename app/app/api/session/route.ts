import { getSession } from "@/app/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session) return Response.json({ ok: true, user: null });
  return Response.json({ ok: true, user: { name: session.name, role: session.role } });
}
