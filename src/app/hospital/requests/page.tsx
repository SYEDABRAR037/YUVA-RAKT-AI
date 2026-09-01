"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  GitPullRequest,
  Plus,
  ArrowLeft,
  RefreshCw,
  CheckCircle2,
  Clock,
  Building2,
  XCircle,
  Eye,
  Truck,
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
  patientAgeGroup?: string;
  createdAt: string;
  allocations?: Array<{
    id: string;
    unitsAllocated: number;
    allocatedAt: string;
    bloodBank: {
      name: string;
      district: string;
    };
  }>;
  ambulanceMissions?: Array<{
    id: string;
    status: string;
    ambulance: {
      displayName: string;
      vehicleNumber: string;
    };
  }>;
}

export default function HospitalRequestsPage() {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<RequestItem | null>(null);

  // Form State
  const [bloodGroup, setBloodGroup] = useState("O_POSITIVE");
  const [componentType, setComponentType] = useState("RBC");
  const [unitsRequired, setUnitsRequired] = useState(2);
  const [urgency, setUrgency] = useState<"ROUTINE" | "URGENT" | "CRITICAL" | "EMERGENCY">("URGENT");
  const [requiredBy, setRequiredBy] = useState(() => {
    const d = new Date();
    d.setHours(d.getHours() + 6);
    return d.toISOString().slice(0, 16);
  });
  const [reason, setReason] = useState("");
  const [patientAgeGroup, setPatientAgeGroup] = useState<"ADULT" | "PEDIATRIC" | "GERIATRIC">("ADULT");
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const fetchRequests = () => {
    setLoading(true);
    fetch("/api/hospital/requests")
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

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMsg(null);

    try {
      const res = await fetch("/api/hospital/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bloodGroup,
          componentType,
          unitsRequired: Number(unitsRequired),
          urgency,
          requiredBy: new Date(requiredBy).toISOString(),
          reason: reason || undefined,
          patientAgeGroup,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setMsg({ text: data.message || "Blood request created successfully!", type: "success" });
        setShowCreateModal(false);
        fetchRequests();
        setReason("");
      } else {
        setMsg({ text: data.error || "Failed to create request", type: "error" });
      }
    } catch (err) {
      console.error(err);
      setMsg({ text: "Network error occurred", type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    if (!confirm("Are you sure you want to cancel this blood requisition?")) return;

    try {
      const res = await fetch(`/api/hospital/requests/${requestId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setMsg({ text: "Request cancelled successfully", type: "success" });
        fetchRequests();
      } else {
        setMsg({ text: data.error || "Failed to cancel request", type: "error" });
      }
    } catch (err) {
      console.error(err);
      setMsg({ text: "Network error occurred", type: "error" });
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

  const getStatusBadge = (s: string) => {
    switch (s) {
      case "FULFILLED":
        return "bg-emerald-950 text-emerald-100 border-2 border-emerald-400 font-black";
      case "PARTIALLY_FULFILLED":
        return "bg-cyan-950 text-cyan-100 border-2 border-cyan-400 font-black";
      case "ACKNOWLEDGED":
        return "bg-blue-950 text-blue-100 border-2 border-blue-400 font-black";
      case "CANCELLED":
        return "bg-slate-900 text-slate-400 border-2 border-slate-700 font-bold";
      default:
        return "bg-slate-900 text-amber-300 border-2 border-amber-400 font-black";
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-800">
          <div>
            <Link href="/hospital/dashboard" className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1.5 mb-2">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Hospital Dashboard</span>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-3">
              <GitPullRequest className="w-7 h-7 text-blue-400" />
              <span>Hospital Blood Requisition Management</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-medium mt-1">
              Raise urgent clinical blood & component requisitions, monitor live blood bank allocations, and track real-time ambulance transport.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchRequests}
              className="px-4 py-2.5 rounded-xl bg-slate-900 border-2 border-slate-700 hover:bg-slate-800 text-xs font-bold text-white flex items-center gap-2 cursor-pointer shadow-lg transition-all"
            >
              <RefreshCw className="w-4 h-4 text-blue-400" />
              <span>Refresh Table</span>
            </button>

            <button
              onClick={() => setShowCreateModal(true)}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white text-xs font-black shadow-xl shadow-blue-600/40 flex items-center gap-2 cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Create Blood Request</span>
            </button>
          </div>
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

        {/* High-Contrast Requests Table */}
        <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 border-b-2 border-slate-700 text-slate-200 font-black uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-5 py-4">Blood & Component</th>
                  <th className="px-5 py-4">Units & Fulfillment</th>
                  <th className="px-5 py-4">Urgency & Priority</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Required By</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center text-slate-400 font-bold text-sm">
                      Loading hospital requests...
                    </td>
                  </tr>
                ) : requests.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center text-slate-300 font-semibold text-sm">
                      No blood requests created yet. Click &ldquo;Create Blood Request&rdquo; to raise a requisition.
                    </td>
                  </tr>
                ) : (
                  requests.map((r) => {
                    const percent = Math.min(100, Math.round((r.unitsFulfilled / r.unitsRequired) * 100));
                    const bloodLabel = r.bloodGroup.replace("_POSITIVE", "+").replace("_NEGATIVE", "-");
                    return (
                      <tr key={r.id} className="hover:bg-slate-800/80 transition-colors">
                        <td className="px-5 py-4">
                          <div className="font-black text-white text-base flex items-center gap-2">
                            <span className="text-rose-400">🩸 {bloodLabel}</span>
                            <span className="text-xs text-cyan-300 font-bold bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/40">
                              {r.componentType}
                            </span>
                          </div>
                          {r.reason && (
                            <div className="text-slate-300 text-xs font-medium mt-1 truncate max-w-[260px]">
                              {r.reason}
                            </div>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <div className="font-extrabold text-white text-sm">
                            {r.unitsFulfilled} / {r.unitsRequired} Units
                          </div>
                          <div className="w-32 bg-slate-950 h-2 rounded-full mt-2 border border-slate-700 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                percent === 100 ? "bg-emerald-400" : "bg-blue-500"
                              }`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span className={`px-3 py-1 rounded-full text-[11px] uppercase tracking-wide inline-block ${getUrgencyBadge(r.urgency)}`}>
                            {r.urgency}
                          </span>
                          {r.patientAgeGroup && (
                            <span className="text-slate-300 font-semibold text-[11px] block mt-1">
                              Age: {r.patientAgeGroup}
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <span className={`px-3 py-1 rounded-full text-[11px] uppercase tracking-wide inline-block ${getStatusBadge(r.status)}`}>
                            {r.status}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-slate-200 text-xs font-semibold whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-cyan-400" />
                            <span>{new Date(r.requiredBy).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}</span>
                          </div>
                        </td>

                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {r.ambulanceMissions && r.ambulanceMissions.length > 0 && (
                              <Link
                                href={`/track/ambulance/${r.ambulanceMissions[0].id}`}
                                className="px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-extrabold text-xs shadow-lg shadow-cyan-600/30 flex items-center gap-1.5 transition-all animate-pulse"
                                title="Live GPS Tracking"
                              >
                                <Truck className="w-4 h-4" />
                                <span>Track Delivery</span>
                              </Link>
                            )}
                            <button
                              onClick={() => setSelectedRequest(r)}
                              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 transition-colors cursor-pointer"
                              title="View Details & Allocations"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {r.status !== "FULFILLED" && r.status !== "CANCELLED" && (
                              <button
                                onClick={() => handleCancelRequest(r.id)}
                                className="p-2 rounded-xl bg-rose-950 hover:bg-rose-900 text-rose-200 border border-rose-500 transition-colors cursor-pointer"
                                title="Cancel Request"
                              >
                                <XCircle className="w-4 h-4" />
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

        {/* CREATE BLOOD REQUEST MODAL */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative my-8">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
                <div>
                  <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                    <Plus className="w-6 h-6 text-blue-400 stroke-[3]" />
                    <span>Raise Blood Requisition</span>
                  </h2>
                  <p className="text-xs text-slate-300 font-medium mt-1">
                    Broadcast requirement to district blood banks and candidate voluntary donors.
                  </p>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 text-base font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateRequest} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-200 mb-1.5">Blood Group</label>
                    <select
                      value={bloodGroup}
                      onChange={(e) => setBloodGroup(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border-2 border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="O_POSITIVE">O+ (O Positive)</option>
                      <option value="O_NEGATIVE">O- (O Negative)</option>
                      <option value="A_POSITIVE">A+ (A Positive)</option>
                      <option value="A_NEGATIVE">A- (A Negative)</option>
                      <option value="B_POSITIVE">B+ (B Positive)</option>
                      <option value="B_NEGATIVE">B- (B Negative)</option>
                      <option value="AB_POSITIVE">AB+ (AB Positive)</option>
                      <option value="AB_NEGATIVE">AB- (AB Negative)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-200 mb-1.5">Component Type</label>
                    <select
                      value={componentType}
                      onChange={(e) => setComponentType(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border-2 border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="RBC">RBC (Packed Red Cells)</option>
                      <option value="WHOLE_BLOOD">Whole Blood</option>
                      <option value="PLATELETS">Platelets (RDP / SDP)</option>
                      <option value="PLASMA">Plasma (FFP)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-200 mb-1.5">Units Required</label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      required
                      value={unitsRequired}
                      onChange={(e) => setUnitsRequired(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border-2 border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-200 mb-1.5">Urgency Level</label>
                    <select
                      value={urgency}
                      onChange={(e) => setUrgency(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border-2 border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="EMERGENCY">EMERGENCY (Immediate &lt; 2 hrs)</option>
                      <option value="CRITICAL">CRITICAL (&lt; 6 hrs)</option>
                      <option value="URGENT">URGENT (&lt; 24 hrs)</option>
                      <option value="ROUTINE">ROUTINE (Planned surgery)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1.5">Required By (Date & Time)</label>
                  <input
                    type="datetime-local"
                    required
                    value={requiredBy}
                    onChange={(e) => setRequiredBy(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border-2 border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-200 mb-1.5">Patient Age Group</label>
                    <select
                      value={patientAgeGroup}
                      onChange={(e) => setPatientAgeGroup(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border-2 border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="ADULT">Adult</option>
                      <option value="PEDIATRIC">Pediatric</option>
                      <option value="GERIATRIC">Geriatric</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-200 mb-1.5">Clinical Reason / Diagnosis</label>
                    <input
                      type="text"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="e.g. Major surgery, trauma, oncology"
                      className="w-full px-3.5 py-2.5 bg-slate-950 border-2 border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-blue-500 placeholder-slate-500"
                    />
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white text-xs font-black shadow-xl shadow-blue-600/40 transition-all disabled:opacity-50"
                  >
                    {submitting ? "Broadcasting..." : "Broadcast Requisition"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* REQUEST DETAILS MODAL */}
        {selectedRequest && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative my-8">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-lg font-black text-white">Requisition #{selectedRequest.id.slice(-8)}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-black border mt-1.5 inline-block ${getUrgencyBadge(selectedRequest.urgency)}`}>
                    {selectedRequest.urgency}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="p-2 rounded-xl text-slate-300 hover:text-white text-base font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-950 border border-slate-800">
                  <div>
                    <span className="text-slate-400 font-bold block mb-1">Requested Blood</span>
                    <span className="font-black text-rose-400 text-base">
                      {selectedRequest.bloodGroup.replace("_POSITIVE", "+").replace("_NEGATIVE", "-")} ({selectedRequest.componentType})
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block mb-1">Fulfillment</span>
                    <span className="font-black text-white text-base">
                      {selectedRequest.unitsFulfilled} / {selectedRequest.unitsRequired} Units
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="font-black text-white text-sm mb-3 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-blue-400" />
                    <span>Blood Bank Allocations ({selectedRequest.allocations?.length || 0})</span>
                  </h4>

                  {selectedRequest.allocations && selectedRequest.allocations.length > 0 ? (
                    <div className="space-y-2">
                      {selectedRequest.allocations.map((a) => (
                        <div key={a.id} className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                          <div>
                            <div className="font-bold text-white text-xs">{a.bloodBank.name}</div>
                            <div className="text-slate-400 text-[11px] font-semibold">{a.bloodBank.district} • {new Date(a.allocatedAt).toLocaleString()}</div>
                          </div>
                          <span className="px-3 py-1 rounded-xl bg-emerald-950 text-emerald-200 font-black border border-emerald-500">
                            +{a.unitsAllocated} units
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 text-center text-slate-400 font-semibold">
                      Awaiting allocation by district blood banks.
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800 text-right">
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white border border-slate-600"
                >
                  Close Details
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
