"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Package,
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  History,
  SlidersHorizontal,
} from "lucide-react";

interface InventorySummary {
  totalUnitsAvailable: number;
  totalExpiringSoon: number;
  totalExpired: number;
  matrix: Array<{
    bloodGroup: string;
    componentType: string;
    unitsAvailable: number;
    unitsExpiringSoon: number;
    unitsExpired: number;
  }>;
}

interface TransactionItem {
  id: string;
  bloodGroup: string;
  componentType: string;
  quantity: number;
  transactionType: string;
  notes?: string;
  createdAt: string;
}

const BLOOD_GROUPS = [
  "A_POSITIVE",
  "A_NEGATIVE",
  "B_POSITIVE",
  "B_NEGATIVE",
  "AB_POSITIVE",
  "AB_NEGATIVE",
  "O_POSITIVE",
  "O_NEGATIVE",
];

const COMPONENT_TYPES = [
  "WHOLE_BLOOD",
  "RBC",
  "PLASMA",
  "PLATELETS",
];

export default function BloodBankInventoryPage() {
  const [summary, setSummary] = useState<InventorySummary | null>(null);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [showAdjustModal, setShowAdjustModal] = useState(false);

  // Form State
  const [bloodGroup, setBloodGroup] = useState("O_POSITIVE");
  const [componentType, setComponentType] = useState("RBC");
  const [quantity, setQuantity] = useState(5);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const fetchInventory = () => {
    fetch("/api/blood-bank/inventory")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setSummary(data.summary);
          setTransactions(data.recentTransactions || []);
        }
      })
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMsg(null);

    try {
      const res = await fetch("/api/blood-bank/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bloodGroup,
          componentType,
          quantity: Number(quantity),
          notes: notes || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setMsg({ text: data.message || "Inventory successfully updated!", type: "success" });
        setShowAdjustModal(false);
        fetchInventory();
        setNotes("");
      } else {
        setMsg({ text: data.error || "Failed to adjust inventory", type: "error" });
      }
    } catch (err) {
      console.error(err);
      setMsg({ text: "Network error occurred", type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const getCell = (bg: string, ct: string) => {
    return summary?.matrix?.find((c) => c.bloodGroup === bg && c.componentType === ct);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-800">
          <div>
            <Link href="/blood-bank/dashboard" className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1.5 mb-2">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Blood Bank Dashboard</span>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-3">
              <Package className="w-7 h-7 text-amber-400" />
              <span>Real-time Blood & Component Inventory Matrix</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-medium mt-1">
              Monitor verified stock across all 8 blood groups and 4 components. FIFO tracking with expiry management.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchInventory}
              className="px-4 py-2.5 rounded-xl bg-slate-900 border-2 border-slate-700 hover:bg-slate-800 text-xs font-bold text-white flex items-center gap-2 cursor-pointer shadow-lg transition-all"
            >
              <RefreshCw className="w-4 h-4 text-amber-400" />
              <span>Refresh</span>
            </button>

            <button
              onClick={() => setShowAdjustModal(true)}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white text-xs font-black shadow-xl shadow-amber-600/40 flex items-center gap-2 cursor-pointer transition-all"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Manual Stock Adjustment</span>
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

        {/* Summary KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
          <div className="p-6 rounded-3xl bg-slate-900 border-2 border-emerald-500/40 shadow-xl">
            <div className="flex items-center justify-between text-slate-300 mb-2">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-400">Total Units Available</span>
              <Package className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="text-4xl font-black text-emerald-300">{summary?.totalUnitsAvailable ?? 0}</div>
            <span className="text-xs text-slate-300 font-medium block mt-1">Unexpired, ready for clinical allocation</span>
          </div>

          <div className="p-6 rounded-3xl bg-slate-900 border-2 border-amber-500/40 shadow-xl">
            <div className="flex items-center justify-between text-slate-300 mb-2">
              <span className="text-xs font-black uppercase tracking-wider text-amber-400">Expiring in ≤ 7 Days</span>
              <Clock className="w-5 h-5 text-amber-400" />
            </div>
            <div className="text-4xl font-black text-amber-300">{summary?.totalExpiringSoon ?? 0}</div>
            <span className="text-xs text-amber-300 font-bold block mt-1">Prioritize FIFO allocation</span>
          </div>

          <div className="p-6 rounded-3xl bg-slate-900 border-2 border-slate-700 shadow-xl">
            <div className="flex items-center justify-between text-slate-300 mb-2">
              <span className="text-xs font-black uppercase tracking-wider text-rose-400">Expired Stock (Disposed)</span>
              <AlertCircle className="w-5 h-5 text-rose-400" />
            </div>
            <div className="text-4xl font-black text-slate-200">{summary?.totalExpired ?? 0}</div>
            <span className="text-xs text-slate-400 font-medium block mt-1">Excluded from available counts</span>
          </div>
        </div>

        {/* 8x4 INVENTORY MATRIX */}
        <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl p-6 mb-8 overflow-hidden shadow-2xl">
          <h2 className="text-lg font-black text-white mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-amber-400" />
            <span>Inventory Matrix by Blood Group & Component</span>
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-center text-xs border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-700 bg-slate-950 text-slate-200 font-black uppercase tracking-wider text-[11px]">
                  <th className="py-4 px-5 text-left">Blood Group</th>
                  <th className="py-4 px-5">Whole Blood</th>
                  <th className="py-4 px-5">Packed RBC</th>
                  <th className="py-4 px-5">Platelets</th>
                  <th className="py-4 px-5">Plasma (FFP)</th>
                  <th className="py-4 px-5 text-right">Total Group Units</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono">
                {BLOOD_GROUPS.map((bg) => {
                  const groupLabel = bg.replace("_POSITIVE", "+").replace("_NEGATIVE", "-");
                  let groupTotal = 0;

                  return (
                    <tr key={bg} className="hover:bg-slate-800/80 transition-colors">
                      <td className="py-4 px-5 text-left font-sans font-black text-base text-white">
                        🩸 {groupLabel}
                      </td>

                      {COMPONENT_TYPES.map((ct) => {
                        const cell = getCell(bg, ct);
                        const available = cell?.unitsAvailable || 0;
                        const expiringSoon = cell?.unitsExpiringSoon || 0;
                        groupTotal += available;

                        return (
                          <td key={ct} className="py-4 px-5">
                            <div className="inline-flex flex-col items-center">
                              <span
                                className={`px-3.5 py-1.5 rounded-xl text-xs font-black border-2 ${
                                  available > 0
                                    ? "bg-slate-950 text-emerald-200 border-emerald-500/60 shadow-sm"
                                    : "bg-slate-950 text-slate-500 border-slate-800"
                                }`}
                              >
                                {available} units
                              </span>
                              {expiringSoon > 0 && (
                                <span className="text-[11px] text-amber-300 font-sans font-bold mt-1">
                                  ({expiringSoon} exp soon)
                                </span>
                              )}
                            </div>
                          </td>
                        );
                      })}

                      <td className="py-4 px-5 text-right font-black text-amber-300 text-base">
                        {groupTotal} units
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* RECENT INVENTORY TRANSACTIONS */}
        <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl p-6">
          <h2 className="text-lg font-black text-white mb-4 flex items-center gap-2">
            <History className="w-5 h-5 text-amber-400" />
            <span>Audit-Protected Inventory Transaction Ledger</span>
          </h2>

          {transactions.length > 0 ? (
            <div className="divide-y divide-slate-800 text-xs">
              {transactions.map((tx) => (
                <div key={tx.id} className="py-3.5 flex items-center justify-between gap-4 font-mono">
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded-full text-[11px] font-black border-2 ${
                        tx.quantity > 0
                          ? "bg-emerald-950 text-emerald-200 border-emerald-500"
                          : "bg-rose-950 text-rose-200 border-rose-500"
                      }`}
                    >
                      {tx.transactionType}
                    </span>
                    <span className="font-bold text-white text-sm">
                      {tx.quantity > 0 ? `+${tx.quantity}` : tx.quantity} units {tx.bloodGroup.replace("_POSITIVE", "+").replace("_NEGATIVE", "-")} ({tx.componentType})
                    </span>
                    {tx.notes && (
                      <span className="text-slate-300 font-sans font-medium hidden sm:inline">• {tx.notes}</span>
                    )}
                  </div>
                  <span className="text-slate-300 text-xs font-semibold font-sans">
                    {new Date(tx.createdAt).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center text-slate-400 font-semibold text-xs">
              No inventory transactions logged yet.
            </div>
          )}
        </div>

        {/* ADJUST INVENTORY MODAL */}
        {showAdjustModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative my-8">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
                <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                  <SlidersHorizontal className="w-6 h-6 text-amber-400" />
                  <span>Adjust Inventory Stock</span>
                </h2>
                <button
                  onClick={() => setShowAdjustModal(false)}
                  className="p-2 rounded-xl text-slate-300 hover:text-white text-base font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAdjust} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1.5">Blood Group</label>
                  <select
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border-2 border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-amber-500"
                  >
                    {BLOOD_GROUPS.map((bg) => (
                      <option key={bg} value={bg}>
                        {bg.replace("_POSITIVE", "+").replace("_NEGATIVE", "-")}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1.5">Component Type</label>
                  <select
                    value={componentType}
                    onChange={(e) => setComponentType(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border-2 border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="WHOLE_BLOOD">Whole Blood</option>
                    <option value="RBC">RBC (Packed Red Cells)</option>
                    <option value="PLASMA">Plasma (FFP)</option>
                    <option value="PLATELETS">Platelets</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1.5">
                    Quantity (+ to add, - to deduct)
                  </label>
                  <input
                    type="number"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border-2 border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-amber-500"
                  />
                  <span className="text-xs text-slate-300 font-medium mt-1 block">
                    Example: 5 to add 5 units, or -2 to deduct 2 units.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1.5">Adjustment Reason / Notes</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Stock audit, batch import, emergency intake"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border-2 border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-amber-500 placeholder-slate-500"
                  />
                </div>

                <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowAdjustModal(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white text-xs font-black shadow-xl shadow-amber-600/40 transition-all disabled:opacity-50"
                  >
                    {submitting ? "Saving..." : "Apply Adjustment"}
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
