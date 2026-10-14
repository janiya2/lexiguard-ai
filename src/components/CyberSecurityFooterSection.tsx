"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Shield,
  ShieldCheck,
  Scale,
  ExternalLink,
  Copy,
  Check,
  Sparkles,
  ArrowUp,
  Cpu,
  Layers,
  Lock,
  Globe,
  Award,
  Terminal,
  Activity,
  Heart
} from "lucide-react";
import { Section8Config, DEFAULT_SECTION8_CONFIG } from "@/lib/firestoreService";

interface CyberSecurityFooterSectionProps {
  config?: Section8Config;
}

export default function CyberSecurityFooterSection({ config }: CyberSecurityFooterSectionProps) {
  const cfg = config || DEFAULT_SECTION8_CONFIG;
  const [copiedContract, setCopiedContract] = useState(false);

  const handleCopyContract = () => {
    if (!cfg.contractAddress) return;
    navigator.clipboard.writeText(cfg.contractAddress);
    setCopiedContract(true);
    setTimeout(() => setCopiedContract(false), 2500);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer id="protocol-footer" className="relative w-full overflow-hidden bg-[#02050e] border-t border-cyan-500/20 text-slate-300">
      {/* Ambient Gradient Glow Line at Top */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/60 to-purple-500/60" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-gradient-to-b from-cyan-500/10 via-purple-500/5 to-transparent blur-2xl pointer-events-none" />

      {/* Background Texture Overlay */}
      {cfg.bgTextureUrl && (
        <div
          className="absolute inset-0 bg-cover bg-center pointer-events-none opacity-10 mix-blend-luminosity"
          style={{ backgroundImage: `url(${cfg.bgTextureUrl})` }}
        />
      )}

      {/* Radial Atmospheric Lighting */}
      {cfg.enableAmbientGlow && (
        <div className="absolute -bottom-24 right-1/4 w-[500px] h-[300px] bg-purple-600/10 blur-[140px] rounded-full pointer-events-none" />
      )}

      <div className="relative max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 pt-12 sm:pt-16 pb-8 space-y-12">
        {/* Top Institutional Banner & Live Node Heartbeat */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-slate-900/60 border border-white/10 backdrop-blur-xl shadow-2xl">
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 text-xs">
            <span className="px-3 py-1 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-bold flex items-center gap-1.5 shadow-sm">
              <Award className="w-3.5 h-3.5 text-cyan-400" />
              <span>{cfg.hackathonBadge}</span>
            </span>
            <span className="px-3 py-1 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 font-medium flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-purple-400" />
              <span>{cfg.bliAccreditation}</span>
            </span>
            <span className="hidden sm:inline-flex px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-white/10 font-medium">
              {cfg.cogentAccreditation}
            </span>
          </div>

          {cfg.showLiveStatusBeacon && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-mono font-medium self-start lg:self-auto">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
              <span>{cfg.liveStatusText}</span>
            </div>
          )}
        </div>

        {/* Main 4-Column Grid: Brand & Explorer Card + 3 Navigation Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10">
          
          {/* Column 1 & 2: Brand Identity & Smart Contract Explorer Card (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Brand Logo & Title */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-purple-600 p-0.5 shadow-lg shadow-cyan-500/20 group hover:scale-105 transition-transform">
                  <div className="w-full h-full rounded-[14px] bg-[#040711] flex items-center justify-center overflow-hidden">
                    <img
                      src={cfg.logoUrl || "/logo.png"}
                      alt={cfg.brandTitle}
                      className="w-7 h-7 object-contain"
                    />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-1">
                    {cfg.brandTitle.split(".")[0]}
                    <span className="text-cyan-400">.{cfg.brandTitle.split(".")[1] || "AI"}</span>
                  </h3>
                  <p className="text-[10px] font-mono text-cyan-300 tracking-wider uppercase">
                    v2.5 BLI Sepolia Edition
                  </p>
                </div>
              </div>

              <p className="text-xs sm:text-sm font-semibold text-slate-300">
                {cfg.brandTagline}
              </p>

              <p className="text-xs text-slate-400 leading-relaxed max-w-md">
                {cfg.brandDescription}
              </p>
            </div>

            {/* Smart Contract Notary Explorer Card */}
            {cfg.showContractCard && (
              <div className="p-4 rounded-2xl bg-slate-950/90 border border-cyan-500/30 space-y-3 shadow-xl relative group hover:border-cyan-400/50 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold text-white tracking-wide">
                      {cfg.contractCardTitle}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                    {cfg.networkName}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900 border border-white/5 flex items-center justify-between gap-2">
                  <span className="font-mono text-[11px] text-cyan-300 truncate">
                    {cfg.contractAddress}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={handleCopyContract}
                      title="Copy Contract Address"
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all text-xs flex items-center gap-1"
                    >
                      {copiedContract ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-[10px] text-emerald-400 font-mono">Copied</span>
                        </>
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <a
                      href={cfg.explorerUrl}
                      target="_blank"
                      rel="noreferrer"
                      title="View on BaseScan"
                      className="p-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 hover:text-white transition-all text-xs"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-400 pt-0.5 font-mono">
                  <span className="flex items-center gap-1">
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span>{cfg.contractSolidityVersion}</span>
                  </span>
                  <span className="text-cyan-400/90">
                    {cfg.relayerStatusText}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Column 3: Platform Quick Links (2 or 3 cols) */}
          <div className="lg:col-span-2 space-y-3.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span>Platform</span>
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              {cfg.platformLinks.map((link, idx) => (
                <li key={idx}>
                  <Link
                    href={link.href}
                    className="hover:text-cyan-300 transition-colors flex items-center justify-between group"
                  >
                    <span className="group-hover:translate-x-0.5 transition-transform">{link.label}</span>
                    {link.badge && (
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-white/5 group-hover:bg-cyan-500/20 text-slate-400 group-hover:text-cyan-300 transition-colors">
                        {link.badge}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Legal & Compliance Standards (3 cols) */}
          <div className="lg:col-span-3 space-y-3.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-purple-400" />
              <span>Statutory Compliance</span>
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              {cfg.legalComplianceLinks.map((link, idx) => (
                <li key={idx}>
                  <Link
                    href={link.href}
                    className="hover:text-purple-300 transition-colors flex items-center justify-between group"
                  >
                    <span className="group-hover:translate-x-0.5 transition-transform">{link.label}</span>
                    {link.badge && (
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-purple-500/10 group-hover:bg-purple-500/20 text-purple-300 transition-colors">
                        {link.badge}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 5: Developer & Hackathon (2 cols) */}
          <div className="lg:col-span-2 space-y-3.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
              <span>Hackathon Hub</span>
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              {cfg.developerLinks.map((link, idx) => (
                <li key={idx}>
                  {link.isExternal ? (
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:text-emerald-300 transition-colors inline-flex items-center gap-1.5 group"
                    >
                      <span className="group-hover:translate-x-0.5 transition-transform">{link.label}</span>
                      <ExternalLink className="w-2.5 h-2.5 opacity-60 group-hover:opacity-100 transition-opacity" />
                    </a>
                  ) : (
                    <Link
                      href={link.href}
                      className="hover:text-emerald-300 transition-colors flex items-center justify-between group"
                    >
                      <span className="group-hover:translate-x-0.5 transition-transform">{link.label}</span>
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* Bottom Bar: Copyright, Architect Credits & Scroll-To-Top */}
        <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="space-y-1 text-center sm:text-left">
            <p className="font-medium text-slate-300">{cfg.copyrightText}</p>
            <p className="text-[11px] text-slate-400">
              Architected & Engineered by{" "}
              <a
                href={cfg.architectPortfolioUrl || "https://innoxpert.com"}
                target="_blank"
                rel="noreferrer"
                className="text-cyan-400 hover:text-cyan-300 hover:underline font-bold"
              >
                {cfg.architectStudio}
              </a>{" "}
              ({cfg.architectName}) for the Blockchain Legal Institute (BLI) Legal Tech Hackathon 2.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <a
              href={cfg.supportTelegramUrl || "https://t.me/innoxpert"}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-slate-400 hover:text-cyan-300 transition-colors flex items-center gap-1"
            >
              <span>Telegram Concierge</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            <button
              type="button"
              onClick={scrollToTop}
              title="Return to top"
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-white/10 hover:border-cyan-500/30 transition-all flex items-center gap-1 text-xs"
            >
              <span>Top</span>
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
