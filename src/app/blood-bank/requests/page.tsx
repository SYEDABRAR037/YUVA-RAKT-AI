"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  GitPullRequest,
  ArrowLeft,
  RefreshCw,
  CheckCircle2,
  Clock,
  Building,
  Package,
} from "lucide-react";

interface RequestItem {
  id: string;
  bloodGroup: string;
  componentType: string;
  unitsRequired: number;
  unitsFulfilled: number;
  urgency: "ROUTINE" | "URGENT" | "CRITICAL" | "EMERGENCY";
  status: "PENDING" | "ACKNOWLEDGED" | "MATCHING" | "PARTIALLY_FULFILLED" | "FULFILLED" | "CANCELLED" | "EXPIRED";
  requiredBy: string;
  reason?: string;
  hospital: {
    name: string;
    district: string;
    state: string;
    phone: string;
  };
}

export default function BloodBankRequestsPage() {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<RequestItem | null>(null);

  // Allocation Modal State
  const [allocateUnits, setAllocateUnits] = useState(1);
  const [allocateNotes, setAllocateNotes] = useState("");
  const [allocating, setAllocating] = useState(false);
  const [msg, setMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const fetchRequests = () => {
    setLoading(true);
    fetch("/api/blood-bank/requests")
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
    fetchRequests();
  }, []);

  const handleAcknowledge = async (requestId: string) => {
    try {
      const res = await fetch("/api/blood-bank/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId }),
      });
      const data = await res.json();
      if (data.success) {
        setMsg({ text: "Hospital blood request acknowledged!", type: "success" });
        fetchRequests();
      } else {
        setMsg({ text: data.error || "Failed to acknowledge request", type: "error" });
      }
    } catch (err) {
      console.error(err);
      setMsg({ text: "Network error occurred", type: "error" });
    }
  };

  const handleAllocate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;

    setAllocating(true);
    setMsg(null);

    try {
      const res = await fetch("/api/blood-bank/allocate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: selectedRequest.id,
          bloodGroup: selectedRequest.bloodGroup,
          componentType: selectedRequest.componentType,
          unitsAllocated: Number(allocateUnits),
          notes: allocateNotes || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setMsg({ text: data.message || "Blood units allocated successfully!", type: "success" });
        setSelectedRequest(null);
        fetchRequests();
        setAllocateNotes("");
      } else {
        setMsg({ text: data.error || "Failed to allocate units", type: "error" });
      }
    } catch (err) {
      console.error(err);
      setMsg({ text: "Network error occurred", type: "error" });
    } finally {
      setAllocating(false);
    }
  };

  const getUrgencyBadge = (u: string) => {
    switch (u) {
      case "EMERGENCY":
        return "bg-rose-950 text-rose-100 border-2 border-rose-500 font-black shadow-lg shadow-rose-950/50 animate-pulse";
      case "CRITICAL":
        return "bg-orange-950 text-orange-100 border-2 border-orange-500 font-black shadow-md";
      case "URGENT":
        return "bg-amber-950 text-amber-100 border-2 border-amber-500 font-black shadow-md";
      default:
        return "bg-blue-950 text-blue-100 border-2 border-blue-500 font-bold";
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
              <span>Back to Blood Centre Dashboard</span>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-3">
              <GitPullRequest className="w-7 h-7 text-amber-400" />
              <span>Regional Hospital Blood Requisitions</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-medium mt-1">
              Prioritized by emergency severity. Review hospital requirements, acknowledge incoming orders, and allocate verified inventory.
            </p>
          </div>

          <button
            onClick={fetchRequests}
            className="px-4 py-2.5 rounded-xl bg-slate-900 border-2 border-slate-700 hover:bg-slate-800 text-xs font-bold text-white flex items-center gap-2 cursor-pointer self-start sm:self-auto shadow-lg transition-all"
          >
            <RefreshCw className="w-4 h-4 text-amber-400" />
            <span>Refresh Table</span>
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

        {/* High Contrast Requests Table */}
        <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 border-b-2 border-slate-700 text-slate-200 font-black uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-5 py-4">Hospital Facility</th>
                  <th className="px-5 py-4">Blood & Component</th>
                  <th className="px-5 py-4">Fulfillment</th>
                  <th className="px-5 py-4">Urgency & Required By</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center text-slate-400 font-bold text-sm">
                      Loading incoming hospital requisitions...
                    </td>
                  </tr>
                ) : requests.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center text-slate-300 font-semibold text-sm">
                      No active hospital requisitions in your district currently.
                    </td>
                  </tr>
                ) : (
                  requests.map((r) => {
                    const bloodLabel = r.bloodGroup.replace("_POSITIVE", "+").replace("_NEGATIVE", "-");
                    const needed = r.unitsRequired - r.unitsFulfilled;
                    const isFulfilled = r.status === "FULFILLED";

                    return (
                      <tr key={r.id} className="hover:bg-slate-800/80 transition-colors">
                        <td className="px-5 py-4">
                          <div className="font-extrabold text-white text-sm">{r.hospital.name}</div>
                          <div className="text-slate-300 text-xs flex items-center gap-1.5 mt-1 font-medium">
                            <Building className="w-3.5 h-3.5 text-amber-400" />
                            <span>{r.hospital.district}, {r.hospital.state}</span>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="font-black text-rose-400 text-base">
                            🩸 {bloodLabel}
                          </div>
                          <div className="text-xs text-cyan-300 font-bold bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/40 inline-block mt-1">
                            {r.componentType}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="font-extrabold text-white text-sm">
                            {r.unitsFulfilled} / {r.unitsRequired} Units
                          </div>
                          <span className={`text-xs font-bold block mt-1 ${needed > 0 ? "text-amber-300" : "text-emerald-400"}`}>
                            {needed > 0 ? `${needed} more needed` : "✓ Completed"}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span className={`px-3 py-1 rounded-full text-[11px] uppercase tracking-wide inline-block ${getUrgencyBadge(r.urgency)}`}>
                            {r.urgency}
                          </span>
                          <div className="text-slate-200 text-xs font-semibold flex items-center gap-1.5 mt-1.5">
                            <Clock className="w-3.5 h-3.5 text-cyan-400" />
                            <span>{new Date(r.requiredBy).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span className="px-3 py-1 rounded-full text-xs font-black bg-slate-950 text-amber-300 border-2 border-amber-400">
                            {r.status}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {r.status === "PENDING" && (
                              <button
                                onClick={() => handleAcknowledge(r.id)}
                                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md cursor-pointer transition-all"
                              >
                                Acknowledge
                              </button>
                            )}

                            {!isFulfilled && r.status !== "CANCELLED" && (
                              <button
                                onClick={() => {
                                  setSelectedRequest(r);
                                  setAllocateUnits(Math.min(needed, 2));
                                }}
                                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white text-xs font-black shadow-lg shadow-amber-600/30 cursor-pointer flex items-center gap-1.5 transition-all"
                              >
                                <Package className="w-4 h-4" />
                                <span>Allocate Units</span>
                              </button>
                            )}
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

        {/* ALLOCATE UNITS MODAL */}
        {selectedRequest && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative my-8">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
                <div>
                  <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                    <Package className="w-6 h-6 text-amber-400" />
                    <span>Allocate Blood to Requisition</span>
                  </h2>
                  <p className="text-xs text-slate-300 font-medium mt-1">{selectedRequest.hospital.name}</p>
                </div>
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="p-2 rounded-xl text-slate-300 hover:text-white text-base font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAllocate} className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-bold">Target Blood Group:</span>
                    <span className="font-black text-rose-400 text-sm">
                      {selectedRequest.bloodGroup.replace("_POSITIVE", "+").replace("_NEGATIVE", "-")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-bold">Component Type:</span>
                    <span className="font-bold text-cyan-300">{selectedRequest.componentType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-bold">Remaining Needed:</span>
                    <span className="font-black text-amber-300 text-sm">
                      {selectedRequest.unitsRequired - selectedRequest.unitsFulfilled} Units
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1.5">
                    Units to Allocate from Blood Bank
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={selectedRequest.unitsRequired - selectedRequest.unitsFulfilled}
                    required
                    value={allocateUnits}
                    onChange={(e) => setAllocateUnits(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border-2 border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1.5">Dispatch / Courier Notes</label>
                  <input
                    type="text"
                    value={allocateNotes}
                    onChange={(e) => setAllocateNotes(e.target.value)}
                    placeholder="e.g. Dispatched via refrigerated vehicle, batch #2026-09"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border-2 border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-amber-500 placeholder-slate-500"
                  />
                </div>

                <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setSelectedRequest(null)}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={allocating}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white text-xs font-black shadow-xl shadow-amber-600/40 transition-all disabled:opacity-50"
                  >
                    {allocating ? "Processing Allocation..." : "Confirm & Dispatch Allocation"}
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
