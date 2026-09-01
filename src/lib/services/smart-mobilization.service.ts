import prisma from "@/lib/db";
import { ResponseMode } from "@prisma/client";
import { discoverEmergencyResources } from "./resource-discovery.service";
import { dispatchAmbulanceMission } from "./ambulance.service";
import { logAuditEvent } from "./audit.service";

export interface AutonomousResponseInput {
  requestId?: string;
  bloodGroup?: any;
  componentType?: any;
  unitsRequired?: number;
  district?: string;
  state?: string;
  responseMode?: ResponseMode;
  triggeredBy?: string;
}

/**
 * Autonomous Shortage-to-Response Engine.
 * Coordinates resource discovery, staged donor mobilization, blood bank alerts, and ambulance dispatch.
 */
export async function executeAutonomousEmergencyResponse(input: AutonomousResponseInput) {
  const { requestId, responseMode = "IMMEDIATE_EMERGENCY", triggeredBy } = input;

  let bloodReq: any = null;
  let targetBloodGroup = input.bloodGroup;
  let targetComponent = input.componentType || "WHOLE_BLOOD";
  let targetUnits = input.unitsRequired || 2;
  let targetDistrict = input.district || "Pune";
  let targetState = input.state || "Maharashtra";

  if (requestId) {
    bloodReq = await prisma.bloodRequest.findUnique({
      where: { id: requestId },
      include: { hospital: true },
    });

    if (!bloodReq) {
      throw new Error(`Blood request ${requestId} not found`);
    }

    targetBloodGroup = bloodReq.bloodGroup;
    targetComponent = bloodReq.componentType;
    targetUnits = bloodReq.unitsRequired;
    targetDistrict = bloodReq.hospital.district;
    targetState = bloodReq.hospital.state;
  }

  // 1. Log Response Activation Event
  if (bloodReq) {
    await prisma.emergencyResponseEvent.create({
      data: {
        requestId: bloodReq.id,
        eventType: "SHORTAGE_RESPONSE_ACTIVATED",
        description: `Autonomous ${responseMode} response activated for ${targetBloodGroup} ${targetComponent} in ${targetDistrict}`,
        metadata: { responseMode, unitsRequired: targetUnits },
      },
    });
  }

  const isCuid = triggeredBy && (triggeredBy.startsWith("c") || triggeredBy.length >= 20);
  await logAuditEvent({
    userId: isCuid ? triggeredBy : null,
    action: "SHORTAGE_RESPONSE_ACTIVATED",
    entityType: "EMERGENCY_RESPONSE",
    entityId: bloodReq?.id || null,
    metadata: {
      responseMode,
      bloodGroup: targetBloodGroup,
      district: targetDistrict,
      triggeredBy: triggeredBy || "SYSTEM_AUTONOMOUS",
    },
  });

  // 2. Resource Discovery
  const discovery = await discoverEmergencyResources({
    bloodGroup: targetBloodGroup,
    componentType: targetComponent,
    unitsRequired: targetUnits,
    district: targetDistrict,
    state: targetState,
    urgency: bloodReq?.urgency || "EMERGENCY",
    responseMode,
  });

  // 3. Staged Mobilization (Round 1)
  // Alert Top Blood Banks
  let alertedBanksCount = 0;
  for (const bb of discovery.bloodBanks.slice(0, 3)) {
    const bbRecord = await prisma.bloodBank.findUnique({ where: { id: bb.bloodBankId } });
    if (bbRecord) {
      await prisma.notification.create({
        data: {
          userId: bbRecord.userId,
          type: "BLOOD_REQUEST",
          title: "🚨 Autonomous Emergency Requisition Alert",
          message: `Autonomous emergency triage matched your centre for ${targetBloodGroup} ${targetComponent} (${targetUnits} units requested).`,
          relatedEntityType: "BLOOD_REQUEST",
          relatedEntityId: bloodReq?.id || null,
        },
      });
      alertedBanksCount++;
    }
  }

  // Alert Top Candidate Donors (Round 1: Top 5)
  let notifiedDonorsCount = 0;
  const topDonors = discovery.donors.slice(0, 5);
  for (const d of topDonors) {
    const donorProfile = await prisma.youthDonorProfile.findUnique({
      where: { id: d.donorId },
      include: { user: true },
    });

    if (donorProfile) {
      // Cooldown check (within 2 hours)
      const recentNotif = await prisma.notification.findFirst({
        where: {
          userId: donorProfile.userId,
          relatedEntityId: bloodReq?.id || null,
          createdAt: { gt: new Date(Date.now() - 2 * 60 * 60 * 1000) },
        },
      });

      if (!recentNotif) {
        await prisma.notification.create({
          data: {
            userId: donorProfile.userId,
            type: "DONOR_MATCH",
            title: "🩸 Urgent Voluntary Blood Opportunity (District Match)",
            message: `A hospital in ${targetDistrict} has an urgent requirement for ${targetBloodGroup.replace("_", "")} blood. Your voluntary response can save lives.`,
            relatedEntityType: "BLOOD_REQUEST",
            relatedEntityId: bloodReq?.id || null,
          },
        });
        notifiedDonorsCount++;
      }
    }
  }

  await logAuditEvent({
    userId: isCuid ? triggeredBy : null,
    action: "DONOR_ALERT_BATCH_SENT",
    entityType: "EMERGENCY_RESPONSE",
    entityId: bloodReq?.id || null,
    metadata: {
      round: 1,
      donorsNotified: notifiedDonorsCount,
      banksAlerted: alertedBanksCount,
    },
  });

  // 4. Ambulance Transport Mission Dispatch (If Immediate Emergency & source blood bank available)
  let dispatchedMission: any = null;
  if (
    responseMode === "IMMEDIATE_EMERGENCY" &&
    bloodReq &&
    discovery.bloodBanks.length > 0 &&
    discovery.ambulances.length > 0
  ) {
    const primaryBloodBankId = discovery.bloodBanks[0].bloodBankId;
    const availableAmbulance = discovery.ambulances.find((a) => a.status === "AVAILABLE");

    if (availableAmbulance) {
      dispatchedMission = await dispatchAmbulanceMission({
        bloodRequestId: bloodReq.id,
        sourceBloodBankId: primaryBloodBankId,
        destinationHospitalId: bloodReq.hospitalId,
        ambulanceId: availableAmbulance.ambulanceId,
        notes: `Autonomous dispatch: transport ${targetUnits} units of ${targetBloodGroup} to ${bloodReq.hospital.name}`,
        triggeredBy,
      });
    }
  }

  return {
    success: true,
    responseMode,
    district: targetDistrict,
    bloodGroup: targetBloodGroup,
    discovery,
    mobilization: {
      alertedBanksCount,
      notifiedDonorsCount,
      round: 1,
    },
    dispatchedMission,
  };
}

/**
 * Expands response search radius (Round 2) when local responses are insufficient.
 */
export async function expandResponseRadius(requestId: string, triggeredBy?: string) {
  const request = await prisma.bloodRequest.findUnique({
    where: { id: requestId },
    include: { hospital: true },
  });

  if (!request) {
    throw new Error("Request not found");
  }

  // Find all state-wide compatible donors who haven't been notified yet
  const compatibleDonors = await prisma.youthDonorProfile.findMany({
    where: {
      bloodGroup: request.bloodGroup,
      availabilityStatus: "AVAILABLE",
      emergencyNotificationConsent: true,
      user: {
        accountStatus: "ACTIVE",
        state: request.hospital.state,
      },
    },
    include: { user: true },
    take: 15,
  });

  let newNotifiedCount = 0;
  for (const d of compatibleDonors) {
    const existing = await prisma.notification.findFirst({
      where: {
        userId: d.userId,
        relatedEntityId: request.id,
      },
    });

    if (!existing) {
      await prisma.notification.create({
        data: {
          userId: d.userId,
          type: "DONOR_MATCH",
          title: "🚨 Expanded Regional Blood Alert",
          message: `Regional emergency mobilization expanded to your zone for ${request.bloodGroup.replace("_", "")} blood requirement in ${request.hospital.district}.`,
          relatedEntityType: "BLOOD_REQUEST",
          relatedEntityId: request.id,
        },
      });
      newNotifiedCount++;
    }
  }

  const isCuid = triggeredBy && (triggeredBy.startsWith("c") || triggeredBy.length >= 20);
  await logAuditEvent({
    userId: isCuid ? triggeredBy : null,
    action: "RESPONSE_RADIUS_EXPANDED",
    entityType: "EMERGENCY_RESPONSE",
    entityId: request.id,
    metadata: {
      expandedToState: request.hospital.state,
      additionalDonorsAlerted: newNotifiedCount,
    },
  });

  await prisma.emergencyResponseEvent.create({
    data: {
      requestId: request.id,
      eventType: "RESPONSE_RADIUS_EXPANDED",
      description: `Autonomous mobilization radius expanded across ${request.hospital.state}. ${newNotifiedCount} additional regional donors notified.`,
      metadata: { additionalDonors: newNotifiedCount },
    },
  });

  return {
    success: true,
    requestId: request.id,
    additionalDonorsAlerted: newNotifiedCount,
  };
}
