import prisma from "@/lib/db";
import { BloodGroup, BloodComponentType } from "@prisma/client";

export interface DemandFeatures {
  state: string;
  district: string;
  bloodGroup: BloodGroup;
  componentType: BloodComponentType;
  
  // Historical velocity
  dailyDemandAvg: number;
  recent7DayVelocity: number;    // Demand rate in last 7 days
  previous7DayVelocity: number;  // Demand rate 7-14 days ago
  velocityTrendRatio: number;    // recent / previous
  
  // Fulfillment & Unmet Demand
  fulfillmentRate: number;       // totalFulfilled / totalRequested
  unmetDemandUnits: number;
  
  // Emergency Intensity
  emergencyRequestRatio: number; // urgent + emergency / total
  
  // Inventory status
  currentAvailableStock: number;
  expiringIn7Days: number;
  daysOfSupplyRemaining: number; // currentAvailableStock / dailyDemandAvg
  
  // Active Pressure
  activePendingRequestsUnits: number;
}

/**
 * Computes feature vectors from PostgreSQL records for a given geographic slice & blood component.
 */
export async function computeDemandFeatures(params: {
  state: string;
  district: string;
  bloodGroup: BloodGroup;
  componentType: BloodComponentType;
}): Promise<DemandFeatures> {
  const { state, district, bloodGroup, componentType } = params;
  const now = new Date();
  const day7Ago = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const day14Ago = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  const day30Ago = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // 1. Fetch 30-day requests
  const requests = await prisma.bloodRequest.findMany({
    where: {
      bloodGroup,
      componentType,
      hospital: { state, district },
      createdAt: { gte: day30Ago },
    },
    orderBy: { createdAt: "asc" },
  });

  let totalRequested = 0;
  let totalFulfilled = 0;
  let recent7Units = 0;
  let previous7Units = 0;
  let emergencyCount = 0;
  let activePendingUnits = 0;

  for (const r of requests) {
    totalRequested += r.unitsRequired;
    totalFulfilled += r.unitsFulfilled;

    if (r.createdAt >= day7Ago) {
      recent7Units += r.unitsRequired;
    } else if (r.createdAt >= day14Ago) {
      previous7Units += r.unitsRequired;
    }

    if (r.urgency === "EMERGENCY" || r.urgency === "CRITICAL" || r.urgency === "URGENT") {
      emergencyCount += 1;
    }

    if (r.status === "PENDING" || r.status === "ACKNOWLEDGED" || r.status === "MATCHING" || r.status === "PARTIALLY_FULFILLED") {
      activePendingUnits += (r.unitsRequired - r.unitsFulfilled);
    }
  }

  const dailyDemandAvg = totalRequested > 0 ? Number((totalRequested / 30).toFixed(2)) : 0.2;
  const recent7DayVelocity = Number((recent7Units / 7).toFixed(2));
  const previous7DayVelocity = Number((previous7Units / 7).toFixed(2));
  const velocityTrendRatio = previous7DayVelocity > 0 ? Number((recent7DayVelocity / previous7DayVelocity).toFixed(2)) : recent7DayVelocity > 0 ? 1.5 : 1.0;

  const fulfillmentRate = totalRequested > 0 ? Number((totalFulfilled / totalRequested).toFixed(2)) : 1.0;
  const unmetDemandUnits = Math.max(0, totalRequested - totalFulfilled);
  const emergencyRequestRatio = requests.length > 0 ? Number((emergencyCount / requests.length).toFixed(2)) : 0;

  // 2. Fetch inventory
  const inventoryBatches = await prisma.bloodInventory.findMany({
    where: {
      bloodGroup,
      componentType,
      bloodBank: { state, district },
      expiryDate: { gt: now },
    },
  });

  const currentAvailableStock = inventoryBatches.reduce((sum, b) => sum + b.unitsAvailable, 0);
  const in7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const expiringIn7Days = inventoryBatches
    .filter((b) => b.expiryDate <= in7Days)
    .reduce((sum, b) => sum + b.unitsAvailable, 0);

  const effectiveDailyRate = Math.max(0.1, recent7DayVelocity > 0 ? recent7DayVelocity : dailyDemandAvg);
  const daysOfSupplyRemaining = Number((currentAvailableStock / effectiveDailyRate).toFixed(1));

  return {
    state,
    district,
    bloodGroup,
    componentType,
    dailyDemandAvg,
    recent7DayVelocity,
    previous7DayVelocity,
    velocityTrendRatio,
    fulfillmentRate,
    unmetDemandUnits,
    emergencyRequestRatio,
    currentAvailableStock,
    expiringIn7Days,
    daysOfSupplyRemaining,
    activePendingRequestsUnits: activePendingUnits,
  };
}
