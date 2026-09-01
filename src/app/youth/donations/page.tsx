"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Heart,
  ArrowLeft,
  RefreshCw,
  Calendar,
  Building2,
  Award,
  Shield,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface DonationRecord {
  id: string;
  donationDate: string;
  units: number;
  bloodGroup: string;
  componentType: string;
  status: string;
  campName?: string;
  certificateNumber?: string;
  bloodBank: {
    name: string;
    city: string | null;
    district: string;
    state: string;
  };
}

export default function YouthDonationsPage() {
  const { t } = useLanguage();
  const [donations, setDonations] = useState<DonationRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDonations = () => {
    setLoading(true);
    fetch("/api/youth/donations")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setDonations(data.donations || []);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDonations();
  }, []);

  const totalUnits = donations.reduce((sum, d) => sum + d.units, 0);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <Link href="/youth/dashboard" className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 mb-2">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </Link>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Heart className="w-6 h-6 text-rose-400" />
            <span>My Voluntary Blood Donation History</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Verified records of your lifesaver contributions across India.
          </p>
        </div>

        <button
          onClick={fetchDonations}
          className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs font-semibold text-slate-300 flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5 text-rose-400" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Safety Principle Banner */}
      <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-3">
        <Shield className="w-5 h-5 flex-shrink-0 text-amber-400 mt-0.5" />
        <div>
          <span className="font-semibold text-amber-300">Medical Safety Principle:</span>
          <p className="mt-0.5 leading-relaxed text-amber-200/90">
            {t.disclaimers.medicalEligibility}
          </p>
        </div>
      </div>

      {/* Hero Stats Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-rose-950/40 border border-slate-800 mb-8 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 mb-2">
              <Award className="w-3.5 h-3.5" />
              <span>National Youth Donor Contribution</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              {totalUnits} Units Donated Lifetime
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Estimated lives impacted: ~{totalUnits * 3} patients supported through components
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-center sm:text-right">
            <span className="text-xs text-slate-400 block mb-0.5">Total Donations Logged</span>
            <span className="text-2xl font-extrabold text-rose-400">{donations.length}</span>
          </div>
        </div>
      </div>

      {/* Donations List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            Loading donation records...
          </div>
        ) : donations.length === 0 ? (
          <div className="p-12 rounded-3xl bg-slate-900/40 border border-slate-800 text-center text-slate-500 text-xs">
            No voluntary donation records registered yet. Visit a local camp or blood bank to start your lifesaver journey!
          </div>
        ) : (
          donations.map((d) => {
            const bloodLabel = d.bloodGroup.replace("_POSITIVE", "+").replace("_NEGATIVE", "-");
            return (
              <div
                key={d.id}
                className="p-6 rounded-3xl bg-slate-900/40 border border-slate-800 hover:border-rose-500/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs shadow-lg"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-extrabold text-base text-white">
                      🩸 {bloodLabel} ({d.componentType})
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      {d.units} Unit(s)
                    </span>
                  </div>

                  <div className="text-slate-300 font-semibold flex items-center gap-1.5 mt-1">
                    <Building2 className="w-3.5 h-3.5 text-rose-400" />
                    <span>{d.bloodBank.name}</span>
                    <span className="text-slate-500 font-normal">({d.bloodBank.district}, {d.bloodBank.state})</span>
                  </div>

                  {d.campName && (
                    <p className="text-slate-400 text-[11px] mt-1">
                      Camp: {d.campName}
                    </p>
                  )}

                  {d.certificateNumber && (
                    <p className="text-slate-500 font-mono text-[10px] mt-1">
                      Certificate ID: {d.certificateNumber}
                    </p>
                  )}
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 border-t sm:border-t-0 border-slate-800/80 pt-3 sm:pt-0">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    {d.status}
                  </span>
                  <div className="text-slate-400 text-[11px] flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-500" />
                    <span>{new Date(d.donationDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
