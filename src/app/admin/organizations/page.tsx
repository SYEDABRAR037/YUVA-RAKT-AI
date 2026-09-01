"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Building2, Hospital as HospitalIcon, ArrowLeft, RefreshCw, AlertCircle } from "lucide-react";

interface HospitalOrg {
  id: string;
  name: string;
  registrationNumber: string;
  email: string;
  phone: string;
  state: string;
  district: string;
  address: string;
  pincode: string;
  verificationStatus: "VERIFIED" | "REJECTED" | "PENDING";
  user: {
    fullName: string;
    email: string;
    accountStatus: string;
  };
}

interface BloodBankOrg {
  id: string;
  name: string;
  registrationNumber: string;
  email: string;
  phone: string;
  state: string;
  district: string;
  address: string;
  pincode: string;
  verificationStatus: "VERIFIED" | "REJECTED" | "PENDING";
  user: {
    fullName: string;
    email: string;
    accountStatus: string;
  };
}

export default function AdminOrganizationsPage() {
  const [tab, setTab] = useState<"HOSPITAL" | "BLOOD_BANK">("HOSPITAL");
  const [hospitals, setHospitals] = useState<HospitalOrg[]>([]);
  const [bloodBanks, setBloodBanks] = useState<BloodBankOrg[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const fetchOrgs = () => {
    setLoading(true);
    fetch("/api/admin/organizations")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setHospitals(data.hospitals || []);
          setBloodBanks(data.bloodBanks || []);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrgs();
  }, []);

  const handleVerify = async (orgId: string, orgType: "HOSPITAL" | "BLOOD_BANK", newStatus: "VERIFIED" | "REJECTED") => {
    setActionLoading(orgId);
    setMsg(null);

    try {
      const res = await fetch("/api/admin/organizations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgId,
          orgType,
          verificationStatus: newStatus,
          notes: `Admin status set to ${newStatus}`,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setMsg({ text: data.message, type: "success" });
        fetchOrgs();
      } else {
        setMsg({ text: data.error || "Failed to update verification", type: "error" });
      }
    } catch (err) {
      console.error(err);
      setMsg({ text: "Network error occurred", type: "error" });
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back button & Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <Link href="/admin/dashboard" className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 mb-2">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Admin Dashboard</span>
          </Link>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Building2 className="w-6 h-6 text-blue-400" />
            <span>Organization Verification Registry</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Verify clinical licenses, state registrations, and activate hospital & blood bank accounts.
          </p>
        </div>

        <button
          onClick={fetchOrgs}
          className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs font-semibold text-slate-300 flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
          <span>Refresh</span>
        </button>
      </div>

      {msg && (
        <div
          className={`mb-6 p-3.5 rounded-xl text-xs flex items-center gap-2 ${
            msg.type === "success"
              ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300"
              : "bg-rose-500/10 border border-rose-500/30 text-rose-400"
          }`}
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{msg.text}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6 border-b border-slate-800 pb-2">
        <button
          onClick={() => setTab("HOSPITAL")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
            tab === "HOSPITAL"
              ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <HospitalIcon className="w-4 h-4" />
          <span>Hospitals ({hospitals.length})</span>
        </button>

        <button
          onClick={() => setTab("BLOOD_BANK")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
            tab === "BLOOD_BANK"
              ? "bg-amber-600 text-white shadow-lg shadow-amber-600/30"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Blood Banks ({bloodBanks.length})</span>
        </button>
      </div>

      {/* Orgs Table */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">Facility Name & Reg</th>
                <th className="px-4 py-3">Nodal Officer & Email</th>
                <th className="px-4 py-3">Address & District</th>
                <th className="px-4 py-3">Verification Status</th>
                <th className="px-4 py-3 text-right">Verification Decision</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    Loading organizations...
                  </td>
                </tr>
              ) : tab === "HOSPITAL" ? (
                hospitals.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                      No hospital organizations registered yet.
                    </td>
                  </tr>
                ) : (
                  hospitals.map((h) => (
                    <tr key={h.id} className="hover:bg-slate-900/60 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-100">{h.name}</div>
                        <div className="text-blue-400 text-[11px] font-mono">Reg: {h.registrationNumber}</div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="text-slate-200">{h.user.fullName}</div>
                        <div className="text-slate-400 text-[11px]">{h.email}</div>
                        <div className="text-slate-500 text-[10px]">{h.phone}</div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="text-slate-200">{h.district}, {h.state}</div>
                        <div className="text-slate-500 text-[11px] truncate max-w-[200px]">{h.address} ({h.pincode})</div>
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                            h.verificationStatus === "VERIFIED"
                              ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                              : h.verificationStatus === "REJECTED"
                              ? "bg-rose-500/15 text-rose-300 border-rose-500/30"
                              : "bg-amber-500/15 text-amber-300 border-amber-500/30"
                          }`}
                        >
                          {h.verificationStatus}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {h.verificationStatus !== "VERIFIED" && (
                            <button
                              onClick={() => handleVerify(h.id, "HOSPITAL", "VERIFIED")}
                              disabled={actionLoading === h.id}
                              className="px-2.5 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[11px] font-semibold border border-emerald-500/40 cursor-pointer disabled:opacity-50"
                            >
                              Verify & Activate
                            </button>
                          )}
                          {h.verificationStatus !== "REJECTED" && (
                            <button
                              onClick={() => handleVerify(h.id, "HOSPITAL", "REJECTED")}
                              disabled={actionLoading === h.id}
                              className="px-2.5 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-[11px] font-semibold border border-rose-500/40 cursor-pointer disabled:opacity-50"
                            >
                              Reject
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )
              ) : bloodBanks.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    No blood bank organizations registered yet.
                  </td>
                </tr>
              ) : (
                bloodBanks.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-900/60 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-100">{b.name}</div>
                      <div className="text-amber-400 text-[11px] font-mono">Lic: {b.registrationNumber}</div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="text-slate-200">{b.user.fullName}</div>
                      <div className="text-slate-400 text-[11px]">{b.email}</div>
                      <div className="text-slate-500 text-[10px]">{b.phone}</div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="text-slate-200">{b.district}, {b.state}</div>
                      <div className="text-slate-500 text-[11px] truncate max-w-[200px]">{b.address} ({b.pincode})</div>
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          b.verificationStatus === "VERIFIED"
                            ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                            : b.verificationStatus === "REJECTED"
                            ? "bg-rose-500/15 text-rose-300 border-rose-500/30"
                            : "bg-amber-500/15 text-amber-300 border-amber-500/30"
                        }`}
                      >
                        {b.verificationStatus}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {b.verificationStatus !== "VERIFIED" && (
                          <button
                            onClick={() => handleVerify(b.id, "BLOOD_BANK", "VERIFIED")}
                            disabled={actionLoading === b.id}
                            className="px-2.5 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[11px] font-semibold border border-emerald-500/40 cursor-pointer disabled:opacity-50"
                          >
                            Verify & Activate
                          </button>
                        )}
                        {b.verificationStatus !== "REJECTED" && (
                          <button
                            onClick={() => handleVerify(b.id, "BLOOD_BANK", "REJECTED")}
                            disabled={actionLoading === b.id}
                            className="px-2.5 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-[11px] font-semibold border border-rose-500/40 cursor-pointer disabled:opacity-50"
                          >
                            Reject
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
