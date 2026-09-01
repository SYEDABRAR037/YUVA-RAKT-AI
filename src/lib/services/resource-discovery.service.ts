import prisma from "@/lib/db";
import {
  BloodGroup,
  BloodComponentType,
  RequestUrgency,
  ResponseMode,
  AmbulanceStatus,
} from "@prisma/client";

export interface ResourceDiscoveryInput {
  bloodGroup: BloodGroup;
  componentType: BloodComponentType;
  unitsRequired: number;
  district: string;
  state: string;
  urgency?: RequestUrgency;
  responseMode?: ResponseMode;
}

export interface PrioritizedBloodBank {
  bloodBankId: string;
  name: string;
  district: string;
  state: string;
  availableUnits: number;
  priorityScore: number;
  reasons: string[];
}

export interface PrioritizedDonorCandidate {
  donorId: string;
  fullName: string;
  bloodGroup: BloodGroup;
  district: string;
  state: string;
  verificationStatus: string;
  availabilityStatus: string;
  priorityScore: number;
  reasons: string[];
}

export interface PrioritizedAmbulance {
  ambulanceId: string;
  vehicleNumber: string;
  displayName: string;
  district: string;
  state: string;
  status: AmbulanceStatus;
  currentLatitude: number;
  currentLongitude: number;
  priorityScore: number;
  reasons: string[];
}

export interface ResourceDiscoveryResult {
  bloodGroup: BloodGroup;
  componentType: BloodComponentType;
  unitsRequired: number;
  district: string;
  state: string;
  bloodBanks: PrioritizedBloodBank[];
  donors: PrioritizedDonorCandidate[];
  ambulances: PrioritizedAmbulance[];
  summary: {
    totalCompatibleStock: number;
    suitableBloodBanksCount: number;
    eligibleDonorsCount: number;
    availableAmbulancesCount: number;
    immediateTransportRecommended: boolean;
  };
}

/**
 * Returns compatible donor blood groups for a given recipient blood group.
 */
function getCompatibleBloodGroups(recipientGroup: BloodGroup): BloodGroup[] {
  switch (recipientGroup) {
    case "O_NEGATIVE":
      return ["O_NEGATIVE"];
    case "O_POSITIVE":
      return ["O_POSITIVE", "O_NEGATIVE"];
    case "A_NEGATIVE":
      return ["A_NEGATIVE", "O_NEGATIVE"];
    case "A_POSITIVE":
      return ["A_POSITIVE", "A_NEGATIVE", "O_POSITIVE", "O_NEGATIVE"];
    case "B_NEGATIVE":
      return ["B_NEGATIVE", "O_NEGATIVE"];
    case "B_POSITIVE":
      return ["B_POSITIVE", "B_NEGATIVE", "O_POSITIVE", "O_NEGATIVE"];
    case "AB_NEGATIVE":
      return ["AB_NEGATIVE", "A_NEGATIVE", "B_NEGATIVE", "O_NEGATIVE"];
    case "AB_POSITIVE":
      return [
        "AB_POSITIVE",
        "AB_NEGATIVE",
        "A_POSITIVE",
        "A_NEGATIVE",
        "B_POSITIVE",
        "B_NEGATIVE",
        "O_POSITIVE",
        "O_NEGATIVE",
      ];
    default:
      return [recipientGroup];
  }
}

/**
 * Autonomous Resource Discovery Engine.
 * Identifies and ranks suitable Blood Banks, compatible Donors, and available Ambulances.
 */
export async function discoverEmergencyResources(
  input: ResourceDiscoveryInput
): Promise<ResourceDiscoveryResult> {
  const { bloodGroup, componentType, unitsRequired, district, state, urgency = "EMERGENCY" } = input;
  const compatibleGroups = getCompatibleBloodGroups(bloodGroup);
  const now = new Date();

  // 1. Discover and rank Blood Banks with compatible stock
  const allInventories = await prisma.bloodInventory.findMany({
    where: {
      bloodGroup: { in: compatibleGroups },
      componentType,
      expiryDate: { gt: now },
      unitsAvailable: { gt: 0 },
    },
    include: {
      bloodBank: true,
    },
  });

  const bloodBankMap = new Map<string, { bloodBank: any; units: number; exactMatchUnits: number }>();
  for (const inv of allInventories) {
    const bId = inv.bloodBankId;
    if (!bloodBankMap.has(bId)) {
      bloodBankMap.set(bId, { bloodBank: inv.bloodBank, units: 0, exactMatchUnits: 0 });
    }
    const record = bloodBankMap.get(bId)!;
    record.units += inv.unitsAvailable;
    if (inv.bloodGroup === bloodGroup) {
      record.exactMatchUnits += inv.unitsAvailable;
    }
  }

  const prioritizedBloodBanks: PrioritizedBloodBank[] = [];
  for (const [, data] of bloodBankMap.entries()) {
    const bb = data.bloodBank;
    let score = 50;
    const reasons: string[] = [];

    if (bb.district.toLowerCase() === district.toLowerCase()) {
      score += 25;
      reasons.push(`Located in same district (${bb.district})`);
    } else if (bb.state.toLowerCase() === state.toLowerCase()) {
      score += 10;
      reasons.push(`Located in same state (${bb.state})`);
    }

    if (data.exactMatchUnits >= unitsRequired) {
      score += 20;
      reasons.push(`Exact blood group match (${bloodGroup.replace("_", "")}) available (${data.exactMatchUnits} units)`);
    } else if (data.units >= unitsRequired) {
      score += 15;
      reasons.push(`Compatible units available (${data.units} units)`);
    } else {
      score += 5;
      reasons.push(`Partial compatible stock available (${data.units} units)`);
    }

    if (bb.verificationStatus === "VERIFIED") {
      score += 5;
      reasons.push("Authorized licensed clinical blood centre");
    }

    prioritizedBloodBanks.push({
      bloodBankId: bb.id,
      name: bb.name,
      district: bb.district,
      state: bb.state,
      availableUnits: data.units,
      priorityScore: Math.min(100, score),
      reasons,
    });
  }
  prioritizedBloodBanks.sort((a, b) => b.priorityScore - a.priorityScore);

  // 2. Discover and rank Compatible Verified Youth Donors
  const eligibleDonors = await prisma.youthDonorProfile.findMany({
    where: {
      bloodGroup: { in: compatibleGroups },
      availabilityStatus: "AVAILABLE",
      emergencyNotificationConsent: true,
      user: {
        accountStatus: "ACTIVE",
        district: { equals: district, mode: "insensitive" },
      },
    },
    include: {
      user: true,
    },
    take: 20,
  });

  const prioritizedDonors: PrioritizedDonorCandidate[] = eligibleDonors.map((d) => {
    let score = 40;
    const reasons: string[] = [];

    if (d.bloodGroup === bloodGroup) {
      score += 30;
      reasons.push(`Exact blood group match (${bloodGroup.replace("_", "")})`);
    } else {
      score += 15;
      reasons.push(`Compatible blood group (${d.bloodGroup.replace("_", "")})`);
    }

    if (d.verificationStatus === "VERIFIED") {
      score += 20;
      reasons.push("Clinically verified donor credentials");
    } else {
      score += 5;
      reasons.push("Standard registered donor");
    }

    if (d.availabilityStatus === "AVAILABLE") {
      score += 10;
      reasons.push("Marked actively available for voluntary donation");
    }

    return {
      donorId: d.id,
      fullName: d.user.fullName,
      bloodGroup: d.bloodGroup,
      district: d.user.district,
      state: d.user.state,
      verificationStatus: d.verificationStatus,
      availabilityStatus: d.availabilityStatus,
      priorityScore: Math.min(100, score),
      reasons,
    };
  });
  prioritizedDonors.sort((a, b) => b.priorityScore - a.priorityScore);

  // 3. Discover and rank Eligible Available Ambulances
  const allAmbulances = await prisma.ambulance.findMany({
    where: {
      status: { not: "INACTIVE" },
    },
    include: {
      user: true,
    },
  });

  const prioritizedAmbulances: PrioritizedAmbulance[] = allAmbulances
    .filter((a) => a.status === "AVAILABLE" || a.status === "BUSY")
    .map((amb) => {
      let score = 30;
      const reasons: string[] = [];

      if (amb.status === "AVAILABLE") {
        score += 40;
        reasons.push("Ambulance unit is currently available and ready for dispatch");
      } else {
        reasons.push("Unit is currently on standby / finishing prior route");
      }

      if (amb.district.toLowerCase() === district.toLowerCase()) {
        score += 20;
        reasons.push(`Stationed in target district (${amb.district})`);
      } else if (amb.state.toLowerCase() === state.toLowerCase()) {
        score += 10;
        reasons.push(`Stationed in same state (${amb.state})`);
      }

      // Location freshness
      const minutesSinceUpdate = (now.getTime() - new Date(amb.lastLocationUpdatedAt).getTime()) / (1000 * 60);
      if (minutesSinceUpdate <= 30) {
        score += 10;
        reasons.push("Live GPS signal verified within last 30 minutes");
      }

      return {
        ambulanceId: amb.id,
        vehicleNumber: amb.vehicleNumber,
        displayName: amb.displayName,
        district: amb.district,
        state: amb.state,
        status: amb.status,
        currentLatitude: amb.currentLatitude,
        currentLongitude: amb.currentLongitude,
        priorityScore: Math.min(100, score),
        reasons,
      };
    });
  prioritizedAmbulances.sort((a, b) => b.priorityScore - a.priorityScore);

  const totalCompatibleStock = prioritizedBloodBanks.reduce((sum, b) => sum + b.availableUnits, 0);
  const immediateTransportRecommended = urgency === "EMERGENCY" || urgency === "CRITICAL";

  return {
    bloodGroup,
    componentType,
    unitsRequired,
    district,
    state,
    bloodBanks: prioritizedBloodBanks,
    donors: prioritizedDonors,
    ambulances: prioritizedAmbulances,
    summary: {
      totalCompatibleStock,
      suitableBloodBanksCount: prioritizedBloodBanks.length,
      eligibleDonorsCount: prioritizedDonors.length,
      availableAmbulancesCount: prioritizedAmbulances.filter((a) => a.status === "AVAILABLE").length,
      immediateTransportRecommended,
    },
  };
}
