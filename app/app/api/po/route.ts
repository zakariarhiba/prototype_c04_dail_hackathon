import { listPoTimelines } from "@/app/lib/store";
import { getSession } from "@/app/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return Response.json({ ok: false, error: "Not signed in." }, { status: 401 });
  }
  const timelines = await listPoTimelines();
  return Response.json({ ok: true, timelines });
}
