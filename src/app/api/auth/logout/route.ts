import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession, clearSessionCookie } from "@/lib/auth/session";
import { logAuditEvent } from "@/lib/services/audit.service";

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentSession();

    if (session) {
      await logAuditEvent({
        userId: session.userId,
        action: "LOGOUT",
        entityType: "USER",
        entityId: session.userId,
        metadata: {
          role: session.role,
        },
        ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
        userAgent: req.headers.get("user-agent"),
      });
    }

    await clearSessionCookie();

    return NextResponse.json({
      success: true,
      message: "Signed out successfully",
    });
  } catch (error) {
    console.error("[Logout API Error]", error);
    await clearSessionCookie();
    return NextResponse.json({ success: true, message: "Logged out" });
  }
}
