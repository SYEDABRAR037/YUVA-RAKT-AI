"use client";

import { useEffect, useState } from "react";
import {
  Megaphone,
  Plus,
  CheckCircle2,
  Calendar,
  MapPin,
  RefreshCw,
  TrendingUp,
  X,
} from "lucide-react";
import { formatBloodGroup, formatComponentType } from "@/lib/utils";

interface CampaignItem {
  campaign: {
    id: string;
    title: string;
    description: string;
    bloodGroup: string;
    componentType: string;
    state: string;
    district: string;
    targetDonorsCount: number;
    startDate: string;
    endDate: string;
    status: string;
    createdAt: string;
    creator: { fullName: string; role: string };
  };
  metrics: {
    targetDonors: number;
    reachedCount: number;
    interestedCount: number;
    confirmedCount: number;
    progressPercentage: number;
  };
}

export default function GovernmentCampaignsPage() {
  const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [bloodGroup, setBloodGroup] = useState("O_NEGATIVE");
  const [componentType, setComponentType] = useState("WHOLE_BLOOD");
  const [state, setState] = useState("Maharashtra");
  const [district, setDistrict] = useState("Pune");
  const [targetDonorsCount, setTargetDonorsCount] = useState(50);
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    setEndDate(d.toISOString().split("T")[0]);
  }, []);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/campaigns");
      const data = await res.json();
      if (data.success) {
        setCampaigns(data.data.campaigns || []);
      }
    } catch (err) {
      console.error("Failed to load campaigns", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreateLoading(true);
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          bloodGroup,
          componentType,
          state,
          district,
          targetDonorsCount: Number(targetDonorsCount),
          endDate: new Date(endDate).toISOString(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMessage(data.message);
        setShowCreateModal(false);
        setTitle("");
        setDescription("");
        fetchCampaigns();
        setTimeout(() => setSuccessMessage(null), 5000);
      }
    } catch (err) {
      console.error("Failed to create campaign", err);
    } finally {
      setCreateLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs font-semibold uppercase tracking-wider mb-2">
              <Megaphone className="w-3.5 h-3.5" />
              Youth Mobilization Hub
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              Volunteer Blood Donation Campaigns
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Launch targeted voluntary blood donation drives, mobilize verified youth donors, and monitor live district engagement.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchCampaigns}
              disabled={loading}
              className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-slate-300 px-4 py-2 rounded-lg text-sm font-medium border border-slate-800 transition"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-cyan-400" : ""}`} />
              Refresh
            </button>

            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-lg shadow-rose-900/30 transition"
            >
              <Plus className="w-4 h-4" />
              Launch Campaign
            </button>
          </div>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center gap-3 animate-fade-in">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Campaigns Grid */}
        {loading ? (
          <div className="py-20 text-center text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin text-cyan-400 mx-auto mb-3" />
            <p className="text-sm">Loading mobilization campaigns...</p>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-16 text-center text-slate-400">
            <Megaphone className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="font-semibold text-white text-lg">No Active Volunteer Campaigns</p>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              Launch a targeted voluntary blood donation drive to mobilize youth volunteers in deficit districts.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
            >
              <Plus className="w-4 h-4" />
              Create First Campaign
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map(({ campaign, metrics }) => (
              <div
                key={campaign.id}
                className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-6 flex flex-col justify-between space-y-6 transition relative overflow-hidden"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                        {formatBloodGroup(campaign.bloodGroup)}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-800 text-slate-300">
                        {formatComponentType(campaign.componentType)}
                      </span>
                    </div>

                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {campaign.status}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-white line-clamp-1">{campaign.title}</h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{campaign.description || "Targeted voluntary youth blood donation drive."}</p>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-400">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      <span>{campaign.district}, {campaign.state}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span>Ends {new Date(campaign.endDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Progress Bar & Counters */}
                <div className="space-y-3 pt-4 border-t border-slate-800/80">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
                      Mobilization Progress
                    </span>
                    <span className="text-white font-bold">{metrics.progressPercentage}%</span>
                  </div>

                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-rose-500 rounded-full transition-all duration-500"
                      style={{ width: `${metrics.progressPercentage}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
                    <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/60">
                      <div className="text-slate-400 text-[10px]">Target</div>
                      <div className="font-bold text-white text-sm mt-0.5">{metrics.targetDonors}</div>
                    </div>
                    <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/60">
                      <div className="text-slate-400 text-[10px]">Reached</div>
                      <div className="font-bold text-cyan-400 text-sm mt-0.5">{metrics.reachedCount}</div>
                    </div>
                    <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/60">
                      <div className="text-slate-400 text-[10px]">Interested</div>
                      <div className="font-bold text-emerald-400 text-sm mt-0.5">{metrics.interestedCount}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Campaign Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-6 shadow-2xl animate-fade-in relative">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-rose-500" />
                  <h2 className="text-lg font-bold text-white">Launch Mobilization Campaign</h2>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-slate-400 hover:text-white transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateCampaign} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Campaign Title</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Urgent O- Blood Drive — Pune"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Description / Goal</label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Voluntary mobilization drive to replenish critical regional reserves."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Target Blood Group</label>
                    <select
                      value={bloodGroup}
                      onChange={(e) => setBloodGroup(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
                    >
                      <option value="O_NEGATIVE">O Negative (O-)</option>
                      <option value="O_POSITIVE">O Positive (O+)</option>
                      <option value="A_NEGATIVE">A Negative (A-)</option>
                      <option value="A_POSITIVE">A Positive (A+)</option>
                      <option value="B_NEGATIVE">B Negative (B-)</option>
                      <option value="B_POSITIVE">B Positive (B+)</option>
                      <option value="AB_NEGATIVE">AB Negative (AB-)</option>
                      <option value="AB_POSITIVE">AB Positive (AB+)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Component</label>
                    <select
                      value={componentType}
                      onChange={(e) => setComponentType(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
                    >
                      <option value="WHOLE_BLOOD">Whole Blood</option>
                      <option value="RBC">Packed Red Cells (RBC)</option>
                      <option value="PLATELETS">Platelets</option>
                      <option value="PLASMA">Fresh Frozen Plasma</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">State</label>
                    <select
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
                    >
                      <option value="Maharashtra">Maharashtra</option>
                      <option value="Delhi (NCT)">Delhi (NCT)</option>
                      <option value="Karnataka">Karnataka</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">District</label>
                    <input
                      type="text"
                      required
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Target Donors</label>
                    <input
                      type="number"
                      min={10}
                      max={500}
                      value={targetDonorsCount}
                      onChange={(e) => setTargetDonorsCount(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">End Date</label>
                    <input
                      type="date"
                      required
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createLoading}
                    className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold transition"
                  >
                    {createLoading ? "Broadcasting..." : "Launch Campaign"}
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
