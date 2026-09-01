import prisma from "@/lib/db";
import { BloodGroup, BloodComponentType } from "@prisma/client";

export interface AggregatedDemandItem {
  state: string;
  district: string;
  bloodGroup: BloodGroup;
  componentType: BloodComponentType;
  totalRequestedUnits: number;
  totalFulfilledUnits: number;
  requestCount: number;
  emergencyRequestCount: number;
  averageDailyUnits: number;
  observationDays: number;
  lastRequestDate: Date | null;
}

export interface AggregatedInventoryItem {
  state: string;
  district: string;
  bloodGroup: BloodGroup;
  componentType: BloodComponentType;
  totalAvailableUnits: number;
  expiringIn7DaysUnits: number;
  expiredUnits: number;
  batchCount: number;
}

export interface RegionSummary {
  state: string;
  district: string;
  hospitalsCount: number;
  bloodBanksCount: number;
  verifiedDonorsCount: number;
  availableDonorsCount: number;
}

/**
 * Extracts and aggregates historical demand records from PostgreSQL BloodRequest table.
 */
export async function getAggregatedDemandData(params?: {
  state?: string;
  district?: string;
  bloodGroup?: BloodGroup;
  componentType?: BloodComponentType;
  sinceDays?: number;
}): Promise<AggregatedDemandItem[]> {
  const sinceDays = params?.sinceDays || 90;
  const sinceDate = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000);

  const whereClause: any = {
    createdAt: { gte: sinceDate },
  };

  if (params?.bloodGroup) whereClause.bloodGroup = params.bloodGroup;
  if (params?.componentType) whereClause.componentType = params.componentType;
  if (params?.district) whereClause.hospital = { district: params.district };
  else if (params?.state) whereClause.hospital = { state: params.state };

  const requests = await prisma.bloodRequest.findMany({
    where: whereClause,
    include: {
      hospital: {
        select: { state: true, district: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  // Group by State + District + BloodGroup + ComponentType
  const groupMap = new Map<string, {
    state: string;
    district: string;
    bloodGroup: BloodGroup;
    componentType: BloodComponentType;
    totalRequested: number;
    totalFulfilled: number;
    count: number;
    emergencyCount: number;
    firstDate: Date;
    lastDate: Date;
  }>();

  for (const r of requests) {
    const key = `${r.hospital.state}_${r.hospital.district}_${r.bloodGroup}_${r.componentType}`;
    const existing = groupMap.get(key);

    const isEmergency = r.urgency === "EMERGENCY" || r.urgency === "CRITICAL";

    if (existing) {
      existing.totalRequested += r.unitsRequired;
      existing.totalFulfilled += r.unitsFulfilled;
      existing.count += 1;
      if (isEmergency) existing.emergencyCount += 1;
      if (r.createdAt > existing.lastDate) existing.lastDate = r.createdAt;
      if (r.createdAt < existing.firstDate) existing.firstDate = r.createdAt;
    } else {
      groupMap.set(key, {
        state: r.hospital.state,
        district: r.hospital.district,
        bloodGroup: r.bloodGroup,
        componentType: r.componentType,
        totalRequested: r.unitsRequired,
        totalFulfilled: r.unitsFulfilled,
        count: 1,
        emergencyCount: isEmergency ? 1 : 0,
        firstDate: r.createdAt,
        lastDate: r.createdAt,
      });
    }
  }

  const results: AggregatedDemandItem[] = [];

  for (const item of groupMap.values()) {
    const timeSpanMs = Math.max(86400000, item.lastDate.getTime() - item.firstDate.getTime());
    const observationDays = Math.max(1, Math.ceil(timeSpanMs / (1000 * 60 * 60 * 24)));
    const averageDailyUnits = Number((item.totalRequested / observationDays).toFixed(2));

    results.push({
      state: item.state,
      district: item.district,
      bloodGroup: item.bloodGroup,
      componentType: item.componentType,
      totalRequestedUnits: item.totalRequested,
      totalFulfilledUnits: item.totalFulfilled,
      requestCount: item.count,
      emergencyRequestCount: item.emergencyCount,
      averageDailyUnits,
      observationDays,
      lastRequestDate: item.lastDate,
    });
  }

  return results;
}

/**
 * Extracts and aggregates real-time blood inventory by district and blood group.
 */
export async function getAggregatedInventoryData(params?: {
  state?: string;
  district?: string;
  bloodGroup?: BloodGroup;
  componentType?: BloodComponentType;
}): Promise<AggregatedInventoryItem[]> {
  const now = new Date();
  const in7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const whereClause: any = {};
  if (params?.bloodGroup) whereClause.bloodGroup = params.bloodGroup;
  if (params?.componentType) whereClause.componentType = params.componentType;
  if (params?.district) whereClause.bloodBank = { district: params.district };
  else if (params?.state) whereClause.bloodBank = { state: params.state };

  const inventoryBatches = await prisma.bloodInventory.findMany({
    where: whereClause,
    include: {
      bloodBank: {
        select: { state: true, district: true },
      },
    },
  });

  const groupMap = new Map<string, AggregatedInventoryItem>();

  for (const b of inventoryBatches) {
    const key = `${b.bloodBank.state}_${b.bloodBank.district}_${b.bloodGroup}_${b.componentType}`;
    const isExpired = b.expiryDate < now;
    const isExpiringSoon = !isExpired && b.expiryDate <= in7Days;

    const existing = groupMap.get(key);
    if (existing) {
      if (!isExpired) {
        existing.totalAvailableUnits += b.unitsAvailable;
      }
      if (isExpiringSoon) {
        existing.expiringIn7DaysUnits += b.unitsAvailable;
      }
      if (isExpired) {
        existing.expiredUnits += b.unitsAvailable;
      }
      existing.batchCount += 1;
    } else {
      groupMap.set(key, {
        state: b.bloodBank.state,
        district: b.bloodBank.district,
        bloodGroup: b.bloodGroup,
        componentType: b.componentType,
        totalAvailableUnits: isExpired ? 0 : b.unitsAvailable,
        expiringIn7DaysUnits: isExpiringSoon ? b.unitsAvailable : 0,
        expiredUnits: isExpired ? b.unitsAvailable : 0,
        batchCount: 1,
      });
    }
  }

  return Array.from(groupMap.values());
}

/**
 * Retrieves regional capacity metadata (Hospitals, Blood Banks, Verified Donors).
 */
export async function getRegionSummary(state: string, district: string): Promise<RegionSummary> {
  const [hospitalsCount, bloodBanksCount, verifiedDonorsCount, availableDonorsCount] = await Promise.all([
    prisma.hospital.count({ where: { state, district, verificationStatus: "VERIFIED" } }),
    prisma.bloodBank.count({ where: { state, district, verificationStatus: "VERIFIED" } }),
    prisma.youthDonorProfile.count({
      where: {
        verificationStatus: "VERIFIED",
        user: { state, district },
      },
    }),
    prisma.youthDonorProfile.count({
      where: {
        verificationStatus: "VERIFIED",
        availabilityStatus: "AVAILABLE",
        user: { state, district },
      },
    }),
  ]);

  return {
    state,
    district,
    hospitalsCount,
    bloodBanksCount,
    verifiedDonorsCount,
    availableDonorsCount,
  };
}
