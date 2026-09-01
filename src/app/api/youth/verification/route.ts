import { NextRequest, NextResponse } from "next/server";
import { getSessionFromCookie } from "@/lib/auth/session";
import { SubmitVerificationSchema } from "@/lib/validations/blood.schema";
import { submitDonorVerification, getDonorVerificationStatus } from "@/lib/services/verification.service";

export async function GET() {
  try {
    const session = await getSessionFromCookie();
    if (!session || (session.role !== "YOUTH_DONOR" && session.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 403 });
    }

    const donor = await getDonorVerificationStatus(session.userId);
    if (!donor) {
      return NextResponse.json({ success: false, error: "Youth donor profile not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      verificationStatus: donor.verificationStatus,
      rejectionReason: donor.rejectionReason,
      verificationSubmittedAt: donor.verificationSubmittedAt,
      requests: donor.verificationRequests,
    });
  } catch (error: any) {
    console.error("GET /api/youth/verification error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to load status" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromCookie();
    if (!session || session.role !== "YOUTH_DONOR") {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = SubmitVerificationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Invalid submission" },
        { status: 400 }
      );
    }

    const ipAddress = req.headers.get("x-forwarded-for") || undefined;
    const userAgent = req.headers.get("user-agent") || undefined;

    const request = await submitDonorVerification({
      userId: session.userId,
      documentType: parsed.data.documentType,
      documentNumber: parsed.data.documentNumber,
      notes: parsed.data.notes,
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      message: "Verification details submitted successfully. An authorized blood centre in your district will review your application.",
      request,
    });
  } catch (error: any) {
    console.error("POST /api/youth/verification error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to submit verification" }, { status: 400 });
  }
}
