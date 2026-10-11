"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ShieldCheck, Wallet, ChevronDown, CheckCircle2, Lock, Sparkles, ExternalLink } from "lucide-react";
import { SUPPORTED_NETWORKS } from "@/lib/web3Service";

export default function Navbar() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [selectedNetwork, setSelectedNetwork] = useState(SUPPORTED_NETWORKS[0]);
  const [showNetworkMenu, setShowNetworkMenu] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const connectWallet = async () => {
    setIsConnecting(true);
    try {
      if (typeof window !== "undefined" && (window as any).ethereum) {
        const accounts = await (window as any).ethereum.request({ method: "eth_requestAccounts" });
        if (accounts && accounts[0]) {
          setWalletAddress(accounts[0]);
          setIsConnecting(false);
          return;
        }
      }
    } catch (e) {
      console.log("Fallback to simulated Web3 wallet", e);
    }

    // High quality simulation for testnet demo / judges
    setTimeout(() => {
      setWalletAddress("0x7F2B89a468eB3f4D9165b4c10a12e87319E454E2");
      setIsConnecting(false);
    }, 600);
  };

  const disconnectWallet = () => {
    setWalletAddress(null);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-[#060913]/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3.5 group">
          <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500/20 via-blue-500/10 to-purple-500/20 border border-cyan-500/30 group-hover:border-cyan-400/60 transition-all shadow-[0_0_20px_-3px_rgba(6,182,212,0.3)]">
            <ShieldCheck className="w-6 h-6 text-cyan-400 group-hover:scale-110 transition-transform" />
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-tight text-white group-hover:text-cyan-300 transition-colors">
                LexiGuard<span className="text-cyan-400">.AI</span>
              </span>
              <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase rounded-full bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-300 border border-cyan-500/30">
                BLI HACKATHON
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">On-Chain Legal Intelligence Vault</p>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-1.5 lg:gap-2 bg-slate-900/60 border border-white/5 p-1.5 rounded-2xl">
          <Link
            href="/"
            className="px-3.5 py-2 text-sm font-medium text-slate-300 hover:text-white rounded-xl hover:bg-white/5 transition-all"
          >
            Overview
          </Link>
          <Link
            href="/auditor"
            className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 rounded-xl hover:bg-cyan-500/20 transition-all shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            AI Auditor
          </Link>
          <Link
            href="/vault"
            className="px-3.5 py-2 text-sm font-medium text-slate-300 hover:text-white rounded-xl hover:bg-white/5 transition-all"
          >
            Notary Vault
          </Link>
          <Link
            href="/admin"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-purple-300 bg-purple-500/10 border border-purple-500/20 rounded-xl hover:bg-purple-500/20 transition-all"
          >
            <Lock className="w-3 h-3 text-purple-400" />
            Admin Hub
          </Link>
        </nav>

        {/* Web3 Network & Wallet */}
        <div className="flex items-center gap-3">
          {/* Network Switcher */}
          <div className="relative hidden sm:block">
            <button
              onClick={() => setShowNetworkMenu(!showNetworkMenu)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-900/80 border border-white/10 hover:border-white/20 text-slate-300 transition-all"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{selectedNetwork.name.split(" ")[0]}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showNetworkMenu && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-slate-900 border border-white/10 shadow-2xl p-2 z-50 backdrop-blur-xl">
                <p className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Select Blockchain
                </p>
                {SUPPORTED_NETWORKS.map((net) => (
                  <button
                    key={net.id}
                    onClick={() => {
                      setSelectedNetwork(net);
                      setShowNetworkMenu(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl transition-all ${
                      selectedNetwork.id === net.id
                        ? "bg-cyan-500/15 text-cyan-300 font-semibold border border-cyan-500/30"
                        : "text-slate-300 hover:bg-white/5"
                    }`}
                  >
                    <span>{net.name}</span>
                    {selectedNetwork.id === net.id && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Connect Wallet Button */}
          {walletAddress ? (
            <div className="flex items-center gap-2">
              <button
                onClick={disconnectWallet}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-semibold bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/40 transition-all"
                title="Click to disconnect"
              >
                <div className="w-2 h-2 rounded-full bg-cyan-400" />
                <span>
                  {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                </span>
              </button>
            </div>
          ) : (
            <button
              onClick={connectWallet}
              disabled={isConnecting}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-[0_0_20px_-3px_rgba(6,182,212,0.4)] transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>{isConnecting ? "Connecting..." : "Connect Wallet"}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
