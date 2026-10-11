import React, { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  Shield,
  Sparkles,
  UserCheck,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface LoginPageProps {
  onNavigate: (tab: string) => void;
  onOpenForgotPassword?: () => void;
}

declare global {
  interface Window {
    google?: any;
  }
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate, onOpenForgotPassword }) => {
  const { loginWithGoogle, loginWithEmail, loginAsDemoAnalyst, loading, error, clearError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [googleStatus, setGoogleStatus] = useState<string | null>(null);
  const googleBtnRef = useRef<HTMLDivElement>(null);

  // Initialize official Google Identity Services if available
  useEffect(() => {
    clearError();
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

    if (window.google?.accounts?.id && googleClientId && googleBtnRef.current) {
      try {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: async (response: any) => {
            if (response?.credential) {
              const ok = await loginWithGoogle(response.credential);
              if (ok) onNavigate("overview");
            }
          },
        });
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: "filled_blue",
          size: "large",
          width: 320,
          text: "signin_with",
          shape: "pill",
        });
      } catch (err: any) {
        console.warn("Google button render:", err);
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    const ok = await loginWithEmail(email, password);
    if (ok) {
      onNavigate("overview");
    }
  };

  const handleDemoLogin = async () => {
    const ok = await loginAsDemoAnalyst();
    if (ok) {
      onNavigate("overview");
    }
  };

  const handleGoogleClickFallback = async () => {
    // If official GIS is not loaded or missing client_id, guide user or prompt
    if (window.google?.accounts?.id && import.meta.env.VITE_GOOGLE_CLIENT_ID) {
      window.google.accounts.id.prompt();
    } else {
      setGoogleStatus(
        "Google Client ID is currently pending configuration in .env (GOOGLE_CLIENT_ID). You can sign in using Email/Password or One-Click Demo Analyst Access below."
      );
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-cyan-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 h-80 w-80 rounded-full bg-indigo-500/10 blur-[100px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        {/* Brand header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="h-10 w-10 rounded-xl overflow-hidden border border-cyan-500/40 shadow-lg shadow-cyan-950/50">
              <img src="/assets/netsage/netsage-mark.jpg" alt="NetSage" className="h-full w-full object-cover" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">NetSage <span className="text-cyan-400">AI</span></span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Security Analyst Sign In</h1>
          <p className="text-xs text-slate-400 mt-1">
            Access explainable network intelligence, AI Copilot, and telemetry models
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-slate-800 bg-[#0d1222]/80 backdrop-blur-xl p-6 sm:p-8 shadow-2xl shadow-black/80">
          {/* Error notice */}
          {error && (
            <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-rose-500/40 bg-rose-950/40 p-3 text-xs text-rose-300 animate-in fade-in">
              <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {googleStatus && (
            <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-cyan-500/40 bg-cyan-950/40 p-3 text-xs text-cyan-300 animate-in fade-in">
              <Sparkles className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
              <span>{googleStatus}</span>
            </div>
          )}

          {/* Google Sign In Area */}
          <div className="space-y-3">
            <div ref={googleBtnRef} className="flex justify-center" />

            {/* Custom Google Button */}
            <button
              type="button"
              onClick={handleGoogleClickFallback}
              className="w-full flex items-center justify-center gap-3 rounded-xl border border-slate-700 bg-slate-900/90 py-2.5 px-4 text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:border-slate-600 transition-all shadow-sm group"
            >
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>
          </div>

          {/* Divider */}
          <div className="relative my-5 flex items-center justify-center">
            <div className="w-full border-t border-slate-800" />
            <span className="absolute bg-[#0d1222] px-3 text-[10px] uppercase font-mono tracking-widest text-slate-500">
              or email
            </span>
          </div>

          {/* Email Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="analyst@domain.com"
                  required
                  className="w-full rounded-xl border border-slate-700 bg-slate-900/80 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-sans"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-medium text-slate-300">Password</label>
                <button
                  type="button"
                  onClick={() => onOpenForgotPassword ? onOpenForgotPassword() : setGoogleStatus("Password recovery email simulation dispatched.")}
                  className="text-[11px] text-cyan-400 hover:text-cyan-300 hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full rounded-xl border border-slate-700 bg-slate-900/80 pl-9 pr-10 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-sans"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 py-2.5 px-4 text-xs font-semibold text-white shadow-lg shadow-cyan-950/60 hover:from-cyan-500 hover:to-indigo-500 transition-all disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Authenticating...
                </span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Analyst Access */}
          <div className="mt-5 pt-5 border-t border-slate-800/80">
            <button
              type="button"
              onClick={handleDemoLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-cyan-500/40 bg-cyan-950/40 py-2 px-3 text-xs font-medium text-cyan-300 hover:bg-cyan-900/60 transition-colors group"
            >
              <UserCheck className="h-4 w-4 text-cyan-400 group-hover:scale-110 transition-transform" />
              <span>One-Click Demo Analyst Access</span>
            </button>
            <p className="text-[10px] text-center text-slate-500 mt-1.5">
              Instantly experience authenticated features without typing credentials
            </p>
          </div>

          {/* Footer links */}
          <div className="mt-5 text-center space-y-2">
            <p className="text-xs text-slate-400">
              Don't have an account?{" "}
              <button
                type="button"
                onClick={() => onNavigate("signup")}
                className="text-cyan-400 hover:text-cyan-300 font-semibold hover:underline"
              >
                Sign Up
              </button>
            </p>
            <div>
              <button
                type="button"
                onClick={() => onNavigate("landing")}
                className="text-[11px] text-slate-500 hover:text-slate-400 hover:underline"
              >
                ← Return to Platform Overview (Guest Mode)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
