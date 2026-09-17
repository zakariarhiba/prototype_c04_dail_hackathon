import { approveDiscrepancyNotice } from "@/app/lib/store";
import { getSession } from "@/app/lib/session";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return Response.json({ ok: false, error: "Not signed in." }, { status: 401 });
  }
  if (session.role !== "approver") {
    return Response.json({ ok: false, error: "Only a reconciliation lead can approve a discrepancy notice." }, { status: 403 });
  }

  const body = await request.json();
  try {
    const notice = await approveDiscrepancyNotice({ ...body, approved_by: session.name });
    return Response.json({ ok: true, notice });
  } catch (err) {
    return Response.json(
      { ok: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 400 }
    );
  }
}
