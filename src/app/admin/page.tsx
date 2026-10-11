"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AdminLoginScreen from "@/components/AdminLoginScreen";
import {
  Lock,
  Key,
  Globe,
  Database,
  CheckCircle2,
  Save,
  RefreshCw,
  Eye,
  EyeOff,
  Server,
  Layers,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  Coins,
  Percent,
  Wallet,
  ArrowUpRight,
  UserCheck,
  Zap,
  Shield,
  UserPlus,
  LogOut,
  Sliders,
  FileText,
  Activity,
  Check,
  X
} from "lucide-react";
import {
  getSiteSettings,
  saveSiteSettings,
  getNotarizedContracts,
  getContractorProfiles,
  getCreditPurchases,
  CreditPurchase,
  ContractorProfile,
  DEFAULT_CONTRACTORS,
  SiteSettings,
  DEFAULT_SITE_SETTINGS,
} from "@/lib/firestoreService";
import {
  getActiveAdminSession,
  logoutAdmin,
  getAdminAccounts,
  getAdminSecurityConfig,
  saveAdminSecurityConfig,
  createAdminAccount,
  AdminAccount,
  AdminSecurityConfig,
} from "@/lib/adminAuthService";
import { useWeb3 } from "@/context/Web3Context";

export default function AdminPage() {
  const { account } = useWeb3();

  // Authentication State
  const [activeAdmin, setActiveAdmin] = useState<AdminAccount | null>(null);
  const [isAuthChecked, setIsAuthChecked] = useState(false);

  // Site Settings & CMS State
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [activeTab, setActiveTab] = useState<
    "cms" | "treasury" | "credits" | "contractors" | "keys" | "docs" | "security" | "health"
  >("cms");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [contracts, setContracts] = useState<any[]>([]);
  const [contractorsList, setContractorsList] = useState<ContractorProfile[]>(DEFAULT_CONTRACTORS);
  const [creditPurchases, setCreditPurchases] = useState<CreditPurchase[]>([]);

  // Admin Security & Users Management State
  const [adminAccounts, setAdminAccounts] = useState<AdminAccount[]>([]);
  const [securityConfig, setSecurityConfig] = useState<AdminSecurityConfig>({
    allowAdminRegistration: true,
    maxFailedAttempts: 5,
    sessionTimeoutHours: 24,
    initialSetupCompleted: false,
  });
  const [isSavingSecurity, setIsSavingSecurity] = useState(false);
  const [securitySuccess, setSecuritySuccess] = useState(false);

  // New Admin Creation Modal / Form State
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [newAdminName, setNewAdminName] = useState("");
  const [newAdminUser, setNewAdminUser] = useState("");
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminPass, setNewAdminPass] = useState("");
  const [newAdminRole, setNewAdminRole] = useState<"admin" | "super_admin">("admin");
  const [addAdminError, setAddAdminError] = useState<string | null>(null);
  const [isAddingAdmin, setIsAddingAdmin] = useState(false);

  useEffect(() => {
    async function init() {
      // 1. Verify Active Session
      const session = getActiveAdminSession();
      setActiveAdmin(session);
      setIsAuthChecked(true);

      // 2. Load Platform Data
      if (session) {
        const s = await getSiteSettings();
        setSettings(s);
        const docs = await getNotarizedContracts();
        setContracts(docs);
        const list = await getContractorProfiles();
        setContractorsList(list);
        const purchases = await getCreditPurchases();
        setCreditPurchases(purchases);

        // Load Admin Accounts & Security Config
        const accounts = await getAdminAccounts();
        setAdminAccounts(accounts);
        const sec = await getAdminSecurityConfig();
        setSecurityConfig(sec);
      }
    }
    init();
  }, []);

  const handleLoginSuccess = async (admin: AdminAccount) => {
    setActiveAdmin(admin);
    const s = await getSiteSettings();
    setSettings(s);
    const docs = await getNotarizedContracts();
    setContracts(docs);
    const list = await getContractorProfiles();
    setContractorsList(list);
    const purchases = await getCreditPurchases();
    setCreditPurchases(purchases);
    const accounts = await getAdminAccounts();
    setAdminAccounts(accounts);
    const sec = await getAdminSecurityConfig();
    setSecurityConfig(sec);
  };

  const handleLogout = () => {
    logoutAdmin();
    setActiveAdmin(null);
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    const success = await saveSiteSettings(settings);
    setIsSaving(false);
    if (success) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  const handleToggleRegistration = async (newValue: boolean) => {
    setIsSavingSecurity(true);
    setSecuritySuccess(false);
    const updated = { ...securityConfig, allowAdminRegistration: newValue };
    setSecurityConfig(updated);

    const ok = await saveAdminSecurityConfig({ allowAdminRegistration: newValue });
    setIsSavingSecurity(false);
    if (ok) {
      setSecuritySuccess(true);
      setTimeout(() => setSecuritySuccess(false), 3000);
    }
  };

  const handleCreateNewAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddAdminError(null);

    if (!newAdminName || !newAdminUser || !newAdminEmail || !newAdminPass) {
      setAddAdminError("All administrator fields are required.");
      return;
    }

    setIsAddingAdmin(true);
    const res = await createAdminAccount({
      displayName: newAdminName,
      username: newAdminUser,
      email: newAdminEmail,
      password: newAdminPass,
      role: newAdminRole,
    });
    setIsAddingAdmin(false);

    if (res.success && res.account) {
      setAdminAccounts([...adminAccounts, res.account]);
      setShowAddAdminModal(false);
      setNewAdminName("");
      setNewAdminUser("");
      setNewAdminEmail("");
      setNewAdminPass("");
    } else {
      setAddAdminError(res.error || "Failed to add administrator.");
    }
  };

  // 1. Initial Auth Loading State
  if (!isAuthChecked) {
    return (
      <div className="flex flex-col min-h-screen bg-[#040711] text-slate-100">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-3 text-cyan-400 text-sm">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span>Verifying Administrator Access Credentials...</span>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // 2. Unauthenticated State — Render Secure Admin Login Screen
  if (!activeAdmin) {
    return (
      <div className="flex flex-col min-h-screen bg-[#040711] text-slate-100">
        <Navbar />
        <AdminLoginScreen onLoginSuccess={handleLoginSuccess} />
        <Footer />
      </div>
    );
  }

  // 3. Authenticated State — Render Full Admin Dashboard with Admin Sidebar Layout
  return (
    <div className="flex flex-col min-h-screen bg-[#040711] text-slate-100 overflow-x-clip">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Top Header Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/15 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                <Lock className="w-3 h-3 text-purple-400" /> Super Admin Portal
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Firebase: <strong>web-b61f1</strong> Live Sync
              </span>
              <span className="text-xs text-slate-400">
                Network: <strong className="text-cyan-300">Base Sepolia (84532)</strong>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white mt-1.5 tracking-tight">
              LexiGuard System Administration & Governance
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Role-based control center for landing page CMS, protocol treasury revenue, AI keys, and user security.
            </p>
          </div>

          {/* Quick Actions & Live Save */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <Link
              href="/"
              target="_blank"
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-slate-900 border border-white/10 hover:border-cyan-500/40 text-slate-300 hover:text-white transition-all"
            >
              <span>View Public App</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-cyan-400" />
            </Link>

            <button
              onClick={() => handleSave()}
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-gradient-to-r from-purple-500 via-cyan-500 to-blue-500 hover:from-purple-400 hover:to-cyan-400 text-white shadow-lg shadow-purple-500/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving Live...</span>
                </>
              ) : saveSuccess ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Saved Live!</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Changes Live</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 2-COLUMN ADMIN LAYOUT: Dedicated Admin Sidebar + Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: Dedicated Admin Sidebar */}
          <aside className="lg:col-span-3 lg:sticky lg:top-24 space-y-4">
            
            {/* Authenticated Admin Profile Card */}
            <div className="p-4 rounded-3xl bg-slate-900/80 border border-white/10 backdrop-blur-xl shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Active Admin Session
                </span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {activeAdmin.role.replace("_", " ")}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-white font-black text-sm shadow-md">
                  {activeAdmin.displayName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">
                    {activeAdmin.displayName}
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono truncate">
                    @{activeAdmin.username}
                  </p>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-slate-950 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 text-[11px] font-semibold border border-white/5 hover:border-rose-500/30 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>

            {/* Sidebar Navigation Menus */}
            <div className="p-2.5 rounded-3xl bg-slate-900/80 border border-white/10 backdrop-blur-xl shadow-xl space-y-1">
              <span className="block px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Admin Menus
              </span>

              <button
                onClick={() => setActiveTab("cms")}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                  activeTab === "cms"
                    ? "bg-cyan-500 text-black shadow-md shadow-cyan-500/20"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Globe className="w-4 h-4" />
                  <span>Landing Page CMS</span>
                </div>
              </button>

              <button
                onClick={() => setActiveTab("treasury")}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                  activeTab === "treasury"
                    ? "bg-amber-500 text-black shadow-md shadow-amber-500/20"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Coins className="w-4 h-4" />
                  <span>Treasury & Fees (1%)</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-black/30">
                  {settings.protocolFeePercentage}%
                </span>
              </button>

              <button
                onClick={() => setActiveTab("credits")}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                  activeTab === "credits"
                    ? "bg-purple-500 text-white shadow-md shadow-purple-500/20"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4" />
                  <span>Credits & Paywall</span>
                </div>
              </button>

              <button
                onClick={() => setActiveTab("contractors")}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                  activeTab === "contractors"
                    ? "bg-emerald-500 text-black shadow-md shadow-emerald-500/20"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <UserCheck className="w-4 h-4" />
                  <span>Contractors</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-black/30">
                  {contractorsList.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab("keys")}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                  activeTab === "keys"
                    ? "bg-cyan-500 text-black shadow-md shadow-cyan-500/20"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Key className="w-4 h-4" />
                  <span>AI Engine & Keys</span>
                </div>
              </button>

              <button
                onClick={() => setActiveTab("docs")}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                  activeTab === "docs"
                    ? "bg-cyan-500 text-black shadow-md shadow-cyan-500/20"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Database className="w-4 h-4" />
                  <span>Document Ledger</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-black/30">
                  {contracts.length}
                </span>
              </button>

              {/* SECURITY & ADMIN ROLES (NEW) */}
              <button
                onClick={() => setActiveTab("security")}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                  activeTab === "security"
                    ? "bg-purple-500 text-white shadow-md shadow-purple-500/20"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-purple-400" />
                  <span>Admin Roles & Security</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-purple-500/20 text-purple-300">
                  {adminAccounts.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab("health")}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                  activeTab === "health"
                    ? "bg-blue-500 text-white shadow-md shadow-blue-500/20"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Server className="w-4 h-4" />
                  <span>System Health</span>
                </div>
              </button>
            </div>

            {/* Platform Quick Stats */}
            <div className="p-4 rounded-3xl bg-slate-950/60 border border-white/5 space-y-2 text-xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Platform Pulse
              </span>
              <div className="flex items-center justify-between text-slate-300">
                <span>Audited Contracts</span>
                <span className="font-mono font-bold text-cyan-400">{contracts.length}</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>Active Contractors</span>
                <span className="font-mono font-bold text-emerald-400">{contractorsList.length}</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>Credit Top-Ups</span>
                <span className="font-mono font-bold text-purple-400">{creditPurchases.length}</span>
              </div>
            </div>

          </aside>

          {/* RIGHT COLUMN: Active Admin Work Content */}
          <div className="lg:col-span-9 space-y-6">

            {/* TAB 1: LANDING PAGE CMS */}
            {activeTab === "cms" && (
              <form onSubmit={handleSave} className="space-y-6 animate-in fade-in">
                <div className="p-6 rounded-3xl bg-slate-900/70 border border-white/10 space-y-5 backdrop-blur-xl shadow-xl">
                  <h3 className="font-bold text-base text-white flex items-center gap-2">
                    <Globe className="w-4 h-4 text-cyan-400" />
                    <span>Live Landing Page Content Controls</span>
                  </h3>

                  <div className="space-y-4 text-xs">
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1.5">
                        Announcement Banner Text
                      </label>
                      <input
                        type="text"
                        value={settings.announcementText}
                        onChange={(e) => setSettings({ ...settings, announcementText: e.target.value })}
                        className="w-full rounded-xl bg-slate-950 p-3 text-white border border-white/10 focus:border-cyan-500/40 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 font-semibold mb-1.5">
                        Main Hero Title
                      </label>
                      <input
                        type="text"
                        value={settings.heroTitle}
                        onChange={(e) => setSettings({ ...settings, heroTitle: e.target.value })}
                        className="w-full rounded-xl bg-slate-950 p-3 text-white border border-white/10 focus:border-cyan-500/40 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 font-semibold mb-1.5">
                        Hero Subtitle Copy
                      </label>
                      <textarea
                        rows={3}
                        value={settings.heroSubtitle}
                        onChange={(e) => setSettings({ ...settings, heroSubtitle: e.target.value })}
                        className="w-full rounded-xl bg-slate-950 p-3 text-white border border-white/10 focus:border-cyan-500/40 focus:outline-none resize-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-6 rounded-3xl bg-slate-900/70 border border-white/10 space-y-4 backdrop-blur-xl shadow-xl">
                  <h3 className="font-bold text-base text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-cyan-400" />
                    <span>Module Visibility Toggles</span>
                  </h3>

                  <div className="space-y-3 text-xs">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.enablePublicNotarizations}
                        onChange={(e) =>
                          setSettings({ ...settings, enablePublicNotarizations: e.target.checked })
                        }
                        className="w-4 h-4 rounded text-cyan-500 focus:ring-0 bg-slate-950 border-white/10"
                      />
                      <span className="text-slate-300 font-medium">
                        Enable Public Notarization Ledger (Live on-chain feed)
                      </span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.enableEscrowModule}
                        onChange={(e) =>
                          setSettings({ ...settings, enableEscrowModule: e.target.checked })
                        }
                        className="w-4 h-4 rounded text-cyan-500 focus:ring-0 bg-slate-950 border-white/10"
                      />
                      <span className="text-slate-300 font-medium">
                        Enable Web3 Smart Contract Escrow Milestone Module
                      </span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.enableContractorHiring}
                        onChange={(e) =>
                          setSettings({ ...settings, enableContractorHiring: e.target.checked })
                        }
                        className="w-4 h-4 rounded text-cyan-500 focus:ring-0 bg-slate-950 border-white/10"
                      />
                      <span className="text-slate-300 font-medium">
                        Enable Verified Contractors Directory & Escrow Hiring
                      </span>
                    </label>
                  </div>
                </div>
              </form>
            )}

            {/* TAB 2: TREASURY & REVENUE */}
            {activeTab === "treasury" && (
              <form onSubmit={handleSave} className="space-y-6 animate-in fade-in">
                <div className="p-6 rounded-3xl bg-slate-900/70 border border-white/10 space-y-6 backdrop-blur-xl shadow-xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
                    <div>
                      <h3 className="font-bold text-base text-white flex items-center gap-2">
                        <Coins className="w-4 h-4 text-amber-400" />
                        <span>Platform Protocol Treasury & Revenue (1% Fee Routing)</span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">
                        Configure your platform treasury address to automatically receive micro-fees on every on-chain legal escrow milestone payout.
                      </p>
                    </div>
                    <div className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-mono font-semibold shrink-0">
                      Current Fee: {settings.protocolFeePercentage}%
                    </div>
                  </div>

                  <div className="space-y-5 text-xs">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-slate-400 font-semibold">
                          Platform Owner Treasury Address (Payout Recipient)
                        </label>
                        {account && (
                          <button
                            type="button"
                            onClick={() =>
                              setSettings({
                                ...settings,
                                ownerTreasuryAddress: account,
                              })
                            }
                            className="text-cyan-400 hover:underline text-[11px] font-mono flex items-center gap-1"
                          >
                            <Wallet className="w-3 h-3" />
                            <span>Use Connected Wallet ({account.slice(0, 6)}...{account.slice(-4)})</span>
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        value={settings.ownerTreasuryAddress}
                        onChange={(e) =>
                          setSettings({ ...settings, ownerTreasuryAddress: e.target.value })
                        }
                        placeholder="0x..."
                        className="w-full rounded-xl bg-slate-950 p-3 font-mono text-cyan-300 border border-white/10 focus:border-amber-500/40 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <div>
                        <label className="block text-slate-400 font-semibold mb-1.5">
                          Protocol Fee Rate (%)
                        </label>
                        <div className="flex items-center gap-3">
                          <input
                            type="range"
                            min="0"
                            max="5"
                            step="0.1"
                            value={settings.protocolFeePercentage}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                protocolFeePercentage: parseFloat(e.target.value) || 0,
                              })
                            }
                            className="flex-1 accent-amber-400"
                          />
                          <span className="font-mono text-amber-300 font-bold w-12 text-right">
                            {settings.protocolFeePercentage}%
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-slate-400 font-semibold mb-1.5">
                          Enable Protocol Fee Collection
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer pt-2">
                          <input
                            type="checkbox"
                            checked={settings.enableProtocolFee}
                            onChange={(e) =>
                              setSettings({ ...settings, enableProtocolFee: e.target.checked })
                            }
                            className="w-4 h-4 rounded text-amber-500 focus:ring-0 bg-slate-950 border-white/10"
                          />
                          <span className="text-slate-300 font-medium">
                            Automatically deduct {settings.protocolFeePercentage}% fee on releases
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            )}

            {/* TAB 3: CREDITS & PAYWALL */}
            {activeTab === "credits" && (
              <form onSubmit={handleSave} className="space-y-6 animate-in fade-in">
                <div className="p-6 rounded-3xl bg-slate-900/70 border border-white/10 space-y-6 backdrop-blur-xl shadow-xl">
                  <div>
                    <h3 className="font-bold text-base text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-400" />
                      <span>AI Legal Audit Credits & Top-Up Pricing Engine</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Configure paywall enforcement, free trial quotas, bundle ETH prices, and inspect on-chain purchases.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">Credit Paywall Enforcement</span>
                        <span
                          className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                            settings.enableCreditPaywall
                              ? "bg-purple-500/10 text-purple-300 border-purple-500/20"
                              : "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                          }`}
                        >
                          {settings.enableCreditPaywall ? "Active (Paywall On)" : "Free Demo Mode"}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        When disabled, hackathon judges receive free credits to experience unlimited instant AI audits.
                      </p>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.enableCreditPaywall}
                        onChange={(e) =>
                          setSettings({ ...settings, enableCreditPaywall: e.target.checked })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 space-y-2">
                      <label className="text-slate-400 font-semibold">Starter (5 Audits)</label>
                      <input
                        type="text"
                        value={settings.starterPackPriceEth}
                        onChange={(e) =>
                          setSettings({ ...settings, starterPackPriceEth: e.target.value })
                        }
                        className="w-full rounded-xl bg-slate-900 p-2.5 font-mono text-white border border-white/10"
                      />
                      <span className="text-[10px] text-slate-500">ETH on Base Sepolia</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 space-y-2">
                      <label className="text-slate-400 font-semibold">Pro (15 Audits)</label>
                      <input
                        type="text"
                        value={settings.proPackPriceEth}
                        onChange={(e) =>
                          setSettings({ ...settings, proPackPriceEth: e.target.value })
                        }
                        className="w-full rounded-xl bg-slate-900 p-2.5 font-mono text-white border border-white/10"
                      />
                      <span className="text-[10px] text-slate-500">ETH on Base Sepolia</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 space-y-2">
                      <label className="text-slate-400 font-semibold">Agency (50 Audits)</label>
                      <input
                        type="text"
                        value={settings.agencyPackPriceEth}
                        onChange={(e) =>
                          setSettings({ ...settings, agencyPackPriceEth: e.target.value })
                        }
                        className="w-full rounded-xl bg-slate-900 p-2.5 font-mono text-white border border-white/10"
                      />
                      <span className="text-[10px] text-slate-500">ETH on Base Sepolia</span>
                    </div>
                  </div>
                </div>
              </form>
            )}

            {/* TAB 4: CONTRACTORS */}
            {activeTab === "contractors" && (
              <div className="p-6 rounded-3xl bg-slate-900/70 border border-white/10 space-y-4 backdrop-blur-xl shadow-xl animate-in fade-in">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-base text-white">Verified Contractor Directory</h3>
                    <p className="text-xs text-slate-400">Legal tech specialists and smart contract developers available for escrow hiring</p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-slate-800 text-xs font-semibold text-slate-300">
                    {contractorsList.length} Active Profiles
                  </span>
                </div>

                <div className="rounded-2xl border border-white/10 overflow-hidden">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-white/10">
                      <tr>
                        <th className="py-3 px-4">Contractor</th>
                        <th className="py-3 px-4">Role & Studio</th>
                        <th className="py-3 px-4">Payout Address</th>
                        <th className="py-3 px-4">Rate (ETH)</th>
                        <th className="py-3 px-4">Trust Score</th>
                        <th className="py-3 px-4 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {contractorsList.map((c) => (
                        <tr key={c.walletAddress} className="hover:bg-white/[0.02]">
                          <td className="py-3 px-4 font-bold text-white">{c.fullName}</td>
                          <td className="py-3 px-4 text-slate-300">{c.roleTitle}</td>
                          <td className="py-3 px-4 font-mono text-cyan-300">{c.walletAddress.slice(0, 6)}...{c.walletAddress.slice(-4)}</td>
                          <td className="py-3 px-4 font-mono text-amber-300">{c.hourlyRateEth} ETH</td>
                          <td className="py-3 px-4 text-emerald-400 font-bold">{c.reputationScore}%</td>
                          <td className="py-3 px-4 text-right">
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              Verified
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 5: API KEYS & ENGINE */}
            {activeTab === "keys" && (
              <form onSubmit={handleSave} className="space-y-6 animate-in fade-in">
                <div className="p-6 rounded-3xl bg-slate-900/70 border border-white/10 space-y-5 backdrop-blur-xl shadow-xl">
                  <div>
                    <h3 className="font-bold text-base text-white flex items-center gap-2">
                      <Key className="w-4 h-4 text-purple-400" />
                      <span>AI Model Engine & API Key Configuration</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Provide API keys for Google Gemini 1.5 or OpenAI GPT-4o to dynamically audit legal agreements live.
                    </p>
                  </div>

                  <div className="space-y-4 text-xs">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-slate-400 font-semibold">
                          Google Gemini API Key (or OpenAI sk- Key)
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowKey(!showKey)}
                          className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1"
                        >
                          {showKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          <span>{showKey ? "Hide" : "Show"}</span>
                        </button>
                      </div>
                      <input
                        type={showKey ? "text" : "password"}
                        value={settings.geminiApiKey || ""}
                        onChange={(e) => setSettings({ ...settings, geminiApiKey: e.target.value })}
                        placeholder="AIzaSy... or sk-..."
                        className="w-full rounded-xl bg-slate-950 p-3 text-white font-mono border border-white/10 focus:border-cyan-500/40 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 font-semibold mb-1.5">
                        Base Sepolia EVM RPC Endpoint
                      </label>
                      <input
                        type="text"
                        value={settings.customRpcUrl || "https://sepolia.base.org"}
                        onChange={(e) => setSettings({ ...settings, customRpcUrl: e.target.value })}
                        className="w-full rounded-xl bg-slate-950 p-3 text-white font-mono border border-white/10 focus:border-cyan-500/40 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </form>
            )}

            {/* TAB 6: DOCUMENT LEDGER */}
            {activeTab === "docs" && (
              <div className="p-6 rounded-3xl bg-slate-900/70 border border-white/10 space-y-4 backdrop-blur-xl shadow-xl animate-in fade-in">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-base text-white">On-Chain Notarization Document Ledger</h3>
                    <p className="text-xs text-slate-400">Tamper-proof smart contract legal existence proofs recorded on EVM</p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-slate-800 text-xs font-semibold text-slate-300">
                    {contracts.length} Items Total
                  </span>
                </div>

                <div className="rounded-2xl border border-white/10 overflow-hidden">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-white/10">
                      <tr>
                        <th className="py-3 px-4">Title</th>
                        <th className="py-3 px-4">Score</th>
                        <th className="py-3 px-4">Document Hash</th>
                        <th className="py-3 px-4">Network</th>
                        <th className="py-3 px-4">Transaction</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {contracts.map((doc) => (
                        <tr key={doc.id} className="hover:bg-white/[0.02]">
                          <td className="py-3 px-4 font-semibold text-white">{doc.title}</td>
                          <td className="py-3 px-4 font-bold text-cyan-400">{doc.overallScore}%</td>
                          <td className="py-3 px-4 font-mono text-slate-400 max-w-[120px] truncate">{doc.docHash}</td>
                          <td className="py-3 px-4 text-slate-400">{doc.network}</td>
                          <td className="py-3 px-4 font-mono text-cyan-300 max-w-[120px] truncate">{doc.txHash}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 7: SECURITY & ADMIN ROLES (NEW REQUESTED FEATURE!) */}
            {activeTab === "security" && (
              <div className="space-y-6 animate-in fade-in">
                
                {/* 1. Public Admin Self-Registration Switch */}
                <div className="p-6 rounded-3xl bg-slate-900/70 border border-white/10 space-y-4 backdrop-blur-xl shadow-xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                    <div>
                      <h3 className="font-bold text-base text-white flex items-center gap-2">
                        <Shield className="w-4 h-4 text-purple-400" />
                        <span>Public Admin Self-Registration Lock</span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">
                        Control whether new administrators can create accounts from the login screen or if signups are restricted.
                      </p>
                    </div>

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${
                        securityConfig.allowAdminRegistration
                          ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                          : "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                      }`}
                    >
                      {securityConfig.allowAdminRegistration ? "🔓 Signups OPEN (Initial Setup)" : "🔒 Signups LOCKED (Secure)"}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-950/80 border border-white/10">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-white">
                        Allow Public Administrator Account Creation
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {securityConfig.allowAdminRegistration
                          ? "Anyone visiting the /admin portal can register as an admin. Turn this OFF once your initial setup is complete."
                          : "Public registration is currently disabled. Only logged-in Super Admins can add or invite new administrators below."}
                      </p>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleToggleRegistration(!securityConfig.allowAdminRegistration)}
                        disabled={isSavingSecurity}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                          securityConfig.allowAdminRegistration
                            ? "bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40"
                            : "bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40"
                        }`}
                      >
                        {isSavingSecurity ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : securityConfig.allowAdminRegistration ? (
                          "Disable Public Registration"
                        ) : (
                          "Enable Public Registration"
                        )}
                      </button>
                    </div>
                  </div>

                  {securitySuccess && (
                    <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Security settings saved successfully to Firestore!</span>
                    </div>
                  )}
                </div>

                {/* 2. Registered Administrator Accounts */}
                <div className="p-6 rounded-3xl bg-slate-900/70 border border-white/10 space-y-4 backdrop-blur-xl shadow-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-base text-white flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-cyan-400" />
                        <span>Registered Platform Administrators ({adminAccounts.length})</span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Active roles authorized to access the system administration hub
                      </p>
                    </div>

                    <button
                      onClick={() => setShowAddAdminModal(true)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-black transition-all shadow-md shadow-cyan-500/20"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Add Administrator</span>
                    </button>
                  </div>

                  <div className="rounded-2xl border border-white/10 overflow-hidden">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-white/10">
                        <tr>
                          <th className="py-3 px-4">Admin Name</th>
                          <th className="py-3 px-4">Username</th>
                          <th className="py-3 px-4">Email</th>
                          <th className="py-3 px-4">Role</th>
                          <th className="py-3 px-4">Created Date</th>
                          <th className="py-3 px-4 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {adminAccounts.map((admin) => (
                          <tr key={admin.id} className="hover:bg-white/[0.02]">
                            <td className="py-3 px-4 font-bold text-white">
                              {admin.displayName}
                              {admin.id === activeAdmin.id && (
                                <span className="ml-2 text-[10px] text-cyan-400 font-normal">(You)</span>
                              )}
                            </td>
                            <td className="py-3 px-4 font-mono text-slate-300">@{admin.username}</td>
                            <td className="py-3 px-4 text-slate-400">{admin.email}</td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                  admin.role === "super_admin"
                                    ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                                    : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                                }`}
                              >
                                {admin.role.replace("_", " ")}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-400 text-[11px]">
                              {new Date(admin.createdAt).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                Active
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}

            {/* TAB 8: HEALTH DIAGNOSTICS */}
            {activeTab === "health" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in">
                <div className="p-6 rounded-3xl bg-slate-900/70 border border-white/10 space-y-4 backdrop-blur-xl shadow-xl">
                  <h3 className="font-bold text-base text-white flex items-center gap-2">
                    <Database className="w-4 h-4 text-emerald-400" />
                    <span>Firebase Backend Status</span>
                  </h3>
                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-white/5">
                      <span className="text-slate-400">Project ID</span>
                      <span className="font-mono text-white font-semibold">web-b61f1</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-white/5">
                      <span className="text-slate-400">Connection State</span>
                      <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Connected & Initialized
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-white/5">
                      <span className="text-slate-400">Namespace Safety</span>
                      <span className="text-cyan-300 font-semibold">lexiguard_* (Isolated)</span>
                    </div>
                  </div>
                </div>

                <div className="p-6 rounded-3xl bg-slate-900/70 border border-white/10 space-y-4 backdrop-blur-xl shadow-xl">
                  <h3 className="font-bold text-base text-white flex items-center gap-2">
                    <Server className="w-4 h-4 text-cyan-400" />
                    <span>Smart Contract & Web3 Status</span>
                  </h3>
                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-white/5">
                      <span className="text-slate-400">Smart Contract</span>
                      <span className="font-mono text-cyan-300 font-semibold">LexiGuardNotary.sol</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-white/5">
                      <span className="text-slate-400">Solidity Version</span>
                      <span className="text-slate-200 font-semibold">0.8.20 (EVM London/Cancun)</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-white/5">
                      <span className="text-slate-400">Base Sepolia Chain ID</span>
                      <span className="font-mono text-emerald-400 font-semibold">84532</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

      </main>

      <Footer />

      {/* MODAL: ADD NEW ADMINISTRATOR */}
      {showAddAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-cyan-400" />
                <h3 className="font-bold text-sm text-white">Add New Administrator</h3>
              </div>
              <button
                onClick={() => setShowAddAdminModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {addAdminError && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
                {addAdminError}
              </div>
            )}

            <form onSubmit={handleCreateNewAdmin} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newAdminName}
                  onChange={(e) => setNewAdminName(e.target.value)}
                  placeholder="e.g. Legal Operations Officer"
                  className="w-full bg-slate-950 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Username</label>
                  <input
                    type="text"
                    required
                    value={newAdminUser}
                    onChange={(e) => setNewAdminUser(e.target.value)}
                    placeholder="legal_ops"
                    className="w-full bg-slate-950 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Role</label>
                  <select
                    value={newAdminRole}
                    onChange={(e) => setNewAdminRole(e.target.value as any)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option value="admin">Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  placeholder="ops@lexiguard.ai"
                  className="w-full bg-slate-950 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={newAdminPass}
                  onChange={(e) => setNewAdminPass(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full bg-slate-950 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddAdminModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAddingAdmin}
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold flex items-center gap-1.5"
                >
                  {isAddingAdmin ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <UserPlus className="w-3.5 h-3.5" />
                  )}
                  <span>Create Administrator</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
