"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Flame,
  Globe,
  LogOut,
  User,
  ShieldCheck,
  Heart,
  Building2,
  Hospital as HospitalIcon,
  Landmark,
  SlidersHorizontal,
  Settings,
  Bell,
  Package,
  FileCheck2,
  GitPullRequest,
  CheckCircle,
  TrendingUp,
  Activity,
  Radio,
  Truck,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { LanguageCode } from "@/lib/i18n/translations";

interface SessionInfo {
  id: string;
  fullName: string;
  email: string;
  role: string;
  accountStatus: string;
}

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { language, setLanguage, t } = useLanguage();
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.user) {
          setSession(data.user);
          // Fetch unread notifications
          fetch("/api/notifications")
            .then((r) => r.json())
            .then((nData) => {
              if (nData.success) {
                setUnreadCount(nData.unreadCount || 0);
              }
            })
            .catch(() => {});
        } else {
          setSession(null);
        }
      })
      .catch(() => setSession(null))
      .finally(() => setLoading(false));
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setSession(null);
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error(err);
      router.push("/login");
    }
  };

  const getDashboardLink = (role: string) => {
    switch (role) {
      case "YOUTH_DONOR":
        return "/youth/dashboard";
      case "HOSPITAL":
        return "/hospital/dashboard";
      case "BLOOD_BANK":
        return "/blood-bank/dashboard";
      case "GOVERNMENT_OFFICIAL":
        return "/government/dashboard";
      case "SUPER_ADMIN":
        return "/admin/dashboard";
      case "AMBULANCE":
        return "/ambulance/dashboard";
      default:
        return "/login";
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "YOUTH_DONOR":
        return { label: "Youth Donor", color: "bg-rose-500/20 text-rose-300 border-rose-500/40", icon: Heart };
      case "HOSPITAL":
        return { label: "Hospital", color: "bg-blue-500/20 text-blue-300 border-blue-500/40", icon: HospitalIcon };
      case "BLOOD_BANK":
        return { label: "Blood Bank", color: "bg-amber-500/20 text-amber-300 border-amber-500/40", icon: Building2 };
      case "GOVERNMENT_OFFICIAL":
        return { label: "Govt Official", color: "bg-purple-500/20 text-purple-300 border-purple-500/40", icon: Landmark };
      case "SUPER_ADMIN":
        return { label: "Super Admin", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40", icon: ShieldCheck };
      case "AMBULANCE":
        return { label: "Ambulance", color: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40", icon: Truck };
      default:
        return { label: role, color: "bg-slate-800 text-slate-300", icon: User };
    }
  };

  return (
    <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo & Tag */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-600 to-rose-800 flex items-center justify-center shadow-lg shadow-rose-600/30 text-white font-black text-xl group-hover:scale-105 transition-transform">
            <Flame className="w-5 h-5 text-rose-100 fill-rose-200" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-rose-100 to-rose-400">
                {t.brandName}
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-400 border border-rose-500/30">
                🇮🇳 IN
              </span>
            </div>
            <p className="text-[10px] text-slate-400 hidden sm:block">National Blood Intelligence</p>
          </div>
        </Link>

        {/* Right Navigation Controls */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Language Switcher */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs">
            <Globe className="w-3.5 h-3.5 text-slate-400 ml-1" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as LanguageCode)}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer text-xs pr-1 font-medium"
              aria-label="Select Language"
            >
              <option value="en" className="bg-slate-900 text-slate-200">EN (English)</option>
              <option value="hi" className="bg-slate-900 text-slate-200">HI (हिंदी)</option>
              <option value="mr" className="bg-slate-900 text-slate-200">MR (मराठी)</option>
              <option value="te" className="bg-slate-900 text-slate-200">TE (తెలుగు)</option>
            </select>
          </div>

          {!loading && session ? (
            <div className="flex items-center gap-1.5 sm:gap-3">
              {/* Role Badge */}
              {(() => {
                const badge = getRoleBadge(session.role);
                const Icon = badge.icon;
                return (
                  <span
                    className={`hidden xl:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badge.color}`}
                  >
                    <Icon className="w-3 h-3" />
                    {badge.label}
                  </span>
                );
              })()}

              {/* GOVERNMENT & ADMIN AI Links */}
              {(session.role === "GOVERNMENT_OFFICIAL" || session.role === "SUPER_ADMIN") && (
                <div className="hidden lg:flex items-center gap-1">
                  <Link
                    href="/government/dashboard"
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${
                      pathname === "/government/dashboard" ? "bg-purple-900/40 text-purple-300 border border-purple-700/50" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <Landmark className="w-3.5 h-3.5 text-purple-400" />
                    <span>{t.nav.governmentDashboard}</span>
                  </Link>
                  <Link
                    href="/government/ai-forecast"
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${
                      pathname === "/government/ai-forecast" ? "bg-indigo-900/40 text-indigo-300 border border-indigo-700/50" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{t.nav.governmentForecast}</span>
                  </Link>
                  <Link
                    href="/government/emergency"
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${
                      pathname === "/government/emergency" ? "bg-rose-900/40 text-rose-300 border border-rose-700/50" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <Activity className="w-3.5 h-3.5 text-rose-400" />
                    <span>{t.nav.governmentEmergency}</span>
                  </Link>
                  <Link
                    href="/government/campaigns"
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${
                      pathname === "/government/campaigns" ? "bg-cyan-900/40 text-cyan-300 border border-cyan-700/50" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <Flame className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Campaigns</span>
                  </Link>
                  <Link
                    href="/government/live-map"
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${
                      pathname === "/government/live-map" ? "bg-emerald-900/40 text-emerald-300 border border-emerald-700/50" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <Radio className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Live Map</span>
                  </Link>
                </div>
              )}

              {/* AMBULANCE Links */}
              {session.role === "AMBULANCE" && (
                <div className="hidden md:flex items-center gap-1">
                  <Link
                    href="/ambulance/dashboard"
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${
                      pathname === "/ambulance/dashboard" ? "bg-slate-800 text-cyan-300" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <Truck className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Fleet Operations</span>
                  </Link>
                </div>
              )}

              {/* HOSPITAL Links */}
              {session.role === "HOSPITAL" && (
                <div className="hidden md:flex items-center gap-1">
                  <Link
                    href="/hospital/requests"
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${
                      pathname === "/hospital/requests" ? "bg-slate-800 text-blue-300" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <GitPullRequest className="w-3.5 h-3.5 text-blue-400" />
                    <span>{t.nav.hospitalRequests}</span>
                  </Link>
                </div>
              )}

              {/* BLOOD BANK Links */}
              {session.role === "BLOOD_BANK" && (
                <div className="hidden lg:flex items-center gap-1">
                  <Link
                    href="/blood-bank/inventory"
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${
                      pathname === "/blood-bank/inventory" ? "bg-slate-800 text-amber-300" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <Package className="w-3.5 h-3.5 text-amber-400" />
                    <span>{t.nav.bloodBankInventory}</span>
                  </Link>
                  <Link
                    href="/blood-bank/requests"
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${
                      pathname === "/blood-bank/requests" ? "bg-slate-800 text-amber-300" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <GitPullRequest className="w-3.5 h-3.5 text-amber-400" />
                    <span>{t.nav.bloodBankRequests}</span>
                  </Link>
                  <Link
                    href="/blood-bank/verifications"
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${
                      pathname === "/blood-bank/verifications" ? "bg-slate-800 text-amber-300" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <FileCheck2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>{t.nav.bloodBankVerifications}</span>
                  </Link>
                </div>
              )}

              {/* YOUTH DONOR Links */}
              {session.role === "YOUTH_DONOR" && (
                <div className="hidden md:flex items-center gap-1">
                  <Link
                    href="/youth/verification"
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${
                      pathname === "/youth/verification" ? "bg-slate-800 text-rose-300" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <CheckCircle className="w-3.5 h-3.5 text-rose-400" />
                    <span>{t.nav.youthVerification}</span>
                  </Link>
                  <Link
                    href="/youth/donations"
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${
                      pathname === "/youth/donations" ? "bg-slate-800 text-rose-300" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <Heart className="w-3.5 h-3.5 text-rose-400" />
                    <span>{t.nav.youthDonations}</span>
                  </Link>
                  <Link
                    href="/youth/profile"
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${
                      pathname === "/youth/profile" ? "bg-slate-800 text-rose-300" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <User className="w-3.5 h-3.5 text-rose-400" />
                    <span>{t.nav.profile}</span>
                  </Link>
                </div>
              )}

              {/* SUPER ADMIN Admin Links */}
              {session.role === "SUPER_ADMIN" && (
                <div className="hidden xl:flex items-center gap-1">
                  <Link
                    href="/admin/users"
                    className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      pathname === "/admin/users" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {t.nav.adminUsers}
                  </Link>
                  <Link
                    href="/admin/organizations"
                    className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      pathname === "/admin/organizations" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {t.nav.adminOrgs}
                  </Link>
                  <Link
                    href="/admin/audit-logs"
                    className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      pathname === "/admin/audit-logs" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {t.nav.adminAudit}
                  </Link>
                </div>
              )}

              {/* Notifications Link with Live Badge */}
              <Link
                href="/notifications"
                className={`p-2 rounded-lg text-xs font-medium transition-colors relative ${
                  pathname === "/notifications" ? "bg-slate-800 text-rose-300" : "text-slate-400 hover:text-slate-200"
                }`}
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-rose-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse shadow-md shadow-rose-600/50">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>

              {/* Privacy Settings Link */}
              <Link
                href="/settings/privacy"
                className={`p-2 rounded-lg text-xs font-medium transition-colors ${
                  pathname === "/settings/privacy" ? "bg-slate-800 text-rose-300" : "text-slate-400 hover:text-slate-200"
                }`}
                title="Privacy Settings"
              >
                <Settings className="w-4 h-4" />
              </Link>

              {/* Main Dashboard Button */}
              <Link
                href={getDashboardLink(session.role)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/20 transition-all flex items-center gap-1.5"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t.nav.dashboard}</span>
              </Link>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors cursor-pointer"
                title={t.nav.logout}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
              >
                {t.nav.login}
              </Link>
              <Link
                href="/register"
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/20 transition-all"
              >
                {t.nav.register}
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
