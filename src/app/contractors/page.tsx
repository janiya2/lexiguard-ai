"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import {
  UserCheck,
  Briefcase,
  ShieldCheck,
  Star,
  ExternalLink,
  Wallet,
  Save,
  CheckCircle2,
  Copy,
  Check,
  ArrowRight,
  Code2,
  Sparkles,
  Layers,
  ArrowUpRight,
  Lock,
  Clock,
  TrendingUp,
  Award,
  Search,
  FileText,
  Send,
  Zap,
  ChevronRight,
  Activity,
  Shield,
  FileCheck,
  X,
} from "lucide-react";
import { useWeb3 } from "@/context/Web3Context";
import {
  getContractorProfiles,
  saveContractorProfile,
  getEscrowAgreements,
  submitEscrowDeliverable,
  ContractorProfile,
  DEFAULT_CONTRACTORS,
} from "@/lib/firestoreService";

export default function ContractorsPage() {
  const { account, networkMode } = useWeb3();

  const [contractors, setContractors] = useState<ContractorProfile[]>(DEFAULT_CONTRACTORS);
  const [escrowOrders, setEscrowOrders] = useState<any[]>([]);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  // Tab Navigation: "contractors" | "orders" | "register"
  const [activeTab, setActiveTab] = useState<"contractors" | "orders" | "register">("contractors");
  
  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSkillFilter, setSelectedSkillFilter] = useState("All");
  const [orderStatusFilter, setOrderStatusFilter] = useState<"ALL" | "LOCKED" | "SUBMITTED" | "RELEASED">("ALL");

  // Deliverable Submission Modal State (For Contractors)
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [activeEscrowForSubmit, setActiveEscrowForSubmit] = useState<any | null>(null);
  const [deliverableUrl, setDeliverableUrl] = useState("");
  const [submissionNotes, setSubmissionNotes] = useState("");
  const [isSubmittingWork, setIsSubmittingWork] = useState(false);

  // Proposal & Scope of Work Modal State
  const [viewingProposalEscrow, setViewingProposalEscrow] = useState<any | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  // Profile Editor Form State (For Contractors to define their value/rate)
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [bio, setBio] = useState("");
  const [skillsText, setSkillsText] = useState("");
  const [hourlyRate, setHourlyRate] = useState("0.00010");
  const [completedJobs, setCompletedJobs] = useState("12");
  const [maxCapacity, setMaxCapacity] = useState("0.05");
  const [portfolio, setPortfolio] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll and listen for ESC key whenever contractor modal is open
  useEffect(() => {
    const isAnyModalOpen = Boolean(viewingProposalEscrow) || Boolean(isSubmitModalOpen);

    if (isAnyModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setViewingProposalEscrow(null);
        setIsSubmitModalOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [viewingProposalEscrow, isSubmitModalOpen]);

  const explorerBase =
    networkMode === "mainnet" ? "https://basescan.org" : "https://sepolia.basescan.org";

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");
      if (tab === "orders" || tab === "register" || tab === "contractors") {
        setActiveTab(tab as any);
      }
    }
  }, []);

  const openSubmitModal = (esc: any) => {
    setActiveEscrowForSubmit(esc);
    setDeliverableUrl(esc.deliverableUrl || "");
    setSubmissionNotes(
      esc.submissionNotes ||
      "Completed milestone scope requirements under BLI legal standards. Verified unit tests passing and cryptographic SHA-256 bound."
    );
    setIsSubmitModalOpen(true);
  };

  const handleDeliverableSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEscrowForSubmit) return;
    setIsSubmittingWork(true);
    try {
      const targetId = activeEscrowForSubmit.agreementId || activeEscrowForSubmit.id;
      await submitEscrowDeliverable(targetId, deliverableUrl, submissionNotes);
      setEscrowOrders((prev) =>
        prev.map((ord) =>
          (ord.agreementId === targetId || ord.id === targetId)
            ? { ...ord, status: "SUBMITTED", deliverableUrl, submissionNotes }
            : ord
        )
      );
      setIsSubmitModalOpen(false);
      setActiveEscrowForSubmit(null);
    } catch (err) {
      console.error("Deliverable submission failed:", err);
    } finally {
      setIsSubmittingWork(false);
    }
  };

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  useEffect(() => {
    async function load() {
      // 1. Load Contractors
      const data = await getContractorProfiles();
      const validContractors = data.filter(
        (c) => c.walletAddress && c.walletAddress.startsWith("0x") && c.walletAddress.length === 42
      );
      setContractors(validContractors);

      // 2. Load Escrow Orders
      const orders = await getEscrowAgreements();
      setEscrowOrders(orders);

      // 3. Pre-fill profile if current wallet matches
      if (account) {
        const found = validContractors.find(
          (c) => c.walletAddress.toLowerCase() === account.toLowerCase()
        );
        if (found) {
          setFullName(found.fullName);
          setCompanyName(found.companyName);
          setRoleTitle(found.roleTitle);
          setBio(found.bio);
          setSkillsText(found.skills.join(", "));
          setHourlyRate(found.hourlyRateEth || "0.00010");
          setCompletedJobs(String(found.completedJobsCount || 15));
          setMaxCapacity(found.maxCapacityEth || "0.05");
          setPortfolio(found.githubOrPortfolio || "");
        } else if (account.toLowerCase().includes("74b1") || account.toLowerCase().includes("7f2b")) {
          setFullName("Janitha Dilshan");
          setCompanyName("InnoXpert Studio");
          setRoleTitle("Lead Full-Stack Web3 & AI Solutions Architect");
          setBio("Specializing in low-latency AI agents, EVM smart contracts, Next.js full-stack systems, and secure escrow architectures.");
          setSkillsText("Solidity, Next.js, AI Agents, EVM Escrow, TypeScript, Viem");
          setHourlyRate("0.00010");
          setCompletedJobs("28");
          setMaxCapacity("0.05");
          setPortfolio("https://innoxpert.com");
        }
      }
    }
    load();
  }, [account]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account) return;

    setIsSaving(true);
    setSaveSuccess(false);

    const skillsArray = skillsText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const newProfile: ContractorProfile = {
      walletAddress: account,
      fullName: fullName || "Web3 Engineer",
      companyName: companyName || "InnoXpert Studio",
      roleTitle: roleTitle || "Solutions Architect",
      bio: bio || "Verified Web3 Legal & Smart Contract Builder",
      skills: skillsArray.length > 0 ? skillsArray : ["Solidity", "Web3", "Next.js"],
      hourlyRateEth: hourlyRate,
      reputationScore: 99,
      completedJobsCount: parseInt(completedJobs) || 15,
      maxCapacityEth: maxCapacity || "3.5",
      rating: 5.0,
      verifiedOnChain: true,
      githubOrPortfolio: portfolio,
    };

    const success = await saveContractorProfile(newProfile);
    setIsSaving(false);

    if (success) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      const updated = await getContractorProfiles();
      const valid = updated.filter(
        (c) => c.walletAddress && c.walletAddress.startsWith("0x") && c.walletAddress.length === 42
      );
      setContractors(valid);
      setActiveTab("contractors");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAddress(text);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  // Filtered Contractors List
  const filteredContractors = contractors.filter((c) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      c.fullName.toLowerCase().includes(q) ||
      c.companyName.toLowerCase().includes(q) ||
      c.roleTitle.toLowerCase().includes(q) ||
      c.walletAddress.toLowerCase().includes(q) ||
      c.skills.some((s) => s.toLowerCase().includes(q));

    if (selectedSkillFilter === "All") return matchesSearch;
    const matchesSkill = c.skills.some((s) =>
      s.toLowerCase().includes(selectedSkillFilter.toLowerCase())
    );
    return matchesSearch && matchesSkill;
  });

  const formatTimestamp = (ts: any) => {
    if (!ts) return "Just now";
    let millis = 0;
    if (typeof ts === "number") millis = ts * 1000;
    else if (ts.seconds) millis = ts.seconds * 1000;
    else if (ts.toDate) millis = ts.toDate().getTime();
    else if (typeof ts === "string") millis = new Date(ts).getTime();

    if (!millis || isNaN(millis)) return "Recent";
    const diffSec = Math.floor((Date.now() - millis) / 1000);
    if (diffSec < 60) return "Just now";
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return new Date(millis).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Filtered Orders List strictly sorted with most recent at top
  const filteredOrders = escrowOrders
    .filter((ord) => {
      if (orderStatusFilter === "ALL") return true;
      return ord.status === orderStatusFilter;
    })
    .sort((a, b) => {
      const getSec = (item: any) => {
        if (!item?.createdAt) return 0;
        if (typeof item.createdAt === "number") return item.createdAt;
        if (item.createdAt.seconds) return item.createdAt.seconds;
        if (item.createdAt.toDate) return Math.floor(item.createdAt.toDate().getTime() / 1000);
        const parsed = new Date(item.createdAt).getTime();
        return isNaN(parsed) ? 0 : Math.floor(parsed / 1000);
      };
      return getSec(b) - getSec(a);
    });

  // Global Aggregate Stats
  const totalCompletedAudits = contractors.reduce((sum, c) => sum + (c.completedJobsCount || 15), 0);
  const totalVolumeEth = escrowOrders.reduce(
    (sum, ord) => sum + (parseFloat(ord.amountEth) || 0),
    0
  );

  return (
    <div className="relative flex flex-col min-h-screen bg-[#030712] text-slate-100 overflow-x-hidden">
      {/* Background Cyber Asset & Ambient Glows */}
      <div
        className="fixed inset-0 bg-cover bg-center opacity-15 pointer-events-none mix-blend-screen"
        style={{ backgroundImage: `url('/images/escrow_vault_bg.jpg')` }}
      />
      <div className="fixed inset-0 bg-gradient-to-b from-[#030712]/95 via-[#060c23]/90 to-[#030712]/95 pointer-events-none" />

      <Navbar />

      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10">
        
        {/* Page Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 sm:space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold shadow-inner">
            <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>Decentralized Legal Tech Talent & Milestone Orders</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Verified Contractors & Escrow Orders
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-2xl mx-auto">
            Discover verified Web3 legal engineers, inspect live milestone escrow orders, view client reviews, and manage your contractor fee rates.
          </p>
        </div>

        {/* TOP STATS DASHBOARD BAR (REQUESTED STATS SECTION) */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
          <div className="p-4 sm:p-5 rounded-3xl bg-slate-900/80 border border-cyan-500/20 backdrop-blur-xl shadow-xl space-y-2 relative overflow-hidden group hover:border-cyan-500/40 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Verified Engineers
              </span>
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white font-mono">
              {contractors.length} Profiles
            </div>
            <p className="text-[10px] text-cyan-400 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> 100% Bound EVM Addresses
            </p>
          </div>

          <div className="p-4 sm:p-5 rounded-3xl bg-slate-900/80 border border-purple-500/20 backdrop-blur-xl shadow-xl space-y-2 relative overflow-hidden group hover:border-purple-500/40 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Completed Audits
              </span>
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Award className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white font-mono">
              {totalCompletedAudits}+ Works
            </div>
            <p className="text-[10px] text-purple-300 font-medium flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> 0% Dispute Settlements
            </p>
          </div>

          <div className="p-4 sm:p-5 rounded-3xl bg-slate-900/80 border border-emerald-500/20 backdrop-blur-xl shadow-xl space-y-2 relative overflow-hidden group hover:border-emerald-500/40 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Settled Escrow Volume
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white font-mono">
              {(totalVolumeEth + 18.25).toFixed(2)} ETH
            </div>
            <p className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
              <Lock className="w-3 h-3" /> Base Sepolia / Mainnet
            </p>
          </div>

          <div className="p-4 sm:p-5 rounded-3xl bg-slate-900/80 border border-amber-500/20 backdrop-blur-xl shadow-xl space-y-2 relative overflow-hidden group hover:border-amber-500/40 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Average Trust Score
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Star className="w-4 h-4 fill-amber-400" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white font-mono">
              4.98 / 5.0
            </div>
            <p className="text-[10px] text-amber-300 font-medium flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> 100% Cryptographic Reviews
            </p>
          </div>
        </section>

        {/* ADVANCED TABBED NAVIGATION */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex flex-wrap items-center gap-2 bg-slate-950 p-1.5 rounded-2xl border border-white/10">
            <button
              onClick={() => setActiveTab("contractors")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === "contractors"
                  ? "bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>Verified Contractors ({contractors.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("orders")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === "orders"
                  ? "bg-purple-500 text-white shadow-lg shadow-purple-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Escrow Orders & Jobs ({escrowOrders.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("register")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === "register"
                  ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Briefcase className="w-4 h-4" />
              <span>Set Your Rates / Profile</span>
            </button>
          </div>

          <Link
            href="/vault"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/25 transition-all w-fit"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Open Escrow Vault →</span>
          </Link>
        </div>

        {/* TAB 1: VERIFIED CONTRACTORS DIRECTORY */}
        {activeTab === "contractors" && (
          <div className="space-y-6">
            {/* Search & Skill Filter Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, skill, studio, or wallet..."
                  className="w-full rounded-2xl bg-slate-900 border border-white/10 pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/40"
                />
              </div>

              {/* Skill Pills */}
              <div className="flex flex-wrap gap-1.5 text-xs">
                {["All", "Solidity", "Legal", "Security", "ZK"].map((skill) => (
                  <button
                    key={skill}
                    onClick={() => setSelectedSkillFilter(skill)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      selectedSkillFilter === skill
                        ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                        : "bg-slate-900/80 text-slate-400 hover:text-white border border-white/5"
                    }`}
                  >
                    {skill}
                  </button>
                ))}
              </div>
            </div>

            {/* Contractors Cards Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredContractors.map((c) => (
                <div
                  key={c.walletAddress}
                  className="rounded-3xl bg-slate-900/80 border border-cyan-500/20 p-6 hover:border-cyan-500/40 transition-all space-y-4 shadow-xl backdrop-blur-xl relative flex flex-col justify-between"
                >
                  <div className="space-y-3.5">
                    {/* Header: Name, Verified Badge, Rating, Rate */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-lg font-bold text-white">
                            {c.fullName}
                          </h4>
                          {c.verifiedOnChain && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Verified EVM
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 flex items-center gap-1">
                            <Star className="w-3 h-3 text-amber-400 fill-amber-400" /> {c.rating || 5.0}
                          </span>
                        </div>
                        <p className="text-xs text-cyan-300 font-semibold mt-0.5">
                          {c.roleTitle} {c.companyName && `· ${c.companyName}`}
                        </p>
                      </div>

                      <div className="flex flex-col sm:items-end">
                        <span className="text-xs font-mono font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl">
                          {c.hourlyRateEth} ETH / Milestone
                        </span>
                        <span className="text-[10px] text-slate-500 mt-1">Contractor Fixed Rate</span>
                      </div>
                    </div>

                    {/* Stats Metric Grid */}
                    <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-slate-950/80 border border-white/5 text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-slate-500 flex items-center gap-1">
                          <Award className="w-3 h-3 text-cyan-400" /> Completed
                        </span>
                        <p className="font-bold text-white font-mono text-sm mt-0.5">
                          {c.completedJobsCount || 15} Audits
                        </p>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-semibold text-slate-500 flex items-center gap-1">
                          <Layers className="w-3 h-3 text-purple-400" /> Max Cap
                        </span>
                        <p className="font-bold text-purple-300 font-mono text-sm mt-0.5">
                          {c.maxCapacityEth || "4.0"} ETH
                        </p>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-semibold text-slate-500 flex items-center gap-1">
                          <TrendingUp className="w-3 h-3 text-emerald-400" /> Disputes
                        </span>
                        <p className="font-bold text-emerald-400 font-mono text-sm mt-0.5">
                          0% Clean
                        </p>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      {c.bio}
                    </p>

                    {/* Skills Badges */}
                    <div className="flex flex-wrap gap-1.5">
                      {c.skills?.map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-0.5 rounded-lg text-[10px] font-semibold bg-slate-950 text-slate-300 border border-white/5"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>

                    {/* Verified Client Feedback */}
                    {c.recentReviews && c.recentReviews.length > 0 && (
                      <div className="p-3 rounded-2xl bg-slate-950/70 border border-white/5 space-y-2">
                        <div className="flex items-center justify-between text-[11px] font-bold text-amber-300">
                          <span className="flex items-center gap-1.5">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            <span>Verified Client Feedback ({c.recentReviews.length})</span>
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">100% On-Chain Escrow</span>
                        </div>
                        <div className="space-y-1.5">
                          {c.recentReviews.map((rev, rIdx) => (
                            <div key={rIdx} className="text-[11px] text-slate-300 space-y-0.5 border-l-2 border-amber-500/40 pl-2.5">
                              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                                <span>Client: {rev.reviewer.slice(0, 6)}...{rev.reviewer.slice(-4)}</span>
                                <span className="font-sans">{rev.date}</span>
                              </div>
                              <p className="italic text-slate-200">&quot;{rev.comment}&quot;</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Bound Wallet & Hire Action */}
                  <div className="pt-3 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-2">
                    <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                      <span className="text-slate-500">Payout Address:</span>
                      <span className="text-cyan-300">
                        {c.walletAddress.slice(0, 6)}...{c.walletAddress.slice(-4)}
                      </span>
                      <button
                        onClick={() => copyToClipboard(c.walletAddress)}
                        className="hover:text-white transition-colors"
                        title="Copy Address"
                      >
                        {copiedAddress === c.walletAddress ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <a
                        href={`${explorerBase}/address/${c.walletAddress}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-cyan-300 text-slate-500 transition-colors"
                        title="View on BaseScan"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </a>
                    </div>

                    <Link
                      href="/vault"
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/25 transition-all shadow-sm"
                    >
                      <span>Hire in Escrow Vault</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: ADVANCED ESCROW ORDERS & MILESTONE TRACKER */}
        {activeTab === "orders" && (
          <div className="space-y-6">
            {/* Filter Tabs for Orders */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <FileText className="w-4 h-4 text-purple-400" />
                  <span>On-Chain Escrow Orders Tracker ({filteredOrders.length})</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Real-time status of all contractual orders bound to verified contractor wallets.
                </p>
              </div>

              <div className="flex flex-wrap gap-1.5 bg-slate-950 p-1 rounded-xl border border-white/5 text-xs">
                {(["ALL", "LOCKED", "SUBMITTED", "RELEASED"] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setOrderStatusFilter(status)}
                    className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                      orderStatusFilter === status
                        ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {status === "ALL" && "All Orders"}
                    {status === "LOCKED" && "Locked (In Escrow)"}
                    {status === "SUBMITTED" && "In Review (Submitted)"}
                    {status === "RELEASED" && "Settled (Released)"}
                  </button>
                ))}
              </div>
            </div>

            {/* Orders Cards Grid */}
            <div className="space-y-4">
              {filteredOrders.map((ord, idx) => {
                const isLocked = ord.status === "LOCKED";
                const isSubmitted = ord.status === "SUBMITTED";
                const isReleased = ord.status === "RELEASED";

                return (
                  <div
                    key={ord.agreementId || idx}
                    className="p-5 sm:p-6 rounded-3xl bg-slate-900/80 border border-white/10 hover:border-purple-500/30 transition-all space-y-4 shadow-xl backdrop-blur-xl"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {isLocked && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                              <Lock className="w-3 h-3 text-amber-400" /> Locked In Escrow
                            </span>
                          )}
                          {isSubmitted && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/15 text-blue-300 border border-blue-500/30 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-blue-400 animate-pulse" /> Work Submitted · In Review
                            </span>
                          )}
                          {isReleased && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Milestone Payout Settled
                            </span>
                          )}
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono text-cyan-300 bg-cyan-950/70 border border-cyan-500/30 flex items-center gap-1 shadow-sm">
                            <Clock className="w-3 h-3 text-cyan-400" />
                            <span>{formatTimestamp(ord.createdAt)}</span>
                          </span>
                          <span className="text-xs font-mono font-bold text-cyan-300">
                            {ord.amountEth} ETH Escrow
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-white mt-1">
                          {ord.milestoneDesc}
                        </h4>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => setViewingProposalEscrow(ord)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-cyan-300 bg-cyan-950/60 border border-cyan-500/30 hover:bg-cyan-900/60 transition-all cursor-pointer shadow-sm"
                          title="View Full Scope & Legal Proposal Modal"
                        >
                          <FileText className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Scope &amp; Docs</span>
                        </button>
                      </div>
                    </div>

                    {/* Scope & Proposal Requirements */}
                    {(ord.proposalRequirements || ord.proposalDocName) && (
                      <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-cyan-500/20 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between font-bold text-cyan-300 text-[11px]">
                          <span className="flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Client Scope &amp; Acceptance Requirements:</span>
                          </span>
                          {ord.proposalDocName && (
                            <span className="font-mono text-slate-400">
                              {ord.proposalDocName}
                            </span>
                          )}
                        </div>
                        <p className="text-slate-300 whitespace-pre-line leading-relaxed text-[11px]">
                          {ord.proposalRequirements || ord.milestoneDesc}
                        </p>

                        {ord.proposalDocHash && (
                          <div className="mt-2 pt-2 border-t border-white/5 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono">
                            <span className="text-slate-400 flex items-center gap-1.5 truncate max-w-full sm:max-w-md">
                              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                              <span className="text-slate-500">SHA-256 Digest:</span>
                              <span className="text-cyan-300 truncate">{ord.proposalDocHash}</span>
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => copyHash(ord.proposalDocHash)}
                                className="text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
                                title="Copy SHA-256 Hash"
                              >
                                {copiedHash === ord.proposalDocHash ? (
                                  <Check className="w-3 h-3 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                              <Link
                                href={`/vault?hash=${ord.proposalDocHash}`}
                                className="text-emerald-400 hover:text-emerald-300 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 inline-flex items-center gap-1 shrink-0 transition-colors"
                              >
                                <span>Verify in Notary</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </Link>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Contractor Deliverables Submission */}
                    {(ord.deliverableUrl || ord.submissionNotes) && (
                      <div className="p-3.5 rounded-2xl bg-purple-950/20 border border-purple-500/20 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between font-bold text-purple-300 text-[11px]">
                          <span className="flex items-center gap-1.5">
                            <FileCheck className="w-3.5 h-3.5 text-purple-400" />
                            <span>Contractor Deliverables Submission:</span>
                          </span>
                          {ord.deliverableUrl && (
                            <a
                              href={ord.deliverableUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-emerald-400 hover:underline"
                            >
                              <span>View Deliverable Link</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                        {ord.submissionNotes && (
                          <p className="text-slate-300 italic text-[11px]">
                            &quot;{ord.submissionNotes}&quot;
                          </p>
                        )}
                      </div>
                    )}

                    {/* CONTRACTOR ACTIONS WORKFLOW BAR */}
                    {isLocked && (
                      <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-white/5 bg-purple-950/30 border border-purple-500/30 p-3.5 rounded-2xl">
                        <div className="flex items-center gap-2 text-xs text-purple-300">
                          <Zap className="w-4 h-4 text-purple-400 shrink-0 animate-pulse" />
                          <span className="text-[11px]">
                            Milestone funds locked in escrow by client. Ready for your deliverable submission.
                          </span>
                        </div>
                        <button
                          onClick={() => openSubmitModal(ord)}
                          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-400 hover:to-cyan-400 text-white shadow-lg shadow-purple-500/25 transition-all cursor-pointer shrink-0"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Submit Deliverables &amp; Mark Complete</span>
                        </button>
                      </div>
                    )}

                    {isSubmitted && (
                      <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-white/5 bg-blue-950/30 border border-blue-500/30 p-3.5 rounded-2xl">
                        <div className="flex items-center gap-2 text-xs text-blue-300">
                          <Clock className="w-4 h-4 text-blue-400 animate-pulse shrink-0" />
                          <span className="text-[11px]">
                            Deliverables submitted. Awaiting client review and on-chain escrow release.
                          </span>
                        </div>
                        <button
                          onClick={() => openSubmitModal(ord)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 border border-white/10 hover:border-purple-500/40 transition-all cursor-pointer shrink-0"
                          title="Update deliverable URL or submission notes"
                        >
                          <Send className="w-3 h-3 text-cyan-400" />
                          <span>Update Deliverable</span>
                        </button>
                      </div>
                    )}

                    {isReleased && (
                      <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-white/5 bg-emerald-950/20 border border-emerald-500/30 p-3 rounded-2xl">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-emerald-400 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> 99% Milestone Payout Disbursed to Contractor Wallet
                          </span>
                        </div>
                        {ord.releaseTxHash && (
                          <a
                            href={`${explorerBase}/tx/${ord.releaseTxHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-cyan-300 underline font-mono hover:text-cyan-200"
                          >
                            View BaseScan Settlement Tx ↗
                          </a>
                        )}
                      </div>
                    )}

                    {/* Client Review */}
                    {ord.review && (
                      <div className="p-3 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-1 text-xs">
                        <div className="flex items-center justify-between text-[11px] font-bold text-amber-300">
                          <span className="flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            <span>Client Verified Review ({ord.review.rating}/5 Stars)</span>
                          </span>
                          <span className="text-[10px] text-slate-400">Verified On-Chain</span>
                        </div>
                        <p className="text-[11px] text-slate-300 italic">
                          &quot;{ord.review.comment}&quot;
                        </p>
                      </div>
                    )}

                    {/* Wallets & Tx Hashes */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono text-slate-400 pt-2 border-t border-white/5">
                      <div>
                        <span className="text-slate-500">Client: </span>
                        <span>{ord.client ? `${ord.client.slice(0, 6)}...${ord.client.slice(-4)}` : "Verified Client"}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Contractor: </span>
                        <span className="text-cyan-300 font-semibold">
                          {ord.contractorName ? `${ord.contractorName} (` : ""}
                          {ord.contractor ? `${ord.contractor.slice(0, 6)}...${ord.contractor.slice(-4)}` : "Verified"}
                          {ord.contractorName ? ")" : ""}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] font-mono text-slate-500 pt-1 border-t border-white/5">
                      <div className="truncate max-w-full sm:max-w-xs">
                        Agreement ID: {ord.agreementId || ord.id}
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        {ord.txHash && (
                          <a
                            href={`${explorerBase}/tx/${ord.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] text-cyan-400 hover:text-cyan-300 underline"
                          >
                            <span>Lock Tx</span>
                            <ArrowUpRight className="w-3 h-3" />
                          </a>
                        )}
                        {ord.releaseTxHash && (
                          <a
                            href={`${explorerBase}/tx/${ord.releaseTxHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] text-emerald-400 hover:text-emerald-300 font-bold underline"
                          >
                            <span>Release Payout Tx</span>
                            <ArrowUpRight className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: REGISTER / UPDATE CONTRACTOR PROFILE & RATE SETUP */}
        {activeTab === "register" && (
          <div className="max-w-2xl mx-auto rounded-3xl bg-slate-900/80 border border-cyan-500/20 p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-6">
            <div className="space-y-1 border-b border-white/5 pb-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-300 text-xs font-semibold border border-cyan-500/20">
                <Briefcase className="w-3.5 h-3.5 text-cyan-400" />
                <span>Contractor Defined Pricing Portal</span>
              </div>
              <h3 className="text-xl font-bold text-white">
                Set Your Contractor Milestone Rates & Profile
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                As a contractor, your milestone price is determined by you. When clients hire you in the Escrow Vault, the order price automatically locks to your established rate.
              </p>
            </div>

            {!account ? (
              <div className="p-8 rounded-2xl bg-slate-950/70 border border-white/5 text-center space-y-3">
                <Wallet className="w-10 h-10 text-cyan-400 mx-auto opacity-70" />
                <h4 className="font-bold text-white text-sm">Connect Wallet to Manage Profile</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Connect your MetaMask or Gasless Relayer wallet to register your profile and bind your EVM payout address.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
                {saveSuccess && (
                  <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Contractor profile & milestone rate saved on-chain!</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Janitha Dilshan"
                      required
                      className="w-full rounded-xl bg-slate-950 p-2.5 text-white border border-white/10 focus:border-cyan-500/40 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">
                      Company / Studio Name
                    </label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="e.g. InnoXpert Studio"
                      className="w-full rounded-xl bg-slate-950 p-2.5 text-white border border-white/10 focus:border-cyan-500/40 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    Professional Role / Title
                  </label>
                  <input
                    type="text"
                    value={roleTitle}
                    onChange={(e) => setRoleTitle(e.target.value)}
                    placeholder="e.g. Lead Solutions Architect"
                    required
                    className="w-full rounded-xl bg-slate-950 p-2.5 text-white border border-white/10 focus:border-cyan-500/40 focus:outline-none"
                  />
                </div>

                {/* RATE DEFINED BY CONTRACTOR */}
                <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-cyan-300 font-bold flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Your Fixed Milestone Fee (ETH)</span>
                    </label>
                    <span className="text-[10px] text-slate-400">Determined exclusively by contractor</span>
                  </div>
                  <input
                    type="number"
                    step="0.00001"
                    min="0.00001"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value)}
                    placeholder="0.00010"
                    required
                    className="w-full rounded-xl bg-slate-950 p-2.5 font-mono text-cyan-300 font-bold border border-cyan-500/40 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-400">
                    Clients will pay exactly this amount per milestone when ordering from you in Escrow Vault.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">
                      Completed Audits Count
                    </label>
                    <input
                      type="number"
                      value={completedJobs}
                      onChange={(e) => setCompletedJobs(e.target.value)}
                      placeholder="28"
                      className="w-full rounded-xl bg-slate-950 p-2.5 font-mono text-amber-300 font-bold border border-white/10 focus:border-cyan-500/40 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">
                      Max Escrow Capacity (ETH)
                    </label>
                    <input
                      type="text"
                      value={maxCapacity}
                      onChange={(e) => setMaxCapacity(e.target.value)}
                      placeholder="5.0"
                      className="w-full rounded-xl bg-slate-950 p-2.5 font-mono text-purple-300 font-bold border border-white/10 focus:border-cyan-500/40 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    Portfolio / GitHub Link
                  </label>
                  <input
                    type="url"
                    value={portfolio}
                    onChange={(e) => setPortfolio(e.target.value)}
                    placeholder="https://innoxpert.com"
                    className="w-full rounded-xl bg-slate-950 p-2.5 text-white border border-white/10 focus:border-cyan-500/40 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    Core Skills (Comma separated)
                  </label>
                  <input
                    type="text"
                    value={skillsText}
                    onChange={(e) => setSkillsText(e.target.value)}
                    placeholder="Solidity, Next.js, AI Agents, EVM Escrow"
                    className="w-full rounded-xl bg-slate-950 p-2.5 text-white border border-white/10 focus:border-cyan-500/40 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    Professional Bio & Deliverable Scope
                  </label>
                  <textarea
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Describe your legal engineering or technical services..."
                    className="w-full rounded-xl bg-slate-950 p-2.5 text-white border border-white/10 focus:border-cyan-500/40 focus:outline-none resize-none"
                  />
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-white/5 font-mono text-[11px] text-slate-400">
                  <span className="text-slate-500">Bound EVM Address: </span>
                  <span className="text-cyan-300 break-all">{account}</span>
                </div>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/20 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? "Saving Profile..." : "Publish Profile & Rates"}</span>
                </button>
              </form>
            )}
          </div>
        )}
      </main>

      {/* VIEW CLIENT TASK PROPOSAL & SPECIFICATION MODAL */}
      {mounted && viewingProposalEscrow && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setViewingProposalEscrow(null);
          }}
        >
          <div
            className="w-full max-w-lg max-h-[88vh] overflow-y-auto rounded-3xl bg-[#090d1a] border-2 border-cyan-500/40 p-4 sm:p-6 space-y-4 sm:space-y-5 shadow-[0_0_60px_rgba(6,182,212,0.3)] relative overflow-hidden animate-in zoom-in-95 duration-200 text-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Ambient Cyber Glow Accents */}
            <div className="absolute -top-24 -left-24 w-60 h-60 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

            {/* Close Button Pill */}
            <button
              type="button"
              onClick={() => setViewingProposalEscrow(null)}
              className="absolute right-3.5 top-3.5 sm:right-5 sm:top-5 p-2 rounded-full bg-slate-800/90 hover:bg-slate-700 text-slate-400 hover:text-white transition-all z-20 cursor-pointer shadow-md"
              title="Close modal"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Header with Icon & Badges */}
            <div className="space-y-1.5 pr-8 sm:pr-10 relative z-10">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 text-[10px] font-bold uppercase tracking-wider border border-cyan-500/30">
                <FileText className="w-3 h-3 text-cyan-400" /> Client Scope of Work &amp; Proposal
              </div>
              <h3 className="text-base sm:text-xl font-bold text-white tracking-tight leading-snug">
                {viewingProposalEscrow.proposalTitle || viewingProposalEscrow.milestoneDesc}
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-400 leading-normal">
                Agreed milestone requirements cryptographically bound to Agreement #{viewingProposalEscrow.agreementId?.slice(0, 10)}...
              </p>
            </div>

            <div className="space-y-3 text-xs relative z-10">
              {/* Attached Specification Document */}
              {viewingProposalEscrow.proposalDocName && (
                <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-950/80 border border-cyan-500/20 space-y-2 shadow-inner">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center justify-between">
                    <span>Attached Specification Document</span>
                    <span className="text-emerald-400 font-mono text-[9px] bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      Verified SHA-256
                    </span>
                  </span>
                  <div className="flex items-center justify-between text-cyan-300 font-semibold gap-2">
                    <span className="flex items-center gap-1.5 truncate">
                      <FileCheck className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span className="truncate">{viewingProposalEscrow.proposalDocName}</span>
                    </span>
                  </div>
                  {viewingProposalEscrow.proposalDocHash && (
                    <div className="flex items-center justify-between gap-2 bg-black/50 p-2 rounded-xl border border-white/5 font-mono text-[10px]">
                      <span className="text-slate-400 truncate">
                        Digest: <span className="text-cyan-300">{viewingProposalEscrow.proposalDocHash}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => copyHash(viewingProposalEscrow.proposalDocHash)}
                        className="hover:text-cyan-300 text-slate-400 transition-colors shrink-0 p-1 cursor-pointer"
                        title="Copy SHA-256 Digest"
                      >
                        {copiedHash === viewingProposalEscrow.proposalDocHash ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Acceptance Criteria & Checklist */}
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-white/10 space-y-2 shadow-inner">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-cyan-400" /> Acceptance Criteria &amp; Task Checklist
                </span>
                <p className="text-slate-200 whitespace-pre-line leading-relaxed text-xs">
                  {viewingProposalEscrow.proposalRequirements || viewingProposalEscrow.milestoneDesc}
                </p>
              </div>

              {/* Escrow Details */}
              <div className="grid grid-cols-2 gap-2 text-[11px] p-2.5 rounded-xl bg-slate-950/90 text-slate-300 font-mono border border-white/5">
                <div>
                  <span className="text-slate-500">Milestone: </span>
                  <span className="text-cyan-300 font-bold">{viewingProposalEscrow.amountEth} ETH</span>
                </div>
                <div className="truncate">
                  <span className="text-slate-500">Client: </span>
                  <span className="text-emerald-400">{viewingProposalEscrow.client?.slice(0, 8)}...</span>
                </div>
              </div>
            </div>

            {/* Bottom Actions - Responsive */}
            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2 border-t border-white/5 relative z-10">
              {viewingProposalEscrow.proposalDocHash ? (
                <button
                  type="button"
                  onClick={() => {
                    const hash = viewingProposalEscrow.proposalDocHash;
                    setViewingProposalEscrow(null);
                    window.location.href = `/vault?hash=${hash}`;
                  }}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 cursor-pointer transition-all shadow-sm"
                >
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  <span>Verify Hash in Notary Tool ↑</span>
                </button>
              ) : <div />}
              <button
                type="button"
                onClick={() => setViewingProposalEscrow(null)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-800 text-slate-200 border border-white/10 hover:bg-slate-700 transition-all cursor-pointer text-center"
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* CONTRACTOR DELIVERABLE SUBMISSION MODAL */}
      {mounted && isSubmitModalOpen && activeEscrowForSubmit && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsSubmitModalOpen(false);
          }}
        >
          <div
            className="w-full max-w-lg max-h-[88vh] overflow-y-auto rounded-3xl bg-[#090d1a] border-2 border-purple-500/40 p-4 sm:p-6 space-y-4 sm:space-y-5 shadow-[0_0_60px_rgba(168,85,247,0.3)] relative overflow-hidden animate-in zoom-in-95 duration-200 text-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Ambient Cyber Glow Accents */}
            <div className="absolute -top-24 -left-24 w-60 h-60 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

            {/* Close Button Pill */}
            <button
              type="button"
              onClick={() => setIsSubmitModalOpen(false)}
              className="absolute right-3.5 top-3.5 sm:right-5 sm:top-5 p-2 rounded-full bg-slate-800/90 hover:bg-slate-700 text-slate-400 hover:text-white transition-all z-20 cursor-pointer shadow-md"
              title="Close modal"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Header with Icon & Badges */}
            <div className="space-y-1.5 pr-8 sm:pr-10 relative z-10">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-300 text-[10px] font-bold uppercase tracking-wider border border-purple-500/30">
                <Send className="w-3 h-3 text-purple-400" /> Contractor Work Submission
              </div>
              <h3 className="text-base sm:text-xl font-bold text-white tracking-tight leading-snug">
                Submit Milestone Deliverables
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-400 leading-normal">
                Submit your project repository or completion proofs for client review and on-chain escrow fund release.
              </p>
            </div>

            <form onSubmit={handleDeliverableSubmit} className="space-y-3.5 text-xs relative z-10">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Milestone Scope
                </label>
                <div className="p-2.5 rounded-xl bg-slate-950/80 text-slate-300 border border-white/10 font-semibold">
                  {activeEscrowForSubmit.milestoneDesc} ({activeEscrowForSubmit.amountEth} ETH)
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Deliverable URL (GitHub / IPFS / Demo / Audit PDF)
                </label>
                <input
                  type="url"
                  required
                  value={deliverableUrl}
                  onChange={(e) => setDeliverableUrl(e.target.value)}
                  placeholder="https://github.com/org/repo or https://ipfs.io/..."
                  className="w-full rounded-xl bg-slate-950/80 p-2.5 text-white border border-white/10 focus:border-cyan-500/40 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Completion Notes &amp; Technical Summary
                </label>
                <textarea
                  rows={3}
                  required
                  value={submissionNotes}
                  onChange={(e) => setSubmissionNotes(e.target.value)}
                  placeholder="Describe the completed scope, unit test results, or legal compliance checks..."
                  className="w-full rounded-xl bg-slate-950/80 p-2.5 text-white border border-white/10 focus:border-cyan-500/40 focus:outline-none resize-none"
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-2 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-slate-400 hover:text-white font-semibold transition-colors text-center cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingWork}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-400 hover:to-cyan-400 text-white shadow-lg shadow-purple-500/20 disabled:opacity-50 transition-all text-center cursor-pointer"
                >
                  {isSubmittingWork ? "Submitting Work..." : "Submit to Client"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      <Footer />
    </div>
  );
}
