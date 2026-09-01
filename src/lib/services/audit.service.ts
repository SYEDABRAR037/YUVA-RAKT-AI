import prisma from "@/lib/db";
import { Prisma } from "@prisma/client";

export type AuditAction =
  | "REGISTER"
  | "LOGIN"
  | "LOGOUT"
  | "PROFILE_UPDATE"
  | "ROLE_CHANGE"
  | "ACCOUNT_STATUS_CHANGE"
  | "CONSENT_UPDATED"
  | "ORGANIZATION_VERIFIED"
  | "PASSWORD_RESET_REQUEST"
  | "PASSWORD_RESET_SUCCESS"
  | "DONOR_VERIFICATION_SUBMITTED"
  | "DONOR_VERIFIED"
  | "DONOR_REJECTED"
  | "AVAILABILITY_UPDATED"
  | "DONATION_CREATED"
  | "DONATION_COMPLETED"
  | "INVENTORY_ADJUSTED"
  | "INVENTORY_ALLOCATED"
  | "BLOOD_REQUEST_CREATED"
  | "BLOOD_REQUEST_ACKNOWLEDGED"
  | "BLOOD_REQUEST_FULFILLED"
  | "BLOOD_REQUEST_CANCELLED"
  | "DONOR_RESPONSE"
  // Phase 3 AI Actions
  | "AI_FORECAST_GENERATED"
  | "SHORTAGE_RISK_CALCULATED"
  | "DONOR_PRIORITY_CALCULATED"
  | "AI_RECOMMENDATION_GENERATED"
  | "AI_REFRESH_EXECUTED"
  // Phase 4 Emergency & Mobilization Actions
  | "EMERGENCY_CREATED"
  | "EMERGENCY_ACKNOWLEDGED"
  | "EMERGENCY_ESCALATED"
  | "DONOR_ALERT_CREATED"
  | "DONOR_RESPONDED"
  | "CAMPAIGN_CREATED"
  | "CAMPAIGN_UPDATED"
  | "EMERGENCY_FULFILLED"
  | "EMERGENCY_CANCELLED"
  // Phase 5 & 6 Autonomous Response & Ambulance Actions
  | "SHORTAGE_RESPONSE_ACTIVATED"
  | "RESOURCE_DISCOVERY_STARTED"
  | "BLOOD_BANK_ALERTED"
  | "DONOR_ALERT_BATCH_SENT"
  | "RESPONSE_RADIUS_EXPANDED"
  | "AMBULANCE_MISSION_CREATED"
  | "AMBULANCE_MISSION_ACCEPTED"
  | "AMBULANCE_MISSION_DECLINED"
  | "AMBULANCE_GPS_TRACKING_STARTED"
  | "AMBULANCE_TRACKING_STARTED"
  | "AMBULANCE_LOCATION_UPDATED"
  | "AMBULANCE_ROUTE_UPDATED"
  | "AMBULANCE_ARRIVED_BLOOD_BANK"
  | "AMBULANCE_GPS_TRACKING_STOPPED"
  | "BLOOD_COLLECTED"
  | "AMBULANCE_EN_ROUTE_HOSPITAL"
  | "AMBULANCE_ARRIVED_HOSPITAL"
  | "BLOOD_DELIVERED"
  | "AMBULANCE_TRACKING_COMPLETED"
  | "EMERGENCY_TRANSPORT_COMPLETED";

export interface LogAuditParams {
  userId?: string | null;
  action: AuditAction;
  entityType:
    | "USER"
    | "DONOR_PROFILE"
    | "HOSPITAL"
    | "BLOOD_BANK"
    | "CONSENT"
    | "SECURITY"
    | "DONATION"
    | "INVENTORY"
    | "BLOOD_REQUEST"
    | "ALLOCATION"
    | "NOTIFICATION"
    | "AI_SYSTEM"
    | "FORECAST"
    | "SHORTAGE_RISK"
    | "EMERGENCY"
    | "CAMPAIGN"
    | "ESCALATION"
    | "AMBULANCE"
    | "AMBULANCE_MISSION"
    | "OPERATIONAL_LOCATION"
    | "EMERGENCY_RESPONSE";
  entityId?: string | null;
  metadata?: Prisma.InputJsonValue;
  ipAddress?: string | null;
  userAgent?: string | null;
}

/**
 * Records an immutable audit log entry.
 * Note: Never store plaintext passwords or sensitive secrets.
 */
export async function logAuditEvent(params: LogAuditParams) {
  try {
    const validUserId = params.userId && params.userId.length >= 20 ? params.userId : null;
    return await prisma.auditLog.create({
      data: {
        userId: validUserId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        metadata: params.metadata,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      },
    });
  } catch (error) {
    console.error("[AuditLog Error]", error);
    return null;
  }
}
