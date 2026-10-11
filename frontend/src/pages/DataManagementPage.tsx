import React, { useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  Database,
  ExternalLink,
  FileText,
  FolderOpen,
  HardDrive,
  RefreshCw,
  ShieldCheck,
  Upload,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { StatCard } from "../components/common/StatCard";
import { Badge } from "../components/common/Badge";
import { Alert } from "../components/common/Alert";
import { PageBackground } from "../components/common/PageBackground";
import { Sparkles } from "lucide-react";

export const DataManagementPage: React.FC<{ onNavigate: (tab: string) => void }> = () => {
  const { profile, status, models, loadSampleDataset, uploadDataset, loading, showToast, askCopilot } = useApp();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState<boolean>(false);

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    if (profile) {
      setConfirmModalOpen(true);
      return;
    }

    executeUpload();
  };

  const executeUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setConfirmModalOpen(false);
    try {
      await uploadDataset(selectedFile);
      setSelectedFile(null);
    } catch {
      // error handled in context
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-8rem)]">
      <PageBackground imageSrc="/assets/netsage/dataset-bg.jpg" overlayVariant="dark" opacity={0.22} />

      <div className="relative z-10 space-y-6">
        {/* UCI RT-IoT2022 Acquisition Guide */}
        <div className="rounded-xl border border-slate-800/80 bg-[#111827]/90 p-5 shadow-sm space-y-3 backdrop-blur-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-cyan-400" />
              <h3 className="text-sm font-semibold text-white">UCI RT-IoT2022 Dataset Ingestion Guide</h3>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() =>
                  askCopilot(
                    "Explain the UCI RT-IoT2022 dataset schema, its 85 network telemetry features, attack vectors (DDoS, Brute Force, MQTT attacks), and preprocessing requirements."
                  )
                }
                className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-700/60 bg-indigo-950/70 px-3 py-1 text-xs font-medium text-indigo-300 hover:bg-indigo-900 transition-colors shadow-sm"
              >
                <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                Explain Schema with Copilot
              </button>
              <a
                href="https://archive.ics.uci.edu/dataset/942/rt-iot2022"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 font-medium"
              >
                Official UCI Repository <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          NetSage is calibrated for the UCI RT-IoT2022 dataset collected from realistic smart-home IoT devices under attack.
          You can load the verified 1,200-flow demonstration fixture instantly, or upload any full RT-IoT2022 CSV partition.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            onClick={() => loadSampleDataset()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-xs font-semibold text-white hover:bg-cyan-500 transition-colors disabled:opacity-50 shadow-sm"
          >
            <FolderOpen className="h-3.5 w-3.5" />
            Load Pre-packaged RT-IoT2022 Fixture
          </button>
        </div>
      </div>

      {/* Dataset Upload Card with Visual Asset */}
      <div className="rounded-xl border border-slate-800/80 bg-[#111827] p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-slate-700 shadow-md">
            <img
              src="/assets/netsage/dataset-upload.jpg"
              alt="Data Matrix"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="flex-1 w-full space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Upload Custom Network Flow CSV
            </h4>
            <form onSubmit={handleFileUpload} className="flex flex-col sm:flex-row items-center gap-3">
              <input
                type="file"
                accept=".csv"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="block w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-cyan-400 hover:file:bg-slate-700 cursor-pointer"
              />
              <button
                type="submit"
                disabled={uploading || !selectedFile}
                className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-5 py-2 text-xs font-medium text-white hover:bg-cyan-500 transition-colors disabled:opacity-50 shrink-0"
              >
                <Upload className="h-3.5 w-3.5" />
                {uploading ? "Validating & Profiling..." : "Upload & Validate"}
              </button>
            </form>
            <p className="text-[11px] text-slate-500">
              Maximum upload limit: 50MB · Required target column for training: <code className="text-cyan-400 font-mono">Attack_type</code>
            </p>
          </div>
        </div>
      </div>

      {/* Confirmation Modal when replacing active dataset */}
      {confirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-800 bg-[#111827] p-6 shadow-2xl space-y-4">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
              Replace Active In-Memory Dataset?
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Replacing the dataset will reset current data tables and session caches with{" "}
              <span className="font-mono text-cyan-300">{selectedFile?.name}</span>. Existing trained model artifacts on disk will remain preserved.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setConfirmModalOpen(false)}
                className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={executeUpload}
                className="rounded-lg bg-cyan-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-cyan-500"
              >
                Proceed & Replace
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dataset Health & Schema Validation Report */}
      {profile && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <StatCard
              title="Dataset Records"
              value={profile.rows_count.toLocaleString()}
              subtitle={profile.source_name}
              icon={Database}
              badgeText="Loaded"
              badgeType="cyan"
            />
            <StatCard
              title="Duplicate Rows"
              value={profile.duplicate_rows}
              subtitle={`${profile.duplicate_percentage}% duplication rate`}
              icon={AlertTriangle}
              badgeText={profile.duplicate_rows > 0 ? "Flagged" : "Zero"}
              badgeType={profile.duplicate_rows > 0 ? "amber" : "green"}
            />
            <StatCard
              title="Missing Values"
              value={Object.values(profile.missing_summary).reduce((a, b) => a + b.missing_count, 0)}
              subtitle="Imputed via median/mode"
              icon={CheckCircle}
              badgeText="Handled"
              badgeType="green"
            />
            <StatCard
              title="Target Column"
              value={profile.target_column || "None"}
              subtitle={`${Object.keys(profile.target_distribution).length} Traffic Categories`}
              icon={ShieldCheck}
              badgeText="Verified"
              badgeType="purple"
            />
          </div>

          {/* Validation Warnings List */}
          {profile.warnings.length > 0 && (
            <div className="rounded-xl border border-amber-900/60 bg-amber-950/20 p-5 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4" /> Schema Validation & Data Quality Warnings
              </h4>
              <ul className="list-disc list-inside space-y-1 text-xs text-amber-200/90 font-mono">
                {profile.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Schema Columns Inventory */}
          <div className="rounded-xl border border-slate-800/80 bg-[#111827] p-5 shadow-sm space-y-4">
            <h4 className="text-sm font-semibold text-white">Feature Schema Inventory & Imputation Policy</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h5 className="text-xs font-semibold text-cyan-400 mb-2">
                  Numeric Continuous Features ({profile.numeric_feature_count})
                </h5>
                <div className="max-h-48 overflow-y-auto space-y-1 font-mono text-xs pr-2">
                  {profile.numeric_features.map((f) => (
                    <div key={f} className="flex justify-between p-1.5 rounded bg-slate-900 border border-slate-800/80 text-slate-300">
                      <span>{f}</span>
                      <span className="text-slate-500 text-[11px]">Median Imputed · Scaled</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h5 className="text-xs font-semibold text-purple-400 mb-2">
                  Categorical & Protocol Features ({profile.categorical_feature_count})
                </h5>
                <div className="max-h-48 overflow-y-auto space-y-1 font-mono text-xs pr-2">
                  {profile.categorical_features.map((f) => (
                    <div key={f} className="flex justify-between p-1.5 rounded bg-slate-900 border border-slate-800/80 text-slate-300">
                      <span>{f}</span>
                      <span className="text-slate-500 text-[11px]">One-Hot Encoded</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Model Artifacts Persisted on Disk */}
      <div className="rounded-xl border border-slate-800/80 bg-[#111827] p-5 shadow-sm space-y-3">
        <h4 className="text-sm font-semibold text-white flex items-center gap-2">
          <HardDrive className="h-4 w-4 text-cyan-400" />
          Model Artifacts Registry (`models/`)
        </h4>
        <p className="text-xs text-slate-400">
          Models are persisted safely to local disk using joblib and versioned JSON metadata.
        </p>

        <div className="space-y-2">
          {models.map((m) => (
            <div key={m.model_id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono gap-2">
              <div>
                <span className="font-semibold text-white">{m.model_name}</span>
                <span className="text-slate-500 ml-2">({m.model_id})</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-emerald-400">Acc: {(m.accuracy * 100).toFixed(1)}%</span>
                <span className="text-cyan-300">F1: {m.macro_f1.toFixed(3)}</span>
                <Badge label={m.is_active ? "Active" : "Saved"} variant={m.is_active ? "normal" : "slate"} size="sm" />
              </div>
            </div>
          ))}
        </div>
      </div>
      </div>
    </div>
  );
};
