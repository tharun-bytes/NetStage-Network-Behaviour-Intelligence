import React, { useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  BrainCircuit,
  CheckCircle,
  Download,
  FileUp,
  Play,
  RotateCcw,
  Sliders,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { api } from "../api/client";
import { PredictionResponse } from "../types";
import { Badge } from "../components/common/Badge";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { Alert } from "../components/common/Alert";

export const ClassificationPage: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const { models, activeModelId, activeModelDetail, selectActiveModel, showToast } = useApp();

  const [mode, setMode] = useState<"batch" | "single">("batch");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [predictionResult, setPredictionResult] = useState<PredictionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Single flow form state defaults
  const [singleInputs, setSingleInputs] = useState<Record<string, any>>({
    proto: "tcp",
    service: "http",
    flow_duration: 1.25,
    fwd_pkts_tot: 12,
    bwd_pkts_tot: 10,
    fwd_data_pkts_tot: 8,
    bwd_data_pkts_tot: 6,
    fwd_pkts_per_sec: 9.6,
    bwd_pkts_per_sec: 8.0,
    flow_pkts_per_sec: 17.6,
    flow_bytes_per_sec: 2400.0,
    fwd_header_size_tot: 240,
    bwd_header_size_tot: 200,
    flow_FIN_flag_count: 1,
    flow_SYN_flag_count: 1,
    flow_RST_flag_count: 0,
    flow_PSH_flag_count: 3,
    flow_ACK_flag_count: 21,
    flow_URG_flag_count: 0,
    flow_CWR_flag_count: 0,
    flow_ECE_flag_count: 0,
    "fwd_pkts_payload.avg": 85.0,
    "fwd_pkts_payload.max": 180.0,
    "fwd_pkts_payload.min": 20.0,
    "fwd_pkts_payload.std": 35.0,
    "bwd_pkts_payload.avg": 140.0,
    "bwd_pkts_payload.max": 420.0,
    "bwd_pkts_payload.min": 10.0,
    "bwd_pkts_payload.std": 50.0,
    "flow_iat.avg": 0.05,
    "flow_iat.max": 0.2,
    "flow_iat.min": 0.005,
    "flow_iat.std": 0.04,
    payload_bytes_per_second: 1950.0,
  });

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = e.target.value;
    if (newId) {
      selectActiveModel(newId);
    }
  };

  const handleBatchPredict = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError("Please select a CSV file for inference.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.predictBatch(selectedFile, activeModelId || undefined);
      setPredictionResult(res);
      showToast(`Predicted ${res.total_records} flows successfully`, "success");
    } catch (err: any) {
      setError(err.message || "Prediction failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSinglePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.predictSingle(singleInputs, activeModelId || undefined);
      setPredictionResult(res);
      showToast(`Classified flow as ${res.records[0]?.predicted_class}`, "success");
    } catch (err: any) {
      setError(err.message || "Single flow inference failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPredictions = () => {
    if (!predictionResult) return;
    const rows = predictionResult.records.map((r) => ({
      index: r.index,
      predicted_class: r.predicted_class,
      confidence: r.confidence ?? "N/A",
      ...r.class_probabilities,
    }));
    const headers = Object.keys(rows[0] || {}).join(",");
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows.map((row) => Object.values(row).join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `netsage_predictions_${activeModelId || "model"}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (models.length === 0) {
    return (
      <div className="rounded-xl border border-slate-800 bg-[#111827] p-8 text-center max-w-xl mx-auto space-y-4">
        <BrainCircuit className="h-10 w-10 text-cyan-400 mx-auto" />
        <h3 className="text-base font-semibold text-white">No Trained Models Available</h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          Before running traffic classification, please train or load a model from the Model Lab.
        </p>
        <button
          onClick={() => onNavigate("model_lab")}
          className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-xs font-medium text-white hover:bg-cyan-500 transition-colors shadow-sm"
        >
          Go to Model Lab <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Model Selection Header Bar */}
      <div className="rounded-xl border border-slate-800/80 bg-[#111827] p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-white">Active Classification Model</h3>
          <p className="text-xs text-slate-400">
            {activeModelDetail ? `${activeModelDetail.metadata.model_name} (Holdout Accuracy: ${(activeModelDetail.metrics.accuracy * 100).toFixed(1)}%)` : "Select a trained model for inference"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs text-slate-400">Model:</label>
          <select
            value={activeModelId || ""}
            onChange={handleModelChange}
            className="rounded-lg bg-slate-900 border border-slate-800 px-3 py-1.5 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none font-mono"
          >
            {models.map((m) => (
              <option key={m.model_id} value={m.model_id}>
                {m.model_name} (F1: {m.macro_f1.toFixed(3)})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Mode Selector Tabs */}
      <div className="flex border-b border-slate-800">
        <button
          onClick={() => setMode("batch")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-medium transition-colors ${
            mode === "batch"
              ? "border-cyan-500 text-cyan-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <FileUp className="h-4 w-4" />
          Batch CSV Inference
        </button>
        <button
          onClick={() => setMode("single")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-medium transition-colors ${
            mode === "single"
              ? "border-cyan-500 text-cyan-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Sliders className="h-4 w-4" />
          Single Flow Parameter Probe
        </button>
      </div>

      {error && <Alert type="error" title="Inference Error" message={error} onDismiss={() => setError(null)} />}

      {/* Mode 1: Batch Upload */}
      {mode === "batch" && (
        <div className="rounded-xl border border-slate-800/80 bg-[#111827] p-6 shadow-sm space-y-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Upload Unlabelled Flow CSV
          </h4>
          <p className="text-xs text-slate-400">
            Upload an unlabelled CSV matching the RT-IoT2022 feature schema (or test with <code className="text-cyan-300">data/unlabelled_test_flow.csv</code>).
          </p>

          <form onSubmit={handleBatchPredict} className="flex flex-col sm:flex-row items-center gap-3">
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="block w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-cyan-400 hover:file:bg-slate-700 cursor-pointer"
            />
            <button
              type="submit"
              disabled={loading || !selectedFile}
              className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-5 py-2 text-xs font-medium text-white hover:bg-cyan-500 transition-colors disabled:opacity-50 shrink-0"
            >
              <Play className="h-3.5 w-3.5" />
              Run Batch Inference
            </button>
          </form>
        </div>
      )}

      {/* Mode 2: Single Flow Input */}
      {mode === "single" && (
        <div className="rounded-xl border border-slate-800/80 bg-[#111827] p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Interactive Flow Parameter Probe
            </h4>
            <span className="text-[11px] text-slate-500">Inputs strictly conditioned on model schema</span>
          </div>

          <form onSubmit={handleSinglePredict} className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Protocol</label>
                <select
                  value={singleInputs.proto}
                  onChange={(e) => setSingleInputs({ ...singleInputs, proto: e.target.value })}
                  className="w-full rounded bg-slate-900 border border-slate-800 p-2 text-white font-mono text-xs"
                >
                  <option value="tcp">TCP</option>
                  <option value="udp">UDP</option>
                  <option value="icmp">ICMP</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Service</label>
                <select
                  value={singleInputs.service}
                  onChange={(e) => setSingleInputs({ ...singleInputs, service: e.target.value })}
                  className="w-full rounded bg-slate-900 border border-slate-800 p-2 text-white font-mono text-xs"
                >
                  <option value="http">HTTP</option>
                  <option value="dns">DNS</option>
                  <option value="mqtt">MQTT</option>
                  <option value="coap">CoAP</option>
                  <option value="none">None</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Flow Duration (s)</label>
                <input
                  type="number"
                  step="0.001"
                  value={singleInputs.flow_duration}
                  onChange={(e) => setSingleInputs({ ...singleInputs, flow_duration: parseFloat(e.target.value) || 0 })}
                  className="w-full rounded bg-slate-900 border border-slate-800 p-2 text-white font-mono text-xs"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Fwd Packets</label>
                <input
                  type="number"
                  value={singleInputs.fwd_pkts_tot}
                  onChange={(e) => setSingleInputs({ ...singleInputs, fwd_pkts_tot: parseInt(e.target.value) || 0 })}
                  className="w-full rounded bg-slate-900 border border-slate-800 p-2 text-white font-mono text-xs"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Bwd Packets</label>
                <input
                  type="number"
                  value={singleInputs.bwd_pkts_tot}
                  onChange={(e) => setSingleInputs({ ...singleInputs, bwd_pkts_tot: parseInt(e.target.value) || 0 })}
                  className="w-full rounded bg-slate-900 border border-slate-800 p-2 text-white font-mono text-xs"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Flow Packets/sec</label>
                <input
                  type="number"
                  step="0.1"
                  value={singleInputs.flow_pkts_per_sec}
                  onChange={(e) => setSingleInputs({ ...singleInputs, flow_pkts_per_sec: parseFloat(e.target.value) || 0 })}
                  className="w-full rounded bg-slate-900 border border-slate-800 p-2 text-white font-mono text-xs"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">SYN Flags</label>
                <input
                  type="number"
                  value={singleInputs.flow_SYN_flag_count}
                  onChange={(e) => setSingleInputs({ ...singleInputs, flow_SYN_flag_count: parseInt(e.target.value) || 0 })}
                  className="w-full rounded bg-slate-900 border border-slate-800 p-2 text-white font-mono text-xs"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">ACK Flags</label>
                <input
                  type="number"
                  value={singleInputs.flow_ACK_flag_count}
                  onChange={(e) => setSingleInputs({ ...singleInputs, flow_ACK_flag_count: parseInt(e.target.value) || 0 })}
                  className="w-full rounded bg-slate-900 border border-slate-800 p-2 text-white font-mono text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-5 py-2 text-xs font-medium text-white hover:bg-cyan-500 transition-colors disabled:opacity-50"
              >
                <Play className="h-3.5 w-3.5" /> Classify Flow Record
              </button>
            </div>
          </form>
        </div>
      )}

      {loading && <LoadingSpinner message="Executing model inference and probability estimation..." />}

      {/* Results View */}
      {predictionResult && !loading && (
        <div className="space-y-4">
          {/* Summary Breakdown */}
          <div className="rounded-xl border border-slate-800/80 bg-[#111827] p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-semibold text-white">Inference Classification Results</h4>
                <p className="text-xs text-slate-400">
                  {predictionResult.total_records} flow records evaluated by {predictionResult.model_name}
                </p>
              </div>

              <button
                onClick={handleDownloadPredictions}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 transition-colors"
              >
                <Download className="h-3.5 w-3.5" />
                Download Predictions CSV
              </button>
            </div>

            {/* Counts by Predicted Category */}
            <div className="flex flex-wrap gap-2 pt-1">
              {Object.entries(predictionResult.predictions_summary).map(([cls, count]) => (
                <div key={cls} className="flex items-center gap-2 rounded-lg bg-slate-900 border border-slate-800 px-3 py-1.5 text-xs font-mono">
                  <Badge label={cls} size="sm" />
                  <span className="font-bold text-white">{count}</span>
                  <span className="text-slate-500 text-[10px]">
                    ({((count / predictionResult.total_records) * 100).toFixed(1)}%)
                  </span>
                </div>
              ))}
            </div>

            {/* Legal / Operational Disclaimer */}
            <div className="rounded-lg bg-slate-900/60 border border-slate-800/80 p-3 text-[11px] text-slate-400">
              <span className="font-semibold text-slate-300">Defensive Data Disclaimer: </span>
              {predictionResult.disclaimer}
            </div>
          </div>

          {/* Records Table Preview */}
          <div className="rounded-xl border border-slate-800/80 bg-[#111827] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400 font-mono text-[11px] uppercase tracking-wider">
                    <th className="p-3 pl-4">#</th>
                    <th className="p-3">Predicted Category</th>
                    <th className="p-3">Confidence Score</th>
                    <th className="p-3">Class Probabilities</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                  {predictionResult.records.slice(0, 50).map((r, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 pl-4 text-slate-500">{r.index + 1}</td>
                      <td className="p-3">
                        <Badge label={r.predicted_class} />
                      </td>
                      <td className="p-3">
                        {r.confidence !== null && r.confidence !== undefined ? (
                          <span className={`font-bold ${r.confidence > 0.85 ? "text-emerald-400" : "text-amber-400"}`}>
                            {(r.confidence * 100).toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-slate-500">N/A</span>
                        )}
                      </td>
                      <td className="p-3 text-[11px] text-slate-400">
                        {r.class_probabilities && Object.keys(r.class_probabilities).length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-md">
                            {Object.entries(r.class_probabilities)
                              .sort((a, b) => b[1] - a[1])
                              .slice(0, 3)
                              .map(([cName, cProb]) => (
                                <span key={cName} className="rounded bg-slate-900 px-1.5 py-0.5 border border-slate-800">
                                  {cName}: {(cProb * 100).toFixed(0)}%
                                </span>
                              ))}
                          </div>
                        ) : (
                          <span>Uniform probability distribution</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {predictionResult.records.length > 50 && (
              <div className="p-3 text-center text-xs text-slate-500 border-t border-slate-800">
                Displaying first 50 of {predictionResult.total_records} records. Download CSV for full recordset.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
