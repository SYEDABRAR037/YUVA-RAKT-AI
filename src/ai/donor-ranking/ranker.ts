import prisma from "@/lib/db";
import { BloodGroup, DonorPriorityTier } from "@prisma/client";

export interface RankedDonorItem {
  donorId: string;
  userId: string;
  fullName: string;
  bloodGroup: BloodGroup;
  verificationStatus: string;
  availabilityStatus: string;
  district: string;
  state: string;
  operationalScore: number;       // 0 - 100
  priorityTier: DonorPriorityTier;
  rankingFactors: string[];
  lastDonationDate: string | null;
  donationCount: number;
}

// Standard non-clinical operational ABO/Rh compatibility matrix
const COMPATIBILITY_MAP: Record<BloodGroup, BloodGroup[]> = {
  O_NEGATIVE: ["O_NEGATIVE"],
  O_POSITIVE: ["O_POSITIVE", "O_NEGATIVE"],
  A_NEGATIVE: ["A_NEGATIVE", "O_NEGATIVE"],
  A_POSITIVE: ["A_POSITIVE", "A_NEGATIVE", "O_POSITIVE", "O_NEGATIVE"],
  B_NEGATIVE: ["B_NEGATIVE", "O_NEGATIVE"],
  B_POSITIVE: ["B_POSITIVE", "B_NEGATIVE", "O_POSITIVE", "O_NEGATIVE"],
  AB_NEGATIVE: ["AB_NEGATIVE", "A_NEGATIVE", "B_NEGATIVE", "O_NEGATIVE"],
  AB_POSITIVE: [
    "AB_POSITIVE", "AB_NEGATIVE",
    "A_POSITIVE", "A_NEGATIVE",
    "B_POSITIVE", "B_NEGATIVE",
    "O_POSITIVE", "O_NEGATIVE",
  ],
};

/**
 * Calculates operational priority score for voluntary youth donors.
 * Note: Operational decision-support scoring only; does NOT replace clinical medical screening.
 */
export async function rankDonorsForRequest(requestId: string): Promise<RankedDonorItem[]> {
  const request = await prisma.bloodRequest.findUnique({
    where: { id: requestId },
    include: {
      hospital: {
        select: { state: true, district: true },
      },
    },
  });

  if (!request) throw new Error("Blood requisition not found");

  const targetGroup = request.bloodGroup;
  const compatibleGroups = COMPATIBILITY_MAP[targetGroup] || [targetGroup];

  // Fetch candidate donors with compatible blood groups in same state/district
  const candidateDonors = await prisma.youthDonorProfile.findMany({
    where: {
      bloodGroup: { in: compatibleGroups },
      user: {
        state: request.hospital.state,
      },
    },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          district: true,
          state: true,
        },
      },
    },
  });

  const rankedDonors: RankedDonorItem[] = [];

  for (const donor of candidateDonors) {
    let score = 0;
    const factors: string[] = [];

    // Factor 1: Blood Group Match (Max 30 pts)
    if (donor.bloodGroup === targetGroup) {
      score += 30;
      factors.push(`Exact blood group match (${targetGroup.replace("_POSITIVE", "+").replace("_NEGATIVE", "-")})`);
    } else {
      score += 20;
      factors.push(`Compatible component donor group (${donor.bloodGroup.replace("_POSITIVE", "+").replace("_NEGATIVE", "-")})`);
    }

    // Factor 2: Verification Status (Max 25 pts)
    if (donor.verificationStatus === "VERIFIED") {
      score += 25;
      factors.push("Clinically verified blood donor credentials");
    } else if (donor.verificationStatus === "PENDING") {
      score += 10;
      factors.push("Verification documents currently under review");
    }

    // Factor 3: Availability Status (Max 20 pts)
    if (donor.availabilityStatus === "AVAILABLE") {
      score += 20;
      factors.push("Currently registered as AVAILABLE to donate");
    } else if (donor.availabilityStatus === "UNKNOWN") {
      score += 5;
    }

    // Factor 4: Geographic Proximity (Max 15 pts)
    if (donor.user.district.toLowerCase() === request.hospital.district.toLowerCase()) {
      score += 15;
      factors.push(`Located in same district (${donor.user.district})`);
    } else {
      score += 8;
      factors.push(`Located within same state (${donor.user.state})`);
    }

    // Factor 5: Emergency Notification Consent & History (Max 10 pts)
    if (donor.emergencyNotificationConsent) {
      score += 10;
      factors.push("Emergency notification consent enabled");
    }

    // Determine Tier
    let priorityTier: DonorPriorityTier = "LOW";
    if (score >= 80) {
      priorityTier = "HIGH";
    } else if (score >= 50) {
      priorityTier = "MEDIUM";
    }

    rankedDonors.push({
      donorId: donor.id,
      userId: donor.user.id,
      fullName: donor.user.fullName,
      bloodGroup: donor.bloodGroup,
      verificationStatus: donor.verificationStatus,
      availabilityStatus: donor.availabilityStatus,
      district: donor.user.district,
      state: donor.user.state,
      operationalScore: score,
      priorityTier,
      rankingFactors: factors,
      lastDonationDate: donor.lastDonationDate ? donor.lastDonationDate.toISOString() : null,
      donationCount: donor.donationCount,
    });
  }

  // Sort descending by operational score
  rankedDonors.sort((a, b) => b.operationalScore - a.operationalScore);

  return rankedDonors;
}
