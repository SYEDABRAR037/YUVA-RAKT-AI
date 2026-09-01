import { z } from "zod";
import { BloodGroupEnum } from "./auth.schema";

export const DonorProfileSchema = z.object({
  bloodGroup: BloodGroupEnum,
  dateOfBirth: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  age: z.number().int().min(18, "Must be at least 18 years old").max(65, "Must be under 65 years old").optional(),
  state: z.string().min(2, "State is required"),
  district: z.string().min(2, "District is required"),
  city: z.string().optional(),
  pincode: z.string().regex(/^\d{6}$/, "Must be a valid 6-digit Indian PIN code"),
  address: z.string().optional(),
  isAvailable: z.boolean().default(true),
  notificationConsent: z.boolean().default(true),
  emergencyConsent: z.boolean().default(true),
  dataSharingConsent: z.boolean().default(true),
});

export type DonorProfileInput = z.infer<typeof DonorProfileSchema>;
