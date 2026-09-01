import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentSession } from "@/lib/auth/session";
import { UpdateYouthProfileSchema } from "@/lib/validations/profile.schema";
import { logAuditEvent } from "@/lib/services/audit.service";

export async function GET() {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: {
        youthDonorProfile: true,
        hospital: true,
        bloodBank: true,
      },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("[Profile GET API Error]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const result = UpdateYouthProfileSchema.safeParse(body);

    if (!result.success) {
      const errorMsg = result.error.issues[0]?.message || "Validation failed";
      return NextResponse.json({ success: false, error: errorMsg }, { status: 400 });
    }

    const data = result.data;

    // Verify phone uniqueness if changed
    if (data.phone) {
      const existingPhone = await prisma.user.findFirst({
        where: {
          phone: data.phone,
          NOT: { id: session.userId },
        },
      });

      if (existingPhone) {
        return NextResponse.json(
          { success: false, error: "Mobile number is already in use by another account" },
          { status: 409 }
        );
      }
    }

    // Update user & donor profile
    const updated = await prisma.$transaction(async (tx) => {
      const userUpdate: any = {};
      if (data.fullName !== undefined) userUpdate.fullName = data.fullName;
      if (data.phone !== undefined) userUpdate.phone = data.phone;
      if (data.state !== undefined) userUpdate.state = data.state;
      if (data.district !== undefined) userUpdate.district = data.district;
      if (data.city !== undefined) userUpdate.city = data.city || null;

      let updatedUser = null;
      if (Object.keys(userUpdate).length > 0) {
        updatedUser = await tx.user.update({
          where: { id: session.userId },
          data: userUpdate,
        });
      } else {
        updatedUser = await tx.user.findUnique({ where: { id: session.userId } });
      }

      if (session.role === "YOUTH_DONOR") {
        const profileUpdate: any = {};
        if (data.preferredLanguage !== undefined) profileUpdate.preferredLanguage = data.preferredLanguage;
        if (data.availabilityStatus !== undefined) profileUpdate.availabilityStatus = data.availabilityStatus;
        if (data.emergencyNotificationConsent !== undefined) profileUpdate.emergencyNotificationConsent = data.emergencyNotificationConsent;
        if (data.locationSharingConsent !== undefined) profileUpdate.locationSharingConsent = data.locationSharingConsent;

        await tx.youthDonorProfile.upsert({
          where: { userId: session.userId },
          update: profileUpdate,
          create: {
            userId: session.userId,
            bloodGroup: "O_POSITIVE",
            preferredLanguage: data.preferredLanguage || "en",
            availabilityStatus: data.availabilityStatus || "AVAILABLE",
            emergencyNotificationConsent: data.emergencyNotificationConsent ?? true,
            locationSharingConsent: data.locationSharingConsent ?? true,
          },
        });
      }

      return updatedUser;
    });

    // Create Audit Log
    await logAuditEvent({
      userId: session.userId,
      action: "PROFILE_UPDATE",
      entityType: "USER",
      entityId: session.userId,
      metadata: {
        availabilityStatus: data.availabilityStatus,
        language: data.preferredLanguage,
      },
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      userAgent: req.headers.get("user-agent"),
    });

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      user: updated,
    });
  } catch (error) {
    console.error("[Profile PATCH API Error]", error);
    return NextResponse.json({ success: false, error: "Failed to update profile" }, { status: 500 });
  }
}
