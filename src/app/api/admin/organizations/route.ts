import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentSession } from "@/lib/auth/session";
import { UpdateOrgVerificationSchema } from "@/lib/validations/profile.schema";
import { logAuditEvent } from "@/lib/services/audit.service";

export async function GET() {
  try {
    const session = await getCurrentSession();
    if (!session || session.role !== "SUPER_ADMIN") {
      return NextResponse.json({ success: false, error: "Forbidden: Super Admin access required" }, { status: 403 });
    }

    const [hospitals, bloodBanks] = await Promise.all([
      prisma.hospital.findMany({
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
              accountStatus: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.bloodBank.findMany({
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
              accountStatus: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return NextResponse.json({
      success: true,
      hospitals,
      bloodBanks,
    });
  } catch (error) {
    console.error("[Admin Orgs GET Error]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session || session.role !== "SUPER_ADMIN") {
      return NextResponse.json({ success: false, error: "Forbidden: Super Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const result = UpdateOrgVerificationSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ success: false, error: "Invalid organization update data" }, { status: 400 });
    }

    const { orgId, orgType, verificationStatus, notes } = result.data;

    let orgName = "";
    let userId = "";

    if (orgType === "HOSPITAL") {
      const hospital = await prisma.hospital.update({
        where: { id: orgId },
        data: { verificationStatus },
        include: { user: true },
      });
      orgName = hospital.name;
      userId = hospital.userId;

      // If verified, activate user account if currently pending
      if (verificationStatus === "VERIFIED" && hospital.user.accountStatus === "PENDING") {
        await prisma.user.update({
          where: { id: userId },
          data: { accountStatus: "ACTIVE" },
        });
      }
    } else {
      const bloodBank = await prisma.bloodBank.update({
        where: { id: orgId },
        data: { verificationStatus },
        include: { user: true },
      });
      orgName = bloodBank.name;
      userId = bloodBank.userId;

      // If verified, activate user account if currently pending
      if (verificationStatus === "VERIFIED" && bloodBank.user.accountStatus === "PENDING") {
        await prisma.user.update({
          where: { id: userId },
          data: { accountStatus: "ACTIVE" },
        });
      }
    }

    // Create Audit Log
    await logAuditEvent({
      userId: session.userId,
      action: "ORGANIZATION_VERIFIED",
      entityType: orgType,
      entityId: orgId,
      metadata: {
        orgName,
        newStatus: verificationStatus,
        notes: notes || "Admin verification decision",
      },
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      userAgent: req.headers.get("user-agent"),
    });

    return NextResponse.json({
      success: true,
      message: `${orgType === "HOSPITAL" ? "Hospital" : "Blood Bank"} marked as ${verificationStatus}`,
    });
  } catch (error) {
    console.error("[Admin Orgs PATCH Error]", error);
    return NextResponse.json({ success: false, error: "Failed to update organization status" }, { status: 500 });
  }
}
