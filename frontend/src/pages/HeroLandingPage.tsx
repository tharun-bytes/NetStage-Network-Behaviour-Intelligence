import React, { useEffect, useRef } from "react";
import {
  Activity,
  AlertOctagon,
  ArrowRight,
  BarChart3,
  Bot,
  BrainCircuit,
  CheckCircle2,
  ChevronDown,
  Database,
  FileText,
  Lock,
  Network,
  Shield,
  ShieldAlert,
  Sparkles,
  Terminal,
  User,
  Zap,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface HeroLandingPageProps {
  onLaunch: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const HeroLandingPage: React.FC<HeroLandingPageProps> = ({ onLaunch, onNavigateTab }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let animId: number;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener("resize", handleResize);

    const particles: Array<{ x: number; y: number; vx: number; vy: number; radius: number; alpha: number }> = [];
    const count = Math.min(35, Math.floor(width / 35));

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 1.5 + 1,
        alpha: Math.random() * 0.4 + 0.2,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw faint connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(34, 211, 238, ${(1 - dist / 120) * 0.12})`;
            ctx.lineWidth = 0.75;
            ctx.stroke();
          }
        }
      }

      // Draw particles
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(45, 212, 191, ${p.alpha})`;
        ctx.fill();

        if (!prefersReducedMotion) {
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < 0) p.x = width;
          if (p.x > width) p.x = 0;
          if (p.y < 0) p.y = height;
          if (p.y > height) p.y = 0;
        }
      }

      if (!prefersReducedMotion) {
        animId = requestAnimationFrame(draw);
      }
    };

    draw();

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animId) cancelAnimationFrame(animId);
    };
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="relative min-h-screen bg-[#050816] text-slate-100 font-sans overflow-x-hidden selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* 1. Glass Top Navigation Bar */}
      <header className="fixed top-0 left-0 right-0 z-50 flex h-20 items-center justify-between border-b border-slate-800/60 bg-[#050816]/75 px-6 sm:px-12 backdrop-blur-xl transition-all">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          <div className="relative h-10 w-10 overflow-hidden rounded-xl border border-cyan-500/40 shadow-lg shadow-cyan-950/40">
            <img
              src="/assets/netsage/netsage-mark.jpg"
              alt="NetSage Logo"
              className="h-full w-full object-cover"
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-extrabold tracking-tight text-white">NetSage</span>
              <span className="rounded bg-cyan-950 px-1.5 py-0.5 text-[9px] font-mono font-medium text-cyan-400 border border-cyan-800/60">
                AI v1.0
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono tracking-wider">NETWORK INTELLIGENCE</p>
          </div>
        </div>

        {/* Center Nav Links */}
        <nav className="hidden md:flex items-center gap-7 text-xs font-medium text-slate-300">
          <button
            onClick={onLaunch}
            className="flex items-center gap-1.5 text-cyan-400 font-semibold hover:text-cyan-300 transition-colors"
          >
            <Activity className="h-3.5 w-3.5" /> Side Dashboard
          </button>
          <button onClick={() => scrollToSection("capabilities")} className="hover:text-cyan-400 transition-colors">
            Capabilities
          </button>
          <button onClick={() => scrollToSection("workflow")} className="hover:text-cyan-400 transition-colors">
            How It Works
          </button>
          <button onClick={() => scrollToSection("agents")} className="hover:text-cyan-400 transition-colors">
            AI Agents
          </button>
          <button onClick={() => scrollToSection("preview")} className="hover:text-cyan-400 transition-colors">
            Dashboard Preview
          </button>
        </nav>

        {/* Right CTA */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onLaunch}
            className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-800 bg-cyan-950/80 px-3.5 py-2 text-xs font-semibold text-cyan-300 hover:bg-cyan-900 transition-colors"
          >
            <Activity className="h-3.5 w-3.5" /> Side Dashboard
          </button>

          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-1.5 text-xs text-slate-300">
                {user?.picture ? (
                  <img src={user.picture} alt={user.full_name} className="h-5 w-5 rounded-full object-cover" />
                ) : (
                  <div className="h-5 w-5 rounded-full bg-cyan-600 flex items-center justify-center text-[10px] font-bold text-white uppercase">
                    {user?.full_name?.charAt(0) || "A"}
                  </div>
                )}
                <span className="font-medium text-white max-w-[100px] truncate">{user?.full_name?.split(" ")[0]}</span>
              </div>
              <button
                onClick={onLaunch}
                className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-cyan-600 via-indigo-600 to-cyan-500 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-cyan-950/50 hover:shadow-cyan-900/80 transition-all duration-300 hover:scale-[1.02]"
              >
                <span>Dashboard</span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </button>
              <button
                onClick={logout}
                className="rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs font-medium text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
                title="Sign Out"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigateTab ? onNavigateTab("login") : onLaunch()}
                className="rounded-xl border border-slate-700 bg-slate-900/80 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:text-white transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={() => onNavigateTab ? onNavigateTab("signup") : onLaunch()}
                className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-cyan-600 via-indigo-600 to-cyan-500 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-cyan-950/50 hover:shadow-cyan-900/80 transition-all duration-300 hover:scale-[1.02]"
              >
                <span>Get Started</span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative min-h-screen pt-28 pb-16 flex items-center justify-center overflow-hidden">
        {/* Background Artwork & Dynamic Particles */}
        <div className="absolute inset-0 z-0 pointer-events-none select-none">
          <img
            src="/assets/netsage/hero-bg.jpg"
            alt="Hero Background"
            className="h-full w-full object-cover object-right opacity-40"
          />
          <canvas ref={canvasRef} className="absolute inset-0 h-full w-full opacity-60 z-[1]" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#050816] via-[#050816]/90 to-transparent z-[2]" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050816] via-transparent to-transparent z-[2]" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-12 w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Headlines & CTA */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-800/70 bg-cyan-950/70 px-3.5 py-1 text-xs font-mono font-medium text-cyan-300 backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
              <span>Next-Gen Explainable AI for Network Behaviour</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-[1.12]">
              See Beyond <br />
              <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-indigo-400 bg-clip-text text-transparent">
                the Traffic.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-xl font-normal">
              Turn network-flow data into actionable intelligence with machine learning, anomaly detection, explainable AI,
              and coordinated AI-assisted investigations.
            </p>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-wrap items-center gap-3.5">
              {isAuthenticated ? (
                <button
                  onClick={onLaunch}
                  className="inline-flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-6 py-3.5 text-sm font-semibold text-white shadow-xl shadow-cyan-950/60 hover:from-cyan-400 hover:to-indigo-500 transition-all hover:scale-[1.02]"
                >
                  <span>Open Intelligence Command Center</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <>
                  <button
                    onClick={() => onNavigateTab ? onNavigateTab("signup") : onLaunch()}
                    className="inline-flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-6 py-3.5 text-sm font-semibold text-white shadow-xl shadow-cyan-950/60 hover:from-cyan-400 hover:to-indigo-500 transition-all hover:scale-[1.02]"
                  >
                    <span>Get Started Free</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onNavigateTab ? onNavigateTab("login") : onLaunch()}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 px-5 py-3.5 text-sm font-semibold text-slate-200 hover:bg-slate-800 hover:text-white transition-all backdrop-blur-md"
                  >
                    <User className="h-4 w-4 text-cyan-400" />
                    <span>Sign In</span>
                  </button>
                </>
              )}
              <button
                onClick={onLaunch}
                className="inline-flex items-center gap-2 rounded-xl border border-cyan-700/80 bg-cyan-950/80 px-5 py-3.5 text-sm font-semibold text-cyan-300 hover:bg-cyan-900 transition-all backdrop-blur-md"
              >
                <Activity className="h-4 w-4 text-cyan-400" />
                <span>Open Side Dashboard</span>
              </button>
              <button
                onClick={() => scrollToSection("capabilities")}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700/80 bg-slate-900/80 px-5 py-3.5 text-sm font-semibold text-slate-200 hover:bg-slate-800 hover:text-white transition-all backdrop-blur-md"
              >
                <span>Capabilities</span>
                <ChevronDown className="h-4 w-4 text-slate-400" />
              </button>
            </div>

            {/* Restrained Technical Trust Indicators */}
            <div className="pt-8 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
              <div className="flex items-center gap-2 text-slate-300">
                <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                <span>ML Classification</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <CheckCircle2 className="h-3.5 w-3.5 text-teal-400 shrink-0" />
                <span>Isolation Forest</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <CheckCircle2 className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                <span>Explainable AI</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <CheckCircle2 className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                <span>3-Agent Forensics</span>
              </div>
            </div>
          </div>

          {/* Right Column: Visual Preview Card */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-2xl border border-cyan-800/50 bg-[#0c1122]/90 p-5 shadow-2xl shadow-cyan-950/60 backdrop-blur-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-rose-500/80" />
                  <span className="h-3 w-3 rounded-full bg-amber-500/80" />
                  <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
                  <span className="font-mono text-xs text-slate-400 ml-2">telemetry_analyzer.live</span>
                </div>
                <span className="rounded bg-cyan-950 px-2 py-0.5 text-[10px] font-mono text-cyan-300 border border-cyan-800/80">
                  PASSIVE AUDIT
                </span>
              </div>

              {/* Mini metric indicators */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-3 space-y-1">
                  <span className="text-slate-400 text-[11px]">UCI RT-IoT2022</span>
                  <p className="text-lg font-bold font-mono text-white">1,200 Flows</p>
                  <span className="text-[10px] text-emerald-400 font-mono">Verified Baseline</span>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-3 space-y-1">
                  <span className="text-slate-400 text-[11px]">Outlier Outliers</span>
                  <p className="text-lg font-bold font-mono text-rose-400">28 Flagged</p>
                  <span className="text-[10px] text-cyan-400 font-mono">IsoForest (0.50 threshold)</span>
                </div>
              </div>

              {/* Sample classified flow card */}
              <div className="rounded-xl border border-slate-800/90 bg-[#0e1629] p-3.5 space-y-2 text-xs">
                <div className="flex items-center justify-between font-mono">
                  <span className="text-slate-400">Target Category</span>
                  <span className="rounded bg-rose-950/80 px-2 py-0.5 text-rose-300 border border-rose-800 font-bold">
                    DOS_SYN_Hping
                  </span>
                </div>
                <div className="flex items-center justify-between font-mono text-[11px] text-slate-400">
                  <span>Confidence Level</span>
                  <span className="text-cyan-300 font-semibold">96.8%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5">
                  <div className="bg-gradient-to-r from-cyan-500 to-rose-500 h-1.5 rounded-full" style={{ width: "96.8%" }} />
                </div>
                <p className="text-[11px] text-slate-400 pt-1 leading-relaxed">
                  Top Decision Drivers: <code className="text-cyan-300 font-mono">flow_SYN_flag_count (8)</code>, <code className="text-cyan-300 font-mono">flow_pkts_per_sec (124.5)</code>
                </p>
              </div>

              {/* Action trigger */}
              <button
                onClick={onLaunch}
                className="w-full rounded-xl bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 text-slate-200 py-2.5 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <span>Inspect in NetSage Dashboard</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 3. AI Intelligence Capabilities Section */}
      <section id="capabilities" className="py-24 border-t border-slate-800/80 bg-[#070b1c] relative">
        <div className="max-w-7xl mx-auto px-6 sm:px-12 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-semibold">
              Defensive Intelligence
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Enterprise Network Behaviour Capabilities
            </h2>
            <p className="text-sm text-slate-400">
              Four cohesive pillars designed for security operations analysts, machine learning engineers, and data scientists.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Capability 1 */}
            <div className="rounded-2xl border border-slate-800 bg-[#0c1122] p-6 space-y-3 hover:border-cyan-800 transition-all hover:-translate-y-1">
              <div className="h-10 w-10 rounded-xl bg-cyan-950 border border-cyan-800/70 flex items-center justify-center text-cyan-400 shadow-md">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-white">Multi-Class Attack Classification</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Supervised Random Forest and XGBoost classifiers trained on IoT traffic across DDoS floods, ARP poisoning, and NMAP port scans.
              </p>
            </div>

            {/* Capability 2 */}
            <div className="rounded-2xl border border-slate-800 bg-[#0c1122] p-6 space-y-3 hover:border-purple-800 transition-all hover:-translate-y-1">
              <div className="h-10 w-10 rounded-xl bg-purple-950 border border-purple-800/70 flex items-center justify-center text-purple-400 shadow-md">
                <AlertOctagon className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-white">Unsupervised Anomaly Detection</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Label-free Isolation Forest scoring that isolates rare structural and temporal deviations without target label bias.
              </p>
            </div>

            {/* Capability 3 */}
            <div className="rounded-2xl border border-slate-800 bg-[#0c1122] p-6 space-y-3 hover:border-emerald-800 transition-all hover:-translate-y-1">
              <div className="h-10 w-10 rounded-xl bg-emerald-950 border border-emerald-800/70 flex items-center justify-center text-emerald-400 shadow-md">
                <BrainCircuit className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-white">Explainable AI (XAI)</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Global MDI feature rankings combined with per-flow local attribution breakdowns and deterministic analyst narratives.
              </p>
            </div>

            {/* Capability 4 */}
            <div className="rounded-2xl border border-slate-800 bg-[#0c1122] p-6 space-y-3 hover:border-indigo-800 transition-all hover:-translate-y-1">
              <div className="h-10 w-10 rounded-xl bg-indigo-950 border border-indigo-800/70 flex items-center justify-center text-indigo-400 shadow-md">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-white">AI Security Copilot</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Grounded conversational intelligence with zero hallucinations, tool-assisted data queries, and multi-turn context retention.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. How NetSage Works Section */}
      <section id="workflow" className="py-24 border-t border-slate-800/80 bg-[#050816]">
        <div className="max-w-7xl mx-auto px-6 sm:px-12 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-mono uppercase tracking-wider text-teal-400 font-semibold">
              Pipeline Architecture
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              How NetSage Works
            </h2>
            <p className="text-sm text-slate-400">
              End-to-end telemetry lifecycle from safe CSV ingestion to explainable forensic reporting.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="rounded-2xl border border-slate-800 bg-[#0a0f20] p-6 space-y-3">
              <span className="text-2xl font-mono font-bold text-cyan-400">01</span>
              <h4 className="text-sm font-semibold text-white">Ingest Flow Data</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Upload historical network flow CSVs or load the built-in UCI RT-IoT2022 fixture. Automated hygiene validation strips IP/MAC leakage.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-[#0a0f20] p-6 space-y-3">
              <span className="text-2xl font-mono font-bold text-teal-400">02</span>
              <h4 className="text-sm font-semibold text-white">Classify & Detect</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Execute inference across multi-class models and unsupervised Isolation Forest outlier scores simultaneously.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-[#0a0f20] p-6 space-y-3">
              <span className="text-2xl font-mono font-bold text-purple-400">03</span>
              <h4 className="text-sm font-semibold text-white">Unpack Decisions</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Examine feature importance rankings and inspect local single-flow decision drivers to understand why a flow was categorized as an attack.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-[#0a0f20] p-6 space-y-3">
              <span className="text-2xl font-mono font-bold text-indigo-400">04</span>
              <h4 className="text-sm font-semibold text-white">Multi-Agent Audit</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Trigger autonomous 3-agent correlation pipelines to compile an evidence dossier and export audit-ready Markdown and JSON reports.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. AI Agent Workflow Section */}
      <section id="agents" className="py-24 border-t border-slate-800/80 bg-[#070b1c]">
        <div className="max-w-7xl mx-auto px-6 sm:px-12 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-mono uppercase tracking-wider text-purple-400 font-semibold">
              Autonomous Coordination
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Sequential 3-Agent Forensic Pipeline
            </h2>
            <p className="text-sm text-slate-400">
              Specialized autonomous roles working sequentially to isolate, correlate, and document network incidents.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Agent 1 */}
            <div className="rounded-2xl border border-slate-800 bg-[#0c1122] p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="rounded bg-cyan-950 px-2.5 py-0.5 text-[10px] font-mono text-cyan-300 border border-cyan-800">
                  STAGE 1
                </span>
                <Bot className="h-5 w-5 text-cyan-400" />
              </div>
              <h3 className="text-base font-semibold text-white">Traffic Analyst Agent</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Ingests raw flow telemetry, computes protocol and service distributions, and filters candidate high-risk records exceeding anomaly score cut-offs.
              </p>
              <div className="text-[11px] font-mono text-slate-500 border-t border-slate-800/80 pt-3">
                Outputs: Flagged candidate flow subset
              </div>
            </div>

            {/* Agent 2 */}
            <div className="rounded-2xl border border-slate-800 bg-[#0c1122] p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="rounded bg-purple-950 px-2.5 py-0.5 text-[10px] font-mono text-purple-300 border border-purple-800">
                  STAGE 2
                </span>
                <Bot className="h-5 w-5 text-purple-400" />
              </div>
              <h3 className="text-base font-semibold text-white">Forensic Investigation Agent</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Compares candidate anomalous flows against normal baseline distributions and calculates empirical feature divergence ratios across packet frequency and headers.
              </p>
              <div className="text-[11px] font-mono text-slate-500 border-t border-slate-800/80 pt-3">
                Outputs: Structured evidence dossier
              </div>
            </div>

            {/* Agent 3 */}
            <div className="rounded-2xl border border-slate-800 bg-[#0c1122] p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="rounded bg-emerald-950 px-2.5 py-0.5 text-[10px] font-mono text-emerald-300 border border-emerald-800">
                  STAGE 3
                </span>
                <Bot className="h-5 w-5 text-emerald-400" />
              </div>
              <h3 className="text-base font-semibold text-white">Forensic Reporting Agent</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Synthesizes forensic evidence into an executive briefing, assigns calibrated risk levels (Low to Critical), and compiles downloadable Markdown and JSON reports.
              </p>
              <div className="text-[11px] font-mono text-slate-500 border-t border-slate-800/80 pt-3">
                Outputs: Downloadable MD & JSON artifacts
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Dashboard Preview Section */}
      <section id="preview" className="py-24 border-t border-slate-800/80 bg-[#050816]">
        <div className="max-w-7xl mx-auto px-6 sm:px-12 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-semibold">
              Live Command Center
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Interactive Analytical Dashboard
            </h2>
            <p className="text-sm text-slate-400">
              Engineered with 11 cohesive views, responsive tables, interactive Recharts graphs, and low-latency API interactions.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-[#0c1122] p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-white">NetSage Telemetry Console Preview</h3>
                <p className="text-xs text-slate-400 font-mono">Status: Connected to Localhost (FastAPI + React 19)</p>
              </div>
              <button
                onClick={onLaunch}
                className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-xs font-semibold text-white hover:bg-cyan-500 transition-colors shadow-sm"
              >
                Open Full Dashboard <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 space-y-2">
                <span className="text-xs text-slate-400 font-mono uppercase">Attack Categories</span>
                <p className="text-2xl font-bold font-mono text-white">10 Classes</p>
                <p className="text-[11px] text-slate-400">DDoS, SYN Flood, ARP Poisoning, Port Scans, Normal IoT</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 space-y-2">
                <span className="text-xs text-slate-400 font-mono uppercase">Held-Out Accuracy</span>
                <p className="text-2xl font-bold font-mono text-emerald-400">86.7%</p>
                <p className="text-[11px] text-slate-400">Stratified holdout validation split with zero leakage</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 space-y-2">
                <span className="text-xs text-slate-400 font-mono uppercase">Forensic Agents</span>
                <p className="text-2xl font-bold font-mono text-cyan-400">3 Autonomous</p>
                <p className="text-[11px] text-slate-400">Sequential orchestration with complete audit trail</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Final Call to Action */}
      <section className="py-24 border-t border-slate-800/80 bg-gradient-to-b from-[#070b1c] to-[#050816] text-center">
        <div className="max-w-3xl mx-auto px-6 space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Start Your Network Investigation Today
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed max-w-xl mx-auto">
            Experience explainable network behaviour intelligence, unsupervised anomaly detection, and AI forensic workflows in a local, private environment.
          </p>
          <div className="pt-2">
            <button
              onClick={onLaunch}
              className="inline-flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-cyan-500 px-8 py-4 text-sm font-semibold text-white shadow-2xl shadow-cyan-950/60 hover:scale-[1.02] transition-all"
            >
              <span>Launch NetSage AI</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {/* 8. Professional Footer */}
      <footer className="border-t border-slate-800/80 bg-[#040612] py-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-6 sm:px-12 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img
              src="/assets/netsage/netsage-mark.jpg"
              alt="NetSage"
              className="h-6 w-6 rounded-lg object-cover border border-cyan-800/60"
            />
            <span className="font-semibold text-slate-300">NetSage AI — Network Behaviour Intelligence</span>
          </div>

          <div className="flex items-center gap-6 font-mono text-[11px]">
            <span>UCI RT-IoT2022 Calibrated</span>
            <span>•</span>
            <span>MIT License</span>
            <span>•</span>
            <span>Passive Defensive Analysis</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
