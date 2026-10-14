"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Globe,
  ExternalLink,
  Copy,
  Check,
  Layers,
  Cpu,
  FileCheck2,
  Lock,
  Sparkles,
  Maximize2,
  X,
  ArrowRight,
  Zap,
  Scale,
  CheckCircle2,
} from "lucide-react";
import {
  Section5Config,
  DEFAULT_SECTION5_CONFIG,
  Section5Chain,
} from "@/lib/firestoreService";
import CyberMultiChainBackgroundAnimation from "./CyberMultiChainBackgroundAnimation";

interface Props {
  config?: Section5Config;
}

export default function MultiChainSecurityVaultSection({
  config = DEFAULT_SECTION5_CONFIG,
}: Props) {
  const currentConfig: Section5Config = {
    ...DEFAULT_SECTION5_CONFIG,
    ...(config || {}),
  };

  const chains: Section5Chain[] = currentConfig.chains || DEFAULT_SECTION5_CONFIG.chains;
  const [selectedChainId, setSelectedChainId] = useState<string>(chains[0]?.id || "chain-base");
  const selectedChain = chains.find((c) => c.id === selectedChainId) || chains[0];

  const [activeHashTab, setActiveHashTab] = useState<"merkle" | "keccak" | "sha256">("merkle");
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [copiedContract, setCopiedContract] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);

  const copyToClipboard = (text: string, type: "hash" | "contract") => {
    navigator.clipboard.writeText(text);
    if (type === "hash") {
      setCopiedHash(text);
      setTimeout(() => setCopiedHash(null), 2000);
    } else {
      setCopiedContract(true);
      setTimeout(() => setCopiedContract(false), 2000);
    }
  };

  const getHashDisplay = () => {
    switch (activeHashTab) {
      case "merkle":
        return currentConfig.merkleRootDemoHash;
      case "keccak":
        return currentConfig.keccakDemoHash;
      case "sha256":
        return currentConfig.sha256DemoHash;
      default:
        return currentConfig.merkleRootDemoHash;
    }
  };

  return (
    <section className="relative w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 border-t border-white/10 bg-slate-950 overflow-hidden min-w-0">
      {/* Background Texture & Optical Multi-Chain Canvas */}
      <div
        className="absolute inset-0 opacity-15 pointer-events-none bg-cover bg-center"
        style={{
          backgroundImage: `url('${currentConfig.bgImageUrl || "/images/hero_cyber_legal_bg.jpg"}')`,
        }}
      />

      {currentConfig.enableAnimatedBackground && (
        <CyberMultiChainBackgroundAnimation intensity={1.1} showOrbits={true} />
      )}

      {/* Cyber ambient glow orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-r from-blue-600/15 via-cyan-500/10 to-purple-600/15 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto space-y-12 sm:space-y-16">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-mono font-bold uppercase tracking-wider backdrop-blur-md shadow-lg shadow-blue-500/10">
            <Globe className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
            <span>{currentConfig.badgeText}</span>
          </div>

          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
            {currentConfig.titlePrefix}{" "}
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              {currentConfig.titleHighlight}
            </span>{" "}
            {currentConfig.titleSuffix}
          </h2>

          <p className="text-slate-300 text-xs sm:text-base leading-relaxed">
            {currentConfig.subheadline}
          </p>
        </div>

        {/* Central Feature Grid: Network Selector + Merkle Hash Inspector */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left Column (7 cols): Multi-Chain Interactive Network Selector */}
          <div className="lg:col-span-7 rounded-3xl bg-slate-900/80 border border-white/10 p-5 sm:p-7 backdrop-blur-xl shadow-2xl space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">
                      Supported EVM Settlement Layers
                    </h3>
                    <p className="text-slate-400 text-xs">
                      Decentralized immutable verification across major production blockchains
                    </p>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-mono font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>All Chains Operational</span>
                </span>
              </div>

              {/* Chain Selection Tabs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {chains.map((chain) => (
                  <button
                    key={chain.id}
                    onClick={() => setSelectedChainId(chain.id)}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      selectedChainId === chain.id
                        ? "bg-gradient-to-b from-blue-600/30 to-slate-900 border-blue-500 text-white shadow-lg shadow-blue-500/20 scale-[1.02]"
                        : "bg-slate-950/70 border-white/5 text-slate-400 hover:text-white hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs">{chain.symbol}</span>
                      <span className="text-[10px] font-mono text-emerald-400">● Live</span>
                    </div>
                    <p className="text-[11px] font-semibold text-white truncate">{chain.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">{chain.avgGasCost}</p>
                  </button>
                ))}
              </div>

              {/* Active Selected Chain Deep Info Card */}
              {selectedChain && (
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/90 border border-blue-500/30 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-mono text-[11px] font-bold">
                        Chain ID: {selectedChain.chainId}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 font-mono text-[11px]">
                        {selectedChain.badge}
                      </span>
                    </div>
                    <span className="text-xs font-mono text-emerald-400 font-semibold">
                      Block Time: {selectedChain.blockTime}
                    </span>
                  </div>

                  <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                    {selectedChain.description}
                  </p>

                  {/* Contract Address & Explorer */}
                  <div className="p-3 rounded-xl bg-slate-900 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="min-w-0">
                      <span className="text-[10px] text-slate-400 font-mono block">
                        Verified Registry Smart Contract Address:
                      </span>
                      <span className="text-xs font-mono text-cyan-300 font-bold truncate block">
                        {selectedChain.contractAddress}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => copyToClipboard(selectedChain.contractAddress, "contract")}
                        className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition-all flex items-center gap-1 border border-white/10"
                        title="Copy Contract Address"
                      >
                        {copiedContract ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-[10px] text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span className="text-[10px]">Copy</span>
                          </>
                        )}
                      </button>

                      <a
                        href={selectedChain.explorerUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-2 rounded-lg bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 hover:text-white text-[10px] font-mono font-bold transition-all flex items-center gap-1 border border-blue-500/30"
                      >
                        <span>Explorer</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Quick Metric Pills */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10 text-center">
              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-white/5">
                <span className="text-[10px] text-slate-400 block font-mono">Immutability</span>
                <span className="text-xs font-extrabold text-white">100% On-Chain</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-white/5">
                <span className="text-[10px] text-slate-400 block font-mono">Timestamping</span>
                <span className="text-xs font-extrabold text-cyan-400">RFC 3161 & EVM</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-white/5">
                <span className="text-[10px] text-slate-400 block font-mono">Audit Admissibility</span>
                <span className="text-xs font-extrabold text-purple-400">FRE Rule 902</span>
              </div>
            </div>
          </div>

          {/* Right Column (5 cols): Cryptographic Proof & Merkle State Inspector */}
          <div className="lg:col-span-5 rounded-3xl bg-slate-900/80 border border-cyan-500/30 p-5 sm:p-7 backdrop-blur-xl shadow-2xl space-y-6 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm sm:text-base">
                      Cryptographic Merkle Inspector
                    </h3>
                    <p className="text-slate-400 text-[11px]">
                      Live dual SHA-256 + keccak256 leaf state roots
                    </p>
                  </div>
                </div>

                <span className="px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 text-[10px] font-mono">
                  Solidity Proof
                </span>
              </div>

              {/* Hash Selector Tabs */}
              <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-950 border border-white/10 text-xs">
                <button
                  onClick={() => setActiveHashTab("merkle")}
                  className={`py-1.5 px-2 rounded-lg font-mono text-[11px] font-bold transition-all ${
                    activeHashTab === "merkle"
                      ? "bg-cyan-500 text-black shadow-md shadow-cyan-500/30"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Merkle Root
                </button>
                <button
                  onClick={() => setActiveHashTab("keccak")}
                  className={`py-1.5 px-2 rounded-lg font-mono text-[11px] font-bold transition-all ${
                    activeHashTab === "keccak"
                      ? "bg-blue-600 text-white shadow-md shadow-blue-500/30"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  keccak256
                </button>
                <button
                  onClick={() => setActiveHashTab("sha256")}
                  className={`py-1.5 px-2 rounded-lg font-mono text-[11px] font-bold transition-all ${
                    activeHashTab === "sha256"
                      ? "bg-purple-600 text-white shadow-md shadow-purple-500/30"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  SHA-256
                </button>
              </div>

              {/* Live Hash Display Box */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-white/10 space-y-2 relative group">
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>Cryptographic Digest:</span>
                  <span className="text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    Verified On Base
                  </span>
                </div>

                <p className="font-mono text-xs sm:text-[13px] text-cyan-300 break-all bg-slate-900/80 p-3 rounded-xl border border-cyan-500/20 select-all">
                  {getHashDisplay()}
                </p>

                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => copyToClipboard(getHashDisplay(), "hash")}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono transition-all flex items-center gap-1.5 border border-white/10"
                  >
                    {copiedHash === getHashDisplay() ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Digest Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Digest</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Visual Merkle Tree Node Graph */}
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-white/5 space-y-2.5">
                <span className="text-[11px] font-mono text-slate-400 font-semibold block">
                  On-Chain Merkle Tree Hierarchy:
                </span>

                <div className="space-y-1.5 text-[11px] font-mono">
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-900/60 border border-purple-500/20 text-purple-300">
                    <span className="text-xs">🌿 Leaf 1:</span>
                    <span className="truncate">Plaintext Agreement SHA-256 Digest</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-900/60 border border-blue-500/20 text-blue-300">
                    <span className="text-xs">🌿 Leaf 2:</span>
                    <span className="truncate">AI Risk Audit Scores & Redline Signature</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-bold">
                    <span className="text-xs">🌳 Root:</span>
                    <span className="truncate">Base Sepolia Smart Contract Slot (0x74b1...)</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Link
                href="/vault"
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-extrabold text-xs shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Sparkles className="w-4 h-4 text-cyan-200" />
                <span>Open Proof Verification Vault</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* 4 Legal Compliance Bento Cards (FRE, DGCL, E-SIGN, eIDAS) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-base sm:text-lg flex items-center gap-2">
              <Scale className="w-5 h-5 text-purple-400" />
              <span>Court-Admissible Legal Standards & Statutory Compliance</span>
            </h3>
            <span className="text-xs font-mono text-slate-400">4 Global Standards</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {(currentConfig.legalFrameworks || DEFAULT_SECTION5_CONFIG.legalFrameworks).map((law) => (
              <div
                key={law.id}
                className="p-5 rounded-2xl bg-slate-900/60 border border-white/10 hover:border-blue-500/40 transition-all backdrop-blur-md space-y-3 flex flex-col justify-between group hover:scale-[1.02]"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/30 text-blue-300 text-[10px] font-mono font-bold">
                      {law.badge}
                    </span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  </div>

                  <h4 className="font-bold text-white text-sm group-hover:text-cyan-300 transition-colors">
                    {law.actTitle}
                  </h4>
                  <p className="text-[11px] font-mono text-cyan-400 font-semibold">
                    {law.codeReference}
                  </p>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    {law.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-white/5">
                  <span className="text-[10px] font-mono text-emerald-400 font-semibold block">
                    ✓ {law.courtAdmissibility}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Central High-Res Showcase Artwork Card with Maximize Modal */}
        <div className="relative rounded-3xl overflow-hidden border border-white/15 bg-slate-900/90 shadow-2xl">
          <div className="relative h-64 sm:h-96 w-full overflow-hidden group cursor-pointer" onClick={() => setShowImageModal(true)}>
            <img
              src={currentConfig.showcaseImageUrl || DEFAULT_SECTION5_CONFIG.showcaseImageUrl}
              alt="Multi-Chain Cryptographic Legal Security Vault"
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
                <span>Full-Res Vault View</span>
              </button>
            </div>

            <div className="absolute bottom-6 left-6 right-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="space-y-1.5 max-w-2xl">
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono text-[10px] font-bold border border-cyan-500/30">
                  BLOCKCHAIN LEGAL INSTITUTE ARCHITECTURE
                </span>
                <h3 className="text-lg sm:text-2xl font-black text-white">
                  Autonomous Cryptographic Legal Vault
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 italic">
                  {currentConfig.courtAdmissibilityQuote}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <a
                  href={currentConfig.explorerCtaLink}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold font-mono transition-all flex items-center gap-1.5 shadow-lg shadow-blue-600/30"
                >
                  <span>{currentConfig.explorerCtaText}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Full-Screen High-Resolution Artwork Modal */}
      {showImageModal && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 sm:p-8"
          onClick={() => setShowImageModal(false)}
        >
          <div
            className="relative max-w-6xl w-full max-h-[90vh] bg-slate-950 rounded-3xl overflow-hidden border border-cyan-500/40 shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-slate-900/80">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-cyan-400" />
                <span className="font-bold text-white text-sm">
                  Multi-Chain Cryptographic Legal Security Vault — 8K System Architecture
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowImageModal(false)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-black">
              <img
                src={currentConfig.showcaseImageUrl || DEFAULT_SECTION5_CONFIG.showcaseImageUrl}
                alt="Vault 8K View"
                className="max-h-[75vh] w-auto object-contain rounded-xl shadow-2xl"
              />
            </div>

            <div className="p-3 border-t border-white/10 bg-slate-900/80 text-center text-xs text-slate-400 font-mono">
              Base Sepolia • Ethereum • Arbitrum • Polygon • Delaware DGCL § 224 Compliant
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
