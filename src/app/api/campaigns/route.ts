import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentSession } from "@/lib/auth/session";
import { createMobilizationCampaign, getCampaignProgress } from "@/lib/services/campaign.service";
import { BloodGroup, BloodComponentType } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const state = searchParams.get("state");
    const district = searchParams.get("district");
    const status = searchParams.get("status");

    const where: any = {};
    if (state) where.state = state;
    if (district && district !== "ALL") where.district = district;
    if (status && status !== "ALL") where.status = status;

    const campaigns = await prisma.mobilizationCampaign.findMany({
      where,
      include: {
        creator: { select: { fullName: true, role: true } },
        donorResponses: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const campaignsWithProgress = await Promise.all(
      campaigns.map(async (c) => {
        return await getCampaignProgress(c.id);
      })
    );

    return NextResponse.json({
      success: true,
      data: { campaigns: campaignsWithProgress },
    });
  } catch (error) {
    console.error("[Campaigns GET API Error]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Only Government Officials, Blood Banks and Super Admins can create campaigns
    const allowedRoles = ["GOVERNMENT_OFFICIAL", "BLOOD_BANK", "SUPER_ADMIN"];
    if (!allowedRoles.includes(session.role)) {
      return NextResponse.json({ success: false, error: "Access forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { title, description, bloodGroup, componentType, state, district, targetDonorsCount, endDate } = body;

    if (!title || !bloodGroup || !state || !district || !endDate) {
      return NextResponse.json({ success: false, error: "Missing required campaign fields" }, { status: 400 });
    }

    const result = await createMobilizationCampaign(
      {
        title,
        description,
        bloodGroup: bloodGroup as BloodGroup,
        componentType: (componentType as BloodComponentType) || "WHOLE_BLOOD",
        state,
        district,
        targetDonorsCount: Number(targetDonorsCount) || 50,
        endDate: new Date(endDate),
      },
      session.userId
    );

    return NextResponse.json({
      success: true,
      data: result,
      message: `Mobilization campaign created and ${result.notifiedCount} verified donors alerted.`,
    });
  } catch (error: any) {
    console.error("[Campaigns POST API Error]", error);
    return NextResponse.json({ success: false, error: error.message || "Internal server error" }, { status: 500 });
  }
}
