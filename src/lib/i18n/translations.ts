// Multilingual dictionary for YUVA-RAKT AI
// Supported languages: English (en), Hindi (hi), Marathi (mr), Telugu (te)

export type LanguageCode = "en" | "hi" | "mr" | "te";

export interface TranslationDictionary {
  brandName: string;
  tagline: string;
  badge: string;
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
    // Phase 3 Navigation
    governmentDashboard: string;
    governmentForecast: string;
    governmentEmergency: string;
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
