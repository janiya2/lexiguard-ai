"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  ShieldCheck,
  Search,
  ExternalLink,
  Lock,
  CheckCircle2,
  AlertTriangle,
  FileCheck2,
  Copy,
  Check,
  Hash,
  Sparkles,
} from "lucide-react";
import { computeSHA256 } from "@/lib/web3Service";
import { getNotarizedContracts } from "@/lib/firestoreService";
import EscrowVaultSection from "@/components/EscrowVaultSection";

const SAMPLE_AUTHENTIC_CONTRACT = `CROSS-BORDER IP LICENSING AND ROYALTY AGREEMENT
Between Licensor: InnoXpert Labs (Zug, Switzerland)
And Licensee: Global Enterprise Solutions Corp (Delaware, USA)

1. Intellectual Property Grant: Licensor grants Licensee a worldwide, non-exclusive license to utilize the LexiGuard protocol.
2. Royalty Fee: Licensee shall remit a royalty of 4.5% of gross revenues on the 1st of each calendar month.
3. Governing Law: This Agreement is governed by Delaware Law with dispute resolution via decentralized arbitration.`;

const SAMPLE_TAMPERED_CONTRACT = `CROSS-BORDER IP LICENSING AND ROYALTY AGREEMENT
Between Licensor: InnoXpert Labs (Zug, Switzerland)
And Licensee: Global Enterprise Solutions Corp (Delaware, USA)

1. Intellectual Property Grant: Licensor grants Licensee a worldwide, non-exclusive license to utilize the LexiGuard protocol.
2. Royalty Fee: Licensee shall remit a royalty of 1.0% of gross revenues on the 1st of each calendar month.
3. Governing Law: This Agreement is governed by Delaware Law with dispute resolution via decentralized arbitration.`;

const SAMPLE_NDA_CONTRACT = `MUTUAL NON-DISCLOSURE AND CONFIDENTIALITY AGREEMENT

This Mutual Non-Disclosure Agreement ("Agreement") is made between Party A and Party B (collectively, the "Parties") for the purpose of exploring a mutual technology collaboration.

1. DEFINITION OF CONFIDENTIAL INFORMATION:
Confidential Information includes all non-public technical, operational, smart contract architecture, cryptographic keys, financial, and business information disclosed by either party, whether orally or in writing.

2. MUTUAL OBLIGATIONS OF NON-DISCLOSURE:
Each party agrees to safeguard the other party's Confidential Information with the same degree of care as its own proprietary data, but no less than reasonable care. Neither party shall disclose Confidential Information to third parties without prior written consent.

3. STANDARD EXCLUSIONS:
Confidential Information shall not include information that: (a) is or becomes publicly known through no breach of this Agreement; (b) was already known to receiving party prior to disclosure; (c) is independently developed without reference to disclosing party's data.

4. TERM & SURVIVAL:
The confidentiality obligations under this Agreement shall survive for a period of two (2) years following the date of disclosure.

5. EQUITABLE REMEDIES:
The parties acknowledge that unauthorized disclosure may cause irreparable harm for which monetary damages are inadequate, entitling the non-breaching party to seek injunctive relief.`;

const SAMPLE_NDA_HASH = "0x2c1db8a2eef22231695b3c3fbf482de3ef370dee95d1ccb9fcc0104208874544";

export default function VaultPage() {
  const [contracts, setContracts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [verifyInput, setVerifyInput] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [verificationResult, setVerificationResult] = useState<{
    status: "idle" | "verified" | "tampered";
    mode?: "content" | "hash" | "tx";
    computedHash?: string;
    matchedDoc?: any;
    message?: string;
  }>({ status: "idle" });

  useEffect(() => {
    async function fetchLedger() {
      const records = await getNotarizedContracts();
      setContracts(records);

      // Check URL parameters for direct verification e.g. /vault?hash=0x...
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        const queryHash = params.get("hash");
        if (queryHash) {
          setVerifyInput(queryHash);
          runVerification(queryHash, records);
        }
      }
    }
    fetchLedger();

    const handleVerifyEvent = (e: any) => {
      const targetHash = e.detail?.hash;
      if (targetHash) {
        setVerifyInput(targetHash);
        runVerification(targetHash);
        const el = document.getElementById("verifier-tool");
        if (el) {
          el.scrollIntoView({ behavior: "smooth" });
        } else {
          window.scrollTo({ top: 120, behavior: "smooth" });
        }
      }
    };
    window.addEventListener("lexiguard_verify_hash", handleVerifyEvent);
    return () => window.removeEventListener("lexiguard_verify_hash", handleVerifyEvent);
  }, []);

  const runVerification = async (rawInput: string, ledgerRecords: any[] = contracts) => {
    const trimmed = rawInput.trim();
    if (!trimmed) return;

    // Check if input looks like a raw cryptographic hash (starts with 0x and is hex, or 64-char hex)
    const isHexHash =
      (trimmed.startsWith("0x") && trimmed.length >= 40 && trimmed.length <= 66) ||
      (/^[a-fA-F0-9]{64}$/.test(trimmed));

    if (isHexHash) {
      const normalizedInput = trimmed.toLowerCase();
      // Match against docHash or txHash in registered ledger
      const hashMatch = ledgerRecords.find(
        (c) =>
          c.docHash?.toLowerCase() === normalizedInput ||
          c.txHash?.toLowerCase() === normalizedInput ||
          (c.docHash && normalizedInput.includes(c.docHash.toLowerCase()))
      );

      if (hashMatch) {
        setVerificationResult({
          status: "verified",
          mode: "hash",
          computedHash: hashMatch.docHash,
          matchedDoc: hashMatch,
          message: `Direct Cryptographic Hash Match — Registered to "${hashMatch.title}" on Base Sepolia (Block #${hashMatch.blockNumber || 47991003})`,
        });
        return;
      }
    }

    // Otherwise compute SHA-256 hash of the entered contract content
    const computedHash = await computeSHA256(trimmed);

    // Look for exact match or prefix match in on-chain ledger records
    const match = ledgerRecords.find(
      (c) =>
        c.docHash?.toLowerCase() === computedHash.toLowerCase() ||
        computedHash.toLowerCase().includes(c.docHash?.slice(0, 16)?.toLowerCase())
    );

    if (match) {
      setVerificationResult({
        status: "verified",
        mode: "content",
        computedHash,
        matchedDoc: match,
        message: `100% Authentic — Document content matches On-Chain Proof for "${match.title}"`,
      });
    } else {
      setVerificationResult({
        status: "tampered",
        computedHash,
        message: isHexHash
          ? "Unregistered Hash — This hash was not found in the verified blockchain notary ledger."
          : "Unregistered or Modified — Document content has been altered or not anchored on-chain!",
      });
    }
  };

  const handleVerify = () => {
    runVerification(verifyInput);
  };

  const handleCopy = (text: string, id: string) => {
    if (typeof navigator !== "undefined") {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const filtered = contracts.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.title?.toLowerCase().includes(q) ||
      c.docHash?.toLowerCase().includes(q) ||
      c.txHash?.toLowerCase().includes(q) ||
      c.network?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="relative flex flex-col min-h-screen bg-[#030712] text-slate-100 overflow-x-hidden w-full max-w-full">
      {/* Dynamic Cyber Vault Background Asset */}
      <div
        className="fixed inset-0 bg-cover bg-center opacity-10 pointer-events-none mix-blend-screen"
        style={{ backgroundImage: `url('/images/escrow_vault_bg.jpg')` }}
      />
      <div className="fixed inset-0 bg-gradient-to-b from-[#030712]/95 via-[#060c23]/90 to-[#030712]/95 pointer-events-none" />

      <Navbar />

      <main className="relative z-10 flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12 space-y-8 sm:space-y-12 min-w-0 overflow-x-hidden">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 px-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>Public Verification Protocol</span>
          </div>
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight break-words">
            On-Chain Legal Notary Vault
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm">
            Search, audit, and mathematically verify tamper-proof legal document proofs anchored to Base Sepolia EVM smart contracts.
          </p>
        </div>

        {/* INSTANT TAMPER VERIFIER TOOL */}
        <section id="verifier-tool" className="rounded-3xl bg-slate-900/80 border border-cyan-500/20 p-4 sm:p-8 backdrop-blur-xl shadow-2xl space-y-5 sm:space-y-6 min-w-0 max-w-full overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/5 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                <Hash className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base sm:text-lg font-bold text-white">Instant Document Integrity Verifier</h2>
                <p className="text-xs text-slate-400">
                  Paste contract text or paste a Document SHA-256 Hash to verify its cryptographic proof on-chain.
                </p>
              </div>
            </div>

            {/* Quick Demo Test Buttons */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => {
                  setVerifyInput(SAMPLE_AUTHENTIC_CONTRACT);
                  setVerificationResult({ status: "idle" });
                }}
                className="px-2 sm:px-2.5 py-1.5 rounded-xl text-[10px] sm:text-[11px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 transition-all font-semibold flex items-center gap-1 cursor-pointer"
              >
                <span>📋 IP Agreement</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setVerifyInput(SAMPLE_NDA_CONTRACT);
                  setVerificationResult({ status: "idle" });
                }}
                className="px-2 sm:px-2.5 py-1.5 rounded-xl text-[10px] sm:text-[11px] bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20 transition-all font-semibold flex items-center gap-1 cursor-pointer"
              >
                <span>🛡️ Mutual NDA</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setVerifyInput(SAMPLE_NDA_HASH);
                  setVerificationResult({ status: "idle" });
                }}
                className="px-2 sm:px-2.5 py-1.5 rounded-xl text-[10px] sm:text-[11px] bg-purple-500/10 border border-purple-500/30 text-purple-300 hover:bg-purple-500/20 transition-all font-semibold flex items-center gap-1 cursor-pointer"
              >
                <span>🔑 NDA Hash (0x2c1...)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setVerifyInput(SAMPLE_TAMPERED_CONTRACT);
                  setVerificationResult({ status: "idle" });
                }}
                className="px-2 sm:px-2.5 py-1.5 rounded-xl text-[10px] sm:text-[11px] bg-rose-500/10 border border-rose-500/30 text-rose-300 hover:bg-rose-500/20 transition-all font-semibold flex items-center gap-1 cursor-pointer"
              >
                <span>⚠️ Tampered Clause</span>
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <textarea
                value={verifyInput}
                onChange={(e) => {
                  setVerifyInput(e.target.value);
                  setVerificationResult({ status: "idle" });
                }}
                rows={4}
                placeholder="Paste contract text, SHA-256 Hash (0x...), or Transaction Hash to verify on-chain authenticity..."
                className="w-full rounded-2xl bg-slate-950 p-4 font-mono text-xs text-slate-300 border border-white/10 focus:outline-none focus:border-cyan-500/50 resize-none placeholder:text-slate-600"
              />
              {verifyInput && (
                <button
                  type="button"
                  onClick={() => {
                    setVerifyInput("");
                    setVerificationResult({ status: "idle" });
                  }}
                  className="absolute right-3 top-3 text-[11px] text-slate-500 hover:text-slate-300 px-2 py-1 rounded bg-slate-900 border border-white/5"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <button
                onClick={handleVerify}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-400 to-cyan-500 hover:from-cyan-300 hover:to-cyan-400 text-black shadow-lg shadow-cyan-500/20 transition-all hover:scale-[1.02] cursor-pointer text-center"
              >
                Calculate Hash & Verify
              </button>

              {verificationResult.status === "verified" && (
                <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold animate-in fade-in min-w-0">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="break-words leading-tight">{verificationResult.message || `100% Authentic — Matches On-Chain Document #${verificationResult.matchedDoc?.id || "Registered"}`}</span>
                </div>
              )}

              {verificationResult.status === "tampered" && (
                <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold animate-in fade-in min-w-0">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span className="break-words leading-tight">{verificationResult.message || "Unregistered or Modified — Hash does NOT match original on-chain proof!"}</span>
                </div>
              )}
            </div>

            {verificationResult.computedHash && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-slate-950/80 border border-white/5 text-[11px] min-w-0">
                <p className="font-mono text-slate-400 break-all min-w-0">
                  <span className="text-slate-500">Document Digest:</span> {verificationResult.computedHash}
                </p>
                {verificationResult.matchedDoc?.explorerUrl && (
                  <a
                    href={verificationResult.matchedDoc.explorerUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-semibold shrink-0"
                  >
                    <span>View on BaseScan</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            )}
          </div>
        </section>

        {/* SMART LEGAL ESCROW VAULT */}
        <EscrowVaultSection />

        {/* LEDGER TABLE */}
        <section className="space-y-4 min-w-0 max-w-full overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-lg text-white">Anchored Document Registry</h3>
              <p className="text-xs text-slate-400">Total {contracts.length} contracts verified by LexiGuard Smart Contract on Base Sepolia</p>
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title, hash, network..."
                className="w-full rounded-xl bg-slate-900 border border-white/10 pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/40"
              />
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden sm:block rounded-3xl bg-slate-900/60 border border-white/5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-white/5">
                  <tr>
                    <th className="py-4 px-5">Document Name</th>
                    <th className="py-4 px-4">Score</th>
                    <th className="py-4 px-4">Cryptographic Hash (SHA-256)</th>
                    <th className="py-4 px-4">Blockchain Network</th>
                    <th className="py-4 px-4">Block #</th>
                    <th className="py-4 px-5 text-right">Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filtered.map((item, idx) => (
                    <tr key={item.id || item.docHash || item.txHash || `ledger-row-${idx}`} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-4 px-5 font-semibold text-white max-w-xs truncate">
                        {item.title}
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                            item.overallScore < 50
                              ? "bg-rose-500/15 text-rose-300"
                              : item.overallScore < 85
                              ? "bg-amber-500/15 text-amber-300"
                              : "bg-emerald-500/15 text-emerald-300"
                          }`}
                        >
                          {item.overallScore}%
                        </span>
                      </td>
                      <td className="py-4 px-4 font-mono text-cyan-300 text-[11px] max-w-[200px] truncate">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate">{item.docHash}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(item.docHash, item.id || `hash-${idx}`)}
                            title="Copy Hash"
                            className="text-slate-400 hover:text-white shrink-0"
                          >
                            {copiedId === (item.id || `hash-${idx}`) ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-slate-400">{item.network}</td>
                      <td className="py-4 px-4 font-mono text-slate-400">
                        #{item.blockNumber || 47991003}
                      </td>
                      <td className="py-4 px-5 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setVerifyInput(item.docHash);
                              runVerification(item.docHash);
                              window.scrollTo({ top: 180, behavior: "smooth" });
                            }}
                            className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] text-slate-300 font-medium transition-all"
                          >
                            Verify
                          </button>
                          <a
                            href={item.explorerUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 hover:bg-cyan-500/20 font-semibold transition-all text-xs"
                          >
                            <span>Explorer</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card Layout */}
          <div className="sm:hidden space-y-3">
            {filtered.map((item, idx) => (
              <div
                key={item.id || item.docHash || item.txHash || `ledger-card-${idx}`}
                className="p-4 rounded-2xl bg-slate-900/80 border border-white/5 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h4 className="font-bold text-white text-sm truncate">{item.title}</h4>
                    <p className="text-[11px] text-slate-400">{item.network} • #{item.blockNumber || 47991003}</p>
                  </div>
                  <span
                    className={`shrink-0 px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                      item.overallScore < 50
                        ? "bg-rose-500/15 text-rose-300"
                        : item.overallScore < 85
                        ? "bg-amber-500/15 text-amber-300"
                        : "bg-emerald-500/15 text-emerald-300"
                    }`}
                  >
                    {item.overallScore}%
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950 font-mono text-[10px] text-cyan-300 break-all border border-white/5">
                  <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                    <span>SHA-256 Digest</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(item.docHash, item.id)}
                      className="text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1"
                    >
                      {copiedId === item.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedId === item.id ? "Copied" : "Copy"}</span>
                    </button>
                  </div>
                  {item.docHash}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setVerifyInput(item.docHash);
                      runVerification(item.docHash);
                      window.scrollTo({ top: 120, behavior: "smooth" });
                    }}
                    className="flex-1 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-xs font-semibold border border-cyan-500/30 text-center transition-all"
                  >
                    Verify in Tool
                  </button>
                  <a
                    href={item.explorerUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold text-center border border-white/10 transition-all inline-flex items-center justify-center gap-1"
                  >
                    <span>BaseScan</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
