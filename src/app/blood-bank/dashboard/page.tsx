"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Shield,
  MapPin,
  Package,
  GitPullRequest,
  Heart,
  FileCheck2,
  Clock,
  ArrowRight,
} from "lucide-react";

interface BloodBankData {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  state: string;
  district: string;
  accountStatus: string;
  bloodBank: {
    id: string;
    name: string;
    registrationNumber: string;
    address: string;
    city: string | null;
    pincode: string;
    verificationStatus: string;
  } | null;
}

interface DashboardMetrics {
  totalInventoryUnits: number;
  expiringSoonUnits: number;
  pendingHospitalRequests: number;
  todayDonationsCount: number;
  pendingVerifications: number;
}

export default function BloodBankDashboardPage() {
  const [data, setData] = useState<BloodBankData | null>(null);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalInventoryUnits: 0,
    expiringSoonUnits: 0,
    pendingHospitalRequests: 0,
    todayDonationsCount: 0,
    pendingVerifications: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/auth/me").then((res) => res.json()),
      fetch("/api/blood-bank/inventory").then((res) => res.json()),
      fetch("/api/blood-bank/requests").then((res) => res.json()),
      fetch("/api/blood-bank/donations").then((res) => res.json()),
      fetch("/api/blood-bank/verifications").then((res) => res.json()),
    ])
      .then(([userRes, invRes, reqRes, donRes, verRes]) => {
        if (userRes.success && userRes.user) {
          setData(userRes.user);
        }
        setMetrics({
          totalInventoryUnits: invRes.summary?.totalUnitsAvailable || 0,
          expiringSoonUnits: invRes.summary?.totalExpiringSoon || 0,
          pendingHospitalRequests: (reqRes.requests || []).filter((r: any) => r.status !== "FULFILLED" && r.status !== "CANCELLED").length,
          todayDonationsCount: (donRes.donations || []).length,
          pendingVerifications: (verRes.requests || []).length,
        });
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="flex items-center gap-3 text-amber-400">
          <div className="w-5 h-5 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
          <span className="text-sm font-medium">Loading blood bank centre...</span>
        </div>
      </div>
    );
  }

  const bank = data?.bloodBank;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900/90 to-amber-950/40 p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              🏢 Authorized Blood Centre Operations
            </span>
            <span className="text-xs text-slate-400">• Phase 2 Active</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {bank?.name || data?.fullName || "Blood Centre Facility"}
          </h1>
          <p className="text-sm text-slate-400 mt-1 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-amber-400" />
            <span>{bank?.address || `${data?.district}, ${data?.state}`}</span>
          </p>
        </div>

        <div>
          <span className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 ${
            bank?.verificationStatus === "VERIFIED"
              ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
              : "bg-amber-500/15 text-amber-300 border-amber-500/30"
          }`}>
            <Shield className="w-4 h-4" />
            <span>Drug Control License: {bank?.verificationStatus || "VERIFIED"}</span>
          </span>
        </div>
      </div>

      {/* Real-time KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <Link
          href="/blood-bank/inventory"
          className="p-5 rounded-2xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/40 transition-all group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase">Total Inventory</span>
            <Package className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-400">{metrics.totalInventoryUnits}</div>
          <span className="text-[10px] text-slate-500">Units available across matrix</span>
        </Link>

        <Link
          href="/blood-bank/requests"
          className="p-5 rounded-2xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/40 transition-all group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase">Hospital Requests</span>
            <GitPullRequest className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-3xl font-extrabold text-white">{metrics.pendingHospitalRequests}</div>
          <span className="text-[10px] text-blue-400 font-medium">Awaiting fulfillment</span>
        </Link>

        <Link
          href="/blood-bank/donations"
          className="p-5 rounded-2xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/40 transition-all group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase">Donation Records</span>
            <Heart className="w-4 h-4 text-rose-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-3xl font-extrabold text-rose-400">{metrics.todayDonationsCount}</div>
          <span className="text-[10px] text-slate-500">Voluntary lifesavers logged</span>
        </Link>

        <Link
          href="/blood-bank/verifications"
          className="p-5 rounded-2xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/40 transition-all group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase">Pending Donors</span>
            <FileCheck2 className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-3xl font-extrabold text-amber-400">{metrics.pendingVerifications}</div>
          <span className="text-[10px] text-amber-400/80 font-medium">Require document review</span>
        </Link>
      </div>

      {/* Quick Action Operations Hub */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Link
          href="/blood-bank/inventory"
          className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 hover:border-amber-500/50 transition-all group shadow-lg"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-105 transition-transform">
            <Package className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">Blood Inventory Matrix</h3>
          <p className="text-xs text-slate-400 leading-relaxed mb-4">
            Manage real-time component stock (RBC, Platelets, FFP, Whole Blood) across all 8 blood groups with FIFO dispatch.
          </p>
          <div className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
            <span>Open Inventory Matrix</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        <Link
          href="/blood-bank/requests"
          className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 hover:border-amber-500/50 transition-all group shadow-lg"
        >
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4 group-hover:scale-105 transition-transform">
            <GitPullRequest className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">Hospital Requisitions</h3>
          <p className="text-xs text-slate-400 leading-relaxed mb-4">
            Receive incoming hospital requests, verify stock levels, and execute atomic inventory allocations.
          </p>
          <div className="text-xs text-blue-400 font-semibold flex items-center gap-1">
            <span>Process Requisitions</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        <Link
          href="/blood-bank/donations"
          className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 hover:border-amber-500/50 transition-all group shadow-lg"
        >
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-4 group-hover:scale-105 transition-transform">
            <Heart className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">Record New Donation</h3>
          <p className="text-xs text-slate-400 leading-relaxed mb-4">
            Record voluntary donor contributions, credit inventory units, and issue digital lifesaver certificates.
          </p>
          <div className="text-xs text-rose-400 font-semibold flex items-center gap-1">
            <span>Record Voluntary Donation</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      </div>

      {/* Expiry Warning Notice if applicable */}
      {metrics.expiringSoonUnits > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Clock className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <span>
              <strong>FIFO Priority Alert:</strong> You have <strong>{metrics.expiringSoonUnits} units</strong> expiring within the next 7 days.
            </span>
          </div>
          <Link
            href="/blood-bank/inventory"
            className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-[11px] whitespace-nowrap transition-colors"
          >
            Inspect Batches →
          </Link>
        </div>
      )}
    </div>
  );
}
