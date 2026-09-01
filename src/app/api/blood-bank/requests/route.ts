import { NextRequest, NextResponse } from "next/server";
import { getSessionFromCookie } from "@/lib/auth/session";
import prisma from "@/lib/db";
import { getRegionalRequestsForBloodBank, acknowledgeBloodRequest } from "@/lib/services/request.service";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromCookie();
    if (!session || (session.role !== "BLOOD_BANK" && session.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 403 });
    }

    const bloodBank = await prisma.bloodBank.findUnique({
      where: { userId: session.userId },
    });

    const district = bloodBank?.district;
    const state = bloodBank?.state;

    const requests = await getRegionalRequestsForBloodBank({
      district,
      state,
    });

    return NextResponse.json({ success: true, requests });
  } catch (error: any) {
    console.error("GET /api/blood-bank/requests error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to load requests" }, { status: 500 });
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
    const { requestId } = body;
    if (!requestId) {
      return NextResponse.json({ success: false, error: "Request ID is required" }, { status: 400 });
    }

    const ipAddress = req.headers.get("x-forwarded-for") || undefined;
    const userAgent = req.headers.get("user-agent") || undefined;

    const acknowledged = await acknowledgeBloodRequest({
      bloodBankId: bloodBank.id,
      userId: session.userId,
      requestId,
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      message: "Hospital request acknowledged successfully",
      request: acknowledged,
    });
  } catch (error: any) {
    console.error("POST /api/blood-bank/requests error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to acknowledge request" }, { status: 400 });
  }
}
