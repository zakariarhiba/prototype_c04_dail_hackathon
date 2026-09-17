import { simulateIncomingInvoice } from "@/app/lib/store";
import { getSession } from "@/app/lib/session";

export async function POST() {
  const session = await getSession();
  if (!session) {
    return Response.json({ ok: false, error: "Not signed in." }, { status: 401 });
  }
  try {
    const pending = await simulateIncomingInvoice();
    return Response.json({ ok: true, ...pending });
  } catch (err) {
    return Response.json(
      { ok: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 409 }
    );
  }
}
