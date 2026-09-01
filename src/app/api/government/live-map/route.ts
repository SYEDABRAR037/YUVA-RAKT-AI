import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import prisma from "@/lib/db";

/**
 * GET /api/government/live-map
 * Returns aggregated operational layers:
 * 1. District Shortage Risk Heatmap
 * 2. Active Hospital Emergencies
 * 3. Authorized Blood Bank Resources
 * 4. Live Ambulance Fleet & Missions
 */
export async function GET(req: Request) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Role check: Only Government, Admin, Blood Bank, and Hospital can view tactical map
    if (
      session.role !== "GOVERNMENT_OFFICIAL" &&
      session.role !== "SUPER_ADMIN" &&
      session.role !== "BLOOD_BANK" &&
      session.role !== "HOSPITAL"
    ) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Access restricted to authorized command personnel" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const filterDistrict = searchParams.get("district");
    const filterBloodGroup = searchParams.get("bloodGroup");

    // 1. Fetch District Shortage Risks & Coordinates
    const shortageWhere: any = {};
    if (filterDistrict) shortageWhere.district = { equals: filterDistrict, mode: "insensitive" };
    if (filterBloodGroup) shortageWhere.bloodGroup = filterBloodGroup;

    const shortageRisks = await prisma.shortageRisk.findMany({
      where: shortageWhere,
      orderBy: { riskScore: "desc" },
    });

    // Known district GPS centroids
    const DISTRICT_COORDINATES: Record<string, { lat: number; lng: number }> = {
      pune: { lat: 18.5204, lng: 73.8567 },
      mumbai: { lat: 19.076, lng: 72.8777 },
      nagpur: { lat: 21.1458, lng: 79.0882 },
      nashik: { lat: 19.9975, lng: 73.7898 },
      aurangabad: { lat: 19.8762, lng: 75.3433 },
      delhi: { lat: 28.6139, lng: 77.209 },
      bengaluru: { lat: 12.9716, lng: 77.5946 },
      hyderabad: { lat: 17.385, lng: 78.4867 },
    };

    const districtLayer = shortageRisks.map((risk) => {
      const dKey = risk.district.toLowerCase();
      const coords = DISTRICT_COORDINATES[dKey] || { lat: 18.5204, lng: 73.8567 };
      return {
        id: risk.id,
        district: risk.district,
        state: risk.state,
        latitude: coords.lat,
        longitude: coords.lng,
        bloodGroup: risk.bloodGroup,
        componentType: risk.componentType,
        riskScore: risk.riskScore,
        riskLevel: risk.riskLevel,
        currentInventoryUnits: risk.currentInventoryUnits,
        predictedDemandUnits: risk.predictedDemandUnits,
        activeEmergencyRequests: risk.activeEmergencyRequests,
        contributingFactors: risk.contributingFactors,
        recommendedActions: risk.recommendedActions,
        updatedAt: risk.updatedAt,
      };
    });

    // 2. Fetch Active Hospital Emergency Requests
    const activeEmergencies = await prisma.bloodRequest.findMany({
      where: {
        status: { in: ["PENDING", "ACKNOWLEDGED", "MATCHING", "PARTIALLY_FULFILLED"] },
      },
      include: {
        hospital: true,
        ambulanceMissions: {
          include: { ambulance: true },
        },
        donorResponses: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const emergencyLayer = activeEmergencies.map((req) => {
      const dKey = req.hospital.district.toLowerCase();
      const coords = DISTRICT_COORDINATES[dKey] || { lat: 18.5204, lng: 73.8567 };
      return {
        id: req.id,
        hospitalName: req.hospital.name,
        district: req.hospital.district,
        state: req.hospital.state,
        latitude: req.hospital.latitude || coords.lat,
        longitude: req.hospital.longitude || coords.lng,
        bloodGroup: req.bloodGroup,
        componentType: req.componentType,
        unitsRequired: req.unitsRequired,
        unitsFulfilled: req.unitsFulfilled,
        urgency: req.urgency,
        status: req.status,
        createdAt: req.createdAt,
        activeMission: req.ambulanceMissions[0] || null,
        interestedDonorsCount: req.donorResponses.filter((r) => r.status === "INTERESTED").length,
      };
    });

    // 3. Fetch Authorized Blood Banks
    const bloodBanks = await prisma.bloodBank.findMany({
      include: {
        inventory: true,
      },
    });

    const bloodBankLayer = bloodBanks.map((bb) => {
      const dKey = bb.district.toLowerCase();
      const coords = DISTRICT_COORDINATES[dKey] || { lat: 18.5204, lng: 73.8567 };
      const totalUnits = bb.inventory.reduce((sum, inv) => sum + inv.unitsAvailable, 0);
      return {
        id: bb.id,
        name: bb.name,
        district: bb.district,
        state: bb.state,
        latitude: bb.latitude || coords.lat + 0.02,
        longitude: bb.longitude || coords.lng + 0.02,
        totalInventoryUnits: totalUnits,
        verificationStatus: bb.verificationStatus,
      };
    });

    // 4. Fetch Active Ambulances & Missions
    const ambulances = await prisma.ambulance.findMany({
      include: {
        missions: {
          where: {
            status: { in: ["ASSIGNED", "ACCEPTED", "EN_ROUTE_TO_BLOOD_BANK", "ARRIVED_AT_BLOOD_BANK", "BLOOD_COLLECTED", "EN_ROUTE_TO_HOSPITAL", "ARRIVED_AT_HOSPITAL", "DELIVERED"] },
          },
          include: {
            bloodRequest: true,
            sourceBloodBank: true,
            destinationHospital: true,
          },
        },
      },
    });

    const ambulanceLayer = ambulances.map((amb) => ({
      id: amb.id,
      displayName: amb.displayName,
      vehicleNumber: amb.vehicleNumber,
      status: amb.status,
      district: amb.district,
      state: amb.state,
      currentLatitude: amb.currentLatitude,
      currentLongitude: amb.currentLongitude,
      lastLocationUpdatedAt: amb.lastLocationUpdatedAt,
      activeMission: amb.missions[0] || null,
    }));

    return NextResponse.json({
      success: true,
      data: {
        districts: districtLayer,
        emergencies: emergencyLayer,
        bloodBanks: bloodBankLayer,
        ambulances: ambulanceLayer,
        summary: {
          totalDistrictsTracked: districtLayer.length,
          criticalDistrictsCount: districtLayer.filter((d) => d.riskLevel === "CRITICAL").length,
          highRiskDistrictsCount: districtLayer.filter((d) => d.riskLevel === "HIGH").length,
          activeEmergenciesCount: emergencyLayer.length,
          activeMissionsCount: ambulanceLayer.filter((a) => a.activeMission !== null).length,
        },
      },
    });
  } catch (error) {
    console.error("[GET /api/government/live-map Error]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
