import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentSession } from "@/lib/auth/session";
import { BloodGroup, BloodComponentType, ShortageRiskLevel } from "@prisma/client";
import { calculateShortageRisk } from "@/ai/shortage/risk-engine";

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
    const district = searchParams.get("district") || "Pune";
    const bloodGroup = searchParams.get("bloodGroup") as BloodGroup | null;
    const componentType = searchParams.get("componentType") as BloodComponentType | null;
    const riskLevel = searchParams.get("riskLevel") as ShortageRiskLevel | null;

    const whereClause: any = {
      state,
      district,
    };

    if (bloodGroup) whereClause.bloodGroup = bloodGroup;
    if (componentType) whereClause.componentType = componentType;
    if (riskLevel) whereClause.riskLevel = riskLevel;

    let risks = await prisma.shortageRisk.findMany({
      where: whereClause,
      orderBy: [{ riskScore: "desc" }, { bloodGroup: "asc" }],
    });

    if (risks.length === 0 && bloodGroup && componentType) {
      const generated = await calculateShortageRisk({
        state,
        district,
        bloodGroup,
        componentType,
      });

      const saved = await prisma.shortageRisk.upsert({
        where: {
          state_district_bloodGroup_componentType: {
            state,
            district,
            bloodGroup,
            componentType,
          },
        },
        update: generated,
        create: generated,
      });

      risks = [saved];
    }

    // Summary counts
    const criticalCount = risks.filter((r) => r.riskLevel === "CRITICAL").length;
    const highCount = risks.filter((r) => r.riskLevel === "HIGH").length;

    return NextResponse.json({
      success: true,
      data: {
        state,
        district,
        risks,
        summary: {
          total: risks.length,
          criticalCount,
          highCount,
        },
      },
    });
  } catch (error) {
    console.error("[AI Shortage Risk API Error]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
