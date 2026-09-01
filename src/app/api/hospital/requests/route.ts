import { NextRequest, NextResponse } from "next/server";
import { getSessionFromCookie } from "@/lib/auth/session";
import prisma from "@/lib/db";
import { CreateBloodRequestSchema } from "@/lib/validations/blood.schema";
import { createBloodRequest, getHospitalBloodRequests } from "@/lib/services/request.service";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromCookie();
    if (!session || (session.role !== "HOSPITAL" && session.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 403 });
    }

    const hospital = await prisma.hospital.findUnique({
      where: { userId: session.userId },
    });

    if (!hospital) {
      return NextResponse.json({ success: false, error: "Hospital profile not found" }, { status: 404 });
    }

    const requests = await getHospitalBloodRequests(hospital.id);
    return NextResponse.json({ success: true, requests });
  } catch (error: any) {
    console.error("GET /api/hospital/requests error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to load requests" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromCookie();
    if (!session || session.role !== "HOSPITAL") {
      return NextResponse.json({ success: false, error: "Only authorized hospitals can raise blood requests" }, { status: 403 });
    }

    const hospital = await prisma.hospital.findUnique({
      where: { userId: session.userId },
    });

    if (!hospital) {
      return NextResponse.json({ success: false, error: "Hospital profile not found" }, { status: 404 });
    }

    const body = await req.json();
    const parsed = CreateBloodRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Invalid request payload" },
        { status: 400 }
      );
    }

    const ipAddress = req.headers.get("x-forwarded-for") || undefined;
    const userAgent = req.headers.get("user-agent") || undefined;

    const result = await createBloodRequest({
      hospitalId: hospital.id,
      userId: session.userId,
      bloodGroup: parsed.data.bloodGroup,
      componentType: parsed.data.componentType,
      unitsRequired: parsed.data.unitsRequired,
      urgency: parsed.data.urgency,
      requiredBy: new Date(parsed.data.requiredBy),
      reason: parsed.data.reason,
      patientAgeGroup: parsed.data.patientAgeGroup,
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      message: `Blood request created successfully. ${result.matchingDonorsCount} potential donor(s) notified in ${hospital.district}.`,
      data: result,
    });
  } catch (error: any) {
    console.error("POST /api/hospital/requests error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to create blood request" }, { status: 500 });
  }
}
