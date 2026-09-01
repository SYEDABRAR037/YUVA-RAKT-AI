import prisma from "@/lib/db";
import { VerificationStatus } from "@prisma/client";
import { createNotification } from "./notification.service";
import { logAuditEvent } from "./audit.service";

export async function submitDonorVerification(params: {
  userId: string;
  documentType: string;
  documentNumber: string;
  notes?: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  const donor = await prisma.youthDonorProfile.findUnique({
    where: { userId: params.userId },
  });

  if (!donor) throw new Error("Youth donor profile not found");

  const now = new Date();

  return prisma.$transaction(async (tx) => {
    // 1. Create Verification Request
    const verificationRequest = await tx.donorVerificationRequest.create({
      data: {
        donorId: donor.id,
        status: "PENDING",
        documentType: params.documentType,
        documentNumber: params.documentNumber,
        notes: params.notes,
        submittedAt: now,
      },
    });

    // 2. Update Profile Status
    await tx.youthDonorProfile.update({
      where: { id: donor.id },
      data: {
        verificationStatus: "PENDING",
        verificationSubmittedAt: now,
        rejectionReason: null,
      },
    });

    // 3. Log Audit
    await logAuditEvent({
      userId: params.userId,
      action: "DONOR_VERIFICATION_SUBMITTED",
      entityType: "DONOR_PROFILE",
      entityId: donor.id,
      metadata: {
        documentType: params.documentType,
        documentNumber: params.documentNumber,
      },
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    });

    return verificationRequest;
  });
}

export async function getDonorVerificationStatus(userId: string) {
  const donor = await prisma.youthDonorProfile.findUnique({
    where: { userId },
    include: {
      verificationRequests: {
        orderBy: { submittedAt: "desc" },
        take: 5,
        include: {
          reviewedByBloodBank: {
            select: {
              name: true,
              city: true,
              district: true,
            },
          },
        },
      },
    },
  });

  return donor;
}

export async function getPendingVerificationsForBloodBank(params: {
  district?: string;
  state?: string;
}) {
  const where: any = {
    status: "PENDING" as VerificationStatus,
  };

  if (params.district || params.state) {
    where.donor = {
      user: {},
    };
    if (params.district) where.donor.user.district = params.district;
    if (params.state) where.donor.user.state = params.state;
  }

  return prisma.donorVerificationRequest.findMany({
    where,
    include: {
      donor: {
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
              district: true,
              state: true,
              city: true,
            },
          },
        },
      },
    },
    orderBy: { submittedAt: "asc" },
  });
}

export async function reviewDonorVerification(params: {
  bloodBankId: string;
  userId: string;
  requestId: string;
  decision: "VERIFIED" | "REJECTED";
  rejectionReason?: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  const { bloodBankId, userId, requestId, decision, rejectionReason } = params;

  const bloodBank = await prisma.bloodBank.findUnique({
    where: { id: bloodBankId },
  });
  if (!bloodBank) throw new Error("Blood bank facility not found");

  const vReq = await prisma.donorVerificationRequest.findUnique({
    where: { id: requestId },
    include: { donor: { include: { user: true } } },
  });
  if (!vReq) throw new Error("Verification request not found");

  const now = new Date();

  return prisma.$transaction(async (tx) => {
    // 1. Update verification request
    const updatedRequest = await tx.donorVerificationRequest.update({
      where: { id: requestId },
      data: {
        status: decision,
        reviewedAt: now,
        reviewedByBloodBankId: bloodBankId,
        rejectionReason: decision === "REJECTED" ? rejectionReason : null,
      },
    });

    // 2. Update donor profile
    await tx.youthDonorProfile.update({
      where: { id: vReq.donorId },
      data: {
        verificationStatus: decision,
        rejectionReason: decision === "REJECTED" ? rejectionReason : null,
      },
    });

    // 3. Log Audit
    await logAuditEvent({
      userId,
      action: decision === "VERIFIED" ? "DONOR_VERIFIED" : "DONOR_REJECTED",
      entityType: "DONOR_PROFILE",
      entityId: vReq.donorId,
      metadata: {
        bloodBankName: bloodBank.name,
        decision,
        rejectionReason: decision === "REJECTED" ? rejectionReason : undefined,
      },
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    });

    // 4. Send Notification to Donor
    await createNotification({
      userId: vReq.donor.userId,
      type: "VERIFICATION",
      title: decision === "VERIFIED" ? "✅ Voluntary Donor Profile Verified!" : "⚠️ Verification Application Update",
      message:
        decision === "VERIFIED"
          ? `Congratulations! Your voluntary blood donor credentials have been verified by ${bloodBank.name}. You are now an authorized verified lifesaver in ${bloodBank.district}.`
          : `Your verification submission was not approved: "${rejectionReason || "Documentation incomplete"}". You may re-submit with updated details.`,
      relatedEntityType: "VERIFICATION",
      relatedEntityId: requestId,
    });

    return updatedRequest;
  });
}
