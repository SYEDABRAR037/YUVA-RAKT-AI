import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { RegisterUserSchema } from "@/lib/validations/auth.schema";
import { hashPassword } from "@/lib/auth/password";
import { signSessionToken, setSessionCookie, getRoleDashboardUrl } from "@/lib/auth/session";
import { logAuditEvent } from "@/lib/services/audit.service";
import { ConsentType } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = RegisterUserSchema.safeParse(body);

    if (!result.success) {
      const errorMsg = result.error.issues[0]?.message || "Validation failed";
      return NextResponse.json({ success: false, error: errorMsg }, { status: 400 });
    }

    const data = result.data;

    // Reject privileged role self-registration
    if (data.role !== "YOUTH_DONOR" && data.role !== "HOSPITAL" && data.role !== "BLOOD_BANK") {
      return NextResponse.json(
        { success: false, error: "Privileged accounts can only be provisioned by authorized administration" },
        { status: 403 }
      );
    }

    // Check duplicate email
    const existingEmail = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existingEmail) {
      return NextResponse.json(
        { success: false, error: "An account with this email address is already registered" },
        { status: 409 }
      );
    }

    // Check duplicate phone
    const existingPhone = await prisma.user.findUnique({
      where: { phone: data.phone },
    });
    if (existingPhone) {
      return NextResponse.json(
        { success: false, error: "An account with this mobile number is already registered" },
        { status: 409 }
      );
    }

    // Check registration number uniqueness for Hospital / Blood Bank
    if (data.role === "HOSPITAL" && data.registrationNumber) {
      const existingReg = await prisma.hospital.findUnique({
        where: { registrationNumber: data.registrationNumber },
      });
      if (existingReg) {
        return NextResponse.json(
          { success: false, error: "Hospital registration number already registered" },
          { status: 409 }
        );
      }
    }

    if (data.role === "BLOOD_BANK" && data.registrationNumber) {
      const existingReg = await prisma.bloodBank.findUnique({
        where: { registrationNumber: data.registrationNumber },
      });
      if (existingReg) {
        return NextResponse.json(
          { success: false, error: "Blood bank license/registration number already registered" },
          { status: 409 }
        );
      }
    }

    // Hash password securely
    const passwordHash = await hashPassword(data.password);

    // Initial account status: ACTIVE for donors, PENDING for organizations awaiting verification
    const accountStatus = data.role === "YOUTH_DONOR" ? "ACTIVE" : "PENDING";

    // Transactional creation
    const newUser = await prisma.$transaction(async (tx) => {
      // 1. Create base User
      const user = await tx.user.create({
        data: {
          fullName: data.fullName,
          email: data.email,
          phone: data.phone,
          passwordHash,
          dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
          gender: data.gender,
          state: data.state,
          district: data.district,
          city: data.city || null,
          role: data.role,
          accountStatus,
        },
      });

      // 2. Create role-specific profile
      if (data.role === "YOUTH_DONOR" && data.bloodGroup) {
        await tx.youthDonorProfile.create({
          data: {
            userId: user.id,
            bloodGroup: data.bloodGroup,
            preferredLanguage: data.preferredLanguage || "en",
            emergencyNotificationConsent: data.emergencyNotificationConsent,
            locationSharingConsent: data.locationSharingConsent,
            privacyConsent: data.privacyPolicyConsent,
            verificationStatus: "UNVERIFIED",
            availabilityStatus: "AVAILABLE",
          },
        });
      } else if (data.role === "HOSPITAL" && data.orgName && data.registrationNumber) {
        await tx.hospital.create({
          data: {
            userId: user.id,
            name: data.orgName,
            registrationNumber: data.registrationNumber,
            email: data.orgEmail || data.email,
            phone: data.orgPhone || data.phone,
            address: data.address || "",
            city: data.city || "",
            district: data.district,
            state: data.state,
            pincode: data.pincode || "000000",
            verificationStatus: "PENDING",
          },
        });
      } else if (data.role === "BLOOD_BANK" && data.orgName && data.registrationNumber) {
        await tx.bloodBank.create({
          data: {
            userId: user.id,
            name: data.orgName,
            registrationNumber: data.registrationNumber,
            email: data.orgEmail || data.email,
            phone: data.orgPhone || data.phone,
            address: data.address || "",
            city: data.city || "",
            district: data.district,
            state: data.state,
            pincode: data.pincode || "000000",
            verificationStatus: "PENDING",
          },
        });
      }

      // 3. Create Consents
      const consentsToCreate: { consentType: ConsentType; accepted: boolean }[] = [
        { consentType: "PRIVACY_POLICY", accepted: data.privacyPolicyConsent },
        { consentType: "DATA_PROCESSING", accepted: data.dataProcessingConsent },
        { consentType: "EMERGENCY_NOTIFICATION", accepted: data.emergencyNotificationConsent },
        { consentType: "LOCATION_SHARING", accepted: data.locationSharingConsent },
      ];

      for (const c of consentsToCreate) {
        await tx.consent.create({
          data: {
            userId: user.id,
            consentType: c.consentType,
            accepted: c.accepted,
            version: "v1.0",
          },
        });
      }

      return user;
    });

    // 4. Audit Log
    await logAuditEvent({
      userId: newUser.id,
      action: "REGISTER",
      entityType: "USER",
      entityId: newUser.id,
      metadata: {
        role: newUser.role,
        state: newUser.state,
        district: newUser.district,
      },
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      userAgent: req.headers.get("user-agent"),
    });

    // 5. Sign Session Token & Set Cookie
    const token = await signSessionToken({
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role,
      fullName: newUser.fullName,
      accountStatus: newUser.accountStatus,
    });
    await setSessionCookie(token);

    return NextResponse.json({
      success: true,
      message: "Registration completed successfully",
      data: {
        user: {
          id: newUser.id,
          fullName: newUser.fullName,
          email: newUser.email,
          role: newUser.role,
          accountStatus: newUser.accountStatus,
        },
        redirectUrl: getRoleDashboardUrl(newUser.role),
      },
    });
  } catch (error: any) {
    console.error("[Registration API Error]", error);
    return NextResponse.json(
      { success: false, error: "An unexpected server error occurred during registration. Please try again." },
      { status: 500 }
    );
  }
}
