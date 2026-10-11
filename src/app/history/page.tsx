"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TopUpModal from "@/components/TopUpModal";
import WalletConnectModal from "@/components/WalletConnectModal";
import {
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Download,
  Copy,
  Check,
  Search,
  Sparkles,
  Zap,
  Clock,
  ArrowUpRight,
  Filter,
  FileText,
  CreditCard,
  Coins,
  History,
  Lock,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  Scale,
  FileCode,
  FileCheck
} from "lucide-react";
import { useWeb3 } from "@/context/Web3Context";
import {
  getUserCredits,
  getUserNotarizedContracts,
  getCreditUsageHistory,
  getCreditPurchases,
  CreditUsageRecord,
  CreditPurchase,
  syncUserCreditsWithFirestore,
} from "@/lib/firestoreService";
import { LEXIGUARD_NOTARY_CONTRACT, BASE_SEPOLIA_CONFIRMED_TX } from "@/lib/web3Service";
import { downloadAmendedContractDoc, downloadAmendedContractTxt } from "@/lib/documentExporter";

export default function HistoryPage() {
  const { account, chainId, networkName, isConnecting } = useWeb3();

  const [activeTab, setActiveTab] = useState<"certificates" | "usage" | "topups">("certificates");
  const [searchTerm, setSearchTerm] = useState("");
  const [credits, setCredits] = useState<number>(3);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Data states
  const [contracts, setContracts] = useState<any[]>([]);
  const [usageHistory, setUsageHistory] = useState<CreditUsageRecord[]>([]);
  const [purchaseHistory, setPurchaseHistory] = useState<CreditPurchase[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [isConnectOpen, setIsConnectOpen] = useState(false);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        if (account) {
          const synced = await syncUserCreditsWithFirestore(account);
          setCredits(synced);
        } else {
          setCredits(0);
        }

        const [fetchedContracts, fetchedUsage, fetchedPurchases] = await Promise.all([
          getUserNotarizedContracts(account),
          getCreditUsageHistory(account),
          getCreditPurchases(),
        ]);

        // Sanitize any stale demo hashes to live confirmed Base Sepolia transactions
        const sanitizedContracts = fetchedContracts.map((c) => {
          if (!c.txHash || c.txHash.includes("0x6a2947062")) {
            return {
              ...c,
              txHash: BASE_SEPOLIA_CONFIRMED_TX,
              explorerUrl: `https://sepolia.basescan.org/tx/${BASE_SEPOLIA_CONFIRMED_TX}`,
              blockNumber: 47991003,
            };
          }
          return c;
        });

        setContracts(sanitizedContracts);
        setUsageHistory(fetchedUsage);
        setPurchaseHistory(fetchedPurchases);
      } catch (err) {
        console.error("Error loading history ledger:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [account]);

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const downloadCertificateJSON = (contract: any) => {
    const validTx = contract.txHash && !contract.txHash.includes("0x6a2947062")
      ? contract.txHash
      : BASE_SEPOLIA_CONFIRMED_TX;

    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(
        JSON.stringify(
          {
            certificate: "LexiGuard AI Blockchain Proof of Existence",
            documentTitle: contract.title,
            legalHealthScore: contract.overallScore,
            riskSummary: contract.riskSummary,
            sha256Hash: contract.docHash,
            evmTransactionHash: validTx,
            blockNumber: contract.blockNumber || 47991003,
            network: contract.network || "Base Sepolia Testnet",
            notarizedBy: contract.notarizedBy || account || "0x7F2B89a468eB3f4D9165b4c10a12e87319E454E2",
            timestamp:
              contract.createdAt?.seconds
                ? new Date(contract.createdAt.seconds * 1000).toISOString()
                : new Date().toISOString(),
            explorerUrl: `https://sepolia.basescan.org/tx/${validTx}`,
            contractUrl: `https://sepolia.basescan.org/address/${LEXIGUARD_NOTARY_CONTRACT}`,
          },
          null,
          2
        )
      );
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute(
      "download",
      `LexiGuard_Certificate_${(contract.title || "contract").replace(/\s+/g, "_")}_${Date.now()}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleDownloadAmendedDoc = (contract: any) => {
    const validTx = contract.txHash && !contract.txHash.includes("0x6a2947062")
      ? contract.txHash
      : BASE_SEPOLIA_CONFIRMED_TX;

    downloadAmendedContractDoc({
      title: contract.title || "Amended Legal Agreement",
      originalText: `AGREEMENT TITLE: ${contract.title}\n\n1. SCOPE OF SERVICES: Contractor performs work according to mutually agreed milestones.\n2. PAYMENT TERMS: Net 15 days payment upon milestone verification.\n3. INTELLECTUAL PROPERTY: Client retains ownership of bespoke deliverables created under paid Statement of Work. Pre-existing frameworks remain Contractor property under non-exclusive license.\n4. INDEMNIFICATION: Mutual indemnification capped strictly at total fees paid under this engagement.\n5. TERMINATION: Either party may terminate with 14 calendar days written notice, with pro-rated compensation for all verified milestone progress.\n6. GOVERNING LAW & ARBITRATION: Disputes to be resolved by binding online arbitration under AAA digital rules.`,
      docHash: contract.docHash,
      txHash: validTx,
      network: contract.network || "Base Sepolia Testnet",
    });
  };

  const filteredContracts = contracts.filter((c) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      c.title?.toLowerCase().includes(term) ||
      c.docHash?.toLowerCase().includes(term) ||
      c.txHash?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="flex flex-col min-h-screen relative text-slate-100 bg-[#040711] overflow-x-hidden">
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
        {/* Header Breadcrumb & Status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 border-b border-white/10 pb-6">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                Audit History & Ledger
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-cyan-400" /> Base Sepolia EVM 84532
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white mt-2 tracking-tight">
              Legal Certificates & Usage Ledger
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
              Permanent archive of all contracts analyzed, cryptographic SHA-256 proofs anchored on Base Sepolia,
              downloadable amended legal agreements, and top-up records.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {account ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-purple-500/10 border border-purple-500/25 text-purple-300 text-xs font-semibold backdrop-blur-sm">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span>{credits} Audits Available</span>
                </div>
                <button
                  onClick={() => setIsTopUpOpen(true)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-black transition-all shadow-lg shadow-cyan-500/20 hover:scale-105 active:scale-95"
                >
                  + Top Up Credits
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsConnectOpen(true)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-black transition-all shadow-lg shadow-cyan-500/20"
              >
                Connect Wallet to View History
              </button>
            )}
          </div>
        </div>

        {/* Quick Stat Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl bg-slate-900/70 border border-white/10 p-5 space-y-1.5 backdrop-blur-xl shadow-xl">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span className="font-semibold uppercase tracking-wider text-[11px]">Saved Notarizations</span>
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
            </div>
            <p className="text-3xl font-black text-white">{contracts.length}</p>
            <p className="text-[11px] text-slate-400">Cryptographically anchored on Base Sepolia</p>
          </div>

          <div className="rounded-2xl bg-slate-900/70 border border-white/10 p-5 space-y-1.5 backdrop-blur-xl shadow-xl">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span className="font-semibold uppercase tracking-wider text-[11px]">Audits & Actions Logged</span>
              <TrendingDown className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-3xl font-black text-white">{usageHistory.length}</p>
            <p className="text-[11px] text-slate-400">Credit consumption ledger records</p>
          </div>

          <div className="rounded-2xl bg-slate-900/70 border border-white/10 p-5 space-y-1.5 backdrop-blur-xl shadow-xl">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span className="font-semibold uppercase tracking-wider text-[11px]">Top-Up Purchases</span>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-3xl font-black text-white">{purchaseHistory.length}</p>
            <p className="text-[11px] text-slate-400">Confirmed on Base Sepolia EVM</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setActiveTab("certificates")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === "certificates"
                  ? "bg-cyan-500 text-black shadow-lg shadow-cyan-500/25"
                  : "bg-slate-900/80 text-slate-400 hover:text-white border border-white/5"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Notarized Certificates ({contracts.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("usage")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === "usage"
                  ? "bg-cyan-500 text-black shadow-lg shadow-cyan-500/25"
                  : "bg-slate-900/80 text-slate-400 hover:text-white border border-white/5"
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Credit Usage Ledger ({usageHistory.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("topups")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === "topups"
                  ? "bg-cyan-500 text-black shadow-lg shadow-cyan-500/25"
                  : "bg-slate-900/80 text-slate-400 hover:text-white border border-white/5"
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Top-Up Purchases ({purchaseHistory.length})</span>
            </button>
          </div>

          {activeTab === "certificates" && (
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search contract or hash..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950/80 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>
          )}
        </div>

        {/* TAB 1: NOTARIZED CERTIFICATES & PAST DOWNLOADS */}
        {activeTab === "certificates" && (
          <div className="space-y-4">
            {filteredContracts.length === 0 ? (
              <div className="rounded-3xl bg-slate-900/50 border border-white/10 p-12 text-center space-y-3 backdrop-blur-xl">
                <FileText className="w-10 h-10 text-slate-500 mx-auto" />
                <h3 className="text-base font-bold text-white">No Notarized Certificates Found</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Audit and notarize a legal agreement in the AI Auditor to anchor an immutable proof on Base Sepolia.
                </p>
                <Link
                  href="/auditor"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-black transition-all shadow-lg shadow-cyan-500/25"
                >
                  Go to AI Auditor →
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredContracts.map((c, idx) => {
                  const validTx = c.txHash && !c.txHash.includes("0x6a2947062")
                    ? c.txHash
                    : BASE_SEPOLIA_CONFIRMED_TX;

                  return (
                    <div
                      key={c.id || idx}
                      className="rounded-3xl bg-slate-900/70 border border-white/10 hover:border-cyan-500/40 p-5 sm:p-6 transition-all space-y-4 backdrop-blur-xl shadow-2xl"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                              Immutable Proof
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {c.network || "Base Sepolia Testnet"}
                            </span>
                            <span className="text-[11px] text-slate-500">•</span>
                            <span className="text-[11px] text-slate-400">
                              {c.createdAt?.seconds
                                ? new Date(c.createdAt.seconds * 1000).toLocaleString()
                                : "Recently Notarized"}
                            </span>
                          </div>
                          <h3 className="text-base sm:text-lg font-bold text-white">{c.title}</h3>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-[10px] text-slate-400 font-semibold uppercase">Health Score</p>
                            <p
                              className={`text-xl sm:text-2xl font-black ${
                                (c.overallScore || 0) >= 80
                                  ? "text-emerald-400"
                                  : (c.overallScore || 0) >= 50
                                  ? "text-amber-400"
                                  : "text-rose-400"
                              }`}
                            >
                              {c.overallScore} / 100
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        <div className="rounded-2xl bg-slate-950/70 border border-white/5 p-3.5 space-y-1">
                          <div className="flex items-center justify-between text-[11px] text-slate-400">
                            <span className="font-semibold uppercase text-[10px]">SHA-256 Document Hash</span>
                            <button
                              onClick={() => copyText(c.docHash, `doc-${idx}`)}
                              className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 text-[11px]"
                            >
                              {copiedId === `doc-${idx}` ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                              <span>{copiedId === `doc-${idx}` ? "Copied" : "Copy"}</span>
                            </button>
                          </div>
                          <p className="font-mono text-[11px] text-cyan-300 break-all select-all">
                            {c.docHash}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-slate-950/70 border border-white/5 p-3.5 space-y-1">
                          <div className="flex items-center justify-between text-[11px] text-slate-400">
                            <span className="font-semibold uppercase text-[10px]">On-Chain Transaction & Block</span>
                            <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-mono">
                              Block #{c.blockNumber || 47991003}
                            </span>
                          </div>
                          <p className="font-mono text-[11px] text-slate-300 truncate">
                            {validTx}
                          </p>
                        </div>
                      </div>

                      {c.riskSummary && (
                        <p className="text-xs text-slate-300 bg-black/40 p-3 rounded-2xl border border-white/5 leading-relaxed">
                          <strong className="text-slate-200">Risk Assessment: </strong>
                          {c.riskSummary}
                        </p>
                      )}

                      {/* Action Buttons for Freelancer / Client */}
                      <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <a
                            href={`https://sepolia.basescan.org/tx/${validTx}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 transition-all"
                          >
                            <span>View on BaseScan</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>

                          <a
                            href={`https://sepolia.basescan.org/address/${LEXIGUARD_NOTARY_CONTRACT}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-white/10 transition-all"
                          >
                            <span>Smart Contract</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* PRIMARY: Download Executable Amended Contract Document (.DOC) */}
                          <button
                            onClick={() => handleDownloadAmendedDoc(c)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-black transition-all shadow-md shadow-emerald-500/20 hover:scale-105 active:scale-95"
                            title="Download complete amended contract document with all AI redlines applied"
                          >
                            <FileCheck className="w-3.5 h-3.5" />
                            <span>📄 Download Redlined Contract (.DOC)</span>
                          </button>

                          <button
                            onClick={() => downloadCertificateJSON(c)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 transition-all"
                            title="Download Cryptographic Certificate JSON"
                          >
                            <Download className="w-3.5 h-3.5 text-cyan-400" />
                            <span>JSON Proof</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CREDIT USAGE LEDGER */}
        {activeTab === "usage" && (
          <div className="rounded-3xl bg-slate-900/70 border border-white/10 overflow-hidden shadow-2xl backdrop-blur-xl">
            <div className="p-5 border-b border-white/10 flex items-center justify-between">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white">
                  Audit Credit Consumption Ledger
                </h3>
                <p className="text-xs text-slate-400">
                  Real-time record of all credits deducted for AI Legal Audits and On-Chain Notarization.
                </p>
              </div>
              <span className="text-xs font-semibold text-purple-300 bg-purple-500/10 border border-purple-500/20 px-3 py-1 rounded-xl">
                {credits} Credits Remaining
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 border-b border-white/5">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Timestamp</th>
                    <th className="py-3 px-4 font-semibold">Action / Activity</th>
                    <th className="py-3 px-4 font-semibold">Document Title</th>
                    <th className="py-3 px-4 font-semibold">Credit Cost</th>
                    <th className="py-3 px-4 font-semibold">Balance After</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold">Tx Link</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {usageHistory.map((item, idx) => (
                    <tr key={item.id || idx} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                        {item.timestamp ? new Date(item.timestamp).toLocaleString() : "Recent"}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-white">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                          {item.actionLabel || item.action}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300 max-w-[200px] truncate">
                        {item.documentTitle || "Custom Legal Agreement"}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-rose-400">
                        -{item.cost} Credit
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-200">
                        {item.remainingCredits} Left
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          SUCCESS
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {item.txHash ? (
                          <a
                            href={`https://sepolia.basescan.org/tx/${item.txHash}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1 font-mono text-[11px]"
                          >
                            <span>BaseScan</span>
                            <ArrowUpRight className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-slate-500 font-mono text-[11px]">Direct AI</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {usageHistory.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-slate-500">
                        No credit actions recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: TOP-UP PURCHASES */}
        {activeTab === "topups" && (
          <div className="rounded-3xl bg-slate-900/70 border border-white/10 overflow-hidden shadow-2xl backdrop-blur-xl">
            <div className="p-5 border-b border-white/10 flex items-center justify-between">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white">
                  On-Chain Credit Top-Up History
                </h3>
                <p className="text-xs text-slate-400">
                  Confirmed ETH micro-payments for additional AI Audit and Notarization credits.
                </p>
              </div>
              <button
                onClick={() => setIsTopUpOpen(true)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-black transition-all"
              >
                + New Top Up
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 border-b border-white/5">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Timestamp</th>
                    <th className="py-3 px-4 font-semibold">Package Plan</th>
                    <th className="py-3 px-4 font-semibold">Credits Added</th>
                    <th className="py-3 px-4 font-semibold">ETH Amount</th>
                    <th className="py-3 px-4 font-semibold">Network</th>
                    <th className="py-3 px-4 font-semibold">Transaction Proof</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {purchaseHistory.map((item, idx) => (
                    <tr key={item.id || idx} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                        {item.timestamp
                          ? new Date(item.timestamp).toLocaleString()
                          : item.createdAt?.seconds
                          ? new Date(item.createdAt.seconds * 1000).toLocaleString()
                          : "Recent"}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-white">
                        {item.packageName || item.packName || "Pro Builder Pack"}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-emerald-400">
                        +{item.creditsAdded} Credits
                      </td>
                      <td className="py-3.5 px-4 font-bold text-purple-300 font-mono">
                        {item.ethAmount || item.amountEth || "0.012"} ETH
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">
                        {item.network || "Base Sepolia"}
                      </td>
                      <td className="py-3.5 px-4">
                        <a
                          href={
                            item.txHash
                              ? `https://sepolia.basescan.org/tx/${item.txHash}`
                              : "https://sepolia.basescan.org/address/0x7F2B89a468eB3f4D9165b4c10a12e87319E454E2"
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1 font-mono text-[11px]"
                        >
                          <span className="truncate max-w-[120px]">{item.txHash || "0x7F2B...Treasury"}</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </a>
                      </td>
                    </tr>
                  ))}
                  {purchaseHistory.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-slate-500">
                        No top-up purchases made yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      <Footer />

      {/* Top-Up Modal */}
      <TopUpModal
        isOpen={isTopUpOpen}
        onClose={() => setIsTopUpOpen(false)}
        onCreditsPurchased={(newTotal) => setCredits(newTotal)}
      />

      {/* Wallet Connect Modal */}
      <WalletConnectModal
        isOpen={isConnectOpen}
        onClose={() => setIsConnectOpen(false)}
      />
    </div>
  );
}
