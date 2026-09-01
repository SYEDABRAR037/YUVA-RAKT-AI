"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  MapPin,
  GitPullRequest,
  Plus,
  ArrowRight,
  Sparkles,
  Clock,
  ShieldCheck,
  Building,
} from "lucide-react";

interface HospitalData {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  state: string;
  district: string;
  accountStatus: string;
  hospital: {
    id: string;
    name: string;
    registrationNumber: string;
    address: string;
    city: string | null;
    pincode: string;
    verificationStatus: string;
  } | null;
}

interface RequestSummary {
  totalRequests: number;
  activeRequests: number;
  urgentRequests: number;
  fulfilledRequests: number;
  recentRequests: any[];
}

export default function HospitalDashboardPage() {
  const [data, setData] = useState<HospitalData | null>(null);
  const [summary, setSummary] = useState<RequestSummary>({
    totalRequests: 0,
    activeRequests: 0,
    urgentRequests: 0,
    fulfilledRequests: 0,
    recentRequests: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/auth/me").then((res) => res.json()),
      fetch("/api/hospital/requests").then((res) => res.json()),
    ])
      .then(([userData, reqData]) => {
        if (userData.success && userData.user) {
          setData(userData.user);
        }
        if (reqData.success && reqData.requests) {
          const reqs: any[] = reqData.requests;
          const active = reqs.filter((r) => r.status !== "FULFILLED" && r.status !== "CANCELLED").length;
          const urgent = reqs.filter((r) => ["CRITICAL", "EMERGENCY", "URGENT"].includes(r.urgency) && r.status !== "FULFILLED").length;
          const fulfilled = reqs.filter((r) => r.status === "FULFILLED").length;
          setSummary({
            totalRequests: reqs.length,
            activeRequests: active,
            urgentRequests: urgent,
            fulfilledRequests: fulfilled,
            recentRequests: reqs.slice(0, 5),
          });
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="flex items-center gap-3 text-blue-400">
          <div className="w-5 h-5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          <span className="text-sm font-medium">Loading hospital portal...</span>
        </div>
      </div>
    );
  }

  const hosp = data?.hospital;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900/90 to-blue-950/40 p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
              🏥 Authorized Clinical Facility Portal
            </span>
            <span className="text-xs text-slate-400">• Phase 2 Active</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {hosp?.name || data?.fullName || "Hospital Facility"}
          </h1>
          <p className="text-sm text-slate-400 mt-1 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-blue-400" />
            <span>{hosp?.address || `${data?.district}, ${data?.state}`}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/hospital/requests"
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white text-xs font-bold shadow-lg shadow-blue-600/30 flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Raise Blood Request</span>
          </Link>
        </div>
      </div>

      {/* Real-time Requisition Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase">Active Requests</span>
            <GitPullRequest className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-3xl font-extrabold text-white">{summary.activeRequests}</div>
          <span className="text-[10px] text-blue-400 font-medium">Pending & in-progress</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase">Urgent Priority</span>
            <Clock className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-3xl font-extrabold text-rose-400">{summary.urgentRequests}</div>
          <span className="text-[10px] text-rose-400 font-medium">Emergency/Critical</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase">Fulfilled Requisitions</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold text-white">{summary.fulfilledRequests}</div>
          <span className="text-[10px] text-emerald-400 font-medium">100% Units received</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase">NABH / Reg ID</span>
            <Building className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-sm font-extrabold text-slate-200 truncate mt-1">
            {hosp?.registrationNumber || "LIC-2026"}
          </div>
          <span className="text-[10px] text-emerald-400 font-medium">{hosp?.verificationStatus || "VERIFIED"}</span>
        </div>
      </div>

      {/* Recent Requests Section */}
      <div className="p-6 rounded-3xl bg-slate-900/40 border border-slate-800 mb-8">
        <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span>Recent Blood Requisitions</span>
          </h2>
          <Link href="/hospital/requests" className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1">
            <span>Manage All Requisitions</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {summary.recentRequests.length > 0 ? (
          <div className="divide-y divide-slate-800/60 text-xs">
            {summary.recentRequests.map((r) => (
              <div key={r.id} className="py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-white text-sm">
                    🩸 {r.bloodGroup.replace("_POSITIVE", "+").replace("_NEGATIVE", "-")}
                  </span>
                  <span className="text-slate-400">({r.componentType})</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                    {r.urgency}
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <span className="font-semibold text-slate-200">
                    {r.unitsFulfilled} / {r.unitsRequired} units
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    r.status === "FULFILLED"
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                  }`}>
                    {r.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-slate-500 text-xs">
            No blood requests raised yet. Click &ldquo;Raise Blood Request&rdquo; to broadcast an emergency requirement.
          </div>
        )}
      </div>
    </div>
  );
}
