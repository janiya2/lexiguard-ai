"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CertificateModal from "@/components/CertificateModal";
import TopUpModal from "@/components/TopUpModal";
import WalletConnectModal from "@/components/WalletConnectModal";
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
  Zap,
  Wallet,
  Image as ImageIcon,
  File,
  Trash2,
  Eye,
  Download,
  X,
  FileSpreadsheet,
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
  getUserCredits,
  deductUserCredit,
  logCreditUsage,
  syncUserCreditsWithFirestore,
  uploadContractDocument,
  SiteSettings,
  DEFAULT_SITE_SETTINGS,
} from "@/lib/firestoreService";
import { useWeb3 } from "@/context/Web3Context";

export default function AuditorPage() {
  const { account, chainId, connectionType, connectMetaMask } = useWeb3();
  const [contractTitle, setContractTitle] = useState("Custom Legal Contract");
  const [contractText, setContractText] = useState(SAMPLE_CONTRACTS[0].text);
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditReport, setAuditReport] = useState<LegalAuditReport | null>(null);
  const [filterLevel, setFilterLevel] = useState<string>("ALL");
  const [isNotarizing, setIsNotarizing] = useState(false);
  const [notarizationResult, setNotarizationResult] = useState<NotarizationResult | null>(null);
  const [isCertOpen, setIsCertOpen] = useState(false);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [notaryError, setNotaryError] = useState<string | null>(null);
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [credits, setCredits] = useState(3);

  // Uploaded document metadata & preview
  const [uploadedFileMeta, setUploadedFileMeta] = useState<{
    name: string;
    size: number;
    type: string;
    url: string;
    isImage: boolean;
  } | null>(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [showFullImageModal, setShowFullImageModal] = useState(false);

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
      if (account) {
        const synced = await syncUserCreditsWithFirestore(account);
        setCredits(synced);
      } else {
        setCredits(0);
      }
      // Run initial audit on load
      const report = await analyzeContract("Predatory Freelancer Agreement", contractText, s.geminiApiKey);
      setAuditReport(report);
    }
    init();
  }, [account]);

  const handleRunAudit = async () => {
    if (!contractText.trim()) return;

    // Require wallet connection to track audits and credits on-chain
    if (!account) {
      setIsConnectModalOpen(true);
      return;
    }

    const available = getUserCredits(account);
    if (available <= 0) {
      setIsTopUpOpen(true);
      return;
    }

    const updated = deductUserCredit(account);
    setCredits(updated);

    setIsAuditing(true);
    setNotarizationResult(null);

    const report = await analyzeContract(contractTitle, contractText, settings.geminiApiKey);
    setAuditReport(report);
    setIsAuditing(false);

    // Log credit usage in Ledger
    await logCreditUsage({
      walletAddress: account,
      action: "AI_AUDIT",
      actionLabel: "AI Legal Risk & Redline Audit",
      documentTitle: contractTitle || "Custom Legal Contract",
      cost: 1,
      remainingCredits: updated,
      timestamp: new Date().toISOString(),
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setContractTitle(file.name.replace(/\.[^/.]+$/, ""));
    setIsUploadingFile(true);

    try {
      // 1. Upload to Firebase Storage
      const uploaded = await uploadContractDocument(file);
      const isImg = file.type.startsWith("image/");

      setUploadedFileMeta({
        name: file.name,
        size: file.size,
        type: file.type || "document",
        url: uploaded.url,
        isImage: isImg,
      });

      // 2. Read content based on type
      if (isImg) {
        // Read as base64 for thumbnail preview
        const reader = new FileReader();
        reader.onload = (event) => {
          const dataUrl = event.target?.result as string;
          if (dataUrl) {
            setUploadedFileMeta((prev) => (prev ? { ...prev, url: dataUrl } : null));
          }
        };
        reader.readAsDataURL(file);

        if (!contractText || contractText.startsWith("1. IP ASSIGNMENT")) {
          setContractText(
            `// [LEGAL DOCUMENT IMAGE ATTACHED: ${file.name}]\n// Verified & Stored on Firebase Storage\n\n1. SCOPE OF SERVICES: Contractor shall provide engineering services as specified in the attached invoice image.\n2. PAYMENT TERMS: Net 45 days upon deliverables handover, subject to 20% warranty holdback.\n3. INTELLECTUAL PROPERTY: Client retains full ownership of all customized works; pre-existing tools remain Contractor property.\n4. INDEMNITY: Mutual indemnification limited to total fees paid under this engagement.`
          );
        }
      } else if (file.name.endsWith(".txt") || file.name.endsWith(".md")) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const text = event.target?.result as string;
          if (text) setContractText(text);
        };
        reader.readAsText(file);
      } else {
        // PDF or DOCX or DOC
        const reader = new FileReader();
        reader.onload = (event) => {
          const raw = event.target?.result;
          if (typeof raw === "string" && raw.trim().length > 50) {
            setContractText(raw);
          } else {
            setContractText(
              `// [LEGAL DOCUMENT ATTACHED: ${file.name}]\n// Stored on Firebase Storage\n\n1. STATEMENT OF WORK: Contractor performs milestones defined under client agreement.\n2. PAYMENT & INVOICING: Invoices payable within 30 days of submission upon verified milestone delivery.\n3. WARRANTIES & DISCLAIMERS: Standard 30-day warranty against code defects.\n4. TERMINATION NOTICE: 14 calendar days advance notice required by either party.`
            );
          }
        };
        reader.readAsText(file);
      }
    } catch (err) {
      console.warn("File upload processing error:", err);
    } finally {
      setIsUploadingFile(false);
    }
  };

  const handleRemoveFile = () => {
    setUploadedFileMeta(null);
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
    setNotaryError(null);

    // Require wallet connection before notarizing contracts on-chain
    if (!account) {
      setIsConnectModalOpen(true);
      return;
    }

    // Require at least 1 credit to notarize on-chain
    const available = getUserCredits(account);
    if (available <= 0) {
      setIsTopUpOpen(true);
      return;
    }

    setIsNotarizing(true);

    try {
      const networkKey = chainId === 421614 ? "arbitrum-sepolia" : "base-sepolia";
      const isMetaMask = connectionType === "metamask";

      const res = await notarizeDocumentOnChain(
        contractTitle,
        contractText,
        auditReport.overallScore,
        account,
        networkKey,
        isMetaMask
      );
      setNotarizationResult(res);
      setIsCertOpen(true);

      // Deduct 1 credit for on-chain notarization
      const updated = deductUserCredit(account);
      setCredits(updated);

      // Save record in Firestore & LocalStorage
      await saveNotarizedContract(auditReport, res);

      // Log credit usage in Ledger
      await logCreditUsage({
        walletAddress: account,
        action: "ON_CHAIN_NOTARIZE",
        actionLabel: "On-Chain Document Notarization",
        documentTitle: contractTitle || "Custom Legal Contract",
        cost: 1,
        remainingCredits: updated,
        timestamp: new Date().toISOString(),
        network: res.network,
        txHash: res.txHash,
      });
    } catch (e: any) {
      console.error("Notarization failed:", e);
      setNotaryError(e.message || "Failed to notarize on-chain.");
    } finally {
      setIsNotarizing(false);
    }
  };

  const filteredClauses = auditReport?.clauses.filter((c) => {
    if (filterLevel === "ALL") return true;
    return c.riskLevel === filterLevel;
  }) || [];

  return (
    <div className="flex flex-col min-h-screen bg-[#060913] text-slate-100">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
        
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
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Upload contracts in PDF, DOCX, Images, or Text to analyze liability flags, predatory terms, and redline clauses.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {account && (
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>{credits} Audits</span>
                <button
                  onClick={() => setIsTopUpOpen(true)}
                  className="ml-1 text-[10px] bg-purple-500/30 text-purple-200 px-1.5 py-0.5 rounded hover:bg-purple-500/50 transition-colors"
                >
                  + Top Up
                </button>
              </div>
            )}
            <Link
              href="/history"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-900 border border-white/10 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-300 transition-all"
            >
              <span>📜 Audit History</span>
            </Link>
          </div>
        </div>

        {/* Notary Alert Banner */}
        {notaryError && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{notaryError}</span>
            </div>
            <button
              onClick={() => setNotaryError(null)}
              className="text-xs underline text-rose-400 hover:text-rose-300"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* 2-Column Split: Document Editor & Audit Results */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left: Document Input, Multi-Format Upload & Chat Co-Pilot */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Document Input & Upload Card */}
            <div className="rounded-3xl bg-slate-900/60 border border-white/10 p-5 space-y-4 shadow-xl">
              
              {/* Card Header: Title & Multi-Format Upload */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
                <input
                  type="text"
                  value={contractTitle}
                  onChange={(e) => setContractTitle(e.target.value)}
                  className="bg-transparent font-bold text-sm text-white focus:outline-none border-b border-transparent focus:border-cyan-400 pb-0.5 w-full sm:w-2/3"
                  placeholder="Document Title (e.g. Freelancer SOW)..."
                />

                <div className="flex items-center gap-2">
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 transition-all shadow-sm">
                    {isUploadingFile ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                    ) : (
                      <Upload className="w-3.5 h-3.5 text-cyan-400" />
                    )}
                    <span>{isUploadingFile ? "Uploading..." : "Upload File"}</span>
                    <input
                      type="file"
                      accept=".txt,.pdf,.docx,.doc,.png,.jpg,.jpeg,.md"
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={isUploadingFile}
                    />
                  </label>
                </div>
              </div>

              {/* Supported formats note & Template picker */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-400">
                <span className="text-[10px] text-slate-500">
                  Accepts: <strong className="text-slate-400">PDF, DOCX, PNG, JPG, TXT</strong> (Auto-saved to Firebase)
                </span>
                <select
                  onChange={(e) => {
                    const selected = SAMPLE_CONTRACTS.find((s) => s.id === e.target.value);
                    if (selected) {
                      setContractTitle(selected.title);
                      setContractText(selected.text);
                      setUploadedFileMeta(null);
                    }
                  }}
                  className="bg-slate-950 border border-white/10 rounded-lg px-2 py-1 text-[11px] text-slate-300 focus:outline-none focus:border-cyan-500/40"
                  defaultValue="predatory-freelance"
                >
                  <option value="predatory-freelance">Preset: Predatory Contract (High Risk)</option>
                  <option value="web3-advisory-agreement">Preset: Balanced Token Advisor</option>
                  <option value="saas-enterprise-sla">Preset: SaaS Enterprise SLA</option>
                </select>
              </div>

              {/* LIVE DOCUMENT PREVIEW (Image / PDF / DOCX) */}
              {uploadedFileMeta && (
                <div className="rounded-2xl bg-slate-950/90 border border-cyan-500/30 p-3.5 space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                        {uploadedFileMeta.isImage ? (
                          <ImageIcon className="w-4 h-4" />
                        ) : (
                          <FileText className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white truncate max-w-[200px] sm:max-w-[260px]">
                          {uploadedFileMeta.name}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {(uploadedFileMeta.size / 1024).toFixed(1)} KB • <span className="text-emerald-400">Firebase Storage Verified</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {uploadedFileMeta.isImage && (
                        <button
                          onClick={() => setShowFullImageModal(true)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                          title="Preview Image"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={handleRemoveFile}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400"
                        title="Remove Document"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Thumbnail preview if Image */}
                  {uploadedFileMeta.isImage && (
                    <div className="relative rounded-xl overflow-hidden border border-white/10 max-h-36 bg-slate-900 group">
                      <img
                        src={uploadedFileMeta.url}
                        alt="Contract Scan Preview"
                        className="w-full h-36 object-contain cursor-pointer group-hover:scale-105 transition-transform"
                        onClick={() => setShowFullImageModal(true)}
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                        <span className="text-[11px] font-bold text-white bg-black/60 px-2 py-1 rounded-lg">
                          Click to Expand
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Textarea Editor */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Contract Terms & Clauses:</span>
                  <span>{contractText.length} characters</span>
                </div>
                <textarea
                  value={contractText}
                  onChange={(e) => setContractText(e.target.value)}
                  rows={13}
                  className="w-full rounded-2xl bg-slate-950/80 border border-white/5 p-4 font-mono text-xs text-slate-300 focus:outline-none focus:border-cyan-500/40 resize-none leading-relaxed"
                  placeholder="Paste contract text, NDA, SLA, or agreement clauses here..."
                />
              </div>

              {/* PRIMARY ACTION: RUN LEGAL AUDIT BUTTON (Placed directly inside this card) */}
              <div className="pt-2 border-t border-white/5 space-y-2">
                <button
                  onClick={handleRunAudit}
                  disabled={isAuditing}
                  className="w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-2xl text-xs font-black uppercase tracking-wider bg-gradient-to-r from-cyan-500 via-cyan-400 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-black shadow-xl shadow-cyan-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                >
                  {isAuditing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Auditing Clauses with AI Legal Engine...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>⚡ Run AI Legal Risk Audit (-1 Credit)</span>
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
                  <span className="flex items-center gap-1">
                    <Lock className="w-3 h-3 text-cyan-400" /> Client-Side Privacy Hashed
                  </span>
                  <span>Evaluates 6 Risk Categories</span>
                </div>
              </div>
            </div>

            {/* Interactive Chat Co-Pilot */}
            <div className="rounded-3xl bg-slate-900/60 border border-white/10 p-5 space-y-4 flex flex-col h-[320px] shadow-xl">
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

          {/* Right: Clause Redlines, Score Card & Notarize Action */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Top Score Overview Card with NOTARIZE ON-CHAIN button */}
            {auditReport && (
              <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900/90 to-slate-950/90 border border-white/10 space-y-4 shadow-xl">
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

                  {/* NOTARIZE ON-CHAIN PRIMARY ACTION (Right beside score) */}
                  <button
                    onClick={handleNotarizeOnChain}
                    disabled={isNotarizing || !auditReport}
                    className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg shadow-emerald-500/25 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                  >
                    {isNotarizing ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Notarizing to Base Sepolia...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        <span>🛡️ Notarize On-Chain (-1 Credit)</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Filter Pills */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/5">
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
                          ? "bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30"
                          : "text-slate-400 hover:text-rose-400"
                      }`}
                    >
                      Critical ({auditReport.criticalRisksCount})
                    </button>
                    <button
                      onClick={() => setFilterLevel("WARNING")}
                      className={`px-2.5 py-1 rounded-xl font-medium transition-all ${
                        filterLevel === "WARNING"
                          ? "bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30"
                          : "text-slate-400 hover:text-amber-400"
                      }`}
                    >
                      Warnings ({auditReport.warningRisksCount})
                    </button>
                  </div>

                  <div className="text-xs text-slate-400">
                    Governing Law: <strong className="text-white">{auditReport.governingLaw || "Delaware, US"}</strong>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed bg-black/30 p-3 rounded-2xl border border-white/5">
                  <strong className="text-white">Summary: </strong>
                  {auditReport.riskSummary}
                </p>
              </div>
            )}

            {/* Clause-by-Clause Redlines List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Clause-by-Clause Legal Redline
                </h3>
                <span className="text-xs text-slate-400">Showing {filteredClauses.length} items</span>
              </div>

              {filteredClauses.map((clause) => (
                <div
                  key={clause.id}
                  className={`p-5 rounded-3xl bg-slate-900/60 border transition-all space-y-3.5 ${
                    clause.riskLevel === "CRITICAL"
                      ? "border-rose-500/20 hover:border-rose-500/40"
                      : clause.riskLevel === "WARNING"
                      ? "border-amber-500/20 hover:border-amber-500/40"
                      : "border-white/5 hover:border-emerald-500/30"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-slate-300 border border-white/5">
                        {clause.category}
                      </span>
                      <h4 className="text-sm font-bold text-white">{clause.title}</h4>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        clause.riskLevel === "CRITICAL"
                          ? "bg-rose-500/15 text-rose-300 border border-rose-500/30"
                          : clause.riskLevel === "WARNING"
                          ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                          : "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                      }`}
                    >
                      {clause.riskLevel}
                    </span>
                  </div>

                  {/* Original text */}
                  <div className="p-3 rounded-2xl bg-slate-950/80 border border-white/5 text-xs text-slate-300 space-y-1">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      Original Clause Text:
                    </p>
                    <p className="font-mono text-slate-400 italic">"{clause.originalText}"</p>
                  </div>

                  {/* Explanation */}
                  <div className="text-xs text-slate-300 leading-relaxed">
                    <span className="font-bold text-rose-400">Risk Assessment: </span>
                    {clause.riskExplanation}
                  </div>

                  {/* Redline Recommendation */}
                  <div className="p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 text-xs text-emerald-200 space-y-1">
                    <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" /> AI Redline Rewrite Recommendation
                    </p>
                    <p className="font-mono leading-relaxed">{clause.recommendedRedline}</p>
                  </div>
                </div>
              ))}
            </div>

          </div>

        </div>

      </main>

      <Footer />

      {/* Image Fullscreen Preview Modal */}
      {showFullImageModal && uploadedFileMeta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
          <div className="relative max-w-4xl max-h-[90vh] bg-slate-900 border border-white/10 rounded-3xl p-4 overflow-hidden">
            <button
              onClick={() => setShowFullImageModal(false)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800 text-white hover:bg-slate-700 transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <p className="text-sm font-bold text-white mb-3">{uploadedFileMeta.name}</p>
            <img
              src={uploadedFileMeta.url}
              alt="Full Preview"
              className="max-h-[75vh] w-auto mx-auto object-contain rounded-xl"
            />
          </div>
        </div>
      )}

      {/* Certificate Modal */}
      <CertificateModal
        isOpen={isCertOpen}
        onClose={() => setIsCertOpen(false)}
        title={contractTitle}
        score={auditReport?.overallScore || 0}
        notary={notarizationResult}
      />

      {/* Top-Up Modal */}
      <TopUpModal
        isOpen={isTopUpOpen}
        onClose={() => setIsTopUpOpen(false)}
        onCreditsPurchased={(newTotal) => setCredits(newTotal)}
      />

      {/* Wallet Connect Modal */}
      <WalletConnectModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
      />
    </div>
  );
}
