import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { respondToAmbulanceMission } from "@/lib/services/ambulance.service";

/**
 * POST /api/ambulance/missions/[id]/respond
 * Allows assigned ambulance driver to ACCEPT or DECLINE an emergency mission.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "AMBULANCE" && session.role !== "SUPER_ADMIN") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { action, notes } = body;

    if (action !== "ACCEPT" && action !== "DECLINE") {
      return NextResponse.json({ success: false, error: "Action must be ACCEPT or DECLINE" }, { status: 400 });
    }

    const updated = await respondToAmbulanceMission({
      missionId: id,
      ambulanceUserId: session.userId,
      action,
      notes,
    });

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error: any) {
    console.error("[POST /api/ambulance/missions/[id]/respond Error]", error);
    return NextResponse.json({ success: false, error: error.message || "Internal server error" }, { status: 500 });
  }
}
