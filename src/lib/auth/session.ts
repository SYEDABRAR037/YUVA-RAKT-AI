import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { UserRole, AccountStatus } from "@prisma/client";

export const SESSION_COOKIE_NAME = "yuva_session";

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || "yuva_rakt_ai_super_secret_jwt_key_for_hackathon_demo_2026"
);

export interface AuthSessionPayload {
  userId: string;
  email: string;
  role: UserRole;
  fullName: string;
  accountStatus: AccountStatus;
  orgName?: string;
  bloodGroup?: string;
}

/**
 * Creates a signed JWT session token.
 */
export async function signSessionToken(payload: AuthSessionPayload, expiresIn = "7d"): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(SECRET_KEY);
}

/**
 * Verifies and decodes a JWT token.
 */
export async function verifySessionToken(token: string): Promise<AuthSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload as unknown as AuthSessionPayload;
  } catch {
    return null;
  }
}

/**
 * Reads and verifies the current session from incoming Next.js request cookies.
 */
export async function getCurrentSession(): Promise<AuthSessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;
    return await verifySessionToken(token);
  } catch {
    return null;
  }
}

export const getSessionFromCookie = getCurrentSession;

/**
 * Sets the secure HTTP-Only session cookie.
 */
export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

/**
 * Clears the session cookie on logout.
 */
export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Role-based redirect destination map.
 */
export function getRoleDashboardUrl(role: UserRole): string {
  switch (role) {
    case "YOUTH_DONOR":
      return "/youth/dashboard";
    case "HOSPITAL":
      return "/hospital/dashboard";
    case "BLOOD_BANK":
      return "/blood-bank/dashboard";
    case "GOVERNMENT_OFFICIAL":
      return "/government/dashboard";
    case "SUPER_ADMIN":
      return "/admin/dashboard";
    case "AMBULANCE":
      return "/ambulance/dashboard";
    default:
      return "/login";
  }
}
