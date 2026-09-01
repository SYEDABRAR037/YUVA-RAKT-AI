import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentSession } from "@/lib/auth/session";

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "GOVERNMENT_OFFICIAL" && session.role !== "SUPER_ADMIN") {
      return NextResponse.json({ success: false, error: "Access forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const state = searchParams.get("state") || "Maharashtra";
    const district = searchParams.get("district");

    const hospitalFilter: any = { state };
    const bloodBankFilter: any = { state };
    const donorFilter: any = { user: { state } };
    const requestFilter: any = { hospital: { state } };

    if (district && district !== "ALL") {
      hospitalFilter.district = district;
      bloodBankFilter.district = district;
      donorFilter.user.district = district;
      requestFilter.hospital.district = district;
    }

    const now = new Date();

    const [
      totalBloodRequests,
      activeEmergencyRequests,
      verifiedYouthDonors,
      availableYouthDonors,
      activeBloodBanks,
      hospitals,
      inventoryBatches,
      shortageRisks,
      insights,
    ] = await Promise.all([
      prisma.bloodRequest.count({ where: requestFilter }),
      prisma.bloodRequest.count({
        where: {
          ...requestFilter,
          urgency: { in: ["EMERGENCY", "CRITICAL"] },
          status: { in: ["PENDING", "ACKNOWLEDGED", "MATCHING", "PARTIALLY_FULFILLED"] },
        },
      }),
      prisma.youthDonorProfile.count({
        where: {
          ...donorFilter,
          verificationStatus: "VERIFIED",
        },
      }),
      prisma.youthDonorProfile.count({
        where: {
          ...donorFilter,
          verificationStatus: "VERIFIED",
          availabilityStatus: "AVAILABLE",
        },
      }),
      prisma.bloodBank.count({ where: bloodBankFilter }),
      prisma.hospital.count({ where: hospitalFilter }),
      prisma.bloodInventory.findMany({
        where: {
          bloodBank: bloodBankFilter,
          expiryDate: { gt: now },
        },
      }),
      prisma.shortageRisk.findMany({
        where: district && district !== "ALL" ? { state, district } : { state },
        orderBy: { riskScore: "desc" },
      }),
      prisma.aIInsight.findMany({
        where: district && district !== "ALL" ? { state, district } : { state },
        orderBy: { generatedAt: "desc" },
        take: 6,
      }),
    ]);

    const totalAvailableStock = inventoryBatches.reduce((acc, b) => acc + b.unitsAvailable, 0);
    const criticalShortagesCount = shortageRisks.filter((r) => r.riskLevel === "CRITICAL").length;
    const highShortagesCount = shortageRisks.filter((r) => r.riskLevel === "HIGH").length;

    // Aggregate district-level risk summary for heatmap/map visualization
    const districtRiskMap = new Map<string, {
      district: string;
      criticalCount: number;
      highCount: number;
      maxScore: number;
      availableStock: number;
    }>();

    for (const r of shortageRisks) {
      const existing = districtRiskMap.get(r.district) || {
        district: r.district,
        criticalCount: 0,
        highCount: 0,
        maxScore: 0,
        availableStock: 0,
      };

      if (r.riskLevel === "CRITICAL") existing.criticalCount++;
      if (r.riskLevel === "HIGH") existing.highCount++;
      if (r.riskScore > existing.maxScore) existing.maxScore = r.riskScore;
      districtRiskMap.set(r.district, existing);
    }

    return NextResponse.json({
      success: true,
      data: {
        state,
        district: district || "ALL",
        stats: {
          totalBloodRequests,
          activeEmergencyRequests,
          verifiedYouthDonors,
          availableYouthDonors,
          activeBloodBanks,
          hospitals,
          totalAvailableStock,
          criticalShortagesCount,
          highShortagesCount,
        },
        districtHeatmap: Array.from(districtRiskMap.values()),
        topShortages: shortageRisks.slice(0, 8),
        insights,
        lastCalculated: new Date(),
      },
    });
  } catch (error) {
    console.error("[Government Stats API Error]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
