"use client";

import React from "react";
import Link from "next/link";
import { Shield, Sparkles, Building2, Users, ArrowRight, Heart, Landmark, Activity, Megaphone, TrendingUp } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function HomePage() {
  const { t } = useLanguage();

  return (
    <main className="min-h-[calc(100vh-4rem)] flex flex-col justify-between bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 overflow-hidden relative">
      {/* Ambient Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-rose-600/10 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[300px] bg-orange-600/10 blur-[160px] rounded-full pointer-events-none" />

      {/* Hero Section */}
      <section className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center flex-1 flex flex-col justify-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-300 border border-rose-500/20 mb-8 mx-auto shadow-inner">
          <Sparkles className="w-4 h-4 text-rose-400" />
          <span>{t.badge} • Full System Operational</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white mb-6">
          <span className="block text-slate-100">🇮🇳 {t.brandName}</span>
          <span className="block text-xl sm:text-3xl lg:text-4xl font-semibold mt-3 text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-rose-300 to-orange-300">
            National Youth Blood Intelligence & Emergency Response Network
          </span>
        </h1>

        <p className="text-lg sm:text-2xl font-medium text-slate-300 max-w-3xl mx-auto mb-10 italic">
          &ldquo;{t.tagline}&rdquo;
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
          <Link
            href="/register"
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-sm shadow-xl shadow-rose-600/30 transition-all flex items-center justify-center gap-2 group cursor-pointer"
          >
            <Heart className="w-4 h-4 text-rose-200" />
            <span>Join as Donor / Register Org</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>

          <Link
            href="/login"
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-200 font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg"
          >
            <span>Access Portal / Sign In</span>
          </Link>
        </div>

        {/* NATIONAL IMPACT LAYER FOR JUDGES */}
        <div className="mb-12 p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-rose-500/30 shadow-2xl text-left relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-rose-600/10 blur-[90px] rounded-full pointer-events-none" />
          
          <div className="flex items-center gap-2 mb-4">
            <span className="px-2.5 py-1 rounded-md text-[11px] font-extrabold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40">
              National Impact Layer
            </span>
            <span className="text-xs text-slate-400 font-medium">YUVA-RAKT AI End-to-End Coordination Model</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
              <div className="flex items-center gap-2 text-rose-400 text-xs font-bold uppercase mb-2">
                <TrendingUp className="w-4 h-4" /> 1. PREDICT
              </div>
              <div className="text-sm font-semibold text-white">Shortage & Demand AI</div>
              <p className="text-xs text-slate-400 mt-1">Multi-horizon statistical forecasting across 8 blood groups and 4 components by district.</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
              <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase mb-2">
                <Users className="w-4 h-4" /> 2. MOBILIZE
              </div>
              <div className="text-sm font-semibold text-white">Verified Youth Network</div>
              <p className="text-xs text-slate-400 mt-1">Intelligent operational candidate ranking and instant consent-verified emergency opportunities.</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase mb-2">
                <Building2 className="w-4 h-4" /> 3. RESPOND
              </div>
              <div className="text-sm font-semibold text-white">Authorized Blood Centres</div>
              <p className="text-xs text-slate-400 mt-1">8x4 inventory ledger, multi-batch allocation, and hospital emergency requisition fulfillment.</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-gradient-to-r from-rose-950/40 to-slate-950/80 border border-rose-500/20 text-center">
            <blockquote className="text-sm sm:text-base font-semibold text-rose-200 italic">
              &ldquo;We don&apos;t wait for a blood shortage to happen. YUVA-RAKT AI predicts the risk, identifies where intervention is needed, and mobilizes verified young voluntary donors through authorized healthcare organizations.&rdquo;
            </blockquote>
          </div>
        </div>

        {/* Medical Principle Notice Banner */}
        <div className="mb-12 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs sm:text-sm max-w-4xl mx-auto text-left flex items-start gap-3 shadow-lg">
          <Shield className="w-5 h-5 flex-shrink-0 text-amber-400 mt-0.5" />
          <div>
            <strong className="text-amber-300 font-semibold">Core Medical & Safety Principle:</strong>
            <p className="mt-0.5 text-amber-200/90 leading-relaxed">
              {t.disclaimers.medicalEligibility}
            </p>
          </div>
        </div>

        {/* Vision Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto text-left">
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-rose-500/40 transition-colors backdrop-blur-sm shadow-xl">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-4 text-rose-400">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-white mb-2">Youth Voluntary Donors</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Verified digital donor profiles, voluntary availability toggles, emergency consent routing, and multilingual engagement across India.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-blue-500/40 transition-colors backdrop-blur-sm shadow-xl">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4 text-blue-400">
              <Building2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-white mb-2">Hospitals & Blood Banks</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Authorized clinical facility onboarding, license verification by Super Admins, and readiness for real-time requisition workflows.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-purple-500/40 transition-colors backdrop-blur-sm shadow-xl">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4 text-purple-400">
              <Landmark className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-white mb-2">Public Health Governance</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Role-based governance, immutable security audit logging, consent transparency, and multi-state administration.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/80 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-rose-500" />
            <span>YUVA-RAKT AI • National Youth Blood Intelligence & Emergency Response Network</span>
          </div>
          <div>
            <span>Government Hackathon Prototype • Phase 1–4 Verified</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
