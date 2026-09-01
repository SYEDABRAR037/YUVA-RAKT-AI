import prisma from "@/lib/db";
import { BloodGroup, BloodComponentType, RequestUrgency, RequestStatus } from "@prisma/client";
import { createNotification } from "./notification.service";
import { logAuditEvent } from "./audit.service";

export async function createBloodRequest(params: {
  hospitalId: string;
  userId: string;
  bloodGroup: BloodGroup;
  componentType: BloodComponentType;
  unitsRequired: number;
  urgency: RequestUrgency;
  requiredBy: Date;
  reason?: string;
  patientAgeGroup?: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  const hospital = await prisma.hospital.findUnique({
    where: { id: params.hospitalId },
    include: { user: true },
  });

  if (!hospital) {
    throw new Error("Hospital facility not found");
  }

  // 1. Create Blood Request
  const bloodRequest = await prisma.bloodRequest.create({
    data: {
      hospitalId: params.hospitalId,
      bloodGroup: params.bloodGroup,
      componentType: params.componentType,
      unitsRequired: params.unitsRequired,
      urgency: params.urgency,
      requiredBy: params.requiredBy,
      reason: params.reason,
      patientAgeGroup: params.patientAgeGroup,
      status: "PENDING",
      createdBy: params.userId,
    },
    include: {
      hospital: true,
    },
  });

  // 2. Audit Log
  await logAuditEvent({
    userId: params.userId,
    action: "BLOOD_REQUEST_CREATED",
    entityType: "BLOOD_REQUEST",
    entityId: bloodRequest.id,
    metadata: {
      bloodGroup: params.bloodGroup,
      componentType: params.componentType,
      unitsRequired: params.unitsRequired,
      urgency: params.urgency,
      hospitalName: hospital.name,
      district: hospital.district,
    },
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
  });

  // 3. Find matching youth donors in the district (deterministic match filter)
  // Matching criteria: same blood group, AVAILABLE status, user in same district/state, emergencyNotificationConsent = true
  const matchingDonors = await prisma.youthDonorProfile.findMany({
    where: {
      bloodGroup: params.bloodGroup,
      availabilityStatus: "AVAILABLE",
      emergencyNotificationConsent: true,
      user: {
        district: hospital.district,
        state: hospital.state,
        accountStatus: "ACTIVE",
      },
    },
    include: {
      user: true,
    },
    take: 50,
  });

  // 4. Dispatch in-app notifications to candidate donors
  const bloodGroupLabel = params.bloodGroup.replace("_POSITIVE", "+").replace("_NEGATIVE", "-");
  for (const donor of matchingDonors) {
    await createNotification({
      userId: donor.userId,
      type: "BLOOD_REQUEST",
      title: `🩸 Urgent Blood Requirement: ${bloodGroupLabel} in ${hospital.district}`,
      message: `An urgent ${params.urgency} requirement for ${bloodGroupLabel} (${params.componentType}) was raised in ${hospital.district}. Review details if you are available to assist.`,
      relatedEntityType: "BLOOD_REQUEST",
      relatedEntityId: bloodRequest.id,
    });
  }

  return {
    bloodRequest,
    matchingDonorsCount: matchingDonors.length,
  };
}

export async function getHospitalBloodRequests(hospitalId: string) {
  return prisma.bloodRequest.findMany({
    where: { hospitalId },
    include: {
      allocations: {
        include: {
          bloodBank: true,
        },
      },
      ambulanceMissions: {
        include: {
          ambulance: true,
        },
      },
      _count: {
        select: {
          donorResponses: true,
        },
      },
    },
    orderBy: [
      { status: "asc" },
      { requiredBy: "asc" },
      { createdAt: "desc" },
    ],
  });
}

export async function getRegionalRequestsForBloodBank(params: {
  district?: string;
  state?: string;
  status?: RequestStatus;
}) {
  const where: any = {};
  if (params.status) {
    where.status = params.status;
  }

  // If district provided, find requests from hospitals in this district or state
  if (params.district || params.state) {
    where.hospital = {};
    if (params.district) where.hospital.district = params.district;
    if (params.state) where.hospital.state = params.state;
  }

  return prisma.bloodRequest.findMany({
    where,
    include: {
      hospital: true,
      allocations: true,
      _count: {
        select: {
          donorResponses: true,
        },
      },
    },
    orderBy: [
      { urgency: "desc" }, // EMERGENCY first
      { requiredBy: "asc" },
      { createdAt: "desc" },
    ],
  });
}

export async function acknowledgeBloodRequest(params: {
  bloodBankId: string;
  userId: string;
  requestId: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  const req = await prisma.bloodRequest.findUnique({
    where: { id: params.requestId },
    include: { hospital: { include: { user: true } } },
  });

  if (!req) throw new Error("Blood request not found");
  if (req.status !== "PENDING") {
    throw new Error(`Cannot acknowledge request with status ${req.status}`);
  }

  const updated = await prisma.bloodRequest.update({
    where: { id: params.requestId },
    data: {
      status: "ACKNOWLEDGED",
      acknowledgedAt: new Date(),
      acknowledgedByBloodBankId: params.bloodBankId,
    },
    include: { hospital: true, acknowledgedByBloodBank: true },
  });

  await logAuditEvent({
    userId: params.userId,
    action: "BLOOD_REQUEST_ACKNOWLEDGED",
    entityType: "BLOOD_REQUEST",
    entityId: req.id,
    metadata: {
      bloodBankId: params.bloodBankId,
      status: "ACKNOWLEDGED",
    },
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
  });

  // Notify hospital
  await createNotification({
    userId: req.hospital.userId,
    type: "REQUEST_UPDATE",
    title: "Request Acknowledged",
    message: `Your blood request for ${req.bloodGroup} was acknowledged by an authorized blood centre.`,
    relatedEntityType: "BLOOD_REQUEST",
    relatedEntityId: req.id,
  });

  return updated;
}

export async function cancelBloodRequest(params: {
  hospitalId: string;
  userId: string;
  requestId: string;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  const req = await prisma.bloodRequest.findUnique({
    where: { id: params.requestId },
  });

  if (!req) throw new Error("Blood request not found");
  if (req.hospitalId !== params.hospitalId) {
    throw new Error("Unauthorized to cancel this request");
  }
  if (req.status === "FULFILLED") {
    throw new Error("Cannot cancel an already fulfilled request");
  }

  const updated = await prisma.bloodRequest.update({
    where: { id: params.requestId },
    data: {
      status: "CANCELLED",
    },
  });

  await logAuditEvent({
    userId: params.userId,
    action: "BLOOD_REQUEST_CANCELLED",
    entityType: "BLOOD_REQUEST",
    entityId: req.id,
    metadata: {
      reason: params.reason || "Cancelled by hospital staff",
    },
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
  });

  return updated;
}

export async function getDonorMatchingOpportunities(donorUserId: string) {
  const donor = await prisma.youthDonorProfile.findUnique({
    where: { userId: donorUserId },
    include: { user: true },
  });

  if (!donor) return [];

  // Find active requests in donor's district matching donor's blood group
  const requests = await prisma.bloodRequest.findMany({
    where: {
      bloodGroup: donor.bloodGroup,
      status: { in: ["PENDING", "ACKNOWLEDGED", "MATCHING", "PARTIALLY_FULFILLED"] },
      hospital: {
        district: donor.user.district,
      },
    },
    include: {
      hospital: {
        select: {
          name: true,
          district: true,
          state: true,
        },
      },
      donorResponses: {
        where: {
          donorId: donor.id,
        },
      },
    },
    orderBy: [
      { urgency: "desc" },
      { requiredBy: "asc" },
    ],
    take: 10,
  });

  return requests.map((req) => ({
    id: req.id,
    bloodGroup: req.bloodGroup,
    componentType: req.componentType,
    unitsRequired: req.unitsRequired,
    unitsFulfilled: req.unitsFulfilled,
    urgency: req.urgency,
    requiredBy: req.requiredBy,
    hospitalName: req.hospital.name,
    district: req.hospital.district,
    state: req.hospital.state,
    myResponse: req.donorResponses[0]?.status || null,
  }));
}
