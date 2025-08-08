import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
export function middleware(req: NextRequest) {
  if (process.env.PREVIEW_MODE === '1') return NextResponse.next();
  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/auth") || pathname.startsWith("/api")) return NextResponse.next();
  const hasSession = req.cookies.get("sb-access-token") || req.cookies.get("sb:token");
  if (!hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = "/auth";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}
