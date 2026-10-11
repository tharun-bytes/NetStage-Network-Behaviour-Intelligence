import React from "react";
import {
  Activity,
  AlertOctagon,
  BarChart3,
  Bot,
  BrainCircuit,
  ChevronLeft,
  ChevronRight,
  Compass,
  Database,
  FileSearch,
  FileText,
  LogOut,
  MessageSquare,
  Network,
  Settings,
  ShieldAlert,
  Sparkles,
  User,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  collapsed: boolean;
  setCollapsed: (c: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  collapsed,
  setCollapsed,
}) => {
  const { status, profile } = useApp();
  const { user, isAuthenticated, logout } = useAuth();

  const navItems = [
    { id: "landing", label: "Hero Showcase", icon: Compass, desc: "Platform overview & architecture" },
    { id: "overview", label: "Overview", icon: Activity, desc: "Platform telemetry & KPIs" },
    { id: "traffic", label: "Traffic Explorer", icon: Network, desc: "Filterable flow records" },
    { id: "classification", label: "Classification", icon: ShieldAlert, desc: "Inference & confidence" },
    { id: "anomaly", label: "Anomaly Analysis", icon: AlertOctagon, desc: "Unsupervised Isolation Forest" },
    { id: "explainability", label: "Explainability", icon: BrainCircuit, desc: "Feature attribution & XAI" },
    { id: "copilot", label: "AI Copilot", icon: Sparkles, desc: "Grounded security reasoning" },
    { id: "agents", label: "AI Agent Control", icon: Bot, desc: "3-agent forensic investigation" },
    { id: "model_lab", label: "Model Lab", icon: BarChart3, desc: "Model evaluation & comparison" },
    { id: "reports", label: "Reports & Audit", icon: FileText, desc: "Downloadable forensic dossiers" },
    { id: "data", label: "Data Management", icon: Database, desc: "UCI RT-IoT2022 ingestion" },
    { id: "settings", label: "Settings / About", icon: Settings, desc: "Model cards & attribution" },
  ];

  return (
    <aside
      className={`relative flex shrink-0 flex-col border-r border-slate-800/80 bg-[#0c101c] transition-all duration-300 z-30 ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Brand Header */}
      <div
        onClick={() => setActiveTab("overview")}
        title="Return to Overview Dashboard"
        className="flex h-16 items-center gap-3 border-b border-slate-800/80 px-4 cursor-pointer hover:bg-slate-800/40 transition-colors"
      >
        <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-cyan-800/60 shadow-md">
          <img
            src="/assets/netsage/netsage-mark.jpg"
            alt="NetSage Mark"
            className="h-full w-full object-cover"
          />
        </div>
        {!collapsed && (
          <div className="overflow-hidden flex-1">
            <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
              NetSage
              <span className="rounded bg-cyan-950 px-1.5 py-0.2 text-[9px] font-mono text-cyan-400 border border-cyan-800/50">
                v1.0
              </span>
            </h1>
            <p className="truncate text-[11px] text-slate-400">IoT Flow Intelligence</p>
          </div>
        )}
        {!collapsed ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setCollapsed(true);
            }}
            className="rounded-lg p-1 text-slate-500 hover:bg-slate-800 hover:text-slate-200 transition-colors"
            title="Collapse Side Dashboard"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setCollapsed(false);
            }}
            className="rounded-lg p-1 text-cyan-400 hover:bg-slate-800 hover:text-cyan-300 transition-colors ml-auto"
            title="Expand Side Dashboard"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              title={collapsed ? item.label : undefined}
              className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-medium transition-all ${
                isActive
                  ? "bg-cyan-950/70 text-cyan-300 border border-cyan-800/60 shadow-sm"
                  : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent"
              }`}
            >
              <Icon
                className={`h-4 w-4 shrink-0 transition-colors ${
                  isActive ? "text-cyan-400" : "text-slate-400 group-hover:text-slate-300"
                }`}
              />
              {!collapsed && (
                <div className="text-left">
                  <div className="font-medium text-slate-200">{item.label}</div>
                  <div className="text-[10px] text-slate-500 truncate max-w-[150px]">{item.desc}</div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Dataset & Model Status Pill at Bottom */}
      {!collapsed ? (
        <div className="border-t border-slate-800/80 p-3.5 bg-[#090d17]/80 space-y-2.5">
          <div className="space-y-2 rounded-lg bg-slate-900/90 p-2.5 border border-slate-800">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Dataset</span>
              <span className="font-mono text-xs font-medium text-slate-200 truncate max-w-[100px]">
                {profile ? profile.source_name : "None Loaded"}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Active Model</span>
              <span className="font-mono text-xs font-medium text-cyan-300 truncate max-w-[100px]">
                {status?.active_model_name ? status.active_model_name.split(" ")[0] : "None"}
              </span>
            </div>
          </div>

          {/* User Account Bar */}
          {isAuthenticated ? (
            <div className="flex items-center justify-between rounded-lg bg-slate-950/70 p-2 border border-slate-800/90 text-xs">
              <div className="flex items-center gap-2 truncate">
                {user?.picture ? (
                  <img src={user.picture} alt={user.full_name} className="h-6 w-6 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="h-6 w-6 rounded-full bg-cyan-600 flex items-center justify-center text-[10px] font-bold text-white uppercase shrink-0">
                    {user?.full_name?.charAt(0) || "A"}
                  </div>
                )}
                <div className="truncate">
                  <div className="font-medium text-white truncate max-w-[100px]">{user?.full_name}</div>
                  <div className="text-[9px] font-mono text-cyan-400 capitalize">{user?.auth_provider || "analyst"}</div>
                </div>
              </div>
              <button
                onClick={logout}
                className="rounded p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                title="Sign Out"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setActiveTab("login")}
              className="w-full flex items-center justify-center gap-2 rounded-lg border border-cyan-800/60 bg-cyan-950/50 py-2 text-xs font-medium text-cyan-300 hover:bg-cyan-900/60 transition-colors"
            >
              <User className="h-3.5 w-3.5 text-cyan-400" />
              <span>Sign In / Register</span>
            </button>
          )}
        </div>
      ) : (
        /* Collapsed Icon */
        <div className="border-t border-slate-800/80 p-2 flex justify-center">
          {isAuthenticated ? (
            <button
              onClick={() => setActiveTab("settings")}
              className="h-8 w-8 rounded-full bg-cyan-600/40 border border-cyan-500/50 flex items-center justify-center text-xs font-bold text-cyan-300 uppercase hover:bg-cyan-600/60"
              title={`Logged in as ${user?.full_name}`}
            >
              {user?.full_name?.charAt(0) || "A"}
            </button>
          ) : (
            <button
              onClick={() => setActiveTab("login")}
              className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800"
              title="Sign In"
            >
              <User className="h-4 w-4" />
            </button>
          )}
        </div>
      )}
    </aside>
  );
};
