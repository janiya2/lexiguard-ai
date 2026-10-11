"use client";

import React, { useState, useEffect } from "react";
import {
  Lock,
  Shield,
  Key,
  User,
  Mail,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  ShieldAlert
} from "lucide-react";
import {
  loginAdmin,
  createAdminAccount,
  isRegistrationAllowed,
  getAdminAccounts,
  AdminAccount,
} from "@/lib/adminAuthService";

interface AdminLoginScreenProps {
  onLoginSuccess: (admin: AdminAccount) => void;
}

export default function AdminLoginScreen({ onLoginSuccess }: AdminLoginScreenProps) {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [allowRegistration, setAllowRegistration] = useState(true);
  const [totalAdmins, setTotalAdmins] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Login form state
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register form state
  const [regName, setRegName] = useState("");
  const [regUsername, setRegUsername] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);

  useEffect(() => {
    async function checkState() {
      const allowed = await isRegistrationAllowed();
      const accounts = await getAdminAccounts();
      setAllowRegistration(allowed);
      setTotalAdmins(accounts.length);

      // If zero admins exist, default to register tab so initial admin setup is easy
      if (accounts.length === 0) {
        setActiveTab("register");
      }
    }
    checkState();
  }, []);

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
      onLoginSuccess(res.admin);
    } else {
      setErrorMsg(res.error || "Authentication failed.");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!regName.trim() || !regUsername.trim() || !regEmail.trim() || !regPassword) {
      setErrorMsg("Please fill in all required administrator setup fields.");
      return;
    }

    if (regPassword.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    setLoading(true);
    const res = await createAdminAccount({
      displayName: regName,
      username: regUsername,
      email: regEmail,
      password: regPassword,
    });
    setLoading(false);

    if (res.success && res.account) {
      setSuccessMsg("Administrator account created successfully! Logging you in...");
      setTimeout(() => {
        onLoginSuccess(res.account!);
      }, 800);
    } else {
      setErrorMsg(res.error || "Failed to create administrator account.");
    }
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
            Restricted role-based access for verified platform administrators and BLI auditors.
          </p>
        </div>

        {/* Tab Switcher: Login vs Setup */}
        <div className="flex items-center p-1 rounded-2xl bg-slate-950 border border-white/10 text-xs">
          <button
            type="button"
            onClick={() => {
              setActiveTab("login");
              setErrorMsg(null);
            }}
            className={`flex-1 py-2 rounded-xl font-bold transition-all ${
              activeTab === "login"
                ? "bg-cyan-500 text-black shadow-md shadow-cyan-500/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Admin Sign In
          </button>

          {allowRegistration ? (
            <button
              type="button"
              onClick={() => {
                setActiveTab("register");
                setErrorMsg(null);
              }}
              className={`flex-1 py-2 rounded-xl font-bold transition-all ${
                activeTab === "register"
                  ? "bg-cyan-500 text-black shadow-md shadow-cyan-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {totalAdmins === 0 ? "Initial Admin Setup" : "Create Admin Account"}
            </button>
          ) : (
            <div
              className="flex-1 py-2 text-center text-slate-600 font-bold cursor-not-allowed text-[11px]"
              title="Admin self-registration is locked by Super Admin"
            >
              🔒 Signups Disabled
            </div>
          )}
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

        {/* 1. LOGIN FORM */}
        {activeTab === "login" && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Admin Username or Email
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
                Security Password
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
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-black text-xs font-black uppercase tracking-wider shadow-lg shadow-cyan-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
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
        )}

        {/* 2. REGISTRATION / INITIAL SETUP FORM */}
        {activeTab === "register" && allowRegistration && (
          <form onSubmit={handleRegister} className="space-y-3.5">
            {totalAdmins === 0 && (
              <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[11px] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
                <span>
                  <strong>First-Time Setup:</strong> This initial account will be assigned full <strong>Super Administrator</strong> authority.
                </span>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Full Name / Alias
              </label>
              <input
                type="text"
                required
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder="Alex Morgan (Senior Legal Counsel)"
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Admin Username
                </label>
                <input
                  type="text"
                  required
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  placeholder="admin_innoxpert"
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="admin@bli.legal"
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Password
                </label>
                <input
                  type={showRegPassword ? "text" : "password"}
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Min 6 chars"
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Confirm
                </label>
                <input
                  type={showRegPassword ? "text" : "password"}
                  required
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <button
                type="button"
                onClick={() => setShowRegPassword(!showRegPassword)}
                className="text-cyan-400 hover:underline"
              >
                {showRegPassword ? "Hide passwords" : "Show passwords"}
              </button>
              <span>SHA-256 Hashed on Cloud</span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-400 hover:to-cyan-400 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-purple-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? (
                <span>Creating Administrator...</span>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Create Super Admin Account</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Security Notice */}
        <div className="text-center border-t border-white/5 pt-4">
          <p className="text-[10px] text-slate-500">
            Protected by LexiGuard RBAC Framework • IP & Audit Logs Enabled
          </p>
        </div>

      </div>
    </div>
  );
}
