import { getPoTimeline } from "@/app/lib/store";
import { getSession } from "@/app/lib/session";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) {
    return Response.json({ ok: false, error: "Not signed in." }, { status: 401 });
  }
  const { id } = await params;
  const timeline = await getPoTimeline(id);
  if (!timeline) {
    return Response.json({ ok: false, error: "Unknown PO." }, { status: 404 });
  }
  return Response.json({ ok: true, timeline });
}
