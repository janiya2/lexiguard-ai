"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Check,
  Sparkles,
  Zap,
  ShieldCheck,
  Scale,
  ArrowRight,
  ExternalLink,
  Coins,
  Cpu,
  Lock,
  Maximize2,
  X,
  CreditCard,
  Wallet,
  HelpCircle,
} from "lucide-react";
import {
  Section6Config,
  DEFAULT_SECTION6_CONFIG,
  Section6PricingTier,
} from "@/lib/firestoreService";
import CyberPricingBackgroundAnimation from "./CyberPricingBackgroundAnimation";
import TopUpModal from "./TopUpModal";

interface Props {
  config?: Section6Config;
}

export default function EnterprisePricingSection({
  config = DEFAULT_SECTION6_CONFIG,
}: Props) {
  const currentConfig: Section6Config = {
    ...DEFAULT_SECTION6_CONFIG,
    ...(config || {}),
  };

  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);

  const tiers: Section6PricingTier[] =
    currentConfig.tiers && currentConfig.tiers.length > 0
      ? currentConfig.tiers
      : DEFAULT_SECTION6_CONFIG.tiers;

  const handleTierAction = (tier: Section6PricingTier, e: React.MouseEvent) => {
    if (tier.actionType === "topup_starter" || tier.actionType === "topup_pro" || tier.actionType === "topup_agency") {
      e.preventDefault();
      setIsTopUpOpen(true);
    }
  };

  return (
    <section className="relative w-full py-16 sm:py-24 px-3.5 sm:px-6 lg:px-8 border-t border-white/10 bg-[#030612] overflow-x-hidden min-w-0">
      {/* Background Texture Overlay */}
      <div
        className="absolute inset-0 opacity-15 pointer-events-none bg-cover bg-center transition-all duration-700"
        style={{
          backgroundImage: `url('${currentConfig.bgImageUrl || "/images/hero_cyber_legal_bg.jpg"}')`,
        }}
      />

      {/* Cyber Canvas Animation */}
      {currentConfig.enableAnimatedBackground && (
        <CyberPricingBackgroundAnimation intensity={1} />
      )}

      {/* Ambient Glow Orbs */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] sm:w-[650px] h-[300px] sm:h-[400px] bg-gradient-to-r from-purple-600/15 via-cyan-500/10 to-blue-600/15 rounded-full blur-[100px] sm:blur-[140px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto space-y-10 sm:space-y-14 w-full">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 px-1">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[11px] sm:text-xs font-mono font-bold uppercase tracking-wider backdrop-blur-md shadow-lg shadow-cyan-500/10 max-w-full">
            <Coins className="w-3.5 h-3.5 text-cyan-400 shrink-0 animate-spin" style={{ animationDuration: "8s" }} />
            <span className="truncate">{currentConfig.badgeText}</span>
          </div>

          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
            {currentConfig.titlePrefix}{" "}
            <span className="bg-gradient-to-r from-cyan-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
              {currentConfig.titleHighlight}
            </span>{" "}
            {currentConfig.titleSuffix}
          </h2>

          <p className="text-slate-300 text-xs sm:text-base leading-relaxed max-w-2xl mx-auto">
            {currentConfig.subheadline}
          </p>

          {/* Web3 Protocol Highlights Banner (Zero Subscriptions) */}
          <div className="pt-2 sm:pt-3 flex items-center justify-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-slate-900/90 border border-cyan-500/30 backdrop-blur-xl shadow-xl text-xs text-slate-300 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-white font-bold">100% Non-Custodial:</span>
              <span className="text-cyan-300">{currentConfig.protocolFeeBadge || "99% to Contractor • 1% to Treasury"}</span>
            </div>
          </div>
        </div>

        {/* 3 Real Web3 Micro-Packs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 items-stretch w-full">
          {tiers.map((tier, idx) => {
            const isPopular = tier.isPopular;

            return (
              <div
                key={tier.id || idx}
                className={`relative rounded-3xl p-5 sm:p-7 backdrop-blur-xl flex flex-col justify-between transition-all duration-300 ${
                  isPopular
                    ? "bg-slate-900/95 border-2 border-cyan-500 shadow-2xl shadow-cyan-500/20 scale-[1.01] lg:scale-[1.03] z-10"
                    : "bg-slate-900/60 border border-white/10 hover:border-cyan-500/40 shadow-xl hover:scale-[1.01]"
                }`}
              >
                {/* Popular Pill */}
                {isPopular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="px-3.5 py-1 rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-[10px] font-black uppercase tracking-wider shadow-lg flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-cyan-200" />
                      <span>{tier.badge || "Most Popular Micro-Pack"}</span>
                    </span>
                  </div>
                )}

                {/* Card Top: Title, Badge, Description */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg sm:text-xl font-extrabold text-white">
                        {tier.name}
                      </h3>
                      {!isPopular && tier.badge && (
                        <span className="inline-block mt-1 px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-white/5 border border-white/10 text-cyan-300">
                          {tier.badge}
                        </span>
                      )}
                    </div>

                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                        tier.color === "purple"
                          ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                          : tier.color === "blue"
                          ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                          : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                      }`}
                    >
                      {tier.color === "purple" ? (
                        <Zap className="w-5 h-5" />
                      ) : tier.color === "blue" ? (
                        <ShieldCheck className="w-5 h-5" />
                      ) : (
                        <Cpu className="w-5 h-5" />
                      )}
                    </div>
                  </div>

                  <p className="text-slate-400 text-xs leading-relaxed min-h-[38px]">
                    {tier.description}
                  </p>

                  {/* Price Tag (Primary ETH + USD Equivalent) */}
                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/5 space-y-1">
                    <div className="flex items-baseline justify-between">
                      <span className="text-2xl sm:text-3xl font-black text-white font-mono flex items-center gap-1">
                        <Coins className="w-5 h-5 text-cyan-400" />
                        {tier.priceEth}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[10px] font-mono font-bold">
                        {tier.creditsLabel}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-mono pt-1.5 border-t border-white/5 text-slate-400">
                      <span>Approx. Fiat Value:</span>
                      <span className="text-slate-300 font-bold">{tier.priceUsdEquivalent}</span>
                    </div>
                  </div>

                  {/* Features Checklist */}
                  <div className="space-y-2.5 pt-2">
                    <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                      Included Capabilities:
                    </span>
                    <ul className="space-y-2">
                      {tier.features.map((feat, fIdx) => (
                        <li key={fIdx} className="flex items-start gap-2.5 text-xs text-slate-300">
                          <div
                            className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                              isPopular
                                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                                : "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                            }`}
                          >
                            <Check className="w-2.5 h-2.5" />
                          </div>
                          <span className="leading-tight">{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Card Bottom CTA */}
                <div className="pt-6 mt-6 border-t border-white/10 space-y-2">
                  {tier.actionType === "sandbox" ? (
                    <Link
                      href={tier.ctaLink}
                      className="w-full py-3 px-4 rounded-2xl font-extrabold text-xs flex items-center justify-center gap-2 transition-all min-h-[44px] bg-slate-800 hover:bg-slate-700 text-white border border-white/10 hover:border-cyan-500/40"
                    >
                      <span>{tier.ctaText}</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => handleTierAction(tier, e)}
                      className={`w-full py-3 px-4 rounded-2xl font-extrabold text-xs flex items-center justify-center gap-2 transition-all min-h-[44px] ${
                        isPopular
                          ? "bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white shadow-lg shadow-cyan-500/25 hover:scale-[1.02] active:scale-[0.98]"
                          : "bg-slate-800 hover:bg-slate-700 text-white border border-white/10 hover:border-cyan-500/40"
                      }`}
                    >
                      <Wallet className="w-4 h-4 text-cyan-200" />
                      <span>{tier.ctaText}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}

                  <p className="text-center text-[10px] text-slate-500 font-mono">
                    {tier.actionType === "sandbox"
                      ? "Instant access • No wallet required"
                      : "Direct on-chain payment via MetaMask to Treasury"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Master Showcase Artwork Card (8K Terminal View) */}
        <div className="relative rounded-3xl overflow-hidden border border-white/15 bg-slate-900/90 shadow-2xl">
          <div
            className="relative h-60 sm:h-80 md:h-96 w-full overflow-hidden group cursor-pointer"
            onClick={() => setShowImageModal(true)}
          >
            <img
              src={currentConfig.showcaseImageUrl || DEFAULT_SECTION6_CONFIG.showcaseImageUrl}
              alt="Section 6 Pricing Vault & Terminal Master Artwork"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

            <div className="absolute top-4 right-4 z-10">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowImageModal(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-950/80 hover:bg-slate-900 text-white text-xs font-mono font-semibold backdrop-blur-md border border-white/20 flex items-center gap-1.5 shadow-xl transition-all"
              >
                <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Full-Res Terminal View</span>
              </button>
            </div>

            <div className="absolute bottom-5 left-5 right-5 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="space-y-1.5 max-w-2xl">
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono text-[10px] font-bold border border-cyan-500/30">
                  SMART CONTRACT ESCROW PROTOCOL
                </span>
                <h3 className="text-base sm:text-2xl font-black text-white">
                  {currentConfig.escrowProtocolTitle || "1% Non-Custodial Smart Escrow Protocol Fee"}
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 line-clamp-2 sm:line-clamp-none">
                  {currentConfig.escrowProtocolDesc || "When client & contractor milestones are settled in the Escrow Vault, 99% of funds are released directly to the contractor with 1% automatically routed to the protocol treasury on Base Sepolia."}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href="/vault"
                  onClick={(e) => e.stopPropagation()}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold font-mono transition-all flex items-center gap-1.5 shadow-lg shadow-cyan-500/30 min-h-[44px]"
                >
                  <Scale className="w-3.5 h-3.5" />
                  <span>Open Milestone Escrow Vault</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Sovereign Guarantees Footer Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 pt-2">
          <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-900/60 border border-white/5 space-y-1">
            <span className="text-[10px] text-slate-400 font-mono block">Zero Lock-In</span>
            <p className="text-xs sm:text-sm font-bold text-white">Pay Per Audit</p>
            <p className="text-[10px] text-slate-500">No recurring monthly fees</p>
          </div>

          <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-900/60 border border-white/5 space-y-1">
            <span className="text-[10px] text-slate-400 font-mono block">Treasury Split</span>
            <p className="text-xs sm:text-sm font-bold text-cyan-400">99% / 1% Escrow</p>
            <p className="text-[10px] text-slate-500">Decentralized non-custodial payouts</p>
          </div>

          <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-900/60 border border-white/5 space-y-1">
            <span className="text-[10px] text-slate-400 font-mono block">Base Sepolia</span>
            <p className="text-xs sm:text-sm font-bold text-purple-400">0.0001 ETH Packs</p>
            <p className="text-[10px] text-slate-500">Ultra-low gas testnet payments</p>
          </div>

          <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-900/60 border border-white/5 space-y-1">
            <span className="text-[10px] text-slate-400 font-mono block">Gasless Relayer</span>
            <p className="text-xs sm:text-sm font-bold text-emerald-400">Subsidized Audits</p>
            <p className="text-[10px] text-slate-500">Autonomous Web3 relayer backstop</p>
          </div>
        </div>
      </div>

      {/* TopUpModal Integration directly on Landing Page */}
      <TopUpModal
        isOpen={isTopUpOpen}
        onClose={() => setIsTopUpOpen(false)}
      />

      {/* Full-Screen Master Artwork Modal */}
      {showImageModal && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-3 sm:p-6"
          onClick={() => setShowImageModal(false)}
        >
          <div
            className="relative max-w-5xl w-full max-h-[90vh] bg-slate-950 rounded-3xl overflow-hidden border border-cyan-500/40 shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3.5 sm:p-4 border-b border-white/10 flex items-center justify-between bg-slate-900/80">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span className="font-bold text-white text-xs sm:text-sm truncate">
                  Web3 Micro-Audit Terminal & Escrow Protocol — 8K System View
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowImageModal(false)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-all min-h-[36px] min-w-[36px] flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-3 sm:p-4 flex items-center justify-center bg-black">
              <img
                src={currentConfig.showcaseImageUrl || DEFAULT_SECTION6_CONFIG.showcaseImageUrl}
                alt="Pricing Vault Full View"
                className="max-h-[70vh] w-auto object-contain rounded-xl shadow-2xl"
              />
            </div>

            <div className="p-3 border-t border-white/10 bg-slate-900/80 text-center text-[11px] text-slate-400 font-mono">
              Base Sepolia EVM Anchoring • Non-Custodial 99/1% Escrow Milestone Payouts • Treasury: 0x74b1...E300
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
