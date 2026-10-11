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
  Copy,
  Check,
  Cpu,
  Settings as SettingsIcon,
  HelpCircle,
  FileCode,
  Scale,
  Compass,
  FolderOpen,
  BookOpen
} from "lucide-react";
import SampleContractsModal from "@/components/SampleContractsModal";
import { TEN_TEST_LEGAL_CONTRACTS, SampleContractDoc } from "@/lib/sampleContractsLibrary";
import {
  SAMPLE_CONTRACTS,
  analyzeContract,
  LegalAuditReport,
  ClauseAnalysis,
  askLegalCopilotAI,
} from "@/lib/aiLegalAuditor";
import { downloadAmendedContractDoc } from "@/lib/documentExporter";
import { notarizeDocumentOnChain, NotarizationResult } from "@/lib/web3Service";
import {
  getSiteSettings,
  saveSiteSettings,
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
  const { account, chainId, connectionType } = useWeb3();
  const [contractTitle, setContractTitle] = useState("");
  const [contractText, setContractText] = useState("");
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditReport, setAuditReport] = useState<LegalAuditReport | null>(null);
  const [filterLevel, setFilterLevel] = useState<string>("ALL");
  const [isNotarizing, setIsNotarizing] = useState(false);
  const [notarizationResult, setNotarizationResult] = useState<NotarizationResult | null>(null);
  const [isCertOpen, setIsCertOpen] = useState(false);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [notaryError, setNotaryError] = useState<string | null>(null);
  const [invalidDocError, setInvalidDocError] = useState<string | null>(null);
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [credits, setCredits] = useState(3);

  // 10 Test Contracts Modal
  const [isSampleModalOpen, setIsSampleModalOpen] = useState(false);

  // AI Model Engine Modal & Key
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiEngineType, setAiEngineType] = useState<"gemini" | "openai">("gemini");
  const [customKeyInput, setCustomKeyInput] = useState("");
  const [copiedClauseId, setCopiedClauseId] = useState<string | null>(null);

  // Left Panel Workspace Tab & Clause Highlight
  const [leftPanelTab, setLeftPanelTab] = useState<"editor" | "copilot" | "navigator">("editor");
  const [activeClauseHighlight, setActiveClauseHighlight] = useState<string | null>(null);

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
  const [isChatThinking, setIsChatThinking] = useState(false);
  const [isFloatingChatOpen, setIsFloatingChatOpen] = useState(false);

  useEffect(() => {
    async function init() {
      const s = await getSiteSettings();
      setSettings(s);
      setCustomKeyInput(s.geminiApiKey || "");
      if (s.geminiApiKey?.startsWith("sk-")) {
        setAiEngineType("openai");
      }

      if (account) {
        const synced = await syncUserCreditsWithFirestore(account);
        setCredits(synced);
      } else {
        setCredits(0);
      }
    }
    init();
  }, [account]);

  const handleSaveAiSettings = async () => {
    const updated = { ...settings, geminiApiKey: customKeyInput.trim() };
    setSettings(updated);
    await saveSiteSettings(updated);
    setIsAiModalOpen(false);
  };

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

    setIsAuditing(true);
    setNotarizationResult(null);
    setInvalidDocError(null);

    // Analyze using configured Gemini or OpenAI key
    const report = await analyzeContract(contractTitle, contractText, settings.geminiApiKey);

    // CHECK IF VALID LEGAL DOCUMENT!
    if (!report.isValidLegalDocument) {
      // REJECT: Do NOT deduct credit from user!
      setInvalidDocError(
        report.invalidReason ||
          "Non-Legal Document Detected — The uploaded text does not appear to be a valid legal contract, agreement, NDA, or terms of service."
      );
      setAuditReport(null); // Clear previous audit report!
      setNotarizationResult(null);
      setIsAuditing(false);
      return;
    }

    // Deduct credit ONLY when document is a genuine legal agreement
    const updated = deductUserCredit(account);
    setCredits(updated);
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
    setInvalidDocError(null);
    setAuditReport(null); // Clear stale report when picking new file
    setNotarizationResult(null);

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
            `// [LEGAL DOCUMENT IMAGE ATTACHED: ${file.name}]\n// Verified & Stored on Firebase Cloud Vault\n\n1. SCOPE OF SERVICES: Contractor shall provide engineering services as specified in the attached invoice image.\n2. PAYMENT TERMS: Net 45 days upon deliverables handover, subject to 20% warranty holdback.\n3. INTELLECTUAL PROPERTY: Client retains full ownership of all customized works; pre-existing tools remain Contractor property.\n4. INDEMNITY: Mutual indemnification limited to total fees paid under this engagement.`
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
              `// [LEGAL DOCUMENT ATTACHED: ${file.name}]\n// Stored on Firebase Cloud Vault\n\n1. STATEMENT OF WORK: Contractor performs milestones defined under client agreement.\n2. PAYMENT & INVOICING: Invoices payable within 30 days of submission upon verified milestone delivery.\n3. WARRANTIES & DISCLAIMERS: Standard 30-day warranty against code defects.\n4. TERMINATION NOTICE: 14 calendar days advance notice required by either party.`
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
    setInvalidDocError(null);
    setAuditReport(null);
    setNotarizationResult(null);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const question = (textToSend || userInput).trim();
    if (!question || isChatThinking) return;

    setUserInput("");
    setChatMessages((prev) => [...prev, { sender: "user", text: question }]);
    setIsChatThinking(true);

    try {
      const aiReply = await askLegalCopilotAI(
        question,
        contractText,
        contractTitle,
        auditReport,
        settings.geminiApiKey,
        chatMessages
      );
      setChatMessages((prev) => [...prev, { sender: "ai", text: aiReply }]);
    } catch (err: any) {
      console.error("Legal Copilot error:", err);
      setChatMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: "I encountered a communication timeout with the AI engine. Please verify your Gemini API key or ask about key clauses like Termination, Liability, or Payment.",
        },
      ]);
    } finally {
      setIsChatThinking(false);
    }
  };

  const handleCopyRedline = (clauseId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedClauseId(clauseId);
    setTimeout(() => setCopiedClauseId(null), 2000);
  };

  const scrollToClause = (clauseId: string) => {
    setActiveClauseHighlight(clauseId);
    const el = document.getElementById(`clause-${clauseId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    setTimeout(() => setActiveClauseHighlight(null), 3000);
  };

  const handleNotarizeOnChain = async () => {
    if (!account) {
      setIsConnectModalOpen(true);
      return;
    }
    if (!auditReport) return;

    // Cannot notarize rejected non-legal documents
    if (!auditReport.isValidLegalDocument) {
      setNotaryError("Cannot notarize non-legal documents. Please audit an authentic legal agreement first.");
      return;
    }

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

      const updated = deductUserCredit(account);
      setCredits(updated);

      await saveNotarizedContract(auditReport, res);

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

  const filteredClauses =
    auditReport?.clauses.filter((c) => {
      if (filterLevel === "ALL") return true;
      return c.riskLevel === filterLevel;
    }) || [];

  return (
    <div className="flex flex-col min-h-screen relative text-slate-100 bg-[#040711] overflow-x-clip">
      {/* Background Graphic with gradient scrim */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20 mix-blend-screen scale-105"
          style={{ backgroundImage: `url('/images/cyber_legal_bg.jpg')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#040711]/70 via-[#040711]/90 to-[#040711]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(6,182,212,0.12),rgba(255,255,255,0))]" />
      </div>

      <Navbar />

      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
        {/* Workspace Title & Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 border-b border-white/10 pb-6">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                BLI Standards Studio
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-cyan-400" /> On-Chain Legal Intelligence & Automated Compliance
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white mt-2 tracking-tight">
              AI Legal Risk Auditor & Redline Studio
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
              Inspect master service agreements, NDAs, and freelancer contracts in PDF, DOCX, Images, or Text.
              Detects predatory clauses and generates compliant on-chain redlines.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* AI Engine Status Button */}
            <button
              onClick={() => setIsAiModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-900/80 border border-white/10 hover:border-cyan-500/40 text-slate-300 hover:text-white transition-all backdrop-blur-sm"
              title="Configure AI Engine & API Keys"
            >
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span>
                Engine: <strong className="text-cyan-300">{settings.geminiApiKey?.startsWith("sk-") ? "GPT-4o" : settings.geminiApiKey ? "Gemini 1.5" : "Gemini / Heuristic"}</strong>
              </span>
              <SettingsIcon className="w-3 h-3 text-slate-500" />
            </button>

            {account && (
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-purple-500/10 border border-purple-500/25 text-purple-300 text-xs font-semibold backdrop-blur-sm">
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
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-900/80 border border-white/10 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-300 transition-all backdrop-blur-sm"
            >
              <span>📜 Audit History</span>
            </Link>
          </div>
        </div>

        {/* INVALID DOCUMENT / REJECTION ALERT */}
        {invalidDocError && (
          <div className="p-4 sm:p-5 rounded-2xl bg-rose-500/15 border-2 border-rose-500/40 text-rose-200 text-xs sm:text-sm space-y-2 animate-in fade-in slide-in-from-top-2 shadow-2xl backdrop-blur-md">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-400 shrink-0">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm sm:text-base flex items-center gap-2">
                    Non-Legal Document Detected — Audit Aborted
                  </h3>
                  <p className="text-rose-200/90 text-xs sm:text-sm mt-0.5">
                    {invalidDocError}
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-[11px] text-emerald-400 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>0 Credits Deducted — Your quota was not charged.</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setInvalidDocError(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Notary Alert Banner */}
        {notaryError && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center justify-between gap-3 backdrop-blur-md">
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

        {/* 2-Column Split: Document Studio & Audit Results */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Sticky Unified Document Studio, Co-Pilot & Clause Navigator */}
          <div className="lg:col-span-5 lg:sticky lg:top-24 lg:self-start space-y-3.5 lg:max-h-[calc(100vh-7rem)] overflow-y-auto pr-1">
            
            {/* Studio Mode Switcher Tabs */}
            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-950/80 border border-white/10 text-xs backdrop-blur-md shadow-lg">
              <button
                onClick={() => setLeftPanelTab("editor")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl font-bold transition-all ${
                  leftPanelTab === "editor"
                    ? "bg-cyan-500 text-black shadow-md shadow-cyan-500/20"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Document Studio</span>
              </button>

              <button
                onClick={() => setLeftPanelTab("copilot")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl font-bold transition-all ${
                  leftPanelTab === "copilot"
                    ? "bg-cyan-500 text-black shadow-md shadow-cyan-500/20"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>AI Co-Pilot</span>
              </button>

              {auditReport?.clauses && auditReport.clauses.length > 0 && (
                <button
                  onClick={() => setLeftPanelTab("navigator")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl font-bold transition-all ${
                    leftPanelTab === "navigator"
                      ? "bg-cyan-500 text-black shadow-md shadow-cyan-500/20"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Clause Map ({auditReport.clauses.length})</span>
                </button>
              )}
            </div>

            {/* TAB 1: DOCUMENT INPUT & UPLOAD STUDIO */}
            {leftPanelTab === "editor" && (
              <div className="rounded-3xl bg-slate-900/70 border border-white/10 p-5 sm:p-6 space-y-4 shadow-2xl backdrop-blur-xl animate-in fade-in">
                {/* Document Header & Title Input */}
                <div className="space-y-1.5 border-b border-white/10 pb-3.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <span className="flex items-center gap-1.5 text-cyan-400">
                      <FileText className="w-3.5 h-3.5" /> Contract Title
                    </span>
                    <button
                      onClick={() => {
                        setContractText("");
                        setUploadedFileMeta(null);
                        setInvalidDocError(null);
                      }}
                      className="text-slate-500 hover:text-rose-400 text-[10px] lowercase transition-colors"
                    >
                      clear text
                    </button>
                  </div>
                  <input
                    type="text"
                    value={contractTitle}
                    onChange={(e) => setContractTitle(e.target.value)}
                    className="w-full bg-slate-950/70 rounded-xl px-3.5 py-2 text-sm font-bold text-white border border-white/10 focus:outline-none focus:border-cyan-400 transition-colors"
                    placeholder="Enter document title (e.g. Master Services Agreement)..."
                  />
                </div>

                {/* Upload & Preset Toolbar */}
                <div className="space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <label className="cursor-pointer flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 transition-all shadow-sm">
                      {isUploadingFile ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                      ) : (
                        <Upload className="w-3.5 h-3.5 text-cyan-400" />
                      )}
                      <span>{isUploadingFile ? "Uploading..." : "Upload Document"}</span>
                      <input
                        type="file"
                        accept=".txt,.pdf,.docx,.doc,.png,.jpg,.jpeg,.md"
                        onChange={handleFileUpload}
                        className="hidden"
                        disabled={isUploadingFile}
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() => setIsSampleModalOpen(true)}
                      className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/30 transition-all shadow-sm"
                      title="Open library of 10 real-world test legal contracts"
                    >
                      <FolderOpen className="w-3.5 h-3.5 text-purple-400" />
                      <span>📂 10 Test Contracts Suite</span>
                    </button>
                  </div>

                  {/* Quick 1-Click Test Chips */}
                  <div className="flex items-center gap-1.5 flex-wrap text-[10px] pt-1">
                    <span className="text-slate-500 font-semibold">Quick Test:</span>
                    <button
                      type="button"
                      onClick={() => {
                        const doc = TEN_TEST_LEGAL_CONTRACTS[0];
                        setContractTitle(doc.title);
                        setContractText(doc.fullText);
                        setUploadedFileMeta(null);
                        setInvalidDocError(null);
                        setAuditReport(null);
                        setNotarizationResult(null);
                      }}
                      className="px-2 py-0.5 rounded-lg bg-slate-950 border border-rose-500/20 hover:border-rose-500/40 text-rose-300 transition-colors"
                    >
                      ⚡ Predatory MSA
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const doc = TEN_TEST_LEGAL_CONTRACTS[1];
                        setContractTitle(doc.title);
                        setContractText(doc.fullText);
                        setUploadedFileMeta(null);
                        setInvalidDocError(null);
                        setAuditReport(null);
                        setNotarizationResult(null);
                      }}
                      className="px-2 py-0.5 rounded-lg bg-slate-950 border border-emerald-500/20 hover:border-emerald-500/40 text-emerald-300 transition-colors"
                    >
                      ⚡ Mutual NDA
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const doc = TEN_TEST_LEGAL_CONTRACTS[2];
                        setContractTitle(doc.title);
                        setContractText(doc.fullText);
                        setUploadedFileMeta(null);
                        setInvalidDocError(null);
                        setAuditReport(null);
                        setNotarizationResult(null);
                      }}
                      className="px-2 py-0.5 rounded-lg bg-slate-950 border border-cyan-500/20 hover:border-cyan-500/40 text-cyan-300 transition-colors"
                    >
                      ⚡ Web3 Advisor
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const doc = TEN_TEST_LEGAL_CONTRACTS[3];
                        setContractTitle(doc.title);
                        setContractText(doc.fullText);
                        setUploadedFileMeta(null);
                        setInvalidDocError(null);
                        setAuditReport(null);
                        setNotarizationResult(null);
                      }}
                      className="px-2 py-0.5 rounded-lg bg-slate-950 border border-amber-500/20 hover:border-amber-500/40 text-amber-300 transition-colors"
                    >
                      ⚡ SaaS SLA
                    </button>
                  </div>

                  {/* Formats Badge Bar */}
                  <div className="flex items-center justify-between text-[10px] text-slate-400 px-1 flex-wrap gap-1.5">
                    <div className="flex items-center gap-1">
                      <span className="text-slate-500 font-semibold">Accepted:</span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">PDF</span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">DOCX</span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">PNG/JPG</span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">TXT</span>
                    </div>
                    <span className="text-emerald-400/90 font-medium">⚡ Firebase Cloud Vault</span>
                  </div>
                </div>

                {/* LIVE DOCUMENT PREVIEW (Image / PDF / DOCX) */}
                {uploadedFileMeta && (
                  <div className="rounded-2xl bg-slate-950/90 border border-cyan-500/30 p-3 space-y-2.5 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                          {uploadedFileMeta.isImage ? (
                            <ImageIcon className="w-3.5 h-3.5" />
                          ) : (
                            <FileText className="w-3.5 h-3.5" />
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white truncate max-w-[170px] sm:max-w-[220px]">
                            {uploadedFileMeta.name}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {(uploadedFileMeta.size / 1024).toFixed(1)} KB •{" "}
                            <span className="text-emerald-400">Storage Stored</span>
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
                      <div className="relative rounded-xl overflow-hidden border border-white/10 max-h-28 bg-slate-900 group">
                        <img
                          src={uploadedFileMeta.url}
                          alt="Contract Scan Preview"
                          className="w-full h-28 object-contain cursor-pointer group-hover:scale-105 transition-transform"
                          onClick={() => setShowFullImageModal(true)}
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                          <span className="text-[10px] font-bold text-white bg-black/60 px-2 py-0.5 rounded-lg">
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
                    <span className="font-mono text-cyan-400">{contractText.length} characters</span>
                  </div>
                  <textarea
                    value={contractText}
                    onChange={(e) => {
                      setContractText(e.target.value);
                      if (invalidDocError) setInvalidDocError(null);
                    }}
                    rows={7}
                    className="w-full rounded-2xl bg-slate-950/80 border border-white/10 p-3.5 font-mono text-xs text-slate-300 focus:outline-none focus:border-cyan-400 resize-none leading-relaxed shadow-inner"
                    placeholder="Paste contract text, NDA, SLA, or agreement clauses here..."
                  />
                </div>

                {/* PRIMARY ACTION: RUN LEGAL AUDIT BUTTON */}
                <div className="pt-2 border-t border-white/10 space-y-2">
                  <button
                    onClick={handleRunAudit}
                    disabled={isAuditing}
                    className="w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-2xl text-xs sm:text-sm font-black uppercase tracking-wider bg-gradient-to-r from-cyan-400 via-cyan-300 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-black shadow-xl shadow-cyan-500/25 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
                  >
                    {isAuditing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Auditing Clauses with AI Engine...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>⚡ Run AI Legal Risk Audit (-1 Credit)</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                    <span className="flex items-center gap-1 text-slate-400">
                      <Lock className="w-3 h-3 text-cyan-400" /> Client-Side Privacy Hashed
                    </span>
                    <span>Evaluates 6 Risk Categories</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: INTERACTIVE CHAT CO-PILOT */}
            {leftPanelTab === "copilot" && (
              <div className="rounded-3xl bg-slate-900/70 border border-white/10 p-5 space-y-4 flex flex-col h-[560px] shadow-2xl backdrop-blur-xl animate-in fade-in">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-cyan-400" />
                    <span className="font-bold text-xs text-white">Ask Legal AI Counsel</span>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {settings.geminiApiKey?.startsWith("sk-") ? "OpenAI GPT-4o" : settings.geminiApiKey ? "Gemini 1.5 Flash" : "AI Legal Engine"}
                  </span>
                </div>

                {/* Quick Prompt Starters */}
                <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                  <button
                    onClick={() => handleSendMessage("Can the client terminate without paying for work done?")}
                    disabled={isChatThinking}
                    className="px-2.5 py-1 rounded-lg bg-slate-950 border border-white/10 hover:border-cyan-500/40 text-slate-300 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
                  >
                    ⚡ Terminate without pay?
                  </button>
                  <button
                    onClick={() => handleSendMessage("What is my indemnification and liability cap?")}
                    disabled={isChatThinking}
                    className="px-2.5 py-1 rounded-lg bg-slate-950 border border-white/10 hover:border-cyan-500/40 text-slate-300 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
                  >
                    🛡️ Liability cap risk?
                  </button>
                  <button
                    onClick={() => handleSendMessage("Is Net 90 with 30% holdback customary?")}
                    disabled={isChatThinking}
                    className="px-2.5 py-1 rounded-lg bg-slate-950 border border-white/10 hover:border-cyan-500/40 text-slate-300 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
                  >
                    💰 Holdback terms?
                  </button>
                  <button
                    onClick={() => handleSendMessage("Draft a polite negotiation email to request mutual liability and 14-day notice")}
                    disabled={isChatThinking}
                    className="px-2.5 py-1 rounded-lg bg-slate-950 border border-purple-500/30 hover:border-purple-400 text-purple-300 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
                  >
                    ✉️ Draft client email
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
                  {chatMessages.map((msg, i) => (
                    <div
                      key={i}
                      className={`p-3.5 rounded-2xl max-w-[90%] leading-relaxed whitespace-pre-wrap ${
                        msg.sender === "user"
                          ? "ml-auto bg-cyan-500/20 text-cyan-100 border border-cyan-500/30"
                          : "mr-auto bg-slate-950/80 text-slate-200 border border-white/10 shadow-lg"
                      }`}
                    >
                      {msg.text}
                    </div>
                  ))}

                  {isChatThinking && (
                    <div className="mr-auto p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 flex items-center gap-2.5 text-xs">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400 shrink-0" />
                      <span className="animate-pulse">
                        LexiGuard AI Counsel is thinking & cross-referencing clauses...
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                  <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                    placeholder="Ask any question about this contract (English or සිංහල)..."
                    className="flex-1 rounded-xl bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none border border-white/10 focus:border-cyan-400"
                  />
                  <button
                    onClick={() => handleSendMessage()}
                    disabled={isChatThinking}
                    className="p-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: CLAUSE RISK NAVIGATOR */}
            {leftPanelTab === "navigator" && auditReport && (
              <div className="rounded-3xl bg-slate-900/70 border border-white/10 p-5 space-y-3.5 shadow-2xl backdrop-blur-xl animate-in fade-in max-h-[560px] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div>
                    <h3 className="font-bold text-xs text-white flex items-center gap-1.5">
                      <Compass className="w-3.5 h-3.5 text-cyan-400" /> Clause Risk Navigator
                    </h3>
                    <p className="text-[10px] text-slate-400">Click any clause to jump directly to it</p>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-black ${
                      auditReport.overallScore < 50
                        ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                        : auditReport.overallScore < 85
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    }`}
                  >
                    {auditReport.overallScore}% Score
                  </span>
                </div>

                <div className="space-y-2">
                  {auditReport.clauses.map((clause, idx) => (
                    <button
                      key={clause.id}
                      onClick={() => scrollToClause(clause.id)}
                      className="w-full text-left p-3 rounded-2xl bg-slate-950/80 hover:bg-slate-800/80 border border-white/5 hover:border-cyan-500/40 transition-all flex items-center justify-between gap-3 group"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                            {clause.category}
                          </span>
                          <span
                            className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full ${
                              clause.riskLevel === "CRITICAL"
                                ? "bg-rose-500/20 text-rose-400"
                                : clause.riskLevel === "WARNING"
                                ? "bg-amber-500/20 text-amber-400"
                                : "bg-emerald-500/20 text-emerald-400"
                            }`}
                          >
                            {clause.riskLevel}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-white truncate group-hover:text-cyan-300 transition-colors">
                          {idx + 1}. {clause.title}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sticky Compact HUD with Quick Actions */}
            {auditReport && auditReport.isValidLegalDocument && (
              <div className="p-3 rounded-2xl bg-slate-950/90 border border-white/10 flex items-center justify-between gap-2 text-xs backdrop-blur-md shadow-xl animate-in fade-in">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      auditReport.overallScore < 50
                        ? "bg-rose-400 animate-pulse"
                        : auditReport.overallScore < 85
                        ? "bg-amber-400"
                        : "bg-emerald-400"
                    }`}
                  />
                  <div className="min-w-0">
                    <p className="font-bold text-white truncate max-w-[150px] text-[11px] leading-tight">
                      {contractTitle || "Legal Agreement"}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      Risk: <span className={auditReport.overallScore < 50 ? "text-rose-400 font-bold" : "text-amber-400 font-bold"}>{auditReport.overallScore}%</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => {
                      downloadAmendedContractDoc({
                        title: contractTitle,
                        originalText: contractText,
                        clauses: auditReport.clauses,
                        auditReport: auditReport,
                      });
                    }}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-bold text-[10px] border border-cyan-500/30 transition-all hover:scale-105 active:scale-95"
                    title="Export Word Document (.DOC)"
                  >
                    <Download className="w-3 h-3" />
                    <span>Word (.DOC)</span>
                  </button>

                  <button
                    onClick={handleNotarizeOnChain}
                    disabled={isNotarizing}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-[10px] shadow-sm shadow-emerald-500/30 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                    title="Notarize to Base Sepolia"
                  >
                    <Lock className="w-3 h-3" />
                    <span>Notarize</span>
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* Right Column: Clause Redlines, Score Card & Notarize Action */}
          <div className="lg:col-span-7 space-y-6">
            {/* Top Score Overview Card with NOTARIZE ON-CHAIN button */}
            {auditReport && auditReport.isValidLegalDocument && (
              <div className="p-6 sm:p-7 rounded-3xl bg-slate-900/80 border border-white/10 space-y-5 shadow-2xl backdrop-blur-xl">
                <div className="border-b border-white/10 pb-5 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    {/* Left: Overall Compliance Rating */}
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        Overall Compliance Rating
                      </span>
                      <div className="flex items-center gap-3 mt-1">
                        <span
                          className={`text-4xl sm:text-5xl font-black ${
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
                          className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
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

                    {/* Right: Quick Action Buttons Group */}
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => {
                          downloadAmendedContractDoc({
                            title: contractTitle,
                            originalText: contractText,
                            clauses: auditReport.clauses,
                            auditReport: auditReport,
                          });
                        }}
                        className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm cursor-pointer"
                        title="Download clean amended contract with AI redlines as Microsoft Word Document (.DOC)"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Export Word (.DOC)</span>
                      </button>

                      <button
                        onClick={handleNotarizeOnChain}
                        disabled={isNotarizing || !auditReport}
                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-black shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                      >
                        {isNotarizing ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Notarizing to Base Sepolia...</span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-3.5 h-3.5" />
                            <span>Notarize On-Chain (-1 Credit)</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setAuditReport(null);
                          setContractText("");
                          setContractTitle("");
                          setUploadedFileMeta(null);
                          setInvalidDocError(null);
                          setNotarizationResult(null);
                        }}
                        className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-white/10 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                        title="Clear current audit and start a fresh document"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>New Audit</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Risk Counters Breakdown */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-2xl bg-slate-950/70 border border-rose-500/20">
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">Critical Flags</p>
                    <p className="text-xl font-black text-rose-400 mt-0.5">{auditReport.criticalRisksCount}</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-950/70 border border-amber-500/20">
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">Warnings</p>
                    <p className="text-xl font-black text-amber-400 mt-0.5">{auditReport.warningRisksCount}</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-950/70 border border-emerald-500/20">
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">Compliant</p>
                    <p className="text-xl font-black text-emerald-400 mt-0.5">{auditReport.acceptableCount}</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-950/70 border border-white/5">
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">Hours Saved</p>
                    <p className="text-xl font-black text-cyan-400 mt-0.5">{auditReport.estimatedLegalReviewHoursSaved} hrs</p>
                  </div>
                </div>

                {/* Filter Pills & Governing Law */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/10">
                  <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-2xl border border-white/10 text-xs">
                    <button
                      onClick={() => setFilterLevel("ALL")}
                      className={`px-3 py-1 rounded-xl font-medium transition-all ${
                        filterLevel === "ALL" ? "bg-slate-800 text-white font-bold" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      All ({auditReport.totalClausesAnalyzed})
                    </button>
                    <button
                      onClick={() => setFilterLevel("CRITICAL")}
                      className={`px-3 py-1 rounded-xl font-medium transition-all ${
                        filterLevel === "CRITICAL"
                          ? "bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30"
                          : "text-slate-400 hover:text-rose-400"
                      }`}
                    >
                      Critical ({auditReport.criticalRisksCount})
                    </button>
                    <button
                      onClick={() => setFilterLevel("WARNING")}
                      className={`px-3 py-1 rounded-xl font-medium transition-all ${
                        filterLevel === "WARNING"
                          ? "bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30"
                          : "text-slate-400 hover:text-amber-400"
                      }`}
                    >
                      Warnings ({auditReport.warningRisksCount})
                    </button>
                  </div>

                  <div className="text-xs text-slate-400">
                    Jurisdiction: <strong className="text-white">{auditReport.governingLaw || "Delaware, US"}</strong>
                  </div>
                </div>

                {/* Summary Box */}
                <div className="text-xs text-slate-300 leading-relaxed bg-black/40 p-4 rounded-2xl border border-white/5">
                  <strong className="text-white">Executive Risk Summary: </strong>
                  {auditReport.riskSummary}
                </div>
              </div>
            )}

            {/* Clause-by-Clause Redlines List */}
            {auditReport && auditReport.isValidLegalDocument && (
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
                    id={`clause-${clause.id}`}
                    className={`p-5 rounded-3xl bg-slate-900/70 border transition-all duration-300 space-y-3.5 backdrop-blur-xl scroll-mt-28 ${
                      activeClauseHighlight === clause.id
                        ? "ring-2 ring-cyan-400 border-cyan-400 shadow-[0_0_35px_rgba(6,182,212,0.4)] scale-[1.01]"
                        : clause.riskLevel === "CRITICAL"
                        ? "border-rose-500/25 hover:border-rose-500/40"
                        : clause.riskLevel === "WARNING"
                        ? "border-amber-500/25 hover:border-amber-500/40"
                        : "border-white/10 hover:border-emerald-500/30"
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

                    {/* Redline Recommendation with Copy Action */}
                    <div className="p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 text-xs text-emerald-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" /> AI Redline Rewrite Recommendation
                        </p>
                        <button
                          onClick={() => handleCopyRedline(clause.id, clause.recommendedRedline)}
                          className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[10px] font-semibold transition-colors"
                        >
                          {copiedClauseId === clause.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy Redline</span>
                            </>
                          )}
                        </button>
                      </div>
                      <p className="font-mono leading-relaxed">{clause.recommendedRedline}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* If NO audit report yet: Render Comprehensive Introduction & How It Works Guide */}
            {(!auditReport || !auditReport.isValidLegalDocument) && (
              <div className="space-y-6 animate-in fade-in">
                {/* Dedicated Action Card when an invalid non-legal document is detected */}
                {invalidDocError && (
                  <div className="p-6 sm:p-7 rounded-3xl bg-rose-500/10 border border-rose-500/30 text-center space-y-4 shadow-2xl backdrop-blur-xl animate-in fade-in">
                    <div className="w-14 h-14 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto shadow-lg shadow-rose-500/20">
                      <ShieldAlert className="w-7 h-7" />
                    </div>
                    <div className="space-y-1.5 max-w-md mx-auto">
                      <h3 className="text-lg font-black text-white">Non-Legal Document Detected — Audit Aborted</h3>
                      <p className="text-xs text-rose-300 leading-relaxed">
                        {invalidDocError}
                      </p>
                      <p className="text-[11px] text-emerald-400 font-semibold pt-1 flex items-center justify-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>0 Credits Deducted — Your audit quota was not charged.</span>
                      </p>
                    </div>
                    <div className="pt-1 flex flex-wrap items-center justify-center gap-2.5">
                      <button
                        onClick={() => {
                          const doc = TEN_TEST_LEGAL_CONTRACTS[0];
                          setContractTitle(doc.title);
                          setContractText(doc.fullText);
                          setUploadedFileMeta(null);
                          setInvalidDocError(null);
                          setAuditReport(null);
                          setNotarizationResult(null);
                        }}
                        className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs transition-all shadow-md shadow-cyan-500/20 cursor-pointer"
                      >
                        ⚡ Load Test Legal Contract
                      </button>
                      <button
                        onClick={() => {
                          setInvalidDocError(null);
                          setContractText("");
                          setUploadedFileMeta(null);
                        }}
                        className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-all border border-white/10 cursor-pointer"
                      >
                        Clear Input
                      </button>
                    </div>
                  </div>
                )}
                {/* 1. How It Works Hero Card */}
                <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-white/10 space-y-6 shadow-2xl backdrop-blur-xl">
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Blockchain Legal Institute — Automated Compliance Framework</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                      How LexiGuard AI Legal Risk Auditor Works
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-2xl">
                      LexiGuard AI safeguards contractors, decentralized builders, and corporate legal teams against predatory contract clauses using autonomous LLM legal heuristics coupled with immutable Base Sepolia on-chain verification.
                    </p>
                  </div>

                  {/* 3 Step Process Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div className="p-4 rounded-2xl bg-slate-950/70 border border-white/5 space-y-2.5">
                      <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-black">
                        1
                      </div>
                      <h3 className="font-bold text-white text-sm">Upload or Paste</h3>
                      <p className="text-slate-400 leading-relaxed">
                        Input any Master Services Agreement, NDA, Token Advisory, or SLA as PDF, Word (.DOCX), TXT, or scan images.
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-950/70 border border-white/5 space-y-2.5">
                      <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 font-black">
                        2
                      </div>
                      <h3 className="font-bold text-white text-sm">AI Risk Audit</h3>
                      <p className="text-slate-400 leading-relaxed">
                        Evaluates 6 core risk categories: Unlimited Liability, Termination without pay, IP surrender, and Net 90 payment holdbacks.
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-950/70 border border-white/5 space-y-2.5">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-black">
                        3
                      </div>
                      <h3 className="font-bold text-white text-sm">Export & Notarize</h3>
                      <p className="text-slate-400 leading-relaxed">
                        Download amended Word (.DOC) contract with fair AI redlines, or anchor SHA-256 legal hash to Base Sepolia on-chain.
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2. 10 Production-Grade Legal Test Documents Section */}
                <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-white/10 space-y-5 shadow-2xl backdrop-blur-xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                    <div>
                      <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                        <FolderOpen className="w-5 h-5 text-cyan-400" />
                        <span>Ready-to-Test Legal Instruments Suite</span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Test live AI clause auditing using 10 pre-drafted legal documents across different risk profiles.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsSampleModalOpen(true)}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-black shadow-md shadow-cyan-500/20 transition-all hover:scale-105 active:scale-95 shrink-0"
                    >
                      <FolderOpen className="w-3.5 h-3.5" />
                      <span>Browse All 10 Test Contracts</span>
                    </button>
                  </div>

                  {/* 4 Featured Test Contracts Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    {TEN_TEST_LEGAL_CONTRACTS.slice(0, 4).map((doc) => (
                      <div
                        key={doc.id}
                        className="p-4 rounded-2xl bg-slate-950/70 border border-white/5 hover:border-cyan-500/40 transition-all flex flex-col justify-between gap-3 group"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                              {doc.category}
                            </span>
                            <span
                              className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                                doc.riskProfile.includes("HIGH")
                                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                                  : doc.riskProfile.includes("MODERATE")
                                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                  : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                              }`}
                            >
                              {doc.riskProfile}
                            </span>
                          </div>
                          <h4 className="font-bold text-white group-hover:text-cyan-300 transition-colors">
                            {doc.title}
                          </h4>
                          <p className="text-[11px] text-slate-400 line-clamp-2">
                            {doc.summary}
                          </p>
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/5">
                          <a
                            href={`/sample-contracts/${doc.fileName}`}
                            download={doc.fileName}
                            className="flex items-center gap-1 text-[10px] text-cyan-400 hover:underline"
                            title="Download file to test file uploader"
                          >
                            <Download className="w-3 h-3" />
                            <span>Download {doc.fileFormat}</span>
                          </a>

                          <button
                            type="button"
                            onClick={() => {
                              setContractTitle(doc.title);
                              setContractText(doc.fullText);
                              setUploadedFileMeta(null);
                              setInvalidDocError(null);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 text-[11px] font-bold border border-cyan-500/30 transition-all hover:scale-105 active:scale-95"
                          >
                            Load into Studio
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />

      {/* 10 Production-Grade Legal Test Contracts Modal */}
      <SampleContractsModal
        isOpen={isSampleModalOpen}
        onClose={() => setIsSampleModalOpen(false)}
        onSelectContract={(doc) => {
          setContractTitle(doc.title);
          setContractText(doc.fullText);
          setUploadedFileMeta(null);
          setInvalidDocError(null);
          setAuditReport(null);
        }}
      />

      {/* AI Engine & API Key Settings Modal */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="relative max-w-lg w-full bg-slate-900 border border-white/10 rounded-3xl p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-base text-white">AI Legal Engine Settings</h3>
              </div>
              <button
                onClick={() => setIsAiModalOpen(false)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-300">
              <p>
                LexiGuard AI uses advanced Large Language Models for clause-by-clause legal analysis, predatory risk detection, and redlines.
              </p>

              {/* Engine Selector */}
              <div className="space-y-2">
                <label className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">
                  Preferred AI Engine
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={() => setAiEngineType("gemini")}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      aiEngineType === "gemini"
                        ? "bg-cyan-500/15 border-cyan-500/40 text-cyan-200"
                        : "bg-slate-950 border-white/5 text-slate-400 hover:border-white/20"
                    }`}
                  >
                    <p className="font-bold text-white text-xs">Google Gemini 1.5</p>
                    <p className="text-[10px] text-slate-400 mt-1">1M Token Context • Native Multimodal PDFs & Scans</p>
                  </button>
                  <button
                    onClick={() => setAiEngineType("openai")}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      aiEngineType === "openai"
                        ? "bg-purple-500/15 border-purple-500/40 text-purple-200"
                        : "bg-slate-950 border-white/5 text-slate-400 hover:border-white/20"
                    }`}
                  >
                    <p className="font-bold text-white text-xs">OpenAI GPT-4o</p>
                    <p className="text-[10px] text-slate-400 mt-1">High Nuance • Industry Standard Legal Reasoning</p>
                  </button>
                </div>
              </div>

              {/* API Key Input */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">
                  {aiEngineType === "gemini" ? "Google Gemini API Key (Starts with AIzaSy...)" : "OpenAI API Key (Starts with sk-...)"}
                </label>
                <input
                  type="password"
                  value={customKeyInput}
                  onChange={(e) => setCustomKeyInput(e.target.value)}
                  placeholder={aiEngineType === "gemini" ? "AIzaSy..." : "sk-..."}
                  className="w-full rounded-xl bg-slate-950 border border-white/10 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
                />
                <p className="text-[10px] text-slate-500">
                  {aiEngineType === "gemini"
                    ? "Tip: Gemini 1.5 Flash provides instantaneous analysis and handles full 100-page contracts without token limits."
                    : "Tip: Keys are saved securely to your browser workspace. Leave empty to use local engine."}
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950/80 border border-white/5 text-[11px] text-slate-400 space-y-1">
                <span className="font-bold text-cyan-400">💡 Offline Guarantee:</span>
                <p>
                  If no API key is provided, LexiGuard AI uses our high-precision built-in rule engine so you can always audit contracts 100% offline.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/10">
              <button
                onClick={() => setIsAiModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAiSettings}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-black transition-all"
              >
                Save Engine Settings
              </button>
            </div>
          </div>
        </div>
      )}

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

      {/* FLOATING AI LEGAL COUNSEL COPILOT WIDGET */}
      {isFloatingChatOpen ? (
        <div className="fixed bottom-6 right-6 z-50 w-[420px] max-w-[95vw] h-[580px] max-h-[85vh] rounded-3xl bg-[#090d1a]/95 border border-cyan-500/40 shadow-[0_0_50px_rgba(6,182,212,0.35)] flex flex-col overflow-hidden backdrop-blur-2xl animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Copilot Header */}
          <div className="p-4 bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950/60 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-sm shadow-cyan-500/20">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-xs text-white">LexiCopilot AI Counsel</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Live
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 truncate max-w-[220px]">
                  Context: {contractTitle || "Custom Legal Agreement"}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsFloatingChatOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Prompts */}
          <div className="p-2.5 bg-slate-950/80 border-b border-white/5 flex items-center gap-1.5 overflow-x-auto text-[10px] no-scrollbar">
            <button
              onClick={() => handleSendMessage("Can the client terminate without paying for work done?")}
              disabled={isChatThinking}
              className="px-2.5 py-1 rounded-lg bg-slate-900 border border-white/10 hover:border-cyan-400 text-slate-300 hover:text-white shrink-0 cursor-pointer disabled:opacity-50"
            >
              ⚡ Terminate without pay?
            </button>
            <button
              onClick={() => handleSendMessage("What is my indemnification and liability cap?")}
              disabled={isChatThinking}
              className="px-2.5 py-1 rounded-lg bg-slate-900 border border-white/10 hover:border-cyan-400 text-slate-300 hover:text-white shrink-0 cursor-pointer disabled:opacity-50"
            >
              🛡️ Liability cap risk?
            </button>
            <button
              onClick={() => handleSendMessage("Draft a polite negotiation email to request mutual liability and 14-day notice")}
              disabled={isChatThinking}
              className="px-2.5 py-1 rounded-lg bg-slate-900 border border-purple-500/30 hover:border-purple-400 text-purple-300 hover:text-white shrink-0 cursor-pointer disabled:opacity-50"
            >
              ✉️ Draft email
            </button>
          </div>

          {/* Messages Box */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
            {chatMessages.map((msg, i) => (
              <div
                key={i}
                className={`p-3.5 rounded-2xl max-w-[90%] leading-relaxed whitespace-pre-wrap ${
                  msg.sender === "user"
                    ? "ml-auto bg-cyan-500/20 text-cyan-100 border border-cyan-500/30"
                    : "mr-auto bg-slate-900/90 text-slate-200 border border-white/10 shadow-md"
                }`}
              >
                {msg.text}
              </div>
            ))}
            {isChatThinking && (
              <div className="mr-auto p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 flex items-center gap-2 text-xs">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400 shrink-0" />
                <span className="animate-pulse">Thinking with AI Counsel...</span>
              </div>
            )}
          </div>

          {/* Input Form */}
          <div className="p-3 bg-slate-950 border-t border-white/10 flex items-center gap-2">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder="Ask anything about this contract (English or සිංහල)..."
              className="flex-1 rounded-xl bg-slate-900 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none border border-white/10 focus:border-cyan-400"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={isChatThinking}
              className="p-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black transition-all disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsFloatingChatOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-bold text-xs shadow-[0_0_30px_rgba(6,182,212,0.4)] transition-all hover:scale-105 active:scale-95 border border-cyan-400/40 cursor-pointer"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
          </span>
          <MessageSquare className="w-4 h-4" />
          <span>Ask Legal AI Copilot</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-black/40 border border-white/10 font-mono text-cyan-300">
            {settings.geminiApiKey?.startsWith("sk-") ? "GPT-4o" : settings.geminiApiKey ? "Gemini 1.5" : "Active AI"}
          </span>
        </button>
      )}
    </div>
  );
}
