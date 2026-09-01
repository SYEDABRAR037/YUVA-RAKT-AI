import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { LoginUserSchema } from "@/lib/validations/auth.schema";
import { verifyPassword } from "@/lib/auth/password";
import { signSessionToken, setSessionCookie, getRoleDashboardUrl } from "@/lib/auth/session";
import { logAuditEvent } from "@/lib/services/audit.service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = LoginUserSchema.safeParse(body);

    if (!result.success) {
      const errorMsg = result.error.issues[0]?.message || "Invalid input";
      return NextResponse.json({ success: false, error: errorMsg }, { status: 400 });
    }

    const { email, password } = result.data;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        youthDonorProfile: true,
        hospital: true,
        bloodBank: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Invalid email address or password" },
        { status: 401 }
      );
    }

    // Verify password hash
    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: "Invalid email address or password" },
        { status: 401 }
      );
    }

    // Check account status
    if (user.accountStatus === "SUSPENDED") {
      return NextResponse.json(
        {
          success: false,
          error: "Your account has been suspended by administration. Please contact support.",
        },
        { status: 403 }
      );
    }

    if (user.accountStatus === "DEACTIVATED") {
      return NextResponse.json(
        {
          success: false,
          error: "This account has been deactivated. Please contact support to reactivate.",
        },
        { status: 403 }
      );
    }

    // Update lastLoginAt
    const now = new Date();
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: now },
    });

    // Create Audit Log
    await logAuditEvent({
      userId: user.id,
      action: "LOGIN",
      entityType: "USER",
      entityId: user.id,
      metadata: {
        role: user.role,
        accountStatus: user.accountStatus,
      },
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      userAgent: req.headers.get("user-agent"),
    });

    // Sign session token & set cookie
    const token = await signSessionToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
      accountStatus: user.accountStatus,
      orgName: user.hospital?.name || user.bloodBank?.name,
      bloodGroup: user.youthDonorProfile?.bloodGroup,
    });
    await setSessionCookie(token);

    return NextResponse.json({
      success: true,
      message: "Signed in successfully",
      data: {
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          accountStatus: user.accountStatus,
        },
        redirectUrl: getRoleDashboardUrl(user.role),
      },
    });
  } catch (error: any) {
    console.error("[Login API Error]", error);
    return NextResponse.json(
      { success: false, error: "An unexpected server error occurred during login." },
      { status: 500 }
    );
  }
}
