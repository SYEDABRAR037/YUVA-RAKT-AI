import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { getMissionLiveTracking } from "@/lib/services/ambulance.service";

/**
 * GET /api/ambulance/missions/[id]/live
 * Returns sanitized, RBAC-validated live tracking telemetry for Zomato/Uber style tracker.
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
    const trackingData = await getMissionLiveTracking(id);
    const mission = trackingData.mission;

    // Strict Stakeholder Ownership Verification
    if (session.role === "HOSPITAL") {
      if (mission.destinationHospital.userId !== session.userId) {
        return NextResponse.json(
          { success: false, error: "Forbidden: You cannot track ambulance missions for other hospitals" },
          { status: 403 }
        );
      }
    } else if (session.role === "BLOOD_BANK") {
      if (mission.sourceBloodBank.userId !== session.userId) {
        return NextResponse.json(
          { success: false, error: "Forbidden: You cannot track ambulance missions for other blood centres" },
          { status: 403 }
        );
      }
    } else if (session.role === "AMBULANCE") {
      if (mission.ambulance.userId !== session.userId) {
        return NextResponse.json(
          { success: false, error: "Forbidden: You cannot track other ambulance fleet units" },
          { status: 403 }
        );
      }
    }

    // Return sanitized live tracking response (Zero passwords/hashes/unrelated PII)
    return NextResponse.json({
      success: true,
      data: {
        missionId: mission.id,
        status: mission.status,
        missionStatus: mission.status,
        ambulance: {
          id: mission.ambulance.id,
          name: mission.ambulance.displayName,
          vehicleNumber: mission.ambulance.vehicleNumber,
          latitude: mission.ambulance.currentLatitude,
          longitude: mission.ambulance.currentLongitude,
          accuracy: mission.ambulance.accuracy || 8,
          speed: mission.ambulance.speed || 35,
          heading: mission.ambulance.heading || 0,
          isTrackingActive: mission.ambulance.isTrackingActive,
          locationSource: mission.ambulance.locationSource || "REAL_GPS",
          lastUpdated: mission.ambulance.lastLocationUpdatedAt,
        },
        bloodBank: {
          id: mission.sourceBloodBank.id,
          name: mission.sourceBloodBank.name,
          latitude: mission.sourceBloodBank.latitude || 18.5195,
          longitude: mission.sourceBloodBank.longitude || 73.8652,
          address: mission.sourceBloodBank.address,
          phone: mission.sourceBloodBank.phone,
        },
        hospital: {
          id: mission.destinationHospital.id,
          name: mission.destinationHospital.name,
          latitude: mission.destinationHospital.latitude || 18.5284,
          longitude: mission.destinationHospital.longitude || 73.8739,
          address: mission.destinationHospital.address,
          phone: mission.destinationHospital.phone,
        },
        navigation: {
          stage: trackingData.navigation.stage,
          targetLabel: trackingData.navigation.targetLabel,
          targetName: trackingData.navigation.targetName,
          distanceRemainingKm: trackingData.navigation.distanceKm,
          estimatedArrivalMinutes: trackingData.navigation.etaMinutes,
          isFreshGps: trackingData.navigation.isFreshGps,
          secondsSinceLastUpdate: trackingData.navigation.secondsSinceLastUpdate,
        },
        timeline: {
          assignedAt: mission.assignedAt,
          acceptedAt: mission.acceptedAt,
          bloodCollectedAt: mission.bloodCollectedAt,
          deliveredAt: mission.deliveredAt,
          completedAt: mission.completedAt,
        },
        breadcrumbs: mission.locationHistory.map((h) => ({
          latitude: h.latitude,
          longitude: h.longitude,
          recordedAt: h.recordedAt,
          source: h.source,
        })),
      },
    });
  } catch (error: any) {
    console.error("[GET /api/ambulance/missions/[id]/live Error]", error);
    return NextResponse.json({ success: false, error: error.message || "Mission not found" }, { status: 404 });
  }
}
