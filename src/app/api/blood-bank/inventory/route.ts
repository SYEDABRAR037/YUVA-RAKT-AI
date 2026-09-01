import { NextRequest, NextResponse } from "next/server";
import { getSessionFromCookie } from "@/lib/auth/session";
import prisma from "@/lib/db";
import { AdjustInventorySchema } from "@/lib/validations/blood.schema";
import { getBloodBankInventory, adjustInventory, getInventoryTransactions } from "@/lib/services/inventory.service";
import { logAuditEvent } from "@/lib/services/audit.service";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromCookie();
    if (!session || (session.role !== "BLOOD_BANK" && session.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 403 });
    }

    const bloodBank = await prisma.bloodBank.findUnique({
      where: { userId: session.userId },
    });
    if (!bloodBank) {
      return NextResponse.json({ success: false, error: "Blood bank profile not found" }, { status: 404 });
    }

    const summary = await getBloodBankInventory(bloodBank.id);
    const recentTransactions = await getInventoryTransactions(bloodBank.id, 20);

    return NextResponse.json({
      success: true,
      summary,
      recentTransactions,
      bloodBankName: bloodBank.name,
      district: bloodBank.district,
    });
  } catch (error: any) {
    console.error("GET /api/blood-bank/inventory error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to load inventory" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromCookie();
    if (!session || session.role !== "BLOOD_BANK") {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 403 });
    }

    const bloodBank = await prisma.bloodBank.findUnique({
      where: { userId: session.userId },
    });
    if (!bloodBank) {
      return NextResponse.json({ success: false, error: "Blood bank profile not found" }, { status: 404 });
    }

    const body = await req.json();
    const parsed = AdjustInventorySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Invalid payload" },
        { status: 400 }
      );
    }

    const ipAddress = req.headers.get("x-forwarded-for") || undefined;
    const userAgent = req.headers.get("user-agent") || undefined;

    const transaction = await adjustInventory({
      bloodBankId: bloodBank.id,
      bloodGroup: parsed.data.bloodGroup,
      componentType: parsed.data.componentType,
      quantity: parsed.data.quantity,
      transactionType: "ADJUSTMENT",
      expiryDate: parsed.data.expiryDate ? new Date(parsed.data.expiryDate) : undefined,
      notes: parsed.data.notes,
      createdBy: session.userId,
    });

    await logAuditEvent({
      userId: session.userId,
      action: "INVENTORY_ADJUSTED",
      entityType: "INVENTORY",
      entityId: transaction.id,
      metadata: {
        bloodBankName: bloodBank.name,
        bloodGroup: parsed.data.bloodGroup,
        componentType: parsed.data.componentType,
        quantity: parsed.data.quantity,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      message: `Inventory successfully adjusted (${parsed.data.quantity > 0 ? `+${parsed.data.quantity}` : parsed.data.quantity} units)`,
      transaction,
    });
  } catch (error: any) {
    console.error("POST /api/blood-bank/inventory error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to adjust inventory" }, { status: 400 });
  }
}
