import { BloodGroup, BloodComponentType, ShortageRiskLevel } from "@prisma/client";
import { DemandFeatures, computeDemandFeatures } from "../data/features";
import { generateDemandForecast } from "../forecasting/engine";

export interface ShortageRiskOutput {
  state: string;
  district: string;
  bloodGroup: BloodGroup;
  componentType: BloodComponentType;
  riskLevel: ShortageRiskLevel;
  riskScore: number;                 // 0 - 100
  currentInventoryUnits: number;
  predictedDemandUnits: number;      // 7-day forecast
  expiringUnits: number;
  activeEmergencyRequests: number;
  contributingFactors: string[];
  recommendedActions: string[];
  modelVersion: string;
  generatedAt: Date;
}

/**
 * Multi-factor Shortage Risk Engine.
 * Combines demand forecast, current stock deficit, urgent hospital backlogs, and near-term expiry.
 */
export async function calculateShortageRisk(params: {
  state: string;
  district: string;
  bloodGroup: BloodGroup;
  componentType: BloodComponentType;
}): Promise<ShortageRiskOutput> {
  const { state, district, bloodGroup, componentType } = params;

  // 1. Fetch feature vector
  const features: DemandFeatures = await computeDemandFeatures({
    state,
    district,
    bloodGroup,
    componentType,
  });

  // 2. Generate 7-day demand forecast
  const forecast7 = await generateDemandForecast({
    state,
    district,
    bloodGroup,
    componentType,
    periodDays: 7,
  });

  const predicted7DayDemand = forecast7.predictedUnits;
  const currentStock = features.currentAvailableStock;
  const expiringStock = features.expiringIn7Days;
  const pendingRequests = features.activePendingRequestsUnits;

  // Effective net supply over next 7 days (available stock minus expiring batches)
  const netUsableSupply = Math.max(0, currentStock - (expiringStock * 0.7));

  // Factor 1: Inventory Deficit vs 7-day Forecast Demand (Max 35 pts)
  let inventoryDeficitPts = 0;
  if (netUsableSupply <= 0) {
    inventoryDeficitPts = 35;
  } else if (netUsableSupply < predicted7DayDemand) {
    const deficitRatio = (predicted7DayDemand - netUsableSupply) / predicted7DayDemand;
    inventoryDeficitPts = Math.min(35, Math.round(deficitRatio * 35));
  } else if (netUsableSupply < predicted7DayDemand * 1.3) {
    inventoryDeficitPts = 12; // Thin safety buffer
  }

  // Factor 2: Demand Velocity & Trend Pressure (Max 25 pts)
  let demandPressurePts = 0;
  if (forecast7.demandTrend === "INCREASING") {
    demandPressurePts += 15;
  }
  if (features.velocityTrendRatio > 1.2) {
    demandPressurePts += 10;
  }

  // Factor 3: Urgent & Emergency Hospital Backlogs (Max 25 pts)
  let urgentPressurePts = 0;
  if (pendingRequests > 0) {
    urgentPressurePts += Math.min(15, pendingRequests * 5);
  }
  if (features.emergencyRequestRatio > 0.3) {
    urgentPressurePts += 10;
  }

  // Factor 4: Shelf-life & Perishability Expiry Risk (Max 15 pts)
  let expiryPressurePts = 0;
  if (expiringStock > 0 && currentStock > 0) {
    const expiryRatio = expiringStock / currentStock;
    expiryPressurePts = Math.min(15, Math.round(expiryRatio * 15));
  }

  // Aggregate Total Risk Score (0 - 100)
  const rawRiskScore = inventoryDeficitPts + demandPressurePts + urgentPressurePts + expiryPressurePts;
  const riskScore = Math.min(100, Math.max(5, rawRiskScore));

  // Determine Level
  let riskLevel: ShortageRiskLevel = "LOW";
  if (riskScore >= 75 || (currentStock === 0 && predicted7DayDemand > 0)) {
    riskLevel = "CRITICAL";
  } else if (riskScore >= 50) {
    riskLevel = "HIGH";
  } else if (riskScore >= 25) {
    riskLevel = "MODERATE";
  }

  // 3. Formulate Explainable AI Contributing Factors
  const contributingFactors: string[] = [];
  const bloodLabel = bloodGroup.replace("_POSITIVE", "+").replace("_NEGATIVE", "-");

  if (currentStock < predicted7DayDemand) {
    contributingFactors.push(
      `Current stock (${currentStock} units) is below projected 7-day clinical demand (${predicted7DayDemand} units).`
    );
  } else {
    contributingFactors.push(
      `Current stock is ${currentStock} units vs 7-day forecast of ${predicted7DayDemand} units.`
    );
  }

  if (forecast7.demandTrend === "INCREASING") {
    contributingFactors.push(
      `Demand velocity for ${bloodLabel} ${componentType} is trending upwards (+${Math.round((features.velocityTrendRatio - 1) * 100)}% over prior period).`
    );
  }

  if (pendingRequests > 0) {
    contributingFactors.push(
      `${pendingRequests} active unfulfilled hospital unit(s) currently awaiting fulfillment in ${district}.`
    );
  }

  if (expiringStock > 0) {
    contributingFactors.push(
      `${expiringStock} units will reach maximum clinical shelf life within the next 7 days.`
    );
  }

  if (contributingFactors.length === 0) {
    contributingFactors.push("Regional supply and demand indicators remain within balanced operational limits.");
  }

  // 4. Formulate Recommended Actions
  const recommendedActions: string[] = [];
  if (riskLevel === "CRITICAL") {
    recommendedActions.push(`Mobilize verified voluntary youth donors with ${bloodLabel} in ${district}.`);
    recommendedActions.push("Initiate emergency inter-bank stock rebalancing from adjacent district blood centres.");
    recommendedActions.push("Notify district health authority and nodal transfusion officers for priority monitoring.");
  } else if (riskLevel === "HIGH") {
    recommendedActions.push(`Schedule targeted voluntary blood donation drives for ${bloodLabel} in ${district}.`);
    recommendedActions.push("Issue operational alert to authorized regional blood banks to conserve stock.");
    if (expiringStock > 0) {
      recommendedActions.push("Execute FIFO prioritization to transfuse batches expiring within 7 days first.");
    }
  } else if (riskLevel === "MODERATE") {
    recommendedActions.push("Monitor daily requisition velocity and keep youth donor network on standby.");
    if (expiringStock > 0) {
      recommendedActions.push("Review batches nearing shelf-life to avoid unnecessary disposal.");
    }
  } else {
    recommendedActions.push("Maintain standard inventory replenishment and regular voluntary camp schedule.");
  }

  return {
    state,
    district,
    bloodGroup,
    componentType,
    riskLevel,
    riskScore,
    currentInventoryUnits: currentStock,
    predictedDemandUnits: predicted7DayDemand,
    expiringUnits: expiringStock,
    activeEmergencyRequests: pendingRequests,
    contributingFactors,
    recommendedActions,
    modelVersion: "risk-v1",
    generatedAt: new Date(),
  };
}
