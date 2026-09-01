"use client";

import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface LiveAmbulanceMapProps {
  ambulanceLat: number;
  ambulanceLng: number;
  ambulanceName: string;
  ambulanceVehicle: string;
  bloodBankLat: number;
  bloodBankLng: number;
  bloodBankName: string;
  hospitalLat: number;
  hospitalLng: number;
  hospitalName: string;
  missionStage: "PICKUP_STAGE" | "DELIVERY_STAGE" | "COMPLETED_STAGE";
  breadcrumbs?: Array<{ latitude: number; longitude: number }>;
  isSimulated?: boolean;
}

export default function LiveAmbulanceMap({
  ambulanceLat,
  ambulanceLng,
  ambulanceName,
  ambulanceVehicle,
  bloodBankLat,
  bloodBankLng,
  bloodBankName,
  hospitalLat,
  hospitalLng,
  hospitalName,
  missionStage,
  breadcrumbs = [],
  isSimulated = false,
}: LiveAmbulanceMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const ambulanceMarkerRef = useRef<any>(null);
  const routePolylineRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return;

    // Initialize Map if not already created
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [ambulanceLat || 18.5204, ambulanceLng || 73.8567],
        zoom: 14,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;

      // Create Custom Icons
      const ambulanceIcon = L.divIcon({
        className: "custom-ambulance-marker",
        html: `
          <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 44px; height: 44px;">
            <div style="position: absolute; width: 44px; height: 44px; background: rgba(6, 182, 212, 0.3); border-radius: 50%; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="position: relative; width: 34px; height: 34px; background: #0891b2; border: 2.5px solid #ffffff; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(0,0,0,0.4); font-size: 18px;">
              🚑
            </div>
          </div>
        `,
        iconSize: [44, 44],
        iconAnchor: [22, 22],
      });

      const bloodBankIcon = L.divIcon({
        className: "custom-bloodbank-marker",
        html: `
          <div style="display: flex; flex-direction: column; align-items: center;">
            <div style="width: 32px; height: 32px; background: #059669; border: 2px solid #ffffff; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.3); font-size: 16px;">
              🩸
            </div>
            <div style="margin-top: 2px; background: rgba(15, 23, 42, 0.85); color: #6ee7b7; font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 4px; border: 1px solid rgba(5, 150, 105, 0.4); white-space: nowrap;">
              Blood Pickup
            </div>
          </div>
        `,
        iconSize: [32, 48],
        iconAnchor: [16, 24],
      });

      const hospitalIcon = L.divIcon({
        className: "custom-hospital-marker",
        html: `
          <div style="display: flex; flex-direction: column; align-items: center;">
            <div style="width: 32px; height: 32px; background: #e11d48; border: 2px solid #ffffff; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.3); font-size: 16px;">
              🏥
            </div>
            <div style="margin-top: 2px; background: rgba(15, 23, 42, 0.85); color: #fda4af; font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 4px; border: 1px solid rgba(225, 29, 72, 0.4); white-space: nowrap;">
              Hospital Destination
            </div>
          </div>
        `,
        iconSize: [32, 48],
        iconAnchor: [16, 24],
      });

      // Add Blood Bank Marker
      L.marker([bloodBankLat, bloodBankLng], { icon: bloodBankIcon })
        .addTo(map)
        .bindPopup(`<strong>${bloodBankName}</strong><br/>Blood Collection Center`);

      // Add Hospital Marker
      L.marker([hospitalLat, hospitalLng], { icon: hospitalIcon })
        .addTo(map)
        .bindPopup(`<strong>${hospitalName}</strong><br/>Emergency Clinical Destination`);

      // Add Moving Ambulance Marker
      ambulanceMarkerRef.current = L.marker([ambulanceLat, ambulanceLng], { icon: ambulanceIcon })
        .addTo(map)
        .bindPopup(`<strong>${ambulanceName} (${ambulanceVehicle})</strong><br/>Live GPS Telemetry active`);

      // Initial route
      const targetLat = missionStage === "PICKUP_STAGE" ? bloodBankLat : hospitalLat;
      const targetLng = missionStage === "PICKUP_STAGE" ? bloodBankLng : hospitalLng;

      routePolylineRef.current = L.polyline(
        [
          [ambulanceLat, ambulanceLng],
          [targetLat, targetLng],
        ],
        {
          color: "#06b6d4",
          weight: 4,
          opacity: 0.8,
          dashArray: "8, 8",
        }
      ).addTo(map);

      // Fit bounds
      const bounds = L.latLngBounds([
        [ambulanceLat, ambulanceLng],
        [bloodBankLat, bloodBankLng],
        [hospitalLat, hospitalLng],
      ]);
      map.fitBounds(bounds, { padding: [50, 50] });
    } else {
      // Smoothly update ambulance marker position
      if (ambulanceMarkerRef.current) {
        ambulanceMarkerRef.current.setLatLng([ambulanceLat, ambulanceLng]);
      }

      // Update route polyline
      if (routePolylineRef.current) {
        const targetLat = missionStage === "PICKUP_STAGE" ? bloodBankLat : hospitalLat;
        const targetLng = missionStage === "PICKUP_STAGE" ? bloodBankLng : hospitalLng;
        routePolylineRef.current.setLatLngs([
          [ambulanceLat, ambulanceLng],
          [targetLat, targetLng],
        ]);
      }
    }
  }, [
    ambulanceLat,
    ambulanceLng,
    ambulanceName,
    ambulanceVehicle,
    bloodBankLat,
    bloodBankLng,
    bloodBankName,
    hospitalLat,
    hospitalLng,
    hospitalName,
    missionStage,
    breadcrumbs,
  ]);

  return (
    <div className="relative w-full h-[480px] sm:h-[560px] rounded-3xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950">
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Floating Tactical Overlay Badge */}
      <div className="absolute top-4 left-4 z-10 bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700 shadow-xl flex items-center gap-2 text-xs font-mono text-cyan-300">
        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
        <span>
          {isSimulated ? "DEMO MODE (SIMULATED GPS)" : "REAL DEVICE GPS TRACKING"}
        </span>
      </div>

      <div className="absolute bottom-4 right-4 z-10 bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700 shadow-xl text-[10px] text-slate-400 font-mono">
        OpenStreetMap • Real-Time Interpolation
      </div>
    </div>
  );
}
