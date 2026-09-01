import { z } from "zod";

export const BloodGroupEnum = z.enum([
  "A_POSITIVE",
  "A_NEGATIVE",
  "B_POSITIVE",
  "B_NEGATIVE",
  "AB_POSITIVE",
  "AB_NEGATIVE",
  "O_POSITIVE",
  "O_NEGATIVE",
]);

export const BloodComponentTypeEnum = z.enum([
  "WHOLE_BLOOD",
  "RBC",
  "PLASMA",
  "PLATELETS",
]);

export const RequestUrgencyEnum = z.enum([
  "ROUTINE",
  "URGENT",
  "CRITICAL",
  "EMERGENCY",
]);

export const RequestStatusEnum = z.enum([
  "PENDING",
  "ACKNOWLEDGED",
  "MATCHING",
  "PARTIALLY_FULFILLED",
  "FULFILLED",
  "CANCELLED",
  "EXPIRED",
]);

export const DonationStatusEnum = z.enum([
  "SCHEDULED",
  "COMPLETED",
  "CANCELLED",
  "REJECTED",
]);

export const DonorResponseStatusEnum = z.enum([
  "INTERESTED",
  "DECLINED",
  "CONTACT_REQUESTED",
  "COMPLETED",
]);

// -------------------------------------------------------------
// Hospital Request Schemas
// -------------------------------------------------------------

export const CreateBloodRequestSchema = z.object({
  bloodGroup: BloodGroupEnum,
  componentType: BloodComponentTypeEnum,
  unitsRequired: z.number().int().min(1, "At least 1 unit is required").max(50, "Maximum 50 units per request"),
  urgency: RequestUrgencyEnum,
  requiredBy: z.string().datetime().or(z.string().min(1)), // ISO string or datetime local
  reason: z.string().max(300).optional(),
  patientAgeGroup: z.enum(["PEDIATRIC", "ADULT", "GERIATRIC"]).optional(),
});

export const CancelBloodRequestSchema = z.object({
  requestId: z.string().min(1, "Request ID is required"),
  reason: z.string().max(300).optional(),
});

// -------------------------------------------------------------
// Blood Allocation Schemas
// -------------------------------------------------------------

export const AllocateBloodSchema = z.object({
  requestId: z.string().min(1, "Request ID is required"),
  bloodGroup: BloodGroupEnum,
  componentType: BloodComponentTypeEnum,
  unitsAllocated: z.number().int().min(1, "Must allocate at least 1 unit"),
  notes: z.string().max(300).optional(),
});

// -------------------------------------------------------------
// Donation Schemas
// -------------------------------------------------------------

export const RecordDonationSchema = z.object({
  donorId: z.string().optional(),
  donorEmailOrPhone: z.string().optional(),
  bloodGroup: BloodGroupEnum,
  componentType: BloodComponentTypeEnum.default("WHOLE_BLOOD"),
  units: z.number().int().min(1).max(5).default(1),
  donationDate: z.string().optional(),
  campName: z.string().max(150).optional(),
  certificateNumber: z.string().max(100).optional(),
  notes: z.string().max(300).optional(),
});

// -------------------------------------------------------------
// Donor Verification Schemas
// -------------------------------------------------------------

export const SubmitVerificationSchema = z.object({
  documentType: z.enum(["BLOOD_CAMP_CARD", "LAB_REPORT", "HOSPITAL_CERTIFICATE", "GOVT_ID"]),
  documentNumber: z.string().min(3, "Document reference number is required").max(100),
  notes: z.string().max(300).optional(),
});

export const ReviewVerificationSchema = z.object({
  requestId: z.string().min(1, "Verification request ID is required"),
  decision: z.enum(["VERIFIED", "REJECTED"]),
  rejectionReason: z.string().max(300).optional(),
}).refine(
  (data) => data.decision !== "REJECTED" || (data.rejectionReason && data.rejectionReason.trim().length > 0),
  { message: "A reason is mandatory when rejecting a verification request", path: ["rejectionReason"] }
);

// -------------------------------------------------------------
// Donor Opportunity Response
// -------------------------------------------------------------

export const DonorResponseSchema = z.object({
  requestId: z.string().min(1, "Request ID is required"),
  status: DonorResponseStatusEnum,
  message: z.string().max(300).optional(),
});

// -------------------------------------------------------------
// Inventory Adjustment Schemas
// -------------------------------------------------------------

export const AdjustInventorySchema = z.object({
  bloodGroup: BloodGroupEnum,
  componentType: BloodComponentTypeEnum,
  quantity: z.number().int(), // Positive to add, negative to deduct
  expiryDate: z.string().optional(),
  notes: z.string().max(300).optional(),
});
