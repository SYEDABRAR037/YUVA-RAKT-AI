import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { updateAmbulanceLocation } from "@/lib/services/ambulance.service";

/**
 * POST /api/ambulance/location
 * Authenticated endpoint for ambulance drivers to push live GPS updates.
 */
export async function POST(req: Request) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "AMBULANCE" && session.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, error: "Forbidden: Only authenticated ambulances can broadcast location" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { latitude, longitude, accuracy, speed, heading, source, missionId } = body;

    if (latitude === undefined || longitude === undefined) {
      return NextResponse.json({ success: false, error: "latitude and longitude are required" }, { status: 400 });
    }

    const updated = await updateAmbulanceLocation({
      ambulanceUserId: session.userId,
      latitude: Number(latitude),
      longitude: Number(longitude),
      accuracy: accuracy ? Number(accuracy) : undefined,
      speed: speed ? Number(speed) : undefined,
      heading: heading ? Number(heading) : undefined,
      source: source === "DEMO_SIMULATION" ? "DEMO_SIMULATION" : "REAL_GPS",
      missionId,
    });

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error: any) {
    console.error("[POST /api/ambulance/location Error]", error);
    return NextResponse.json({ success: false, error: error.message || "Internal server error" }, { status: 500 });
  }
}
