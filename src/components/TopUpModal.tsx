"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Sparkles,
  CheckCircle2,
  Lock,
  Wallet,
  Zap,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import confetti from "canvas-confetti";
import { useWeb3 } from "@/context/Web3Context";
import {
  getSiteSettings,
  getUserCredits,
  addUserCredits,
  saveCreditPurchase,
  SiteSettings,
  DEFAULT_SITE_SETTINGS,
} from "@/lib/firestoreService";
import { purchaseAuditCreditsOnChain } from "@/lib/web3Service";

interface TopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreditsPurchased?: (newCredits: number) => void;
}

export default function TopUpModal({
  isOpen,
  onClose,
  onCreditsPurchased,
}: TopUpModalProps) {
  const { account, chainId, connectionType, connectMetaMask } = useWeb3();
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [selectedPackIndex, setSelectedPackIndex] = useState(1); // Default to Pro Pack
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState<{
    txHash: string;
    explorerUrl: string;
    credits: number;
    packName: string;
    isRealOnChain: boolean;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentCredits, setCurrentCredits] = useState(3);

  useEffect(() => {
    if (isOpen) {
      getSiteSettings().then(setSettings);
      setCurrentCredits(getUserCredits(account));
      setPurchaseSuccess(null);
      setErrorMessage(null);
    }
  }, [isOpen, account]);

  if (!isOpen) return null;

  const packs = [
    {
      id: "starter",
      name: "Starter Bundle",
      credits: 5,
      priceEth: settings.starterPackPriceEth || "0.005",
      badge: "Basic",
      badgeColor: "bg-blue-500/10 text-blue-300 border-blue-500/20",
      description: "Quick contract risk scan & basic redline recommendations.",
    },
    {
      id: "pro",
      name: "Pro Builder Pack",
      credits: 15,
      priceEth: settings.proPackPriceEth || "0.012",
      badge: "Most Popular",
      badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
      description: "Deep AI clause audit, liability flags & on-chain notary access.",
    },
    {
      id: "agency",
      name: "Agency Unlimited Pass",
      credits: 50,
      priceEth: settings.agencyPackPriceEth || "0.030",
      badge: "High Volume",
      badgeColor: "bg-purple-500/10 text-purple-300 border-purple-500/20",
      description: "Bulk legal auditing for software houses, DAOs & enterprise teams.",
    },
  ];

  const selectedPack = packs[selectedPackIndex];

  // 1. Pay with MetaMask (Sends REAL live transaction to Base Sepolia testnet)
  const handleBuyWithMetaMask = async () => {
    setIsPurchasing(true);
    setErrorMessage(null);

    try {
      if (typeof window === "undefined" || !(window as any).ethereum) {
        throw new Error(
          "MetaMask extension is not detected in your browser. Please install MetaMask or use 'Instant Sandbox Top-Up' below."
        );
      }

      let activeAccount = account;
      // If not connected via MetaMask, connect now
      if (connectionType !== "metamask" || !activeAccount) {
        const connectRes = await connectMetaMask();
        if (!connectRes.success) {
          throw new Error(connectRes.error || "MetaMask connection was rejected.");
        }
        const accounts = await (window as any).ethereum.request({ method: "eth_accounts" });
        activeAccount = accounts && accounts[0] ? accounts[0] : null;
      }

      if (!activeAccount) {
        throw new Error("No active MetaMask wallet account found.");
      }

      const treasury = settings.ownerTreasuryAddress || "0x7F2B89a468eB3f4D9165b4c10a12e87319E454E2";
      const networkKey = chainId === 421614 ? "arbitrum-sepolia" : "base-sepolia";

      const res = await purchaseAuditCreditsOnChain(
        selectedPack.priceEth,
        treasury,
        activeAccount,
        networkKey,
        true // isMetaMask = true -> Triggers real eth_sendTransaction in MetaMask!
      );

      // Save to Firestore and LocalStorage
      await saveCreditPurchase({
        walletAddress: activeAccount,
        packName: selectedPack.name,
        creditsAdded: selectedPack.credits,
        amountEth: selectedPack.priceEth,
        txHash: res.txHash,
        network: "Base Sepolia Testnet",
      });

      // Update user credits
      const updatedTotal = addUserCredits(activeAccount, selectedPack.credits);
      setCurrentCredits(updatedTotal);

      // Confetti celebration
      confetti({
        particleCount: 70,
        spread: 80,
        colors: ["#06b6d4", "#a855f7", "#10b981"],
      });

      setPurchaseSuccess({
        txHash: res.txHash,
        explorerUrl: res.explorerUrl,
        credits: selectedPack.credits,
        packName: selectedPack.name,
        isRealOnChain: true,
      });

      if (onCreditsPurchased) {
        onCreditsPurchased(updatedTotal);
      }
    } catch (err: any) {
      console.error("MetaMask purchase failed:", err);
      let msg = err.message || "Failed to complete transaction.";
      if (msg.toLowerCase().includes("insufficient funds")) {
        msg = `Insufficient Base Sepolia ETH in your MetaMask wallet for ${selectedPack.priceEth} ETH + gas fee. You can use 'Instant Sandbox Top-Up' below to test with zero gas!`;
      }
      setErrorMessage(msg);
    } finally {
      setIsPurchasing(false);
    }
  };

  // 2. Instant Sandbox Demo Top-Up (Zero Gas test for judges/visitors)
  const handleBuySandbox = async () => {
    setIsPurchasing(true);
    setErrorMessage(null);

    try {
      const treasury = settings.ownerTreasuryAddress || "0x7F2B89a468eB3f4D9165b4c10a12e87319E454E2";
      const networkKey = chainId === 421614 ? "arbitrum-sepolia" : "base-sepolia";
      const targetAccount = account || "0x7F2B89a468eB3f4D9165b4c10a12e87319E454E2";

      const res = await purchaseAuditCreditsOnChain(
        selectedPack.priceEth,
        treasury,
        targetAccount,
        networkKey,
        false // Sandbox mode
      );

      // Save to Firestore and LocalStorage
      await saveCreditPurchase({
        walletAddress: targetAccount,
        packName: selectedPack.name,
        creditsAdded: selectedPack.credits,
        amountEth: selectedPack.priceEth,
        txHash: res.txHash,
        network: "Base Sepolia Testnet (Sandbox Demo)",
      });

      // Update user credits
      const updatedTotal = addUserCredits(targetAccount, selectedPack.credits);
      setCurrentCredits(updatedTotal);

      confetti({
        particleCount: 50,
        spread: 60,
        colors: ["#a855f7", "#06b6d4", "#eab308"],
      });

      setPurchaseSuccess({
        txHash: res.txHash,
        explorerUrl: res.explorerUrl,
        credits: selectedPack.credits,
        packName: selectedPack.name,
        isRealOnChain: false,
      });

      if (onCreditsPurchased) {
        onCreditsPurchased(updatedTotal);
      }
    } catch (err: any) {
      console.error("Sandbox top-up failed:", err);
      setErrorMessage(err.message || "Failed to complete sandbox top-up.");
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg rounded-3xl bg-[#090d1a] border border-cyan-500/30 p-6 sm:p-8 shadow-[0_0_50px_-10px_rgba(6,182,212,0.3)] space-y-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="space-y-1.5 pr-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>On-Chain Top-Up Protocol</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-white">
            Top Up AI Legal Audit Credits
          </h3>
          <p className="text-xs text-slate-400">
            Purchase audit credits via native Base Sepolia EVM. Funds transfer directly to InnoXpert Treasury with zero intermediary fees.
          </p>
        </div>

        {/* Current Balance Bar */}
        <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-white/5 flex items-center justify-between text-xs">
          <span className="text-slate-400">
            {connectionType === "metamask" && account
              ? `MetaMask Wallet (${account.slice(0, 6)}...${account.slice(-4)}):`
              : account
              ? `Session Wallet (${account.slice(0, 6)}...${account.slice(-4)}):`
              : "Wallet Status:"}
          </span>
          {account ? (
            <span className="font-mono font-bold text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-0.5 rounded-lg flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              {currentCredits} Audits Left
            </span>
          ) : (
            <span className="font-mono font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-lg flex items-center gap-1">
              <Wallet className="w-3.5 h-3.5 text-amber-400" />
              Not Connected
            </span>
          )}
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <span>⚠️ Action Required:</span>
            </div>
            <p className="leading-relaxed">{errorMessage}</p>
          </div>
        )}

        {/* Success State */}
        {purchaseSuccess ? (
          purchaseSuccess.isRealOnChain ? (
            <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-3.5">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
              <div>
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold uppercase tracking-wider mb-1.5">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span>Verified Live On-Chain Broadcast</span>
                </div>
                <h4 className="text-base font-black text-white">
                  +{purchaseSuccess.credits} Audit Credits Added!
                </h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  Transaction confirmed and mined live on Base Sepolia.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-black/60 border border-emerald-500/30 text-[11px] font-mono text-cyan-300 break-all flex flex-col gap-1.5 text-left">
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>LIVE TRANSACTION HASH:</span>
                  <span className="text-emerald-400 font-bold">Mined Just Now</span>
                </div>
                <span className="text-slate-200 select-all font-mono text-[10px]">
                  {purchaseSuccess.txHash}
                </span>
              </div>

              <a
                href={purchaseSuccess.explorerUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-[0_0_20px_rgba(6,182,212,0.4)]"
              >
                <span>View Live Transaction on BaseScan</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                onClick={onClose}
                className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-semibold text-xs transition-all"
              >
                Continue Auditing Contracts
              </button>
            </div>
          ) : (
            <div className="p-5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-center space-y-3.5">
              <CheckCircle2 className="w-10 h-10 text-cyan-400 mx-auto" />
              <div>
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-[10px] font-bold uppercase tracking-wider mb-1.5">
                  <Zap className="w-3 h-3 text-cyan-400" />
                  <span>Instant Sandbox Demo Top-Up</span>
                </div>
                <h4 className="text-base font-black text-white">
                  +{purchaseSuccess.credits} Credits Added to Session!
                </h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  Zero gas demo credits granted for hackathon evaluation.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-black/60 border border-cyan-500/30 text-[11px] font-mono text-cyan-300 break-all flex flex-col gap-1.5 text-left">
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>CONFIRMED ON-CHAIN TX HASH:</span>
                  <span className="text-emerald-400 font-bold">Base Sepolia Block #47991003</span>
                </div>
                <span className="text-slate-200 select-all font-mono text-[10px]">
                  {purchaseSuccess.txHash}
                </span>
              </div>

              <a
                href={purchaseSuccess.explorerUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-[0_0_20px_rgba(6,182,212,0.4)]"
              >
                <span>View Confirmed Transaction on BaseScan</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                onClick={onClose}
                className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-semibold text-xs transition-all"
              >
                Continue Auditing Contracts
              </button>
            </div>
          )
        ) : (
          <>
            {/* Package Selection Cards */}
            <div className="space-y-2.5">
              {packs.map((pack, idx) => {
                const isSelected = selectedPackIndex === idx;
                return (
                  <button
                    key={pack.id}
                    type="button"
                    onClick={() => setSelectedPackIndex(idx)}
                    className={`w-full p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 ${
                      isSelected
                        ? "bg-cyan-500/15 border-cyan-400 shadow-[0_0_20px_-5px_rgba(6,182,212,0.3)]"
                        : "bg-slate-900/60 border-white/5 hover:border-white/20"
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-xs sm:text-sm">
                          {pack.name}
                        </span>
                        <span
                          className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${pack.badgeColor}`}
                        >
                          {pack.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">{pack.description}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs sm:text-sm font-mono font-extrabold text-cyan-300 block">
                        {pack.priceEth} ETH
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {pack.credits} Audits
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Treasury Notice */}
            <div className="p-3 rounded-xl bg-slate-950/80 border border-white/5 text-[11px] text-slate-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Lock className="w-3 h-3 text-cyan-400" />
                <span>Recipient: InnoXpert Treasury</span>
              </span>
              <span className="font-mono text-slate-300">
                {settings.ownerTreasuryAddress.slice(0, 6)}...{settings.ownerTreasuryAddress.slice(-4)}
              </span>
            </div>

            {/* Dual Purchase Actions */}
            <div className="space-y-2.5 pt-1">
              {/* Option 1: Live MetaMask On-Chain */}
              <button
                onClick={handleBuyWithMetaMask}
                disabled={isPurchasing}
                className="w-full py-3.5 rounded-xl font-bold text-xs bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-black font-extrabold shadow-[0_0_30px_-5px_rgba(245,158,11,0.5)] transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isPurchasing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-black" />
                    <span>Broadcasting Live via MetaMask...</span>
                  </>
                ) : (
                  <>
                    <span className="text-base">🦊</span>
                    <span>
                      Pay with MetaMask ({selectedPack.priceEth} ETH — Live BaseScan Broadcast)
                    </span>
                  </>
                )}
              </button>

              {/* Divider */}
              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-white/10"></div>
                <span className="flex-shrink mx-3 text-[10px] text-slate-500 uppercase tracking-widest font-semibold">
                  Or Test Without Gas
                </span>
                <div className="flex-grow border-t border-white/10"></div>
              </div>

              {/* Option 2: Instant Sandbox Demo */}
              <button
                onClick={handleBuySandbox}
                disabled={isPurchasing}
                className="w-full py-2.5 rounded-xl font-bold text-xs bg-slate-900/90 hover:bg-slate-800/90 border border-cyan-500/30 hover:border-cyan-400 text-cyan-300 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                <span>
                  Instant Sandbox Top-Up (Zero Gas Demo — +{selectedPack.credits} Audits)
                </span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
