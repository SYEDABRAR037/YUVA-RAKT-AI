import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentSession } from "@/lib/auth/session";
import { UpdatePrivacyConsentSchema } from "@/lib/validations/profile.schema";
import { logAuditEvent } from "@/lib/services/audit.service";
import { ConsentType } from "@prisma/client";

export async function GET() {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const [consents, donorProfile] = await Promise.all([
      prisma.consent.findMany({
        where: { userId: session.userId },
        orderBy: { createdAt: "desc" },
      }),
      prisma.youthDonorProfile.findUnique({
        where: { userId: session.userId },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        consents,
        emergencyNotificationConsent: donorProfile?.emergencyNotificationConsent ?? true,
        locationSharingConsent: donorProfile?.locationSharingConsent ?? true,
        dataSharingConsent: true,
      },
    });
  } catch (error) {
    console.error("[Privacy GET Error]", error);
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
    const result = UpdatePrivacyConsentSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ success: false, error: "Invalid consent data" }, { status: 400 });
    }

    const data = result.data;

    await prisma.$transaction(async (tx) => {
      // 1. Update Donor Profile if applicable
      if (session.role === "YOUTH_DONOR") {
        const profileUpdate: any = {};
        if (data.emergencyNotificationConsent !== undefined) {
          profileUpdate.emergencyNotificationConsent = data.emergencyNotificationConsent;
        }
        if (data.locationSharingConsent !== undefined) {
          profileUpdate.locationSharingConsent = data.locationSharingConsent;
        }

        if (Object.keys(profileUpdate).length > 0) {
          await tx.youthDonorProfile.updateMany({
            where: { userId: session.userId },
            data: profileUpdate,
          });
        }
      }

      // 2. Record or update individual Consent rows
      const updates: { type: ConsentType; accepted?: boolean }[] = [];
      if (data.emergencyNotificationConsent !== undefined) {
        updates.push({ type: "EMERGENCY_NOTIFICATION", accepted: data.emergencyNotificationConsent });
      }
      if (data.locationSharingConsent !== undefined) {
        updates.push({ type: "LOCATION_SHARING", accepted: data.locationSharingConsent });
      }
      if (data.dataSharingConsent !== undefined) {
        updates.push({ type: "DATA_PROCESSING", accepted: data.dataSharingConsent });
      }

      for (const u of updates) {
        if (u.accepted === undefined) continue;
        const existing = await tx.consent.findFirst({
          where: { userId: session.userId, consentType: u.type },
        });

        if (existing) {
          await tx.consent.update({
            where: { id: existing.id },
            data: {
              accepted: u.accepted,
              revokedAt: u.accepted ? null : new Date(),
            },
          });
        } else {
          await tx.consent.create({
            data: {
              userId: session.userId,
              consentType: u.type,
              accepted: u.accepted,
              version: "v1.0",
            },
          });
        }
      }
    });

    // Create Audit Log
    await logAuditEvent({
      userId: session.userId,
      action: "CONSENT_UPDATED",
      entityType: "CONSENT",
      entityId: session.userId,
      metadata: {
        emergencyNotification: data.emergencyNotificationConsent,
        locationSharing: data.locationSharingConsent,
      },
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      userAgent: req.headers.get("user-agent"),
    });

    return NextResponse.json({
      success: true,
      message: "Privacy & consent preferences updated successfully",
    });
  } catch (error) {
    console.error("[Privacy PATCH Error]", error);
    return NextResponse.json({ success: false, error: "Failed to update privacy settings" }, { status: 500 });
  }
}
