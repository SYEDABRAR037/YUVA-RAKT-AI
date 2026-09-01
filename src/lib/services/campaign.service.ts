import prisma from "@/lib/db";
import { BloodGroup, BloodComponentType, CampaignStatus } from "@prisma/client";
import { logAuditEvent } from "./audit.service";

export interface CreateCampaignParams {
  title: string;
  description?: string;
  bloodGroup: BloodGroup;
  componentType: BloodComponentType;
  state: string;
  district: string;
  targetDonorsCount: number;
  startDate?: Date;
  endDate: Date;
}

export interface CampaignProgressOutput {
  campaign: any;
  metrics: {
    targetDonors: number;
    reachedCount: number;
    interestedCount: number;
    confirmedCount: number;
    progressPercentage: number;
  };
}

/**
 * Creates an authorized volunteer mobilization campaign and alerts verified donors in the target district.
 */
export async function createMobilizationCampaign(params: CreateCampaignParams, createdBy: string) {
  const campaign = await prisma.mobilizationCampaign.create({
    data: {
      title: params.title,
      description: params.description,
      bloodGroup: params.bloodGroup,
      componentType: params.componentType,
      state: params.state,
      district: params.district,
      targetDonorsCount: params.targetDonorsCount,
      startDate: params.startDate || new Date(),
      endDate: params.endDate,
      status: "ACTIVE",
      createdBy,
    },
  });

  // Notify verified donors matching criteria in target district
  const donors = await prisma.youthDonorProfile.findMany({
    where: {
      bloodGroup: params.bloodGroup,
      verificationStatus: "VERIFIED",
      emergencyNotificationConsent: true,
      user: {
        state: params.state,
        district: params.district,
      },
    },
    include: { user: true },
    take: params.targetDonorsCount,
  });

  const bgLabel = params.bloodGroup.replace("_POSITIVE", "+").replace("_NEGATIVE", "-");

  for (const d of donors) {
    await prisma.notification.create({
      data: {
        userId: d.userId,
        type: "BLOOD_REQUEST",
        title: `📢 Volunteer Drive: ${campaign.title}`,
        message: `A voluntary blood donation mobilization campaign for ${bgLabel} (${params.componentType}) has been launched in ${params.district}. Check details to participate!`,
        relatedEntityType: "CAMPAIGN",
        relatedEntityId: campaign.id,
      },
    });
  }

  await logAuditEvent({
    userId: createdBy,
    action: "CAMPAIGN_CREATED",
    entityType: "CAMPAIGN",
    entityId: campaign.id,
    metadata: {
      title: campaign.title,
      targetDonors: campaign.targetDonorsCount,
      donorsNotified: donors.length,
      district: campaign.district,
    },
  });

  return { campaign, notifiedCount: donors.length };
}

/**
 * Aggregates live database progress for a mobilization campaign.
 */
export async function getCampaignProgress(campaignId: string): Promise<CampaignProgressOutput> {
  const campaign = await prisma.mobilizationCampaign.findUnique({
    where: { id: campaignId },
    include: {
      creator: { select: { fullName: true, role: true } },
      donorResponses: true,
    },
  });

  if (!campaign) throw new Error("Mobilization campaign not found");

  const reachedCount = await prisma.notification.count({
    where: { relatedEntityId: campaign.id, relatedEntityType: "CAMPAIGN" },
  });

  const interestedCount = campaign.donorResponses.filter((r) => r.status === "INTERESTED" || r.status === "COMPLETED").length;
  const confirmedCount = campaign.donorResponses.filter((r) => r.status === "COMPLETED").length;

  const target = Math.max(1, campaign.targetDonorsCount);
  const progressPercentage = Math.min(100, Math.round((interestedCount / target) * 100));

  return {
    campaign,
    metrics: {
      targetDonors: campaign.targetDonorsCount,
      reachedCount: Math.max(reachedCount, interestedCount),
      interestedCount,
      confirmedCount,
      progressPercentage,
    },
  };
}
