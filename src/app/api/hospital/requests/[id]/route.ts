import { NextRequest, NextResponse } from "next/server";
import { getSessionFromCookie } from "@/lib/auth/session";
import prisma from "@/lib/db";
import { cancelBloodRequest } from "@/lib/services/request.service";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromCookie();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    const request = await prisma.bloodRequest.findUnique({
      where: { id },
      include: {
        hospital: true,
        allocations: {
          include: {
            bloodBank: true,
          },
        },
        donorResponses: {
          select: {
            id: true,
            status: true,
            createdAt: true,
            donor: {
              select: {
                bloodGroup: true,
                verificationStatus: true,
                availabilityStatus: true,
                user: {
                  select: {
                    district: true,
                    state: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!request) {
      return NextResponse.json({ success: false, error: "Blood request not found" }, { status: 404 });
    }

    // RBAC: Hospital can only view own requests, Blood Bank & Super Admin can view all
    if (session.role === "HOSPITAL") {
      const hospital = await prisma.hospital.findUnique({ where: { userId: session.userId } });
      if (!hospital || hospital.id !== request.hospitalId) {
        return NextResponse.json({ success: false, error: "Access denied" }, { status: 403 });
      }
    }

    return NextResponse.json({ success: true, request });
  } catch (error: any) {
    console.error("GET /api/hospital/requests/[id] error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to load request details" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromCookie();
    if (!session || session.role !== "HOSPITAL") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await context.params;

    const hospital = await prisma.hospital.findUnique({
      where: { userId: session.userId },
    });
    if (!hospital) {
      return NextResponse.json({ success: false, error: "Hospital profile not found" }, { status: 404 });
    }

    const ipAddress = req.headers.get("x-forwarded-for") || undefined;
    const userAgent = req.headers.get("user-agent") || undefined;

    const cancelled = await cancelBloodRequest({
      hospitalId: hospital.id,
      userId: session.userId,
      requestId: id,
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, message: "Blood request cancelled successfully", request: cancelled });
  } catch (error: any) {
    console.error("DELETE /api/hospital/requests/[id] error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to cancel request" }, { status: 500 });
  }
}
