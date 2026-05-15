import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isAuthPage = req.nextUrl.pathname.startsWith("/login");
  const isApiAuth = req.nextUrl.pathname.startsWith("/api/auth");
  const isPublicApi = req.nextUrl.pathname === "/api/stats/live";
  const isApiRoute = req.nextUrl.pathname.startsWith("/api");
  const isKiosk = req.nextUrl.pathname.startsWith("/quioskiii");
  const isKioskApi = req.nextUrl.pathname.startsWith("/api/kiosk");

  // Allow auth API routes, public endpoints, and kiosk (no-auth device)
  if (isApiAuth || isPublicApi || isKiosk || isKioskApi) return NextResponse.next();

  // Redirect to login if not authenticated (except login page and auth API)
  if (!isLoggedIn && !isAuthPage) {
    if (isApiRoute) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  // Redirect to dashboard if already logged in and trying to access login
  if (isLoggedIn && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
