import { getState } from "@/app/lib/store";

export async function GET() {
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
