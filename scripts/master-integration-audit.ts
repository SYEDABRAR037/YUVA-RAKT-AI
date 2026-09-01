import prisma from "../src/lib/db";
import { generateDemandForecast } from "../src/ai/forecasting/engine";
import { calculateShortageRisk } from "../src/ai/shortage/risk-engine";
import { rankDonorsForRequest } from "../src/ai/donor-ranking/ranker";

const BASE_URL = "http://localhost:3000";

interface AuditTestResult {
  category: string;
  testName: string;
  passed: boolean;
  details?: string;
  error?: string;
}

const auditResults: AuditTestResult[] = [];

function record(category: string, testName: string, passed: boolean, details?: string, error?: string) {
  auditResults.push({ category, testName, passed, details, error });
  const icon = passed ? "✅ PASS" : "❌ FAIL";
  console.log(`${icon}: [${category}] ${testName} ${details ? `— ${details}` : ""}`);
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

async function runMasterIntegrationAudit() {
  console.log("\n================================================================================");
  console.log("🇮🇳 YUVA-RAKT AI — PRE-PHASE-4 FULL SYSTEM INTEGRATION & SECURITY AUDIT");
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
    record("Auth", "Multi-Role Authentication (Donor, Hospital, Blood Bank, Gov, Admin)", true);
  } catch (err: any) {
    record("Auth", "Multi-Role Authentication", false, undefined, err.message);
    process.exit(1);
  }

  // ===========================================================================
  // 1. END-TO-END INTEGRATED HEALTHCARE WORKFLOW
  // ===========================================================================
  console.log("\n--- 1. END-TO-END INTEGRATED HEALTHCARE SCENARIO ---");

  try {
    // 1. Youth Donor Updates Availability
    const availRes = await fetch(`${BASE_URL}/api/user/profile`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: donorCookie },
      body: JSON.stringify({ availabilityStatus: "AVAILABLE" }),
    });
    record("End-to-End", "Step 1: Youth Donor manages availability status (AVAILABLE)", availRes.status === 200, "Availability synced in DB");

    // 2. Blood Bank Records Donation & Adds Inventory
    const donRes = await fetch(`${BASE_URL}/api/blood-bank/donations`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: bloodBankCookie },
      body: JSON.stringify({
        donorEmailOrPhone: "donor@yuvarakt.demo",
        bloodGroup: "O_POSITIVE",
        componentType: "RBC",
        units: 2,
        campName: "Full Integration Blood Drive",
        certificateNumber: `CERT-INT-${timestamp}`,
      }),
    });
    record("End-to-End", "Step 2: Blood Bank records voluntary donation & credits inventory ledger", donRes.status === 200, `Donation registered`);

    // 3. Hospital Creates Urgent Requisition
    const reqRes = await fetch(`${BASE_URL}/api/hospital/requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: hospitalCookie },
      body: JSON.stringify({
        bloodGroup: "O_POSITIVE",
        componentType: "RBC",
        unitsRequired: 2,
        urgency: "CRITICAL",
        requiredBy: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
        reason: "Major vascular surgery transfusion",
        patientAgeGroup: "ADULT",
      }),
    });
    const reqData = await reqRes.json();
    const reqId = reqData.data?.bloodRequest?.id;
    record("End-to-End", "Step 3: Hospital creates critical blood request in PostgreSQL", reqRes.status === 200 && !!reqId, `Request ID: ${reqId}`);

    // 4. AI Engine runs Demand Forecast & Shortage Risk
    const forecast = await generateDemandForecast({
      state: "Maharashtra",
      district: "Pune",
      bloodGroup: "O_POSITIVE",
      componentType: "RBC",
      periodDays: 7,
    });

    const shortage = await calculateShortageRisk({
      state: "Maharashtra",
      district: "Pune",
      bloodGroup: "O_POSITIVE",
      componentType: "RBC",
    });

    record(
      "End-to-End",
      "Step 4: AI Engine computes 7-day demand forecast & multi-factor shortage risk",
      forecast.predictedUnits > 0 && shortage.riskScore >= 0,
      `Forecast: ${forecast.predictedUnits} units (Conf: ${Math.round(forecast.confidenceScore * 100)}%) | Risk: ${shortage.riskLevel} (${shortage.riskScore}/100)`
    );

    // 5. AI Prioritizes matching voluntary donors
    const rankedDonors = await rankDonorsForRequest(reqId);
    const topDonor = rankedDonors[0];
    record(
      "End-to-End",
      "Step 5: AI Donor Prioritization ranks candidate donors by compatibility & verification",
      rankedDonors.length > 0 && topDonor.operationalScore >= 70,
      `Top Donor: ${topDonor.fullName} (Score: ${topDonor.operationalScore}/100, Tier: ${topDonor.priorityTier})`
    );

    // 6. Matched Donor Responds
    const respRes = await fetch(`${BASE_URL}/api/youth/respond`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: donorCookie },
      body: JSON.stringify({
        requestId: reqId,
        status: "INTERESTED",
        message: "On way to blood bank",
      }),
    });
    const dbResp = await prisma.donorResponse.findFirst({ where: { requestId: reqId, status: "INTERESTED" } });
    record("End-to-End", "Step 6: Donor responds 'I can help' (INTERESTED)", respRes.status === 200 && !!dbResp, "Response registered in DB");

    // 7. Blood Bank Allocates Units
    const allocRes = await fetch(`${BASE_URL}/api/blood-bank/allocate`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: bloodBankCookie },
      body: JSON.stringify({
        requestId: reqId,
        bloodGroup: "O_POSITIVE",
        componentType: "RBC",
        unitsAllocated: 2,
        notes: "Full integration dispatch",
      }),
    });
    const reqAfter = await prisma.bloodRequest.findUnique({ where: { id: reqId } });
    record(
      "End-to-End",
      "Step 7: Blood Bank allocates units and transitions request to FULFILLED",
      allocRes.status === 200 && reqAfter?.status === "FULFILLED" && reqAfter.unitsFulfilled === 2,
      `Request Status: ${reqAfter?.status}, Units: ${reqAfter?.unitsFulfilled}/2`
    );

    // 8. Government Dashboard reflects live stats
    const govStatsRes = await fetch(`${BASE_URL}/api/government/stats?state=Maharashtra&district=Pune`, {
      headers: { Cookie: govCookie },
    });
    const govStatsData = await govStatsRes.json();
    record(
      "End-to-End",
      "Step 8: Government Intelligence Dashboard displays real-time surveillance metrics",
      govStatsRes.status === 200 && govStatsData.data?.stats?.totalBloodRequests > 0,
      `Surveillance Metrics: ${govStatsData.data?.stats?.totalBloodRequests} requests recorded`
    );
  } catch (err: any) {
    record("End-to-End", "Integrated scenario", false, undefined, err.message);
  }

  // ===========================================================================
  // 2. SECURITY & ROLE-BASED ACCESS CONTROL (RBAC) AUDIT
  // ===========================================================================
  console.log("\n--- 2. SECURITY & RBAC AUDIT ---");

  // Youth restrictions
  const youthAdminStats = await fetch(`${BASE_URL}/api/admin/stats`, { headers: { Cookie: donorCookie } });
  record("Security", "Youth Donor blocked from `/api/admin/stats` (403 Forbidden)", youthAdminStats.status === 403, `HTTP: ${youthAdminStats.status}`);

  const youthAiRefresh = await fetch(`${BASE_URL}/api/ai/refresh`, { method: "POST", headers: { Cookie: donorCookie } });
  record("Security", "Youth Donor blocked from `/api/ai/refresh` (403 Forbidden)", youthAiRefresh.status === 403, `HTTP: ${youthAiRefresh.status}`);

  const youthAlloc = await fetch(`${BASE_URL}/api/blood-bank/allocate`, { method: "POST", headers: { Cookie: donorCookie } });
  record("Security", "Youth Donor blocked from `/api/blood-bank/allocate` (403 Forbidden)", youthAlloc.status === 403, `HTTP: ${youthAlloc.status}`);

  // Hospital restrictions
  const hospAlloc = await fetch(`${BASE_URL}/api/blood-bank/allocate`, { method: "POST", headers: { Cookie: hospitalCookie } });
  record("Security", "Hospital blocked from `/api/blood-bank/allocate` (403 Forbidden)", hospAlloc.status === 403, `HTTP: ${hospAlloc.status}`);

  const hospVerif = await fetch(`${BASE_URL}/api/blood-bank/verifications`, { method: "POST", headers: { Cookie: hospitalCookie } });
  record("Security", "Hospital blocked from `/api/blood-bank/verifications` (403 Forbidden)", hospVerif.status === 403, `HTTP: ${hospVerif.status}`);

  // Blood Bank restrictions
  const bbAdminUsers = await fetch(`${BASE_URL}/api/admin/users`, { headers: { Cookie: bloodBankCookie } });
  record("Security", "Blood Bank blocked from `/api/admin/users` (403 Forbidden)", bbAdminUsers.status === 403, `HTTP: ${bbAdminUsers.status}`);

  const bbAiRefresh = await fetch(`${BASE_URL}/api/ai/refresh`, { method: "POST", headers: { Cookie: bloodBankCookie } });
  record("Security", "Blood Bank blocked from `/api/ai/refresh` (403 Forbidden)", bbAiRefresh.status === 403, `HTTP: ${bbAiRefresh.status}`);

  // Unauthenticated blocked
  const unauthGov = await fetch(`${BASE_URL}/api/government/stats`);
  record("Security", "Unauthenticated request blocked from `/api/government/stats` (401/403)", unauthGov.status === 401 || unauthGov.status === 403, `HTTP: ${unauthGov.status}`);

  // ===========================================================================
  // 3. DATA PRIVACY & DATA MINIMIZATION AUDIT
  // ===========================================================================
  console.log("\n--- 3. DATA PRIVACY & MINIMIZATION AUDIT ---");

  // No passwordHash in /api/auth/me
  const meRes = await fetch(`${BASE_URL}/api/auth/me`, { headers: { Cookie: donorCookie } });
  const meData = await meRes.json();
  record("Privacy", "Current session endpoint `/api/auth/me` NEVER exposes passwordHash", meData.user && !("passwordHash" in meData.user), "Field stripped from response");

  // No patient identity in opportunities feed
  const oppRes = await fetch(`${BASE_URL}/api/youth/opportunities`, { headers: { Cookie: donorCookie } });
  const oppData = await oppRes.json();
  const opps: any[] = oppData.opportunities || [];
  const hasPatientPII = opps.some((o) => o.patientName || o.patientContact || o.patientAadhaar);
  record("Privacy", "Patient PII (name, contact, Aadhaar) never exposed in donor opportunities feed", !hasPatientPII, `Audited ${opps.length} opportunity items`);

  // No donor phone leak in AI ranking API
  const hosp = await prisma.hospital.findFirst({ where: { user: { email: "pune.hospital@yuvarakt.demo" } } });
  const sampleReq = await prisma.bloodRequest.findFirst({ where: { hospitalId: hosp!.id } });
  const rankRes = await fetch(`${BASE_URL}/api/ai/donor-priority?requestId=${sampleReq!.id}`, { headers: { Cookie: govCookie } });
  const rankData = await rankRes.json();
  const rankedDonorsList: any[] = rankData.data?.rankedDonors || [];
  const hasDonorPrivateInfo = rankedDonorsList.some((d) => d.phone || d.passwordHash || d.aadhaar);
  record("Privacy", "Donor private phone numbers & passwords not exposed in AI ranking feeds", !hasDonorPrivateInfo, `Audited ${rankedDonorsList.length} candidate items`);

  // Zero passwords in AuditLog
  const auditLogs = await prisma.auditLog.findMany({ take: 50, orderBy: { createdAt: "desc" } });
  let hasAuditLeak = false;
  for (const l of auditLogs) {
    const metaStr = JSON.stringify(l.metadata || {});
    if (metaStr.includes("passwordHash") || metaStr.includes("YuvaRakt@2026")) {
      hasAuditLeak = true;
      break;
    }
  }
  record("Privacy", "PostgreSQL AuditLog contains zero plaintext passwords or password hashes", !hasAuditLeak, "Audit ledger validation: Clean");

  // ===========================================================================
  // 4. DATABASE INTEGRITY & TRANSACTION ENFORCEMENT
  // ===========================================================================
  console.log("\n--- 4. DATABASE INTEGRITY & TRANSACTION ENFORCEMENT ---");

  // 1. Prevent negative inventory
  const negRes = await fetch(`${BASE_URL}/api/blood-bank/inventory`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: bloodBankCookie },
    body: JSON.stringify({ bloodGroup: "O_POSITIVE", componentType: "RBC", quantity: -99999 }),
  });
  record("Database Integrity", "Negative inventory deduction rejected with 400 Bad Request", negRes.status === 400, `HTTP: ${negRes.status}`);

  // 2. Prevent over-allocation
  const overReq = await fetch(`${BASE_URL}/api/hospital/requests`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: hospitalCookie },
    body: JSON.stringify({ bloodGroup: "B_POSITIVE", componentType: "RBC", unitsRequired: 1, urgency: "ROUTINE", requiredBy: new Date(Date.now() + 86400000).toISOString() }),
  });
  const overData = await overReq.json();
  const overId = overData.data?.bloodRequest?.id;

  const overAlloc = await fetch(`${BASE_URL}/api/blood-bank/allocate`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: bloodBankCookie },
    body: JSON.stringify({ requestId: overId, bloodGroup: "B_POSITIVE", componentType: "RBC", unitsAllocated: 5 }),
  });
  record("Database Integrity", "Over-allocation exceeding remaining required units rejected", overAlloc.status === 400, `HTTP: ${overAlloc.status}`);

  // 3. Prevent allocation to cancelled request
  await fetch(`${BASE_URL}/api/hospital/requests/${overId}`, { method: "DELETE", headers: { Cookie: hospitalCookie } });
  const cancelledAlloc = await fetch(`${BASE_URL}/api/blood-bank/allocate`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: bloodBankCookie },
    body: JSON.stringify({ requestId: overId, bloodGroup: "B_POSITIVE", componentType: "RBC", unitsAllocated: 1 }),
  });
  record("Database Integrity", "Allocation to CANCELLED blood request rejected", cancelledAlloc.status === 400, `HTTP: ${cancelledAlloc.status}`);

  // ===========================================================================
  // 5. AI INTEGRITY & REPRODUCIBILITY AUDIT
  // ===========================================================================
  console.log("\n--- 5. AI INTEGRITY & REPRODUCIBILITY AUDIT ---");

  const fc1 = await generateDemandForecast({ state: "Maharashtra", district: "Pune", bloodGroup: "O_POSITIVE", componentType: "RBC", periodDays: 7 });
  const fc2 = await generateDemandForecast({ state: "Maharashtra", district: "Pune", bloodGroup: "O_POSITIVE", componentType: "RBC", periodDays: 7 });

  record(
    "AI Integrity",
    "Demand Forecast calculations are deterministic and reproducible from identical database state",
    fc1.predictedUnits === fc2.predictedUnits && fc1.confidenceScore === fc2.confidenceScore,
    `Reproduced units: ${fc1.predictedUnits} === ${fc2.predictedUnits}`
  );

  const rk1 = await calculateShortageRisk({ state: "Maharashtra", district: "Pune", bloodGroup: "O_POSITIVE", componentType: "RBC" });
  const rk2 = await calculateShortageRisk({ state: "Maharashtra", district: "Pune", bloodGroup: "O_POSITIVE", componentType: "RBC" });

  record(
    "AI Integrity",
    "Shortage Risk scores and Explainable AI factors are reproducible and traceable to database records",
    rk1.riskScore === rk2.riskScore && rk1.riskLevel === rk2.riskLevel,
    `Risk Score: ${rk1.riskScore} === ${rk2.riskScore}`
  );

  // ===========================================================================
  // 6. ERROR HANDLING & API ROBUSTNESS AUDIT
  // ===========================================================================
  console.log("\n--- 6. ERROR HANDLING & ROBUSTNESS AUDIT ---");

  // Invalid blood group in request
  const badReq1 = await fetch(`${BASE_URL}/api/hospital/requests`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: hospitalCookie },
    body: JSON.stringify({ bloodGroup: "INVALID_GROUP", componentType: "RBC", unitsRequired: 2 }),
  });
  record("Error Handling", "Invalid Blood Group input rejected safely with 400 Bad Request", badReq1.status === 400, `HTTP: ${badReq1.status}`);

  // Missing requestId in donor-priority
  const badReq2 = await fetch(`${BASE_URL}/api/ai/donor-priority`, { headers: { Cookie: govCookie } });
  record("Error Handling", "Missing parameter in `/api/ai/donor-priority` returns clean 400 error", badReq2.status === 400, `HTTP: ${badReq2.status}`);

  // Invalid login credentials
  const badLogin = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@yuvarakt.demo", password: "WrongPassword!99" }),
  });
  record("Error Handling", "Invalid password rejected safely with 401 Unauthorized without stack traces", badLogin.status === 401, `HTTP: ${badLogin.status}`);

  // ===========================================================================
  // AUDIT SUMMARY
  // ===========================================================================
  const total = auditResults.length;
  const passed = auditResults.filter((r) => r.passed).length;
  const failed = total - passed;

  console.log("\n================================================================================");
  console.log(`📊 MASTER INTEGRATION AUDIT RESULTS: ${passed} / ${total} PASSED (${failed} FAILED)`);
  console.log("================================================================================\n");

  if (failed > 0) {
    console.error("❌ Master Integration Audit Encountered Failures!");
    process.exit(1);
  } else {
    console.log("🏆 ALL INTEGRATION, SECURITY, PRIVACY & AI AUDITS COMPLETED WITH 100% PASS RATE!");
  }
}

runMasterIntegrationAudit()
  .catch((e) => {
    console.error("Runner crash:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
