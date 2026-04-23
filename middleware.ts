import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// HttpOnly cookies are unreadable by browser JS but ARE readable by
// Next.js Edge middleware (server-side). Use the refresh_token cookie
// directly — no need for a separate has_session workaround.
const AUTH_COOKIE = "refresh_token";
// Set by client after successful login/register — lets middleware distinguish
// returning users (send to /login) from brand-new visitors (send to /register)
const HAS_ACCOUNT_COOKIE = "has_account";
const AUTH_ROUTES = ["/login", "/register"];

// Role cookie set alongside access_token so middleware can do role-based guards
// without decoding the JWT (middleware runs on the Edge runtime, no jsonwebtoken)
const ROLE_COOKIE = "user_role";

const FINANCE_ROUTES = ["/ims/reports", "/ims/audit-log"];
const ADMIN_ROUTES = ["/ims/settings/users"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAuthenticated = request.cookies.has(AUTH_COOKIE);
  const hasAccount = request.cookies.has(HAS_ACCOUNT_COOKIE);
  const role = request.cookies.get(ROLE_COOKIE)?.value ?? "";

  // Root — three-way redirect based on auth state
  if (pathname === "/") {
    if (isAuthenticated) return NextResponse.redirect(new URL("/modules", request.url));
    if (hasAccount) return NextResponse.redirect(new URL("/login", request.url));
    return NextResponse.redirect(new URL("/register", request.url));
  }

  // Auth routes — authenticated users go to modules, others pass through
  if (AUTH_ROUTES.includes(pathname)) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/modules", request.url));
    }
    return NextResponse.next();
  }

  // Unauthenticated — redirect to login with return path
  if (!isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Role-based guards (only enforced when role cookie is present)
  if (role) {
    const isFinance = role === "super_admin" || role === "accountant";
    const isAdmin = role === "super_admin";

    if (FINANCE_ROUTES.some((r) => pathname.startsWith(r)) && !isFinance) {
      return NextResponse.redirect(new URL("/ims/dashboard", request.url));
    }

    if (ADMIN_ROUTES.some((r) => pathname.startsWith(r)) && !isAdmin) {
      return NextResponse.redirect(new URL("/ims/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/register",
    "/modules",
    "/modules/:path*",
    "/hrm",
    "/hrm/:path*",
    "/ims",
    "/ims/:path*",
  ],
};
