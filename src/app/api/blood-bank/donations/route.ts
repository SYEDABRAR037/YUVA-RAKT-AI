import { NextRequest, NextResponse } from "next/server";
import { getSessionFromCookie } from "@/lib/auth/session";
import prisma from "@/lib/db";
import { RecordDonationSchema } from "@/lib/validations/blood.schema";
import { recordCompletedDonation, getBloodBankDonations } from "@/lib/services/donation.service";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromCookie();
    if (!session || (session.role !== "BLOOD_BANK" && session.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 403 });
    }

    const bloodBank = await prisma.bloodBank.findUnique({
      where: { userId: session.userId },
    });
    if (!bloodBank) {
      return NextResponse.json({ success: false, error: "Blood bank profile not found" }, { status: 404 });
    }

    const donations = await getBloodBankDonations(bloodBank.id, 50);
    return NextResponse.json({ success: true, donations });
  } catch (error: any) {
    console.error("GET /api/blood-bank/donations error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to load donations" }, { status: 500 });
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
    const parsed = RecordDonationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Invalid donation payload" },
        { status: 400 }
      );
    }

    const ipAddress = req.headers.get("x-forwarded-for") || undefined;
    const userAgent = req.headers.get("user-agent") || undefined;

    const donation = await recordCompletedDonation({
      bloodBankId: bloodBank.id,
      userId: session.userId,
      donorId: parsed.data.donorId,
      donorEmailOrPhone: parsed.data.donorEmailOrPhone,
      bloodGroup: parsed.data.bloodGroup,
      componentType: parsed.data.componentType,
      units: parsed.data.units,
      donationDate: parsed.data.donationDate ? new Date(parsed.data.donationDate) : undefined,
      campName: parsed.data.campName,
      certificateNumber: parsed.data.certificateNumber,
      notes: parsed.data.notes,
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      message: `Voluntary donation of ${parsed.data.units} unit(s) recorded successfully and added to active inventory.`,
      donation,
    });
  } catch (error: any) {
    console.error("POST /api/blood-bank/donations error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to record donation" }, { status: 400 });
  }
}
