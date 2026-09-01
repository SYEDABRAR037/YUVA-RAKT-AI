"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileCheck2,
  ArrowLeft,
  RefreshCw,
  CheckCircle2,
  XCircle,
  FileText,
  User,
} from "lucide-react";

interface VerificationItem {
  id: string;
  status: "PENDING" | "VERIFIED" | "REJECTED";
  documentType: string;
  documentNumber: string;
  notes?: string;
  submittedAt: string;
  donor: {
    bloodGroup: string;
    user: {
      fullName: string;
      email: string;
      phone: string;
      district: string;
      state: string;
    };
  };
}

export default function BloodBankVerificationsPage() {
  const [requests, setRequests] = useState<VerificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectingItem, setRejectingItem] = useState<VerificationItem | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const fetchVerifications = () => {
    setLoading(true);
    fetch("/api/blood-bank/verifications")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setRequests(data.requests || []);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchVerifications();
  }, []);

  const handleApprove = async (requestId: string) => {
    setActionLoading(requestId);
    setMsg(null);

    try {
      const res = await fetch("/api/blood-bank/verifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId,
          decision: "VERIFIED",
        }),
      });

      const data = await res.json();
      if (data.success) {
        setMsg({ text: "Donor profile officially verified!", type: "success" });
        fetchVerifications();
      } else {
        setMsg({ text: data.error || "Failed to verify donor", type: "error" });
      }
    } catch (err) {
      console.error(err);
      setMsg({ text: "Network error occurred", type: "error" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingItem) return;

    setActionLoading(rejectingItem.id);
    setMsg(null);

    try {
      const res = await fetch("/api/blood-bank/verifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: rejectingItem.id,
          decision: "REJECTED",
          rejectionReason,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setMsg({ text: "Verification rejected with documented feedback", type: "success" });
        setRejectingItem(null);
        setRejectionReason("");
        fetchVerifications();
      } else {
        setMsg({ text: data.error || "Failed to reject", type: "error" });
      }
    } catch (err) {
      console.error(err);
      setMsg({ text: "Network error occurred", type: "error" });
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-800">
          <div>
            <Link href="/blood-bank/dashboard" className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1.5 mb-2">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Blood Bank Dashboard</span>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-3">
              <FileCheck2 className="w-7 h-7 text-amber-400" />
              <span>Voluntary Donor Clinical Verification Queue</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-medium mt-1">
              Review submitted donation certificates, camp cards, and lab reports to grant verified donor credentials.
            </p>
          </div>

          <button
            onClick={fetchVerifications}
            className="px-4 py-2.5 rounded-xl bg-slate-900 border-2 border-slate-700 hover:bg-slate-800 text-xs font-bold text-white flex items-center gap-2 cursor-pointer self-start sm:self-auto shadow-lg transition-all"
          >
            <RefreshCw className="w-4 h-4 text-amber-400" />
            <span>Refresh Queue</span>
          </button>
        </div>

        {msg && (
          <div
            className={`mb-6 p-4 rounded-2xl text-xs font-bold flex items-center gap-3 border-2 ${
              msg.type === "success"
                ? "bg-emerald-950/90 border-emerald-500 text-emerald-100"
                : "bg-rose-950/90 border-rose-500 text-rose-100"
            }`}
          >
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span>{msg.text}</span>
          </div>
        )}

        {/* High Contrast Queue Table */}
        <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 border-b-2 border-slate-700 text-slate-200 font-black uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-5 py-4">Donor Candidate</th>
                  <th className="px-5 py-4">Blood Group</th>
                  <th className="px-5 py-4">Document Proof & Ref</th>
                  <th className="px-5 py-4">Submitted At</th>
                  <th className="px-5 py-4 text-right">Verification Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-16 text-center text-slate-400 font-bold text-sm">
                      Loading pending verification requests...
                    </td>
                  </tr>
                ) : requests.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-16 text-center text-slate-300 font-semibold text-sm">
                      🎉 Verification queue is empty! No pending donor submissions in your jurisdiction.
                    </td>
                  </tr>
                ) : (
                  requests.map((r) => {
                    const bloodLabel = r.donor.bloodGroup.replace("_POSITIVE", "+").replace("_NEGATIVE", "-");
                    return (
                      <tr key={r.id} className="hover:bg-slate-800/80 transition-colors">
                        <td className="px-5 py-4">
                          <div className="font-extrabold text-white text-sm flex items-center gap-2">
                            <User className="w-4 h-4 text-rose-400" />
                            <span>{r.donor.user.fullName}</span>
                          </div>
                          <div className="text-slate-300 text-xs font-medium mt-1">
                            {r.donor.user.email} • {r.donor.user.phone}
                          </div>
                          <div className="text-slate-400 text-xs mt-0.5">
                            {r.donor.user.district}, {r.donor.user.state}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span className="font-black text-rose-400 text-base">
                            🩸 {bloodLabel}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5 font-bold text-white text-xs">
                            <FileText className="w-4 h-4 text-amber-400" />
                            <span>{r.documentType.replace(/_/g, " ")}</span>
                          </div>
                          <div className="text-amber-300 font-mono text-xs font-bold mt-1">
                            Ref: {r.documentNumber}
                          </div>
                          {r.notes && (
                            <div className="text-slate-300 text-xs mt-1">
                              Note: {r.notes}
                            </div>
                          )}
                        </td>

                        <td className="px-5 py-4 text-slate-300 text-xs font-semibold whitespace-nowrap">
                          {new Date(r.submittedAt).toLocaleString()}
                        </td>

                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleApprove(r.id)}
                              disabled={actionLoading === r.id}
                              className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-lg shadow-emerald-600/30 cursor-pointer flex items-center gap-1.5 disabled:opacity-50 transition-all"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Approve & Verify</span>
                            </button>

                            <button
                              onClick={() => setRejectingItem(r)}
                              disabled={actionLoading === r.id}
                              className="px-3.5 py-1.5 rounded-xl bg-rose-950 hover:bg-rose-900 text-rose-200 border border-rose-500 text-xs font-bold cursor-pointer flex items-center gap-1.5 disabled:opacity-50 transition-all"
                            >
                              <XCircle className="w-4 h-4" />
                              <span>Reject</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* REJECT MODAL */}
        {rejectingItem && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative my-8">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                  <XCircle className="w-6 h-6 text-rose-400" />
                  <span>Reject Verification Application</span>
                </h2>
                <button
                  onClick={() => setRejectingItem(null)}
                  className="p-2 rounded-xl text-slate-300 hover:text-white text-base font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleReject} className="space-y-4">
                <p className="text-xs text-slate-200 font-medium">
                  Rejecting application for <strong className="text-white font-bold">{rejectingItem.donor.user.fullName}</strong>. Please provide a clear clinical or documentation reason to help the donor re-apply.
                </p>

                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1.5">
                    Rejection Reason (Required)
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="e.g. Document image illegible, camp certificate expired, registration number mismatch"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border-2 border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-rose-500 placeholder-slate-500"
                  />
                </div>

                <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setRejectingItem(null)}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading === rejectingItem.id || !rejectionReason.trim()}
                    className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black shadow-xl shadow-rose-600/40 transition-all disabled:opacity-50"
                  >
                    Confirm Rejection
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
