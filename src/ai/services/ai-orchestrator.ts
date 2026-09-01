import prisma from "@/lib/db";
import { BloodGroup, BloodComponentType } from "@prisma/client";
import { generateDemandForecast } from "../forecasting/engine";
import { calculateShortageRisk } from "../shortage/risk-engine";
import { logAuditEvent } from "@/lib/services/audit.service";

const ALL_BLOOD_GROUPS: BloodGroup[] = [
  "A_POSITIVE", "A_NEGATIVE",
  "B_POSITIVE", "B_NEGATIVE",
  "AB_POSITIVE", "AB_NEGATIVE",
  "O_POSITIVE", "O_NEGATIVE",
];

const ALL_COMPONENTS: BloodComponentType[] = [
  "WHOLE_BLOOD", "RBC", "PLASMA", "PLATELETS",
];

export interface AIRefreshSummary {
  forecastsGenerated: number;
  shortageRisksCalculated: number;
  criticalRisksCount: number;
  insightsGenerated: number;
  districtsCovered: string[];
  executionTimeMs: number;
}

/**
 * Orchestrates end-to-end AI calculations, caches them in PostgreSQL, and creates insight alerts.
 */
export async function refreshAllAIIntelligence(userId?: string): Promise<AIRefreshSummary> {
  const startTime = Date.now();

  // 1. Discover all unique State + District pairs in the system
  const [hospitals, bloodBanks] = await Promise.all([
    prisma.hospital.findMany({ select: { state: true, district: true }, distinct: ["state", "district"] }),
    prisma.bloodBank.findMany({ select: { state: true, district: true }, distinct: ["state", "district"] }),
  ]);

  const districtSet = new Set<string>();
  const regions: { state: string; district: string }[] = [];

  for (const h of hospitals) {
    const key = `${h.state}::${h.district}`;
    if (!districtSet.has(key)) {
      districtSet.add(key);
      regions.push({ state: h.state, district: h.district });
    }
  }

  for (const b of bloodBanks) {
    const key = `${b.state}::${b.district}`;
    if (!districtSet.has(key)) {
      districtSet.add(key);
      regions.push({ state: b.state, district: b.district });
    }
  }

  // If no regions found, default to demo region (Maharashtra, Pune)
  if (regions.length === 0) {
    regions.push({ state: "Maharashtra", district: "Pune" });
  }

  let forecastsCount = 0;
  let shortageCount = 0;
  let criticalCount = 0;

  // Clear previous transient insights
  await prisma.aIInsight.deleteMany();

  // 2. Iterate through regions, blood groups, and components
  for (const region of regions) {
    for (const bg of ALL_BLOOD_GROUPS) {
      for (const comp of ALL_COMPONENTS) {
        // A. Forecast for 7, 14, 30 days
        for (const period of [7, 14, 30]) {
          const forecast = await generateDemandForecast({
            state: region.state,
            district: region.district,
            bloodGroup: bg,
            componentType: comp,
            periodDays: period,
          });

          await prisma.demandForecast.upsert({
            where: {
              state_district_bloodGroup_componentType_periodDays: {
                state: region.state,
                district: region.district,
                bloodGroup: bg,
                componentType: comp,
                periodDays: period,
              },
            },
            update: {
              predictedUnits: forecast.predictedUnits,
              confidenceScore: forecast.confidenceScore,
              demandTrend: forecast.demandTrend,
              historicalDailyAvg: forecast.historicalDailyAvg,
              dataQuality: forecast.dataQuality,
              modelVersion: forecast.modelVersion,
              generatedAt: forecast.generatedAt,
            },
            create: {
              state: region.state,
              district: region.district,
              bloodGroup: bg,
              componentType: comp,
              periodDays: period,
              predictedUnits: forecast.predictedUnits,
              confidenceScore: forecast.confidenceScore,
              demandTrend: forecast.demandTrend,
              historicalDailyAvg: forecast.historicalDailyAvg,
              dataQuality: forecast.dataQuality,
              modelVersion: forecast.modelVersion,
              generatedAt: forecast.generatedAt,
            },
          });

          forecastsCount++;
        }

        // B. Calculate Shortage Risk
        const risk = await calculateShortageRisk({
          state: region.state,
          district: region.district,
          bloodGroup: bg,
          componentType: comp,
        });

        if (risk.riskLevel === "CRITICAL") criticalCount++;

        await prisma.shortageRisk.upsert({
          where: {
            state_district_bloodGroup_componentType: {
              state: region.state,
              district: region.district,
              bloodGroup: bg,
              componentType: comp,
            },
          },
          update: {
            riskLevel: risk.riskLevel,
            riskScore: risk.riskScore,
            currentInventoryUnits: risk.currentInventoryUnits,
            predictedDemandUnits: risk.predictedDemandUnits,
            expiringUnits: risk.expiringUnits,
            activeEmergencyRequests: risk.activeEmergencyRequests,
            contributingFactors: risk.contributingFactors,
            recommendedActions: risk.recommendedActions,
            modelVersion: risk.modelVersion,
            generatedAt: risk.generatedAt,
          },
          create: {
            state: region.state,
            district: region.district,
            bloodGroup: bg,
            componentType: comp,
            riskLevel: risk.riskLevel,
            riskScore: risk.riskScore,
            currentInventoryUnits: risk.currentInventoryUnits,
            predictedDemandUnits: risk.predictedDemandUnits,
            expiringUnits: risk.expiringUnits,
            activeEmergencyRequests: risk.activeEmergencyRequests,
            contributingFactors: risk.contributingFactors,
            recommendedActions: risk.recommendedActions,
            modelVersion: risk.modelVersion,
            generatedAt: risk.generatedAt,
          },
        });

        shortageCount++;

        // C. Generate AI Insight Cards for Notable Events
        const bgLabel = bg.replace("_POSITIVE", "+").replace("_NEGATIVE", "-");
        if (risk.riskLevel === "CRITICAL") {
          await prisma.aIInsight.create({
            data: {
              type: "SHORTAGE_ALERT",
              title: `Critical ${bgLabel} ${comp} Shortage Risk in ${region.district}`,
              message: `Available stock (${risk.currentInventoryUnits} units) is severely below 7-day projected clinical demand (${risk.predictedDemandUnits} units). Recommended action: Mobilize voluntary youth donors.`,
              severity: "CRITICAL",
              state: region.state,
              district: region.district,
              bloodGroup: bg,
              componentType: comp,
              metadata: { riskScore: risk.riskScore },
            },
          });
        } else if (risk.expiringUnits > 0) {
          await prisma.aIInsight.create({
            data: {
              type: "EXPIRY_RISK",
              title: `${risk.expiringUnits} Units of ${bgLabel} ${comp} Approaching Expiry in ${region.district}`,
              message: `Shelf-life threshold reached. Execute FIFO dispatch to avoid clinical wastage.`,
              severity: "WARNING",
              state: region.state,
              district: region.district,
              bloodGroup: bg,
              componentType: comp,
              metadata: { expiringUnits: risk.expiringUnits },
            },
          });
        }
      }
    }
  }

  const insightsCount = await prisma.aIInsight.count();
  const executionTimeMs = Date.now() - startTime;

  // Log Audit Event
  await logAuditEvent({
    userId: userId || null,
    action: "AI_REFRESH_EXECUTED",
    entityType: "AI_SYSTEM",
    metadata: {
      forecastsGenerated: forecastsCount,
      shortageRisksCalculated: shortageCount,
      criticalRisksCount: criticalCount,
      districts: regions.map((r) => r.district),
      executionTimeMs,
    },
  });

  return {
    forecastsGenerated: forecastsCount,
    shortageRisksCalculated: shortageCount,
    criticalRisksCount: criticalCount,
    insightsGenerated: insightsCount,
    districtsCovered: regions.map((r) => r.district),
    executionTimeMs,
  };
}
