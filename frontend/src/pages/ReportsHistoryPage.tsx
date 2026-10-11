import React, { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Download,
  FileCheck,
  FileCode,
  FileText,
  RefreshCw,
  Search,
  ShieldAlert,
} from "lucide-react";
import { api } from "../api/client";
import { useApp } from "../context/AppContext";
import { InvestigationSummary } from "../types";
import { PageBackground } from "../components/common/PageBackground";
import { Sparkles } from "lucide-react";

export const ReportsHistoryPage: React.FC<{ onNavigate?: (tab: string) => void }> = ({ onNavigate }) => {
  const { notify, askCopilot } = useApp();
  const [reports, setReports] = useState<InvestigationSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const loadReports = async () => {
    setLoading(true);
    try {
      const data = await api.getInvestigations();
      setReports(data || []);
    } catch (err: any) {
      notify(`Failed to load investigation history: ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const getRiskBadge = (risk: string) => {
    switch (risk?.toLowerCase()) {
      case "critical":
        return "bg-rose-950 text-rose-300 border-rose-800";
      case "high":
        return "bg-amber-950 text-amber-300 border-amber-800";
      case "medium":
        return "bg-yellow-950 text-yellow-300 border-yellow-800";
      default:
        return "bg-cyan-950 text-cyan-300 border-cyan-800";
    }
  };

  const filteredReports = reports.filter(
    (r) =>
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.investigation_id.toLowerCase().includes(search.toLowerCase()) ||
      r.dataset_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative min-h-[calc(100vh-8rem)]">
      <PageBackground imageSrc="/assets/netsage/reports-bg.jpg" overlayVariant="dark" opacity={0.22} />

      <div className="relative z-10 space-y-6">
        {/* Header Banner */}
        <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-[#111827]/90 p-6 shadow-sm backdrop-blur-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-teal-700/60 shadow-lg shadow-teal-950/50">
                <img
                  src="/assets/netsage/report-audit.jpg"
                  alt="Audit Reports"
                  className="h-full w-full object-cover"
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-white tracking-tight">
                    Forensic Reports & Investigation History
                  </h2>
                  <span className="rounded bg-teal-950 px-2 py-0.5 text-[10px] font-mono font-medium text-teal-300 border border-teal-800">
                    Audit Trail
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Downloadable Markdown and JSON forensic artifacts generated across all multi-agent investigations.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  askCopilot(
                    `Summarize the history of forensic investigation reports across our sessions. How many total investigations were run and what severity findings were identified?`
                  )
                }
                className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-700/60 bg-indigo-950/70 px-3 py-1.5 text-xs font-medium text-indigo-300 hover:bg-indigo-900 transition-colors shadow-sm"
              >
                <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                Audit Summary with Copilot
              </button>
              <button
                onClick={loadReports}
                disabled={loading}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white transition-colors"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
              </button>
              {onNavigate && (
                <button
                  onClick={() => onNavigate("agents")}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-md hover:bg-cyan-500 transition-colors"
                >
                  New Investigation <ArrowRight className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

      {/* Search & Filter Bar */}
      <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-800 bg-[#111827] p-3 text-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, investigation ID, or dataset..."
            className="w-full rounded-lg border border-slate-700 bg-slate-900 pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
          />
        </div>
        <span className="font-mono text-[11px] text-slate-400">
          Showing {filteredReports.length} of {reports.length} Reports
        </span>
      </div>

      {/* Reports Table / List */}
      {filteredReports.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-slate-800 bg-[#111827] shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-900/60 font-mono text-[10px] uppercase text-slate-400">
              <tr>
                <th className="px-4 py-3">Investigation</th>
                <th className="px-4 py-3">Dataset Source</th>
                <th className="px-4 py-3 text-center">Anomalies</th>
                <th className="px-4 py-3 text-center">Assessed Risk</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Artifacts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredReports.map((report) => (
                <tr key={report.investigation_id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-white">{report.title}</div>
                    <div className="font-mono text-[10px] text-slate-500 mt-0.5">
                      {report.investigation_id} · {report.created_at}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-300">{report.dataset_name}</td>
                  <td className="px-4 py-3 text-center font-mono font-bold text-rose-400">
                    {report.anomalies_flagged}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-block rounded px-2 py-0.5 font-mono text-[10px] font-semibold border ${getRiskBadge(
                        report.risk_level
                      )}`}
                    >
                      {report.risk_level?.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center gap-1 font-mono text-[10px] text-emerald-400">
                      <FileCheck className="h-3 w-3" /> {report.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <a
                        href={api.getInvestigationReportDownloadUrl(report.investigation_id, "markdown")}
                        download
                        title="Download Markdown Report"
                        className="inline-flex items-center gap-1 rounded bg-slate-800 px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700 transition-colors"
                      >
                        <FileText className="h-3 w-3" /> MD
                      </a>
                      <a
                        href={api.getInvestigationReportDownloadUrl(report.investigation_id, "json")}
                        download
                        title="Download Structured JSON Report"
                        className="inline-flex items-center gap-1 rounded bg-slate-800 px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700 transition-colors"
                      >
                        <FileCode className="h-3 w-3" /> JSON
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-800 bg-[#111827] p-12 text-center space-y-4">
          <div className="mx-auto h-24 w-24 overflow-hidden rounded-2xl border border-slate-700 shadow-md">
            <img
              src="/assets/netsage/report-audit.jpg"
              alt="No Reports"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="max-w-sm mx-auto">
            <h3 className="text-sm font-semibold text-white">No Forensic Reports Found</h3>
            <p className="mt-1 text-xs text-slate-400">
              Run an automated multi-agent forensic investigation from the Agent Control Center to produce your first audit report.
            </p>
            {onNavigate && (
              <button
                onClick={() => onNavigate("agents")}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-xs font-semibold text-white hover:bg-cyan-500 transition-colors"
              >
                Go to Agent Control <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      )}
      </div>
    </div>
  );
};
