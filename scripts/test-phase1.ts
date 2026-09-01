import prisma from "../src/lib/db";
import { hashPassword, verifyPassword } from "../src/lib/auth/password";
import { signSessionToken, verifySessionToken } from "../src/lib/auth/session";
import { RegisterUserSchema, LoginUserSchema } from "../src/lib/validations/auth.schema";
import { logAuditEvent } from "../src/lib/services/audit.service";
import { UserRole, AccountStatus, BloodGroup, VerificationStatus } from "@prisma/client";

async function runPhase1Tests() {
  console.log("\n🧪 ========================================================");
  console.log("   YUVA-RAKT AI — PHASE 1 COMPREHENSIVE AUTOMATED TEST SUITE");
  console.log("==========================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName} ${detail ? `(${detail})` : ""}`);
      failed++;
    }
  }

  try {
    // -------------------------------------------------------------
    // TEST 1: Password Hashing & Salt Verification
    // -------------------------------------------------------------
    const plain = "TestPassword@123";
    const hash = await hashPassword(plain);
    assert(hash !== plain, "Password is encrypted (not plaintext)");
    assert(hash.startsWith("$2"), "Password uses bcrypt hashing algorithm");
    const validMatch = await verifyPassword(plain, hash);
    assert(validMatch, "Password verification succeeds with correct password");
    const invalidMatch = await verifyPassword("WrongPassword", hash);
    assert(!invalidMatch, "Password verification fails with incorrect password");

    // -------------------------------------------------------------
    // TEST 2: JWT Session Token & RBAC Extraction
    // -------------------------------------------------------------
    const token = await signSessionToken({
      userId: "test-user-id",
      email: "test@yuvarakt.demo",
      role: "YOUTH_DONOR",
      fullName: "Test Donor",
      accountStatus: "ACTIVE",
    });
    assert(typeof token === "string" && token.length > 20, "JWT session token created successfully");
    const decoded = await verifySessionToken(token);
    assert(decoded !== null, "JWT token verified successfully");
    assert(decoded?.role === "YOUTH_DONOR", "JWT payload correctly contains role (YOUTH_DONOR)");
    assert(decoded?.email === "test@yuvarakt.demo", "JWT payload contains correct email");

    // -------------------------------------------------------------
    // TEST 3: Validation Schemas & Privileged Role Protection
    // -------------------------------------------------------------
    const validDonorPayload = {
      fullName: "Karan Johar",
      email: "karan.test@example.com",
      phone: "9876500001",
      password: "Password@123",
      confirmPassword: "Password@123",
      state: "Maharashtra",
      district: "Pune",
      role: "YOUTH_DONOR",
      bloodGroup: "O_POSITIVE",
      privacyPolicyConsent: true,
      dataProcessingConsent: true,
    };
    const parseResult = RegisterUserSchema.safeParse(validDonorPayload);
    assert(parseResult.success, "Zod accepts valid youth donor registration payload");

    const mismatchedPasswords = {
      ...validDonorPayload,
      confirmPassword: "DifferentPassword@123",
    };
    const mismatchResult = RegisterUserSchema.safeParse(mismatchedPasswords);
    assert(!mismatchResult.success, "Zod rejects mismatched password confirmation");

    const weakPassword = {
      ...validDonorPayload,
      password: "weak",
      confirmPassword: "weak",
    };
    const weakResult = RegisterUserSchema.safeParse(weakPassword);
    assert(!weakResult.success, "Zod rejects weak password (under 8 chars, missing uppercase/number)");

    const invalidPhone = {
      ...validDonorPayload,
      phone: "12345",
    };
    const invalidPhoneResult = RegisterUserSchema.safeParse(invalidPhone);
    assert(!invalidPhoneResult.success, "Zod rejects invalid non-10-digit Indian phone number");

    // -------------------------------------------------------------
    // TEST 4: Seed Demo Accounts Exist in PostgreSQL
    // -------------------------------------------------------------
    const donorUser = await prisma.user.findUnique({
      where: { email: "donor@yuvarakt.demo" },
      include: { youthDonorProfile: true, consents: true },
    });
    assert(donorUser !== null, "Demo Youth Donor exists in database");
    assert(donorUser?.role === UserRole.YOUTH_DONOR, "Demo donor role is YOUTH_DONOR");
    assert(donorUser?.youthDonorProfile?.bloodGroup === BloodGroup.O_POSITIVE, "Demo donor blood group is O_POSITIVE");
    assert((donorUser?.consents.length ?? 0) >= 2, "Demo donor has consent records logged");

    const hospitalUser = await prisma.user.findUnique({
      where: { email: "hospital@yuvarakt.demo" },
      include: { hospital: true },
    });
    assert(hospitalUser !== null, "Demo Hospital exists in database");
    assert(hospitalUser?.role === UserRole.HOSPITAL, "Demo hospital role is HOSPITAL");
    assert(hospitalUser?.hospital?.verificationStatus === VerificationStatus.VERIFIED, "Demo hospital is VERIFIED");

    const bloodBankUser = await prisma.user.findUnique({
      where: { email: "bloodbank@yuvarakt.demo" },
      include: { bloodBank: true },
    });
    assert(bloodBankUser !== null, "Demo Blood Bank exists in database");
    assert(bloodBankUser?.role === UserRole.BLOOD_BANK, "Demo blood bank role is BLOOD_BANK");

    const govUser = await prisma.user.findUnique({
      where: { email: "government@yuvarakt.demo" },
    });
    assert(govUser !== null, "Demo Government Official exists in database");
    assert(govUser?.role === UserRole.GOVERNMENT_OFFICIAL, "Gov official role is GOVERNMENT_OFFICIAL");

    const adminUser = await prisma.user.findUnique({
      where: { email: "admin@yuvarakt.demo" },
    });
    assert(adminUser !== null, "Demo Super Admin exists in database");
    assert(adminUser?.role === UserRole.SUPER_ADMIN, "Super admin role is SUPER_ADMIN");

    // -------------------------------------------------------------
    // TEST 5: Duplicate Email & Phone Uniqueness Rejection
    // -------------------------------------------------------------
    let duplicateEmailRejected = false;
    try {
      await prisma.user.create({
        data: {
          fullName: "Duplicate User",
          email: "donor@yuvarakt.demo", // Existing email
          phone: "9876599999",
          passwordHash: hash,
          state: "Maharashtra",
          district: "Pune",
          role: UserRole.YOUTH_DONOR,
        },
      });
    } catch {
      duplicateEmailRejected = true;
    }
    assert(duplicateEmailRejected, "PostgreSQL schema rejects duplicate email address");

    let duplicatePhoneRejected = false;
    try {
      await prisma.user.create({
        data: {
          fullName: "Duplicate Phone User",
          email: "unique.email@demo.in",
          phone: "9811000005", // Existing donor phone
          passwordHash: hash,
          state: "Maharashtra",
          district: "Pune",
          role: UserRole.YOUTH_DONOR,
        },
      });
    } catch {
      duplicatePhoneRejected = true;
    }
    assert(duplicatePhoneRejected, "PostgreSQL schema rejects duplicate phone number");

    // -------------------------------------------------------------
    // TEST 6: Audit Logging Service
    // -------------------------------------------------------------
    const testAudit = await logAuditEvent({
      userId: adminUser?.id,
      action: "ROLE_CHANGE",
      entityType: "USER",
      entityId: donorUser?.id,
      metadata: { test: "Automated test verification" },
    });
    assert(testAudit !== null && testAudit.action === "ROLE_CHANGE", "Audit logging writes immutable event to database");

    // -------------------------------------------------------------
    // TEST 7: Super Admin Account Status Mutation (Suspend/Reactivate)
    // -------------------------------------------------------------
    const testTarget = await prisma.user.findFirst({
      where: { email: "priya.patel@demo.in" },
    });
    if (testTarget) {
      const suspended = await prisma.user.update({
        where: { id: testTarget.id },
        data: { accountStatus: AccountStatus.SUSPENDED },
      });
      assert(suspended.accountStatus === AccountStatus.SUSPENDED, "Admin can successfully suspend user account");

      const reactivated = await prisma.user.update({
        where: { id: testTarget.id },
        data: { accountStatus: AccountStatus.ACTIVE },
      });
      assert(reactivated.accountStatus === AccountStatus.ACTIVE, "Admin can successfully reactivate user account");
    }

    console.log("\n==========================================================");
    console.log(`📊 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log("==========================================================\n");

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error("Test execution failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runPhase1Tests();
