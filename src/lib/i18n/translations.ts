// Multilingual dictionary for YUVA-RAKT AI
// Supported languages: English (en), Hindi (hi), Marathi (mr), Telugu (te)

export type LanguageCode = "en" | "hi" | "mr" | "te";

export interface TranslationDictionary {
  brandName: string;
  tagline: string;
  badge: string;
  common: {
    dashboard: string;
    loading: string;
    pleaseWait: string;
    refresh: string;
    search: string;
    filter: string;
    actions: string;
    status: string;
    save: string;
    cancel: string;
    submit: string;
    confirm: string;
    close: string;
    back: string;
    next: string;
    create: string;
    track: string;
    accept: string;
    reject: string;
    viewDetails: string;
    noData: string;
    errorOccurred: string;
    success: string;
    active: string;
    units: string;
    district: string;
    state: string;
    bloodGroup: string;
    component: string;
    urgency: string;
    requiredBy: string;
    hospital: string;
    bloodBank: string;
    donor: string;
    ambulance: string;
  };
  nav: {
    home: string;
    login: string;
    register: string;
    dashboard: string;
    profile: string;
    privacy: string;
    logout: string;
    notifications: string;
    adminUsers: string;
    adminOrgs: string;
    adminAudit: string;
    hospitalRequests: string;
    bloodBankInventory: string;
    bloodBankRequests: string;
    bloodBankDonations: string;
    bloodBankVerifications: string;
    youthVerification: string;
    youthDonations: string;
    governmentDashboard: string;
    governmentForecast: string;
    governmentEmergency: string;
    campaigns: string;
    liveMap: string;
    fleetOperations: string;
  };
  statuses: Record<string, string>;
  urgencies: Record<string, string>;
  home: {
    heroTitlePrefix: string;
    heroTitleSuffix: string;
    heroTagline: string;
    joinButton: string;
    accessPortalButton: string;
    impactTitle: string;
    impactSubtitle: string;
    predictTitle: string;
    predictDesc: string;
    mobilizeTitle: string;
    mobilizeDesc: string;
    respondTitle: string;
    respondDesc: string;
    quoteText: string;
    medicalNoticeTitle: string;
    medicalNoticeText: string;
    pillarYouthTitle: string;
    pillarYouthDesc: string;
    pillarHospitalsTitle: string;
    pillarHospitalsDesc: string;
    pillarGovTitle: string;
    pillarGovDesc: string;
    footerText: string;
    verifiedPrototype: string;
  };
  government: {
    commandCenterTitle: string;
    commandCenterSubtitle: string;
    totalRequests: string;
    activeEmergencies: string;
    verifiedDonors: string;
    availableDonors: string;
    bloodCentresOnline: string;
    hospitalsConnected: string;
    nationalAvailableStock: string;
    criticalShortages: string;
    districtRiskOverview: string;
    highestShortageRisks: string;
    aiOperationalInsights: string;
    inspectWhy: string;
    runForecast: string;
    syncMap: string;
  };
  forecast: {
    title: string;
    subtitle: string;
    forecastHorizon: string;
    days7: string;
    days14: string;
    days30: string;
    predictedDemand: string;
    confidenceScore: string;
    shortageRiskLevel: string;
    contributingFactors: string;
    recommendedActions: string;
    refreshAnalysis: string;
    highRisk: string;
    mediumRisk: string;
    lowRisk: string;
    criticalShortage: string;
  };
  emergency: {
    radarTitle: string;
    radarSubtitle?: string;
    subtitle: string;
    activeEmergencyAlerts: string;
    mobilizeYouth: string;
    expandRadius: string;
    escalateLevel: string;
    autonomousDiscovery: string;
    nearestCompatibleBloodBank: string;
    assignedAmbulance: string;
    responseMetrics: string;
    avgResponseTime: string;
  };
  campaigns: {
    title: string;
    subtitle: string;
    launchCampaign: string;
    activeCampaigns: string;
    targetDonors: string;
    mobilizedDonors: string;
    joinCampaign: string;
    iCanHelp: string;
    endDate: string;
  };
  liveMap: {
    title: string;
    subtitle: string;
    tacticalCommandInspector: string;
    selectEntity: string;
    layerHeatmap: string;
    layerEmergencies: string;
    layerBloodCentres: string;
    layerAmbulances: string;
    speed: string;
    etaMinutes: string;
  };
  tracking: {
    title: string;
    subtitle: string;
    ambulanceOnTheWay: string;
    driverLocation: string;
    pickupAtBloodBank: string;
    bloodCollected: string;
    deliveringToHospital: string;
    arrivedAtHospital: string;
    deliveryCompleted: string;
    demoStepper: string;
    liveTelemetry: string;
    distanceRemaining: string;
    timeRemaining: string;
  };
  voice: {
    listening: string;
    speakNow: string;
    tapToSpeak: string;
    processing: string;
    notSupported: string;
    greeting: string;
    assistantTitle: string;
  };
  auth: {
    loginTitle: string;
    loginSubtitle: string;
    registerTitle: string;
    registerSubtitle: string;
    emailLabel: string;
    passwordLabel: string;
    confirmPasswordLabel: string;
    fullNameLabel: string;
    phoneLabel: string;
    roleLabel: string;
    stateLabel: string;
    districtLabel: string;
    cityLabel: string;
    bloodGroupLabel: string;
    preferredLanguageLabel: string;
    loginButton: string;
    registerButton: string;
    forgotPasswordLink: string;
    dontHaveAccount: string;
    alreadyHaveAccount: string;
  };
  disclaimers: {
    medicalEligibility: string;
    selfReportedBlood: string;
    aiDecisionSupport: string;
  };
}

export const translations: Record<LanguageCode, TranslationDictionary> = {
  en: {
    brandName: "YUVA-RAKT AI",
    tagline: "Predict the Need. Mobilize the Youth. Save Lives.",
    badge: "Government Hackathon Prototype",
    common: {
      dashboard: "Dashboard",
      loading: "Loading...",
      pleaseWait: "Please wait",
      refresh: "Refresh",
      search: "Search",
      filter: "Filter",
      actions: "Actions",
      status: "Status",
      save: "Save",
      cancel: "Cancel",
      submit: "Submit",
      confirm: "Confirm",
      close: "Close",
      back: "Back",
      next: "Next",
      create: "Create",
      track: "Track Delivery",
      accept: "Accept",
      reject: "Reject",
      viewDetails: "View Details",
      noData: "No data available",
      errorOccurred: "An error occurred",
      success: "Success",
      active: "Active",
      units: "Units",
      district: "District",
      state: "State",
      bloodGroup: "Blood Group",
      component: "Component",
      urgency: "Urgency",
      requiredBy: "Required By",
      hospital: "Hospital",
      bloodBank: "Blood Centre",
      donor: "Youth Donor",
      ambulance: "Ambulance",
    },
    nav: {
      home: "Home",
      login: "Sign In",
      register: "Register",
      dashboard: "Dashboard",
      profile: "My Profile",
      privacy: "Privacy Settings",
      logout: "Sign Out",
      notifications: "Notifications",
      adminUsers: "Users",
      adminOrgs: "Organizations",
      adminAudit: "Audit Logs",
      hospitalRequests: "Blood Requests",
      bloodBankInventory: "Blood Inventory",
      bloodBankRequests: "Hospital Requests",
      bloodBankDonations: "Record Donation",
      bloodBankVerifications: "Donor Verification",
      youthVerification: "Verification",
      youthDonations: "My Donations",
      governmentDashboard: "National Blood Intelligence",
      governmentForecast: "AI Demand Forecast",
      governmentEmergency: "Emergency Radar",
      campaigns: "Campaigns",
      liveMap: "Live Map",
      fleetOperations: "Fleet Operations",
    },
    statuses: {
      PENDING: "Pending",
      ACKNOWLEDGED: "Acknowledged",
      MATCHING: "Matching Donors",
      PARTIALLY_FULFILLED: "Partially Fulfilled",
      FULFILLED: "Fulfilled",
      CANCELLED: "Cancelled",
      AVAILABLE: "Available",
      UNAVAILABLE: "Unavailable",
      VERIFIED: "Verified",
      REJECTED: "Rejected",
      ASSIGNED: "Ambulance Assigned",
      ACCEPTED: "Mission Accepted",
      EN_ROUTE_TO_BLOOD_BANK: "En Route to Blood Centre",
      ARRIVED_AT_BLOOD_BANK: "Arrived at Blood Centre",
      BLOOD_COLLECTED: "Blood Unit Collected",
      EN_ROUTE_TO_HOSPITAL: "Delivering to Hospital",
      ARRIVED_AT_HOSPITAL: "Arrived at Hospital",
      DELIVERED: "Delivered to Clinical Staff",
      COMPLETED: "Completed",
      ACTIVE: "Active",
    },
    urgencies: {
      EMERGENCY: "Emergency (Immediate)",
      CRITICAL: "Critical (< 2 Hours)",
      URGENT: "Urgent (< 6 Hours)",
      ROUTINE: "Routine (24 Hours)",
    },
    home: {
      heroTitlePrefix: "🇮🇳 YUVA-RAKT AI",
      heroTitleSuffix: "National Youth Blood Intelligence & Emergency Response Network",
      heroTagline: "Predict the Need. Mobilize the Youth. Save Lives.",
      joinButton: "Join as Donor / Register Org",
      accessPortalButton: "Access Portal / Sign In",
      impactTitle: "National Impact Layer",
      impactSubtitle: "YUVA-RAKT AI End-to-End Coordination Model",
      predictTitle: "1. PREDICT",
      predictDesc: "Multi-horizon statistical forecasting across 8 blood groups and 4 components by district.",
      mobilizeTitle: "2. MOBILIZE",
      mobilizeDesc: "Intelligent candidate prioritization and instant consent-verified emergency youth mobilization.",
      respondTitle: "3. RESPOND",
      respondDesc: "8x4 inventory ledger, multi-batch allocation, and hospital emergency requisition fulfillment.",
      quoteText: "We don't wait for a blood shortage to happen. YUVA-RAKT AI predicts the risk, identifies where intervention is needed, and mobilizes verified young voluntary donors through authorized healthcare organizations.",
      medicalNoticeTitle: "Core Medical & Safety Principle:",
      medicalNoticeText: "Final blood-donation eligibility is determined by authorized medical and blood-bank personnel.",
      pillarYouthTitle: "Youth Voluntary Donors",
      pillarYouthDesc: "Verified digital donor profiles, voluntary availability toggles, emergency consent routing, and multilingual engagement across India.",
      pillarHospitalsTitle: "Hospitals & Blood Banks",
      pillarHospitalsDesc: "Authorized clinical facility onboarding, license verification by Super Admins, and readiness for real-time requisition workflows.",
      pillarGovTitle: "Public Health Governance",
      pillarGovDesc: "Role-based governance, immutable security audit logging, consent transparency, and multi-state administration.",
      footerText: "YUVA-RAKT AI • National Youth Blood Intelligence & Emergency Response Network",
      verifiedPrototype: "Government Hackathon Prototype • Phase 1–6 Verified",
    },
    government: {
      commandCenterTitle: "National Blood Intelligence Command Center",
      commandCenterSubtitle: "Real-time AI shortage forecasting, hospital emergency requisitions, and autonomous youth mobilization across India.",
      totalRequests: "Total Requisitions",
      activeEmergencies: "Active Emergencies",
      verifiedDonors: "Verified Donors",
      availableDonors: "Available Donors",
      bloodCentresOnline: "Blood Centres Online",
      hospitalsConnected: "Hospitals Connected",
      nationalAvailableStock: "National Available Stock",
      criticalShortages: "Critical District Shortages",
      districtRiskOverview: "District Shortage Risk Matrix",
      highestShortageRisks: "Highest Priority Shortage Risks",
      aiOperationalInsights: "AI Operational Intelligence & XAI Reasoning",
      inspectWhy: "Inspect Reasoning",
      runForecast: "Run AI Analysis",
      syncMap: "Sync Live Map",
    },
    forecast: {
      title: "AI Blood Demand & Shortage Risk Forecasting",
      subtitle: "Multi-horizon predictive demand models combining historical trends, clinical seasonality, and local demographics.",
      forecastHorizon: "Forecast Horizon",
      days7: "7-Day Short Term",
      days14: "14-Day Tactical",
      days30: "30-Day Strategic",
      predictedDemand: "Predicted Demand",
      confidenceScore: "Confidence Score",
      shortageRiskLevel: "Shortage Risk Level",
      contributingFactors: "Contributing Risk Factors",
      recommendedActions: "AI Recommended Action",
      refreshAnalysis: "Refresh AI Demand Model",
      highRisk: "High Shortage Risk",
      mediumRisk: "Moderate Risk",
      lowRisk: "Adequate Stock",
      criticalShortage: "CRITICAL SHORTAGE RISK",
    },
    emergency: {
      radarTitle: "National Emergency Mobilization Radar",
      subtitle: "Autonomous multi-echelon resource discovery, donor escalation, and real-time transit coordination.",
      activeEmergencyAlerts: "Active Emergency Requisitions",
      mobilizeYouth: "Mobilize Youth Donors",
      expandRadius: "Expand Radius (+25km)",
      escalateLevel: "Escalate Urgency Level",
      autonomousDiscovery: "Autonomous Resource Discovery",
      nearestCompatibleBloodBank: "Nearest Compatible Blood Centre",
      assignedAmbulance: "Assigned Emergency Transport",
      responseMetrics: "Emergency Response Metrics",
      avgResponseTime: "Avg Time to First Response",
    },
    campaigns: {
      title: "Targeted Youth Mobilization Campaigns",
      subtitle: "Geo-targeted voluntary donor drives triggered autonomously by AI shortage forecasts.",
      launchCampaign: "Launch Mobilization Campaign",
      activeCampaigns: "Active Donor Campaigns",
      targetDonors: "Target Donors",
      mobilizedDonors: "Mobilized Donors",
      joinCampaign: "Join Campaign",
      iCanHelp: "I Can Help (Donate)",
      endDate: "Target End Date",
    },
    liveMap: {
      title: "National Live Blood Intelligence Map",
      subtitle: "Real-time geospatial visualization of predictive shortages, active hospital emergencies, blood inventories, and live ambulance missions.",
      tacticalCommandInspector: "TACTICAL COMMAND INSPECTOR",
      selectEntity: "Select any tactical marker on the map to inspect live AI recommendations and command actions.",
      layerHeatmap: "Shortage Heatmap",
      layerEmergencies: "Hospital Emergencies",
      layerBloodCentres: "Blood Centres",
      layerAmbulances: "Ambulances & Routes",
      speed: "Speed",
      etaMinutes: "ETA (Minutes)",
    },
    tracking: {
      title: "Live Emergency Blood Transport Tracking",
      subtitle: "Zomato/Uber-style real-time GPS telemetry, stage-aware routing, and clinical delivery status.",
      ambulanceOnTheWay: "Emergency Ambulance En Route",
      driverLocation: "Live GPS Telemetry Active",
      pickupAtBloodBank: "1. Blood Centre Pickup",
      bloodCollected: "2. Blood Units Collected & Secured",
      deliveringToHospital: "3. Direct Transit to Emergency Hospital",
      arrivedAtHospital: "4. Arrived at Hospital Casualty",
      deliveryCompleted: "5. Clinical Handover Complete",
      demoStepper: "Hackathon Judge Mission Stepper",
      liveTelemetry: "LIVE GPS STREAMING",
      distanceRemaining: "Distance Remaining",
      timeRemaining: "Estimated Time",
    },
    voice: {
      listening: "Listening for emergency voice command...",
      speakNow: "Speak now (e.g., 'Check shortage in Pune' or 'Open Emergency Radar')",
      tapToSpeak: "Voice Command Assistant",
      processing: "Processing voice command...",
      notSupported: "Speech recognition is not supported in this browser.",
      greeting: "YUVA-RAKT AI Voice Assistant Active. How can I help you?",
      assistantTitle: "AI Voice Command Assistant",
    },
    auth: {
      loginTitle: "Sign in to your account",
      loginSubtitle: "Access your national blood response portal",
      registerTitle: "Create your account",
      registerSubtitle: "Join India's unified youth blood intelligence network",
      emailLabel: "Email Address",
      passwordLabel: "Password",
      confirmPasswordLabel: "Confirm Password",
      fullNameLabel: "Full Name",
      phoneLabel: "Mobile Number (10 Digits)",
      roleLabel: "Register As",
      stateLabel: "State / UT",
      districtLabel: "District",
      cityLabel: "City / Town",
      bloodGroupLabel: "Blood Group",
      preferredLanguageLabel: "Preferred Communication Language",
      loginButton: "Sign In",
      registerButton: "Complete Registration",
      forgotPasswordLink: "Forgot Password?",
      dontHaveAccount: "Don't have an account?",
      alreadyHaveAccount: "Already registered?",
    },
    disclaimers: {
      medicalEligibility: "Final blood-donation eligibility is determined by authorized medical and blood-bank personnel.",
      selfReportedBlood: "Self-reported — verification pending",
      aiDecisionSupport: "AI Intelligence & Shortage Predictions are operational decision-support models and do not replace clinical determinations.",
    },
  },
  hi: {
    brandName: "युवा-रक्त एआई",
    tagline: "ज़रूरत का पूर्वानुमान। युवाओं का आह्वान। जीवन रक्षा।",
    badge: "सरकारी हैकथॉन प्रोटोटाइप",
    common: {
      dashboard: "डैशबोर्ड",
      loading: "लोड हो रहा है...",
      pleaseWait: "कृपया प्रतीक्षा करें",
      refresh: "रिफ्रेश करें",
      search: "खोजें",
      filter: "फ़िल्टर",
      actions: "कार्रवाई",
      status: "स्थिति",
      save: "सुरक्षित करें",
      cancel: "रद्द करें",
      submit: "जमा करें",
      confirm: "पुष्टि करें",
      close: "बंद करें",
      back: "पीछे जाएं",
      next: "आगे",
      create: "नया बनाएं",
      track: "डिलीवरी ट्रैक करें",
      accept: "स्वीकार करें",
      reject: "अस्वीकार करें",
      viewDetails: "विवरण देखें",
      noData: "कोई डेटा उपलब्ध नहीं है",
      errorOccurred: "त्रुटि हुई",
      success: "सफलता",
      active: "सक्रिय",
      units: "यूनिट्स",
      district: "ज़िला",
      state: "राज्य",
      bloodGroup: "रक्त समूह",
      component: "घटक (Component)",
      urgency: "अत्यावश्यकता",
      requiredBy: "आवश्यकता समय",
      hospital: "अस्पताल",
      bloodBank: "ब्लड सेंटर",
      donor: "युवा रक्तदाता",
      ambulance: "एम्बुलेंस",
    },
    nav: {
      home: "मुख्य पृष्ठ",
      login: "लॉग इन",
      register: "पंजीकरण",
      dashboard: "डैशबोर्ड",
      profile: "मेरी प्रोफ़ाइल",
      privacy: "गोपनीयता सेटिंग्स",
      logout: "लॉग आउट",
      notifications: "सूचनाएं",
      adminUsers: "उपयोगकर्ता",
      adminOrgs: "संगठन",
      adminAudit: "ऑडिट लॉग्स",
      hospitalRequests: "रक्त अनुरोध",
      bloodBankInventory: "रक्त इन्वेंटरी",
      bloodBankRequests: "अस्पताल अनुरोध",
      bloodBankDonations: "रक्तदान दर्ज करें",
      bloodBankVerifications: "दाता सत्यापन",
      youthVerification: "सत्यापन",
      youthDonations: "मेरे रक्तदान",
      governmentDashboard: "राष्ट्रीय रक्त बुद्धिमत्ता",
      governmentForecast: "एआई मांग पूर्वानुमान",
      governmentEmergency: "आपातकालीन रडार",
      campaigns: "अभियान",
      liveMap: "लाइव मैप",
      fleetOperations: "फ्लीट संचालन",
    },
    statuses: {
      PENDING: "प्रलंबित (Pending)",
      ACKNOWLEDGED: "स्वीकृत (Acknowledged)",
      MATCHING: "दाता मिलान जारी",
      PARTIALLY_FULFILLED: "आंशिक रूप से पूर्ण",
      FULFILLED: "पूर्ण रूप से आपूर्ति (Fulfilled)",
      CANCELLED: "रद्द किया गया",
      AVAILABLE: "उपलब्ध",
      UNAVAILABLE: "अनुपलब्ध",
      VERIFIED: "सत्यापित",
      REJECTED: "अस्वीकृत",
      ASSIGNED: "एम्बुलेंस आवंटित",
      ACCEPTED: "मिशन स्वीकृत",
      EN_ROUTE_TO_BLOOD_BANK: "ब्लड बैंक की ओर रवाना",
      ARRIVED_AT_BLOOD_BANK: "ब्लड बैंक पर आगमन",
      BLOOD_COLLECTED: "रक्त यूनिट्स प्राप्त",
      EN_ROUTE_TO_HOSPITAL: "अस्पताल की ओर रवाना",
      ARRIVED_AT_HOSPITAL: "अस्पताल में आगमन",
      DELIVERED: "चिकित्सा स्टाफ को सुपुर्द",
      COMPLETED: "मिशन पूर्ण",
      ACTIVE: "सक्रिय",
    },
    urgencies: {
      EMERGENCY: "अति-आपातकालीन (तत्काल)",
      CRITICAL: "गंभीर (< 2 घंटे)",
      URGENT: "आवश्यक (< 6 घंटे)",
      ROUTINE: "सामान्य (24 घंटे)",
    },
    home: {
      heroTitlePrefix: "🇮🇳 युवा-रक्त एआई",
      heroTitleSuffix: "राष्ट्रीय युवा रक्त बुद्धिमत्ता एवं आपातकालीन प्रतिक्रिया नेटवर्क",
      heroTagline: "ज़रूरत का पूर्वानुमान। युवाओं का आह्वान। जीवन रक्षा।",
      joinButton: "रक्तदाता बनें / संस्था पंजीकृत करें",
      accessPortalButton: "पोर्टल लॉगिन / प्रवेश",
      impactTitle: "राष्ट्रीय प्रभाव स्तर",
      impactSubtitle: "युवा-रक्त एआई एंड-टू-एंड समन्वय प्रणाली",
      predictTitle: "1. पूर्वानुमान (PREDICT)",
      predictDesc: "ज़िला स्तर पर 8 रक्त समूहों और 4 घटकों का बहु-अवधि एआई सांख्यिकीय पूर्वानुमान।",
      mobilizeTitle: "2. एकजुटता (MOBILIZE)",
      mobilizeDesc: "सत्यापित युवा नेटवर्क की त्वरित आपातकालीन सहमति और प्राथमिकता-आधारित लामबंदी।",
      respondTitle: "3. प्रतिक्रिया (RESPOND)",
      respondDesc: "8x4 इन्वेंटरी बहीखाता, मल्टी-बैच आवंटन, और अस्पताल आपातकालीन रक्त आपूर्ति।",
      quoteText: "हम रक्त की कमी होने का इंतज़ार नहीं करते। युवा-रक्त एआई पहले से जोखिम का अनुमान लगाता है और अधिकृत स्वास्थ्य संगठनों के माध्यम से सत्यापित युवा रक्तदाताओं को एकजुट करता है।",
      medicalNoticeTitle: "मुख्य चिकित्सा एवं सुरक्षा सिद्धांत:",
      medicalNoticeText: "रक्तदान की अंतिम पात्रता अधिकृत चिकित्सा एवं ब्लड बैंक कर्मियों द्वारा निर्धारित की जाती है।",
      pillarYouthTitle: "युवा स्वैच्छिक रक्तदाता",
      pillarYouthDesc: "सत्यापित डिजिटल प्रोफाइल, स्वैच्छिक उपलब्धता टॉगल, आपातकालीन सहमति और भारत भर में बहुभाषी जुड़ाव।",
      pillarHospitalsTitle: "अस्पताल एवं ब्लड बैंक",
      pillarHospitalsDesc: "अधिकृत चिकित्सा सुविधा ऑनबोर्डिंग, लाइसेंस सत्यापन, और त्वरित डिजिटल रक्त मांग प्रबंधन।",
      pillarGovTitle: "लोक स्वास्थ्य शासन",
      pillarGovDesc: "भूमिका-आधारित नियंत्रण, अपरिवर्तनीय ऑडिट लॉग्स, सहमति पारदर्शिता और राष्ट्रीय स्तर की निगरानी।",
      footerText: "युवा-रक्त एआई • राष्ट्रीय युवा रक्त बुद्धिमत्ता एवं आपातकालीन प्रतिक्रिया नेटवर्क",
      verifiedPrototype: "सरकारी हैकथॉन प्रोटोटाइप • चरण 1-6 सत्यापित",
    },
    government: {
      commandCenterTitle: "राष्ट्रीय रक्त बुद्धिमत्ता कमांड सेंटर",
      commandCenterSubtitle: "रियल-टाइम एआई रक्त कमी पूर्वानुमान, अस्पताल आपातकालीन मांग और स्वायत्त युवा लामबंदी।",
      totalRequests: "कुल रक्त मांग",
      activeEmergencies: "सक्रिय आपात स्थिति",
      verifiedDonors: "सत्यापित रक्तदाता",
      availableDonors: "उपलब्ध रक्तदाता",
      bloodCentresOnline: "ऑनलाइन ब्लड सेंटर्स",
      hospitalsConnected: "संबद्ध अस्पताल",
      nationalAvailableStock: "राष्ट्रीय उपलब्ध स्टॉक",
      criticalShortages: "गंभीर ज़िला रक्त कमी",
      districtRiskOverview: "ज़िलावार जोखिम विश्लेषण",
      highestShortageRisks: "सर्वोच्च प्राथमिकता वाले जोखिम",
      aiOperationalInsights: "एआई परिचालन अंतर्दृष्टि एवं कारण (XAI)",
      inspectWhy: "तर्क देखें",
      runForecast: "एआई विश्लेषण चलाएं",
      syncMap: "लाइव मैप सिंक करें",
    },
    forecast: {
      title: "एआई रक्त मांग एवं कमी जोखिम पूर्वानुमान",
      subtitle: "ऐतिहासिक रुझानों, मौसमी बीमारियों और जनसांख्यिकी पर आधारित बहु-अवधि मांग मॉडल।",
      forecastHorizon: "पूर्वानुमान अवधि",
      days7: "7-दिवसीय अल्पकालिक",
      days14: "14-दिवसीय मध्यम",
      days30: "30-दिवसीय रणनीतिक",
      predictedDemand: "अनुमानित मांग",
      confidenceScore: "सटीकता विश्वास स्कोर",
      shortageRiskLevel: "कमी जोखिम स्तर",
      contributingFactors: "जोखिम के कारक",
      recommendedActions: "एआई अनुशंसित कार्रवाई",
      refreshAnalysis: "एआई मॉडल रीफ्रेश करें",
      highRisk: "उच्च कमी जोखिम",
      mediumRisk: "मध्यम जोखिम",
      lowRisk: "पर्याप्त स्टॉक",
      criticalShortage: "अत्यधिक गंभीर कमी जोखिम",
    },
    emergency: {
      radarTitle: "राष्ट्रीय आपातकालीन लामबंदी रडार",
      subtitle: "स्वायत्त संसाधन खोज, युवा दाता अलर्ट और रियल-टाइम एम्बुलेंस समन्वय।",
      activeEmergencyAlerts: "सक्रिय आपातकालीन मांग",
      mobilizeYouth: "युवा दाताओं को लामबंद करें",
      expandRadius: "दायरा बढ़ाएं (+25 किमी)",
      escalateLevel: "अत्यावश्यकता स्तर बढ़ाएं",
      autonomousDiscovery: "स्वायत्त संसाधन खोज",
      nearestCompatibleBloodBank: "निकटतम संगत ब्लड सेंटर",
      assignedAmbulance: "आवंटित आपातकालीन वाहन",
      responseMetrics: "आपातकालीन प्रतिक्रिया मेट्रिक्स",
      avgResponseTime: "औसत प्रतिक्रिया समय",
    },
    campaigns: {
      title: "लक्षित युवा रक्तदान अभियान",
      subtitle: "एआई कमी पूर्वानुमानों द्वारा संचालित क्षेत्र-विशिष्ट स्वैच्छिक रक्तदान अभियान।",
      launchCampaign: "अभियान शुरू करें",
      activeCampaigns: "सक्रिय रक्तदान अभियान",
      targetDonors: "लक्षित दाता",
      mobilizedDonors: "लामबंद दाता",
      joinCampaign: "अभियान में जुड़ें",
      iCanHelp: "मैं रक्तदान कर सकता हूँ",
      endDate: "समाप्ति तिथि",
    },
    liveMap: {
      title: "राष्ट्रीय लाइव रक्त बुद्धिमत्ता मानचित्र",
      subtitle: "संभावित रक्त कमी, अस्पताल आपात स्थिति, स्टॉक और एम्बुलेंस का वास्तविक समय भू-स्थानिक दृश्य।",
      tacticalCommandInspector: "कमांड निरीक्षण पैनल",
      selectEntity: "लाइव एआई सुझाव और कार्रवाई देखने के लिए मानचित्र पर किसी भी मार्कर का चयन करें।",
      layerHeatmap: "कमी हीटमैप",
      layerEmergencies: "अस्पताल आपात स्थिति",
      layerBloodCentres: "ब्लड सेंटर्स",
      layerAmbulances: "एम्बुलेंस एवं मार्ग",
      speed: "गति",
      etaMinutes: "अनुमानित समय (मिनट)",
    },
    tracking: {
      title: "लाइव आपातकालीन रक्त परिवहन ट्रैकिंग",
      subtitle: "ज़ोमैटो/उबर शैली लाइव जीपीएस टेलीमेट्री, रूट नेविगेशन एवं डिलीवरी स्थिति।",
      ambulanceOnTheWay: "आपातकालीन एम्बुलेंस मार्ग में है",
      driverLocation: "लाइव जीपीएस सक्रिय",
      pickupAtBloodBank: "1. ब्लड सेंटर से रक्त संग्रहण",
      bloodCollected: "2. रक्त यूनिट्स प्राप्त एवं सुरक्षित",
      deliveringToHospital: "3. अस्पताल की ओर सीधा प्रस्थान",
      arrivedAtHospital: "4. अस्पताल इमरजेंसी में आगमन",
      deliveryCompleted: "5. चिकित्सा स्टाफ को सुपुर्दगी पूर्ण",
      demoStepper: "हैकथॉन जज सिमुलेटर",
      liveTelemetry: "लाइव जीपीएस स्ट्रीमिंग",
      distanceRemaining: "शेष दूरी",
      timeRemaining: "अनुमानित समय",
    },
    voice: {
      listening: "आपातकालीन वॉयस कमांड सुन रहे हैं...",
      speakNow: "अब बोलें (जैसे: 'पुणे में रक्त की कमी जांचें' या 'इमरजेंसी रडार खोलो')",
      tapToSpeak: "वॉयस कमांड सहायक",
      processing: "वॉयस कमांड पर काम हो रहा है...",
      notSupported: "इस ब्राउज़र में स्पीच रिकग्निशन समर्थित नहीं है।",
      greeting: "युवा-रक्त एआई वॉयस असिस्टेंट सक्रिय है। मैं आपकी क्या मदद कर सकता हूँ?",
      assistantTitle: "एआई वॉयस कमांड सहायक",
    },
    auth: {
      loginTitle: "अपने खाते में लॉग इन करें",
      loginSubtitle: "राष्ट्रीय रक्त प्रतिक्रिया पोर्टल तक पहुँचें",
      registerTitle: "नया खाता बनाएं",
      registerSubtitle: "भारत के एकीकृत युवा रक्त नेटवर्क से जुड़ें",
      emailLabel: "ईमेल पता",
      passwordLabel: "पासवर्ड",
      confirmPasswordLabel: "पासवर्ड की पुष्टि करें",
      fullNameLabel: "पूरा नाम",
      phoneLabel: "मोबाइल नंबर (10 अंक)",
      roleLabel: "पंजीकरण भूमिका",
      stateLabel: "राज्य / केंद्र शासित प्रदेश",
      districtLabel: "ज़िला",
      cityLabel: "शहर / नगर",
      bloodGroupLabel: "रक्त समूह (Blood Group)",
      preferredLanguageLabel: "पसंदीदा भाषा",
      loginButton: "लॉग इन करें",
      registerButton: "पंजीकरण पूरा करें",
      forgotPasswordLink: "पासवर्ड भूल गए?",
      dontHaveAccount: "खाता नहीं है?",
      alreadyHaveAccount: "पहले से पंजीकृत हैं?",
    },
    disclaimers: {
      medicalEligibility: "रक्तदान की अंतिम पात्रता अधिकृत चिकित्सा एवं ब्लड बैंक कर्मियों द्वारा निर्धारित की जाती है।",
      selfReportedBlood: "स्व-सूचित — सत्यापन प्रक्रियाधीन",
      aiDecisionSupport: "एआई पूर्वानुमान और कमी की भविष्यवाणियां परिचालन निर्णय-समर्थन मॉडल हैं और नैदानिक निर्णयों की जगह नहीं लेते हैं।",
    },
  },
  mr: {
    brandName: "युवा-रक्त एआय",
    tagline: "गरजेचा अंदाज. तरुणांची एकजूट. जीव वाचवा.",
    badge: "सरकारी हॅकाथॉन प्रोटोटाइप",
    common: {
      dashboard: "डॅशबोर्ड",
      loading: "लोड होत आहे...",
      pleaseWait: "कृपया प्रतीक्षा करा",
      refresh: "ताजे करा",
      search: "शोधा",
      filter: "फिल्टर",
      actions: "कृती",
      status: "स्थिती",
      save: "जतन करा",
      cancel: "रद्द करा",
      submit: "सबमिट करा",
      confirm: "पुष्टी करा",
      close: "बंद करा",
      back: "मागे",
      next: "पुढे",
      create: "नवीन तयार करा",
      track: "डिलिव्हरी ट्रॅक करा",
      accept: "स्वीकारा",
      reject: "नाकारा",
      viewDetails: "तपशील पहा",
      noData: "माहिती उपलब्ध नाही",
      errorOccurred: "त्रुटी आढळली",
      success: "यशस्वी",
      active: "सक्रिय",
      units: "युनिट्स",
      district: "जिल्हा",
      state: "राज्य",
      bloodGroup: "रक्तगट",
      component: "घटक (Component)",
      urgency: "तातडीची पातळी",
      requiredBy: "आवश्यक वेळ",
      hospital: "रुग्णालय (Hospital)",
      bloodBank: "रक्तपेढी (Blood Bank)",
      donor: "युवा रक्तदाता",
      ambulance: "रुग्णवाहिका (Ambulance)",
    },
    nav: {
      home: "मुख्यपृष्ठ",
      login: "लॉगिन",
      register: "नोंदणी",
      dashboard: "डॅशबोर्ड",
      profile: "माझी प्रोफाईल",
      privacy: "गोपनीयता सेटिंग्ज",
      logout: "लॉगआउट",
      notifications: "सूचना",
      adminUsers: "वापरकर्ते",
      adminOrgs: "संस्था",
      adminAudit: "ऑडिट नोंदी",
      hospitalRequests: "रक्त विनंत्या",
      bloodBankInventory: "रक्त साठा (Inventory)",
      bloodBankRequests: "हॉस्पिटल विनंत्या",
      bloodBankDonations: "रक्तदान नोंद",
      bloodBankVerifications: "रक्तदाते पडताळणी",
      youthVerification: "पडताळणी",
      youthDonations: "माझे रक्तदान",
      governmentDashboard: "राष्ट्रीय रक्त गुप्तचर माहिती",
      governmentForecast: "एआय मागणी अंदाज",
      governmentEmergency: "आपत्कालीन रडार",
      campaigns: "रक्तदान मोहिमा",
      liveMap: "थेट नकाशा (Live Map)",
      fleetOperations: "वाहन संचालन",
    },
    statuses: {
      PENDING: "प्रलंबित (Pending)",
      ACKNOWLEDGED: "मान्य केले (Acknowledged)",
      MATCHING: "दाते शोधत आहे",
      PARTIALLY_FULFILLED: "अंशतः पूर्ण",
      FULFILLED: "पूर्ण पुरवठा (Fulfilled)",
      CANCELLED: "रद्द केले",
      AVAILABLE: "उपलब्ध",
      UNAVAILABLE: "अनुपलब्ध",
      VERIFIED: "पडताळणी पूर्ण",
      REJECTED: "नाकारले",
      ASSIGNED: "रुग्णवाहिका नेमली",
      ACCEPTED: "मोहीम स्वीकारली",
      EN_ROUTE_TO_BLOOD_BANK: "रक्तपेढीकडे रवाना",
      ARRIVED_AT_BLOOD_BANK: "रक्तपेढीत आगमन",
      BLOOD_COLLECTED: "रक्त युनिट्स प्राप्त",
      EN_ROUTE_TO_HOSPITAL: "रुग्णालयाकडे रवाना",
      ARRIVED_AT_HOSPITAL: "रुग्णालयात आगमन",
      DELIVERED: "डॉक्टरांकडे सुपूर्द",
      COMPLETED: "मोहीम पूर्ण",
      ACTIVE: "सक्रिय",
    },
    urgencies: {
      EMERGENCY: "अति-तातडीचे (Emergency)",
      CRITICAL: "गंभीर (< २ तास)",
      URGENT: "तातडीचे (< ६ तास)",
      ROUTINE: "नियमित (२४ तास)",
    },
    home: {
      heroTitlePrefix: "🇮🇳 युवा-रक्त एआय",
      heroTitleSuffix: "राष्ट्रीय युवा रक्त गुप्तचर आणि आपत्कालीन प्रतिसाद नेटवर्क",
      heroTagline: "गरजेचा अंदाज. तरुणांची एकजूट. जीव वाचवा.",
      joinButton: "रक्तदाता बना / संस्था नोंदणी करा",
      accessPortalButton: "पोर्टल लॉगिन / प्रवेश",
      impactTitle: "राष्ट्रीय प्रभाव स्तर",
      impactSubtitle: "युवा-रक्त एआय संपूर्ण समन्वय मॉडेल",
      predictTitle: "१. अंदाज (PREDICT)",
      predictDesc: "जिल्हा पातळीवर ८ रक्तगट आणि ४ घटकांचा एआय सांख्यिकीय मागणी अंदाज.",
      mobilizeTitle: "२. एकजूट (MOBILIZE)",
      mobilizeDesc: "पडताळणी झालेल्या तरुण रक्तदात्यांची त्वरित आपत्कालीन संमती आणि लामबंदी.",
      respondTitle: "३. पुरवठा (RESPOND)",
      respondDesc: "८x४ साठा वही, मल्टी-बॅच वाटप, आणि रुग्णालयांच्या तातडीच्या गरजांची पूर्तता.",
      quoteText: "आम्ही रक्ताचा तुटवडा होण्याची वाट पाहत नाही. युवा-रक्त एआय आधीच धोक्याचा अंदाज घेते आणि अधिकृत आरोग्य संस्थांद्वारे पडताळणी झालेल्या तरुण रक्तदात्यांना एकत्र आणते.",
      medicalNoticeTitle: "वैद्यकीय आणि सुरक्षा नियम:",
      medicalNoticeText: "रक्तदानाची अंतिम पात्रता अधिकृत वैद्यकीय आणि रक्तपेढीच्या कर्मचाऱ्यांद्वारे निश्चित केली जाते.",
      pillarYouthTitle: "तरुण स्वैच्छिक रक्तदाते",
      pillarYouthDesc: "पडताळणी झालेली डिजिटल प्रोफाईल, उपलब्धता टॉगल आणि देशभरात बहुभाषिक सहभाग.",
      pillarHospitalsTitle: "रुग्णालये आणि रक्तपेढ्या",
      pillarHospitalsDesc: "अधिकृत संस्थांची नोंदणी, परवाना पडताळणी आणि त्वरित डिजिटल रक्त मागणी व्यवस्थापन.",
      pillarGovTitle: "सार्वजनिक आरोग्य प्रशासन",
      pillarGovDesc: "भूमिका-आधारित नियंत्रण, सुरक्षित ऑडिट नोंदी, संमती पारदर्शकता आणि राज्यस्तरीय नियंत्रण.",
      footerText: "युवा-रक्त एआय • राष्ट्रीय युवा रक्त गुप्तचर आणि आपत्कालीन प्रतिसाद नेटवर्क",
      verifiedPrototype: "सरकारी हॅकाथॉन प्रोटोटाइप • टप्पे १-६ सत्यापित",
    },
    government: {
      commandCenterTitle: "राष्ट्रीय रक्त गुप्तचर नियंत्रण केंद्र",
      commandCenterSubtitle: "रिअल-टाइम एआय तुटवडा अंदाज, रुग्णालय आपत्कालीन मागण्या आणि स्वायत्त युवा एकजूट.",
      totalRequests: "एकूण मागण्या",
      activeEmergencies: "सक्रिय आणीबाणी",
      verifiedDonors: "पडताळलेले रक्तदाते",
      availableDonors: "उपलब्ध रक्तदाते",
      bloodCentresOnline: "सक्रिय रक्तपेढ्या",
      hospitalsConnected: "जोडलेली रुग्णालये",
      nationalAvailableStock: "राष्ट्रीय उपलब्ध साठा",
      criticalShortages: "गंभीर जिल्हा तुटवडे",
      districtRiskOverview: "जिल्हावार जोखीम तक्ता",
      highestShortageRisks: "सर्वोच्च प्राधान्याचे तुटवडे",
      aiOperationalInsights: "एआय विश्लेषण आणि स्पष्टीकरण (XAI)",
      inspectWhy: "तर्क पहा",
      runForecast: "एआय विश्लेषण चालवा",
      syncMap: "थेट नकाशा सिंक करा",
    },
    forecast: {
      title: "एआय रक्त मागणी आणि तुटवडा अंदाज",
      subtitle: "मागील नोंदी, ऋतू बदल आणि लोकसंख्येवर आधारित बहु-स्तरीय मागणी मॉडेल.",
      forecastHorizon: "अंदाज कालावधी",
      days7: "७-दिवसीय अल्पकालीन",
      days14: "१४-दिवसीय मध्यम",
      days30: "३०-दिवसीय धोरणात्मक",
      predictedDemand: "अपेक्षित मागणी",
      confidenceScore: "अचूकता विश्वास गुण",
      shortageRiskLevel: "तुटवडा जोखीम पातळी",
      contributingFactors: "कारणीभूत घटक",
      recommendedActions: "एआय सुचवलेली कृती",
      refreshAnalysis: "एआय मॉडेल ताजे करा",
      highRisk: "उच्च जोखीम",
      mediumRisk: "मध्यम जोखीम",
      lowRisk: "पुरेसा साठा",
      criticalShortage: "अति-गंभीर तुटवडा जोखीम",
    },
    emergency: {
      radarTitle: "राष्ट्रीय आपत्कालीन लामबंदी रडार",
      subtitle: "स्वायत्त साधनसंपत्ती शोध, रक्तदाते सूचना आणि थेट रुग्णवाहिका समन्वय.",
      activeEmergencyAlerts: "सक्रिय आपत्कालीन मागण्या",
      mobilizeYouth: "तरुण रक्तदात्यांना संदेश पाठवा",
      expandRadius: "परिमिती वाढवा (+२५ किमी)",
      escalateLevel: "तातडीची पातळी वाढवा",
      autonomousDiscovery: "स्वायत्त साधन शोध",
      nearestCompatibleBloodBank: "जवळची सुसंगत रक्तपेढी",
      assignedAmbulance: "नेमलेली रुग्णवाहिका",
      responseMetrics: "प्रतिसाद मेट्रिक्स",
      avgResponseTime: "सरासरी प्रतिसाद वेळ",
    },
    campaigns: {
      title: "लक्षित युवा रक्तदान मोहिमा",
      subtitle: "एआय तुटवडा अंदाजानुसार स्वयंचलितपणे सुरू झालेल्या रक्तदान मोहिमा.",
      launchCampaign: "नवीन मोहीम सुरू करा",
      activeCampaigns: "सक्रिय रक्तदान मोहिमा",
      targetDonors: "अपेक्षित दाते",
      mobilizedDonors: "सहभागी दाते",
      joinCampaign: "मोहिमेत सामील व्हा",
      iCanHelp: "मी रक्तदान करू शकतो",
      endDate: "शेवटची तारीख",
    },
    liveMap: {
      title: "राष्ट्रीय थेट रक्त गुप्तचर नकाशा",
      subtitle: "संभाव्य तुटवडा, रुग्णालयातील आणीबाणी, साठा आणि रुग्णवाहिकांचे थेट भौगोलिक दृश्य.",
      tacticalCommandInspector: "कमांड तपासणी पॅनेल",
      selectEntity: "थेट एआय शिफारसी आणि कृती पाहण्यासाठी नकाशावरील कोणत्याही चिन्हावर क्लिक करा.",
      layerHeatmap: "तुटवडा हीटमॅप",
      layerEmergencies: "रुग्णालय आणीबाणी",
      layerBloodCentres: "रक्तपेढ्या",
      layerAmbulances: "रुग्णवाहिका आणि मार्ग",
      speed: "वेग",
      etaMinutes: "अपेक्षित वेळ (मिनिटे)",
    },
    tracking: {
      title: "थेट आपत्कालीन रक्त वाहतूक ट्रॅकिंग",
      subtitle: "झोमॅटो/उबर प्रमाणे रिअल-टाइम जीपीएस टेलिमेट्री आणि डिलिव्हरी स्थिती.",
      ambulanceOnTheWay: "रुग्णवाहिका मार्गावर आहे",
      driverLocation: "थेट जीपीएस ट्रॅकिंग सक्रिय",
      pickupAtBloodBank: "१. रक्तपेढीतून रक्त संकलन",
      bloodCollected: "२. रक्त युनिट्स सुरक्षित ताब्यात",
      deliveringToHospital: "३. रुग्णालयाकडे थेट प्रवास",
      arrivedAtHospital: "४. रुग्णालय कॅज्युअल्टीमध्ये आगमन",
      deliveryCompleted: "५. वैद्यकीय कर्मचाऱ्यांकडे सुपूर्द पूर्ण",
      demoStepper: "हॅकाथॉन जज सिम्युलेटर",
      liveTelemetry: "थेट जीपीएस प्रवाह",
      distanceRemaining: "उर्वरित अंतर",
      timeRemaining: "अपेक्षित वेळ",
    },
    voice: {
      listening: "आपत्कालीन व्हॉइस कमांड ऐकत आहे...",
      speakNow: "आता बोला (उदा: 'पुण्यात रक्ताचा तुटवडा तपासा' किंवा 'इमर्जन्सी रडार उघडा')",
      tapToSpeak: "व्हॉइस कमांड सहाय्यक",
      processing: "व्हॉइस कमांडवर प्रक्रिया सुरू आहे...",
      notSupported: "या ब्राउझरमध्ये स्पीच रेकग्निशन समर्थित नाही.",
      greeting: "युवा-रक्त एआय व्हॉइस असिस्टंट सक्रिय आहे. मी तुम्हाला कशी मदत करू?",
      assistantTitle: "एआय व्हॉइस कमांड सहाय्यक",
    },
    auth: {
      loginTitle: "आपल्या खात्यात लॉगिन करा",
      loginSubtitle: "राष्ट्रीय रक्त प्रतिसाद पोर्टलवर प्रवेश करा",
      registerTitle: "नवीन खाते तयार करा",
      registerSubtitle: "भारताच्या युवा रक्त नेटवर्कमध्ये सामील व्हा",
      emailLabel: "ईमेल पत्ता",
      passwordLabel: "पासवर्ड",
      confirmPasswordLabel: "पासवर्ड पुष्टी करा",
      fullNameLabel: "पूर्ण नाव",
      phoneLabel: "मोबाईल क्रमांक (१० अंक)",
      roleLabel: "नोंदणी भूमिका",
      stateLabel: "राज्य",
      districtLabel: "जिल्हा",
      cityLabel: "शहर",
      bloodGroupLabel: "रक्तगट (Blood Group)",
      preferredLanguageLabel: "संवादाची भाषा",
      loginButton: "लॉगिन करा",
      registerButton: "नोंदणी पूर्ण करा",
      forgotPasswordLink: "पासवर्ड विसरलात?",
      dontHaveAccount: "खाते नाही का?",
      alreadyHaveAccount: "आधीच नोंदणी केली आहे?",
    },
    disclaimers: {
      medicalEligibility: "रक्तदानाची अंतिम पात्रता अधिकृत वैद्यकीय आणि रक्तपेढीच्या कर्मचाऱ्यांद्वारे निश्चित केली जाते.",
      selfReportedBlood: "स्वतः घोषित — पडताळणी प्रलंबित",
      aiDecisionSupport: "एआय अंदाज आणि तुटवड्याची भाकिते ही केवळ निर्णय-सहायी मॉडेल आहेत आणि ती वैद्यकीय निर्णयांची जागा घेत नाहीत.",
    },
  },
  te: {
    brandName: "యువ-రక్త్ AI",
    tagline: "అవసరాన్ని అంచనా వేయండి. యువతను సమీకరించండి. ప్రాణాలను కాపాడండి.",
    badge: "ప్రభుత్వ హ్యాకథాన్ ప్రోటోటైప్",
    common: {
      dashboard: "డ్యాష్‌బోర్డ్",
      loading: "లోడ్ అవుతోంది...",
      pleaseWait: "దయచేసి వేచి ఉండండి",
      refresh: "రిఫ్రెష్ చేయండి",
      search: "శోధించండి",
      filter: "ఫిల్టర్",
      actions: "చర్యలు",
      status: "స్థితి",
      save: "భద్రపరచు",
      cancel: "రద్దు చేయి",
      submit: "సమర్పించు",
      confirm: "ధృవీకరించు",
      close: "మూసివేయి",
      back: "వెనుకకు",
      next: "తరువాత",
      create: "సృష్టించు",
      track: "డెలివరీ ట్రాక్ చేయండి",
      accept: "అంగీకరించు",
      reject: "తిరస్కరించు",
      viewDetails: "వివరాలు చూడండి",
      noData: "సమాచారం అందుబాటులో లేదు",
      errorOccurred: "లోపం సంభవించింది",
      success: "విజయం",
      active: "క్రియాశీలకం",
      units: "యూనిట్లు",
      district: "జిల్లా",
      state: "రాష్ట్రం",
      bloodGroup: "రక్త వర్గం",
      component: "రక్త భాగం (Component)",
      urgency: "అత్యవసర స్థాయి",
      requiredBy: "అవసరమైన సమయం",
      hospital: "ఆసుపత్రి",
      bloodBank: "బ్లడ్ సెంటర్",
      donor: "యువ రక్తదాత",
      ambulance: "అంబులెన్స్",
    },
    nav: {
      home: "హోమ్",
      login: "లాగిన్",
      register: "నమోదు",
      dashboard: "డ్యాష్‌బోర్డ్",
      profile: "నా ప్రొఫైల్",
      privacy: "గోప్యతా సెట్టింగ్‌లు",
      logout: "లాగ్అవుట్",
      notifications: "నోటిఫికేషన్లు",
      adminUsers: "వినియోగదారులు",
      adminOrgs: "సంస్థలు",
      adminAudit: "ఆడిట్ లాగ్స్",
      hospitalRequests: "రక్త అభ్యర్థనలు",
      bloodBankInventory: "రక్త నిల్వలు (Inventory)",
      bloodBankRequests: "హాస్పిటల్ అభ్యర్థనలు",
      bloodBankDonations: "రక్తదాన రికార్డ్",
      bloodBankVerifications: "దాతల ధృవీకరణ",
      youthVerification: "ధృవీకరణ",
      youthDonations: "నా రక్తదానాలు",
      governmentDashboard: "జాతీయ రక్త నిఘా",
      governmentForecast: "AI డిమాండ్ అంచనా",
      governmentEmergency: "అత్యవసర రాడార్",
      campaigns: "రక్తదాన ప్రచారాలు",
      liveMap: "లైవ్ మ్యాప్",
      fleetOperations: "ఫ్లీట్ ఆపరేషన్స్",
    },
    statuses: {
      PENDING: "పెండింగ్‌లో ఉంది (Pending)",
      ACKNOWLEDGED: "గుర్తించబడింది",
      MATCHING: "దాతల సరిపోలిక జరుగుతోంది",
      PARTIALLY_FULFILLED: "పాక్షికంగా నెరవేరింది",
      FULFILLED: "పూర్తిగా సరఫరా చేయబడింది",
      CANCELLED: "రద్దు చేయబడింది",
      AVAILABLE: "అందుబాటులో ఉంది",
      UNAVAILABLE: "అందుబాటులో లేదు",
      VERIFIED: "ధృవీకరించబడింది",
      REJECTED: "తిరస్కరించబడింది",
      ASSIGNED: "అంబులెన్స్ కేటాయించబడింది",
      ACCEPTED: "మిషన్ అంగీకరించబడింది",
      EN_ROUTE_TO_BLOOD_BANK: "బ్లడ్ బ్యాంక్‌కు బయలుదేరింది",
      ARRIVED_AT_BLOOD_BANK: "బ్లడ్ బ్యాంక్ చేరుకుంది",
      BLOOD_COLLECTED: "రక్త యూనిట్లు సేకరించబడ్డాయి",
      EN_ROUTE_TO_HOSPITAL: "ఆసుపత్రికి బయలుదేరింది",
      ARRIVED_AT_HOSPITAL: "ఆసుపత్రి చేరుకుంది",
      DELIVERED: "సిబ్బందికి అప్పగించబడింది",
      COMPLETED: "పూర్తయింది",
      ACTIVE: "క్రియాశీల",
    },
    urgencies: {
      EMERGENCY: "అత్యవసరం (తక్షణమే)",
      CRITICAL: "క్లిష్టమైనది (< 2 గంటలు)",
      URGENT: "అవసరమైనది (< 6 గంటలు)",
      ROUTINE: "సాధారణ (24 గంటలు)",
    },
    home: {
      heroTitlePrefix: "🇮🇳 యువ-రక్త్ AI",
      heroTitleSuffix: "జాతీయ యువ రక్త నిఘా మరియు అత్యవసర స్పందన నెట్‌వర్క్",
      heroTagline: "అవసరాన్ని అంచనా వేయండి. యువతను సమీకరించండి. ప్రాణాలను కాపాడండి.",
      joinButton: "రక్తదాతగా చేరండి / సంస్థను నమోదు చేయండి",
      accessPortalButton: "పోర్టల్ ప్రవేశం / లాగిన్",
      impactTitle: "జాతీయ ప్రభావ స్థాయి",
      impactSubtitle: "యువ-రక్త్ AI సమగ్ర సమన్వయ నమూనా",
      predictTitle: "1. అంచనా (PREDICT)",
      predictDesc: "జిల్లా స్థాయిలో 8 రక్త వర్గాలు మరియు 4 భాగాల బహుళ-కాల పరిమితి AI గణాంక డిమాండ్ అంచనా.",
      mobilizeTitle: "2. సమీకరణ (MOBILIZE)",
      mobilizeDesc: "ధృవీకరించబడిన యువ రక్తదాతల తక్షణ అత్యవసర అనుమతి మరియు ప్రాధాన్యతా సమీకరణ.",
      respondTitle: "3. ప్రతిస్పందన (RESPOND)",
      respondDesc: "8x4 నిల్వ చిట్టా, బహుళ-బ్యాచ్ కేటాయింపు మరియు ఆసుపత్రుల అత్యవసర రక్త సరఫరా.",
      quoteText: "రక్త కొరత ఏర్పడే వరకు మేము వేచి ఉండము. యువ-రక్త్ AI ముందే ప్రమాదాన్ని అంచనా వేస్తుంది మరియు అధీకృత ఆరోగ్య సంస్థల ద్వారా ధృవీకరించబడిన యువ రక్తదాతలను సమన్వయం చేస్తుంది.",
      medicalNoticeTitle: "వైద్య మరియు భద్రతా సూత్రం:",
      medicalNoticeText: "రక్తదానం యొక్క తుది అర్హతను అధీకృత వైద్య మరియు బ్లడ్ బ్యాంక్ సిబ్బంది నిర్ణయిస్తారు.",
      pillarYouthTitle: "యువ స్వచ్ఛంద రక్తదాతలు",
      pillarYouthDesc: "ధృవీకరించబడిన డిజిటల్ ప్రొఫైల్‌లు, లభ్యత నియంత్రణ, అత్యవసర అనుమతి మరియు భారతదేశవ్యాప్తంగా బహుభాషా మద్దతు.",
      pillarHospitalsTitle: "ఆసుపత్రులు & బ్లడ్ బ్యాంకులు",
      pillarHospitalsDesc: "అధీకృత సంస్థల నమోదు, లైసెన్స్ ధృవీకరణ మరియు వేగవంతమైన డిజిటల్ రక్త అభ్యర్థనల నిర్వహణ.",
      pillarGovTitle: "ప్రజారోగ్య పరిపాలన",
      pillarGovDesc: "పాత్ర-ఆధారిత నియంత్రణ, మార్చలేని ఆడిట్ లాగ్‌లు, అనుమతి పారదర్శకత మరియు జాతీయ స్థాయి పర్యవేక్షణ.",
      footerText: "యువ-రక్త్ AI • జాతీయ యువ రక్త నిఘా మరియు అత్యవసర స్పందన నెట్‌వర్క్",
      verifiedPrototype: "ప్రభుత్వ హ్యాకథాన్ ప్రోటోటైప్ • దశ 1-6 ధృవీకరించబడింది",
    },
    government: {
      commandCenterTitle: "జాతీయ రక్త నిఘా కమాండ్ సెంటర్",
      commandCenterSubtitle: "రియల్-టైమ్ AI రక్త కొరత అంచనాలు, ఆసుపత్రి అత్యవసర అభ్యర్థనలు మరియు స్వయంప్రతిపత్త యువత సమీకరణ.",
      totalRequests: "మొత్తం అభ్యర్థనలు",
      activeEmergencies: "క్రియాశీల అత్యవసరాలు",
      verifiedDonors: "ధృవీకరించబడిన దాతలు",
      availableDonors: "అందుబాటులో ఉన్న దాతలు",
      bloodCentresOnline: "ఆన్‌లైన్ బ్లడ్ సెంటర్లు",
      hospitalsConnected: "అనుసంధానించబడిన ఆసుపత్రులు",
      nationalAvailableStock: "జాతీయ అందుబాటులో ఉన్న నిల్వలు",
      criticalShortages: "తీవ్రమైన జిల్లా రక్త కొరతలు",
      districtRiskOverview: "జిల్లాల వారీ కొరత ప్రమాద మాతృక",
      highestShortageRisks: "అత్యధిక ప్రాధాన్యత కలిగిన కొరతలు",
      aiOperationalInsights: "AI కార్యాచరణ అంతర్దృష్టులు & కారణాలు (XAI)",
      inspectWhy: "కారణాన్ని పరిశీలించండి",
      runForecast: "AI విశ్లేషణను అమలు చేయండి",
      syncMap: "లైవ్ మ్యాప్ సింక్ చేయండి",
    },
    forecast: {
      title: "AI రక్త డిమాండ్ & కొరత ప్రమాద అంచనా",
      subtitle: "గత రికార్డులు, కాలానుగుణ వ్యాధులు మరియు జనాభా ఆధారంగా బహుళ-కాల డిమాండ్ నమూనాలు.",
      forecastHorizon: "అంచనా కాలవ్యవధి",
      days7: "7-రోజుల స్వల్పకాలిక",
      days14: "14-రోజుల వ్యూహాత్మక",
      days30: "30-రోజుల దీర్ఘకాలిక",
      predictedDemand: "అంచనా వేసిన డిమాండ్",
      confidenceScore: "ఖచ్చితత్వ విశ్వసనీయత స్కోర్",
      shortageRiskLevel: "కొరత ప్రమాద స్థాయి",
      contributingFactors: "ప్రమాద కారకాలు",
      recommendedActions: "AI సూచించిన చర్య",
      refreshAnalysis: "AI మోడల్‌ను రీఫ్రెష్ చేయండి",
      highRisk: "అధిక కొరత ప్రమాదం",
      mediumRisk: "మధ్యస్థ ప్రమాదం",
      lowRisk: "సరిపడా నిల్వలు",
      criticalShortage: "తీవ్రమైన అత్యవసర కొరత ప్రమాదం",
    },
    emergency: {
      radarTitle: "జాతీయ అత్యవసర సమీకరణ రాడార్",
      subtitle: "స్వయంప్రతిపత్త వనరుల గుర్తింపు, యువ దాతల హెచ్చరికలు మరియు రియల్-టైమ్ అంబులెన్స్ సమన్వయం.",
      activeEmergencyAlerts: "క్రియాశీల అత్యవసర డిమాండ్లు",
      mobilizeYouth: "యువ దాతలను సమీకరించండి",
      expandRadius: "పరిధిని పెంచండి (+25 కి.మీ)",
      escalateLevel: "అత్యవసర స్థాయిని పెంచండి",
      autonomousDiscovery: "స్వయంప్రతిపత్త వనరుల గుర్తింపు",
      nearestCompatibleBloodBank: "సమీప అనుకూల బ్లడ్ సెంటర్",
      assignedAmbulance: "కేటాయించిన అత్యవసర రవాణా",
      responseMetrics: "అత్యవసర ప్రతిస్పందన గణాంకాలు",
      avgResponseTime: "సగటు స్పందన సమయం",
    },
    campaigns: {
      title: "లక్ష్యిత యువ రక్తదాన ప్రచారాలు",
      subtitle: "AI కొరత అంచనాల ద్వారా స్వయంచాలకంగా ప్రారంభించబడిన రక్తదాన శిబిరాలు.",
      launchCampaign: "ప్రచారాన్ని ప్రారంభించండి",
      activeCampaigns: "క్రియాశీల రక్తదాన ప్రచారాలు",
      targetDonors: "లక్ష్యిత దాతలు",
      mobilizedDonors: "సమీకరించబడిన దాతలు",
      joinCampaign: "ప్రచారంలో చేరండి",
      iCanHelp: "నేను రక్తదానం చేయగలను",
      endDate: "ముగింపు తేదీ",
    },
    liveMap: {
      title: "జాతీయ లైవ్ రక్త నిఘా మ్యాప్",
      subtitle: "ముందస్తు కొరత అంచనాలు, ఆసుపత్రి అత్యవసరాలు, నిల్వలు మరియు అంబులెన్స్ మిషన్ల రియల్-టైమ్ జియోస్పేషియల్ మ్యాప్.",
      tacticalCommandInspector: "కమాండ్ ఇన్‌స్పెక్టర్ ప్యానెల్",
      selectEntity: "లైవ్ AI సిఫార్సులు మరియు చర్యలను వీక్షించడానికి మ్యాప్‌లోని ఏదైనా మార్కర్‌ను ఎంచుకోండి.",
      layerHeatmap: "కొరత హీట్‌మ్యాప్",
      layerEmergencies: "ఆసుపత్రి అత్యవసరాలు",
      layerBloodCentres: "బ్లడ్ సెంటర్లు",
      layerAmbulances: "అంబులెన్సులు & మార్గాలు",
      speed: "వేగం",
      etaMinutes: "అంచనా సమయం (నిమిషాలు)",
    },
    tracking: {
      title: "లైవ్ అత్యవసర రక్త రవాణా ట్రాకింగ్",
      subtitle: "జొమాటో/ఉబర్ శైలి రియల్-టైమ్ GPS టెలిమెట్రీ మరియు డెలివరీ స్థితి.",
      ambulanceOnTheWay: "అత్యవసర అంబులెన్స్ ప్రయాణంలో ఉంది",
      driverLocation: "లైవ్ GPS ట్రాకింగ్ క్రియాశీలకం",
      pickupAtBloodBank: "1. బ్లడ్ సెంటర్ నుండి రక్తం సేకరణ",
      bloodCollected: "2. రక్త యూనిట్లు సేకరించబడ్డాయి & భద్రపరచబడ్డాయి",
      deliveringToHospital: "3. ఆసుపత్రికి ప్రత్యక్ష రవాణా",
      arrivedAtHospital: "4. ఆసుపత్రి ఎమర్జెన్సీకి చేరుకుంది",
      deliveryCompleted: "5. వైద్య సిబ్బందికి అప్పగింత పూర్తయింది",
      demoStepper: "హ్యాకథాన్ జడ్జ్ సిమ్యులేటర్",
      liveTelemetry: "లైవ్ GPS స్ట్రీమింగ్",
      distanceRemaining: "మిగిలి ఉన్న దూరం",
      timeRemaining: "అంచనా సమయం",
    },
    voice: {
      listening: "అత్యవసర వాయిస్ కమాండ్ కోసం వింటోంది...",
      speakNow: "ఇప్పుడు మాట్లాడండి (ఉదా: 'పూణేలో రక్త కొరతను తనిఖీ చేయండి' లేదా 'ఎమర్జెన్సీ రాడార్ తెరవండి')",
      tapToSpeak: "వాయిస్ కమాండ్ సహాయకుడు",
      processing: "వాయిస్ కమాండ్ ప్రాసెస్ చేయబడుతోంది...",
      notSupported: "ఈ బ్రౌజర్‌లో స్పీచ్ రికగ్నిషన్ సపోర్ట్ చేయబడదు.",
      greeting: "యువ-రక్త్ AI వాయిస్ అసిస్టెంట్ సిద్ధంగా ఉంది. నేను మీకు ఎలా సహాయపడగలను?",
      assistantTitle: "AI వాయిస్ కమాండ్ సహాయకుడు",
    },
    auth: {
      loginTitle: "మీ ఖాతాలోకి ప్రవేశించండి",
      loginSubtitle: "జాతీయ రక్త స్పందన పోర్టల్‌ని యాక్సెస్ చేయండి",
      registerTitle: "ఖాతాను సృష్టించండి",
      registerSubtitle: "భారత యువ రక్త నెట్‌వర్క్‌లో చేరండి",
      emailLabel: "ఈమెయిల్ చిరునామా",
      passwordLabel: "పాస్‌వర్డ్",
      confirmPasswordLabel: "పాస్‌వర్డ్ నిర్ధారించండి",
      fullNameLabel: "పూర్తి పేరు",
      phoneLabel: "మొబైల్ నంబర్ (10 అంకెలు)",
      roleLabel: "నమోదు పాత్ర",
      stateLabel: "రాష్ట్రం",
      districtLabel: "జిల్లా",
      cityLabel: "నగరం / పట్టణం",
      bloodGroupLabel: "రక్త వర్గం",
      preferredLanguageLabel: "భాష ఎంపిక",
      loginButton: "లాగిన్ చేయండి",
      registerButton: "నమోదు పూర్తి చేయండి",
      forgotPasswordLink: "పాస్‌వర్డ్ మర్చిపోయారా?",
      dontHaveAccount: "ఖాతా లేదా?",
      alreadyHaveAccount: "ఇప్పటికే నమోదు చేసుకున్నారా?",
    },
    disclaimers: {
      medicalEligibility: "రక్తదానం యొక్క తుది అర్హతను అధీకృత వైద్య మరియు బ్లడ్ బ్యాంక్ సిబ్బంది నిర్ణయిస్తారు.",
      selfReportedBlood: "స్వయంగా ప్రకటించినది — ధృవీకరణ పెండింగ్‌లో ఉంది",
      aiDecisionSupport: "AI సూచనలు మరియు కొరత అంచనాలు కార్యాచరణ నిర్ణయ మద్దతు నమూనాలు మాత్రమే మరియు వైద్య నిర్ధారణలను భర్తీ చేయవు.",
    },
  },
};
