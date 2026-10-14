"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  HelpCircle,
  Search,
  ChevronDown,
  Sparkles,
  Scale,
  ShieldCheck,
  FileText,
  Lock,
  ArrowRight,
  Maximize2,
  X,
  Copy,
  Check,
  ExternalLink,
  BookOpen,
  CheckCircle2,
} from "lucide-react";
import {
  Section7Config,
  DEFAULT_SECTION7_CONFIG,
  Section7FaqItem,
} from "@/lib/firestoreService";
import CyberFaqBackgroundAnimation from "./CyberFaqBackgroundAnimation";

interface Props {
  config?: Section7Config;
}

type CategoryFilter = "all" | "bli" | "admissibility" | "contracts" | "escrow";

export default function LegalComplianceFaqSection({
  config = DEFAULT_SECTION7_CONFIG,
}: Props) {
  const currentConfig: Section7Config = {
    ...DEFAULT_SECTION7_CONFIG,
    ...(config || {}),
  };

  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({
    "faq-1": true, // First FAQ open by default
  });
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);

  const rawItems: Section7FaqItem[] =
    currentConfig.faqItems && currentConfig.faqItems.length > 0
      ? currentConfig.faqItems
      : DEFAULT_SECTION7_CONFIG.faqItems;

  // Filter items based on category and search query
  const filteredItems = useMemo(() => {
    return rawItems.filter((item) => {
      const matchesCategory =
        activeCategory === "all" || item.category === activeCategory;

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.question.toLowerCase().includes(q) ||
        item.answer.toLowerCase().includes(q) ||
        (item.citation && item.citation.toLowerCase().includes(q)) ||
        (item.badge && item.badge.toLowerCase().includes(q));

      return matchesCategory && matchesSearch;
    });
  }, [rawItems, activeCategory, searchQuery]);

  const toggleAccordion = (id: string) => {
    setExpandedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleCopyAnswer = (item: Section7FaqItem, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`Q: ${item.question}\n\nA: ${item.answer}`);
    setCopiedId(item.id);
    setTimeout(() => {
      setCopiedId((curr) => (curr === item.id ? null : curr));
    }, 2200);
  };

  return (
    <section className="relative w-full py-16 sm:py-24 px-3.5 sm:px-6 lg:px-8 border-t border-white/10 bg-[#02050f] overflow-x-hidden min-w-0">
      {/* Dynamic Background Image Overlay */}
      <div
        className="absolute inset-0 opacity-15 pointer-events-none bg-cover bg-center transition-all duration-700"
        style={{
          backgroundImage: `url('${currentConfig.bgImageUrl || "/images/hero_cyber_legal_bg.jpg"}')`,
        }}
      />

      {/* Cyber Canvas Background Animation */}
      {currentConfig.enableAnimatedBackground && (
        <CyberFaqBackgroundAnimation intensity={1} />
      )}

      {/* Ambient Gradient Glow Orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] sm:w-[700px] h-[300px] sm:h-[450px] bg-gradient-to-r from-purple-600/15 via-cyan-500/10 to-blue-600/15 rounded-full blur-[120px] sm:blur-[160px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto space-y-10 sm:space-y-14 w-full">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 px-1">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-[11px] sm:text-xs font-mono font-bold uppercase tracking-wider backdrop-blur-md shadow-lg shadow-purple-500/10 max-w-full">
            <Scale className="w-3.5 h-3.5 text-purple-400 shrink-0 animate-pulse" />
            <span className="truncate">{currentConfig.badgeText}</span>
          </div>

          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
            {currentConfig.titlePrefix}{" "}
            <span className="bg-gradient-to-r from-purple-400 via-cyan-300 to-teal-300 bg-clip-text text-transparent">
              {currentConfig.titleHighlight}
            </span>{" "}
            {currentConfig.titleSuffix}
          </h2>

          <p className="text-slate-300 text-xs sm:text-base leading-relaxed max-w-2xl mx-auto">
            {currentConfig.subheadline}
          </p>

          {/* Statutory Compliance Signals Banner */}
          <div className="pt-2 sm:pt-3 flex items-center justify-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-slate-900/90 border border-purple-500/30 backdrop-blur-xl shadow-xl text-xs text-slate-300 font-mono">
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
              <span className="text-white font-bold">Judicial Standards:</span>
              <span className="text-cyan-300">{currentConfig.complianceBadge}</span>
            </div>
          </div>
        </div>

        {/* Search & Category Filter Control Hub */}
        <div className="max-w-4xl mx-auto space-y-4 w-full">
          {/* Search Bar */}
          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search legal statutes, DGCL § 224, FRE Rule 902, zero-knowledge hashing, escrow..."
              className="w-full pl-11 pr-10 py-3 sm:py-3.5 rounded-2xl bg-slate-900/90 border border-white/10 hover:border-cyan-500/30 focus:border-cyan-500/60 focus:outline-none text-white text-xs sm:text-sm placeholder:text-slate-500 shadow-xl backdrop-blur-md transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-all"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar sm:flex-wrap sm:justify-center">
            {[
              { id: "all", label: "All Questions", count: rawItems.length },
              { id: "bli", label: "BLI Criteria", count: rawItems.filter((i) => i.category === "bli").length },
              { id: "admissibility", label: "Court Admissibility", count: rawItems.filter((i) => i.category === "admissibility").length },
              { id: "contracts", label: "Smart Contracts & Gas", count: rawItems.filter((i) => i.category === "contracts").length },
              { id: "escrow", label: "Escrow & Privacy", count: rawItems.filter((i) => i.category === "escrow").length },
            ].map((tab) => {
              const isActive = activeCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveCategory(tab.id as CategoryFilter)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-mono font-semibold transition-all shrink-0 min-h-[38px] flex items-center gap-1.5 ${
                    isActive
                      ? "bg-gradient-to-r from-cyan-500 to-purple-600 text-white shadow-lg shadow-purple-500/25 border border-cyan-400/40"
                      : "bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-white/5 hover:border-white/15"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      isActive ? "bg-white/20 text-white" : "bg-white/5 text-slate-400"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* FAQ Accordion List */}
        <div className="max-w-4xl mx-auto space-y-3.5 sm:space-y-4 w-full">
          {filteredItems.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-3xl bg-slate-900/50 border border-white/10 space-y-3">
              <BookOpen className="w-8 h-8 text-slate-500 mx-auto" />
              <p className="text-slate-300 font-bold text-sm">No matching legal questions found</p>
              <p className="text-xs text-slate-500">
                Try searching for keywords like &quot;DGCL&quot;, &quot;Delaware&quot;, &quot;FRE&quot;, &quot;Relayer&quot;, or &quot;Escrow&quot;.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setActiveCategory("all");
                }}
                className="mt-2 px-4 py-2 rounded-xl bg-slate-800 text-cyan-300 text-xs font-mono hover:bg-slate-700 transition-all"
              >
                Reset Search Filters
              </button>
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const isOpen = !!expandedIds[item.id];
              const isCopied = copiedId === item.id;

              return (
                <div
                  key={item.id || idx}
                  className={`rounded-2xl sm:rounded-3xl transition-all duration-300 overflow-hidden backdrop-blur-xl ${
                    isOpen
                      ? "bg-slate-900/95 border-2 border-purple-500/50 shadow-2xl shadow-purple-500/15"
                      : "bg-slate-900/60 border border-white/10 hover:border-cyan-500/30"
                  }`}
                >
                  {/* Accordion Header Trigger */}
                  <button
                    type="button"
                    onClick={() => toggleAccordion(item.id)}
                    className="w-full p-4 sm:p-5 text-left flex items-start sm:items-center justify-between gap-3 min-h-[56px] cursor-pointer group"
                  >
                    <div className="flex items-start sm:items-center gap-3 min-w-0">
                      {/* Question Index Marker */}
                      <span
                        className={`w-7 h-7 rounded-xl flex items-center justify-center font-mono font-bold text-xs shrink-0 transition-colors ${
                          isOpen
                            ? "bg-purple-500 text-white shadow-md shadow-purple-500/30"
                            : "bg-white/5 text-slate-400 group-hover:text-cyan-300 group-hover:bg-cyan-500/10"
                        }`}
                      >
                        {(idx + 1).toString().padStart(2, "0")}
                      </span>

                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3
                            className={`text-xs sm:text-sm md:text-base font-extrabold transition-colors leading-snug ${
                              isOpen ? "text-white" : "text-slate-200 group-hover:text-cyan-300"
                            }`}
                          >
                            {item.question}
                          </h3>
                        </div>

                        {/* Citation & Category Tag */}
                        <div className="flex flex-wrap items-center gap-2 pt-0.5">
                          {item.badge && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-white/5 border border-white/10 text-cyan-300">
                              {item.badge}
                            </span>
                          )}
                          {item.citation && (
                            <span className="text-[10px] font-mono text-purple-300/80 flex items-center gap-1">
                              <FileText className="w-2.5 h-2.5" />
                              <span>{item.citation}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expand/Collapse Chevron */}
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 ${
                        isOpen
                          ? "bg-purple-500/20 text-purple-300 rotate-180 border border-purple-500/40"
                          : "bg-white/5 text-slate-400 group-hover:text-white"
                      }`}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </button>

                  {/* Accordion Expandable Content Body */}
                  {isOpen && (
                    <div className="px-4 pb-4 sm:px-6 sm:pb-6 pt-1 space-y-4 border-t border-white/5">
                      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                        {item.answer}
                      </p>

                      {/* Bottom Quick-Action Bar */}
                      <div className="pt-3 border-t border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => handleCopyAnswer(item, e)}
                            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-mono text-[11px] font-medium border border-white/10 transition-all flex items-center gap-1.5 min-h-[36px]"
                          >
                            {isCopied ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-emerald-300">Copied to Clipboard</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 text-slate-400" />
                                <span>Copy Answer</span>
                              </>
                            )}
                          </button>
                        </div>

                        <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
                          <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                          <span>BLI Admissibility Standard Verified</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Master Showcase Artwork Card (8K Codex Vault Terminal) */}
        <div className="relative rounded-3xl overflow-hidden border border-white/15 bg-slate-900/90 shadow-2xl">
          <div
            className="relative h-64 sm:h-80 md:h-96 w-full overflow-hidden group cursor-pointer"
            onClick={() => setShowImageModal(true)}
          >
            <img
              src={currentConfig.showcaseImageUrl || DEFAULT_SECTION7_CONFIG.showcaseImageUrl}
              alt="Section 7 Legal Codex Vault Master Artwork"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

            <div className="absolute top-4 right-4 z-10">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowImageModal(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-950/80 hover:bg-slate-900 text-white text-xs font-mono font-semibold backdrop-blur-md border border-white/20 flex items-center gap-1.5 shadow-xl transition-all"
              >
                <Maximize2 className="w-3.5 h-3.5 text-purple-400" />
                <span>Full-Res Codex Terminal</span>
              </button>
            </div>

            <div className="absolute bottom-5 left-5 right-5 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="space-y-1.5 max-w-2xl">
                <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono text-[10px] font-bold border border-purple-500/30">
                  STATUTORY ELECTRONIC LEDGER ARCHITECTURE
                </span>
                <h3 className="text-base sm:text-2xl font-black text-white">
                  Codex Iustitiae: The Great Charter of Digital Law
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 line-clamp-2 sm:line-clamp-none">
                  Delaware DGCL Title 8 § 224 and Federal Rules of Evidence Rule 902 transform raw smart contracts into self-authenticating, immutable corporate and judicial records.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href="/auditor"
                  onClick={(e) => e.stopPropagation()}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white text-xs font-bold font-mono transition-all flex items-center gap-1.5 shadow-lg shadow-purple-500/30 min-h-[44px]"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Launch Interactive Auditor Sandbox</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Complex DAO / Corporate Advisory Banner Card */}
        <div className="p-5 sm:p-7 rounded-3xl bg-gradient-to-r from-purple-950/40 via-slate-900/90 to-cyan-950/40 border border-purple-500/30 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1 max-w-xl">
            <h4 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-purple-400" />
              <span>{currentConfig.supportNoticeTitle}</span>
            </h4>
            <p className="text-xs sm:text-sm text-slate-300">
              {currentConfig.supportNoticeDesc}
            </p>
          </div>

          <Link
            href={currentConfig.supportCtaLink || "/auditor"}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white text-xs font-extrabold transition-all shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2 shrink-0 min-h-[44px]"
          >
            <span>{currentConfig.supportCtaText}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* 4 Sovereign Statutory Guarantees Footer Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 pt-2">
          <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-900/60 border border-white/5 space-y-1">
            <span className="text-[10px] text-slate-400 font-mono block">Delaware DGCL § 224</span>
            <p className="text-xs sm:text-sm font-bold text-white">Statutory Ledger</p>
            <p className="text-[10px] text-slate-500">Corporate electronic records validity</p>
          </div>

          <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-900/60 border border-white/5 space-y-1">
            <span className="text-[10px] text-slate-400 font-mono block">FRE Rule 902(13)/(14)</span>
            <p className="text-xs sm:text-sm font-bold text-cyan-400">Self-Authenticating</p>
            <p className="text-[10px] text-slate-500">Certified digital evidence admissibility</p>
          </div>

          <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-900/60 border border-white/5 space-y-1">
            <span className="text-[10px] text-slate-400 font-mono block">Base Sepolia EVM</span>
            <p className="text-xs sm:text-sm font-bold text-purple-400">Calldata Notarization</p>
            <p className="text-[10px] text-slate-500">Immutable block height & timestamps</p>
          </div>

          <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-900/60 border border-white/5 space-y-1">
            <span className="text-[10px] text-slate-400 font-mono block">Zero-Knowledge</span>
            <p className="text-xs sm:text-sm font-bold text-emerald-400">Client Confidentiality</p>
            <p className="text-[10px] text-slate-500">100% private client-side digests</p>
          </div>
        </div>
      </div>

      {/* Full-Screen Master Codex Modal */}
      {showImageModal && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-3 sm:p-6"
          onClick={() => setShowImageModal(false)}
        >
          <div
            className="relative max-w-5xl w-full max-h-[90vh] bg-slate-950 rounded-3xl overflow-hidden border border-purple-500/40 shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3.5 sm:p-4 border-b border-white/10 flex items-center justify-between bg-slate-900/80">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span className="font-bold text-white text-xs sm:text-sm truncate">
                  Codex Iustitiae: The Great Charter of Digital Law — 8K System View
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowImageModal(false)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-all min-h-[36px] min-w-[36px] flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-3 sm:p-4 flex items-center justify-center bg-black">
              <img
                src={currentConfig.showcaseImageUrl || DEFAULT_SECTION7_CONFIG.showcaseImageUrl}
                alt="Section 7 Codex Vault Full View"
                className="max-h-[70vh] w-auto object-contain rounded-xl shadow-2xl"
              />
            </div>

            <div className="p-3 border-t border-white/10 bg-slate-900/80 text-center text-[11px] text-slate-400 font-mono">
              Delaware DGCL § 224 • Federal Rules of Evidence Rule 902 • Blockchain Legal Institute Standard
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
