"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Flame, Lock, Mail, Phone, User, Heart, Building2, Hospital as HospitalIcon, AlertCircle, ArrowRight, Shield } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { getIndianStates, getDistrictsForState } from "@/lib/location/indiaData";

type RoleType = "YOUTH_DONOR" | "HOSPITAL" | "BLOOD_BANK";

export default function RegisterPage() {
  const router = useRouter();
  const { t } = useLanguage();

  const [role, setRole] = useState<RoleType>("YOUTH_DONOR");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender] = useState<"MALE" | "FEMALE" | "OTHER">("MALE");
  
  // Location
  const states = getIndianStates();
  const [state, setState] = useState(states[0] || "Maharashtra");
  const districts = getDistrictsForState(state);
  const [district, setDistrict] = useState(districts[0] || "Pune");
  const [city, setCity] = useState("");

  // Youth Donor fields
  const [bloodGroup, setBloodGroup] = useState("O_POSITIVE");
  const [preferredLanguage, setPreferredLanguage] = useState("en");

  // Organization fields
  const [orgName, setOrgName] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [orgEmail] = useState("");
  const [orgPhone] = useState("");
  const [address, setAddress] = useState("");
  const [pincode, setPincode] = useState("");

  // Consents
  const [privacyPolicyConsent, setPrivacyPolicyConsent] = useState(true);
  const [dataProcessingConsent, setDataProcessingConsent] = useState(true);
  const [emergencyNotificationConsent, setEmergencyNotificationConsent] = useState(true);
  const [locationSharingConsent, setLocationSharingConsent] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleStateChange = (newState: string) => {
    setState(newState);
    const newDistricts = getDistrictsForState(newState);
    if (newDistricts.length > 0) {
      setDistrict(newDistricts[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (!privacyPolicyConsent || !dataProcessingConsent) {
      setError("You must accept the Privacy Policy and Data Processing terms to register");
      setLoading(false);
      return;
    }

    const payload = {
      fullName,
      email,
      phone,
      password,
      confirmPassword,
      dateOfBirth: dateOfBirth || undefined,
      gender,
      state,
      district: district || districts[0] || "General",
      city: city || undefined,
      role,
      bloodGroup: role === "YOUTH_DONOR" ? bloodGroup : undefined,
      preferredLanguage: role === "YOUTH_DONOR" ? preferredLanguage : undefined,
      orgName: role !== "YOUTH_DONOR" ? orgName : undefined,
      registrationNumber: role !== "YOUTH_DONOR" ? registrationNumber : undefined,
      orgEmail: role !== "YOUTH_DONOR" ? (orgEmail || email) : undefined,
      orgPhone: role !== "YOUTH_DONOR" ? (orgPhone || phone) : undefined,
      address: role !== "YOUTH_DONOR" ? address : undefined,
      pincode: role !== "YOUTH_DONOR" ? pincode : undefined,
      privacyPolicyConsent,
      dataProcessingConsent,
      emergencyNotificationConsent,
      locationSharingConsent,
    };

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Registration failed. Please check your entries.");
        setLoading(false);
        return;
      }

      router.push(data.data?.redirectUrl || "/");
      router.refresh();
    } catch (err) {
      console.error(err);
      setError("A network error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] py-12 px-4 sm:px-6 lg:px-8 relative">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-rose-600/10 blur-[160px] rounded-full pointer-events-none" />

      <div className="max-w-2xl mx-auto bg-slate-900/80 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-10 backdrop-blur-xl relative z-10">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-600 to-rose-800 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-rose-600/30 text-white font-bold">
            <Flame className="w-6 h-6 text-rose-100" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{t.auth.registerTitle}</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">{t.auth.registerSubtitle}</p>
        </div>

        {/* Role Switcher Tabs */}
        <div className="grid grid-cols-3 gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 mb-8">
          <button
            type="button"
            onClick={() => setRole("YOUTH_DONOR")}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              role === "YOUTH_DONOR"
                ? "bg-gradient-to-r from-rose-600 to-rose-700 text-white shadow-lg shadow-rose-600/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            <span>Youth Donor</span>
          </button>

          <button
            type="button"
            onClick={() => setRole("HOSPITAL")}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              role === "HOSPITAL"
                ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-600/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <HospitalIcon className="w-3.5 h-3.5" />
            <span>Hospital</span>
          </button>

          <button
            type="button"
            onClick={() => setRole("BLOOD_BANK")}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              role === "BLOOD_BANK"
                ? "bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-lg shadow-amber-600/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Blood Bank</span>
          </button>
        </div>

        {/* Medical Principle Notice */}
        <div className="mb-8 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs flex items-start gap-3">
          <Shield className="w-5 h-5 flex-shrink-0 text-amber-400 mt-0.5" />
          <div>
            <span className="font-semibold text-amber-300">Important Safety Principle:</span>
            <p className="mt-0.5 text-amber-200/90 leading-relaxed">
              {t.disclaimers.medicalEligibility}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* SECTION 1: Personal Info */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-2">
              {role === "YOUTH_DONOR" ? "1. Personal Information" : "1. Authorized Representative Details"}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">{t.auth.fullNameLabel} *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Aarav Sharma"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">{t.auth.emailLabel} *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">{t.auth.phoneLabel} *</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                    placeholder="9876543210"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all"
                  />
                </div>
              </div>

              {role === "YOUTH_DONOR" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Date of Birth</label>
                  <input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all"
                  />
                </div>
              )}
            </div>
          </div>

          {/* SECTION 2: Role Details */}
          {role === "YOUTH_DONOR" ? (
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-2">
                2. Donor Blood Profile
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    {t.auth.bloodGroupLabel} *
                  </label>
                  <select
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all"
                  >
                    <option value="A_POSITIVE">A+ (A Positive)</option>
                    <option value="A_NEGATIVE">A- (A Negative)</option>
                    <option value="B_POSITIVE">B+ (B Positive)</option>
                    <option value="B_NEGATIVE">B- (B Negative)</option>
                    <option value="AB_POSITIVE">AB+ (AB Positive)</option>
                    <option value="AB_NEGATIVE">AB- (AB Negative)</option>
                    <option value="O_POSITIVE">O+ (O Positive)</option>
                    <option value="O_NEGATIVE">O- (O Negative)</option>
                  </select>
                  <p className="text-[11px] text-amber-400/80 mt-1">*{t.disclaimers.selfReportedBlood}</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    {t.auth.preferredLanguageLabel}
                  </label>
                  <select
                    value={preferredLanguage}
                    onChange={(e) => setPreferredLanguage(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all"
                  >
                    <option value="en">English</option>
                    <option value="hi">हिंदी (Hindi)</option>
                    <option value="mr">मराठी (Marathi)</option>
                    <option value="te">తెలుగు (Telugu)</option>
                  </select>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-2">
                2. {role === "HOSPITAL" ? "Hospital Organization Details" : "Blood Bank Organization Details"}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Organization Name *</label>
                  <input
                    type="text"
                    required
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder={role === "HOSPITAL" ? "e.g. AIIMS Delhi" : "e.g. Red Cross Blood Centre"}
                    className="w-full px-4 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">License / Reg Number *</label>
                  <input
                    type="text"
                    required
                    value={registrationNumber}
                    onChange={(e) => setRegistrationNumber(e.target.value)}
                    placeholder="e.g. DL-MED-2024-998"
                    className="w-full px-4 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Full Physical Address *</label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Street address, landmark, sector..."
                    className="w-full px-4 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all"
                  />
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3: Location */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-2">
              3. Geographic Location (India)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">{t.auth.stateLabel} *</label>
                <select
                  value={state}
                  onChange={(e) => handleStateChange(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all"
                >
                  {states.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">{t.auth.districtLabel} *</label>
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all"
                >
                  {districts.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {role !== "YOUTH_DONOR" ? "PIN Code *" : t.auth.cityLabel}
                </label>
                {role !== "YOUTH_DONOR" ? (
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
                    placeholder="e.g. 110029"
                    className="w-full px-4 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all"
                  />
                ) : (
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Pune City"
                    className="w-full px-4 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all"
                  />
                )}
              </div>
            </div>
          </div>

          {/* SECTION 4: Password */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-2">
              4. Password & Security
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">{t.auth.passwordLabel} *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 8 chars, 1 upper, 1 number"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">{t.auth.confirmPasswordLabel} *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 5: Declarations & Consents */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-2">
              5. Consent & Declarations
            </h3>

            <label className="flex items-start gap-3 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                required
                checked={privacyPolicyConsent}
                onChange={(e) => setPrivacyPolicyConsent(e.target.checked)}
                className="mt-0.5 rounded border-slate-700 text-rose-600 focus:ring-rose-500"
              />
              <span>
                <strong className="text-white">Privacy Policy & Terms:</strong> I accept the National Blood Network data privacy terms and acknowledge that blood matching is assisted by algorithmic intelligence.
              </span>
            </label>

            <label className="flex items-start gap-3 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                required
                checked={dataProcessingConsent}
                onChange={(e) => setDataProcessingConsent(e.target.checked)}
                className="mt-0.5 rounded border-slate-700 text-rose-600 focus:ring-rose-500"
              />
              <span>
                <strong className="text-white">Data Processing Consent:</strong> I authorize authorized blood banks and emergency hospitals to match my availability during blood shortage events.
              </span>
            </label>

            {role === "YOUTH_DONOR" && (
              <>
                <label className="flex items-start gap-3 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={emergencyNotificationConsent}
                    onChange={(e) => setEmergencyNotificationConsent(e.target.checked)}
                    className="mt-0.5 rounded border-slate-700 text-rose-600 focus:ring-rose-500"
                  />
                  <span>
                    <strong className="text-white">Emergency Blood Alert Notifications:</strong> Receive urgent SOS alerts when critical blood matching occurs in my district.
                  </span>
                </label>

                <label className="flex items-start gap-3 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={locationSharingConsent}
                    onChange={(e) => setLocationSharingConsent(e.target.checked)}
                    className="mt-0.5 rounded border-slate-700 text-rose-600 focus:ring-rose-500"
                  />
                  <span>
                    <strong className="text-white">District-Level Location Matching:</strong> Allow geographic proximity matching with authorized district blood banks.
                  </span>
                </label>
              </>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-semibold text-sm rounded-xl shadow-lg shadow-rose-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Registering Account...
              </span>
            ) : (
              <>
                <span>{t.auth.registerButton}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-slate-400 border-t border-slate-800/80 pt-6">
          {t.auth.alreadyHaveAccount}{" "}
          <Link href="/login" className="font-semibold text-rose-400 hover:text-rose-300 underline underline-offset-4">
            {t.auth.loginButton}
          </Link>
        </div>
      </div>
    </div>
  );
}
