import { z } from "zod";
import { IndianPhoneRegex } from "./auth.schema";

export const UpdateYouthProfileSchema = z.object({
  fullName: z.string().trim().min(2, "Name must be at least 2 characters").optional(),
  phone: z.string().trim().regex(IndianPhoneRegex, "Enter valid 10-digit Indian phone number").optional(),
  state: z.string().min(1, "State is required").optional(),
  district: z.string().min(1, "District is required").optional(),
  city: z.string().trim().optional(),
  preferredLanguage: z.enum(["en", "hi", "mr", "te"]).optional(),
  availabilityStatus: z.enum(["AVAILABLE", "NOT_AVAILABLE", "UNKNOWN"]).optional(),
  emergencyNotificationConsent: z.boolean().optional(),
  locationSharingConsent: z.boolean().optional(),
});

export const UpdatePrivacyConsentSchema = z.object({
  emergencyNotificationConsent: z.boolean().optional(),
  locationSharingConsent: z.boolean().optional(),
  dataSharingConsent: z.boolean().optional(),
});

export const UpdateUserStatusSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  accountStatus: z.enum(["ACTIVE", "PENDING", "SUSPENDED", "DEACTIVATED"]),
  reason: z.string().optional(),
});

export const UpdateOrgVerificationSchema = z.object({
  orgId: z.string().min(1, "Organization ID is required"),
  orgType: z.enum(["HOSPITAL", "BLOOD_BANK"]),
  verificationStatus: z.enum(["VERIFIED", "REJECTED", "PENDING"]),
  notes: z.string().optional(),
});

export type UpdateYouthProfileInput = z.infer<typeof UpdateYouthProfileSchema>;
export type UpdatePrivacyConsentInput = z.infer<typeof UpdatePrivacyConsentSchema>;
export type UpdateUserStatusInput = z.infer<typeof UpdateUserStatusSchema>;
export type UpdateOrgVerificationInput = z.infer<typeof UpdateOrgVerificationSchema>;
