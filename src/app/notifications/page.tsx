"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Bell,
  ArrowLeft,
  RefreshCw,
  CheckCheck,
  Heart,
  GitPullRequest,
  FileCheck2,
  Package,
  Info,
} from "lucide-react";

interface NotificationItem {
  id: string;
  type: "BLOOD_REQUEST" | "DONOR_MATCH" | "VERIFICATION" | "INVENTORY_ALERT" | "REQUEST_UPDATE" | "SYSTEM";
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("");

  const fetchNotifications = () => {
    setLoading(true);
    fetch("/api/notifications")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setNotifications(data.notifications || []);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      });
      if (res.ok) {
        fetchNotifications();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkRead = async (notificationId: string) => {
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId }),
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "BLOOD_REQUEST":
        return <GitPullRequest className="w-5 h-5 text-rose-400" />;
      case "DONOR_MATCH":
        return <Heart className="w-5 h-5 text-rose-400" />;
      case "VERIFICATION":
        return <FileCheck2 className="w-5 h-5 text-amber-400" />;
      case "INVENTORY_ALERT":
        return <Package className="w-5 h-5 text-emerald-400" />;
      case "REQUEST_UPDATE":
        return <GitPullRequest className="w-5 h-5 text-blue-400" />;
      default:
        return <Info className="w-5 h-5 text-slate-400" />;
    }
  };

  const filtered = filterType
    ? notifications.filter((n) => n.type === filterType)
    : notifications;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <Link href="/" className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 mb-2">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </Link>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Bell className="w-6 h-6 text-rose-400" />
            <span>Notifications & Emergency Dispatch Alerts</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time blood matching requests, verification results, and operational alerts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchNotifications}
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs font-semibold text-slate-300 flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-rose-400" />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleMarkAllRead}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5 cursor-pointer border border-slate-700"
          >
            <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Mark All Read</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6">
        {["", "BLOOD_REQUEST", "DONOR_MATCH", "VERIFICATION", "REQUEST_UPDATE"].map((tKey) => (
          <button
            key={tKey}
            onClick={() => setFilterType(tKey)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              filterType === tKey
                ? "bg-rose-600 text-white shadow-md shadow-rose-600/30"
                : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            {tKey === "" ? "All Notifications" : tKey.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      {/* Notification Cards */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            Loading notifications...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 rounded-3xl bg-slate-900/40 border border-slate-800 text-center text-slate-500 text-xs">
            No notifications found.
          </div>
        ) : (
          filtered.map((n) => (
            <div
              key={n.id}
              onClick={() => !n.read && handleMarkRead(n.id)}
              className={`p-5 rounded-2xl border transition-all cursor-pointer flex items-start gap-4 ${
                n.read
                  ? "bg-slate-900/40 border-slate-800/80 text-slate-400"
                  : "bg-slate-900/90 border-rose-500/30 shadow-lg shadow-rose-600/5 text-slate-200"
              }`}
            >
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex-shrink-0">
                {getTypeIcon(n.type)}
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h3 className={`text-sm font-bold ${n.read ? "text-slate-300" : "text-white"}`}>
                    {n.title}
                  </h3>
                  <span className="text-[11px] text-slate-500 whitespace-nowrap">
                    {new Date(n.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} • {new Date(n.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs leading-relaxed">{n.message}</p>
              </div>

              {!n.read && (
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 flex-shrink-0 mt-2 animate-pulse" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
