import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

// Middleware for auth check using NextAuth v5
export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Check if accessing dashboard routes
  if (pathname.startsWith("/dashboard")) {
    // Check if user is authenticated
    if (!req.auth) {
      // Redirect to login if no session
      const loginUrl = new URL("/auth/secure/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
});

// Configure which routes the middleware applies to
export const config = {
  matcher: ["/dashboard/:path*"],
};
