import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/db";
import { ForgotPasswordSchema } from "@/lib/validations/auth.schema";
import { logAuditEvent } from "@/lib/services/audit.service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = ForgotPasswordSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid email address" },
        { status: 400 }
      );
    }

    const { email } = result.data;
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // To prevent email enumeration attacks in production, respond with success message
    if (!user) {
      return NextResponse.json({
        success: true,
        message: "If an account exists with this email, password reset instructions have been generated.",
      });
    }

    // Generate secure random reset token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour validity

    // Invalidate old tokens for this user
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id },
    });

    // Store new token
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    // Create Audit Log
    await logAuditEvent({
      userId: user.id,
      action: "PASSWORD_RESET_REQUEST",
      entityType: "SECURITY",
      entityId: user.id,
      metadata: { email: user.email },
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      userAgent: req.headers.get("user-agent"),
    });

    // For Hackathon Prototype Mode:
    // In production, this token is sent via email (e.g. AWS SES/Resend/SendGrid).
    // In this prototype, we return the demo reset link for easy testing.
    return NextResponse.json({
      success: true,
      message: "Password reset token generated successfully.",
      demoResetToken: token,
      demoResetUrl: `/reset-password?token=${token}`,
      note: "Prototype Mode: In production, this link is dispatched securely via registered email.",
    });
  } catch (error) {
    console.error("[Forgot Password API Error]", error);
    return NextResponse.json(
      { success: false, error: "Unable to process password reset request." },
      { status: 500 }
    );
  }
}
