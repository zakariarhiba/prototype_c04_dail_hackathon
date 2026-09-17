import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySession, SESSION_COOKIE } from "@/app/lib/auth";

// v2 real session enforcement (docs/01-system-design.md §10): redirects to
// /login when the signed session cookie is missing or invalid. API routes
// enforce the same check server-side independently (see app/api/*/route.ts)
// — this is a UX convenience, not the security boundary.
export async function proxy(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = await verifySession(token);
  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/receiving/:path*",
    "/invoices/:path*",
    "/inventory/:path*",
    "/parts/:path*",
    "/po/:path*",
  ],
};
