import { addNewStock } from "@/app/lib/store";
import { getSession } from "@/app/lib/session";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return Response.json({ ok: false, error: "Not signed in." }, { status: 401 });
  }
  if (session.role !== "clerk") {
    return Response.json({ ok: false, error: "Only a parts receiving lead can add stock." }, { status: 403 });
  }

  const body = await request.json();
  try {
    const result = await addNewStock({ ...body, clerk_name: session.name });
    return Response.json({ ok: true, ...result });
  } catch (err) {
    return Response.json(
      { ok: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 400 }
    );
  }
}
