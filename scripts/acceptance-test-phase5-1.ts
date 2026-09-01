/**
 * 🇮🇳 YUVA-RAKT AI — PHASE 5.1 REAL-TIME AMBULANCE GPS, ROUTE & LIVE MAP TRACKING
 * Acceptance Test Suite
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

let donorCookie = "";
let hospitalCookie = "";
let unrelatedHospitalCookie = "";
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

async function runPhase51Acceptance() {
  console.log("\n================================================================================");
  console.log("🇮🇳 YUVA-RAKT AI — PHASE 5.1 REAL-TIME GPS & ROUTE TRACKING ACCEPTANCE");
  console.log("================================================================================\n");

  // 1. Authenticate users
  donorCookie = await loginUser("donor@yuvarakt.demo");
  hospitalCookie = await loginUser("pune.hospital@yuvarakt.demo");
  unrelatedHospitalCookie = await loginUser("hospital@yuvarakt.demo"); // Delhi AIIMS
  bloodBankCookie = await loginUser("bloodbank@yuvarakt.demo");
  govCookie = await loginUser("government@yuvarakt.demo");
  adminCookie = await loginUser("admin@yuvarakt.demo");
  ambulanceCookie = await loginUser("ambulance@yuvarakt.demo");

  assert(
    !!ambulanceCookie,
    "[Auth] SECTION 1: Authenticate emergency ambulance driver role"
  );

  // --------------------------------------------------------------------------
  // SECTION 2 & 3: GPS COORDINATE SUBMISSION & VALIDATION
  // --------------------------------------------------------------------------
  console.log("\n--- SECTION 2 & 3: REAL GPS SUBMISSION & VALIDATION ---");

  const realGpsRes = await fetch(`${BASE_URL}/api/ambulance/location`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: ambulanceCookie },
    body: JSON.stringify({
      latitude: 18.5284,
      longitude: 73.8739,
      accuracy: 6.5,
      speed: 45,
      heading: 90,
      source: "REAL_GPS",
    }),
  });
  const realGpsJson = await realGpsRes.json();

  assert(
    realGpsRes.ok && realGpsJson.success && realGpsJson.data?.currentLatitude === 18.5284,
    "[Real GPS] SECTION 2: Authorized ambulance submits verified GPS coordinates",
    `Lat: ${realGpsJson.data?.currentLatitude}, Lng: ${realGpsJson.data?.currentLongitude}`
  );

  assert(
    realGpsJson.data?.accuracy === 6.5 && realGpsJson.data?.locationSource === "REAL_GPS",
    "[GPS Validation] SECTION 3: Coordinates, accuracy (±6.5m), and source metadata validated"
  );

  // --------------------------------------------------------------------------
  // SECTION 4 & 5: LOCATION PERSISTENCE & HISTORY
  // --------------------------------------------------------------------------
  console.log("\n--- SECTION 4 & 5: LATEST LOCATION & HISTORY PERSISTENCE ---");

  const ambulanceRecord = await prisma.ambulance.findUnique({
    where: { vehicleNumber: "MH-12-EM-108" },
  });

  assert(
    ambulanceRecord?.currentLatitude === 18.5284 && ambulanceRecord?.accuracy === 6.5,
    "[Persistence] SECTION 4: Latest coordinates persisted on Ambulance record"
  );

  const historyEntries = await prisma.ambulanceLocationHistory.findMany({
    where: { ambulanceId: ambulanceRecord!.id },
    orderBy: { recordedAt: "desc" },
  });

  assert(
    historyEntries.length > 0 && historyEntries[0].source === "REAL_GPS",
    "[History] SECTION 5: Location history trail persists in `AmbulanceLocationHistory` table",
    `Total GPS Breadcrumbs: ${historyEntries.length}`
  );

  // --------------------------------------------------------------------------
  // SECTION 6 & 7: MISSION CREATION, DESTINATION SWITCHING & RBAC
  // --------------------------------------------------------------------------
  console.log("\n--- SECTION 6 & 7: STAKEHOLDER TRACKING & RBAC ENFORCEMENT ---");

  // Create an active mission for Pune Hospital & Pune Blood Bank
  const hospPune = await prisma.hospital.findFirst({ where: { district: "Pune" } });
  const bankPune = await prisma.bloodBank.findFirst({ where: { district: "Pune" } });

  const emergencyReq = await prisma.bloodRequest.create({
    data: {
      hospitalId: hospPune!.id,
      bloodGroup: "O_NEGATIVE",
      componentType: "RBC",
      unitsRequired: 2,
      urgency: "EMERGENCY",
      requiredBy: new Date(Date.now() + 6 * 60 * 60 * 1000),
      reason: "Acute Cardiovascular Surgery",
      patientAgeGroup: "ADULT",
      status: "PENDING",
      createdBy: hospPune!.userId,
    },
  });

  const { dispatchAmbulanceMission } = await import("../src/lib/services/ambulance.service");
  const mission = await dispatchAmbulanceMission({
    bloodRequestId: emergencyReq.id,
    sourceBloodBankId: bankPune!.id,
    destinationHospitalId: hospPune!.id,
    ambulanceId: ambulanceRecord!.id,
  });

  // Check Authorized Hospital can track
  const hospTrackRes = await fetch(`${BASE_URL}/api/ambulance/missions/${mission.id}/location`, {
    headers: { Cookie: hospitalCookie },
  });
  const hospTrackJson = await hospTrackRes.json();

  assert(
    hospTrackRes.ok && hospTrackJson.success,
    "[Stakeholder Tracking] SECTION 6: Authorized destination hospital can track assigned ambulance mission"
  );

  // Check Unrelated Hospital (AIIMS Delhi) is BLOCKED with 403
  const unrelatedHospTrackRes = await fetch(`${BASE_URL}/api/ambulance/missions/${mission.id}/location`, {
    headers: { Cookie: unrelatedHospitalCookie },
  });

  assert(
    unrelatedHospTrackRes.status === 403,
    "[Location Privacy] SECTION 7: Unrelated hospital blocked from tracking ambulance mission (403)",
    `HTTP Status: ${unrelatedHospTrackRes.status}`
  );

  // Check Youth Donor is BLOCKED with 403
  const donorTrackRes = await fetch(`${BASE_URL}/api/ambulance/missions/${mission.id}/location`, {
    headers: { Cookie: donorCookie },
  });
  assert(
    donorTrackRes.status === 403,
    "[Location Privacy] SECTION 7: Youth donor blocked from ambulance tracking endpoint (403)"
  );

  // --------------------------------------------------------------------------
  // SECTION 8 & 9: GPS FRESHNESS & MISSION-AWARE ROUTING STAGE
  // --------------------------------------------------------------------------
  console.log("\n--- SECTION 8 & 9: GPS FRESHNESS & MISSION-AWARE ROUTING ---");

  assert(
    hospTrackJson.data?.navigation?.isFreshGps === true && hospTrackJson.data?.navigation?.distanceKm >= 0,
    "[Freshness] SECTION 8: Real-time GPS freshness indicator and Haversine distance computed",
    `Distance: ${hospTrackJson.data?.navigation?.distanceKm}km, ETA: ${hospTrackJson.data?.navigation?.etaMinutes} mins`
  );

  assert(
    hospTrackJson.data?.navigation?.stage === "PICKUP_STAGE",
    "[Mission Navigation] SECTION 9: Navigation stage points to Blood Bank pickup during initial transit",
    `Target: ${hospTrackJson.data?.navigation?.targetName}`
  );

  // Transition mission to BLOOD_COLLECTED
  const { updateMissionStatus } = await import("../src/lib/services/ambulance.service");
  await updateMissionStatus({
    missionId: mission.id,
    userId: ambulanceRecord!.userId,
    targetStatus: "ACCEPTED",
  });
  await updateMissionStatus({
    missionId: mission.id,
    userId: ambulanceRecord!.userId,
    targetStatus: "EN_ROUTE_TO_BLOOD_BANK",
  });
  await updateMissionStatus({
    missionId: mission.id,
    userId: ambulanceRecord!.userId,
    targetStatus: "ARRIVED_AT_BLOOD_BANK",
  });
  await updateMissionStatus({
    missionId: mission.id,
    userId: ambulanceRecord!.userId,
    targetStatus: "BLOOD_COLLECTED",
  });

  const updatedTrackRes = await fetch(`${BASE_URL}/api/ambulance/missions/${mission.id}/location`, {
    headers: { Cookie: hospitalCookie },
  });
  const updatedTrackJson = await updatedTrackRes.json();

  assert(
    updatedTrackJson.data?.navigation?.stage === "DELIVERY_STAGE",
    "[Mission Navigation] SECTION 9: Destination automatically switches to Hospital once blood is collected",
    `New Target: ${updatedTrackJson.data?.navigation?.targetName} (${updatedTrackJson.data?.navigation?.targetLabel})`
  );

  // --------------------------------------------------------------------------
  // SECTION 10: REAL_GPS VS DEMO_SIMULATION DISTINCTION
  // --------------------------------------------------------------------------
  console.log("\n--- SECTION 10: TELEMETRY SOURCE DISTINCTION ---");

  const simGpsRes = await fetch(`${BASE_URL}/api/ambulance/location`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: ambulanceCookie },
    body: JSON.stringify({
      latitude: 18.5290,
      longitude: 73.8745,
      source: "DEMO_SIMULATION",
      missionId: mission.id,
    }),
  });
  const simGpsJson = await simGpsRes.json();

  assert(
    simGpsRes.ok && simGpsJson.data?.locationSource === "DEMO_SIMULATION",
    "[Source Integrity] SECTION 10: System explicitly tags and distinguishes DEMO_SIMULATION from REAL_GPS",
    `Persisted Source: ${simGpsJson.data?.locationSource}`
  );

  // --------------------------------------------------------------------------
  // SECTION 11: REJECTION OF INVALID COORDINATES
  // --------------------------------------------------------------------------
  console.log("\n--- SECTION 11: COORDINATE INTEGRITY REJECTION ---");

  const invalidGpsRes = await fetch(`${BASE_URL}/api/ambulance/location`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: ambulanceCookie },
    body: JSON.stringify({
      latitude: 999.0, // Invalid latitude
      longitude: 73.8745,
    }),
  });

  assert(
    !invalidGpsRes.ok,
    "[Integrity Security] SECTION 11: Impossible GPS coordinates (>90°) rejected with error",
    `HTTP Status: ${invalidGpsRes.status}`
  );

  // --------------------------------------------------------------------------
  // SECTION 12 & 13: TRACKING TOGGLE & AUDIT EVENTS
  // --------------------------------------------------------------------------
  console.log("\n--- SECTION 12 & 13: TRACKING LIFECYCLE & AUDIT EVENTS ---");

  // Toggle Tracking Start
  const startTrackingRes = await fetch(`${BASE_URL}/api/ambulance/tracking/toggle`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: ambulanceCookie },
    body: JSON.stringify({ isTracking: true }),
  });
  const startTrackingJson = await startTrackingRes.json();
  assert(
    startTrackingRes.ok && startTrackingJson.data?.isTrackingActive === true,
    "[Tracking Control] SECTION 12: Ambulance can explicitly toggle live GPS tracking state (START)"
  );

  // Complete mission
  await updateMissionStatus({
    missionId: mission.id,
    userId: ambulanceRecord!.userId,
    targetStatus: "EN_ROUTE_TO_HOSPITAL",
  });
  await updateMissionStatus({
    missionId: mission.id,
    userId: ambulanceRecord!.userId,
    targetStatus: "ARRIVED_AT_HOSPITAL",
  });
  await updateMissionStatus({
    missionId: mission.id,
    userId: ambulanceRecord!.userId,
    targetStatus: "DELIVERED",
  });
  await updateMissionStatus({
    missionId: mission.id,
    userId: ambulanceRecord!.userId,
    targetStatus: "COMPLETED",
  });

  // Verify Audit Logs
  const auditLogs = await prisma.auditLog.findMany({
    where: {
      action: {
        in: [
          "AMBULANCE_GPS_TRACKING_STARTED",
          "AMBULANCE_LOCATION_UPDATED",
          "AMBULANCE_MISSION_CREATED",
          "BLOOD_COLLECTED",
          "BLOOD_DELIVERED",
          "EMERGENCY_TRANSPORT_COMPLETED",
        ],
      },
    },
  });

  assert(
    auditLogs.length >= 5,
    "[Audit Compliance] SECTION 13: Immutable audit logs record Phase 5.1 tracking & transit actions",
    `Captured Tracking Audits: ${auditLogs.length}`
  );

  // --------------------------------------------------------------------------
  // SECTION 14: FULL END-TO-END SCENARIO
  // --------------------------------------------------------------------------
  console.log("\n--- SECTION 14: FULL END-TO-END LIVE TRACKING SCENARIO ---");

  const finalAmbulance = await prisma.ambulance.findUnique({
    where: { id: ambulanceRecord!.id },
  });

  assert(
    finalAmbulance?.status === "AVAILABLE" && finalAmbulance?.isTrackingActive === false,
    "[End-to-End] SECTION 14: Completed mission successfully releases ambulance unit and closes live tracking session",
    `Status: ${finalAmbulance?.status}, Tracking: ${finalAmbulance?.isTrackingActive}`
  );

  console.log("\n================================================================================");
  console.log(`📊 PHASE 5.1 ACCEPTANCE TEST RESULTS: ${passedCount} / ${passedCount + failedCount} PASSED (${failedCount} FAILED)`);
  console.log("================================================================================\n");

  if (failedCount > 0) {
    console.error(`💥 Phase 5.1 acceptance suite failed with ${failedCount} errors!`);
    process.exit(1);
  } else {
    console.log("🏆 ALL PHASE 5.1 ACCEPTANCE TESTS COMPLETED WITH 100% PASS RATE!\n");
    process.exit(0);
  }
}

runPhase51Acceptance()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
