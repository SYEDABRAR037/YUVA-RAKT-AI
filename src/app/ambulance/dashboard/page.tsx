"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Truck,
  MapPin,
  Navigation,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Building2,
  Activity,
  ArrowRight,
  Shield,
  Radio,
  RefreshCw,
  Compass,
  Play,
  Square,
  Smartphone,
  Gauge,
  Wifi,
} from "lucide-react";
import { formatBloodGroup, formatComponentType } from "@/lib/utils";

export default function AmbulanceDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Live GPS Telemetry State
  const [isGpsActive, setIsGpsActive] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<
    "STOPPED" | "ACTIVE" | "PERMISSION_DENIED" | "GPS_UNAVAILABLE" | "PAUSED"
  >("STOPPED");
  const [currentLat, setCurrentLat] = useState<number>(18.5204);
  const [currentLng, setCurrentLng] = useState<number>(73.8567);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [speed, setSpeed] = useState<number | null>(null);
  const [lastUpdateSecondsAgo, setLastUpdateSecondsAgo] = useState<number>(0);
  const [trackingMode, setTrackingMode] = useState<"REAL_GPS" | "DEMO_SIMULATION">("REAL_GPS");

  const watchIdRef = useRef<number | null>(null);
  const lastPushTimeRef = useRef<number>(0);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/ambulance/dashboard");
      const json = await res.json();
      if (json.success) {
        setDashboardData(json.data);
        if (json.data.ambulance) {
          setCurrentLat(json.data.ambulance.currentLatitude || 18.5204);
          setCurrentLng(json.data.ambulance.currentLongitude || 73.8567);
          setIsGpsActive(!!json.data.ambulance.isTrackingActive);
          if (json.data.ambulance.isTrackingActive && gpsStatus === "STOPPED") {
            setGpsStatus("ACTIVE");
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [gpsStatus]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // Live seconds ticker
  useEffect(() => {
    const timer = setInterval(() => {
      if (lastPushTimeRef.current > 0) {
        setLastUpdateSecondsAgo(Math.round((Date.now() - lastPushTimeRef.current) / 1000));
      }
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Location push handler
  const pushLocationUpdate = useCallback(
    async (lat: number, lng: number, acc?: number, spd?: number, source = "REAL_GPS") => {
      try {
        const res = await fetch("/api/ambulance/location", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            latitude: lat,
            longitude: lng,
            accuracy: acc,
            speed: spd,
            source,
            missionId: dashboardData?.activeMission?.id,
          }),
        });
        const data = await res.json();
        if (data.success) {
          lastPushTimeRef.current = Date.now();
          setLastUpdateSecondsAgo(0);
        }
      } catch (err) {
        console.error("Location push error", err);
      }
    },
    [dashboardData]
  );

  // Start Real Browser/Device GPS
  const startRealDeviceGps = () => {
    if (!navigator.geolocation) {
      setGpsStatus("GPS_UNAVAILABLE");
      setMessage("Geolocation API is not supported on this device/browser.");
      return;
    }

    setGpsStatus("ACTIVE");
    setIsGpsActive(true);
    fetch("/api/ambulance/tracking/toggle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isTracking: true }),
    }).catch(() => {});

    // Watch position continuously
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const acc = pos.coords.accuracy;
        const spd = pos.coords.speed ? Math.round(pos.coords.speed * 3.6) : 35; // Convert m/s to km/h

        setCurrentLat(lat);
        setCurrentLng(lng);
        setAccuracy(Math.round(acc));
        setSpeed(spd);
        setGpsStatus("ACTIVE");

        // Throttle updates to at most once per 2.5 seconds
        if (Date.now() - lastPushTimeRef.current >= 2500) {
          pushLocationUpdate(lat, lng, acc, spd, "REAL_GPS");
        }
      },
      (err) => {
        console.error("GPS Watch Error", err);
        if (err.code === err.PERMISSION_DENIED) {
          setGpsStatus("PERMISSION_DENIED");
          setMessage("Location permission was denied. Please allow GPS access in your browser settings.");
        } else {
          setGpsStatus("GPS_UNAVAILABLE");
          setMessage("Unable to acquire live GPS position.");
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 1000,
        timeout: 10000,
      }
    );
  };

  // Stop GPS Tracking
  const stopGpsTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setGpsStatus("STOPPED");
    setIsGpsActive(false);
    fetch("/api/ambulance/tracking/toggle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isTracking: false }),
    }).catch(() => {});
    setMessage("GPS location tracking stopped.");
  };

  const handleMissionResponse = async (missionId: string, action: "ACCEPT" | "DECLINE") => {
    try {
      setActionLoading(true);
      setMessage(null);
      const res = await fetch(`/api/ambulance/missions/${missionId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage(`Mission ${action === "ACCEPT" ? "accepted! Live route tracking engaged." : "declined."}`);
        fetchDashboard();
        if (action === "ACCEPT") {
          startRealDeviceGps();
        }
      } else {
        setMessage(data.error || "Action failed");
      }
    } catch (err: any) {
      setMessage(err.message || "Network error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateStatus = async (missionId: string, targetStatus: string) => {
    try {
      setActionLoading(true);
      setMessage(null);
      const res = await fetch(`/api/ambulance/missions/${missionId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage(`Mission status updated to '${targetStatus}'.`);
        fetchDashboard();
        if (targetStatus === "COMPLETED") {
          stopGpsTracking();
        }
      } else {
        setMessage(data.error || "Status update failed");
      }
    } catch (err: any) {
      setMessage(err.message || "Network error");
    } finally {
      setActionLoading(false);
    }
  };

  // Demo GPS Stepper (advances waypoint along transit corridor)
  const handleSimulateStep = (dLat: number, dLng: number) => {
    const nextLat = Math.round((currentLat + dLat) * 10000) / 10000;
    const nextLng = Math.round((currentLng + dLng) * 10000) / 10000;
    setCurrentLat(nextLat);
    setCurrentLng(nextLng);
    setAccuracy(8);
    setSpeed(42);
    setGpsStatus("ACTIVE");
    pushLocationUpdate(nextLat, nextLng, 8, 42, "DEMO_SIMULATION");
    setMessage(`Simulated step pushed: (${nextLat}, ${nextLng})`);
  };

  const activeMission = dashboardData?.activeMission;
  const navigation = dashboardData?.navigation;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
              Live Telemetry Terminal • Phase 5.1 Real-Time GPS
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Truck className="w-8 h-8 text-cyan-400" />
            Ambulance Fleet Operations
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Unit: <strong className="text-white">{dashboardData?.ambulance?.displayName || "MH-12-EM-108"}</strong> ({dashboardData?.ambulance?.district || "Pune"})
          </p>
        </div>

        <button
          onClick={fetchDashboard}
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-2 shadow-lg cursor-pointer transition-all self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-cyan-400" : ""}`} />
          <span>Refresh Terminal</span>
        </button>
      </div>

      {message && (
        <div className="mb-6 p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-cyan-400" />
            <span>{message}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-white text-xs">
            ✕
          </button>
        </div>
      )}

      {/* GPS Telemetry Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-cyan-500/30">
          <span className="text-[11px] font-semibold text-slate-400 uppercase flex items-center gap-1.5">
            <Wifi className="w-3.5 h-3.5 text-cyan-400" /> GPS Status
          </span>
          <div className="text-base font-bold mt-1 flex items-center gap-2">
            {gpsStatus === "ACTIVE" ? (
              <span className="text-emerald-400 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                ACTIVE 🟢
              </span>
            ) : gpsStatus === "PERMISSION_DENIED" ? (
              <span className="text-rose-400">DENIED 🔴</span>
            ) : (
              <span className="text-slate-400">STANDBY ⚪</span>
            )}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 uppercase flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-amber-400" /> Accuracy & Speed
          </span>
          <div className="text-sm font-bold text-white mt-1">
            {accuracy ? `±${accuracy}m` : "±8m"} • {speed || 35} km/h
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 uppercase flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-blue-400" /> Last Broadcast
          </span>
          <div className="text-sm font-bold text-white mt-1">
            {lastUpdateSecondsAgo}s ago
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 uppercase flex items-center gap-1.5">
            <Gauge className="w-3.5 h-3.5 text-purple-400" /> Telemetry Source
          </span>
          <div className="text-sm font-bold text-cyan-300 mt-1">
            {trackingMode}
          </div>
        </div>
      </div>

      {/* Live GPS Broadcast Controls */}
      <div className="p-6 rounded-3xl bg-slate-900/90 border border-cyan-500/40 shadow-2xl mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-cyan-400" />
            Live Device GPS Hardware Telemetry
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Transmits real-time physical GPS coordinates to central command and authorized hospital terminals.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {!isGpsActive ? (
            <button
              onClick={startRealDeviceGps}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold text-xs shadow-xl shadow-emerald-600/30 flex items-center gap-2 cursor-pointer transition-all"
            >
              <Play className="w-4 h-4" />
              <span>START LIVE GPS TRACKING</span>
            </button>
          ) : (
            <button
              onClick={stopGpsTracking}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-xs shadow-xl shadow-rose-600/30 flex items-center gap-2 cursor-pointer transition-all animate-pulse"
            >
              <Square className="w-4 h-4" />
              <span>STOP LIVE TRACKING</span>
            </button>
          )}
        </div>
      </div>

      {/* Active Mission Card */}
      {activeMission ? (
        <div className="mb-8 p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-cyan-500/40 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <span className="px-3 py-1 rounded-md text-xs font-extrabold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 uppercase tracking-wider">
                Active Transport Mission • {activeMission.status}
              </span>
              <h2 className="text-xl font-bold text-white mt-2">
                Emergency Blood Transport Requisition
              </h2>
            </div>
            <div className="text-xs text-slate-400 font-mono">
              Mission ID: {activeMission.id}
            </div>
          </div>

          {/* Dynamic Mission-Aware Navigation Banner */}
          {navigation && (
            <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-cyan-950/60 to-slate-950/80 border border-cyan-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">
                  Target Destination ({navigation.stage})
                </span>
                <div className="text-base font-bold text-white mt-0.5">
                  {navigation.targetName} ({navigation.targetLabel})
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Remaining Distance: <strong className="text-slate-200">{navigation.distanceKm} km</strong> • ETA: <strong className="text-emerald-400">{navigation.etaMinutes} mins</strong>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-cyan-300">
                  {currentLat.toFixed(4)}° N, {currentLng.toFixed(4)}° E
                </span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
              <span className="text-[11px] font-semibold text-emerald-400 uppercase flex items-center gap-1.5 mb-1">
                <Building2 className="w-3.5 h-3.5" /> 1. Origin (Blood Centre)
              </span>
              <div className="text-sm font-bold text-white">{activeMission.sourceBloodBank?.name || "Blood Bank"}</div>
              <div className="text-xs text-slate-400 mt-1">{activeMission.sourceBloodBank?.address || "Address"}</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
              <span className="text-[11px] font-semibold text-rose-400 uppercase flex items-center gap-1.5 mb-1">
                <Activity className="w-3.5 h-3.5" /> 2. Destination (Hospital)
              </span>
              <div className="text-sm font-bold text-white">{activeMission.destinationHospital?.name || "Hospital"}</div>
              <div className="text-xs text-slate-400 mt-1">{activeMission.destinationHospital?.address || "Address"}</div>
            </div>
          </div>

          {/* Action State Machine Progression */}
          <div className="pt-4 border-t border-slate-800">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Mission Workflow Progression:
            </div>

            {activeMission.status === "ASSIGNED" ? (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleMissionResponse(activeMission.id, "ACCEPT")}
                  disabled={actionLoading}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition-all cursor-pointer"
                >
                  ✓ Accept Mission Offer
                </button>
                <button
                  onClick={() => handleMissionResponse(activeMission.id, "DECLINE")}
                  disabled={actionLoading}
                  className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 transition-all cursor-pointer"
                >
                  ✕ Decline Mission
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {activeMission.status === "ACCEPTED" && (
                  <button
                    onClick={() => handleUpdateStatus(activeMission.id, "EN_ROUTE_TO_BLOOD_BANK")}
                    disabled={actionLoading}
                    className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold cursor-pointer"
                  >
                    1. En Route to Blood Bank →
                  </button>
                )}

                {activeMission.status === "EN_ROUTE_TO_BLOOD_BANK" && (
                  <button
                    onClick={() => handleUpdateStatus(activeMission.id, "ARRIVED_AT_BLOOD_BANK")}
                    disabled={actionLoading}
                    className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold cursor-pointer"
                  >
                    2. Arrived at Blood Bank →
                  </button>
                )}

                {activeMission.status === "ARRIVED_AT_BLOOD_BANK" && (
                  <button
                    onClick={() => handleUpdateStatus(activeMission.id, "BLOOD_COLLECTED")}
                    disabled={actionLoading}
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold cursor-pointer"
                  >
                    3. Blood Collected (Handover Complete) →
                  </button>
                )}

                {activeMission.status === "BLOOD_COLLECTED" && (
                  <button
                    onClick={() => handleUpdateStatus(activeMission.id, "EN_ROUTE_TO_HOSPITAL")}
                    disabled={actionLoading}
                    className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold cursor-pointer"
                  >
                    4. En Route to Hospital →
                  </button>
                )}

                {activeMission.status === "EN_ROUTE_TO_HOSPITAL" && (
                  <button
                    onClick={() => handleUpdateStatus(activeMission.id, "ARRIVED_AT_HOSPITAL")}
                    disabled={actionLoading}
                    className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold cursor-pointer"
                  >
                    5. Arrived at Hospital →
                  </button>
                )}

                {activeMission.status === "ARRIVED_AT_HOSPITAL" && (
                  <button
                    onClick={() => handleUpdateStatus(activeMission.id, "DELIVERED")}
                    disabled={actionLoading}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer"
                  >
                    6. Blood Delivered to Clinical Staff →
                  </button>
                )}

                {activeMission.status === "DELIVERED" && (
                  <button
                    onClick={() => handleUpdateStatus(activeMission.id, "COMPLETED")}
                    disabled={actionLoading}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer"
                  >
                    7. Complete Mission & Return to Standby
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="mb-8 p-8 rounded-3xl bg-slate-900/60 border border-slate-800 text-center">
          <Truck className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <h3 className="text-base font-bold text-white">No Active Emergency Missions</h3>
          <p className="text-xs text-slate-400 mt-1">
            Unit MH-12-EM-108 is currently on standby and available for autonomous emergency dispatch.
          </p>
        </div>
      )}

      {/* Demo Simulation Controls for Indoor Hackathon Testing */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Indoor Demo Simulation Controls
            </h3>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">
            ⚠ DEMO SIMULATED GPS
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            onClick={() => handleSimulateStep(0.002, 0.001)}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer"
          >
            Step North-East (+0.002, +0.001)
          </button>
          <button
            onClick={() => handleSimulateStep(-0.002, 0.001)}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer"
          >
            Step South-East (-0.002, +0.001)
          </button>
          <button
            onClick={() => handleSimulateStep(0.001, -0.002)}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer"
          >
            Step North-West (+0.001, -0.002)
          </button>
        </div>
      </div>
    </div>
  );
}
