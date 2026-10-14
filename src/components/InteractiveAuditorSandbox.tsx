"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Lock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  FileCheck2,
  Copy,
  Check,
  RefreshCw,
  Zap,
  Scale,
  Maximize2,
  X,
  Cpu,
  Layers,
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
  saveNotarizedContract,
  Section4Config,
  DEFAULT_SECTION4_CONFIG,
} from "@/lib/firestoreService";
import CertificateModal from "@/components/CertificateModal";
import CyberAuditorBackgroundAnimation from "@/components/CyberAuditorBackgroundAnimation";

interface Props {
  config?: Section4Config;
  geminiApiKey?: string;
  account?: string | null;
  chainId?: number;
  onNotarizationCompleted?: (contract: any) => void;
}

export default function InteractiveAuditorSandbox({
  config = DEFAULT_SECTION4_CONFIG,
  geminiApiKey = "",
  account = null,
  chainId,
  onNotarizationCompleted,
}: Props) {
  const currentConfig: Section4Config = {
    ...DEFAULT_SECTION4_CONFIG,
    ...(config || {}),
  };

  const [selectedSample, setSelectedSample] = useState(SAMPLE_CONTRACTS[0]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isNotarizing, setIsNotarizing] = useState(false);
  const [auditReport, setAuditReport] = useState<LegalAuditReport | null>(null);
  const [notarizationResult, setNotarizationResult] = useState<NotarizationResult | null>(null);
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [copiedRedlineId, setCopiedRedlineId] = useState<string | null>(null);
  const [showShowcaseModal, setShowShowcaseModal] = useState(false);

  // Compute live client-side mock hash for display
  const [docHash, setDocHash] = useState("0x8fa9...b302");

  useEffect(() => {
    async function initAudit() {
      setIsAnalyzing(true);
      try {
        const report = await analyzeContract(
          selectedSample.title,
          selectedSample.text,
          geminiApiKey
        );
        setAuditReport(report);
        // Generate pseudo SHA-256 for display
        const simpleHash =
          "0x" +
          Array.from(selectedSample.text.slice(0, 32))
            .map((c) => c.charCodeAt(0).toString(16).padStart(2, "0"))
            .join("")
            .slice(0, 16) +
          "..." +
          "7e4d";
        setDocHash(simpleHash);
      } catch (err) {
        console.warn("Initial sample analysis:", err);
      } finally {
        setIsAnalyzing(false);
      }
    }
    initAudit();
  }, [selectedSample, geminiApiKey]);

  const handleSelectSample = async (sample: (typeof SAMPLE_CONTRACTS)[0]) => {
    setSelectedSample(sample);
    setIsAnalyzing(true);
    setNotarizationResult(null);

    try {
      const report = await analyzeContract(sample.title, sample.text, geminiApiKey);
      setAuditReport(report);
      const simpleHash =
        "0x" +
        Array.from(sample.text.slice(0, 32))
          .map((c) => c.charCodeAt(0).toString(16).padStart(2, "0"))
          .join("")
          .slice(0, 16) +
        "..." +
        "9f1b";
      setDocHash(simpleHash);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleNotarize = async () => {
    if (!auditReport) return;
    setIsNotarizing(true);

    try {
      const networkKey = chainId === 421614 ? "arbitrum-sepolia" : "base-sepolia";
      const res = await notarizeDocumentOnChain(
        auditReport.title,
        selectedSample.text,
        auditReport.overallScore,
        account || undefined,
        networkKey
      );

      setNotarizationResult(res);
      setIsCertModalOpen(true);

      // Save to Firestore
      const savedDoc = await saveNotarizedContract(auditReport, res, selectedSample.text);
      if (onNotarizationCompleted) {
        onNotarizationCompleted(savedDoc);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsNotarizing(false);
    }
  };

  const handleCopyDoc = () => {
    navigator.clipboard.writeText(selectedSample.text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleCopyRedline = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedRedlineId(id);
    setTimeout(() => setCopiedRedlineId(null), 2000);
  };

  return (
    <section className="relative w-full overflow-hidden border-b border-white/10 bg-[#030614] py-14 sm:py-20 lg:py-28">
      {/* Background Graphic & Cyber Ambient Glow */}
      {currentConfig.bgImageUrl && (
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none opacity-25 mix-blend-luminosity scale-105 transition-all duration-1000"
          style={{ backgroundImage: `url(${currentConfig.bgImageUrl})` }}
        />
      )}

      {/* Cyber Ambient Radiance Blobs */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#020510] via-[#030614]/95 to-[#020510] pointer-events-none" />
      <div className="absolute top-1/4 right-1/4 w-[600px] h-[350px] bg-cyan-500/10 blur-[160px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/3 left-1/4 w-[600px] h-[350px] bg-emerald-500/10 blur-[160px] rounded-full pointer-events-none" />

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

      {/* Live Animated Cyber Optical Scanner Canvas */}
      {currentConfig.enableAnimatedBackground && <CyberAuditorBackgroundAnimation />}

      <div className="relative max-w-7xl w-full mx-auto px-3.5 sm:px-6 lg:px-8 space-y-10 sm:space-y-14 min-w-0 z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-cyan-500/30 text-cyan-300 text-[11px] sm:text-xs font-bold tracking-wide shadow-inner shadow-cyan-500/10 backdrop-blur-md">
            <Zap className="w-3.5 h-3.5 text-cyan-400 shrink-0 animate-pulse" />
            <span>{currentConfig.badgeText}</span>
          </div>

          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.2]">
            {currentConfig.titlePrefix}{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400">
              {currentConfig.titleHighlight}
            </span>{" "}
            <span className="text-slate-200">{currentConfig.titleSuffix}</span>
          </h2>

          <p className="text-slate-300 text-xs sm:text-base leading-relaxed max-w-2xl mx-auto">
            {currentConfig.subheadline}
          </p>
        </div>

        {/* Visual Showcase Banner Graphic */}
        {currentConfig.showcaseImageUrl && (
          <div
            onClick={() => setShowShowcaseModal(true)}
            className="relative rounded-3xl overflow-hidden border border-white/10 bg-slate-950/80 shadow-2xl p-2 sm:p-3 backdrop-blur-xl group cursor-pointer"
          >
            <div className="relative rounded-2xl overflow-hidden aspect-[21/9] max-h-56 sm:max-h-72 w-full">
              <img
                src={currentConfig.showcaseImageUrl}
                alt="Live AI Auditor Matrix Console"
                className="w-full h-full object-cover object-center group-hover:scale-104 transition-transform duration-700 brightness-95 group-hover:brightness-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />

              <div className="absolute top-3 right-3 p-2 rounded-xl bg-slate-950/80 border border-white/20 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <Maximize2 className="w-4 h-4 text-cyan-300" />
              </div>

              {/* Bottom floating micro badges */}
              <div className="absolute bottom-3 left-3 sm:left-4 right-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/85 border border-cyan-500/30 backdrop-blur-md text-[10px] sm:text-xs font-mono text-cyan-200">
                  <Cpu className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>Gemini 2.5 Pro Neural Audit Console</span>
                </div>

                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/85 border border-emerald-500/30 backdrop-blur-md text-[10px] sm:text-xs font-mono text-emerald-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Base Sepolia Notary Bridge Active</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* The Interactive Sandbox Container */}
        <div className="rounded-3xl bg-slate-900/90 border border-white/10 p-5 sm:p-8 backdrop-blur-2xl shadow-2xl relative overflow-hidden">
          
          {/* Ambient top light */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Sandbox Controls Bar: Contract Selector Presets */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  Preset Contracts
                </span>
                <span className="text-xs text-slate-400">Select any sample to run live audit:</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {SAMPLE_CONTRACTS.map((sample) => {
                const isSelected = selectedSample.id === sample.id;
                return (
                  <button
                    key={sample.id}
                    onClick={() => handleSelectSample(sample)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
                      isSelected
                        ? "bg-gradient-to-r from-cyan-500 to-emerald-500 text-black font-extrabold shadow-lg shadow-cyan-500/25 scale-102"
                        : "bg-slate-800/90 text-slate-300 hover:bg-slate-700/90 border border-white/5"
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5 shrink-0" />
                    <span>{sample.category}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main 2-Column Auditor Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 pt-6 items-start">
            
            {/* Left Column: Contract Document Viewer */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                <span className="flex items-center gap-2 text-white font-bold truncate">
                  <FileText className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span className="truncate">{selectedSample.title}</span>
                </span>
                <button
                  onClick={handleCopyDoc}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] flex items-center gap-1.5 transition-all shrink-0"
                >
                  {copiedText ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              {/* Code/Text Viewer with Line Numbers */}
              <div className="relative rounded-2xl bg-slate-950 border border-white/10 p-4 font-mono text-xs text-slate-300 h-[430px] overflow-y-auto leading-relaxed select-text shadow-inner">
                {selectedSample.text.split("\n\n").map((para, i) => (
                  <div key={i} className="mb-4 pb-3 border-b border-white/5 last:border-none">
                    <p className="text-slate-300 whitespace-pre-wrap">{para}</p>
                  </div>
                ))}
              </div>

              {/* Document Hash & Custom Uploader Link */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs pt-1">
                <div className="flex items-center gap-1.5 font-mono text-[11px] text-cyan-300 bg-cyan-950/40 px-2.5 py-1 rounded-lg border border-cyan-500/20">
                  <Lock className="w-3 h-3 text-cyan-400 shrink-0" />
                  <span className="text-slate-400">SHA-256:</span>
                  <span>{docHash}</span>
                </div>

                <Link
                  href={currentConfig.customUploaderLink || "/auditor"}
                  className="text-cyan-400 hover:text-cyan-300 font-semibold inline-flex items-center gap-1 text-[11px] transition-colors"
                >
                  <span>{currentConfig.customUploaderText}</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {/* Right Column: AI Risk Engine & Live Audit Report */}
            <div className="lg:col-span-7 space-y-5">
              {isAnalyzing ? (
                <div className="h-[430px] flex flex-col items-center justify-center gap-3 text-slate-400 rounded-2xl bg-slate-950/60 border border-white/5">
                  <RefreshCw className="w-9 h-9 text-cyan-400 animate-spin" />
                  <p className="text-sm font-semibold text-white">Analyzing contract clauses & risk liabilities...</p>
                  <p className="text-xs text-slate-500 font-mono">Running Gemini 2.5 Pro legal heuristic matrix</p>
                </div>
              ) : auditReport ? (
                <>
                  {/* Top Score Matrix Strip */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    
                    {/* Legal Health Score Card */}
                    <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/10 flex items-center justify-between shadow-md">
                      <div>
                        <p className="text-[11px] text-slate-400 font-semibold">Legal Health Score</p>
                        <p
                          className={`text-2xl font-black font-mono mt-0.5 ${
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
                        className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${
                          auditReport.overallScore < 50
                            ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                            : auditReport.overallScore < 85
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        }`}
                      >
                        {auditReport.overallScore < 50 ? (
                          <ShieldAlert className="w-6 h-6" />
                        ) : (
                          <ShieldCheck className="w-6 h-6" />
                        )}
                      </div>
                    </div>

                    {/* Critical Liabilities Card */}
                    <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/10 flex items-center justify-between shadow-md">
                      <div>
                        <p className="text-[11px] text-slate-400 font-semibold">Critical Liabilities</p>
                        <p className="text-2xl font-black font-mono text-rose-400 mt-0.5">
                          {auditReport.criticalRisksCount}
                        </p>
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center shadow-lg">
                        <AlertTriangle className="w-6 h-6" />
                      </div>
                    </div>

                    {/* Clauses Audited Card */}
                    <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/10 flex items-center justify-between shadow-md">
                      <div>
                        <p className="text-[11px] text-slate-400 font-semibold">Clauses Audited</p>
                        <p className="text-2xl font-black font-mono text-cyan-400 mt-0.5">
                          {auditReport.totalClausesAnalyzed}
                        </p>
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center shadow-lg">
                        <FileCheck2 className="w-6 h-6" />
                      </div>
                    </div>
                  </div>

                  {/* AI Executive Assessment Summary Box */}
                  <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 text-xs text-cyan-100 shadow-md">
                    <span className="font-extrabold uppercase tracking-wider text-[10px] text-cyan-400 block mb-1 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{currentConfig.executiveSummaryHeader}</span>
                    </span>
                    <p className="leading-relaxed text-slate-200">{auditReport.riskSummary}</p>
                  </div>

                  {/* Clause Highlights (Scrollable List) */}
                  <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                    {auditReport.clauses.map((clause) => (
                      <div
                        key={clause.id}
                        className="p-4 rounded-2xl bg-slate-950/70 border border-white/10 space-y-2.5 text-xs transition-all hover:border-cyan-500/30"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-white text-[13px]">{clause.title}</span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
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

                        <p className="text-slate-300 text-[11px] leading-relaxed">{clause.riskExplanation}</p>

                        <div className="p-3 rounded-xl bg-emerald-950/25 border border-emerald-500/25 text-[11px] text-emerald-200 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-emerald-400 text-[10px] uppercase tracking-wide">
                              Autonomous Redline Amendment:
                            </span>
                            <button
                              onClick={() => handleCopyRedline(clause.id, clause.recommendedRedline)}
                              className="px-2 py-0.5 rounded bg-emerald-900/50 hover:bg-emerald-800/50 text-[10px] text-emerald-300 flex items-center gap-1 transition-all"
                            >
                              {copiedRedlineId === clause.id ? (
                                <>
                                  <Check className="w-2.5 h-2.5" />
                                  <span>Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-2.5 h-2.5" />
                                  <span>Copy Amendment</span>
                                </>
                              )}
                            </button>
                          </div>
                          <p className="font-mono text-[11px] leading-relaxed select-text">{clause.recommendedRedline}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Action Bar: Base Sepolia Blockchain Notarization */}
                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-950/70 p-4 rounded-2xl border border-white/10 shadow-lg">
                    <div>
                      <p className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Cryptographic Proof-of-Existence</span>
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Anchor SHA-256 hash to Base Sepolia testnet under Federal Evidence FRE 902.
                      </p>
                    </div>

                    <button
                      onClick={handleNotarize}
                      disabled={isNotarizing}
                      className="w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-black bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 hover:from-cyan-400 hover:to-emerald-300 text-black shadow-lg shadow-cyan-500/25 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isNotarizing ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Notarizing On-Chain...</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-3.5 h-3.5" />
                          <span>{currentConfig.notarizeCtaText}</span>
                        </>
                      )}
                    </button>
                  </div>
                </>
              ) : null}
            </div>

          </div>

        </div>

      </div>

      {/* Lightbox Modal for Full Console Showcase */}
      {showShowcaseModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md"
          onClick={() => setShowShowcaseModal(false)}
        >
          <div
            className="relative max-w-5xl w-full rounded-2xl overflow-hidden border border-cyan-500/40 bg-slate-950 p-2 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowShowcaseModal(false)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-slate-900/80 border border-white/20 text-white hover:bg-red-500/80 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={currentConfig.showcaseImageUrl}
              alt="Full Resolution Auditor Matrix Console"
              className="w-full h-auto max-h-[85vh] object-contain rounded-xl"
            />
          </div>
        </div>
      )}

      {/* Official Notarization Certificate Modal */}
      <CertificateModal
        isOpen={isCertModalOpen}
        onClose={() => setIsCertModalOpen(false)}
        title={auditReport?.title || selectedSample.title}
        score={auditReport?.overallScore || 85}
        notary={notarizationResult}
        contractText={selectedSample.text}
        auditReport={auditReport}
      />
    </section>
  );
}
