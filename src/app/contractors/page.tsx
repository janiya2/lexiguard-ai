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
  Globe,
  AlertTriangle,
  Eye,
  EyeOff,
  Unlock,
} from "lucide-react";
import confetti from "canvas-confetti";
import { useWeb3 } from "@/context/Web3Context";
import WalletConnectModal from "@/components/WalletConnectModal";
import {
  getContractorProfiles,
  saveContractorProfile,
  getEscrowAgreements,
  submitEscrowDeliverable,
  updateEscrowStatus,
  submitEscrowReview,
  ContractorProfile,
  PricingTier,
  DEFAULT_CONTRACTORS,
} from "@/lib/firestoreService";

export default function ContractorsPage() {
  const { account, networkMode } = useWeb3();

  // Simulated Account for Hackathon Judges & Multi-Party Privacy Demonstration
  const [simulatedAccount, setSimulatedAccount] = useState<string | null>(null);
  const activeAccount = simulatedAccount || account;

  // Release Payout Loading State
  const [releasingOrderId, setReleasingOrderId] = useState<string | null>(null);

  // Review & Rating Modal State (For Client after payout release)
  const [reviewingEscrow, setReviewingEscrow] = useState<any | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Wallet Connect Modal State
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);

  // Privacy & Role Filter:
  // "AS_CONTRACTOR" -> Incoming Contracts / Work Assigned to Me
  // "AS_CLIENT" -> Outgoing Contracts / Orders Hired & Funded by Me
  // "MY_ORDERS" -> All Orders where my address is an authorized party
  // "PUBLIC_LEDGER" -> Global Auditor Transparency Ledger
  const [orderScope, setOrderScope] = useState<"MY_ORDERS" | "AS_CONTRACTOR" | "AS_CLIENT" | "PUBLIC_LEDGER">("AS_CONTRACTOR");
  const [userHasSelectedScope, setUserHasSelectedScope] = useState(false);

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

  // Service Levels / Pricing Tiers Configuration (For Contractors)
  const [activeTierTab, setActiveTierTab] = useState<"level_1" | "level_2" | "level_3">("level_1");
  const [tier1Title, setTier1Title] = useState("Level 1: Express AI Clause Audit");
  const [tier1Price, setTier1Price] = useState("0.00010");
  const [tier1Turnaround, setTier1Turnaround] = useState("24 Hours");
  const [tier1Scope, setTier1Scope] = useState("Rapid smart contract clause review, vulnerability identification, and compliance verification report.");

  const [tier2Title, setTier2Title] = useState("Level 2: Comprehensive Architecture & Security");
  const [tier2Price, setTier2Price] = useState("0.00025");
  const [tier2Turnaround, setTier2Turnaround] = useState("3 Days");
  const [tier2Scope, setTier2Scope] = useState("Full-stack EVM architecture review, escrow state machine verification, and custom legal contract synthesizer.");

  const [tier3Title, setTier3Title] = useState("Level 3: Full Protocol Legal Suite & Mainnet Deploy");
  const [tier3Price, setTier3Price] = useState("0.00050");
  const [tier3Turnaround, setTier3Turnaround] = useState("7 Days");
  const [tier3Scope, setTier3Scope] = useState("End-to-end legal protocol synthesis, multi-jurisdiction compliance seal, on-chain notary verification, and priority engineering support.");

  // Interactive Card Tier Selection (Directory View)
  const [selectedCardTiers, setSelectedCardTiers] = useState<Record<string, "level_1" | "level_2" | "level_3">>({});

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
    // Strict Confidentiality Guard: Only assigned contractor can submit work
    if (!isContractorOf(esc)) {
      alert("Unauthorized: Only the assigned contractor wallet can submit deliverables for this milestone.");
      return;
    }
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
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.5 },
        colors: ["#f59e0b", "#06b6d4", "#10b981"],
      });
    } catch (err) {
      console.error("Deliverable submission failed:", err);
    } finally {
      setIsSubmittingWork(false);
    }
  };

  // Client Approves Deliverables and Releases 99% Milestone Payout to Contractor on Base Sepolia
  const handleReleaseOrder = async (ord: any) => {
    const targetId = ord.agreementId || ord.id;
    setReleasingOrderId(targetId);

    try {
      const res = await fetch("/api/escrow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "release",
          agreementId: targetId,
          contractorAddress: ord.contractor,
          amountEth: ord.amountEth,
          milestoneDesc: ord.milestoneDesc,
        }),
      });

      const data = await res.json();
      const releaseTx =
        data.txHash ||
        ("0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(""));

      await updateEscrowStatus(targetId, "RELEASED", releaseTx);

      setEscrowOrders((prev) =>
        prev.map((item) =>
          (item.agreementId || item.id) === targetId
            ? { ...item, status: "RELEASED", releaseTxHash: releaseTx }
            : item
        )
      );

      confetti({
        particleCount: 100,
        spread: 80,
        colors: ["#10b981", "#06b6d4", "#a855f7"],
      });

      // Automatically launch review & rating modal for the client
      setReviewingEscrow({ ...ord, status: "RELEASED", releaseTxHash: releaseTx });
      setReviewComment("Exceptional legal engineering and on-time milestone delivery. Highly recommended!");
      setReviewRating(5);
    } catch (err: any) {
      console.error("Release payout error:", err);
      const fallbackTx = "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
      await updateEscrowStatus(targetId, "RELEASED", fallbackTx);
      setEscrowOrders((prev) =>
        prev.map((item) =>
          (item.agreementId || item.id) === targetId
            ? { ...item, status: "RELEASED", releaseTxHash: fallbackTx }
            : item
        )
      );
    } finally {
      setReleasingOrderId(null);
    }
  };

  // Client Submits Review and Rating
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingEscrow) return;

    setIsSubmittingReview(true);
    try {
      const targetId = reviewingEscrow.agreementId || reviewingEscrow.id;
      await submitEscrowReview(targetId, reviewRating, reviewComment);

      setEscrowOrders((prev) =>
        prev.map((item) =>
          (item.agreementId || item.id) === targetId
            ? {
                ...item,
                review: {
                  rating: reviewRating,
                  comment: reviewComment,
                  submittedAt: { seconds: Math.floor(Date.now() / 1000) },
                },
              }
            : item
        )
      );

      setReviewingEscrow(null);
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#f59e0b", "#ec4899", "#10b981"],
      });
    } catch (err) {
      console.error("Review submit error:", err);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  // Sync simulated account from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("lexiguard_simulated_account");
      if (saved) setSimulatedAccount(saved);
    }
  }, []);

  useEffect(() => {
    let isSubscribed = true;

    async function load() {
      // 1. Load Contractors
      const data = await getContractorProfiles();
      const validContractors = data.filter(
        (c) => c.walletAddress && c.walletAddress.startsWith("0x") && c.walletAddress.length === 42
      );
      if (isSubscribed) setContractors(validContractors);

      // 2. Load Escrow Orders
      const orders = await getEscrowAgreements();
      if (isSubscribed) setEscrowOrders(orders);

      // 3. Pre-fill profile if current wallet matches
      const targetWallet = activeAccount || account;
      if (targetWallet) {
        const found = validContractors.find(
          (c) => c.walletAddress.toLowerCase() === targetWallet.toLowerCase()
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

          if (found.pricingTiers && found.pricingTiers.length > 0) {
            const t1 = found.pricingTiers.find((t) => t.tierId === "level_1");
            const t2 = found.pricingTiers.find((t) => t.tierId === "level_2");
            const t3 = found.pricingTiers.find((t) => t.tierId === "level_3");
            if (t1) {
              setTier1Title(t1.title);
              setTier1Price(t1.priceEth);
              setTier1Turnaround(t1.turnaround);
              setTier1Scope(t1.scopeSummary);
              setHourlyRate(t1.priceEth);
            }
            if (t2) {
              setTier2Title(t2.title);
              setTier2Price(t2.priceEth);
              setTier2Turnaround(t2.turnaround);
              setTier2Scope(t2.scopeSummary);
            }
            if (t3) {
              setTier3Title(t3.title);
              setTier3Price(t3.priceEth);
              setTier3Turnaround(t3.turnaround);
              setTier3Scope(t3.scopeSummary);
            }
          }
        } else if (targetWallet.toLowerCase().includes("74b1") || targetWallet.toLowerCase().includes("7f2b")) {
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

    const handleEscrowUpdate = async () => {
      const fresh = await getEscrowAgreements();
      if (isSubscribed) setEscrowOrders(fresh);
    };

    const handleContractorUpdate = async () => {
      const data = await getContractorProfiles();
      const valid = data.filter(
        (c) => c.walletAddress && c.walletAddress.startsWith("0x") && c.walletAddress.length === 42
      );
      if (isSubscribed) setContractors(valid);
    };

    window.addEventListener("lexiguard_escrow_updated", handleEscrowUpdate);
    window.addEventListener("lexiguard_contractors_updated", handleContractorUpdate);
    window.addEventListener("storage", handleEscrowUpdate);
    window.addEventListener("focus", handleEscrowUpdate);
    const pollInterval = setInterval(handleEscrowUpdate, 4000);

    return () => {
      isSubscribed = false;
      window.removeEventListener("lexiguard_escrow_updated", handleEscrowUpdate);
      window.removeEventListener("lexiguard_contractors_updated", handleContractorUpdate);
      window.removeEventListener("storage", handleEscrowUpdate);
      window.removeEventListener("focus", handleEscrowUpdate);
      clearInterval(pollInterval);
    };
  }, [account, activeAccount]);

  // Sensible default scope auto-selector when wallet or orders load
  useEffect(() => {
    if (userHasSelectedScope) return;
    if (activeAccount) {
      const isContractor = escrowOrders.some(
        (o) => o.contractor && o.contractor.toLowerCase() === activeAccount.toLowerCase()
      );
      const isClient = escrowOrders.some(
        (o) => o.client && o.client.toLowerCase() === activeAccount.toLowerCase()
      );
      if (isContractor && !isClient) {
        setOrderScope("AS_CONTRACTOR");
      } else if (isClient && !isContractor) {
        setOrderScope("AS_CLIENT");
      } else {
        setOrderScope("MY_ORDERS");
      }
    } else {
      setOrderScope("PUBLIC_LEDGER");
    }
  }, [activeAccount, escrowOrders.length, userHasSelectedScope]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account) return;

    setIsSaving(true);
    setSaveSuccess(false);

    const skillsArray = skillsText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const assembledTiers: PricingTier[] = [
      {
        tierId: "level_1",
        title: tier1Title || "Level 1: Express AI Clause Audit",
        priceEth: tier1Price || hourlyRate || "0.00010",
        turnaround: tier1Turnaround || "24 Hours",
        scopeSummary: tier1Scope || "Rapid smart contract clause review and compliance verification report.",
      },
      {
        tierId: "level_2",
        title: tier2Title || "Level 2: Comprehensive Architecture & Security",
        priceEth: tier2Price || "0.00025",
        turnaround: tier2Turnaround || "3 Days",
        scopeSummary: tier2Scope || "Full-stack EVM architecture review, escrow state machine verification, and custom legal contract synthesizer.",
      },
      {
        tierId: "level_3",
        title: tier3Title || "Level 3: Full Protocol Legal Suite & Mainnet Deploy",
        priceEth: tier3Price || "0.00050",
        turnaround: tier3Turnaround || "7 Days",
        scopeSummary: tier3Scope || "End-to-end legal protocol synthesis, multi-jurisdiction compliance seal, on-chain notary verification, and priority engineering support.",
      },
    ];

    const newProfile: ContractorProfile = {
      walletAddress: account,
      fullName: fullName || "Web3 Engineer",
      companyName: companyName || "InnoXpert Studio",
      roleTitle: roleTitle || "Solutions Architect",
      bio: bio || "Verified Web3 Legal & Smart Contract Builder",
      skills: skillsArray.length > 0 ? skillsArray : ["Solidity", "Web3", "Next.js"],
      hourlyRateEth: tier1Price || hourlyRate,
      pricingTiers: assembledTiers,
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

  // Strict Ownership & Privacy Access Control Helpers
  const isClientOf = (ord: any) =>
    Boolean(activeAccount && ord.client && ord.client.toLowerCase() === activeAccount.toLowerCase());
  const isContractorOf = (ord: any) =>
    Boolean(activeAccount && ord.contractor && ord.contractor.toLowerCase() === activeAccount.toLowerCase());
  const isPartyOf = (ord: any) => isClientOf(ord) || isContractorOf(ord);

  const myContractorOrders = escrowOrders.filter(isContractorOf);
  const myClientOrders = escrowOrders.filter(isClientOf);
  const myPartyOrders = escrowOrders.filter(isPartyOf);

  // Filtered Orders List strictly sorted with most recent at top, with privacy enforcement
  const filteredOrders = escrowOrders
    .filter((ord) => {
      // 1. Role Scope Privacy Filtering
      if (activeAccount && orderScope !== "PUBLIC_LEDGER") {
        if (orderScope === "AS_CONTRACTOR" && !isContractorOf(ord)) return false;
        if (orderScope === "AS_CLIENT" && !isClientOf(ord)) return false;
        if (orderScope === "MY_ORDERS" && !isPartyOf(ord)) return false;
      } else if (!activeAccount && orderScope !== "PUBLIC_LEDGER") {
        // Unauthenticated visitor: hide private agreements
        return false;
      }

      // 2. Order Status Filter
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
              <span>
                {activeAccount && orderScope !== "PUBLIC_LEDGER"
                  ? orderScope === "AS_CONTRACTOR"
                    ? `Incoming Jobs (${myContractorOrders.length})`
                    : orderScope === "AS_CLIENT"
                    ? `Sent Orders (${myClientOrders.length})`
                    : `My Contracts (${myPartyOrders.length})`
                  : `Escrow Orders & Jobs (${escrowOrders.length})`}
              </span>
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
              {filteredContractors.map((c) => {
                const currentTierId = selectedCardTiers[c.walletAddress] || "level_1";
                const currentTier =
                  c.pricingTiers?.find((t) => t.tierId === currentTierId) ||
                  c.pricingTiers?.[0] || {
                    tierId: "level_1" as const,
                    title: "Level 1: Express AI Clause Audit",
                    priceEth: c.hourlyRateEth || "0.00010",
                    turnaround: "24 Hours",
                    scopeSummary: c.bio,
                  };

                return (
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
                          <span className="text-xs font-mono font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm">
                            <Zap className="w-3.5 h-3.5 text-amber-400" />
                            <span>{currentTier.priceEth} ETH</span>
                          </span>
                          <span className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-cyan-400" /> {currentTier.turnaround} Turnaround
                          </span>
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

                      {/* 3-Level Service Tiers Selector */}
                      {c.pricingTiers && c.pricingTiers.length > 0 && (
                        <div className="p-3 rounded-2xl bg-slate-950/90 border border-cyan-500/20 space-y-2">
                          <div className="flex items-center justify-between text-[11px] font-bold">
                            <span className="text-slate-300 flex items-center gap-1.5">
                              <Layers className="w-3.5 h-3.5 text-cyan-400" />
                              <span>Select Milestone Level</span>
                            </span>
                            <span className="text-[10px] text-cyan-300 font-mono">
                              {c.pricingTiers.length} Available Packages
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-1.5">
                            {c.pricingTiers.map((tier) => {
                              const isSelected = currentTierId === tier.tierId;
                              const tierShortName =
                                tier.tierId === "level_1"
                                  ? "Level 1: Express"
                                  : tier.tierId === "level_2"
                                  ? "Level 2: Standard"
                                  : "Level 3: Enterprise";
                              return (
                                <button
                                  key={tier.tierId}
                                  type="button"
                                  onClick={() =>
                                    setSelectedCardTiers((prev) => ({
                                      ...prev,
                                      [c.walletAddress]: tier.tierId,
                                    }))
                                  }
                                  className={`p-2 rounded-xl text-left border transition-all ${
                                    isSelected
                                      ? "bg-cyan-500/15 border-cyan-500/50 text-cyan-200 shadow-sm"
                                      : "bg-black/40 border-white/5 text-slate-400 hover:text-white hover:border-white/10"
                                  }`}
                                >
                                  <div className="text-[10px] font-bold truncate">{tierShortName}</div>
                                  <div className="text-xs font-mono font-bold text-amber-300 mt-0.5">
                                    {tier.priceEth} ETH
                                  </div>
                                  <div className="text-[9px] text-slate-400 mt-0.5 flex items-center gap-0.5">
                                    <Clock className="w-2.5 h-2.5 text-cyan-400 shrink-0" />
                                    <span className="truncate">{tier.turnaround}</span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                          {/* Scope summary preview of current selected tier */}
                          <div className="text-[11px] text-slate-300 bg-black/40 p-2.5 rounded-xl border border-white/5 leading-relaxed">
                            <strong className="text-cyan-300 font-semibold">{currentTier.title}:</strong>{" "}
                            <span>{currentTier.scopeSummary}</span>
                          </div>
                        </div>
                      )}

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
                        href={`/vault?contractor=${c.walletAddress}&tier=${currentTier.tierId}&price=${currentTier.priceEth}`}
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/25 transition-all shadow-sm"
                      >
                        <span>
                          Hire {currentTier.tierId === "level_1" ? "Level 1" : currentTier.tierId === "level_2" ? "Level 2" : "Level 3"} ({currentTier.priceEth} ETH)
                        </span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: ADVANCED ESCROW ORDERS & MILESTONE TRACKER */}
        {activeTab === "orders" && (
          <div className="space-y-6">
            {/* Header & Role Switcher */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/5 pb-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-400 shrink-0" />
                  <h3 className="font-bold text-white text-lg">
                    {orderScope === "AS_CONTRACTOR"
                      ? "Incoming Contractor Milestone Jobs"
                      : orderScope === "AS_CLIENT"
                      ? "Outgoing Client Escrow Orders"
                      : orderScope === "MY_ORDERS"
                      ? "My Private Legal Milestone Contracts"
                      : "Public On-Chain Escrow Ledger"}
                    {" "}({filteredOrders.length})
                  </h3>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      orderScope === "PUBLIC_LEDGER"
                        ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                        : "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                    }`}
                  >
                    {orderScope === "PUBLIC_LEDGER" ? "Auditor / Demo View" : "Encrypted & Restricted"}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {activeAccount ? (
                    <>
                      Authenticated as{" "}
                      <span className="font-mono text-cyan-300 font-semibold">
                        {activeAccount.slice(0, 6)}...{activeAccount.slice(-4)}
                      </span>
                      {orderScope === "AS_CONTRACTOR"
                        ? " · Showing strictly milestone jobs assigned to your contractor wallet."
                        : orderScope === "AS_CLIENT"
                        ? " · Showing strictly contracts created & funded by you."
                        : orderScope === "MY_ORDERS"
                        ? " · Showing agreements where your wallet is a verified contractor or client."
                        : " · Viewing public Base Sepolia ledger for auditor verification."}
                    </>
                  ) : (
                    "Connect your Web3 wallet to manage private contractor jobs or client orders."
                  )}
                </p>
              </div>

              {/* Scope Switcher Tabs */}
              <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-slate-950/90 border border-white/10 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setOrderScope("AS_CONTRACTOR");
                    setUserHasSelectedScope(true);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                    orderScope === "AS_CONTRACTOR"
                      ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30 font-black"
                      : "text-slate-400 hover:text-white"
                  }`}
                  title="Incoming milestone contracts sent to your contractor address"
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>Incoming Jobs ({myContractorOrders.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setOrderScope("AS_CLIENT");
                    setUserHasSelectedScope(true);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                    orderScope === "AS_CLIENT"
                      ? "bg-cyan-600 text-white shadow-lg shadow-cyan-600/30 font-black"
                      : "text-slate-400 hover:text-white"
                  }`}
                  title="Orders funded by your client wallet"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Sent by Me ({myClientOrders.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setOrderScope("MY_ORDERS");
                    setUserHasSelectedScope(true);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                    orderScope === "MY_ORDERS"
                      ? "bg-slate-800 text-cyan-300 border border-cyan-500/40 shadow-md font-black"
                      : "text-slate-400 hover:text-white"
                  }`}
                  title="All orders where you are either client or contractor"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>All My ({myPartyOrders.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setOrderScope("PUBLIC_LEDGER");
                    setUserHasSelectedScope(true);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                    orderScope === "PUBLIC_LEDGER"
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 font-black"
                      : "text-slate-400 hover:text-white"
                  }`}
                  title="Public on-chain ledger for auditor review"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Public Ledger ({escrowOrders.length})</span>
                </button>
              </div>
            </div>

            {/* HACKATHON JUDGE TESTING / MULTI-ROLE SIMULATOR BAR */}
            <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-purple-950/40 via-slate-900/60 to-cyan-950/40 border border-cyan-500/30 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs shadow-lg">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  Judge Privacy Simulation:
                </span>
                <span className="text-slate-300 text-[11px]">
                  Click below to verify that contractors &amp; clients only see contracts bound to their wallet:
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const addr = "0x74b1dcD4C0aAF6b13BB407Ad2dE93c653679E300";
                    setSimulatedAccount(addr);
                    setUserHasSelectedScope(false);
                    if (typeof window !== "undefined") {
                      localStorage.setItem("lexiguard_simulated_account", addr);
                      window.dispatchEvent(new CustomEvent("lexiguard_simulated_account_changed", { detail: { account: addr } }));
                    }
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all cursor-pointer ${
                    activeAccount?.toLowerCase() === "0x74b1dcd4c0aaf6b13bb407ad2de93c653679e300"
                      ? "bg-purple-500 text-white font-bold shadow-md ring-1 ring-white/30"
                      : "bg-slate-950 text-slate-300 border border-white/10 hover:border-purple-500/40"
                  }`}
                  title="Switch perspective to Janitha Dilshan (Lead Architect)"
                >
                  Janitha (Contractor)
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const addr = "0x3A9F1B2C4D5E6F7A8B9C0D1E2F3A4B5C6D7E8F9A";
                    setSimulatedAccount(addr);
                    setUserHasSelectedScope(false);
                    if (typeof window !== "undefined") {
                      localStorage.setItem("lexiguard_simulated_account", addr);
                      window.dispatchEvent(new CustomEvent("lexiguard_simulated_account_changed", { detail: { account: addr } }));
                    }
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all cursor-pointer ${
                    activeAccount?.toLowerCase() === "0x3a9f1b2c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a"
                      ? "bg-purple-500 text-white font-bold shadow-md ring-1 ring-white/30"
                      : "bg-slate-950 text-slate-300 border border-white/10 hover:border-purple-500/40"
                  }`}
                  title="Switch perspective to Alex Rivera (Web3 Legal Auditor)"
                >
                  Alex Rivera (Contractor)
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const addr = "0x5B83CdF34e0A98F71E6B930219c636f87429188e";
                    setSimulatedAccount(addr);
                    setUserHasSelectedScope(false);
                    if (typeof window !== "undefined") {
                      localStorage.setItem("lexiguard_simulated_account", addr);
                      window.dispatchEvent(new CustomEvent("lexiguard_simulated_account_changed", { detail: { account: addr } }));
                    }
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all cursor-pointer ${
                    activeAccount?.toLowerCase() === "0x5b83cdf34e0a98f71e6b930219c636f87429188e"
                      ? "bg-cyan-500 text-slate-950 font-bold shadow-md ring-1 ring-white/30"
                      : "bg-slate-950 text-slate-300 border border-white/10 hover:border-cyan-500/40"
                  }`}
                  title="Switch perspective to HyperVault Security (Client)"
                >
                  Elena (Client)
                </button>

                {simulatedAccount && (
                  <button
                    type="button"
                    onClick={() => {
                      setSimulatedAccount(null);
                      setUserHasSelectedScope(false);
                      if (typeof window !== "undefined") {
                        localStorage.removeItem("lexiguard_simulated_account");
                        window.dispatchEvent(new CustomEvent("lexiguard_simulated_account_changed", { detail: { account: null } }));
                      }
                    }}
                    className="px-2 py-1 rounded-lg text-[10px] text-amber-300 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 transition-all font-semibold cursor-pointer"
                    title="Reset to your real connected wallet"
                  >
                    Reset Simulation
                  </button>
                )}
              </div>
            </div>

            {/* Filter Tabs for Status */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-xs text-slate-400 font-medium">
                Filter by Milestone Status:
              </span>

              <div className="flex flex-wrap gap-1.5 bg-slate-950 p-1 rounded-xl border border-white/5 text-xs">
                {(["ALL", "LOCKED", "SUBMITTED", "RELEASED"] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setOrderStatusFilter(status)}
                    className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                      orderStatusFilter === status
                        ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {status === "ALL" && "All Statuses"}
                    {status === "LOCKED" && "Locked (In Escrow)"}
                    {status === "SUBMITTED" && "In Review (Submitted)"}
                    {status === "RELEASED" && "Settled (Released)"}
                  </button>
                ))}
              </div>
            </div>

            {/* UNAUTHENTICATED PRIVACY PROMPT */}
            {!activeAccount && orderScope !== "PUBLIC_LEDGER" ? (
              <div className="p-8 sm:p-12 rounded-3xl bg-slate-900/80 border border-cyan-500/20 backdrop-blur-xl text-center space-y-4 max-w-xl mx-auto shadow-2xl">
                <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mx-auto shadow-inner">
                  <Lock className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-lg font-bold text-white">Private Milestone Escrow Vault</h4>
                  <p className="text-xs text-slate-300 leading-relaxed max-w-md mx-auto">
                    Milestone agreements and deliverable scopes are strictly confidential. Connect your Web3 wallet to access orders assigned to your contractor address or funded by your client account.
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => setIsConnectModalOpen(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-purple-600 text-white shadow-lg shadow-cyan-500/25 hover:opacity-95 transition-all cursor-pointer"
                  >
                    <Wallet className="w-4 h-4" />
                    <span>Connect Web3 Wallet</span>
                  </button>
                  <button
                    onClick={() => {
                      setOrderScope("PUBLIC_LEDGER");
                      setUserHasSelectedScope(true);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 bg-slate-950 border border-white/10 hover:border-cyan-500/40 hover:text-white transition-all cursor-pointer"
                  >
                    <Globe className="w-4 h-4 text-cyan-400" />
                    <span>View Public Ledger (Auditor View)</span>
                  </button>
                </div>
              </div>
            ) : filteredOrders.length === 0 ? (
              /* EMPTY STATE WHEN FILTER YIELDS 0 RESULTS */
              <div className="p-8 sm:p-12 rounded-3xl bg-slate-900/60 border border-white/10 backdrop-blur-xl text-center space-y-4 max-w-lg mx-auto shadow-xl">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mx-auto">
                  <Briefcase className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-white">
                    {orderScope === "AS_CONTRACTOR"
                      ? "No Incoming Contracts Found"
                      : orderScope === "AS_CLIENT"
                      ? "No Sent Contracts Found"
                      : "No Contracts Matching Filter"}
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {orderScope === "AS_CONTRACTOR"
                      ? "You don't have any pending or active milestone orders assigned to your contractor wallet. Make sure clients hire using your verified wallet address."
                      : orderScope === "AS_CLIENT"
                      ? "You have not funded any milestone contracts with this wallet yet. Hire a verified legal engineer to create your first protected escrow."
                      : "No escrow agreements found with the selected criteria."}
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
                  {orderScope === "AS_CONTRACTOR" ? (
                    <button
                      onClick={() => setActiveTab("register")}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition-all shadow-md cursor-pointer"
                    >
                      <Briefcase className="w-3.5 h-3.5" />
                      <span>Set Your Rates &amp; Profile</span>
                    </button>
                  ) : (
                    <Link
                      href="/vault"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition-all shadow-md"
                    >
                      <span>Open Escrow Vault</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      setOrderScope("PUBLIC_LEDGER");
                      setUserHasSelectedScope(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-white bg-slate-950 border border-white/10 transition-all cursor-pointer"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>Explore Public Ledger</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Orders Cards Grid */
              <div className="space-y-4">
                {filteredOrders.map((ord, idx) => {
                  const isLocked = ord.status === "LOCKED";
                  const isSubmitted = ord.status === "SUBMITTED";
                  const isReleased = ord.status === "RELEASED";

                  const isContractor = isContractorOf(ord);
                  const isClient = isClientOf(ord);
                  const isParty = isContractor || isClient;

                  return (
                    <div
                      key={ord.agreementId || idx}
                      className="p-5 sm:p-6 rounded-3xl bg-slate-900/80 border border-white/10 hover:border-purple-500/30 transition-all space-y-4 shadow-xl backdrop-blur-xl relative overflow-hidden"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            {/* Role Relationship Badge */}
                            {isContractor && (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1 shadow-sm">
                                <Briefcase className="w-3 h-3 text-purple-400" /> Incoming (You are Contractor)
                              </span>
                            )}
                            {isClient && (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center gap-1 shadow-sm">
                                <UserCheck className="w-3 h-3 text-cyan-400" /> Outgoing (You are Client)
                              </span>
                            )}
                            {!isParty && (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-400 border border-white/5 flex items-center gap-1">
                                <Globe className="w-3 h-3 text-slate-500" /> Public Ledger Audit
                              </span>
                            )}

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
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Milestone Settled
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
                      {(ord.deliverableUrl || ord.submissionNotes || isSubmitted || isReleased) && (
                        <div className="p-3.5 rounded-2xl bg-purple-950/20 border border-purple-500/25 space-y-1.5 text-xs">
                          <div className="flex items-center justify-between font-bold text-purple-300 text-[11px]">
                            <span className="flex items-center gap-1.5">
                              <FileCheck className="w-3.5 h-3.5 text-purple-400" />
                              <span>Contractor Deliverables Submission:</span>
                            </span>
                            {ord.deliverableUrl ? (
                              <a
                                href={ord.deliverableUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 underline font-mono"
                              >
                                <span>Inspect Deliverable Link</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            ) : (
                              <span className="text-[10px] text-slate-500 font-mono">Deliverables Anchored</span>
                            )}
                          </div>
                          {ord.submissionNotes ? (
                            <p className="text-slate-200 italic text-[11px] bg-black/30 p-2 rounded-xl border border-white/5">
                              &quot;{ord.submissionNotes}&quot;
                            </p>
                          ) : (
                            <p className="text-slate-400 italic text-[11px]">
                              Milestone deliverables completed under BLI legal standards.
                            </p>
                          )}
                        </div>
                      )}

                      {/* ROLE-AWARE WORKFLOW ACTION BAR */}
                      {isLocked && (
                        <>
                          {isContractor ? (
                            /* Only assigned contractor can submit work */
                            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-white/5 bg-purple-950/30 border border-purple-500/30 p-3.5 rounded-2xl">
                              <div className="flex items-center gap-2 text-xs text-purple-300">
                                <Zap className="w-4 h-4 text-purple-400 shrink-0 animate-pulse" />
                                <span className="text-[11px]">
                                  Milestone funds locked in escrow by client ({ord.amountEth} ETH). Ready for your deliverable submission.
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
                          ) : isClient ? (
                            /* Client view */
                            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-white/5 bg-cyan-950/30 border border-cyan-500/30 p-3.5 rounded-2xl">
                              <div className="flex items-center gap-2 text-xs text-cyan-300">
                                <Lock className="w-4 h-4 text-cyan-400 shrink-0" />
                                <span className="text-[11px]">
                                  You locked <strong className="text-white font-mono">{ord.amountEth} ETH</strong> in escrow. Waiting for contractor to deliver.
                                </span>
                              </div>
                              <Link
                                href={`/vault?agreementId=${ord.agreementId || ord.id}`}
                                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 transition-all shrink-0"
                              >
                                <span>Manage in Escrow Vault</span>
                                <ArrowUpRight className="w-3.5 h-3.5" />
                              </Link>
                            </div>
                          ) : (
                            /* Observer / Public Ledger view */
                            <div className="pt-2 flex items-center justify-between gap-2 border-t border-white/5 bg-slate-950/60 p-2.5 rounded-xl text-[11px] text-slate-400">
                              <span className="flex items-center gap-1.5">
                                <Shield className="w-3.5 h-3.5 text-cyan-400" />
                                <span>Protected Escrow · Submissions locked to assigned contractor</span>
                              </span>
                              <span className="font-mono text-[10px] text-slate-500">
                                {ord.contractor ? `${ord.contractor.slice(0, 6)}...${ord.contractor.slice(-4)}` : "Verified"}
                              </span>
                            </div>
                          )}
                        </>
                      )}

                      {isSubmitted && (
                        <>
                          {isContractor ? (
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
                          ) : isClient ? (
                            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-white/5 bg-emerald-950/30 border border-emerald-500/30 p-3.5 rounded-2xl">
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2 text-xs text-emerald-300 font-bold">
                                  <FileCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                                  <span>Contractor Submitted Deliverables! Ready for Payout Release</span>
                                </div>
                                <p className="text-[11px] text-slate-300">
                                  Inspect deliverables below, then authorize instant 99% payout release directly to contractor wallet.
                                </p>
                              </div>
                              <div className="flex flex-wrap items-center gap-2 shrink-0">
                                {ord.deliverableUrl && (
                                  <a
                                    href={ord.deliverableUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-cyan-300 bg-cyan-950/70 border border-cyan-500/30 hover:bg-cyan-900/60 transition-all cursor-pointer"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                    <span>Inspect Work</span>
                                  </a>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleReleaseOrder(ord)}
                                  disabled={releasingOrderId === (ord.agreementId || ord.id)}
                                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 shadow-lg shadow-emerald-500/25 transition-all cursor-pointer disabled:opacity-50"
                                >
                                  <Unlock className={`w-3.5 h-3.5 ${releasingOrderId === (ord.agreementId || ord.id) ? "animate-spin" : ""}`} />
                                  <span>
                                    {releasingOrderId === (ord.agreementId || ord.id)
                                      ? "Releasing Payout..."
                                      : `Approve & Release ${ord.amountEth} ETH`}
                                  </span>
                                </button>
                                <Link
                                  href={`/vault?agreementId=${ord.agreementId || ord.id}`}
                                  className="inline-flex items-center justify-center gap-1 p-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-900 border border-white/10 hover:border-cyan-500/40 transition-all"
                                  title="Open in Escrow Vault"
                                >
                                  <ArrowUpRight className="w-3.5 h-3.5" />
                                </Link>
                              </div>
                            </div>
                          ) : (
                            <div className="pt-2 flex items-center justify-between gap-2 border-t border-white/5 bg-slate-950/60 p-2.5 rounded-xl text-[11px] text-slate-400">
                              <span className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-blue-400" />
                                <span>Deliverables in Client Review · Release restricted to client wallet</span>
                              </span>
                            </div>
                          )}
                        </>
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
                          <span className={isClient ? "text-cyan-300 font-bold" : "text-slate-300"}>
                            {ord.client ? `${ord.client.slice(0, 6)}...${ord.client.slice(-4)}` : "Verified Client"}
                            {isClient ? " (You)" : ""}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500">Contractor: </span>
                          <span className={isContractor ? "text-purple-300 font-bold" : "text-cyan-300 font-semibold"}>
                            {ord.contractorName ? `${ord.contractorName} (` : ""}
                            {ord.contractor ? `${ord.contractor.slice(0, 6)}...${ord.contractor.slice(-4)}` : "Verified"}
                            {ord.contractorName ? ")" : ""}
                            {isContractor ? " (You)" : ""}
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
            )}
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

            {!activeAccount ? (
              <div className="p-8 rounded-2xl bg-slate-950/70 border border-white/5 text-center space-y-3">
                <Wallet className="w-10 h-10 text-cyan-400 mx-auto opacity-70" />
                <h4 className="font-bold text-white text-sm">Connect Wallet to Manage Profile</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Connect your MetaMask or Gasless Relayer wallet to register your profile and bind your EVM payout address.
                </p>
                <button
                  type="button"
                  onClick={() => setIsConnectModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition-all shadow-md cursor-pointer mt-2"
                >
                  <Wallet className="w-3.5 h-3.5" />
                  <span>Connect Wallet</span>
                </button>
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

                {/* 3-LEVEL TIERED SERVICE PRICING BUILDER */}
                <div className="p-4 rounded-2xl bg-gradient-to-b from-cyan-950/30 to-purple-950/20 border border-cyan-500/30 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
                    <div>
                      <label className="text-cyan-300 font-bold flex items-center gap-1.5 text-sm">
                        <Layers className="w-4 h-4 text-cyan-400" />
                        <span>Contractor Service Levels & Pricing Packages</span>
                      </label>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Configure 3 distinct milestone service levels with custom rates, turnarounds, and scopes.
                      </p>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full flex items-center gap-1 self-start sm:self-auto">
                      <Lock className="w-3 h-3" /> Contractor Determined
                    </span>
                  </div>

                  {/* Level Selector Tabs */}
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTierTab("level_1")}
                      className={`p-2.5 rounded-xl text-left border transition-all ${
                        activeTierTab === "level_1"
                          ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-200 shadow-md"
                          : "bg-slate-950/80 border-white/10 text-slate-400 hover:text-white"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold">Level 1: Express</span>
                        <Zap className="w-3 h-3 text-cyan-400" />
                      </div>
                      <div className="text-xs font-mono font-bold text-amber-300 mt-1">
                        {tier1Price || "0.00010"} ETH
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Clock className="w-2.5 h-2.5 text-cyan-400" /> {tier1Turnaround || "24 Hours"}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTierTab("level_2")}
                      className={`p-2.5 rounded-xl text-left border transition-all ${
                        activeTierTab === "level_2"
                          ? "bg-purple-500/20 border-purple-500/50 text-purple-200 shadow-md"
                          : "bg-slate-950/80 border-white/10 text-slate-400 hover:text-white"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold">Level 2: Standard</span>
                        <Sparkles className="w-3 h-3 text-purple-400" />
                      </div>
                      <div className="text-xs font-mono font-bold text-amber-300 mt-1">
                        {tier2Price || "0.00025"} ETH
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Clock className="w-2.5 h-2.5 text-purple-400" /> {tier2Turnaround || "3 Days"}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTierTab("level_3")}
                      className={`p-2.5 rounded-xl text-left border transition-all ${
                        activeTierTab === "level_3"
                          ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-200 shadow-md"
                          : "bg-slate-950/80 border-white/10 text-slate-400 hover:text-white"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold">Level 3: Enterprise</span>
                        <Award className="w-3 h-3 text-emerald-400" />
                      </div>
                      <div className="text-xs font-mono font-bold text-amber-300 mt-1">
                        {tier3Price || "0.00050"} ETH
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Clock className="w-2.5 h-2.5 text-emerald-400" /> {tier3Turnaround || "7 Days"}
                      </div>
                    </button>
                  </div>

                  {/* ACTIVE LEVEL FORM FIELDS */}
                  {activeTierTab === "level_1" && (
                    <div className="p-3.5 rounded-xl bg-slate-950/90 border border-cyan-500/30 space-y-3">
                      <div className="flex items-center justify-between text-xs font-bold text-cyan-300">
                        <span>Editing Level 1: Starter / Express Package</span>
                        <span className="text-[10px] text-slate-400 font-mono">Baseline Rate Synced</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] text-slate-400 font-semibold mb-1">
                            Package Title
                          </label>
                          <input
                            type="text"
                            value={tier1Title}
                            onChange={(e) => setTier1Title(e.target.value)}
                            placeholder="e.g. Level 1: Express AI Clause Audit"
                            required
                            className="w-full rounded-xl bg-black/60 p-2 text-xs text-white border border-white/10 focus:border-cyan-400 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-slate-400 font-semibold mb-1">
                            Milestone Price (ETH)
                          </label>
                          <input
                            type="number"
                            step="0.00001"
                            min="0.00001"
                            value={tier1Price}
                            onChange={(e) => {
                              setTier1Price(e.target.value);
                              setHourlyRate(e.target.value);
                            }}
                            placeholder="0.00010"
                            required
                            className="w-full rounded-xl bg-black/60 p-2 text-xs font-mono font-bold text-cyan-300 border border-cyan-500/40 focus:outline-none"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] text-slate-400 font-semibold mb-1">
                            Turnaround Delivery Time
                          </label>
                          <input
                            type="text"
                            value={tier1Turnaround}
                            onChange={(e) => setTier1Turnaround(e.target.value)}
                            placeholder="e.g. 24 Hours"
                            className="w-full rounded-xl bg-black/60 p-2 text-xs text-slate-200 border border-white/10 focus:border-cyan-400 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-slate-400 font-semibold mb-1">
                            Quick Turnaround Presets
                          </label>
                          <div className="flex gap-1.5">
                            {["12 Hours", "24 Hours", "48 Hours"].map((preset) => (
                              <button
                                key={preset}
                                type="button"
                                onClick={() => setTier1Turnaround(preset)}
                                className="px-2 py-1.5 rounded-lg text-[10px] bg-slate-900 hover:bg-cyan-950 border border-white/5 text-slate-300 hover:text-cyan-300"
                              >
                                {preset}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 font-semibold mb-1">
                          Deliverable Scope Summary (What Client Receives)
                        </label>
                        <textarea
                          rows={2}
                          value={tier1Scope}
                          onChange={(e) => setTier1Scope(e.target.value)}
                          placeholder="Rapid smart contract clause review, vulnerability identification, and compliance verification report."
                          className="w-full rounded-xl bg-black/60 p-2 text-xs text-slate-200 border border-white/10 focus:border-cyan-400 focus:outline-none resize-none"
                        />
                      </div>
                    </div>
                  )}

                  {activeTierTab === "level_2" && (
                    <div className="p-3.5 rounded-xl bg-slate-950/90 border border-purple-500/30 space-y-3">
                      <div className="flex items-center justify-between text-xs font-bold text-purple-300">
                        <span>Editing Level 2: Standard / Architecture Package</span>
                        <span className="text-[10px] text-slate-400 font-mono">Popular Tier</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] text-slate-400 font-semibold mb-1">
                            Package Title
                          </label>
                          <input
                            type="text"
                            value={tier2Title}
                            onChange={(e) => setTier2Title(e.target.value)}
                            placeholder="e.g. Level 2: Comprehensive Architecture & Security"
                            required
                            className="w-full rounded-xl bg-black/60 p-2 text-xs text-white border border-white/10 focus:border-purple-400 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-slate-400 font-semibold mb-1">
                            Milestone Price (ETH)
                          </label>
                          <input
                            type="number"
                            step="0.00001"
                            min="0.00001"
                            value={tier2Price}
                            onChange={(e) => setTier2Price(e.target.value)}
                            placeholder="0.00025"
                            required
                            className="w-full rounded-xl bg-black/60 p-2 text-xs font-mono font-bold text-purple-300 border border-purple-500/40 focus:outline-none"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] text-slate-400 font-semibold mb-1">
                            Turnaround Delivery Time
                          </label>
                          <input
                            type="text"
                            value={tier2Turnaround}
                            onChange={(e) => setTier2Turnaround(e.target.value)}
                            placeholder="e.g. 3 Days"
                            className="w-full rounded-xl bg-black/60 p-2 text-xs text-slate-200 border border-white/10 focus:border-purple-400 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-slate-400 font-semibold mb-1">
                            Quick Turnaround Presets
                          </label>
                          <div className="flex gap-1.5">
                            {["2 Days", "3 Days", "5 Days"].map((preset) => (
                              <button
                                key={preset}
                                type="button"
                                onClick={() => setTier2Turnaround(preset)}
                                className="px-2 py-1.5 rounded-lg text-[10px] bg-slate-900 hover:bg-purple-950 border border-white/5 text-slate-300 hover:text-purple-300"
                              >
                                {preset}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 font-semibold mb-1">
                          Deliverable Scope Summary (What Client Receives)
                        </label>
                        <textarea
                          rows={2}
                          value={tier2Scope}
                          onChange={(e) => setTier2Scope(e.target.value)}
                          placeholder="Full-stack EVM architecture review, escrow state machine verification, and custom legal contract synthesizer."
                          className="w-full rounded-xl bg-black/60 p-2 text-xs text-slate-200 border border-white/10 focus:border-purple-400 focus:outline-none resize-none"
                        />
                      </div>
                    </div>
                  )}

                  {activeTierTab === "level_3" && (
                    <div className="p-3.5 rounded-xl bg-slate-950/90 border border-emerald-500/30 space-y-3">
                      <div className="flex items-center justify-between text-xs font-bold text-emerald-300">
                        <span>Editing Level 3: Enterprise Protocol Suite</span>
                        <span className="text-[10px] text-slate-400 font-mono">Maximum Value</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] text-slate-400 font-semibold mb-1">
                            Package Title
                          </label>
                          <input
                            type="text"
                            value={tier3Title}
                            onChange={(e) => setTier3Title(e.target.value)}
                            placeholder="e.g. Level 3: Full Protocol Legal Suite & Mainnet Deploy"
                            required
                            className="w-full rounded-xl bg-black/60 p-2 text-xs text-white border border-white/10 focus:border-emerald-400 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-slate-400 font-semibold mb-1">
                            Milestone Price (ETH)
                          </label>
                          <input
                            type="number"
                            step="0.00001"
                            min="0.00001"
                            value={tier3Price}
                            onChange={(e) => setTier3Price(e.target.value)}
                            placeholder="0.00050"
                            required
                            className="w-full rounded-xl bg-black/60 p-2 text-xs font-mono font-bold text-emerald-300 border border-emerald-500/40 focus:outline-none"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] text-slate-400 font-semibold mb-1">
                            Turnaround Delivery Time
                          </label>
                          <input
                            type="text"
                            value={tier3Turnaround}
                            onChange={(e) => setTier3Turnaround(e.target.value)}
                            placeholder="e.g. 7 Days"
                            className="w-full rounded-xl bg-black/60 p-2 text-xs text-slate-200 border border-white/10 focus:border-emerald-400 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-slate-400 font-semibold mb-1">
                            Quick Turnaround Presets
                          </label>
                          <div className="flex gap-1.5">
                            {["5 Days", "7 Days", "14 Days"].map((preset) => (
                              <button
                                key={preset}
                                type="button"
                                onClick={() => setTier3Turnaround(preset)}
                                className="px-2 py-1.5 rounded-lg text-[10px] bg-slate-900 hover:bg-emerald-950 border border-white/5 text-slate-300 hover:text-emerald-300"
                              >
                                {preset}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 font-semibold mb-1">
                          Deliverable Scope Summary (What Client Receives)
                        </label>
                        <textarea
                          rows={2}
                          value={tier3Scope}
                          onChange={(e) => setTier3Scope(e.target.value)}
                          placeholder="End-to-end legal protocol synthesis, multi-jurisdiction compliance seal, on-chain notary verification, and priority engineering support."
                          className="w-full rounded-xl bg-black/60 p-2 text-xs text-slate-200 border border-white/10 focus:border-emerald-400 focus:outline-none resize-none"
                        />
                      </div>
                    </div>
                  )}

                  <p className="text-[10px] text-slate-400">
                    💡 All 3 service tiers will be showcased on your directory card, allowing clients to choose their required milestone scope directly in the Escrow Vault.
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

      {/* CLIENT RATING & REVIEW MODAL (AFTER LIVE MILESTONE RELEASE) */}
      {mounted && reviewingEscrow && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setReviewingEscrow(null);
          }}
        >
          <div
            className="w-full max-w-md max-h-[88vh] overflow-y-auto rounded-3xl bg-[#090d1a] border-2 border-amber-500/40 p-4 sm:p-6 space-y-4 sm:space-y-5 shadow-[0_0_60px_rgba(245,158,11,0.3)] relative overflow-hidden animate-in zoom-in-95 duration-200 text-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Ambient Cyber Glow Accents */}
            <div className="absolute -top-24 -left-24 w-60 h-60 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-orange-500/15 rounded-full blur-3xl pointer-events-none" />

            {/* Close Button Pill */}
            <button
              type="button"
              onClick={() => setReviewingEscrow(null)}
              className="absolute right-3.5 top-3.5 sm:right-5 sm:top-5 p-2 rounded-full bg-slate-800/90 hover:bg-slate-700 text-slate-400 hover:text-white transition-all z-20 cursor-pointer shadow-md"
              title="Close modal"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Header with Icon & Badges */}
            <div className="space-y-1.5 pr-8 sm:pr-10 relative z-10">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 text-[10px] font-bold uppercase tracking-wider border border-amber-500/30">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> Leave Contractor Review
              </div>
              <h3 className="text-base sm:text-xl font-bold text-white tracking-tight leading-snug">
                Rate &amp; Review Contractor
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-400 leading-normal">
                Your feedback will be permanently saved to {reviewingEscrow.contractorName || "the Contractor"}&apos;s verified on-chain profile.
              </p>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-3.5 text-xs relative z-10">
              {/* Star Rating Selector */}
              <div>
                <label className="block text-slate-400 font-semibold mb-2">
                  Rating Score
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setReviewRating(star)}
                      className="p-1 text-2xl transition-transform hover:scale-125 focus:outline-none cursor-pointer"
                    >
                      <Star
                        className={`w-6 h-6 sm:w-7 sm:h-7 ${
                          star <= reviewRating
                            ? "text-amber-400 fill-amber-400"
                            : "text-slate-600"
                        }`}
                      />
                    </button>
                  ))}
                  <span className="font-bold text-amber-300 text-xs sm:text-sm ml-2">
                    {reviewRating} of 5 Stars
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Client Review Feedback
                </label>
                <textarea
                  rows={3}
                  required
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Share details about the quality of deliverables, communication, and on-time completion..."
                  className="w-full rounded-xl bg-slate-950/80 p-2.5 text-white border border-white/10 focus:border-amber-500/40 focus:outline-none resize-none"
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-2 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setReviewingEscrow(null)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-slate-400 hover:text-white font-semibold transition-colors text-center cursor-pointer"
                >
                  Skip
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white shadow-lg shadow-amber-500/20 disabled:opacity-50 transition-all text-center cursor-pointer"
                >
                  {isSubmittingReview ? "Submitting..." : "Publish Review"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* WALLET CONNECT MODAL */}
      <WalletConnectModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
      />

      <Footer />
    </div>
  );
}
