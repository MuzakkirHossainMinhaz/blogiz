import { auth } from "@/lib/auth";
import { dashboardAccess, isUserRole } from "@/lib/permissions";
import { applySecurityHeaders, contentSecurityPolicy } from "@/lib/security-headers";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = contentSecurityPolicy(nonce);
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const role = isUserRole(req.auth?.user?.role) ? req.auth?.user?.role : undefined;
  const access = dashboardAccess(role, pathname);

  if (access === "login") {
    const loginUrl = new URL("/auth/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    const redirect = NextResponse.redirect(loginUrl);
    applySecurityHeaders(redirect.headers, csp);
    return redirect;
  }

  if (access === "forbidden") {
    const redirect = NextResponse.redirect(new URL("/dashboard", req.url));
    applySecurityHeaders(redirect.headers, csp);
    return redirect;
  }

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  applySecurityHeaders(response.headers, csp);
  // Avoid stale HTML/document responses pinning old Turbopack module graphs in the browser.
  if (process.env.NODE_ENV !== "production") {
    response.headers.set("Cache-Control", "no-store, must-revalidate");
  }
  return response;
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
