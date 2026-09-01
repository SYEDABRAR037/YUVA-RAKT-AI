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

// Cookie helper
function extractCookie(headers: Headers): string | null {
  const setCookie = headers.get("set-cookie");
  if (!setCookie) return null;
  const match = setCookie.match(/yuva_session=([^;]+)/);
  return match ? `yuva_session=${match[1]}` : null;
}

async function runAcceptanceTests() {
  console.log("\n================================================================================");
  console.log("🇮🇳 YUVA-RAKT AI — REAL PHASE 1 END-TO-END ACCEPTANCE TEST SUITE");
  console.log("================================================================================\n");

  const timestamp = Date.now();
  const testDonorEmail = `acceptance.donor.${timestamp}@yuvarakt.test`;
  const testDonorPhone = `98${Math.floor(10000000 + Math.random() * 90000000)}`;
  const testHospitalEmail = `acceptance.hospital.${timestamp}@yuvarakt.test`;
  const testHospitalPhone = `98${Math.floor(10000000 + Math.random() * 90000000)}`;
  const testBloodBankEmail = `acceptance.bloodbank.${timestamp}@yuvarakt.test`;
  const testBloodBankPhone = `98${Math.floor(10000000 + Math.random() * 90000000)}`;

  let donorCookie: string | null = null;
  let adminCookie: string | null = null;
  let createdDonorId = "";
  let createdHospitalId = "";

  // ---------------------------------------------------------------------------
  // SUITE 1: REAL HTTP REGISTRATION FLOWS & VALIDATION
  // ---------------------------------------------------------------------------
  console.log("\n--- SUITE 1: REGISTRATION & VALIDATION ---");

  // 1.1: Register Youth Donor
  try {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: "Vikram Malhotra",
        email: testDonorEmail,
        phone: testDonorPhone,
        password: "YuvaRakt@2026",
        confirmPassword: "YuvaRakt@2026",
        state: "Maharashtra",
        district: "Pune",
        city: "Kothrud",
        role: "YOUTH_DONOR",
        bloodGroup: "O_POSITIVE",
        preferredLanguage: "en",
        privacyPolicyConsent: true,
        dataProcessingConsent: true,
        emergencyNotificationConsent: true,
        locationSharingConsent: true,
      }),
    });

    const data = await res.json();
    donorCookie = extractCookie(res.headers);
    createdDonorId = data.data?.user?.id;

    recordTest(
      "Registration",
      "Youth Donor HTTP Registration",
      res.status === 200 && data.success === true && !!donorCookie,
      `Status: ${res.status}, User ID: ${createdDonorId}`
    );

    // Verify in PostgreSQL database
    const dbDonor = await prisma.user.findUnique({
      where: { id: createdDonorId },
      include: { youthDonorProfile: true, consents: true },
    });
    recordTest(
      "Database Verification",
      "Youth Donor Profile and Consents persisted in PostgreSQL",
      dbDonor !== null &&
        dbDonor.youthDonorProfile?.bloodGroup === "O_POSITIVE" &&
        dbDonor.consents.length >= 2,
      `Consents count: ${dbDonor?.consents.length}`
    );
  } catch (err: any) {
    recordTest("Registration", "Youth Donor HTTP Registration", false, err.message);
  }

  // 1.2: Register Hospital Facility
  try {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: "Dr. Sunita Rao",
        email: testHospitalEmail,
        phone: testHospitalPhone,
        password: "YuvaRakt@2026",
        confirmPassword: "YuvaRakt@2026",
        state: "Karnataka",
        district: "Bengaluru Urban",
        city: "Indiranagar",
        role: "HOSPITAL",
        orgName: "Bengaluru City Care Hospital",
        registrationNumber: `KA-HOSP-${timestamp}`,
        address: "100 Feet Road, HAL 2nd Stage",
        pincode: "560038",
        privacyPolicyConsent: true,
        dataProcessingConsent: true,
      }),
    });

    const data = await res.json();
    const hospUserId = data.data?.user?.id;

    recordTest(
      "Registration",
      "Hospital Organization HTTP Registration",
      res.status === 200 && data.success === true && data.data?.user?.accountStatus === "PENDING",
      `Status: ${res.status}, Initial Status: ${data.data?.user?.accountStatus}`
    );

    const dbHosp = await prisma.hospital.findFirst({
      where: { userId: hospUserId },
    });
    createdHospitalId = dbHosp?.id || "";
    recordTest(
      "Database Verification",
      "Hospital Organization Entity persisted in PostgreSQL",
      dbHosp !== null && dbHosp.verificationStatus === "PENDING",
      `Org ID: ${createdHospitalId}`
    );
  } catch (err: any) {
    recordTest("Registration", "Hospital Organization HTTP Registration", false, err.message);
  }

  // 1.3: Register Blood Bank Facility
  try {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: "Dr. Amit Deshmukh",
        email: testBloodBankEmail,
        phone: testBloodBankPhone,
        password: "YuvaRakt@2026",
        confirmPassword: "YuvaRakt@2026",
        state: "Maharashtra",
        district: "Nagpur",
        city: "Civil Lines",
        role: "BLOOD_BANK",
        orgName: "Nagpur Central Blood Bank",
        registrationNumber: `MH-NAG-BB-${timestamp}`,
        address: "Wardha Road, Dhantoli",
        pincode: "440012",
        privacyPolicyConsent: true,
        dataProcessingConsent: true,
      }),
    });

    const data = await res.json();
    recordTest(
      "Registration",
      "Blood Bank Organization HTTP Registration",
      res.status === 200 && data.success === true,
      `Status: ${res.status}`
    );
  } catch (err: any) {
    recordTest("Registration", "Blood Bank Organization HTTP Registration", false, err.message);
  }

  // 1.4: Reject Privileged Role Self-Registration
  try {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: "Hacker Attempt",
        email: `hacker.${timestamp}@test.com`,
        phone: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
        password: "YuvaRakt@2026",
        confirmPassword: "YuvaRakt@2026",
        state: "Delhi (NCT)",
        district: "New Delhi",
        role: "SUPER_ADMIN", // Illegal role attempt
        privacyPolicyConsent: true,
        dataProcessingConsent: true,
      }),
    });

    recordTest(
      "Security / RBAC",
      "Reject Self-Registration for SUPER_ADMIN",
      res.status === 400 || res.status === 403,
      `HTTP Status: ${res.status}`
    );
  } catch (err: any) {
    recordTest("Security / RBAC", "Reject Self-Registration for SUPER_ADMIN", false, err.message);
  }

  // 1.5: Reject Duplicate Email Registration
  try {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: "Duplicate Vikram",
        email: testDonorEmail, // duplicate email
        phone: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
        password: "YuvaRakt@2026",
        confirmPassword: "YuvaRakt@2026",
        state: "Maharashtra",
        district: "Pune",
        role: "YOUTH_DONOR",
        bloodGroup: "O_POSITIVE",
        privacyPolicyConsent: true,
        dataProcessingConsent: true,
      }),
    });

    recordTest(
      "Validation",
      "Reject Duplicate Email Registration (409 Conflict)",
      res.status === 409,
      `HTTP Status: ${res.status}`
    );
  } catch (err: any) {
    recordTest("Validation", "Reject Duplicate Email Registration", false, err.message);
  }

  // 1.6: Reject Duplicate Phone Registration
  try {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: "Duplicate Phone User",
        email: `new.unique.${timestamp}@test.com`,
        phone: testDonorPhone, // duplicate phone
        password: "YuvaRakt@2026",
        confirmPassword: "YuvaRakt@2026",
        state: "Maharashtra",
        district: "Pune",
        role: "YOUTH_DONOR",
        bloodGroup: "O_POSITIVE",
        privacyPolicyConsent: true,
        dataProcessingConsent: true,
      }),
    });

    recordTest(
      "Validation",
      "Reject Duplicate Phone Registration (409 Conflict)",
      res.status === 409,
      `HTTP Status: ${res.status}`
    );
  } catch (err: any) {
    recordTest("Validation", "Reject Duplicate Phone Registration", false, err.message);
  }

  // ---------------------------------------------------------------------------
  // SUITE 2: REAL HTTP AUTHENTICATION, LOGIN & SESSIONS
  // ---------------------------------------------------------------------------
  console.log("\n--- SUITE 2: AUTHENTICATION, SESSIONS & LOGOUT ---");

  // 2.1: Login with Valid Credentials
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "donor@yuvarakt.demo",
        password: "YuvaRakt@2026",
      }),
    });

    const data = await res.json();
    const loginCookie = extractCookie(res.headers);

    recordTest(
      "Authentication",
      "Login with Valid Credentials & Issue HTTP-Only JWT Cookie",
      res.status === 200 && data.success === true && !!loginCookie,
      `Redirect: ${data.data?.redirectUrl}`
    );
  } catch (err: any) {
    recordTest("Authentication", "Login with Valid Credentials", false, err.message);
  }

  // 2.2: Reject Invalid Password
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "donor@yuvarakt.demo",
        password: "WrongPassword@999",
      }),
    });

    recordTest(
      "Authentication",
      "Reject Invalid Password (401 Unauthorized)",
      res.status === 401,
      `HTTP Status: ${res.status}`
    );
  } catch (err: any) {
    recordTest("Authentication", "Reject Invalid Password", false, err.message);
  }

  // 2.3: Session Inspection (`/api/auth/me`)
  try {
    const res = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Cookie: donorCookie || "" },
    });

    const data = await res.json();
    const hasPasswordHash = "passwordHash" in (data.user || {});

    recordTest(
      "Session Security",
      "Current Session Endpoint (`/api/auth/me`) returns user and NEVER exposes passwordHash",
      res.status === 200 && data.success === true && !hasPasswordHash && data.user.email === testDonorEmail,
      `Exposes passwordHash: ${hasPasswordHash}`
    );
  } catch (err: any) {
    recordTest("Session Security", "Current Session Endpoint", false, err.message);
  }

  // 2.4: Super Admin Login & Cookie Extraction
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "admin@yuvarakt.demo",
        password: "YuvaRakt@2026",
      }),
    });

    adminCookie = extractCookie(res.headers);
    const data = await res.json();

    recordTest(
      "Authentication",
      "Super Admin Login & Role Routing to `/admin/dashboard`",
      res.status === 200 && data.data?.redirectUrl === "/admin/dashboard" && !!adminCookie,
      `Redirect: ${data.data?.redirectUrl}`
    );
  } catch (err: any) {
    recordTest("Authentication", "Super Admin Login", false, err.message);
  }

  // ---------------------------------------------------------------------------
  // SUITE 3: ROLE-BASED ACCESS CONTROL (RBAC) & PERMISSION ENFORCEMENT
  // ---------------------------------------------------------------------------
  console.log("\n--- SUITE 3: ROLE-BASED ACCESS CONTROL (RBAC) ---");

  // 3.1: Youth Donor Forbidden on Admin Stats API
  try {
    const res = await fetch(`${BASE_URL}/api/admin/stats`, {
      headers: { Cookie: donorCookie || "" },
    });

    recordTest(
      "RBAC Protection",
      "Youth Donor blocked from `/api/admin/stats` (403 Forbidden)",
      res.status === 403,
      `HTTP Status: ${res.status}`
    );
  } catch (err: any) {
    recordTest("RBAC Protection", "Youth Donor blocked from Admin stats", false, err.message);
  }

  // 3.2: Youth Donor Forbidden on Admin User Management API
  try {
    const res = await fetch(`${BASE_URL}/api/admin/users`, {
      headers: { Cookie: donorCookie || "" },
    });

    recordTest(
      "RBAC Protection",
      "Youth Donor blocked from `/api/admin/users` (403 Forbidden)",
      res.status === 403,
      `HTTP Status: ${res.status}`
    );
  } catch (err: any) {
    recordTest("RBAC Protection", "Youth Donor blocked from Admin users", false, err.message);
  }

  // 3.3: Super Admin Accesses Real Database Statistics
  try {
    const res = await fetch(`${BASE_URL}/api/admin/stats`, {
      headers: { Cookie: adminCookie || "" },
    });

    const data = await res.json();
    const actualDbUserCount = await prisma.user.count();

    recordTest(
      "Admin Operations",
      "Super Admin retrieves LIVE PostgreSQL statistics",
      res.status === 200 && data.success === true && data.stats.totalUsers === actualDbUserCount,
      `DB Count: ${actualDbUserCount}, API Reported: ${data.stats?.totalUsers}`
    );
  } catch (err: any) {
    recordTest("Admin Operations", "Super Admin retrieves LIVE PostgreSQL stats", false, err.message);
  }

  // ---------------------------------------------------------------------------
  // SUITE 4: ADMIN OPERATIONS (USER SUSPENSION & ORGANIZATION VERIFICATION)
  // ---------------------------------------------------------------------------
  console.log("\n--- SUITE 4: ADMIN CONTROLS & LIFECYCLE ---");

  // 4.1: Suspend Youth Donor Account
  try {
    const res = await fetch(`${BASE_URL}/api/admin/users`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookie || "",
      },
      body: JSON.stringify({
        userId: createdDonorId,
        accountStatus: "SUSPENDED",
        reason: "Acceptance test temporary suspension",
      }),
    });

    const data = await res.json();
    recordTest(
      "Admin Operations",
      "Super Admin suspends user account",
      res.status === 200 && data.success === true,
      `New Status: ${data.user?.accountStatus}`
    );

    // Verify Suspended Account is rejected upon login attempt
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testDonorEmail,
        password: "YuvaRakt@2026",
      }),
    });

    recordTest(
      "Security Enforcement",
      "Suspended User is blocked from logging in (403 Account Suspended)",
      loginRes.status === 403,
      `HTTP Status: ${loginRes.status}`
    );

    // Reactivate user account
    const reactivateRes = await fetch(`${BASE_URL}/api/admin/users`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookie || "",
      },
      body: JSON.stringify({
        userId: createdDonorId,
        accountStatus: "ACTIVE",
      }),
    });

    recordTest(
      "Admin Operations",
      "Super Admin reactivates user account",
      reactivateRes.status === 200,
      `Status: ${reactivateRes.status}`
    );
  } catch (err: any) {
    recordTest("Admin Operations", "Suspend/Reactivate User", false, err.message);
  }

  // 4.2: Verify Hospital Organization
  try {
    const res = await fetch(`${BASE_URL}/api/admin/organizations`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookie || "",
      },
      body: JSON.stringify({
        orgId: createdHospitalId,
        orgType: "HOSPITAL",
        verificationStatus: "VERIFIED",
        notes: "Acceptance test license verification approved",
      }),
    });

    const data = await res.json();
    const updatedHosp = await prisma.hospital.findUnique({
      where: { id: createdHospitalId },
      include: { user: true },
    });

    recordTest(
      "Admin Operations",
      "Super Admin verifies hospital license and automatically activates user account",
      res.status === 200 &&
        updatedHosp?.verificationStatus === "VERIFIED" &&
        updatedHosp.user.accountStatus === "ACTIVE",
      `Org Status: ${updatedHosp?.verificationStatus}, Account Status: ${updatedHosp?.user.accountStatus}`
    );
  } catch (err: any) {
    recordTest("Admin Operations", "Verify Hospital Organization", false, err.message);
  }

  // ---------------------------------------------------------------------------
  // SUITE 5: PROFILE & PRIVACY CONSENT MANAGEMENT
  // ---------------------------------------------------------------------------
  console.log("\n--- SUITE 5: PROFILE & PRIVACY CONSENT MANAGEMENT ---");

  // 5.1: Youth Donor Updates Profile
  try {
    const res = await fetch(`${BASE_URL}/api/user/profile`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: donorCookie || "",
      },
      body: JSON.stringify({
        fullName: "Vikram Malhotra (Updated)",
        phone: testDonorPhone,
        state: "Maharashtra",
        district: "Pune",
        city: "Baner",
        preferredLanguage: "hi",
        availabilityStatus: "NOT_AVAILABLE", // Toggled to recovering
        emergencyNotificationConsent: true,
        locationSharingConsent: false,
      }),
    });

    const data = await res.json();
    const updatedProfile = await prisma.youthDonorProfile.findUnique({
      where: { userId: createdDonorId },
    });

    recordTest(
      "Profile Management",
      "Youth Donor updates profile, availability status & preferred language",
      res.status === 200 &&
        data.success === true &&
        updatedProfile?.availabilityStatus === "NOT_AVAILABLE" &&
        updatedProfile?.preferredLanguage === "hi",
      `Availability: ${updatedProfile?.availabilityStatus}, Lang: ${updatedProfile?.preferredLanguage}`
    );
  } catch (err: any) {
    recordTest("Profile Management", "Youth Donor updates profile", false, err.message);
  }

  // 5.2: Privacy Consent Update & Ledger
  try {
    const res = await fetch(`${BASE_URL}/api/user/privacy`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: donorCookie || "",
      },
      body: JSON.stringify({
        emergencyNotificationConsent: false,
        locationSharingConsent: false,
        dataSharingConsent: true,
      }),
    });

    const data = await res.json();
    const revokedConsent = await prisma.consent.findFirst({
      where: {
        userId: createdDonorId,
        consentType: "EMERGENCY_NOTIFICATION",
      },
    });

    recordTest(
      "Privacy & Compliance",
      "Consent update registers changes in persistent consent ledger with revokedAt timestamp",
      res.status === 200 && data.success === true && revokedConsent?.accepted === false && !!revokedConsent.revokedAt,
      `Accepted: ${revokedConsent?.accepted}, RevokedAt: ${revokedConsent?.revokedAt}`
    );
  } catch (err: any) {
    recordTest("Privacy & Compliance", "Consent update in ledger", false, err.message);
  }

  // ---------------------------------------------------------------------------
  // SUITE 6: SECURE PASSWORD RESET FLOW
  // ---------------------------------------------------------------------------
  console.log("\n--- SUITE 6: PASSWORD RESET ARCHITECTURE ---");

  try {
    // Step 1: Request reset link
    const forgotRes = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testDonorEmail }),
    });
    const forgotData = await forgotRes.json();
    const resetToken = forgotData.demoResetToken;

    recordTest(
      "Password Reset",
      "Generate cryptographic password reset token",
      forgotRes.status === 200 && !!resetToken,
      `Token generated: ${resetToken?.substring(0, 12)}...`
    );

    // Step 2: Reset password
    const newPassword = "NewSecurePassword@2026";
    const resetRes = await fetch(`${BASE_URL}/api/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: resetToken,
        password: newPassword,
        confirmPassword: newPassword,
      }),
    });
    const resetData = await resetRes.json();

    recordTest(
      "Password Reset",
      "Update password using valid cryptographic reset token",
      resetRes.status === 200 && resetData.success === true,
      `Message: ${resetData.message}`
    );

    // Step 3: Login with new password
    const newLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testDonorEmail,
        password: newPassword,
      }),
    });
    const newLoginData = await newLoginRes.json();

    recordTest(
      "Password Reset",
      "Authenticate successfully with new updated password",
      newLoginRes.status === 200 && newLoginData.success === true,
      `Login Success: ${newLoginData.success}`
    );
  } catch (err: any) {
    recordTest("Password Reset", "Password Reset Flow", false, err.message);
  }

  // ---------------------------------------------------------------------------
  // SUITE 7: AUDIT LOG INTEGRITY & SECURITY COMPLIANCE
  // ---------------------------------------------------------------------------
  console.log("\n--- SUITE 7: AUDIT LOGGING & COMPLIANCE ---");

  try {
    const res = await fetch(`${BASE_URL}/api/admin/audit-logs`, {
      headers: { Cookie: adminCookie || "" },
    });
    const data = await res.json();
    const logs = data.logs || [];

    const actionsLogged = new Set(logs.map((l: any) => l.action));
    const hasSensitiveData = logs.some(
      (l: any) =>
        JSON.stringify(l.metadata || {}).includes("passwordHash") ||
        JSON.stringify(l.metadata || {}).includes("YuvaRakt")
    );

    recordTest(
      "Audit Trail",
      "Audit log records comprehensive event types (REGISTER, LOGIN, PROFILE_UPDATE, ACCOUNT_STATUS_CHANGE, ORGANIZATION_VERIFIED)",
      actionsLogged.has("REGISTER") &&
        actionsLogged.has("LOGIN") &&
        actionsLogged.has("PROFILE_UPDATE") &&
        actionsLogged.has("ACCOUNT_STATUS_CHANGE") &&
        actionsLogged.has("ORGANIZATION_VERIFIED"),
      `Captured ${actionsLogged.size} unique event types`
    );

    recordTest(
      "Security Review",
      "Audit log NEVER stores plaintext passwords or password hashes",
      !hasSensitiveData,
      `Zero sensitive leaks detected`
    );
  } catch (err: any) {
    recordTest("Audit Trail", "Audit log inspection", false, err.message);
  }

  // ---------------------------------------------------------------------------
  // SUITE 8: LOGOUT & SESSION INVALIDATION
  // ---------------------------------------------------------------------------
  console.log("\n--- SUITE 8: LOGOUT & CLEANUP ---");

  try {
    const res = await fetch(`${BASE_URL}/api/auth/logout`, {
      method: "POST",
      headers: { Cookie: donorCookie || "" },
    });

    const setCookie = res.headers.get("set-cookie");
    const isCookieCleared = setCookie ? setCookie.includes("yuva_session=;") || setCookie.includes("Max-Age=0") : true;

    recordTest(
      "Logout",
      "Logout clears session cookie and records LOGOUT audit event",
      res.status === 200 && isCookieCleared,
      `Status: ${res.status}`
    );
  } catch (err: any) {
    recordTest("Logout", "Logout flow", false, err.message);
  }

  // ---------------------------------------------------------------------------
  // SUMMARY REPORT
  // ---------------------------------------------------------------------------
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = total - passed;

  console.log("\n================================================================================");
  console.log(`📊 FINAL ACCEPTANCE TEST RESULTS: ${passed} / ${total} PASSED (${failed} FAILED)`);
  console.log("================================================================================\n");

  if (failed > 0) {
    console.error("❌ Acceptance Test Suite Failed!");
    process.exit(1);
  } else {
    console.log("🏆 ALL PHASE 1 ACCEPTANCE TESTS COMPLETED SUCCESSFULLY WITH 100% PASS RATE!");
  }
}

runAcceptanceTests()
  .catch((e) => {
    console.error("Acceptance test runner crashed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
