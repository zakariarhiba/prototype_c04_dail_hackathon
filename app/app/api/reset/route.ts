import { resetState } from "@/app/lib/store";

export async function POST() {
  await resetState();
  return Response.json({ ok: true });
}
