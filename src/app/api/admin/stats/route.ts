import { NextResponse } from "next/server";
import { getSessionFromCookie } from "@/lib/auth/session";
import prisma from "@/lib/db";

export async function GET() {
  try {
    const session = await getSessionFromCookie();
    if (!session || session.role !== "SUPER_ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const now = new Date();

    const [
      totalUsers,
      youthDonors,
      hospitals,
      bloodBanks,
      activeUsers,
      pendingHospitals,
      pendingBloodBanks,
      verifiedDonors,
      totalBloodRequests,
      fulfilledBloodRequests,
      urgentRequests,
      totalDonations,
      inventoryBatches,
      recentAuditLogs,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "YOUTH_DONOR" } }),
      prisma.user.count({ where: { role: "HOSPITAL" } }),
      prisma.user.count({ where: { role: "BLOOD_BANK" } }),
      prisma.user.count({ where: { accountStatus: "ACTIVE" } }),
      prisma.hospital.count({ where: { verificationStatus: "PENDING" } }),
      prisma.bloodBank.count({ where: { verificationStatus: "PENDING" } }),
      prisma.youthDonorProfile.count({ where: { verificationStatus: "VERIFIED" } }),
      prisma.bloodRequest.count(),
      prisma.bloodRequest.count({ where: { status: "FULFILLED" } }),
      prisma.bloodRequest.count({ where: { urgency: { in: ["CRITICAL", "EMERGENCY", "URGENT"] }, status: { notIn: ["FULFILLED", "CANCELLED"] } } }),
      prisma.donation.count({ where: { status: "COMPLETED" } }),
      prisma.bloodInventory.findMany({
        where: { expiryDate: { gt: now } },
        select: { unitsAvailable: true },
      }),
      prisma.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          user: {
            select: {
              fullName: true,
              email: true,
              role: true,
            },
          },
        },
      }),
    ]);

    const totalInventoryUnits = inventoryBatches.reduce((acc, curr) => acc + curr.unitsAvailable, 0);
    const pendingVerifications = pendingHospitals + pendingBloodBanks;

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers,
        youthDonors,
        hospitals,
        bloodBanks,
        activeUsers,
        pendingVerifications,
        verifiedDonors,
        totalBloodRequests,
        fulfilledBloodRequests,
        urgentRequests,
        totalDonations,
        totalInventoryUnits,
      },
      recentAuditLogs,
    });
  } catch (error: any) {
    console.error("GET /api/admin/stats error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch platform stats" }, { status: 500 });
  }
}
