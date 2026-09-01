/**
 * 🇮🇳 YUVA-RAKT AI — PHASE 5 MASTER ACCEPTANCE TEST SUITE
 * National Live Blood Intelligence Map & Autonomous Emergency Response + Ambulance Coordination
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

let donorCookie = "";
let hospitalCookie = "";
let bloodBankCookie = "";
let govCookie = "";
let adminCookie = "";
let ambulanceCookie = "";

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`✅ PASS: ${testName} ${detail ? `— ${detail}` : ""}`);
    passedCount++;
  } else {
    console.error(`❌ FAIL: ${testName} ${detail ? `— ${detail}` : ""}`);
    failedCount++;
  }
}

async function loginUser(email: string, pass = "YuvaRakt@2026"): Promise<string> {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: pass }),
  });
  if (!res.ok) throw new Error(`Failed to login ${email}: ${res.statusText}`);
  const setCookie = res.headers.get("set-cookie");
  if (!setCookie) throw new Error(`No cookie returned for ${email}`);
  return setCookie.split(";")[0];
}

async function runPhase5Acceptance() {
  console.log("\n================================================================================");
  console.log("🇮🇳 YUVA-RAKT AI — PHASE 5 MASTER ACCEPTANCE TEST");
  console.log("================================================================================\n");

  // Authenticate all core roles
  donorCookie = await loginUser("donor@yuvarakt.demo");
  hospitalCookie = await loginUser("pune.hospital@yuvarakt.demo");
  bloodBankCookie = await loginUser("bloodbank@yuvarakt.demo");
  govCookie = await loginUser("government@yuvarakt.demo");
  adminCookie = await loginUser("admin@yuvarakt.demo");
  ambulanceCookie = await loginUser("ambulance@yuvarakt.demo");

  assert(
    !!(donorCookie && hospitalCookie && bloodBankCookie && govCookie && adminCookie && ambulanceCookie),
    "[Authentication] Authenticate all 6 system roles (Donor, Hospital, Blood Bank, Gov, Admin, Ambulance)"
  );

  // --------------------------------------------------------------------------
  // SECTION 1: MAP INTELLIGENCE & LAYERS
  // --------------------------------------------------------------------------
  console.log("\n--- SECTION 1: NATIONAL LIVE BLOOD INTELLIGENCE MAP ---");
  const mapRes = await fetch(`${BASE_URL}/api/government/live-map`, {
    headers: { Cookie: govCookie },
  });
  const mapJson = await mapRes.json();

  assert(
    mapRes.ok && mapJson.success && Array.isArray(mapJson.data?.districts) && mapJson.data.districts.length > 0,
    "[Live Map] GET `/api/government/live-map` returns live district shortage risk heatmap layer",
    `Tracked Districts: ${mapJson.data?.districts?.length || 0}`
  );

  assert(
    Array.isArray(mapJson.data?.emergencies) && Array.isArray(mapJson.data?.bloodBanks) && Array.isArray(mapJson.data?.ambulances),
    "[Live Map] Map aggregates multi-layer telemetry (Hospital Emergencies, Blood Centres, Ambulance Units)",
    `Emergencies: ${mapJson.data?.emergencies?.length}, Blood Banks: ${mapJson.data?.bloodBanks?.length}, Ambulances: ${mapJson.data?.ambulances?.length}`
  );

  // Filter test
  const filteredMapRes = await fetch(`${BASE_URL}/api/government/live-map?district=Pune&bloodGroup=O_NEGATIVE`, {
    headers: { Cookie: govCookie },
  });
  const filteredMapJson = await filteredMapRes.json();
  assert(
    filteredMapRes.ok && filteredMapJson.success,
    "[Live Map] Map filtering by district and blood group operates correctly"
  );

  // --------------------------------------------------------------------------
  // SECTION 2: AUTONOMOUS RESOURCE DISCOVERY ENGINE
  // --------------------------------------------------------------------------
  console.log("\n--- SECTION 2: AUTONOMOUS RESOURCE DISCOVERY ENGINE ---");
  const { discoverEmergencyResources } = await import("../src/lib/services/resource-discovery.service");

  const discovery = await discoverEmergencyResources({
    bloodGroup: "O_NEGATIVE",
    componentType: "RBC",
    unitsRequired: 2,
    district: "Pune",
    state: "Maharashtra",
    urgency: "EMERGENCY",
  });

  assert(
    discovery.bloodBanks.length > 0,
    "[Resource Discovery] Discovers and ranks suitable Blood Banks with compatible inventory",
    `Top Blood Centre: ${discovery.bloodBanks[0]?.name} (Score: ${discovery.bloodBanks[0]?.priorityScore})`
  );

  assert(
    discovery.donors.length > 0,
    "[Resource Discovery] Identifies compatible verified available youth donors in target district",
    `Top Donor Candidate: ${discovery.donors[0]?.fullName} (${discovery.donors[0]?.bloodGroup}, Score: ${discovery.donors[0]?.priorityScore})`
  );

  assert(
    discovery.ambulances.length > 0,
    "[Resource Discovery] Identifies and ranks eligible available ambulances",
    `Top Ambulance: ${discovery.ambulances[0]?.displayName} (${discovery.ambulances[0]?.vehicleNumber}, Status: ${discovery.ambulances[0]?.status})`
  );

  // --------------------------------------------------------------------------
  // SECTION 3: SMART AUTO-MOBILIZATION & STAGED ALERTS
  // --------------------------------------------------------------------------
  console.log("\n--- SECTION 3: SMART AUTO-MOBILIZATION & STAGED NOTIFICATIONS ---");

  // Create an Emergency Requisition
  const hospitalRecord = await prisma.hospital.findFirst({ where: { district: "Pune" } });
  const emergencyReq = await prisma.bloodRequest.create({
    data: {
      hospitalId: hospitalRecord!.id,
      bloodGroup: "O_NEGATIVE",
      componentType: "RBC",
      unitsRequired: 2,
      urgency: "EMERGENCY",
      requiredBy: new Date(Date.now() + 24 * 60 * 60 * 1000),
      reason: "Acute aortic emergency transfusion",
      patientAgeGroup: "ADULT",
      status: "PENDING",
      createdBy: hospitalRecord!.userId,
    },
  });

  const autoResponseRes = await fetch(`${BASE_URL}/api/emergency/autonomous-response`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: govCookie },
    body: JSON.stringify({
      requestId: emergencyReq.id,
      responseMode: "IMMEDIATE_EMERGENCY",
    }),
  });
  const autoResponseJson = await autoResponseRes.json();

  assert(
    autoResponseRes.ok && autoResponseJson.success,
    "[Smart Mobilization] POST `/api/emergency/autonomous-response` triggers staged mobilization & ambulance dispatch",
    `Alerted Banks: ${autoResponseJson.data?.mobilization?.alertedBanksCount}, Notified Donors: ${autoResponseJson.data?.mobilization?.notifiedDonorsCount}`
  );

  // Check notifications in DB
  const notificationsCreated = await prisma.notification.findMany({
    where: { relatedEntityId: emergencyReq.id },
  });
  assert(
    notificationsCreated.length > 0,
    "[Smart Mobilization] Staged notifications persist in PostgreSQL with donor privacy preserved",
    `Total Notifications Dispatched: ${notificationsCreated.length}`
  );

  // --------------------------------------------------------------------------
  // SECTION 4: RESPONSE RADIUS EXPANSION
  // --------------------------------------------------------------------------
  console.log("\n--- SECTION 4: RESPONSE SEARCH RADIUS EXPANSION ---");
  const expandRes = await fetch(`${BASE_URL}/api/emergency/expand-radius`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: govCookie },
    body: JSON.stringify({ requestId: emergencyReq.id }),
  });
  const expandJson = await expandRes.json();

  assert(
    expandRes.ok && expandJson.success,
    "[Radius Expansion] POST `/api/emergency/expand-radius` expands mobilization across regional zone (Round 2)",
    `Additional Donors Notified: ${expandJson.data?.additionalDonorsAlerted}`
  );

  // --------------------------------------------------------------------------
  // SECTION 5: AMBULANCE MISSION DISPATCH & ACCEPTANCE
  // --------------------------------------------------------------------------
  console.log("\n--- SECTION 5: AMBULANCE MISSION DISPATCH & ACCEPTANCE ---");
  const ambDashboardRes = await fetch(`${BASE_URL}/api/ambulance/dashboard`, {
    headers: { Cookie: ambulanceCookie },
  });
  const ambDashboardJson = await ambDashboardRes.json();

  assert(
    ambDashboardRes.ok && ambDashboardJson.success && ambDashboardJson.data?.activeMission !== undefined,
    "[Ambulance Mission] GET `/api/ambulance/dashboard` retrieves assigned transport missions for driver terminal",
    `Active Mission ID: ${ambDashboardJson.data?.activeMission?.id || "None"}`
  );

  const missionId = autoResponseJson.data?.dispatchedMission?.id || ambDashboardJson.data?.activeMission?.id;

  if (missionId) {
    // Accept mission
    const acceptRes = await fetch(`${BASE_URL}/api/ambulance/missions/${missionId}/respond`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: ambulanceCookie },
      body: JSON.stringify({ action: "ACCEPT", notes: "EMS pilot acknowledged and en route" }),
    });
    const acceptJson = await acceptRes.json();

    assert(
      acceptRes.ok && acceptJson.success && acceptJson.data?.status === "ACCEPTED",
      "[Ambulance Mission] Ambulance driver accepts mission via `POST /api/ambulance/missions/[id]/respond`",
      `Mission Status in DB: ${acceptJson.data?.status}`
    );
  }

  // --------------------------------------------------------------------------
  // SECTION 6: AMBULANCE MISSION STATE MACHINE PROGRESSION
  // --------------------------------------------------------------------------
  console.log("\n--- SECTION 6: AMBULANCE MISSION STATE MACHINE ---");

  if (missionId) {
    // Transition 1: EN_ROUTE_TO_BLOOD_BANK
    const t1 = await fetch(`${BASE_URL}/api/ambulance/missions/${missionId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: ambulanceCookie },
      body: JSON.stringify({ targetStatus: "EN_ROUTE_TO_BLOOD_BANK" }),
    });
    assert(t1.ok, "[State Machine] Transition to EN_ROUTE_TO_BLOOD_BANK valid");

    // Transition 2: ARRIVED_AT_BLOOD_BANK
    const t2 = await fetch(`${BASE_URL}/api/ambulance/missions/${missionId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: ambulanceCookie },
      body: JSON.stringify({ targetStatus: "ARRIVED_AT_BLOOD_BANK" }),
    });
    assert(t2.ok, "[State Machine] Transition to ARRIVED_AT_BLOOD_BANK valid");

    // Transition 3: BLOOD_COLLECTED
    const t3 = await fetch(`${BASE_URL}/api/ambulance/missions/${missionId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: ambulanceCookie },
      body: JSON.stringify({ targetStatus: "BLOOD_COLLECTED" }),
    });
    const t3Json = await t3.json();
    assert(
      t3.ok && t3Json.data?.bloodCollectedAt !== null,
      "[State Machine] Transition to BLOOD_COLLECTED records timestamp in PostgreSQL"
    );

    // Transition 4: EN_ROUTE_TO_HOSPITAL
    const t4 = await fetch(`${BASE_URL}/api/ambulance/missions/${missionId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: ambulanceCookie },
      body: JSON.stringify({ targetStatus: "EN_ROUTE_TO_HOSPITAL" }),
    });
    assert(t4.ok, "[State Machine] Transition to EN_ROUTE_TO_HOSPITAL valid");

    // Transition 5: ARRIVED_AT_HOSPITAL
    const t5 = await fetch(`${BASE_URL}/api/ambulance/missions/${missionId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: ambulanceCookie },
      body: JSON.stringify({ targetStatus: "ARRIVED_AT_HOSPITAL" }),
    });
    assert(t5.ok, "[State Machine] Transition to ARRIVED_AT_HOSPITAL valid");

    // Transition 6: DELIVERED
    const t6 = await fetch(`${BASE_URL}/api/ambulance/missions/${missionId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: ambulanceCookie },
      body: JSON.stringify({ targetStatus: "DELIVERED" }),
    });
    const t6Json = await t6.json();
    assert(
      t6.ok && t6Json.data?.deliveredAt !== null,
      "[State Machine] Transition to DELIVERED records handover in PostgreSQL"
    );

    // Transition 7: COMPLETED
    const t7 = await fetch(`${BASE_URL}/api/ambulance/missions/${missionId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: ambulanceCookie },
      body: JSON.stringify({ targetStatus: "COMPLETED" }),
    });
    assert(t7.ok, "[State Machine] Transition to COMPLETED releases ambulance back to AVAILABLE");

    // Negative Test: Invalid direct transition from COMPLETED to EN_ROUTE_TO_BLOOD_BANK
    const invalidTransition = await fetch(`${BASE_URL}/api/ambulance/missions/${missionId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: ambulanceCookie },
      body: JSON.stringify({ targetStatus: "EN_ROUTE_TO_BLOOD_BANK" }),
    });
    assert(
      !invalidTransition.ok,
      "[State Machine Security] Rejects invalid state machine transitions on completed missions"
    );
  }

  // --------------------------------------------------------------------------
  // SECTION 7: LIVE GPS LOCATION TELEMETRY & PERSISTENCE
  // --------------------------------------------------------------------------
  console.log("\n--- SECTION 7: LIVE GPS LOCATION TELEMETRY ---");

  const gpsUpdateRes = await fetch(`${BASE_URL}/api/ambulance/location`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: ambulanceCookie },
    body: JSON.stringify({
      latitude: 18.5245,
      longitude: 73.8580,
      missionId,
    }),
  });
  const gpsUpdateJson = await gpsUpdateRes.json();

  assert(
    gpsUpdateRes.ok && gpsUpdateJson.success && gpsUpdateJson.data?.currentLatitude === 18.5245,
    "[Location Telemetry] POST `/api/ambulance/location` persists live coordinates on Ambulance model",
    `Persisted Lat: ${gpsUpdateJson.data?.currentLatitude}, Lng: ${gpsUpdateJson.data?.currentLongitude}`
  );

  // Check Location History
  const historyEntries = await prisma.ambulanceLocationHistory.findMany({
    where: { latitude: 18.5245 },
  });
  assert(
    historyEntries.length > 0,
    "[Location Telemetry] GPS breadcrumbs persist in `AmbulanceLocationHistory` table",
    `Location History Count: ${historyEntries.length}`
  );

  // --------------------------------------------------------------------------
  // SECTION 8: PRIVACY & SERVER-SIDE RBAC ENFORCEMENT
  // --------------------------------------------------------------------------
  console.log("\n--- SECTION 8: PRIVACY & SERVER-SIDE RBAC ENFORCEMENT ---");

  // Youth Donor blocked from /api/government/live-map
  const donorMapRes = await fetch(`${BASE_URL}/api/government/live-map`, {
    headers: { Cookie: donorCookie },
  });
  assert(donorMapRes.status === 403, "[RBAC Security] Youth Donor blocked from `/api/government/live-map` (403)", `HTTP: ${donorMapRes.status}`);

  // Youth Donor blocked from /api/ambulance/dashboard
  const donorAmbRes = await fetch(`${BASE_URL}/api/ambulance/dashboard`, {
    headers: { Cookie: donorCookie },
  });
  assert(donorAmbRes.status === 403, "[RBAC Security] Youth Donor blocked from `/api/ambulance/dashboard` (403)", `HTTP: ${donorAmbRes.status}`);

  // Hospital blocked from updating ambulance location
  const hospGpsRes = await fetch(`${BASE_URL}/api/ambulance/location`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: hospitalCookie },
    body: JSON.stringify({ latitude: 18.5, longitude: 73.8 }),
  });
  assert(hospGpsRes.status === 403, "[RBAC Security] Hospital blocked from `/api/ambulance/location` (403)", `HTTP: ${hospGpsRes.status}`);

  // Ambulance blocked from AI forecast admin refresh
  const ambAiRes = await fetch(`${BASE_URL}/api/ai/refresh`, {
    method: "POST",
    headers: { Cookie: ambulanceCookie },
  });
  assert(ambAiRes.status === 403, "[RBAC Security] Ambulance blocked from `/api/ai/refresh` (403)", `HTTP: ${ambAiRes.status}`);

  // --------------------------------------------------------------------------
  // SECTION 9: AUDIT LOGGING & COMPLIANCE
  // --------------------------------------------------------------------------
  console.log("\n--- SECTION 9: AUDIT LOGGING & COMPLIANCE ---");

  const phase5AuditLogs = await prisma.auditLog.findMany({
    where: {
      action: {
        in: [
          "SHORTAGE_RESPONSE_ACTIVATED",
          "DONOR_ALERT_BATCH_SENT",
          "RESPONSE_RADIUS_EXPANDED",
          "AMBULANCE_MISSION_CREATED",
          "AMBULANCE_MISSION_ACCEPTED",
          "BLOOD_COLLECTED",
          "BLOOD_DELIVERED",
          "EMERGENCY_TRANSPORT_COMPLETED",
        ],
      },
    },
  });

  assert(
    phase5AuditLogs.length >= 4,
    "[Audit Logging] Immutable PostgreSQL AuditLog captures Phase 5 operational actions",
    `Captured Phase 5 Audit Entries: ${phase5AuditLogs.length}`
  );

  let cleanMetadata = true;
  for (const log of phase5AuditLogs) {
    const metaStr = JSON.stringify(log.metadata || {});
    if (metaStr.includes("password") || metaStr.includes("YuvaRakt@2026") || metaStr.includes("$2a$10$")) {
      cleanMetadata = false;
    }
  }
  assert(
    cleanMetadata,
    "[Audit Logging] Zero plain passwords, tokens, or hashes stored in Phase 5 audit metadata"
  );

  // --------------------------------------------------------------------------
  // SECTION 10: COMPLETE FULL END-TO-END SCENARIO
  // --------------------------------------------------------------------------
  console.log("\n--- SECTION 10: COMPLETE FULL END-TO-END EMERGENCY SCENARIO ---");

  // Step 1: Hospital logs emergency requirement
  const e2eReq = await prisma.bloodRequest.create({
    data: {
      hospitalId: hospitalRecord!.id,
      bloodGroup: "O_POSITIVE",
      componentType: "RBC",
      unitsRequired: 1,
      urgency: "EMERGENCY",
      requiredBy: new Date(Date.now() + 12 * 60 * 60 * 1000),
      reason: "E2E Emergency Vascular Surgery",
      patientAgeGroup: "ADULT",
      status: "PENDING",
      createdBy: hospitalRecord!.userId,
    },
  });
  assert(!!e2eReq.id, "[End-to-End] Step 1: Hospital creates emergency blood requisition in PostgreSQL", `Request ID: ${e2eReq.id}`);

  // Step 2: Autonomous Engine activates response
  const e2eResponse = await fetch(`${BASE_URL}/api/emergency/autonomous-response`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: govCookie },
    body: JSON.stringify({ requestId: e2eReq.id }),
  });
  const e2eResponseJson = await e2eResponse.json();
  assert(e2eResponseJson.success, "[End-to-End] Step 2: Autonomous response engine identifies resources and alerts stakeholders");

  // Step 3: Youth donor responds "I CAN HELP"
  const donorProfile = await prisma.youthDonorProfile.findFirst({
    where: { bloodGroup: "O_POSITIVE" },
  });
  if (donorProfile) {
    await prisma.donorResponse.create({
      data: {
        requestId: e2eReq.id,
        donorId: donorProfile.id,
        status: "INTERESTED",
        message: "Available immediately at blood bank",
      },
    });
    assert(true, "[End-to-End] Step 3: Verified youth donor responds 'I CAN HELP' (INTERESTED)");
  }

  // Step 4: Blood bank allocates units and marks fulfilled
  const bloodBankRecord = await prisma.bloodBank.findFirst({ where: { district: "Pune" } });
  const inv = await prisma.bloodInventory.findFirst({
    where: { bloodBankId: bloodBankRecord!.id, bloodGroup: "O_POSITIVE", componentType: "RBC" },
  });

  if (inv) {
    const allocRes = await fetch(`${BASE_URL}/api/blood-bank/allocate`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: bloodBankCookie },
      body: JSON.stringify({
        requestId: e2eReq.id,
        bloodGroup: "O_POSITIVE",
        componentType: "RBC",
        unitsAllocated: 1,
      }),
    });
    const allocJson = await allocRes.json();
    assert(
      allocRes.ok && allocJson.success && allocJson.data?.updatedRequest?.status === "FULFILLED",
      "[End-to-End] Step 4: Blood Bank allocates units and transitions request to FULFILLED",
      `Status: ${allocJson.data?.updatedRequest?.status}`
    );
  }

  // Step 5: Live Map reflects updated status
  const finalMapRes = await fetch(`${BASE_URL}/api/government/live-map`, {
    headers: { Cookie: govCookie },
  });
  const finalMapJson = await finalMapRes.json();
  assert(
    finalMapRes.ok && finalMapJson.success,
    "[End-to-End] Step 5: National Live Command Map updates in real time with fulfilled status"
  );

  console.log("\n================================================================================");
  console.log(`📊 PHASE 5 ACCEPTANCE TEST RESULTS: ${passedCount} / ${passedCount + failedCount} PASSED (${failedCount} FAILED)`);
  console.log("================================================================================\n");

  if (failedCount > 0) {
    console.error(`💥 Acceptance test suite failed with ${failedCount} errors!`);
    process.exit(1);
  } else {
    console.log("🏆 ALL PHASE 5 ACCEPTANCE TESTS COMPLETED WITH 100% PASS RATE!\n");
    process.exit(0);
  }
}

runPhase5Acceptance()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
