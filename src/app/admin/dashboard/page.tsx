"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  Heart,
  Hospital,
  Building2,
  Activity,
  ArrowRight,
  ShieldAlert,
  FileText,
  CheckCircle2,
  GitPullRequest,
  Package,
} from "lucide-react";

interface AdminStatsData {
  stats: {
    totalUsers: number;
    youthDonors: number;
    hospitals: number;
    bloodBanks: number;
    activeUsers: number;
    pendingVerifications: number;
    verifiedDonors: number;
    totalBloodRequests: number;
    fulfilledBloodRequests: number;
    urgentRequests: number;
    totalDonations: number;
    totalInventoryUnits: number;
  };
  recentAuditLogs: Array<{
    id: string;
    action: string;
    entityType: string;
    createdAt: string;
    user?: {
      fullName: string;
      email: string;
      role: string;
    } | null;
  }>;
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<AdminStatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((res) => res.json())
      .then((resData) => {
        if (resData.success) {
          setData(resData);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="flex items-center gap-3 text-emerald-400">
          <div className="w-5 h-5 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
          <span className="text-sm font-medium">Loading platform statistics...</span>
        </div>
      </div>
    );
  }

  const s = data?.stats;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900/90 to-emerald-950/40 p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              🛡️ Super Administrator Control Center
            </span>
            <span className="text-xs text-slate-400">• Phase 2 Active</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Platform Operations & Blood Workflow Intelligence
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time live PostgreSQL database statistics, blood inventory, hospital requisitions, and audit control across India.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/users"
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all flex items-center gap-1.5 border border-slate-700"
          >
            <Users className="w-3.5 h-3.5 text-emerald-400" />
            <span>Manage Users</span>
          </Link>
          <Link
            href="/admin/organizations"
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all flex items-center gap-1.5 border border-slate-700"
          >
            <Building2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Organizations</span>
          </Link>
        </div>
      </div>

      {/* PHASE 2 REAL DATABASE BLOOD WORKFLOW METRICS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase">Total Requests</span>
            <GitPullRequest className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">{s?.totalBloodRequests ?? 0}</div>
          <span className="text-[10px] text-blue-400 font-medium">Hospital requisitions</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase">Fulfilled</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-400">{s?.fulfilledBloodRequests ?? 0}</div>
          <span className="text-[10px] text-emerald-400 font-medium">100% Units dispatched</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase">Urgent Active</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-extrabold text-rose-400">{s?.urgentRequests ?? 0}</div>
          <span className="text-[10px] text-rose-400 font-medium">Emergency priority</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase">Total Donations</span>
            <Heart className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">{s?.totalDonations ?? 0}</div>
          <span className="text-[10px] text-rose-400 font-medium">Completed records</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase">National Stock</span>
            <Package className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-amber-400">{s?.totalInventoryUnits ?? 0}</div>
          <span className="text-[10px] text-slate-500">Unexpired units available</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase">Verified Donors</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">{s?.verifiedDonors ?? 0}</div>
          <span className="text-[10px] text-emerald-400 font-medium">Clinical verified</span>
        </div>
      </div>

      {/* USER & ORGANIZATIONS BASELINE METRICS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800">
          <span className="text-xs text-slate-400 block mb-1">Total Registered Users</span>
          <span className="text-xl font-bold text-white">{s?.totalUsers ?? 0}</span>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800">
          <span className="text-xs text-slate-400 block mb-1">Youth Donors Pool</span>
          <span className="text-xl font-bold text-slate-200">{s?.youthDonors ?? 0}</span>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800">
          <span className="text-xs text-slate-400 block mb-1">Hospitals Connected</span>
          <span className="text-xl font-bold text-blue-400">{s?.hospitals ?? 0}</span>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800">
          <span className="text-xs text-slate-400 block mb-1">Blood Centres Connected</span>
          <span className="text-xl font-bold text-amber-400">{s?.bloodBanks ?? 0}</span>
        </div>
      </div>

      {/* Quick Navigation Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Link
          href="/admin/users"
          className="p-6 rounded-2xl bg-slate-900/50 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/40 transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3 group-hover:scale-105 transition-transform">
            <Users className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">User Management</h3>
          <p className="text-xs text-slate-400 leading-relaxed mb-4">
            Search, filter, view user roles, inspect geographic distribution, and manage account statuses (suspend / reactivate).
          </p>
          <div className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
            <span>Explore user registry</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        <Link
          href="/admin/organizations"
          className="p-6 rounded-2xl bg-slate-900/50 hover:bg-slate-900 border border-slate-800 hover:border-blue-500/40 transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-3 group-hover:scale-105 transition-transform">
            <Hospital className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">Organization Verification</h3>
          <p className="text-xs text-slate-400 leading-relaxed mb-4">
            Verify or reject healthcare licenses, state drug control registrations, and monitor hospital/blood bank onboarding.
          </p>
          <div className="text-xs text-blue-400 font-semibold flex items-center gap-1">
            <span>Review organizations</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        <Link
          href="/admin/audit-logs"
          className="p-6 rounded-2xl bg-slate-900/50 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/40 transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-3 group-hover:scale-105 transition-transform">
            <FileText className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">Security Audit Trail</h3>
          <p className="text-xs text-slate-400 leading-relaxed mb-4">
            Inspect immutable audit logs for logins, logouts, role changes, profile updates, inventory allocations, and donor verifications.
          </p>
          <div className="text-xs text-amber-400 font-semibold flex items-center gap-1">
            <span>View audit logs</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      </div>

      {/* Live Recent Audit Activity Feed */}
      <div className="p-6 rounded-3xl bg-slate-900/40 border border-slate-800">
        <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-white">Live Platform Audit Feed</h2>
          </div>
          <Link href="/admin/audit-logs" className="text-xs text-emerald-400 hover:text-emerald-300 font-medium">
            View All Logs →
          </Link>
        </div>

        <div className="divide-y divide-slate-800/60 text-xs">
          {data?.recentAuditLogs && data.recentAuditLogs.length > 0 ? (
            data.recentAuditLogs.map((log) => (
              <div key={log.id} className="py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-200 border border-slate-700">
                    {log.action}
                  </span>
                  <span className="text-slate-300 font-medium">
                    {log.user ? `${log.user.fullName} (${log.user.email})` : "System / Anonymous"}
                  </span>
                  <span className="text-slate-500 hidden sm:inline">• {log.entityType}</span>
                </div>
                <span className="text-slate-500 text-[11px] whitespace-nowrap">
                  {new Date(log.createdAt).toLocaleString()}
                </span>
              </div>
            ))
          ) : (
            <div className="py-6 text-center text-slate-500">No audit events recorded yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}
