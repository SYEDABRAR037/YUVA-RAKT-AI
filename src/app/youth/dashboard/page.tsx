"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Shield,
  Bell,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  User,
  Settings,
  Sparkles,
  Activity,
  Heart,
  Check,
  X,
  FileCheck2,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface UserProfileData {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  state: string;
  district: string;
  city: string | null;
  accountStatus: string;
  youthDonorProfile: {
    bloodGroup: string;
    verificationStatus: string;
    availabilityStatus: string;
    donationCount: number;
    lastDonationDate: string | null;
    preferredLanguage: string;
    emergencyNotificationConsent: boolean;
    locationSharingConsent: boolean;
  } | null;
}

interface OpportunityItem {
  id: string;
  bloodGroup: string;
  componentType: string;
  unitsRequired: number;
  unitsFulfilled: number;
  urgency: string;
  requiredBy: string;
  hospitalName: string;
  district: string;
  state: string;
  myResponse: "INTERESTED" | "DECLINED" | null;
}

export default function YouthDashboardPage() {
  const { t } = useLanguage();
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [opportunities, setOpportunities] = useState<OpportunityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const fetchData = () => {
    Promise.all([
      fetch("/api/auth/me").then((res) => res.json()),
      fetch("/api/youth/opportunities").then((res) => res.json()),
    ])
      .then(([userData, oppData]) => {
        if (userData.success && userData.user) {
          setProfile(userData.user);
        }
        if (oppData.success && oppData.opportunities) {
          setOpportunities(oppData.opportunities);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRespond = async (requestId: string, status: "INTERESTED" | "DECLINED") => {
    setRespondingId(requestId);
    setMsg(null);

    try {
      const res = await fetch("/api/youth/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId,
          status,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setMsg(data.message || "Response recorded!");
        fetchData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRespondingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="flex items-center gap-3 text-rose-400">
          <div className="w-5 h-5 border-2 border-rose-500/30 border-t-rose-500 rounded-full animate-spin" />
          <span className="text-sm font-medium">Loading your donor dashboard...</span>
        </div>
      </div>
    );
  }

  const donor = profile?.youthDonorProfile;
  const bloodGroupDisplay = donor?.bloodGroup?.replace("_POSITIVE", "+")?.replace("_NEGATIVE", "-") || "Not Set";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900/90 to-rose-950/40 p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
              🩸 Youth Voluntary Donor Portal
            </span>
            <span className="text-xs text-slate-400">• Phase 2 Active</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Welcome, {profile?.fullName || "Youth Donor"}!
          </h1>
          <p className="text-sm text-slate-400 mt-1 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-rose-400" />
            <span>{profile?.district}, {profile?.state}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/youth/verification"
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all flex items-center gap-1.5 border border-slate-700"
          >
            <FileCheck2 className="w-3.5 h-3.5 text-rose-400" />
            <span>Verification</span>
          </Link>
          <Link
            href="/youth/donations"
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all flex items-center gap-1.5 border border-slate-700"
          >
            <Heart className="w-3.5 h-3.5 text-rose-400" />
            <span>My Donations</span>
          </Link>
          <Link
            href="/youth/profile"
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all flex items-center gap-1.5 border border-slate-700"
          >
            <User className="w-3.5 h-3.5 text-rose-400" />
            <span>Edit Profile</span>
          </Link>
          <Link
            href="/settings/privacy"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all border border-slate-700"
            title="Privacy"
          >
            <Settings className="w-4 h-4 text-rose-400" />
          </Link>
        </div>
      </div>

      {/* Mandatory Safety Notice */}
      <div className="mb-8 p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs sm:text-sm flex items-start gap-3.5 shadow-lg">
        <Shield className="w-5 h-5 flex-shrink-0 text-amber-400 mt-0.5" />
        <div>
          <strong className="text-amber-300 font-semibold block text-sm">Medical Protocol & Eligibility Principle</strong>
          <p className="text-amber-200/90 mt-1 leading-relaxed">
            {t.disclaimers.medicalEligibility}
          </p>
        </div>
      </div>

      {msg && (
        <div className="mb-6 p-4 rounded-xl text-xs flex items-center gap-2.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{msg}</span>
        </div>
      )}

      {/* Donor Status Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        {/* Blood Group Card */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Blood Group</span>
            <span className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 font-bold text-sm">
              🩸
            </span>
          </div>
          <div className="text-3xl font-extrabold text-white mb-2">{bloodGroupDisplay}</div>
          <p className="text-xs text-amber-400/90 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{t.disclaimers.selfReportedBlood}</span>
          </p>
        </div>

        {/* Verification Status Card */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Clinical Verification</span>
            <Link href="/youth/verification" className="text-xs text-rose-400 hover:text-rose-300 font-semibold">
              Manage →
            </Link>
          </div>
          <div className="text-xl font-bold text-white mb-2 flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
              donor?.verificationStatus === "VERIFIED"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                : donor?.verificationStatus === "PENDING"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                : "bg-slate-800 text-slate-300 border border-slate-700"
            }`}>
              {donor?.verificationStatus || "UNVERIFIED"}
            </span>
          </div>
          <p className="text-xs text-slate-400">
            {donor?.verificationStatus === "VERIFIED"
              ? "Verified by authorized blood centre."
              : "Submit certificate to receive verified lifesaver badge."}
          </p>
        </div>

        {/* Availability Status Card */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Availability Status</span>
            <Activity className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-white mb-2 flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
              donor?.availabilityStatus === "AVAILABLE"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
            }`}>
              {donor?.availabilityStatus === "AVAILABLE" ? "READY TO DONATE" : "NOT AVAILABLE"}
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Emergency alert dispatch configured for {profile?.district} district.
          </p>
        </div>
      </div>

      {/* EMERGENCY DONATION OPPORTUNITIES IN DISTRICT */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 sm:p-8 mb-8 shadow-xl">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-rose-400" />
              <span>Matching Emergency Blood Requirements in Your District</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Preliminary non-clinical platform matching based on blood group ({bloodGroupDisplay}) & district ({profile?.district}).
            </p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
            {opportunities.length} Active
          </span>
        </div>

        {opportunities.length > 0 ? (
          <div className="space-y-4">
            {opportunities.map((opp) => (
              <div
                key={opp.id}
                className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-rose-500/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-extrabold text-white text-base">
                      🩸 {opp.bloodGroup.replace("_POSITIVE", "+").replace("_NEGATIVE", "-")} ({opp.componentType})
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      {opp.urgency}
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-slate-300 mt-1">
                    {opp.hospitalName} ({opp.district}, {opp.state})
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Needs {opp.unitsRequired} unit(s) • Required By: {new Date(opp.requiredBy).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {opp.myResponse === "INTERESTED" ? (
                    <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 font-bold text-xs border border-emerald-500/40 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>You responded: &ldquo;I can help&rdquo;</span>
                    </span>
                  ) : opp.myResponse === "DECLINED" ? (
                    <span className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-400 font-semibold text-xs border border-slate-700">
                      Declined
                    </span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRespond(opp.id, "INTERESTED")}
                        disabled={respondingId === opp.id}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-xs shadow-md shadow-rose-600/30 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Heart className="w-3.5 h-3.5 text-rose-200 fill-rose-200" />
                        <span>I Can Help</span>
                      </button>

                      <button
                        onClick={() => handleRespond(opp.id, "DECLINED")}
                        disabled={respondingId === opp.id}
                        className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Decline</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-slate-500 text-xs">
            No emergency blood requisitions currently active in {profile?.district}. We will notify you when a match arises!
          </div>
        )}
      </div>

      {/* Lifetime Impact Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="p-6 rounded-3xl bg-slate-900/40 border border-slate-800">
          <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <Heart className="w-4 h-4 text-rose-400" />
            <span>Voluntary Lifetime Impact</span>
          </h3>
          <div className="text-3xl font-extrabold text-white mb-1">{donor?.donationCount || 0} Donations</div>
          <p className="text-xs text-slate-400">
            Last voluntary donation: {donor?.lastDonationDate ? new Date(donor.lastDonationDate).toLocaleDateString() : "None recorded yet"}
          </p>
          <div className="mt-4 pt-3 border-t border-slate-800">
            <Link href="/youth/donations" className="text-xs text-rose-400 hover:text-rose-300 font-semibold">
              View Donation Certificates →
            </Link>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-slate-900/40 border border-slate-800">
          <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-400" />
            <span>Emergency Alert Consent</span>
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed mb-3">
            Emergency SOS notifications: <strong className="text-emerald-400">{donor?.emergencyNotificationConsent ? "ACTIVE" : "PAUSED"}</strong>
          </p>
          <div className="pt-3 border-t border-slate-800">
            <Link href="/settings/privacy" className="text-xs text-amber-400 hover:text-amber-300 font-semibold">
              Manage Privacy & Consents →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
