import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { executeAutonomousEmergencyResponse } from "@/lib/services/smart-mobilization.service";

/**
 * POST /api/emergency/autonomous-response
 * Triggers autonomous resource discovery, staged donor mobilization, and ambulance dispatch.
 */
export async function POST(req: Request) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Role check: Only Government, Admin, Hospital, or Blood Bank
    if (
      session.role !== "GOVERNMENT_OFFICIAL" &&
      session.role !== "SUPER_ADMIN" &&
      session.role !== "HOSPITAL" &&
      session.role !== "BLOOD_BANK"
    ) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Unauthorized to trigger autonomous emergency response" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { requestId, bloodGroup, componentType, unitsRequired, district, state, responseMode } = body;

    const result = await executeAutonomousEmergencyResponse({
      requestId,
      bloodGroup,
      componentType,
      unitsRequired,
      district,
      state,
      responseMode,
      triggeredBy: session.userId,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error("[POST /api/emergency/autonomous-response Error]", error);
    return NextResponse.json({ success: false, error: error.message || "Internal server error" }, { status: 500 });
  }
}
