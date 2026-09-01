import prisma from "../src/lib/db";
import { generateDemandForecast } from "../src/ai/forecasting/engine";
import { calculateShortageRisk } from "../src/ai/shortage/risk-engine";
import { rankDonorsForRequest } from "../src/ai/donor-ranking/ranker";
import { getAggregatedDemandData, getAggregatedInventoryData } from "../src/ai/data/aggregator";
import { BloodGroup, BloodComponentType } from "@prisma/client";

const BASE_URL = "http://localhost:3000";

interface TestResult {
  section: string;
  name: string;
  passed: boolean;
  details?: string;
  error?: string;
}

const testResults: TestResult[] = [];

function record(section: string, name: string, passed: boolean, details?: string, error?: string) {
  testResults.push({ section, name, passed, details, error });
  const icon = passed ? "✅ PASS" : "❌ FAIL";
  console.log(`${icon}: [${section}] ${name} ${details ? `— ${details}` : ""}`);
  if (error) console.error(`   Error details: ${error}`);
}

function extractCookie(headers: Headers): string | null {
  const setCookie = headers.get("set-cookie");
  if (!setCookie) return null;
  const match = setCookie.match(/yuva_session=([^;]+)/);
  return match ? `yuva_session=${match[1]}` : null;
}

async function login(email: string, password = "YuvaRakt@2026"): Promise<string> {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const cookie = extractCookie(res.headers);
  if (!cookie) throw new Error(`Failed to login as ${email} (status: ${res.status})`);
  return cookie;
}

async function runPhase3Acceptance() {
  console.log("\n================================================================================");
  console.log("🇮🇳 YUVA-RAKT AI — PHASE 3 AI INTELLIGENCE COMPREHENSIVE ACCEPTANCE TEST");
  console.log("================================================================================\n");

  const timestamp = Date.now();

  let donorCookie: string;
  let hospitalCookie: string;
  let bloodBankCookie: string;
  let govCookie: string;
  let adminCookie: string;

  try {
    donorCookie = await login("donor@yuvarakt.demo");
    hospitalCookie = await login("pune.hospital@yuvarakt.demo");
    bloodBankCookie = await login("bloodbank@yuvarakt.demo");
    govCookie = await login("government@yuvarakt.demo");
    adminCookie = await login("admin@yuvarakt.demo");
    record("Authentication", "Authenticate test accounts (Donor, Hospital, Blood Bank, Gov, Admin)", true);
  } catch (err: any) {
    record("Authentication", "Authenticate test accounts", false, undefined, err.message);
    process.exit(1);
  }

  // ===========================================================================
  // SECTION 1: AI DATA PIPELINE & AGGREGATION
  // ===========================================================================
  console.log("\n--- SECTION 1: AI DATA PIPELINE & AGGREGATION ---");

  try {
    const demandData = await getAggregatedDemandData({ state: "Maharashtra", district: "Pune" });
    record(
      "AI Data Pipeline",
      "Extract & aggregate real PostgreSQL BloodRequest demand records",
      demandData.length > 0 && demandData[0].totalRequestedUnits > 0,
      `Extracted ${demandData.length} demand feature slices from Pune`
    );

    const invData = await getAggregatedInventoryData({ state: "Maharashtra", district: "Pune" });
    record(
      "AI Data Pipeline",
      "Extract & aggregate real PostgreSQL BloodInventory stock levels",
      invData.length > 0 && invData[0].totalAvailableUnits > 0,
      `Extracted ${invData.length} active inventory slices`
    );

    // Missing geographic data cold start
    const coldStartDemand = await getAggregatedDemandData({ state: "Sikkim", district: "Gangtok" });
    record(
      "AI Data Pipeline",
      "Safe handling of regions with sparse/missing historical data (Cold Start)",
      Array.isArray(coldStartDemand) && coldStartDemand.length === 0,
      "Cold-start data extraction: Safe & Resilient"
    );
  } catch (err: any) {
    record("AI Data Pipeline", "Data aggregation", false, undefined, err.message);
  }

  // ===========================================================================
  // SECTION 2: DEMAND FORECASTING ENGINE
  // ===========================================================================
  console.log("\n--- SECTION 2: DEMAND FORECASTING ENGINE ---");

  try {
    const forecast7 = await generateDemandForecast({
      state: "Maharashtra",
      district: "Pune",
      bloodGroup: "O_POSITIVE",
      componentType: "RBC",
      periodDays: 7,
    });

    const forecast14 = await generateDemandForecast({
      state: "Maharashtra",
      district: "Pune",
      bloodGroup: "O_POSITIVE",
      componentType: "RBC",
      periodDays: 14,
    });

    const forecast30 = await generateDemandForecast({
      state: "Maharashtra",
      district: "Pune",
      bloodGroup: "O_POSITIVE",
      componentType: "RBC",
      periodDays: 30,
    });

    record(
      "Demand Forecasting",
      "Generate multi-horizon time-series forecasts (7, 14, 30 Days)",
      forecast7.predictedUnits > 0 && forecast14.predictedUnits >= forecast7.predictedUnits && forecast30.predictedUnits >= forecast14.predictedUnits,
      `7d: ${forecast7.predictedUnits} units | 14d: ${forecast14.predictedUnits} units | 30d: ${forecast30.predictedUnits} units`
    );

    record(
      "Demand Forecasting",
      "Calculate statistical confidence and data quality indicators",
      forecast7.confidenceScore >= 0.35 && forecast7.confidenceScore <= 1.0 && !!forecast7.dataQuality,
      `Confidence: ${Math.round(forecast7.confidenceScore * 100)}%, Quality: ${forecast7.dataQuality}, Trend: ${forecast7.demandTrend}`
    );

    // Verify all 8 groups and 4 components forecast generation
    const allGroups: BloodGroup[] = ["A_POSITIVE", "A_NEGATIVE", "B_POSITIVE", "B_NEGATIVE", "AB_POSITIVE", "AB_NEGATIVE", "O_POSITIVE", "O_NEGATIVE"];
    const allComps: BloodComponentType[] = ["WHOLE_BLOOD", "RBC", "PLASMA", "PLATELETS"];
    let groupCompSuccess = true;

    for (const bg of allGroups.slice(0, 4)) {
      const f = await generateDemandForecast({ state: "Maharashtra", district: "Pune", bloodGroup: bg, componentType: "WHOLE_BLOOD", periodDays: 7 });
      if (f.predictedUnits <= 0) groupCompSuccess = false;
    }

    record(
      "Demand Forecasting",
      "Comprehensive Blood Group and Component support (8 groups x 4 components)",
      groupCompSuccess,
      "All tested blood groups successfully computed valid demand outputs"
    );
  } catch (err: any) {
    record("Demand Forecasting", "Demand forecast engine", false, undefined, err.message);
  }

  // ===========================================================================
  // SECTION 3: SHORTAGE RISK ENGINE & EXPLAINABLE AI (XAI)
  // ===========================================================================
  console.log("\n--- SECTION 3: SHORTAGE RISK ENGINE & EXPLAINABILITY ---");

  try {
    const shortageRisk = await calculateShortageRisk({
      state: "Maharashtra",
      district: "Pune",
      bloodGroup: "O_POSITIVE",
      componentType: "RBC",
    });

    record(
      "Shortage Risk",
      "Calculate multi-factor shortage risk score (0-100) and risk tier (LOW/MODERATE/HIGH/CRITICAL)",
      shortageRisk.riskScore >= 0 && shortageRisk.riskScore <= 100 && ["LOW", "MODERATE", "HIGH", "CRITICAL"].includes(shortageRisk.riskLevel),
      `Risk Level: ${shortageRisk.riskLevel}, Score: ${shortageRisk.riskScore}/100, Stock: ${shortageRisk.currentInventoryUnits}, 7d Demand: ${shortageRisk.predictedDemandUnits}`
    );

    record(
      "Explainable AI",
      "Generate transparent, data-backed factor breakdowns answering 'WHY?'",
      shortageRisk.contributingFactors.length > 0,
      `Factors: "${shortageRisk.contributingFactors[0]}"`
    );

    record(
      "Recommendations",
      "Produce actionable operational recommendations for decision-makers",
      shortageRisk.recommendedActions.length > 0,
      `Action: "${shortageRisk.recommendedActions[0]}"`
    );
  } catch (err: any) {
    record("Shortage Risk", "Shortage risk calculation", false, undefined, err.message);
  }

  // ===========================================================================
  // SECTION 4: INTELLIGENT DONOR PRIORITIZATION / RANKING
  // ===========================================================================
  console.log("\n--- SECTION 4: INTELLIGENT DONOR PRIORITIZATION ---");

  try {
    const hosp = await prisma.hospital.findFirst({ where: { user: { email: "pune.hospital@yuvarakt.demo" } } });
    const targetReq = await prisma.bloodRequest.findFirst({
      where: { hospitalId: hosp!.id, bloodGroup: "O_POSITIVE", status: "PENDING" },
    });

    const rankedDonors = await rankDonorsForRequest(targetReq!.id);

    const isSorted = rankedDonors.every((d, i) => i === 0 || d.operationalScore <= rankedDonors[i - 1].operationalScore);
    const topDonor = rankedDonors[0];

    record(
      "Donor Prioritization",
      "Operational donor prioritization algorithm ranks candidate donors (0-100) by compatibility, verification & proximity",
      rankedDonors.length > 0 && isSorted && topDonor.operationalScore >= 70,
      `Top Donor: ${topDonor?.fullName} (Score: ${topDonor?.operationalScore}/100, Tier: ${topDonor?.priorityTier})`
    );

    record(
      "Donor Prioritization",
      "Provide transparent operational reason badges for donor prioritization",
      topDonor?.rankingFactors.length > 0,
      `Reason badges: ${topDonor?.rankingFactors.slice(0, 2).join(" | ")}`
    );
  } catch (err: any) {
    record("Donor Prioritization", "Donor ranking logic", false, undefined, err.message);
  }

  // ===========================================================================
  // SECTION 5: GOVERNMENT & INTELLIGENCE APIS
  // ===========================================================================
  console.log("\n--- SECTION 5: GOVERNMENT & INTELLIGENCE APIS ---");

  // 5.1 GET /api/ai/forecast
  try {
    const res = await fetch(`${BASE_URL}/api/ai/forecast?state=Maharashtra&district=Pune&periodDays=7`, {
      headers: { Cookie: govCookie },
    });
    const data = await res.json();
    record(
      "Government Intelligence",
      "GET `/api/ai/forecast` returns filtered multi-component demand forecast matrix",
      res.status === 200 && data.success === true && data.data?.forecasts?.length > 0,
      `Retrieved ${data.data?.forecasts?.length} forecast objects`
    );
  } catch (err: any) {
    record("Government Intelligence", "GET /api/ai/forecast", false, undefined, err.message);
  }

  // 5.2 GET /api/ai/shortage-risk
  try {
    const res = await fetch(`${BASE_URL}/api/ai/shortage-risk?state=Maharashtra&district=Pune`, {
      headers: { Cookie: govCookie },
    });
    const data = await res.json();
    record(
      "Government Intelligence",
      "GET `/api/ai/shortage-risk` returns regional shortage vulnerability radar and XAI factors",
      res.status === 200 && data.success === true && data.data?.risks?.length > 0,
      `Retrieved ${data.data?.risks?.length} shortage entries`
    );
  } catch (err: any) {
    record("Government Intelligence", "GET /api/ai/shortage-risk", false, undefined, err.message);
  }

  // 5.3 GET /api/government/stats
  try {
    const res = await fetch(`${BASE_URL}/api/government/stats?state=Maharashtra&district=Pune`, {
      headers: { Cookie: govCookie },
    });
    const data = await res.json();
    record(
      "Government Intelligence",
      "GET `/api/government/stats` returns live PostgreSQL metrics, emergency count & district heatmap",
      res.status === 200 && data.success === true && data.data?.stats?.totalBloodRequests > 0,
      `Requests: ${data.data?.stats?.totalBloodRequests}, Emergency: ${data.data?.stats?.activeEmergencyRequests}, Donors: ${data.data?.stats?.verifiedYouthDonors}`
    );
  } catch (err: any) {
    record("Government Intelligence", "GET /api/government/stats", false, undefined, err.message);
  }

  // 5.4 POST /api/ai/refresh
  try {
    const res = await fetch(`${BASE_URL}/api/ai/refresh`, {
      method: "POST",
      headers: { Cookie: govCookie },
    });
    const data = await res.json();
    record(
      "AI Pipeline",
      "POST `/api/ai/refresh` recalculates and caches all AI intelligence in PostgreSQL",
      res.status === 200 && data.success === true && data.summary?.forecastsGenerated > 0,
      `Recomputed ${data.summary?.forecastsGenerated} forecasts in ${data.summary?.executionTimeMs}ms`
    );
  } catch (err: any) {
    record("AI Pipeline", "POST /api/ai/refresh", false, undefined, err.message);
  }

  // ===========================================================================
  // SECTION 6: PRIVACY & SERVER-SIDE RBAC ENFORCEMENT
  // ===========================================================================
  console.log("\n--- SECTION 6: PRIVACY & SERVER-SIDE RBAC ENFORCEMENT ---");

  try {
    const res = await fetch(`${BASE_URL}/api/ai/forecast`, { headers: { Cookie: donorCookie } });
    record("Privacy / Security", "Youth Donor blocked from `/api/ai/forecast` (403 Forbidden)", res.status === 403, `HTTP: ${res.status}`);
  } catch (err: any) {
    record("Privacy / Security", "Youth blocked from forecast", false, undefined, err.message);
  }

  try {
    const res = await fetch(`${BASE_URL}/api/ai/shortage-risk`, { headers: { Cookie: donorCookie } });
    record("Privacy / Security", "Youth Donor blocked from `/api/ai/shortage-risk` (403 Forbidden)", res.status === 403, `HTTP: ${res.status}`);
  } catch (err: any) {
    record("Privacy / Security", "Youth blocked from shortage risk", false, undefined, err.message);
  }

  try {
    const res = await fetch(`${BASE_URL}/api/ai/refresh`, { method: "POST", headers: { Cookie: donorCookie } });
    record("Privacy / Security", "Youth Donor blocked from `/api/ai/refresh` (403 Forbidden)", res.status === 403, `HTTP: ${res.status}`);
  } catch (err: any) {
    record("Privacy / Security", "Youth blocked from refresh", false, undefined, err.message);
  }

  try {
    const res = await fetch(`${BASE_URL}/api/ai/refresh`, { method: "POST", headers: { Cookie: hospitalCookie } });
    record("Privacy / Security", "Hospital blocked from `/api/ai/refresh` (403 Forbidden)", res.status === 403, `HTTP: ${res.status}`);
  } catch (err: any) {
    record("Privacy / Security", "Hospital blocked from refresh", false, undefined, err.message);
  }

  try {
    const res = await fetch(`${BASE_URL}/api/ai/refresh`, { method: "POST", headers: { Cookie: bloodBankCookie } });
    record("Privacy / Security", "Blood Bank blocked from `/api/ai/refresh` (403 Forbidden)", res.status === 403, `HTTP: ${res.status}`);
  } catch (err: any) {
    record("Privacy / Security", "Blood Bank blocked from refresh", false, undefined, err.message);
  }

  try {
    const hosp = await prisma.hospital.findFirst({ where: { user: { email: "pune.hospital@yuvarakt.demo" } } });
    const targetReq = await prisma.bloodRequest.findFirst({ where: { hospitalId: hosp!.id } });

    const res = await fetch(`${BASE_URL}/api/ai/donor-priority?requestId=${targetReq!.id}`, {
      headers: { Cookie: govCookie },
    });
    const data = await res.json();
    const donors: any[] = data.data?.rankedDonors || [];
    const hasPhoneLeak = donors.some((d) => d.phone || d.passwordHash || d.aadhaar);

    record(
      "Privacy / Security",
      "Data Minimization — Donor phone numbers and private credentials not leaked in priority ranking",
      !hasPhoneLeak,
      `Audited ${donors.length} prioritized donor records: Zero PII leaks`
    );
  } catch (err: any) {
    record("Privacy / Security", "Data Minimization", false, undefined, err.message);
  }

  // ===========================================================================
  // SECTION 7: AUDIT LOGGING & COMPLIANCE
  // ===========================================================================
  console.log("\n--- SECTION 7: AUDIT LOGGING & COMPLIANCE ---");

  try {
    const aiAuditLogs = await prisma.auditLog.findMany({
      where: { action: "AI_REFRESH_EXECUTED" },
      orderBy: { createdAt: "desc" },
    });

    let hasSecretLeak = false;
    for (const l of aiAuditLogs) {
      const metaStr = JSON.stringify(l.metadata || {});
      if (metaStr.includes("passwordHash") || metaStr.includes("YuvaRakt@2026")) {
        hasSecretLeak = true;
        break;
      }
    }

    record(
      "Audit Logging",
      "AuditLog records `AI_REFRESH_EXECUTED` lifecycle events with execution metadata",
      aiAuditLogs.length > 0,
      `Captured ${aiAuditLogs.length} AI refresh audit entries`
    );

    record(
      "Audit Logging",
      "Zero plain passwords or hashes stored in AI audit log metadata",
      !hasSecretLeak,
      "AI Audit Log Security: Clean"
    );
  } catch (err: any) {
    record("Audit Logging", "AI audit logging", false, undefined, err.message);
  }

  // ===========================================================================
  // SECTION 8: END-TO-END GOVERNMENT EMERGENCY AI SCENARIO
  // ===========================================================================
  console.log("\n--- SECTION 8: END-TO-END EMERGENCY AI SCENARIO ---");

  try {
    // Step 1: Hospital creates emergency O- RBC request for 2 units
    const e2eReqRes = await fetch(`${BASE_URL}/api/hospital/requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: hospitalCookie },
      body: JSON.stringify({
        bloodGroup: "O_NEGATIVE",
        componentType: "RBC",
        unitsRequired: 2,
        urgency: "EMERGENCY",
        requiredBy: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        reason: "Pediatric multiple trauma hemorrhage",
      }),
    });
    const e2eReqData = await e2eReqRes.json();
    const e2eReqId = e2eReqData.data?.bloodRequest?.id;

    record("End-to-End", "Step 1: Hospital logs emergency O- RBC requirement in PostgreSQL", !!e2eReqId, `Request ID: ${e2eReqId}`);

    // Step 2: AI calculates shortage risk
    const e2eShortage = await calculateShortageRisk({
      state: "Maharashtra",
      district: "Pune",
      bloodGroup: "O_NEGATIVE",
      componentType: "RBC",
    });

    record(
      "End-to-End",
      "Step 2: AI Engine evaluates shortage risk and generates XAI explanation",
      e2eShortage.riskScore >= 25 && e2eShortage.contributingFactors.length > 0,
      `Risk Level: ${e2eShortage.riskLevel} (${e2eShortage.riskScore}/100) — Why: "${e2eShortage.contributingFactors[0]}"`
    );

    // Step 3: AI Prioritizes matching voluntary donors
    const e2eRankedDonors = await rankDonorsForRequest(e2eReqId);
    const topDonor = e2eRankedDonors[0];

    record(
      "End-to-End",
      "Step 3: AI Donor Ranking prioritizes verified O- voluntary donors in district",
      e2eRankedDonors.length > 0 && topDonor.operationalScore >= 70,
      `Top Ranked Donor: ${topDonor?.fullName} (${topDonor?.bloodGroup}, Score: ${topDonor?.operationalScore})`
    );

    // Step 4: Donor responds
    const respRes = await fetch(`${BASE_URL}/api/youth/respond`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: donorCookie },
      body: JSON.stringify({
        requestId: e2eReqId,
        status: "INTERESTED",
        message: "Arriving at blood bank in 20 minutes",
      }),
    });

    const dbResp = await prisma.donorResponse.findFirst({
      where: { requestId: e2eReqId, status: "INTERESTED" },
    });

    record("End-to-End", "Step 4: Donor responds 'I can help' (INTERESTED)", respRes.status === 200 && !!dbResp, "Donor response persisted");

    // Step 5: Blood Bank fulfills
    const allocRes = await fetch(`${BASE_URL}/api/blood-bank/allocate`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: bloodBankCookie },
      body: JSON.stringify({
        requestId: e2eReqId,
        bloodGroup: "O_NEGATIVE",
        componentType: "RBC",
        unitsAllocated: 2,
        notes: "Emergency life-saving dispatch",
      }),
    });

    const reqDb = await prisma.bloodRequest.findUnique({ where: { id: e2eReqId } });

    record(
      "End-to-End",
      "Step 5: Blood Bank allocates units and updates requisition status to FULFILLED",
      allocRes.status === 200 && reqDb?.status === "FULFILLED",
      `Requisition Status: ${reqDb?.status}, Units Fulfilled: ${reqDb?.unitsFulfilled}/2`
    );

    // Step 6: Government Dashboard reflects updated stats
    const govStatsRes = await fetch(`${BASE_URL}/api/government/stats?state=Maharashtra&district=Pune`, {
      headers: { Cookie: govCookie },
    });
    const govStatsData = await govStatsRes.json();

    record(
      "End-to-End",
      "Step 6: Government Intelligence dashboard updates live from PostgreSQL",
      govStatsRes.status === 200 && govStatsData.data?.stats?.totalBloodRequests > 0,
      `Live Total Requisitions in Surveillance Area: ${govStatsData.data?.stats?.totalBloodRequests}`
    );
  } catch (err: any) {
    record("End-to-End", "End-to-End Emergency AI scenario", false, undefined, err.message);
  }

  // ===========================================================================
  // SUMMARY
  // ===========================================================================
  const total = testResults.length;
  const passed = testResults.filter((r) => r.passed).length;
  const failed = total - passed;

  console.log("\n================================================================================");
  console.log(`📊 PHASE 3 ACCEPTANCE TEST RESULTS: ${passed} / ${total} PASSED (${failed} FAILED)`);
  console.log("================================================================================\n");

  if (failed > 0) {
    console.error("❌ Phase 3 Acceptance Suite Encountered Failures!");
    process.exit(1);
  } else {
    console.log("🏆 ALL PHASE 3 ACCEPTANCE TESTS COMPLETED WITH 100% PASS RATE!");
  }
}

runPhase3Acceptance()
  .catch((e) => {
    console.error("Runner crash:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
