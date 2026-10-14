"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useWeb3 } from "@/context/Web3Context";
import {
  X,
  Wallet,
  Zap,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from "lucide-react";

interface WalletConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WalletConnectModal({ isOpen, onClose }: WalletConnectModalProps) {
  const {
    connectMetaMask,
    connectGaslessRelayer,
    isMetaMaskInstalled,
    isConnecting,
    networkName,
    enableGuestSandbox,
  } = useWeb3();

  const [mounted, setMounted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const handleMetaMaskConnect = async () => {
    setErrorMessage(null);
    const res = await connectMetaMask();
    if (res.success) {
      onClose();
    } else {
      setErrorMessage(res.error || "Failed to connect to MetaMask");
    }
  };

  const handleRelayerConnect = () => {
    setErrorMessage(null);
    connectGaslessRelayer();
    onClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl bg-[#090d1a] border border-cyan-500/30 p-5 sm:p-8 shadow-[0_0_50px_rgba(6,182,212,0.3)] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer z-20"
          title="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/10 border border-cyan-500/30 flex items-center justify-center">
            <Wallet className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Connect Web3 Wallet</h3>
            <p className="text-xs text-slate-400">Targeting {networkName}</p>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p>{errorMessage}</p>
              {!isMetaMaskInstalled && (
                <a
                  href="https://metamask.io/download/"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 font-semibold text-cyan-400 hover:underline mt-1"
                >
                  Download MetaMask <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        )}

        {/* Wallet Options */}
        <div className="space-y-3">
          {/* Option 1: MetaMask (Real On-Chain) */}
          <button
            onClick={handleMetaMaskConnect}
            disabled={isConnecting}
            className={`w-full p-4 rounded-2xl border text-left transition-all flex items-center justify-between group ${
              isMetaMaskInstalled
                ? "bg-slate-900/90 border-cyan-500/30 hover:border-cyan-400 hover:bg-cyan-500/10 shadow-[0_0_20px_-5px_rgba(6,182,212,0.15)]"
                : "bg-slate-900/50 border-white/5 hover:border-amber-500/30"
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/30 flex items-center justify-center shrink-0 text-xl shadow-inner">
                <span>🦊</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                    MetaMask / Browser Wallet
                  </span>
                  {isMetaMaskInstalled ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      Detected
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                      Not Installed
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Connect your real EVM browser wallet on Base Sepolia
                </p>
              </div>
            </div>
            <div className="text-slate-500 group-hover:text-cyan-400 transition-colors text-base font-bold">
              →
            </div>
          </button>

          {/* Option 2: Instant Guest / Demo Sandbox (No Wallet Required) */}
          {enableGuestSandbox ? (
            <div className="pt-1">
              <div className="flex items-center gap-2 mb-2 px-1">
                <div className="h-px bg-white/10 flex-1" />
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  Or Test Without An Extension
                </span>
                <div className="h-px bg-white/10 flex-1" />
              </div>

              <button
                onClick={handleRelayerConnect}
                disabled={isConnecting}
                className="w-full p-4 rounded-2xl border border-purple-500/20 bg-purple-950/20 hover:bg-purple-900/30 hover:border-purple-400/50 text-left transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center shrink-0">
                    <Zap className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
                        Instant Guest Sandbox
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        1-Click Test
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Preloaded with Relayer Sepolia ETH for judges & quick tests (No install required)
                    </p>
                  </div>
                </div>
                <div className="text-slate-500 group-hover:text-purple-400 transition-colors">
                  →
                </div>
              </button>
            </div>
          ) : (
            <div className="pt-2">
              <div className="p-3.5 rounded-2xl bg-slate-900/40 border border-white/5 text-slate-400 text-xs flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>InnoXpert Guest Sandbox is disabled by Admin. Please connect MetaMask to continue.</span>
              </div>
            </div>
          )}
        </div>

        {/* Informational Footer */}
        <div className="mt-6 pt-5 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            EIP-1193 Standard & Safe
          </span>
          <span className="text-slate-500">BLI Legal Tech 2026</span>
        </div>
      </div>
    </div>,
    document.body
  );
}
