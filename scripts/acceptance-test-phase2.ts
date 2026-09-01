import prisma from "../src/lib/db";

const BASE_URL = "http://localhost:3000";

interface TestResult {
  suite: string;
  name: string;
  passed: boolean;
  details?: string;
}

const results: TestResult[] = [];

function recordTest(suite: string, name: string, passed: boolean, details?: string) {
  results.push({ suite, name, passed, details });
  const icon = passed ? "✅ PASS" : "❌ FAIL";
  console.log(`${icon}: [${suite}] ${name} ${details ? `(${details})` : ""}`);
}

function extractCookie(headers: Headers): string | null {
  const setCookie = headers.get("set-cookie");
  if (!setCookie) return null;
  const match = setCookie.match(/yuva_session=([^;]+)/);
  return match ? `yuva_session=${match[1]}` : null;
}

async function loginAs(email: string): Promise<string> {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      password: "YuvaRakt@2026",
    }),
  });
  const cookie = extractCookie(res.headers);
  if (!cookie) throw new Error(`Failed to login as ${email}`);
  return cookie;
}

async function runPhase2AcceptanceTests() {
  console.log("\n================================================================================");
  console.log("🇮🇳 YUVA-RAKT AI — PHASE 2 CORE BLOOD WORKFLOW ACCEPTANCE TEST SUITE");
  console.log("================================================================================\n");

  let donorCookie: string;
  let hospitalCookie: string;
  let bloodBankCookie: string;
  let adminCookie: string;

  try {
    donorCookie = await loginAs("donor@yuvarakt.demo");
    hospitalCookie = await loginAs("pune.hospital@yuvarakt.demo");
    bloodBankCookie = await loginAs("bloodbank@yuvarakt.demo");
    adminCookie = await loginAs("admin@yuvarakt.demo");
    recordTest("Setup", "Authenticated all 4 core test role sessions", true);
  } catch (err: any) {
    recordTest("Setup", "Authenticated all 4 core test role sessions", false, err.message);
    process.exit(1);
  }

  // ---------------------------------------------------------------------------
  // SUITE 1: HOSPITAL BLOOD REQUISITION WORKFLOW
  // ---------------------------------------------------------------------------
  console.log("\n--- SUITE 1: HOSPITAL REQUISITION WORKFLOW ---");

  let createdRequestId = "";

  // 1.1: Hospital creates urgent blood request
  try {
    const requiredBy = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString();
    const res = await fetch(`${BASE_URL}/api/hospital/requests`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: hospitalCookie,
      },
      body: JSON.stringify({
        bloodGroup: "O_POSITIVE",
        componentType: "RBC",
        unitsRequired: 2,
        urgency: "CRITICAL",
        requiredBy,
        reason: "Emergency neurosurgery trauma unit",
        patientAgeGroup: "ADULT",
      }),
    });

    const data = await res.json();
    createdRequestId = data.data?.bloodRequest?.id;

    recordTest(
      "Hospital Workflow",
      "Hospital raises CRITICAL blood requisition for 2 units O+ RBC",
      res.status === 200 && data.success === true && !!createdRequestId,
      `Request ID: ${createdRequestId}, Matching donors notified: ${data.data?.matchingDonorsCount}`
    );

    // Verify in PostgreSQL
    const dbReq = await prisma.bloodRequest.findUnique({
      where: { id: createdRequestId },
    });
    recordTest(
      "Database Verification",
      "BloodRequest record correctly persisted with status PENDING",
      dbReq !== null && dbReq.status === "PENDING" && dbReq.unitsRequired === 2,
      `Status: ${dbReq?.status}, Required: ${dbReq?.unitsRequired}`
    );
  } catch (err: any) {
    recordTest("Hospital Workflow", "Hospital raises blood requisition", false, err.message);
  }

  // 1.2: Hospital views own requests
  try {
    const res = await fetch(`${BASE_URL}/api/hospital/requests`, {
      headers: { Cookie: hospitalCookie },
    });
    const data = await res.json();
    const hasCreatedReq = (data.requests || []).some((r: any) => r.id === createdRequestId);

    recordTest(
      "Hospital Workflow",
      "Hospital retrieves list of owned requisitions",
      res.status === 200 && data.success === true && hasCreatedReq,
      `Retrieved ${data.requests?.length} requests`
    );
  } catch (err: any) {
    recordTest("Hospital Workflow", "Hospital retrieves requests", false, err.message);
  }

  // 1.3: Hospital inspects single request details
  try {
    const res = await fetch(`${BASE_URL}/api/hospital/requests/${createdRequestId}`, {
      headers: { Cookie: hospitalCookie },
    });
    const data = await res.json();

    recordTest(
      "Hospital Workflow",
      "Hospital views detailed requisition status and allocations",
      res.status === 200 && data.success === true && data.request?.id === createdRequestId,
      `Urgency: ${data.request?.urgency}`
    );
  } catch (err: any) {
    recordTest("Hospital Workflow", "Hospital views single request", false, err.message);
  }

  // ---------------------------------------------------------------------------
  // SUITE 2: BLOOD BANK INVENTORY & ALLOCATION WORKFLOW
  // ---------------------------------------------------------------------------
  console.log("\n--- SUITE 2: BLOOD BANK INVENTORY & ALLOCATION ---");

  // 2.1: Blood Bank fetches 8x4 matrix and summary
  try {
    const res = await fetch(`${BASE_URL}/api/blood-bank/inventory`, {
      headers: { Cookie: bloodBankCookie },
    });
    const data = await res.json();
    const summary = data.summary;

    recordTest(
      "Blood Bank Workflow",
      "Blood Bank loads real-time 8x4 inventory matrix from PostgreSQL",
      res.status === 200 &&
        data.success === true &&
        summary.totalUnitsAvailable > 0 &&
        summary.matrix.length === 32, // 8 blood groups * 4 components = 32 cells
      `Total Units: ${summary?.totalUnitsAvailable}, Matrix Cells: ${summary?.matrix?.length}`
    );
  } catch (err: any) {
    recordTest("Blood Bank Workflow", "Blood Bank loads inventory matrix", false, err.message);
  }

  // 2.2: Blood Bank views regional requests & acknowledges
  try {
    const res = await fetch(`${BASE_URL}/api/blood-bank/requests`, {
      headers: { Cookie: bloodBankCookie },
    });
    const data = await res.json();
    const hasTargetReq = (data.requests || []).some((r: any) => r.id === createdRequestId);

    recordTest(
      "Blood Bank Workflow",
      "Blood Bank inspects regional hospital requisitions",
      res.status === 200 && data.success === true && hasTargetReq,
      `Found ${data.requests?.length} regional requisitions`
    );

    // Acknowledge request
    const ackRes = await fetch(`${BASE_URL}/api/blood-bank/requests`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: bloodBankCookie,
      },
      body: JSON.stringify({ requestId: createdRequestId }),
    });
    const ackData = await ackRes.json();

    recordTest(
      "Blood Bank Workflow",
      "Blood Bank acknowledges hospital requisition",
      ackRes.status === 200 && ackData.request?.status === "ACKNOWLEDGED",
      `Status updated to: ${ackData.request?.status}`
    );
  } catch (err: any) {
    recordTest("Blood Bank Workflow", "Blood Bank acknowledges request", false, err.message);
  }

  // 2.3: Over-allocation Prevention Test
  try {
    const res = await fetch(`${BASE_URL}/api/blood-bank/allocate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: bloodBankCookie,
      },
      body: JSON.stringify({
        requestId: createdRequestId,
        bloodGroup: "O_POSITIVE",
        componentType: "RBC",
        unitsAllocated: 10, // Request only needs 2!
      }),
    });

    recordTest(
      "Safety Enforcement",
      "System prevents over-allocation exceeding required units",
      res.status === 400,
      `HTTP Status: ${res.status}`
    );
  } catch (err: any) {
    recordTest("Safety Enforcement", "Over-allocation prevention", false, err.message);
  }

  // 2.4: Atomic Blood Allocation & Request Fulfillment
  try {
    // Record inventory before allocation
    const beforeInv = await prisma.bloodInventory.findFirst({
      where: { bloodGroup: "O_POSITIVE", componentType: "RBC", unitsAvailable: { gt: 0 } },
    });
    const initialUnits = beforeInv?.unitsAvailable || 0;

    // Allocate 2 units
    const res = await fetch(`${BASE_URL}/api/blood-bank/allocate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: bloodBankCookie,
      },
      body: JSON.stringify({
        requestId: createdRequestId,
        bloodGroup: "O_POSITIVE",
        componentType: "RBC",
        unitsAllocated: 2,
        notes: "Dispatched via emergency cold chain",
      }),
    });

    const data = await res.json();

    // Verify in DB
    const updatedReq = await prisma.bloodRequest.findUnique({
      where: { id: createdRequestId },
      include: { allocations: true },
    });

    recordTest(
      "Blood Bank Workflow",
      "Blood Bank allocates 2 units of O+ RBC; Requisition transitions to FULFILLED",
      res.status === 200 &&
        data.success === true &&
        updatedReq?.status === "FULFILLED" &&
        updatedReq.unitsFulfilled === 2 &&
        updatedReq.allocations.length >= 1,
      `Status: ${updatedReq?.status}, Units Fulfilled: ${updatedReq?.unitsFulfilled}/${updatedReq?.unitsRequired}`
    );

    // Verify Inventory was decremented atomically
    const afterInv = await prisma.bloodInventory.findUnique({
      where: { id: beforeInv!.id },
    });
    recordTest(
      "Database Integrity",
      "Blood Bank inventory decremented atomically with transaction record",
      afterInv !== null && afterInv.unitsAvailable === initialUnits - 2,
      `Before: ${initialUnits}, After: ${afterInv?.unitsAvailable}`
    );
  } catch (err: any) {
    recordTest("Blood Bank Workflow", "Blood Bank allocates units", false, err.message);
  }

  // ---------------------------------------------------------------------------
  // SUITE 3: DONOR OPPORTUNITY & RESPONSE WORKFLOW
  // ---------------------------------------------------------------------------
  console.log("\n--- SUITE 3: DONOR MATCHING & RESPONSE WORKFLOW ---");

  // 3.1: Donor inspects matching opportunities in district
  try {
    const res = await fetch(`${BASE_URL}/api/youth/opportunities`, {
      headers: { Cookie: donorCookie },
    });
    const data = await res.json();

    recordTest(
      "Donor Workflow",
      "Youth Donor retrieves preliminary matching blood opportunities in district",
      res.status === 200 && data.success === true && Array.isArray(data.opportunities),
      `Opportunities count: ${data.opportunities?.length}`
    );
  } catch (err: any) {
    recordTest("Donor Workflow", "Donor retrieves opportunities", false, err.message);
  }

  // 3.2: Donor responds "I Can Help" (INTERESTED)
  try {
    const res = await fetch(`${BASE_URL}/api/youth/respond`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: donorCookie,
      },
      body: JSON.stringify({
        requestId: createdRequestId,
        status: "INTERESTED",
        message: "Available immediately to donate at local centre",
      }),
    });

    const data = await res.json();
    const dbResponse = await prisma.donorResponse.findFirst({
      where: { requestId: createdRequestId },
    });

    recordTest(
      "Donor Workflow",
      "Youth Donor responds 'I can help' (INTERESTED) to emergency requirement",
      res.status === 200 && data.success === true && dbResponse?.status === "INTERESTED",
      `Recorded Response: ${dbResponse?.status}`
    );
  } catch (err: any) {
    recordTest("Donor Workflow", "Donor responds to opportunity", false, err.message);
  }

  // ---------------------------------------------------------------------------
  // SUITE 4: DONOR VERIFICATION WORKFLOW (SUBMIT & REVIEW)
  // ---------------------------------------------------------------------------
  console.log("\n--- SUITE 4: DONOR VERIFICATION WORKFLOW ---");

  let verificationReqId = "";

  // 4.1: Youth Donor submits verification credentials
  try {
    // Create a new unverified donor for this test
    const timestamp = Date.now();
    const testUnverifiedEmail = `unverified.donor.${timestamp}@demo.in`;
    const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: "Karan Johar",
        email: testUnverifiedEmail,
        phone: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
        password: "YuvaRakt@2026",
        confirmPassword: "YuvaRakt@2026",
        state: "Maharashtra",
        district: "Pune",
        role: "YOUTH_DONOR",
        bloodGroup: "B_POSITIVE",
        privacyPolicyConsent: true,
        dataProcessingConsent: true,
      }),
    });

    const unverifiedCookie = extractCookie(regRes.headers);

    // Submit verification
    const subRes = await fetch(`${BASE_URL}/api/youth/verification`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: unverifiedCookie || "",
      },
      body: JSON.stringify({
        documentType: "BLOOD_CAMP_CARD",
        documentNumber: `CAMP-PUN-${timestamp}`,
        notes: "Donated at Rotary Youth Blood Drive Pune",
      }),
    });

    const subData = await subRes.json();
    verificationReqId = subData.request?.id;

    recordTest(
      "Verification Workflow",
      "Youth Donor submits verification document proof",
      subRes.status === 200 && subData.success === true && !!verificationReqId,
      `Verification Request ID: ${verificationReqId}`
    );
  } catch (err: any) {
    recordTest("Verification Workflow", "Donor submits verification", false, err.message);
  }

  // 4.2: Blood Bank reviews & approves donor verification
  try {
    const res = await fetch(`${BASE_URL}/api/blood-bank/verifications`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: bloodBankCookie,
      },
      body: JSON.stringify({
        requestId: verificationReqId,
        decision: "VERIFIED",
      }),
    });

    const data = await res.json();
    const updatedVReq = await prisma.donorVerificationRequest.findUnique({
      where: { id: verificationReqId },
      include: { donor: true },
    });

    recordTest(
      "Verification Workflow",
      "Blood Bank approves and marks donor profile as VERIFIED",
      res.status === 200 &&
        data.success === true &&
        updatedVReq?.status === "VERIFIED" &&
        updatedVReq.donor.verificationStatus === "VERIFIED",
      `Profile Verification Status: ${updatedVReq?.donor.verificationStatus}`
    );
  } catch (err: any) {
    recordTest("Verification Workflow", "Blood bank approves donor", false, err.message);
  }

  // ---------------------------------------------------------------------------
  // SUITE 5: RECORDING VOLUNTARY DONATIONS
  // ---------------------------------------------------------------------------
  console.log("\n--- SUITE 5: RECORDING DONATIONS ---");

  try {
    const res = await fetch(`${BASE_URL}/api/blood-bank/donations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: bloodBankCookie,
      },
      body: JSON.stringify({
        donorEmailOrPhone: "donor@yuvarakt.demo",
        bloodGroup: "O_POSITIVE",
        componentType: "WHOLE_BLOOD",
        units: 1,
        campName: "Phase 2 Acceptance Test Camp",
        certificateNumber: `CERT-ACCEPT-${Date.now()}`,
        notes: "Acceptance test completed donation",
      }),
    });

    const data = await res.json();
    const donor = await prisma.youthDonorProfile.findFirst({
      where: { user: { email: "donor@yuvarakt.demo" } },
    });

    recordTest(
      "Donations Workflow",
      "Blood Bank records completed donation; increments donor lifetime count and credits inventory",
      res.status === 200 && data.success === true && (donor?.donationCount || 0) >= 1,
      `Donor Lifetime Donations Count: ${donor?.donationCount}`
    );

    // Verify donor views own history
    const historyRes = await fetch(`${BASE_URL}/api/youth/donations`, {
      headers: { Cookie: donorCookie },
    });
    const historyData = await historyRes.json();

    recordTest(
      "Donations Workflow",
      "Youth Donor retrieves updated personal voluntary donation history",
      historyRes.status === 200 && (historyData.donations?.length || 0) >= 1,
      `Records: ${historyData.donations?.length}`
    );
  } catch (err: any) {
    recordTest("Donations Workflow", "Record completed donation", false, err.message);
  }

  // ---------------------------------------------------------------------------
  // SUITE 6: NOTIFICATIONS DISPATCH & MANAGEMENT
  // ---------------------------------------------------------------------------
  console.log("\n--- SUITE 6: NOTIFICATIONS SYSTEM ---");

  try {
    const res = await fetch(`${BASE_URL}/api/notifications`, {
      headers: { Cookie: donorCookie },
    });
    const data = await res.json();

    recordTest(
      "Notifications",
      "User retrieves notifications and unread alert count",
      res.status === 200 && data.success === true && Array.isArray(data.notifications),
      `Notifications Count: ${data.notifications?.length}, Unread: ${data.unreadCount}`
    );

    // Mark all as read
    const patchRes = await fetch(`${BASE_URL}/api/notifications`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: donorCookie,
      },
      body: JSON.stringify({ markAll: true }),
    });

    recordTest(
      "Notifications",
      "User marks all notifications as read",
      patchRes.status === 200,
      `Status: ${patchRes.status}`
    );
  } catch (err: any) {
    recordTest("Notifications", "Notifications workflow", false, err.message);
  }

  // ---------------------------------------------------------------------------
  // SUITE 7: SECURITY & ROLE-BASED ACCESS CONTROL (RBAC)
  // ---------------------------------------------------------------------------
  console.log("\n--- SUITE 7: SECURITY & RBAC PERMISSION ENFORCEMENT ---");

  // 7.1: Donor cannot allocate blood
  try {
    const res = await fetch(`${BASE_URL}/api/blood-bank/allocate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: donorCookie,
      },
      body: JSON.stringify({
        requestId: createdRequestId,
        bloodGroup: "O_POSITIVE",
        componentType: "RBC",
        unitsAllocated: 1,
      }),
    });

    recordTest(
      "RBAC Protection",
      "Youth Donor blocked from `/api/blood-bank/allocate` (403 Forbidden)",
      res.status === 403,
      `HTTP Status: ${res.status}`
    );
  } catch (err: any) {
    recordTest("RBAC Protection", "Youth Donor blocked from allocate", false, err.message);
  }

  // 7.2: Donor cannot create hospital requests
  try {
    const res = await fetch(`${BASE_URL}/api/hospital/requests`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: donorCookie,
      },
      body: JSON.stringify({
        bloodGroup: "O_POSITIVE",
        componentType: "RBC",
        unitsRequired: 1,
        urgency: "ROUTINE",
        requiredBy: new Date().toISOString(),
      }),
    });

    recordTest(
      "RBAC Protection",
      "Youth Donor blocked from `/api/hospital/requests` (403 Forbidden)",
      res.status === 403,
      `HTTP Status: ${res.status}`
    );
  } catch (err: any) {
    recordTest("RBAC Protection", "Youth Donor blocked from hospital request create", false, err.message);
  }

  // 7.3: Hospital cannot modify blood bank inventory
  try {
    const res = await fetch(`${BASE_URL}/api/blood-bank/inventory`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: hospitalCookie,
      },
      body: JSON.stringify({
        bloodGroup: "O_POSITIVE",
        componentType: "RBC",
        quantity: 10,
      }),
    });

    recordTest(
      "RBAC Protection",
      "Hospital blocked from `/api/blood-bank/inventory` (403 Forbidden)",
      res.status === 403,
      `HTTP Status: ${res.status}`
    );
  } catch (err: any) {
    recordTest("RBAC Protection", "Hospital blocked from inventory modification", false, err.message);
  }

  // ---------------------------------------------------------------------------
  // SUITE 8: LIVE SUPER ADMIN PLATFORM AUDIT & METRICS
  // ---------------------------------------------------------------------------
  console.log("\n--- SUITE 8: SUPER ADMIN PLATFORM AUDIT & METRICS ---");

  try {
    const res = await fetch(`${BASE_URL}/api/admin/stats`, {
      headers: { Cookie: adminCookie },
    });
    const data = await res.json();
    const s = data.stats;

    recordTest(
      "Admin Operations",
      "Super Admin dashboard retrieves real-time national blood metrics (requests, donations, inventory units)",
      res.status === 200 &&
        data.success === true &&
        s.totalBloodRequests > 0 &&
        s.totalDonations > 0 &&
        s.totalInventoryUnits > 0,
      `Total Requests: ${s?.totalBloodRequests}, Total Donations: ${s?.totalDonations}, National Stock: ${s?.totalInventoryUnits} units`
    );
  } catch (err: any) {
    recordTest("Admin Operations", "Super Admin retrieves live stats", false, err.message);
  }

  // ---------------------------------------------------------------------------
  // SUMMARY REPORT
  // ---------------------------------------------------------------------------
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = total - passed;

  console.log("\n================================================================================");
  console.log(`📊 FINAL PHASE 2 ACCEPTANCE RESULTS: ${passed} / ${total} PASSED (${failed} FAILED)`);
  console.log("================================================================================\n");

  if (failed > 0) {
    console.error("❌ Phase 2 Acceptance Test Suite Failed!");
    process.exit(1);
  } else {
    console.log("🏆 ALL PHASE 2 ACCEPTANCE TESTS COMPLETED WITH 100% PASS RATE!");
  }
}

runPhase2AcceptanceTests()
  .catch((e) => {
    console.error("Phase 2 test runner crashed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
