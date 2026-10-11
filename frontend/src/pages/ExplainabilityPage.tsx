import React, { useEffect, useState } from "react";
import {
  BrainCircuit,
  CheckCircle,
  HelpCircle,
  Info,
  ListOrdered,
  Play,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useApp } from "../context/AppContext";
import { api } from "../api/client";
import { GlobalExplanation, LocalExplanation } from "../types";
import { StatCard } from "../components/common/StatCard";
import { Badge } from "../components/common/Badge";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { Alert } from "../components/common/Alert";

export const ExplainabilityPage: React.FC<{ onNavigate: (tab: string) => void }> = () => {
  const { profile, activeModelId, activeModelDetail } = useApp();

  const [globalExp, setGlobalExp] = useState<GlobalExplanation | null>(null);
  const [localExp, setLocalExp] = useState<LocalExplanation | null>(null);
  const [loadingGlobal, setLoadingGlobal] = useState<boolean>(false);
  const [loadingLocal, setLoadingLocal] = useState<boolean>(false);
  const [topN, setTopN] = useState<number>(12);
  const [selectedRecordIndex, setSelectedRecordIndex] = useState<number>(0);
  const [recordsSample, setRecordsSample] = useState<any[]>([]);

  // Fetch sample records from current dataset for local explanation dropdown
  useEffect(() => {
    const fetchSample = async () => {
      if (!profile) return;
      try {
        const data = await api.getRecords({ page: 1, pageSize: 15 });
        setRecordsSample(data.records);
      } catch (err) {
        console.error("Failed to fetch sample records:", err);
      }
    };
    fetchSample();
  }, [profile]);

  // Load Global Explanation when active model changes
  useEffect(() => {
    const fetchGlobal = async () => {
      if (!activeModelId) return;
      setLoadingGlobal(true);
      try {
        const res = await api.getGlobalExplanation(activeModelId, topN);
        setGlobalExp(res);
      } catch (err) {
        console.error("Failed to fetch global explanation:", err);
      } finally {
        setLoadingGlobal(false);
      }
    };
    fetchGlobal();
  }, [activeModelId, topN]);

  // Trigger Local Explanation
  const triggerLocalExplanation = async (rec: any) => {
    if (!rec || !activeModelId) return;
    setLoadingLocal(true);
    try {
      const predClass = rec.Attack_type || "Normal";
      const res = await api.getLocalExplanation({
        record: rec,
        predicted_class: predClass,
        model_id: activeModelId,
      });
      setLocalExp(res);
    } catch (err) {
      console.error("Failed to fetch local explanation:", err);
    } finally {
      setLoadingLocal(false);
    }
  };

  useEffect(() => {
    if (recordsSample.length > 0 && !localExp && activeModelId) {
      triggerLocalExplanation(recordsSample[0]);
    }
  }, [recordsSample, activeModelId]);

  if (!activeModelId) {
    return (
      <div className="rounded-xl border border-slate-800 bg-[#111827] p-8 text-center max-w-xl mx-auto space-y-3">
        <BrainCircuit className="h-10 w-10 text-cyan-400 mx-auto" />
        <h3 className="text-base font-semibold text-white">No Active Model Available</h3>
        <p className="text-xs text-slate-400">
          Please train or select a model in the Model Lab to generate explainable feature attributions.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-xl border border-slate-800/80 bg-[#111827] p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <BrainCircuit className="h-4 w-4 text-cyan-400" />
              Interpretable Machine Learning & Feature Attribution
            </h3>
            <p className="text-xs text-slate-400">
              Model: <span className="font-mono text-cyan-300 font-medium">{activeModelDetail?.metadata.model_name || activeModelId}</span> · Method: {globalExp?.method || "Tree Feature Importance"}
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-mono">Top Features:</span>
            {[8, 12, 16].map((n) => (
              <button
                key={n}
                onClick={() => setTopN(n)}
                className={`px-2 py-1 rounded font-mono ${
                  topN === n ? "bg-cyan-950 text-cyan-400 border border-cyan-800" : "bg-slate-900 text-slate-400 hover:text-white"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Global Feature Importance Chart */}
      <div className="rounded-xl border border-slate-800/80 bg-[#111827] p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-sm font-semibold text-white">Global Feature Importance Ranking</h4>
            <p className="text-xs text-slate-400">
              Aggregated influence of network flow properties across trained estimators
            </p>
          </div>
          <Badge label={globalExp?.method || "MDI Importance"} variant="info" />
        </div>

        {loadingGlobal ? (
          <LoadingSpinner message="Calculating global feature importance vectors..." />
        ) : globalExp ? (
          <div className="space-y-4">
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={globalExp.top_features} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
                  <XAxis type="number" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="feature" type="category" stroke="#94a3b8" tick={{ fontSize: 11 }} width={140} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px", fontSize: "12px" }}
                    formatter={(val: any) => [`${(val * 100).toFixed(2)}%`, "Relative Weight"]}
                  />
                  <Bar dataKey="importance" fill="#06b6d4" radius={[0, 4, 4, 0]}>
                    {globalExp.top_features.map((_, idx) => (
                      <Cell key={`cell-${idx}`} fill={idx === 0 ? "#06b6d4" : idx < 3 ? "#0891b2" : "#3b82f6"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-lg bg-slate-900/60 border border-slate-800 p-3 text-[11px] text-slate-400 flex items-start gap-2">
              <Info className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
              <span>{globalExp.limitations}</span>
            </div>
          </div>
        ) : null}
      </div>

      {/* Local Prediction Explanation & Narrative Summary */}
      <div className="rounded-xl border border-slate-800/80 bg-[#111827] p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h4 className="text-sm font-semibold text-white flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-purple-400" />
              Local Prediction Explanation & Deterministic Narrative
            </h4>
            <p className="text-xs text-slate-400">
              Decompose the decision boundary and specific drivers for an individual flow
            </p>
          </div>

          {/* Flow Selector Dropdown */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Select Flow:</span>
            <select
              value={selectedRecordIndex}
              onChange={(e) => {
                const idx = parseInt(e.target.value);
                setSelectedRecordIndex(idx);
                if (recordsSample[idx]) {
                  triggerLocalExplanation(recordsSample[idx]);
                }
              }}
              className="rounded-lg bg-slate-900 border border-slate-800 px-3 py-1.5 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none font-mono"
            >
              {recordsSample.map((rec, i) => (
                <option key={i} value={i}>
                  Flow #{i + 1} ({rec.Attack_type || "Unlabelled"}, {rec.proto})
                </option>
              ))}
            </select>
          </div>
        </div>

        {loadingLocal ? (
          <LoadingSpinner message="Decomposing individual flow prediction attributions..." />
        ) : localExp ? (
          <div className="space-y-4">
            {/* Deterministic Natural Language Summary Box */}
            <div className="rounded-lg bg-gradient-to-r from-purple-950/30 to-cyan-950/30 border border-purple-800/50 p-4">
              <h5 className="text-xs font-semibold uppercase tracking-wider text-purple-300 mb-1 flex items-center gap-1.5">
                <BrainCircuit className="h-3.5 w-3.5" /> Deterministic Explanation Summary
              </h5>
              <p className="text-xs leading-relaxed text-slate-200 font-sans">
                {localExp.narrative_summary}
              </p>
            </div>

            {/* Drivers Breakdown Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Positive Contributors */}
              <div className="rounded-lg bg-slate-900/80 border border-slate-800 p-3.5 space-y-2">
                <h6 className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                  <CheckCircle className="h-3.5 w-3.5" /> Supporting Feature Drivers
                </h6>
                <div className="space-y-1.5 font-mono text-xs">
                  {localExp.top_drivers.filter((d) => d.contribution > 0).map((d, i) => (
                    <div key={i} className="flex justify-between p-1.5 rounded bg-slate-950/60 border border-slate-850">
                      <span className="text-slate-300">{d.feature}</span>
                      <span className="text-emerald-400 font-bold">+{d.contribution.toFixed(4)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Counter-balancing Contributors */}
              <div className="rounded-lg bg-slate-900/80 border border-slate-800 p-3.5 space-y-2">
                <h6 className="text-xs font-semibold text-rose-400 flex items-center gap-1">
                  <Info className="h-3.5 w-3.5" /> Counter-balancing Features
                </h6>
                <div className="space-y-1.5 font-mono text-xs">
                  {localExp.top_drivers.filter((d) => d.contribution <= 0).length > 0 ? (
                    localExp.top_drivers.filter((d) => d.contribution <= 0).map((d, i) => (
                      <div key={i} className="flex justify-between p-1.5 rounded bg-slate-950/60 border border-slate-850">
                        <span className="text-slate-300">{d.feature}</span>
                        <span className="text-rose-400 font-bold">{d.contribution.toFixed(4)}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500 italic p-2">All primary features contributed towards the assigned class.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-slate-900/50 border border-slate-800/80 p-3 text-[11px] text-slate-400">
              <span className="font-semibold text-slate-300">Methodological Caution: </span>
              {localExp.limitations}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
