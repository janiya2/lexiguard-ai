"use client";

import React, { useState } from "react";
import {
  X,
  FileText,
  Download,
  Sparkles,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Search,
  Check,
  Copy,
  FolderOpen,
  Filter
} from "lucide-react";
import { TEN_TEST_LEGAL_CONTRACTS, SampleContractDoc } from "@/lib/sampleContractsLibrary";

interface SampleContractsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectContract: (contract: SampleContractDoc) => void;
}

export default function SampleContractsModal({
  isOpen,
  onClose,
  onSelectContract,
}: SampleContractsModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRiskFilter, setSelectedRiskFilter] = useState<string>("ALL");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredContracts = TEN_TEST_LEGAL_CONTRACTS.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.keyClausesTested.some((k) => k.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;
    if (selectedRiskFilter === "ALL") return true;
    if (selectedRiskFilter === "HIGH" && doc.riskProfile.includes("HIGH")) return true;
    if (selectedRiskFilter === "BALANCED" && doc.riskProfile.includes("BALANCED")) return true;
    if (selectedRiskFilter === "MODERATE" && doc.riskProfile.includes("MODERATE")) return true;
    return true;
  });

  const handleCopyText = (doc: SampleContractDoc) => {
    navigator.clipboard.writeText(doc.fullText);
    setCopiedId(doc.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadFile = (doc: SampleContractDoc, format: "txt" | "doc" = "txt") => {
    const filename = format === "doc" ? doc.fileName.replace(".txt", ".doc") : doc.fileName;
    const blob = new Blob([doc.fullText], { type: format === "doc" ? "application/msword" : "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-white/10 rounded-3xl flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-white/10 bg-slate-950/60 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white">
                  10 Production-Grade Legal Test Contracts
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  BLI Test Suite
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Pre-drafted real legal instruments to benchmark AI risk detection, redlining, and on-chain notarization.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="p-4 border-b border-white/5 bg-slate-950/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by contract name, clause, or keywords (e.g. NDA, Net 90, Token, SLA)..."
              className="w-full bg-slate-950/80 border border-white/10 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div className="flex items-center gap-1.5 shrink-0 bg-slate-950 p-1 rounded-xl border border-white/5 text-xs">
            <button
              onClick={() => setSelectedRiskFilter("ALL")}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                selectedRiskFilter === "ALL" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              All (10)
            </button>
            <button
              onClick={() => setSelectedRiskFilter("HIGH")}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                selectedRiskFilter === "HIGH"
                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                  : "text-slate-400 hover:text-rose-400"
              }`}
            >
              High Risk (4)
            </button>
            <button
              onClick={() => setSelectedRiskFilter("MODERATE")}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                selectedRiskFilter === "MODERATE"
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                  : "text-slate-400 hover:text-amber-400"
              }`}
            >
              Moderate (2)
            </button>
            <button
              onClick={() => setSelectedRiskFilter("BALANCED")}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                selectedRiskFilter === "BALANCED"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  : "text-slate-400 hover:text-emerald-400"
              }`}
            >
              Balanced (4)
            </button>
          </div>
        </div>

        {/* Contracts Grid */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredContracts.map((doc, idx) => (
              <div
                key={doc.id}
                className="p-4 rounded-2xl bg-slate-950/70 border border-white/5 hover:border-cyan-500/40 transition-all flex flex-col justify-between gap-4 group"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
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

                  <div>
                    <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                      {idx + 1}. {doc.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      {doc.summary}
                    </p>
                  </div>

                  {/* Tested clauses pills */}
                  <div className="space-y-1 pt-1 border-t border-white/5">
                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                      Tested Legal Clauses:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {doc.keyClausesTested.map((clause, cIdx) => (
                        <span
                          key={cIdx}
                          className="px-1.5 py-0.5 rounded bg-slate-900 border border-white/5 text-[10px] text-slate-300"
                        >
                          • {clause}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between gap-2 pt-3 border-t border-white/5">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleDownloadFile(doc, "txt")}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold transition-colors"
                      title="Download as .TXT file to test file uploader"
                    >
                      <Download className="w-3 h-3 text-cyan-400" />
                      <span>.TXT</span>
                    </button>
                    <button
                      onClick={() => handleDownloadFile(doc, "doc")}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold transition-colors"
                      title="Download as .DOC (Word) file to test file uploader"
                    >
                      <Download className="w-3 h-3 text-blue-400" />
                      <span>.DOC</span>
                    </button>
                    <button
                      onClick={() => handleCopyText(doc)}
                      className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                      title="Copy full contract text"
                    >
                      {copiedId === doc.id ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      onSelectContract(doc);
                      onClose();
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-black text-xs font-black uppercase tracking-wider shadow-sm transition-all hover:scale-105 active:scale-95"
                  >
                    <span>Load into Studio</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-white/10 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <span>💡 Tip: Click <strong>"Load into Studio"</strong> to immediately test or <strong>".TXT / .DOC"</strong> to test file uploading.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
