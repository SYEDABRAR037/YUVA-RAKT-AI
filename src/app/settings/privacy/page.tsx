"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Shield, Lock, Bell, MapPin, CheckCircle2, Save, ArrowLeft, FileCheck } from "lucide-react";

interface ConsentRecord {
  id: string;
  consentType: string;
  accepted: boolean;
  version: string;
  createdAt: string;
  revokedAt: string | null;
}

export default function PrivacySettingsPage() {
  const [emergencyNotificationConsent, setEmergencyNotificationConsent] = useState(true);
  const [locationSharingConsent, setLocationSharingConsent] = useState(true);
  const [dataSharingConsent, setDataSharingConsent] = useState(true);
  const [consents, setConsents] = useState<ConsentRecord[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    fetch("/api/user/privacy")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setEmergencyNotificationConsent(data.data.emergencyNotificationConsent);
          setLocationSharingConsent(data.data.locationSharingConsent);
          setDataSharingConsent(data.data.dataSharingConsent);
          setConsents(data.data.consents || []);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);

    try {
      const res = await fetch("/api/user/privacy", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emergencyNotificationConsent,
          locationSharingConsent,
          dataSharingConsent,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setMsg({ text: "Privacy and consent preferences updated and logged to audit trail!", type: "success" });
      } else {
        setMsg({ text: data.error || "Failed to update privacy settings", type: "error" });
      }
    } catch (err) {
      console.error(err);
      setMsg({ text: "Network error occurred", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="flex items-center gap-3 text-rose-400">
          <div className="w-5 h-5 border-2 border-rose-500/30 border-t-rose-500 rounded-full animate-spin" />
          <span className="text-sm font-medium">Loading privacy preferences...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Link href="/" className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 mb-2">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Shield className="w-6 h-6 text-rose-400" />
          <span>Privacy & Consent Management</span>
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          YUVA-RAKT AI enforces strict consent transparency, data minimization, and audit compliance.
        </p>
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

      <form onSubmit={handleSave} className="space-y-6 mb-10">
        {/* Toggle Permissions */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-start justify-between gap-4 pb-6 border-b border-slate-800/80">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 flex-shrink-0">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Emergency Blood Alert Dispatch</h3>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                  Allow authorized blood banks & hospitals to send urgent notifications when critical matching occurs in your district.
                </p>
              </div>
            </div>

            <input
              type="checkbox"
              checked={emergencyNotificationConsent}
              onChange={(e) => setEmergencyNotificationConsent(e.target.checked)}
              className="mt-1 w-5 h-5 rounded border-slate-700 text-rose-600 focus:ring-rose-500 cursor-pointer"
            />
          </div>

          <div className="flex items-start justify-between gap-4 pb-6 border-b border-slate-800/80">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 flex-shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">District-Level Geographic Matching</h3>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                  Permit anonymized proximity matching by district coordinates to optimize emergency response transit times.
                </p>
              </div>
            </div>

            <input
              type="checkbox"
              checked={locationSharingConsent}
              onChange={(e) => setLocationSharingConsent(e.target.checked)}
              className="mt-1 w-5 h-5 rounded border-slate-700 text-rose-600 focus:ring-rose-500 cursor-pointer"
            />
          </div>

          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Aggregated Public Health Research Consent</h3>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                  Authorize privacy-preserving, non-identifiable aggregated statistics for national blood shortage research and planning.
                </p>
              </div>
            </div>

            <input
              type="checkbox"
              checked={dataSharingConsent}
              onChange={(e) => setDataSharingConsent(e.target.checked)}
              className="mt-1 w-5 h-5 rounded border-slate-700 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 px-4 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-semibold text-sm rounded-xl shadow-lg shadow-rose-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          {saving ? (
            <span>Updating Preferences...</span>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Update Privacy Consents</span>
            </>
          )}
        </button>
      </form>

      {/* Historical Consent Records */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
        <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <FileCheck className="w-4 h-4 text-emerald-400" />
          <span>Recorded Consent Ledger (Audit Trail)</span>
        </h2>
        <p className="text-xs text-slate-400 mb-4">
          All consent actions are cryptographically logged with versions for regulatory compliance.
        </p>

        <div className="divide-y divide-slate-800/60 text-xs">
          {consents.length > 0 ? (
            consents.map((c) => (
              <div key={c.id} className="py-2.5 flex items-center justify-between gap-4">
                <div>
                  <span className="font-semibold text-slate-200">{c.consentType}</span>
                  <span className="text-slate-500 text-[10px] ml-2">({c.version})</span>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      c.accepted
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                    }`}
                  >
                    {c.accepted ? "ACCEPTED" : "REVOKED"}
                  </span>
                  <span className="text-slate-500 text-[10px]">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="py-4 text-slate-500 text-center">No explicit consent records logged yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}
