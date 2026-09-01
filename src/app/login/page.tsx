"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Flame, Lock, Mail, AlertCircle, ArrowRight, Sparkles } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function LoginPage() {
  const router = useRouter();
  const { t } = useLanguage();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Failed to sign in. Please check your credentials.");
        setLoading(false);
        return;
      }

      router.push(data.data?.redirectUrl || "/");
      router.refresh();
    } catch (err) {
      console.error(err);
      setError("An unexpected network error occurred. Please try again.");
      setLoading(false);
    }
  };

  const fillDemoAccount = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("YuvaRakt@2026");
    setError(null);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8 relative">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-rose-600/10 blur-[130px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/80 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 backdrop-blur-xl relative z-10">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-600 to-rose-800 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-rose-600/30 text-white font-bold">
            <Flame className="w-6 h-6 text-rose-100" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">{t.auth.loginTitle}</h1>
          <p className="text-xs text-slate-400 mt-1">{t.auth.loginSubtitle}</p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">{t.auth.emailLabel}</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300">{t.auth.passwordLabel}</label>
              <Link href="/forgot-password" className="text-xs text-rose-400 hover:text-rose-300 transition-colors">
                {t.auth.forgotPasswordLink}
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-semibold text-sm rounded-xl shadow-lg shadow-rose-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-2"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Signing in...
              </span>
            ) : (
              <>
                <span>{t.auth.loginButton}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Demo Fast-Fill Section for Hackathon Judges */}
        <div className="mt-8 pt-6 border-t border-slate-800/80">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Judge / Demo Quick Login
            </span>
            <span className="text-[10px] text-slate-500">Pass: YuvaRakt@2026</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => fillDemoAccount("donor@yuvarakt.demo")}
              className="px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left text-rose-300 font-medium transition-all flex items-center justify-between cursor-pointer"
            >
              <span>🩸 Youth Donor</span>
            </button>
            <button
              type="button"
              onClick={() => fillDemoAccount("pune.hospital@yuvarakt.demo")}
              className="px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left text-blue-300 font-medium transition-all flex items-center justify-between cursor-pointer"
            >
              <span>🏥 Hospital (Pune)</span>
            </button>
            <button
              type="button"
              onClick={() => fillDemoAccount("bloodbank@yuvarakt.demo")}
              className="px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left text-amber-300 font-medium transition-all flex items-center justify-between cursor-pointer"
            >
              <span>🏢 Blood Bank</span>
            </button>
            <button
              type="button"
              onClick={() => fillDemoAccount("government@yuvarakt.demo")}
              className="px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left text-purple-300 font-medium transition-all flex items-center justify-between cursor-pointer"
            >
              <span>🏛️ Govt Official</span>
            </button>
            <button
              type="button"
              onClick={() => fillDemoAccount("admin@yuvarakt.demo")}
              className="px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left text-emerald-300 font-medium transition-all flex items-center justify-between cursor-pointer"
            >
              <span>🛡️ Super Admin</span>
            </button>
            <button
              type="button"
              onClick={() => fillDemoAccount("ambulance@yuvarakt.demo")}
              className="px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left text-cyan-300 font-medium transition-all flex items-center justify-between cursor-pointer"
            >
              <span>🚑 Ambulance Unit</span>
            </button>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-slate-400">
          {t.auth.dontHaveAccount}{" "}
          <Link href="/register" className="font-semibold text-rose-400 hover:text-rose-300 underline underline-offset-4">
            {t.nav.register}
          </Link>
        </div>
      </div>
    </div>
  );
}
