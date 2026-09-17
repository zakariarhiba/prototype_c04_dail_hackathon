import { simulateScanFromPart } from "@/app/lib/store";
import { getSession } from "@/app/lib/session";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return Response.json({ ok: false, error: "Not signed in." }, { status: 401 });
  }
  const body = await request.json();
  try {
    const pending = await simulateScanFromPart(body);
    return Response.json({ ok: true, pendingScan: pending });
  } catch (err) {
    return Response.json(
      { ok: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 400 }
    );
  }
}
