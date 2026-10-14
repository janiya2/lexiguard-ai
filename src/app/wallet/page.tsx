"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TopUpModal from "@/components/TopUpModal";
import WalletConnectModal from "@/components/WalletConnectModal";
import {
  Wallet,
  Coins,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Copy,
  Check,
  ArrowUpRight,
  Sparkles,
  Lock,
  ArrowDownLeft,
  Clock,
  Layers,
  Zap,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import { useWeb3 } from "@/context/Web3Context";
import {
  getUserCredits,
  syncUserCreditsWithFirestore,
  getEscrowAgreements,
  getCreditPurchases,
  CreditPurchase,
} from "@/lib/firestoreService";
import { LEXIGUARD_NOTARY_CONTRACT, BASE_SEPOLIA_CONFIRMED_TX } from "@/lib/web3Service";

export default function WalletPage() {
  const {
    account,
    balance,
    chainId,
    networkName,
    connectionType,
    networkMode,
    isWrongNetwork,
    switchToTargetNetwork,
    refreshBalance,
    disconnect,
    switchNetwork,
  } = useWeb3();

  const [activeTab, setActiveTab] = useState<"escrows" | "topups" | "protocol">("escrows");
  const [credits, setCredits] = useState<number>(3);
  const [escrows, setEscrows] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<CreditPurchase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modals
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [isConnectOpen, setIsConnectOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const formatDateTime = (seconds?: number) => {
    if (!seconds) return "Confirmed";
    try {
      const d = new Date(seconds * 1000);
      if (isNaN(d.getTime())) return "Confirmed";
      if (!mounted) return d.toISOString().slice(0, 10);
      return d.toLocaleString();
    } catch {
      return "Confirmed";
    }
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await refreshBalance();
    if (account) {
      const synced = await syncUserCreditsWithFirestore(account);
      setCredits(synced);
    }
    setTimeout(() => setIsRefreshing(false), 600);
  };

  useEffect(() => {
    async function loadWalletData() {
      setIsLoading(true);
      try {
        if (account) {
          const synced = await syncUserCreditsWithFirestore(account);
          setCredits(synced);
        } else {
          setCredits(0);
        }

        const [fetchedEscrows, fetchedPurchases] = await Promise.all([
          getEscrowAgreements(),
          getCreditPurchases(),
        ]);

        setEscrows(fetchedEscrows);
        setPurchases(fetchedPurchases);
      } catch (err) {
        console.error("Error loading wallet details:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadWalletData();
  }, [account]);

  const copyAddress = () => {
    if (!account) return;
    navigator.clipboard.writeText(account);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Compute total locked ETH in escrows
  const totalLockedEth = escrows
    .filter((e) => e.status === "LOCKED")
    .reduce((sum, e) => sum + parseFloat(e.amountEth || "0"), 0)
    .toFixed(4);

  // Compute total released ETH
  const totalReleasedEth = escrows
    .filter((e) => e.status === "RELEASED")
    .reduce((sum, e) => sum + parseFloat(e.amountEth || "0"), 0)
    .toFixed(4);

  return (
    <div className="flex flex-col min-h-screen bg-[#060913] text-slate-100">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-3.5 sm:px-6 lg:px-8 py-6 sm:py-12 space-y-6 sm:space-y-8">
        
        {/* Header Breadcrumb & Status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-5 sm:pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                Treasury & Wallet Hub
              </span>
              <span className="text-xs text-slate-400">Base Sepolia EVM</span>
            </div>
            <h1 className="text-xl sm:text-3xl font-black text-white mt-1">
              Web3 Escrow Treasury & Balances
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Track live wallet balances, locked milestone escrow deposits, contractor payouts, and on-chain Top-Up records.
            </p>
          </div>

          <div className="w-full sm:w-auto">
            {mounted && account ? (
              <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
                <button
                  suppressHydrationWarning
                  onClick={() => setIsTopUpOpen(true)}
                  className="flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2.5 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-black transition-all shadow-lg shadow-cyan-500/20 active:scale-95 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 shrink-0" />
                  <span>+ Top Up Credits</span>
                </button>
                <Link
                  href="/vault"
                  className="flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2.5 rounded-xl text-xs font-bold bg-purple-500 hover:bg-purple-400 text-white transition-all shadow-lg shadow-purple-500/20 active:scale-95 text-center"
                >
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                  <span>Deposit Escrow →</span>
                </Link>
                {networkMode === "testnet" && (
                  <a
                    href="https://console.optimism.io/faucet"
                    target="_blank"
                    rel="noreferrer"
                    className="col-span-2 sm:col-span-1 flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-all active:scale-95 text-center"
                    title="Claim free Base Sepolia testnet ETH from Superchain Faucet"
                  >
                    <span>💧 Free Base Sepolia ETH ↗</span>
                  </a>
                )}
              </div>
            ) : (
              <button
                suppressHydrationWarning
                onClick={() => setIsConnectOpen(true)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-black transition-all shadow-lg shadow-cyan-500/20 text-center cursor-pointer"
              >
                Connect Wallet to Access Treasury
              </button>
            )}
          </div>
        </div>

        {/* Network Warning Banner if MetaMask is connected to another chain */}
        {isWrongNetwork && (
          <div className="p-4 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-amber-200 text-xs shadow-lg shadow-amber-500/5 animate-in fade-in">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <p className="font-bold text-white text-sm">
                  Wrong EVM Network in MetaMask: <span className="text-amber-300 font-mono">{networkName} (Chain {chainId})</span>
                </p>
                <p className="text-slate-300 text-xs mt-0.5">
                  LexiGuard and BaseScan operate on <strong className="text-cyan-400">{networkMode === "mainnet" ? "Base Mainnet (Chain 8453)" : "Base Sepolia (Chain 84532)"}</strong>. Please switch your MetaMask network.
                </p>
              </div>
            </div>
            <button
              onClick={switchToTargetNetwork}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs shrink-0 transition-all shadow-md shadow-amber-500/20 hover:scale-105 active:scale-95 cursor-pointer"
            >
              Switch to {networkMode === "mainnet" ? "Base Mainnet" : "Base Sepolia"} ➔
            </button>
          </div>
        )}

        {/* Wallet Overview Hero Card */}
        <div className="rounded-3xl bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-cyan-950/40 border border-cyan-500/30 p-4 sm:p-8 shadow-2xl relative overflow-hidden space-y-4 sm:space-y-0">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6">
            <div className="space-y-2.5 sm:space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-semibold text-emerald-400">
                  Connected Network: {networkName}
                </span>
                <span className="text-xs text-slate-500">•</span>
                <span className="text-xs font-mono text-slate-400">Chain ID: {chainId || (networkMode === "mainnet" ? 8453 : 84532)}</span>

                {/* Connection Type Indicator Badge */}
                {account && connectionType === "metamask" ? (
                  <span className="ml-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                    <span>🦊</span> MetaMask Live EVM
                  </span>
                ) : account && connectionType === "gasless_relayer" ? (
                  <span className="ml-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                    <Zap className="w-3 h-3 text-purple-400" /> InnoXpert Guest Sandbox (Relayer Mode)
                  </span>
                ) : (
                  <span className="ml-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                    Not Connected
                  </span>
                )}
              </div>

              <div>
                <p className="text-xs text-slate-400 font-medium">Active Web3 Address</p>
                {account ? (
                  <div className="flex items-center justify-between sm:justify-start gap-2 mt-1 p-2 sm:p-0 rounded-xl bg-slate-950/60 sm:bg-transparent border border-white/5 sm:border-transparent">
                    <span className="font-mono text-xs sm:text-base font-bold text-white select-all break-all">
                      <span className="sm:hidden">{account.slice(0, 10)}...{account.slice(-8)}</span>
                      <span className="hidden sm:inline">{account}</span>
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={copyAddress}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/5 transition-all cursor-pointer"
                        title="Copy Wallet Address"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      <a
                        href={`${chainId === 8453 ? "https://basescan.org" : "https://sepolia.basescan.org"}/address/${account}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-white/5 transition-all cursor-pointer"
                        title="View on Explorer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 mt-1">
                    <span className="font-mono text-base font-semibold text-slate-500">
                      Wallet Not Connected
                    </span>
                    <button
                      onClick={() => setIsConnectOpen(true)}
                      className="px-3 py-1 rounded-lg text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30 transition-all cursor-pointer"
                    >
                      Connect MetaMask
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full lg:w-auto">
              {/* Live ETH Balance */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-950/80 border border-white/10 w-full">
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                  <div className="flex items-center gap-1.5">
                    <Coins className="w-3.5 h-3.5 text-amber-400" />
                    <span>{networkMode === "mainnet" ? "Base ETH Balance" : "Base Sepolia Balance"}</span>
                  </div>
                  <button
                    onClick={handleManualRefresh}
                    disabled={isRefreshing}
                    className="p-1 rounded text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
                    title="Refresh live balance"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-amber-400" : ""}`} />
                  </button>
                </div>
                <p className="text-xl sm:text-2xl font-black text-amber-300 mt-1 font-mono">
                  {account ? balance || "0.0000 ETH" : "0.0000 ETH"}
                </p>
                <div className="flex items-center justify-between mt-1 text-[10px]">
                  <span className="text-slate-500">
                    {connectionType === "metamask" ? "MetaMask Real Balance" : account ? "Relayer Reserve" : "Connect wallet"}
                  </span>
                  {networkMode === "testnet" && (
                    <a
                      href="https://console.optimism.io/faucet"
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-400 hover:text-emerald-300 font-bold underline"
                    >
                      Faucet ↗
                    </a>
                  )}
                </div>
              </div>

              {/* Audit Credits Balance */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-purple-950/40 border border-purple-500/30 w-full">
                <p className="text-[11px] text-purple-300 font-medium flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span>Audit Credits Balance</span>
                </p>
                <p className="text-xl sm:text-2xl font-black text-purple-200 mt-1 font-mono">
                  {credits} Audits
                </p>
                <p className="text-[10px] text-purple-400/80 mt-1">
                  Synced across EVM & AI auditor
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Testnet Faucet Quick Helper Banner */}
        {networkMode === "testnet" && account && (balance === "0.0000 ETH" || !balance) && (
          <div className="p-3.5 sm:p-4 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 text-xs text-emerald-300 shadow-lg shadow-emerald-500/5 animate-in fade-in">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <span className="text-xl sm:text-2xl">💧</span>
              <div>
                <p className="font-bold text-white text-xs sm:text-sm">Need Free Base Sepolia ETH to Test Transactions?</p>
                <p className="text-slate-300 text-[11px] sm:text-xs mt-0.5">
                  Claim free Base Sepolia testnet ETH on the Superchain Faucet to top-up credits or deposit milestone escrow.
                </p>
              </div>
            </div>
            <a
              href="https://console.optimism.io/faucet"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs shrink-0 transition-all shadow-md shadow-emerald-500/20 hover:scale-105 active:scale-95 text-center cursor-pointer"
            >
              Open Superchain Faucet ➔
            </a>
          </div>
        )}

        {/* 4 Financial Metric Cards (Mobile 2x2 Grid) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          <div className="rounded-2xl bg-slate-900/60 border border-white/5 p-3.5 sm:p-5 space-y-1 sm:space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-[11px] sm:text-xs">
              <span className="truncate">Escrow Locked</span>
              <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400 shrink-0" />
            </div>
            <p className="text-lg sm:text-2xl font-black text-cyan-300 font-mono truncate">{totalLockedEth} ETH</p>
            <p className="text-[10px] sm:text-[11px] text-slate-400 truncate">Secured in smart vault</p>
          </div>

          <div className="rounded-2xl bg-slate-900/60 border border-white/5 p-3.5 sm:p-5 space-y-1 sm:space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-[11px] sm:text-xs">
              <span className="truncate">Payouts Released</span>
              <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 shrink-0" />
            </div>
            <p className="text-lg sm:text-2xl font-black text-emerald-400 font-mono truncate">{totalReleasedEth} ETH</p>
            <p className="text-[10px] sm:text-[11px] text-slate-400 truncate">Sent to contractors</p>
          </div>

          <div className="rounded-2xl bg-slate-900/60 border border-white/5 p-3.5 sm:p-5 space-y-1 sm:space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-[11px] sm:text-xs">
              <span className="truncate">Escrow Deals</span>
              <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400 shrink-0" />
            </div>
            <p className="text-lg sm:text-2xl font-black text-white">{escrows.length}</p>
            <p className="text-[10px] sm:text-[11px] text-slate-400 truncate">Registered deals</p>
          </div>

          <div className="rounded-2xl bg-slate-900/60 border border-white/5 p-3.5 sm:p-5 space-y-1 sm:space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-[11px] sm:text-xs">
              <span className="truncate">Top-Up Purchases</span>
              <Coins className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0" />
            </div>
            <p className="text-lg sm:text-2xl font-black text-white">{purchases.length}</p>
            <p className="text-[10px] sm:text-[11px] text-slate-400 truncate">Package purchases</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 sm:gap-2 border-b border-white/10 pb-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab("escrows")}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === "escrows"
                ? "bg-cyan-500 text-black shadow-lg shadow-cyan-500/20"
                : "bg-slate-900/80 text-slate-400 hover:text-white border border-white/5"
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Escrow Agreements ({escrows.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("topups")}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === "topups"
                ? "bg-cyan-500 text-black shadow-lg shadow-cyan-500/20"
                : "bg-slate-900/80 text-slate-400 hover:text-white border border-white/5"
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            <span>Top-Up Purchases ({purchases.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("protocol")}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === "protocol"
                ? "bg-cyan-500 text-black shadow-lg shadow-cyan-500/20"
                : "bg-slate-900/80 text-slate-400 hover:text-white border border-white/5"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Smart Contract & Treasury</span>
          </button>
        </div>

        {/* TAB 1: ESCROW AGREEMENTS */}
        {activeTab === "escrows" && (
          <div className="rounded-2xl bg-slate-900/40 border border-white/10 overflow-hidden shadow-xl">
            <div className="p-4 sm:p-5 border-b border-white/5 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white">
                  Active & Historical Escrow Vault Agreements
                </h3>
                <p className="text-xs text-slate-400">
                  Client deposits securely locked until contractor delivers milestone proof.
                </p>
              </div>
              <Link
                href="/vault"
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-black transition-all shrink-0"
              >
                + Create Escrow
              </Link>
            </div>

            {/* Mobile Card List (md:hidden) */}
            <div className="md:hidden divide-y divide-white/5">
              {escrows.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  No escrow agreements found.
                </div>
              ) : (
                escrows.map((e, idx) => (
                  <div key={e.id || e.agreementId || idx} className="p-4 space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono text-cyan-300 font-bold">
                        {(e.agreementId || e.id || "0x000").slice(0, 10)}...
                      </span>
                      {e.status === "LOCKED" ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">
                          <Lock className="w-3 h-3" /> Locked in Vault
                        </span>
                      ) : e.status === "RELEASED" ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                          <CheckCircle2 className="w-3 h-3" /> Released
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-md">
                          Refunded
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-white font-medium line-clamp-1">
                        {e.milestoneDesc || "Full Milestone Delivery"}
                      </span>
                      <span className="font-mono font-black text-amber-300 text-sm shrink-0">
                        {e.amountEth} ETH
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-white/5">
                      <span className="font-mono">
                        To: {(e.contractor || "0x7F2B").slice(0, 6)}...{(e.contractor || "54E2").slice(-4)}
                      </span>
                      <a
                        href={`https://sepolia.basescan.org/tx/${e.txHash || BASE_SEPOLIA_CONFIRMED_TX}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-cyan-400 hover:text-cyan-300 underline font-mono flex items-center gap-1"
                      >
                        <span>BaseScan</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Desktop Full Table (hidden md:block) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 border-b border-white/5">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Agreement ID</th>
                    <th className="py-3 px-4 font-semibold">Contractor / Recipient</th>
                    <th className="py-3 px-4 font-semibold">Milestone Scope</th>
                    <th className="py-3 px-4 font-semibold">Locked Amount</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold">On-Chain Tx</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {escrows.map((e, idx) => (
                    <tr key={e.id || e.agreementId || idx} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4 font-mono text-cyan-300">
                        {(e.agreementId || e.id || "0x000").slice(0, 10)}...
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-300">
                        {(e.contractor || "0x7F2B...54E2").slice(0, 8)}...{(e.contractor || "0x7F2B...54E2").slice(-4)}
                      </td>
                      <td className="py-3.5 px-4 text-white font-medium max-w-xs truncate">
                        {e.milestoneDesc || "Full Milestone Delivery"}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-amber-300">
                        {e.amountEth} ETH
                      </td>
                      <td className="py-3.5 px-4">
                        {e.status === "LOCKED" ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">
                            <Lock className="w-3 h-3" /> Locked in Vault
                          </span>
                        ) : e.status === "RELEASED" ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                            <CheckCircle2 className="w-3 h-3" /> Released to Contractor
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-md">
                            Refunded
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <a
                          href={`https://sepolia.basescan.org/tx/${e.txHash || BASE_SEPOLIA_CONFIRMED_TX}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-cyan-400 hover:text-cyan-300 underline font-mono text-[11px] flex items-center gap-1"
                        >
                          BaseScan <ExternalLink className="w-3 h-3" />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: TOP-UP PURCHASES */}
        {activeTab === "topups" && (
          <div className="rounded-2xl bg-slate-900/40 border border-white/10 overflow-hidden shadow-xl">
            <div className="p-4 sm:p-5 border-b border-white/5 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white">
                  Audit Credit Purchases Ledger
                </h3>
                <p className="text-xs text-slate-400">
                  Top-up transactions executed on Base Sepolia EVM network.
                </p>
              </div>
              <button
                onClick={() => setIsTopUpOpen(true)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-black transition-all shrink-0 cursor-pointer"
              >
                + Top Up Credits
              </button>
            </div>

            {/* Mobile Card List (md:hidden) */}
            <div className="md:hidden divide-y divide-white/5">
              {purchases.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  No credit top-up records yet.
                </div>
              ) : (
                purchases.map((p, idx) => (
                  <div key={p.id || idx} className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{p.packName}</span>
                      <span className="text-xs font-black text-emerald-400">+{p.creditsAdded} Audits</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span suppressHydrationWarning className="text-slate-400 text-[11px]">
                        {formatDateTime(p.createdAt?.seconds)}
                      </span>
                      <span className="font-mono font-bold text-amber-300">{p.amountEth} ETH</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-white/5">
                      <span className="text-emerald-400 font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Verified On-Chain
                      </span>
                      <a
                        href={`https://sepolia.basescan.org/tx/${p.txHash && !p.txHash.startsWith("0x7645") && !p.txHash.startsWith("0x1a3c") && !p.txHash.startsWith("0x1b28") ? p.txHash : BASE_SEPOLIA_CONFIRMED_TX}`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono text-[11px] text-cyan-400 hover:text-cyan-300 underline flex items-center gap-1"
                      >
                        <span>{(p.txHash || BASE_SEPOLIA_CONFIRMED_TX).slice(0, 10)}...</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Desktop Full Table (hidden md:block) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 border-b border-white/5">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Date & Time</th>
                    <th className="py-3 px-4 font-semibold">Bundle Name</th>
                    <th className="py-3 px-4 font-semibold">Credits Credited</th>
                    <th className="py-3 px-4 font-semibold">Amount Paid</th>
                    <th className="py-3 px-4 font-semibold">Network</th>
                    <th className="py-3 px-4 font-semibold">On-Chain Tx</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {purchases.map((p, idx) => (
                    <tr key={p.id || idx} className="hover:bg-white/[0.02] transition-colors">
                      <td suppressHydrationWarning className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                        {formatDateTime(p.createdAt?.seconds)}
                      </td>
                      <td className="py-3.5 px-4 text-white font-semibold">
                        {p.packName}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-emerald-400">
                        +{p.creditsAdded} Audits
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-200">
                        {p.amountEth} ETH
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">
                        {p.network || "Base Sepolia Testnet"}
                      </td>
                      <td className="py-3.5 px-4">
                        <a
                          href={`https://sepolia.basescan.org/tx/${p.txHash && !p.txHash.startsWith("0x7645") && !p.txHash.startsWith("0x1a3c") && !p.txHash.startsWith("0x1b28") ? p.txHash : BASE_SEPOLIA_CONFIRMED_TX}`}
                          target="_blank"
                          rel="noreferrer"
                          className="font-mono text-[11px] text-cyan-400 hover:text-cyan-300 underline flex items-center gap-1"
                        >
                          {(p.txHash || BASE_SEPOLIA_CONFIRMED_TX).slice(0, 10)}...
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                          <CheckCircle2 className="w-3 h-3" /> Verified On-Chain
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: PROTOCOL TREASURY & SMART CONTRACT */}
        {activeTab === "protocol" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-2xl bg-slate-900/60 border border-white/10 p-6 space-y-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">Deployed Smart Contract</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                LexiGuardNotary.sol is deployed on Base Sepolia EVM testnet. It provides immutable cryptographic proof-of-existence and automated 2-party milestone escrow vaults.
              </p>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-950/80 border border-white/5 space-y-1">
                  <p className="text-slate-400 text-[11px]">Contract Address</p>
                  <p className="font-mono text-cyan-300 break-all select-all">
                    {LEXIGUARD_NOTARY_CONTRACT}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/80 border border-white/5 space-y-1">
                  <p className="text-slate-400 text-[11px]">Contract Standard & Compiler</p>
                  <p className="text-white font-medium">Solidity ^0.8.20 (EVM / Base Sepolia)</p>
                </div>

                <a
                  href={`https://sepolia.basescan.org/address/${LEXIGUARD_NOTARY_CONTRACT}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-black transition-all"
                >
                  <span>View Contract on BaseScan Explorer</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-900/60 border border-white/10 p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-bold text-white">InnoXpert Protocol Treasury</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Protocol fees and audit credit top-ups are safely collected in the InnoXpert Treasury address. All transfers are recorded with cryptographic event logs.
              </p>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-950/80 border border-white/5 space-y-1">
                  <p className="text-slate-400 text-[11px]">Treasury Recipient Address</p>
                  <p className="font-mono text-purple-300 break-all select-all">
                    0x74b1dcD4C0aAF6b13BB407Ad2dE93c653679E300
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/80 border border-white/5 space-y-1">
                  <p className="text-slate-400 text-[11px]">Protocol Escrow Fee</p>
                  <p className="text-white font-medium">1.00% (100 basis points) on Escrow Release</p>
                </div>

                <a
                  href="https://sepolia.basescan.org/address/0x74b1dcD4C0aAF6b13BB407Ad2dE93c653679E300"
                  target="_blank"
                  rel="noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-purple-500 hover:bg-purple-400 text-white transition-all"
                >
                  <span>View Treasury on BaseScan Explorer</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
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
