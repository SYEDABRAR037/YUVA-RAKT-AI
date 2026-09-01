import { NextRequest, NextResponse } from "next/server";
import { getSessionFromCookie } from "@/lib/auth/session";
import prisma from "@/lib/db";
import { AllocateBloodSchema } from "@/lib/validations/blood.schema";
import { allocateBloodToRequest } from "@/lib/services/allocation.service";

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromCookie();
    if (!session || session.role !== "BLOOD_BANK") {
      return NextResponse.json({ success: false, error: "Unauthorized. Only authorized blood centres can allocate blood units." }, { status: 403 });
    }

    const bloodBank = await prisma.bloodBank.findUnique({
      where: { userId: session.userId },
    });
    if (!bloodBank) {
      return NextResponse.json({ success: false, error: "Blood bank profile not found" }, { status: 404 });
    }

    const body = await req.json();
    const parsed = AllocateBloodSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Invalid allocation payload" },
        { status: 400 }
      );
    }

    const ipAddress = req.headers.get("x-forwarded-for") || undefined;
    const userAgent = req.headers.get("user-agent") || undefined;

    const result = await allocateBloodToRequest({
      bloodBankId: bloodBank.id,
      userId: session.userId,
      requestId: parsed.data.requestId,
      bloodGroup: parsed.data.bloodGroup,
      componentType: parsed.data.componentType,
      unitsAllocated: parsed.data.unitsAllocated,
      notes: parsed.data.notes,
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      message: `Successfully allocated ${parsed.data.unitsAllocated} unit(s). Request is now ${result.updatedRequest.status}.`,
      data: result,
    });
  } catch (error: any) {
    console.error("POST /api/blood-bank/allocate error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to allocate units" }, { status: 400 });
  }
}
