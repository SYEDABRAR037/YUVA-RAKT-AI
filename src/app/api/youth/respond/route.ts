import { NextRequest, NextResponse } from "next/server";
import { getSessionFromCookie } from "@/lib/auth/session";
import prisma from "@/lib/db";
import { DonorResponseSchema } from "@/lib/validations/blood.schema";
import { logAuditEvent } from "@/lib/services/audit.service";
import { createNotification } from "@/lib/services/notification.service";

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromCookie();
    if (!session || session.role !== "YOUTH_DONOR") {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 403 });
    }

    const donor = await prisma.youthDonorProfile.findUnique({
      where: { userId: session.userId },
      include: { user: true },
    });
    if (!donor) {
      return NextResponse.json({ success: false, error: "Youth donor profile not found" }, { status: 404 });
    }

    const body = await req.json();
    const parsed = DonorResponseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Invalid payload" },
        { status: 400 }
      );
    }

    const request = await prisma.bloodRequest.findUnique({
      where: { id: parsed.data.requestId },
      include: { hospital: true },
    });
    if (!request) {
      return NextResponse.json({ success: false, error: "Blood request not found" }, { status: 404 });
    }

    // Upsert donor response
    const response = await prisma.donorResponse.upsert({
      where: {
        requestId_donorId: {
          requestId: parsed.data.requestId,
          donorId: donor.id,
        },
      },
      update: {
        status: parsed.data.status,
        message: parsed.data.message,
      },
      create: {
        requestId: parsed.data.requestId,
        donorId: donor.id,
        status: parsed.data.status,
        message: parsed.data.message,
      },
    });

    const ipAddress = req.headers.get("x-forwarded-for") || undefined;
    const userAgent = req.headers.get("user-agent") || undefined;

    await logAuditEvent({
      userId: session.userId,
      action: "DONOR_RESPONSE",
      entityType: "BLOOD_REQUEST",
      entityId: request.id,
      metadata: {
        status: parsed.data.status,
        bloodGroup: donor.bloodGroup,
        hospitalName: request.hospital.name,
      },
      ipAddress,
      userAgent,
    });

    // If interested, notify the hospital that a voluntary donor is willing to assist
    if (parsed.data.status === "INTERESTED") {
      const bloodGroupLabel = donor.bloodGroup.replace("_POSITIVE", "+").replace("_NEGATIVE", "-");
      await createNotification({
        userId: request.hospital.userId,
        type: "DONOR_MATCH",
        title: `🤝 Voluntary Donor Responded: ${bloodGroupLabel}`,
        message: `A voluntary donor (${bloodGroupLabel}, ${donor.user.district}) in your area has indicated willingness to donate for request #${request.id.slice(-6)}.`,
        relatedEntityType: "BLOOD_REQUEST",
        relatedEntityId: request.id,
      });
    }

    return NextResponse.json({
      success: true,
      message: parsed.data.status === "INTERESTED" ? "Thank you! Your willingness to assist has been recorded." : "Response recorded.",
      response,
    });
  } catch (error: any) {
    console.error("POST /api/youth/respond error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to record response" }, { status: 400 });
  }
}
