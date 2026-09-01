"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  AlertOctagon,
  CheckCircle2,
  Clock,
  MapPin,
  RefreshCw,
  Send,
  ShieldAlert,
  TrendingUp,
  UserCheck,
  Zap,
} from "lucide-react";
import { formatBloodGroup, formatComponentType } from "@/lib/utils";

interface EmergencyItem {
  id: string;
  bloodGroup: string;
  componentType: string;
  unitsRequired: number;
  unitsFulfilled: number;
  urgency: string;
  reason: string;
  status: string;
  createdAt: string;
  hospital: {
    name: string;
    district: string;
    state: string;
    phone: string;
  };
  allocations: { unitsAllocated: number; allocatedAt: string }[];
  donorResponses: { id: string; status: string; createdAt: string }[];
  escalations: { id: string; escalationLevel: string; reason: string; status: string }[];
}

interface ResponseMetrics {
  state: string;
  district: string;
  avgAckTimeMinutes: number;
  avgDonorResponseTimeMinutes: number;
  avgFulfillmentTimeMinutes: number;
  unresolvedEmergencyCount: number;
  donorResponseRatePct: number;
  districtResponseScore: number;
}

export default function GovernmentEmergencyRadarPage() {
  const [emergencies, setEmergencies] = useState<EmergencyItem[]>([]);
  const [metrics, setMetrics] = useState<ResponseMetrics | null>(null);
  const [selectedState, setSelectedState] = useState("Maharashtra");
  const [selectedDistrict, setSelectedDistrict] = useState("Pune");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedReq, setSelectedReq] = useState<EmergencyItem | null>(null);
  const [rankedDonors, setRankedDonors] = useState<any[]>([]);
  const [loadingDonors, setLoadingDonors] = useState(false);

  const fetchRadarData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/emergency/radar?state=${selectedState}&district=${selectedDistrict}`);
      const data = await res.json();
      if (data.success) {
        setEmergencies(data.data.emergencies || []);
        setMetrics(data.data.metrics || null);
        if (data.data.emergencies.length > 0 && !selectedReq) {
          handleSelectRequest(data.data.emergencies[0]);
        }
      }
    } catch (err) {
      console.error("Failed to load emergency radar data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRequest = async (req: EmergencyItem) => {
    setSelectedReq(req);
    try {
      setLoadingDonors(true);
      const res = await fetch(`/api/ai/donor-priority?requestId=${req.id}`);
      const data = await res.json();
      if (data.success) {
        setRankedDonors(data.data.rankedDonors || []);
      }
    } catch (err) {
      console.error("Failed to load ranked donors", err);
    } finally {
      setLoadingDonors(false);
    }
  };

  const handleTriggerMobilize = async (requestId: string) => {
    try {
      setActionLoading(requestId);
      const res = await fetch("/api/emergency/mobilize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMessage(data.message);
        setTimeout(() => setSuccessMessage(null), 5000);
        fetchRadarData();
      }
    } catch (err) {
      console.error("Failed to mobilize emergency", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleEscalate = async (requestId: string, level: string) => {
    try {
      setActionLoading(`esc-${requestId}`);
      const res = await fetch("/api/emergency/escalate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId,
          escalationLevel: level,
          reason: "Critical unfulfilled requirement flagged for rapid regional mobilization",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMessage(`⚠️ Requisition successfully escalated to ${level}`);
        setTimeout(() => setSuccessMessage(null), 5000);
        fetchRadarData();
      }
    } catch (err) {
      console.error("Failed to escalate", err);
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    fetchRadarData();
  }, [selectedState, selectedDistrict]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10">
      {/* Header */}
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-semibold uppercase tracking-wider mb-2">
              <ShieldAlert className="w-3.5 h-3.5" />
              National Emergency Response Command Center
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              Emergency Response Radar & Youth Mobilization
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Operational triage, real-time response analytics, escalation alerts, and automated youth mobilization.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-sm rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-rose-500"
            >
              <option value="Maharashtra">Maharashtra</option>
              <option value="Delhi (NCT)">Delhi (NCT)</option>
              <option value="Karnataka">Karnataka</option>
            </select>

            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-sm rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-rose-500"
            >
              <option value="Pune">Pune District</option>
              <option value="New Delhi">New Delhi District</option>
              <option value="ALL">All Districts</option>
            </select>

            <button
              onClick={fetchRadarData}
              disabled={loading}
              className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-lg text-sm font-medium border border-slate-700 transition"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-rose-400" : ""}`} />
              Sync Radar
            </button>
          </div>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center gap-3 animate-fade-in">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Operational Response Velocity Metrics */}
        {metrics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
              <div className="text-xs text-slate-400 flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                Avg Ack Time
              </div>
              <div className="text-2xl font-bold text-white mt-1">{metrics.avgAckTimeMinutes} <span className="text-xs font-normal text-slate-400">mins</span></div>
              <div className="text-[11px] text-cyan-400 mt-1">PostgreSQL timestamp verified</div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
              <div className="text-xs text-slate-400 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                Avg Fulfillment Time
              </div>
              <div className="text-2xl font-bold text-white mt-1">{metrics.avgFulfillmentTimeMinutes} <span className="text-xs font-normal text-slate-400">mins</span></div>
              <div className="text-[11px] text-emerald-400 mt-1">Requisition to dispatch</div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
              <div className="text-xs text-slate-400 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-amber-400" />
                Donor Response Rate
              </div>
              <div className="text-2xl font-bold text-white mt-1">{metrics.donorResponseRatePct}%</div>
              <div className="text-[11px] text-amber-400 mt-1">Youth positive engagement</div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
              <div className="text-xs text-slate-400 flex items-center gap-2">
                <Activity className="w-4 h-4 text-rose-400" />
                District Readiness Score
              </div>
              <div className="text-2xl font-bold text-rose-400 mt-1">{metrics.districtResponseScore} <span className="text-xs font-normal text-slate-400">/ 100</span></div>
              <div className="text-[11px] text-rose-400 mt-1">Operational readiness index</div>
            </div>
          </div>
        )}

        {/* Main Grid: Live Queue & AI Donor Mobilization */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Emergency Triage Queue */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <AlertOctagon className="w-5 h-5 text-rose-500" />
                Active Emergency Requisitions ({emergencies.length})
              </h2>
              <span className="text-xs text-slate-400">Sorted by clinical urgency & timestamp</span>
            </div>

            {emergencies.length === 0 ? (
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                <p className="font-semibold text-white">No Unresolved Emergency Requisitions</p>
                <p className="text-xs mt-1">All hospital blood requests in {selectedDistrict} are currently fulfilled or stabilized.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {emergencies.map((req) => {
                  const isSelected = selectedReq?.id === req.id;
                  const isFulfilled = req.status === "FULFILLED";
                  const hasEscalation = req.escalations.length > 0;

                  return (
                    <div
                      key={req.id}
                      onClick={() => handleSelectRequest(req)}
                      className={`p-4 rounded-xl border transition cursor-pointer relative ${
                        isSelected
                          ? "bg-slate-900 border-rose-500/80 shadow-lg shadow-rose-950/40 ring-1 ring-rose-500/40"
                          : "bg-slate-900/60 border-slate-800/80 hover:bg-slate-900 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-rose-600/20 text-rose-400 border border-rose-500/30">
                              {formatBloodGroup(req.bloodGroup)}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-800 text-slate-300">
                              {formatComponentType(req.componentType)}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-950/80 text-rose-300 border border-rose-800">
                              {req.urgency}
                            </span>
                            {hasEscalation && (
                              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                                <AlertOctagon className="w-3 h-3" />
                                {req.escalations[0].escalationLevel}
                              </span>
                            )}
                          </div>

                          <div className="text-sm font-semibold text-white mt-1">{req.hospital.name}</div>
                          <div className="text-xs text-slate-400 flex items-center gap-3">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {req.hospital.district}, {req.hospital.state}
                            </span>
                            <span>transfusion need: {req.reason || "Emergency trauma"}</span>
                          </div>
                        </div>

                        <div className="text-right space-y-1">
                          <div className="text-sm font-bold text-white">
                            {req.unitsFulfilled} / {req.unitsRequired} <span className="text-xs text-slate-400 font-normal">units</span>
                          </div>
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                              isFulfilled
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                : req.unitsFulfilled > 0
                                ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                            }`}
                          >
                            {req.status}
                          </span>
                        </div>
                      </div>

                      {/* Action Bar */}
                      <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                        <span className="text-slate-500">
                          {req.donorResponses.length} donor responses • {req.allocations.length} allocations
                        </span>

                        <div className="flex items-center gap-2">
                          {!isFulfilled && (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleTriggerMobilize(req.id);
                                }}
                                disabled={actionLoading === req.id}
                                className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-medium flex items-center gap-1.5 transition"
                              >
                                <Zap className="w-3.5 h-3.5" />
                                {actionLoading === req.id ? "Mobilizing..." : "Rapid Mobilize"}
                              </button>

                              {!hasEscalation && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEscalate(req.id, "LEVEL_2_EXPANDED_OUTREACH");
                                  }}
                                  disabled={actionLoading === `esc-${req.id}`}
                                  className="px-2 py-1 rounded bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 font-medium flex items-center gap-1 transition"
                                >
                                  <Send className="w-3 h-3" />
                                  Escalate
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* AI Prioritized Donor Candidate Dispatch */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-cyan-400" />
                AI Prioritized Donors
              </h2>
              {selectedReq && (
                <span className="text-xs text-rose-400 font-semibold">
                  Targeting {formatBloodGroup(selectedReq.bloodGroup)}
                </span>
              )}
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
              {loadingDonors ? (
                <div className="py-12 text-center text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin text-cyan-400 mx-auto mb-2" />
                  <p className="text-sm">Calculating candidate priority rankings...</p>
                </div>
              ) : rankedDonors.length === 0 ? (
                <div className="py-10 text-center text-slate-400 text-sm">
                  Select an active requisition on the left to inspect matching candidate donors.
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-xs text-slate-400 border-b border-slate-800 pb-2">
                    Top verified voluntary donors ranked by ABO/Rh compatibility, availability, and district proximity.
                  </div>

                  {rankedDonors.slice(0, 5).map((donor, idx) => (
                    <div key={donor.donorId || idx} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <div className="text-sm font-bold text-white">{donor.fullName}</div>
                          <div className="text-xs text-slate-400 flex items-center gap-2">
                            <span className="font-semibold text-rose-400">{formatBloodGroup(donor.bloodGroup)}</span>
                            <span>•</span>
                            <span className="text-emerald-400">{donor.verificationStatus}</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-base font-extrabold text-cyan-400">{donor.operationalScore}/100</div>
                          <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                            {donor.priorityTier} Priority
                          </span>
                        </div>
                      </div>

                      {donor.rankingFactors && donor.rankingFactors.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {donor.rankingFactors.slice(0, 2).map((factor: string, fIdx: number) => (
                            <span key={fIdx} className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                              {factor}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
