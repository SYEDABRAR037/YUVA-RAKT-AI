import { NextRequest, NextResponse } from "next/server";
import { getSessionFromCookie } from "@/lib/auth/session";
import prisma from "@/lib/db";
import { ReviewVerificationSchema } from "@/lib/validations/blood.schema";
import { getPendingVerificationsForBloodBank, reviewDonorVerification } from "@/lib/services/verification.service";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromCookie();
    if (!session || (session.role !== "BLOOD_BANK" && session.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 403 });
    }

    const bloodBank = await prisma.bloodBank.findUnique({
      where: { userId: session.userId },
    });

    const requests = await getPendingVerificationsForBloodBank({
      district: bloodBank?.district,
      state: bloodBank?.state,
    });

    return NextResponse.json({ success: true, requests });
  } catch (error: any) {
    console.error("GET /api/blood-bank/verifications error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to load verifications" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromCookie();
    if (!session || session.role !== "BLOOD_BANK") {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 403 });
    }

    const bloodBank = await prisma.bloodBank.findUnique({
      where: { userId: session.userId },
    });
    if (!bloodBank) {
      return NextResponse.json({ success: false, error: "Blood bank profile not found" }, { status: 404 });
    }

    const body = await req.json();
    const parsed = ReviewVerificationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Invalid review payload" },
        { status: 400 }
      );
    }

    const ipAddress = req.headers.get("x-forwarded-for") || undefined;
    const userAgent = req.headers.get("user-agent") || undefined;

    const result = await reviewDonorVerification({
      bloodBankId: bloodBank.id,
      userId: session.userId,
      requestId: parsed.data.requestId,
      decision: parsed.data.decision,
      rejectionReason: parsed.data.rejectionReason,
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      message: `Donor verification application has been marked as ${parsed.data.decision}.`,
      verification: result,
    });
  } catch (error: any) {
    console.error("POST /api/blood-bank/verifications error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to review verification" }, { status: 400 });
  }
}
