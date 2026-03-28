import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const AUTH_COOKIE = "access_token";
// Set by client after successful login/register — lets middleware distinguish
// returning users (send to /login) from brand-new visitors (send to /register)
const HAS_ACCOUNT_COOKIE = "has_account";
const AUTH_ROUTES = ["/login", "/register"];

// Role cookie set alongside access_token so middleware can do role-based guards
// without decoding the JWT (middleware runs on the Edge runtime, no jsonwebtoken)
const ROLE_COOKIE = "user_role";

const FINANCE_ROUTES = ["/reports", "/audit-log"];
const ADMIN_ROUTES = ["/settings/users"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAuthenticated = request.cookies.has(AUTH_COOKIE);
  const hasAccount = request.cookies.has(HAS_ACCOUNT_COOKIE);
  const role = request.cookies.get(ROLE_COOKIE)?.value ?? "";

  // Root — three-way redirect based on auth state
  if (pathname === "/") {
    if (isAuthenticated) return NextResponse.redirect(new URL("/dashboard", request.url));
    if (hasAccount) return NextResponse.redirect(new URL("/login", request.url));
    return NextResponse.redirect(new URL("/register", request.url));
  }

  // Auth routes — authenticated users go to dashboard, others pass through
  if (AUTH_ROUTES.includes(pathname)) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
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
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    if (ADMIN_ROUTES.some((r) => pathname.startsWith(r)) && !isAdmin) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/register",
    "/dashboard/:path*",
    "/profile/:path*",
    "/profile",
    "/clients/:path*",
    "/products/:path*",
    "/quotations/:path*",
    "/invoices/:path*",
    "/reports/:path*",
    "/settings/:path*",
    "/audit-log/:path*",
  ],
};
