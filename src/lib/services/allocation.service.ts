import prisma from "@/lib/db";
import { BloodGroup, BloodComponentType } from "@prisma/client";
import { createNotification } from "./notification.service";
import { logAuditEvent } from "./audit.service";

export async function allocateBloodToRequest(params: {
  bloodBankId: string;
  userId: string;
  requestId: string;
  bloodGroup: BloodGroup;
  componentType: BloodComponentType;
  unitsAllocated: number;
  notes?: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  const { bloodBankId, userId, requestId, bloodGroup, componentType, unitsAllocated, notes } = params;

  if (unitsAllocated <= 0) {
    throw new Error("Units allocated must be greater than zero");
  }

  const bloodBank = await prisma.bloodBank.findUnique({
    where: { id: bloodBankId },
    include: { user: true },
  });
  if (!bloodBank) throw new Error("Blood bank facility not found");

  const request = await prisma.bloodRequest.findUnique({
    where: { id: requestId },
    include: { hospital: { include: { user: true } } },
  });
  if (!request) throw new Error("Blood request not found");

  if (["FULFILLED", "CANCELLED", "EXPIRED"].includes(request.status)) {
    throw new Error(`Cannot allocate units to request with status '${request.status}'`);
  }

  const remainingNeeded = request.unitsRequired - request.unitsFulfilled;
  if (unitsAllocated > remainingNeeded) {
    throw new Error(
      `Over-allocation prevented. Request only requires ${remainingNeeded} more units (attempted: ${unitsAllocated}).`
    );
  }

  const now = new Date();

  // Atomic database transaction
  const result = await prisma.$transaction(async (tx) => {
    // 1. Fetch available unexpired batches (FIFO)
    const batches = await tx.bloodInventory.findMany({
      where: {
        bloodBankId,
        bloodGroup,
        componentType,
        unitsAvailable: { gt: 0 },
        expiryDate: { gt: now },
      },
      orderBy: { expiryDate: "asc" },
    });

    const totalAvailable = batches.reduce((sum, b) => sum + b.unitsAvailable, 0);
    if (totalAvailable < unitsAllocated) {
      throw new Error(
        `Insufficient available inventory. Current available unexpired stock: ${totalAvailable} units (requested ${unitsAllocated}).`
      );
    }

    // 2. Decrement batches
    let remainingToDeduct = unitsAllocated;
    let primaryInventoryId: string | undefined;

    for (const batch of batches) {
      if (remainingToDeduct <= 0) break;
      if (!primaryInventoryId) primaryInventoryId = batch.id;

      const deductFromThis = Math.min(batch.unitsAvailable, remainingToDeduct);
      await tx.bloodInventory.update({
        where: { id: batch.id },
        data: {
          unitsAvailable: { decrement: deductFromThis },
        },
      });
      remainingToDeduct -= deductFromThis;
    }

    // 3. Create BloodAllocation record
    const allocation = await tx.bloodAllocation.create({
      data: {
        requestId,
        bloodBankId,
        inventoryId: primaryInventoryId,
        bloodGroup,
        componentType,
        unitsAllocated,
        allocatedBy: userId,
        notes,
      },
    });

    // 4. Create InventoryTransaction record
    await tx.inventoryTransaction.create({
      data: {
        bloodBankId,
        inventoryId: primaryInventoryId,
        bloodGroup,
        componentType,
        quantity: -unitsAllocated, // deduction
        transactionType: "ALLOCATION",
        referenceId: allocation.id,
        notes: `Allocated to Hospital Request #${requestId}`,
        createdBy: userId,
      },
    });

    // 5. Update BloodRequest status & unitsFulfilled
    const newFulfilledTotal = request.unitsFulfilled + unitsAllocated;
    const isCompletelyFulfilled = newFulfilledTotal >= request.unitsRequired;
    const newStatus = isCompletelyFulfilled ? "FULFILLED" : "PARTIALLY_FULFILLED";

    const updatedRequest = await tx.bloodRequest.update({
      where: { id: requestId },
      data: {
        unitsFulfilled: newFulfilledTotal,
        status: newStatus,
      },
    });

    return { allocation, updatedRequest, isCompletelyFulfilled };
  });

  // Log Audit Event
  await logAuditEvent({
    userId,
    action: result.isCompletelyFulfilled ? "BLOOD_REQUEST_FULFILLED" : "INVENTORY_ALLOCATED",
    entityType: "ALLOCATION",
    entityId: result.allocation.id,
    metadata: {
      requestId,
      bloodBankName: bloodBank.name,
      unitsAllocated,
      bloodGroup,
      componentType,
      newStatus: result.updatedRequest.status,
    },
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
  });

  // Dispatch Notification to Hospital
  const bloodGroupLabel = bloodGroup.replace("_POSITIVE", "+").replace("_NEGATIVE", "-");
  await createNotification({
    userId: request.hospital.userId,
    type: "REQUEST_UPDATE",
    title: result.isCompletelyFulfilled ? "✅ Blood Request Fulfilled!" : "📦 Units Allocated to Request",
    message: `${bloodBank.name} has allocated ${unitsAllocated} units of ${bloodGroupLabel} (${componentType}). Request status: ${result.updatedRequest.status}.`,
    relatedEntityType: "BLOOD_REQUEST",
    relatedEntityId: requestId,
  });

  return result;
}
