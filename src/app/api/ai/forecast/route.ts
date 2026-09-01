import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentSession } from "@/lib/auth/session";
import { BloodGroup, BloodComponentType } from "@prisma/client";
import { generateDemandForecast } from "@/ai/forecasting/engine";

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Role verification (Government, Super Admin, Blood Bank, Hospital)
    if (session.role === "YOUTH_DONOR") {
      return NextResponse.json({ success: false, error: "Access forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const state = searchParams.get("state") || "Maharashtra";
    const district = searchParams.get("district") || "Pune";
    const bloodGroup = searchParams.get("bloodGroup") as BloodGroup | null;
    const componentType = searchParams.get("componentType") as BloodComponentType | null;
    const periodDays = searchParams.get("periodDays") ? parseInt(searchParams.get("periodDays")!, 10) : 7;

    const whereClause: any = {
      state,
      district,
      periodDays,
    };

    if (bloodGroup) whereClause.bloodGroup = bloodGroup;
    if (componentType) whereClause.componentType = componentType;

    let forecasts = await prisma.demandForecast.findMany({
      where: whereClause,
      orderBy: [{ bloodGroup: "asc" }, { componentType: "asc" }],
    });

    // If cache is empty, dynamically generate
    if (forecasts.length === 0 && bloodGroup && componentType) {
      const generated = await generateDemandForecast({
        state,
        district,
        bloodGroup,
        componentType,
        periodDays,
      });

      const saved = await prisma.demandForecast.upsert({
        where: {
          state_district_bloodGroup_componentType_periodDays: {
            state,
            district,
            bloodGroup,
            componentType,
            periodDays,
          },
        },
        update: generated,
        create: generated,
      });

      forecasts = [saved];
    }

    return NextResponse.json({
      success: true,
      data: {
        state,
        district,
        periodDays,
        forecasts,
        count: forecasts.length,
      },
    });
  } catch (error) {
    console.error("[AI Forecast API Error]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
