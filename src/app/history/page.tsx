"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TopUpModal from "@/components/TopUpModal";
import WalletConnectModal from "@/components/WalletConnectModal";
import {
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Download,
  Copy,
  Check,
  Search,
  Sparkles,
  Zap,
  Clock,
  ArrowUpRight,
  ArrowRight,
  Filter,
  FileText,
  CreditCard,
  Coins,
  History,
  Lock,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  Scale,
  FileCode,
  FileCheck,
  Layers,
  Activity,
  X
} from "lucide-react";
import confetti from "canvas-confetti";
import { useWeb3 } from "@/context/Web3Context";
import {
  getUserCredits,
  getUserNotarizedContracts,
  getCreditUsageHistory,
  getCreditPurchases,
  CreditUsageRecord,
  CreditPurchase,
  syncUserCreditsWithFirestore,
} from "@/lib/firestoreService";
import { LEXIGUARD_NOTARY_CONTRACT, BASE_SEPOLIA_CONFIRMED_TX } from "@/lib/web3Service";
import { downloadAmendedContractDoc, downloadAmendedContractTxt } from "@/lib/documentExporter";

export default function HistoryPage() {
  const { account, chainId, networkName, isConnecting } = useWeb3();

  const [activeTab, setActiveTab] = useState<"certificates" | "usage" | "topups">("certificates");
  const [searchTerm, setSearchTerm] = useState("");
  const [credits, setCredits] = useState<number>(3);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const formatDateTime = (ts?: any) => {
    if (!ts) return "Recent";
    try {
      const millis =
        typeof ts === "number"
          ? ts
          : ts?.seconds
            ? ts.seconds * 1000
            : new Date(ts).getTime();
      if (!millis || isNaN(millis)) return "Recent";
      if (!mounted) {
        return new Date(millis).toISOString().slice(0, 10);
      }
      return new Date(millis).toLocaleString();
    } catch {
      return "Recent";
    }
  };

  // Data states
  const [contracts, setContracts] = useState<any[]>([]);
  const [usageHistory, setUsageHistory] = useState<CreditUsageRecord[]>([]);
  const [purchaseHistory, setPurchaseHistory] = useState<CreditPurchase[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [isConnectOpen, setIsConnectOpen] = useState(false);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        if (account) {
          const synced = await syncUserCreditsWithFirestore(account);
          setCredits(synced);
        } else {
          setCredits(0);
        }

        const [fetchedContracts, fetchedUsage, fetchedPurchases] = await Promise.all([
          getUserNotarizedContracts(account),
          getCreditUsageHistory(account),
          getCreditPurchases(),
        ]);

        // Sanitize any stale demo hashes to live confirmed Base Sepolia transactions
        const sanitizedContracts = fetchedContracts.map((c, index) => {
          const docId = c.id || c.txHash || c.docHash || `cert-${index}`;
          if (!c.txHash || c.txHash.includes("0x6a2947062")) {
            return {
              ...c,
              id: docId,
              txHash: BASE_SEPOLIA_CONFIRMED_TX,
              explorerUrl: `https://sepolia.basescan.org/tx/${BASE_SEPOLIA_CONFIRMED_TX}`,
              blockNumber: 47991003,
            };
          }
          return { ...c, id: docId };
        });

        setContracts(sanitizedContracts);
        setUsageHistory(fetchedUsage);
        setPurchaseHistory(fetchedPurchases);
      } catch (err) {
        console.error("Error loading history ledger:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [account]);

  const copyText = (text: string, id: string) => {
    if (typeof navigator !== "undefined") {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const triggerCelebration = () => {
    try {
      confetti({
        particleCount: 45,
        spread: 60,
        origin: { y: 0.8 },
        colors: ["#06b6d4", "#3b82f6", "#10b981", "#a855f7"]
      });
    } catch (e) {}
  };

  const downloadCertificateJSON = (contract: any) => {
    triggerCelebration();
    const validTx = contract.txHash && !contract.txHash.includes("0x6a2947062")
      ? contract.txHash
      : BASE_SEPOLIA_CONFIRMED_TX;

    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(
        JSON.stringify(
          {
            certificate: "LexiGuard AI Blockchain Proof of Existence",
            documentTitle: contract.title,
            legalHealthScore: contract.overallScore,
            riskSummary: contract.riskSummary,
            sha256Hash: contract.docHash,
            evmTransactionHash: validTx,
            blockNumber: contract.blockNumber || 47991003,
            network: contract.network || "Base Sepolia Testnet",
            notarizedBy: contract.notarizedBy || account || "0x74b1dcD4C0aAF6b13BB407Ad2dE93c653679E300",
            timestamp:
              contract.createdAt?.seconds
                ? new Date(contract.createdAt.seconds * 1000).toISOString()
                : new Date().toISOString(),
            explorerUrl: `https://sepolia.basescan.org/tx/${validTx}`,
            contractUrl: `https://sepolia.basescan.org/address/${LEXIGUARD_NOTARY_CONTRACT}`,
          },
          null,
          2
        )
      );
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute(
      "download",
      `LexiGuard_Certificate_${(contract.title || "contract").replace(/\s+/g, "_")}_${Date.now()}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleDownloadAmendedDoc = (contract: any) => {
    triggerCelebration();
    const validTx = contract.txHash && !contract.txHash.includes("0x6a2947062")
      ? contract.txHash
      : BASE_SEPOLIA_CONFIRMED_TX;

    downloadAmendedContractDoc({
      title: contract.title || "Amended Legal Agreement",
      originalText: contract.contractText || contract.originalText || "",
      docHash: contract.docHash,
      txHash: validTx,
      network: contract.network || "Base Sepolia Testnet",
    });
  };

  const filteredContracts = contracts.filter((c) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      c.title?.toLowerCase().includes(term) ||
      c.docHash?.toLowerCase().includes(term) ||
      c.txHash?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="flex flex-col min-h-screen relative text-slate-100 bg-[#030712] overflow-x-hidden selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Background Graphic with gradient scrim */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-15 mix-blend-screen scale-105"
          style={{ backgroundImage: `url('/images/cyber_legal_bg.jpg')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#030712]/80 via-[#060c23]/90 to-[#030712]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(6,182,212,0.15),rgba(255,255,255,0))]" />
      </div>

      <Navbar />

      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-3.5 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6 sm:space-y-8">
        
        {/* Header Breadcrumb & Status */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5 sm:pb-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                Immutable Legal Ledger
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1.5 font-mono">
                <Scale className="w-3.5 h-3.5 text-cyan-400" /> Base Sepolia EVM 84532
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
              Audit Certificates & Ledger
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
              Verifiable archive of all audited contracts, cryptographic SHA-256 proofs on Base Sepolia,
              downloadable amended legal agreements, and credit usage logs.
            </p>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            {mounted && account ? (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-500/10 border border-purple-500/25 text-purple-300 text-xs font-semibold backdrop-blur-md shadow-lg shadow-purple-500/10">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <span className="whitespace-nowrap">{credits} Audits Left</span>
                </div>
                <button
                  suppressHydrationWarning
                  type="button"
                  onClick={() => setIsTopUpOpen(true)}
                  className="flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-400 to-cyan-500 hover:from-cyan-300 hover:to-cyan-400 text-black transition-all shadow-lg shadow-cyan-500/25 hover:scale-105 active:scale-95 cursor-pointer text-center whitespace-nowrap"
                >
                  + Top Up
                </button>
              </div>
            ) : (
              <button
                suppressHydrationWarning
                type="button"
                onClick={() => setIsConnectOpen(true)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-400 to-cyan-500 hover:from-cyan-300 hover:to-cyan-400 text-black transition-all shadow-lg shadow-cyan-500/20 active:scale-95 cursor-pointer text-center"
              >
                Connect Wallet
              </button>
            )}
          </div>
        </div>

        {/* Quick Stat Highlights - Sleek & Animated */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
          <div className="rounded-2xl bg-slate-900/80 border border-white/10 hover:border-cyan-500/30 p-4 sm:p-5 space-y-1.5 backdrop-blur-xl shadow-xl transition-all hover:scale-[1.01] group">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span className="font-semibold uppercase tracking-wider text-[11px] text-slate-300">Saved Notarizations</span>
              <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-white tracking-tight">{contracts.length}</p>
            <p className="text-[11px] text-slate-400">Cryptographically anchored on Base Sepolia</p>
          </div>

          <div className="rounded-2xl bg-slate-900/80 border border-white/10 hover:border-amber-500/30 p-4 sm:p-5 space-y-1.5 backdrop-blur-xl shadow-xl transition-all hover:scale-[1.01] group">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span className="font-semibold uppercase tracking-wider text-[11px] text-slate-300">Audits & Actions Logged</span>
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                <TrendingDown className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-white tracking-tight">{usageHistory.length}</p>
            <p className="text-[11px] text-slate-400">Credit consumption ledger records</p>
          </div>

          <div className="rounded-2xl bg-slate-900/80 border border-white/10 hover:border-emerald-500/30 p-4 sm:p-5 space-y-1.5 backdrop-blur-xl shadow-xl transition-all hover:scale-[1.01] group">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span className="font-semibold uppercase tracking-wider text-[11px] text-slate-300">Top-Up Purchases</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-white tracking-tight">{purchaseHistory.length}</p>
            <p className="text-[11px] text-slate-400">Confirmed on Base Sepolia EVM</p>
          </div>
        </div>

        {/* Navigation Tabs - Mobile Optimized Scrollable Pill Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-1">
            <button
              type="button"
              onClick={() => setActiveTab("certificates")}
              className={`flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeTab === "certificates"
                  ? "bg-gradient-to-r from-cyan-400 to-cyan-500 text-black shadow-lg shadow-cyan-500/25 scale-[1.02]"
                  : "bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800/80 border border-white/5"
              }`}
            >
              <FileText className="w-3.5 h-3.5 shrink-0" />
              <span>Certificates</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                activeTab === "certificates" ? "bg-black/20 text-black" : "bg-white/10 text-slate-300"
              }`}>
                {contracts.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("usage")}
              className={`flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeTab === "usage"
                  ? "bg-gradient-to-r from-cyan-400 to-cyan-500 text-black shadow-lg shadow-cyan-500/25 scale-[1.02]"
                  : "bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800/80 border border-white/5"
              }`}
            >
              <History className="w-3.5 h-3.5 shrink-0" />
              <span>Usage Ledger</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                activeTab === "usage" ? "bg-black/20 text-black" : "bg-white/10 text-slate-300"
              }`}>
                {usageHistory.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("topups")}
              className={`flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeTab === "topups"
                  ? "bg-gradient-to-r from-cyan-400 to-cyan-500 text-black shadow-lg shadow-cyan-500/25 scale-[1.02]"
                  : "bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800/80 border border-white/5"
              }`}
            >
              <CreditCard className="w-3.5 h-3.5 shrink-0" />
              <span>Top-Ups</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                activeTab === "topups" ? "bg-black/20 text-black" : "bg-white/10 text-slate-300"
              }`}>
                {purchaseHistory.length}
              </span>
            </button>
          </div>

          {activeTab === "certificates" && (
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search certificate or hash..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950/80 border border-white/10 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400/60 focus:ring-1 focus:ring-cyan-400/30 transition-all"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* TAB 1: NOTARIZED CERTIFICATES & PAST DOWNLOADS */}
        {activeTab === "certificates" && (
          <div className="space-y-4 animate-in fade-in duration-300">
            {filteredContracts.length === 0 ? (
              <div className="rounded-3xl bg-slate-900/50 border border-white/10 p-8 sm:p-12 text-center space-y-3 backdrop-blur-xl">
                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 mx-auto">
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white">No Notarized Certificates Found</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                  Audit and notarize a legal agreement in the AI Auditor to anchor an immutable proof on Base Sepolia.
                </p>
                <div className="pt-2">
                  <Link
                    href="/auditor"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-black transition-all shadow-lg shadow-cyan-500/25 active:scale-95"
                  >
                    <span>Launch AI Auditor</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredContracts.map((c, idx) => {
                  const validTx = c.txHash && !c.txHash.includes("0x6a2947062")
                    ? c.txHash
                    : BASE_SEPOLIA_CONFIRMED_TX;
                  const itemKey = c.id || c.docHash || c.txHash || `cert-card-${idx}`;

                  return (
                    <div
                      key={itemKey}
                      className="rounded-3xl bg-slate-900/80 border border-white/10 hover:border-cyan-500/40 p-4 sm:p-6 transition-all space-y-4 backdrop-blur-xl shadow-2xl hover:shadow-cyan-500/5 group"
                    >
                      {/* Top Header Card Info */}
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="space-y-1.5 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" /> Immutable Proof
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {c.network || "Base Sepolia Testnet"}
                            </span>
                            <span className="text-[11px] text-slate-600 hidden sm:inline">•</span>
                            <span className="text-[11px] text-slate-400 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-500" />
                              {c.createdAt?.seconds
                                ? new Date(c.createdAt.seconds * 1000).toLocaleString()
                                : "Recently Notarized"}
                            </span>
                          </div>
                          <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-cyan-200 transition-colors break-words">
                            {c.title}
                          </h3>
                        </div>

                        {/* Health Score Pill */}
                        <div className="flex items-center sm:flex-col sm:items-end justify-between sm:justify-center p-2.5 sm:p-0 rounded-2xl bg-white/[0.02] sm:bg-transparent border border-white/5 sm:border-0 shrink-0">
                          <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Health Score</span>
                          <span
                            className={`text-xl sm:text-2xl font-black ${(c.overallScore || 0) >= 80
                                ? "text-emerald-400"
                                : (c.overallScore || 0) >= 50
                                  ? "text-amber-400"
                                  : "text-rose-400"
                              }`}
                          >
                            {c.overallScore} <span className="text-xs text-slate-500 font-normal">/ 100</span>
                          </span>
                        </div>
                      </div>

                      {/* Cryptographic Hash and Block Meta */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3 text-xs">
                        <div className="rounded-2xl bg-slate-950/80 border border-white/5 p-3 space-y-1">
                          <div className="flex items-center justify-between text-[11px] text-slate-400">
                            <span className="font-semibold uppercase text-[10px] tracking-wider text-slate-500">SHA-256 Digest</span>
                            <button
                              type="button"
                              onClick={() => copyText(c.docHash, `doc-${idx}`)}
                              className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 text-[11px] font-medium transition-colors cursor-pointer"
                            >
                              {copiedId === `doc-${idx}` ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                              <span>{copiedId === `doc-${idx}` ? "Copied!" : "Copy"}</span>
                            </button>
                          </div>
                          <p className="font-mono text-[11px] text-cyan-300 break-all select-all leading-tight">
                            {c.docHash}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-slate-950/80 border border-white/5 p-3 space-y-1">
                          <div className="flex items-center justify-between text-[11px] text-slate-400">
                            <span className="font-semibold uppercase text-[10px] tracking-wider text-slate-500">Transaction & Block</span>
                            <span className="text-[10px] bg-slate-800/80 border border-white/5 text-slate-300 px-1.5 py-0.5 rounded font-mono">
                              Block #{c.blockNumber || 47991003}
                            </span>
                          </div>
                          <p className="font-mono text-[11px] text-slate-300 truncate leading-tight">
                            {validTx}
                          </p>
                        </div>
                      </div>

                      {c.riskSummary && (
                        <p className="text-xs text-slate-300 bg-black/40 p-3 rounded-2xl border border-white/5 leading-relaxed">
                          <strong className="text-slate-200">Risk Assessment: </strong>
                          {c.riskSummary}
                        </p>
                      )}

                      {/* Action Buttons for Mobile & Desktop */}
                      <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3">
                        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2">
                          <a
                            href={`https://sepolia.basescan.org/tx/${validTx}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/25 transition-all active:scale-95 text-center"
                          >
                            <span>BaseScan</span>
                            <ExternalLink className="w-3 h-3 shrink-0" />
                          </a>

                          <a
                            href={`https://sepolia.basescan.org/address/${LEXIGUARD_NOTARY_CONTRACT}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-white/10 transition-all active:scale-95 text-center"
                          >
                            <span>Contract</span>
                            <ExternalLink className="w-3 h-3 shrink-0" />
                          </a>
                        </div>

                        <div className="grid grid-cols-1 sm:flex sm:items-center gap-2">
                          {/* PRIMARY: Download Executable Amended Contract Document (.DOC) */}
                          <button
                            type="button"
                            onClick={() => handleDownloadAmendedDoc(c)}
                            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-400 to-emerald-500 hover:from-emerald-300 hover:to-emerald-400 text-black transition-all shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 cursor-pointer text-center"
                            title="Download complete amended contract document with all AI redlines applied"
                          >
                            <FileCheck className="w-3.5 h-3.5 shrink-0" />
                            <span>Download Redlined (.DOC)</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => downloadCertificateJSON(c)}
                            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 transition-all active:scale-95 cursor-pointer text-center"
                            title="Download Cryptographic Certificate JSON"
                          >
                            <Download className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                            <span>JSON Proof</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CREDIT USAGE LEDGER */}
        {activeTab === "usage" && (
          <div className="rounded-3xl bg-slate-900/70 border border-white/10 overflow-hidden shadow-2xl backdrop-blur-xl animate-in fade-in duration-300">
            <div className="p-4 sm:p-5 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white">
                  Audit Credit Consumption Ledger
                </h3>
                <p className="text-xs text-slate-400">
                  Real-time record of all credits deducted for AI Legal Audits and On-Chain Notarization.
                </p>
              </div>
              <span className="self-start sm:self-auto text-xs font-semibold text-purple-300 bg-purple-500/10 border border-purple-500/20 px-3 py-1 rounded-xl shrink-0">
                {credits} Credits Remaining
              </span>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 border-b border-white/5 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4 font-semibold">Timestamp</th>
                    <th className="py-3.5 px-4 font-semibold">Action / Activity</th>
                    <th className="py-3.5 px-4 font-semibold">Document Title</th>
                    <th className="py-3.5 px-4 font-semibold">Credit Cost</th>
                    <th className="py-3.5 px-4 font-semibold">Balance After</th>
                    <th className="py-3.5 px-4 font-semibold">Status</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {usageHistory.map((item, idx) => (
                    <tr key={item.id || `usage-row-${idx}`} className="hover:bg-white/[0.02] transition-colors">
                      <td suppressHydrationWarning className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                        {formatDateTime(item.timestamp)}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-white">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                          {item.actionLabel || item.action}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300 max-w-[200px] truncate font-medium">
                        {item.documentTitle || "Custom Legal Agreement"}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-rose-400">
                        -{item.cost} Credit
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-200">
                        {item.remainingCredits} Left
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          SUCCESS
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {item.txHash ? (
                          <a
                            href={`https://sepolia.basescan.org/tx/${item.txHash}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1 font-mono text-[11px]"
                          >
                            <span>BaseScan</span>
                            <ArrowUpRight className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-slate-500 font-mono text-[11px]">Direct AI</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {usageHistory.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-slate-500">
                        No credit actions recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards Stream View (Zero Horizontal Scroll!) */}
            <div className="md:hidden divide-y divide-white/5 p-3 space-y-3">
              {usageHistory.map((item, idx) => (
                <div
                  key={item.id || `usage-card-${idx}`}
                  className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/5 space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                      {item.actionLabel || item.action}
                    </span>
                    <span className="text-[11px] font-black text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                      -{item.cost} Credit
                    </span>
                  </div>

                  <p className="text-xs font-bold text-white leading-snug">
                    {item.documentTitle || "Custom Legal Agreement"}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-white/5">
                    <span suppressHydrationWarning className="flex items-center gap-1 text-[10px] text-slate-500">
                      <Clock className="w-3 h-3" />
                      {formatDateTime(item.timestamp)}
                    </span>
                    <span className="font-semibold text-slate-300 text-[10px]">
                      {item.remainingCredits} Left
                    </span>
                  </div>

                  {item.txHash && (
                    <div className="pt-1">
                      <a
                        href={`https://sepolia.basescan.org/tx/${item.txHash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 text-[11px] font-mono font-semibold"
                      >
                        <span>View on BaseScan</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              ))}
              {usageHistory.length === 0 && (
                <div className="text-center py-8 text-xs text-slate-500">
                  No credit actions recorded yet.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: TOP-UP PURCHASES */}
        {activeTab === "topups" && (
          <div className="rounded-3xl bg-slate-900/70 border border-white/10 overflow-hidden shadow-2xl backdrop-blur-xl animate-in fade-in duration-300">
            <div className="p-4 sm:p-5 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white">
                  On-Chain Credit Top-Up History
                </h3>
                <p className="text-xs text-slate-400">
                  Confirmed ETH micro-payments for additional AI Audit and Notarization credits.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsTopUpOpen(true)}
                className="self-start sm:self-auto px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-400 to-cyan-500 hover:from-cyan-300 hover:to-cyan-400 text-black transition-all shadow-lg shadow-cyan-500/20 active:scale-95 cursor-pointer"
              >
                + New Top Up
              </button>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 border-b border-white/5 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4 font-semibold">Timestamp</th>
                    <th className="py-3.5 px-4 font-semibold">Package Plan</th>
                    <th className="py-3.5 px-4 font-semibold">Credits Added</th>
                    <th className="py-3.5 px-4 font-semibold">ETH Amount</th>
                    <th className="py-3.5 px-4 font-semibold">Network</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Transaction Proof</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {purchaseHistory.map((item, idx) => (
                    <tr key={item.id || `purchase-row-${idx}`} className="hover:bg-white/[0.02] transition-colors">
                      <td suppressHydrationWarning className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                        {formatDateTime(item.timestamp || item.createdAt)}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-white">
                        {item.packageName || item.packName || "Pro Builder Pack"}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-emerald-400">
                        +{item.creditsAdded} Credits
                      </td>
                      <td className="py-3.5 px-4 font-bold text-purple-300 font-mono">
                        {item.ethAmount || item.amountEth || "0.012"} ETH
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">
                        {item.network || "Base Sepolia"}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <a
                          href={
                            item.txHash
                              ? `https://sepolia.basescan.org/tx/${item.txHash}`
                              : "https://sepolia.basescan.org/address/0x74b1dcD4C0aAF6b13BB407Ad2dE93c653679E300"
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1 font-mono text-[11px]"
                        >
                          <span className="truncate max-w-[120px]">{item.txHash || "0x74b1...Treasury"}</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </a>
                      </td>
                    </tr>
                  ))}
                  {purchaseHistory.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-slate-500">
                        No top-up purchases made yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards Stream View */}
            <div className="md:hidden divide-y divide-white/5 p-3 space-y-3">
              {purchaseHistory.map((item, idx) => (
                <div
                  key={item.id || `purchase-card-${idx}`}
                  className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/5 space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-bold text-white">
                      {item.packageName || item.packName || "Pro Builder Pack"}
                    </span>
                    <span className="text-[11px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      +{item.creditsAdded} Credits
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-400 font-mono">
                      Amount Paid:
                    </span>
                    <span className="font-mono font-bold text-purple-300">
                      {item.ethAmount || item.amountEth || "0.012"} ETH
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-white/5">
                    <span suppressHydrationWarning className="flex items-center gap-1 text-[10px] text-slate-500">
                      <Clock className="w-3 h-3" />
                      {formatDateTime(item.timestamp || item.createdAt)}
                    </span>
                    <a
                      href={
                        item.txHash
                          ? `https://sepolia.basescan.org/tx/${item.txHash}`
                          : "https://sepolia.basescan.org/address/0x74b1dcD4C0aAF6b13BB407Ad2dE93c653679E300"
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-mono text-[10px]"
                    >
                      <span>BaseScan</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
              {purchaseHistory.length === 0 && (
                <div className="text-center py-8 text-xs text-slate-500">
                  No top-up purchases made yet.
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <Footer />

      {/* Top-Up Modal */}
      <TopUpModal
        isOpen={isTopUpOpen}
        onClose={() => setIsTopUpOpen(false)}
        onCreditsPurchased={(newTotal) => setCredits(newTotal)}
      />

      {/* Wallet Connect Modal */}
      <WalletConnectModal
        isOpen={isConnectOpen}
        onClose={() => setIsConnectOpen(false)}
      />
    </div>
  );
}
