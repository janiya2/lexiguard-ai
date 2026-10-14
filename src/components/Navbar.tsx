"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShieldCheck,
  Wallet,
  Sparkles,
  Zap,
  Coins,
  LogOut,
  ScrollText,
  Menu,
  X,
  ExternalLink,
} from "lucide-react";
import { SUPPORTED_NETWORKS } from "@/lib/web3Service";
import { useWeb3 } from "@/context/Web3Context";
import WalletConnectModal from "@/components/WalletConnectModal";
import TopUpModal from "@/components/TopUpModal";
import { syncUserCreditsWithFirestore } from "@/lib/firestoreService";

export default function Navbar() {
  const pathname = usePathname();
  const {
    account,
    balance,
    chainId,
    networkName,
    connectionType,
    networkMode,
    isWrongNetwork,
    switchToTargetNetwork,
    disconnect,
  } = useWeb3();

  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [credits, setCredits] = useState(3);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Load user credits on mount and whenever account changes with Firestore sync
  useEffect(() => {
    if (account) {
      syncUserCreditsWithFirestore(account).then(setCredits);
    } else {
      setCredits(0);
    }
  }, [account]);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const navItems = [
    { href: "/", label: "Overview" },
    { href: "/auditor", label: "AI Auditor", icon: Sparkles },
    { href: "/vault", label: "Notary & Escrow" },
    { href: "/contractors", label: "Contractors" },
    { href: "/history", label: "History", icon: ScrollText },
    { href: "/wallet", label: "Wallet", icon: Wallet },
  ];

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 w-full border-b border-white/10 bg-[#060913]/95 backdrop-blur-2xl shadow-lg shadow-black/40">
        <div className="w-full max-w-[1680px] mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-1.5 sm:gap-3 xl:gap-4">
          
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2 sm:gap-3 group shrink-0">
            <div className="relative flex items-center justify-center w-8 h-8 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-slate-900 border border-cyan-500/40 group-hover:border-cyan-400 transition-all overflow-hidden shadow-[0_0_20px_-5px_rgba(6,182,212,0.4)]">
              <img
                src="/logo.png"
                alt="LexiGuard AI"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-black text-base sm:text-xl tracking-tight text-white group-hover:text-cyan-300 transition-colors whitespace-nowrap">
                  LexiGuard<span className="text-cyan-400">.AI</span>
                </span>
                <span className="hidden xl:inline-flex px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-bold tracking-wider uppercase rounded-full bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-300 border border-cyan-500/30 whitespace-nowrap">
                  BLI HACKATHON
                </span>
              </div>
              <p className="hidden 2xl:block text-[11px] text-slate-400 font-medium">On-Chain Legal Intelligence Vault</p>
            </div>
          </Link>

          {/* Center Navigation Links (Desktop) */}
          <nav className="hidden lg:flex items-center gap-0.5 xl:gap-1.5 bg-slate-900/70 border border-white/5 p-1 rounded-2xl shrink-0">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1 xl:gap-1.5 px-2.5 xl:px-3 py-1.5 text-xs xl:text-sm rounded-xl transition-all whitespace-nowrap ${
                    isActive
                      ? "text-cyan-300 bg-cyan-500/15 border border-cyan-500/30 font-semibold shadow-sm shadow-cyan-500/10"
                      : "text-slate-300 hover:text-white font-medium hover:bg-white/5 border border-transparent"
                  }`}
                >
                  {Icon && <Icon className={`w-3.5 h-3.5 ${isActive ? "text-cyan-400" : "text-slate-400"}`} />}
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Web3 Network & Wallet Section (Desktop & Mobile Optimized) */}
          <div className="flex items-center gap-1 sm:gap-2 xl:gap-2.5 shrink-0">
            {/* Real Active Network Badge (Cleanly displayed on large screens, hidden on laptop/mobile to avoid clipping) */}
            <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-blue-500/10 border border-blue-500/25 text-blue-300 shadow-sm shrink-0 whitespace-nowrap">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-bold text-white text-[11px] sm:text-xs">
                {networkName}
              </span>
              <span className="text-[9px] font-mono text-cyan-300 font-extrabold bg-cyan-500/20 border border-cyan-500/30 px-1.5 py-0.2 rounded">
                {networkMode === "mainnet" ? "MAINNET" : "L2 EVM"}
              </span>
            </div>

            {/* Quick Switch Button if on Wrong Network */}
            {isWrongNetwork && (
              <button
                onClick={switchToTargetNetwork}
                className="flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl text-[10px] sm:text-xs font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-all animate-pulse cursor-pointer shadow-sm shadow-amber-500/10 whitespace-nowrap"
                title="Click to switch MetaMask to target network"
              >
                <span>⚠️ Switch</span>
              </button>
            )}

            {/* Wallet Connect Status */}
            {mounted && account ? (
              <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                {/* Audit Credits Pill & Top-Up Modal Trigger (Desktop / Tablet) */}
                <button
                  suppressHydrationWarning
                  onClick={() => setIsTopUpModalOpen(true)}
                  className="hidden sm:flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/25 text-purple-300 text-xs font-semibold hover:bg-purple-500/20 transition-all hover:scale-105 active:scale-95 shadow-sm whitespace-nowrap cursor-pointer"
                  title="Click to Top Up AI Audit Credits"
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <span className="font-mono text-xs font-bold">
                    {credits} <span className="hidden sm:inline font-normal">Audits</span>
                  </span>
                  <span className="text-[9px] sm:text-[10px] bg-purple-500/30 text-purple-200 px-1 sm:px-1.5 py-0.5 rounded font-bold">
                    +<span className="hidden sm:inline"> Top Up</span>
                  </span>
                </button>

                {/* Clickable ETH Balance Pill (Hidden on small mobile to prevent overflow, shown on sm+) */}
                {balance && (
                  <Link
                    href="/wallet"
                    className={`hidden sm:flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl border text-xs font-mono transition-all hover:scale-105 active:scale-95 whitespace-nowrap cursor-pointer ${
                      pathname === "/wallet"
                        ? "bg-amber-500/20 border-amber-500/40 text-amber-200 shadow-[0_0_15px_-3px_rgba(245,158,11,0.3)] font-bold"
                        : "bg-slate-900/90 hover:bg-amber-500/15 border-white/10 hover:border-amber-500/30 text-slate-200 hover:text-amber-300"
                    }`}
                    title="Click to view live Web3 Escrow Treasury & Balances"
                  >
                    <Coins className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="font-bold">{balance}</span>
                  </Link>
                )}

                {/* Account Address Badge */}
                <div className="flex items-center rounded-xl bg-cyan-950/60 border border-cyan-500/40 p-0.5 sm:p-1 shrink-0">
                  <Link
                    href="/wallet"
                    className="flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs font-mono font-semibold text-cyan-300 hover:text-white transition-colors"
                    title="View Wallet & Transactions"
                  >
                    {connectionType === "metamask" ? (
                      <span title="Connected with MetaMask" className="text-xs sm:text-sm">🦊</span>
                    ) : (
                      <Zap className="w-3.5 h-3.5 text-purple-400" title="Connected with InnoXpert Guest Sandbox" />
                    )}
                    <span className="text-[11px] sm:text-xs">
                      <span className="hidden sm:inline">{account.slice(0, 6)}...{account.slice(-4)}</span>
                      <span className="sm:hidden">{account.slice(0, 4)}...{account.slice(-2)}</span>
                    </span>
                  </Link>
                  <button
                    suppressHydrationWarning
                    onClick={disconnect}
                    title="Disconnect Wallet"
                    className="hidden sm:flex p-1 sm:p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                suppressHydrationWarning
                onClick={() => setIsConnectModalOpen(true)}
                className="flex items-center gap-1 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-[0_0_20px_-3px_rgba(6,182,212,0.4)] transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer whitespace-nowrap"
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>Connect<span className="hidden sm:inline"> Wallet</span></span>
              </button>
            )}

            {/* Mobile Hamburger Button */}
            <button
              suppressHydrationWarning
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-1.5 sm:p-2 rounded-xl bg-slate-900 border border-white/10 text-slate-300 hover:text-white transition-all cursor-pointer"
              aria-label="Toggle Navigation Menu"
            >
              {isMobileMenuOpen ? <X className="w-4 h-4 sm:w-5 sm:h-5" /> : <Menu className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-white/10 bg-[#060913]/98 px-4 py-4 space-y-3 backdrop-blur-2xl animate-in slide-in-from-top duration-200">
            {/* Live Web3 Wallet & Balance Strip if connected */}
            {account && (
              <div className="p-3 rounded-2xl bg-slate-900/90 border border-cyan-500/30 space-y-2.5 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{connectionType === "metamask" ? "🦊" : "⚡"}</span>
                    <div>
                      <div className="text-xs font-mono font-bold text-white">
                        {account.slice(0, 8)}...{account.slice(-6)}
                      </div>
                      <div className="text-[10px] text-cyan-400 font-medium">
                        {connectionType === "metamask" ? "MetaMask Live EVM" : "InnoXpert Guest Sandbox"}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={disconnect}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-500/10 border border-rose-500/20 text-rose-300 hover:bg-rose-500/20 transition-all cursor-pointer"
                  >
                    <LogOut className="w-3 h-3" />
                    <span>Disconnect</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
                  <Link
                    href="/wallet"
                    className="bg-slate-950/70 hover:bg-amber-500/10 p-2.5 rounded-xl border border-white/5 hover:border-amber-500/30 transition-all group"
                  >
                    <span className="text-[10px] text-slate-400 block group-hover:text-amber-300">Live Balance</span>
                    <span className="text-xs font-mono font-bold text-amber-300">{balance || "0.0000 ETH"}</span>
                  </Link>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setIsTopUpModalOpen(true);
                    }}
                    className="bg-slate-950/70 hover:bg-purple-500/10 p-2.5 rounded-xl border border-white/5 hover:border-purple-500/30 transition-all text-left group cursor-pointer"
                  >
                    <span className="text-[10px] text-slate-400 block group-hover:text-purple-300">AI Credits</span>
                    <span className="text-xs font-mono font-bold text-purple-300 flex items-center justify-between">
                      <span>{credits} Audits</span>
                      <span className="text-[9px] text-cyan-400 font-semibold">+ Top Up</span>
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* Navigation links grid */}
            <div className="grid grid-cols-2 gap-2 pb-2 border-b border-white/5">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                        : "bg-slate-900/60 text-slate-300 hover:text-white border border-white/5"
                    }`}
                  >
                    {Icon && <Icon className="w-4 h-4 text-cyan-400" />}
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Network & Chain ID info */}
            <div className="flex items-center justify-between pt-1 text-xs text-slate-400 font-mono">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-semibold text-slate-300">{networkName}</span>
              </span>
              <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded border border-cyan-500/30 font-bold">
                {networkMode === "mainnet" ? "Base Mainnet (8453)" : "Base Sepolia (84532)"}
              </span>
            </div>
          </div>
        )}
      </header>
      {/* Fixed Header Spacer */}
      <div className="h-16 sm:h-20 w-full shrink-0 pointer-events-none" aria-hidden="true" />

      {/* Wallet Connect Modal */}
      <WalletConnectModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
      />

      {/* Audit Credits Top-Up Modal */}
      <TopUpModal
        isOpen={isTopUpModalOpen}
        onClose={() => setIsTopUpModalOpen(false)}
        onCreditsPurchased={(newTotal) => setCredits(newTotal)}
      />
    </>
  );
}
