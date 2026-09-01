import { BloodGroup, BloodComponentType, DemandTrend } from "@prisma/client";
import { DemandFeatures, computeDemandFeatures } from "../data/features";
import { calculateForecastConfidence } from "./confidence";

export interface ForecastOutput {
  state: string;
  district: string;
  bloodGroup: BloodGroup;
  componentType: BloodComponentType;
  periodDays: number;            // 7, 14, 30
  predictedUnits: number;
  confidenceScore: number;       // 0.0 - 1.0
  demandTrend: DemandTrend;
  historicalDailyAvg: number;
  dataQuality: string;
  modelVersion: string;
  generatedAt: Date;
}

/**
 * Predicts blood demand using Weighted Exponential Smoothing with Trend Momentum.
 */
export async function generateDemandForecast(params: {
  state: string;
  district: string;
  bloodGroup: BloodGroup;
  componentType: BloodComponentType;
  periodDays: number;
}): Promise<ForecastOutput> {
  const { state, district, bloodGroup, componentType, periodDays } = params;

  // 1. Extract feature vector
  const features: DemandFeatures = await computeDemandFeatures({
    state,
    district,
    bloodGroup,
    componentType,
  });

  // 2. Exponential Smoothing Parameters
  // Base daily rate: blended average of 30-day baseline and recent 7-day velocity
  let baseDailyRate = features.dailyDemandAvg;
  if (features.recent7DayVelocity > 0) {
    baseDailyRate = 0.4 * features.dailyDemandAvg + 0.6 * features.recent7DayVelocity;
  }

  // 3. Trend Factor & Velocity Momentum
  let trendMultiplier = 1.0;
  let demandTrend: DemandTrend = "STABLE";

  if (features.velocityTrendRatio > 1.25 || features.emergencyRequestRatio > 0.4) {
    demandTrend = "INCREASING";
    trendMultiplier = Math.min(1.45, 1.0 + (features.velocityTrendRatio - 1.0) * 0.5 + features.emergencyRequestRatio * 0.2);
  } else if (features.velocityTrendRatio < 0.75 && features.recent7DayVelocity < features.dailyDemandAvg) {
    demandTrend = "DECREASING";
    trendMultiplier = Math.max(0.70, features.velocityTrendRatio);
  }

  // 4. Component shelf-life & transfusion velocity dynamics
  let componentMultiplier = 1.0;
  if (componentType === "PLATELETS") {
    componentMultiplier = 1.2; // Higher turnover due to 5-day lifespan
  } else if (componentType === "RBC") {
    componentMultiplier = 1.1; // Core surgical & trauma requirement
  }

  // 5. Compute Forecasted Units
  const rawPredictedUnits = baseDailyRate * periodDays * trendMultiplier * componentMultiplier;
  // Ensure non-zero practical minimum for clinical contingency
  const predictedUnits = Math.max(1, Math.round(rawPredictedUnits + (features.activePendingRequestsUnits * 0.5)));

  // 6. Compute Statistical Confidence
  const sampleSize = Math.round(features.dailyDemandAvg * 30);
  const confidence = calculateForecastConfidence(sampleSize, features.velocityTrendRatio);

  return {
    state,
    district,
    bloodGroup,
    componentType,
    periodDays,
    predictedUnits,
    confidenceScore: confidence.score,
    demandTrend,
    historicalDailyAvg: features.dailyDemandAvg,
    dataQuality: confidence.dataQuality,
    modelVersion: "forecast-v1",
    generatedAt: new Date(),
  };
}
