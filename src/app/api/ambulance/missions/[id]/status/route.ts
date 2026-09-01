import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { updateMissionStatus } from "@/lib/services/ambulance.service";

/**
 * PATCH /api/ambulance/missions/[id]/status
 * Transitions mission status through valid operational states.
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "AMBULANCE" && session.role !== "SUPER_ADMIN" && session.role !== "GOVERNMENT_OFFICIAL") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { targetStatus, notes } = body;

    if (!targetStatus) {
      return NextResponse.json({ success: false, error: "targetStatus is required" }, { status: 400 });
    }

    const updated = await updateMissionStatus({
      missionId: id,
      userId: session.userId,
      targetStatus,
      notes,
    });

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error: any) {
    console.error("[PATCH /api/ambulance/missions/[id]/status Error]", error);
    return NextResponse.json({ success: false, error: error.message || "Internal server error" }, { status: 500 });
  }
}
