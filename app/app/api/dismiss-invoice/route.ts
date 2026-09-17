import { dismissPendingInvoice } from "@/app/lib/store";

export async function POST() {
  dismissPendingInvoice();
  return Response.json({ ok: true });
}
