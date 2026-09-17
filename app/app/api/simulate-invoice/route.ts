import { simulateIncomingInvoice } from "@/app/lib/store";

export async function POST() {
  const pending = simulateIncomingInvoice();
  return Response.json(pending);
}
