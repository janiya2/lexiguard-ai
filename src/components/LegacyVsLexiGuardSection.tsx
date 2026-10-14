"use client";

import React from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ShieldCheck,
  XCircle,
  CheckCircle2,
  Sparkles,
  Lock,
  ArrowRight,
  TrendingDown,
  Scale,
  Zap,
  Cpu,
  Layers,
  FileX,
  FileCheck,
} from "lucide-react";
import { Section2Config, DEFAULT_SECTION2_CONFIG } from "@/lib/firestoreService";

interface Props {
  config?: Section2Config;
}

export default function LegacyVsLexiGuardSection({ config = DEFAULT_SECTION2_CONFIG }: Props) {
  const currentConfig = {
    ...DEFAULT_SECTION2_CONFIG,
    ...(config || {}),
  };

  return (
    <section className="relative w-full overflow-hidden border-b border-white/10 bg-[#030612] py-14 sm:py-20 lg:py-24">
      {/* Background Graphic & Cyber Lighting Overlays */}
      {currentConfig.bgImageUrl && (
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none opacity-20 mix-blend-luminosity scale-105 transition-all duration-1000"
          style={{ backgroundImage: `url(${currentConfig.bgImageUrl})` }}
        />
      )}

      {/* Cyber Ambient Radiance Blobs */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#040711] via-[#030612]/90 to-[#030612] pointer-events-none" />
      <div className="absolute top-1/3 left-10 w-[500px] h-[300px] bg-rose-500/10 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-[500px] h-[300px] bg-cyan-500/15 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[700px] h-[250px] bg-purple-600/10 blur-[150px] rounded-full pointer-events-none" />

      {/* Subtle Matrix Grid Texture */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative max-w-7xl w-full mx-auto px-3.5 sm:px-6 lg:px-8 space-y-12 sm:space-y-16 min-w-0">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          {/* Pill Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-cyan-500/30 text-cyan-300 text-[11px] sm:text-xs font-bold tracking-wide shadow-inner shadow-cyan-500/10 backdrop-blur-md">
            <Scale className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>{currentConfig.badgeText}</span>
          </div>

          {/* Main Title */}
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.2]">
            {currentConfig.titlePrefix}{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-rose-400 via-amber-300 to-rose-400">
              {currentConfig.titleHighlight}
            </span>{" "}
            <span className="text-slate-200">{currentConfig.titleSuffix}</span>
          </h2>

          {/* Subtitle */}
          <p className="text-slate-300 text-xs sm:text-base leading-relaxed max-w-2xl mx-auto">
            {currentConfig.subheadline}
          </p>
        </div>

        {/* The Contrast Matrix Grid (2 Columns + Central VS Core) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch relative">
          
          {/* LEFT COLUMN: THE BROKEN LEGACY SYSTEM */}
          <div className="lg:col-span-6 rounded-3xl bg-slate-950/80 border border-rose-500/25 p-5 sm:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden flex flex-col justify-between group hover:border-rose-500/40 transition-all duration-300">
            {/* Top Red Glow Accent */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-600 via-amber-500 to-transparent" />

            <div className="space-y-6">
              {/* Card Header */}
              <div className="space-y-2 border-b border-white/5 pb-5">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-rose-500/15 text-rose-300 border border-rose-500/30 flex items-center gap-1.5">
                    <AlertTriangle className="w-3 h-3 text-rose-400" />
                    <span>{currentConfig.legacyBadge}</span>
                  </span>
                  <span className="text-xs font-mono text-slate-500">Manual / Web2</span>
                </div>

                <h3 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                  <FileX className="w-5 h-5 text-rose-400 shrink-0" />
                  <span>{currentConfig.legacyCardTitle}</span>
                </h3>
                <p className="text-xs text-slate-400">
                  {currentConfig.legacyCardSubtitle}
                </p>
              </div>

              {/* Legacy Points List */}
              <div className="space-y-3.5">
                {currentConfig.legacyPoints.map((point, index) => (
                  <div
                    key={point.id || index}
                    className="p-3.5 sm:p-4 rounded-2xl bg-rose-950/10 border border-rose-500/15 hover:border-rose-500/30 transition-all space-y-1.5 group/item"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-rose-400 shrink-0 group-hover/item:scale-110 transition-transform" />
                        <h4 className="font-bold text-white text-xs sm:text-[13px]">{point.title}</h4>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-300 border border-rose-500/20 shrink-0">
                        {point.tag}
                      </span>
                    </div>
                    <p className="text-slate-400 text-[11px] sm:text-xs leading-relaxed pl-6">
                      {point.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Warning Quote Strip */}
            <div className="mt-6 pt-4 border-t border-white/5 flex items-start gap-3 p-3.5 rounded-2xl bg-slate-900/60 border border-rose-500/10 text-xs text-rose-200/90">
              <TrendingDown className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed">
                {currentConfig.legacyImpactQuote}
              </p>
            </div>
          </div>

          {/* RIGHT COLUMN: LEXIGUARD AI & EVM NOTARY PROTOCOL */}
          <div className="lg:col-span-6 rounded-3xl bg-slate-900/90 border border-cyan-500/40 p-5 sm:p-8 backdrop-blur-2xl shadow-[0_0_60px_-15px_rgba(6,182,212,0.3)] relative overflow-hidden flex flex-col justify-between group hover:border-cyan-400/60 transition-all duration-300">
            {/* Top Cyan/Emerald Glow Accent */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 via-teal-400 to-purple-500" />

            <div className="space-y-6">
              {/* Card Header */}
              <div className="space-y-2 border-b border-white/10 pb-5">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5 shadow-sm shadow-cyan-500/20">
                    <Sparkles className="w-3 h-3 text-cyan-300 animate-spin" style={{ animationDuration: "8s" }} />
                    <span>{currentConfig.lexiguardBadge}</span>
                  </span>
                  <span className="text-xs font-mono text-cyan-400 font-bold">Autonomous / Web3</span>
                </div>

                <h3 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0" />
                  <span>{currentConfig.lexiguardCardTitle}</span>
                </h3>
                <p className="text-xs text-slate-300">
                  {currentConfig.lexiguardCardSubtitle}
                </p>
              </div>

              {/* LexiGuard Points List */}
              <div className="space-y-3.5">
                {currentConfig.lexiguardPoints.map((point, index) => (
                  <div
                    key={point.id || index}
                    className="p-3.5 sm:p-4 rounded-2xl bg-cyan-950/25 border border-cyan-500/20 hover:border-cyan-400/40 transition-all space-y-1.5 group/item shadow-inner shadow-cyan-500/5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 group-hover/item:scale-110 transition-transform" />
                        <h4 className="font-bold text-white text-xs sm:text-[13px]">{point.title}</h4>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 shrink-0">
                        {point.tag}
                      </span>
                    </div>
                    <p className="text-slate-300 text-[11px] sm:text-xs leading-relaxed pl-6">
                      {point.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Proof Quote Strip */}
            <div className="mt-6 pt-4 border-t border-white/10 flex items-start gap-3 p-3.5 rounded-2xl bg-slate-950/80 border border-emerald-500/20 text-xs text-emerald-200">
              <Lock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed">
                {currentConfig.lexiguardImpactQuote}
              </p>
            </div>
          </div>

        </div>

        {/* Visual Graphic Banner (Cyber Legal Architecture Art) */}
        {currentConfig.sideImageUrl && (
          <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-slate-950/90 shadow-2xl p-4 sm:p-6 backdrop-blur-xl group">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              <div className="lg:col-span-5 space-y-3 text-left">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/15 text-purple-300 border border-purple-500/30 inline-flex items-center gap-1.5">
                  <Cpu className="w-3 h-3 text-purple-400" />
                  <span>Dual Consensus Verification Architecture</span>
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-white">
                  Gemini 2.5 NLP Redliner + Base Sepolia Proof-of-Existence
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Every uploaded agreement is evaluated across Delaware DGCL and BLI admissibility standards before anchoring a cryptographic keccak256 hash digest to EVM smart contracts.
                </p>
                <div className="pt-2">
                  <Link
                    href="/auditor"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white text-xs font-bold shadow-md shadow-cyan-500/20 transition-all hover:scale-105"
                  >
                    <span>Test Your Contract Now</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              <div className="lg:col-span-7 relative rounded-2xl overflow-hidden border border-white/10 aspect-[16/9] max-h-72">
                <img
                  src={currentConfig.sideImageUrl}
                  alt="LexiGuard Legal Matrix Architecture"
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#040711]/80 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 px-3 py-1 rounded-xl bg-slate-950/80 border border-cyan-500/30 backdrop-blur-md text-[10px] font-mono text-cyan-300">
                  ⚡ Base Sepolia Smart Contract Registry • Validated By Consensus
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom 3-Metric Protocol Performance Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6 text-center">
          <div className="p-4 sm:p-6 rounded-2xl bg-slate-900/60 border border-white/5 hover:border-cyan-500/30 transition-all backdrop-blur-sm space-y-1">
            <p className="text-2xl sm:text-3xl font-black text-cyan-400 font-mono">
              {currentConfig.stat1Value}
            </p>
            <p className="text-xs font-medium text-slate-400">{currentConfig.stat1Label}</p>
          </div>

          <div className="p-4 sm:p-6 rounded-2xl bg-slate-900/60 border border-white/5 hover:border-emerald-500/30 transition-all backdrop-blur-sm space-y-1">
            <p className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
              {currentConfig.stat2Value}
            </p>
            <p className="text-xs font-medium text-slate-400">{currentConfig.stat2Label}</p>
          </div>

          <div className="p-4 sm:p-6 rounded-2xl bg-slate-900/60 border border-white/5 hover:border-purple-500/30 transition-all backdrop-blur-sm space-y-1">
            <p className="text-2xl sm:text-3xl font-black text-purple-400 font-mono">
              {currentConfig.stat3Value}
            </p>
            <p className="text-xs font-medium text-slate-400">{currentConfig.stat3Label}</p>
          </div>
        </div>

      </div>
    </section>
  );
}
