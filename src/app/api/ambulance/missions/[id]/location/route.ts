import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { getMissionLiveTracking } from "@/lib/services/ambulance.service";

/**
 * GET /api/ambulance/missions/[id]/location
 * Returns mission tracking history, destination coordinates, and live GPS crumbs.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Role check: Authorized stakeholders
    if (
      session.role !== "GOVERNMENT_OFFICIAL" &&
      session.role !== "SUPER_ADMIN" &&
      session.role !== "AMBULANCE" &&
      session.role !== "HOSPITAL" &&
      session.role !== "BLOOD_BANK"
    ) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const missionTracking = await getMissionLiveTracking(id);

    // Strict Stakeholder Ownership Check
    if (session.role === "HOSPITAL") {
      if (missionTracking.mission.destinationHospital.userId !== session.userId) {
        return NextResponse.json({ success: false, error: "Forbidden: You cannot track ambulances for other hospitals" }, { status: 403 });
      }
    } else if (session.role === "BLOOD_BANK") {
      if (missionTracking.mission.sourceBloodBank.userId !== session.userId) {
        return NextResponse.json({ success: false, error: "Forbidden: You cannot track ambulances for other blood centres" }, { status: 403 });
      }
    } else if (session.role === "AMBULANCE") {
      if (missionTracking.mission.ambulance.userId !== session.userId) {
        return NextResponse.json({ success: false, error: "Forbidden: You cannot track other ambulance units" }, { status: 403 });
      }
    }

    return NextResponse.json({
      success: true,
      data: missionTracking,
    });
  } catch (error: any) {
    console.error("[GET /api/ambulance/missions/[id]/location Error]", error);
    return NextResponse.json({ success: false, error: error.message || "Internal server error" }, { status: 500 });
  }
}
