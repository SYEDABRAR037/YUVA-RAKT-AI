import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { getAmbulanceDashboard } from "@/lib/services/ambulance.service";

/**
 * GET /api/ambulance/dashboard
 * Retrieves the authenticated ambulance driver's active mission, recent history, and status.
 */
export async function GET() {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "AMBULANCE" && session.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, error: "Forbidden: Access restricted to ambulance operators" },
        { status: 403 }
      );
    }

    const data = await getAmbulanceDashboard(session.userId);

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error("[GET /api/ambulance/dashboard Error]", error);
    return NextResponse.json({ success: false, error: error.message || "Internal server error" }, { status: 500 });
  }
}
