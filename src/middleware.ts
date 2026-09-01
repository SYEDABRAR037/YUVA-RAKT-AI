import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { UserRole, AccountStatus } from "@prisma/client";

const SESSION_COOKIE_NAME = "yuva_session";
const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || "yuva_rakt_ai_super_secret_jwt_key_for_hackathon_demo_2026"
);

interface SessionPayload {
  userId: string;
  email: string;
  role: UserRole;
  fullName: string;
  accountStatus: AccountStatus;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Define protected path prefixes and their authorized roles
  const protectedRoutes: { prefix: string; allowedRoles: UserRole[] }[] = [
    { prefix: "/youth", allowedRoles: ["YOUTH_DONOR"] },
    { prefix: "/hospital", allowedRoles: ["HOSPITAL"] },
    { prefix: "/blood-bank", allowedRoles: ["BLOOD_BANK"] },
    { prefix: "/government", allowedRoles: ["GOVERNMENT_OFFICIAL"] },
    { prefix: "/admin", allowedRoles: ["SUPER_ADMIN"] },
    {
      prefix: "/settings",
      allowedRoles: ["YOUTH_DONOR", "HOSPITAL", "BLOOD_BANK", "GOVERNMENT_OFFICIAL", "SUPER_ADMIN"],
    },
  ];

  const matchingRoute = protectedRoutes.find((r) => pathname.startsWith(r.prefix));

  if (!matchingRoute) {
    return NextResponse.next();
  }

  // Check cookie
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Verify token
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    const session = payload as unknown as SessionPayload;

    // Check account status
    if (session.accountStatus === "SUSPENDED" || session.accountStatus === "DEACTIVATED") {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("error", "account_suspended");
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete(SESSION_COOKIE_NAME);
      return response;
    }

    // Role check
    if (!matchingRoute.allowedRoles.includes(session.role)) {
      // User is authenticated but doesn't have permissions for this section
      // Redirect to their own dashboard
      let fallback = "/login";
      switch (session.role) {
        case "YOUTH_DONOR":
          fallback = "/youth/dashboard";
          break;
        case "HOSPITAL":
          fallback = "/hospital/dashboard";
          break;
        case "BLOOD_BANK":
          fallback = "/blood-bank/dashboard";
          break;
        case "GOVERNMENT_OFFICIAL":
          fallback = "/government/dashboard";
          break;
        case "SUPER_ADMIN":
          fallback = "/admin/dashboard";
          break;
      }
      return NextResponse.redirect(new URL(fallback, req.url));
    }

    return NextResponse.next();
  } catch {
    // Token invalid or expired
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete(SESSION_COOKIE_NAME);
    return response;
  }
}

export const config = {
  matcher: [
    "/youth/:path*",
    "/hospital/:path*",
    "/blood-bank/:path*",
    "/government/:path*",
    "/admin/:path*",
    "/settings/:path*",
  ],
};
