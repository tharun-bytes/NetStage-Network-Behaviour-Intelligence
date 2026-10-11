import React, { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  RefreshCw,
  RotateCcw,
  Search,
  Sparkles,
  Table as TableIcon,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { api } from "../api/client";
import { FlowRecord } from "../types";
import { Badge } from "../components/common/Badge";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { EmptyState } from "../components/common/EmptyState";
import { PageBackground } from "../components/common/PageBackground";

export const TrafficExplorerPage: React.FC = () => {
  const { profile, askCopilot } = useApp();

  const [records, setRecords] = useState<FlowRecord[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [targetFilter, setTargetFilter] = useState("");
  const [protoFilter, setProtoFilter] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchRecords = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const data = await api.getRecords({
        page,
        pageSize,
        search: search.trim() || undefined,
        targetFilter: targetFilter || undefined,
        protoFilter: protoFilter || undefined,
      });
      setRecords(data.records);
      setTotalRecords(data.total_records);
      setTotalPages(data.total_pages);
    } catch (err) {
      console.error("Failed to fetch records:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [page, pageSize, targetFilter, protoFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchRecords();
  };

  const handleResetFilters = () => {
    setSearch("");
    setTargetFilter("");
    setProtoFilter("");
    setPage(1);
  };

  const handleExport = () => {
    const url = api.getExportUrl(targetFilter || undefined);
    window.open(url, "_blank");
  };

  if (!profile) {
    return (
      <EmptyState
        icon={TableIcon}
        title="No Telemetry Loaded"
        description="Load the RT-IoT2022 dataset from the Overview or Data Management tab to explore individual network flows."
      />
    );
  }

  // Determine top columns to display in table
  const displayColumns = [
    "Attack_type",
    "proto",
    "service",
    "flow_duration",
    "fwd_pkts_tot",
    "bwd_pkts_tot",
    "flow_pkts_per_sec",
    "flow_bytes_per_sec",
    "flow_SYN_flag_count",
    "flow_ACK_flag_count",
    "fwd_pkts_payload.avg",
  ].filter((col) => col in (records[0] || {}) || profile.numeric_features.includes(col) || profile.categorical_features.includes(col) || col === profile.target_column);

  const attackClasses = Object.keys(profile.target_distribution || {});

  return (
    <div className="relative min-h-[calc(100vh-8rem)]">
      <PageBackground imageSrc="/assets/netsage/traffic-bg.jpg" overlayVariant="dark" opacity={0.22} />

      <div className="relative z-10 space-y-5">
        {/* Search and Filters Bar */}
        <div className="rounded-xl border border-slate-800/80 bg-[#111827]/90 p-4 shadow-sm space-y-3 backdrop-blur-md">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            {/* Text Search */}
            <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search across flow records (e.g. proto, service, label)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg bg-slate-900 border border-slate-800 pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </form>

            {/* Quick Filter Selects */}
            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
              {/* Target Filter */}
              <select
                value={targetFilter}
                onChange={(e) => {
                  setTargetFilter(e.target.value);
                  setPage(1);
                }}
                className="rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-slate-300 focus:border-cyan-500 focus:outline-none font-mono"
              >
                <option value="">All Traffic Classes</option>
                {attackClasses.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
              </select>

              {/* Protocol Filter */}
              <select
                value={protoFilter}
                onChange={(e) => {
                  setProtoFilter(e.target.value);
                  setPage(1);
                }}
                className="rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-slate-300 focus:border-cyan-500 focus:outline-none font-mono"
              >
                <option value="">All Protocols</option>
                <option value="tcp">TCP</option>
                <option value="udp">UDP</option>
                <option value="icmp">ICMP</option>
              </select>

              {/* Reset */}
              {(search || targetFilter || protoFilter) && (
                <button
                  onClick={handleResetFilters}
                  className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-850 px-2.5 py-2 text-xs text-slate-400 hover:text-white transition-colors"
                  title="Reset Filters"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Reset</span>
                </button>
              )}

              {/* Ask Copilot */}
              <button
                onClick={() =>
                  askCopilot(
                    `Summarize the current network traffic characteristics${
                      targetFilter ? ` for class ${targetFilter}` : ""
                    }${
                      protoFilter ? ` using protocol ${protoFilter}` : ""
                    } in the dataset. Highlight the top volume patterns, typical flow durations, and distinguishing packet characteristics.`
                  )
                }
                className="flex items-center gap-1.5 rounded-lg border border-indigo-700/60 bg-indigo-950/70 px-3 py-2 text-xs font-medium text-indigo-300 hover:bg-indigo-900 transition-colors shadow-sm"
              >
                <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                <span>Ask Copilot</span>
              </button>

              {/* Export CSV */}
              <button
                onClick={handleExport}
                className="flex items-center gap-1.5 rounded-lg bg-cyan-700/80 px-3 py-2 text-xs font-medium text-white hover:bg-cyan-600 transition-colors shadow-sm"
                title="Export Current View"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

        {/* Filter Stats Counter */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/60 pt-2.5">
          <div>
            Showing <span className="font-mono text-white font-medium">{records.length}</span> of{" "}
            <span className="font-mono text-white font-medium">{totalRecords.toLocaleString()}</span> matching records
            {targetFilter && <span> (filtered by: {targetFilter})</span>}
          </div>
          <div className="flex items-center gap-2 font-mono">
            <span>Page Size:</span>
            {[10, 20, 50, 100].map((size) => (
              <button
                key={size}
                onClick={() => {
                  setPageSize(size);
                  setPage(1);
                }}
                className={`px-1.5 py-0.5 rounded ${
                  pageSize === size ? "bg-cyan-950 text-cyan-400 border border-cyan-800" : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Records Table */}
      <div className="rounded-xl border border-slate-800/80 bg-[#111827] overflow-hidden shadow-sm">
        {loading ? (
          <LoadingSpinner message="Filtering network flow records..." />
        ) : records.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No flows match the active search criteria or filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400 font-mono text-[11px] uppercase tracking-wider">
                  <th className="p-3 pl-4">#</th>
                  {displayColumns.map((col) => (
                    <th key={col} className="p-3 font-semibold whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                  <th className="p-3 pr-4 text-right">Copilot Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                {records.map((row, rowIdx) => {
                  const globalIdx = (page - 1) * pageSize + rowIdx + 1;
                  return (
                    <tr
                      key={rowIdx}
                      className="hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="p-3 pl-4 text-slate-500">{globalIdx}</td>
                      {displayColumns.map((col) => {
                        const val = row[col];
                        if (col === "Attack_type") {
                          return (
                            <td key={col} className="p-3 whitespace-nowrap">
                              <Badge label={String(val || "Unknown")} size="sm" />
                            </td>
                          );
                        }
                        if (col === "proto") {
                          return (
                            <td key={col} className="p-3 whitespace-nowrap">
                              <span className="text-cyan-400 font-bold uppercase">{val}</span>
                            </td>
                          );
                        }
                        const isNum = typeof val === "number";
                        return (
                          <td key={col} className="p-3 whitespace-nowrap text-slate-300">
                            {isNum ? (val % 1 !== 0 ? val.toFixed(3) : val) : String(val ?? "-")}
                          </td>
                        );
                      })}
                      <td className="p-3 pr-4 text-right">
                        <button
                          onClick={() =>
                            askCopilot(
                              `Analyze and explain the network telemetry for flow record #${globalIdx} (${row["Attack_type"] || "Flow"}, proto: ${row["proto"]}, service: ${row["service"]}). What do its packets, duration, and flags indicate?`,
                              row,
                              "traffic"
                            )
                          }
                          className="inline-flex items-center gap-1 rounded bg-indigo-950/80 px-2 py-1 text-[11px] font-sans font-medium text-indigo-300 hover:bg-indigo-900 border border-indigo-800/60 transition-colors"
                          title="Ask Copilot about this flow"
                        >
                          <Sparkles className="h-3 w-3 text-indigo-400" />
                          Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 bg-[#0e1320] px-4 py-3 text-xs text-slate-400">
          <div>
            Page <span className="font-mono text-white font-medium">{page}</span> of{" "}
            <span className="font-mono text-white font-medium">{totalPages}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 hover:text-white disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 hover:text-white disabled:opacity-40 transition-colors"
            >
              Next <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};
