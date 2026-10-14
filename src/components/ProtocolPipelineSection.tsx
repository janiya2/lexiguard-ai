"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  Cpu,
  ShieldCheck,
  CheckCircle2,
  Zap,
  Fingerprint,
  Scale,
  Maximize2,
  X,
  Lock,
} from "lucide-react";
import { Section3Config, DEFAULT_SECTION3_CONFIG } from "@/lib/firestoreService";
import CyberPipelineBackgroundAnimation from "@/components/CyberPipelineBackgroundAnimation";

interface Props {
  config?: Section3Config;
}

export default function ProtocolPipelineSection({ config = DEFAULT_SECTION3_CONFIG }: Props) {
  const currentConfig: Section3Config = {
    ...DEFAULT_SECTION3_CONFIG,
    ...(config || {}),
  };

  const [activeStepHover, setActiveStepHover] = useState<number | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);

  const stepIcons = [Fingerprint, Cpu, ShieldCheck];

  return (
    <section className="relative w-full overflow-hidden border-b border-white/10 bg-[#020510] py-14 sm:py-20 lg:py-28">
      {/* Background Graphic & Cyber Ambient Glow */}
      {currentConfig.bgImageUrl && (
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none opacity-20 mix-blend-luminosity scale-105 transition-all duration-1000"
          style={{ backgroundImage: `url(${currentConfig.bgImageUrl})` }}
        />
      )}

      {/* Cyber Ambient Radiance Blobs */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#030612] via-[#020510]/95 to-[#020510] pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[350px] bg-cyan-500/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[600px] h-[350px] bg-purple-600/15 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[700px] h-[250px] bg-emerald-500/10 blur-[160px] rounded-full pointer-events-none" />

      {/* Futuristic Mesh Grid Pattern */}
      {currentConfig.enableAnimatedGrid && (
        <div
          className="absolute inset-0 opacity-[0.035] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
      )}

      {/* Live Animated Cyber Cryptographic Stream Background */}
      {currentConfig.enableAnimatedBackground && <CyberPipelineBackgroundAnimation />}

      <div className="relative max-w-7xl w-full mx-auto px-3.5 sm:px-6 lg:px-8 space-y-12 sm:space-y-16 min-w-0 z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-purple-500/30 text-purple-300 text-[11px] sm:text-xs font-bold tracking-wide shadow-inner shadow-purple-500/10 backdrop-blur-md">
            <Zap className="w-3.5 h-3.5 text-purple-400 shrink-0 animate-pulse" />
            <span>{currentConfig.badgeText}</span>
          </div>

          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.2]">
            {currentConfig.titlePrefix}{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-purple-300 to-emerald-400">
              {currentConfig.titleHighlight}
            </span>{" "}
            <span className="text-slate-200">{currentConfig.titleSuffix}</span>
          </h2>

          <p className="text-slate-300 text-xs sm:text-base leading-relaxed max-w-2xl mx-auto">
            {currentConfig.subheadline}
          </p>
        </div>

        {/* The 3-Step Interactive Cards Grid with Visual Artwork */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 relative items-stretch">
          
          {currentConfig.steps.map((step, idx) => {
            const Icon = stepIcons[idx % stepIcons.length];
            const isHovered = activeStepHover === idx;

            // Step color accents
            const colorStyles =
              idx === 0
                ? {
                    border: "border-cyan-500/30 hover:border-cyan-400/80",
                    glow: "shadow-[0_0_40px_-10px_rgba(6,182,212,0.25)] hover:shadow-[0_0_50px_rgba(6,182,212,0.4)]",
                    badge: "bg-cyan-500/10 text-cyan-300 border-cyan-500/30",
                    accentText: "text-cyan-400",
                    bgTop: "from-cyan-500/20 via-cyan-500/10 to-transparent",
                    watermark: "text-cyan-500/10",
                    pillBeacon: "bg-cyan-400",
                  }
                : idx === 1
                ? {
                    border: "border-purple-500/30 hover:border-purple-400/80",
                    glow: "shadow-[0_0_40px_-10px_rgba(168,85,247,0.25)] hover:shadow-[0_0_50px_rgba(168,85,247,0.4)]",
                    badge: "bg-purple-500/10 text-purple-300 border-purple-500/30",
                    accentText: "text-purple-400",
                    bgTop: "from-purple-500/20 via-purple-500/10 to-transparent",
                    watermark: "text-purple-500/10",
                    pillBeacon: "bg-purple-400",
                  }
                : {
                    border: "border-emerald-500/30 hover:border-emerald-400/80",
                    glow: "shadow-[0_0_40px_-10px_rgba(16,185,129,0.25)] hover:shadow-[0_0_50px_rgba(16,185,129,0.4)]",
                    badge: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
                    accentText: "text-emerald-400",
                    bgTop: "from-emerald-500/20 via-emerald-500/10 to-transparent",
                    watermark: "text-emerald-500/10",
                    pillBeacon: "bg-emerald-400",
                  };

            return (
              <div
                key={step.id || idx}
                onMouseEnter={() => setActiveStepHover(idx)}
                onMouseLeave={() => setActiveStepHover(null)}
                className={`relative rounded-3xl bg-slate-900/85 border ${colorStyles.border} backdrop-blur-xl ${colorStyles.glow} transition-all duration-300 flex flex-col justify-between group hover:-translate-y-2 overflow-hidden`}
              >
                {/* Large Background Step Number Watermark */}
                <div
                  className={`absolute top-2 right-4 text-7xl sm:text-8xl font-black font-mono select-none pointer-events-none transition-opacity ${colorStyles.watermark} group-hover:opacity-30`}
                >
                  {step.stepNumber}
                </div>

                {/* Subtle Top Accent Glow Line */}
                <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${colorStyles.bgTop}`} />

                {/* Step Card Visual Artwork */}
                {step.imageUrl && (
                  <div className="relative w-full h-44 sm:h-48 overflow-hidden bg-slate-950/80 border-b border-white/10">
                    <img
                      src={step.imageUrl}
                      alt={step.title}
                      className="w-full h-full object-cover object-center group-hover:scale-108 transition-transform duration-700 brightness-95 group-hover:brightness-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
                    
                    {/* Top floating badge */}
                    <div className="absolute top-3 left-3">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border backdrop-blur-md ${colorStyles.badge}`}
                      >
                        {step.tag}
                      </span>
                    </div>

                    {/* Step Icon badge floating over image bottom */}
                    <div className="absolute bottom-3 left-4 flex items-center gap-2">
                      <div
                        className={`w-10 h-10 rounded-xl bg-slate-950/90 border ${colorStyles.border} flex items-center justify-center ${colorStyles.accentText} group-hover:scale-110 transition-transform shadow-lg backdrop-blur-md`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-mono font-black text-white/90 drop-shadow">
                        STEP {step.stepNumber}
                      </span>
                    </div>
                  </div>
                )}

                <div className="p-5 sm:p-6 space-y-4 relative z-10 flex-1 flex flex-col justify-between">
                  {/* Step Header (if no image) */}
                  {!step.imageUrl && (
                    <div className="flex items-center justify-between">
                      <div
                        className={`w-12 h-12 rounded-2xl bg-slate-950/80 border ${colorStyles.border} flex items-center justify-center ${colorStyles.accentText} group-hover:scale-110 transition-transform shadow-md`}
                      >
                        <Icon className="w-6 h-6" />
                      </div>

                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${colorStyles.badge}`}
                      >
                        {step.tag}
                      </span>
                    </div>
                  )}

                  <div className="space-y-2.5">
                    {/* Step Title */}
                    <h3 className="text-lg sm:text-xl font-bold text-white leading-snug group-hover:text-cyan-200 transition-colors">
                      {step.title}
                    </h3>

                    {/* Step Description */}
                    <p className="text-slate-300 text-xs sm:text-[13px] leading-relaxed">
                      {step.desc}
                    </p>
                  </div>

                  {/* Bottom Technical Metric Pill */}
                  <div className="pt-3 border-t border-white/5">
                    <div className="p-2.5 rounded-xl bg-slate-950/70 border border-white/5 flex items-center gap-2 text-[11px] text-slate-300 font-mono">
                      <span className={`w-2 h-2 rounded-full ${colorStyles.pillBeacon} animate-ping shrink-0`} />
                      <span className="truncate">{step.technicalMetric}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

        </div>

        {/* Visual Architecture Showcase: 3-Node Connected Diagram */}
        {currentConfig.sideImageUrl && (
          <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-slate-950/90 shadow-2xl p-4 sm:p-7 backdrop-blur-xl group">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
              
              {/* Left Column: Visual Diagram Image with Lightbox Zoom */}
              <div
                onClick={() => setShowImageModal(true)}
                className="lg:col-span-7 relative rounded-2xl overflow-hidden border border-white/10 aspect-[16/9] max-h-84 cursor-pointer group/img"
              >
                <img
                  src={currentConfig.sideImageUrl}
                  alt="LexiGuard 3-Step Protocol Pipeline Architecture"
                  className="w-full h-full object-cover object-center group-hover/img:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#020510]/80 via-transparent to-transparent pointer-events-none" />
                
                <div className="absolute top-3 right-3 p-2 rounded-xl bg-slate-950/80 border border-white/20 text-white opacity-0 group-hover/img:opacity-100 transition-opacity">
                  <Maximize2 className="w-4 h-4 text-cyan-300" />
                </div>

                <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-xl bg-slate-950/85 border border-purple-500/30 backdrop-blur-md text-[10px] sm:text-xs font-mono text-purple-200 flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <span>3-Node Verified Cryptographic Consensus Flow</span>
                </div>
              </div>

              {/* Right Column: Legal Admissibility Breakdown */}
              <div className="lg:col-span-5 space-y-4 text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px] font-semibold">
                  <Scale className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Judicial Admissibility Protocol</span>
                </div>

                <h3 className="text-xl sm:text-2xl font-black text-white leading-tight">
                  {currentConfig.calloutTitle}
                </h3>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {currentConfig.calloutDesc}
                </p>

                <div className="space-y-2.5 pt-1 text-xs text-slate-300">
                  {currentConfig.calloutBullet1 && (
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      <span>{currentConfig.calloutBullet1}</span>
                    </div>
                  )}
                  {currentConfig.calloutBullet2 && (
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                      <span>{currentConfig.calloutBullet2}</span>
                    </div>
                  )}
                  {currentConfig.calloutBullet3 && (
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{currentConfig.calloutBullet3}</span>
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <Link
                    href={currentConfig.ctaLink || "/auditor"}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-purple-600 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-black font-extrabold text-xs shadow-lg shadow-cyan-500/25 transition-all hover:scale-105 active:scale-95"
                  >
                    <span>{currentConfig.ctaText}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>

      {/* Lightbox Modal for Architecture Image */}
      {showImageModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md"
          onClick={() => setShowImageModal(false)}
        >
          <div
            className="relative max-w-5xl w-full rounded-2xl overflow-hidden border border-cyan-500/40 bg-slate-950 p-2 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-slate-900/80 border border-white/20 text-white hover:bg-red-500/80 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={currentConfig.sideImageUrl}
              alt="Full Resolution Pipeline Architecture"
              className="w-full h-auto max-h-[85vh] object-contain rounded-xl"
            />
          </div>
        </div>
      )}
    </section>
  );
}
