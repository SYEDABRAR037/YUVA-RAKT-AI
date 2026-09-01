import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentSession } from "@/lib/auth/session";
import { calculateResponseMetrics } from "@/lib/services/emergency.service";

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (session.role === "YOUTH_DONOR") {
      return NextResponse.json({ success: false, error: "Access forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const state = searchParams.get("state") || "Maharashtra";
    const district = searchParams.get("district");

    const whereClause: any = {
      urgency: { in: ["EMERGENCY", "CRITICAL", "URGENT"] },
      hospital: { state },
    };

    if (district && district !== "ALL") {
      whereClause.hospital.district = district;
    }

    const [activeEmergencies, escalations, metrics] = await Promise.all([
      prisma.bloodRequest.findMany({
        where: whereClause,
        include: {
          hospital: { select: { name: true, district: true, state: true, phone: true } },
          allocations: { select: { unitsAllocated: true, allocatedAt: true } },
          donorResponses: { select: { id: true, status: true, createdAt: true } },
          escalations: { orderBy: { createdAt: "desc" } },
        },
        orderBy: [{ urgency: "desc" }, { createdAt: "desc" }],
      }),
      prisma.emergencyEscalation.findMany({
        where: {
          status: "ACTIVE",
          request: { hospital: { state } },
        },
        include: {
          request: {
            include: { hospital: { select: { name: true, district: true } } },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      calculateResponseMetrics(state, district || undefined),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        state,
        district: district || "ALL",
        emergencies: activeEmergencies,
        escalations,
        metrics,
        summary: {
          totalActive: activeEmergencies.length,
          criticalUnresolved: activeEmergencies.filter(
            (r) => r.status !== "FULFILLED" && r.status !== "CANCELLED" && (r.urgency === "EMERGENCY" || r.urgency === "CRITICAL")
          ).length,
          activeEscalations: escalations.length,
        },
      },
    });
  } catch (error) {
    console.error("[Emergency Radar API Error]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
