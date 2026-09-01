"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { User, Shield, CheckCircle2, ArrowLeft, Save } from "lucide-react";
import { getIndianStates, getDistrictsForState } from "@/lib/location/indiaData";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function YouthProfilePage() {
  const { t } = useLanguage();
  const states = getIndianStates();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [state, setState] = useState(states[0] || "Maharashtra");
  const [district, setDistrict] = useState("Pune");
  const [city, setCity] = useState("");

  const [bloodGroup, setBloodGroup] = useState("O_POSITIVE");
  const [verificationStatus, setVerificationStatus] = useState("UNVERIFIED");
  const [availabilityStatus, setAvailabilityStatus] = useState<"AVAILABLE" | "NOT_AVAILABLE" | "UNKNOWN">("AVAILABLE");
  const [preferredLanguage, setPreferredLanguage] = useState("en");
  const [emergencyNotificationConsent, setEmergencyNotificationConsent] = useState(true);
  const [locationSharingConsent, setLocationSharingConsent] = useState(true);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const districts = getDistrictsForState(state);

  useEffect(() => {
    fetch("/api/user/profile")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.user) {
          const u = data.user;
          setFullName(u.fullName || "");
          setEmail(u.email || "");
          setPhone(u.phone || "");
          if (u.state) setState(u.state);
          if (u.district) setDistrict(u.district);
          setCity(u.city || "");

          if (u.youthDonorProfile) {
            const p = u.youthDonorProfile;
            setBloodGroup(p.bloodGroup);
            setVerificationStatus(p.verificationStatus);
            setAvailabilityStatus(p.availabilityStatus);
            setPreferredLanguage(p.preferredLanguage || "en");
            setEmergencyNotificationConsent(p.emergencyNotificationConsent);
            setLocationSharingConsent(p.locationSharingConsent);
          }
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleStateChange = (newState: string) => {
    setState(newState);
    const dList = getDistrictsForState(newState);
    if (dList.length > 0) {
      setDistrict(dList[0]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);

    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          phone,
          state,
          district: district || districts[0] || "General",
          city: city || undefined,
          preferredLanguage,
          availabilityStatus,
          emergencyNotificationConsent,
          locationSharingConsent,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setMsg({ text: "Your donor profile has been updated successfully!", type: "success" });
      } else {
        setMsg({ text: data.error || "Failed to update profile", type: "error" });
      }
    } catch (err) {
      console.error(err);
      setMsg({ text: "A network error occurred while updating profile", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="flex items-center gap-3 text-rose-400">
          <div className="w-5 h-5 border-2 border-rose-500/30 border-t-rose-500 rounded-full animate-spin" />
          <span className="text-sm font-medium">Loading profile details...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Link href="/youth/dashboard" className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 mb-2">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Dashboard</span>
        </Link>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <User className="w-6 h-6 text-rose-400" />
          <span>Youth Voluntary Donor Profile</span>
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Manage your personal details, availability status, and communication preferences.
        </p>
      </div>

      {/* Safety Principle Banner */}
      <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-3">
        <Shield className="w-5 h-5 flex-shrink-0 text-amber-400 mt-0.5" />
        <div>
          <span className="font-semibold text-amber-300">Medical Safety Principle:</span>
          <p className="mt-0.5 leading-relaxed text-amber-200/90">
            {t.disclaimers.medicalEligibility}
          </p>
        </div>
      </div>

      {msg && (
        <div
          className={`mb-6 p-4 rounded-xl text-xs flex items-center gap-2.5 ${
            msg.type === "success"
              ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300"
              : "bg-rose-500/10 border border-rose-500/30 text-rose-400"
          }`}
        >
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{msg.text}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Blood Group & Clinical Status (Read-Only/Verified Info) */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-sm font-bold text-white mb-4 uppercase tracking-wider text-slate-400">
            Clinical Blood Group Data
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-xs text-slate-400 block mb-1">Blood Group</span>
              <div className="text-2xl font-extrabold text-rose-400">
                {bloodGroup.replace("_POSITIVE", "+").replace("_NEGATIVE", "-")}
              </div>
              <p className="text-[11px] text-amber-400/90 mt-1">*{t.disclaimers.selfReportedBlood}</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-xs text-slate-400 block mb-1">Verification Status</span>
              <div className="text-base font-bold text-slate-200 mt-1">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  verificationStatus === "VERIFIED"
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    : "bg-slate-800 text-slate-300 border border-slate-700"
                }`}>
                  {verificationStatus}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                Verification stamp added upon authorized camp participation.
              </p>
            </div>
          </div>
        </div>

        {/* Editable Personal Details */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider text-slate-400">
            Personal & Contact Information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email (Primary Identifier)</label>
              <input
                type="email"
                disabled
                value={email}
                className="w-full px-4 py-2.5 bg-slate-950/40 border border-slate-800/60 rounded-xl text-xs text-slate-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Mobile Number (10 Digits)</label>
              <input
                type="tel"
                required
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Preferred Language</label>
              <select
                value={preferredLanguage}
                onChange={(e) => setPreferredLanguage(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-rose-500"
              >
                <option value="en">English</option>
                <option value="hi">हिंदी (Hindi)</option>
                <option value="mr">मराठी (Marathi)</option>
                <option value="te">తెలుగు (Telugu)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Location Hierarchy in India */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider text-slate-400">
            Geographic Location in India
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">State / UT</label>
              <select
                value={state}
                onChange={(e) => handleStateChange(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-rose-500"
              >
                {states.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">District</label>
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-rose-500"
              >
                {districts.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">City / Town</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Pune City"
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>
        </div>

        {/* Availability & Emergency Preferences */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider text-slate-400">
            Availability & Emergency Response
          </h2>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Current Donor Availability</label>
            <select
              value={availabilityStatus}
              onChange={(e) => setAvailabilityStatus(e.target.value as "AVAILABLE" | "NOT_AVAILABLE" | "UNKNOWN")}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-rose-500"
            >
              <option value="AVAILABLE">AVAILABLE (Ready for voluntary donation matching)</option>
              <option value="NOT_AVAILABLE">NOT AVAILABLE (Temporarily paused / recovering)</option>
              <option value="UNKNOWN">UNKNOWN</option>
            </select>
          </div>

          <div className="space-y-3 pt-2">
            <label className="flex items-center gap-3 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={emergencyNotificationConsent}
                onChange={(e) => setEmergencyNotificationConsent(e.target.checked)}
                className="rounded border-slate-700 text-rose-600 focus:ring-rose-500"
              />
              <span>Receive emergency SOS blood alerts when critical demand arises in my district</span>
            </label>

            <label className="flex items-center gap-3 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={locationSharingConsent}
                onChange={(e) => setLocationSharingConsent(e.target.checked)}
                className="rounded border-slate-700 text-rose-600 focus:ring-rose-500"
              />
              <span>Allow district-level location matching for authorized blood centres</span>
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 px-4 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-semibold text-sm rounded-xl shadow-lg shadow-rose-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          {saving ? (
            <span>Saving Changes...</span>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save Profile Updates</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
