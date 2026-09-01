import prisma from "@/lib/db";
import { BloodGroup, BloodComponentType, InventoryTransactionType } from "@prisma/client";

export const DEFAULT_SHELF_LIFE_DAYS: Record<BloodComponentType, number> = {
  WHOLE_BLOOD: 35,
  RBC: 42,
  PLATELETS: 5,
  PLASMA: 365,
};

export function calculateExpiryDate(componentType: BloodComponentType, collectionDate = new Date()): Date {
  const days = DEFAULT_SHELF_LIFE_DAYS[componentType] || 35;
  const expiry = new Date(collectionDate);
  expiry.setDate(expiry.getDate() + days);
  return expiry;
}

export interface InventoryCell {
  bloodGroup: BloodGroup;
  componentType: BloodComponentType;
  unitsAvailable: number;
  unitsExpiringSoon: number; // Expiring in next 7 days
  unitsExpired: number;
}

export interface BloodBankInventorySummary {
  totalUnitsAvailable: number;
  totalExpiringSoon: number;
  totalExpired: number;
  matrix: InventoryCell[];
}

export async function getBloodBankInventory(bloodBankId: string): Promise<BloodBankInventorySummary> {
  const now = new Date();
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(now.getDate() + 7);

  // Fetch all inventory batches for this blood bank
  const inventoryItems = await prisma.bloodInventory.findMany({
    where: { bloodBankId },
  });

  const bloodGroups: BloodGroup[] = [
    "A_POSITIVE",
    "A_NEGATIVE",
    "B_POSITIVE",
    "B_NEGATIVE",
    "AB_POSITIVE",
    "AB_NEGATIVE",
    "O_POSITIVE",
    "O_NEGATIVE",
  ];

  const componentTypes: BloodComponentType[] = [
    "WHOLE_BLOOD",
    "RBC",
    "PLASMA",
    "PLATELETS",
  ];

  // Initialize 8x4 matrix
  const matrixMap = new Map<string, InventoryCell>();
  for (const bg of bloodGroups) {
    for (const ct of componentTypes) {
      const key = `${bg}_${ct}`;
      matrixMap.set(key, {
        bloodGroup: bg,
        componentType: ct,
        unitsAvailable: 0,
        unitsExpiringSoon: 0,
        unitsExpired: 0,
      });
    }
  }

  let totalUnitsAvailable = 0;
  let totalExpiringSoon = 0;
  let totalExpired = 0;

  for (const item of inventoryItems) {
    const key = `${item.bloodGroup}_${item.componentType}`;
    const cell = matrixMap.get(key);
    if (!cell) continue;

    const isExpired = item.expiryDate < now;
    const isExpiringSoon = !isExpired && item.expiryDate <= sevenDaysFromNow;

    if (isExpired) {
      cell.unitsExpired += item.unitsAvailable;
      totalExpired += item.unitsAvailable;
    } else {
      cell.unitsAvailable += item.unitsAvailable;
      totalUnitsAvailable += item.unitsAvailable;

      if (isExpiringSoon) {
        cell.unitsExpiringSoon += item.unitsAvailable;
        totalExpiringSoon += item.unitsAvailable;
      }
    }
  }

  return {
    totalUnitsAvailable,
    totalExpiringSoon,
    totalExpired,
    matrix: Array.from(matrixMap.values()),
  };
}

export async function adjustInventory(params: {
  bloodBankId: string;
  bloodGroup: BloodGroup;
  componentType: BloodComponentType;
  quantity: number; // positive = add, negative = deduct
  transactionType: InventoryTransactionType;
  referenceId?: string;
  expiryDate?: Date;
  notes?: string;
  createdBy: string;
}) {
  const {
    bloodBankId,
    bloodGroup,
    componentType,
    quantity,
    transactionType,
    referenceId,
    notes,
    createdBy,
  } = params;

  const now = new Date();
  const targetExpiry = params.expiryDate || calculateExpiryDate(componentType, now);

  return prisma.$transaction(async (tx) => {
    // If deducting, check available unexpired units
    if (quantity < 0) {
      const deductionAmount = Math.abs(quantity);

      // Find active batches with sufficient units
      const batches = await tx.bloodInventory.findMany({
        where: {
          bloodBankId,
          bloodGroup,
          componentType,
          unitsAvailable: { gt: 0 },
          expiryDate: { gt: now },
        },
        orderBy: { expiryDate: "asc" }, // FIFO: prioritize earliest expiry
      });

      const totalAvailable = batches.reduce((sum, b) => sum + b.unitsAvailable, 0);
      if (totalAvailable < deductionAmount) {
        throw new Error(
          `Insufficient available stock for ${bloodGroup} ${componentType}. Available: ${totalAvailable}, Requested: ${deductionAmount}`
        );
      }

      let remainingToDeduct = deductionAmount;
      for (const batch of batches) {
        if (remainingToDeduct <= 0) break;
        const deductFromThis = Math.min(batch.unitsAvailable, remainingToDeduct);

        await tx.bloodInventory.update({
          where: { id: batch.id },
          data: {
            unitsAvailable: { decrement: deductFromThis },
          },
        });
        remainingToDeduct -= deductFromThis;
      }

      // Log Transaction
      return tx.inventoryTransaction.create({
        data: {
          bloodBankId,
          bloodGroup,
          componentType,
          quantity,
          transactionType,
          referenceId,
          notes,
          createdBy,
        },
      });
    }

    // Adding units (quantity > 0)
    // Find or create batch with this expiry date
    // Normalize date to day boundary or unique timestamp
    let inventoryBatch = await tx.bloodInventory.findFirst({
      where: {
        bloodBankId,
        bloodGroup,
        componentType,
        expiryDate: targetExpiry,
      },
    });

    if (inventoryBatch) {
      inventoryBatch = await tx.bloodInventory.update({
        where: { id: inventoryBatch.id },
        data: {
          unitsAvailable: { increment: quantity },
        },
      });
    } else {
      inventoryBatch = await tx.bloodInventory.create({
        data: {
          bloodBankId,
          bloodGroup,
          componentType,
          unitsAvailable: quantity,
          expiryDate: targetExpiry,
        },
      });
    }

    // Log Transaction
    const transaction = await tx.inventoryTransaction.create({
      data: {
        bloodBankId,
        inventoryId: inventoryBatch.id,
        bloodGroup,
        componentType,
        quantity,
        transactionType,
        referenceId,
        notes,
        createdBy,
      },
    });

    return transaction;
  });
}

export async function getInventoryTransactions(bloodBankId: string, limit = 50) {
  return prisma.inventoryTransaction.findMany({
    where: { bloodBankId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
