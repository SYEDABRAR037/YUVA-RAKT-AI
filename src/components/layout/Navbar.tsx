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
  Users,
  FileText,
  Menu,
  X,
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
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
        return { label: "Youth Donor", color: "bg-rose-950 text-rose-300 border-rose-500/50", icon: Heart };
      case "HOSPITAL":
        return { label: "Hospital", color: "bg-blue-950 text-blue-300 border-blue-500/50", icon: HospitalIcon };
      case "BLOOD_BANK":
        return { label: "Blood Bank", color: "bg-amber-950 text-amber-300 border-amber-500/50", icon: Building2 };
      case "GOVERNMENT_OFFICIAL":
        return { label: "Govt Official", color: "bg-purple-950 text-purple-300 border-purple-500/50", icon: Landmark };
      case "SUPER_ADMIN":
        return { label: "Super Admin", color: "bg-emerald-950 text-emerald-300 border-emerald-500/50", icon: ShieldCheck };
      case "AMBULANCE":
        return { label: "Ambulance", color: "bg-cyan-950 text-cyan-300 border-cyan-500/50", icon: Truck };
      default:
        return { label: role, color: "bg-slate-900 text-slate-300 border-slate-700", icon: User };
    }
  };

  return (
    <header className="border-b-2 border-slate-800 bg-slate-950 sticky top-0 z-50 shadow-xl">
      <div className="w-full max-w-[1560px] mx-auto px-3 sm:px-5 lg:px-6 h-16 flex items-center justify-between gap-2 lg:gap-4">
        {/* Brand Logo & Tag */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-600 to-rose-800 flex items-center justify-center shadow-lg shadow-rose-600/40 text-white font-black text-lg group-hover:scale-105 transition-transform shrink-0">
            <Flame className="w-4 h-4 text-rose-100 fill-rose-200" />
          </div>
          <div className="flex flex-col shrink-0">
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="text-base sm:text-lg font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-rose-100 to-rose-400">
                {t.brandName}
              </span>
              <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">
                🇮🇳 IN
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium hidden 2xl:block whitespace-nowrap">National Blood Intelligence</p>
          </div>
        </Link>

        {/* Center / Role Nav Items (Desktop Horizontal Bar) */}
        {!loading && session && (
          <nav className="hidden lg:flex items-center gap-1 xl:gap-1.5 overflow-x-auto no-scrollbar shrink-0">
            {/* SUPER ADMIN Navigation Links */}
            {session.role === "SUPER_ADMIN" && (
              <>
                <Link
                  href="/government/dashboard"
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                    pathname === "/government/dashboard"
                      ? "bg-purple-950 text-purple-200 border-2 border-purple-500 shadow-md"
                      : "text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent"
                  }`}
                  title="National Blood Intelligence Command Center"
                >
                  <Landmark className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <span>National Blood Intelligence</span>
                </Link>

                <Link
                  href="/government/ai-forecast"
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                    pathname === "/government/ai-forecast"
                      ? "bg-indigo-950 text-indigo-200 border-2 border-indigo-500 shadow-md"
                      : "text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent"
                  }`}
                  title="AI Demand Forecast & Shortage Risks"
                >
                  <TrendingUp className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span>AI Demand Forecast</span>
                </Link>

                <Link
                  href="/government/emergency"
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                    pathname === "/government/emergency"
                      ? "bg-rose-950 text-rose-200 border-2 border-rose-500 shadow-md"
                      : "text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent"
                  }`}
                  title="Emergency Radar & Mobilization"
                >
                  <Activity className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span>Emergency Radar</span>
                </Link>

                <Link
                  href="/government/campaigns"
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                    pathname === "/government/campaigns"
                      ? "bg-cyan-950 text-cyan-200 border-2 border-cyan-500 shadow-md"
                      : "text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent"
                  }`}
                  title="Mobilization Campaigns"
                >
                  <Flame className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>Campaigns</span>
                </Link>

                <Link
                  href="/government/live-map"
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                    pathname === "/government/live-map"
                      ? "bg-emerald-950 text-emerald-200 border-2 border-emerald-500 shadow-md"
                      : "text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent"
                  }`}
                  title="National Live Blood Intelligence Map"
                >
                  <Radio className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Live Map</span>
                </Link>

                {/* Platform Admin Direct Links */}
                <div className="h-4 w-px bg-slate-800 mx-1 shrink-0" />

                <Link
                  href="/admin/users"
                  className={`px-2 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 flex items-center gap-1 ${
                    pathname === "/admin/users"
                      ? "bg-slate-800 text-white border border-slate-600 shadow-sm"
                      : "text-slate-400 hover:text-white hover:bg-slate-900"
                  }`}
                >
                  <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Users</span>
                </Link>

                <Link
                  href="/admin/organizations"
                  className={`px-2 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 flex items-center gap-1 ${
                    pathname === "/admin/organizations"
                      ? "bg-slate-800 text-white border border-slate-600 shadow-sm"
                      : "text-slate-400 hover:text-white hover:bg-slate-900"
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Organizations</span>
                </Link>

                <Link
                  href="/admin/audit-logs"
                  className={`px-2 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 flex items-center gap-1 ${
                    pathname === "/admin/audit-logs"
                      ? "bg-slate-800 text-white border border-slate-600 shadow-sm"
                      : "text-slate-400 hover:text-white hover:bg-slate-900"
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Audit Logs</span>
                </Link>
              </>
            )}

            {/* GOVERNMENT OFFICIAL (Standard) Links */}
            {session.role === "GOVERNMENT_OFFICIAL" && (
              <>
                <Link
                  href="/government/dashboard"
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                    pathname === "/government/dashboard"
                      ? "bg-purple-950 text-purple-200 border-2 border-purple-500 shadow-md"
                      : "text-slate-300 hover:text-white hover:bg-slate-900"
                  }`}
                >
                  <Landmark className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <span>{t.nav.governmentDashboard}</span>
                </Link>
                <Link
                  href="/government/ai-forecast"
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                    pathname === "/government/ai-forecast"
                      ? "bg-indigo-950 text-indigo-200 border-2 border-indigo-500 shadow-md"
                      : "text-slate-300 hover:text-white hover:bg-slate-900"
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span>{t.nav.governmentForecast}</span>
                </Link>
                <Link
                  href="/government/emergency"
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                    pathname === "/government/emergency"
                      ? "bg-rose-950 text-rose-200 border-2 border-rose-500 shadow-md"
                      : "text-slate-300 hover:text-white hover:bg-slate-900"
                  }`}
                >
                  <Activity className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span>{t.nav.governmentEmergency}</span>
                </Link>
                <Link
                  href="/government/campaigns"
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                    pathname === "/government/campaigns"
                      ? "bg-cyan-950 text-cyan-200 border-2 border-cyan-500 shadow-md"
                      : "text-slate-300 hover:text-white hover:bg-slate-900"
                  }`}
                >
                  <Flame className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>Campaigns</span>
                </Link>
                <Link
                  href="/government/live-map"
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                    pathname === "/government/live-map"
                      ? "bg-emerald-950 text-emerald-200 border-2 border-emerald-500 shadow-md"
                      : "text-slate-300 hover:text-white hover:bg-slate-900"
                  }`}
                >
                  <Radio className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Live Map</span>
                </Link>
              </>
            )}

            {/* AMBULANCE Links */}
            {session.role === "AMBULANCE" && (
              <Link
                href="/ambulance/dashboard"
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                  pathname === "/ambulance/dashboard"
                    ? "bg-cyan-950 text-cyan-200 border-2 border-cyan-500"
                    : "text-slate-300 hover:text-white hover:bg-slate-900"
                }`}
              >
                <Truck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>Fleet Operations</span>
              </Link>
            )}

            {/* HOSPITAL Links */}
            {session.role === "HOSPITAL" && (
              <Link
                href="/hospital/requests"
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                  pathname === "/hospital/requests"
                    ? "bg-blue-950 text-blue-200 border-2 border-blue-500"
                    : "text-slate-300 hover:text-white hover:bg-slate-900"
                }`}
              >
                <GitPullRequest className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span>{t.nav.hospitalRequests}</span>
              </Link>
            )}

            {/* BLOOD BANK Links */}
            {session.role === "BLOOD_BANK" && (
              <>
                <Link
                  href="/blood-bank/inventory"
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                    pathname === "/blood-bank/inventory"
                      ? "bg-amber-950 text-amber-200 border-2 border-amber-500"
                      : "text-slate-300 hover:text-white hover:bg-slate-900"
                  }`}
                >
                  <Package className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>{t.nav.bloodBankInventory}</span>
                </Link>
                <Link
                  href="/blood-bank/requests"
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                    pathname === "/blood-bank/requests"
                      ? "bg-amber-950 text-amber-200 border-2 border-amber-500"
                      : "text-slate-300 hover:text-white hover:bg-slate-900"
                  }`}
                >
                  <GitPullRequest className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>{t.nav.bloodBankRequests}</span>
                </Link>
                <Link
                  href="/blood-bank/verifications"
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                    pathname === "/blood-bank/verifications"
                      ? "bg-amber-950 text-amber-200 border-2 border-amber-500"
                      : "text-slate-300 hover:text-white hover:bg-slate-900"
                  }`}
                >
                  <FileCheck2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>{t.nav.bloodBankVerifications}</span>
                </Link>
              </>
            )}

            {/* YOUTH DONOR Links */}
            {session.role === "YOUTH_DONOR" && (
              <>
                <Link
                  href="/youth/verification"
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                    pathname === "/youth/verification"
                      ? "bg-rose-950 text-rose-200 border-2 border-rose-500"
                      : "text-slate-300 hover:text-white hover:bg-slate-900"
                  }`}
                >
                  <CheckCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span>{t.nav.youthVerification}</span>
                </Link>
                <Link
                  href="/youth/donations"
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                    pathname === "/youth/donations"
                      ? "bg-rose-950 text-rose-200 border-2 border-rose-500"
                      : "text-slate-300 hover:text-white hover:bg-slate-900"
                  }`}
                >
                  <Heart className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span>{t.nav.youthDonations}</span>
                </Link>
                <Link
                  href="/youth/profile"
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                    pathname === "/youth/profile"
                      ? "bg-rose-950 text-rose-200 border-2 border-rose-500"
                      : "text-slate-300 hover:text-white hover:bg-slate-900"
                  }`}
                >
                  <User className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span>{t.nav.profile}</span>
                </Link>
              </>
            )}
          </nav>
        )}

        {/* Right Navigation Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Language Switcher */}
          <div className="flex items-center gap-1 bg-slate-900 border-2 border-slate-700 rounded-xl p-1 text-xs shrink-0">
            <Globe className="w-3.5 h-3.5 text-slate-400 ml-1 shrink-0" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as LanguageCode)}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer text-xs pr-1 font-bold"
              aria-label="Select Language"
            >
              <option value="en" className="bg-slate-900 text-slate-200">EN (English)</option>
              <option value="hi" className="bg-slate-900 text-slate-200">HI (हिंदी)</option>
              <option value="mr" className="bg-slate-900 text-slate-200">MR (मराठी)</option>
              <option value="te" className="bg-slate-900 text-slate-200">TE (తెలుగు)</option>
            </select>
          </div>

          {!loading && session ? (
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Role Badge */}
              {(() => {
                const badge = getRoleBadge(session.role);
                const Icon = badge.icon;
                return (
                  <span
                    className={`hidden 2xl:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black border-2 shrink-0 whitespace-nowrap ${badge.color}`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span>{badge.label}</span>
                  </span>
                );
              })()}

              {/* Notifications Link with Live Badge */}
              <Link
                href="/notifications"
                className={`p-2 rounded-xl text-xs font-bold transition-all relative border border-slate-700 bg-slate-900 hover:bg-slate-800 shrink-0 ${
                  pathname === "/notifications" ? "bg-slate-800 text-rose-300 border-rose-500/50" : "text-slate-300 hover:text-white"
                }`}
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 text-white text-[10px] font-black rounded-full flex items-center justify-center animate-pulse shadow-md shadow-rose-600/50">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>

              {/* Privacy Settings Link */}
              <Link
                href="/settings/privacy"
                className={`p-2 rounded-xl text-xs font-bold transition-all border border-slate-700 bg-slate-900 hover:bg-slate-800 shrink-0 ${
                  pathname === "/settings/privacy" ? "bg-slate-800 text-rose-300 border-rose-500/50" : "text-slate-300 hover:text-white"
                }`}
                title="Privacy Settings"
              >
                <Settings className="w-4 h-4" />
              </Link>

              {/* Main Dashboard Button */}
              <Link
                href={getDashboardLink(session.role)}
                className="px-3.5 py-2 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">{t.nav.dashboard}</span>
              </Link>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 border border-slate-700 bg-slate-900 transition-colors cursor-pointer shrink-0"
                title={t.nav.logout}
              >
                <LogOut className="w-4 h-4" />
              </button>

              {/* Mobile Menu Toggle Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 shrink-0">
              <Link
                href="/login"
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              >
                {t.nav.login}
              </Link>
              <Link
                href="/register"
                className="px-4 py-1.5 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/30 transition-all"
              >
                {t.nav.register}
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile / Tablet Dropdown Menu */}
      {mobileMenuOpen && session && (
        <div className="lg:hidden bg-slate-950 border-t-2 border-slate-800 p-4 space-y-2 shadow-2xl">
          {session.role === "SUPER_ADMIN" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <Link
                href="/government/dashboard"
                className="p-2.5 rounded-xl bg-slate-900 text-purple-300 font-bold flex items-center gap-2 border border-slate-800"
              >
                <Landmark className="w-4 h-4 text-purple-400" />
                <span>National Blood Intelligence</span>
              </Link>
              <Link
                href="/government/ai-forecast"
                className="p-2.5 rounded-xl bg-slate-900 text-indigo-300 font-bold flex items-center gap-2 border border-slate-800"
              >
                <TrendingUp className="w-4 h-4 text-indigo-400" />
                <span>AI Demand Forecast</span>
              </Link>
              <Link
                href="/government/emergency"
                className="p-2.5 rounded-xl bg-slate-900 text-rose-300 font-bold flex items-center gap-2 border border-slate-800"
              >
                <Activity className="w-4 h-4 text-rose-400" />
                <span>Emergency Radar</span>
              </Link>
              <Link
                href="/government/campaigns"
                className="p-2.5 rounded-xl bg-slate-900 text-cyan-300 font-bold flex items-center gap-2 border border-slate-800"
              >
                <Flame className="w-4 h-4 text-cyan-400" />
                <span>Campaigns</span>
              </Link>
              <Link
                href="/government/live-map"
                className="p-2.5 rounded-xl bg-slate-900 text-emerald-300 font-bold flex items-center gap-2 border border-slate-800"
              >
                <Radio className="w-4 h-4 text-emerald-400" />
                <span>Live Map</span>
              </Link>
              <Link
                href="/admin/users"
                className="p-2.5 rounded-xl bg-slate-900 text-slate-200 font-bold flex items-center gap-2 border border-slate-800"
              >
                <Users className="w-4 h-4 text-slate-400" />
                <span>Users Management</span>
              </Link>
              <Link
                href="/admin/organizations"
                className="p-2.5 rounded-xl bg-slate-900 text-slate-200 font-bold flex items-center gap-2 border border-slate-800"
              >
                <Building2 className="w-4 h-4 text-slate-400" />
                <span>Organizations</span>
              </Link>
              <Link
                href="/admin/audit-logs"
                className="p-2.5 rounded-xl bg-slate-900 text-slate-200 font-bold flex items-center gap-2 border border-slate-800"
              >
                <FileText className="w-4 h-4 text-slate-400" />
                <span>Audit Logs</span>
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
