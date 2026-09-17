import { simulateIncomingScan } from "@/app/lib/store";

export async function POST() {
  const pending = simulateIncomingScan();
  return Response.json(pending);
}
