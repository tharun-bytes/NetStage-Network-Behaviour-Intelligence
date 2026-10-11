import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { useApp } from "../../context/AppContext";
import { OverviewPage } from "../../pages/OverviewPage";
import { TrafficExplorerPage } from "../../pages/TrafficExplorerPage";
import { ClassificationPage } from "../../pages/ClassificationPage";
import { AnomalyAnalysisPage } from "../../pages/AnomalyAnalysisPage";
import { ModelLabPage } from "../../pages/ModelLabPage";
import { ExplainabilityPage } from "../../pages/ExplainabilityPage";
import { AICopilotPage } from "../../pages/AICopilotPage";
import { AIAgentControlPage } from "../../pages/AIAgentControlPage";
import { ReportsHistoryPage } from "../../pages/ReportsHistoryPage";
import { DataManagementPage } from "../../pages/DataManagementPage";
import { SettingsAboutPage } from "../../pages/SettingsAboutPage";
import { HeroLandingPage } from "../../pages/HeroLandingPage";
import { LoginPage } from "../../pages/LoginPage";
import { SignupPage } from "../../pages/SignupPage";
import { ForgotPasswordModal } from "../auth/ForgotPasswordModal";
import { FloatingCopilotWidget } from "../common/FloatingCopilotWidget";
import { Activity, CheckCircle, Info, X, XCircle } from "lucide-react";

export const Shell: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("landing");
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [isForgotOpen, setIsForgotOpen] = useState<boolean>(false);
  const { notification, clearNotification } = useApp();

  const renderActiveView = () => {
    switch (activeTab) {
      case "overview":
        return <OverviewPage onNavigate={setActiveTab} />;
      case "traffic":
        return <TrafficExplorerPage />;
      case "classification":
        return <ClassificationPage onNavigate={setActiveTab} />;
      case "anomaly":
        return <AnomalyAnalysisPage onNavigate={setActiveTab} />;
      case "model_lab":
        return <ModelLabPage onNavigate={setActiveTab} />;
      case "explainability":
        return <ExplainabilityPage onNavigate={setActiveTab} />;
      case "copilot":
        return <AICopilotPage onNavigate={setActiveTab} />;
      case "agents":
        return <AIAgentControlPage onNavigate={setActiveTab} />;
      case "reports":
        return <ReportsHistoryPage onNavigate={setActiveTab} />;
      case "data":
        return <DataManagementPage onNavigate={setActiveTab} />;
      case "settings":
        return <SettingsAboutPage />;
      case "login":
        return <LoginPage onNavigate={setActiveTab} onOpenForgotPassword={() => setIsForgotOpen(true)} />;
      case "signup":
        return <SignupPage onNavigate={setActiveTab} />;
      default:
        return <OverviewPage onNavigate={setActiveTab} />;
    }
  };

  // If viewing the Hero Showcase Landing Page, render the dedicated landing experience
  if (activeTab === "landing") {
    return (
      <div className="relative min-h-screen bg-[#050816] text-slate-100 font-sans">
        {/* Floating Return to Side Dashboard Action */}
        <div className="fixed top-5 left-6 z-50 hidden sm:block">
          <button
            onClick={() => setActiveTab("overview")}
            className="flex items-center gap-2 rounded-xl border border-cyan-500/60 bg-[#0d1424]/90 px-4 py-2 text-xs font-semibold text-cyan-300 shadow-xl shadow-cyan-950/80 backdrop-blur-md hover:bg-cyan-950 hover:border-cyan-400 transition-all group"
            title="Open Side Dashboard"
          >
            <Activity className="h-4 w-4 text-cyan-400 group-hover:scale-110 transition-transform" />
            <span>Open Side Dashboard</span>
          </button>
        </div>

        <HeroLandingPage
          onLaunch={() => setActiveTab("overview")}
          onNavigateTab={(tab) => setActiveTab(tab)}
        />

        {/* Global Floating Copilot even on landing page if summoned */}
        <FloatingCopilotWidget onExpandToFullPage={() => setActiveTab("copilot")} />

        {/* Toast Notification Popup */}
        {notification && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-lg border border-slate-700 bg-slate-900/95 px-4 py-3 shadow-2xl text-xs font-mono text-white backdrop-blur-md animate-in slide-in-from-bottom-5">
            {notification.type === "success" && <CheckCircle className="h-4 w-4 text-emerald-400" />}
            {notification.type === "error" && <XCircle className="h-4 w-4 text-rose-400" />}
            {notification.type === "info" && <Info className="h-4 w-4 text-cyan-400" />}
            <span>{notification.message}</span>
            <button
              onClick={clearNotification}
              className="ml-2 text-slate-400 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        <ForgotPasswordModal isOpen={isForgotOpen} onClose={() => setIsForgotOpen(false)} />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#0a0d14] text-slate-100 font-sans">
      {/* Collapsible Left Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar
          activeTab={activeTab}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          onNavigate={setActiveTab}
        />

        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#0a0d14]">
          <div className="max-w-7xl mx-auto space-y-6">
            {renderActiveView()}
          </div>
        </main>
      </div>

      {/* Floating Copilot Widget (shown across analysis pages except dedicated copilot view and auth pages) */}
      {activeTab !== "copilot" && activeTab !== "login" && activeTab !== "signup" && (
        <FloatingCopilotWidget onExpandToFullPage={() => setActiveTab("copilot")} />
      )}

      {/* Toast Notification Popup */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-lg border border-slate-700 bg-slate-900/95 px-4 py-3 shadow-2xl text-xs font-mono text-white backdrop-blur-md animate-in slide-in-from-bottom-5">
          {notification.type === "success" && <CheckCircle className="h-4 w-4 text-emerald-400" />}
          {notification.type === "error" && <XCircle className="h-4 w-4 text-rose-400" />}
          {notification.type === "info" && <Info className="h-4 w-4 text-cyan-400" />}
          <span>{notification.message}</span>
          <button
            onClick={clearNotification}
            className="ml-2 text-slate-400 hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <ForgotPasswordModal isOpen={isForgotOpen} onClose={() => setIsForgotOpen(false)} />
    </div>
  );
};
