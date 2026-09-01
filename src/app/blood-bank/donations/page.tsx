"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Heart,
  Plus,
  ArrowLeft,
  RefreshCw,
  CheckCircle2,
  Calendar,
  User,
} from "lucide-react";

interface DonationItem {
  id: string;
  donationDate: string;
  units: number;
  bloodGroup: string;
  componentType: string;
  status: string;
  campName?: string;
  certificateNumber?: string;
  donor: {
    user: {
      fullName: string;
      email: string;
      phone: string;
      district: string;
    };
  };
}

export default function BloodBankDonationsPage() {
  const [donations, setDonations] = useState<DonationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [donorEmailOrPhone, setDonorEmailOrPhone] = useState("donor@yuvarakt.demo");
  const [bloodGroup, setBloodGroup] = useState("O_POSITIVE");
  const [componentType, setComponentType] = useState("WHOLE_BLOOD");
  const [units, setUnits] = useState(1);
  const [campName, setCampName] = useState("Youth Voluntary Blood Camp 2026");
  const [certificateNumber, setCertificateNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const fetchDonations = () => {
    setLoading(true);
    fetch("/api/blood-bank/donations")
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
    setCertificateNumber(`CERT-${Math.floor(100000 + Math.random() * 900000)}`);
  }, []);

  const handleRecordDonation = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMsg(null);

    try {
      const res = await fetch("/api/blood-bank/donations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          donorEmailOrPhone,
          bloodGroup,
          componentType,
          units: Number(units),
          campName: campName || undefined,
          certificateNumber: certificateNumber || undefined,
          notes: notes || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setMsg({ text: data.message || "Donation recorded successfully!", type: "success" });
        setShowModal(false);
        fetchDonations();
        setCertificateNumber(`CERT-${Math.floor(100000 + Math.random() * 900000)}`);
      } else {
        setMsg({ text: data.error || "Failed to record donation", type: "error" });
      }
    } catch (err) {
      console.error(err);
      setMsg({ text: "Network error occurred", type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-800">
          <div>
            <Link href="/blood-bank/dashboard" className="text-xs text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1.5 mb-2">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Blood Bank Dashboard</span>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-3">
              <Heart className="w-7 h-7 text-rose-400" />
              <span>Voluntary Blood Donation Registry</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-medium mt-1">
              Log completed voluntary blood donations, issue official lifesaver certificates, and auto-credit active inventory.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchDonations}
              className="px-4 py-2.5 rounded-xl bg-slate-900 border-2 border-slate-700 hover:bg-slate-800 text-xs font-bold text-white flex items-center gap-2 cursor-pointer shadow-lg transition-all"
            >
              <RefreshCw className="w-4 h-4 text-rose-400" />
              <span>Refresh Registry</span>
            </button>

            <button
              onClick={() => setShowModal(true)}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white text-xs font-black shadow-xl shadow-rose-600/40 flex items-center gap-2 cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Record New Donation</span>
            </button>
          </div>
        </div>

        {msg && (
          <div
            className={`mb-6 p-4 rounded-2xl text-xs font-bold flex items-center gap-3 border-2 ${
              msg.type === "success"
                ? "bg-emerald-950/90 border-emerald-500 text-emerald-100"
                : "bg-rose-950/90 border-rose-500 text-rose-100"
            }`}
          >
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span>{msg.text}</span>
          </div>
        )}

        {/* High Contrast Donations Table */}
        <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 border-b-2 border-slate-700 text-slate-200 font-black uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-5 py-4">Voluntary Donor</th>
                  <th className="px-5 py-4">Blood Group & Component</th>
                  <th className="px-5 py-4">Units Donated</th>
                  <th className="px-5 py-4">Camp & Certificate</th>
                  <th className="px-5 py-4">Date & Time</th>
                  <th className="px-5 py-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center text-slate-400 font-bold text-sm">
                      Loading recorded donations...
                    </td>
                  </tr>
                ) : donations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center text-slate-300 font-semibold text-sm">
                      No voluntary donations recorded yet. Click &ldquo;Record New Donation&rdquo; to log a donation.
                    </td>
                  </tr>
                ) : (
                  donations.map((d) => {
                    const bloodLabel = d.bloodGroup.replace("_POSITIVE", "+").replace("_NEGATIVE", "-");
                    return (
                      <tr key={d.id} className="hover:bg-slate-800/80 transition-colors">
                        <td className="px-5 py-4">
                          <div className="font-extrabold text-white text-sm flex items-center gap-2">
                            <User className="w-4 h-4 text-rose-400" />
                            <span>{d.donor.user.fullName}</span>
                          </div>
                          <div className="text-slate-300 text-xs font-medium mt-1">
                            {d.donor.user.phone} • {d.donor.user.district}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span className="font-black text-rose-400 text-base">
                            🩸 {bloodLabel}
                          </span>
                          <div className="text-xs text-cyan-300 font-bold bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/40 inline-block mt-1">
                            {d.componentType}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span className="px-3.5 py-1.5 rounded-xl bg-rose-950 text-rose-100 font-black border-2 border-rose-500 text-xs shadow-sm">
                            {d.units} Unit(s)
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div className="font-bold text-white text-xs">{d.campName || "Central Blood Bank"}</div>
                          {d.certificateNumber && (
                            <div className="text-amber-300 font-mono text-xs font-bold mt-1">
                              {d.certificateNumber}
                            </div>
                          )}
                        </td>

                        <td className="px-5 py-4 text-slate-300 text-xs font-semibold whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4 text-cyan-400" />
                            <span>{new Date(d.donationDate).toLocaleDateString()}</span>
                          </div>
                        </td>

                        <td className="px-5 py-4 text-right">
                          <span className="px-3 py-1 rounded-full text-[11px] font-black bg-emerald-950 text-emerald-200 border-2 border-emerald-400 uppercase">
                            {d.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* RECORD DONATION MODAL */}
        {showModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative my-8">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
                <div>
                  <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                    <Heart className="w-6 h-6 text-rose-400" />
                    <span>Record Voluntary Donation</span>
                  </h2>
                  <p className="text-xs text-slate-300 font-medium mt-1">
                    Credits active blood inventory and updates donor lifetime record.
                  </p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 rounded-xl text-slate-300 hover:text-white text-base font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleRecordDonation} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1.5">
                    Donor Email or Mobile Number
                  </label>
                  <input
                    type="text"
                    required
                    value={donorEmailOrPhone}
                    onChange={(e) => setDonorEmailOrPhone(e.target.value)}
                    placeholder="e.g. donor@yuvarakt.demo or 9876543210"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border-2 border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-rose-500 placeholder-slate-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-200 mb-1.5">Blood Group</label>
                    <select
                      value={bloodGroup}
                      onChange={(e) => setBloodGroup(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border-2 border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-rose-500"
                    >
                      <option value="O_POSITIVE">O+ (O Positive)</option>
                      <option value="O_NEGATIVE">O- (O Negative)</option>
                      <option value="A_POSITIVE">A+ (A Positive)</option>
                      <option value="A_NEGATIVE">A- (A Negative)</option>
                      <option value="B_POSITIVE">B+ (B Positive)</option>
                      <option value="B_NEGATIVE">B- (B Negative)</option>
                      <option value="AB_POSITIVE">AB+ (AB Positive)</option>
                      <option value="AB_NEGATIVE">AB- (AB Negative)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-200 mb-1.5">Component</label>
                    <select
                      value={componentType}
                      onChange={(e) => setComponentType(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border-2 border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-rose-500"
                    >
                      <option value="WHOLE_BLOOD">Whole Blood</option>
                      <option value="RBC">Packed RBC</option>
                      <option value="PLASMA">Plasma (FFP)</option>
                      <option value="PLATELETS">Platelets</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-200 mb-1.5">Units Donated</label>
                    <input
                      type="number"
                      min={1}
                      max={5}
                      required
                      value={units}
                      onChange={(e) => setUnits(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border-2 border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-200 mb-1.5">Certificate Number</label>
                    <input
                      type="text"
                      value={certificateNumber}
                      onChange={(e) => setCertificateNumber(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border-2 border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-rose-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1.5">Camp / Center Location Name</label>
                  <input
                    type="text"
                    value={campName}
                    onChange={(e) => setCampName(e.target.value)}
                    placeholder="e.g. Pune University Blood Camp"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border-2 border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-rose-500 placeholder-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1.5">Notes (Optional)</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Verified donor vitals normal"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border-2 border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-rose-500 placeholder-slate-500"
                  />
                </div>

                <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white text-xs font-black shadow-xl shadow-rose-600/40 transition-all disabled:opacity-50"
                  >
                    {submitting ? "Recording..." : "Confirm & Credit Inventory"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
