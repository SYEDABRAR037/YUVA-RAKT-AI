import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentSession } from "@/lib/auth/session";
import { logAuditEvent } from "@/lib/services/audit.service";
import { DonorResponseStatus } from "@prisma/client";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id: campaignId } = await params;
    const body = await req.json();
    const { status = "INTERESTED", notes } = body;

    const donorProfile = await prisma.youthDonorProfile.findUnique({
      where: { userId: session.userId },
    });

    if (!donorProfile) {
      return NextResponse.json({ success: false, error: "Only youth donors can respond to campaigns" }, { status: 403 });
    }

    const response = await prisma.campaignDonorResponse.upsert({
      where: {
        campaignId_donorId: {
          campaignId,
          donorId: donorProfile.id,
        },
      },
      update: {
        status: status as DonorResponseStatus,
        notes,
      },
      create: {
        campaignId,
        donorId: donorProfile.id,
        status: status as DonorResponseStatus,
        notes,
      },
    });

    await logAuditEvent({
      userId: session.userId,
      action: "DONOR_RESPONDED",
      entityType: "CAMPAIGN",
      entityId: campaignId,
      metadata: { status, notes },
    });

    return NextResponse.json({
      success: true,
      data: { response },
      message: "Your campaign response has been recorded.",
    });
  } catch (error: any) {
    console.error("[Campaign Response API Error]", error);
    return NextResponse.json({ success: false, error: error.message || "Internal server error" }, { status: 500 });
  }
}
