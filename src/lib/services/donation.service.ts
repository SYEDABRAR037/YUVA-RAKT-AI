import prisma from "@/lib/db";
import { BloodGroup, BloodComponentType, DonationStatus } from "@prisma/client";
import { calculateExpiryDate } from "./inventory.service";
import { createNotification } from "./notification.service";
import { logAuditEvent } from "./audit.service";

export async function recordCompletedDonation(params: {
  bloodBankId: string;
  userId: string;
  donorId?: string;
  donorEmailOrPhone?: string;
  bloodGroup: BloodGroup;
  componentType: BloodComponentType;
  units: number;
  donationDate?: Date;
  campName?: string;
  certificateNumber?: string;
  notes?: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  const { bloodBankId, userId, bloodGroup, componentType, units } = params;
  const donationDate = params.donationDate || new Date();

  const bloodBank = await prisma.bloodBank.findUnique({
    where: { id: bloodBankId },
  });
  if (!bloodBank) throw new Error("Blood bank facility not found");

  // Resolve donor
  let donorProfile = null;
  if (params.donorId) {
    donorProfile = await prisma.youthDonorProfile.findUnique({
      where: { id: params.donorId },
      include: { user: true },
    });
  } else if (params.donorEmailOrPhone) {
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: params.donorEmailOrPhone },
          { phone: params.donorEmailOrPhone },
        ],
      },
      include: { youthDonorProfile: true },
    });
    if (user?.youthDonorProfile) {
      donorProfile = { ...user.youthDonorProfile, user };
    }
  }

  if (!donorProfile) {
    throw new Error("Registered Youth Donor could not be found. Please check Donor ID, Email or Mobile.");
  }

  const expiryDate = calculateExpiryDate(componentType, donationDate);

  // Atomic database transaction
  const result = await prisma.$transaction(async (tx) => {
    // 1. Create Donation Record
    const donation = await tx.donation.create({
      data: {
        donorId: donorProfile.id,
        bloodBankId,
        donationDate,
        units,
        bloodGroup,
        componentType,
        status: "COMPLETED" as DonationStatus,
        campName: params.campName,
        certificateNumber: params.certificateNumber,
        notes: params.notes,
      },
    });

    // 2. Update Donor Profile Stats
    await tx.youthDonorProfile.update({
      where: { id: donorProfile.id },
      data: {
        donationCount: { increment: units },
        lastDonationDate: donationDate,
      },
    });

    // 3. Increment Blood Inventory
    let inventoryBatch = await tx.bloodInventory.findFirst({
      where: {
        bloodBankId,
        bloodGroup,
        componentType,
        expiryDate,
      },
    });

    if (inventoryBatch) {
      inventoryBatch = await tx.bloodInventory.update({
        where: { id: inventoryBatch.id },
        data: {
          unitsAvailable: { increment: units },
        },
      });
    } else {
      inventoryBatch = await tx.bloodInventory.create({
        data: {
          bloodBankId,
          bloodGroup,
          componentType,
          unitsAvailable: units,
          expiryDate,
        },
      });
    }

    // 4. Create Inventory Transaction
    await tx.inventoryTransaction.create({
      data: {
        bloodBankId,
        inventoryId: inventoryBatch.id,
        bloodGroup,
        componentType,
        quantity: units, // addition
        transactionType: "DONATION",
        referenceId: donation.id,
        notes: `Voluntary donation by ${donorProfile.user.fullName} (${donorProfile.user.phone})`,
        createdBy: userId,
      },
    });

    return { donation, donorProfile };
  });

  // Log Audit Event
  await logAuditEvent({
    userId,
    action: "DONATION_COMPLETED",
    entityType: "DONATION",
    entityId: result.donation.id,
    metadata: {
      donorName: donorProfile.user.fullName,
      bloodGroup,
      units,
      bloodBankName: bloodBank.name,
    },
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
  });

  // Send Notification to Donor
  const bloodGroupLabel = bloodGroup.replace("_POSITIVE", "+").replace("_NEGATIVE", "-");
  await createNotification({
    userId: donorProfile.userId,
    type: "DONOR_MATCH",
    title: "❤️ Donation Certificate & Lifesaver Record",
    message: `Thank you, ${donorProfile.user.fullName}! Your voluntary donation of ${units} unit(s) of ${bloodGroupLabel} at ${bloodBank.name} has been verified and added to the lifesaving inventory.`,
    relatedEntityType: "DONATION",
    relatedEntityId: result.donation.id,
  });

  return result.donation;
}

export async function getDonorDonationHistory(donorUserId: string) {
  const donor = await prisma.youthDonorProfile.findUnique({
    where: { userId: donorUserId },
  });
  if (!donor) return [];

  return prisma.donation.findMany({
    where: { donorId: donor.id },
    include: {
      bloodBank: {
        select: {
          name: true,
          city: true,
          district: true,
          state: true,
        },
      },
    },
    orderBy: { donationDate: "desc" },
  });
}

export async function getBloodBankDonations(bloodBankId: string, limit = 50) {
  return prisma.donation.findMany({
    where: { bloodBankId },
    include: {
      donor: {
        include: {
          user: {
            select: {
              fullName: true,
              phone: true,
              email: true,
              district: true,
            },
          },
        },
      },
    },
    orderBy: { donationDate: "desc" },
    take: limit,
  });
}
