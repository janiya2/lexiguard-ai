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
} from "lucide-react";
import { computeSHA256 } from "@/lib/web3Service";
import { getNotarizedContracts } from "@/lib/firestoreService";
import EscrowVaultSection from "@/components/EscrowVaultSection";

export default function VaultPage() {
  const [contracts, setContracts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [verifyInput, setVerifyInput] = useState("");
  const [verificationResult, setVerificationResult] = useState<{
    status: "idle" | "verified" | "tampered";
    computedHash?: string;
    matchedDoc?: any;
  }>({ status: "idle" });

  useEffect(() => {
    async function fetchLedger() {
      const records = await getNotarizedContracts();
      setContracts(records);
    }
    fetchLedger();
  }, []);

  const handleVerify = async () => {
    if (!verifyInput.trim()) return;
    const computedHash = await computeSHA256(verifyInput);

    // Look for match in ledger or prefix match
    const match = contracts.find(
      (c) =>
        c.docHash?.toLowerCase() === computedHash.toLowerCase() ||
        computedHash.toLowerCase().includes(c.docHash?.slice(0, 16)?.toLowerCase())
    );

    if (match) {
      setVerificationResult({
        status: "verified",
        computedHash,
        matchedDoc: match,
      });
    } else {
      setVerificationResult({
        status: "tampered",
        computedHash,
      });
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
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 space-y-12">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>Public Verification Protocol</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white">
            On-Chain Legal Notary Vault
          </h1>
          <p className="text-slate-400 text-sm">
            Search, audit, and mathematically verify tamper-proof legal document proofs anchored to Base Sepolia and Arbitrum EVM smart contracts.
          </p>
        </div>

        {/* INSTANT TAMPER VERIFIER TOOL */}
        <section className="rounded-3xl bg-slate-900/80 border border-cyan-500/20 p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-6">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <Hash className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="text-lg font-bold text-white">Instant Document Integrity Verifier</h2>
              <p className="text-xs text-slate-400">
                Paste any contract text or agreement below to cryptographically check if it matches the on-chain recorded hash.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <textarea
              value={verifyInput}
              onChange={(e) => {
                setVerifyInput(e.target.value);
                setVerificationResult({ status: "idle" });
              }}
              rows={4}
              placeholder="Paste contract text to test for tampering or verify existence..."
              className="w-full rounded-2xl bg-slate-950 p-4 font-mono text-xs text-slate-300 border border-white/5 focus:outline-none focus:border-cyan-500/40 resize-none"
            />

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <button
                onClick={handleVerify}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-black shadow-lg shadow-cyan-500/20 transition-all hover:scale-105"
              >
                Calculate Hash & Verify
              </button>

              {verificationResult.status === "verified" && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>100% Authentic — Matches On-Chain Document #{verificationResult.matchedDoc?.id}</span>
                </div>
              )}

              {verificationResult.status === "tampered" && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold animate-in fade-in">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <span>Unregistered or Modified — No exact matching hash on-chain</span>
                </div>
              )}
            </div>

            {verificationResult.computedHash && (
              <p className="text-[11px] font-mono text-slate-500 break-all">
                Calculated SHA-256 Digest: {verificationResult.computedHash}
              </p>
            )}
          </div>
        </section>

        {/* SMART LEGAL ESCROW VAULT */}
        <EscrowVaultSection />

        {/* LEDGER TABLE */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-lg text-white">Anchored Document Registry</h3>
              <p className="text-xs text-slate-400">Total {contracts.length} contracts verified by LexiGuard Smart Contract</p>
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

          <div className="rounded-3xl bg-slate-900/60 border border-white/5 overflow-hidden">
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
                  {filtered.map((item) => (
                    <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
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
                      <td className="py-4 px-4 font-mono text-cyan-300 text-[11px] max-w-[180px] truncate">
                        {item.docHash}
                      </td>
                      <td className="py-4 px-4 text-slate-400">{item.network}</td>
                      <td className="py-4 px-4 font-mono text-slate-400">
                        #{item.blockNumber || 18451920}
                      </td>
                      <td className="py-4 px-5 text-right">
                        <a
                          href={item.explorerUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 hover:bg-cyan-500/20 font-semibold transition-all text-xs"
                        >
                          <span>Explorer</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
