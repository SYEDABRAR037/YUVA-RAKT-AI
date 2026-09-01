"use client";

import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  MapPin,
  Calendar,
  Layers,
  Sparkles,
  Info,
  ShieldCheck,
  BarChart2,
  RefreshCw,
} from "lucide-react";

interface ForecastItem {
  id: string;
  state: string;
  district: string;
  bloodGroup: string;
  componentType: string;
  periodDays: number;
  predictedUnits: number;
  confidenceScore: number;
  demandTrend: "INCREASING" | "STABLE" | "DECREASING";
  historicalDailyAvg: number;
  dataQuality: string;
  modelVersion: string;
  generatedAt: string;
}

const BLOOD_GROUPS = [
  "ALL",
  "O_POSITIVE", "O_NEGATIVE",
  "A_POSITIVE", "A_NEGATIVE",
  "B_POSITIVE", "B_NEGATIVE",
  "AB_POSITIVE", "AB_NEGATIVE",
];

const COMPONENTS = ["ALL", "WHOLE_BLOOD", "RBC", "PLASMA", "PLATELETS"];

export default function AIForecastPage() {
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState("Maharashtra");
  const [district, setDistrict] = useState("Pune");
  const [periodDays, setPeriodDays] = useState(7);
  const [selectedGroup, setSelectedGroup] = useState("ALL");
  const [selectedComponent, setSelectedComponent] = useState("ALL");

  const [forecasts, setForecasts] = useState<ForecastItem[]>([]);

  const fetchForecasts = async () => {
    try {
      setLoading(true);
      let url = `/api/ai/forecast?state=${encodeURIComponent(state)}&district=${encodeURIComponent(district)}&periodDays=${periodDays}`;
      if (selectedGroup !== "ALL") url += `&bloodGroup=${encodeURIComponent(selectedGroup)}`;
      if (selectedComponent !== "ALL") url += `&componentType=${encodeURIComponent(selectedComponent)}`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.success && data.data?.forecasts) {
        setForecasts(data.data.forecasts);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForecasts();
  }, [state, district, periodDays, selectedGroup, selectedComponent]);

  const formatBlood = (bg: string) => bg.replace("_POSITIVE", "+").replace("_NEGATIVE", "-");

  const getTrendBadge = (trend: string) => {
    switch (trend) {
      case "INCREASING":
        return { text: "Increasing Demand (+)", color: "text-rose-400 bg-rose-500/20 border-rose-500/30" };
      case "DECREASING":
        return { text: "Decreasing Demand (-)", color: "text-emerald-400 bg-emerald-500/20 border-emerald-500/30" };
      default:
        return { text: "Stable Baseline (=)", color: "text-blue-400 bg-blue-500/20 border-blue-500/30" };
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-gradient-to-r from-slate-900 via-slate-900/90 to-indigo-950/40 p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              Time-Series AI Forecasting Engine
            </span>
            <span className="text-xs text-slate-400">• Version forecast-v1</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Blood Demand Forecasting & Trend Modeling
          </h1>
          <p className="text-sm text-slate-400 mt-1 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-indigo-400" />
            <span>District Clinical Requisition Modeling with Confidence Intervals</span>
          </p>
        </div>

        {/* Horizon Toggles */}
        <div className="flex items-center bg-slate-950 p-1.5 rounded-2xl border border-slate-800 self-start lg:self-auto">
          {[7, 14, 30].map((days) => (
            <button
              key={days}
              onClick={() => setPeriodDays(days)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                periodDays === days
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {days} Days Horizon
            </button>
          ))}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-wrap items-center gap-4 mb-8">
        {/* State */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 font-bold">State:</span>
          <select
            value={state}
            onChange={(e) => setState(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white font-medium focus:outline-none cursor-pointer"
          >
            <option value="Maharashtra">Maharashtra</option>
            <option value="Delhi">Delhi (NCT)</option>
            <option value="Karnataka">Karnataka</option>
            <option value="Telangana">Telangana</option>
          </select>
        </div>

        {/* District */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 font-bold">District:</span>
          <select
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white font-medium focus:outline-none cursor-pointer"
          >
            <option value="Pune">Pune</option>
            <option value="Mumbai">Mumbai</option>
            <option value="Nagpur">Nagpur</option>
          </select>
        </div>

        {/* Blood Group */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 font-bold">Blood Group:</span>
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white font-medium focus:outline-none cursor-pointer"
          >
            {BLOOD_GROUPS.map((bg) => (
              <option key={bg} value={bg}>
                {bg === "ALL" ? "All Blood Groups" : formatBlood(bg)}
              </option>
            ))}
          </select>
        </div>

        {/* Component */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 font-bold">Component:</span>
          <select
            value={selectedComponent}
            onChange={(e) => setSelectedComponent(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white font-medium focus:outline-none cursor-pointer"
          >
            {COMPONENTS.map((comp) => (
              <option key={comp} value={comp}>
                {comp === "ALL" ? "All Components" : comp}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={fetchForecasts}
          className="ml-auto p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
          title="Refresh view"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Forecast Matrix Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {loading ? (
          <div className="col-span-full py-12 text-center text-indigo-400 flex items-center justify-center gap-3">
            <div className="w-5 h-5 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
            <span className="text-sm font-medium">Computing demand forecasting models...</span>
          </div>
        ) : forecasts.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500 text-sm">
            No forecast records found matching selected parameters.
          </div>
        ) : (
          forecasts.map((f) => {
            const trend = getTrendBadge(f.demandTrend);
            const baselinePeriodTotal = Math.round(f.historicalDailyAvg * f.periodDays);
            const maxVal = Math.max(f.predictedUnits, baselinePeriodTotal, 1);
            const forecastPct = Math.min(100, Math.round((f.predictedUnits / maxVal) * 100));
            const baselinePct = Math.min(100, Math.round((baselinePeriodTotal / maxVal) * 100));

            return (
              <div
                key={f.id || `${f.bloodGroup}_${f.componentType}`}
                className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-indigo-800/80 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-black text-rose-400">{formatBlood(f.bloodGroup)}</span>
                      <span className="text-xs font-semibold text-slate-300 bg-slate-800 px-2 py-0.5 rounded">
                        {f.componentType}
                      </span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${trend.color}`}>
                      {trend.text}
                    </span>
                  </div>

                  {/* Predicted Numbers */}
                  <div className="my-4">
                    <span className="text-xs text-slate-400 block mb-0.5">Projected {f.periodDays}-Day Demand</span>
                    <div className="text-3xl font-black text-white flex items-baseline gap-2">
                      <span>{f.predictedUnits}</span>
                      <span className="text-xs font-normal text-slate-400">units</span>
                    </div>
                  </div>

                  {/* Visual Bar Comparison */}
                  <div className="space-y-2 mb-4">
                    <div>
                      <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                        <span>Projected Forecast</span>
                        <strong className="text-indigo-400">{f.predictedUnits} units</strong>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                          style={{ width: `${forecastPct}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                        <span>Past Baseline (Average)</span>
                        <strong className="text-slate-300">{baselinePeriodTotal} units</strong>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden">
                        <div
                          className="h-full bg-slate-700 rounded-full transition-all duration-500"
                          style={{ width: `${baselinePct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Badges */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                  <span>Confidence: <strong className="text-slate-200">{Math.round(f.confidenceScore * 100)}%</strong></span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                    {f.dataQuality === "CALIBRATED_LIVE" ? "Live Calibrated" : "Cold Start"}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Model Transparency & Mathematical Methodology Section */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/50 border border-slate-800">
        <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-indigo-400" />
          <span>AI Model Transparency & Architectural Specification</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-slate-500 block mb-1">Model Architecture</span>
            <strong className="text-slate-200 font-mono">Weighted Exponential Smoothing + Velocity Momentum</strong>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-slate-500 block mb-1">Training / Evaluation Scope</span>
            <strong className="text-slate-200">90-Day Rolling Window from PostgreSQL</strong>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-slate-500 block mb-1">Model Version Tag</span>
            <strong className="text-indigo-300 font-mono">forecast-v1</strong>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-slate-500 block mb-1">Known Limitations</span>
            <span className="text-slate-300">Sparse cold-start regions use baseline clinical consumption heuristics.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
