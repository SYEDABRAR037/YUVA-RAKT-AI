"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Users, Search, ArrowLeft, RefreshCw, AlertCircle } from "lucide-react";

interface UserItem {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  accountStatus: "ACTIVE" | "PENDING" | "SUSPENDED" | "DEACTIVATED";
  state: string;
  district: string;
  createdAt: string;
  youthDonorProfile?: { bloodGroup: string; verificationStatus: string; availabilityStatus: string } | null;
  hospital?: { name: string; registrationNumber: string; verificationStatus: string } | null;
  bloodBank?: { name: string; registrationNumber: string; verificationStatus: string } | null;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const fetchUsers = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (roleFilter) params.set("role", roleFilter);
    if (statusFilter) params.set("status", statusFilter);

    fetch(`/api/admin/users?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setUsers(data.users);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [search, roleFilter, statusFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleStatusChange = async (userId: string, newStatus: "ACTIVE" | "SUSPENDED") => {
    setActionLoading(userId);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          accountStatus: newStatus,
          reason: `Admin status changed to ${newStatus}`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMsg({ text: `User status changed to ${newStatus}`, type: "success" });
        fetchUsers();
      } else {
        setMsg({ text: data.error || "Failed to update status", type: "error" });
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
            <Users className="w-6 h-6 text-emerald-400" />
            <span>User Management Registry</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Search, filter, view user records, and toggle account states (Suspend / Reactivate).
          </p>
        </div>

        <button
          onClick={fetchUsers}
          className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs font-semibold text-slate-300 flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
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

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800 mb-6">
        <div className="sm:col-span-2 relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchUsers()}
            placeholder="Search by name, email, mobile, district..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="">All Roles</option>
            <option value="YOUTH_DONOR">Youth Donor</option>
            <option value="HOSPITAL">Hospital</option>
            <option value="BLOOD_BANK">Blood Bank</option>
            <option value="GOVERNMENT_OFFICIAL">Govt Official</option>
            <option value="SUPER_ADMIN">Super Admin</option>
          </select>
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="PENDING">PENDING</option>
            <option value="SUSPENDED">SUSPENDED</option>
            <option value="DEACTIVATED">DEACTIVATED</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">User & Contact</th>
                <th className="px-4 py-3">Role & Entity</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Account Status</th>
                <th className="px-4 py-3">Registered</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    Loading users registry...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    No users matching the criteria found.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-900/60 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-100">{u.fullName}</div>
                      <div className="text-slate-400 text-[11px]">{u.email}</div>
                      <div className="text-slate-500 text-[10px]">{u.phone}</div>
                    </td>

                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-200 border border-slate-700">
                        {u.role}
                      </span>
                      {u.youthDonorProfile?.bloodGroup && (
                        <div className="text-rose-400 text-[11px] mt-1 font-medium">
                          Blood: {u.youthDonorProfile.bloodGroup.replace("_POSITIVE", "+").replace("_NEGATIVE", "-")}
                        </div>
                      )}
                      {u.hospital && (
                        <div className="text-blue-300 text-[11px] mt-1 font-medium truncate max-w-[160px]">
                          {u.hospital.name}
                        </div>
                      )}
                      {u.bloodBank && (
                        <div className="text-amber-300 text-[11px] mt-1 font-medium truncate max-w-[160px]">
                          {u.bloodBank.name}
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <div className="text-slate-200">{u.district}</div>
                      <div className="text-slate-500 text-[11px]">{u.state}</div>
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          u.accountStatus === "ACTIVE"
                            ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                            : u.accountStatus === "SUSPENDED"
                            ? "bg-rose-500/15 text-rose-300 border-rose-500/30"
                            : "bg-amber-500/15 text-amber-300 border-amber-500/30"
                        }`}
                      >
                        {u.accountStatus}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-slate-500 text-[11px] whitespace-nowrap">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>

                    <td className="px-4 py-3 text-right">
                      {u.role !== "SUPER_ADMIN" ? (
                        u.accountStatus === "SUSPENDED" ? (
                          <button
                            onClick={() => handleStatusChange(u.id, "ACTIVE")}
                            disabled={actionLoading === u.id}
                            className="px-2.5 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[11px] font-semibold border border-emerald-500/40 cursor-pointer disabled:opacity-50"
                          >
                            Reactivate
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStatusChange(u.id, "SUSPENDED")}
                            disabled={actionLoading === u.id}
                            className="px-2.5 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-[11px] font-semibold border border-rose-500/40 cursor-pointer disabled:opacity-50"
                          >
                            Suspend
                          </button>
                        )
                      ) : (
                        <span className="text-[10px] text-slate-500">Protected</span>
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
  );
}
