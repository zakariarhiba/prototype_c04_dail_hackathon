import { getState } from "@/app/lib/store";
import { getSession } from "@/app/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return Response.json({ ok: false, error: "Not signed in." }, { status: 401 });
  }
  const s = await getState();
  return Response.json({
    orders: s.orders,
    deliveryNotes: s.deliveryNotes,
    receipts: s.receipts,
    discardedDuplicates: s.discardedDuplicates,
    notices: s.notices,
    pendingScan: s.pendingScan,
    pendingInvoice: s.pendingInvoice,
  });
}
