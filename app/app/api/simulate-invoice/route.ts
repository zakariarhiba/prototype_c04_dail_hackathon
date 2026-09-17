import { simulateIncomingInvoice } from "@/app/lib/store";

export async function POST() {
  const pending = await simulateIncomingInvoice();
  return Response.json(pending);
}
