import React from "react";
import {
  AlertTriangle,
  BookOpen,
  Code2,
  ExternalLink,
  Info,
  Server,
  Shield,
  Terminal,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { PageBackground } from "../components/common/PageBackground";

export const SettingsAboutPage: React.FC = () => {
  const { status } = useApp();
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <div className="relative min-h-[calc(100vh-8rem)]">
      <PageBackground imageSrc="/assets/netsage/hero-network.jpg" overlayVariant="dark" opacity={0.2} />

      <div className="relative z-10 space-y-6 max-w-5xl">
      {/* Analyst Profile & AI Copilot System Card */}
      <div className="rounded-xl border border-cyan-800/60 bg-[#0d1326] p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            {user?.picture ? (
              <img src={user.picture} alt={user.full_name} className="h-10 w-10 rounded-full object-cover border border-cyan-500/50" />
            ) : (
              <div className="h-10 w-10 rounded-lg bg-cyan-600/30 border border-cyan-500/50 flex items-center justify-center text-cyan-300 font-bold text-sm">
                {user?.full_name?.charAt(0) || "A"}
              </div>
            )}
            <div>
              <h3 className="text-sm font-bold text-white">
                {isAuthenticated ? user?.full_name : "Security Analyst (Guest Mode)"}
              </h3>
              <p className="text-xs text-slate-400">
                {isAuthenticated ? user?.email : "Local unauthenticated session · Full telemetry access enabled"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-cyan-950 px-2.5 py-1 text-[10px] font-mono font-medium text-cyan-300 border border-cyan-800">
              {isAuthenticated ? `Provider: ${user?.auth_provider?.toUpperCase()}` : "Guest / Preview"}
            </span>
            {isAuthenticated && (
              <button
                onClick={logout}
                className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1 text-xs text-slate-300 hover:text-rose-400 hover:border-rose-900 transition-colors"
              >
                Sign Out
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
          <div className="rounded-lg bg-slate-900/90 border border-slate-800 p-3 space-y-1">
            <span className="text-slate-400 block text-[10px]">AI Copilot Engine</span>
            <span className="text-cyan-300 font-bold">Google Gemini 3.8 Flash</span>
          </div>
          <div className="rounded-lg bg-slate-900/90 border border-slate-800 p-3 space-y-1">
            <span className="text-slate-400 block text-[10px]">Authentication Subsystem</span>
            <span className="text-emerald-400 font-bold">PBKDF2-HMAC + JWT + Google OAuth</span>
          </div>
          <div className="rounded-lg bg-slate-900/90 border border-slate-800 p-3 space-y-1">
            <span className="text-slate-400 block text-[10px]">Context Grounding</span>
            <span className="text-teal-300 font-bold">Active UCI RT-IoT2022 Stream</span>
          </div>
        </div>
      </div>

      {/* Platform Architecture & About */}
      <div className="rounded-xl border border-slate-800/80 bg-[#111827] p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">NetSage — Network Behaviour Intelligence</h3>
            <p className="text-xs text-slate-400">Version 1.0.0 · Production Portfolio Grade</p>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          NetSage is a defensive IoT network-flow behaviour analysis and explainable machine learning platform.
          It combines statistical flow telemetry profiling, multi-class cyber attack classification,
          unsupervised anomaly detection (Isolation Forest), and interpretable AI attribution to empower
          security analysts with transparent, reproducible, and verifiable intelligence.
        </p>
      </div>

      {/* Dataset Attribution Card */}
      <div className="rounded-xl border border-slate-800/80 bg-[#111827] p-6 shadow-sm space-y-3">
        <h4 className="text-sm font-semibold text-white flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-cyan-400" />
          Dataset Attribution & Citation
        </h4>
        <div className="rounded-lg bg-slate-900 border border-slate-800 p-4 font-mono text-xs text-slate-300 space-y-2">
          <p className="font-semibold text-white">UCI RT-IoT2022: Real-Time Internet of Things 2022 Dataset</p>
          <p className="text-slate-400">
            Donated by Bahaa Al-Musawi et al. via the University of California, Irvine (UCI) Machine Learning Repository.
          </p>
          <a
            href="https://archive.ics.uci.edu/dataset/942/rt-iot2022"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 pt-1"
          >
            https://archive.ics.uci.edu/dataset/942/rt-iot2022 <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      {/* Core Principles & Defensive Scope */}
      <div className="rounded-xl border border-slate-800/80 bg-[#111827] p-6 shadow-sm space-y-3">
        <h4 className="text-sm font-semibold text-white flex items-center gap-2">
          <Shield className="h-4 w-4 text-emerald-400" />
          Defensive Principles & Privacy Architecture
        </h4>
        <ul className="space-y-2 text-xs text-slate-300 list-disc list-inside leading-relaxed">
          <li>
            <strong className="text-white">Strictly Defensive Analysis:</strong> Operates strictly on historical CSV flow records and feature aggregations. Does not initiate intrusive scanning, live packet captures, or unauthorized probes.
          </li>
          <li>
            <strong className="text-white">Zero Leakage Guarantee:</strong> Raw host identifiers, MAC addresses, and specific IP addresses are omitted from predictive feature matrices to prevent trivial host memorization.
          </li>
          <li>
            <strong className="text-white">Honest Metrics & Evaluation:</strong> Evaluates performance strictly on held-out test splits with cross-validation. Zero division safeguards prevent division-by-zero inflated scores.
          </li>
          <li>
            <strong className="text-white">Transparent Explanations:</strong> Local and global XAI metrics highlight model decision boundaries without claiming definitive causal proof.
          </li>
        </ul>
      </div>

      {/* Runtime Environment Diagnostics */}
      <div className="rounded-xl border border-slate-800/80 bg-[#111827] p-6 shadow-sm space-y-3">
        <h4 className="text-sm font-semibold text-white flex items-center gap-2">
          <Server className="h-4 w-4 text-purple-400" />
          Local Runtime Configuration
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
          <div className="rounded bg-slate-900 border border-slate-800 p-2.5 flex justify-between">
            <span className="text-slate-400">Backend Server:</span>
            <span className="text-cyan-300 font-bold">FastAPI 0.110+ (Uvicorn)</span>
          </div>
          <div className="rounded bg-slate-900 border border-slate-800 p-2.5 flex justify-between">
            <span className="text-slate-400">Frontend Environment:</span>
            <span className="text-cyan-300 font-bold">React 19 · Vite 8 · TS</span>
          </div>
          <div className="rounded bg-slate-900 border border-slate-800 p-2.5 flex justify-between">
            <span className="text-slate-400">ML Engine:</span>
            <span className="text-cyan-300 font-bold">Scikit-learn 1.9+ · Joblib</span>
          </div>
          <div className="rounded bg-slate-900 border border-slate-800 p-2.5 flex justify-between">
            <span className="text-slate-400">Max Upload Limit:</span>
            <span className="text-cyan-300 font-bold">50 MB</span>
          </div>
        </div>
      </div>

      {/* Reproducible Startup Commands */}
      <div className="rounded-xl border border-slate-800/80 bg-[#111827] p-6 shadow-sm space-y-3">
        <h4 className="text-sm font-semibold text-white flex items-center gap-2">
          <Terminal className="h-4 w-4 text-amber-400" />
          Reproducible Startup Commands
        </h4>
        <div className="space-y-3 font-mono text-xs">
          <div>
            <span className="text-slate-400 block mb-1">Backend Startup:</span>
            <pre className="p-3 rounded bg-slate-950 border border-slate-800 text-cyan-300">
              .\venv\Scripts\uvicorn.exe backend.app.main:app --host 127.0.0.1 --port 8000 --reload
            </pre>
          </div>
          <div>
            <span className="text-slate-400 block mb-1">Frontend Startup:</span>
            <pre className="p-3 rounded bg-slate-950 border border-slate-800 text-cyan-300">
              cd frontend && npm run dev
            </pre>
          </div>
          <div>
            <span className="text-slate-400 block mb-1">Backend Automated Test Suite:</span>
            <pre className="p-3 rounded bg-slate-950 border border-slate-800 text-cyan-300">
              .\venv\Scripts\pytest.exe
            </pre>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};
