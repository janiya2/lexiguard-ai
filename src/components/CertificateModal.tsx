"use client";

import React, { useEffect } from "react";
import { ShieldCheck, CheckCircle2, ExternalLink, Copy, Check, Download, X, Zap } from "lucide-react";
import confetti from "canvas-confetti";
import { NotarizationResult } from "@/lib/web3Service";

interface CertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  score: number;
  notary: NotarizationResult | null;
}

export default function CertificateModal({
  isOpen,
  onClose,
  title,
  score,
  notary,
}: CertificateModalProps) {
  const [copied, setCopied] = React.useState(false);

  useEffect(() => {
    if (isOpen) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#06b6d4", "#8b5cf6", "#10b981", "#ffffff"],
        });
      } catch (e) {
        // Safe confetti fallback
      }
    }
  }, [isOpen]);

  if (!isOpen || !notary) return null;

  const copyProof = () => {
    navigator.clipboard.writeText(
      `LexiGuard On-Chain Proof\nDocument: ${title}\nHash: ${notary.docHash}\nTxHash: ${notary.txHash}\nNetwork: ${notary.network}\nBlock: ${notary.blockNumber}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadJSON = () => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(
        JSON.stringify(
          {
            certificate: "LexiGuard AI Blockchain Proof of Existence",
            documentTitle: title,
            legalHealthScore: score,
            sha256Hash: notary.docHash,
            evmTransactionHash: notary.txHash,
            blockNumber: notary.blockNumber,
            network: notary.network,
            notarizedBy: notary.notarizedBy,
            timestamp: notary.timestamp,
            explorerUrl: notary.explorerUrl,
          },
          null,
          2
        )
      );
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `LexiGuard_Certificate_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900 to-[#070b18] border border-cyan-500/30 p-6 sm:p-8 shadow-[0_0_50px_-10px_rgba(6,182,212,0.3)]">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Certificate Header */}
        <div className="text-center space-y-3 mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shadow-[0_0_25px_-5px_rgba(6,182,212,0.4)]">
            <ShieldCheck className="w-9 h-9" />
          </div>
          <div>
            <span className="px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> Immutable On-Chain Proof
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-white mt-2">
              Cryptographic Legal Certificate
            </h3>
            <p className="text-xs text-slate-400">
              Registered on the Blockchain by LexiGuard Notary Engine
            </p>
          </div>
        </div>

        {/* Details Card */}
        <div className="rounded-2xl bg-slate-950/60 border border-white/5 p-4 sm:p-5 space-y-3.5 text-xs">
          <div>
            <p className="text-slate-400 text-[11px] font-medium">Document Title</p>
            <p className="text-white font-semibold text-sm truncate">{title}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1 border-t border-white/5">
            <div>
              <p className="text-slate-400 text-[11px]">Legal Health Score</p>
              <p className="text-base font-extrabold text-cyan-400">{score} / 100</p>
            </div>
            <div>
              <p className="text-slate-400 text-[11px]">EVM Network</p>
              <p className="text-slate-200 font-semibold">{notary.network}</p>
            </div>
          </div>

          <div className="pt-1 border-t border-white/5">
            <p className="text-slate-400 text-[11px] mb-1">Document SHA-256 Hash</p>
            <p className="font-mono text-[11px] text-cyan-300 bg-cyan-950/40 p-2 rounded-lg border border-cyan-500/20 break-all select-all">
              {notary.docHash}
            </p>
          </div>

          <div className="pt-1 border-t border-white/5">
            <p className="text-slate-400 text-[11px] mb-1">Transaction Hash & Block</p>
            <div className="flex items-center justify-between gap-2 bg-slate-900/80 p-2 rounded-lg border border-white/5">
              <span className="font-mono text-[11px] text-slate-300 truncate">
                {notary.txHash}
              </span>
              <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300">
                Block #{notary.blockNumber}
              </span>
            </div>
          </div>

          {notary.notarizedBy.includes("Relayer") && (
            <div className="mt-3 p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[11px] flex items-start gap-2.5">
              <Zap className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white">Demo Sandbox Simulation Hash: </span>
                <span>
                  This cryptographic proof was minted in 1-Click Sandbox Mode for fast testing. To broadcast an immutable transaction live onto BaseScan, connect your MetaMask wallet on Base Sepolia.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
          <a
            href={notary.explorerUrl}
            target="_blank"
            rel="noreferrer"
            className="w-full sm:flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-black transition-all shadow-lg hover:shadow-cyan-500/25"
          >
            <span>View on Block Explorer</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            onClick={copyProof}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 transition-all"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Copied Proof" : "Copy Proof"}</span>
          </button>

          <button
            onClick={downloadJSON}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 transition-all"
            title="Download Certificate JSON"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </button>
        </div>
      </div>
    </div>
  );
}
