import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges Tailwind and conditional class names safely.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a raw Prisma BloodGroup enum (e.g. O_POSITIVE) to human-readable label (e.g. O+).
 */
export function formatBloodGroup(bg?: string | null): string {
  if (!bg) return "Unknown";
  return bg
    .replace("_POSITIVE", "+")
    .replace("_NEGATIVE", "-")
    .replace("_", " ");
}

/**
 * Formats a raw Prisma BloodComponentType enum (e.g. WHOLE_BLOOD) to human-readable label.
 */
export function formatComponentType(comp?: string | null): string {
  if (!comp) return "Whole Blood";
  switch (comp) {
    case "WHOLE_BLOOD":
      return "Whole Blood";
    case "RBC":
      return "Packed Red Cells (RBC)";
    case "PLATELETS":
      return "Platelets";
    case "PLASMA":
      return "Fresh Frozen Plasma";
    default:
      return comp.replace(/_/g, " ");
  }
}
