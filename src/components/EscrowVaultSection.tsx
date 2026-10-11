import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Lock,
  Unlock,
  Coins,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  ArrowRight,
  AlertCircle,
  Copy,
  Check,
  Zap,
  Users,
} from "lucide-react";
import confetti from "canvas-confetti";
import { useWeb3, LEXIGUARD_CONTRACT_ADDRESS } from "@/context/Web3Context";
import {
  saveEscrowDeposit,
  getEscrowAgreements,
  getContractorProfiles,
  DEFAULT_CONTRACTORS,
  ContractorProfile,
} from "@/lib/firestoreService";

export default function EscrowVaultSection() {
  const { account, balance, connectionType, depositToEscrow, networkName } = useWeb3();

  const [escrows, setEscrows] = useState<any[]>([]);
  const [contractorsList, setContractorsList] = useState<ContractorProfile[]>(DEFAULT_CONTRACTORS);
  const [agreementId, setAgreementId] = useState("");
  const [contractorAddress, setContractorAddress] = useState(
    "0x7F2B89a468eB3f4D9165b4c10a12e87319E454E2"
  );
  const [isAddressLocked, setIsAddressLocked] = useState(true);
  const [depositAmount, setDepositAmount] = useState("0.005");
  const [milestoneDesc, setMilestoneDesc] = useState(
    "Milestone 1: Web3 Legal Architecture & AI Audit Completion"
  );
  const [isDepositing, setIsDepositing] = useState(false);
  const [txSuccess, setTxSuccess] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const records = await getEscrowAgreements();
      setEscrows(records);

      const list = await getContractorProfiles();
      setContractorsList(list);
    }
    load();
  }, []);

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setTxSuccess(null);

    if (!account) {
      setErrorMessage("Please connect your Web3 wallet (MetaMask or Gasless Relayer) above first.");
      return;
    }

    if (!contractorAddress || !depositAmount || !milestoneDesc) {
      setErrorMessage("Please fill all required escrow fields.");
      return;
    }

    setIsDepositing(true);
    try {
      const finalAgreementId =
        agreementId.trim() ||
        "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");

      const res = await depositToEscrow({
        agreementId: finalAgreementId,
        contractorAddress,
        amountEth: depositAmount,
        milestoneDesc,
      });

      if (res.success) {
        setTxSuccess(res.txHash);
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#06b6d4", "#3b82f6", "#a855f7"],
        });

        // Save to Firestore
        const newRecord = {
          agreementId: finalAgreementId,
          client: account,
          contractor: contractorAddress,
          amountEth: depositAmount,
          milestoneDesc,
          txHash: res.txHash,
          network: networkName,
          status: "LOCKED" as const,
        };
        await saveEscrowDeposit(newRecord);

        // Update list
        setEscrows((prev) => [newRecord, ...prev]);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to complete escrow deposit");
    } finally {
      setIsDepositing(false);
    }
  };

  const handleRelease = (id: string) => {
    setEscrows((prev) =>
      prev.map((esc) =>
        esc.agreementId === id || esc.id === id
          ? { ...esc, status: "RELEASED" }
          : esc
      )
    );
    confetti({
      particleCount: 50,
      spread: 60,
      colors: ["#10b981", "#06b6d4"],
    });
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <section className="space-y-8">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold mb-2">
            <Lock className="w-3.5 h-3.5 text-purple-400" />
            <span>Conditional Smart Contract Vault</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Smart Legal Escrow & Milestone Deposits
          </h2>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Lock client milestone payments in EVM escrow smart contracts. Funds remain safely escrowed on-chain until contractual obligations and AI compliance thresholds are met.
          </p>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-900/80 border border-white/10 text-xs text-slate-300">
          <span className="text-slate-500">Contract:</span>
          <span className="font-mono text-cyan-300">
            {LEXIGUARD_CONTRACT_ADDRESS.slice(0, 6)}...{LEXIGUARD_CONTRACT_ADDRESS.slice(-4)}
          </span>
        </div>
      </div>

      {/* Main Grid: Form + Live Escrows */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Create Escrow Deposit Form */}
        <div className="lg:col-span-5 rounded-3xl bg-slate-900/70 border border-white/10 p-6 sm:p-7 backdrop-blur-xl shadow-2xl space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Coins className="w-4 h-4 text-cyan-400" />
              Deposit Milestone Funds
            </h3>
            <span className="text-[11px] font-semibold text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-lg">
              {networkName}
            </span>
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <p>{errorMessage}</p>
            </div>
          )}

          {txSuccess && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs space-y-1.5">
              <div className="flex items-center gap-2 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Escrow Successfully Locked On-Chain!</span>
              </div>
              <p className="font-mono text-[11px] text-slate-300 break-all">
                TX: {txSuccess}
              </p>
            </div>
          )}

          <form onSubmit={handleDeposit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Agreement / Contract Hash (Optional or Auto-Generated)
              </label>
              <input
                type="text"
                value={agreementId}
                onChange={(e) => setAgreementId(e.target.value)}
                placeholder="0x... or leave empty to auto-assign"
                className="w-full rounded-xl bg-slate-950 px-3.5 py-2.5 text-xs font-mono text-slate-200 border border-white/10 focus:outline-none focus:border-cyan-500/50"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-400">
                  Contractor Wallet Address (Recipient)
                </label>
                <Link
                  href="/contractors"
                  className="text-cyan-400 hover:underline text-[11px] font-semibold"
                >
                  Browse Profiles →
                </Link>
              </div>

              {/* Quick Profile Selector Dropdown */}
              <div className="mb-2">
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      setContractorAddress(e.target.value);
                      setIsAddressLocked(true);
                    }
                  }}
                  className="w-full rounded-xl bg-slate-950 px-3 py-2 text-xs font-mono text-cyan-300 border border-white/10 focus:outline-none focus:border-cyan-500/50"
                >
                  <option value="">⚡ Select from Verified Contractors Directory...</option>
                  {contractorsList.map((c) => (
                    <option key={c.walletAddress} value={c.walletAddress}>
                      {c.fullName} ({c.companyName}) — {c.walletAddress.slice(0, 6)}...{c.walletAddress.slice(-4)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Lock Status Header */}
              <div className="flex items-center justify-between mb-1.5 px-1">
                {isAddressLocked ? (
                  <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>Verified Recipient Locked</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                    <span>Manual Address (Editable)</span>
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => setIsAddressLocked(!isAddressLocked)}
                  className="text-[10px] text-slate-400 hover:text-cyan-300 underline font-semibold transition-colors"
                >
                  {isAddressLocked ? "Change / Unlock" : "Lock Address"}
                </button>
              </div>

              <input
                type="text"
                value={contractorAddress}
                onChange={(e) => setContractorAddress(e.target.value)}
                readOnly={isAddressLocked}
                placeholder="0x..."
                required
                className={`w-full rounded-xl px-3.5 py-2.5 text-xs font-mono border transition-all ${
                  isAddressLocked
                    ? "bg-slate-900/90 text-cyan-300 border-emerald-500/30 cursor-not-allowed selection:bg-transparent"
                    : "bg-slate-950 text-slate-200 border-white/10 focus:outline-none focus:border-cyan-500/50"
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Milestone Deliverable Description
              </label>
              <textarea
                value={milestoneDesc}
                onChange={(e) => setMilestoneDesc(e.target.value)}
                rows={2}
                required
                className="w-full rounded-xl bg-slate-950 px-3.5 py-2.5 text-xs text-slate-200 border border-white/10 focus:outline-none focus:border-cyan-500/50 resize-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-400">
                  Escrow Deposit Amount (ETH)
                </label>
                {balance && (
                  <span className="text-[11px] text-slate-500 font-mono">
                    Balance: {balance}
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  type="number"
                  step="0.001"
                  min="0.0001"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  required
                  className="w-full rounded-xl bg-slate-950 pl-3.5 pr-14 py-2.5 text-sm font-mono text-cyan-300 font-bold border border-white/10 focus:outline-none focus:border-cyan-500/50"
                />
                <span className="absolute right-3.5 top-2.5 text-xs font-bold text-slate-400">
                  ETH
                </span>
              </div>

              {/* Protocol Fee Breakdown */}
              <div className="mt-2.5 p-3 rounded-xl bg-slate-950/80 border border-white/5 space-y-1.5 text-[11px] font-mono text-slate-400">
                <div className="flex justify-between">
                  <span>Contractor Net Payout (99.0%):</span>
                  <span className="text-emerald-400 font-semibold">
                    {(parseFloat(depositAmount || "0") * 0.99).toFixed(4)} ETH
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="flex items-center gap-1">
                    <span>InnoXpert Protocol Fee (1.0%):</span>
                  </span>
                  <span className="text-amber-400 font-semibold">
                    {(parseFloat(depositAmount || "0") * 0.01).toFixed(4)} ETH
                  </span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isDepositing}
              className="w-full mt-2 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-xs bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white shadow-[0_0_25px_-5px_rgba(168,85,247,0.4)] transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
            >
              <Lock className="w-4 h-4" />
              <span>
                {isDepositing
                  ? "Securing Funds On-Chain..."
                  : `Lock ${depositAmount} ETH in Smart Escrow`}
              </span>
            </button>
          </form>
        </div>

        {/* Active Escrow Ledger */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Active On-Chain Escrow Agreements ({escrows.length})
            </h3>
            <span className="text-xs text-slate-400">EVM Smart Escrow</span>
          </div>

          <div className="space-y-3.5">
            {escrows.map((esc, index) => {
              const isLocked = esc.status === "LOCKED";
              return (
                <div
                  key={esc.agreementId || index}
                  className="rounded-2xl bg-slate-900/60 border border-white/5 p-5 hover:border-cyan-500/30 transition-all space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isLocked
                              ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                              : "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                          }`}
                        >
                          {isLocked ? "🔒 Locked In Escrow" : "✓ Milestone Released"}
                        </span>
                        <span className="text-xs font-mono font-bold text-cyan-300">
                          {esc.amountEth} ETH
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold text-white mt-1.5">
                        {esc.milestoneDesc}
                      </h4>
                    </div>

                    {isLocked && (
                      <button
                        onClick={() => handleRelease(esc.agreementId || esc.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 transition-all shrink-0"
                      >
                        <Unlock className="w-3.5 h-3.5" />
                        <span>Release Funds</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono text-slate-400 pt-2 border-t border-white/5">
                    <div>
                      <span className="text-slate-500">Client: </span>
                      <span>
                        {esc.client ? `${esc.client.slice(0, 6)}...${esc.client.slice(-4)}` : "InnoXpert"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Contractor: </span>
                      <span>
                        {esc.contractor ? `${esc.contractor.slice(0, 6)}...${esc.contractor.slice(-4)}` : "Verified"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-1">
                    <span className="truncate max-w-[240px] sm:max-w-xs">
                      ID: {esc.agreementId || esc.id}
                    </span>
                    <button
                      onClick={() => copyToClipboard(esc.agreementId || esc.id, esc.agreementId || esc.id)}
                      className="hover:text-cyan-400 transition-colors"
                      title="Copy Agreement ID"
                    >
                      {copiedId === (esc.agreementId || esc.id) ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
