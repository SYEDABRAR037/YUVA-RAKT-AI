import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { toggleGpsTracking } from "@/lib/services/ambulance.service";

/**
 * POST /api/ambulance/tracking/toggle
 * Starts or stops live GPS tracking session for the authenticated ambulance.
 */
export async function POST(req: Request) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "AMBULANCE" && session.role !== "SUPER_ADMIN") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { isTracking } = body;

    const updated = await toggleGpsTracking(session.userId, !!isTracking);

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error: any) {
    console.error("[POST /api/ambulance/tracking/toggle Error]", error);
    return NextResponse.json({ success: false, error: error.message || "Internal server error" }, { status: 500 });
  }
}
