"use client";

import React from "react";
import Link from "next/link";
import { Shield, Github, ExternalLink, Scale, CheckCircle2 } from "lucide-react";

export default function Footer() {
  return (
    <footer className="w-full border-t border-white/5 bg-[#04060d] text-slate-400 text-xs py-12 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          
          {/* Brand info */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-900 border border-cyan-500/30 overflow-hidden shadow-sm">
                <img src="/logo.png" alt="LexiGuard AI" className="w-full h-full object-cover" />
              </div>
              <span className="font-black text-base text-white">
                LexiGuard<span className="text-cyan-400">.AI</span>
              </span>
            </div>
            <p className="text-slate-400 text-xs max-w-sm leading-relaxed">
              Empowering global builders, freelancers, and enterprises with verifiable AI contract risk audits and cryptographic proof-of-existence anchoring on EVM networks.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-semibold">
                <CheckCircle2 className="w-3 h-3" />
                Live on Base & Arbitrum Sepolia
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[11px] font-semibold">
                BLI Hackathon 2
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <p className="font-semibold text-white uppercase tracking-wider text-[11px]">Platform</p>
            <ul className="space-y-2">
              <li>
                <Link href="/auditor" className="hover:text-cyan-400 transition-colors">
                  AI Contract Auditor
                </Link>
              </li>
              <li>
                <Link href="/vault" className="hover:text-cyan-400 transition-colors">
                  On-Chain Notary Vault
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-cyan-400 transition-colors">
                  Admin Control Hub
                </Link>
              </li>
              <li>
                <a
                  href="https://dorahacks.io/hackathon/legal-hack-2026/build"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-cyan-400 inline-flex items-center gap-1 transition-colors"
                >
                  DoraHacks Entry <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </li>
            </ul>
          </div>

          {/* Organizers & Sponsors */}
          <div className="space-y-3">
            <p className="font-semibold text-white uppercase tracking-wider text-[11px]">Organizers & Credits</p>
            <ul className="space-y-2">
              <li className="flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-cyan-400" />
                <span>Blockchain Legal Institute (BLI)</span>
              </li>
              <li>Cogent Law Group</li>
              <li>
                <a
                  href="https://innoxpert.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-cyan-300 hover:underline font-semibold"
                >
                  InnoXpert Studio
                </a>{" "}
                (Janitha Dilshan)
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500">
          <p>© 2026 LexiGuard AI. Architected by InnoXpert Studio for BLI Legal Tech Hackathon 2.</p>
          <div className="flex items-center gap-4">
            <span className="font-mono text-[11px] text-slate-400">
              Contract: 0x4A79...1493 (Solidity 0.8.20)
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
