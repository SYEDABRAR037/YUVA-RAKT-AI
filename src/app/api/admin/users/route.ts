import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getCurrentSession } from "@/lib/auth/session";
import { UpdateUserStatusSchema } from "@/lib/validations/profile.schema";
import { logAuditEvent } from "@/lib/services/audit.service";
import { UserRole, AccountStatus, Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session || session.role !== "SUPER_ADMIN") {
      return NextResponse.json({ success: false, error: "Forbidden: Super Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role") as UserRole | null;
    const status = searchParams.get("status") as AccountStatus | null;
    const search = searchParams.get("search");

    const where: Prisma.UserWhereInput = {};

    if (role) {
      where.role = role;
    }
    if (status) {
      where.accountStatus = status;
    }
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { district: { contains: search, mode: "insensitive" } },
        { state: { contains: search, mode: "insensitive" } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        accountStatus: true,
        state: true,
        district: true,
        city: true,
        createdAt: true,
        lastLoginAt: true,
        youthDonorProfile: {
          select: {
            bloodGroup: true,
            verificationStatus: true,
            availabilityStatus: true,
          },
        },
        hospital: {
          select: {
            name: true,
            registrationNumber: true,
            verificationStatus: true,
          },
        },
        bloodBank: {
          select: {
            name: true,
            registrationNumber: true,
            verificationStatus: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ success: true, users });
  } catch (error) {
    console.error("[Admin Users GET Error]", error);
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
    const result = UpdateUserStatusSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ success: false, error: "Invalid status update payload" }, { status: 400 });
    }

    const { userId, accountStatus, reason } = result.data;

    // Prevent super admin from suspending themselves
    if (userId === session.userId && accountStatus !== "ACTIVE") {
      return NextResponse.json(
        { success: false, error: "You cannot suspend or deactivate your own Super Admin account" },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { accountStatus },
    });

    // Create Audit Log
    await logAuditEvent({
      userId: session.userId,
      action: "ACCOUNT_STATUS_CHANGE",
      entityType: "USER",
      entityId: userId,
      metadata: {
        newStatus: accountStatus,
        reason: reason || "Admin management action",
        targetUserEmail: updatedUser.email,
      },
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      userAgent: req.headers.get("user-agent"),
    });

    return NextResponse.json({
      success: true,
      message: `User status changed to ${accountStatus}`,
      user: updatedUser,
    });
  } catch (error) {
    console.error("[Admin Users PATCH Error]", error);
    return NextResponse.json({ success: false, error: "Failed to update user status" }, { status: 500 });
  }
}
