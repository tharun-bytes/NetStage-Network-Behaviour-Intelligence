import React, { useState } from "react";
import {
  Activity,
  Award,
  BarChart3,
  BrainCircuit,
  CheckCircle,
  Clock,
  Layers,
  Play,
  RotateCcw,
  Sliders,
} from "lucide-react";
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useApp } from "../context/AppContext";
import { api } from "../api/client";
import { StatCard } from "../components/common/StatCard";
import { Badge } from "../components/common/Badge";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { Alert } from "../components/common/Alert";

export const ModelLabPage: React.FC<{ onNavigate: (tab: string) => void }> = () => {
  const { profile, models, activeModelId, activeModelDetail, refreshModels, selectActiveModel, showToast } = useApp();

  const [selectedTrainModel, setSelectedTrainModel] = useState<string>("random_forest");
  const [testSize, setTestSize] = useState<number>(0.2);
  const [randomSeed, setRandomSeed] = useState<number>(42);
  const [runCV, setRunCV] = useState<boolean>(true);
  const [training, setTraining] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleTrain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setTraining(true);
    setError(null);
    try {
      const res = await api.trainModel({
        model_type: selectedTrainModel,
        test_size: testSize,
        random_state: randomSeed,
        run_cv: runCV,
      });
      await refreshModels();
      await selectActiveModel(res.model_id);
      showToast(`Model ${res.model_name} trained successfully! (Holdout Acc: ${(res.metrics.accuracy * 100).toFixed(1)}%)`, "success");
    } catch (err: any) {
      setError(err.message || "Model training failed");
    } finally {
      setTraining(false);
    }
  };

  // Format Per-Class Breakdown Chart
  const perClassData = activeModelDetail
    ? Object.entries(activeModelDetail.metrics.per_class || {}).map(([cls, data]) => ({
        className: cls,
        precision: data.precision,
        recall: data.recall,
        f1: data.f1_score,
        support: data.support,
      }))
    : [];

  const cm = activeModelDetail?.metrics.confusion_matrix;

  return (
    <div className="space-y-6">
      {/* Model Training & Experiment Config Bar */}
      <div className="rounded-xl border border-slate-800/80 bg-[#111827] p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <BrainCircuit className="h-4 w-4 text-cyan-400" />
              Machine Learning Experimentation Studio
            </h3>
            <p className="text-xs text-slate-400">
              Train reproducible scikit-learn Pipelines on verified training splits with holdout evaluation.
            </p>
          </div>

          <form onSubmit={handleTrain} className="flex flex-wrap items-center gap-3">
            <select
              value={selectedTrainModel}
              onChange={(e) => setSelectedTrainModel(e.target.value)}
              className="rounded-lg bg-slate-900 border border-slate-800 px-3 py-1.5 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none font-mono"
            >
              <option value="random_forest">Random Forest Classifier (Ensemble)</option>
              <option value="logistic_regression">Multinomial Logistic Regression (L2)</option>
              <option value="dummy">Dummy Classifier (Baseline)</option>
              <option value="xgboost">XGBoost (Gradient Boosted Trees)</option>
            </select>

            <button
              type="submit"
              disabled={training || !profile}
              className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-cyan-500 transition-colors disabled:opacity-50 shadow-sm"
            >
              <Play className="h-3.5 w-3.5" />
              {training ? "Training..." : "Train Pipeline"}
            </button>
          </form>
        </div>

        {/* Experiment Hyperparameters Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-800/60 text-xs">
          <div>
            <div className="flex justify-between text-slate-300 mb-1 font-mono">
              <span>Holdout Test Split:</span>
              <span className="text-cyan-400 font-bold">{(testSize * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0.10"
              max="0.40"
              step="0.05"
              value={testSize}
              onChange={(e) => setTestSize(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
          </div>

          <div>
            <label className="text-slate-300 block mb-1 font-mono">Random Seed (Seed Reproducibility):</label>
            <input
              type="number"
              value={randomSeed}
              onChange={(e) => setRandomSeed(parseInt(e.target.value) || 42)}
              className="w-full rounded bg-slate-900 border border-slate-800 p-1.5 text-white font-mono text-xs"
            />
          </div>

          <div className="flex items-center gap-2 pt-4">
            <input
              type="checkbox"
              id="cv_toggle"
              checked={runCV}
              onChange={(e) => setRunCV(e.target.checked)}
              className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-500"
            />
            <label htmlFor="cv_toggle" className="text-slate-300 font-mono text-xs cursor-pointer">
              5-Fold Cross-Validation on Train Split
            </label>
          </div>
        </div>
      </div>

      {error && <Alert type="error" title="Experiment Error" message={error} onDismiss={() => setError(null)} />}

      {training && <LoadingSpinner message="Fitting preprocessing transformers and training estimator..." />}

      {/* Model Benchmark Comparison Table */}
      <div className="rounded-xl border border-slate-800/80 bg-[#111827] overflow-hidden shadow-sm">
        <div className="p-4 bg-slate-900/70 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold text-white">Model Benchmark Leaderboard</h4>
            <p className="text-xs text-slate-400">Head-to-head comparison of trained model architectures</p>
          </div>
          <Badge label={`${models.length} models tracked`} variant="info" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400 text-[11px] uppercase">
                <th className="p-3 pl-4">Architecture</th>
                <th className="p-3">Holdout Accuracy</th>
                <th className="p-3">Macro F1</th>
                <th className="p-3">Weighted F1</th>
                <th className="p-3">Active Status</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {models.map((m) => {
                const isSelected = m.model_id === activeModelId;
                return (
                  <tr key={m.model_id} className={`hover:bg-slate-800/40 transition-colors ${isSelected ? "bg-cyan-950/20" : ""}`}>
                    <td className="p-3 pl-4 font-semibold text-white flex items-center gap-2">
                      {isSelected && <span className="h-2 w-2 rounded-full bg-cyan-400" />}
                      {m.model_name}
                    </td>
                    <td className="p-3 text-emerald-400 font-bold">{(m.accuracy * 100).toFixed(2)}%</td>
                    <td className="p-3 text-cyan-300">{m.macro_f1.toFixed(4)}</td>
                    <td className="p-3 text-slate-300">{m.weighted_f1.toFixed(4)}</td>
                    <td className="p-3">
                      <Badge label={isSelected ? "Active" : "Archived"} variant={isSelected ? "normal" : "slate"} size="sm" />
                    </td>
                    <td className="p-3">
                      {!isSelected && (
                        <button
                          onClick={() => selectActiveModel(m.model_id)}
                          className="text-[11px] text-cyan-400 hover:text-cyan-300 font-medium"
                        >
                          Activate
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Active Model Deep Dive Metrics */}
      {activeModelDetail && (
        <div className="space-y-6">
          {/* Metrics Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard
              title="Accuracy (Holdout)"
              value={`${(activeModelDetail.metrics.accuracy * 100).toFixed(2)}%`}
              subtitle={`Balanced: ${(activeModelDetail.metrics.balanced_accuracy * 100).toFixed(2)}%`}
              icon={Award}
              badgeText="Holdout"
              badgeType="green"
              highlight
            />
            <StatCard
              title="Macro F1-Score"
              value={activeModelDetail.metrics.macro_f1.toFixed(4)}
              subtitle={`Weighted F1: ${activeModelDetail.metrics.weighted_f1.toFixed(4)}`}
              icon={Activity}
              badgeText="Unweighted"
              badgeType="cyan"
            />
            <StatCard
              title="5-Fold CV F1"
              value={activeModelDetail.metrics.cv_weighted_f1_mean ? activeModelDetail.metrics.cv_weighted_f1_mean.toFixed(4) : "N/A"}
              subtitle={activeModelDetail.metrics.cv_weighted_f1_std ? `± ${activeModelDetail.metrics.cv_weighted_f1_std.toFixed(4)} std` : "Cross-Val"}
              icon={Layers}
              badgeText="Train CV"
              badgeType="purple"
            />
            <StatCard
              title="Training Latency"
              value={`${activeModelDetail.metrics.training_duration_seconds}s`}
              subtitle={`Infer: ${activeModelDetail.metrics.inference_duration_seconds}s`}
              icon={Clock}
              badgeText="Measured"
              badgeType="amber"
            />
          </div>

          {/* Per-Class Breakdown Bar Chart */}
          <div className="rounded-xl border border-slate-800/80 bg-[#111827] p-5 shadow-sm">
            <h4 className="text-sm font-semibold text-white mb-1">Per-Class Precision, Recall & F1-Score</h4>
            <p className="text-xs text-slate-400 mb-4">
              Reveals model performance across imbalanced traffic categories (avoids accuracy illusion)
            </p>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={perClassData} margin={{ top: 10, right: 20, left: 0, bottom: 25 }}>
                  <XAxis dataKey="className" stroke="#64748b" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" />
                  <YAxis domain={[0, 1]} stroke="#64748b" tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px", fontSize: "12px" }}
                    formatter={(val: any) => [val.toFixed(4), "Score"]}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                  <Bar dataKey="precision" fill="#06b6d4" name="Precision" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="recall" fill="#8b5cf6" name="Recall" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="f1" fill="#10b981" name="F1-Score" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Confusion Matrix Visualizer */}
          {cm && (
            <div className="rounded-xl border border-slate-800/80 bg-[#111827] p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="text-sm font-semibold text-white">Confusion Matrix (Held-out Test Split)</h4>
                  <p className="text-xs text-slate-400">Rows: Actual True Label · Columns: Model Predicted Label</p>
                </div>
                <span className="font-mono text-xs text-slate-400">
                  Total Test Flows: {activeModelDetail.metrics.total_test_samples}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-center border-collapse text-xs font-mono">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 text-[10px]">
                      <th className="p-2 text-left pl-3">True \ Pred</th>
                      {cm.labels.map((lbl, idx) => (
                        <th key={idx} className="p-2 max-w-[80px] truncate" title={lbl}>
                          {lbl.length > 8 ? `${lbl.substring(0, 8)}...` : lbl}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {cm.labels.map((rowLbl, rowIdx) => (
                      <tr key={rowIdx}>
                        <td className="p-2 text-left pl-3 font-semibold text-slate-300 whitespace-nowrap">
                          {rowLbl}
                        </td>
                        {cm.matrix[rowIdx].map((val, colIdx) => {
                          const isDiagonal = rowIdx === colIdx;
                          const cellColor = isDiagonal
                            ? val > 0 ? "bg-emerald-950/60 text-emerald-300 font-bold border border-emerald-800/50" : "bg-slate-900/40 text-slate-500"
                            : val > 0 ? "bg-rose-950/50 text-rose-300 border border-rose-800/40" : "text-slate-600";
                          return (
                            <td key={colIdx} className={`p-2 ${cellColor}`}>
                              {val}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Classification Report Raw Text */}
          <div className="rounded-xl border border-slate-800/80 bg-[#111827] p-5 shadow-sm">
            <h4 className="text-sm font-semibold text-white mb-2">Classification Report</h4>
            <pre className="p-4 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto">
              {activeModelDetail.metrics.classification_report_text}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
