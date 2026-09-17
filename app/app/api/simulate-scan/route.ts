import { simulateIncomingScan } from "@/app/lib/store";

export async function POST() {
  try {
    const pending = await simulateIncomingScan();
    return Response.json({ ok: true, ...pending });
  } catch (err) {
    return Response.json(
      { ok: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 409 }
    );
  }
}
