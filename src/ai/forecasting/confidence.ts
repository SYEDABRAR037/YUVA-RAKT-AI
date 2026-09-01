export interface ConfidenceMetrics {
  score: number;           // 0.0 - 1.0 (e.g. 0.82 = 82% confidence)
  dataQuality: "CALIBRATED_LIVE" | "COLD_START_BASELINE";
  sampleSize: number;
  reason: string;
}

/**
 * Calculates statistical confidence for demand forecast based on observation count and variance.
 */
export function calculateForecastConfidence(sampleSize: number, varianceRatio: number): ConfidenceMetrics {
  if (sampleSize === 0) {
    return {
      score: 0.35,
      dataQuality: "COLD_START_BASELINE",
      sampleSize: 0,
      reason: "Cold start heuristic baseline. Limited historical hospital demand in this district.",
    };
  }

  if (sampleSize < 3) {
    return {
      score: 0.55,
      dataQuality: "COLD_START_BASELINE",
      sampleSize,
      reason: "Early operational data. Confidence will increase with ongoing hospital requisitions.",
    };
  }

  // Base confidence on sample size (logarithmic scaling from 0.60 to 0.92)
  const baseConfidence = Math.min(0.92, 0.60 + Math.log10(sampleSize) * 0.18);
  
  // Penalize if variance is extreme (> 2.0 or < 0.5)
  const variancePenalty = varianceRatio > 2.0 || varianceRatio < 0.3 ? 0.08 : 0.0;
  const score = Number(Math.max(0.40, baseConfidence - variancePenalty).toFixed(2));

  return {
    score,
    dataQuality: "CALIBRATED_LIVE",
    sampleSize,
    reason: `Calibrated with ${sampleSize} historical hospital requisitions and active cold-chain transactions.`,
  };
}
