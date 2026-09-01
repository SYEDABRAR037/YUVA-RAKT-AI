"use client";

import React, { useState, useEffect, useCallback, use } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  Truck,
  Building2,
  Activity,
  CheckCircle2,
  Clock,
  Compass,
  ArrowLeft,
  Radio,
  Play,
  RefreshCw,
  Phone,
  ShieldCheck,
} from "lucide-react";

// Dynamic import for Leaflet map component (No SSR)
const LiveAmbulanceMap = dynamic(
  () => import("@/components/map/LiveAmbulanceMap"),
  { ssr: false }
);

const MISSION_TIMELINE_STEPS = [
  { key: "ASSIGNED", label: "Emergency Requisition & Ambulance Assigned" },
  { key: "ACCEPTED", label: "Mission Accepted by Ambulance Crew" },
  { key: "EN_ROUTE_TO_BLOOD_BANK", label: "Ambulance En Route to Blood Bank" },
  { key: "ARRIVED_AT_BLOOD_BANK", label: "Arrived at Blood Collection Centre" },
  { key: "BLOOD_COLLECTED", label: "Blood Units Verified & Collected" },
  { key: "EN_ROUTE_TO_HOSPITAL", label: "Ambulance En Route to Hospital" },
  { key: "ARRIVED_AT_HOSPITAL", label: "Arrived at Emergency Hospital" },
  { key: "DELIVERED", label: "Blood Delivered to Clinical Staff" },
  { key: "COMPLETED", label: "Transport Mission Completed & Verified" },
];

export default function AmbulanceLiveTrackingPage({
  params,
}: {
  params: Promise<{ missionId: string }>;
}) {
  const { missionId } = use(params);
  const [loading, setLoading] = useState(true);
  const [trackingData, setTrackingData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [simulating, setSimulating] = useState(false);

  const fetchLiveTelemetry = useCallback(async () => {
    try {
      const res = await fetch(`/api/ambulance/missions/${missionId}/live`);
      const json = await res.json();
      if (json.success) {
        setTrackingData(json.data);
        setError(null);
      } else {
        setError(json.error || "Unable to load mission tracking data");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Network error fetching tracking telemetry");
    } finally {
      setLoading(false);
    }
  }, [missionId]);

  useEffect(() => {
    fetchLiveTelemetry();
    // Real-time synchronization polling ticker every 3.5 seconds
    const interval = setInterval(fetchLiveTelemetry, 3500);
    return () => clearInterval(interval);
  }, [fetchLiveTelemetry]);

  // Demo Simulation Stepper (Zomato/Uber style journey simulator for judges)
  const handleStepSimulation = async (targetStatus: string, dLat: number, dLng: number) => {
    try {
      setSimulating(true);
      const nextLat = (trackingData?.ambulance?.latitude || 18.5204) + dLat;
      const nextLng = (trackingData?.ambulance?.longitude || 73.8567) + dLng;

      // 1. Push location update
      await fetch("/api/ambulance/location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: nextLat,
          longitude: nextLng,
          source: "DEMO_SIMULATION",
          missionId,
        }),
      });

      // 2. Advance status if needed
      if (targetStatus && targetStatus !== trackingData?.missionStatus) {
        await fetch(`/api/ambulance/missions/${missionId}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ targetStatus }),
        });
      }

      await fetchLiveTelemetry();
    } catch (e) {
      console.error("Simulation error", e);
    } finally {
      setSimulating(false);
    }
  };

  if (loading && !trackingData) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="text-center">
          <Truck className="w-14 h-14 text-cyan-400 animate-bounce mx-auto mb-4" />
          <p className="text-base font-extrabold text-white">Connecting to Live Ambulance GPS Stream...</p>
        </div>
      </div>
    );
  }

  if (error || !trackingData) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-6 flex items-center justify-center">
        <div className="max-w-md w-full p-8 rounded-3xl bg-slate-900 border-2 border-slate-700 text-center shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-rose-950 text-rose-400 border-2 border-rose-500 flex items-center justify-center mx-auto mb-4 text-xl font-black">
            ✕
          </div>
          <h2 className="text-xl font-extrabold text-white mb-2">Tracking Session Unavailable</h2>
          <p className="text-xs text-slate-300 font-medium mb-6">{error || "Mission not found or unauthorized"}</p>
          <Link
            href="/hospital/requests"
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold inline-flex items-center gap-2 border border-slate-600"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Requests
          </Link>
        </div>
      </div>
    );
  }

  const { ambulance, bloodBank, hospital, navigation, missionStatus } = trackingData;

  // Dynamic Headline
  let dynamicHeadline = "🚑 Ambulance Assigned & On Standby";
  if (missionStatus === "EN_ROUTE_TO_BLOOD_BANK") dynamicHeadline = "🚑 Ambulance is on the way to Blood Bank";
  if (missionStatus === "ARRIVED_AT_BLOOD_BANK") dynamicHeadline = "🚑 Ambulance arrived at Blood Collection Point";
  if (missionStatus === "BLOOD_COLLECTED") dynamicHeadline = "🩸 Blood collected • Transit to Hospital commencing";
  if (missionStatus === "EN_ROUTE_TO_HOSPITAL") dynamicHeadline = "🚑 Emergency Blood is on the way to Hospital";
  if (missionStatus === "ARRIVED_AT_HOSPITAL") dynamicHeadline = "🏥 Ambulance arrived at Emergency Hospital";
  if (missionStatus === "DELIVERED") dynamicHeadline = "✅ Blood Delivered to Clinical Team Successfully";
  if (missionStatus === "COMPLETED") dynamicHeadline = "🏆 Emergency Blood Transport Mission Completed";

  const currentStepIndex = MISSION_TIMELINE_STEPS.findIndex((s) => s.key === missionStatus);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8">
      {/* Top Header */}
      <div className="max-w-6xl mx-auto mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <Link
            href="/hospital/requests"
            className="w-10 h-10 rounded-xl bg-slate-900 hover:bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-all shadow-md"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-0.5 rounded-full text-xs font-extrabold bg-cyan-950 text-cyan-200 border-2 border-cyan-500 flex items-center gap-1.5 shadow-sm">
                <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                Live Telemetry Tracker • Phase 6
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
              {dynamicHeadline}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={fetchLiveTelemetry}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border-2 border-slate-700 text-xs font-bold text-white flex items-center gap-2 shadow-lg transition-all cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 text-cyan-400" />
            <span>Sync Live</span>
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Map Visualizer */}
        <div className="lg:col-span-2 space-y-6">
          <LiveAmbulanceMap
            ambulanceLat={ambulance.latitude}
            ambulanceLng={ambulance.longitude}
            ambulanceName={ambulance.name}
            ambulanceVehicle={ambulance.vehicleNumber}
            bloodBankLat={bloodBank.latitude}
            bloodBankLng={bloodBank.longitude}
            bloodBankName={bloodBank.name}
            hospitalLat={hospital.latitude}
            hospitalLng={hospital.longitude}
            hospitalName={hospital.name}
            missionStage={navigation.stage}
            breadcrumbs={trackingData.breadcrumbs}
            isSimulated={ambulance.locationSource === "DEMO_SIMULATION"}
          />

          {/* Real-time ETA Ribbon (Zomato/Uber style) */}
          <div className="p-6 rounded-3xl bg-slate-900 border-2 border-cyan-500/50 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-cyan-950 border-2 border-cyan-500 text-cyan-300 flex items-center justify-center font-black text-2xl shadow-inner">
                🚑
              </div>
              <div>
                <span className="text-xs font-black text-cyan-300 uppercase tracking-wider">
                  Target Destination • {navigation.stage}
                </span>
                <div className="text-lg font-black text-white mt-0.5">
                  {navigation.targetName}
                </div>
                <div className="text-xs text-slate-300 font-semibold">
                  {navigation.targetLabel}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6 text-right">
              <div>
                <div className="text-xs uppercase font-bold text-slate-400">Distance</div>
                <div className="text-2xl font-black text-white">{navigation.distanceRemainingKm} km</div>
              </div>
              <div className="pl-6 border-l-2 border-slate-800">
                <div className="text-xs uppercase font-bold text-slate-400">Estimated ETA</div>
                <div className="text-2xl font-black text-emerald-300">
                  {navigation.estimatedArrivalMinutes} mins
                </div>
              </div>
            </div>
          </div>

          {/* Hackathon Judge Interactive Stepper Controls */}
          <div className="p-6 rounded-3xl bg-slate-900 border-2 border-slate-700 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-xs font-black text-white uppercase tracking-wider">
                <Play className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span>Judge Interactive Demo Stepper (Hackathon Verification)</span>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-lg bg-amber-950 text-amber-200 border border-amber-500 font-black">
                DEMO MODE
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 text-xs">
              <button
                onClick={() => handleStepSimulation("EN_ROUTE_TO_BLOOD_BANK", -0.001, -0.001)}
                disabled={simulating}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold border border-slate-600 cursor-pointer transition-all"
              >
                1. Step to Blood Bank
              </button>
              <button
                onClick={() => handleStepSimulation("ARRIVED_AT_BLOOD_BANK", 0.0005, 0.0005)}
                disabled={simulating}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold border border-slate-600 cursor-pointer transition-all"
              >
                2. Arrive Blood Bank
              </button>
              <button
                onClick={() => handleStepSimulation("BLOOD_COLLECTED", 0.0002, 0.0002)}
                disabled={simulating}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-black shadow-lg shadow-amber-600/30 cursor-pointer transition-all"
              >
                3. Collect Blood
              </button>
              <button
                onClick={() => handleStepSimulation("EN_ROUTE_TO_HOSPITAL", 0.002, 0.001)}
                disabled={simulating}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold border border-slate-600 cursor-pointer transition-all"
              >
                4. Step to Hospital
              </button>
              <button
                onClick={() => handleStepSimulation("DELIVERED", 0.001, 0.001)}
                disabled={simulating}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black shadow-lg shadow-emerald-600/30 cursor-pointer transition-all"
              >
                5. Deliver Blood
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar: Vehicle & Mission Timeline */}
        <div className="space-y-6">
          {/* Ambulance Pilot Card */}
          <div className="p-6 rounded-3xl bg-slate-900 border-2 border-slate-700 shadow-2xl">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-cyan-950 border border-cyan-500 text-cyan-300 flex items-center justify-center font-bold">
                  <Truck className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-white">{ambulance.name}</h2>
                  <p className="text-xs text-cyan-300 font-mono font-bold mt-0.5">{ambulance.vehicleNumber}</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-emerald-950 text-emerald-300 border border-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> VERIFIED
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold">Live GPS Coordinates:</span>
                <span className="font-mono text-white font-bold">{ambulance.latitude.toFixed(4)}°, {ambulance.longitude.toFixed(4)}°</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold">Telemetry Accuracy:</span>
                <span className="text-amber-300 font-bold">±{ambulance.accuracy} metres</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold">Transit Speed:</span>
                <span className="text-white font-extrabold">{ambulance.speed} km/h</span>
              </div>
            </div>
          </div>

          {/* Live Mission Progress Timeline */}
          <div className="p-6 rounded-3xl bg-slate-900 border-2 border-slate-700 shadow-2xl">
            <h2 className="text-xs font-black text-slate-300 uppercase tracking-wider mb-5 flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>Live Mission Timeline</span>
            </h2>

            <div className="space-y-4">
              {MISSION_TIMELINE_STEPS.map((step, idx) => {
                const isPassed = currentStepIndex >= idx;
                const isCurrent = currentStepIndex === idx;

                return (
                  <div key={step.key} className="flex items-start gap-3.5 relative">
                    {idx < MISSION_TIMELINE_STEPS.length - 1 && (
                      <div
                        className={`absolute left-3.5 top-7 bottom-0 w-1 -mb-4 ${
                          isPassed && currentStepIndex > idx ? "bg-cyan-500" : "bg-slate-800"
                        }`}
                      />
                    )}
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black z-10 ${
                        isCurrent
                          ? "bg-cyan-500 text-slate-950 ring-4 ring-cyan-500/30 animate-pulse"
                          : isPassed
                          ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/40"
                          : "bg-slate-800 text-slate-400 border border-slate-700"
                      }`}
                    >
                      {isPassed && !isCurrent ? "✓" : idx + 1}
                    </div>
                    <div className="flex-1">
                      <div
                        className={`text-xs ${
                          isCurrent
                            ? "text-cyan-300 font-black text-sm"
                            : isPassed
                            ? "text-white font-bold"
                            : "text-slate-400 font-medium"
                        }`}
                      >
                        {step.label}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
