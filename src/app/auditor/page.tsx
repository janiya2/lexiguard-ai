"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CertificateModal from "@/components/CertificateModal";
import {
  FileText,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Lock,
  RefreshCw,
  Send,
  MessageSquare,
  Upload,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Filter,
} from "lucide-react";
import {
  SAMPLE_CONTRACTS,
  analyzeContract,
  LegalAuditReport,
  ClauseAnalysis,
} from "@/lib/aiLegalAuditor";
import { notarizeDocumentOnChain, NotarizationResult } from "@/lib/web3Service";
import {
  getSiteSettings,
  saveNotarizedContract,
  SiteSettings,
  DEFAULT_SITE_SETTINGS,
} from "@/lib/firestoreService";
import { useWeb3 } from "@/context/Web3Context";

export default function AuditorPage() {
  const { account, chainId } = useWeb3();
  const [contractTitle, setContractTitle] = useState("Custom Legal Contract");
  const [contractText, setContractText] = useState(SAMPLE_CONTRACTS[0].text);
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditReport, setAuditReport] = useState<LegalAuditReport | null>(null);
  const [filterLevel, setFilterLevel] = useState<string>("ALL");
  const [isNotarizing, setIsNotarizing] = useState(false);
  const [notarizationResult, setNotarizationResult] = useState<NotarizationResult | null>(null);
  const [isCertOpen, setIsCertOpen] = useState(false);
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);

  // Chat with contract state
  const [chatMessages, setChatMessages] = useState<Array<{ sender: "user" | "ai"; text: string }>>([
    {
      sender: "ai",
      text: "Hello! I am your LexiGuard Legal Co-Pilot. Ask me anything about this contract (e.g. 'Can they terminate without paying me?', 'What is my liability limit?').",
    },
  ]);
  const [userInput, setUserInput] = useState("");

  useEffect(() => {
    async function init() {
      const s = await getSiteSettings();
      setSettings(s);
      // Run initial audit on load
      const report = await analyzeContract("Predatory Freelancer Agreement", contractText, s.geminiApiKey);
      setAuditReport(report);
    }
    init();
  }, []);

  const handleRunAudit = async () => {
    if (!contractText.trim()) return;
    setIsAuditing(true);
    setNotarizationResult(null);

    const report = await analyzeContract(contractTitle, contractText, settings.geminiApiKey);
    setAuditReport(report);
    setIsAuditing(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setContractTitle(file.name.replace(/\.[^/.]+$/, ""));
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          setContractText(text);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleSendMessage = () => {
    if (!userInput.trim()) return;
    const question = userInput;
    setUserInput("");

    setChatMessages((prev) => [...prev, { sender: "user", text: question }]);

    setTimeout(() => {
      let reply = "Based on the contract terms, ";
      const lower = question.toLowerCase();

      if (lower.includes("terminate") || lower.includes("fire") || lower.includes("cancel")) {
        reply += "Clause 4 permits the client to terminate immediately without notice and explicitly withholds compensation for in-progress milestones. We strongly recommend our redline requiring 14 days notice.";
      } else if (lower.includes("liability") || lower.includes("sue") || lower.includes("indemn")) {
        reply += "Clause 2 imposes unlimited unilateral indemnification upon the contractor. You should negotiate a liability cap tied to fees paid under the invoice.";
      } else if (lower.includes("pay") || lower.includes("money") || lower.includes("holdback") || lower.includes("net")) {
        reply += "Clause 3 specifies Net 90 payment with a 30% holdback for 180 days. This creates severe cashflow vulnerability. Standard terms should be Net 15 upon milestone completion.";
      } else {
        reply += "the agreement presents significant risks in clauses 1, 2, and 3. Ensure you redline the IP assignment and indemnification before signing.";
      }

      setChatMessages((prev) => [...prev, { sender: "ai", text: reply }]);
    }, 600);
  };

  const handleNotarizeOnChain = async () => {
    if (!auditReport) return;
    setIsNotarizing(true);

    try {
      const networkKey = chainId === 421614 ? "arbitrum-sepolia" : "base-sepolia";
      const res = await notarizeDocumentOnChain(
        contractTitle,
        contractText,
        auditReport.overallScore,
        account || undefined,
        networkKey
      );
      setNotarizationResult(res);
      setIsCertOpen(true);

      // Save record in Firestore
      await saveNotarizedContract(auditReport, res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsNotarizing(false);
    }
  };

  const filteredClauses = auditReport?.clauses.filter((c) => {
    if (filterLevel === "ALL") return true;
    return c.riskLevel === filterLevel;
  }) || [];

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 space-y-8">
        
        {/* Workspace Title & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                Auditor Workspace
              </span>
              <span className="text-xs text-slate-400">BLI Legal Standards Enabled</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
              AI Legal Risk Auditor & Redline Studio
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRunAudit}
              disabled={isAuditing}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-black shadow-lg shadow-cyan-500/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              {isAuditing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Auditing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Run Legal Audit</span>
                </>
              )}
            </button>

            <button
              onClick={handleNotarizeOnChain}
              disabled={isNotarizing || !auditReport}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Notarize On-Chain</span>
            </button>
          </div>
        </div>

        {/* 2-Column Split: Document Editor & Audit Results */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left: Document Input & Chat Co-Pilot */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Document Input Box */}
            <div className="rounded-3xl bg-slate-900/60 border border-white/10 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <input
                  type="text"
                  value={contractTitle}
                  onChange={(e) => setContractTitle(e.target.value)}
                  className="bg-transparent font-bold text-sm text-white focus:outline-none border-b border-transparent focus:border-cyan-400 pb-0.5 w-3/4"
                  placeholder="Document Title..."
                />
                <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-white/5 transition-all">
                  <Upload className="w-3 h-3" />
                  <span>Upload .txt</span>
                  <input type="file" accept=".txt,.doc" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>

              <textarea
                value={contractText}
                onChange={(e) => setContractText(e.target.value)}
                rows={14}
                className="w-full rounded-2xl bg-slate-950/80 border border-white/5 p-4 font-mono text-xs text-slate-300 focus:outline-none focus:border-cyan-500/40 resize-none leading-relaxed"
                placeholder="Paste contract text, NDA, SLA, or agreement here..."
              />

              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>{contractText.length} characters</span>
                <span className="flex items-center gap-1 text-slate-400">
                  <Lock className="w-3 h-3 text-cyan-400" /> Client-Side Privacy Hashed
                </span>
              </div>
            </div>

            {/* Interactive Chat Co-Pilot */}
            <div className="rounded-3xl bg-slate-900/60 border border-white/10 p-5 space-y-4 flex flex-col h-[340px]">
              <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                <MessageSquare className="w-4 h-4 text-cyan-400" />
                <span className="font-bold text-xs text-white">Ask Legal AI Co-Pilot</span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
                {chatMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-2xl max-w-[90%] leading-relaxed ${
                      msg.sender === "user"
                        ? "ml-auto bg-cyan-500/20 text-cyan-100 border border-cyan-500/30"
                        : "mr-auto bg-slate-950/80 text-slate-300 border border-white/5"
                    }`}
                  >
                    {msg.text}
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder="Ask a question about this contract..."
                  className="flex-1 rounded-xl bg-slate-950 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none border border-white/5 focus:border-cyan-500/40"
                />
                <button
                  onClick={handleSendMessage}
                  className="p-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

          </div>

          {/* Right: Clause Redlines & Detailed Scoring */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Top Score Overview Card */}
            {auditReport && (
              <div className="p-6 rounded-3xl bg-slate-900/80 border border-white/10 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Overall Compliance Rating
                    </span>
                    <div className="flex items-center gap-3 mt-1">
                      <span
                        className={`text-4xl font-black ${
                          auditReport.overallScore < 50
                            ? "text-rose-400"
                            : auditReport.overallScore < 85
                            ? "text-amber-400"
                            : "text-emerald-400"
                        }`}
                      >
                        {auditReport.overallScore}%
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                          auditReport.overallScore < 50
                            ? "bg-rose-500/10 text-rose-300 border border-rose-500/30"
                            : auditReport.overallScore < 85
                            ? "bg-amber-500/10 text-amber-300 border border-amber-500/30"
                            : "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30"
                        }`}
                      >
                        {auditReport.overallScore < 50
                          ? "High Risk / Predatory"
                          : auditReport.overallScore < 85
                          ? "Moderate Risk"
                          : "Fully Compliant"}
                      </span>
                    </div>
                  </div>

                  {/* Filter Pills */}
                  <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-2xl border border-white/5 text-xs">
                    <button
                      onClick={() => setFilterLevel("ALL")}
                      className={`px-2.5 py-1 rounded-xl font-medium transition-all ${
                        filterLevel === "ALL" ? "bg-slate-800 text-white font-bold" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      All ({auditReport.totalClausesAnalyzed})
                    </button>
                    <button
                      onClick={() => setFilterLevel("CRITICAL")}
                      className={`px-2.5 py-1 rounded-xl font-medium transition-all ${
                        filterLevel === "CRITICAL"
                          ? "bg-rose-500/20 text-rose-300 font-bold"
                          : "text-slate-400 hover:text-rose-300"
                      }`}
                    >
                      Critical ({auditReport.criticalRisksCount})
                    </button>
                    <button
                      onClick={() => setFilterLevel("WARNING")}
                      className={`px-2.5 py-1 rounded-xl font-medium transition-all ${
                        filterLevel === "WARNING"
                          ? "bg-amber-500/20 text-amber-300 font-bold"
                          : "text-slate-400 hover:text-amber-300"
                      }`}
                    >
                      Warnings ({auditReport.warningRisksCount})
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-300 bg-slate-950/60 p-3 rounded-2xl border border-white/5 leading-relaxed">
                  {auditReport.riskSummary}
                </p>
              </div>
            )}

            {/* Clause Breakdown List */}
            <div className="space-y-4">
              <h3 className="font-bold text-sm text-white flex items-center justify-between">
                <span>Clause-by-Clause Legal Redline</span>
                <span className="text-xs text-slate-400 font-normal">
                  Showing {filteredClauses.length} items
                </span>
              </h3>

              {filteredClauses.map((clause) => (
                <div
                  key={clause.id}
                  className="p-5 rounded-3xl bg-slate-900/60 border border-white/5 hover:border-white/10 transition-all space-y-3.5 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-lg bg-slate-800 text-[10px] font-semibold text-slate-300 uppercase">
                        {clause.category}
                      </span>
                      <h4 className="font-bold text-white text-sm">{clause.title}</h4>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
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

                  {/* Original Text */}
                  <div className="p-3 rounded-2xl bg-slate-950/80 border border-white/5 font-mono text-[11px] text-slate-400 leading-relaxed">
                    <span className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Original Clause Text:
                    </span>
                    &quot;{clause.originalText}&quot;
                  </div>

                  {/* Why it's dangerous */}
                  <p className="text-slate-300 text-xs leading-relaxed">
                    <strong className="text-rose-400">Risk Assessment: </strong>
                    {clause.riskExplanation}
                  </p>

                  {/* Recommended Fair Rewrite */}
                  <div className="p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 text-emerald-200 space-y-1">
                    <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      AI Redline Rewrite Recommendation
                    </span>
                    <p className="font-mono text-[11px] text-emerald-300 leading-relaxed">
                      {clause.recommendedRedline}
                    </p>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </main>

      <Footer />

      {/* Certificate Modal */}
      <CertificateModal
        isOpen={isCertOpen}
        onClose={() => setIsCertOpen(false)}
        title={contractTitle}
        score={auditReport?.overallScore || 75}
        notary={notarizationResult}
      />
    </div>
  );
}
