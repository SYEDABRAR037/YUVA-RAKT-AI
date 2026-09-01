import { PrismaClient, BloodGroup, BloodComponentType, VerificationStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import { refreshAllAIIntelligence } from "../src/ai/services/ai-orchestrator";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting YUVA-RAKT AI Phase 5 Database Seed...");

  // 1. Clear previous records cleanly in relational order
  await prisma.ambulanceLocationHistory.deleteMany();
  await prisma.ambulanceMission.deleteMany();
  await prisma.emergencyResponseEvent.deleteMany();
  await prisma.operationalLocation.deleteMany();
  await prisma.ambulance.deleteMany();

  await prisma.emergencyEscalation.deleteMany();
  await prisma.campaignDonorResponse.deleteMany();
  await prisma.mobilizationCampaign.deleteMany();

  await prisma.aIInsight.deleteMany();
  await prisma.donorPriorityScore.deleteMany();
  await prisma.shortageRisk.deleteMany();
  await prisma.demandForecast.deleteMany();

  await prisma.notification.deleteMany();
  await prisma.donorResponse.deleteMany();
  await prisma.bloodAllocation.deleteMany();
  await prisma.bloodRequest.deleteMany();
  await prisma.inventoryTransaction.deleteMany();
  await prisma.bloodInventory.deleteMany();
  await prisma.donation.deleteMany();
  await prisma.donorVerificationRequest.deleteMany();
  await prisma.consent.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.youthDonorProfile.deleteMany();
  await prisma.hospital.deleteMany();
  await prisma.bloodBank.deleteMany();
  await prisma.user.deleteMany();

  console.log("🧹 Cleared old records.");

  const defaultPasswordHash = await bcrypt.hash("YuvaRakt@2026", 10);

  // Expiry calculation helpers
  const getExpiry = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d;
  };

  // -------------------------------------------------------------
  // 1. SUPER ADMIN
  // -------------------------------------------------------------
  const adminUser = await prisma.user.create({
    data: {
      fullName: "Dr. Vikramaditya Sharma",
      email: "admin@yuvarakt.demo",
      phone: "9811001100",
      passwordHash: defaultPasswordHash,
      role: "SUPER_ADMIN",
      accountStatus: "ACTIVE",
      state: "Delhi (NCT)",
      district: "New Delhi",
      city: "Connaught Place",
      emailVerified: true,
      phoneVerified: true,
    },
  });
  console.log("✅ Created Super Admin:", adminUser.email);

  // -------------------------------------------------------------
  // 2. GOVERNMENT OFFICIAL
  // -------------------------------------------------------------
  const govUser = await prisma.user.create({
    data: {
      fullName: "Smt. Ananya Deshmukh, IAS",
      email: "government@yuvarakt.demo",
      phone: "9822002200",
      passwordHash: defaultPasswordHash,
      role: "GOVERNMENT_OFFICIAL",
      accountStatus: "ACTIVE",
      state: "Maharashtra",
      district: "Pune",
      city: "Mantralaya",
      emailVerified: true,
      phoneVerified: true,
    },
  });
  console.log("✅ Created Government Official:", govUser.email);

  // -------------------------------------------------------------
  // 3. HOSPITALS
  // -------------------------------------------------------------
  const hospitalUser1 = await prisma.user.create({
    data: {
      fullName: "Dr. Rajesh Kulkarni (Medical Superintendent)",
      email: "hospital@yuvarakt.demo",
      phone: "9833003300",
      passwordHash: defaultPasswordHash,
      role: "HOSPITAL",
      accountStatus: "ACTIVE",
      state: "Delhi (NCT)",
      district: "New Delhi",
      city: "Ansari Nagar",
      hospital: {
        create: {
          name: "All India Institute of Medical Sciences (AIIMS)",
          registrationNumber: "DL-HOSP-AIIMS-001",
          email: "bloodbank@aiims.edu.in",
          phone: "01126588500",
          address: "Sri Aurobindo Marg, Ansari Nagar East",
          city: "New Delhi",
          district: "New Delhi",
          state: "Delhi (NCT)",
          pincode: "110029",
          verificationStatus: "VERIFIED",
          latitude: 28.5672,
          longitude: 77.2100,
        },
      },
    },
    include: { hospital: true },
  });
  console.log("✅ Created Primary Hospital:", hospitalUser1.email);

  const hospitalUser2 = await prisma.user.create({
    data: {
      fullName: "Dr. Sneha Joshi (Chief Medical Officer)",
      email: "pune.hospital@yuvarakt.demo",
      phone: "9833003301",
      passwordHash: defaultPasswordHash,
      role: "HOSPITAL",
      accountStatus: "ACTIVE",
      state: "Maharashtra",
      district: "Pune",
      city: "Shivajinagar",
      hospital: {
        create: {
          name: "Sassoon General Hospital & Medical College",
          registrationNumber: "MH-PUN-SGH-2024",
          email: "emergency@sassoon.gov.in",
          phone: "02026128000",
          address: "Near Pune Railway Station, Sassoon Road",
          city: "Pune",
          district: "Pune",
          state: "Maharashtra",
          pincode: "411001",
          verificationStatus: "VERIFIED",
          latitude: 18.5284,
          longitude: 73.8739,
        },
      },
    },
    include: { hospital: true },
  });

  // -------------------------------------------------------------
  // 4. BLOOD BANKS
  // -------------------------------------------------------------
  const bloodBankUser1 = await prisma.user.create({
    data: {
      fullName: "Dr. Meenakshi Sundaram (Nodal Officer)",
      email: "bloodbank@yuvarakt.demo",
      phone: "9844004400",
      passwordHash: defaultPasswordHash,
      role: "BLOOD_BANK",
      accountStatus: "ACTIVE",
      state: "Maharashtra",
      district: "Pune",
      city: "Rasta Peth",
      bloodBank: {
        create: {
          name: "Indian Red Cross Society Blood Centre — Pune",
          registrationNumber: "MH-PUN-RC-2024-88",
          email: "contact@redcrosspune.org",
          phone: "02026065500",
          address: "Red Cross Building, 10 Mudliar Road, Rasta Peth",
          city: "Pune",
          district: "Pune",
          state: "Maharashtra",
          pincode: "411011",
          verificationStatus: "VERIFIED",
          latitude: 18.5195,
          longitude: 73.8652,
        },
      },
    },
    include: { bloodBank: true },
  });
  console.log("✅ Created Primary Blood Bank:", bloodBankUser1.email);

  const bloodBankUser2 = await prisma.user.create({
    data: {
      fullName: "Dr. Arvind Patel",
      email: "delhi.bloodbank@yuvarakt.demo",
      phone: "9844004401",
      passwordHash: defaultPasswordHash,
      role: "BLOOD_BANK",
      accountStatus: "ACTIVE",
      state: "Delhi (NCT)",
      district: "New Delhi",
      city: "Red Cross Bhawan",
      bloodBank: {
        create: {
          name: "National Blood Transfusion Council Center Delhi",
          registrationNumber: "DL-DEL-NBTC-2023",
          email: "nbtc@delhi.gov.in",
          phone: "01123716441",
          address: "1 Red Cross Road",
          city: "New Delhi",
          district: "New Delhi",
          state: "Delhi (NCT)",
          pincode: "110001",
          verificationStatus: "VERIFIED",
          latitude: 28.6210,
          longitude: 77.2150,
        },
      },
    },
    include: { bloodBank: true },
  });

  // -------------------------------------------------------------
  // 5. YOUTH VOLUNTARY DONORS
  // -------------------------------------------------------------
  const donorUser1 = await prisma.user.create({
    data: {
      fullName: "Aarav Sharma",
      email: "donor@yuvarakt.demo",
      phone: "9855005500",
      passwordHash: defaultPasswordHash,
      role: "YOUTH_DONOR",
      accountStatus: "ACTIVE",
      state: "Maharashtra",
      district: "Pune",
      city: "Kothrud",
      emailVerified: true,
      phoneVerified: true,
      youthDonorProfile: {
        create: {
          bloodGroup: "O_POSITIVE",
          verificationStatus: "VERIFIED",
          availabilityStatus: "AVAILABLE",
          donationCount: 4,
          lastDonationDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
          preferredLanguage: "en",
          emergencyNotificationConsent: true,
          locationSharingConsent: true,
        },
      },
      consents: {
        create: [
          { consentType: "PRIVACY_POLICY", accepted: true, version: "v1.0" },
          { consentType: "DATA_PROCESSING", accepted: true, version: "v1.0" },
          { consentType: "EMERGENCY_NOTIFICATION", accepted: true, version: "v1.0" },
          { consentType: "LOCATION_SHARING", accepted: true, version: "v1.0" },
        ],
      },
    },
    include: { youthDonorProfile: true },
  });
  console.log("✅ Created Primary Verified Youth Donor:", donorUser1.email);

  // Additional Synthetic Donors Across Groups
  const syntheticDonors = [
    { name: "Priya Nair", email: "priya.nair@demo.in", phone: "9866006601", state: "Maharashtra", district: "Pune", group: "A_POSITIVE", status: "VERIFIED" as VerificationStatus, donations: 2 },
    { name: "Rohan Patil", email: "rohan.patil@demo.in", phone: "9866006602", state: "Maharashtra", district: "Pune", group: "B_POSITIVE", status: "VERIFIED" as VerificationStatus, donations: 1 },
    { name: "Aditya Verma", email: "aditya.verma@demo.in", phone: "9866006603", state: "Maharashtra", district: "Pune", group: "O_NEGATIVE", status: "VERIFIED" as VerificationStatus, donations: 3 },
    { name: "Meera Sen", email: "meera.sen@demo.in", phone: "9866006604", state: "Delhi (NCT)", district: "New Delhi", group: "AB_POSITIVE", status: "PENDING" as VerificationStatus, donations: 0 },
    { name: "Tanvi Kulkarni", email: "tanvi.k@demo.in", phone: "9866006605", state: "Maharashtra", district: "Pune", group: "A_NEGATIVE", status: "UNVERIFIED" as VerificationStatus, donations: 0 },
    { name: "Kunal Singhania", email: "kunal.s@demo.in", phone: "9866006606", state: "Maharashtra", district: "Pune", group: "B_NEGATIVE", status: "VERIFIED" as VerificationStatus, donations: 2 },
  ];

  const createdSyntheticDonors: any[] = [];
  for (const s of syntheticDonors) {
    const u = await prisma.user.create({
      data: {
        fullName: s.name,
        email: s.email,
        phone: s.phone,
        passwordHash: defaultPasswordHash,
        role: "YOUTH_DONOR",
        accountStatus: "ACTIVE",
        state: s.state,
        district: s.district,
        city: s.district,
        youthDonorProfile: {
          create: {
            bloodGroup: s.group as BloodGroup,
            verificationStatus: s.status,
            availabilityStatus: "AVAILABLE",
            donationCount: s.donations,
            preferredLanguage: "en",
            emergencyNotificationConsent: true,
            locationSharingConsent: true,
          },
        },
        consents: {
          create: [
            { consentType: "PRIVACY_POLICY", accepted: true, version: "v1.0" },
            { consentType: "DATA_PROCESSING", accepted: true, version: "v1.0" },
          ],
        },
      },
      include: { youthDonorProfile: true },
    });
    createdSyntheticDonors.push(u);
  }

  // -------------------------------------------------------------
  // 6. PHASE 5: AMBULANCES & OPERATIONAL LOCATIONS
  // -------------------------------------------------------------
  console.log("🚑 Seeding emergency ambulances & operational telemetry...");

  const ambUser1 = await prisma.user.create({
    data: {
      fullName: "Ramesh Pawar (EMS Pilot)",
      email: "ambulance@yuvarakt.demo",
      phone: "9877007701",
      passwordHash: defaultPasswordHash,
      role: "AMBULANCE",
      accountStatus: "ACTIVE",
      state: "Maharashtra",
      district: "Pune",
      city: "Pune",
      emailVerified: true,
      phoneVerified: true,
      ambulance: {
        create: {
          vehicleNumber: "MH-12-EM-108",
          displayName: "Pune EMS Rapid Transit-01",
          status: "AVAILABLE",
          district: "Pune",
          state: "Maharashtra",
          currentLatitude: 18.5204,
          currentLongitude: 73.8567,
          lastLocationUpdatedAt: new Date(),
        },
      },
    },
    include: { ambulance: true },
  });
  console.log("✅ Created Primary Ambulance Operator:", ambUser1.email);

  const ambUser2 = await prisma.user.create({
    data: {
      fullName: "Suresh Shinde (Fleet Operator)",
      email: "pune.ambulance2@demo.in",
      phone: "9877007702",
      passwordHash: defaultPasswordHash,
      role: "AMBULANCE",
      accountStatus: "ACTIVE",
      state: "Maharashtra",
      district: "Pune",
      city: "Pune",
      ambulance: {
        create: {
          vehicleNumber: "MH-12-LL-204",
          displayName: "Lifeline Blood Courier-02",
          status: "AVAILABLE",
          district: "Pune",
          state: "Maharashtra",
          currentLatitude: 18.5300,
          currentLongitude: 73.8400,
          lastLocationUpdatedAt: new Date(),
        },
      },
    },
    include: { ambulance: true },
  });

  const ambUser3 = await prisma.user.create({
    data: {
      fullName: "Ganesh Jadhav",
      email: "mumbai.ambulance3@demo.in",
      phone: "9877007703",
      passwordHash: defaultPasswordHash,
      role: "AMBULANCE",
      accountStatus: "ACTIVE",
      state: "Maharashtra",
      district: "Mumbai",
      city: "Mumbai",
      ambulance: {
        create: {
          vehicleNumber: "MH-01-ST-999",
          displayName: "Mumbai State Transit-03",
          status: "BUSY",
          district: "Mumbai",
          state: "Maharashtra",
          currentLatitude: 19.0760,
          currentLongitude: 72.8777,
          lastLocationUpdatedAt: new Date(),
        },
      },
    },
    include: { ambulance: true },
  });

  // -------------------------------------------------------------
  // 7. PRE-SEED BLOOD INVENTORY ACROSS BLOOD BANKS
  // -------------------------------------------------------------
  console.log("📦 Seeding realistic blood bank inventory...");

  const puneBankId = bloodBankUser1.bloodBank!.id;
  const delhiBankId = bloodBankUser2.bloodBank!.id;

  const bloodGroups: BloodGroup[] = [
    "A_POSITIVE", "A_NEGATIVE",
    "B_POSITIVE", "B_NEGATIVE",
    "AB_POSITIVE", "AB_NEGATIVE",
    "O_POSITIVE", "O_NEGATIVE",
  ];

  const components: BloodComponentType[] = ["WHOLE_BLOOD", "RBC", "PLASMA", "PLATELETS"];

  // Seed inventory batches for Pune Red Cross
  for (const bg of bloodGroups) {
    for (const ct of components) {
      const qty = bg.includes("POSITIVE") ? 10 : 4;
      const expiry = ct === "PLATELETS" ? getExpiry(5) : ct === "PLASMA" ? getExpiry(300) : getExpiry(32);

      const inv = await prisma.bloodInventory.create({
        data: {
          bloodBankId: puneBankId,
          bloodGroup: bg,
          componentType: ct,
          unitsAvailable: qty,
          expiryDate: expiry,
        },
      });

      await prisma.inventoryTransaction.create({
        data: {
          bloodBankId: puneBankId,
          inventoryId: inv.id,
          bloodGroup: bg,
          componentType: ct,
          quantity: qty,
          transactionType: "DONATION",
          notes: "Initial calibrated batch from youth camps",
          createdBy: bloodBankUser1.id,
        },
      });
    }
  }

  // Seed inventory for Delhi NBTC
  for (const bg of bloodGroups) {
    const inv = await prisma.bloodInventory.create({
      data: {
        bloodBankId: delhiBankId,
        bloodGroup: bg,
        componentType: "RBC",
        unitsAvailable: 8,
        expiryDate: getExpiry(25),
      },
    });

    await prisma.inventoryTransaction.create({
      data: {
        bloodBankId: delhiBankId,
        inventoryId: inv.id,
        bloodGroup: bg,
        componentType: "RBC",
        quantity: 8,
        transactionType: "DONATION",
        notes: "Calibrated inventory batch",
        createdBy: bloodBankUser2.id,
      },
    });
  }

  // -------------------------------------------------------------
  // 8. PRE-SEED HOSPITAL BLOOD REQUESTS
  // -------------------------------------------------------------
  console.log("🏥 Seeding hospital blood requisitions...");

  const sassoonHospId = hospitalUser2.hospital!.id;
  const aiimsHospId = hospitalUser1.hospital!.id;

  // Request 1: Active Urgent O+ request in Pune
  const req1 = await prisma.bloodRequest.create({
    data: {
      hospitalId: sassoonHospId,
      bloodGroup: "O_POSITIVE",
      componentType: "RBC",
      unitsRequired: 2,
      unitsFulfilled: 0,
      urgency: "URGENT",
      requiredBy: getExpiry(1),
      reason: "Emergency orthopedic trauma surgery",
      patientAgeGroup: "ADULT",
      status: "PENDING",
      createdBy: hospitalUser2.id,
    },
  });

  // Request 2: Critical A+ Whole Blood request in Pune
  const req2 = await prisma.bloodRequest.create({
    data: {
      hospitalId: sassoonHospId,
      bloodGroup: "A_POSITIVE",
      componentType: "WHOLE_BLOOD",
      unitsRequired: 3,
      unitsFulfilled: 1,
      urgency: "CRITICAL",
      requiredBy: getExpiry(1),
      reason: "Post-partum hemorrhage management",
      patientAgeGroup: "ADULT",
      status: "PARTIALLY_FULFILLED",
      createdBy: hospitalUser2.id,
    },
  });

  // Request 3: Emergency Platelets request at AIIMS
  await prisma.bloodRequest.create({
    data: {
      hospitalId: aiimsHospId,
      bloodGroup: "O_POSITIVE",
      componentType: "PLATELETS",
      unitsRequired: 4,
      unitsFulfilled: 0,
      urgency: "EMERGENCY",
      requiredBy: getExpiry(1),
      reason: "Acute oncology thrombocytopenia",
      patientAgeGroup: "PEDIATRIC",
      status: "PENDING",
      createdBy: hospitalUser1.id,
    },
  });

  // -------------------------------------------------------------
  // 9. PRE-SEED DONATION RECORDS
  // -------------------------------------------------------------
  console.log("🩸 Seeding completed voluntary donation records...");

  await prisma.donation.create({
    data: {
      donorId: donorUser1.youthDonorProfile!.id,
      bloodBankId: puneBankId,
      donationDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
      units: 1,
      bloodGroup: "O_POSITIVE",
      componentType: "WHOLE_BLOOD",
      status: "COMPLETED",
      campName: "National Youth Day Voluntary Drive, SPPU Pune",
      certificateNumber: "CERT-PUN-2026-0042",
      notes: "Successful donation, all vitals normal.",
    },
  });

  // -------------------------------------------------------------
  // 10. PRE-SEED PENDING DONOR VERIFICATIONS
  // -------------------------------------------------------------
  console.log("📋 Seeding pending donor verification requests...");

  const pendingDonor = createdSyntheticDonors.find((d) => d.email === "meera.sen@demo.in");
  if (pendingDonor) {
    await prisma.donorVerificationRequest.create({
      data: {
        donorId: pendingDonor.youthDonorProfile.id,
        status: "PENDING",
        documentType: "BLOOD_CAMP_CARD",
        documentNumber: "CAMP-DEL-2026-102",
        notes: "Donated at Red Cross Bhawan Youth Camp",
        submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
    });
  }

  // -------------------------------------------------------------
  // 11. PRE-SEED NOTIFICATIONS
  // -------------------------------------------------------------
  console.log("🔔 Seeding real-time notifications...");

  await prisma.notification.create({
    data: {
      userId: donorUser1.id,
      type: "BLOOD_REQUEST",
      title: "🩸 Urgent Blood Requirement: O+ in Pune",
      message: "An urgent URGENT requirement for O+ (RBC) was raised in Pune by Sassoon General Hospital. Check opportunities if you are available to assist.",
      relatedEntityType: "BLOOD_REQUEST",
      relatedEntityId: req1.id,
    },
  });

  await prisma.notification.create({
    data: {
      userId: donorUser1.id,
      type: "VERIFICATION",
      title: "✅ Voluntary Donor Profile Verified!",
      message: "Congratulations! Your voluntary blood donor credentials have been verified by Indian Red Cross Society Blood Centre — Pune.",
      relatedEntityType: "VERIFICATION",
    },
  });

  // -------------------------------------------------------------
  // 12. PHASE 4: PRE-SEED CAMPAIGNS & ESCALATIONS
  // -------------------------------------------------------------
  console.log("📢 Seeding mobilization campaigns and emergency escalations...");

  const campaign1 = await prisma.mobilizationCampaign.create({
    data: {
      title: "Urgent O- Rare Blood Group Drive — Pune",
      description: "District-wide voluntary mobilization to build contingency buffers for emergency trauma surgeries.",
      bloodGroup: "O_NEGATIVE",
      componentType: "WHOLE_BLOOD",
      state: "Maharashtra",
      district: "Pune",
      targetDonorsCount: 40,
      startDate: new Date(),
      endDate: getExpiry(7),
      status: "ACTIVE",
      createdBy: govUser.id,
    },
  });

  const oNegDonor = createdSyntheticDonors.find((d) => d.email === "aditya.verma@demo.in");
  if (oNegDonor) {
    await prisma.campaignDonorResponse.create({
      data: {
        campaignId: campaign1.id,
        donorId: oNegDonor.youthDonorProfile.id,
        status: "INTERESTED",
        notes: "Available for weekend donation drive at Red Cross.",
      },
    });
  }

  await prisma.emergencyEscalation.create({
    data: {
      requestId: req2.id,
      escalationLevel: "LEVEL_1_WARNING",
      reason: "Critical unfulfilled requirement past 2 hours without full allocation",
      triggeredBy: govUser.id,
      status: "ACTIVE",
    },
  });

  // -------------------------------------------------------------
  // 13. INITIALIZE PHASE 3 AI INTELLIGENCE PIPELINE
  // -------------------------------------------------------------
  console.log("🧠 Initializing and caching AI Intelligence Pipeline...");
  const aiSummary = await refreshAllAIIntelligence(adminUser.id);
  console.log(`🤖 AI Engine Initialized: ${aiSummary.forecastsGenerated} forecasts, ${aiSummary.shortageRisksCalculated} shortage risks (${aiSummary.executionTimeMs}ms)`);

  console.log("🎉 Phase 5 Database Seeding Completed Successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
