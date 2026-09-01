import prisma from "@/lib/db";
import { MissionStatus, AmbulanceStatus } from "@prisma/client";
import { logAuditEvent } from "./audit.service";

export interface DispatchMissionParams {
  bloodRequestId: string;
  sourceBloodBankId: string;
  destinationHospitalId: string;
  ambulanceId?: string;
  notes?: string;
  triggeredBy?: string;
}

export interface RespondMissionParams {
  missionId: string;
  ambulanceUserId: string;
  action: "ACCEPT" | "DECLINE";
  notes?: string;
}

export interface UpdateMissionStatusParams {
  missionId: string;
  userId: string;
  targetStatus: MissionStatus;
  notes?: string;
}

export interface UpdateLocationParams {
  ambulanceUserId: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
  source?: "REAL_GPS" | "DEMO_SIMULATION";
  missionId?: string;
}

/**
 * Valid state transitions for an AmbulanceMission.
 */
const VALID_TRANSITIONS: Record<MissionStatus, MissionStatus[]> = {
  ASSIGNED: ["ACCEPTED", "REJECTED", "CANCELLED"],
  ACCEPTED: ["EN_ROUTE_TO_BLOOD_BANK", "CANCELLED"],
  REJECTED: [],
  EN_ROUTE_TO_BLOOD_BANK: ["ARRIVED_AT_BLOOD_BANK", "CANCELLED"],
  ARRIVED_AT_BLOOD_BANK: ["BLOOD_COLLECTED", "CANCELLED"],
  BLOOD_COLLECTED: ["EN_ROUTE_TO_HOSPITAL", "CANCELLED"],
  EN_ROUTE_TO_HOSPITAL: ["ARRIVED_AT_HOSPITAL", "CANCELLED"],
  ARRIVED_AT_HOSPITAL: ["DELIVERED", "CANCELLED"],
  DELIVERED: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
};

/**
 * Calculates geographical distance in kilometers between two GPS points using Haversine formula.
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
}

/**
 * Dispatches an ambulance transport mission for an urgent or emergency blood requisition.
 */
export async function dispatchAmbulanceMission(params: DispatchMissionParams) {
  const { bloodRequestId, sourceBloodBankId, destinationHospitalId, notes, triggeredBy } = params;

  // 1. Verify blood request exists
  const request = await prisma.bloodRequest.findUnique({
    where: { id: bloodRequestId },
    include: { hospital: true },
  });

  if (!request) {
    throw new Error("Blood request not found");
  }

  // 2. Select ambulance
  let selectedAmbulanceId = params.ambulanceId;
  if (!selectedAmbulanceId) {
    const availableAmb = await prisma.ambulance.findFirst({
      where: {
        status: "AVAILABLE",
        district: { equals: request.hospital.district, mode: "insensitive" },
      },
    });

    if (!availableAmb) {
      // Fallback to any available ambulance in state
      const fallbackAmb = await prisma.ambulance.findFirst({
        where: { status: "AVAILABLE" },
      });
      if (!fallbackAmb) {
        throw new Error("No available ambulances found for emergency dispatch");
      }
      selectedAmbulanceId = fallbackAmb.id;
    } else {
      selectedAmbulanceId = availableAmb.id;
    }
  }

  // 3. Create AmbulanceMission record
  const mission = await prisma.ambulanceMission.create({
    data: {
      ambulanceId: selectedAmbulanceId,
      bloodRequestId,
      sourceBloodBankId,
      destinationHospitalId,
      status: "ASSIGNED",
      notes: notes || "Emergency blood transport mission dispatched",
      assignedAt: new Date(),
    },
    include: {
      ambulance: true,
      sourceBloodBank: true,
      destinationHospital: true,
    },
  });

  // 4. Update ambulance status
  await prisma.ambulance.update({
    where: { id: selectedAmbulanceId },
    data: { status: "BUSY" },
  });

  // 5. Send notification to ambulance driver
  const ambRecord = await prisma.ambulance.findUnique({
    where: { id: selectedAmbulanceId },
  });

  if (ambRecord) {
    await prisma.notification.create({
      data: {
        userId: ambRecord.userId,
        type: "AMBULANCE_DISPATCH",
        title: "🚨 Emergency Blood Transport Mission Dispatched",
        message: `New mission assigned: Collect ${request.bloodGroup} units from ${mission.sourceBloodBank.name} and deliver to ${mission.destinationHospital.name}.`,
        relatedEntityType: "AMBULANCE_MISSION",
        relatedEntityId: mission.id,
      },
    });
  }

  // 6. Log audit event
  await logAuditEvent({
    userId: triggeredBy || null,
    action: "AMBULANCE_MISSION_CREATED",
    entityType: "AMBULANCE_MISSION",
    entityId: mission.id,
    metadata: {
      ambulanceId: selectedAmbulanceId,
      bloodRequestId,
      sourceBloodBankId,
      destinationHospitalId,
    },
  });

  // 7. Log emergency response event
  await prisma.emergencyResponseEvent.create({
    data: {
      requestId: bloodRequestId,
      eventType: "AMBULANCE_DISPATCHED",
      description: `Ambulance ${mission.ambulance.displayName} (${mission.ambulance.vehicleNumber}) dispatched for emergency transport`,
      metadata: {
        missionId: mission.id,
        ambulanceId: selectedAmbulanceId,
        source: mission.sourceBloodBank.name,
        destination: mission.destinationHospital.name,
      },
    },
  });

  return mission;
}

/**
 * Handles Ambulance Driver response to a mission offer (ACCEPT or DECLINE).
 */
export async function respondToAmbulanceMission(params: RespondMissionParams) {
  const { missionId, ambulanceUserId, action, notes } = params;

  const mission = await prisma.ambulanceMission.findUnique({
    where: { id: missionId },
    include: { ambulance: true, bloodRequest: true },
  });

  if (!mission) {
    throw new Error("Ambulance mission not found");
  }

  if (mission.ambulance.userId !== ambulanceUserId) {
    throw new Error("Unauthorized: You are not assigned to this ambulance mission");
  }

  if (mission.status !== "ASSIGNED") {
    throw new Error(`Cannot ${action.toLowerCase()} mission with status '${mission.status}'`);
  }

  if (action === "ACCEPT") {
    const updated = await prisma.ambulanceMission.update({
      where: { id: missionId },
      data: {
        status: "ACCEPTED",
        acceptedAt: new Date(),
        notes: notes ? `${mission.notes || ""}\nAccepted: ${notes}` : mission.notes,
      },
      include: { ambulance: true, sourceBloodBank: true, destinationHospital: true },
    });

    await prisma.ambulance.update({
      where: { id: mission.ambulanceId },
      data: { status: "ON_MISSION", isTrackingActive: true },
    });

    await logAuditEvent({
      userId: ambulanceUserId,
      action: "AMBULANCE_MISSION_ACCEPTED",
      entityType: "AMBULANCE_MISSION",
      entityId: missionId,
      metadata: { missionId, action },
    });

    await prisma.emergencyResponseEvent.create({
      data: {
        requestId: mission.bloodRequestId,
        eventType: "AMBULANCE_ACCEPTED",
        description: `Ambulance operator accepted emergency transport mission ${mission.id}`,
        metadata: { missionId },
      },
    });

    return updated;
  } else {
    // DECLINE
    const updated = await prisma.ambulanceMission.update({
      where: { id: missionId },
      data: {
        status: "REJECTED",
        rejectedAt: new Date(),
        notes: notes ? `${mission.notes || ""}\nDeclined: ${notes}` : mission.notes,
      },
    });

    await prisma.ambulance.update({
      where: { id: mission.ambulanceId },
      data: { status: "AVAILABLE", isTrackingActive: false },
    });

    await logAuditEvent({
      userId: ambulanceUserId,
      action: "AMBULANCE_MISSION_DECLINED",
      entityType: "AMBULANCE_MISSION",
      entityId: missionId,
      metadata: { missionId, action, notes },
    });

    return updated;
  }
}

/**
 * Updates Ambulance Mission Status according to the state machine.
 */
export async function updateMissionStatus(params: UpdateMissionStatusParams) {
  const { missionId, userId, targetStatus, notes } = params;

  const mission = await prisma.ambulanceMission.findUnique({
    where: { id: missionId },
    include: {
      ambulance: true,
      bloodRequest: true,
      sourceBloodBank: true,
      destinationHospital: true,
    },
  });

  if (!mission) {
    throw new Error("Mission not found");
  }

  // Validate state machine transition
  const allowed = VALID_TRANSITIONS[mission.status] || [];
  if (!allowed.includes(targetStatus)) {
    throw new Error(
      `Invalid mission transition from '${mission.status}' to '${targetStatus}'. Allowed: ${allowed.join(", ") || "none"}`
    );
  }

  const updateData: any = {
    status: targetStatus,
  };

  if (notes) {
    updateData.notes = `${mission.notes || ""}\n[${targetStatus}]: ${notes}`.trim();
  }

  let auditAction = "AMBULANCE_LOCATION_UPDATED";

  if (targetStatus === "BLOOD_COLLECTED") {
    updateData.bloodCollectedAt = new Date();
    auditAction = "BLOOD_COLLECTED";
  } else if (targetStatus === "DELIVERED") {
    updateData.deliveredAt = new Date();
    auditAction = "BLOOD_DELIVERED";
  } else if (targetStatus === "COMPLETED") {
    updateData.completedAt = new Date();
    auditAction = "EMERGENCY_TRANSPORT_COMPLETED";
    // Release ambulance and stop tracking
    await prisma.ambulance.update({
      where: { id: mission.ambulanceId },
      data: { status: "AVAILABLE", isTrackingActive: false },
    });
  } else if (targetStatus === "CANCELLED") {
    updateData.cancelledAt = new Date();
    await prisma.ambulance.update({
      where: { id: mission.ambulanceId },
      data: { status: "AVAILABLE", isTrackingActive: false },
    });
  }

  const updatedMission = await prisma.ambulanceMission.update({
    where: { id: missionId },
    data: updateData,
    include: {
      ambulance: true,
      sourceBloodBank: true,
      destinationHospital: true,
    },
  });

  // Log audit
  await logAuditEvent({
    userId,
    action: auditAction as any,
    entityType: "AMBULANCE_MISSION",
    entityId: missionId,
    metadata: {
      fromStatus: mission.status,
      toStatus: targetStatus,
    },
  });

  // Log emergency event
  await prisma.emergencyResponseEvent.create({
    data: {
      requestId: mission.bloodRequestId,
      eventType: targetStatus,
      description: `Ambulance mission ${mission.id} transitioned to ${targetStatus}`,
      metadata: { missionId, targetStatus },
    },
  });

  return updatedMission;
}

/**
 * Toggles live GPS tracking status for an ambulance unit.
 */
export async function toggleGpsTracking(ambulanceUserId: string, isTracking: boolean) {
  const ambulance = await prisma.ambulance.findUnique({
    where: { userId: ambulanceUserId },
  });

  if (!ambulance) {
    throw new Error("Ambulance record not found for authenticated user");
  }

  const updated = await prisma.ambulance.update({
    where: { id: ambulance.id },
    data: { isTrackingActive: isTracking },
  });

  await logAuditEvent({
    userId: ambulanceUserId,
    action: isTracking ? "AMBULANCE_GPS_TRACKING_STARTED" : "AMBULANCE_GPS_TRACKING_STOPPED",
    entityType: "AMBULANCE",
    entityId: ambulance.id,
    metadata: { isTrackingActive: isTracking },
  });

  return updated;
}

/**
 * Updates Ambulance GPS Location (Authenticated).
 */
export async function updateAmbulanceLocation(params: UpdateLocationParams) {
  const { ambulanceUserId, latitude, longitude, accuracy, speed, heading, source = "REAL_GPS", missionId } = params;

  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    throw new Error("Invalid GPS coordinates provided");
  }

  const ambulance = await prisma.ambulance.findUnique({
    where: { userId: ambulanceUserId },
  });

  if (!ambulance) {
    throw new Error("Ambulance record not found for authenticated user");
  }

  const now = new Date();

  // 1. Update current location on Ambulance
  const updatedAmbulance = await prisma.ambulance.update({
    where: { id: ambulance.id },
    data: {
      currentLatitude: latitude,
      currentLongitude: longitude,
      accuracy: accuracy || null,
      speed: speed || null,
      heading: heading || null,
      locationSource: source,
      isTrackingActive: true,
      lastLocationUpdatedAt: now,
    },
  });

  // 2. Persist Location History
  await prisma.ambulanceLocationHistory.create({
    data: {
      ambulanceId: ambulance.id,
      missionId: missionId || null,
      latitude,
      longitude,
      accuracy: accuracy || null,
      source,
      recordedAt: now,
    },
  });

  return updatedAmbulance;
}

/**
 * Fetches dashboard details for an Ambulance Operator.
 */
export async function getAmbulanceDashboard(userId: string) {
  const ambulance = await prisma.ambulance.findUnique({
    where: { userId },
    include: {
      missions: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          bloodRequest: true,
          sourceBloodBank: true,
          destinationHospital: true,
        },
      },
    },
  });

  if (!ambulance) {
    throw new Error("Ambulance profile not found for this account");
  }

  const activeMission = ambulance.missions.find(
    (m) =>
      m.status !== "COMPLETED" &&
      m.status !== "CANCELLED" &&
      m.status !== "REJECTED"
  );

  let navigationData: any = null;
  if (activeMission) {
    navigationData = calculateMissionNavigation(ambulance, activeMission);
  }

  return {
    ambulance,
    activeMission,
    navigation: navigationData,
    recentMissions: ambulance.missions,
  };
}

/**
 * Calculates mission-aware navigation metrics (current stage, target destination, distance, ETA).
 */
export function calculateMissionNavigation(ambulance: any, mission: any) {
  const isHeadingToBloodBank =
    mission.status === "ASSIGNED" ||
    mission.status === "ACCEPTED" ||
    mission.status === "EN_ROUTE_TO_BLOOD_BANK";

  const isHeadingToHospital =
    mission.status === "ARRIVED_AT_BLOOD_BANK" ||
    mission.status === "BLOOD_COLLECTED" ||
    mission.status === "EN_ROUTE_TO_HOSPITAL" ||
    mission.status === "ARRIVED_AT_HOSPITAL";

  const isDelivered = mission.status === "DELIVERED" || mission.status === "COMPLETED";

  let targetLabel = "Blood Centre Pickup";
  let targetName = mission.sourceBloodBank?.name || "Blood Centre";
  let targetLat = mission.sourceBloodBank?.latitude || 18.5195;
  let targetLng = mission.sourceBloodBank?.longitude || 73.8652;

  if (isHeadingToHospital) {
    targetLabel = "Hospital Clinical Delivery";
    targetName = mission.destinationHospital?.name || "Hospital";
    targetLat = mission.destinationHospital?.latitude || 18.5284;
    targetLng = mission.destinationHospital?.longitude || 73.8739;
  }

  const distanceKm = calculateHaversineDistanceKm(
    ambulance.currentLatitude,
    ambulance.currentLongitude,
    targetLat,
    targetLng
  );

  // Speed estimation (default 35 km/h in urban emergency transit)
  const effectiveSpeedKmH = ambulance.speed && ambulance.speed > 5 ? ambulance.speed : 35;
  const etaMinutes = isDelivered ? 0 : Math.max(1, Math.round((distanceKm / effectiveSpeedKmH) * 60));

  const secondsSinceLastUpdate = Math.round(
    (Date.now() - new Date(ambulance.lastLocationUpdatedAt).getTime()) / 1000
  );

  return {
    stage: isHeadingToBloodBank ? "PICKUP_STAGE" : isHeadingToHospital ? "DELIVERY_STAGE" : "COMPLETED_STAGE",
    targetLabel,
    targetName,
    targetCoordinates: { latitude: targetLat, longitude: targetLng },
    currentCoordinates: { latitude: ambulance.currentLatitude, longitude: ambulance.currentLongitude },
    distanceKm,
    etaMinutes,
    effectiveSpeedKmH,
    secondsSinceLastUpdate,
    isFreshGps: secondsSinceLastUpdate <= 45,
    locationSource: ambulance.locationSource || "REAL_GPS",
    accuracyMetres: ambulance.accuracy || 10,
  };
}

/**
 * Fetches live location history & status for an active mission with full navigation telemetry.
 */
export async function getMissionLiveTracking(missionId: string) {
  const mission = await prisma.ambulanceMission.findUnique({
    where: { id: missionId },
    include: {
      ambulance: true,
      sourceBloodBank: true,
      destinationHospital: true,
      locationHistory: {
        orderBy: { recordedAt: "desc" },
        take: 30,
      },
    },
  });

  if (!mission) {
    throw new Error("Mission not found");
  }

  const navigation = calculateMissionNavigation(mission.ambulance, mission);

  return {
    mission,
    navigation,
  };
}
