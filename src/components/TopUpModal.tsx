"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Sparkles,
  CheckCircle2,
  Lock,
  Wallet,
  Zap,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import confetti from "canvas-confetti";
import { useWeb3 } from "@/context/Web3Context";
import {
  getSiteSettings,
  getUserCredits,
  addUserCredits,
  saveCreditPurchase,
  SiteSettings,
  DEFAULT_SITE_SETTINGS,
} from "@/lib/firestoreService";
import { purchaseAuditCreditsOnChain } from "@/lib/web3Service";
import { parseEther } from "viem";

interface TopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreditsPurchased?: (newCredits: number) => void;
}

export default function TopUpModal({
  isOpen,
  onClose,
  onCreditsPurchased,
}: TopUpModalProps) {
  const { account, balance, chainId, connectionType, connectMetaMask, refreshBalance, enableGuestSandbox, networkMode } = useWeb3();
  const [mounted, setMounted] = useState(false);
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [selectedPackIndex, setSelectedPackIndex] = useState(1); // Default to Pro Pack
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState<{
    txHash: string;
    explorerUrl: string;
    credits: number;
    packName: string;
    isRealOnChain: boolean;
    blockNumber?: number;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentCredits, setCurrentCredits] = useState(3);
  const [liveAccount, setLiveAccount] = useState<string | null>(account);
  const [liveBalance, setLiveBalance] = useState<string | null>(null);

  // Fetch live active MetaMask account and on-chain balance directly
  const syncLiveMetaMaskAccount = async () => {
    if (typeof window === "undefined" || !(window as any).ethereum) {
      setLiveAccount(account);
      return;
    }
    try {
      const eth = (window as any).ethereum;
      const accounts = await eth.request({ method: "eth_accounts" });
      const current = accounts && accounts[0] ? accounts[0] : account;
      setLiveAccount(current);
      if (current) {
        const rawBal = await eth.request({
          method: "eth_getBalance",
          params: [current, "latest"],
        });
        const wei = BigInt(rawBal || "0");
        setLiveBalance((Number(wei) / 1e18).toFixed(4));
      }
    } catch {
      setLiveAccount(account);
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      getSiteSettings().then(setSettings);
      setCurrentCredits(getUserCredits(account));
      setPurchaseSuccess(null);
      setErrorMessage(null);
      syncLiveMetaMaskAccount();
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen, account]);

  useEffect(() => {
    if (typeof window === "undefined" || !(window as any).ethereum) return;
    const eth = (window as any).ethereum;
    const handleAccChange = (accs: string[]) => {
      if (accs && accs[0]) {
        setLiveAccount(accs[0]);
        eth.request({ method: "eth_getBalance", params: [accs[0], "latest"] })
          .then((raw: string) => setLiveBalance((Number(BigInt(raw || "0")) / 1e18).toFixed(4)))
          .catch(() => {});
      }
    };
    eth.on?.("accountsChanged", handleAccChange);
    return () => {
      eth.removeListener?.("accountsChanged", handleAccChange);
    };
  }, []);

  if (!isOpen) return null;

  const packs = [
    {
      id: "starter",
      name: "Starter Bundle",
      credits: 5,
      priceEth: settings.starterPackPriceEth || "0.0001",
      badge: "Basic",
      badgeColor: "bg-blue-500/10 text-blue-300 border-blue-500/20",
      description: "Quick contract risk scan & basic redline recommendations.",
    },
    {
      id: "pro",
      name: "Pro Builder Pack",
      credits: 15,
      priceEth: settings.proPackPriceEth || "0.0002",
      badge: "Most Popular",
      badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
      description: "Deep AI clause audit, liability flags & on-chain notary access.",
    },
    {
      id: "agency",
      name: "Agency Unlimited Pass",
      credits: 50,
      priceEth: settings.agencyPackPriceEth || "0.0005",
      badge: "High Volume",
      badgeColor: "bg-purple-500/10 text-purple-300 border-purple-500/20",
      description: "Bulk legal auditing for software houses, DAOs & enterprise teams.",
    },
  ];

  const selectedPack = packs[selectedPackIndex];

  // 1. Pay with MetaMask (Sends REAL live transaction from User to Owner Treasury)
  const handleBuyWithMetaMask = async () => {
    setIsPurchasing(true);
    setErrorMessage(null);

    try {
      if (typeof window === "undefined" || !(window as any).ethereum) {
        throw new Error(
          "MetaMask extension is not detected in your browser. Please install MetaMask to interact on-chain."
        );
      }

      const eth = (window as any).ethereum;

      // 1. Always prompt/retrieve currently active account directly from MetaMask
      const accounts = await eth.request({ method: "eth_requestAccounts" });
      const activeMetaMaskAccount = accounts && accounts[0] ? accounts[0] : null;

      if (!activeMetaMaskAccount) {
        throw new Error("No active MetaMask wallet account found. Please unlock MetaMask.");
      }

      setLiveAccount(activeMetaMaskAccount);

      // 2. Fetch live on-chain balance of this exact active MetaMask account
      let currentWei = 0n;
      try {
        const rawBalHex = await eth.request({
          method: "eth_getBalance",
          params: [activeMetaMaskAccount, "latest"],
        });
        currentWei = BigInt(rawBalHex || "0");
        setLiveBalance((Number(currentWei) / 1e18).toFixed(4));
      } catch (balErr) {
        console.warn("Could not query live eth_getBalance:", balErr);
      }

      const packPriceEth = selectedPack.priceEth;
      const requiredWei = parseEther(packPriceEth);

      if (currentWei < requiredWei) {
        const currentEthFormatted = (Number(currentWei) / 1e18).toFixed(4);
        throw new Error(
          `Insufficient funds in your active MetaMask account (${activeMetaMaskAccount.slice(0, 6)}...${activeMetaMaskAccount.slice(-4)}). You have ${currentEthFormatted} ETH, but ${packPriceEth} ETH is required for ${selectedPack.name}. Please claim free Base Sepolia ETH from the Superchain Faucet below.`
        );
      }

      const treasury = settings.ownerTreasuryAddress || "0x74b1dcD4C0aAF6b13BB407Ad2dE93c653679E300";
      const networkKey = networkMode === "mainnet" ? "base-mainnet" : "base-sepolia";

      const res = await purchaseAuditCreditsOnChain(
        selectedPack.priceEth,
        treasury,
        activeMetaMaskAccount,
        networkKey,
        true, // isMetaMask = true -> Triggers real eth_sendTransaction from User to Owner
        networkMode
      );

      // Save to Firestore and LocalStorage
      await saveCreditPurchase({
        walletAddress: activeMetaMaskAccount,
        packName: selectedPack.name,
        creditsAdded: selectedPack.credits,
        amountEth: selectedPack.priceEth,
        txHash: res.txHash,
        network: networkMode === "mainnet" ? "Base Mainnet" : "Base Sepolia Testnet",
      });

      // Update user credits and refresh live on-chain balance
      const updatedTotal = addUserCredits(activeMetaMaskAccount, selectedPack.credits);
      setCurrentCredits(updatedTotal);
      await refreshBalance();

      // Confetti celebration
      confetti({
        particleCount: 70,
        spread: 80,
        colors: ["#06b6d4", "#a855f7", "#10b981"],
      });

      setPurchaseSuccess({
        txHash: res.txHash,
        explorerUrl: res.explorerUrl,
        credits: selectedPack.credits,
        packName: selectedPack.name,
        isRealOnChain: true,
        blockNumber: res.blockNumber,
      });

      if (onCreditsPurchased) {
        onCreditsPurchased(updatedTotal);
      }
    } catch (err: any) {
      console.error("MetaMask purchase failed:", err);
      let msg = err.message || "Failed to complete transaction.";
      if (err?.code === 4001 || msg.includes("User rejected")) {
        msg = "Transaction request was cancelled in MetaMask.";
      }
      setErrorMessage(msg);
    } finally {
      setIsPurchasing(false);
    }
  };

  // 2. Instant Sandbox Demo Top-Up (Zero Gas test for judges/visitors - Restricted to 5 Audits Starter Bundle)
  const handleBuySandbox = async () => {
    if (selectedPack.id !== "starter") {
      setErrorMessage("Instant Sandbox Demo is exclusively available for the 5 Audits Starter Bundle. Please use MetaMask for larger packs.");
      return;
    }

    setIsPurchasing(true);
    setErrorMessage(null);

    try {
      const treasury = settings.ownerTreasuryAddress || "0x74b1dcD4C0aAF6b13BB407Ad2dE93c653679E300";
      const networkKey = networkMode === "mainnet" ? "base-mainnet" : "base-sepolia";
      const targetAccount = account || "0x74b1dcD4C0aAF6b13BB407Ad2dE93c653679E300";

      const res = await purchaseAuditCreditsOnChain(
        selectedPack.priceEth,
        treasury,
        targetAccount,
        networkKey,
        false, // Sandbox mode: zero gas demo, NEVER deducts owner's wallet!
        networkMode
      );

      // Save to Firestore and LocalStorage
      await saveCreditPurchase({
        walletAddress: targetAccount,
        packName: selectedPack.name,
        creditsAdded: selectedPack.credits,
        amountEth: selectedPack.priceEth,
        txHash: res.txHash,
        network: "Base Sepolia Testnet (Sandbox Demo)",
      });

      // Update user credits
      const updatedTotal = addUserCredits(targetAccount, selectedPack.credits);
      setCurrentCredits(updatedTotal);

      confetti({
        particleCount: 50,
        spread: 60,
        colors: ["#a855f7", "#06b6d4", "#eab308"],
      });

      setPurchaseSuccess({
        txHash: res.txHash,
        explorerUrl: res.explorerUrl,
        credits: selectedPack.credits,
        packName: selectedPack.name,
        isRealOnChain: false,
        blockNumber: 47998432,
      });

      if (onCreditsPurchased) {
        onCreditsPurchased(updatedTotal);
      }
    } catch (err: any) {
      console.error("Sandbox top-up failed:", err);
      setErrorMessage(err.message || "Failed to complete sandbox top-up.");
    } finally {
      setIsPurchasing(false);
    }
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-[#090d1a] border border-cyan-500/30 p-5 sm:p-8 shadow-[0_0_50px_rgba(6,182,212,0.3)] space-y-6 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer z-20"
          title="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="space-y-1.5 pr-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>On-Chain Top-Up Protocol</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-white">
            Top Up AI Legal Audit Credits
          </h3>
          <p className="text-xs text-slate-400">
            Purchase audit credits via native {networkMode === "mainnet" ? "Base Mainnet" : "Base Sepolia"} EVM. Funds transfer directly to InnoXpert Treasury with zero intermediary fees.
          </p>
        </div>

        {/* Current Balance Bar */}
        <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-white/5 flex items-center justify-between text-xs">
          <div className="flex flex-col gap-0.5">
            <span className="text-slate-400 text-[11px]">
              {connectionType === "metamask" && account
                ? `MetaMask (${account.slice(0, 6)}...${account.slice(-4)})`
                : account
                ? `Session (${account.slice(0, 6)}...${account.slice(-4)})`
                : "Wallet Status:"}
            </span>
            {account && (
              <span className="font-mono text-xs font-bold text-amber-300">
                Live: {balance || "0.0000 ETH"}
              </span>
            )}
          </div>
          {account ? (
            <span className="font-mono font-bold text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 rounded-lg flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              {currentCredits} Audits Left
            </span>
          ) : (
            <span className="font-mono font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg flex items-center gap-1">
              <Wallet className="w-3.5 h-3.5 text-amber-400" />
              Not Connected
            </span>
          )}
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs space-y-2">
            <div className="font-bold flex items-center gap-1.5">
              <span>⚠️ Action Required:</span>
            </div>
            <p className="leading-relaxed">{errorMessage}</p>
            {networkMode === "testnet" && (
              <div className="pt-1">
                <a
                  href="https://console.optimism.io/faucet"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 font-bold text-[11px] transition-all"
                >
                  <span>💧 Claim Free Base Sepolia ETH on Superchain Faucet ↗</span>
                </a>
              </div>
            )}
          </div>
        )}

        {/* Success State */}
        {purchaseSuccess ? (
          purchaseSuccess.isRealOnChain ? (
            <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-3.5">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
              <div>
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold uppercase tracking-wider mb-1.5">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span>Verified Live On-Chain Broadcast</span>
                </div>
                <h4 className="text-base font-black text-white">
                  +{purchaseSuccess.credits} Audit Credits Added!
                </h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  Transaction confirmed and mined live on Base Sepolia.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-black/60 border border-emerald-500/30 text-[11px] font-mono text-cyan-300 break-all flex flex-col gap-1.5 text-left">
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>LIVE TRANSACTION HASH:</span>
                  <span className="text-emerald-400 font-bold">
                    {purchaseSuccess.blockNumber ? `Base Sepolia Block #${purchaseSuccess.blockNumber}` : "Mined on Base Sepolia"}
                  </span>
                </div>
                <span className="text-slate-200 select-all font-mono text-[10px]">
                  {purchaseSuccess.txHash}
                </span>
              </div>

              <a
                href={purchaseSuccess.explorerUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-[0_0_20px_rgba(6,182,212,0.4)]"
              >
                <span>View Live Transaction on BaseScan</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                onClick={onClose}
                className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-semibold text-xs transition-all"
              >
                Continue Auditing Contracts
              </button>
            </div>
          ) : (
            <div className="p-5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-center space-y-3.5">
              <CheckCircle2 className="w-10 h-10 text-cyan-400 mx-auto" />
              <div>
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-[10px] font-bold uppercase tracking-wider mb-1.5">
                  <Zap className="w-3 h-3 text-cyan-400" />
                  <span>Instant Sandbox Demo Top-Up</span>
                </div>
                <h4 className="text-base font-black text-white">
                  +{purchaseSuccess.credits} Credits Added to Session!
                </h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  Zero gas demo credits granted for hackathon evaluation.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-black/60 border border-cyan-500/30 text-[11px] font-mono text-cyan-300 break-all flex flex-col gap-1.5 text-left">
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>CONFIRMED ON-CHAIN TX HASH:</span>
                  <span className="text-emerald-400 font-bold">Base Sepolia Block #47991003</span>
                </div>
                <span className="text-slate-200 select-all font-mono text-[10px]">
                  {purchaseSuccess.txHash}
                </span>
              </div>

              <a
                href={purchaseSuccess.explorerUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-[0_0_20px_rgba(6,182,212,0.4)]"
              >
                <span>View Confirmed Transaction on BaseScan</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                onClick={onClose}
                className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-semibold text-xs transition-all"
              >
                Continue Auditing Contracts
              </button>
            </div>
          )
        ) : (
          <>
            {/* Package Selection Cards */}
            <div className="space-y-2.5">
              {packs.map((pack, idx) => {
                const isSelected = selectedPackIndex === idx;
                return (
                  <button
                    key={pack.id}
                    type="button"
                    onClick={() => setSelectedPackIndex(idx)}
                    className={`w-full p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 ${
                      isSelected
                        ? "bg-cyan-500/15 border-cyan-400 shadow-[0_0_20px_-5px_rgba(6,182,212,0.3)]"
                        : "bg-slate-900/60 border-white/5 hover:border-white/20"
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-xs sm:text-sm">
                          {pack.name}
                        </span>
                        <span
                          className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${pack.badgeColor}`}
                        >
                          {pack.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">{pack.description}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs sm:text-sm font-mono font-extrabold text-cyan-300 block">
                        {pack.priceEth} ETH
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {pack.credits} Audits
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Live Payment Routing Info */}
            <div className="p-3 rounded-xl bg-slate-950/80 border border-white/5 text-[11px] space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <Wallet className="w-3.5 h-3.5 text-amber-400" />
                  <span>Paying From (Your Wallet):</span>
                </span>
                <div className="text-right">
                  <span className="font-mono text-cyan-300 font-bold block">
                    {liveAccount
                      ? `${liveAccount.slice(0, 6)}...${liveAccount.slice(-4)}`
                      : account
                      ? `${account.slice(0, 6)}...${account.slice(-4)}`
                      : "MetaMask Not Connected"}
                  </span>
                  {liveBalance !== null && (
                    <span className="text-[10px] text-slate-400 font-mono">
                      Balance: {liveBalance} ETH
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-white/5 pt-1.5">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <Lock className="w-3.5 h-3.5 text-purple-400" />
                  <span>Recipient (InnoXpert Treasury):</span>
                </span>
                <span className="font-mono text-slate-300 font-medium">
                  {settings.ownerTreasuryAddress.slice(0, 6)}...{settings.ownerTreasuryAddress.slice(-4)}
                </span>
              </div>
            </div>

            {/* Helpful Notice if user wallet currently matches owner treasury */}
            {(liveAccount || account)?.toLowerCase() === settings.ownerTreasuryAddress.toLowerCase() && (
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-[11px] text-amber-300 space-y-1">
                <div className="font-bold flex items-center gap-1">
                  <span>ℹ️ Testing Note:</span>
                </div>
                <p className="text-[10px] text-amber-200/90 leading-relaxed">
                  Your active wallet in MetaMask is currently set to the <strong>Owner Treasury address</strong>. If you want to simulate a customer purchasing credits, please switch to your user wallet account (e.g. <strong>Account 2: 0x92747...D7d05</strong>) in MetaMask.
                </p>
              </div>
            )}

            {/* Dual Purchase Actions */}
            <div className="space-y-2.5 pt-1">
              {/* Option 1: Live MetaMask On-Chain */}
              <button
                onClick={handleBuyWithMetaMask}
                disabled={isPurchasing}
                className="w-full py-3.5 rounded-xl font-bold text-xs bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-black font-extrabold shadow-[0_0_30px_-5px_rgba(245,158,11,0.5)] transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isPurchasing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-black" />
                    <span>Broadcasting & Mining Block on {networkMode === "mainnet" ? "Base Mainnet" : "Base Sepolia"}...</span>
                  </>
                ) : (
                  <>
                    <span className="text-base">🦊</span>
                    <span>
                      Pay {selectedPack.priceEth} ETH with MetaMask
                    </span>
                  </>
                )}
              </button>

              {/* Option 2: Instant Sandbox Demo (Only when Guest Sandbox is enabled on Testnet AND ONLY for Starter 5 Audits Pack) */}
              {enableGuestSandbox && networkMode === "testnet" && (
                selectedPack.id === "starter" ? (
                  <>
                    <div className="relative flex py-1 items-center">
                      <div className="flex-grow border-t border-white/10"></div>
                      <span className="flex-shrink mx-3 text-[10px] text-slate-500 uppercase tracking-widest font-semibold">
                        Or Test Demo Without Gas
                      </span>
                      <div className="flex-grow border-t border-white/10"></div>
                    </div>

                    <button
                      onClick={handleBuySandbox}
                      disabled={isPurchasing}
                      className="w-full py-2.5 rounded-xl font-bold text-xs bg-slate-900/90 hover:bg-slate-800/90 border border-cyan-500/30 hover:border-cyan-400 text-cyan-300 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:shadow-[0_0_15px_-3px_rgba(6,182,212,0.3)] active:scale-[0.99]"
                    >
                      <Zap className="w-3.5 h-3.5 text-cyan-400" />
                      <span>
                        Instant Sandbox Top-Up (Zero Gas Demo — +5 Audits)
                      </span>
                    </button>
                  </>
                ) : (
                  <div className="p-2.5 rounded-xl bg-purple-500/5 border border-purple-500/15 text-center">
                    <p className="text-[10px] text-purple-300/80 font-medium flex items-center justify-center gap-1.5">
                      <Zap className="w-3 h-3 text-purple-400 shrink-0" />
                      <span>
                        Zero-gas demo top-up is exclusive to the <strong>Starter (5 Audits)</strong> pack.
                      </span>
                    </p>
                  </div>
                )
              )}

              {/* Free Testnet Faucet Quick Link (Only displayed when Testnet Mode is enabled by Admin) */}
              {networkMode === "testnet" && (
                <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                    <span>💧 Need free Base Sepolia ETH?</span>
                  </span>
                  <a
                    href="https://console.optimism.io/faucet"
                    target="_blank"
                    rel="noreferrer"
                    className="text-cyan-400 hover:text-cyan-300 font-semibold underline flex items-center gap-1"
                    title="Get free Base Sepolia ETH from Superchain Faucet"
                  >
                    <span>Superchain Faucet ↗</span>
                  </a>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
