"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileCheck2,
  ArrowLeft,
  Shield,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  Upload,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface VerificationData {
  verificationStatus: "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";
  rejectionReason: string | null;
  verificationSubmittedAt: string | null;
  requests: Array<{
    id: string;
    documentType: string;
    documentNumber: string;
    notes?: string;
    status: string;
    rejectionReason?: string;
    submittedAt: string;
    reviewedAt?: string;
    reviewedByBloodBank?: {
      name: string;
      district: string;
    };
  }>;
}

export default function YouthVerificationPage() {
  const { t } = useLanguage();
  const [data, setData] = useState<VerificationData | null>(null);
  const [loading, setLoading] = useState(true);

  // Form State
  const [documentType, setDocumentType] = useState<"BLOOD_CAMP_CARD" | "LAB_REPORT" | "HOSPITAL_CERTIFICATE" | "GOVT_ID">("BLOOD_CAMP_CARD");
  const [documentNumber, setDocumentNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const fetchStatus = () => {
    setLoading(true);
    fetch("/api/youth/verification")
      .then((res) => res.json())
      .then((resData) => {
        if (resData.success) {
          setData(resData);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMsg(null);

    try {
      const res = await fetch("/api/youth/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentType,
          documentNumber,
          notes: notes || undefined,
        }),
      });

      const resData = await res.json();
      if (resData.success) {
        setMsg({ text: resData.message || "Verification details submitted successfully!", type: "success" });
        fetchStatus();
        setDocumentNumber("");
        setNotes("");
      } else {
        setMsg({ text: resData.error || "Failed to submit verification", type: "error" });
      }
    } catch (err) {
      console.error(err);
      setMsg({ text: "Network error occurred", type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="flex items-center gap-3 text-rose-400">
          <div className="w-5 h-5 border-2 border-rose-500/30 border-t-rose-500 rounded-full animate-spin" />
          <span className="text-sm font-medium">Loading verification records...</span>
        </div>
      </div>
    );
  }

  const status = data?.verificationStatus || "UNVERIFIED";

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Header */}
      <div className="mb-6">
        <Link href="/youth/dashboard" className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 mb-2">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Donor Dashboard</span>
        </Link>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <FileCheck2 className="w-6 h-6 text-rose-400" />
          <span>Voluntary Donor Clinical Verification</span>
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Verify your blood group with an authorized blood bank or government-certified camp.
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

      {/* Current Status Banner */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-1">
              Current Clinical Verification Status
            </span>
            <div className="text-2xl font-extrabold text-white flex items-center gap-3">
              <span
                className={`px-3.5 py-1 rounded-full text-sm font-bold border ${
                  status === "VERIFIED"
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                    : status === "PENDING"
                    ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                    : status === "REJECTED"
                    ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                    : "bg-slate-800 text-slate-300 border-slate-700"
                }`}
              >
                {status}
              </span>
            </div>
          </div>

          <div className="text-xs text-slate-400 sm:text-right">
            {status === "VERIFIED" && (
              <p className="text-emerald-400 font-medium">
                ✅ Your donor profile is officially verified by an authorized blood centre.
              </p>
            )}
            {status === "PENDING" && (
              <p className="text-amber-300 font-medium">
                ⏳ Application under review by an authorized blood bank in your district.
              </p>
            )}
            {status === "REJECTED" && (
              <p className="text-rose-400 font-medium">
                ⚠️ Previous application was rejected. Please review feedback and re-submit.
              </p>
            )}
            {status === "UNVERIFIED" && (
              <p className="text-slate-400">
                Submit your camp certificate or donation card below to get verified.
              </p>
            )}
          </div>
        </div>

        {data?.rejectionReason && (
          <div className="mt-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Reason from Blood Centre:</span>
              <p className="mt-0.5 text-slate-300">{data.rejectionReason}</p>
            </div>
          </div>
        )}
      </div>

      {/* SUBMISSION FORM (If not verified) */}
      {status !== "VERIFIED" && (
        <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 sm:p-8 mb-8 shadow-xl">
          <h2 className="text-base font-bold text-white mb-2 flex items-center gap-2">
            <Upload className="w-5 h-5 text-rose-400" />
            <span>Submit Verification Credentials</span>
          </h2>
          <p className="text-xs text-slate-400 mb-6">
            Authorized blood banks in your district will inspect the reference ID to confirm clinical eligibility.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Document Type</label>
                <select
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value as any)}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-rose-500"
                >
                  <option value="BLOOD_CAMP_CARD">Blood Camp Donor Card</option>
                  <option value="HOSPITAL_CERTIFICATE">Hospital Donation Certificate</option>
                  <option value="LAB_REPORT">Certified Clinical Blood Group Report</option>
                  <option value="GOVT_ID">Government Health Portal ID / ABHA</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Document / Certificate Reference Number
                </label>
                <input
                  type="text"
                  required
                  value={documentNumber}
                  onChange={(e) => setDocumentNumber(e.target.value)}
                  placeholder="e.g. CARD-PUN-2026-99"
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-rose-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Additional Remarks / Camp Details (Optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Donated at National Youth Day Camp, Savitribai Phule Pune University"
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-rose-500"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-4 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-4"
            >
              {submitting ? "Submitting Application..." : "Submit for Blood Bank Verification"}
            </button>
          </form>
        </div>
      )}

      {/* SUBMISSION HISTORY */}
      {data?.requests && data.requests.length > 0 && (
        <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 sm:p-8">
          <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-slate-400" />
            <span>Verification Submission Timeline</span>
          </h2>

          <div className="space-y-3">
            {data.requests.map((r) => (
              <div key={r.id} className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-rose-400" />
                    <span className="font-bold text-white">{r.documentType.replace(/_/g, " ")}</span>
                    <span className="font-mono text-slate-400">({r.documentNumber})</span>
                  </div>
                  {r.notes && <p className="text-slate-400 text-[11px] mt-1">{r.notes}</p>}
                  {r.reviewedByBloodBank && (
                    <p className="text-emerald-400 text-[11px] mt-1 font-medium">
                      Reviewed by {r.reviewedByBloodBank.name} ({r.reviewedByBloodBank.district})
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      r.status === "VERIFIED"
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                        : r.status === "REJECTED"
                        ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                        : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                    }`}
                  >
                    {r.status}
                  </span>
                  <span className="text-slate-500 text-[11px] whitespace-nowrap">
                    {new Date(r.submittedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
