"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { FileText, Search, ArrowLeft, RefreshCw } from "lucide-react";

interface AuditLogItem {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: Record<string, any> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  user?: {
    id: string;
    fullName: string;
    email: string;
    role: string;
  } | null;
}

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [entityFilter, setEntityFilter] = useState("");

  const fetchLogs = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (actionFilter) params.set("action", actionFilter);
    if (entityFilter) params.set("entityType", entityFilter);

    fetch(`/api/admin/audit-logs?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setLogs(data.logs || []);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [search, actionFilter, entityFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-800">
          <div>
            <Link href="/admin/dashboard" className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1.5 mb-2">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Super Admin Dashboard</span>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-3">
              <FileText className="w-7 h-7 text-amber-400" />
              <span>Immutable Security Audit Log Trail</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-medium mt-1">
              Cryptographic and timestamped records of all logins, logouts, role actions, profile changes, and verifications.
            </p>
          </div>

          <button
            onClick={fetchLogs}
            className="px-4 py-2.5 rounded-xl bg-slate-900 border-2 border-slate-700 hover:bg-slate-800 text-xs font-bold text-white flex items-center gap-2 self-start sm:self-auto cursor-pointer shadow-lg transition-all"
          >
            <RefreshCw className="w-4 h-4 text-amber-400" />
            <span>Refresh Trail</span>
          </button>
        </div>

        {/* Filter and Search Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-900 p-4 rounded-3xl border-2 border-slate-700 mb-6 shadow-xl">
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchLogs()}
              placeholder="Search by user, action, entity, email..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border-2 border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-amber-500 placeholder-slate-500"
            />
          </div>

          <div>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border-2 border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-amber-500"
            >
              <option value="">All Actions</option>
              <option value="REGISTER">REGISTER</option>
              <option value="LOGIN">LOGIN</option>
              <option value="LOGOUT">LOGOUT</option>
              <option value="PROFILE_UPDATE">PROFILE_UPDATE</option>
              <option value="ACCOUNT_STATUS_CHANGE">ACCOUNT_STATUS_CHANGE</option>
              <option value="ORGANIZATION_VERIFIED">ORGANIZATION_VERIFIED</option>
              <option value="CONSENT_UPDATED">CONSENT_UPDATED</option>
              <option value="PASSWORD_RESET_REQUEST">PASSWORD_RESET_REQUEST</option>
              <option value="PASSWORD_RESET_SUCCESS">PASSWORD_RESET_SUCCESS</option>
            </select>
          </div>

          <div>
            <select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border-2 border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-amber-500"
            >
              <option value="">All Entity Types</option>
              <option value="USER">USER</option>
              <option value="DONOR_PROFILE">DONOR_PROFILE</option>
              <option value="HOSPITAL">HOSPITAL</option>
              <option value="BLOOD_BANK">BLOOD_BANK</option>
              <option value="CONSENT">CONSENT</option>
              <option value="SECURITY">SECURITY</option>
            </select>
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 border-b-2 border-slate-700 text-slate-200 font-black uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-5 py-4">Timestamp</th>
                  <th className="px-5 py-4">Action</th>
                  <th className="px-5 py-4">User / Actor</th>
                  <th className="px-5 py-4">Entity Type & ID</th>
                  <th className="px-5 py-4">Metadata Context</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono text-xs">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-16 text-center text-slate-400 font-sans font-bold">
                      Loading audit trail...
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-16 text-center text-slate-300 font-sans font-semibold">
                      No audit records matching the search query found.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/80 transition-colors">
                      <td className="px-5 py-4 text-slate-300 font-semibold whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>

                      <td className="px-5 py-4">
                        <span className="px-3 py-1 rounded-full text-xs font-black bg-slate-950 text-amber-300 border-2 border-amber-400">
                          {log.action}
                        </span>
                      </td>

                      <td className="px-5 py-4 font-sans">
                        {log.user ? (
                          <div>
                            <div className="font-extrabold text-white text-xs">{log.user.fullName}</div>
                            <div className="text-[11px] text-slate-300 font-medium">{log.user.email} ({log.user.role})</div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic font-semibold">System / Automated</span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <span className="text-white font-bold">{log.entityType}</span>
                        {log.entityId && (
                          <div className="text-[11px] text-cyan-400 font-mono font-semibold truncate max-w-[140px] mt-0.5">
                            ID: {log.entityId}
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-4 text-xs text-slate-200">
                        {log.metadata ? (
                          <pre className="bg-slate-950 p-2.5 rounded-xl border border-slate-700 overflow-x-auto max-w-[320px] text-slate-200 font-bold">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        ) : (
                          <span className="text-slate-500 font-bold">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
