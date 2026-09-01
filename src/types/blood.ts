export type BloodGroup =
  | "A_POSITIVE"
  | "A_NEGATIVE"
  | "B_POSITIVE"
  | "B_NEGATIVE"
  | "AB_POSITIVE"
  | "AB_NEGATIVE"
  | "O_POSITIVE"
  | "O_NEGATIVE";

export type VerificationStatus =
  | "UNVERIFIED"
  | "PENDING"
  | "VERIFIED"
  | "REJECTED";

export type BloodComponentType =
  | "WHOLE_BLOOD"
  | "PRBC"
  | "FFP"
  | "PLATELETS"
  | "CRYO";

export type RequestUrgency =
  | "ROUTINE"
  | "URGENT"
  | "CRITICAL_EMERGENCY";

export type RequestStatus =
  | "DRAFT"
  | "PENDING_FULFILLMENT"
  | "MATCHING_DONORS"
  | "PARTIALLY_FULFILLED"
  | "FULFILLED"
  | "CANCELLED"
  | "EXPIRED";
