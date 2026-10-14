"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import CyberSecurityFooterSection from "@/components/CyberSecurityFooterSection";
import CyberHeroBackgroundAnimation from "@/components/CyberHeroBackgroundAnimation";
import LegacyVsLexiGuardSection from "@/components/LegacyVsLexiGuardSection";
import ProtocolPipelineSection from "@/components/ProtocolPipelineSection";
import InteractiveAuditorSandbox from "@/components/InteractiveAuditorSandbox";
import MultiChainSecurityVaultSection from "@/components/MultiChainSecurityVaultSection";
import EnterprisePricingSection from "@/components/EnterprisePricingSection";
import LegalComplianceFaqSection from "@/components/LegalComplianceFaqSection";
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Lock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  FileCheck2,
  ExternalLink,
  Cpu,
  Layers,
  Copy,
  Check,
  RefreshCw,
  Zap,
  UserCheck,
} from "lucide-react";
import {
  getSiteSettings,
  getNotarizedContracts,
  SiteSettings,
  DEFAULT_SITE_SETTINGS,
  DEFAULT_HERO_CONFIG,
} from "@/lib/firestoreService";
import { useWeb3 } from "@/context/Web3Context";

export default function Home() {
  const { account, chainId } = useWeb3();
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [recentContracts, setRecentContracts] = useState<any[]>([]);

  // Load Firestore settings & initial notarized contracts
  useEffect(() => {
    async function loadData() {
      const s = await getSiteSettings();
      setSettings(s);

      const contracts = await getNotarizedContracts();
      setRecentContracts(contracts);
    }
    loadData();
  }, []);

  return (
    <div className="flex flex-col min-h-screen w-full max-w-full overflow-x-hidden">
      <Navbar />

      {/* Announcement Banner */}
      <div className="w-full bg-gradient-to-r from-cyan-950/70 via-purple-950/70 to-slate-900 border-b border-cyan-500/20 py-2 sm:py-2.5 px-3 sm:px-4 text-center overflow-hidden">
        <p className="text-[11px] sm:text-xs font-semibold text-cyan-200 tracking-wide flex items-center justify-center gap-1.5 sm:gap-2 max-w-full">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0 animate-spin" style={{ animationDuration: "6s" }} />
          <span className="truncate sm:whitespace-normal">{settings.announcementText}</span>
        </p>
      </div>

      {/* SECTION 1: CYBER-LEGAL HERO SECTION (THE HOOK) */}
      <section className="relative w-full overflow-hidden border-b border-white/10 bg-[#040711] py-8 sm:py-12 lg:py-20">
        {/* Dynamic Background Image with Cyber Mask */}
        {(settings.heroConfig?.bgImageUrl || DEFAULT_HERO_CONFIG.bgImageUrl) && (
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none opacity-25 mix-blend-luminosity md:opacity-35 transition-all duration-1000 scale-105"
            style={{
              backgroundImage: `url(${settings.heroConfig?.bgImageUrl || DEFAULT_HERO_CONFIG.bgImageUrl})`,
            }}
          />
        )}

        {/* Ambient Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#040711]/95 via-[#040711]/70 to-[#040711] pointer-events-none" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[750px] h-[350px] bg-gradient-to-tr from-cyan-500/15 via-purple-600/15 to-blue-500/10 blur-[130px] rounded-full pointer-events-none" />

        {/* Live Cyber-Legal Blockchain Nodes Canvas Animation */}
        {(settings.heroConfig?.enableBackgroundAnimation ?? DEFAULT_HERO_CONFIG.enableBackgroundAnimation) && (
          <CyberHeroBackgroundAnimation
            styleType={settings.heroConfig?.animationStyle || DEFAULT_HERO_CONFIG.animationStyle}
          />
        )}

        <div className="relative max-w-7xl w-full mx-auto px-3.5 sm:px-6 lg:px-8 space-y-8 sm:space-y-12 min-w-0">
          {/* Main 2-Column Hero Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center min-w-0">
            
            {/* Left Column: Value Proposition & CTAs */}
            <div className="lg:col-span-7 space-y-5 sm:space-y-6 text-left min-w-0 w-full">
              {/* Live Protocol Badge */}
              <div className="inline-flex items-center gap-2 sm:gap-2.5 px-3 py-1.5 rounded-full bg-slate-900/90 border border-cyan-500/30 text-cyan-300 text-[11px] sm:text-xs font-semibold shadow-inner shadow-cyan-500/10 backdrop-blur-md max-w-full">
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400" />
                </span>
                <span className="break-words line-clamp-2 sm:line-clamp-none">
                  {settings.heroConfig?.badgeText || DEFAULT_HERO_CONFIG.badgeText}
                </span>
              </div>

              {/* Main Headline */}
              <h1 className="text-2xl sm:text-4xl lg:text-6xl font-black text-white tracking-tight leading-[1.15] break-words">
                {settings.heroConfig?.headlinePrefix || DEFAULT_HERO_CONFIG.headlinePrefix}{" "}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-teal-300 to-purple-400">
                  {settings.heroConfig?.headlineHighlight || DEFAULT_HERO_CONFIG.headlineHighlight}
                </span>{" "}
                <span className="text-slate-300">
                  {settings.heroConfig?.headlineSuffix || DEFAULT_HERO_CONFIG.headlineSuffix}
                </span>
              </h1>

              {/* Subheadline Copy */}
              <p className="text-slate-300 text-xs sm:text-base lg:text-lg max-w-2xl leading-relaxed break-words">
                {settings.heroConfig?.subheadline || settings.heroSubtitle || DEFAULT_HERO_CONFIG.subheadline}
              </p>

              {/* Interactive CTA Cluster */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2 w-full sm:w-auto">
                <Link
                  href={settings.heroConfig?.primaryCtaLink || DEFAULT_HERO_CONFIG.primaryCtaLink}
                  className="flex items-center justify-center gap-2.5 px-5 sm:px-6 py-3.5 rounded-2xl text-xs sm:text-sm font-bold bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-[0_0_30px_-5px_rgba(6,182,212,0.5)] transition-all hover:scale-[1.02] active:scale-[0.98] text-center"
                >
                  <Sparkles className="w-4 h-4 text-cyan-200 shrink-0" />
                  <span>{settings.heroConfig?.primaryCtaText || DEFAULT_HERO_CONFIG.primaryCtaText}</span>
                  <ArrowRight className="w-4 h-4 ml-0.5 shrink-0" />
                </Link>

                <Link
                  href={settings.heroConfig?.secondaryCtaLink || DEFAULT_HERO_CONFIG.secondaryCtaLink}
                  className="flex items-center justify-center gap-2 px-4 sm:px-5 py-3.5 rounded-2xl text-xs sm:text-sm font-semibold bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-white/10 hover:border-cyan-500/30 transition-all hover:scale-[1.02] text-center"
                >
                  <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>{settings.heroConfig?.secondaryCtaText || DEFAULT_HERO_CONFIG.secondaryCtaText}</span>
                </Link>

                <Link
                  href={settings.heroConfig?.tertiaryCtaLink || DEFAULT_HERO_CONFIG.tertiaryCtaLink}
                  className="flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl text-xs font-semibold bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 transition-all hover:scale-[1.02] text-center"
                >
                  <UserCheck className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <span>{settings.heroConfig?.tertiaryCtaText || DEFAULT_HERO_CONFIG.tertiaryCtaText}</span>
                </Link>
              </div>

              {/* Trust & Compliance Signals */}
              <div className="pt-2 flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-2 sm:gap-4 text-[11px] sm:text-xs text-slate-400 font-medium">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Base Sepolia #84532 Smart Contract</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>SHA-256 + keccak256 Proof</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <span>Delaware & BLI Standards</span>
                </span>
              </div>
            </div>

            {/* Right Column: Holographic Cyber Shield Visual Card */}
            {(settings.heroConfig?.showFloatingShield ?? DEFAULT_HERO_CONFIG.showFloatingShield) && (
              <div className="lg:col-span-5 relative group min-w-0 w-full mt-4 lg:mt-0">
                {/* Outer Glow */}
                <div className="absolute -inset-1 rounded-3xl bg-gradient-to-tr from-cyan-500/20 via-purple-500/20 to-blue-500/20 blur-xl opacity-75 group-hover:opacity-100 transition-opacity" />

                <div className="relative rounded-3xl bg-slate-900/80 border border-white/10 p-4 sm:p-6 backdrop-blur-2xl shadow-2xl space-y-4 min-w-0">
                  {/* Card Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-white/10 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                      <span className="font-bold text-white tracking-wide truncate">LEXIGUARD VERIFIER v2.5</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 shrink-0">
                      Base #84532
                    </span>
                  </div>

                  {/* Central Graphic */}
                  <div className="relative aspect-square sm:aspect-[4/3] rounded-2xl overflow-hidden border border-white/10 bg-slate-950/80 flex items-center justify-center">
                    <img
                      src={settings.heroConfig?.sideImageUrl || DEFAULT_HERO_CONFIG.sideImageUrl}
                      alt="LexiGuard Cyber Hologram Notary"
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#040711] via-transparent to-transparent opacity-50" />

                    {/* Floating Chip 1: Cryptographic Digest */}
                    <div className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-slate-950/85 border border-cyan-500/30 backdrop-blur-md shadow-lg flex items-center gap-1.5 sm:gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400 shrink-0" />
                      <div>
                        <p className="text-[8px] sm:text-[9px] uppercase tracking-wider text-slate-400 font-bold">SHA-256 Digest</p>
                        <p className="text-[9px] sm:text-[10px] font-mono font-bold text-cyan-300">0x8fa9...b302</p>
                      </div>
                    </div>

                    {/* Floating Chip 2: Health Rating */}
                    <div className="absolute bottom-2.5 right-2.5 sm:bottom-3 sm:right-3 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-slate-950/85 border border-emerald-500/30 backdrop-blur-md shadow-lg flex items-center gap-1.5 sm:gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 shrink-0" />
                      <div>
                        <p className="text-[8px] sm:text-[9px] uppercase tracking-wider text-slate-400 font-bold">Legal Health</p>
                        <p className="text-[10px] sm:text-[11px] font-mono font-black text-emerald-300">98/100 Pass</p>
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom Strip */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-slate-400 pt-1">
                    <span className="flex items-center gap-1.5 font-mono">
                      <Lock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>keccak256 Proof-of-Existence</span>
                    </span>
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <Sparkles className="w-3 h-3 shrink-0" /> Zero Liabilities
                    </span>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* 4 Micro Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4 text-left pt-2 min-w-0 w-full">
            <div className="p-3 sm:p-4 rounded-2xl bg-slate-900/60 border border-white/5 hover:border-cyan-500/30 transition-all backdrop-blur-sm space-y-1 min-w-0">
              <p className="text-[10px] sm:text-[11px] font-medium text-slate-400 truncate">
                {settings.heroConfig?.stat1Label || DEFAULT_HERO_CONFIG.stat1Label}
              </p>
              <p className="text-sm sm:text-lg font-extrabold text-white truncate">
                {settings.heroConfig?.stat1Value || DEFAULT_HERO_CONFIG.stat1Value}
              </p>
            </div>

            <div className="p-3 sm:p-4 rounded-2xl bg-slate-900/60 border border-white/5 hover:border-cyan-500/30 transition-all backdrop-blur-sm space-y-1 min-w-0">
              <p className="text-[10px] sm:text-[11px] font-medium text-slate-400 truncate">
                {settings.heroConfig?.stat2Label || DEFAULT_HERO_CONFIG.stat2Label}
              </p>
              <p className="text-sm sm:text-lg font-extrabold text-cyan-400 font-mono truncate">
                {settings.heroConfig?.stat2Value || DEFAULT_HERO_CONFIG.stat2Value}
              </p>
            </div>

            <div className="p-3 sm:p-4 rounded-2xl bg-slate-900/60 border border-white/5 hover:border-emerald-500/30 transition-all backdrop-blur-sm space-y-1 min-w-0">
              <p className="text-[10px] sm:text-[11px] font-medium text-slate-400 truncate">
                {settings.heroConfig?.stat3Label || DEFAULT_HERO_CONFIG.stat3Label}
              </p>
              <p className="text-sm sm:text-lg font-extrabold text-emerald-400 truncate">
                {settings.heroConfig?.stat3Value || DEFAULT_HERO_CONFIG.stat3Value}
              </p>
            </div>

            <div className="p-3 sm:p-4 rounded-2xl bg-slate-900/60 border border-white/5 hover:border-purple-500/30 transition-all backdrop-blur-sm space-y-1 min-w-0">
              <p className="text-[10px] sm:text-[11px] font-medium text-slate-400 truncate">
                {settings.heroConfig?.stat4Label || DEFAULT_HERO_CONFIG.stat4Label}
              </p>
              <p className="text-sm sm:text-lg font-extrabold text-purple-400 truncate">
                {settings.heroConfig?.stat4Value || DEFAULT_HERO_CONFIG.stat4Value}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: THE BROKEN LEGACY SYSTEM VS. LEXIGUARD AI PROTOCOL */}
      <LegacyVsLexiGuardSection config={settings.section2Config} />

      {/* SECTION 3: THE 3-STEP CRYPTOGRAPHIC VERIFICATION PIPELINE */}
      <ProtocolPipelineSection config={settings.section3Config} />

      {/* SECTION 4: INTERACTIVE LIVE AUDITOR SANDBOX & ON-CHAIN SIMULATOR */}
      <InteractiveAuditorSandbox
        config={settings.section4Config}
        geminiApiKey={settings.geminiApiKey}
        account={account}
        chainId={chainId}
        onNotarizationCompleted={async () => {
          const updated = await getNotarizedContracts();
          setRecentContracts(updated);
        }}
      />

      {/* SECTION 5: MULTI-CHAIN SECURITY & LIVE CRYPTOGRAPHIC PROOF VAULT */}
      <MultiChainSecurityVaultSection config={settings.section5Config} />

      {/* SECTION 6: ENTERPRISE TIER PRICING & INSTITUTIONAL SLA VAULT */}
      <EnterprisePricingSection config={settings.section6Config} />

      {/* SECTION 7: INTERACTIVE LEGAL & COMPLIANCE FAQ KNOWLEDGE VAULT */}
      <LegalComplianceFaqSection config={settings.section7Config} />

      {/* SECTION 8: CYBER SECURITY LEGAL FOOTER & VERIFICATION EXPLORER */}
      <CyberSecurityFooterSection config={settings.section8Config} />
    </div>
  );
}
