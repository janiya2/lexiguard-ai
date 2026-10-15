"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
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
  Check,
  X,
  ExternalLink,
  Copy,
  LayoutDashboard,
  BarChart3,
  Activity,
  Cpu,
  Compass,
  BookOpen,
  Scale,
  Image as ImageIcon,
  Plus,
  Trash2,
  Terminal,
  Award,
  ArrowUp
} from "lucide-react";
import {
  getSiteSettings,
  saveSiteSettings,
  getNotarizedContracts,
  getContractorProfiles,
  saveContractorProfile,
  getCreditPurchases,
  CreditPurchase,
  ContractorProfile,
  PricingTier,
  MilestoneTierConfig,
  DEFAULT_MILESTONE_TIERS,
  DEFAULT_CONTRACTORS,
  SiteSettings,
  DEFAULT_SITE_SETTINGS,
  DEFAULT_HERO_CONFIG,
  HeroSectionConfig,
  DEFAULT_SECTION2_CONFIG,
  Section2Config,
  DEFAULT_SECTION3_CONFIG,
  Section3Config,
  DEFAULT_SECTION4_CONFIG,
  Section4Config,
  DEFAULT_SECTION5_CONFIG,
  Section5Config,
  DEFAULT_SECTION6_CONFIG,
  Section6Config,
  DEFAULT_SECTION7_CONFIG,
  Section7Config,
  Section7FaqItem,
  DEFAULT_SECTION8_CONFIG,
  Section8Config,
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
    "dashboard" | "cms" | "treasury" | "credits" | "contractors" | "keys" | "relayer" | "docs" | "security" | "health"
  >("dashboard");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [contracts, setContracts] = useState<any[]>([]);
  const [contractorsList, setContractorsList] = useState<ContractorProfile[]>(DEFAULT_CONTRACTORS);
  const [creditPurchases, setCreditPurchases] = useState<CreditPurchase[]>([]);

  // Contractor & Milestone Rates Management Studio State
  const [contractorSubTab, setContractorSubTab] = useState<"tiers" | "milestones" | "directory" | "bulk">("tiers");
  const [selectedContractorWallet, setSelectedContractorWallet] = useState<string>(
    DEFAULT_CONTRACTORS[0]?.walletAddress || ""
  );
  const [editingContractor, setEditingContractor] = useState<ContractorProfile | null>(null);
  const [isSavingContractor, setIsSavingContractor] = useState(false);
  const [contractorSaveSuccess, setContractorSaveSuccess] = useState(false);
  const [isSavingMilestones, setIsSavingMilestones] = useState(false);
  const [milestonesSaveSuccess, setMilestonesSaveSuccess] = useState(false);

  // Web3 Relayer Engine State
  const [relayerStatus, setRelayerStatus] = useState<{
    configured: boolean;
    address: string | null;
    balanceEth: string;
    hasFunds: boolean;
    error?: string;
  } | null>(null);
  const [isCheckingRelayer, setIsCheckingRelayer] = useState(false);
  const [showRelayerKey, setShowRelayerKey] = useState(false);
  const [testRelayerLoading, setTestRelayerLoading] = useState(false);
  const [relayerKeyCopied, setRelayerKeyCopied] = useState(false);
  const [testRelayerResult, setTestRelayerResult] = useState<{
    success: boolean;
    txHash?: string;
    blockNumber?: number;
    explorerUrl?: string;
    error?: string;
  } | null>(null);

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

  const checkRelayerLive = async () => {
    setIsCheckingRelayer(true);
    try {
      const res = await fetch("/api/relayer");
      if (res.ok) {
        const data = await res.json();
        setRelayerStatus(data);
      }
    } catch (e) {
      console.warn("Relayer check:", e);
    } finally {
      setIsCheckingRelayer(false);
    }
  };

  const handleTestRelayerPing = async () => {
    setTestRelayerLoading(true);
    setTestRelayerResult(null);
    try {
      const res = await fetch("/api/relayer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "test",
          docTitle: "LexiGuard Admin Live Relayer Verification Ping",
          rawPrivateKey: settings.relayerPrivateKey,
        }),
      });
      const data = await res.json();
      setTestRelayerResult(data);
      if (data.success) {
        checkRelayerLive();
      }
    } catch (err: any) {
      setTestRelayerResult({ success: false, error: err.message });
    } finally {
      setTestRelayerLoading(false);
    }
  };

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

  // Auto-sync editing contractor profile when selected or list updates
  useEffect(() => {
    if (contractorsList.length > 0) {
      const found = contractorsList.find(
        (c) => c.walletAddress.toLowerCase() === selectedContractorWallet.toLowerCase()
      ) || contractorsList[0];

      if (found) {
        const baseHourly = found.hourlyRateEth || "0.00010";
        const existingTiers = found.pricingTiers || [];
        const t1: PricingTier = existingTiers.find((t) => t.tierId === "level_1") || {
          tierId: "level_1",
          title: "Level 1: Express AI Clause Audit",
          priceEth: baseHourly,
          turnaround: "24 Hours",
          scopeSummary: "Rapid smart contract clause review, vulnerability identification, and compliance verification report.",
        };
        const t2: PricingTier = existingTiers.find((t) => t.tierId === "level_2") || {
          tierId: "level_2",
          title: "Level 2: Comprehensive Architecture & Security",
          priceEth: (parseFloat(baseHourly) * 2.5).toFixed(5),
          turnaround: "3 Days",
          scopeSummary: "Full-stack EVM architecture review, escrow state machine verification, and custom legal contract synthesizer.",
        };
        const t3: PricingTier = existingTiers.find((t) => t.tierId === "level_3") || {
          tierId: "level_3",
          title: "Level 3: Full Protocol & ZK Settlement Seal",
          priceEth: (parseFloat(baseHourly) * 5).toFixed(5),
          turnaround: "7 Days",
          scopeSummary: "End-to-end zero-knowledge verifier integration, formal mathematical proofs, and notarized on-chain certification.",
        };

        setEditingContractor({
          ...found,
          hourlyRateEth: baseHourly,
          pricingTiers: [t1, t2, t3],
        });
      }
    }
  }, [selectedContractorWallet, contractorsList]);

  const handleSaveContractorRates = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editingContractor) return;
    setIsSavingContractor(true);
    setContractorSaveSuccess(false);

    try {
      const ok = await saveContractorProfile(editingContractor);
      if (ok) {
        setContractorSaveSuccess(true);
        // Refresh local list
        const updatedList = contractorsList.map((c) =>
          c.walletAddress.toLowerCase() === editingContractor.walletAddress.toLowerCase()
            ? editingContractor
            : c
        );
        setContractorsList(updatedList);
        setTimeout(() => setContractorSaveSuccess(false), 3500);
      }
    } catch (err) {
      console.error("Error saving contractor rates:", err);
    } finally {
      setIsSavingContractor(false);
    }
  };

  const handleSaveMilestonesConfig = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSavingMilestones(true);
    setMilestonesSaveSuccess(false);

    try {
      const ok = await saveSiteSettings({
        milestoneTiers: settings.milestoneTiers,
        defaultMilestoneBaseRateEth: settings.defaultMilestoneBaseRateEth,
      });
      if (ok) {
        setMilestonesSaveSuccess(true);
        setTimeout(() => setMilestonesSaveSuccess(false), 3500);
      }
    } catch (err) {
      console.error("Error saving milestone settings:", err);
    } finally {
      setIsSavingMilestones(false);
    }
  };

  const handleBulkRateAdjustment = async (percentChange: number) => {
    const isIncrease = percentChange > 0;
    if (!confirm(`Apply ${isIncrease ? "+" : ""}${percentChange}% calibration to all verified contractors' milestone rates?`)) return;
    setIsSavingContractor(true);
    try {
      const factor = 1 + percentChange / 100;
      const updatedAll = await Promise.all(
        contractorsList.map(async (c) => {
          const newHourly = (parseFloat(c.hourlyRateEth || "0.00010") * factor).toFixed(5);
          const updatedTiers = (c.pricingTiers || []).map((t) => ({
            ...t,
            priceEth: (parseFloat(t.priceEth) * factor).toFixed(5),
          }));
          const updated: ContractorProfile = {
            ...c,
            hourlyRateEth: newHourly,
            pricingTiers: updatedTiers,
          };
          await saveContractorProfile(updated);
          return updated;
        })
      );
      setContractorsList(updatedAll);
      setContractorSaveSuccess(true);
      setTimeout(() => setContractorSaveSuccess(false), 3500);
    } catch (err) {
      console.error("Bulk rate error:", err);
    } finally {
      setIsSavingContractor(false);
    }
  };

  const handleResetContractorToDefaults = () => {
    if (!editingContractor) return;
    const def = DEFAULT_CONTRACTORS.find(
      (d) => d.walletAddress.toLowerCase() === editingContractor.walletAddress.toLowerCase()
    );
    if (def) {
      setEditingContractor({ ...def });
    }
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
        <header className="w-full border-b border-white/10 bg-[#040711]/90 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <Link href="/admin" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 via-cyan-500 to-blue-500 p-[1.5px] shadow-lg shadow-purple-500/20">
                <div className="w-full h-full bg-[#040711] rounded-[10px] flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-cyan-400" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-black text-sm text-white tracking-tight">LexiGuard<span className="text-cyan-400">.AI</span></span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Admin Console
                </span>
              </div>
            </Link>
          </div>
        </header>
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

  // 2. Unauthenticated State — Render Secure Admin Login Screen with Dedicated Admin Bar
  if (!activeAdmin) {
    return (
      <div className="flex flex-col min-h-screen bg-[#040711] text-slate-100">
        <header className="w-full border-b border-white/10 bg-[#040711]/90 backdrop-blur-xl sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <Link href="/admin" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 via-cyan-500 to-blue-500 p-[1.5px] shadow-lg shadow-purple-500/20">
                <div className="w-full h-full bg-[#040711] rounded-[10px] flex items-center justify-center">
                  <Lock className="w-5 h-5 text-cyan-400" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-sm text-white tracking-tight">LexiGuard<span className="text-cyan-400">.AI</span></span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    Secure Admin Gateway
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 leading-none">Restricted Governance Portal • BLI Hackathon 2</p>
              </div>
            </Link>
            <Link
              href="/"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 border border-white/10 hover:border-cyan-500/40 text-slate-300 hover:text-white transition-all"
            >
              <ArrowUpRight className="w-3.5 h-3.5 text-cyan-400" />
              <span>Back to Public App</span>
            </Link>
          </div>
        </header>
        <AdminLoginScreen onLoginSuccess={handleLoginSuccess} />
        <Footer />
      </div>
    );
  }

  // 3. Authenticated State — Render Full Admin Dashboard with Dedicated Admin Header
  return (
    <div className="flex flex-col min-h-screen bg-[#040711] text-slate-100 overflow-x-clip">
      
      {/* EXCLUSIVE DEDICATED ADMIN HEADER (Replaces Consumer User Navigation) */}
      <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#040711]/95 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Left: Brand & Portal Badge */}
          <div className="flex items-center gap-3">
            <Link href="/admin" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 via-cyan-500 to-blue-500 p-[1.5px] shadow-lg shadow-purple-500/20 group-hover:scale-105 transition-transform">
                <div className="w-full h-full bg-[#040711] rounded-[10px] flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-cyan-400" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-sm text-white tracking-tight">
                    LexiGuard<span className="text-cyan-400">.AI</span>
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    Admin Command
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 leading-none">
                  BLI Hackathon 2 • Governance Console
                </p>
              </div>
            </Link>

            {/* Live Status Indicators */}
            <div className="hidden lg:flex items-center gap-2 pl-4 border-l border-white/10 text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-white/5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Base Sepolia</span>
                <span className="font-mono text-cyan-300 text-[10px]">#84532</span>
              </span>
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-white/5">
                <Database className="w-3 h-3 text-cyan-400" />
                <span>Sync: <strong className="text-slate-200">web-b61f1</strong></span>
              </span>
            </div>
          </div>

          {/* Right: Active Session, Jump to Public App, and Logout */}
          <div className="flex items-center gap-2.5">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-white/10 text-xs">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-white text-[10px] font-black">
                {activeAdmin.displayName.charAt(0).toUpperCase()}
              </div>
              <div className="text-left">
                <p className="text-[11px] font-bold text-white leading-tight">{activeAdmin.displayName}</p>
                <p className="text-[9px] text-purple-300 font-mono leading-none capitalize">{activeAdmin.role.replace('_', ' ')}</p>
              </div>
            </div>

            <Link
              href="/"
              target="_blank"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 border border-white/10 hover:border-cyan-500/40 text-slate-300 hover:text-white transition-all shadow-sm"
              title="Open Public User App in New Tab"
            >
              <ArrowUpRight className="w-3.5 h-3.5 text-cyan-400" />
              <span>User App</span>
            </Link>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition-all"
              title="Sign Out of Admin Console"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>

        </div>
      </header>

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
          <aside className="lg:col-span-3 space-y-4">
            
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
                onClick={() => setActiveTab("dashboard")}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                  activeTab === "dashboard"
                    ? "bg-gradient-to-r from-purple-500 via-cyan-500 to-blue-500 text-white shadow-md shadow-purple-500/20"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Overview & Stats</span>
                </div>
                <span className="text-[9px] px-1.5 py-0.5 rounded font-black uppercase bg-white/20 text-white">
                  Hub
                </span>
              </button>

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
                  <span>Milestones & Rates</span>
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

              {/* AUTONOMOUS WEB3 RELAYER */}
              <button
                onClick={() => {
                  setActiveTab("relayer");
                  checkRelayerLive();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                  activeTab === "relayer"
                    ? "bg-gradient-to-r from-amber-500 to-orange-500 text-black shadow-md shadow-orange-500/20"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>Web3 Relayer & Faucet</span>
                </div>
                <span className="text-[9px] px-1.5 py-0.5 rounded font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Live EVM
                </span>
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

            {/* TAB 0: EXECUTIVE DASHBOARD & SYSTEM ARCHITECTURE INTRO */}
            {activeTab === "dashboard" && (
              <div className="space-y-6 animate-in fade-in">
                
                {/* 1. Protocol Architecture & Executive Intro Banner */}
                <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900/95 via-purple-950/20 to-slate-900/95 border border-white/10 backdrop-blur-xl shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
                  <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

                  <div className="relative z-10 space-y-5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-purple-400" />
                        Executive Protocol Command
                      </span>
                      <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                        Blockchain Legal Institute (BLI) Hackathon 2
                      </span>
                      <span className="px-3 py-1 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Base Sepolia Layer-2 Verified
                      </span>
                    </div>

                    <div className="space-y-2 max-w-3xl">
                      <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight">
                        LexiGuard.AI Protocol Architecture & Operational Command
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                        LexiGuard AI combines multi-modal legal AI reasoning with immutable EVM smart contracts on Base Sepolia. The system empowers global builders, freelancers, and enterprises to evaluate contract liabilities, notarize cryptographic proofs of existence, and execute milestone escrow payments with guaranteed reciprocity.
                      </p>
                    </div>

                    {/* Executive Protocol & Administrative Control Briefing */}
                    <div className="p-4 rounded-2xl bg-slate-950/70 border border-cyan-500/20 space-y-2 text-xs">
                      <div className="flex items-center gap-2 text-cyan-300 font-bold">
                        <BookOpen className="w-4 h-4 text-cyan-400" />
                        <span>BLI Protocol Architecture & Administrative Control Guide</span>
                      </div>
                      <p className="text-slate-300 leading-relaxed text-[11px]">
                        LexiGuard AI is engineered to minimize legal disputes by detecting asymmetric contract liabilities (unilateral indemnification, unfair payment holdbacks, termination traps) via Gemini 2.5 Flash heuristics before signing. Mutually agreed states are anchored onto the Base Sepolia blockchain as cryptographic SHA-256 and keccak256 proof-of-existence roots under Delaware DGCL § 224 and FRE Rule 902 standards. This Admin Control Hub provides full operational sovereignty over CMS configurations, non-custodial 1% treasury sweeps, and autonomous gasless EIP-2771 relayers.
                      </p>
                    </div>

                    {/* The 6 Interconnected Architectural Pillars */}
                    <div className="pt-2">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                        <Layers className="w-3.5 h-3.5 text-cyan-400" />
                        The 6 Interconnected Protocol Pillars
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        
                        <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/5 hover:border-cyan-500/30 transition-all space-y-1.5">
                          <div className="flex items-center gap-2 text-cyan-300 font-bold text-xs">
                            <Sparkles className="w-4 h-4 text-cyan-400" />
                            <span>1. Multi-Modal AI Auditor</span>
                          </div>
                          <p className="text-[11px] text-slate-400 leading-relaxed">
                            Google Gemini 2.5 Multi-Modal engine parses PDFs, doc files, and images for termination traps, uncapped liabilities, and provides 0-100 scores.
                          </p>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/5 hover:border-purple-500/30 transition-all space-y-1.5">
                          <div className="flex items-center gap-2 text-purple-300 font-bold text-xs">
                            <Database className="w-4 h-4 text-purple-400" />
                            <span>2. Tamper-Proof Notary Vault</span>
                          </div>
                          <p className="text-[11px] text-slate-400 leading-relaxed">
                            SHA-256 contract fingerprinting anchored onto the LexiGuard Notary Smart Contract on Base Sepolia (<code className="text-purple-300 font-mono text-[10px]">0x036c...cf7e</code>).
                          </p>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/5 hover:border-amber-500/30 transition-all space-y-1.5">
                          <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                            <Lock className="w-4 h-4 text-amber-400" />
                            <span>3. Milestone Escrow Engine</span>
                          </div>
                          <p className="text-[11px] text-slate-400 leading-relaxed">
                            Trustless crypto escrow locking funds until deliverables are verified with bilateral dispute protection and automatic 1% treasury fee retention.
                          </p>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/5 hover:border-orange-500/30 transition-all space-y-1.5">
                          <div className="flex items-center gap-2 text-orange-300 font-bold text-xs">
                            <Zap className="w-4 h-4 text-orange-400" />
                            <span>4. Autonomous Web3 Relayer</span>
                          </div>
                          <p className="text-[11px] text-slate-400 leading-relaxed">
                            Backend gas sponsorship mechanism executing real on-chain transactions without MetaMask extension popups for guest users and hackathon judges.
                          </p>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/5 hover:border-emerald-500/30 transition-all space-y-1.5">
                          <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs">
                            <UserCheck className="w-4 h-4 text-emerald-400" />
                            <span>5. Verified Contractor Vault</span>
                          </div>
                          <p className="text-[11px] text-slate-400 leading-relaxed">
                            Curated directory of vetted Web3 & Legal tech contractors with on-chain reputation ratings, dispute mitigation history, and direct escrow hiring.
                          </p>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/5 hover:border-blue-500/30 transition-all space-y-1.5">
                          <div className="flex items-center gap-2 text-blue-300 font-bold text-xs">
                            <Coins className="w-4 h-4 text-blue-400" />
                            <span>6. Paywall & Monetization Hub</span>
                          </div>
                          <p className="text-[11px] text-slate-400 leading-relaxed">
                            Flexible session free audit quotas (default: {settings.freeAuditsAllowed}), on-chain credit packages, and protocol revenue capture.
                          </p>
                        </div>

                      </div>
                    </div>

                  </div>
                </div>

                {/* 2. All-in-One Live Protocol Statistics Grid */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-white flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-cyan-400" />
                      <span>Unified Protocol Pulse & Live KPI Metrics</span>
                    </h3>
                    <span className="text-[11px] text-slate-400">
                      Real-time sync across Firestore & Base Sepolia
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
                    
                    {/* Stat 1: Total Contracts Audited */}
                    <div className="p-4 rounded-2xl bg-slate-900/70 border border-white/10 hover:border-cyan-500/40 transition-all space-y-1 backdrop-blur-xl">
                      <div className="flex items-center justify-between text-slate-400 text-xs">
                        <span>Audited Contracts</span>
                        <FileText className="w-4 h-4 text-cyan-400" />
                      </div>
                      <p className="text-2xl font-black text-white font-mono">{contracts.length}</p>
                      <p className="text-[10px] text-cyan-300">
                        {contracts.length} active legal evaluations
                      </p>
                    </div>

                    {/* Stat 2: Base Sepolia Notarizations */}
                    <div className="p-4 rounded-2xl bg-slate-900/70 border border-white/10 hover:border-purple-500/40 transition-all space-y-1 backdrop-blur-xl">
                      <div className="flex items-center justify-between text-slate-400 text-xs">
                        <span>On-Chain Anchors</span>
                        <Database className="w-4 h-4 text-purple-400" />
                      </div>
                      <p className="text-2xl font-black text-purple-300 font-mono">
                        {contracts.filter((c) => c.txHash && c.txHash.startsWith("0x")).length}
                      </p>
                      <p className="text-[10px] text-purple-400">
                        Live Base Sepolia records
                      </p>
                    </div>

                    {/* Stat 3: Mean Compliance Score */}
                    <div className="p-4 rounded-2xl bg-slate-900/70 border border-white/10 hover:border-emerald-500/40 transition-all space-y-1 backdrop-blur-xl">
                      <div className="flex items-center justify-between text-slate-400 text-xs">
                        <span>Avg Compliance Score</span>
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      </div>
                      <p className="text-2xl font-black text-emerald-300 font-mono">
                        {contracts.length > 0
                          ? Math.round(
                              contracts.reduce(
                                (acc, c) => acc + (typeof c.score === "number" ? c.score : 75),
                                0
                              ) / contracts.length
                            )
                          : 78}
                        <span className="text-sm text-slate-400 font-normal">/100</span>
                      </p>
                      <p className="text-[10px] text-emerald-400">
                        Portfolio health rating
                      </p>
                    </div>

                    {/* Stat 4: Treasury Protocol Fee */}
                    <div className="p-4 rounded-2xl bg-slate-900/70 border border-white/10 hover:border-amber-500/40 transition-all space-y-1 backdrop-blur-xl">
                      <div className="flex items-center justify-between text-slate-400 text-xs">
                        <span>Protocol Fee (1%)</span>
                        <Coins className="w-4 h-4 text-amber-400" />
                      </div>
                      <p className="text-2xl font-black text-amber-300 font-mono">
                        {settings.protocolFeePercentage}%
                      </p>
                      <p className="text-[10px] text-amber-400">
                        Milestone escrow capture
                      </p>
                    </div>

                    {/* Stat 5: Verified Contractors */}
                    <div className="p-4 rounded-2xl bg-slate-900/70 border border-white/10 hover:border-emerald-500/40 transition-all space-y-1 backdrop-blur-xl">
                      <div className="flex items-center justify-between text-slate-400 text-xs">
                        <span>Verified Contractors</span>
                        <UserCheck className="w-4 h-4 text-emerald-400" />
                      </div>
                      <p className="text-2xl font-black text-white font-mono">
                        {contractorsList.length}
                      </p>
                      <p className="text-[10px] text-emerald-400">
                        Directory talent active
                      </p>
                    </div>

                    {/* Stat 6: Credit Purchases */}
                    <div className="p-4 rounded-2xl bg-slate-900/70 border border-white/10 hover:border-purple-500/40 transition-all space-y-1 backdrop-blur-xl">
                      <div className="flex items-center justify-between text-slate-400 text-xs">
                        <span>Credit Top-Ups</span>
                        <Sparkles className="w-4 h-4 text-purple-400" />
                      </div>
                      <p className="text-2xl font-black text-purple-300 font-mono">
                        {creditPurchases.length}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {creditPurchases.reduce((acc, p) => acc + (p.credits || 0), 0)} audits issued
                      </p>
                    </div>

                    {/* Stat 7: Relayer Balance */}
                    <div className="p-4 rounded-2xl bg-slate-900/70 border border-white/10 hover:border-orange-500/40 transition-all space-y-1 backdrop-blur-xl">
                      <div className="flex items-center justify-between text-slate-400 text-xs">
                        <span>Web3 Relayer Reserve</span>
                        <Zap className="w-4 h-4 text-orange-400" />
                      </div>
                      <p className="text-2xl font-black text-orange-300 font-mono truncate">
                        {relayerStatus?.balanceEth || "0.0000"} <span className="text-xs text-slate-400 font-normal">ETH</span>
                      </p>
                      <p className="text-[10px] text-orange-400">
                        ~{Math.floor(parseFloat(relayerStatus?.balanceEth || "0") / 0.000001)} live audits gas
                      </p>
                    </div>

                    {/* Stat 8: Active AI Model */}
                    <div className="p-4 rounded-2xl bg-slate-900/70 border border-white/10 hover:border-blue-500/40 transition-all space-y-1 backdrop-blur-xl">
                      <div className="flex items-center justify-between text-slate-400 text-xs">
                        <span>AI Legal Engine</span>
                        <Cpu className="w-4 h-4 text-blue-400" />
                      </div>
                      <p className="text-base font-black text-blue-300 font-mono truncate pt-1">
                        {settings.activeAiModel}
                      </p>
                      <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        API Operational
                      </p>
                    </div>

                  </div>
                </div>

                {/* 3. Quick Action Command Hub (1-Click Jumps) */}
                <div className="space-y-3">
                  <h3 className="font-bold text-sm text-white flex items-center gap-2">
                    <Compass className="w-4 h-4 text-purple-400" />
                    <span>Quick Administration Jump Center</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    
                    <button
                      onClick={() => setActiveTab("cms")}
                      className="p-4 rounded-2xl bg-slate-900/70 border border-white/5 hover:border-cyan-500/40 text-left transition-all group space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-white group-hover:text-cyan-300 flex items-center gap-2">
                          <Globe className="w-4 h-4 text-cyan-400" />
                          Landing Page CMS
                        </span>
                        <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 transition-transform group-hover:translate-x-0.5" />
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Customize announcement copy, hero titles, and toggle public feature modules.
                      </p>
                    </button>

                    <button
                      onClick={() => setActiveTab("treasury")}
                      className="p-4 rounded-2xl bg-slate-900/70 border border-white/5 hover:border-amber-500/40 text-left transition-all group space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-white group-hover:text-amber-300 flex items-center gap-2">
                          <Coins className="w-4 h-4 text-amber-400" />
                          Treasury & Fees (1%)
                        </span>
                        <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 transition-transform group-hover:translate-x-0.5" />
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Monitor 1% smart contract milestone escrow fees and protocol revenue sweeps.
                      </p>
                    </button>

                    <button
                      onClick={() => setActiveTab("credits")}
                      className="p-4 rounded-2xl bg-slate-900/70 border border-white/5 hover:border-purple-500/40 text-left transition-all group space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-white group-hover:text-purple-300 flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-purple-400" />
                          Credits & Paywall
                        </span>
                        <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-purple-400 transition-transform group-hover:translate-x-0.5" />
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Adjust free tier audit quotas (currently {settings.freeAuditsAllowed}) and credit purchase packages.
                      </p>
                    </button>

                    <button
                      onClick={() => setActiveTab("contractors")}
                      className="p-4 rounded-2xl bg-slate-900/70 border border-white/5 hover:border-emerald-500/40 text-left transition-all group space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-white group-hover:text-emerald-300 flex items-center gap-2">
                          <UserCheck className="w-4 h-4 text-emerald-400" />
                          Contractor Directory
                        </span>
                        <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 transition-transform group-hover:translate-x-0.5" />
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Vet contractor profiles, ratings, hourly rates, and toggle availability.
                      </p>
                    </button>

                    <button
                      onClick={() => setActiveTab("keys")}
                      className="p-4 rounded-2xl bg-slate-900/70 border border-white/5 hover:border-cyan-500/40 text-left transition-all group space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-white group-hover:text-cyan-300 flex items-center gap-2">
                          <Key className="w-4 h-4 text-cyan-400" />
                          AI Engine & Keys
                        </span>
                        <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 transition-transform group-hover:translate-x-0.5" />
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Update Google Gemini API keys and switch between Gemini 2.5 Flash and Pro.
                      </p>
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab("relayer");
                        checkRelayerLive();
                      }}
                      className="p-4 rounded-2xl bg-slate-900/70 border border-white/5 hover:border-orange-500/40 text-left transition-all group space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-white group-hover:text-orange-300 flex items-center gap-2">
                          <Zap className="w-4 h-4 text-orange-400" />
                          Web3 Relayer & Faucet
                        </span>
                        <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-orange-400 transition-transform group-hover:translate-x-0.5" />
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Fund autonomous relayer wallet with free testnet ETH and broadcast live transactions.
                      </p>
                    </button>

                    <button
                      onClick={() => setActiveTab("docs")}
                      className="p-4 rounded-2xl bg-slate-900/70 border border-white/5 hover:border-blue-500/40 text-left transition-all group space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-white group-hover:text-blue-300 flex items-center gap-2">
                          <Database className="w-4 h-4 text-blue-400" />
                          Document Ledger
                        </span>
                        <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-400 transition-transform group-hover:translate-x-0.5" />
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Inspect all {contracts.length} notarized agreement records, SHA-256 hashes, and BaseScan links.
                      </p>
                    </button>

                    <button
                      onClick={() => setActiveTab("security")}
                      className="p-4 rounded-2xl bg-slate-900/70 border border-white/5 hover:border-purple-500/40 text-left transition-all group space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-white group-hover:text-purple-300 flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-purple-400" />
                          Admin Roles & Security
                        </span>
                        <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-purple-400 transition-transform group-hover:translate-x-0.5" />
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Manage {adminAccounts.length} administrator credentials, role permissions, and brute-force rules.
                      </p>
                    </button>

                    <button
                      onClick={() => setActiveTab("health")}
                      className="p-4 rounded-2xl bg-slate-900/70 border border-white/5 hover:border-cyan-500/40 text-left transition-all group space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-white group-hover:text-cyan-300 flex items-center gap-2">
                          <Server className="w-4 h-4 text-cyan-400" />
                          System Health & RPC
                        </span>
                        <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 transition-transform group-hover:translate-x-0.5" />
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Real-time status of Base Sepolia RPC, Firebase Firestore, and Gemini latency.
                      </p>
                    </button>

                  </div>
                </div>

                {/* 4. Live Protocol Activity Feed / Recent Audits */}
                <div className="p-6 rounded-3xl bg-slate-900/70 border border-white/10 space-y-4 backdrop-blur-xl shadow-xl">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-white flex items-center gap-2">
                      <Activity className="w-4 h-4 text-emerald-400" />
                      <span>Recent Protocol Activity & Notarizations</span>
                    </h3>
                    <button
                      onClick={() => setActiveTab("docs")}
                      className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
                    >
                      <span>View Full Ledger ({contracts.length})</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-white/10 text-slate-400 font-semibold">
                          <th className="pb-3">Contract Agreement</th>
                          <th className="pb-3">Score</th>
                          <th className="pb-3">Network</th>
                          <th className="pb-3">Transaction / Hash</th>
                          <th className="pb-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {contracts.slice(0, 5).map((contract, i) => (
                          <tr key={contract.id || i} className="hover:bg-white/[0.02] transition-colors">
                            <td className="py-3 font-semibold text-white max-w-[200px] truncate">
                              {contract.contractTitle || contract.title || "Legal Agreement Evaluation"}
                            </td>
                            <td className="py-3">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-black ${
                                  (contract.score || 75) >= 75
                                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                    : (contract.score || 75) >= 50
                                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                    : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                                }`}
                              >
                                {contract.score || 75}/100
                              </span>
                            </td>
                            <td className="py-3 text-slate-400 font-mono text-[11px]">
                              Base Sepolia
                            </td>
                            <td className="py-3 font-mono text-cyan-400 text-[11px] max-w-[160px] truncate">
                              {contract.txHash ? (
                                <a
                                  href={`https://sepolia.basescan.org/tx/${contract.txHash}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="hover:underline flex items-center gap-1"
                                >
                                  <span>{contract.txHash.slice(0, 8)}...{contract.txHash.slice(-6)}</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              ) : (
                                <span className="text-slate-500">Local Verified</span>
                              )}
                            </td>
                            <td className="py-3 text-right">
                              <button
                                onClick={() => setActiveTab("docs")}
                                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold"
                              >
                                Inspect
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}

            {/* TAB 1: LANDING PAGE CMS */}
            {activeTab === "cms" && (
              <form onSubmit={handleSave} className="space-y-6 animate-in fade-in">
                
                {/* SECTION 1: CYBER-LEGAL HERO SECTION CUSTOMIZER */}
                <div className="p-6 rounded-3xl bg-slate-900/80 border border-cyan-500/30 space-y-6 backdrop-blur-xl shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

                  {/* Header Strip */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                          Section 1
                        </span>
                        <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                          <Globe className="w-4 h-4 text-cyan-400" />
                          <span>Cyber-Legal Hero Section (The Hook)</span>
                        </h3>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        Full dynamic CMS control for hero copy, background images, 3D hologram side visual, CTAs, and protocol metrics.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setSettings({
                          ...settings,
                          heroConfig: { ...DEFAULT_HERO_CONFIG },
                          heroTitle: DEFAULT_SITE_SETTINGS.heroTitle,
                          heroSubtitle: DEFAULT_SITE_SETTINGS.heroSubtitle,
                        })
                      }
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-white/10 flex items-center gap-1.5 transition-all self-start sm:self-auto"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Reset Section 1 Defaults</span>
                    </button>
                  </div>

                  {/* 1. Badge & Headings */}
                  <div className="space-y-4 text-xs">
                    <h4 className="font-bold text-sm text-cyan-300 flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      <span>1. Hero Badge, Headlines & Subtitle</span>
                    </h4>

                    <div>
                      <label className="block text-slate-400 font-semibold mb-1.5">
                        Top Protocol Pill / Badge Text
                      </label>
                      <input
                        type="text"
                        value={settings.heroConfig?.badgeText ?? DEFAULT_HERO_CONFIG.badgeText}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            heroConfig: {
                              ...(settings.heroConfig || DEFAULT_HERO_CONFIG),
                              badgeText: e.target.value,
                            },
                          })
                        }
                        className="w-full rounded-xl bg-slate-950 p-3 text-white border border-white/10 focus:border-cyan-500/40 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-slate-400 font-semibold mb-1.5">
                          Headline Prefix
                        </label>
                        <input
                          type="text"
                          value={settings.heroConfig?.headlinePrefix ?? DEFAULT_HERO_CONFIG.headlinePrefix}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              heroConfig: {
                                ...(settings.heroConfig || DEFAULT_HERO_CONFIG),
                                headlinePrefix: e.target.value,
                              },
                            })
                          }
                          className="w-full rounded-xl bg-slate-950 p-3 text-white border border-white/10 focus:border-cyan-500/40 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-cyan-300 font-semibold mb-1.5">
                          Gradient Highlight (Neon Effect)
                        </label>
                        <input
                          type="text"
                          value={settings.heroConfig?.headlineHighlight ?? DEFAULT_HERO_CONFIG.headlineHighlight}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              heroConfig: {
                                ...(settings.heroConfig || DEFAULT_HERO_CONFIG),
                                headlineHighlight: e.target.value,
                              },
                            })
                          }
                          className="w-full rounded-xl bg-slate-950 p-3 text-cyan-300 border border-cyan-500/30 focus:border-cyan-500/60 focus:outline-none font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-400 font-semibold mb-1.5">
                          Headline Suffix
                        </label>
                        <input
                          type="text"
                          value={settings.heroConfig?.headlineSuffix ?? DEFAULT_HERO_CONFIG.headlineSuffix}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              heroConfig: {
                                ...(settings.heroConfig || DEFAULT_HERO_CONFIG),
                                headlineSuffix: e.target.value,
                              },
                            })
                          }
                          className="w-full rounded-xl bg-slate-950 p-3 text-white border border-white/10 focus:border-cyan-500/40 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-400 font-semibold mb-1.5">
                        Hero Subtitle Copy (Value Proposition)
                      </label>
                      <textarea
                        rows={3}
                        value={settings.heroConfig?.subheadline ?? settings.heroSubtitle ?? DEFAULT_HERO_CONFIG.subheadline}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSettings({
                            ...settings,
                            heroSubtitle: val,
                            heroConfig: {
                              ...(settings.heroConfig || DEFAULT_HERO_CONFIG),
                              subheadline: val,
                            },
                          });
                        }}
                        className="w-full rounded-xl bg-slate-950 p-3 text-white border border-white/10 focus:border-cyan-500/40 focus:outline-none resize-none"
                      />
                    </div>
                  </div>

                  {/* 2. Background Image & Side Hologram Visual Customizer */}
                  <div className="space-y-4 text-xs pt-4 border-t border-white/10">
                    <h4 className="font-bold text-sm text-cyan-300 flex items-center gap-2">
                      <Layers className="w-4 h-4" />
                      <span>2. Visual Assets & Background Images</span>
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* Background Image Controls */}
                      <div className="space-y-3 p-4 rounded-2xl bg-slate-950/70 border border-white/10">
                        <label className="block text-slate-300 font-bold">
                          Hero Background Image URL / Asset Path
                        </label>
                        <input
                          type="text"
                          value={settings.heroConfig?.bgImageUrl ?? DEFAULT_HERO_CONFIG.bgImageUrl}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              heroConfig: {
                                ...(settings.heroConfig || DEFAULT_HERO_CONFIG),
                                bgImageUrl: e.target.value,
                              },
                            })
                          }
                          placeholder="/images/hero_cyber_legal_bg.jpg or https://..."
                          className="w-full rounded-xl bg-slate-900 p-2.5 text-white border border-white/10 font-mono text-[11px] focus:border-cyan-500/40 focus:outline-none"
                        />

                        {/* Quick Presets */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <span className="text-[10px] text-slate-500 font-semibold">Presets:</span>
                          <button
                            type="button"
                            onClick={() =>
                              setSettings({
                                ...settings,
                                heroConfig: {
                                  ...(settings.heroConfig || DEFAULT_HERO_CONFIG),
                                  bgImageUrl: "/images/hero_cyber_legal_bg.jpg",
                                },
                              })
                            }
                            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[10px] font-semibold"
                          >
                            Cyber Scales & Grid
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setSettings({
                                ...settings,
                                heroConfig: {
                                  ...(settings.heroConfig || DEFAULT_HERO_CONFIG),
                                  bgImageUrl: "/images/escrow_vault_bg.jpg",
                                },
                              })
                            }
                            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold"
                          >
                            Escrow Vault
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setSettings({
                                ...settings,
                                heroConfig: {
                                  ...(settings.heroConfig || DEFAULT_HERO_CONFIG),
                                  bgImageUrl: "/images/cyber_legal_bg.jpg",
                                },
                              })
                            }
                            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold"
                          >
                            Cyber Legal Dark
                          </button>
                        </div>

                        {/* Live Image Preview */}
                        <div className="relative aspect-video rounded-xl overflow-hidden border border-white/10 bg-slate-900 mt-2">
                          <img
                            src={settings.heroConfig?.bgImageUrl || DEFAULT_HERO_CONFIG.bgImageUrl}
                            alt="Background Preview"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as any).src = "/images/hero_cyber_legal_bg.jpg";
                            }}
                          />
                          <div className="absolute inset-0 bg-[#040711]/40 flex items-end p-2.5">
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/70 text-cyan-300">
                              Active Background Preview
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Side Hologram Shield Visual Controls */}
                      <div className="space-y-3 p-4 rounded-2xl bg-slate-950/70 border border-white/10">
                        <div className="flex items-center justify-between">
                          <label className="block text-slate-300 font-bold">
                            Hero Side Visual / 3D Hologram URL
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.heroConfig?.showFloatingShield ?? DEFAULT_HERO_CONFIG.showFloatingShield}
                              onChange={(e) =>
                                setSettings({
                                  ...settings,
                                  heroConfig: {
                                    ...(settings.heroConfig || DEFAULT_HERO_CONFIG),
                                    showFloatingShield: e.target.checked,
                                  },
                                })
                              }
                              className="w-3.5 h-3.5 rounded text-cyan-500 bg-slate-900"
                            />
                            <span className="text-[11px] text-slate-400 font-semibold">Enable Visual Card</span>
                          </label>
                        </div>

                        <input
                          type="text"
                          value={settings.heroConfig?.sideImageUrl ?? DEFAULT_HERO_CONFIG.sideImageUrl}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              heroConfig: {
                                ...(settings.heroConfig || DEFAULT_HERO_CONFIG),
                                sideImageUrl: e.target.value,
                              },
                            })
                          }
                          placeholder="/images/hero_side_shield.jpg or https://..."
                          className="w-full rounded-xl bg-slate-900 p-2.5 text-white border border-white/10 font-mono text-[11px] focus:border-cyan-500/40 focus:outline-none"
                        />

                        {/* Quick Presets */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <span className="text-[10px] text-slate-500 font-semibold">Presets:</span>
                          <button
                            type="button"
                            onClick={() =>
                              setSettings({
                                ...settings,
                                heroConfig: {
                                  ...(settings.heroConfig || DEFAULT_HERO_CONFIG),
                                  sideImageUrl: "/images/hero_side_shield.jpg",
                                },
                              })
                            }
                            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[10px] font-semibold"
                          >
                            Hologram Shield & Scroll
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setSettings({
                                ...settings,
                                heroConfig: {
                                  ...(settings.heroConfig || DEFAULT_HERO_CONFIG),
                                  sideImageUrl: "/images/escrow_vault_bg.jpg",
                                },
                              })
                            }
                            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold"
                          >
                            Vault Chamber
                          </button>
                        </div>

                        {/* Live Image Preview */}
                        <div className="relative aspect-video rounded-xl overflow-hidden border border-white/10 bg-slate-900 mt-2">
                          <img
                            src={settings.heroConfig?.sideImageUrl || DEFAULT_HERO_CONFIG.sideImageUrl}
                            alt="Side Visual Preview"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as any).src = "/images/hero_side_shield.jpg";
                            }}
                          />
                          <div className="absolute inset-0 bg-[#040711]/40 flex items-end p-2.5">
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/70 text-purple-300">
                              Active Side Hologram Preview
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Live Animation Overlay Controls */}
                      <div className="md:col-span-2 p-4 rounded-2xl bg-slate-950/70 border border-cyan-500/20 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <Activity className="w-4 h-4 text-cyan-400" />
                            <div>
                              <p className="font-bold text-white text-xs">
                                Live Interactive Blockchain Nodes & Mesh Animation
                              </p>
                              <p className="text-[11px] text-slate-400">
                                60fps HTML5 Canvas particle network overlaid on top of hero background with mouse-linking filament physics.
                              </p>
                            </div>
                          </div>

                          <label className="flex items-center gap-2 cursor-pointer self-start sm:self-auto">
                            <input
                              type="checkbox"
                              checked={settings.heroConfig?.enableBackgroundAnimation ?? DEFAULT_HERO_CONFIG.enableBackgroundAnimation}
                              onChange={(e) =>
                                setSettings({
                                  ...settings,
                                  heroConfig: {
                                    ...(settings.heroConfig || DEFAULT_HERO_CONFIG),
                                    enableBackgroundAnimation: e.target.checked,
                                  },
                                })
                              }
                              className="w-4 h-4 rounded text-cyan-500 bg-slate-900 border-white/20"
                            />
                            <span className="text-xs font-bold text-cyan-300">
                              {(settings.heroConfig?.enableBackgroundAnimation ?? true) ? "Active" : "Disabled"}
                            </span>
                          </label>
                        </div>

                        {/* Animation Style Selector */}
                        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-white/5">
                          <span className="text-[10px] text-slate-400 font-semibold">Animation Style:</span>
                          <button
                            type="button"
                            onClick={() =>
                              setSettings({
                                ...settings,
                                heroConfig: {
                                  ...(settings.heroConfig || DEFAULT_HERO_CONFIG),
                                  animationStyle: "blockchain-nodes",
                                },
                              })
                            }
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all ${
                              (settings.heroConfig?.animationStyle || "blockchain-nodes") === "blockchain-nodes"
                                ? "bg-cyan-500 text-black font-bold shadow-md shadow-cyan-500/20"
                                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                            }`}
                          >
                            🔗 Cryptographic Nodes & Data Packets
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setSettings({
                                ...settings,
                                heroConfig: {
                                  ...(settings.heroConfig || DEFAULT_HERO_CONFIG),
                                  animationStyle: "cyber-stream",
                                },
                              })
                            }
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all ${
                              settings.heroConfig?.animationStyle === "cyber-stream"
                                ? "bg-cyan-500 text-black font-bold shadow-md shadow-cyan-500/20"
                                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                            }`}
                          >
                            ⚡ Cyber Legal Stream
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setSettings({
                                ...settings,
                                heroConfig: {
                                  ...(settings.heroConfig || DEFAULT_HERO_CONFIG),
                                  animationStyle: "ambient-glow",
                                },
                              })
                            }
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all ${
                              settings.heroConfig?.animationStyle === "ambient-glow"
                                ? "bg-cyan-500 text-black font-bold shadow-md shadow-cyan-500/20"
                                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                            }`}
                          >
                            ✨ Ambient Pulsing Orbs
                          </button>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* 3. CTA Buttons & Links */}
                  <div className="space-y-4 text-xs pt-4 border-t border-white/10">
                    <h4 className="font-bold text-sm text-cyan-300 flex items-center gap-2">
                      <ArrowUpRight className="w-4 h-4" />
                      <span>3. Call to Action (CTA) Buttons & Routing</span>
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Primary CTA */}
                      <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-cyan-500/30 space-y-2">
                        <span className="text-cyan-400 font-bold block">Primary CTA (Gradient Button)</span>
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-1">Button Label</label>
                          <input
                            type="text"
                            value={settings.heroConfig?.primaryCtaText ?? DEFAULT_HERO_CONFIG.primaryCtaText}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                heroConfig: {
                                  ...(settings.heroConfig || DEFAULT_HERO_CONFIG),
                                  primaryCtaText: e.target.value,
                                },
                              })
                            }
                            className="w-full rounded-xl bg-slate-900 p-2.5 text-white border border-white/10 focus:border-cyan-500/40 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-1">Link Target</label>
                          <input
                            type="text"
                            value={settings.heroConfig?.primaryCtaLink ?? DEFAULT_HERO_CONFIG.primaryCtaLink}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                heroConfig: {
                                  ...(settings.heroConfig || DEFAULT_HERO_CONFIG),
                                  primaryCtaLink: e.target.value,
                                },
                              })
                            }
                            className="w-full rounded-xl bg-slate-900 p-2.5 text-white border border-white/10 font-mono text-[11px] focus:border-cyan-500/40 focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Secondary CTA */}
                      <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-white/10 space-y-2">
                        <span className="text-slate-300 font-bold block">Secondary CTA (Glass Outline)</span>
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-1">Button Label</label>
                          <input
                            type="text"
                            value={settings.heroConfig?.secondaryCtaText ?? DEFAULT_HERO_CONFIG.secondaryCtaText}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                heroConfig: {
                                  ...(settings.heroConfig || DEFAULT_HERO_CONFIG),
                                  secondaryCtaText: e.target.value,
                                },
                              })
                            }
                            className="w-full rounded-xl bg-slate-900 p-2.5 text-white border border-white/10 focus:border-cyan-500/40 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-1">Link Target</label>
                          <input
                            type="text"
                            value={settings.heroConfig?.secondaryCtaLink ?? DEFAULT_HERO_CONFIG.secondaryCtaLink}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                heroConfig: {
                                  ...(settings.heroConfig || DEFAULT_HERO_CONFIG),
                                  secondaryCtaLink: e.target.value,
                                },
                              })
                            }
                            className="w-full rounded-xl bg-slate-900 p-2.5 text-white border border-white/10 font-mono text-[11px] focus:border-cyan-500/40 focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Tertiary CTA */}
                      <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-purple-500/30 space-y-2">
                        <span className="text-purple-300 font-bold block">Tertiary CTA (Purple Badge)</span>
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-1">Button Label</label>
                          <input
                            type="text"
                            value={settings.heroConfig?.tertiaryCtaText ?? DEFAULT_HERO_CONFIG.tertiaryCtaText}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                heroConfig: {
                                  ...(settings.heroConfig || DEFAULT_HERO_CONFIG),
                                  tertiaryCtaText: e.target.value,
                                },
                              })
                            }
                            className="w-full rounded-xl bg-slate-900 p-2.5 text-white border border-white/10 focus:border-cyan-500/40 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-1">Link Target</label>
                          <input
                            type="text"
                            value={settings.heroConfig?.tertiaryCtaLink ?? DEFAULT_HERO_CONFIG.tertiaryCtaLink}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                heroConfig: {
                                  ...(settings.heroConfig || DEFAULT_HERO_CONFIG),
                                  tertiaryCtaLink: e.target.value,
                                },
                              })
                            }
                            className="w-full rounded-xl bg-slate-900 p-2.5 text-white border border-white/10 font-mono text-[11px] focus:border-cyan-500/40 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 4. Protocol Micro-Stats Grid */}
                  <div className="space-y-4 text-xs pt-4 border-t border-white/10">
                    <h4 className="font-bold text-sm text-cyan-300 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4" />
                      <span>4. Hero Micro-Stats Row (4 Metrics)</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {/* Stat 1 */}
                      <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-white/10 space-y-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Stat #1</span>
                        <div>
                          <label className="text-[10px] text-slate-500 block">Label</label>
                          <input
                            type="text"
                            value={settings.heroConfig?.stat1Label ?? DEFAULT_HERO_CONFIG.stat1Label}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                heroConfig: {
                                  ...(settings.heroConfig || DEFAULT_HERO_CONFIG),
                                  stat1Label: e.target.value,
                                },
                              })
                            }
                            className="w-full rounded-xl bg-slate-900 p-2 text-white border border-white/10 text-xs focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 block">Value</label>
                          <input
                            type="text"
                            value={settings.heroConfig?.stat1Value ?? DEFAULT_HERO_CONFIG.stat1Value}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                heroConfig: {
                                  ...(settings.heroConfig || DEFAULT_HERO_CONFIG),
                                  stat1Value: e.target.value,
                                },
                              })
                            }
                            className="w-full rounded-xl bg-slate-900 p-2 text-white font-bold border border-white/10 text-xs focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Stat 2 */}
                      <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-white/10 space-y-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Stat #2</span>
                        <div>
                          <label className="text-[10px] text-slate-500 block">Label</label>
                          <input
                            type="text"
                            value={settings.heroConfig?.stat2Label ?? DEFAULT_HERO_CONFIG.stat2Label}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                heroConfig: {
                                  ...(settings.heroConfig || DEFAULT_HERO_CONFIG),
                                  stat2Label: e.target.value,
                                },
                              })
                            }
                            className="w-full rounded-xl bg-slate-900 p-2 text-white border border-white/10 text-xs focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 block">Value</label>
                          <input
                            type="text"
                            value={settings.heroConfig?.stat2Value ?? DEFAULT_HERO_CONFIG.stat2Value}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                heroConfig: {
                                  ...(settings.heroConfig || DEFAULT_HERO_CONFIG),
                                  stat2Value: e.target.value,
                                },
                              })
                            }
                            className="w-full rounded-xl bg-slate-900 p-2 text-cyan-300 font-mono font-bold border border-white/10 text-xs focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Stat 3 */}
                      <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-white/10 space-y-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Stat #3</span>
                        <div>
                          <label className="text-[10px] text-slate-500 block">Label</label>
                          <input
                            type="text"
                            value={settings.heroConfig?.stat3Label ?? DEFAULT_HERO_CONFIG.stat3Label}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                heroConfig: {
                                  ...(settings.heroConfig || DEFAULT_HERO_CONFIG),
                                  stat3Label: e.target.value,
                                },
                              })
                            }
                            className="w-full rounded-xl bg-slate-900 p-2 text-white border border-white/10 text-xs focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 block">Value</label>
                          <input
                            type="text"
                            value={settings.heroConfig?.stat3Value ?? DEFAULT_HERO_CONFIG.stat3Value}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                heroConfig: {
                                  ...(settings.heroConfig || DEFAULT_HERO_CONFIG),
                                  stat3Value: e.target.value,
                                },
                              })
                            }
                            className="w-full rounded-xl bg-slate-900 p-2 text-emerald-400 font-bold border border-white/10 text-xs focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Stat 4 */}
                      <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-white/10 space-y-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Stat #4</span>
                        <div>
                          <label className="text-[10px] text-slate-500 block">Label</label>
                          <input
                            type="text"
                            value={settings.heroConfig?.stat4Label ?? DEFAULT_HERO_CONFIG.stat4Label}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                heroConfig: {
                                  ...(settings.heroConfig || DEFAULT_HERO_CONFIG),
                                  stat4Label: e.target.value,
                                },
                              })
                            }
                            className="w-full rounded-xl bg-slate-900 p-2 text-white border border-white/10 text-xs focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 block">Value</label>
                          <input
                            type="text"
                            value={settings.heroConfig?.stat4Value ?? DEFAULT_HERO_CONFIG.stat4Value}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                heroConfig: {
                                  ...(settings.heroConfig || DEFAULT_HERO_CONFIG),
                                  stat4Value: e.target.value,
                                },
                              })
                            }
                            className="w-full rounded-xl bg-slate-900 p-2 text-purple-400 font-bold border border-white/10 text-xs focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Save Section 1 Button */}
                  <div className="pt-4 flex items-center justify-end">
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/20 flex items-center gap-2 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                    >
                      {isSaving ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Saving Live Changes...</span>
                        </>
                      ) : saveSuccess ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                          <span>Section 1 Saved to Live App!</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-3.5 h-3.5" />
                          <span>Save Section 1 Changes Live</span>
                        </>
                      )}
                    </button>
                  </div>

                </div>

                {/* SECTION 2: LEGACY VS LEXIGUARD CONTRAST CUSTOMIZER */}
                <div className="p-6 rounded-3xl bg-slate-900/80 border border-purple-500/30 space-y-6 backdrop-blur-xl shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

                  {/* Header Strip */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/10 text-purple-300 border border-purple-500/30">
                          Section 2
                        </span>
                        <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                          <Layers className="w-4 h-4 text-purple-400" />
                          <span>Broken Legacy vs. LexiGuard Protocol (The Contrast Bento)</span>
                        </h3>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        Full CMS control for the Problem vs Solution contrast matrix, comparison cards, legal pain points, and blockchain metrics.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setSettings({
                          ...settings,
                          section2Config: { ...DEFAULT_SECTION2_CONFIG },
                        })
                      }
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-white/10 flex items-center gap-1.5 transition-all self-start sm:self-auto"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-purple-400" />
                      <span>Reset Section 2 Defaults</span>
                    </button>
                  </div>

                  {/* 1. Badge & Headings */}
                  <div className="space-y-4 text-xs">
                    <h4 className="font-bold text-sm text-purple-300 flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      <span>1. Section 2 Header & Headlines</span>
                    </h4>

                    <div>
                      <label className="block text-slate-400 font-semibold mb-1.5">
                        Top Protocol Badge / Pill Text
                      </label>
                      <input
                        type="text"
                        value={settings.section2Config?.badgeText ?? DEFAULT_SECTION2_CONFIG.badgeText}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            section2Config: {
                              ...(settings.section2Config || DEFAULT_SECTION2_CONFIG),
                              badgeText: e.target.value,
                            },
                          })
                        }
                        className="w-full rounded-xl bg-slate-950 p-3 text-white border border-white/10 focus:border-purple-500/40 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-slate-400 font-semibold mb-1.5">
                          Headline Prefix
                        </label>
                        <input
                          type="text"
                          value={settings.section2Config?.titlePrefix ?? DEFAULT_SECTION2_CONFIG.titlePrefix}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              section2Config: {
                                ...(settings.section2Config || DEFAULT_SECTION2_CONFIG),
                                titlePrefix: e.target.value,
                              },
                            })
                          }
                          className="w-full rounded-xl bg-slate-950 p-3 text-white border border-white/10 focus:border-purple-500/40 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-400 font-semibold mb-1.5">
                          Headline Highlight (Gradient Text)
                        </label>
                        <input
                          type="text"
                          value={settings.section2Config?.titleHighlight ?? DEFAULT_SECTION2_CONFIG.titleHighlight}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              section2Config: {
                                ...(settings.section2Config || DEFAULT_SECTION2_CONFIG),
                                titleHighlight: e.target.value,
                              },
                            })
                          }
                          className="w-full rounded-xl bg-slate-950 p-3 text-rose-400 font-bold border border-white/10 focus:border-purple-500/40 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-400 font-semibold mb-1.5">
                          Headline Suffix
                        </label>
                        <input
                          type="text"
                          value={settings.section2Config?.titleSuffix ?? DEFAULT_SECTION2_CONFIG.titleSuffix}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              section2Config: {
                                ...(settings.section2Config || DEFAULT_SECTION2_CONFIG),
                                titleSuffix: e.target.value,
                              },
                            })
                          }
                          className="w-full rounded-xl bg-slate-950 p-3 text-white border border-white/10 focus:border-purple-500/40 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-400 font-semibold mb-1.5">
                        Subheadline Description Copy
                      </label>
                      <textarea
                        rows={2}
                        value={settings.section2Config?.subheadline ?? DEFAULT_SECTION2_CONFIG.subheadline}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            section2Config: {
                              ...(settings.section2Config || DEFAULT_SECTION2_CONFIG),
                              subheadline: e.target.value,
                            },
                          })
                        }
                        className="w-full rounded-xl bg-slate-950 p-3 text-white border border-white/10 focus:border-purple-500/40 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* 2. Background Images & Architecture Asset */}
                  <div className="space-y-4 text-xs pt-4 border-t border-white/10">
                    <h4 className="font-bold text-sm text-purple-300 flex items-center gap-2">
                      <LayoutDashboard className="w-4 h-4" />
                      <span>2. Background Visuals & Architecture Artwork</span>
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Background Image Input */}
                      <div className="p-4 rounded-2xl bg-slate-950/70 border border-white/10 space-y-3">
                        <label className="block text-slate-300 font-bold">
                          Section 2 Cyber Background Image URL
                        </label>
                        <input
                          type="text"
                          value={settings.section2Config?.bgImageUrl ?? DEFAULT_SECTION2_CONFIG.bgImageUrl}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              section2Config: {
                                ...(settings.section2Config || DEFAULT_SECTION2_CONFIG),
                                bgImageUrl: e.target.value,
                              },
                            })
                          }
                          className="w-full rounded-xl bg-slate-900 p-2.5 text-white border border-white/10 font-mono text-[11px] focus:outline-none"
                        />

                        {/* Presets */}
                        <div className="flex flex-wrap gap-2 pt-1">
                          {[
                            "/images/cyber_legal_bg.jpg",
                            "/images/hero_cyber_legal_bg.jpg",
                            "/images/escrow_vault_bg.jpg",
                          ].map((preset) => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() =>
                                setSettings({
                                  ...settings,
                                  section2Config: {
                                    ...(settings.section2Config || DEFAULT_SECTION2_CONFIG),
                                    bgImageUrl: preset,
                                  },
                                })
                              }
                              className="px-2 py-1 rounded bg-slate-800 text-[10px] text-cyan-300 hover:bg-slate-700"
                            >
                              {preset.replace("/images/", "")}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Architecture Asset Input & Preview */}
                      <div className="p-4 rounded-2xl bg-slate-950/70 border border-white/10 space-y-3">
                        <label className="block text-slate-300 font-bold">
                          Consensus Architecture Graphic URL
                        </label>
                        <input
                          type="text"
                          value={settings.section2Config?.sideImageUrl ?? DEFAULT_SECTION2_CONFIG.sideImageUrl}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              section2Config: {
                                ...(settings.section2Config || DEFAULT_SECTION2_CONFIG),
                                sideImageUrl: e.target.value,
                              },
                            })
                          }
                          className="w-full rounded-xl bg-slate-900 p-2.5 text-white border border-white/10 font-mono text-[11px] focus:outline-none"
                        />

                        <div className="relative rounded-xl overflow-hidden border border-white/10 h-28">
                          <img
                            src={settings.section2Config?.sideImageUrl || DEFAULT_SECTION2_CONFIG.sideImageUrl}
                            alt="Section 2 Artwork Preview"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-[#040711]/40 flex items-end p-2">
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/70 text-cyan-300">
                              Active Artwork Preview
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 3. Left Card Customizer: Legacy Chaos */}
                  <div className="space-y-4 text-xs pt-4 border-t border-white/10">
                    <h4 className="font-bold text-sm text-rose-300 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-400" />
                      <span>3. Left Card: The Broken Legacy Legal System</span>
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="text-slate-400 block mb-1">Card Title</label>
                        <input
                          type="text"
                          value={settings.section2Config?.legacyCardTitle ?? DEFAULT_SECTION2_CONFIG.legacyCardTitle}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              section2Config: {
                                ...(settings.section2Config || DEFAULT_SECTION2_CONFIG),
                                legacyCardTitle: e.target.value,
                              },
                            })
                          }
                          className="w-full rounded-xl bg-slate-950 p-2.5 text-white border border-white/10"
                        />
                      </div>
                      <div>
                        <label className="text-slate-400 block mb-1">Badge Text</label>
                        <input
                          type="text"
                          value={settings.section2Config?.legacyBadge ?? DEFAULT_SECTION2_CONFIG.legacyBadge}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              section2Config: {
                                ...(settings.section2Config || DEFAULT_SECTION2_CONFIG),
                                legacyBadge: e.target.value,
                              },
                            })
                          }
                          className="w-full rounded-xl bg-slate-950 p-2.5 text-rose-300 border border-white/10"
                        />
                      </div>
                      <div>
                        <label className="text-slate-400 block mb-1">Card Subtitle</label>
                        <input
                          type="text"
                          value={settings.section2Config?.legacyCardSubtitle ?? DEFAULT_SECTION2_CONFIG.legacyCardSubtitle}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              section2Config: {
                                ...(settings.section2Config || DEFAULT_SECTION2_CONFIG),
                                legacyCardSubtitle: e.target.value,
                              },
                            })
                          }
                          className="w-full rounded-xl bg-slate-950 p-2.5 text-white border border-white/10"
                        />
                      </div>
                    </div>

                    {/* Legacy Points List */}
                    <div className="space-y-3 pt-2">
                      <label className="text-slate-300 font-bold block">4 Legacy System Pain Points:</label>
                      {(settings.section2Config?.legacyPoints || DEFAULT_SECTION2_CONFIG.legacyPoints).map((point, idx) => (
                        <div key={point.id || idx} className="p-3 rounded-2xl bg-slate-950/70 border border-rose-500/15 space-y-2">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <div className="sm:col-span-2">
                              <label className="text-[10px] text-slate-500 block">Title #{idx + 1}</label>
                              <input
                                type="text"
                                value={point.title}
                                onChange={(e) => {
                                  const updated = [...(settings.section2Config?.legacyPoints || DEFAULT_SECTION2_CONFIG.legacyPoints)];
                                  updated[idx] = { ...updated[idx], title: e.target.value };
                                  setSettings({
                                    ...settings,
                                    section2Config: {
                                      ...(settings.section2Config || DEFAULT_SECTION2_CONFIG),
                                      legacyPoints: updated,
                                    },
                                  });
                                }}
                                className="w-full rounded-xl bg-slate-900 p-2 text-white border border-white/10 text-xs"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-slate-500 block">Tag Pill</label>
                              <input
                                type="text"
                                value={point.tag}
                                onChange={(e) => {
                                  const updated = [...(settings.section2Config?.legacyPoints || DEFAULT_SECTION2_CONFIG.legacyPoints)];
                                  updated[idx] = { ...updated[idx], tag: e.target.value };
                                  setSettings({
                                    ...settings,
                                    section2Config: {
                                      ...(settings.section2Config || DEFAULT_SECTION2_CONFIG),
                                      legacyPoints: updated,
                                    },
                                  });
                                }}
                                className="w-full rounded-xl bg-slate-900 p-2 text-rose-300 border border-white/10 text-xs"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-500 block">Explanation</label>
                            <input
                              type="text"
                              value={point.desc}
                              onChange={(e) => {
                                const updated = [...(settings.section2Config?.legacyPoints || DEFAULT_SECTION2_CONFIG.legacyPoints)];
                                updated[idx] = { ...updated[idx], desc: e.target.value };
                                setSettings({
                                    ...settings,
                                    section2Config: {
                                      ...(settings.section2Config || DEFAULT_SECTION2_CONFIG),
                                      legacyPoints: updated,
                                    },
                                  });
                              }}
                              className="w-full rounded-xl bg-slate-900 p-2 text-slate-300 border border-white/10 text-xs"
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div>
                      <label className="text-slate-400 block mb-1">Bottom Legacy Warning Quote</label>
                      <input
                        type="text"
                        value={settings.section2Config?.legacyImpactQuote ?? DEFAULT_SECTION2_CONFIG.legacyImpactQuote}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            section2Config: {
                              ...(settings.section2Config || DEFAULT_SECTION2_CONFIG),
                              legacyImpactQuote: e.target.value,
                            },
                          })
                        }
                        className="w-full rounded-xl bg-slate-950 p-2.5 text-rose-300 border border-white/10 text-xs"
                      />
                    </div>
                  </div>

                  {/* 4. Right Card Customizer: LexiGuard Protocol */}
                  <div className="space-y-4 text-xs pt-4 border-t border-white/10">
                    <h4 className="font-bold text-sm text-cyan-300 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-cyan-400" />
                      <span>4. Right Card: LexiGuard AI & EVM Protocol</span>
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="text-slate-400 block mb-1">Card Title</label>
                        <input
                          type="text"
                          value={settings.section2Config?.lexiguardCardTitle ?? DEFAULT_SECTION2_CONFIG.lexiguardCardTitle}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              section2Config: {
                                ...(settings.section2Config || DEFAULT_SECTION2_CONFIG),
                                lexiguardCardTitle: e.target.value,
                              },
                            })
                          }
                          className="w-full rounded-xl bg-slate-950 p-2.5 text-white border border-white/10"
                        />
                      </div>
                      <div>
                        <label className="text-slate-400 block mb-1">Badge Text</label>
                        <input
                          type="text"
                          value={settings.section2Config?.lexiguardBadge ?? DEFAULT_SECTION2_CONFIG.lexiguardBadge}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              section2Config: {
                                ...(settings.section2Config || DEFAULT_SECTION2_CONFIG),
                                lexiguardBadge: e.target.value,
                              },
                            })
                          }
                          className="w-full rounded-xl bg-slate-950 p-2.5 text-cyan-300 border border-white/10"
                        />
                      </div>
                      <div>
                        <label className="text-slate-400 block mb-1">Card Subtitle</label>
                        <input
                          type="text"
                          value={settings.section2Config?.lexiguardCardSubtitle ?? DEFAULT_SECTION2_CONFIG.lexiguardCardSubtitle}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              section2Config: {
                                ...(settings.section2Config || DEFAULT_SECTION2_CONFIG),
                                lexiguardCardSubtitle: e.target.value,
                              },
                            })
                          }
                          className="w-full rounded-xl bg-slate-950 p-2.5 text-white border border-white/10"
                        />
                      </div>
                    </div>

                    {/* LexiGuard Points List */}
                    <div className="space-y-3 pt-2">
                      <label className="text-slate-300 font-bold block">4 LexiGuard Cryptographic Breakthroughs:</label>
                      {(settings.section2Config?.lexiguardPoints || DEFAULT_SECTION2_CONFIG.lexiguardPoints).map((point, idx) => (
                        <div key={point.id || idx} className="p-3 rounded-2xl bg-slate-950/70 border border-cyan-500/20 space-y-2">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <div className="sm:col-span-2">
                              <label className="text-[10px] text-slate-500 block">Title #{idx + 1}</label>
                              <input
                                type="text"
                                value={point.title}
                                onChange={(e) => {
                                  const updated = [...(settings.section2Config?.lexiguardPoints || DEFAULT_SECTION2_CONFIG.lexiguardPoints)];
                                  updated[idx] = { ...updated[idx], title: e.target.value };
                                  setSettings({
                                    ...settings,
                                    section2Config: {
                                      ...(settings.section2Config || DEFAULT_SECTION2_CONFIG),
                                      lexiguardPoints: updated,
                                    },
                                  });
                                }}
                                className="w-full rounded-xl bg-slate-900 p-2 text-white border border-white/10 text-xs"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-slate-500 block">Tag Pill</label>
                              <input
                                type="text"
                                value={point.tag}
                                onChange={(e) => {
                                  const updated = [...(settings.section2Config?.lexiguardPoints || DEFAULT_SECTION2_CONFIG.lexiguardPoints)];
                                  updated[idx] = { ...updated[idx], tag: e.target.value };
                                  setSettings({
                                    ...settings,
                                    section2Config: {
                                      ...(settings.section2Config || DEFAULT_SECTION2_CONFIG),
                                      lexiguardPoints: updated,
                                    },
                                  });
                                }}
                                className="w-full rounded-xl bg-slate-900 p-2 text-emerald-300 border border-white/10 text-xs"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-500 block">Explanation</label>
                            <input
                              type="text"
                              value={point.desc}
                              onChange={(e) => {
                                const updated = [...(settings.section2Config?.lexiguardPoints || DEFAULT_SECTION2_CONFIG.lexiguardPoints)];
                                updated[idx] = { ...updated[idx], desc: e.target.value };
                                setSettings({
                                    ...settings,
                                    section2Config: {
                                      ...(settings.section2Config || DEFAULT_SECTION2_CONFIG),
                                      lexiguardPoints: updated,
                                    },
                                  });
                              }}
                              className="w-full rounded-xl bg-slate-900 p-2 text-slate-300 border border-white/10 text-xs"
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div>
                      <label className="text-slate-400 block mb-1">Bottom LexiGuard Proof Quote</label>
                      <input
                        type="text"
                        value={settings.section2Config?.lexiguardImpactQuote ?? DEFAULT_SECTION2_CONFIG.lexiguardImpactQuote}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            section2Config: {
                              ...(settings.section2Config || DEFAULT_SECTION2_CONFIG),
                              lexiguardImpactQuote: e.target.value,
                            },
                          })
                        }
                        className="w-full rounded-xl bg-slate-950 p-2.5 text-emerald-300 border border-white/10 text-xs"
                      />
                    </div>
                  </div>

                  {/* 5. Bottom Protocol Metrics (3 Stats) */}
                  <div className="space-y-4 text-xs pt-4 border-t border-white/10">
                    <h4 className="font-bold text-sm text-purple-300 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4" />
                      <span>5. Section 2 Protocol Metrics (3 Bottom Stats)</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* Metric 1 */}
                      <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-white/10 space-y-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Metric #1</span>
                        <div>
                          <label className="text-[10px] text-slate-500 block">Label</label>
                          <input
                            type="text"
                            value={settings.section2Config?.stat1Label ?? DEFAULT_SECTION2_CONFIG.stat1Label}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                section2Config: {
                                  ...(settings.section2Config || DEFAULT_SECTION2_CONFIG),
                                  stat1Label: e.target.value,
                                },
                              })
                            }
                            className="w-full rounded-xl bg-slate-900 p-2 text-white border border-white/10 text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 block">Value</label>
                          <input
                            type="text"
                            value={settings.section2Config?.stat1Value ?? DEFAULT_SECTION2_CONFIG.stat1Value}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                section2Config: {
                                  ...(settings.section2Config || DEFAULT_SECTION2_CONFIG),
                                  stat1Value: e.target.value,
                                },
                              })
                            }
                            className="w-full rounded-xl bg-slate-900 p-2 text-cyan-400 font-bold border border-white/10 text-xs"
                          />
                        </div>
                      </div>

                      {/* Metric 2 */}
                      <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-white/10 space-y-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Metric #2</span>
                        <div>
                          <label className="text-[10px] text-slate-500 block">Label</label>
                          <input
                            type="text"
                            value={settings.section2Config?.stat2Label ?? DEFAULT_SECTION2_CONFIG.stat2Label}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                section2Config: {
                                  ...(settings.section2Config || DEFAULT_SECTION2_CONFIG),
                                  stat2Label: e.target.value,
                                },
                              })
                            }
                            className="w-full rounded-xl bg-slate-900 p-2 text-white border border-white/10 text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 block">Value</label>
                          <input
                            type="text"
                            value={settings.section2Config?.stat2Value ?? DEFAULT_SECTION2_CONFIG.stat2Value}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                section2Config: {
                                  ...(settings.section2Config || DEFAULT_SECTION2_CONFIG),
                                  stat2Value: e.target.value,
                                },
                              })
                            }
                            className="w-full rounded-xl bg-slate-900 p-2 text-emerald-400 font-bold border border-white/10 text-xs"
                          />
                        </div>
                      </div>

                      {/* Metric 3 */}
                      <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-white/10 space-y-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Metric #3</span>
                        <div>
                          <label className="text-[10px] text-slate-500 block">Label</label>
                          <input
                            type="text"
                            value={settings.section2Config?.stat3Label ?? DEFAULT_SECTION2_CONFIG.stat3Label}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                section2Config: {
                                  ...(settings.section2Config || DEFAULT_SECTION2_CONFIG),
                                  stat3Label: e.target.value,
                                },
                              })
                            }
                            className="w-full rounded-xl bg-slate-900 p-2 text-white border border-white/10 text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 block">Value</label>
                          <input
                            type="text"
                            value={settings.section2Config?.stat3Value ?? DEFAULT_SECTION2_CONFIG.stat3Value}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                section2Config: {
                                  ...(settings.section2Config || DEFAULT_SECTION2_CONFIG),
                                  stat3Value: e.target.value,
                                },
                              })
                            }
                            className="w-full rounded-xl bg-slate-900 p-2 text-purple-400 font-bold border border-white/10 text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Save Section 2 Changes Button */}
                  <div className="pt-4 flex items-center justify-end">
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-500 via-indigo-600 to-cyan-500 hover:from-purple-400 hover:to-cyan-400 text-white font-bold text-xs shadow-lg shadow-purple-500/20 flex items-center gap-2 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                    >
                      {isSaving ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Saving Live Changes...</span>
                        </>
                      ) : saveSuccess ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                          <span>Section 2 Saved to Live App!</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-3.5 h-3.5" />
                          <span>Save Section 2 Changes Live</span>
                        </>
                      )}
                    </button>
                  </div>

                </div>

                {/* SECTION 3: PROTOCOL PIPELINE CUSTOMIZER */}
                <div className="p-6 rounded-3xl bg-slate-900/80 border border-emerald-500/30 space-y-6 backdrop-blur-xl shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

                  {/* Header Strip */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                          Section 3
                        </span>
                        <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                          <Zap className="w-4 h-4 text-emerald-400" />
                          <span>The 3-Step Cryptographic Protocol Pipeline (How It Works)</span>
                        </h3>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        Full CMS control for the 3-step verification architecture, technical metrics, 3D consensus flow diagram, and FRE 902 legal callouts.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setSettings({
                          ...settings,
                          section3Config: { ...DEFAULT_SECTION3_CONFIG },
                        })
                      }
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-white/10 flex items-center gap-1.5 transition-all self-start sm:self-auto"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Reset Section 3 Defaults</span>
                    </button>
                  </div>

                  {/* 1. Badge & Headings */}
                  <div className="space-y-4 text-xs">
                    <h4 className="font-bold text-sm text-emerald-300 flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      <span>1. Section 3 Header & Headlines</span>
                    </h4>

                    <div>
                      <label className="block text-slate-400 font-semibold mb-1.5">
                        Top Protocol Pill / Badge Text
                      </label>
                      <input
                        type="text"
                        value={settings.section3Config?.badgeText ?? DEFAULT_SECTION3_CONFIG.badgeText}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            section3Config: {
                              ...(settings.section3Config || DEFAULT_SECTION3_CONFIG),
                              badgeText: e.target.value,
                            },
                          })
                        }
                        className="w-full rounded-xl bg-slate-950 p-3 text-white border border-white/10 focus:border-emerald-500/40 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-slate-400 font-semibold mb-1.5">
                          Headline Prefix
                        </label>
                        <input
                          type="text"
                          value={settings.section3Config?.titlePrefix ?? DEFAULT_SECTION3_CONFIG.titlePrefix}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              section3Config: {
                                ...(settings.section3Config || DEFAULT_SECTION3_CONFIG),
                                titlePrefix: e.target.value,
                              },
                            })
                          }
                          className="w-full rounded-xl bg-slate-950 p-3 text-white border border-white/10 focus:border-emerald-500/40 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-400 font-semibold mb-1.5">
                          Headline Highlight (Gradient Text)
                        </label>
                        <input
                          type="text"
                          value={settings.section3Config?.titleHighlight ?? DEFAULT_SECTION3_CONFIG.titleHighlight}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              section3Config: {
                                ...(settings.section3Config || DEFAULT_SECTION3_CONFIG),
                                titleHighlight: e.target.value,
                              },
                            })
                          }
                          className="w-full rounded-xl bg-slate-950 p-3 text-emerald-400 font-bold border border-white/10 focus:border-emerald-500/40 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-400 font-semibold mb-1.5">
                          Headline Suffix
                        </label>
                        <input
                          type="text"
                          value={settings.section3Config?.titleSuffix ?? DEFAULT_SECTION3_CONFIG.titleSuffix}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              section3Config: {
                                ...(settings.section3Config || DEFAULT_SECTION3_CONFIG),
                                titleSuffix: e.target.value,
                              },
                            })
                          }
                          className="w-full rounded-xl bg-slate-950 p-3 text-white border border-white/10 focus:border-emerald-500/40 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-400 font-semibold mb-1.5">
                        Subheadline Description Copy
                      </label>
                      <textarea
                        rows={2}
                        value={settings.section3Config?.subheadline ?? DEFAULT_SECTION3_CONFIG.subheadline}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            section3Config: {
                              ...(settings.section3Config || DEFAULT_SECTION3_CONFIG),
                              subheadline: e.target.value,
                            },
                          })
                        }
                        className="w-full rounded-xl bg-slate-950 p-3 text-white border border-white/10 focus:border-emerald-500/40 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* 2. Visual Artwork & Diagram URL */}
                  <div className="space-y-4 text-xs pt-4 border-t border-white/10">
                    <h4 className="font-bold text-sm text-emerald-300 flex items-center gap-2">
                      <LayoutDashboard className="w-4 h-4" />
                      <span>2. Visual Background & 3-Node Diagram Artwork</span>
                    </h4>

                    {/* Animated Background Toggles */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-950/80 border border-white/10">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.section3Config?.enableAnimatedBackground ?? DEFAULT_SECTION3_CONFIG.enableAnimatedBackground}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              section3Config: {
                                ...(settings.section3Config || DEFAULT_SECTION3_CONFIG),
                                enableAnimatedBackground: e.target.checked,
                              },
                            })
                          }
                          className="w-4 h-4 rounded text-emerald-500 focus:ring-0 focus:outline-none"
                        />
                        <div>
                          <span className="font-bold text-white block">Animated Cyber Stream Background</span>
                          <span className="text-[11px] text-slate-400">Drifting cryptographic hash tokens & data packets</span>
                        </div>
                      </label>

                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.section3Config?.enableAnimatedGrid ?? DEFAULT_SECTION3_CONFIG.enableAnimatedGrid}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              section3Config: {
                                ...(settings.section3Config || DEFAULT_SECTION3_CONFIG),
                                enableAnimatedGrid: e.target.checked,
                              },
                            })
                          }
                          className="w-4 h-4 rounded text-emerald-500 focus:ring-0 focus:outline-none"
                        />
                        <div>
                          <span className="font-bold text-white block">Futuristic Mesh Grid Pattern</span>
                          <span className="text-[11px] text-slate-400">Cybernetic grid line texture overlay</span>
                        </div>
                      </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Background Image Input */}
                      <div className="p-4 rounded-2xl bg-slate-950/70 border border-white/10 space-y-3">
                        <label className="block text-slate-300 font-bold">
                          Section 3 Background Image URL
                        </label>
                        <input
                          type="text"
                          value={settings.section3Config?.bgImageUrl ?? DEFAULT_SECTION3_CONFIG.bgImageUrl}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              section3Config: {
                                ...(settings.section3Config || DEFAULT_SECTION3_CONFIG),
                                bgImageUrl: e.target.value,
                              },
                            })
                          }
                          className="w-full rounded-xl bg-slate-900 p-2.5 text-white border border-white/10 font-mono text-[11px] focus:outline-none"
                        />

                        {/* Presets */}
                        <div className="flex flex-wrap gap-2 pt-1">
                          {[
                            "/images/hero_cyber_legal_bg.jpg",
                            "/images/cyber_legal_bg.jpg",
                            "/images/escrow_vault_bg.jpg",
                          ].map((preset) => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() =>
                                setSettings({
                                  ...settings,
                                  section3Config: {
                                    ...(settings.section3Config || DEFAULT_SECTION3_CONFIG),
                                    bgImageUrl: preset,
                                  },
                                })
                              }
                              className="px-2 py-1 rounded bg-slate-800 text-[10px] text-emerald-300 hover:bg-slate-700"
                            >
                              {preset.replace("/images/", "")}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* 3-Node Connected Diagram Artwork Input & Preview */}
                      <div className="p-4 rounded-2xl bg-slate-950/70 border border-white/10 space-y-3">
                        <label className="block text-slate-300 font-bold">
                          3-Node Connected Diagram Artwork URL
                        </label>
                        <input
                          type="text"
                          value={settings.section3Config?.sideImageUrl ?? DEFAULT_SECTION3_CONFIG.sideImageUrl}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              section3Config: {
                                ...(settings.section3Config || DEFAULT_SECTION3_CONFIG),
                                sideImageUrl: e.target.value,
                              },
                            })
                          }
                          className="w-full rounded-xl bg-slate-900 p-2.5 text-white border border-white/10 font-mono text-[11px] focus:outline-none"
                        />

                        <div className="relative rounded-xl overflow-hidden border border-white/10 h-28">
                          <img
                            src={settings.section3Config?.sideImageUrl || DEFAULT_SECTION3_CONFIG.sideImageUrl}
                            alt="Section 3 Pipeline Preview"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-[#020510]/40 flex items-end p-2">
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/70 text-emerald-300">
                              Active Diagram Preview
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 3. The 3 Protocol Steps Customizer */}
                  <div className="space-y-4 text-xs pt-4 border-t border-white/10">
                    <h4 className="font-bold text-sm text-cyan-300 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-cyan-400" />
                      <span>3. The 3 Protocol Pipeline Stages & Images</span>
                    </h4>

                    <div className="space-y-5">
                      {(settings.section3Config?.steps || DEFAULT_SECTION3_CONFIG.steps).map((step, idx) => (
                        <div
                          key={step.id || idx}
                          className="p-4 rounded-2xl bg-slate-950/70 border border-white/10 space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-white flex items-center gap-2">
                              <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-mono font-black text-xs">
                                {idx + 1}
                              </span>
                              <span>Stage {step.stepNumber}: {step.title}</span>
                            </span>
                            <span className="text-[10px] font-mono text-slate-500 uppercase">
                              ID: {step.id}
                            </span>
                          </div>

                          {/* Step Image URL & Preview */}
                          <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 space-y-2">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                              <label className="text-[10px] text-cyan-300 font-bold block">
                                Stage Artwork / Image URL
                              </label>
                              <div className="flex gap-1.5">
                                {[
                                  { label: "Step 1 Preset", url: "/images/step1_crypto_hashing.jpg" },
                                  { label: "Step 2 Preset", url: "/images/step2_ai_redlining.jpg" },
                                  { label: "Step 3 Preset", url: "/images/step3_blockchain_notary.jpg" },
                                ].map((p) => (
                                  <button
                                    key={p.url}
                                    type="button"
                                    onClick={() => {
                                      const updated = [...(settings.section3Config?.steps || DEFAULT_SECTION3_CONFIG.steps)];
                                      updated[idx] = { ...updated[idx], imageUrl: p.url };
                                      setSettings({
                                        ...settings,
                                        section3Config: {
                                          ...(settings.section3Config || DEFAULT_SECTION3_CONFIG),
                                          steps: updated,
                                        },
                                      });
                                    }}
                                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[9px] text-cyan-200"
                                  >
                                    {p.label}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <input
                                type="text"
                                value={step.imageUrl || ""}
                                placeholder="/images/step1_crypto_hashing.jpg"
                                onChange={(e) => {
                                  const updated = [...(settings.section3Config?.steps || DEFAULT_SECTION3_CONFIG.steps)];
                                  updated[idx] = { ...updated[idx], imageUrl: e.target.value };
                                  setSettings({
                                    ...settings,
                                    section3Config: {
                                      ...(settings.section3Config || DEFAULT_SECTION3_CONFIG),
                                      steps: updated,
                                    },
                                  });
                                }}
                                className="w-full rounded-xl bg-slate-950 p-2 text-white border border-white/10 text-xs font-mono"
                              />

                              {step.imageUrl && (
                                <div className="w-16 h-12 rounded-lg overflow-hidden border border-white/10 shrink-0 bg-black">
                                  <img
                                    src={step.imageUrl}
                                    alt="Preview"
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="sm:col-span-2">
                              <label className="text-[10px] text-slate-400 block mb-1">Stage Title</label>
                              <input
                                type="text"
                                value={step.title}
                                onChange={(e) => {
                                  const updated = [...(settings.section3Config?.steps || DEFAULT_SECTION3_CONFIG.steps)];
                                  updated[idx] = { ...updated[idx], title: e.target.value };
                                  setSettings({
                                    ...settings,
                                    section3Config: {
                                      ...(settings.section3Config || DEFAULT_SECTION3_CONFIG),
                                      steps: updated,
                                    },
                                  });
                                }}
                                className="w-full rounded-xl bg-slate-900 p-2 text-white border border-white/10 text-xs"
                              />
                            </div>

                            <div>
                              <label className="text-[10px] text-slate-400 block mb-1">Tag Pill</label>
                              <input
                                type="text"
                                value={step.tag}
                                onChange={(e) => {
                                  const updated = [...(settings.section3Config?.steps || DEFAULT_SECTION3_CONFIG.steps)];
                                  updated[idx] = { ...updated[idx], tag: e.target.value };
                                  setSettings({
                                    ...settings,
                                    section3Config: {
                                      ...(settings.section3Config || DEFAULT_SECTION3_CONFIG),
                                      steps: updated,
                                    },
                                  });
                                }}
                                className="w-full rounded-xl bg-slate-900 p-2 text-emerald-300 border border-white/10 text-xs"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-[10px] text-slate-400 block mb-1">Detailed Explanation</label>
                            <textarea
                              rows={2}
                              value={step.desc}
                              onChange={(e) => {
                                  const updated = [...(settings.section3Config?.steps || DEFAULT_SECTION3_CONFIG.steps)];
                                updated[idx] = { ...updated[idx], desc: e.target.value };
                                setSettings({
                                  ...settings,
                                  section3Config: {
                                    ...(settings.section3Config || DEFAULT_SECTION3_CONFIG),
                                    steps: updated,
                                  },
                                });
                              }}
                              className="w-full rounded-xl bg-slate-900 p-2 text-slate-300 border border-white/10 text-xs"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] text-slate-400 block mb-1">Technical Spec / Metric Pill</label>
                            <input
                              type="text"
                              value={step.technicalMetric}
                              onChange={(e) => {
                                const updated = [...(settings.section3Config?.steps || DEFAULT_SECTION3_CONFIG.steps)];
                                updated[idx] = { ...updated[idx], technicalMetric: e.target.value };
                                setSettings({
                                  ...settings,
                                  section3Config: {
                                    ...(settings.section3Config || DEFAULT_SECTION3_CONFIG),
                                    steps: updated,
                                  },
                                });
                              }}
                              className="w-full rounded-xl bg-slate-900 p-2 text-cyan-300 font-mono border border-white/10 text-xs"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 4. Judicial Callout & CTA Action */}
                  <div className="space-y-4 text-xs pt-4 border-t border-white/10">
                    <h4 className="font-bold text-sm text-purple-300 flex items-center gap-2">
                      <Scale className="w-4 h-4 text-purple-400" />
                      <span>4. Judicial Admissibility Callout, Bullets & Action Button</span>
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-slate-400 block mb-1">Callout Box Headline</label>
                        <input
                          type="text"
                          value={settings.section3Config?.calloutTitle ?? DEFAULT_SECTION3_CONFIG.calloutTitle}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              section3Config: {
                                ...(settings.section3Config || DEFAULT_SECTION3_CONFIG),
                                calloutTitle: e.target.value,
                              },
                            })
                          }
                          className="w-full rounded-xl bg-slate-950 p-2.5 text-white border border-white/10"
                        />
                      </div>

                      <div>
                        <label className="text-slate-400 block mb-1">Callout Description</label>
                        <input
                          type="text"
                          value={settings.section3Config?.calloutDesc ?? DEFAULT_SECTION3_CONFIG.calloutDesc}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              section3Config: {
                                ...(settings.section3Config || DEFAULT_SECTION3_CONFIG),
                                calloutDesc: e.target.value,
                              },
                            })
                          }
                          className="w-full rounded-xl bg-slate-950 p-2.5 text-slate-300 border border-white/10"
                        />
                      </div>
                    </div>

                    {/* Judicial Verification Bullets */}
                    <div className="space-y-2 p-3.5 rounded-2xl bg-slate-950/70 border border-white/10">
                      <label className="text-emerald-300 font-bold block">
                        Judicial Evidence Standard Bullets (FRE & DGCL)
                      </label>
                      
                      <div className="space-y-2">
                        <div>
                          <label className="text-[10px] text-slate-400 block">Bullet 1 (e.g. FRE 902(13))</label>
                          <input
                            type="text"
                            value={settings.section3Config?.calloutBullet1 ?? DEFAULT_SECTION3_CONFIG.calloutBullet1}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                section3Config: {
                                  ...(settings.section3Config || DEFAULT_SECTION3_CONFIG),
                                  calloutBullet1: e.target.value,
                                },
                              })
                            }
                            className="w-full rounded-xl bg-slate-900 p-2 text-slate-200 border border-white/10 text-xs"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-400 block">Bullet 2 (e.g. FRE 902(14))</label>
                          <input
                            type="text"
                            value={settings.section3Config?.calloutBullet2 ?? DEFAULT_SECTION3_CONFIG.calloutBullet2}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                section3Config: {
                                  ...(settings.section3Config || DEFAULT_SECTION3_CONFIG),
                                  calloutBullet2: e.target.value,
                                },
                              })
                            }
                            className="w-full rounded-xl bg-slate-900 p-2 text-slate-200 border border-white/10 text-xs"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-400 block">Bullet 3 (e.g. Delaware DGCL § 224)</label>
                          <input
                            type="text"
                            value={settings.section3Config?.calloutBullet3 ?? DEFAULT_SECTION3_CONFIG.calloutBullet3}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                section3Config: {
                                  ...(settings.section3Config || DEFAULT_SECTION3_CONFIG),
                                  calloutBullet3: e.target.value,
                                },
                              })
                            }
                            className="w-full rounded-xl bg-slate-900 p-2 text-slate-200 border border-white/10 text-xs"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-slate-400 block mb-1">CTA Button Text</label>
                        <input
                          type="text"
                          value={settings.section3Config?.ctaText ?? DEFAULT_SECTION3_CONFIG.ctaText}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              section3Config: {
                                ...(settings.section3Config || DEFAULT_SECTION3_CONFIG),
                                ctaText: e.target.value,
                              },
                            })
                          }
                          className="w-full rounded-xl bg-slate-950 p-2.5 text-white border border-white/10"
                        />
                      </div>

                      <div>
                        <label className="text-slate-400 block mb-1">CTA Button Target Link</label>
                        <input
                          type="text"
                          value={settings.section3Config?.ctaLink ?? DEFAULT_SECTION3_CONFIG.ctaLink}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              section3Config: {
                                ...(settings.section3Config || DEFAULT_SECTION3_CONFIG),
                                ctaLink: e.target.value,
                              },
                            })
                          }
                          className="w-full rounded-xl bg-slate-950 p-2.5 text-emerald-300 font-mono border border-white/10"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Save Section 3 Changes Button */}
                  <div className="pt-4 flex items-center justify-end">
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black font-extrabold text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                    >
                      {isSaving ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Saving Live Changes...</span>
                        </>
                      ) : saveSuccess ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-black" />
                          <span>Section 3 Saved to Live App!</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-3.5 h-3.5" />
                          <span>Save Section 3 Changes Live</span>
                        </>
                      )}
                    </button>
                  </div>

                </div>

                {/* SECTION 4: INTERACTIVE AUDITOR SANDBOX & RISK MATRIX CUSTOMIZER */}
                <div className="p-6 rounded-3xl bg-slate-900/70 border border-purple-500/30 space-y-6 backdrop-blur-xl shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                    <div className="space-y-1">
                      <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 text-[10px] font-mono font-bold uppercase tracking-wider">
                        <span>Section 4 CMS Engine</span>
                      </div>
                      <h3 className="font-bold text-lg text-white flex items-center gap-2">
                        <Cpu className="w-5 h-5 text-purple-400" />
                        <span>Interactive Auditor Sandbox & Simulator Customizer</span>
                      </h3>
                      <p className="text-slate-400 text-xs">
                        Configure the live interactive contract risk auditor, AI redlines sandbox, custom artwork, optical scanning beam animation, and notarization simulator.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSettings({
                            ...settings,
                            section4Config: { ...DEFAULT_SECTION4_CONFIG },
                          });
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs border border-white/10 transition-all flex items-center gap-1.5"
                      >
                        <RefreshCw className="w-3 h-3 text-slate-400" />
                        <span>Reset Defaults</span>
                      </button>
                    </div>
                  </div>

                  {/* Section 4 Badge & Header Texts */}
                  <div className="space-y-4 text-xs">
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1.5">
                        Section 4 Pill Badge Text
                      </label>
                      <input
                        type="text"
                        value={settings.section4Config?.badgeText ?? DEFAULT_SECTION4_CONFIG.badgeText}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            section4Config: {
                              ...(settings.section4Config || DEFAULT_SECTION4_CONFIG),
                              badgeText: e.target.value,
                            },
                          })
                        }
                        className="w-full rounded-xl bg-slate-950 p-3 text-white border border-white/10 focus:border-purple-500/40 focus:outline-none font-mono text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-slate-400 font-semibold mb-1.5">
                          Title Prefix
                        </label>
                        <input
                          type="text"
                          value={settings.section4Config?.titlePrefix ?? DEFAULT_SECTION4_CONFIG.titlePrefix}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              section4Config: {
                                ...(settings.section4Config || DEFAULT_SECTION4_CONFIG),
                                titlePrefix: e.target.value,
                              },
                            })
                          }
                          className="w-full rounded-xl bg-slate-950 p-3 text-white border border-white/10 focus:border-purple-500/40 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-purple-400 font-semibold mb-1.5">
                          Title Highlight (Neon Gradient)
                        </label>
                        <input
                          type="text"
                          value={settings.section4Config?.titleHighlight ?? DEFAULT_SECTION4_CONFIG.titleHighlight}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              section4Config: {
                                ...(settings.section4Config || DEFAULT_SECTION4_CONFIG),
                                titleHighlight: e.target.value,
                              },
                            })
                          }
                          className="w-full rounded-xl bg-slate-950 p-3 text-purple-300 font-bold border border-purple-500/30 focus:border-purple-500/60 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 font-semibold mb-1.5">
                          Title Suffix
                        </label>
                        <input
                          type="text"
                          value={settings.section4Config?.titleSuffix ?? DEFAULT_SECTION4_CONFIG.titleSuffix}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              section4Config: {
                                ...(settings.section4Config || DEFAULT_SECTION4_CONFIG),
                                titleSuffix: e.target.value,
                              },
                            })
                          }
                          className="w-full rounded-xl bg-slate-950 p-3 text-white border border-white/10 focus:border-purple-500/40 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-400 font-semibold mb-1.5">
                        Section Subheadline
                      </label>
                      <textarea
                        rows={2}
                        value={settings.section4Config?.subheadline ?? DEFAULT_SECTION4_CONFIG.subheadline}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            section4Config: {
                              ...(settings.section4Config || DEFAULT_SECTION4_CONFIG),
                              subheadline: e.target.value,
                            },
                          })
                        }
                        className="w-full rounded-xl bg-slate-950 p-3 text-white border border-white/10 focus:border-purple-500/40 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Artwork & Background Media */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2 border-t border-white/10">
                    <div className="space-y-3">
                      <label className="block text-slate-400 font-semibold">
                        Showcase Matrix Artwork Image URL
                      </label>
                      <input
                        type="text"
                        value={settings.section4Config?.showcaseImageUrl ?? DEFAULT_SECTION4_CONFIG.showcaseImageUrl}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            section4Config: {
                              ...(settings.section4Config || DEFAULT_SECTION4_CONFIG),
                              showcaseImageUrl: e.target.value,
                            },
                          })
                        }
                        className="w-full rounded-xl bg-slate-950 p-3 text-white border border-white/10 focus:border-purple-500/40 focus:outline-none font-mono text-xs"
                      />
                      <div className="relative h-28 rounded-xl overflow-hidden border border-white/10 bg-slate-950/80">
                        <img
                          src={settings.section4Config?.showcaseImageUrl || DEFAULT_SECTION4_CONFIG.showcaseImageUrl}
                          alt="Showcase Preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/images/section4_auditor_matrix.jpg";
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent flex items-end p-2.5">
                          <span className="text-[10px] text-purple-300 font-mono">
                            Matrix Artwork Active: {settings.section4Config?.showcaseImageUrl || DEFAULT_SECTION4_CONFIG.showcaseImageUrl}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="block text-slate-400 font-semibold">
                        Section Background Texture URL
                      </label>
                      <input
                        type="text"
                        value={settings.section4Config?.bgImageUrl ?? DEFAULT_SECTION4_CONFIG.bgImageUrl}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            section4Config: {
                              ...(settings.section4Config || DEFAULT_SECTION4_CONFIG),
                              bgImageUrl: e.target.value,
                            },
                          })
                        }
                        className="w-full rounded-xl bg-slate-950 p-3 text-white border border-white/10 focus:border-purple-500/40 focus:outline-none font-mono text-xs"
                      />
                      <div className="flex gap-2">
                        {["/images/cyber_legal_bg.jpg", "/images/hero_cyber_legal_bg.jpg", "/images/section4_auditor_matrix.jpg"].map((url) => (
                          <button
                            key={url}
                            type="button"
                            onClick={() =>
                              setSettings({
                                ...settings,
                                section4Config: {
                                  ...(settings.section4Config || DEFAULT_SECTION4_CONFIG),
                                  bgImageUrl: url,
                                },
                              })
                            }
                            className={`px-2 py-1 rounded-lg text-[10px] font-mono border transition-all ${
                              (settings.section4Config?.bgImageUrl ?? DEFAULT_SECTION4_CONFIG.bgImageUrl) === url
                                ? "bg-purple-500/20 text-purple-300 border-purple-500/40"
                                : "bg-slate-950 text-slate-400 border-white/10 hover:border-white/20"
                            }`}
                          >
                            Preset: {url.split("/").pop()}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Interactive Toggles & Controls */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-4 border-t border-white/10">
                    <label className="flex items-center gap-3 p-3 rounded-2xl bg-slate-950/60 border border-white/5 cursor-pointer hover:border-purple-500/30 transition-all">
                      <input
                        type="checkbox"
                        checked={settings.section4Config?.enableAnimatedBackground ?? DEFAULT_SECTION4_CONFIG.enableAnimatedBackground}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            section4Config: {
                              ...(settings.section4Config || DEFAULT_SECTION4_CONFIG),
                              enableAnimatedBackground: e.target.checked,
                            },
                          })
                        }
                        className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 bg-slate-900 border-white/20"
                      />
                      <div>
                        <span className="font-semibold text-white block">Enable Optical Scanner Animation Canvas</span>
                        <span className="text-slate-400 text-[11px]">Dynamic animated scanning laser beam & risk particle nodes in background</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-3 rounded-2xl bg-slate-950/60 border border-white/5 cursor-pointer hover:border-purple-500/30 transition-all">
                      <input
                        type="checkbox"
                        checked={settings.section4Config?.enableAnimatedGrid ?? DEFAULT_SECTION4_CONFIG.enableAnimatedGrid}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            section4Config: {
                              ...(settings.section4Config || DEFAULT_SECTION4_CONFIG),
                              enableAnimatedGrid: e.target.checked,
                            },
                          })
                        }
                        className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 bg-slate-900 border-white/20"
                      />
                      <div>
                        <span className="font-semibold text-white block">Enable Cyber Perspective Grid</span>
                        <span className="text-slate-400 text-[11px]">Subtle high-tech cyber perspective grid overlay for depth</span>
                      </div>
                    </label>
                  </div>

                  {/* Buttons & Headers */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs pt-4 border-t border-white/10">
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1.5">
                        Notarize CTA Button Label
                      </label>
                      <input
                        type="text"
                        value={settings.section4Config?.notarizeCtaText ?? DEFAULT_SECTION4_CONFIG.notarizeCtaText}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            section4Config: {
                              ...(settings.section4Config || DEFAULT_SECTION4_CONFIG),
                              notarizeCtaText: e.target.value,
                            },
                          })
                        }
                        className="w-full rounded-xl bg-slate-950 p-3 text-white border border-white/10 focus:border-purple-500/40 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1.5">
                        Custom Uploader Button Label
                      </label>
                      <input
                        type="text"
                        value={settings.section4Config?.customUploaderText ?? DEFAULT_SECTION4_CONFIG.customUploaderText}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            section4Config: {
                              ...(settings.section4Config || DEFAULT_SECTION4_CONFIG),
                              customUploaderText: e.target.value,
                            },
                          })
                        }
                        className="w-full rounded-xl bg-slate-950 p-3 text-white border border-white/10 focus:border-purple-500/40 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1.5">
                        Custom Uploader Destination Route
                      </label>
                      <input
                        type="text"
                        value={settings.section4Config?.customUploaderLink ?? DEFAULT_SECTION4_CONFIG.customUploaderLink}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            section4Config: {
                              ...(settings.section4Config || DEFAULT_SECTION4_CONFIG),
                              customUploaderLink: e.target.value,
                            },
                          })
                        }
                        className="w-full rounded-xl bg-slate-950 p-3 text-white border border-white/10 focus:border-purple-500/40 focus:outline-none font-mono text-xs"
                      />
                    </div>
                  </div>

                  {/* Save Section 4 Changes Button */}
                  <div className="pt-4 flex items-center justify-end">
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-500 via-indigo-600 to-cyan-500 hover:from-purple-400 hover:to-cyan-400 text-white font-extrabold text-xs shadow-lg shadow-purple-500/20 flex items-center gap-2 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                    >
                      {isSaving ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Saving Live Changes...</span>
                        </>
                      ) : saveSuccess ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                          <span>Section 4 Saved to Live App!</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-3.5 h-3.5" />
                          <span>Save Section 4 Changes Live</span>
                        </>
                      )}
                    </button>
                  </div>

                </div>

                {/* SECTION 5: MULTI-CHAIN SECURITY & CRYPTOGRAPHIC PROOF VAULT CUSTOMIZER */}
                <div className="p-6 rounded-3xl bg-slate-900/80 border border-blue-500/30 space-y-6 backdrop-blur-xl shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

                  {/* Header Strip */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-300 border border-blue-500/30">
                          Section 5
                        </span>
                        <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                          <Layers className="w-4 h-4 text-blue-400" />
                          <span>Multi-Chain Security & Live Proof Vault (FRE 902 & DGCL § 224)</span>
                        </h3>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        Full dynamic CMS control for multi-chain settlement layers (Base, ETH, Arbitrum, Polygon), Merkle root demo digests, statutory court compliance cards, and 8K vault artwork.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setSettings({
                          ...settings,
                          section5Config: { ...DEFAULT_SECTION5_CONFIG },
                        })
                      }
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-white/10 flex items-center gap-1.5 transition-all self-start sm:self-auto"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
                      <span>Reset Section 5 Defaults</span>
                    </button>
                  </div>

                  {/* 1. Badge & Headings */}
                  <div className="space-y-4 text-xs">
                    <h4 className="font-bold text-sm text-blue-300 flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      <span>1. Section 5 Header & Headlines</span>
                    </h4>

                    <div>
                      <label className="block text-slate-400 font-semibold mb-1.5">
                        Top Protocol Badge / Pill Text
                      </label>
                      <input
                        type="text"
                        value={settings.section5Config?.badgeText ?? DEFAULT_SECTION5_CONFIG.badgeText}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            section5Config: {
                              ...(settings.section5Config || DEFAULT_SECTION5_CONFIG),
                              badgeText: e.target.value,
                            },
                          })
                        }
                        className="w-full rounded-xl bg-slate-950 p-3 text-white border border-white/10 focus:border-blue-500/40 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-slate-400 font-semibold mb-1.5">
                          Headline Prefix
                        </label>
                        <input
                          type="text"
                          value={settings.section5Config?.titlePrefix ?? DEFAULT_SECTION5_CONFIG.titlePrefix}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              section5Config: {
                                ...(settings.section5Config || DEFAULT_SECTION5_CONFIG),
                                titlePrefix: e.target.value,
                              },
                            })
                          }
                          className="w-full rounded-xl bg-slate-950 p-3 text-white border border-white/10 focus:border-blue-500/40 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-400 font-semibold mb-1.5">
                          Headline Highlight (Gradient Text)
                        </label>
                        <input
                          type="text"
                          value={settings.section5Config?.titleHighlight ?? DEFAULT_SECTION5_CONFIG.titleHighlight}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              section5Config: {
                                ...(settings.section5Config || DEFAULT_SECTION5_CONFIG),
                                titleHighlight: e.target.value,
                              },
                            })
                          }
                          className="w-full rounded-xl bg-slate-950 p-3 text-blue-400 font-bold border border-white/10 focus:border-blue-500/40 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-400 font-semibold mb-1.5">
                          Headline Suffix
                        </label>
                        <input
                          type="text"
                          value={settings.section5Config?.titleSuffix ?? DEFAULT_SECTION5_CONFIG.titleSuffix}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              section5Config: {
                                ...(settings.section5Config || DEFAULT_SECTION5_CONFIG),
                                titleSuffix: e.target.value,
                              },
                            })
                          }
                          className="w-full rounded-xl bg-slate-950 p-3 text-white border border-white/10 focus:border-blue-500/40 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-400 font-semibold mb-1.5">
                        Subheadline Description Copy
                      </label>
                      <textarea
                        rows={2}
                        value={settings.section5Config?.subheadline ?? DEFAULT_SECTION5_CONFIG.subheadline}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            section5Config: {
                              ...(settings.section5Config || DEFAULT_SECTION5_CONFIG),
                              subheadline: e.target.value,
                            },
                          })
                        }
                        className="w-full rounded-xl bg-slate-950 p-3 text-white border border-white/10 focus:border-blue-500/40 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* 2. Visuals & 8K Vault Artwork */}
                  <div className="space-y-4 text-xs pt-4 border-t border-white/10">
                    <h4 className="font-bold text-sm text-blue-300 flex items-center gap-2">
                      <LayoutDashboard className="w-4 h-4" />
                      <span>2. Background Visuals & 8K Cryptographic Vault Artwork</span>
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Background Image Input */}
                      <div className="p-4 rounded-2xl bg-slate-950/70 border border-white/10 space-y-3">
                        <label className="block text-slate-300 font-bold">
                          Section 5 Ambient Cyber Background Image URL
                        </label>
                        <input
                          type="text"
                          value={settings.section5Config?.bgImageUrl ?? DEFAULT_SECTION5_CONFIG.bgImageUrl}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              section5Config: {
                                ...(settings.section5Config || DEFAULT_SECTION5_CONFIG),
                                bgImageUrl: e.target.value,
                              },
                            })
                          }
                          className="w-full rounded-xl bg-slate-900 p-2.5 text-white border border-white/10 font-mono text-[11px] focus:outline-none"
                        />

                        {/* Presets */}
                        <div className="flex flex-wrap gap-2 pt-1">
                          {[
                            "/images/hero_cyber_legal_bg.jpg",
                            "/images/cyber_legal_bg.jpg",
                            "/images/section5_multichain_vault.jpg",
                          ].map((preset) => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() =>
                                setSettings({
                                  ...settings,
                                  section5Config: {
                                    ...(settings.section5Config || DEFAULT_SECTION5_CONFIG),
                                    bgImageUrl: preset,
                                  },
                                })
                              }
                              className="px-2 py-1 rounded bg-slate-800 text-[10px] text-cyan-300 hover:bg-slate-700"
                            >
                              {preset.replace("/images/", "")}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Showcase Vault Artwork */}
                      <div className="p-4 rounded-2xl bg-slate-950/70 border border-white/10 space-y-3">
                        <label className="block text-slate-300 font-bold">
                          Cryptographic Proof Vault Master Artwork URL
                        </label>
                        <input
                          type="text"
                          value={settings.section5Config?.showcaseImageUrl ?? DEFAULT_SECTION5_CONFIG.showcaseImageUrl}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              section5Config: {
                                ...(settings.section5Config || DEFAULT_SECTION5_CONFIG),
                                showcaseImageUrl: e.target.value,
                              },
                            })
                          }
                          className="w-full rounded-xl bg-slate-900 p-2.5 text-white border border-white/10 font-mono text-[11px] focus:outline-none"
                        />

                        <div className="relative rounded-xl overflow-hidden border border-white/10 h-28">
                          <img
                            src={settings.section5Config?.showcaseImageUrl || DEFAULT_SECTION5_CONFIG.showcaseImageUrl}
                            alt="Section 5 Artwork Preview"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-[#040711]/40 flex items-end p-2">
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/70 text-cyan-300">
                              Active 8K Vault Artwork Preview
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Canvas Animation Toggles */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      <label className="flex items-center gap-3 p-3 rounded-2xl bg-slate-950/60 border border-white/5 cursor-pointer hover:border-blue-500/30 transition-all">
                        <input
                          type="checkbox"
                          checked={settings.section5Config?.enableAnimatedBackground ?? DEFAULT_SECTION5_CONFIG.enableAnimatedBackground}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              section5Config: {
                                ...(settings.section5Config || DEFAULT_SECTION5_CONFIG),
                                enableAnimatedBackground: e.target.checked,
                              },
                            })
                          }
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-slate-900 border-white/20"
                        />
                        <div>
                          <span className="font-semibold text-white block">Enable Multi-Chain Interactive Canvas</span>
                          <span className="text-slate-400 text-[11px]">Orbiting blockchain hubs with glowing cryptographic data packets</span>
                        </div>
                      </label>

                      <label className="flex items-center gap-3 p-3 rounded-2xl bg-slate-950/60 border border-white/5 cursor-pointer hover:border-blue-500/30 transition-all">
                        <input
                          type="checkbox"
                          checked={settings.section5Config?.enableAnimatedGrid ?? DEFAULT_SECTION5_CONFIG.enableAnimatedGrid}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              section5Config: {
                                ...(settings.section5Config || DEFAULT_SECTION5_CONFIG),
                                enableAnimatedGrid: e.target.checked,
                              },
                            })
                          }
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-slate-900 border-white/20"
                        />
                        <div>
                          <span className="font-semibold text-white block">Enable Cyber Perspective Grid Overlay</span>
                          <span className="text-slate-400 text-[11px]">Adds spatial depth and holographic lines beneath proof cards</span>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* 3. Proof Hashes & Court Admissibility Quote */}
                  <div className="space-y-4 text-xs pt-4 border-t border-white/10">
                    <h4 className="font-bold text-sm text-cyan-300 flex items-center gap-2">
                      <Cpu className="w-4 h-4" />
                      <span>3. Live Cryptographic Demo Digests & Statutory Quote</span>
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-slate-400 font-semibold mb-1">Merkle Root Demo Hash</label>
                        <input
                          type="text"
                          value={settings.section5Config?.merkleRootDemoHash ?? DEFAULT_SECTION5_CONFIG.merkleRootDemoHash}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              section5Config: {
                                ...(settings.section5Config || DEFAULT_SECTION5_CONFIG),
                                merkleRootDemoHash: e.target.value,
                              },
                            })
                          }
                          className="w-full rounded-xl bg-slate-950 p-2.5 font-mono text-[11px] text-cyan-300 border border-white/10"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-400 font-semibold mb-1">keccak256 Demo Hash</label>
                        <input
                          type="text"
                          value={settings.section5Config?.keccakDemoHash ?? DEFAULT_SECTION5_CONFIG.keccakDemoHash}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              section5Config: {
                                ...(settings.section5Config || DEFAULT_SECTION5_CONFIG),
                                keccakDemoHash: e.target.value,
                              },
                            })
                          }
                          className="w-full rounded-xl bg-slate-950 p-2.5 font-mono text-[11px] text-blue-300 border border-white/10"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-400 font-semibold mb-1">SHA-256 Demo Hash</label>
                        <input
                          type="text"
                          value={settings.section5Config?.sha256DemoHash ?? DEFAULT_SECTION5_CONFIG.sha256DemoHash}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              section5Config: {
                                ...(settings.section5Config || DEFAULT_SECTION5_CONFIG),
                                sha256DemoHash: e.target.value,
                              },
                            })
                          }
                          className="w-full rounded-xl bg-slate-950 p-2.5 font-mono text-[11px] text-purple-300 border border-white/10"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-400 font-semibold mb-1.5">
                        Court Admissibility Quote & BLI Accreditation
                      </label>
                      <textarea
                        rows={2}
                        value={settings.section5Config?.courtAdmissibilityQuote ?? DEFAULT_SECTION5_CONFIG.courtAdmissibilityQuote}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            section5Config: {
                              ...(settings.section5Config || DEFAULT_SECTION5_CONFIG),
                              courtAdmissibilityQuote: e.target.value,
                            },
                          })
                        }
                        className="w-full rounded-xl bg-slate-950 p-3 text-slate-200 border border-white/10 font-medium"
                      />
                    </div>
                  </div>

                  {/* 4. Multi-Chain EVM Smart Contract Addresses */}
                  <div className="space-y-4 text-xs pt-4 border-t border-white/10">
                    <h4 className="font-bold text-sm text-blue-300 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-blue-400" />
                      <span>4. Multi-Chain EVM Smart Contract Deployments (4 Networks)</span>
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(settings.section5Config?.chains || DEFAULT_SECTION5_CONFIG.chains).map((chain, cIdx) => (
                        <div key={chain.id || cIdx} className="p-4 rounded-2xl bg-slate-950/80 border border-white/10 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-white text-xs">{chain.name} ({chain.symbol})</span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-500/20 text-blue-300">
                              Chain ID: {chain.chainId}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] text-slate-500 block mb-1">Block Time</label>
                              <input
                                type="text"
                                value={chain.blockTime}
                                onChange={(e) => {
                                  const updatedChains = [...(settings.section5Config?.chains || DEFAULT_SECTION5_CONFIG.chains)];
                                  updatedChains[cIdx] = { ...updatedChains[cIdx], blockTime: e.target.value };
                                  setSettings({
                                    ...settings,
                                    section5Config: {
                                      ...(settings.section5Config || DEFAULT_SECTION5_CONFIG),
                                      chains: updatedChains,
                                    },
                                  });
                                }}
                                className="w-full rounded-xl bg-slate-900 p-2 text-white border border-white/10 font-mono text-xs"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-slate-500 block mb-1">Avg Gas Cost</label>
                              <input
                                type="text"
                                value={chain.avgGasCost}
                                onChange={(e) => {
                                  const updatedChains = [...(settings.section5Config?.chains || DEFAULT_SECTION5_CONFIG.chains)];
                                  updatedChains[cIdx] = { ...updatedChains[cIdx], avgGasCost: e.target.value };
                                  setSettings({
                                    ...settings,
                                    section5Config: {
                                      ...(settings.section5Config || DEFAULT_SECTION5_CONFIG),
                                      chains: updatedChains,
                                    },
                                  });
                                }}
                                className="w-full rounded-xl bg-slate-900 p-2 text-white border border-white/10 font-mono text-xs"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-[10px] text-slate-500 block mb-1">Contract Address</label>
                            <input
                              type="text"
                              value={chain.contractAddress}
                              onChange={(e) => {
                                const updatedChains = [...(settings.section5Config?.chains || DEFAULT_SECTION5_CONFIG.chains)];
                                updatedChains[cIdx] = { ...updatedChains[cIdx], contractAddress: e.target.value };
                                setSettings({
                                  ...settings,
                                  section5Config: {
                                    ...(settings.section5Config || DEFAULT_SECTION5_CONFIG),
                                    chains: updatedChains,
                                  },
                                });
                              }}
                              className="w-full rounded-xl bg-slate-900 p-2 text-cyan-300 border border-white/10 font-mono text-xs"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] text-slate-500 block mb-1">Block Explorer URL</label>
                            <input
                              type="text"
                              value={chain.explorerUrl}
                              onChange={(e) => {
                                const updatedChains = [...(settings.section5Config?.chains || DEFAULT_SECTION5_CONFIG.chains)];
                                updatedChains[cIdx] = { ...updatedChains[cIdx], explorerUrl: e.target.value };
                                setSettings({
                                  ...settings,
                                  section5Config: {
                                    ...(settings.section5Config || DEFAULT_SECTION5_CONFIG),
                                    chains: updatedChains,
                                  },
                                });
                              }}
                              className="w-full rounded-xl bg-slate-900 p-2 text-slate-300 border border-white/10 font-mono text-xs"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 5. CTAs & Save Button */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-4 border-t border-white/10">
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">
                        Vault Inspection CTA Button Label
                      </label>
                      <input
                        type="text"
                        value={settings.section5Config?.ctaText ?? DEFAULT_SECTION5_CONFIG.ctaText}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            section5Config: {
                              ...(settings.section5Config || DEFAULT_SECTION5_CONFIG),
                              ctaText: e.target.value,
                            },
                          })
                        }
                        className="w-full rounded-xl bg-slate-950 p-3 text-white border border-white/10"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">
                        Explorer CTA Button Label
                      </label>
                      <input
                        type="text"
                        value={settings.section5Config?.explorerCtaText ?? DEFAULT_SECTION5_CONFIG.explorerCtaText}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            section5Config: {
                              ...(settings.section5Config || DEFAULT_SECTION5_CONFIG),
                              explorerCtaText: e.target.value,
                            },
                          })
                        }
                        className="w-full rounded-xl bg-slate-950 p-3 text-white border border-white/10"
                      />
                    </div>
                  </div>

                  {/* Save Section 5 Changes Button */}
                  <div className="pt-4 flex items-center justify-end">
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 via-cyan-500 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-extrabold text-xs shadow-lg shadow-blue-500/20 flex items-center gap-2 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                    >
                      {isSaving ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Saving Live Changes...</span>
                        </>
                      ) : saveSuccess ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                          <span>Section 5 Saved to Live App!</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-3.5 h-3.5" />
                          <span>Save Section 5 Changes Live</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* SECTION 6: ENTERPRISE TIER PRICING & INSTITUTIONAL SLA CUSTOMIZER */}
                <div className="p-6 rounded-3xl bg-slate-900/80 border border-purple-500/30 space-y-6 backdrop-blur-xl shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

                  {/* Header Strip */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/10 text-purple-300 border border-purple-500/30">
                          Section 6
                        </span>
                        <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                          <Coins className="w-4 h-4 text-purple-400" />
                          <span>On-Chain Audit Micro-Packs & Protocol Treasury Architecture</span>
                        </h3>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        Full dynamic CMS control for the 3 Web3 on-chain micro-audit packs (Judge Free Pass, Starter Bundle, Pro Builder Pack), ETH prices, credits labels, and 1% non-custodial escrow protocol fee.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setSettings({
                          ...settings,
                          section6Config: { ...DEFAULT_SECTION6_CONFIG },
                        })
                      }
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-white/10 flex items-center gap-1.5 transition-all self-start sm:self-auto"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-purple-400" />
                      <span>Reset Section 6 Defaults</span>
                    </button>
                  </div>

                  {/* 1. Badge & Headings */}
                  <div className="space-y-4 text-xs">
                    <h4 className="font-bold text-sm text-purple-300 flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      <span>1. Section 6 Header, Headlines & Protocol Badge</span>
                    </h4>

                    <div>
                      <label className="block text-slate-400 font-semibold mb-1.5">
                        Top Protocol Badge / Pill Text
                      </label>
                      <input
                        type="text"
                        value={settings.section6Config?.badgeText ?? DEFAULT_SECTION6_CONFIG.badgeText}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            section6Config: {
                              ...(settings.section6Config || DEFAULT_SECTION6_CONFIG),
                              badgeText: e.target.value,
                            },
                          })
                        }
                        className="w-full rounded-xl bg-slate-950 p-3 text-white border border-white/10 focus:border-purple-500/40 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-slate-400 font-semibold mb-1.5">
                          Headline Prefix
                        </label>
                        <input
                          type="text"
                          value={settings.section6Config?.titlePrefix ?? DEFAULT_SECTION6_CONFIG.titlePrefix}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              section6Config: {
                                ...(settings.section6Config || DEFAULT_SECTION6_CONFIG),
                                titlePrefix: e.target.value,
                              },
                            })
                          }
                          className="w-full rounded-xl bg-slate-950 p-3 text-white border border-white/10 focus:border-purple-500/40 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-400 font-semibold mb-1.5">
                          Headline Highlight (Gradient Text)
                        </label>
                        <input
                          type="text"
                          value={settings.section6Config?.titleHighlight ?? DEFAULT_SECTION6_CONFIG.titleHighlight}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              section6Config: {
                                ...(settings.section6Config || DEFAULT_SECTION6_CONFIG),
                                titleHighlight: e.target.value,
                              },
                            })
                          }
                          className="w-full rounded-xl bg-slate-950 p-3 text-purple-400 font-bold border border-white/10 focus:border-purple-500/40 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-400 font-semibold mb-1.5">
                          Headline Suffix
                        </label>
                        <input
                          type="text"
                          value={settings.section6Config?.titleSuffix ?? DEFAULT_SECTION6_CONFIG.titleSuffix}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              section6Config: {
                                ...(settings.section6Config || DEFAULT_SECTION6_CONFIG),
                                titleSuffix: e.target.value,
                              },
                            })
                          }
                          className="w-full rounded-xl bg-slate-950 p-3 text-white border border-white/10 focus:border-purple-500/40 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div className="md:col-span-3">
                        <label className="block text-slate-400 font-semibold mb-1.5">
                          Subheadline Description Copy
                        </label>
                        <textarea
                          rows={2}
                          value={settings.section6Config?.subheadline ?? DEFAULT_SECTION6_CONFIG.subheadline}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              section6Config: {
                                ...(settings.section6Config || DEFAULT_SECTION6_CONFIG),
                                subheadline: e.target.value,
                              },
                            })
                          }
                          className="w-full rounded-xl bg-slate-950 p-3 text-white border border-white/10 focus:border-purple-500/40 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-400 font-semibold mb-1.5">
                          Protocol Fee Badge Pill
                        </label>
                        <input
                          type="text"
                          value={settings.section6Config?.protocolFeeBadge ?? DEFAULT_SECTION6_CONFIG.protocolFeeBadge}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              section6Config: {
                                ...(settings.section6Config || DEFAULT_SECTION6_CONFIG),
                                protocolFeeBadge: e.target.value,
                              },
                            })
                          }
                          className="w-full rounded-xl bg-slate-950 p-3 text-cyan-300 font-bold border border-white/10 focus:border-purple-500/40 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 2. Visuals & 8K Master Terminal Artwork */}
                  <div className="space-y-4 text-xs pt-4 border-t border-white/10">
                    <h4 className="font-bold text-sm text-purple-300 flex items-center gap-2">
                      <LayoutDashboard className="w-4 h-4" />
                      <span>2. Background Visuals & 8K Pricing Vault Artwork</span>
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Background Image Input */}
                      <div className="p-4 rounded-2xl bg-slate-950/70 border border-white/10 space-y-3">
                        <label className="block text-slate-300 font-bold">
                          Section 6 Cyber Background Image URL
                        </label>
                        <input
                          type="text"
                          value={settings.section6Config?.bgImageUrl ?? DEFAULT_SECTION6_CONFIG.bgImageUrl}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              section6Config: {
                                ...(settings.section6Config || DEFAULT_SECTION6_CONFIG),
                                bgImageUrl: e.target.value,
                              },
                            })
                          }
                          className="w-full rounded-xl bg-slate-900 p-2.5 text-white border border-white/10 font-mono text-[11px] focus:outline-none"
                        />

                        {/* Presets */}
                        <div className="flex flex-wrap gap-2 pt-1">
                          {[
                            "/images/hero_cyber_legal_bg.jpg",
                            "/images/cyber_legal_bg.jpg",
                            "/images/section6_enterprise_pricing.jpg",
                          ].map((preset) => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() =>
                                setSettings({
                                  ...settings,
                                  section6Config: {
                                    ...(settings.section6Config || DEFAULT_SECTION6_CONFIG),
                                    bgImageUrl: preset,
                                  },
                                })
                              }
                              className="px-2 py-1 rounded bg-slate-800 text-[10px] text-cyan-300 hover:bg-slate-700"
                            >
                              {preset.replace("/images/", "")}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Showcase Artwork */}
                      <div className="p-4 rounded-2xl bg-slate-950/70 border border-white/10 space-y-3">
                        <label className="block text-slate-300 font-bold">
                          Pricing Terminal Master Artwork URL
                        </label>
                        <input
                          type="text"
                          value={settings.section6Config?.showcaseImageUrl ?? DEFAULT_SECTION6_CONFIG.showcaseImageUrl}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              section6Config: {
                                ...(settings.section6Config || DEFAULT_SECTION6_CONFIG),
                                showcaseImageUrl: e.target.value,
                              },
                            })
                          }
                          className="w-full rounded-xl bg-slate-900 p-2.5 text-white border border-white/10 font-mono text-[11px] focus:outline-none"
                        />

                        <div className="relative rounded-xl overflow-hidden border border-white/10 h-28">
                          <img
                            src={settings.section6Config?.showcaseImageUrl || DEFAULT_SECTION6_CONFIG.showcaseImageUrl}
                            alt="Section 6 Artwork Preview"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-[#040711]/40 flex items-end p-2">
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/70 text-purple-300">
                              Active Pricing Terminal Artwork Preview
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Canvas Animation Toggle */}
                    <div className="pt-2">
                      <label className="flex items-center gap-3 p-3 rounded-2xl bg-slate-950/60 border border-white/5 cursor-pointer hover:border-purple-500/30 transition-all">
                        <input
                          type="checkbox"
                          checked={settings.section6Config?.enableAnimatedBackground ?? DEFAULT_SECTION6_CONFIG.enableAnimatedBackground}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              section6Config: {
                                ...(settings.section6Config || DEFAULT_SECTION6_CONFIG),
                                enableAnimatedBackground: e.target.checked,
                              },
                            })
                          }
                          className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 bg-slate-900 border-white/20"
                        />
                        <div>
                          <span className="font-semibold text-white block">Enable Cyber Tokens & Luminous Mesh Animation Canvas</span>
                          <span className="text-slate-400 text-[11px]">Floating golden, cyan, and amethyst cryptographic token particles with ambient grid</span>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* 3. The 3 Pricing Tiers CRUD */}
                  <div className="space-y-4 text-xs pt-4 border-t border-white/10">
                    <h4 className="font-bold text-sm text-cyan-300 flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      <span>3. Web3 Audit Micro-Packs Management (Judge Pass, Starter, Pro)</span>
                    </h4>

                    <div className="space-y-4">
                      {(settings.section6Config?.tiers || DEFAULT_SECTION6_CONFIG.tiers).map((tier, tIdx) => (
                        <div key={tier.id || tIdx} className="p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-white/10 space-y-4">
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold text-xs">
                                #{tIdx + 1}
                              </span>
                              <span className="font-bold text-white text-sm">{tier.name}</span>
                            </div>

                            <label className="flex items-center gap-2 text-xs text-cyan-300 font-semibold cursor-pointer">
                              <input
                                type="checkbox"
                                checked={tier.isPopular || false}
                                onChange={(e) => {
                                  const updatedTiers = [...(settings.section6Config?.tiers || DEFAULT_SECTION6_CONFIG.tiers)];
                                  updatedTiers[tIdx] = { ...updatedTiers[tIdx], isPopular: e.target.checked };
                                  setSettings({
                                    ...settings,
                                    section6Config: {
                                      ...(settings.section6Config || DEFAULT_SECTION6_CONFIG),
                                      tiers: updatedTiers,
                                    },
                                  });
                                }}
                                className="w-3.5 h-3.5 rounded text-cyan-500 focus:ring-0 bg-slate-900 border-white/20"
                              />
                              <span>Set as Most Popular Highlight</span>
                            </label>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                            <div>
                              <label className="text-[10px] text-slate-500 block mb-1">Bundle Title</label>
                              <input
                                type="text"
                                value={tier.name}
                                onChange={(e) => {
                                  const updatedTiers = [...(settings.section6Config?.tiers || DEFAULT_SECTION6_CONFIG.tiers)];
                                  updatedTiers[tIdx] = { ...updatedTiers[tIdx], name: e.target.value };
                                  setSettings({
                                    ...settings,
                                    section6Config: {
                                      ...(settings.section6Config || DEFAULT_SECTION6_CONFIG),
                                      tiers: updatedTiers,
                                    },
                                  });
                                }}
                                className="w-full rounded-xl bg-slate-900 p-2 text-white border border-white/10 font-bold"
                              />
                            </div>

                            <div>
                              <label className="text-[10px] text-slate-500 block mb-1">On-Chain Price (ETH)</label>
                              <input
                                type="text"
                                value={tier.priceEth}
                                onChange={(e) => {
                                  const updatedTiers = [...(settings.section6Config?.tiers || DEFAULT_SECTION6_CONFIG.tiers)];
                                  updatedTiers[tIdx] = { ...updatedTiers[tIdx], priceEth: e.target.value };
                                  setSettings({
                                    ...settings,
                                    section6Config: {
                                      ...(settings.section6Config || DEFAULT_SECTION6_CONFIG),
                                      tiers: updatedTiers,
                                    },
                                  });
                                }}
                                className="w-full rounded-xl bg-slate-900 p-2 text-cyan-300 border border-white/10 font-mono font-bold"
                              />
                            </div>

                            <div>
                              <label className="text-[10px] text-slate-500 block mb-1">Fiat Approx. ($)</label>
                              <input
                                type="text"
                                value={tier.priceUsdEquivalent}
                                onChange={(e) => {
                                  const updatedTiers = [...(settings.section6Config?.tiers || DEFAULT_SECTION6_CONFIG.tiers)];
                                  updatedTiers[tIdx] = { ...updatedTiers[tIdx], priceUsdEquivalent: e.target.value };
                                  setSettings({
                                    ...settings,
                                    section6Config: {
                                      ...(settings.section6Config || DEFAULT_SECTION6_CONFIG),
                                      tiers: updatedTiers,
                                    },
                                  });
                                }}
                                className="w-full rounded-xl bg-slate-900 p-2 text-slate-300 border border-white/10 font-mono"
                              />
                            </div>

                            <div>
                              <label className="text-[10px] text-slate-500 block mb-1">Credits Pill Text</label>
                              <input
                                type="text"
                                value={tier.creditsLabel}
                                onChange={(e) => {
                                  const updatedTiers = [...(settings.section6Config?.tiers || DEFAULT_SECTION6_CONFIG.tiers)];
                                  updatedTiers[tIdx] = { ...updatedTiers[tIdx], creditsLabel: e.target.value };
                                  setSettings({
                                    ...settings,
                                    section6Config: {
                                      ...(settings.section6Config || DEFAULT_SECTION6_CONFIG),
                                      tiers: updatedTiers,
                                    },
                                  });
                                }}
                                className="w-full rounded-xl bg-slate-900 p-2 text-purple-300 border border-white/10 font-mono font-bold"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <label className="text-[10px] text-slate-500 block mb-1">Plan Badge Pill</label>
                              <input
                                type="text"
                                value={tier.badge || ""}
                                onChange={(e) => {
                                  const updatedTiers = [...(settings.section6Config?.tiers || DEFAULT_SECTION6_CONFIG.tiers)];
                                  updatedTiers[tIdx] = { ...updatedTiers[tIdx], badge: e.target.value };
                                  setSettings({
                                    ...settings,
                                    section6Config: {
                                      ...(settings.section6Config || DEFAULT_SECTION6_CONFIG),
                                      tiers: updatedTiers,
                                    },
                                  });
                                }}
                                className="w-full rounded-xl bg-slate-900 p-2 text-slate-200 border border-white/10"
                              />
                            </div>

                            <div>
                              <label className="text-[10px] text-slate-500 block mb-1">CTA Button Text</label>
                              <input
                                type="text"
                                value={tier.ctaText}
                                onChange={(e) => {
                                  const updatedTiers = [...(settings.section6Config?.tiers || DEFAULT_SECTION6_CONFIG.tiers)];
                                  updatedTiers[tIdx] = { ...updatedTiers[tIdx], ctaText: e.target.value };
                                  setSettings({
                                    ...settings,
                                    section6Config: {
                                      ...(settings.section6Config || DEFAULT_SECTION6_CONFIG),
                                      tiers: updatedTiers,
                                    },
                                  });
                                }}
                                className="w-full rounded-xl bg-slate-900 p-2 text-white border border-white/10 font-bold"
                              />
                            </div>

                            <div>
                              <label className="text-[10px] text-slate-500 block mb-1">Action Type</label>
                              <select
                                value={tier.actionType}
                                onChange={(e) => {
                                  const updatedTiers = [...(settings.section6Config?.tiers || DEFAULT_SECTION6_CONFIG.tiers)];
                                  updatedTiers[tIdx] = { ...updatedTiers[tIdx], actionType: e.target.value as any };
                                  setSettings({
                                    ...settings,
                                    section6Config: {
                                      ...(settings.section6Config || DEFAULT_SECTION6_CONFIG),
                                      tiers: updatedTiers,
                                    },
                                  });
                                }}
                                className="w-full rounded-xl bg-slate-900 p-2 text-cyan-300 border border-white/10 font-mono text-xs"
                              >
                                <option value="sandbox">sandbox (Direct to /auditor)</option>
                                <option value="topup_starter">topup_starter (Open TopUp Modal)</option>
                                <option value="topup_pro">topup_pro (Open TopUp Modal)</option>
                                <option value="escrow">escrow (Direct to /vault)</option>
                              </select>
                            </div>
                          </div>

                          <div>
                            <label className="text-[10px] text-slate-500 block mb-1">Description</label>
                            <input
                              type="text"
                              value={tier.description}
                              onChange={(e) => {
                                const updatedTiers = [...(settings.section6Config?.tiers || DEFAULT_SECTION6_CONFIG.tiers)];
                                updatedTiers[tIdx] = { ...updatedTiers[tIdx], description: e.target.value };
                                setSettings({
                                  ...settings,
                                  section6Config: {
                                    ...(settings.section6Config || DEFAULT_SECTION6_CONFIG),
                                    tiers: updatedTiers,
                                  },
                                });
                              }}
                              className="w-full rounded-xl bg-slate-900 p-2 text-slate-300 border border-white/10"
                            />
                          </div>

                          {/* Features list */}
                          <div>
                            <label className="text-[10px] text-slate-500 block mb-1">
                              Features Checklist (One capability per line)
                            </label>
                            <textarea
                              rows={3}
                              value={tier.features.join("\n")}
                              onChange={(e) => {
                                const updatedTiers = [...(settings.section6Config?.tiers || DEFAULT_SECTION6_CONFIG.tiers)];
                                updatedTiers[tIdx] = {
                                  ...updatedTiers[tIdx],
                                  features: e.target.value.split("\n").filter((f) => f.trim().length > 0),
                                };
                                setSettings({
                                  ...settings,
                                  section6Config: {
                                    ...(settings.section6Config || DEFAULT_SECTION6_CONFIG),
                                    tiers: updatedTiers,
                                  },
                                });
                              }}
                              className="w-full rounded-xl bg-slate-900 p-2 text-slate-200 border border-white/10 font-mono text-[11px]"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 4. Escrow Protocol & Treasury Guarantee */}
                  <div className="space-y-4 text-xs pt-4 border-t border-white/10">
                    <h4 className="font-bold text-sm text-cyan-300 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4" />
                      <span>4. 1% Escrow Protocol Fee & Treasury Settlement Copy</span>
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-400 font-semibold mb-1">Escrow Protocol Title</label>
                        <input
                          type="text"
                          value={settings.section6Config?.escrowProtocolTitle ?? DEFAULT_SECTION6_CONFIG.escrowProtocolTitle}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              section6Config: {
                                ...(settings.section6Config || DEFAULT_SECTION6_CONFIG),
                                escrowProtocolTitle: e.target.value,
                              },
                            })
                          }
                          className="w-full rounded-xl bg-slate-950 p-2.5 text-white border border-white/10 font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-400 font-semibold mb-1">Owner Treasury Address</label>
                        <input
                          type="text"
                          value={settings.section6Config?.treasuryAddress ?? DEFAULT_SECTION6_CONFIG.treasuryAddress}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              section6Config: {
                                ...(settings.section6Config || DEFAULT_SECTION6_CONFIG),
                                treasuryAddress: e.target.value,
                              },
                            })
                          }
                          className="w-full rounded-xl bg-slate-950 p-2.5 text-cyan-300 border border-white/10 font-mono text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Escrow Description & Split</label>
                      <textarea
                        rows={2}
                        value={settings.section6Config?.escrowProtocolDesc ?? DEFAULT_SECTION6_CONFIG.escrowProtocolDesc}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            section6Config: {
                              ...(settings.section6Config || DEFAULT_SECTION6_CONFIG),
                              escrowProtocolDesc: e.target.value,
                            },
                          })
                        }
                        className="w-full rounded-xl bg-slate-950 p-2.5 text-slate-300 border border-white/10"
                      />
                    </div>
                  </div>

                  {/* Save Section 6 Changes Button */}
                  <div className="pt-4 flex items-center justify-end">
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-500 via-indigo-600 to-cyan-500 hover:from-purple-400 hover:to-cyan-400 text-white font-extrabold text-xs shadow-lg shadow-purple-500/20 flex items-center gap-2 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                    >
                      {isSaving ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Saving Live Changes...</span>
                        </>
                      ) : saveSuccess ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                          <span>Section 6 Saved to Live App!</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-3.5 h-3.5" />
                          <span>Save Section 6 Changes Live</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* SECTION 7: INTERACTIVE LEGAL & COMPLIANCE FAQ KNOWLEDGE VAULT CMS */}
                <div className="p-6 rounded-3xl bg-slate-900/70 border border-purple-500/30 space-y-6 backdrop-blur-xl shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

                  {/* Header & Reset */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono text-[10px] font-bold border border-purple-500/40">
                          SECTION 7 CMS
                        </span>
                        <h3 className="font-extrabold text-base sm:text-lg text-white flex items-center gap-2">
                          <Scale className="w-4 h-4 text-purple-400" />
                          <span>Interactive Legal & Compliance FAQ Jurisprudence CMS</span>
                        </h3>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        Manage statutory Q&As, Delaware DGCL § 224 citations, FRE Rule 902 standards, categories, master codex artwork, and canvas animations.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setSettings({
                          ...settings,
                          section7Config: { ...DEFAULT_SECTION7_CONFIG },
                        })
                      }
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-white/10 flex items-center gap-1.5 transition-all self-start sm:self-auto"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-purple-400" />
                      <span>Reset Section 7 Defaults</span>
                    </button>
                  </div>

                  {/* 1. Badge & Headings */}
                  <div className="space-y-4 text-xs">
                    <h4 className="font-bold text-sm text-purple-300 flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      <span>1. Section 7 Header, Headlines & Judicial Badge</span>
                    </h4>

                    <div>
                      <label className="block text-slate-400 font-semibold mb-1.5">
                        Top Judicial Badge / Pill Text
                      </label>
                      <input
                        type="text"
                        value={settings.section7Config?.badgeText ?? DEFAULT_SECTION7_CONFIG.badgeText}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            section7Config: {
                              ...(settings.section7Config || DEFAULT_SECTION7_CONFIG),
                              badgeText: e.target.value,
                            },
                          })
                        }
                        className="w-full rounded-xl bg-slate-950 p-3 text-white border border-white/10 focus:border-purple-500/40 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-slate-400 font-semibold mb-1.5">
                          Headline Prefix
                        </label>
                        <input
                          type="text"
                          value={settings.section7Config?.titlePrefix ?? DEFAULT_SECTION7_CONFIG.titlePrefix}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              section7Config: {
                                ...(settings.section7Config || DEFAULT_SECTION7_CONFIG),
                                titlePrefix: e.target.value,
                              },
                            })
                          }
                          className="w-full rounded-xl bg-slate-950 p-3 text-white border border-white/10 focus:border-purple-500/40 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-400 font-semibold mb-1.5">
                          Headline Highlight (Gradient Text)
                        </label>
                        <input
                          type="text"
                          value={settings.section7Config?.titleHighlight ?? DEFAULT_SECTION7_CONFIG.titleHighlight}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              section7Config: {
                                ...(settings.section7Config || DEFAULT_SECTION7_CONFIG),
                                titleHighlight: e.target.value,
                              },
                            })
                          }
                          className="w-full rounded-xl bg-slate-950 p-3 text-white border border-white/10 focus:border-purple-500/40 focus:outline-none font-bold text-purple-300"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-400 font-semibold mb-1.5">
                          Headline Suffix
                        </label>
                        <input
                          type="text"
                          value={settings.section7Config?.titleSuffix ?? DEFAULT_SECTION7_CONFIG.titleSuffix}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              section7Config: {
                                ...(settings.section7Config || DEFAULT_SECTION7_CONFIG),
                                titleSuffix: e.target.value,
                              },
                            })
                          }
                          className="w-full rounded-xl bg-slate-950 p-3 text-white border border-white/10 focus:border-purple-500/40 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-400 font-semibold mb-1.5">
                        Subheadline Description
                      </label>
                      <textarea
                        rows={2}
                        value={settings.section7Config?.subheadline ?? DEFAULT_SECTION7_CONFIG.subheadline}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            section7Config: {
                              ...(settings.section7Config || DEFAULT_SECTION7_CONFIG),
                              subheadline: e.target.value,
                            },
                          })
                        }
                        className="w-full rounded-xl bg-slate-950 p-3 text-white border border-white/10 focus:border-purple-500/40 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 font-semibold mb-1.5">
                        Statutory Compliance Standards Banner Text
                      </label>
                      <input
                        type="text"
                        value={settings.section7Config?.complianceBadge ?? DEFAULT_SECTION7_CONFIG.complianceBadge}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            section7Config: {
                              ...(settings.section7Config || DEFAULT_SECTION7_CONFIG),
                              complianceBadge: e.target.value,
                            },
                          })
                        }
                        className="w-full rounded-xl bg-slate-950 p-3 text-cyan-300 border border-white/10 focus:border-purple-500/40 focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  {/* 2. Visual Assets & Canvas Animation */}
                  <div className="space-y-4 text-xs pt-4 border-t border-white/10">
                    <h4 className="font-bold text-sm text-cyan-300 flex items-center gap-2">
                      <ImageIcon className="w-4 h-4" />
                      <span>2. Visual Assets, Background Texture & Cyber Canvas Animation</span>
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Background Texture URL */}
                      <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/10 space-y-3">
                        <label className="font-semibold text-slate-300 block">
                          Background Ambient Texture URL
                        </label>
                        <input
                          type="text"
                          value={settings.section7Config?.bgImageUrl ?? DEFAULT_SECTION7_CONFIG.bgImageUrl}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              section7Config: {
                                ...(settings.section7Config || DEFAULT_SECTION7_CONFIG),
                                bgImageUrl: e.target.value,
                              },
                            })
                          }
                          className="w-full rounded-xl bg-slate-900 p-2.5 text-white border border-white/10 font-mono text-[11px] focus:outline-none"
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setSettings({
                                ...settings,
                                section7Config: {
                                  ...(settings.section7Config || DEFAULT_SECTION7_CONFIG),
                                  bgImageUrl: "/images/hero_cyber_legal_bg.jpg",
                                },
                              })
                            }
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono border border-white/5"
                          >
                            Default Cyber Legal Mesh
                          </button>
                        </div>
                      </div>

                      {/* Showcase Artwork URL & Preview */}
                      <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/10 space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="font-semibold text-slate-300 block">
                            Section 7 Master Artwork (Codex Vault Terminal)
                          </label>
                          <button
                            type="button"
                            onClick={() =>
                              setSettings({
                                ...settings,
                                section7Config: {
                                  ...(settings.section7Config || DEFAULT_SECTION7_CONFIG),
                                  showcaseImageUrl: "/images/section7_legal_faq_vault.jpg",
                                },
                              })
                            }
                            className="text-[10px] text-purple-400 hover:underline font-mono"
                          >
                            Reset to 8K Codex
                          </button>
                        </div>

                        <input
                          type="text"
                          value={settings.section7Config?.showcaseImageUrl ?? DEFAULT_SECTION7_CONFIG.showcaseImageUrl}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              section7Config: {
                                ...(settings.section7Config || DEFAULT_SECTION7_CONFIG),
                                showcaseImageUrl: e.target.value,
                              },
                            })
                          }
                          className="w-full rounded-xl bg-slate-900 p-2.5 text-white border border-white/10 font-mono text-[11px] focus:outline-none"
                        />

                        <div className="relative rounded-xl overflow-hidden border border-white/10 h-28">
                          <img
                            src={settings.section7Config?.showcaseImageUrl || DEFAULT_SECTION7_CONFIG.showcaseImageUrl}
                            alt="Section 7 Artwork Preview"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-[#040711]/40 flex items-end p-2">
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/70 text-purple-300">
                              Active Codex Iustitiae Master View
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Canvas Animation Toggle */}
                    <div className="pt-2">
                      <label className="flex items-center gap-3 p-3 rounded-2xl bg-slate-950/60 border border-white/5 cursor-pointer hover:border-purple-500/30 transition-all">
                        <input
                          type="checkbox"
                          checked={settings.section7Config?.enableAnimatedBackground ?? DEFAULT_SECTION7_CONFIG.enableAnimatedBackground}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              section7Config: {
                                ...(settings.section7Config || DEFAULT_SECTION7_CONFIG),
                                enableAnimatedBackground: e.target.checked,
                              },
                            })
                          }
                          className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 bg-slate-900 border-white/20"
                        />
                        <div>
                          <span className="font-semibold text-white block">Enable Cyber Judicial Glyphs & Scales Animation Canvas</span>
                          <span className="text-slate-400 text-[11px]">Floating scales of justice, shields, evidentiary nodes, and matrix grids</span>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* 3. Complex Corporate / DAO Notice Box */}
                  <div className="space-y-4 text-xs pt-4 border-t border-white/10">
                    <h4 className="font-bold text-sm text-purple-300 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4" />
                      <span>3. Complex DAO / Corporate Advisory Box</span>
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-400 font-semibold mb-1">Advisory Title</label>
                        <input
                          type="text"
                          value={settings.section7Config?.supportNoticeTitle ?? DEFAULT_SECTION7_CONFIG.supportNoticeTitle}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              section7Config: {
                                ...(settings.section7Config || DEFAULT_SECTION7_CONFIG),
                                supportNoticeTitle: e.target.value,
                              },
                            })
                          }
                          className="w-full rounded-xl bg-slate-950 p-2.5 text-white border border-white/10 font-bold"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-slate-400 font-semibold mb-1">CTA Text</label>
                          <input
                            type="text"
                            value={settings.section7Config?.supportCtaText ?? DEFAULT_SECTION7_CONFIG.supportCtaText}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                section7Config: {
                                  ...(settings.section7Config || DEFAULT_SECTION7_CONFIG),
                                  supportCtaText: e.target.value,
                                },
                              })
                            }
                            className="w-full rounded-xl bg-slate-950 p-2.5 text-cyan-300 border border-white/10 font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 font-semibold mb-1">CTA Link</label>
                          <input
                            type="text"
                            value={settings.section7Config?.supportCtaLink ?? DEFAULT_SECTION7_CONFIG.supportCtaLink}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                section7Config: {
                                  ...(settings.section7Config || DEFAULT_SECTION7_CONFIG),
                                  supportCtaLink: e.target.value,
                                },
                              })
                            }
                            className="w-full rounded-xl bg-slate-950 p-2.5 text-slate-300 border border-white/10 font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Advisory Description</label>
                      <input
                        type="text"
                        value={settings.section7Config?.supportNoticeDesc ?? DEFAULT_SECTION7_CONFIG.supportNoticeDesc}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            section7Config: {
                              ...(settings.section7Config || DEFAULT_SECTION7_CONFIG),
                              supportNoticeDesc: e.target.value,
                            },
                          })
                        }
                        className="w-full rounded-xl bg-slate-950 p-2.5 text-slate-300 border border-white/10"
                      />
                    </div>
                  </div>

                  {/* 4. FAQ Questions CRUD */}
                  <div className="space-y-4 text-xs pt-4 border-t border-white/10">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-cyan-300 flex items-center gap-2">
                        <BookOpen className="w-4 h-4" />
                        <span>4. Statutory Q&A Items (BLI, Admissibility, Smart Contracts, Escrow)</span>
                      </h4>

                      <button
                        type="button"
                        onClick={() => {
                          const currentItems = settings.section7Config?.faqItems || DEFAULT_SECTION7_CONFIG.faqItems;
                          const newItem: Section7FaqItem = {
                            id: `faq-${Date.now()}`,
                            question: "New Legal Question Here",
                            answer: "Detailed statutory or architectural answer explaining how LexiGuard AI satisfies legal compliance.",
                            category: "bli",
                            badge: "Compliance Note",
                            citation: "BLI Standard § 1.0",
                          };
                          setSettings({
                            ...settings,
                            section7Config: {
                              ...(settings.section7Config || DEFAULT_SECTION7_CONFIG),
                              faqItems: [...currentItems, newItem],
                            },
                          });
                        }}
                        className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-semibold border border-cyan-500/40 flex items-center gap-1.5 transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add New Legal Question</span>
                      </button>
                    </div>

                    <div className="space-y-4">
                      {(settings.section7Config?.faqItems || DEFAULT_SECTION7_CONFIG.faqItems).map((faq, fIdx) => (
                        <div key={faq.id || fIdx} className="p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-white/10 space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center font-bold text-xs font-mono">
                                #{(fIdx + 1).toString().padStart(2, "0")}
                              </span>
                              <span className="font-bold text-white text-xs truncate max-w-sm">
                                {faq.question}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                const currentItems = settings.section7Config?.faqItems || DEFAULT_SECTION7_CONFIG.faqItems;
                                const filtered = currentItems.filter((_, idx) => idx !== fIdx);
                                setSettings({
                                  ...settings,
                                  section7Config: {
                                    ...(settings.section7Config || DEFAULT_SECTION7_CONFIG),
                                    faqItems: filtered,
                                  },
                                });
                              }}
                              className="p-1 rounded-lg bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 text-xs font-mono flex items-center gap-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Remove</span>
                            </button>
                          </div>

                          <div>
                            <label className="text-[10px] text-slate-500 block mb-1">Question</label>
                            <input
                              type="text"
                              value={faq.question}
                              onChange={(e) => {
                                const currentItems = [...(settings.section7Config?.faqItems || DEFAULT_SECTION7_CONFIG.faqItems)];
                                currentItems[fIdx] = { ...currentItems[fIdx], question: e.target.value };
                                setSettings({
                                  ...settings,
                                  section7Config: {
                                    ...(settings.section7Config || DEFAULT_SECTION7_CONFIG),
                                    faqItems: currentItems,
                                  },
                                });
                              }}
                              className="w-full rounded-xl bg-slate-900 p-2 text-white border border-white/10 font-bold"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] text-slate-500 block mb-1">Comprehensive Legal Answer</label>
                            <textarea
                              rows={3}
                              value={faq.answer}
                              onChange={(e) => {
                                const currentItems = [...(settings.section7Config?.faqItems || DEFAULT_SECTION7_CONFIG.faqItems)];
                                currentItems[fIdx] = { ...currentItems[fIdx], answer: e.target.value };
                                setSettings({
                                  ...settings,
                                  section7Config: {
                                    ...(settings.section7Config || DEFAULT_SECTION7_CONFIG),
                                    faqItems: currentItems,
                                  },
                                });
                              }}
                              className="w-full rounded-xl bg-slate-900 p-2 text-slate-200 border border-white/10 text-xs"
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <label className="text-[10px] text-slate-500 block mb-1">Category</label>
                              <select
                                value={faq.category}
                                onChange={(e) => {
                                  const currentItems = [...(settings.section7Config?.faqItems || DEFAULT_SECTION7_CONFIG.faqItems)];
                                  currentItems[fIdx] = { ...currentItems[fIdx], category: e.target.value as any };
                                  setSettings({
                                    ...settings,
                                    section7Config: {
                                      ...(settings.section7Config || DEFAULT_SECTION7_CONFIG),
                                      faqItems: currentItems,
                                    },
                                  });
                                }}
                                className="w-full rounded-xl bg-slate-900 p-2 text-cyan-300 border border-white/10 font-mono text-xs"
                              >
                                <option value="bli">bli (BLI Criteria)</option>
                                <option value="admissibility">admissibility (Court Admissibility)</option>
                                <option value="contracts">contracts (Smart Contracts & Gas)</option>
                                <option value="escrow">escrow (Escrow & Privacy)</option>
                                <option value="general">general (General)</option>
                              </select>
                            </div>

                            <div>
                              <label className="text-[10px] text-slate-500 block mb-1">Badge Pill</label>
                              <input
                                type="text"
                                value={faq.badge || ""}
                                onChange={(e) => {
                                  const currentItems = [...(settings.section7Config?.faqItems || DEFAULT_SECTION7_CONFIG.faqItems)];
                                  currentItems[fIdx] = { ...currentItems[fIdx], badge: e.target.value };
                                  setSettings({
                                    ...settings,
                                    section7Config: {
                                      ...(settings.section7Config || DEFAULT_SECTION7_CONFIG),
                                      faqItems: currentItems,
                                    },
                                  });
                                }}
                                className="w-full rounded-xl bg-slate-900 p-2 text-slate-200 border border-white/10 font-mono text-xs"
                              />
                            </div>

                            <div>
                              <label className="text-[10px] text-slate-500 block mb-1">Statute Citation Reference</label>
                              <input
                                type="text"
                                value={faq.citation || ""}
                                onChange={(e) => {
                                  const currentItems = [...(settings.section7Config?.faqItems || DEFAULT_SECTION7_CONFIG.faqItems)];
                                  currentItems[fIdx] = { ...currentItems[fIdx], citation: e.target.value };
                                  setSettings({
                                    ...settings,
                                    section7Config: {
                                      ...(settings.section7Config || DEFAULT_SECTION7_CONFIG),
                                      faqItems: currentItems,
                                    },
                                  });
                                }}
                                className="w-full rounded-xl bg-slate-900 p-2 text-purple-300 border border-white/10 font-mono text-xs"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Save Section 7 Changes Button */}
                  <div className="pt-4 flex items-center justify-end">
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-500 via-indigo-600 to-cyan-500 hover:from-purple-400 hover:to-cyan-400 text-white font-extrabold text-xs shadow-lg shadow-purple-500/20 flex items-center gap-2 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                    >
                      {isSaving ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Saving Live Changes...</span>
                        </>
                      ) : saveSuccess ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                          <span>Section 7 Saved to Live App!</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-3.5 h-3.5" />
                          <span>Save Section 7 Changes Live</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* SECTION 8: CYBER SECURITY LEGAL FOOTER & VERIFICATION EXPLORER CMS */}
                <div className="p-6 rounded-3xl bg-slate-900/70 border border-cyan-500/30 space-y-6 backdrop-blur-xl shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

                  {/* Header & Reset */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono text-[10px] font-bold border border-cyan-500/40">
                          SECTION 8 CMS
                        </span>
                        <h3 className="font-extrabold text-base sm:text-lg text-white flex items-center gap-2">
                          <Terminal className="w-4 h-4 text-cyan-400" />
                          <span>Cyber Security Legal Footer & Verification Explorer CMS</span>
                        </h3>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        Manage brand metadata, logo, Base Sepolia contract addresses, DoraHacks/BLI accreditations, copyright, and architect credits.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setSettings({
                          ...settings,
                          section8Config: { ...DEFAULT_SECTION8_CONFIG },
                        })
                      }
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-white/10 flex items-center gap-1.5 transition-all self-start sm:self-auto"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Reset Section 8 Defaults</span>
                    </button>
                  </div>

                  {/* 1. Brand Identity & Holographic Logo */}
                  <div className="space-y-4 text-xs">
                    <h4 className="font-bold text-sm text-cyan-300 flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      <span>1. Brand Identity, Mission Statement & Live Status Beacon</span>
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-slate-400 font-semibold mb-1.5">
                          Brand Title
                        </label>
                        <input
                          type="text"
                          value={settings.section8Config?.brandTitle ?? DEFAULT_SECTION8_CONFIG.brandTitle}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              section8Config: {
                                ...(settings.section8Config || DEFAULT_SECTION8_CONFIG),
                                brandTitle: e.target.value,
                              },
                            })
                          }
                          className="w-full rounded-xl bg-slate-950 p-3 text-white border border-white/10 focus:border-cyan-500/40 focus:outline-none font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-400 font-semibold mb-1.5">
                          Brand Tagline
                        </label>
                        <input
                          type="text"
                          value={settings.section8Config?.brandTagline ?? DEFAULT_SECTION8_CONFIG.brandTagline}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              section8Config: {
                                ...(settings.section8Config || DEFAULT_SECTION8_CONFIG),
                                brandTagline: e.target.value,
                              },
                            })
                          }
                          className="w-full rounded-xl bg-slate-950 p-3 text-cyan-300 border border-white/10 focus:border-cyan-500/40 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-400 font-semibold mb-1.5">
                        Brand Institutional Description
                      </label>
                      <textarea
                        rows={2}
                        value={settings.section8Config?.brandDescription ?? DEFAULT_SECTION8_CONFIG.brandDescription}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            section8Config: {
                              ...(settings.section8Config || DEFAULT_SECTION8_CONFIG),
                              brandDescription: e.target.value,
                            },
                          })
                        }
                        className="w-full rounded-xl bg-slate-950 p-3 text-white border border-white/10 focus:border-cyan-500/40 focus:outline-none text-xs"
                      />
                    </div>

                    {/* Logo Image URL & Live Status */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/10 space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="font-semibold text-slate-300 block">
                            Brand Logo Image URL
                          </label>
                          <button
                            type="button"
                            onClick={() =>
                              setSettings({
                                ...settings,
                                section8Config: {
                                  ...(settings.section8Config || DEFAULT_SECTION8_CONFIG),
                                  logoUrl: "/logo.png",
                                },
                              })
                            }
                            className="text-[10px] text-cyan-400 hover:underline font-mono"
                          >
                            Reset to /logo.png
                          </button>
                        </div>

                        <input
                          type="text"
                          value={settings.section8Config?.logoUrl ?? DEFAULT_SECTION8_CONFIG.logoUrl}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              section8Config: {
                                ...(settings.section8Config || DEFAULT_SECTION8_CONFIG),
                                logoUrl: e.target.value,
                              },
                            })
                          }
                          className="w-full rounded-xl bg-slate-900 p-2.5 text-white border border-white/10 font-mono text-[11px] focus:outline-none"
                        />

                        <div className="flex items-center gap-3 pt-1">
                          <div className="w-10 h-10 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                            <img
                              src={settings.section8Config?.logoUrl || DEFAULT_SECTION8_CONFIG.logoUrl}
                              alt="Logo Preview"
                              className="w-7 h-7 object-contain"
                            />
                          </div>
                          <span className="text-[11px] text-slate-400">Live Active Logo Preview</span>
                        </div>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/10 space-y-3">
                        <label className="font-semibold text-slate-300 block">
                          Live Node Heartbeat Status Text
                        </label>
                        <input
                          type="text"
                          value={settings.section8Config?.liveStatusText ?? DEFAULT_SECTION8_CONFIG.liveStatusText}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              section8Config: {
                                ...(settings.section8Config || DEFAULT_SECTION8_CONFIG),
                                liveStatusText: e.target.value,
                              },
                            })
                          }
                          className="w-full rounded-xl bg-slate-900 p-2.5 text-emerald-400 border border-white/10 font-mono text-[11px] focus:outline-none"
                        />

                        <label className="flex items-center gap-2 text-[11px] text-slate-300 pt-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.section8Config?.showLiveStatusBeacon ?? DEFAULT_SECTION8_CONFIG.showLiveStatusBeacon}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                section8Config: {
                                  ...(settings.section8Config || DEFAULT_SECTION8_CONFIG),
                                  showLiveStatusBeacon: e.target.checked,
                                },
                              })
                            }
                            className="w-3.5 h-3.5 rounded text-cyan-600 bg-slate-900 border-white/20"
                          />
                          <span>Show Pulsating Green Status Beacon in Footer</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* 2. Verified Smart Contract Notary Explorer Card */}
                  <div className="space-y-4 text-xs pt-4 border-t border-white/10">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-purple-300 flex items-center gap-2">
                        <Terminal className="w-4 h-4" />
                        <span>2. Verified Smart Contract Notary Explorer Card</span>
                      </h4>

                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.section8Config?.showContractCard ?? DEFAULT_SECTION8_CONFIG.showContractCard}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              section8Config: {
                                ...(settings.section8Config || DEFAULT_SECTION8_CONFIG),
                                showContractCard: e.target.checked,
                              },
                            })
                          }
                          className="w-3.5 h-3.5 rounded text-purple-600 bg-slate-900 border-white/20"
                        />
                        <span className="text-slate-300 text-[11px]">Show Explorer Card in Footer</span>
                      </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-400 font-semibold mb-1">Contract Card Title</label>
                        <input
                          type="text"
                          value={settings.section8Config?.contractCardTitle ?? DEFAULT_SECTION8_CONFIG.contractCardTitle}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              section8Config: {
                                ...(settings.section8Config || DEFAULT_SECTION8_CONFIG),
                                contractCardTitle: e.target.value,
                              },
                            })
                          }
                          className="w-full rounded-xl bg-slate-950 p-2.5 text-white border border-white/10 font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-400 font-semibold mb-1">Network Name & Tag</label>
                        <input
                          type="text"
                          value={settings.section8Config?.networkName ?? DEFAULT_SECTION8_CONFIG.networkName}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              section8Config: {
                                ...(settings.section8Config || DEFAULT_SECTION8_CONFIG),
                                networkName: e.target.value,
                              },
                            })
                          }
                          className="w-full rounded-xl bg-slate-950 p-2.5 text-cyan-300 border border-white/10 font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-400 font-semibold mb-1">Solidity Contract Address (0x...)</label>
                        <input
                          type="text"
                          value={settings.section8Config?.contractAddress ?? DEFAULT_SECTION8_CONFIG.contractAddress}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              section8Config: {
                                ...(settings.section8Config || DEFAULT_SECTION8_CONFIG),
                                contractAddress: e.target.value,
                              },
                            })
                          }
                          className="w-full rounded-xl bg-slate-950 p-2.5 text-cyan-300 border border-white/10 font-mono text-[11px]"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-400 font-semibold mb-1">BaseScan Explorer Link</label>
                        <input
                          type="text"
                          value={settings.section8Config?.explorerUrl ?? DEFAULT_SECTION8_CONFIG.explorerUrl}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              section8Config: {
                                ...(settings.section8Config || DEFAULT_SECTION8_CONFIG),
                                explorerUrl: e.target.value,
                              },
                            })
                          }
                          className="w-full rounded-xl bg-slate-950 p-2.5 text-slate-300 border border-white/10 font-mono text-[11px]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-400 font-semibold mb-1">Solidity Version & Relayer Note</label>
                        <input
                          type="text"
                          value={settings.section8Config?.contractSolidityVersion ?? DEFAULT_SECTION8_CONFIG.contractSolidityVersion}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              section8Config: {
                                ...(settings.section8Config || DEFAULT_SECTION8_CONFIG),
                                contractSolidityVersion: e.target.value,
                              },
                            })
                          }
                          className="w-full rounded-xl bg-slate-950 p-2.5 text-slate-200 border border-white/10 font-mono text-[11px]"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-400 font-semibold mb-1">Relayer Status Subtext</label>
                        <input
                          type="text"
                          value={settings.section8Config?.relayerStatusText ?? DEFAULT_SECTION8_CONFIG.relayerStatusText}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              section8Config: {
                                ...(settings.section8Config || DEFAULT_SECTION8_CONFIG),
                                relayerStatusText: e.target.value,
                              },
                            })
                          }
                          className="w-full rounded-xl bg-slate-950 p-2.5 text-slate-400 border border-white/10 font-mono text-[11px]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 3. Institutional & Hackathon Accreditations */}
                  <div className="space-y-4 text-xs pt-4 border-t border-white/10">
                    <h4 className="font-bold text-sm text-cyan-300 flex items-center gap-2">
                      <Award className="w-4 h-4" />
                      <span>3. Institutional & Hackathon Accreditations</span>
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-400 font-semibold mb-1">Hackathon Badge Pill</label>
                        <input
                          type="text"
                          value={settings.section8Config?.hackathonBadge ?? DEFAULT_SECTION8_CONFIG.hackathonBadge}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              section8Config: {
                                ...(settings.section8Config || DEFAULT_SECTION8_CONFIG),
                                hackathonBadge: e.target.value,
                              },
                            })
                          }
                          className="w-full rounded-xl bg-slate-950 p-2.5 text-cyan-300 border border-white/10 font-semibold"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-400 font-semibold mb-1">BLI Accreditation Text</label>
                        <input
                          type="text"
                          value={settings.section8Config?.bliAccreditation ?? DEFAULT_SECTION8_CONFIG.bliAccreditation}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              section8Config: {
                                ...(settings.section8Config || DEFAULT_SECTION8_CONFIG),
                                bliAccreditation: e.target.value,
                              },
                            })
                          }
                          className="w-full rounded-xl bg-slate-950 p-2.5 text-purple-300 border border-white/10 font-semibold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-400 font-semibold mb-1">Cogent Law Group Criteria Text</label>
                        <input
                          type="text"
                          value={settings.section8Config?.cogentAccreditation ?? DEFAULT_SECTION8_CONFIG.cogentAccreditation}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              section8Config: {
                                ...(settings.section8Config || DEFAULT_SECTION8_CONFIG),
                                cogentAccreditation: e.target.value,
                              },
                            })
                          }
                          className="w-full rounded-xl bg-slate-950 p-2.5 text-slate-200 border border-white/10"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-400 font-semibold mb-1">DoraHacks Entry URL</label>
                        <input
                          type="text"
                          value={settings.section8Config?.doraHacksLink ?? DEFAULT_SECTION8_CONFIG.doraHacksLink}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              section8Config: {
                                ...(settings.section8Config || DEFAULT_SECTION8_CONFIG),
                                doraHacksLink: e.target.value,
                              },
                            })
                          }
                          className="w-full rounded-xl bg-slate-950 p-2.5 text-slate-300 border border-white/10 font-mono text-[11px]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 4. Copyright, Architect Credits & Support */}
                  <div className="space-y-4 text-xs pt-4 border-t border-white/10">
                    <h4 className="font-bold text-sm text-purple-300 flex items-center gap-2">
                      <Scale className="w-4 h-4" />
                      <span>4. Copyright, Architect Credits & Support Concierge</span>
                    </h4>

                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Copyright Notice</label>
                      <input
                        type="text"
                        value={settings.section8Config?.copyrightText ?? DEFAULT_SECTION8_CONFIG.copyrightText}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            section8Config: {
                              ...(settings.section8Config || DEFAULT_SECTION8_CONFIG),
                              copyrightText: e.target.value,
                            },
                          })
                        }
                        className="w-full rounded-xl bg-slate-950 p-2.5 text-white border border-white/10"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-400 font-semibold mb-1">Architect Studio Name</label>
                        <input
                          type="text"
                          value={settings.section8Config?.architectStudio ?? DEFAULT_SECTION8_CONFIG.architectStudio}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              section8Config: {
                                ...(settings.section8Config || DEFAULT_SECTION8_CONFIG),
                                architectStudio: e.target.value,
                              },
                            })
                          }
                          className="w-full rounded-xl bg-slate-950 p-2.5 text-cyan-300 border border-white/10 font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-400 font-semibold mb-1">Lead Architect Name</label>
                        <input
                          type="text"
                          value={settings.section8Config?.architectName ?? DEFAULT_SECTION8_CONFIG.architectName}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              section8Config: {
                                ...(settings.section8Config || DEFAULT_SECTION8_CONFIG),
                                architectName: e.target.value,
                              },
                            })
                          }
                          className="w-full rounded-xl bg-slate-950 p-2.5 text-white border border-white/10"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-400 font-semibold mb-1">Architect Portfolio URL</label>
                        <input
                          type="text"
                          value={settings.section8Config?.architectPortfolioUrl ?? DEFAULT_SECTION8_CONFIG.architectPortfolioUrl}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              section8Config: {
                                ...(settings.section8Config || DEFAULT_SECTION8_CONFIG),
                                architectPortfolioUrl: e.target.value,
                              },
                            })
                          }
                          className="w-full rounded-xl bg-slate-950 p-2.5 text-cyan-300 border border-white/10 font-mono text-[11px]"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-400 font-semibold mb-1">Telegram Support / Concierge URL</label>
                        <input
                          type="text"
                          value={settings.section8Config?.supportTelegramUrl ?? DEFAULT_SECTION8_CONFIG.supportTelegramUrl}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              section8Config: {
                                ...(settings.section8Config || DEFAULT_SECTION8_CONFIG),
                                supportTelegramUrl: e.target.value,
                              },
                            })
                          }
                          className="w-full rounded-xl bg-slate-950 p-2.5 text-slate-300 border border-white/10 font-mono text-[11px]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 5. Visual Aesthetics & Ambient Glow */}
                  <div className="space-y-4 text-xs pt-4 border-t border-white/10">
                    <h4 className="font-bold text-sm text-cyan-300 flex items-center gap-2">
                      <ImageIcon className="w-4 h-4" />
                      <span>5. Visual Atmosphere & Subtle Ambient Lighting</span>
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
                      <div>
                        <label className="block text-slate-400 font-semibold mb-1">Background Ambient Texture URL</label>
                        <input
                          type="text"
                          value={settings.section8Config?.bgTextureUrl ?? DEFAULT_SECTION8_CONFIG.bgTextureUrl}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              section8Config: {
                                ...(settings.section8Config || DEFAULT_SECTION8_CONFIG),
                                bgTextureUrl: e.target.value,
                              },
                            })
                          }
                          className="w-full rounded-xl bg-slate-950 p-2.5 text-slate-300 border border-white/10 font-mono text-[11px]"
                        />
                      </div>

                      <div className="pt-4">
                        <label className="flex items-center gap-2 cursor-pointer p-3 rounded-xl bg-slate-950/60 border border-white/5 hover:border-cyan-500/20 transition-all">
                          <input
                            type="checkbox"
                            checked={settings.section8Config?.enableAmbientGlow ?? DEFAULT_SECTION8_CONFIG.enableAmbientGlow}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                section8Config: {
                                  ...(settings.section8Config || DEFAULT_SECTION8_CONFIG),
                                  enableAmbientGlow: e.target.checked,
                                },
                              })
                            }
                            className="w-4 h-4 rounded text-cyan-600 bg-slate-900 border-white/20"
                          />
                          <div>
                            <span className="font-semibold text-white block">Enable Radial Atmospheric Lighting Glow</span>
                            <span className="text-slate-400 text-[10px]">Subtle purple/cyan atmospheric glow behind footer grid</span>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Save Section 8 Changes Button */}
                  <div className="pt-4 flex items-center justify-end">
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold text-xs shadow-lg shadow-cyan-500/20 flex items-center gap-2 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                    >
                      {isSaving ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Saving Live Changes...</span>
                        </>
                      ) : saveSuccess ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                          <span>Section 8 Saved to Live App!</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-3.5 h-3.5" />
                          <span>Save Section 8 Changes Live</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* ANNOUNCEMENT BANNER & GLOBAL MODULES */}
                <div className="p-6 rounded-3xl bg-slate-900/70 border border-white/10 space-y-5 backdrop-blur-xl shadow-xl">
                  <h3 className="font-bold text-base text-white flex items-center gap-2">
                    <Globe className="w-4 h-4 text-cyan-400" />
                    <span>Global Announcement & Feature Modules</span>
                  </h3>

                  <div className="space-y-4 text-xs">
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1.5">
                        Global Top Announcement Banner Text
                      </label>
                      <input
                        type="text"
                        value={settings.announcementText}
                        onChange={(e) => setSettings({ ...settings, announcementText: e.target.value })}
                        className="w-full rounded-xl bg-slate-950 p-3 text-white border border-white/10 focus:border-cyan-500/40 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/10 space-y-3 text-xs">
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
                {/* 1. Protocol Fee & Treasury Recipient Card */}
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

                {/* 2. EVM Blockchain Network Mode (Testnet vs Mainnet) */}
                <div className="p-6 rounded-3xl bg-slate-900/70 border border-white/10 space-y-5 backdrop-blur-xl shadow-xl">
                  <div className="border-b border-white/10 pb-4">
                    <h3 className="font-bold text-base text-white flex items-center gap-2">
                      <Globe className="w-4 h-4 text-cyan-400" />
                      <span>EVM Network Governance Mode (Testnet vs Mainnet)</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Choose whether LexiGuard operates on Base Sepolia Testnet for zero-cost hackathon evaluation or Base Mainnet for production live crypto settlements.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Option 1: Base Sepolia Testnet */}
                    <div
                      onClick={() => setSettings({ ...settings, networkMode: "testnet" })}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                        settings.networkMode !== "mainnet"
                          ? "bg-cyan-500/10 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.2)]"
                          : "bg-slate-950/60 border-white/5 hover:border-white/20 opacity-70"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🔵</span>
                          <span className="font-bold text-sm text-white">Base Sepolia Testnet</span>
                        </div>
                        {settings.networkMode !== "mainnet" && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                            Active Mode
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Safe testing environment for the BLI Hackathon. Uses free Sepolia ETH with zero financial risk.
                      </p>
                      <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-slate-400">
                        <span>Chain ID: 84532</span>
                        <span className="text-cyan-400">sepolia.basescan.org</span>
                      </div>
                    </div>

                    {/* Option 2: Base Mainnet Production */}
                    <div
                      onClick={() => setSettings({ ...settings, networkMode: "mainnet" })}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                        settings.networkMode === "mainnet"
                          ? "bg-emerald-500/10 border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                          : "bg-slate-950/60 border-white/5 hover:border-white/20 opacity-70"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🛡️</span>
                          <span className="font-bold text-sm text-white">Base Mainnet (Production)</span>
                        </div>
                        {settings.networkMode === "mainnet" && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                            Active Mode
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Live EVM Layer-2 production network. Top-up payments and notarizations settle on Base Mainnet with real ETH.
                      </p>
                      <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-slate-400">
                        <span>Chain ID: 8453</span>
                        <span className="text-emerald-400">basescan.org</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. InnoXpert Instant Guest Sandbox Governance Toggle */}
                <div className="p-6 rounded-3xl bg-slate-900/70 border border-white/10 space-y-4 backdrop-blur-xl shadow-xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                    <div>
                      <h3 className="font-bold text-base text-white flex items-center gap-2">
                        <Zap className="w-4 h-4 text-purple-400" />
                        <span>InnoXpert Instant Guest Sandbox (Relayer Mode)</span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">
                        Control whether guests can test with the InnoXpert pre-funded relayer key or must connect a real Web3 browser wallet (MetaMask).
                      </p>
                    </div>

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold border shrink-0 ${
                        settings.enableGuestSandbox !== false
                          ? "bg-purple-500/15 text-purple-300 border-purple-500/30"
                          : "bg-rose-500/15 text-rose-300 border-rose-500/30"
                      }`}
                    >
                      {settings.enableGuestSandbox !== false ? "Sandbox Enabled" : "Sandbox Disabled (Real Wallets Only)"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-950/70 border border-white/5">
                    <div className="space-y-1 pr-4">
                      <p className="text-xs font-bold text-white">
                        Allow 1-Click Guest Testing Without Extension
                      </p>
                      <p className="text-[11px] text-slate-400">
                        When enabled, hackathon judges without MetaMask can test seamlessly. When disabled, only genuine MetaMask user wallets can interact and balances are 100% user-funded.
                      </p>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={settings.enableGuestSandbox !== false}
                        onChange={(e) =>
                          setSettings({ ...settings, enableGuestSandbox: e.target.checked })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>
                </div>

                {/* Save Changes Button */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  {saveSuccess && (
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                      Treasury & Network Governance Saved!
                    </span>
                  )}
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSaving ? "Saving Governance..." : "Save Treasury & Network Governance"}</span>
                  </button>
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

            {/* TAB 4: CONTRACTORS & MILESTONE RATES STUDIO */}
            {activeTab === "contractors" && (
              <div className="space-y-6 animate-in fade-in">
                {/* STUDIO HEADER */}
                <div className="p-6 rounded-3xl bg-slate-900/80 border border-white/10 backdrop-blur-xl shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
                  <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                          ⚡ Admin Rate Controller
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live Base Sepolia Sync
                        </span>
                      </div>
                      <h2 className="text-xl md:text-2xl font-black text-white">
                        Contractor Milestone Rates &amp; Escrow Studio
                      </h2>
                      <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                        Manage Contractor Service Levels (Level 1 Express, Level 2 Standard, Level 3 Enterprise rates), delivery turnarounds, deliverable scopes, and global Escrow Vault multipliers (1–4 Milestones).
                      </p>
                    </div>

                    {/* Sub-Tab Navigation */}
                    <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-slate-950/80 border border-white/10 shrink-0">
                      <button
                        type="button"
                        onClick={() => setContractorSubTab("tiers")}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                          contractorSubTab === "tiers"
                            ? "bg-cyan-500 text-black shadow-lg shadow-cyan-500/20"
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Contractor Rates (L1/L2/L3)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setContractorSubTab("milestones")}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                          contractorSubTab === "milestones"
                            ? "bg-purple-500 text-white shadow-lg shadow-purple-500/20"
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>Vault Multipliers (1-4)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setContractorSubTab("directory")}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                          contractorSubTab === "directory"
                            ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20"
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Directory ({contractorsList.length})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setContractorSubTab("bulk")}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                          contractorSubTab === "bulk"
                            ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20"
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        <Sliders className="w-3.5 h-3.5" />
                        <span>Bulk Calibrator</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* SUBTAB 1: CONTRACTOR SERVICE PACKAGES & RATES */}
                {contractorSubTab === "tiers" && (
                  <div className="space-y-6">
                    {/* Contractor Selection Strip */}
                    <div className="p-5 rounded-3xl bg-slate-900/70 border border-white/10 space-y-3 backdrop-blur-xl">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-bold text-sm text-white flex items-center gap-2">
                            <span>Select Contractor to Configure Milestone Rates</span>
                          </h3>
                          <p className="text-[11px] text-slate-400">Click any contractor below to customize their Level 1, 2, and 3 milestone pricing packages</p>
                        </div>
                        <span className="text-[11px] font-mono text-cyan-400 font-bold">
                          {contractorsList.length} Active Contractors
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {contractorsList.map((c) => {
                          const isSelected =
                            selectedContractorWallet.toLowerCase() === c.walletAddress.toLowerCase();
                          const l1 = c.pricingTiers?.find((t) => t.tierId === "level_1")?.priceEth || c.hourlyRateEth;
                          const l2 = c.pricingTiers?.find((t) => t.tierId === "level_2")?.priceEth || (parseFloat(l1) * 2.5).toFixed(5);
                          const l3 = c.pricingTiers?.find((t) => t.tierId === "level_3")?.priceEth || (parseFloat(l1) * 5).toFixed(5);

                          return (
                            <button
                              type="button"
                              key={c.walletAddress}
                              onClick={() => setSelectedContractorWallet(c.walletAddress)}
                              className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden group ${
                                isSelected
                                  ? "bg-cyan-500/15 border-cyan-500 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-500/50"
                                  : "bg-slate-950/70 border-white/5 hover:border-white/20 hover:bg-slate-950"
                              }`}
                            >
                              <div className="flex items-start justify-between mb-1.5">
                                <div className="font-bold text-xs text-white group-hover:text-cyan-300 transition-colors">
                                  {c.fullName}
                                </div>
                                {isSelected ? (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-cyan-500 text-black">
                                    ACTIVE
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-mono text-slate-500">
                                    {c.walletAddress.slice(0, 4)}...{c.walletAddress.slice(-3)}
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-400 truncate mb-2.5">
                                {c.roleTitle}
                              </div>
                              <div className="grid grid-cols-3 gap-1 text-[9px] font-mono text-center pt-2 border-t border-white/5">
                                <div className="p-1 rounded bg-black/40">
                                  <div className="text-slate-500">L1</div>
                                  <div className="text-cyan-400 font-bold truncate">{l1}</div>
                                </div>
                                <div className="p-1 rounded bg-black/40">
                                  <div className="text-slate-500">L2</div>
                                  <div className="text-purple-400 font-bold truncate">{l2}</div>
                                </div>
                                <div className="p-1 rounded bg-black/40">
                                  <div className="text-slate-500">L3</div>
                                  <div className="text-emerald-400 font-bold truncate">{l3}</div>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Active Contractor Milestone Rates Form */}
                    {editingContractor && (
                      <form onSubmit={handleSaveContractorRates} className="space-y-5">
                        <div className="p-6 rounded-3xl bg-slate-900/80 border border-white/10 backdrop-blur-xl shadow-xl space-y-6">
                          {/* Contractor Meta Row */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/10">
                            <div>
                              <div className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-1">
                                Currently Editing Milestone Rates For:
                              </div>
                              <div className="flex items-center gap-2.5">
                                <h3 className="text-lg font-black text-white">
                                  {editingContractor.fullName}
                                </h3>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                  {editingContractor.companyName || "Verified Studio"}
                                </span>
                              </div>
                              <div className="text-xs text-cyan-300 font-mono mt-0.5">
                                Payout Address: {editingContractor.walletAddress}
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <div>
                                <label className="text-[10px] text-slate-400 font-bold block mb-1">
                                  Base Hourly Rate (ETH)
                                </label>
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="text"
                                    value={editingContractor.hourlyRateEth}
                                    onChange={(e) =>
                                      setEditingContractor({
                                        ...editingContractor,
                                        hourlyRateEth: e.target.value,
                                      })
                                    }
                                    className="w-28 rounded-xl bg-slate-950 px-3 py-2 text-xs font-mono font-bold text-amber-300 border border-white/10 focus:border-amber-400 focus:outline-none"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const cur = parseFloat(editingContractor.hourlyRateEth || "0.00010");
                                      setEditingContractor({
                                        ...editingContractor,
                                        hourlyRateEth: (cur + 0.00002).toFixed(5),
                                      });
                                    }}
                                    className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-xs font-bold"
                                    title="Increase +0.00002 ETH"
                                  >
                                    +
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const cur = parseFloat(editingContractor.hourlyRateEth || "0.00010");
                                      setEditingContractor({
                                        ...editingContractor,
                                        hourlyRateEth: Math.max(0.00002, cur - 0.00002).toFixed(5),
                                      });
                                    }}
                                    className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-xs font-bold"
                                    title="Decrease -0.00002 ETH"
                                  >
                                    -
                                  </button>
                                </div>
                              </div>

                              <div>
                                <label className="text-[10px] text-slate-400 font-bold block mb-1">
                                  Max Escrow Capacity
                                </label>
                                <input
                                  type="text"
                                  value={editingContractor.maxCapacityEth || "0.05"}
                                  onChange={(e) =>
                                    setEditingContractor({
                                      ...editingContractor,
                                      maxCapacityEth: e.target.value,
                                    })
                                  }
                                  className="w-24 rounded-xl bg-slate-950 px-3 py-2 text-xs font-mono text-slate-200 border border-white/10 focus:border-cyan-400 focus:outline-none"
                                />
                              </div>
                            </div>
                          </div>

                          {/* 3 DISTINCT PRICING TIER PACKAGES */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            {/* LEVEL 1: EXPRESS */}
                            {(() => {
                              const t1 = editingContractor.pricingTiers?.find((t) => t.tierId === "level_1") || {
                                tierId: "level_1" as const,
                                title: "Level 1: Express AI Clause Audit",
                                priceEth: editingContractor.hourlyRateEth || "0.00010",
                                turnaround: "24 Hours",
                                scopeSummary: "Rapid smart contract clause review, vulnerability identification, and compliance verification report.",
                              };

                              const updateT1 = (field: keyof PricingTier, val: string) => {
                                const tiers = [...(editingContractor.pricingTiers || [])];
                                const idx = tiers.findIndex((t) => t.tierId === "level_1");
                                const updated = { ...t1, [field]: val };
                                if (idx >= 0) tiers[idx] = updated;
                                else tiers.push(updated);
                                setEditingContractor({ ...editingContractor, pricingTiers: tiers });
                              };

                              return (
                                <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 space-y-3 relative overflow-hidden">
                                  <div className="flex items-center justify-between pb-2 border-b border-cyan-500/20">
                                    <span className="text-xs font-black text-cyan-300 flex items-center gap-1.5">
                                      <Zap className="w-3.5 h-3.5 text-cyan-400" /> Level 1: Starter / Express
                                    </span>
                                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold">
                                      {t1.priceEth} ETH
                                    </span>
                                  </div>

                                  <div>
                                    <label className="text-[10px] text-slate-400 font-bold block mb-1">
                                      Milestone Package Title
                                    </label>
                                    <input
                                      type="text"
                                      value={t1.title}
                                      onChange={(e) => updateT1("title", e.target.value)}
                                      className="w-full rounded-xl bg-slate-950 p-2 text-xs font-semibold text-white border border-cyan-500/20 focus:border-cyan-400 focus:outline-none"
                                    />
                                  </div>

                                  <div>
                                    <label className="text-[10px] text-slate-400 font-bold block mb-1">
                                      Milestone Price (ETH)
                                    </label>
                                    <input
                                      type="text"
                                      value={t1.priceEth}
                                      onChange={(e) => updateT1("priceEth", e.target.value)}
                                      className="w-full rounded-xl bg-slate-950 p-2 text-xs font-mono font-bold text-cyan-300 border border-cyan-500/20 focus:border-cyan-400 focus:outline-none"
                                    />
                                  </div>

                                  <div>
                                    <div className="flex items-center justify-between mb-1">
                                      <label className="text-[10px] text-slate-400 font-bold">
                                        Turnaround Delivery Time
                                      </label>
                                      <div className="flex gap-1">
                                        {["12 Hours", "24 Hours", "48 Hours"].map((preset) => (
                                          <button
                                            type="button"
                                            key={preset}
                                            onClick={() => updateT1("turnaround", preset)}
                                            className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 hover:bg-cyan-500/30 text-slate-300"
                                          >
                                            {preset}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                    <input
                                      type="text"
                                      value={t1.turnaround}
                                      onChange={(e) => updateT1("turnaround", e.target.value)}
                                      className="w-full rounded-xl bg-slate-950 p-2 text-xs text-slate-300 border border-cyan-500/20 focus:border-cyan-400 focus:outline-none"
                                    />
                                  </div>

                                  <div>
                                    <label className="text-[10px] text-slate-400 font-bold block mb-1">
                                      Deliverable Scope Summary
                                    </label>
                                    <textarea
                                      rows={3}
                                      value={t1.scopeSummary}
                                      onChange={(e) => updateT1("scopeSummary", e.target.value)}
                                      className="w-full rounded-xl bg-slate-950 p-2 text-[11px] text-slate-300 border border-cyan-500/20 focus:border-cyan-400 focus:outline-none"
                                    />
                                  </div>
                                </div>
                              );
                            })()}

                            {/* LEVEL 2: STANDARD */}
                            {(() => {
                              const t2 = editingContractor.pricingTiers?.find((t) => t.tierId === "level_2") || {
                                tierId: "level_2" as const,
                                title: "Level 2: Comprehensive Architecture & Security",
                                priceEth: (parseFloat(editingContractor.hourlyRateEth || "0.00010") * 2.5).toFixed(5),
                                turnaround: "3 Days",
                                scopeSummary: "Full-stack EVM architecture review, escrow state machine verification, and custom legal contract synthesizer.",
                              };

                              const updateT2 = (field: keyof PricingTier, val: string) => {
                                const tiers = [...(editingContractor.pricingTiers || [])];
                                const idx = tiers.findIndex((t) => t.tierId === "level_2");
                                const updated = { ...t2, [field]: val };
                                if (idx >= 0) tiers[idx] = updated;
                                else tiers.push(updated);
                                setEditingContractor({ ...editingContractor, pricingTiers: tiers });
                              };

                              return (
                                <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/30 space-y-3 relative overflow-hidden">
                                  <div className="flex items-center justify-between pb-2 border-b border-purple-500/20">
                                    <span className="text-xs font-black text-purple-300 flex items-center gap-1.5">
                                      <Shield className="w-3.5 h-3.5 text-purple-400" /> Level 2: Standard
                                    </span>
                                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold">
                                      {t2.priceEth} ETH
                                    </span>
                                  </div>

                                  <div>
                                    <label className="text-[10px] text-slate-400 font-bold block mb-1">
                                      Milestone Package Title
                                    </label>
                                    <input
                                      type="text"
                                      value={t2.title}
                                      onChange={(e) => updateT2("title", e.target.value)}
                                      className="w-full rounded-xl bg-slate-950 p-2 text-xs font-semibold text-white border border-purple-500/20 focus:border-purple-400 focus:outline-none"
                                    />
                                  </div>

                                  <div>
                                    <label className="text-[10px] text-slate-400 font-bold block mb-1">
                                      Milestone Price (ETH)
                                    </label>
                                    <input
                                      type="text"
                                      value={t2.priceEth}
                                      onChange={(e) => updateT2("priceEth", e.target.value)}
                                      className="w-full rounded-xl bg-slate-950 p-2 text-xs font-mono font-bold text-purple-300 border border-purple-500/20 focus:border-purple-400 focus:outline-none"
                                    />
                                  </div>

                                  <div>
                                    <div className="flex items-center justify-between mb-1">
                                      <label className="text-[10px] text-slate-400 font-bold">
                                        Turnaround Delivery Time
                                      </label>
                                      <div className="flex gap-1">
                                        {["2 Days", "3 Days", "5 Days"].map((preset) => (
                                          <button
                                            type="button"
                                            key={preset}
                                            onClick={() => updateT2("turnaround", preset)}
                                            className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 hover:bg-purple-500/30 text-slate-300"
                                          >
                                            {preset}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                    <input
                                      type="text"
                                      value={t2.turnaround}
                                      onChange={(e) => updateT2("turnaround", e.target.value)}
                                      className="w-full rounded-xl bg-slate-950 p-2 text-xs text-slate-300 border border-purple-500/20 focus:border-purple-400 focus:outline-none"
                                    />
                                  </div>

                                  <div>
                                    <label className="text-[10px] text-slate-400 font-bold block mb-1">
                                      Deliverable Scope Summary
                                    </label>
                                    <textarea
                                      rows={3}
                                      value={t2.scopeSummary}
                                      onChange={(e) => updateT2("scopeSummary", e.target.value)}
                                      className="w-full rounded-xl bg-slate-950 p-2 text-[11px] text-slate-300 border border-purple-500/20 focus:border-purple-400 focus:outline-none"
                                    />
                                  </div>
                                </div>
                              );
                            })()}

                            {/* LEVEL 3: ENTERPRISE */}
                            {(() => {
                              const t3 = editingContractor.pricingTiers?.find((t) => t.tierId === "level_3") || {
                                tierId: "level_3" as const,
                                title: "Level 3: Full Protocol & ZK Settlement Seal",
                                priceEth: (parseFloat(editingContractor.hourlyRateEth || "0.00010") * 5).toFixed(5),
                                turnaround: "7 Days",
                                scopeSummary: "End-to-end zero-knowledge verifier integration, formal mathematical proofs, and notarized on-chain certification.",
                              };

                              const updateT3 = (field: keyof PricingTier, val: string) => {
                                const tiers = [...(editingContractor.pricingTiers || [])];
                                const idx = tiers.findIndex((t) => t.tierId === "level_3");
                                const updated = { ...t3, [field]: val };
                                if (idx >= 0) tiers[idx] = updated;
                                else tiers.push(updated);
                                setEditingContractor({ ...editingContractor, pricingTiers: tiers });
                              };

                              return (
                                <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-3 relative overflow-hidden">
                                  <div className="flex items-center justify-between pb-2 border-b border-emerald-500/20">
                                    <span className="text-xs font-black text-emerald-300 flex items-center gap-1.5">
                                      <Award className="w-3.5 h-3.5 text-emerald-400" /> Level 3: Enterprise / ZK
                                    </span>
                                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                                      {t3.priceEth} ETH
                                    </span>
                                  </div>

                                  <div>
                                    <label className="text-[10px] text-slate-400 font-bold block mb-1">
                                      Milestone Package Title
                                    </label>
                                    <input
                                      type="text"
                                      value={t3.title}
                                      onChange={(e) => updateT3("title", e.target.value)}
                                      className="w-full rounded-xl bg-slate-950 p-2 text-xs font-semibold text-white border border-emerald-500/20 focus:border-emerald-400 focus:outline-none"
                                    />
                                  </div>

                                  <div>
                                    <label className="text-[10px] text-slate-400 font-bold block mb-1">
                                      Milestone Price (ETH)
                                    </label>
                                    <input
                                      type="text"
                                      value={t3.priceEth}
                                      onChange={(e) => updateT3("priceEth", e.target.value)}
                                      className="w-full rounded-xl bg-slate-950 p-2 text-xs font-mono font-bold text-emerald-300 border border-emerald-500/20 focus:border-emerald-400 focus:outline-none"
                                    />
                                  </div>

                                  <div>
                                    <div className="flex items-center justify-between mb-1">
                                      <label className="text-[10px] text-slate-400 font-bold">
                                        Turnaround Delivery Time
                                      </label>
                                      <div className="flex gap-1">
                                        {["5 Days", "7 Days", "14 Days"].map((preset) => (
                                          <button
                                            type="button"
                                            key={preset}
                                            onClick={() => updateT3("turnaround", preset)}
                                            className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 hover:bg-emerald-500/30 text-slate-300"
                                          >
                                            {preset}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                    <input
                                      type="text"
                                      value={t3.turnaround}
                                      onChange={(e) => updateT3("turnaround", e.target.value)}
                                      className="w-full rounded-xl bg-slate-950 p-2 text-xs text-slate-300 border border-emerald-500/20 focus:border-emerald-400 focus:outline-none"
                                    />
                                  </div>

                                  <div>
                                    <label className="text-[10px] text-slate-400 font-bold block mb-1">
                                      Deliverable Scope Summary
                                    </label>
                                    <textarea
                                      rows={3}
                                      value={t3.scopeSummary}
                                      onChange={(e) => updateT3("scopeSummary", e.target.value)}
                                      className="w-full rounded-xl bg-slate-950 p-2 text-[11px] text-slate-300 border border-emerald-500/20 focus:border-emerald-400 focus:outline-none"
                                    />
                                  </div>
                                </div>
                              );
                            })()}
                          </div>

                          {/* ACTION BUTTONS & FEEDBACK BANNER */}
                          {contractorSaveSuccess && (
                            <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                              <span>Milestone rates for {editingContractor.fullName} successfully updated and synced across Base Sepolia Escrow Vault!</span>
                            </div>
                          )}

                          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-white/10">
                            <button
                              type="button"
                              onClick={handleResetContractorToDefaults}
                              className="text-xs text-slate-400 hover:text-white px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 transition-colors border border-white/5"
                            >
                              Reset to Default Studio Rates
                            </button>

                            <button
                              type="submit"
                              disabled={isSavingContractor}
                              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-black font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50"
                            >
                              {isSavingContractor ? (
                                <>
                                  <RefreshCw className="w-4 h-4 animate-spin" />
                                  <span>Saving Rates Live...</span>
                                </>
                              ) : (
                                <>
                                  <Save className="w-4 h-4" />
                                  <span>Save {editingContractor.fullName}&apos;s Rates Live</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </form>
                    )}
                  </div>
                )}

                {/* SUBTAB 2: ESCROW VAULT MILESTONE MULTIPLIERS */}
                {contractorSubTab === "milestones" && (
                  <form onSubmit={handleSaveMilestonesConfig} className="space-y-6">
                    <div className="p-6 rounded-3xl bg-slate-900/80 border border-white/10 backdrop-blur-xl shadow-xl space-y-5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
                        <div>
                          <h3 className="text-base font-bold text-white flex items-center gap-2">
                            <Layers className="w-4 h-4 text-purple-400" />
                            <span>Escrow Vault Milestone Multipliers (1 - 4 Milestones)</span>
                          </h3>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Configure the 4 milestone buttons and payout phase descriptions presented to clients in the Escrow Vault (/vault).
                          </p>
                        </div>

                        {/* Quick Presets */}
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Presets:</span>
                          <button
                            type="button"
                            onClick={() => {
                              const standard = [
                                { tier: 1, title: "1 Milestone", phaseName: "Milestone 1: Web3 Legal Architecture & Discovery", summary: "Single Deliverable: Rapid clause verification & preliminary risk audit.", multiplier: 1.0 },
                                { tier: 2, title: "2 Milestones", phaseName: "Milestones 1 & 2: Audit & Custom Contract Drafting", summary: "Two Deliverables: In-depth audit report plus custom legal contract drafting.", multiplier: 2.0 },
                                { tier: 3, title: "3 Milestones", phaseName: "Milestones 1, 2 & 3: Full Audit + Security Verification", summary: "Three Deliverables: Legal audit, contract drafting, and formal zk security verification.", multiplier: 3.0 },
                                { tier: 4, title: "4 Milestones", phaseName: "Milestones 1 to 4: Full Enterprise Legal Suite & Mainnet Seal", summary: "Four Deliverables: End-to-end legal protocol, multi-jurisdiction compliance, and final notarized seals.", multiplier: 4.0 },
                              ];
                              setSettings({ ...settings, milestoneTiers: standard });
                            }}
                            className="px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-300"
                          >
                            Linear (1x, 2x, 3x, 4x)
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const discounted = [
                                { tier: 1, title: "1 Milestone", phaseName: "Milestone 1: Web3 Legal Architecture & Discovery", summary: "Single Deliverable: Rapid clause verification & preliminary risk audit.", multiplier: 1.0 },
                                { tier: 2, title: "2 Milestones (5% Off)", phaseName: "Milestones 1 & 2: Audit & Custom Contract Drafting", summary: "Two Deliverables: In-depth audit report plus custom legal contract drafting.", multiplier: 1.9 },
                                { tier: 3, title: "3 Milestones (7% Off)", phaseName: "Milestones 1, 2 & 3: Full Audit + Security Verification", summary: "Three Deliverables: Legal audit, contract drafting, and formal zk security verification.", multiplier: 2.8 },
                                { tier: 4, title: "4 Milestones (10% Off)", phaseName: "Milestones 1 to 4: Full Enterprise Legal Suite & Mainnet Seal", summary: "Four Deliverables: End-to-end legal protocol, multi-jurisdiction compliance, and final notarized seals.", multiplier: 3.6 },
                              ];
                              setSettings({ ...settings, milestoneTiers: discounted });
                            }}
                            className="px-2 py-1 rounded-lg text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30"
                          >
                            Volume Discount
                          </button>
                        </div>
                      </div>

                      {/* 4 Milestone Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(settings.milestoneTiers || DEFAULT_MILESTONE_TIERS).map((m, idx) => (
                          <div
                            key={m.tier}
                            className="p-4 rounded-2xl bg-slate-950/70 border border-white/10 space-y-3 relative group hover:border-purple-500/30 transition-all"
                          >
                            <div className="flex items-center justify-between pb-2 border-b border-white/5">
                              <span className="text-xs font-black text-purple-300 flex items-center gap-1.5">
                                <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-300 flex items-center justify-center text-[10px] font-bold">
                                  {m.tier}
                                </span>
                                <span>Tier {m.tier} Configuration</span>
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-slate-400 font-bold">Multiplier:</span>
                                <input
                                  type="number"
                                  step="0.1"
                                  min="0.1"
                                  max="10.0"
                                  value={m.multiplier}
                                  onChange={(e) => {
                                    const val = parseFloat(e.target.value) || m.tier;
                                    const updated = [...(settings.milestoneTiers || DEFAULT_MILESTONE_TIERS)];
                                    updated[idx] = { ...updated[idx], multiplier: val };
                                    setSettings({ ...settings, milestoneTiers: updated });
                                  }}
                                  className="w-16 rounded-lg bg-slate-900 px-2 py-1 text-xs font-mono font-bold text-amber-300 border border-white/10 text-center"
                                />
                                <span className="text-xs text-amber-300 font-mono">x</span>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-[10px] text-slate-400 font-bold block mb-1">
                                  Button Label Title
                                </label>
                                <input
                                  type="text"
                                  value={m.title}
                                  onChange={(e) => {
                                    const updated = [...(settings.milestoneTiers || DEFAULT_MILESTONE_TIERS)];
                                    updated[idx] = { ...updated[idx], title: e.target.value };
                                    setSettings({ ...settings, milestoneTiers: updated });
                                  }}
                                  className="w-full rounded-xl bg-slate-900 p-2 text-xs font-bold text-white border border-white/10 focus:border-purple-400 focus:outline-none"
                                />
                              </div>

                              <div>
                                <label className="text-[10px] text-slate-400 font-bold block mb-1">
                                  Payout Phases
                                </label>
                                <div className="text-xs text-slate-300 font-mono py-2">
                                  {m.tier} Release Stage{m.tier > 1 ? "s" : ""}
                                </div>
                              </div>
                            </div>

                            <div>
                              <label className="text-[10px] text-slate-400 font-bold block mb-1">
                                Phase Name Displayed in Escrow
                              </label>
                              <input
                                type="text"
                                value={m.phaseName}
                                onChange={(e) => {
                                  const updated = [...(settings.milestoneTiers || DEFAULT_MILESTONE_TIERS)];
                                  updated[idx] = { ...updated[idx], phaseName: e.target.value };
                                  setSettings({ ...settings, milestoneTiers: updated });
                                }}
                                className="w-full rounded-xl bg-slate-900 p-2 text-xs text-cyan-300 font-semibold border border-white/10 focus:border-cyan-400 focus:outline-none"
                              />
                            </div>

                            <div>
                              <label className="text-[10px] text-slate-400 font-bold block mb-1">
                                Deliverable Scope Summary
                              </label>
                              <textarea
                                rows={2}
                                value={m.summary}
                                onChange={(e) => {
                                  const updated = [...(settings.milestoneTiers || DEFAULT_MILESTONE_TIERS)];
                                  updated[idx] = { ...updated[idx], summary: e.target.value };
                                  setSettings({ ...settings, milestoneTiers: updated });
                                }}
                                className="w-full rounded-xl bg-slate-900 p-2 text-[11px] text-slate-300 border border-white/10 focus:border-purple-400 focus:outline-none"
                              />
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Default Fallback Milestone Rate */}
                      <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="text-xs font-bold text-white">Default Fallback Milestone Base Rate</div>
                          <div className="text-[11px] text-slate-400">Used if a selected contractor has not defined custom rates</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={settings.defaultMilestoneBaseRateEth || "0.00010"}
                            onChange={(e) => setSettings({ ...settings, defaultMilestoneBaseRateEth: e.target.value })}
                            className="w-28 rounded-xl bg-slate-900 px-3 py-2 text-xs font-mono font-bold text-amber-300 border border-white/10 focus:border-amber-400 focus:outline-none"
                          />
                          <span className="text-xs font-mono text-slate-400">ETH</span>
                        </div>
                      </div>

                      {/* Success Banner */}
                      {milestonesSaveSuccess && (
                        <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>Escrow milestone tier configurations saved and synced to the client Escrow Vault!</span>
                        </div>
                      )}

                      <div className="flex justify-end pt-3 border-t border-white/10">
                        <button
                          type="submit"
                          disabled={isSavingMilestones}
                          className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-400 hover:to-cyan-400 text-black font-bold text-xs shadow-lg shadow-purple-500/20 transition-all disabled:opacity-50"
                        >
                          {isSavingMilestones ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              <span>Saving Milestones Config...</span>
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4" />
                              <span>Save Milestone Tier Configurations Live</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </form>
                )}

                {/* SUBTAB 3: CONTRACTOR DIRECTORY TABLE */}
                {contractorSubTab === "directory" && (
                  <div className="p-6 rounded-3xl bg-slate-900/70 border border-white/10 space-y-4 backdrop-blur-xl shadow-xl animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-base text-white">Verified Contractor Directory &amp; Rates</h3>
                        <p className="text-xs text-slate-400">Legal tech specialists and smart contract developers available for escrow hiring</p>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-slate-800 text-xs font-semibold text-slate-300 font-mono">
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
                            <th className="py-3 px-4">Milestone Rates (L1 / L2 / L3)</th>
                            <th className="py-3 px-4">Trust Score</th>
                            <th className="py-3 px-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {contractorsList.map((c) => {
                            const l1 = c.pricingTiers?.find((t) => t.tierId === "level_1")?.priceEth || c.hourlyRateEth;
                            const l2 = c.pricingTiers?.find((t) => t.tierId === "level_2")?.priceEth || (parseFloat(l1) * 2.5).toFixed(5);
                            const l3 = c.pricingTiers?.find((t) => t.tierId === "level_3")?.priceEth || (parseFloat(l1) * 5).toFixed(5);

                            return (
                              <tr key={c.walletAddress} className="hover:bg-white/[0.02]">
                                <td className="py-3 px-4 font-bold text-white">{c.fullName}</td>
                                <td className="py-3 px-4 text-slate-300">{c.roleTitle}</td>
                                <td className="py-3 px-4 font-mono text-cyan-300">
                                  {c.walletAddress.slice(0, 6)}...{c.walletAddress.slice(-4)}
                                </td>
                                <td className="py-3 px-4 font-mono">
                                  <div className="flex items-center gap-1.5 text-[11px]">
                                    <span className="px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300">{l1}</span>
                                    <span className="text-slate-600">/</span>
                                    <span className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300">{l2}</span>
                                    <span className="text-slate-600">/</span>
                                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300">{l3} ETH</span>
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-emerald-400 font-bold">{c.reputationScore}%</td>
                                <td className="py-3 px-4 text-right">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedContractorWallet(c.walletAddress);
                                      setContractorSubTab("tiers");
                                    }}
                                    className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/40 transition-colors"
                                  >
                                    Edit Rates &amp; Tiers
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* SUBTAB 4: BULK RATE CALIBRATOR */}
                {contractorSubTab === "bulk" && (
                  <div className="p-6 rounded-3xl bg-slate-900/80 border border-white/10 backdrop-blur-xl shadow-xl space-y-5">
                    <div>
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <Sliders className="w-4 h-4 text-amber-400" />
                        <span>Global Micro-Rate Calibrator</span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Batch calibrate all contractor milestone prices simultaneously by a percentage factor. Useful for market-wide pricing adjustments or testnet promotions.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <button
                        type="button"
                        onClick={() => handleBulkRateAdjustment(10)}
                        className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 hover:border-emerald-500 text-center transition-all group"
                      >
                        <div className="text-lg font-black text-emerald-400 group-hover:scale-105 transition-transform">+10%</div>
                        <div className="text-[11px] text-slate-400 mt-1">Calibrate Rates Up (+10%)</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleBulkRateAdjustment(25)}
                        className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 hover:border-cyan-500 text-center transition-all group"
                      >
                        <div className="text-lg font-black text-cyan-400 group-hover:scale-105 transition-transform">+25%</div>
                        <div className="text-[11px] text-slate-400 mt-1">Surge Rate Multiplier (+25%)</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleBulkRateAdjustment(-10)}
                        className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 hover:border-amber-500 text-center transition-all group"
                      >
                        <div className="text-lg font-black text-amber-400 group-hover:scale-105 transition-transform">-10%</div>
                        <div className="text-[11px] text-slate-400 mt-1">Discount Calibration (-10%)</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleBulkRateAdjustment(-25)}
                        className="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/30 hover:border-purple-500 text-center transition-all group"
                      >
                        <div className="text-lg font-black text-purple-400 group-hover:scale-105 transition-transform">-25%</div>
                        <div className="text-[11px] text-slate-400 mt-1">Hackathon Promo (-25%)</div>
                      </button>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/5 text-xs text-slate-400 space-y-1">
                      <div className="font-bold text-slate-300">ℹ️ Rate Calibration Information:</div>
                      <p>
                        Applying a bulk calibration updates both the base hourly rate and all 3 service tier packages (Level 1, Level 2, Level 3) for all {contractorsList.length} verified contractors on Base Sepolia.
                      </p>
                    </div>
                  </div>
                )}
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

            {/* TAB: AUTONOMOUS WEB3 RELAYER & FAUCET */}
            {activeTab === "relayer" && (
              <div className="space-y-6 animate-in fade-in">
                {/* 1. Header Banner & Introduction */}
                <div className="p-6 rounded-3xl bg-slate-900/70 border border-white/10 space-y-4 backdrop-blur-xl shadow-xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          <Zap className="w-5 h-5" />
                        </span>
                        <h3 className="font-black text-lg text-white">
                          Autonomous Web3 Relayer & Live On-Chain Broadcaster
                        </h3>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                        Enables zero-gas, instantaneous legal contract notarization on Base Sepolia EVM without requiring visitors to have MetaMask installed.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${
                        relayerStatus?.hasFunds
                          ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                          : relayerStatus?.configured
                          ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                          : "bg-slate-800 text-slate-400 border-white/10"
                      }`}>
                        {relayerStatus?.hasFunds
                          ? "🟢 Live & Funded"
                          : relayerStatus?.configured
                          ? "🟡 Needs Faucet ETH"
                          : "⚪ Reference Mode"}
                      </span>
                    </div>
                  </div>

                  {/* Relayer Operational Briefing */}
                  <div className="p-4 rounded-2xl bg-slate-950/70 border border-cyan-500/20 space-y-2 text-xs leading-relaxed text-slate-300">
                    <p className="font-bold text-cyan-300 flex items-center gap-1.5">
                      <span>💡</span>
                      <span>How the Autonomous Gasless Relayer Operates (EIP-2771):</span>
                    </p>
                    <p className="text-slate-300 text-xs leading-relaxed">
                      In conventional Web3 applications, blockchain transactions require end users to connect an external browser extension wallet and hold gas tokens. The <strong>LexiGuard Autonomous Relayer</strong> eliminates this barrier by acting as an automated gas sponsor: whenever a user or hackathon judge audits a contract and clicks <em>Notarize</em>, our backend relayer securely signs and broadcasts the SHA-256 legal hash directly to Base Sepolia, producing an authentic live verification receipt on BaseScan in sub-2-second latencies with zero wallet setup.
                    </p>
                  </div>

                  {/* 2. Live Status & Balance Dashboard */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                    {/* Card 1: Relayer Wallet Address */}
                    <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/10 space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Derived Relayer Address
                      </span>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs text-cyan-300 truncate">
                          {relayerStatus?.address || "Not Configured Yet"}
                        </span>
                        {relayerStatus?.address && (
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(relayerStatus.address!);
                              setRelayerKeyCopied(true);
                              setTimeout(() => setRelayerKeyCopied(false), 2000);
                            }}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs shrink-0 cursor-pointer"
                            title="Copy Address"
                          >
                            {relayerKeyCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        )}
                      </div>
                      {relayerStatus?.address && (
                        <a
                          href={`https://sepolia.basescan.org/address/${relayerStatus.address}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-cyan-400 hover:underline flex items-center gap-1 mt-1"
                        >
                          <span>View on BaseScan Explorer</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>

                    {/* Card 2: Live Sepolia ETH Balance */}
                    <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/10 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          Base Sepolia Balance
                        </span>
                        <button
                          type="button"
                          onClick={checkRelayerLive}
                          disabled={isCheckingRelayer}
                          className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
                          title="Refresh Balance"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isCheckingRelayer ? "animate-spin" : ""}`} />
                        </button>
                      </div>
                      <div className="text-xl font-black font-mono text-amber-300">
                        {relayerStatus?.balanceEth || "0.0000"} <span className="text-xs text-slate-400 font-sans">ETH</span>
                      </div>
                      <span className="text-[10px] text-slate-400 block">
                        Network: Base Sepolia Testnet (84532)
                      </span>
                    </div>

                    {/* Card 3: Estimated Capacity */}
                    <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/10 space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Live Notarization Capacity
                      </span>
                      <div className="text-xl font-black font-mono text-emerald-400">
                        {parseFloat(relayerStatus?.balanceEth || "0") > 0
                          ? `~${Math.floor(parseFloat(relayerStatus?.balanceEth || "0") / 0.000001).toLocaleString()} Audits`
                          : "0 Audits"}
                      </div>
                      <span className="text-[10px] text-slate-400 block">
                        Gas fee per notary: &lt; 0.000001 ETH
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. Setup Guide & Faucets */}
                <div className="p-6 rounded-3xl bg-slate-900/70 border border-white/10 space-y-4 backdrop-blur-xl shadow-xl">
                  <h4 className="font-bold text-sm text-white flex items-center gap-2">
                    <span>🛠️</span>
                    <span>4 Easy Steps to Setup Live Relayer (Free in 2 Minutes)</span>
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/5 space-y-1.5">
                      <span className="font-bold text-amber-300 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 inline-flex items-center justify-center text-[10px] font-bold">1</span>
                        Get a Testnet Wallet Key
                      </span>
                      <p className="text-slate-400 leading-relaxed text-[11px]">
                        Open MetaMask → Create a new test account → Account Details → <strong>Show Private Key</strong>. Copy the 64-character private key.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/5 space-y-1.5">
                      <span className="font-bold text-amber-300 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 inline-flex items-center justify-center text-[10px] font-bold">2</span>
                        Grab Free Faucet ETH
                      </span>
                      <p className="text-slate-400 leading-relaxed text-[11px]">
                        Get 0.005 to 0.05 free Base Sepolia ETH from official faucets (enough for thousands of live notarizations):
                      </p>
                      <div className="flex items-center gap-2 flex-wrap pt-1">
                        <a
                          href="https://www.alchemy.com/faucets/base-sepolia"
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold inline-flex items-center gap-1"
                        >
                          Alchemy Faucet <ExternalLink className="w-3 h-3" />
                        </a>
                        <a
                          href="https://superchainfaucet.net"
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-bold inline-flex items-center gap-1"
                        >
                          Superchain Faucet <ExternalLink className="w-3 h-3" />
                        </a>
                        <a
                          href="https://faucet.quicknode.com/base/sepolia"
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold inline-flex items-center gap-1"
                        >
                          QuickNode Faucet <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/5 space-y-1.5">
                      <span className="font-bold text-amber-300 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 inline-flex items-center justify-center text-[10px] font-bold">3</span>
                        Paste Key & Save
                      </span>
                      <p className="text-slate-400 leading-relaxed text-[11px]">
                        Paste your private key in the configuration field below and click <strong>"Save Changes Live"</strong>. It is saved in your encrypted Firestore vault.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/5 space-y-1.5">
                      <span className="font-bold text-amber-300 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 inline-flex items-center justify-center text-[10px] font-bold">4</span>
                        Test Live Broadcast
                      </span>
                      <p className="text-slate-400 leading-relaxed text-[11px]">
                        Click the <strong>"🚀 Send Test Live Broadcast"</strong> button below. It will submit a real transaction to Base Sepolia and give you an immediate BaseScan link!
                      </p>
                    </div>
                  </div>
                </div>

                {/* 4. Configuration Form & Live Test Ping */}
                <div className="p-6 rounded-3xl bg-slate-900/70 border border-white/10 space-y-5 backdrop-blur-xl shadow-xl">
                  <h4 className="font-bold text-sm text-white">Relayer Key Configuration</h4>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Base Sepolia Relayer Private Key (32-byte Hex)
                    </label>
                    <div className="relative">
                      <input
                        type={showRelayerKey ? "text" : "password"}
                        value={settings.relayerPrivateKey || ""}
                        onChange={(e) => {
                          setSettings({ ...settings, relayerPrivateKey: e.target.value });
                        }}
                        placeholder="0x1234567890abcdef... (64 hex characters)"
                        className="w-full rounded-2xl bg-slate-950 p-3.5 pr-10 text-xs font-mono text-white border border-white/10 focus:border-amber-400 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRelayerKey(!showRelayerKey)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                      >
                        {showRelayerKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      💡 Tip: You can also place this in your <code>.env.local</code> as <code>BASE_SEPOLIA_RELAYER_PRIVATE_KEY</code>.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => handleSave()}
                      disabled={isSaving}
                      className="w-full sm:w-auto py-2.5 px-5 rounded-xl bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-400 hover:to-cyan-400 text-white font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      <span>Save Relayer Key Live</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleTestRelayerPing}
                      disabled={testRelayerLoading}
                      className="w-full sm:w-auto py-2.5 px-5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-extrabold text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {testRelayerLoading ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-black" />
                          <span>Broadcasting Live to Base Sepolia...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-3.5 h-3.5" />
                          <span>🚀 Send Test Live Broadcast to BaseScan</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Test Result Display */}
                  {testRelayerResult && (
                    <div className={`p-4 rounded-2xl border text-xs space-y-2 animate-in fade-in ${
                      testRelayerResult.success
                        ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-200"
                        : "bg-rose-500/15 border-rose-500/40 text-rose-200"
                    }`}>
                      <div className="flex items-center gap-2 font-bold text-sm">
                        {testRelayerResult.success ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span>Live Broadcast Confirmed on Base Sepolia!</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-4 h-4 text-rose-400" />
                            <span>Broadcast Failed</span>
                          </>
                        )}
                      </div>

                      {testRelayerResult.success ? (
                        <div className="space-y-1.5 font-mono text-[11px]">
                          <p className="text-slate-300">
                            <strong>TxHash:</strong> {testRelayerResult.txHash}
                          </p>
                          <p className="text-slate-300">
                            <strong>Block Number:</strong> #{testRelayerResult.blockNumber}
                          </p>
                          <a
                            href={testRelayerResult.explorerUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-cyan-300 hover:underline font-bold pt-1"
                          >
                            <span>Open Verified Transaction on BaseScan ↗</span>
                          </a>
                        </div>
                      ) : (
                        <p className="text-rose-300 text-xs leading-relaxed">
                          {testRelayerResult.error}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
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
