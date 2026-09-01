"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Landmark,
  MapPin,
  RefreshCw,
  AlertTriangle,
  Flame,
  Activity,
  Heart,
  TrendingUp,
  Building2,
  Hospital as HospitalIcon,
  ChevronDown,
  ChevronUp,
  Info,
  Layers,
  ArrowRight,
} from "lucide-react";

interface GovStats {
  totalBloodRequests: number;
  activeEmergencyRequests: number;
  verifiedYouthDonors: number;
  availableYouthDonors: number;
  activeBloodBanks: number;
  hospitals: number;
  totalAvailableStock: number;
  criticalShortagesCount: number;
  highShortagesCount: number;
}

interface DistrictHeatmapItem {
  district: string;
  criticalCount: number;
  highCount: number;
  maxScore: number;
  availableStock: number;
}

interface ShortageItem {
  id: string;
  state: string;
  district: string;
  bloodGroup: string;
  componentType: string;
  riskLevel: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  riskScore: number;
  currentInventoryUnits: number;
  predictedDemandUnits: number;
  expiringUnits: number;
  activeEmergencyRequests: number;
  contributingFactors: string[];
  recommendedActions: string[];
  generatedAt: string;
}

interface InsightItem {
  id: string;
  type: string;
  title: string;
  message: string;
  severity: "INFO" | "WARNING" | "CRITICAL";
  district?: string;
  bloodGroup?: string;
  componentType?: string;
  generatedAt: string;
}

export default function GovernmentDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshMsg, setRefreshMsg] = useState<string | null>(null);

  // Filters
  const [selectedState, setSelectedState] = useState("Maharashtra");
  const [selectedDistrict, setSelectedDistrict] = useState("Pune");

  // Live Data
  const [stats, setStats] = useState<GovStats | null>(null);
  const [districtHeatmap, setDistrictHeatmap] = useState<DistrictHeatmapItem[]>([]);
  const [topShortages, setTopShortages] = useState<ShortageItem[]>([]);
  const [insights, setInsights] = useState<InsightItem[]>([]);
  const [expandedRiskId, setExpandedRiskId] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `/api/government/stats?state=${encodeURIComponent(selectedState)}&district=${encodeURIComponent(selectedDistrict)}`
      );
      const data = await res.json();
      if (data.success && data.data) {
        setStats(data.data.stats);
        setDistrictHeatmap(data.data.districtHeatmap || []);
        setTopShortages(data.data.topShortages || []);
        setInsights(data.data.insights || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [selectedState, selectedDistrict]);

  const handleRefreshAI = async () => {
    try {
      setRefreshing(true);
      setRefreshMsg(null);
      const res = await fetch("/api/ai/refresh", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setRefreshMsg(`AI Pipeline Recomputed: ${data.summary?.forecastsGenerated} forecasts, ${data.summary?.shortageRisksCalculated} shortage risks in ${data.summary?.executionTimeMs}ms`);
        await fetchDashboardData();
      } else {
        setRefreshMsg(data.error || "Failed to trigger AI recomputation");
      }
    } catch (err: any) {
      setRefreshMsg(err.message || "Network error");
    } finally {
      setRefreshing(false);
    }
  };

  const getRiskBadge = (level: string) => {
    switch (level) {
      case "CRITICAL":
        return "bg-rose-500/20 text-rose-300 border-rose-500/40";
      case "HIGH":
        return "bg-amber-500/20 text-amber-300 border-amber-500/40";
      case "MODERATE":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-500/40";
      default:
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
    }
  };

  const formatBlood = (bg: string) => bg.replace("_POSITIVE", "+").replace("_NEGATIVE", "-");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header with Jurisdiction & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-gradient-to-br from-slate-900 via-slate-900/90 to-purple-950/40 p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
              <Landmark className="w-3.5 h-3.5" />
              National Youth Blood Intelligence Network
            </span>
            <span className="text-xs text-slate-400">• Phase 3 AI Operational Decision-Support</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Government Blood Intelligence Command Center
          </h1>
          <p className="text-sm text-slate-400 mt-1 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-purple-400" />
            <span>National Surveillance • Live Regional Forecasting & Shortage Prediction</span>
          </p>
        </div>

        {/* Action Controls & AI Refresh */}
        <div className="flex flex-wrap items-center gap-3">
          {/* State Selector */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs">
            <label className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">State</label>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer"
            >
              <option value="Maharashtra" className="bg-slate-900">Maharashtra</option>
              <option value="Delhi" className="bg-slate-900">Delhi (NCT)</option>
              <option value="Karnataka" className="bg-slate-900">Karnataka</option>
              <option value="Telangana" className="bg-slate-900">Telangana</option>
            </select>
          </div>

          {/* District Selector */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs">
            <label className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">District</label>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer"
            >
              <option value="Pune" className="bg-slate-900">Pune</option>
              <option value="Mumbai" className="bg-slate-900">Mumbai</option>
              <option value="Nagpur" className="bg-slate-900">Nagpur</option>
              <option value="ALL" className="bg-slate-900">All Districts</option>
            </select>
          </div>

          {/* Refresh AI Models Button */}
          <button
            onClick={handleRefreshAI}
            disabled={refreshing}
            className="px-4 py-3 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/30 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            <span>{refreshing ? "Recalculating..." : "⚡ Refresh AI Models"}</span>
          </button>
        </div>
      </div>

      {/* AI Refresh Notification Banner */}
      {refreshMsg && (
        <div className="mb-6 p-4 rounded-2xl bg-purple-950/40 border border-purple-800/60 text-purple-200 text-xs flex items-center gap-2">
          <Info className="w-4 h-4 text-purple-400 shrink-0" />
          <span>{refreshMsg}</span>
        </div>
      )}

      {/* Medical Boundary & Non-Clinical Disclaimer */}
      <div className="mb-8 p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 text-xs text-slate-400 flex items-start gap-3">
        <Info className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
        <div>
          <span className="font-semibold text-slate-300">Operational Decision-Support Disclaimer: </span>
          YUVA-RAKT AI predictions, demand forecasting models, and shortage risk scores provide operational logistics support. Clinical compatibility testing, transfusion protocols, and final donor eligibility screening are strictly conducted by authorized medical officers.
        </div>
      </div>

      {/* Top Level Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-rose-400 mb-2">
            <span className="text-xs font-medium text-slate-400">Critical Shortages</span>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-rose-400">{stats?.criticalShortagesCount ?? 0}</div>
          <span className="text-[11px] text-slate-500 mt-1 block">Requiring immediate mobilization</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-amber-400 mb-2">
            <span className="text-xs font-medium text-slate-400">Active Emergency Requisitions</span>
            <Flame className="w-4 h-4" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-300">{stats?.activeEmergencyRequests ?? 0}</div>
          <span className="text-[11px] text-slate-500 mt-1 block">Urgent & Critical cases</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-emerald-400 mb-2">
            <span className="text-xs font-medium text-slate-400">Available Stock (Units)</span>
            <Activity className="w-4 h-4" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-300">{stats?.totalAvailableStock ?? 0}</div>
          <span className="text-[11px] text-slate-500 mt-1 block">Unexpired verified cold-chain units</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-purple-400 mb-2">
            <span className="text-xs font-medium text-slate-400">Verified Youth Donors</span>
            <Heart className="w-4 h-4" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-purple-300">{stats?.verifiedYouthDonors ?? 0}</div>
          <span className="text-[11px] text-emerald-400 mt-1 block">{stats?.availableYouthDonors ?? 0} currently available</span>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Link
          href="/government/ai-forecast"
          className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950/40 border border-indigo-900/50 hover:border-indigo-700 transition-all flex items-center justify-between group"
        >
          <div>
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm mb-1">
              <TrendingUp className="w-4 h-4" />
              <span>Deep-Dive Demand Forecasting Engine</span>
            </div>
            <p className="text-xs text-slate-400">
              Interactive 7-day, 14-day & 30-day time-series projections across all 8 blood groups and components.
            </p>
          </div>
          <ArrowRight className="w-5 h-5 text-indigo-400 group-hover:translate-x-1 transition-transform" />
        </Link>

        <Link
          href="/government/emergency"
          className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-rose-950/40 border border-rose-900/50 hover:border-rose-700 transition-all flex items-center justify-between group"
        >
          <div>
            <div className="flex items-center gap-2 text-rose-400 font-bold text-sm mb-1">
              <Activity className="w-4 h-4" />
              <span>Real-Time Emergency Response Radar</span>
            </div>
            <p className="text-xs text-slate-400">
              Monitor active critical hospital requisitions and trigger rapid voluntary youth donor outreach.
            </p>
          </div>
          <ArrowRight className="w-5 h-5 text-rose-400 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* District Heatmap / Geographic Intelligence & Active Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* District Risk Table / Heatmap */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-slate-900/60 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-purple-400" />
              <span>District Vulnerability & Shortage Heatmap</span>
            </h2>
            <span className="text-xs text-slate-400">{selectedState} Surveillance</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="pb-3">District</th>
                  <th className="pb-3 text-center">Peak Risk Score</th>
                  <th className="pb-3 text-center">Critical Shortages</th>
                  <th className="pb-3 text-center">High Shortages</th>
                  <th className="pb-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {districtHeatmap.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-500">
                      No district vulnerability entries logged yet. Click &quot;⚡ Refresh AI Models&quot;.
                    </td>
                  </tr>
                ) : (
                  districtHeatmap.map((d) => (
                    <tr key={d.district} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 font-semibold text-slate-200">{d.district}</td>
                      <td className="py-3 text-center">
                        <div className="inline-flex items-center gap-1.5 font-bold">
                          <span className="text-slate-300">{d.maxScore}/100</span>
                        </div>
                      </td>
                      <td className="py-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${d.criticalCount > 0 ? "bg-rose-500/20 text-rose-300" : "text-slate-500"}`}>
                          {d.criticalCount}
                        </span>
                      </td>
                      <td className="py-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${d.highCount > 0 ? "bg-amber-500/20 text-amber-300" : "text-slate-500"}`}>
                          {d.highCount}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            d.criticalCount > 0
                              ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                              : d.highCount > 0
                              ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                              : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                          }`}
                        >
                          {d.criticalCount > 0 ? "CRITICAL" : d.highCount > 0 ? "HIGH RISK" : "STABLE"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* AI Insight Alerts */}
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Flame className="w-5 h-5 text-rose-400" />
              <span>AI Operational Insights</span>
            </h2>
            <span className="text-xs text-purple-400 font-semibold">{insights.length} active</span>
          </div>

          <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
            {insights.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs">
                No active critical alerts. All regional blood inventory levels within standard safety thresholds.
              </div>
            ) : (
              insights.map((ins) => (
                <div
                  key={ins.id}
                  className={`p-3.5 rounded-2xl border text-xs ${
                    ins.severity === "CRITICAL"
                      ? "bg-rose-950/30 border-rose-800/60 text-rose-200"
                      : "bg-amber-950/30 border-amber-800/60 text-amber-200"
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold mb-1">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>{ins.title}</span>
                  </div>
                  <p className="text-[11px] opacity-90 leading-relaxed">{ins.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Shortage Risk Radar & Explainable AI Factor Breakdown */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/60 border border-slate-800 shadow-xl mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <span>Shortage Risk Prediction & Explainable AI (XAI)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Click any risk entry to inspect the mathematical contributing factors and recommended operational actions.
            </p>
          </div>
        </div>

        {/* Shortage Grid */}
        <div className="space-y-4">
          {topShortages.length === 0 ? (
            <div className="py-10 text-center text-slate-500 text-sm">
              No shortage risk records available. Click &quot;⚡ Refresh AI Models&quot; to initialize.
            </div>
          ) : (
            topShortages.map((risk) => {
              const isExpanded = expandedRiskId === risk.id;
              return (
                <div
                  key={risk.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    risk.riskLevel === "CRITICAL"
                      ? "bg-rose-950/20 border-rose-900/60"
                      : risk.riskLevel === "HIGH"
                      ? "bg-amber-950/20 border-amber-900/60"
                      : "bg-slate-900/80 border-slate-800"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-slate-800/80 border border-slate-700 flex flex-col items-center justify-center font-black">
                        <span className="text-base text-rose-400">{formatBlood(risk.bloodGroup)}</span>
                        <span className="text-[9px] text-slate-400 -mt-1">{risk.componentType}</span>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{risk.district}, {risk.state}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getRiskBadge(risk.riskLevel)}`}>
                            {risk.riskLevel} RISK (Score: {risk.riskScore}/100)
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                          <span>Stock: <strong className="text-slate-200">{risk.currentInventoryUnits} units</strong></span>
                          <span>•</span>
                          <span>7d Forecast Demand: <strong className="text-slate-200">{risk.predictedDemandUnits} units</strong></span>
                          {risk.expiringUnits > 0 && (
                            <>
                              <span>•</span>
                              <span className="text-amber-400">⏳ {risk.expiringUnits} expiring</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setExpandedRiskId(isExpanded ? null : risk.id)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
                    >
                      <span>{isExpanded ? "Hide Details" : "Inspect Why (XAI)"}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Explainable AI & Recommended Actions Drawer */}
                  {isExpanded && (
                    <div className="mt-5 pt-5 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
                      {/* Contributing Factors */}
                      <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                        <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <Info className="w-3.5 h-3.5 text-purple-400" />
                          <span>Contributing Risk Factors (Why?)</span>
                        </h4>
                        <ul className="space-y-1.5 text-xs text-slate-300">
                          {risk.contributingFactors.map((fact, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-purple-400 font-bold">•</span>
                              <span>{fact}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Recommended Operational Actions */}
                      <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                        <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <Activity className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Recommended Operational Actions</span>
                        </h4>
                        <ul className="space-y-1.5 text-xs text-slate-300">
                          {risk.recommendedActions.map((act, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-emerald-400 font-bold">✓</span>
                              <span>{act}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
