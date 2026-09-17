import { approveDiscrepancyNotice } from "@/app/lib/store";

export async function POST(request: Request) {
  const body = await request.json();
  try {
    const notice = await approveDiscrepancyNotice(body);
    return Response.json({ ok: true, notice });
  } catch (err) {
    return Response.json(
      { ok: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 400 }
    );
  }
}
