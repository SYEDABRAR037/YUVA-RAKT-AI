import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { ResetPasswordSchema } from "@/lib/validations/auth.schema";
import { hashPassword } from "@/lib/auth/password";
import { logAuditEvent } from "@/lib/services/audit.service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = ResetPasswordSchema.safeParse(body);

    if (!result.success) {
      const errorMsg = result.error.issues[0]?.message || "Validation failed";
      return NextResponse.json({ success: false, error: errorMsg }, { status: 400 });
    }

    const { token, password } = result.data;

    // Find and validate token
    const resetRecord = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetRecord) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired password reset link." },
        { status: 400 }
      );
    }

    if (resetRecord.usedAt) {
      return NextResponse.json(
        { success: false, error: "This password reset link has already been used." },
        { status: 400 }
      );
    }

    if (new Date() > resetRecord.expiresAt) {
      return NextResponse.json(
        { success: false, error: "This password reset link has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Hash new password
    const newPasswordHash = await hashPassword(password);

    // Update user password and mark token as used
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetRecord.userId },
        data: { passwordHash: newPasswordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetRecord.id },
        data: { usedAt: new Date() },
      }),
    ]);

    // Create Audit Log
    await logAuditEvent({
      userId: resetRecord.userId,
      action: "PASSWORD_RESET_SUCCESS",
      entityType: "SECURITY",
      entityId: resetRecord.userId,
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      userAgent: req.headers.get("user-agent"),
    });

    return NextResponse.json({
      success: true,
      message: "Your password has been successfully reset. You can now log in.",
    });
  } catch (error) {
    console.error("[Reset Password API Error]", error);
    return NextResponse.json(
      { success: false, error: "An error occurred while resetting your password." },
      { status: 500 }
    );
  }
}
