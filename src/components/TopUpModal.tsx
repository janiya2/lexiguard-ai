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
  Coins,
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
  const { account, chainId } = useWeb3();
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [selectedPackIndex, setSelectedPackIndex] = useState(1); // Default to Pro Pack
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState<{
    txHash: string;
    explorerUrl: string;
    credits: number;
    packName: string;
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

  const handleBuy = async () => {
    setIsPurchasing(true);
    setErrorMessage(null);

    try {
      const treasury = settings.ownerTreasuryAddress || "0x7F2B89a468eB3f4D9165b4c10a12e87319E454E2";
      const networkKey = chainId === 421614 ? "arbitrum-sepolia" : "base-sepolia";

      const res = await purchaseAuditCreditsOnChain(
        selectedPack.priceEth,
        treasury,
        account || undefined,
        networkKey
      );

      // Record in Firestore
      await saveCreditPurchase({
        walletAddress: account || "0x9E2F...GUEST",
        packName: selectedPack.name,
        creditsAdded: selectedPack.credits,
        amountEth: selectedPack.priceEth,
        txHash: res.txHash,
        network: "Base Sepolia Testnet",
      });

      // Update local credits
      const updatedTotal = addUserCredits(account, selectedPack.credits);
      setCurrentCredits(updatedTotal);

      // Fire confetti
      confetti({
        particleCount: 60,
        spread: 70,
        colors: ["#06b6d4", "#a855f7", "#10b981"],
      });

      setPurchaseSuccess({
        txHash: res.txHash,
        explorerUrl: res.explorerUrl,
        credits: selectedPack.credits,
        packName: selectedPack.name,
      });

      if (onCreditsPurchased) {
        onCreditsPurchased(updatedTotal);
      }
    } catch (err: any) {
      console.error("Top-up purchase failed:", err);
      setErrorMessage(err.message || "Failed to complete transaction.");
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
          <span className="text-slate-400">Current Available Credits:</span>
          <span className="font-mono font-bold text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-0.5 rounded-lg flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            {currentCredits} Audits Left
          </span>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
            {errorMessage}
          </div>
        )}

        {/* Success State */}
        {purchaseSuccess ? (
          <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-3">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
            <div>
              <h4 className="text-sm font-bold text-white">
                +{purchaseSuccess.credits} Credits Added Successfully!
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                {purchaseSuccess.packName} credited to your wallet session.
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 text-[11px] font-mono text-cyan-300 break-all flex items-center justify-between">
              <span className="truncate max-w-[280px]">TX: {purchaseSuccess.txHash}</span>
              <a
                href={purchaseSuccess.explorerUrl}
                target="_blank"
                rel="noreferrer"
                className="text-cyan-400 hover:underline flex items-center gap-0.5 ml-2 shrink-0 font-sans font-semibold"
              >
                <span>BaseScan</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <button
              onClick={onClose}
              className="w-full mt-2 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs transition-all"
            >
              Continue Auditing Contracts
            </button>
          </div>
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

            {/* Purchase CTA */}
            <button
              onClick={handleBuy}
              disabled={isPurchasing}
              className="w-full py-3.5 rounded-xl font-bold text-xs bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white shadow-[0_0_30px_-5px_rgba(6,182,212,0.5)] transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isPurchasing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Confirming On-Chain Transfer...</span>
                </>
              ) : (
                <>
                  <Coins className="w-4 h-4" />
                  <span>
                    Top Up {selectedPack.credits} Audits ({selectedPack.priceEth} ETH)
                  </span>
                </>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
