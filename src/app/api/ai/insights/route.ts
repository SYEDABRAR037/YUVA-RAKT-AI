import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentSession } from "@/lib/auth/session";

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
    const state = searchParams.get("state");
    const district = searchParams.get("district");

    const whereClause: any = {};
    if (state) whereClause.state = state;
    if (district) whereClause.district = district;

    const insights = await prisma.aIInsight.findMany({
      where: whereClause,
      orderBy: [{ severity: "desc" }, { generatedAt: "desc" }],
      take: 20,
    });

    return NextResponse.json({
      success: true,
      data: {
        insights,
        total: insights.length,
      },
    });
  } catch (error) {
    console.error("[AI Insights API Error]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
