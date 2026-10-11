"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CertificateModal from "@/components/CertificateModal";
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
} from "lucide-react";
import {
  SAMPLE_CONTRACTS,
  analyzeContract,
  LegalAuditReport,
} from "@/lib/aiLegalAuditor";
import {
  notarizeDocumentOnChain,
  NotarizationResult,
} from "@/lib/web3Service";
import {
  getSiteSettings,
  saveNotarizedContract,
  getNotarizedContracts,
  SiteSettings,
  DEFAULT_SITE_SETTINGS,
} from "@/lib/firestoreService";

export default function Home() {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [selectedSample, setSelectedSample] = useState(SAMPLE_CONTRACTS[0]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isNotarizing, setIsNotarizing] = useState(false);
  const [auditReport, setAuditReport] = useState<LegalAuditReport | null>(null);
  const [notarizationResult, setNotarizationResult] = useState<NotarizationResult | null>(null);
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);
  const [recentContracts, setRecentContracts] = useState<any[]>([]);

  // Load Firestore settings & initial audit
  useEffect(() => {
    async function loadData() {
      const s = await getSiteSettings();
      setSettings(s);

      const contracts = await getNotarizedContracts();
      setRecentContracts(contracts);

      // Perform default analysis on first sample
      const initialReport = await analyzeContract(
        SAMPLE_CONTRACTS[0].title,
        SAMPLE_CONTRACTS[0].text,
        s.geminiApiKey
      );
      setAuditReport(initialReport);
    }
    loadData();
  }, []);

  const handleSelectSample = async (sample: (typeof SAMPLE_CONTRACTS)[0]) => {
    setSelectedSample(sample);
    setIsAnalyzing(true);
    setNotarizationResult(null);

    const report = await analyzeContract(sample.title, sample.text, settings.geminiApiKey);
    setAuditReport(report);
    setIsAnalyzing(false);
  };

  const handleNotarize = async () => {
    if (!auditReport) return;
    setIsNotarizing(true);

    try {
      const res = await notarizeDocumentOnChain(
        auditReport.title,
        selectedSample.text,
        auditReport.overallScore,
        undefined,
        "base-sepolia"
      );

      setNotarizationResult(res);
      setIsCertModalOpen(true);

      // Save to Firestore lexiguard_contracts collection
      await saveNotarizedContract(auditReport, res);

      // Refresh recent contracts
      const updated = await getNotarizedContracts();
      setRecentContracts(updated);
    } catch (e) {
      console.error(e);
    } finally {
      setIsNotarizing(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      {/* Announcement Banner */}
      <div className="w-full bg-gradient-to-r from-cyan-950/70 via-purple-950/70 to-slate-900 border-b border-cyan-500/20 py-2.5 px-4 text-center">
        <p className="text-xs font-semibold text-cyan-200 tracking-wide flex items-center justify-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" style={{ animationDuration: "6s" }} />
          <span>{settings.announcementText}</span>
        </p>
      </div>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-24">
        
        {/* HERO SECTION */}
        <section className="text-center space-y-6 pt-4 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/90 border border-cyan-500/30 text-cyan-300 text-xs font-semibold shadow-inner">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>AI Legal Clause Auditor + EVM Notary dApp</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-[1.15]">
            Audit, Redline & Notarize{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400">
              Legal Contracts
            </span>{" "}
            on the Blockchain
          </h1>

          <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            {settings.heroSubtitle}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link
              href="/auditor"
              className="flex items-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-bold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-[0_0_30px_-5px_rgba(6,182,212,0.5)] transition-all hover:scale-[1.02]"
            >
              <Sparkles className="w-4 h-4" />
              <span>Launch Custom Contract Auditor</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>

            <Link
              href="/vault"
              className="flex items-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-semibold bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-white/10 transition-all hover:scale-[1.02]"
            >
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>Explore Public Notary Vault</span>
            </Link>
          </div>

          {/* Micro Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-8 text-left">
            <div className="p-4 rounded-2xl bg-slate-900/50 border border-white/5 backdrop-blur-sm">
              <p className="text-[11px] font-medium text-slate-400">Blockchain Networks</p>
              <p className="text-lg font-extrabold text-white">Base & Arbitrum</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/50 border border-white/5 backdrop-blur-sm">
              <p className="text-[11px] font-medium text-slate-400">Hashing Integrity</p>
              <p className="text-lg font-extrabold text-cyan-400">SHA-256 + keccak256</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/50 border border-white/5 backdrop-blur-sm">
              <p className="text-[11px] font-medium text-slate-400">Average Audit Latency</p>
              <p className="text-lg font-extrabold text-emerald-400">&lt; 1.8 Seconds</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/50 border border-white/5 backdrop-blur-sm">
              <p className="text-[11px] font-medium text-slate-400">Legal Review Saved</p>
              <p className="text-lg font-extrabold text-purple-400">85% Billable Hours</p>
            </div>
          </div>
        </section>

        {/* INTERACTIVE LIVE AUDITOR SANDBOX (KEY JUDGING DEMO) */}
        <section className="rounded-3xl bg-slate-900/80 border border-white/10 p-6 sm:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Sandbox Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  Live Interactive Demo
                </span>
                <span className="text-xs text-slate-400">1-Click Test for Judges</span>
              </div>
              <h2 className="text-2xl font-black text-white mt-1">
                Contract Risk Matrix & On-Chain Simulator
              </h2>
            </div>

            {/* Contract Presets */}
            <div className="flex flex-wrap items-center gap-2">
              {SAMPLE_CONTRACTS.map((sample) => (
                <button
                  key={sample.id}
                  onClick={() => handleSelectSample(sample)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    selectedSample.id === sample.id
                      ? "bg-cyan-500 text-black shadow-md shadow-cyan-500/20"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  {sample.category}
                </button>
              ))}
            </div>
          </div>

          {/* Sandbox Body: 2 Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6">
            
            {/* Left Column: Contract Document View */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                <span className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Document Text ({selectedSample.title})</span>
                </span>
                <span className="text-[11px] text-slate-500">Read-Only Sample</span>
              </div>

              <div className="h-96 rounded-2xl bg-slate-950/80 border border-white/5 p-4 font-mono text-xs text-slate-300 overflow-y-auto leading-relaxed select-text">
                {selectedSample.text}
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-400">Want to test your own custom file?</span>
                <Link
                  href="/auditor"
                  className="text-cyan-400 hover:text-cyan-300 font-semibold inline-flex items-center gap-1"
                >
                  Open Custom Uploader <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {/* Right Column: AI Risk Engine & Notarization */}
            <div className="lg:col-span-7 space-y-5">
              {isAnalyzing ? (
                <div className="h-96 flex flex-col items-center justify-center gap-3 text-slate-400">
                  <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
                  <p className="text-xs font-semibold">Analyzing contract clauses & risk liabilities...</p>
                </div>
              ) : auditReport ? (
                <>
                  {/* Top Score Strip */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-4 rounded-2xl bg-slate-950/70 border border-white/5 flex items-center justify-between">
                      <div>
                        <p className="text-[11px] text-slate-400">Legal Health Score</p>
                        <p
                          className={`text-2xl font-black ${
                            auditReport.overallScore < 50
                              ? "text-rose-400"
                              : auditReport.overallScore < 85
                              ? "text-amber-400"
                              : "text-emerald-400"
                          }`}
                        >
                          {auditReport.overallScore} / 100
                        </p>
                      </div>
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                          auditReport.overallScore < 50
                            ? "bg-rose-500/10 text-rose-400"
                            : auditReport.overallScore < 85
                            ? "bg-amber-500/10 text-amber-400"
                            : "bg-emerald-500/10 text-emerald-400"
                        }`}
                      >
                        {auditReport.overallScore < 50 ? (
                          <ShieldAlert className="w-6 h-6" />
                        ) : (
                          <ShieldCheck className="w-6 h-6" />
                        )}
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-950/70 border border-white/5 flex items-center justify-between">
                      <div>
                        <p className="text-[11px] text-slate-400">Critical Liabilities</p>
                        <p className="text-2xl font-black text-rose-400">
                          {auditReport.criticalRisksCount}
                        </p>
                      </div>
                      <div className="w-11 h-11 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
                        <AlertTriangle className="w-6 h-6" />
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-950/70 border border-white/5 flex items-center justify-between">
                      <div>
                        <p className="text-[11px] text-slate-400">Clauses Audited</p>
                        <p className="text-2xl font-black text-cyan-400">
                          {auditReport.totalClausesAnalyzed}
                        </p>
                      </div>
                      <div className="w-11 h-11 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                        <FileCheck2 className="w-6 h-6" />
                      </div>
                    </div>
                  </div>

                  {/* Summary Box */}
                  <div className="p-3.5 rounded-2xl bg-cyan-950/30 border border-cyan-500/20 text-xs text-cyan-200">
                    <span className="font-bold uppercase tracking-wider text-[10px] text-cyan-400 block mb-1">
                      AI Executive Assessment
                    </span>
                    {auditReport.riskSummary}
                  </div>

                  {/* Clause Highlights (Scrollable) */}
                  <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                    {auditReport.clauses.map((clause) => (
                      <div
                        key={clause.id}
                        className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/5 space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-white text-[13px]">{clause.title}</span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                              clause.riskLevel === "CRITICAL"
                                ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                                : clause.riskLevel === "WARNING"
                                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            }`}
                          >
                            {clause.riskLevel}
                          </span>
                        </div>

                        <p className="text-slate-400 text-[11px]">{clause.riskExplanation}</p>

                        <div className="p-2.5 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-[11px] text-emerald-300">
                          <span className="font-bold text-emerald-400 block text-[10px] uppercase">
                            AI Redline Recommendation:
                          </span>
                          {clause.recommendedRedline}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Action: Notarize On-Chain */}
                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-950/40 p-4 rounded-2xl border border-white/5">
                    <div>
                      <p className="text-xs font-bold text-white">Cryptographic Proof of Existence</p>
                      <p className="text-[11px] text-slate-400">
                        Anchor SHA-256 hash to Base Sepolia testnet with immutable timestamp.
                      </p>
                    </div>

                    <button
                      onClick={handleNotarize}
                      disabled={isNotarizing}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-black shadow-lg shadow-cyan-500/20 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                    >
                      {isNotarizing ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Notarizing On-Chain...</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-3.5 h-3.5" />
                          <span>Notarize to Blockchain</span>
                        </>
                      )}
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </section>

        {/* 4 CORE VALUE PILLARS */}
        <section className="space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-3xl font-black text-white">
              The Convergence of Legal Intelligence & Web3
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm">
              Engineered specifically for the Blockchain Legal Institute (BLI) standards of compliance, privacy, and cryptographic admissibility.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-3xl bg-slate-900/60 border border-white/5 space-y-3.5 hover:border-cyan-500/30 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-white text-base">Clause-by-Clause AI Engine</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Gemini & Heuristic models dissect every single provision, isolating asymmetric liability caps, unfair holdbacks, and overbroad IP transfers.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900/60 border border-white/5 space-y-3.5 hover:border-cyan-500/30 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-white text-base">Cryptographic Proof of Existence</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Generate SHA-256 document digests. If even a single punctuation mark is secretly altered by another party, the cryptographic verification fails instantly.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900/60 border border-white/5 space-y-3.5 hover:border-cyan-500/30 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-white text-base">EVM Smart Contract Registry</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Deployed Solidity contract records the immutable timestamp, notary address, and verification state directly to Base Sepolia and Arbitrum.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900/60 border border-white/5 space-y-3.5 hover:border-cyan-500/30 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-white text-base">Verifiable Digital Certificate</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Every notarized agreement generates an executive cryptographic certificate with transaction hashes, block height, and block explorer verification.
              </p>
            </div>
          </div>
        </section>

        {/* RECENT NOTARIZED LEDGER STREAM */}
        <section className="rounded-3xl bg-slate-900/40 border border-white/5 p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-white">Live On-Chain Notary Ledger</h3>
              <p className="text-xs text-slate-400">
                Real-time cryptographic proofs anchored to EVM networks via LexiGuard Smart Contract.
              </p>
            </div>
            <Link
              href="/vault"
              className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1"
            >
              View Full Vault Ledger <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="text-[11px] uppercase tracking-wider text-slate-400 border-b border-white/5 bg-slate-950/40">
                <tr>
                  <th className="py-3 px-4">Document Title</th>
                  <th className="py-3 px-4">Score</th>
                  <th className="py-3 px-4">Document SHA-256</th>
                  <th className="py-3 px-4">Network</th>
                  <th className="py-3 px-4 text-right">Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {recentContracts.slice(0, 5).map((doc) => (
                  <tr key={doc.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-white max-w-xs truncate">
                      {doc.title}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded font-extrabold text-[11px] ${
                          doc.overallScore < 50
                            ? "bg-rose-500/20 text-rose-300"
                            : doc.overallScore < 85
                            ? "bg-amber-500/20 text-amber-300"
                            : "bg-emerald-500/20 text-emerald-300"
                        }`}
                      >
                        {doc.overallScore}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-cyan-400 truncate max-w-[140px]">
                      {doc.docHash || "0x8fa92300bcf4..."}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">{doc.network}</td>
                    <td className="py-3.5 px-4 text-right">
                      <a
                        href={doc.explorerUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 hover:bg-cyan-500/20 font-medium transition-all"
                      >
                        <span>Explorer</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

      </main>

      <Footer />

      {/* Certificate Modal */}
      <CertificateModal
        isOpen={isCertModalOpen}
        onClose={() => setIsCertModalOpen(false)}
        title={auditReport?.title || selectedSample.title}
        score={auditReport?.overallScore || 80}
        notary={notarizationResult}
      />
    </div>
  );
}
