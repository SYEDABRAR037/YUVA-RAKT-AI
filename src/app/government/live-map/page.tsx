"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  MapPin,
  Shield,
  Activity,
  Truck,
  Building2,
  Users,
  AlertTriangle,
  RefreshCw,
  Layers,
  ChevronRight,
  Sparkles,
  Navigation,
  Compass,
  Radio,
  CheckCircle2,
  Clock,
  ArrowUpRight,
} from "lucide-react";
import { formatBloodGroup, formatComponentType } from "@/lib/utils";

export default function NationalLiveMapPage() {
  const [loading, setLoading] = useState(true);
  const [mapData, setMapData] = useState<{
    districts: any[];
    emergencies: any[];
    bloodBanks: any[];
    ambulances: any[];
    summary: any;
  } | null>(null);

  // Layer Toggles
  const [showShortageLayer, setShowShortageLayer] = useState(true);
  const [showEmergencyLayer, setShowEmergencyLayer] = useState(true);
  const [showBloodBankLayer, setShowBloodBankLayer] = useState(true);
  const [showAmbulanceLayer, setShowAmbulanceLayer] = useState(true);

  // Filters
  const [selectedDistrict, setSelectedDistrict] = useState<string>("ALL");
  const [selectedBloodGroup, setSelectedBloodGroup] = useState<string>("ALL");

  // Selected Object Drawer
  const [selectedEntity, setSelectedEntity] = useState<{
    type: "DISTRICT" | "EMERGENCY" | "BLOOD_BANK" | "AMBULANCE";
    data: any;
  } | null>(null);

  const [activatingResponse, setActivatingResponse] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchLiveMapData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedDistrict !== "ALL") params.append("district", selectedDistrict);
      if (selectedBloodGroup !== "ALL") params.append("bloodGroup", selectedBloodGroup);

      const res = await fetch(`/api/government/live-map?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setMapData(json.data);
      }
    } catch (err) {
      console.error("Failed to load map data", err);
    } finally {
      setLoading(false);
    }
  }, [selectedDistrict, selectedBloodGroup]);

  useEffect(() => {
    fetchLiveMapData();
    const interval = setInterval(fetchLiveMapData, 15000);
    return () => clearInterval(interval);
  }, [fetchLiveMapData]);

  const handleActivateAutonomousResponse = async (district: string, bloodGroup: string) => {
    try {
      setActivatingResponse(true);
      setActionMessage(null);
      const res = await fetch("/api/emergency/autonomous-response", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          district,
          bloodGroup,
          unitsRequired: 3,
          responseMode: "PREDICTIVE_SHORTAGE",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage(`Autonomous response activated! Alerted ${data.data.mobilization?.alertedBanksCount || 0} blood centres and dispatched alerts to candidate donors.`);
        fetchLiveMapData();
      } else {
        setActionMessage(data.error || "Failed to activate response");
      }
    } catch (err: any) {
      setActionMessage(err.message || "Network error");
    } finally {
      setActivatingResponse(false);
    }
  };

  const handleExpandRadius = async (requestId: string) => {
    try {
      setActivatingResponse(true);
      setActionMessage(null);
      const res = await fetch("/api/emergency/expand-radius", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId }),
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage(`Search radius expanded! Notified ${data.data.additionalDonorsAlerted} additional regional donors.`);
        fetchLiveMapData();
      } else {
        setActionMessage(data.error || "Failed to expand radius");
      }
    } catch (err: any) {
      setActionMessage(err.message || "Network error");
    } finally {
      setActivatingResponse(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 animate-pulse text-rose-400" />
              National Tactical Radar • Phase 5 Live
            </span>
            <span className="text-xs text-slate-400">Autonomous Decision-Support Network</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            National Live Blood Intelligence Map
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time geospatial visualization of predictive shortages, active hospital emergencies, blood inventories, and live ambulance missions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchLiveMapData}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-2 shadow-lg cursor-pointer transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-rose-400" : ""}`} />
            <span>Sync Live Map</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-rose-500/30">
          <div className="text-[11px] font-semibold text-rose-400 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" /> Critical Districts
          </div>
          <div className="text-xl font-bold text-white mt-1">
            {mapData?.summary?.criticalDistrictsCount || 0}
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-amber-500/30">
          <div className="text-[11px] font-semibold text-amber-400 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5" /> Active Emergencies
          </div>
          <div className="text-xl font-bold text-white mt-1">
            {mapData?.summary?.activeEmergenciesCount || 0}
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-blue-500/30">
          <div className="text-[11px] font-semibold text-blue-400 flex items-center gap-1.5">
            <Truck className="w-3.5 h-3.5" /> Active Missions
          </div>
          <div className="text-xl font-bold text-white mt-1">
            {mapData?.summary?.activeMissionsCount || 0}
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-emerald-500/30">
          <div className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5" /> Blood Centres Online
          </div>
          <div className="text-xl font-bold text-white mt-1">
            {mapData?.bloodBanks?.length || 0}
          </div>
        </div>
      </div>

      {/* Layer Toggles and Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 mb-6">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-semibold text-slate-400 mr-1 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-rose-400" /> Layers:
          </span>
          <button
            onClick={() => setShowShortageLayer(!showShortageLayer)}
            className={`px-3 py-1.5 rounded-lg border font-medium cursor-pointer transition-all ${
              showShortageLayer
                ? "bg-rose-500/20 border-rose-500/40 text-rose-300"
                : "bg-slate-950 border-slate-800 text-slate-500"
            }`}
          >
            🔥 Shortage Heatmap
          </button>
          <button
            onClick={() => setShowEmergencyLayer(!showEmergencyLayer)}
            className={`px-3 py-1.5 rounded-lg border font-medium cursor-pointer transition-all ${
              showEmergencyLayer
                ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                : "bg-slate-950 border-slate-800 text-slate-500"
            }`}
          >
            🚨 Hospital Emergencies
          </button>
          <button
            onClick={() => setShowBloodBankLayer(!showBloodBankLayer)}
            className={`px-3 py-1.5 rounded-lg border font-medium cursor-pointer transition-all ${
              showBloodBankLayer
                ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                : "bg-slate-950 border-slate-800 text-slate-500"
            }`}
          >
            🏢 Blood Centres
          </button>
          <button
            onClick={() => setShowAmbulanceLayer(!showAmbulanceLayer)}
            className={`px-3 py-1.5 rounded-lg border font-medium cursor-pointer transition-all ${
              showAmbulanceLayer
                ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-300"
                : "bg-slate-950 border-slate-800 text-slate-500"
            }`}
          >
            🚑 Ambulances & Routes
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-rose-500"
          >
            <option value="ALL">All Districts</option>
            <option value="Pune">Pune</option>
            <option value="Mumbai">Mumbai</option>
            <option value="Nagpur">Nagpur</option>
            <option value="Nashik">Nashik</option>
            <option value="Delhi">Delhi</option>
            <option value="Bengaluru">Bengaluru</option>
          </select>

          <select
            value={selectedBloodGroup}
            onChange={(e) => setSelectedBloodGroup(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-rose-500"
          >
            <option value="ALL">All Blood Groups</option>
            <option value="O_NEGATIVE">O Negative (O-)</option>
            <option value="O_POSITIVE">O Positive (O+)</option>
            <option value="A_POSITIVE">A Positive (A+)</option>
            <option value="A_NEGATIVE">A Negative (A-)</option>
            <option value="B_POSITIVE">B Positive (B+)</option>
            <option value="B_NEGATIVE">B Negative (B-)</option>
            <option value="AB_POSITIVE">AB Positive (AB+)</option>
            <option value="AB_NEGATIVE">AB Negative (AB-)</option>
          </select>
        </div>
      </div>

      {actionMessage && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{actionMessage}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="text-slate-400 hover:text-white text-xs">
            ✕
          </button>
        </div>
      )}

      {/* Main Map View & Tactical Command Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Geospatial Map Canvas */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-2xl relative overflow-hidden min-h-[560px] flex flex-col justify-between">
          {/* Tactical Map Grid Background */}
          <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:20px_20px] opacity-25 pointer-events-none" />

          {/* Map Compass & Coordinates Watermark */}
          <div className="relative z-10 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-2 font-mono text-[11px]">
              <Compass className="w-4 h-4 text-rose-500" />
              <span>RADAR LAT: 18.5204° N | LNG: 73.8567° E (PUNE REGION)</span>
            </div>
            <div className="text-[10px] bg-slate-950/80 px-2.5 py-1 rounded-md border border-slate-800 font-mono text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              LIVE TELEMETRY
            </div>
          </div>

          {/* Interactive Tactical Node Placements */}
          <div className="relative z-10 flex-1 my-8 flex items-center justify-center">
            <div className="w-full max-w-xl h-96 relative rounded-2xl bg-slate-950/60 border border-slate-800/80 p-6 flex flex-col justify-between">
              {/* Region Label */}
              <div className="text-center font-mono text-xs font-bold text-slate-400 uppercase tracking-widest">
                Maharashtra State Emergency Transit Grid
              </div>

              {/* Node 1: Pune District Hub */}
              <div className="grid grid-cols-3 gap-4 h-full items-center my-4">
                {/* Blood Bank Node */}
                {showBloodBankLayer && (
                  <div
                    onClick={() =>
                      setSelectedEntity({
                        type: "BLOOD_BANK",
                        data: mapData?.bloodBanks[0] || { name: "Regional Red Cross Blood Centre", district: "Pune" },
                      })
                    }
                    className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 hover:border-emerald-400 text-left cursor-pointer transition-all hover:scale-105 shadow-lg relative group"
                  >
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div className="text-xs font-bold text-white truncate">Pune Red Cross</div>
                    <div className="text-[10px] text-emerald-400 font-semibold mt-0.5">Blood Centre • Verified</div>
                    <div className="text-[10px] text-slate-400 mt-1">Avail Stock: 42 Units</div>
                  </div>
                )}

                {/* Transit Center / Ambulance Route */}
                {showAmbulanceLayer && (
                  <div
                    onClick={() =>
                      setSelectedEntity({
                        type: "AMBULANCE",
                        data: mapData?.ambulances[0] || { displayName: "Ambulance Rapid-01", status: "ON_MISSION" },
                      })
                    }
                    className="p-3.5 rounded-2xl bg-cyan-950/40 border border-cyan-500/40 hover:border-cyan-400 text-left cursor-pointer transition-all hover:scale-105 shadow-lg relative group"
                  >
                    <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center mb-2">
                      <Truck className="w-4 h-4 animate-bounce" />
                    </div>
                    <div className="text-xs font-bold text-white truncate">Unit MH-12-EM-108</div>
                    <div className="text-[10px] text-cyan-300 font-semibold mt-0.5">En Route • Live GPS</div>
                    <div className="text-[10px] text-slate-400 mt-1">Speed: 48 km/h</div>
                  </div>
                )}

                {/* Hospital Node */}
                {showEmergencyLayer && (
                  <div
                    onClick={() =>
                      setSelectedEntity({
                        type: "EMERGENCY",
                        data: mapData?.emergencies[0] || { hospitalName: "Sassoon General Hospital", urgency: "EMERGENCY" },
                      })
                    }
                    className="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-500/40 hover:border-rose-400 text-left cursor-pointer transition-all hover:scale-105 shadow-lg relative group animate-pulse"
                  >
                    <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center mb-2">
                      <Activity className="w-4 h-4" />
                    </div>
                    <div className="text-xs font-bold text-white truncate">Sassoon Hospital</div>
                    <div className="text-[10px] text-rose-400 font-bold mt-0.5">EMERGENCY O- RBC</div>
                    <div className="text-[10px] text-slate-400 mt-1">2 Units Required</div>
                  </div>
                )}
              </div>

              {/* District Shortage Layer Indicator */}
              {showShortageLayer && mapData?.districts && mapData.districts.length > 0 && (
                <div
                  onClick={() =>
                    setSelectedEntity({
                      type: "DISTRICT",
                      data: mapData.districts[0],
                    })
                  }
                  className="p-3 rounded-xl bg-slate-900/80 border border-amber-500/30 hover:border-amber-400 flex items-center justify-between cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-2 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                    <span className="font-bold text-white">Pune District Shortage Radar</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300">
                      HIGH RISK (65/100)
                    </span>
                  </div>
                  <span className="text-[11px] text-rose-400 font-semibold flex items-center gap-1">
                    Inspect AI Details <ArrowUpRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Map Footer Legend */}
          <div className="relative z-10 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-400">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Low Risk (0–29)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" /> Moderate (30–59)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-orange-500" /> High (60–79)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500" /> Critical (80–100)
              </span>
            </div>
            <div className="font-mono text-slate-500">Auto-Refreshes every 15s</div>
          </div>
        </div>

        {/* Tactical Command & Entity Details Drawer */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-rose-400" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Tactical Command Inspector
                </h2>
              </div>
              {selectedEntity && (
                <button
                  onClick={() => setSelectedEntity(null)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Clear
                </button>
              )}
            </div>

            {!selectedEntity ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                <Navigation className="w-8 h-8 text-slate-600 mx-auto mb-3 animate-pulse" />
                <p className="font-medium text-slate-400">Select any tactical marker on the map</p>
                <p className="mt-1 text-[11px]">
                  Click on a District, Hospital, Blood Bank, or Ambulance to view AI recommendations and command actions.
                </p>
              </div>
            ) : selectedEntity.type === "DISTRICT" ? (
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/30">
                    District Shortage Analysis
                  </span>
                  <h3 className="text-lg font-bold text-white mt-2">
                    {selectedEntity.data.district}, {selectedEntity.data.state}
                  </h3>
                  <div className="text-xs text-slate-400">
                    Blood Group: <strong className="text-slate-200">{formatBloodGroup(selectedEntity.data.bloodGroup)}</strong>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-slate-500 text-[10px]">Shortage Risk Score</span>
                    <div className="text-base font-bold text-rose-400 mt-0.5">
                      {selectedEntity.data.riskScore}/100 ({selectedEntity.data.riskLevel})
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-slate-500 text-[10px]">Current Stock</span>
                    <div className="text-base font-bold text-white mt-0.5">
                      {selectedEntity.data.currentInventoryUnits} Units
                    </div>
                  </div>
                </div>

                {selectedEntity.data.contributingFactors && (
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                    <strong className="text-slate-300 font-semibold block mb-1">
                      Explainable AI (XAI) Contributing Factors:
                    </strong>
                    <ul className="space-y-1 text-slate-400 text-[11px] list-disc list-inside">
                      {Array.isArray(selectedEntity.data.contributingFactors)
                        ? selectedEntity.data.contributingFactors.map((f: string, idx: number) => (
                            <li key={idx}>{f}</li>
                          ))
                        : <li>{String(selectedEntity.data.contributingFactors)}</li>}
                    </ul>
                  </div>
                )}

                <button
                  onClick={() =>
                    handleActivateAutonomousResponse(
                      selectedEntity.data.district,
                      selectedEntity.data.bloodGroup
                    )
                  }
                  disabled={activatingResponse}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-xs shadow-lg shadow-rose-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{activatingResponse ? "Activating Response..." : "Activate Autonomous Smart Response"}</span>
                </button>
              </div>
            ) : selectedEntity.type === "EMERGENCY" ? (
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/30">
                    Hospital Emergency Requisition
                  </span>
                  <h3 className="text-lg font-bold text-white mt-2">
                    {selectedEntity.data.hospitalName || "General Hospital"}
                  </h3>
                  <div className="text-xs text-slate-400">
                    {selectedEntity.data.district}, {selectedEntity.data.state}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Blood Requirement:</span>
                    <span className="font-bold text-white">
                      {formatBloodGroup(selectedEntity.data.bloodGroup)} ({formatComponentType(selectedEntity.data.componentType)})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Required Units:</span>
                    <span className="font-bold text-rose-400">{selectedEntity.data.unitsRequired} Units</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Urgency Level:</span>
                    <span className="font-bold text-red-400">{selectedEntity.data.urgency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Status:</span>
                    <span className="font-bold text-amber-400">{selectedEntity.data.status}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleExpandRadius(selectedEntity.data.id)}
                  disabled={activatingResponse}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold text-xs shadow-lg shadow-amber-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>{activatingResponse ? "Expanding..." : "Expand Search Radius (Round 2)"}</span>
                </button>
              </div>
            ) : selectedEntity.type === "AMBULANCE" ? (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/30">
                      Emergency Ambulance Unit
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                      {selectedEntity.data.locationSource || "REAL_GPS"}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white mt-2">
                    {selectedEntity.data.displayName} ({selectedEntity.data.vehicleNumber})
                  </h3>
                  <div className="text-xs text-slate-400">
                    Stationed in: {selectedEntity.data.district}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Current Status:</span>
                    <span className="font-bold text-cyan-300">{selectedEntity.data.status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">GPS Coordinates:</span>
                    <span className="font-mono text-slate-300">
                      {selectedEntity.data.currentLatitude?.toFixed(4)}° N, {selectedEntity.data.currentLongitude?.toFixed(4)}° E
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">GPS Accuracy:</span>
                    <span className="text-amber-300">±{selectedEntity.data.accuracy || 8} metres</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Telemetry Freshness:</span>
                    <span className="text-emerald-400 font-semibold">Live (Stream Synchronized)</span>
                  </div>
                </div>

                {selectedEntity.data.activeMission && (
                  <div className="p-3.5 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 text-xs space-y-2.5">
                    <div className="font-bold text-cyan-300 flex items-center gap-1.5">
                      <Radio className="w-3.5 h-3.5 animate-pulse" />
                      <span>Active Transport Mission: {selectedEntity.data.activeMission.status}</span>
                    </div>
                    <div className="text-[11px] text-slate-300">
                      Blood Bank: <strong>{selectedEntity.data.activeMission.sourceBloodBank?.name || "Blood Centre"}</strong>
                    </div>
                    <div className="text-[11px] text-slate-300">
                      Destination: <strong>{selectedEntity.data.activeMission.destinationHospital?.name || "Hospital"}</strong>
                    </div>
                    <a
                      href={`/track/ambulance/${selectedEntity.data.activeMission.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>Open Live Zomato/Uber Tracker →</span>
                    </a>
                  </div>
                )}
              </div>
            ) : null}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800/80 text-[11px] text-slate-500 text-center">
            Operational Decision-Support Only • No Clinical Diagnostics
          </div>
        </div>
      </div>
    </div>
  );
}
