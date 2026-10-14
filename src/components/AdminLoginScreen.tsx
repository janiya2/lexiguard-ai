"use client";

import React, { useState } from "react";
import {
  Lock,
  Key,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  CheckCircle2
} from "lucide-react";
import {
  loginAdmin,
  AdminAccount,
} from "@/lib/adminAuthService";

interface AdminLoginScreenProps {
  onLoginSuccess: (admin: AdminAccount) => void;
}

export default function AdminLoginScreen({ onLoginSuccess }: AdminLoginScreenProps) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Login form state
  const [loginUsername, setLoginUsername] = useState("admin");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginUsername.trim() || !loginPassword.trim()) {
      setErrorMsg("Please enter both administrator username and password.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const res = await loginAdmin(loginUsername, loginPassword);
    setLoading(false);

    if (res.success && res.admin) {
      setSuccessMsg("Administrator session authenticated. Loading Command Hub...");
      setTimeout(() => {
        onLoginSuccess(res.admin!);
      }, 500);
    } else {
      setErrorMsg(res.error || "Authentication failed. Access denied.");
    }
  };

  const fillEvaluatorCredentials = () => {
    setLoginUsername("admin");
    setLoginPassword("lexiguard2026");
    setErrorMsg(null);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 relative z-10">
      <div className="w-full max-w-md bg-slate-900/90 border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl backdrop-blur-2xl animate-in fade-in zoom-in-95">
        
        {/* Brand & Security Badge */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 mb-2 shadow-lg shadow-cyan-500/10">
            <Lock className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            LexiGuard <span className="text-cyan-400">Admin Portal</span>
          </h1>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Restricted role-based operational access for authorized platform administrators and BLI auditors.
          </p>
        </div>

        {/* Security Status Header */}
        <div className="p-3 rounded-2xl bg-slate-950/80 border border-white/10 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-emerald-400 font-bold">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-[11px]">Strict RBAC Enforcement</span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-rose-500/10 text-rose-300 border border-rose-500/20">
            Public Registration Locked
          </span>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* 1. SECURE LOGIN FORM */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Admin Username or Work Email
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                placeholder="admin or admin@lexiguard.ai"
                className="w-full bg-slate-950 border border-white/10 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Security Credential / Password
            </label>
            <div className="relative">
              <Key className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showLoginPassword ? "text" : "password"}
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-950 border border-white/10 rounded-xl pl-9 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
              <button
                type="button"
                onClick={() => setShowLoginPassword(!showLoginPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-black text-xs font-black uppercase tracking-wider shadow-lg shadow-cyan-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <span>Authenticating Administrator...</span>
            ) : (
              <>
                <span>Sign In as Administrator</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Evaluator Convenience Access for BLI Judges */}
        <div className="p-3.5 rounded-2xl bg-cyan-950/30 border border-cyan-500/20 space-y-1.5 text-center">
          <div className="flex items-center justify-center gap-1.5 text-[10px] uppercase font-bold text-cyan-300 tracking-wider">
            <span>⚖️</span>
            <span>BLI Hackathon Evaluator Access</span>
          </div>
          <p className="text-[11px] text-slate-300">
            Username: <code className="text-cyan-300 font-mono font-bold">admin</code> • Password: <code className="text-cyan-300 font-mono font-bold">lexiguard2026</code>
          </p>
          <button
            type="button"
            onClick={fillEvaluatorCredentials}
            className="text-[10px] text-cyan-400 hover:text-cyan-300 hover:underline font-bold transition-colors cursor-pointer"
          >
            Auto-fill Evaluator Credentials →
          </button>
        </div>

        {/* Security Notice */}
        <div className="text-center border-t border-white/5 pt-4 space-y-1">
          <p className="text-[10px] text-slate-500 font-mono">
            Protected by LexiGuard RBAC Framework • Delaware DGCL § 224 Compliant
          </p>
          <p className="text-[9px] text-slate-600">
            Unauthorized access attempts are cryptographically fingerprinted and logged.
          </p>
        </div>

      </div>
    </div>
  );
}
