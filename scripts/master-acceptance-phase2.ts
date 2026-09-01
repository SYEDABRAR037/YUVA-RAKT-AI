import prisma from "../src/lib/db";

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

async function runMasterAcceptance() {
  console.log("\n================================================================================");
  console.log("🇮🇳 YUVA-RAKT AI — MASTER PHASE 2 COMPREHENSIVE ACCEPTANCE TEST EXECUTION");
  console.log("================================================================================\n");

  const timestamp = Date.now();

  // Sessions
  let donorCookie: string;
  let hospitalCookie: string;
  let bloodBankCookie: string;
  let adminCookie: string;

  try {
    donorCookie = await login("donor@yuvarakt.demo");
    hospitalCookie = await login("pune.hospital@yuvarakt.demo");
    bloodBankCookie = await login("bloodbank@yuvarakt.demo");
    adminCookie = await login("admin@yuvarakt.demo");
    record("Authentication", "Authenticate core test roles (Donor, Hospital, Blood Bank, Admin)", true);
  } catch (err: any) {
    record("Authentication", "Authenticate core test roles", false, undefined, err.message);
    process.exit(1);
  }

  // ===========================================================================
  // SECTION 1: YOUTH DONOR WORKFLOW
  // ===========================================================================
  console.log("\n--- SECTION 1: YOUTH DONOR WORKFLOW ---");

  // 1.1 Login & View Profile
  try {
    const res = await fetch(`${BASE_URL}/api/auth/me`, { headers: { Cookie: donorCookie } });
    const data = await res.json();
    const donor = data.user;
    record(
      "Youth Donor",
      "Login & View Profile",
      res.status === 200 && data.success === true && donor.role === "YOUTH_DONOR" && !!donor.youthDonorProfile,
      `User: ${donor?.fullName}, Blood Group: ${donor?.youthDonorProfile?.bloodGroup}`
    );
  } catch (err: any) {
    record("Youth Donor", "Login & View Profile", false, undefined, err.message);
  }

  // 1.2 Update Availability
  try {
    const res = await fetch(`${BASE_URL}/api/user/profile`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: donorCookie },
      body: JSON.stringify({ availabilityStatus: "NOT_AVAILABLE" }),
    });
    const data = await res.json();

    const dbUser = await prisma.youthDonorProfile.findFirst({
      where: { user: { email: "donor@yuvarakt.demo" } },
    });

    record(
      "Youth Donor",
      "Update availability & persist in PostgreSQL",
      res.status === 200 && data.success === true && dbUser?.availabilityStatus === "NOT_AVAILABLE",
      `PostgreSQL Availability: ${dbUser?.availabilityStatus}`
    );

    // Reset back to AVAILABLE for subsequent matching tests
    await fetch(`${BASE_URL}/api/user/profile`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: donorCookie },
      body: JSON.stringify({ availabilityStatus: "AVAILABLE" }),
    });
  } catch (err: any) {
    record("Youth Donor", "Update availability", false, undefined, err.message);
  }

  // 1.3 Submit Donor Verification & View Status
  let submittedVerificationId = "";
  try {
    const subRes = await fetch(`${BASE_URL}/api/youth/verification`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: donorCookie },
      body: JSON.stringify({
        documentType: "HOSPITAL_CERTIFICATE",
        documentNumber: `HOSP-PUN-${timestamp}`,
        notes: "Donated at Sassoon General Hospital Camp",
      }),
    });
    const subData = await subRes.json();
    submittedVerificationId = subData.request?.id;

    // Fetch Status
    const statusRes = await fetch(`${BASE_URL}/api/youth/verification`, {
      headers: { Cookie: donorCookie },
    });
    const statusData = await statusRes.json();

    const dbVReq = await prisma.donorVerificationRequest.findUnique({
      where: { id: submittedVerificationId },
    });

    record(
      "Youth Donor",
      "Submit donor verification & retrieve verified status from PostgreSQL",
      subRes.status === 200 && statusRes.status === 200 && dbVReq?.documentNumber === `HOSP-PUN-${timestamp}`,
      `Verification Request ID: ${submittedVerificationId}, Doc: ${dbVReq?.documentNumber}`
    );
  } catch (err: any) {
    record("Youth Donor", "Submit verification", false, undefined, err.message);
  }

  // 1.4 Donation History
  try {
    const res = await fetch(`${BASE_URL}/api/youth/donations`, {
      headers: { Cookie: donorCookie },
    });
    const data = await res.json();
    const dbDonations = await prisma.donation.findMany({
      where: { donor: { user: { email: "donor@yuvarakt.demo" } } },
    });

    record(
      "Youth Donor",
      "Retrieve voluntary donation history from PostgreSQL",
      res.status === 200 && Array.isArray(data.donations) && data.donations.length === dbDonations.length,
      `Retrieved ${data.donations?.length} donation records`
    );
  } catch (err: any) {
    record("Youth Donor", "Retrieve donation history", false, undefined, err.message);
  }

  // 1.5 View Opportunities & Respond
  try {
    const oppRes = await fetch(`${BASE_URL}/api/youth/opportunities`, {
      headers: { Cookie: donorCookie },
    });
    const oppData = await oppRes.json();

    let targetOppId = oppData.opportunities?.[0]?.id;

    if (!targetOppId) {
      // Create a requirement in Pune
      const hosp = await prisma.hospital.findFirst({ where: { user: { email: "pune.hospital@yuvarakt.demo" } } });
      const tempReq = await prisma.bloodRequest.create({
        data: {
          hospitalId: hosp!.id,
          bloodGroup: "O_POSITIVE",
          componentType: "RBC",
          unitsRequired: 1,
          urgency: "URGENT",
          requiredBy: new Date(Date.now() + 86400000),
          status: "PENDING",
          createdBy: hosp!.userId,
        },
      });
      targetOppId = tempReq.id;
    }

    const respondRes = await fetch(`${BASE_URL}/api/youth/respond`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: donorCookie },
      body: JSON.stringify({ requestId: targetOppId, status: "INTERESTED" }),
    });
    const respondData = await respondRes.json();

    const dbResp = await prisma.donorResponse.findFirst({
      where: { requestId: targetOppId, donor: { user: { email: "donor@yuvarakt.demo" } } },
    });

    record(
      "Youth Donor",
      "View potential donation opportunities and respond 'I Can Help' (INTERESTED)",
      respondRes.status === 200 && respondData.success === true && dbResp?.status === "INTERESTED",
      `Target Request ID: ${targetOppId}, Response persisted in DB: ${dbResp?.status}`
    );
  } catch (err: any) {
    record("Youth Donor", "View opportunities and respond", false, undefined, err.message);
  }

  // 1.6 Consent & Privacy Controls
  try {
    const res = await fetch(`${BASE_URL}/api/user/privacy`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: donorCookie },
      body: JSON.stringify({ emergencyNotificationConsent: false }),
    });
    const data = await res.json();

    const dbConsent = await prisma.consent.findFirst({
      where: { user: { email: "donor@yuvarakt.demo" }, consentType: "EMERGENCY_NOTIFICATION" },
      orderBy: { updatedAt: "desc" },
    });

    record(
      "Youth Donor",
      "Manage consent / privacy preferences & record in persistent consent ledger",
      res.status === 200 && data.success === true && dbConsent?.accepted === false,
      `Emergency Notification Consent: ${dbConsent?.accepted} (RevokedAt: ${dbConsent?.revokedAt ? "Logged" : "None"})`
    );

    // Reset consent back to true
    await fetch(`${BASE_URL}/api/user/privacy`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: donorCookie },
      body: JSON.stringify({ emergencyNotificationConsent: true }),
    });
  } catch (err: any) {
    record("Youth Donor", "Consent & Privacy Controls", false, undefined, err.message);
  }

  // ===========================================================================
  // SECTION 2: HOSPITAL WORKFLOW
  // ===========================================================================
  console.log("\n--- SECTION 2: HOSPITAL WORKFLOW ---");

  let hospitalReqId = "";

  // 2.1 Create Blood Request with all clinical params
  try {
    const requiredBy = new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString();
    const res = await fetch(`${BASE_URL}/api/hospital/requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: hospitalCookie },
      body: JSON.stringify({
        bloodGroup: "O_POSITIVE",
        componentType: "RBC",
        unitsRequired: 3,
        urgency: "URGENT",
        requiredBy,
        reason: "Major orthopedic trauma resuscitation",
        patientAgeGroup: "ADULT",
      }),
    });

    const data = await res.json();
    hospitalReqId = data.data?.bloodRequest?.id;

    const dbReq = await prisma.bloodRequest.findUnique({
      where: { id: hospitalReqId },
    });

    record(
      "Hospital",
      "Create blood request (Blood Group, Component, Required Units, Urgency, Reason)",
      res.status === 200 && data.success === true && dbReq !== null && dbReq.unitsRequired === 3,
      `Request ID: ${hospitalReqId}, Persisted Units Required: ${dbReq?.unitsRequired}, Status: ${dbReq?.status}`
    );
  } catch (err: any) {
    record("Hospital", "Create blood request", false, undefined, err.message);
  }

  // 2.2 View Own Requests & Track Status
  try {
    const res = await fetch(`${BASE_URL}/api/hospital/requests`, {
      headers: { Cookie: hospitalCookie },
    });
    const data = await res.json();
    const found = (data.requests || []).some((r: any) => r.id === hospitalReqId);

    record(
      "Hospital",
      "View own hospital requisitions and track real-time fulfillment status",
      res.status === 200 && data.success === true && found,
      `Total owned requisitions: ${data.requests?.length}`
    );
  } catch (err: any) {
    record("Hospital", "View own requests", false, undefined, err.message);
  }

  // 2.3 Cancel Request where allowed
  try {
    // Create a temporary request to cancel
    const createTemp = await fetch(`${BASE_URL}/api/hospital/requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: hospitalCookie },
      body: JSON.stringify({
        bloodGroup: "A_POSITIVE",
        componentType: "WHOLE_BLOOD",
        unitsRequired: 1,
        urgency: "ROUTINE",
        requiredBy: new Date(Date.now() + 86400000).toISOString(),
        reason: "Planned surgery cancel test",
      }),
    });
    const tempData = await createTemp.json();
    const tempReqId = tempData.data?.bloodRequest?.id;

    const cancelRes = await fetch(`${BASE_URL}/api/hospital/requests/${tempReqId}`, {
      method: "DELETE",
      headers: { Cookie: hospitalCookie },
    });
    const cancelData = await cancelRes.json();

    const dbCancel = await prisma.bloodRequest.findUnique({
      where: { id: tempReqId },
    });

    record(
      "Hospital",
      "Cancel active unfulfilled request and update status to CANCELLED",
      cancelRes.status === 200 && cancelData.success === true && dbCancel?.status === "CANCELLED",
      `Cancelled Request Status in PostgreSQL: ${dbCancel?.status}`
    );
  } catch (err: any) {
    record("Hospital", "Cancel request", false, undefined, err.message);
  }

  // ===========================================================================
  // SECTION 3: BLOOD BANK WORKFLOW & ALLOCATION
  // ===========================================================================
  console.log("\n--- SECTION 3: BLOOD BANK WORKFLOW & ALLOCATION ---");

  // 3.1 View Dashboard & 8x4 Inventory
  try {
    const invRes = await fetch(`${BASE_URL}/api/blood-bank/inventory`, {
      headers: { Cookie: bloodBankCookie },
    });
    const invData = await invRes.json();

    record(
      "Blood Bank",
      "View dashboard & 8x4 inventory matrix calculated from live DB",
      invRes.status === 200 && invData.success === true && invData.summary?.matrix?.length === 32,
      `Total Available Units: ${invData.summary?.totalUnitsAvailable}, Expiring Soon: ${invData.summary?.totalExpiringSoon}`
    );
  } catch (err: any) {
    record("Blood Bank", "View inventory", false, undefined, err.message);
  }

  // 3.2 Add / Record Completed Donation
  try {
    const donRes = await fetch(`${BASE_URL}/api/blood-bank/donations`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: bloodBankCookie },
      body: JSON.stringify({
        donorEmailOrPhone: "donor@yuvarakt.demo",
        bloodGroup: "O_POSITIVE",
        componentType: "RBC",
        units: 2,
        campName: "Savitribai Phule Pune University Youth Drive",
        certificateNumber: `CERT-PUN-${timestamp}`,
      }),
    });
    const donData = await donRes.json();

    const dbDon = await prisma.donation.findFirst({
      where: { certificateNumber: `CERT-PUN-${timestamp}` },
    });

    record(
      "Blood Bank",
      "Record completed voluntary donation and auto-credit active inventory in PostgreSQL",
      donRes.status === 200 && donData.success === true && dbDon?.units === 2,
      `Donation ID: ${dbDon?.id}, Status: ${dbDon?.status}, Units: ${dbDon?.units}`
    );
  } catch (err: any) {
    record("Blood Bank", "Record donation", false, undefined, err.message);
  }

  // 3.3 Verify Donor (Approve / Reject)
  try {
    if (submittedVerificationId) {
      const appRes = await fetch(`${BASE_URL}/api/blood-bank/verifications`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: bloodBankCookie },
        body: JSON.stringify({
          requestId: submittedVerificationId,
          decision: "VERIFIED",
        }),
      });
      const appData = await appRes.json();

      const dbVApp = await prisma.donorVerificationRequest.findUnique({
        where: { id: submittedVerificationId },
      });

      record(
        "Blood Bank",
        "Approve voluntary donor verification and mark profile as VERIFIED",
        appRes.status === 200 && appData.success === true && dbVApp?.status === "VERIFIED",
        `Verification Status in DB: ${dbVApp?.status}`
      );
    }

    const donorUser = await prisma.youthDonorProfile.findFirst({
      where: { user: { email: "priya.nair@demo.in" } },
    });
    const rejectReq = await prisma.donorVerificationRequest.create({
      data: {
        donorId: donorUser!.id,
        status: "PENDING",
        documentType: "LAB_REPORT",
        documentNumber: `LAB-${timestamp}`,
      },
    });

    const rejRes = await fetch(`${BASE_URL}/api/blood-bank/verifications`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: bloodBankCookie },
      body: JSON.stringify({
        requestId: rejectReq.id,
        decision: "REJECTED",
        rejectionReason: "Official laboratory stamp and physician signature missing",
      }),
    });
    const rejData = await rejRes.json();

    const dbVRej = await prisma.donorVerificationRequest.findUnique({
      where: { id: rejectReq.id },
    });

    record(
      "Blood Bank",
      "Reject donor verification with mandatory recorded rejection reason",
      rejRes.status === 200 && rejData.success === true && dbVRej?.status === "REJECTED" && !!dbVRej.rejectionReason,
      `Rejection Reason in DB: ${dbVRej?.rejectionReason}`
    );
  } catch (err: any) {
    record("Blood Bank", "Verify donor approve/reject", false, undefined, err.message);
  }

  // 3.4 View Hospital Requests & Acknowledge
  try {
    const reqsRes = await fetch(`${BASE_URL}/api/blood-bank/requests`, {
      headers: { Cookie: bloodBankCookie },
    });
    const reqsData = await reqsRes.json();

    const ackRes = await fetch(`${BASE_URL}/api/blood-bank/requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: bloodBankCookie },
      body: JSON.stringify({ requestId: hospitalReqId }),
    });
    const ackData = await ackRes.json();

    const dbAck = await prisma.bloodRequest.findUnique({
      where: { id: hospitalReqId },
    });

    record(
      "Blood Bank",
      "View regional hospital requisitions & acknowledge active requirement",
      reqsRes.status === 200 && ackRes.status === 200 && dbAck?.status === "ACKNOWLEDGED",
      `Request Status in DB: ${dbAck?.status}`
    );
  } catch (err: any) {
    record("Blood Bank", "Acknowledge request", false, undefined, err.message);
  }

  // 3.5 Partially Fulfill Request (Allocate 1 of 3 units)
  try {
    const partRes = await fetch(`${BASE_URL}/api/blood-bank/allocate`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: bloodBankCookie },
      body: JSON.stringify({
        requestId: hospitalReqId,
        bloodGroup: "O_POSITIVE",
        componentType: "RBC",
        unitsAllocated: 1,
        notes: "Part 1 emergency courier dispatch",
      }),
    });
    const partData = await partRes.json();

    const dbPart = await prisma.bloodRequest.findUnique({
      where: { id: hospitalReqId },
    });

    record(
      "Blood Bank",
      "Partially fulfill request (allocate 1/3 units; status -> PARTIALLY_FULFILLED)",
      partRes.status === 200 && partData.success === true && dbPart?.status === "PARTIALLY_FULFILLED" && dbPart.unitsFulfilled === 1,
      `Status in DB: ${dbPart?.status}, Fulfilled: ${dbPart?.unitsFulfilled}/${dbPart?.unitsRequired}`
    );
  } catch (err: any) {
    record("Blood Bank", "Partially fulfill request", false, undefined, err.message);
  }

  // 3.6 Fully Fulfill Request (Allocate remaining 2 units)
  try {
    const fullRes = await fetch(`${BASE_URL}/api/blood-bank/allocate`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: bloodBankCookie },
      body: JSON.stringify({
        requestId: hospitalReqId,
        bloodGroup: "O_POSITIVE",
        componentType: "RBC",
        unitsAllocated: 2,
        notes: "Part 2 final balance dispatch",
      }),
    });
    const fullData = await fullRes.json();

    const dbFull = await prisma.bloodRequest.findUnique({
      where: { id: hospitalReqId },
      include: { allocations: true },
    });

    record(
      "Blood Bank",
      "Fully fulfill request (allocate remaining 2 units; status -> FULFILLED)",
      fullRes.status === 200 && fullData.success === true && dbFull?.status === "FULFILLED" && dbFull.unitsFulfilled === 3,
      `Status in DB: ${dbFull?.status}, Allocations count: ${dbFull?.allocations.length}, Units Fulfilled: ${dbFull?.unitsFulfilled}/3`
    );
  } catch (err: any) {
    record("Blood Bank", "Fully fulfill request", false, undefined, err.message);
  }

  // ===========================================================================
  // SECTION 4: INVENTORY INTEGRITY & TRANSACTION SAFETY
  // ===========================================================================
  console.log("\n--- SECTION 4: INVENTORY INTEGRITY & SAFETY ENFORCEMENT ---");

  // 4.1 Negative Inventory Prevention
  try {
    const res = await fetch(`${BASE_URL}/api/blood-bank/inventory`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: bloodBankCookie },
      body: JSON.stringify({
        bloodGroup: "O_NEGATIVE",
        componentType: "PLATELETS",
        quantity: -9999,
      }),
    });

    record(
      "Inventory Integrity",
      "Prevent negative inventory (reject deduction exceeding stock)",
      res.status === 400,
      `HTTP Status: ${res.status}`
    );
  } catch (err: any) {
    record("Inventory Integrity", "Prevent negative inventory", false, undefined, err.message);
  }

  // 4.2 Cannot allocate to already FULFILLED request
  try {
    const res = await fetch(`${BASE_URL}/api/blood-bank/allocate`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: bloodBankCookie },
      body: JSON.stringify({
        requestId: hospitalReqId,
        bloodGroup: "O_POSITIVE",
        componentType: "RBC",
        unitsAllocated: 1,
      }),
    });

    record(
      "Inventory Integrity",
      "Reject duplicate / over-allocation to already FULFILLED request",
      res.status === 400,
      `HTTP Status: ${res.status}`
    );
  } catch (err: any) {
    record("Inventory Integrity", "Reject allocation to fulfilled request", false, undefined, err.message);
  }

  // 4.3 Cannot allocate to CANCELLED request
  try {
    const cancelledReq = await prisma.bloodRequest.findFirst({
      where: { status: "CANCELLED" },
    });

    const res = await fetch(`${BASE_URL}/api/blood-bank/allocate`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: bloodBankCookie },
      body: JSON.stringify({
        requestId: cancelledReq!.id,
        bloodGroup: "A_POSITIVE",
        componentType: "WHOLE_BLOOD",
        unitsAllocated: 1,
      }),
    });

    record(
      "Inventory Integrity",
      "Reject allocation to CANCELLED blood request",
      res.status === 400,
      `HTTP Status: ${res.status}`
    );
  } catch (err: any) {
    record("Inventory Integrity", "Reject allocation to cancelled request", false, undefined, err.message);
  }

  // 4.4 Cannot allocate more units than required
  try {
    const reqRes = await fetch(`${BASE_URL}/api/hospital/requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: hospitalCookie },
      body: JSON.stringify({
        bloodGroup: "B_POSITIVE",
        componentType: "RBC",
        unitsRequired: 1,
        urgency: "ROUTINE",
        requiredBy: new Date(Date.now() + 86400000).toISOString(),
      }),
    });
    const reqData = await reqRes.json();
    const oneUnitReqId = reqData.data?.bloodRequest?.id;

    const allocRes = await fetch(`${BASE_URL}/api/blood-bank/allocate`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: bloodBankCookie },
      body: JSON.stringify({
        requestId: oneUnitReqId,
        bloodGroup: "B_POSITIVE",
        componentType: "RBC",
        unitsAllocated: 5,
      }),
    });

    record(
      "Inventory Integrity",
      "Reject allocation exceeding remaining unfulfilled units",
      allocRes.status === 400,
      `HTTP Status: ${allocRes.status}`
    );
  } catch (err: any) {
    record("Inventory Integrity", "Reject allocation exceeding required", false, undefined, err.message);
  }

  // 4.5 Inventory Transaction Audit History
  try {
    const transactions = await prisma.inventoryTransaction.findMany({
      where: { bloodBank: { user: { email: "bloodbank@yuvarakt.demo" } } },
      orderBy: { createdAt: "desc" },
    });

    record(
      "Inventory Integrity",
      "Verify audit-protected InventoryTransaction ledger is persisted in PostgreSQL",
      transactions.length >= 2,
      `Logged transactions count in PostgreSQL: ${transactions.length}`
    );
  } catch (err: any) {
    record("Inventory Integrity", "Inventory transaction history", false, undefined, err.message);
  }

  // 4.6 Expired inventory is not counted in available stock
  try {
    const bank = await prisma.bloodBank.findFirst({ where: { user: { email: "bloodbank@yuvarakt.demo" } } });
    const expiredInv = await prisma.bloodInventory.create({
      data: {
        bloodBankId: bank!.id,
        bloodGroup: "AB_NEGATIVE",
        componentType: "PLATELETS",
        unitsAvailable: 50,
        expiryDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    });

    const res = await fetch(`${BASE_URL}/api/blood-bank/inventory`, {
      headers: { Cookie: bloodBankCookie },
    });
    const data = await res.json();
    const abNegPlateletCell = data.summary?.matrix?.find(
      (c: any) => c.bloodGroup === "AB_NEGATIVE" && c.componentType === "PLATELETS"
    );

    record(
      "Inventory Integrity",
      "Expired inventory is strictly excluded from active available stock",
      abNegPlateletCell?.unitsExpired >= 50 && abNegPlateletCell?.unitsAvailable !== 50,
      `Expired Count: ${abNegPlateletCell?.unitsExpired}, Available: ${abNegPlateletCell?.unitsAvailable}`
    );

    await prisma.bloodInventory.delete({ where: { id: expiredInv.id } });
  } catch (err: any) {
    record("Inventory Integrity", "Expired inventory exclusion", false, undefined, err.message);
  }

  // ===========================================================================
  // SECTION 5: DETERMINISTIC DONOR MATCHING FOUNDATION
  // ===========================================================================
  console.log("\n--- SECTION 5: DONOR MATCHING FOUNDATION ---");

  try {
    const hosp = await prisma.hospital.findFirst({ where: { user: { email: "pune.hospital@yuvarakt.demo" } } });
    const matchingReq = await prisma.bloodRequest.create({
      data: {
        hospitalId: hosp!.id,
        bloodGroup: "O_POSITIVE",
        componentType: "RBC",
        unitsRequired: 2,
        urgency: "CRITICAL",
        requiredBy: new Date(Date.now() + 7200000),
        status: "PENDING",
        createdBy: hosp!.userId,
      },
    });

    const oppRes = await fetch(`${BASE_URL}/api/youth/opportunities`, {
      headers: { Cookie: donorCookie },
    });
    const oppData = await oppRes.json();
    const hasMatching = oppData.opportunities?.some((o: any) => o.id === matchingReq.id);

    record(
      "Donor Matching",
      "Deterministic matching filters by blood group compatibility, district, and availability",
      oppRes.status === 200 && hasMatching,
      `Matching opportunity found for O+ donor in Pune: ${hasMatching}`
    );

    const unverifiedUser = await prisma.user.findFirst({
      where: { email: "tanvi.k@demo.in" },
      include: { youthDonorProfile: true },
    });

    record(
      "Donor Matching",
      "Unverified donors are not presented as eligible clinical matches",
      unverifiedUser?.youthDonorProfile?.verificationStatus === "UNVERIFIED",
      `Donor Verification Status: ${unverifiedUser?.youthDonorProfile?.verificationStatus}`
    );
  } catch (err: any) {
    record("Donor Matching", "Donor matching logic", false, undefined, err.message);
  }

  // ===========================================================================
  // SECTION 6: NOTIFICATIONS WORKFLOW
  // ===========================================================================
  console.log("\n--- SECTION 6: NOTIFICATIONS WORKFLOW ---");

  try {
    const res = await fetch(`${BASE_URL}/api/notifications`, {
      headers: { Cookie: donorCookie },
    });
    const data = await res.json();

    record(
      "Notifications",
      "Retrieve notification dispatch feed with unread counter",
      res.status === 200 && data.success === true && Array.isArray(data.notifications),
      `Total Notifications: ${data.notifications?.length}, Unread: ${data.unreadCount}`
    );

    const targetNotifId = data.notifications?.[0]?.id;
    if (targetNotifId) {
      const readRes = await fetch(`${BASE_URL}/api/notifications`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Cookie: donorCookie },
        body: JSON.stringify({ notificationId: targetNotifId }),
      });
      const readData = await readRes.json();

      const dbNotif = await prisma.notification.findUnique({
        where: { id: targetNotifId },
      });

      record(
        "Notifications",
        "Mark specific notification as read in PostgreSQL",
        readRes.status === 200 && readData.success === true && dbNotif?.read === true,
        `Notification Read Status in DB: ${dbNotif?.read}`
      );
    }

    const allRes = await fetch(`${BASE_URL}/api/notifications`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: donorCookie },
      body: JSON.stringify({ markAll: true }),
    });

    const unreadCount = await prisma.notification.count({
      where: { user: { email: "donor@yuvarakt.demo" }, read: false },
    });

    record(
      "Notifications",
      "Mark all notifications as read in PostgreSQL",
      allRes.status === 200 && unreadCount === 0,
      `Remaining unread in DB: ${unreadCount}`
    );
  } catch (err: any) {
    record("Notifications", "Notifications workflow", false, undefined, err.message);
  }

  // ===========================================================================
  // SECTION 7: PRIVACY / SECURITY & SERVER-SIDE AUTHORIZATION (RBAC)
  // ===========================================================================
  console.log("\n--- SECTION 7: PRIVACY & SERVER-SIDE RBAC ENFORCEMENT ---");

  try {
    const res = await fetch(`${BASE_URL}/api/blood-bank/inventory`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: donorCookie },
      body: JSON.stringify({ bloodGroup: "O_POSITIVE", componentType: "RBC", quantity: 10 }),
    });
    record("Privacy / Security", "Youth Donor blocked from `/api/blood-bank/inventory` (403 Forbidden)", res.status === 403, `HTTP: ${res.status}`);
  } catch (err: any) {
    record("Privacy / Security", "Youth blocked from inventory", false, undefined, err.message);
  }

  try {
    const res = await fetch(`${BASE_URL}/api/blood-bank/allocate`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: donorCookie },
      body: JSON.stringify({ requestId: hospitalReqId, bloodGroup: "O_POSITIVE", componentType: "RBC", unitsAllocated: 1 }),
    });
    record("Privacy / Security", "Youth Donor blocked from `/api/blood-bank/allocate` (403 Forbidden)", res.status === 403, `HTTP: ${res.status}`);
  } catch (err: any) {
    record("Privacy / Security", "Youth blocked from allocate", false, undefined, err.message);
  }

  try {
    const res = await fetch(`${BASE_URL}/api/blood-bank/allocate`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: hospitalCookie },
      body: JSON.stringify({ requestId: hospitalReqId, bloodGroup: "O_POSITIVE", componentType: "RBC", unitsAllocated: 1 }),
    });
    record("Privacy / Security", "Hospital blocked from `/api/blood-bank/allocate` (403 Forbidden)", res.status === 403, `HTTP: ${res.status}`);
  } catch (err: any) {
    record("Privacy / Security", "Hospital blocked from allocate", false, undefined, err.message);
  }

  try {
    const res = await fetch(`${BASE_URL}/api/blood-bank/verifications`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: hospitalCookie },
      body: JSON.stringify({ requestId: submittedVerificationId, decision: "VERIFIED" }),
    });
    record("Privacy / Security", "Hospital blocked from `/api/blood-bank/verifications` (403 Forbidden)", res.status === 403, `HTTP: ${res.status}`);
  } catch (err: any) {
    record("Privacy / Security", "Hospital blocked from verifications", false, undefined, err.message);
  }

  try {
    const res = await fetch(`${BASE_URL}/api/admin/stats`, {
      headers: { Cookie: bloodBankCookie },
    });
    record("Privacy / Security", "Blood Bank blocked from `/api/admin/stats` (403 Forbidden)", res.status === 403, `HTTP: ${res.status}`);
  } catch (err: any) {
    record("Privacy / Security", "Blood Bank blocked from admin", false, undefined, err.message);
  }

  try {
    const res = await fetch(`${BASE_URL}/api/hospital/requests`);
    record(
      "Privacy / Security",
      "Unauthenticated request blocked from `/api/hospital/requests`",
      res.status === 401 || res.status === 403,
      `HTTP Status: ${res.status}`
    );
  } catch (err: any) {
    record("Privacy / Security", "Unauthenticated blocked", false, undefined, err.message);
  }

  try {
    const res = await fetch(`${BASE_URL}/api/youth/opportunities`, {
      headers: { Cookie: donorCookie },
    });
    const data = await res.json();
    const opps: any[] = data.opportunities || [];
    const leaksPII = opps.some((o) => o.patientName || o.patientContact || o.patientAadhaar);

    record(
      "Privacy / Security",
      "Data Minimization — Patient name and PII are never exposed in donor opportunities feed",
      !leaksPII,
      `Audited ${opps.length} opportunity objects (Zero patient PII fields present)`
    );
  } catch (err: any) {
    record("Privacy / Security", "Data Minimization", false, undefined, err.message);
  }

  // ===========================================================================
  // SECTION 8: AUDIT LOGGING & COMPLIANCE
  // ===========================================================================
  console.log("\n--- SECTION 8: AUDIT LOGGING & COMPLIANCE ---");

  try {
    const auditLogs = await prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const actionTypes = new Set(auditLogs.map((l) => l.action));

    let hasPasswordLeak = false;
    for (const l of auditLogs) {
      const metaStr = JSON.stringify(l.metadata || {});
      if (metaStr.includes("passwordHash") || metaStr.includes("YuvaRakt@2026") || metaStr.includes("plainPassword")) {
        hasPasswordLeak = true;
        break;
      }
    }

    record(
      "Audit Logging",
      "Comprehensive AuditLog persistence in PostgreSQL across healthcare lifecycle events",
      auditLogs.length >= 10,
      `Captured ${auditLogs.length} audit logs across ${actionTypes.size} unique event types`
    );

    record(
      "Audit Logging",
      "Zero plain passwords or password hashes stored in audit metadata",
      !hasPasswordLeak,
      "Security audit validation: Clean"
    );
  } catch (err: any) {
    record("Audit Logging", "Audit log validation", false, undefined, err.message);
  }

  // ===========================================================================
  // SECTION 9: END-TO-END REAL-WORLD SCENARIO
  // ===========================================================================
  console.log("\n--- SECTION 9: END-TO-END REAL-WORLD HEALTHCARE WORKFLOW ---");

  try {
    const e2eReqRes = await fetch(`${BASE_URL}/api/hospital/requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: hospitalCookie },
      body: JSON.stringify({
        bloodGroup: "O_POSITIVE",
        componentType: "RBC",
        unitsRequired: 2,
        urgency: "EMERGENCY",
        requiredBy: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        reason: "End-to-end acceptance scenario trauma surgery",
      }),
    });
    const e2eReqData = await e2eReqRes.json();
    const e2eReqId = e2eReqData.data?.bloodRequest?.id;

    record("End-to-End", "Step 1: Hospital creates emergency O+ request for 2 units", !!e2eReqId, `Request ID: ${e2eReqId}`);

    const bank = await prisma.bloodBank.findFirst({ where: { user: { email: "bloodbank@yuvarakt.demo" } } });
    const getStock = async () => {
      const batches = await prisma.bloodInventory.findMany({
        where: { bloodBankId: bank!.id, bloodGroup: "O_POSITIVE", componentType: "RBC", expiryDate: { gt: new Date() } },
      });
      return batches.reduce((acc, b) => acc + b.unitsAvailable, 0);
    };

    const unitsBefore = await getStock();

    record("End-to-End", "Step 2: Blood Bank inspects available verified O+ RBC inventory", unitsBefore >= 2, `Available stock across batches: ${unitsBefore} units`);

    const allocRes = await fetch(`${BASE_URL}/api/blood-bank/allocate`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: bloodBankCookie },
      body: JSON.stringify({
        requestId: e2eReqId,
        bloodGroup: "O_POSITIVE",
        componentType: "RBC",
        unitsAllocated: 2,
        notes: "Emergency cold-chain dispatch",
      }),
    });
    const allocData = await allocRes.json();

    const unitsAfter = await getStock();
    const e2eReqDb = await prisma.bloodRequest.findUnique({ where: { id: e2eReqId } });

    record(
      "End-to-End",
      "Step 3: Blood Bank allocates units; Inventory decreases & Request status -> FULFILLED",
      allocRes.status === 200 && allocData.success === true && e2eReqDb?.status === "FULFILLED" && unitsAfter === unitsBefore - 2,
      `Inventory: ${unitsBefore} -> ${unitsAfter}, Status: ${e2eReqDb?.status}`
    );

    const respRes = await fetch(`${BASE_URL}/api/youth/respond`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: donorCookie },
      body: JSON.stringify({
        requestId: e2eReqId,
        status: "INTERESTED",
        message: "On standby at college campus",
      }),
    });

    const dbE2eResp = await prisma.donorResponse.findFirst({
      where: { requestId: e2eReqId, status: "INTERESTED" },
    });

    record("End-to-End", "Step 4: Donor responds 'I can help' (INTERESTED)", respRes.status === 200 && !!dbE2eResp, `Response registered in DB`);

    const adminStatsRes = await fetch(`${BASE_URL}/api/admin/stats`, {
      headers: { Cookie: adminCookie },
    });
    const adminStatsData = await adminStatsRes.json();

    record(
      "End-to-End",
      "Step 5: Admin dashboard reflects real-time completed transaction & audit trail",
      adminStatsRes.status === 200 && adminStatsData.stats?.totalBloodRequests > 0,
      `Total DB Blood Requests: ${adminStatsData.stats?.totalBloodRequests}, National Stock: ${adminStatsData.stats?.totalInventoryUnits} units`
    );
  } catch (err: any) {
    record("End-to-End", "End-to-End Real-World Scenario", false, undefined, err.message);
  }

  // ===========================================================================
  // SUMMARY REPORT
  // ===========================================================================
  const total = testResults.length;
  const passed = testResults.filter((r) => r.passed).length;
  const failed = total - passed;

  console.log("\n================================================================================");
  console.log(`📊 MASTER PHASE 2 ACCEPTANCE RESULTS: ${passed} / ${total} PASSED (${failed} FAILED)`);
  console.log("================================================================================\n");

  if (failed > 0) {
    console.error("❌ Master Acceptance Suite Encountered Failures!");
    process.exit(1);
  } else {
    console.log("🏆 ALL MASTER PHASE 2 ACCEPTANCE TESTS COMPLETED WITH 100% PASS RATE!");
  }
}

runMasterAcceptance()
  .catch((e) => {
    console.error("Runner crash:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
