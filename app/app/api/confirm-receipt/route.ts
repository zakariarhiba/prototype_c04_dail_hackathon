import { confirmReceipt } from "@/app/lib/store";

export async function POST(request: Request) {
  const body = await request.json();
  try {
    const result = await confirmReceipt(body);
    return Response.json({ ok: true, ...result });
  } catch (err) {
    return Response.json(
      { ok: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 400 }
    );
  }
}
