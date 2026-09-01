import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { escalateEmergency } from "@/lib/services/emergency.service";
import { EscalationLevel } from "@prisma/client";

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
    const { requestId, escalationLevel, reason } = body;

    if (!requestId || !escalationLevel || !reason) {
      return NextResponse.json({ success: false, error: "Missing required fields (requestId, escalationLevel, reason)" }, { status: 400 });
    }

    const validLevels: EscalationLevel[] = ["LEVEL_1_WARNING", "LEVEL_2_EXPANDED_OUTREACH", "LEVEL_3_STATE_CRITICAL"];
    if (!validLevels.includes(escalationLevel)) {
      return NextResponse.json({ success: false, error: "Invalid escalationLevel" }, { status: 400 });
    }

    const escalation = await escalateEmergency({
      requestId,
      escalationLevel,
      reason,
      triggeredBy: session.userId,
    });

    return NextResponse.json({
      success: true,
      data: { escalation },
      message: `Emergency requisition escalated to ${escalationLevel}`,
    });
  } catch (error: any) {
    console.error("[Emergency Escalate API Error]", error);
    return NextResponse.json({ success: false, error: error.message || "Internal server error" }, { status: 500 });
  }
}
