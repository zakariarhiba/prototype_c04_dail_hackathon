import { simulateIncomingScan } from "@/app/lib/store";

export async function POST() {
  const pending = await simulateIncomingScan();
  return Response.json(pending);
}
