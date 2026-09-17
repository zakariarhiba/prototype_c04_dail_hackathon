import { addPart, listParts, partQrDataUrl } from "@/app/lib/store";
import { getSession } from "@/app/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return Response.json({ ok: false, error: "Not signed in." }, { status: 401 });
  }
  const parts = await listParts();
  const withQr = await Promise.all(
    parts.map(async (p) => ({ ...p, qr_data_url: await partQrDataUrl(p) }))
  );
  return Response.json({ ok: true, parts: withQr });
}

// v3 (§15): single-account scope — any authenticated user can add a part,
// same as confirm-receipt/approve-notice/add-stock below. See §15's note on
// shelving §10's role gating for this rebuild.
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return Response.json({ ok: false, error: "Not signed in." }, { status: 401 });
  }
  const body = await request.json();
  try {
    const part = await addPart(body);
    const qr_data_url = await partQrDataUrl(part);
    return Response.json({ ok: true, part: { ...part, qr_data_url } });
  } catch (err) {
    return Response.json(
      { ok: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 400 }
    );
  }
}
