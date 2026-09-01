import { z } from "zod";

export const UserRoleEnum = z.enum([
  "YOUTH_DONOR",
  "HOSPITAL",
  "BLOOD_BANK",
  "GOVERNMENT_OFFICIAL",
  "SUPER_ADMIN",
]);

export const PublicUserRoleEnum = z.enum([
  "YOUTH_DONOR",
  "HOSPITAL",
  "BLOOD_BANK",
]);

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

export const AvailabilityStatusEnum = z.enum([
  "AVAILABLE",
  "NOT_AVAILABLE",
  "UNKNOWN",
]);

export const IndianPhoneRegex = /^[6-9]\d{9}$/;
export const IndianPincodeRegex = /^\d{6}$/;

export const RegisterUserSchema = z
  .object({
    // Common User fields
    fullName: z
      .string()
      .trim()
      .min(2, "Full name must be at least 2 characters")
      .max(100, "Full name cannot exceed 100 characters"),
    email: z
      .string()
      .trim()
      .email("Please provide a valid email address")
      .toLowerCase(),
    phone: z
      .string()
      .trim()
      .regex(IndianPhoneRegex, "Please enter a valid 10-digit Indian mobile number"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters long")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    dateOfBirth: z.string().optional(),
    gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
    state: z.string().min(1, "State is required"),
    district: z.string().min(1, "District is required"),
    city: z.string().trim().optional(),
    role: PublicUserRoleEnum,

    // Youth Donor specific fields
    bloodGroup: BloodGroupEnum.optional(),
    preferredLanguage: z.enum(["en", "hi", "mr", "te"]).default("en"),

    // Hospital / Blood Bank specific fields
    orgName: z.string().trim().optional(),
    registrationNumber: z.string().trim().optional(),
    orgEmail: z.string().trim().email().optional().or(z.literal("")),
    orgPhone: z.string().trim().optional(),
    address: z.string().trim().optional(),
    pincode: z.string().trim().optional(),

    // Consents
    privacyPolicyConsent: z.boolean().refine((val) => val === true, {
      message: "You must accept the Privacy Policy",
    }),
    dataProcessingConsent: z.boolean().refine((val) => val === true, {
      message: "You must consent to data processing for blood matching",
    }),
    emergencyNotificationConsent: z.boolean().default(true),
    locationSharingConsent: z.boolean().default(true),
  })
  .superRefine((data, ctx) => {
    // Password match check
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmPassword"],
        message: "Passwords do not match",
      });
    }

    // Role-specific validation checks
    if (data.role === "YOUTH_DONOR") {
      if (!data.bloodGroup) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["bloodGroup"],
          message: "Please select your blood group",
        });
      }
    }

    if (data.role === "HOSPITAL" || data.role === "BLOOD_BANK") {
      if (!data.orgName || data.orgName.length < 3) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["orgName"],
          message: "Organization name must be at least 3 characters",
        });
      }
      if (!data.registrationNumber || data.registrationNumber.length < 3) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["registrationNumber"],
          message: "Valid registration/license number is required",
        });
      }
      if (!data.address || data.address.length < 5) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["address"],
          message: "Full organization address is required",
        });
      }
      if (!data.pincode || !IndianPincodeRegex.test(data.pincode)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["pincode"],
          message: "Valid 6-digit Indian PIN code is required",
        });
      }
    }
  });

export const LoginUserSchema = z.object({
  email: z.string().trim().email("Please provide a valid email address").toLowerCase(),
  password: z.string().min(1, "Password is required"),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().trim().email("Please provide a valid email address").toLowerCase(),
});

export const ResetPasswordSchema = z
  .object({
    token: z.string().min(1, "Reset token is required"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters long")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export type RegisterUserInput = z.infer<typeof RegisterUserSchema>;
export type LoginUserInput = z.infer<typeof LoginUserSchema>;
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
