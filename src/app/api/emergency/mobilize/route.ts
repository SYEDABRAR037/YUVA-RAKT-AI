import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { triageAndMobilizeEmergency } from "@/lib/services/emergency.service";

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (session.role === "YOUTH_DONOR") {
      return NextResponse.json({ success: false, error: "Access forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { requestId } = body;

    if (!requestId) {
      return NextResponse.json({ success: false, error: "Missing requestId" }, { status: 400 });
    }

    const result = await triageAndMobilizeEmergency(requestId, session.userId);

    return NextResponse.json({
      success: true,
      data: result,
      message: `Emergency response triggered: Alerted ${result.banksAlerted} blood banks & mobilized ${result.donorsMobilized} verified donors.`,
    });
  } catch (error: any) {
    console.error("[Emergency Mobilize API Error]", error);
    return NextResponse.json({ success: false, error: error.message || "Internal server error" }, { status: 500 });
  }
}
