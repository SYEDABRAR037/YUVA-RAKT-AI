export type UserRole =
  | "YOUTH_DONOR"
  | "HOSPITAL"
  | "BLOOD_BANK"
  | "GOVERNMENT_OFFICIAL"
  | "SUPER_ADMIN";

export type UserStatus =
  | "ACTIVE"
  | "INACTIVE"
  | "SUSPENDED"
  | "PENDING_VERIFICATION";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string | null;
  isVerified: boolean;
  status: UserStatus;
}
