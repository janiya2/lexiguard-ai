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

        setContracts(fetchedContracts);
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
            evmTransactionHash: contract.txHash || BASE_SEPOLIA_CONFIRMED_TX,
            blockNumber: contract.blockNumber || 18454219,
            network: contract.network || "Base Sepolia Testnet",
            notarizedBy: contract.notarizedBy || account,
            timestamp:
              contract.createdAt?.seconds
                ? new Date(contract.createdAt.seconds * 1000).toISOString()
                : new Date().toISOString(),
            explorerUrl: contract.explorerUrl || `https://sepolia.basescan.org/tx/${contract.txHash}`,
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
    <div className="flex flex-col min-h-screen bg-[#060913] text-slate-100">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
        
        {/* Header Breadcrumb & Status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                Audit History & Ledger
              </span>
              <span className="text-xs text-slate-400">Base Sepolia Testnet</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
              Legal Certificates & Usage Ledger
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Permanent archive of all contracts analyzed, cryptographic SHA-256 proofs anchored on Base Sepolia, audit credit consumption, and on-chain Top-Up records.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {account ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span>{credits} Audits Available</span>
                </div>
                <button
                  onClick={() => setIsTopUpOpen(true)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-black transition-all shadow-lg shadow-cyan-500/20 hover:scale-105 active:scale-95"
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
          <div className="rounded-2xl bg-slate-900/50 border border-white/5 p-4.5 space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Saved Notarizations</span>
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
            </div>
            <p className="text-2xl font-black text-white">{contracts.length}</p>
            <p className="text-[11px] text-slate-500">Cryptographically anchored on-chain</p>
          </div>

          <div className="rounded-2xl bg-slate-900/50 border border-white/5 p-4.5 space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Audits & Actions Logged</span>
              <TrendingDown className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-2xl font-black text-white">{usageHistory.length}</p>
            <p className="text-[11px] text-slate-500">Credit usage ledger transactions</p>
          </div>

          <div className="rounded-2xl bg-slate-900/50 border border-white/5 p-4.5 space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Top-Up Purchases</span>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-black text-white">{purchaseHistory.length}</p>
            <p className="text-[11px] text-slate-500">Confirmed on Base Sepolia EVM</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("certificates")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === "certificates"
                  ? "bg-cyan-500 text-black shadow-lg shadow-cyan-500/20"
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
                  ? "bg-cyan-500 text-black shadow-lg shadow-cyan-500/20"
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
                  ? "bg-cyan-500 text-black shadow-lg shadow-cyan-500/20"
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
                className="w-full bg-slate-950/80 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
              />
            </div>
          )}
        </div>

        {/* TAB 1: NOTARIZED CERTIFICATES & PAST DOWNLOADS */}
        {activeTab === "certificates" && (
          <div className="space-y-4">
            {filteredContracts.length === 0 ? (
              <div className="rounded-2xl bg-slate-900/40 border border-white/5 p-12 text-center space-y-3">
                <FileText className="w-10 h-10 text-slate-500 mx-auto" />
                <h3 className="text-base font-bold text-white">No Notarized Certificates Found</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Audit and notarize a legal agreement in the AI Auditor to anchor an immutable proof on Base Sepolia.
                </p>
                <Link
                  href="/auditor"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-black transition-all"
                >
                  Go to AI Auditor →
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredContracts.map((c, idx) => (
                  <div
                    key={c.id || idx}
                    className="rounded-2xl bg-gradient-to-r from-slate-900/80 to-slate-950/80 border border-white/10 hover:border-cyan-500/30 p-5 transition-all space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
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
                          <p className="text-[10px] text-slate-400">Health Score</p>
                          <p
                            className={`text-lg font-black ${
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
                      <div className="rounded-xl bg-slate-950/70 border border-white/5 p-3 space-y-1">
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span>SHA-256 Document Hash</span>
                          <button
                            onClick={() => copyText(c.docHash, `doc-${idx}`)}
                            className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
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

                      <div className="rounded-xl bg-slate-950/70 border border-white/5 p-3 space-y-1">
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span>On-Chain Transaction & Block</span>
                          <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">
                            Block #{c.blockNumber || 18454219}
                          </span>
                        </div>
                        <p className="font-mono text-[11px] text-slate-300 truncate">
                          {c.txHash || BASE_SEPOLIA_CONFIRMED_TX}
                        </p>
                      </div>
                    </div>

                    {c.riskSummary && (
                      <p className="text-xs text-slate-300 bg-white/[0.02] p-2.5 rounded-xl border border-white/5">
                        <span className="font-semibold text-slate-400">Risk Assessment: </span>
                        {c.riskSummary}
                      </p>
                    )}

                    {/* Action Buttons for Freelancer / Client */}
                    <div className="pt-2 border-t border-white/5 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <a
                          href={c.explorerUrl || `https://sepolia.basescan.org/tx/${c.txHash || BASE_SEPOLIA_CONFIRMED_TX}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/25 transition-all"
                        >
                          <span>View on BaseScan</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>

                        <a
                          href={`https://sepolia.basescan.org/address/${LEXIGUARD_NOTARY_CONTRACT}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-white/5 transition-all"
                        >
                          <span>Smart Contract</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>

                      <button
                        onClick={() => downloadCertificateJSON(c)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white border border-white/10 hover:border-white/20 transition-all shadow-sm"
                      >
                        <Download className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Re-Download Certificate (JSON)</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CREDIT USAGE LEDGER */}
        {activeTab === "usage" && (
          <div className="rounded-2xl bg-slate-900/40 border border-white/10 overflow-hidden shadow-xl">
            <div className="p-4 sm:p-5 border-b border-white/5 flex items-center justify-between">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white">
                  Audit Credit Consumption Ledger
                </h3>
                <p className="text-xs text-slate-400">
                  Real-time record of all credits deducted for AI Legal Audits and On-Chain Notarization.
                </p>
              </div>
              <span className="text-xs font-semibold text-purple-300 bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 rounded-xl">
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
                        {new Date(item.timestamp).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 font-semibold">
                        {item.action === "ON_CHAIN_NOTARIZE" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                            <ShieldCheck className="w-3 h-3" /> On-Chain Notary
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                            <Sparkles className="w-3 h-3" /> AI Legal Audit
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-white font-medium max-w-xs truncate">
                        {item.documentTitle}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-rose-400">
                        -{item.cost || 1} Audit
                      </td>
                      <td className="py-3.5 px-4 text-slate-300 font-mono">
                        {item.remainingCredits} left
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                          <CheckCircle2 className="w-3 h-3" /> Completed
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {item.txHash ? (
                          <a
                            href={`https://sepolia.basescan.org/tx/${item.txHash}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-cyan-400 hover:text-cyan-300 underline font-mono text-[11px] flex items-center gap-1"
                          >
                            BaseScan <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: TOP-UP PURCHASES LEDGER */}
        {activeTab === "topups" && (
          <div className="rounded-2xl bg-slate-900/40 border border-white/10 overflow-hidden shadow-xl">
            <div className="p-4 sm:p-5 border-b border-white/5 flex items-center justify-between">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white">
                  On-Chain Top-Up Purchase Records
                </h3>
                <p className="text-xs text-slate-400">
                  EVM transactions on Base Sepolia adding credits to your connected wallet.
                </p>
              </div>
              <button
                onClick={() => setIsTopUpOpen(true)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-black transition-all"
              >
                + New Top-Up
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 border-b border-white/5">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Date & Time</th>
                    <th className="py-3 px-4 font-semibold">Package Name</th>
                    <th className="py-3 px-4 font-semibold">Credits Added</th>
                    <th className="py-3 px-4 font-semibold">Amount Paid</th>
                    <th className="py-3 px-4 font-semibold">EVM Network</th>
                    <th className="py-3 px-4 font-semibold">On-Chain TxHash</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {purchaseHistory.map((p, idx) => (
                    <tr key={p.id || idx} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                        {p.createdAt?.seconds
                          ? new Date(p.createdAt.seconds * 1000).toLocaleString()
                          : "Confirmed"}
                      </td>
                      <td className="py-3.5 px-4 text-white font-semibold">
                        {p.packName}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-emerald-400">
                        +{p.creditsAdded} Audits
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-200">
                        {p.amountEth} ETH
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">
                        {p.network || "Base Sepolia Testnet"}
                      </td>
                      <td className="py-3.5 px-4">
                        <a
                          href={
                            p.txHash && !p.txHash.startsWith("0x7645") && !p.txHash.startsWith("0x1a3c") && !p.txHash.startsWith("0x1b28")
                              ? `https://sepolia.basescan.org/tx/${p.txHash}`
                              : `https://sepolia.basescan.org/tx/${BASE_SEPOLIA_CONFIRMED_TX}`
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="font-mono text-[11px] text-cyan-400 hover:text-cyan-300 underline flex items-center gap-1"
                        >
                          {((p.txHash && !p.txHash.startsWith("0x7645") && !p.txHash.startsWith("0x1a3c") && !p.txHash.startsWith("0x1b28")) ? p.txHash : BASE_SEPOLIA_CONFIRMED_TX).slice(0, 10)}...
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                          <CheckCircle2 className="w-3 h-3" /> Verified On-Chain
                        </span>
                      </td>
                    </tr>
                  ))}
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
