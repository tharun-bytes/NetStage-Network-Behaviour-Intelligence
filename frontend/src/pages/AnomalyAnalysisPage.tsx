import React, { useEffect, useState } from "react";
import {
  AlertOctagon,
  ArrowRight,
  BarChart2,
  CheckCircle,
  HelpCircle,
  Play,
  RefreshCw,
  Sliders,
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
import { AnomalyResult } from "../types";
import { StatCard } from "../components/common/StatCard";
import { Badge } from "../components/common/Badge";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { EmptyState } from "../components/common/EmptyState";
import { Alert } from "../components/common/Alert";

export const AnomalyAnalysisPage: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const { profile, showToast } = useApp();

  const [contamination, setContamination] = useState<number>(0.05);
  const [threshold, setThreshold] = useState<number>(0.5);
  const [loading, setLoading] = useState<boolean>(false);
  const [anomalyData, setAnomalyData] = useState<AnomalyResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runDetection = async () => {
    if (!profile) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.detectAnomalies(contamination, threshold);
      setAnomalyData(res);
      showToast(`Isolation Forest flagged ${res.flagged_count} anomalous flows (${res.flagged_percentage}%)`, "info");
    } catch (err: any) {
      setError(err.message || "Failed to run anomaly detection");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile && !anomalyData) {
      runDetection();
    }
  }, [profile]);

  if (!profile) {
    return (
      <EmptyState
        icon={AlertOctagon}
        title="No Dataset Available"
        description="Load the RT-IoT2022 dataset to run unsupervised Isolation Forest anomaly scoring."
        actionText="Load Sample Dataset"
        onAction={() => onNavigate("overview")}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls & Configuration Bar */}
      <div className="rounded-xl border border-slate-800/80 bg-[#111827] p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-purple-800/60 shadow-md">
              <img
                src="/assets/netsage/anomaly-shield.jpg"
                alt="Anomaly Shield"
                className="h-full w-full object-cover"
              />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <AlertOctagon className="h-4 w-4 text-purple-400" />
                Unsupervised Isolation Forest Engine
              </h3>
              <p className="text-xs text-slate-400">
                Evaluates tree isolation path lengths purely on continuous flow properties without target labels.
              </p>
            </div>
          </div>

          <button
            onClick={runDetection}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-xs font-medium text-white hover:bg-cyan-500 transition-colors disabled:opacity-50 shrink-0 shadow-sm"
          >
            <Play className="h-3.5 w-3.5" />
            Recalculate Anomalies
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800/60 text-xs">
          <div>
            <div className="flex justify-between text-slate-300 mb-1.5 font-mono">
              <span>Contamination Rate:</span>
              <span className="text-cyan-400 font-bold">{(contamination * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0.01"
              max="0.25"
              step="0.01"
              value={contamination}
              onChange={(e) => setContamination(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
            <span className="text-[10px] text-slate-500">Expected baseline anomaly contamination proportion in testbed</span>
          </div>

          <div>
            <div className="flex justify-between text-slate-300 mb-1.5 font-mono">
              <span>Decision Score Threshold:</span>
              <span className="text-purple-400 font-bold">{threshold.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.30"
              max="0.75"
              step="0.02"
              value={threshold}
              onChange={(e) => setThreshold(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
            <span className="text-[10px] text-slate-500">Cut-off boundary for binary outlier flag (normalized 0.0 to 1.0)</span>
          </div>
        </div>
      </div>

      {error && <Alert type="error" title="Anomaly Scoring Error" message={error} onDismiss={() => setError(null)} />}

      {loading && <LoadingSpinner message="Fitting Isolation Forest trees and deriving path length scores..." />}

      {anomalyData && !loading && (
        <div className="space-y-6">
          {/* Top Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              title="Flagged Anomalies"
              value={anomalyData.flagged_count.toLocaleString()}
              subtitle={`Out of ${anomalyData.total_records.toLocaleString()} total flows`}
              icon={AlertOctagon}
              badgeText={`${anomalyData.flagged_percentage}%`}
              badgeType={anomalyData.flagged_percentage > 10 ? "red" : "amber"}
              highlight
            />
            <StatCard
              title="Anomaly Score Cut-off"
              value={anomalyData.threshold.toFixed(2)}
              subtitle="Normalized boundary [0.0 - 1.0]"
              icon={Sliders}
              badgeText="Configured"
              badgeType="purple"
            />
            <StatCard
              title="Algorithm Architecture"
              value="Isolation Forest"
              subtitle="100 Estimators · Unsupervised"
              icon={CheckCircle}
              badgeText="Label-Free"
              badgeType="green"
            />
          </div>

          {/* Interpretability Notice */}
          <Alert
            type="info"
            title="Operational Context & Methodological Distinction"
            message={anomalyData.interpretation}
          />

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Score Distribution Histogram */}
            <div className="rounded-xl border border-slate-800/80 bg-[#111827] p-5 shadow-sm">
              <h4 className="text-sm font-semibold text-white mb-1">Anomaly Score Distribution</h4>
              <p className="text-xs text-slate-400 mb-4">
                Frequency histogram of normalized abnormality scores (Scores &ge; {threshold.toFixed(2)} flagged)
              </p>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={anomalyData.score_distribution} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                    <XAxis dataKey="bin_range" stroke="#64748b" tick={{ fontSize: 10 }} angle={-25} textAnchor="end" />
                    <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px", fontSize: "12px" }}
                      formatter={(val: any) => [`${val} flows`, "Count"]}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {anomalyData.score_distribution.map((entry, idx) => (
                        <Cell
                          key={`cell-${idx}`}
                          fill={entry.bin_min >= threshold ? "#f43f5e" : "#06b6d4"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Feature Divergence Table */}
            <div className="rounded-xl border border-slate-800/80 bg-[#111827] p-5 shadow-sm flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-semibold text-white mb-1">Feature Divergence Comparison</h4>
                <p className="text-xs text-slate-400 mb-3">
                  Mean feature values in flagged outliers vs learned normal baseline
                </p>

                <div className="space-y-2.5 font-mono text-xs">
                  {anomalyData.feature_comparisons.map((fc, i) => (
                    <div key={i} className="rounded-lg bg-slate-900/80 border border-slate-800 p-2.5 space-y-1">
                      <div className="flex justify-between font-semibold text-slate-200">
                        <span>{fc.feature}</span>
                        <span className="text-rose-400">Outlier: {fc.anomalous_mean}</span>
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-500">
                        <span>Baseline Mean: {fc.baseline_mean}</span>
                        <span>Overall: {fc.overall_mean}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <p className="text-[11px] text-slate-500 mt-3 pt-3 border-t border-slate-800">
                Large divergence in packet rates or SYN counts highlights structural outlier mechanisms.
              </p>
            </div>
          </div>

          {/* Flagged Records Table */}
          <div className="rounded-xl border border-slate-800/80 bg-[#111827] overflow-hidden shadow-sm">
            <div className="p-4 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-white">Flagged Outlier Records Preview</h4>
                <p className="text-xs text-slate-400">Flows exceeding decision threshold with highest abnormal isolation scores</p>
              </div>
              <Badge label={`${anomalyData.flagged_records.length} records displayed`} variant="warning" />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400 text-[11px] uppercase">
                    <th className="p-3 pl-4">Flow Index</th>
                    <th className="p-3">Anomaly Score</th>
                    <th className="p-3">Proto</th>
                    <th className="p-3">Duration</th>
                    <th className="p-3">Packets / Sec</th>
                    <th className="p-3">SYN Flags</th>
                    <th className="p-3">Target Label (Ground Truth)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {anomalyData.flagged_records.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 pl-4 text-slate-500">#{r.index}</td>
                      <td className="p-3">
                        <span className="font-bold text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800/50">
                          {r.anomaly_score.toFixed(4)}
                        </span>
                      </td>
                      <td className="p-3 text-cyan-400 uppercase">{r.attributes["proto"] || "-"}</td>
                      <td className="p-3">{r.attributes["flow_duration"] || "-"}</td>
                      <td className="p-3">{r.attributes["flow_pkts_per_sec"] || "-"}</td>
                      <td className="p-3">{r.attributes["flow_SYN_flag_count"] || "0"}</td>
                      <td className="p-3">
                        <Badge label={String(r.attributes["Attack_type"] || "Unlabelled")} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
