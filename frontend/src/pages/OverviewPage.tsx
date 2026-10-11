import React from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart2,
  CheckCircle2,
  Database,
  Layers,
  PieChart as PieIcon,
  ShieldAlert,
  Zap,
} from "lucide-react";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useApp } from "../context/AppContext";
import { StatCard } from "../components/common/StatCard";
import { EmptyState } from "../components/common/EmptyState";
import { Badge } from "../components/common/Badge";
import { Alert } from "../components/common/Alert";
import { PageBackground } from "../components/common/PageBackground";
import { Sparkles } from "lucide-react";

const CLASS_COLORS = [
  "#06b6d4", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444",
  "#3b82f6", "#ec4899", "#14b8a6", "#f97316", "#6366f1"
];

export const OverviewPage: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const { profile, status, activeModelDetail, loadSampleDataset, loading, askCopilot } = useApp();

  if (!profile) {
    return (
      <div className="space-y-6">
        {/* Visual Hero Banner with Generated Asset */}
        <div className="rounded-2xl border border-slate-800 bg-[#0d121f] relative overflow-hidden shadow-2xl">
          <div className="absolute inset-0 z-0">
            <img
              src="/assets/netsage/hero-network.jpg"
              alt="Neural Network Flow Telemetry"
              className="h-full w-full object-cover opacity-25"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0a0d14] via-[#0a0d14]/80 to-transparent" />
          </div>

          <div className="relative z-10 p-8 sm:p-10 max-w-3xl space-y-4">
            <div className="flex items-center gap-3">
              <img
                src="/assets/netsage/netsage-mark.jpg"
                alt="NetSage Mark"
                className="h-10 w-10 rounded-xl border border-cyan-500/40 shadow-lg object-cover"
              />
              <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-950/90 px-3 py-1 text-xs font-mono font-medium text-cyan-300 border border-cyan-700/60">
                <Zap className="h-3.5 w-3.5" /> Explainable Network Behaviour Intelligence
              </span>
            </div>

            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Turn IoT Flow Telemetry Into Actionable Security Intelligence
            </h2>

            <p className="text-sm leading-relaxed text-slate-300 max-w-2xl">
              Analyze bidirectional network traffic characteristics, detect zero-day anomalies with unsupervised
              Isolation Forests, classify multi-class IoT attack vectors, and run multi-agent forensic investigations with
              full interpretability.
            </p>

            <div className="pt-3 flex flex-wrap items-center gap-4">
              <button
                onClick={() => loadSampleDataset()}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 px-6 py-3 text-xs font-semibold text-white shadow-xl shadow-cyan-950/60 hover:from-cyan-500 hover:to-indigo-500 transition-all disabled:opacity-50"
              >
                <Database className="h-4 w-4" />
                {loading ? "Loading RT-IoT2022..." : "Load UCI RT-IoT2022 Fixture"}
              </button>
              <button
                onClick={() => onNavigate("data")}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/90 px-5 py-3 text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:text-white transition-all backdrop-blur-sm"
              >
                Upload Custom Flow CSV <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Feature Cards with Visual Artworks */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="rounded-xl border border-slate-800 bg-[#111827] overflow-hidden group hover:border-cyan-800/80 transition-all">
            <div className="h-32 w-full overflow-hidden relative">
              <img
                src="/assets/netsage/network-topology.jpg"
                alt="Network Topology"
                className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#111827] via-transparent to-transparent" />
            </div>
            <div className="p-5 space-y-2">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-cyan-400" />
                <h3 className="text-sm font-semibold text-white">Multi-Class Attack Classification</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Supervised Random Forest and XGBoost models trained on IoT flows across DDoS, ARP spoofing, and NMAP reconnaissance.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-[#111827] overflow-hidden group hover:border-purple-800/80 transition-all">
            <div className="h-32 w-full overflow-hidden relative">
              <img
                src="/assets/netsage/ai-analysis-core.jpg"
                alt="AI Analysis Core"
                className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#111827] via-transparent to-transparent" />
            </div>
            <div className="p-5 space-y-2">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-purple-400" />
                <h3 className="text-sm font-semibold text-white">AI Security Copilot & Multi-Agent</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Interactive analyst copilot paired with a sequential 3-agent forensic investigation pipeline for automated report synthesis.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-[#111827] overflow-hidden group hover:border-emerald-800/80 transition-all">
            <div className="h-32 w-full overflow-hidden relative">
              <img
                src="/assets/netsage/anomaly-shield.jpg"
                alt="Anomaly Shield"
                className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#111827] via-transparent to-transparent" />
            </div>
            <div className="p-5 space-y-2">
              <div className="flex items-center gap-2">
                <BarChart2 className="h-4 w-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-white">Explainable Outlier Detection</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Unsupervised Isolation Forest isolating unknown structural shifts with per-flow feature attribution drivers.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Format Class Distribution Chart Data
  const classDistData = Object.entries(profile.target_distribution || {}).map(([cls, data]) => ({
    name: cls,
    count: data.count,
    percentage: data.percentage,
  }));

  // Top numeric metrics for summary
  const topCorrs = profile.top_correlations.slice(0, 5);

  return (
    <div className="relative min-h-[calc(100vh-8rem)]">
      <PageBackground imageSrc="/assets/netsage/dashboard-bg.jpg" overlayVariant="dark" opacity={0.22} />

      <div className="relative z-10 space-y-6">
        {/* KPI Top Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Flows Analyzed"
          value={profile.rows_count.toLocaleString()}
          subtitle={`Source: ${profile.source_name}`}
          icon={Database}
          badgeText="Verified"
          badgeType="cyan"
          highlight
        />
        <StatCard
          title="Predictive Features"
          value={profile.numeric_feature_count + profile.categorical_feature_count}
          subtitle={`${profile.numeric_feature_count} Numeric · ${profile.categorical_feature_count} Categorical`}
          icon={Layers}
          badgeText="Cleaned"
          badgeType="purple"
        />
        <StatCard
          title="Traffic Categories"
          value={Object.keys(profile.target_distribution || {}).length}
          subtitle={`Target: ${profile.target_column || "None"}`}
          icon={ShieldAlert}
          badgeText="Multi-Class"
          badgeType="amber"
        />
        <StatCard
          title="Active Model"
          value={activeModelDetail ? `${(activeModelDetail.metrics.accuracy * 100).toFixed(1)}%` : "Not Trained"}
          subtitle={activeModelDetail ? activeModelDetail.metadata.model_name : "Ready to Train"}
          icon={Activity}
          badgeText={activeModelDetail ? "Evaluated" : "Idle"}
          badgeType={activeModelDetail ? "green" : "red"}
        />
      </div>

      {/* Warnings & Data Hygiene Banner */}
      {profile.warnings.length > 0 && (
        <Alert
          type="warning"
          title={`Data Hygiene Notices (${profile.warnings.length} detected)`}
          message={profile.warnings.join(" ")}
        />
      )}

      {/* Analytics Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Class Distribution Bar Chart */}
        <div className="lg:col-span-2 rounded-xl border border-slate-800/80 bg-[#111827] p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Observed Traffic Class Distribution</h3>
              <p className="text-xs text-slate-400">Total flows categorized across training labels</p>
            </div>
            <button
              onClick={() => onNavigate("traffic")}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1"
            >
              Inspect Flows <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={classDistData} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
                <XAxis type="number" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" tick={{ fontSize: 11 }} width={110} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px", fontSize: "12px" }}
                  formatter={(val: any, name: any, item: any) => [`${val} flows (${item.payload.percentage}%)`, "Volume"]}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {classDistData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CLASS_COLORS[index % CLASS_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Target Composition Pie Chart */}
        <div className="rounded-xl border border-slate-800/80 bg-[#111827] p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Class Proportion Breakdown</h3>
            <p className="text-xs text-slate-400 mb-2">Multi-class balance overview</p>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={classDistData}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                  >
                    {classDistData.map((_, index) => (
                      <Cell key={`pie-cell-${index}`} fill={CLASS_COLORS[index % CLASS_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px", fontSize: "12px" }}
                    formatter={(val: any, name: any, item: any) => [`${val} (${item.payload.percentage}%)`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Duplicate Records:</span>
              <span className="font-mono text-slate-200">{profile.duplicate_rows} ({profile.duplicate_percentage}%)</span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400 mt-1">
              <span>Infinite Values:</span>
              <span className="font-mono text-slate-200">{profile.infinite_values_count}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Insights Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Feature Correlations */}
        <div className="rounded-xl border border-slate-800/80 bg-[#111827] p-5">
          <h3 className="text-sm font-semibold text-white mb-1">Collinear Flow Features</h3>
          <p className="text-xs text-slate-400 mb-4">Highest absolute correlation pairs in telemetry</p>
          <div className="space-y-2">
            {topCorrs.length > 0 ? (
              topCorrs.map((c, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded bg-slate-900/70 border border-slate-800/60 text-xs">
                  <div className="flex items-center gap-2 font-mono text-slate-300 truncate max-w-[280px]">
                    <span className="text-slate-500">#{i + 1}</span>
                    <span>{c.feature_a}</span>
                    <span className="text-slate-600">↔</span>
                    <span>{c.feature_b}</span>
                  </div>
                  <span className="font-mono font-semibold text-cyan-400">
                    {(c.correlation * 100).toFixed(1)}%
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500">No high correlations detected.</p>
            )}
          </div>
        </div>

        {/* Model Lab Highlight Card */}
        <div className="rounded-xl border border-slate-800/80 bg-[#111827] p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-white">Machine Learning Status</h3>
              <span className="inline-flex items-center gap-1 text-[11px] text-cyan-400 font-mono">
                <CheckCircle2 className="h-3.5 w-3.5" /> Pipeline Active
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              NetSage supports Dummy Baseline, Regularized Logistic Regression, Random Forest, and XGBoost with
              reproducible scikit-learn Pipelines.
            </p>

            {activeModelDetail ? (
              <div className="rounded-lg bg-slate-900/90 border border-slate-800 p-3.5 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Model:</span>
                  <span className="font-mono font-medium text-white">{activeModelDetail.metadata.model_name}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Holdout Accuracy:</span>
                  <span className="font-mono text-emerald-400">{(activeModelDetail.metrics.accuracy * 100).toFixed(2)}%</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Macro F1-Score:</span>
                  <span className="font-mono text-cyan-400">{activeModelDetail.metrics.macro_f1.toFixed(4)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Training Time:</span>
                  <span className="font-mono text-slate-300">{activeModelDetail.metrics.training_duration_seconds}s</span>
                </div>
              </div>
            ) : (
              <div className="rounded-lg bg-slate-900/60 border border-dashed border-slate-800 p-4 text-center">
                <p className="text-xs text-slate-400">No model trained yet on this dataset.</p>
                <button
                  onClick={() => onNavigate("model_lab")}
                  className="mt-2 inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-medium"
                >
                  Go to Model Lab to Train <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex justify-end">
            <button
              onClick={() => onNavigate("model_lab")}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 transition-colors"
            >
              Explore Model Lab <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* AI Investigation & Copilot Shortcuts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-indigo-900/60 bg-gradient-to-r from-indigo-950/40 to-slate-900/80 p-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl overflow-hidden border border-indigo-800/70 shrink-0">
              <img src="/assets/netsage/ai-analysis-core.jpg" alt="AI Copilot" className="h-full w-full object-cover" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">AI Security Copilot</h4>
              <p className="text-xs text-slate-400">Ask natural language questions grounded in your network telemetry and model predictions.</p>
            </div>
          </div>
          <button
            onClick={() => onNavigate("copilot")}
            className="shrink-0 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors"
          >
            Launch Copilot
          </button>
        </div>

        <div className="rounded-xl border border-cyan-900/60 bg-gradient-to-r from-cyan-950/40 to-slate-900/80 p-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl overflow-hidden border border-cyan-800/70 shrink-0">
              <img src="/assets/netsage/network-topology.jpg" alt="Multi-Agent" className="h-full w-full object-cover" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">3-Agent Forensic Pipeline</h4>
              <p className="text-xs text-slate-400">Run autonomous correlation, candidate flow isolation, and executive report synthesis.</p>
            </div>
          </div>
          <button
            onClick={() => onNavigate("agents")}
            className="shrink-0 rounded-lg bg-cyan-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-cyan-500 transition-colors"
          >
            Agent Control
          </button>
        </div>
      </div>
      </div>
    </div>
  );
};
