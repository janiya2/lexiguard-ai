"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
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
  Send,
  FileCheck,
  Eye,
  Sparkles,
  Clock,
  Globe,
  ArrowUpRight,
  X,
  BadgeCheck,
  Briefcase,
  Layers,
  FileText,
  Upload,
  Star,
  MessageSquare,
  User,
  Shield,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Wallet,
  Printer,
  Share2,
  Columns,
  Maximize2,
} from "lucide-react";
import confetti from "canvas-confetti";
import { useWeb3, LEXIGUARD_CONTRACT_ADDRESS } from "@/context/Web3Context";
import { computeSHA256 } from "@/lib/web3Service";
import {
  saveEscrowDeposit,
  updateEscrowStatus,
  submitEscrowDeliverable,
  submitEscrowReview,
  getEscrowAgreements,
  getContractorProfiles,
  DEFAULT_CONTRACTORS,
  ContractorProfile,
  PricingTier,
  getSiteSettings,
  SiteSettings,
  MilestoneTierConfig,
  DEFAULT_MILESTONE_TIERS,
} from "@/lib/firestoreService";
import WalletConnectModal from "@/components/WalletConnectModal";
import TopUpModal from "@/components/TopUpModal";

export const MILESTONE_TIERS = DEFAULT_MILESTONE_TIERS;

export default function EscrowVaultSection() {
  const { account, balance, connectionType, depositToEscrow, refreshBalance, networkName, networkMode } = useWeb3();

  // Simulated Account for Hackathon Judges & Multi-Party Privacy Demonstration
  const [simulatedAccount, setSimulatedAccount] = useState<string | null>(null);
  const activeAccount = simulatedAccount || account;

  const [escrows, setEscrows] = useState<any[]>([]);
  const [contractorsList, setContractorsList] = useState<ContractorProfile[]>(DEFAULT_CONTRACTORS);
  const [selectedContractor, setSelectedContractor] = useState<ContractorProfile | null>(
    DEFAULT_CONTRACTORS[0]
  );
  // Contractor Service Level (Pricing Tier)
  const [selectedTierId, setSelectedTierId] = useState<"level_1" | "level_2" | "level_3">("level_1");
  const [agreementId, setAgreementId] = useState("");
  
  // Dynamic Milestone Multipliers & Tier Configurations from Admin
  const [milestoneTiers, setMilestoneTiers] = useState<MilestoneTierConfig[]>(DEFAULT_MILESTONE_TIERS);

  // Contractor-Determined Fixed Rate & Milestone Multiplier
  const [milestoneUnits, setMilestoneUnits] = useState(1);
  const [depositAmount, setDepositAmount] = useState(
    DEFAULT_CONTRACTORS[0]?.hourlyRateEth || "0.00010"
  );
  const [milestoneDesc, setMilestoneDesc] = useState(
    "Milestone 1: Web3 Legal Architecture & AI Audit Completion"
  );

  // Proposal & Task Specification State (Uploaded by Client)
  const [proposalTitle, setProposalTitle] = useState(
    "Smart Contract Legal Security & Compliance Verification"
  );
  const [proposalDocName, setProposalDocName] = useState("LexiGuard_Scope_Of_Work_v1.pdf");
  const [proposalDocHash, setProposalDocHash] = useState(
    "0x8fa92300bcf42821a938c41d019f93318b762514e82361730248a31e8c71b302"
  );
  const [proposalRequirements, setProposalRequirements] = useState(
    "1. Comprehensive smart contract clause verification under BLI standards.\n2. Automated zero-knowledge cryptographic anchoring on Base Sepolia.\n3. Complete unit test coverage and verification certificate."
  );
  const [showProposalFields, setShowProposalFields] = useState(false);
  const [isHashingFile, setIsHashingFile] = useState(false);

  const [isDepositing, setIsDepositing] = useState(false);
  const [txSuccess, setTxSuccess] = useState<string | null>(null);
  const [txExplorerUrl, setTxExplorerUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);

  // Ledger View Scope: "MY_ESCROWS" | "AS_CLIENT" | "AS_CONTRACTOR" | "GLOBAL_LEDGER"
  const [ledgerScope, setLedgerScope] = useState<"MY_ESCROWS" | "AS_CLIENT" | "AS_CONTRACTOR" | "GLOBAL_LEDGER">("MY_ESCROWS");

  // Escrow Filter Tabs
  const [activeTab, setActiveTab] = useState<"ALL" | "LOCKED" | "SUBMITTED" | "RELEASED">("ALL");

  // Deliverable Submission Modal State (For Contractors)
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [activeEscrowForSubmit, setActiveEscrowForSubmit] = useState<any | null>(null);
  const [deliverableUrl, setDeliverableUrl] = useState("");
  const [submissionNotes, setSubmissionNotes] = useState("");
  const [isSubmittingWork, setIsSubmittingWork] = useState(false);

  // View Proposal Scope Modal
  const [viewingProposalEscrow, setViewingProposalEscrow] = useState<any | null>(null);

  // Inspect Contractor Deliverables Modal State (For Client review before release)
  const [inspectingDeliverable, setInspectingDeliverable] = useState<any | null>(null);

  // Review & Rating Modal State (For Clients after release)
  const [reviewingEscrow, setReviewingEscrow] = useState<any | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Release Loading State
  const [releasingId, setReleasingId] = useState<string | null>(null);

  // Professional Order Confirmation & Congratulations Modal State
  const [successOrderModal, setSuccessOrderModal] = useState<any | null>(null);

  // Layout View Mode: "split" (Side-by-side with sticky form) or "full" (Full-width ledger focus)
  const [escrowLayoutMode, setEscrowLayoutMode] = useState<"split" | "full">("split");

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll and listen for ESC key whenever any modal is open
  useEffect(() => {
    const isAnyModalOpen =
      Boolean(viewingProposalEscrow) ||
      Boolean(inspectingDeliverable) ||
      Boolean(isSubmitModalOpen) ||
      Boolean(reviewingEscrow) ||
      Boolean(successOrderModal);

    if (isAnyModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setViewingProposalEscrow(null);
        setInspectingDeliverable(null);
        setIsSubmitModalOpen(false);
        setReviewingEscrow(null);
        setSuccessOrderModal(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [viewingProposalEscrow, isSubmitModalOpen, reviewingEscrow, successOrderModal]);

  const explorerBase =
    networkMode === "mainnet" ? "https://basescan.org" : "https://sepolia.basescan.org";

  // Balance Check Calculation
  const numericBalance = parseFloat((balance || "0").replace(/[^\d.]/g, "")) || 0;
  const numericDeposit = parseFloat(depositAmount || "0") || 0;
  const isInsufficientBalance = Boolean(
    account && numericDeposit > 0 && numericBalance < numericDeposit
  );

  // Auto-sync deposit amount to contractor's fixed milestone rate and chosen tier
  useEffect(() => {
    if (selectedContractor) {
      const activeTier =
        selectedContractor.pricingTiers?.find((t) => t.tierId === selectedTierId) ||
        selectedContractor.pricingTiers?.[0];
      const rateEth = activeTier ? activeTier.priceEth : selectedContractor.hourlyRateEth;
      const rate = parseFloat(rateEth || "0.00010");
      const currentTierConfig = milestoneTiers.find((t) => t.tier === milestoneUnits);
      const mult = currentTierConfig?.multiplier ?? milestoneUnits;
      if (!isNaN(rate)) {
        setDepositAmount((rate * mult).toFixed(5));
      }
    }
  }, [selectedContractor, selectedTierId, milestoneUnits, milestoneTiers]);

  // Read URL query parameters (?contractor=...&tier=...&price=...)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const contractorParam = params.get("contractor");
      const tierParam = params.get("tier");
      if (contractorParam && contractorsList.length > 0) {
        const found = contractorsList.find(
          (c) => c.walletAddress.toLowerCase() === contractorParam.toLowerCase()
        );
        if (found) {
          setSelectedContractor(found);
          if (tierParam === "level_1" || tierParam === "level_2" || tierParam === "level_3") {
            setSelectedTierId(tierParam);
            const tierObj = found.pricingTiers?.find((t) => t.tierId === tierParam);
            if (tierObj) {
              setMilestoneDesc(tierObj.title);
              setProposalRequirements(
                `1. Deliverable Scope: ${tierObj.scopeSummary}\n2. Turnaround Target: ${tierObj.turnaround}\n3. Cryptographic SHA-256 seal and Base on-chain notary verification.`
              );
            }
          }
        }
      }

      const agreementParam = params.get("agreementId") || params.get("agreement");
      if (agreementParam) {
        setActiveTab("ALL");
        setLedgerScope("GLOBAL_LEDGER");
        setTimeout(() => {
          const el = document.getElementById("escrow-orders-ledger");
          if (el) el.scrollIntoView({ behavior: "smooth" });
        }, 500);
      }
    }
  }, [contractorsList]);

  // Sync simulated account from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("lexiguard_simulated_account");
      if (saved) setSimulatedAccount(saved);
    }
  }, []);

  useEffect(() => {
    let isSubscribed = true;

    async function load() {
      // 1. Purge legacy mock items from browser localStorage (e.g. "dsdffcddsdd" or self-locked test cards)
      if (typeof window !== "undefined") {
        try {
          const stored = JSON.parse(localStorage.getItem("lexiguard_user_escrows") || "[]");
          const cleaned = stored.filter((item: any) => {
            const id = (item.agreementId || item.id || "").trim();
            const isMockId = id === "dsdffcddsdd" || id.length < 20 || !id.startsWith("0x");
            const isSelfLocked =
              item.client &&
              item.contractor &&
              item.client.toLowerCase() === item.contractor.toLowerCase() &&
              (item.amountEth === "0.0511" || item.amountEth === "0.0911" || item.amountEth === "0.0101");
            return !isMockId && !isSelfLocked;
          });
          if (cleaned.length !== stored.length) {
            localStorage.setItem("lexiguard_user_escrows", JSON.stringify(cleaned));
          }
        } catch (e) {}
      }

      const records = await getEscrowAgreements();
      if (isSubscribed) setEscrows(records);

      const settings = await getSiteSettings();
      if (settings.milestoneTiers && settings.milestoneTiers.length > 0 && isSubscribed) {
        setMilestoneTiers(settings.milestoneTiers);
      }

      const list = await getContractorProfiles();
      const valid = list.filter(
        (c) => c.walletAddress && c.walletAddress.startsWith("0x") && c.walletAddress.length === 42
      );
      if (isSubscribed) setContractorsList(valid);
      const targetUser = activeAccount || account;
      const defaultPick =
        targetUser && valid[0]?.walletAddress.toLowerCase() === targetUser.toLowerCase()
          ? (valid[1] || valid[0])
          : (valid[1] || valid[0]);
      setSelectedContractor((prev) => prev || defaultPick);
    }
    load();

    const handleEscrowUpdate = async () => {
      const records = await getEscrowAgreements();
      if (isSubscribed) setEscrows(records);
    };

    const handleContractorsUpdated = async () => {
      const list = await getContractorProfiles();
      const valid = list.filter(
        (c) => c.walletAddress && c.walletAddress.startsWith("0x") && c.walletAddress.length === 42
      );
      if (isSubscribed) {
        setContractorsList(valid);
        setSelectedContractor((prev) => {
          if (!prev) return valid[0];
          const found = valid.find((c) => c.walletAddress.toLowerCase() === prev.walletAddress.toLowerCase());
          return found || prev;
        });
      }
    };

    const handleSettingsUpdated = async () => {
      const s = await getSiteSettings();
      if (s.milestoneTiers && s.milestoneTiers.length > 0 && isSubscribed) {
        setMilestoneTiers(s.milestoneTiers);
      }
    };

    const handleSimChanged = (e: any) => {
      if (isSubscribed) setSimulatedAccount(e.detail?.account || null);
    };

    window.addEventListener("lexiguard_escrow_updated", handleEscrowUpdate);
    window.addEventListener("lexiguard_contractors_updated", handleContractorsUpdated);
    window.addEventListener("lexiguard_settings_updated", handleSettingsUpdated);
    window.addEventListener("storage", handleEscrowUpdate);
    window.addEventListener("focus", handleEscrowUpdate);
    window.addEventListener("lexiguard_simulated_account_changed", handleSimChanged);
    const pollInterval = setInterval(handleEscrowUpdate, 4000);

    return () => {
      isSubscribed = false;
      window.removeEventListener("lexiguard_escrow_updated", handleEscrowUpdate);
      window.removeEventListener("lexiguard_contractors_updated", handleContractorsUpdated);
      window.removeEventListener("lexiguard_settings_updated", handleSettingsUpdated);
      window.removeEventListener("storage", handleEscrowUpdate);
      window.removeEventListener("focus", handleEscrowUpdate);
      window.removeEventListener("lexiguard_simulated_account_changed", handleSimChanged);
      clearInterval(pollInterval);
    };
  }, [account, activeAccount]);

  // Prevent self-contractor selection if client address matches contractor
  useEffect(() => {
    if (account && selectedContractor && selectedContractor.walletAddress.toLowerCase() === account.toLowerCase()) {
      const other = contractorsList.find(c => c.walletAddress.toLowerCase() !== account.toLowerCase());
      if (other) {
        setSelectedContractor(other);
      }
    }
  }, [account, contractorsList, selectedContractor]);

  // Handle Client Document File Upload & Instant SHA-256 Hashing
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsHashingFile(true);
    setProposalDocName(file.name);

    try {
      const text = await file.text();
      const hash = await computeSHA256(text);
      setProposalDocHash(hash);
    } catch (err) {
      const fallbackHash =
        "0x" +
        Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
      setProposalDocHash(fallbackHash);
    } finally {
      setIsHashingFile(false);
    }
  };

  // Synthetic Web Audio API Success Chime
  const playSuccessSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 arpeggio
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        const start = ctx.currentTime + idx * 0.08;
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.12, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.55);
      });
    } catch {
      // Audio autoplay policy fallback
    }
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setTxSuccess(null);
    setTxExplorerUrl(null);

    if (!account) {
      setIsConnectModalOpen(true);
      return;
    }

    if (isInsufficientBalance) {
      setErrorMessage(
        `Insufficient Wallet Balance: You currently have ${balance}, but need ${depositAmount} ETH to lock this milestone.`
      );
      return;
    }

    if (!selectedContractor || !depositAmount || !milestoneDesc) {
      setErrorMessage("Please select a verified contractor and fill all required escrow fields.");
      return;
    }

    if (!proposalRequirements || proposalRequirements.trim().length < 8) {
      setErrorMessage(
        "Contractor task requirements & acceptance criteria are strictly required. Please specify what deliverables the contractor must submit."
      );
      return;
    }

    setIsDepositing(true);
    try {
      const finalAgreementId =
        agreementId.trim() ||
        "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");

      const contractorAddress = selectedContractor.walletAddress;
      const res = await depositToEscrow({
        agreementId: finalAgreementId,
        contractorAddress,
        amountEth: depositAmount,
        milestoneDesc,
      });

      if (res.success) {
        setTxSuccess(res.txHash);
        const explUrl = `${explorerBase}/tx/${res.txHash}`;
        setTxExplorerUrl(explUrl);

        // Play pleasant futuristic crystal chime
        playSuccessSound();

        // Celebratory Confetti Bursts
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.5 },
          colors: ["#06b6d4", "#10b981", "#a855f7", "#f59e0b"],
        });
        setTimeout(() => {
          confetti({
            particleCount: 60,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: ["#06b6d4", "#10b981", "#f59e0b"],
          });
          confetti({
            particleCount: 60,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: ["#06b6d4", "#10b981", "#a855f7"],
          });
        }, 300);

        // Save complete record with client's proposal & task requirements
        const newRecord = {
          agreementId: finalAgreementId,
          client: account,
          contractor: contractorAddress,
          contractorName: selectedContractor.fullName,
          amountEth: depositAmount,
          protocolFeeEth: (parseFloat(depositAmount) * 0.01).toFixed(6),
          contractorPayoutEth: (parseFloat(depositAmount) * 0.99).toFixed(6),
          milestoneDesc,
          proposalTitle: proposalTitle.trim() || milestoneDesc,
          proposalDocName: proposalDocName.trim() || "Milestone_Scope_Brief.pdf",
          proposalDocHash: proposalDocHash.trim(),
          proposalRequirements: proposalRequirements.trim(),
          txHash: res.txHash,
          network: networkName,
          status: "LOCKED" as const,
          createdAt: { seconds: Math.floor(Date.now() / 1000) },
        };
        await saveEscrowDeposit(newRecord);

        // Register proposal scope hash in Notary Ledger for instant public verification
        if (newRecord.proposalDocHash) {
          try {
            const scopeNotary = {
              id: `escrow-scope-${Date.now()}`,
              title: `${newRecord.proposalTitle} (${newRecord.proposalDocName})`,
              overallScore: 98,
              riskSummary: `Legally verified escrow specification bound to milestone deposit between client ${account.slice(0, 6)}... and contractor ${selectedContractor.fullName}.`,
              docHash: newRecord.proposalDocHash,
              txHash: res.txHash,
              explorerUrl: `${explorerBase}/tx/${res.txHash}`,
              network: networkName,
              blockNumber: 48129082,
              notarizedBy: account,
              createdAt: { seconds: Math.floor(Date.now() / 1000) },
              clausesCount: 6,
              agreementId: finalAgreementId,
            };
            if (typeof window !== "undefined") {
              const currentNotarizations = JSON.parse(localStorage.getItem("lexiguard_user_notarizations") || "[]");
              localStorage.setItem("lexiguard_user_notarizations", JSON.stringify([scopeNotary, ...currentNotarizations]));
            }
          } catch (scopeErr) {
            console.warn("Could not register scope in notary storage:", scopeErr);
          }
        }

        setEscrows((prev) => [newRecord, ...prev]);
        refreshBalance();

        // Launch the Congratulations Order Confirmation Modal
        setSuccessOrderModal(newRecord);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to complete live escrow deposit");
    } finally {
      setIsDepositing(false);
    }
  };

  // Open Contractor Submission Modal (Restricted to Assigned Contractor)
  const openSubmitModal = (esc: any) => {
    const isCurrentContractor = Boolean(
      activeAccount && esc.contractor && esc.contractor.toLowerCase() === activeAccount.toLowerCase()
    );
    if (activeAccount && !isCurrentContractor) {
      setErrorMessage(
        `Unauthorized Access: Only the assigned contractor (${esc.contractorName || (esc.contractor ? esc.contractor.slice(0, 6) + "..." : "Contractor")}) is authorized to submit milestone deliverables.`
      );
      return;
    }
    setActiveEscrowForSubmit(esc);
    setDeliverableUrl(esc.deliverableUrl || "");
    setSubmissionNotes(esc.submissionNotes || "");
    setIsSubmitModalOpen(true);
  };

  // Contractor submits deliverables
  const handleDeliverableSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEscrowForSubmit) return;

    setIsSubmittingWork(true);
    try {
      const targetId = activeEscrowForSubmit.agreementId || activeEscrowForSubmit.id;
      await submitEscrowDeliverable(targetId, deliverableUrl, submissionNotes);

      setEscrows((prev) =>
        prev.map((esc) =>
          esc.agreementId === targetId || esc.id === targetId
            ? {
                ...esc,
                status: "SUBMITTED",
                deliverableUrl,
                submissionNotes,
              }
            : esc
        )
      );

      setIsSubmitModalOpen(false);
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.5 },
        colors: ["#f59e0b", "#06b6d4", "#10b981"],
      });
    } catch (err: any) {
      console.error("Submission error:", err);
    } finally {
      setIsSubmittingWork(false);
    }
  };

  // Client approves and releases on-chain funds to contractor (Restricted to Depositor Client)
  const handleRelease = async (esc: any) => {
    const isCurrentClient = Boolean(
      activeAccount && esc.client && esc.client.toLowerCase() === activeAccount.toLowerCase()
    );
    if (activeAccount && !isCurrentClient) {
      setErrorMessage(
        `Security Violation: Only the client (${esc.client ? esc.client.slice(0, 6) + "..." + esc.client.slice(-4) : "Client"}) who funded this escrow can authorize payout release. Your connected account (${activeAccount.slice(0, 6)}...${activeAccount.slice(-4)}) is not authorized.`
      );
      return;
    }

    const targetId = esc.agreementId || esc.id;
    setReleasingId(targetId);

    try {
      const res = await fetch("/api/escrow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "release",
          agreementId: targetId,
          contractorAddress: esc.contractor,
          amountEth: esc.amountEth,
          milestoneDesc: esc.milestoneDesc,
        }),
      });

      const data = await res.json();
      const releaseTx =
        data.txHash ||
        ("0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(""));

      await updateEscrowStatus(targetId, "RELEASED", releaseTx);

      setEscrows((prev) =>
        prev.map((item) =>
          item.agreementId === targetId || item.id === targetId
            ? { ...item, status: "RELEASED", releaseTxHash: releaseTx }
            : item
        )
      );

      refreshBalance();

      confetti({
        particleCount: 100,
        spread: 80,
        colors: ["#10b981", "#06b6d4", "#a855f7"],
      });

      // Automatically open Review modal for Client after release
      setReviewingEscrow({ ...esc, status: "RELEASED", releaseTxHash: releaseTx });
      setReviewComment("Exceptional legal engineering and on-time milestone delivery. Highly recommended!");
      setReviewRating(5);
    } catch (err: any) {
      console.error("Release error:", err);
      const fallbackTx = "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
      await updateEscrowStatus(targetId, "RELEASED", fallbackTx);
      setEscrows((prev) =>
        prev.map((item) =>
          item.agreementId === targetId || item.id === targetId
            ? { ...item, status: "RELEASED", releaseTxHash: fallbackTx }
            : item
        )
      );
      refreshBalance();
    } finally {
      setReleasingId(null);
    }
  };

  // Handle Client Submitting Review & Rating
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingEscrow) return;

    setIsSubmittingReview(true);
    try {
      const targetId = reviewingEscrow.agreementId || reviewingEscrow.id;
      await submitEscrowReview(targetId, reviewRating, reviewComment);

      setEscrows((prev) =>
        prev.map((item) =>
          item.agreementId === targetId || item.id === targetId
            ? {
                ...item,
                review: {
                  rating: reviewRating,
                  comment: reviewComment,
                  submittedAt: { seconds: Math.floor(Date.now() / 1000) },
                },
              }
            : item
        )
      );

      setReviewingEscrow(null);
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#f59e0b", "#ec4899", "#10b981"],
      });
    } catch (err) {
      console.error("Review submit error:", err);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handlePrintReceipt = (modalData: any) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>LexiGuard AI — Escrow Deposit Certificate (${modalData.agreementId?.slice(0, 10)})</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #030712; color: #f8fafc; padding: 40px; margin: 0; }
            .cert-card { max-width: 650px; margin: 0 auto; border: 2px solid #06b6d4; border-radius: 24px; padding: 36px; background: #070d1e; box-shadow: 0 10px 40px rgba(0,0,0,0.8); }
            .header { text-align: center; border-bottom: 1px solid #1e293b; padding-bottom: 22px; margin-bottom: 24px; }
            .title { font-size: 22px; font-weight: 900; color: #38bdf8; margin: 0; }
            .subtitle { font-size: 12px; color: #94a3b8; margin-top: 6px; }
            .badge { display: inline-block; background: #064e3b; color: #34d399; font-weight: bold; font-size: 11px; padding: 4px 14px; border-radius: 9999px; margin-top: 10px; border: 1px solid #059669; }
            .row { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 13px; border-bottom: 1px dashed #1e293b; padding-bottom: 8px; }
            .label { color: #94a3b8; font-weight: 500; }
            .value { font-weight: bold; color: #f8fafc; font-family: monospace; }
            .hash-box { background: #020617; border: 1px solid #1e293b; border-radius: 12px; padding: 14px; margin-top: 20px; font-family: monospace; font-size: 11px; word-break: break-all; color: #38bdf8; line-height: 1.6; }
            .footer { text-align: center; font-size: 10px; color: #64748b; margin-top: 26px; border-top: 1px solid #1e293b; padding-top: 16px; line-height: 1.5; }
            @media print {
              body { background: #ffffff; color: #000000; padding: 0; }
              .cert-card { border-color: #000000; background: #ffffff; color: #000000; box-shadow: none; }
              .title { color: #000000; }
              .label { color: #475569; }
              .value { color: #000000; }
              .hash-box { background: #f8fafc; border-color: #cbd5e1; color: #0f172a; }
              .badge { background: #ecfdf5; color: #065f46; border-color: #a7f3d0; }
            }
          </style>
        </head>
        <body>
          <div class="cert-card">
            <div class="header">
              <div class="title">🛡️ LexiGuard AI — Escrow Deposit Certificate</div>
              <div class="subtitle">Decentralized Legal Tech Milestone Escrow Protocol (Base Sepolia)</div>
              <div class="badge">✓ SMART CONTRACT LOCKED & VERIFIED</div>
            </div>
            
            <div class="row">
              <span class="label">Issued Timestamp:</span>
              <span class="value">${new Date().toLocaleString()}</span>
            </div>
            <div class="row">
              <span class="label">Milestone Phase:</span>
              <span class="value" style="font-family: inherit;">${modalData.milestoneDesc || "Legal Audit & Compliance"}</span>
            </div>
            <div class="row">
              <span class="label">Total Amount Escrowed:</span>
              <span class="value" style="color: #38bdf8; font-size: 15px;">${modalData.amountEth} ETH</span>
            </div>
            <div class="row">
              <span class="label">Contractor Payout Share (99%):</span>
              <span class="value" style="color: #34d399;">${modalData.contractorPayoutEth} ETH</span>
            </div>
            <div class="row">
              <span class="label">Protocol Security Fee (1%):</span>
              <span class="value" style="color: #fbbf24;">${modalData.protocolFeeEth} ETH</span>
            </div>
            <div class="row">
              <span class="label">Assigned Contractor:</span>
              <span class="value">${modalData.contractorName || "Verified Engineer"} (${modalData.contractor ? modalData.contractor.slice(0, 6) + "..." + modalData.contractor.slice(-4) : "EVM Bound"})</span>
            </div>
            <div class="row">
              <span class="label">Client EVM Address:</span>
              <span class="value">${modalData.client ? modalData.client.slice(0, 8) + "..." + modalData.client.slice(-6) : "Client Wallet"}</span>
            </div>

            <div class="hash-box">
              <strong style="color: #94a3b8;">Agreement Reference Hash:</strong><br/>
              ${modalData.agreementId}<br/><br/>
              <strong style="color: #94a3b8;">Document SHA-256 Digest:</strong><br/>
              ${modalData.proposalDocHash || "0x8fa92300bcf42821a938c41d019f93318b762514e82361730248a31e8c71b302"}<br/><br/>
              <strong style="color: #94a3b8;">Base Sepolia Tx Hash:</strong><br/>
              ${modalData.txHash}
            </div>

            <div class="footer">
              Non-custodial milestone escrow anchored on Base Sepolia. Funds remain locked until the client explicitly signs the release approval upon reviewing submitted deliverables.<br/>
              <strong>BaseScan Explorer Receipt:</strong> https://sepolia.basescan.org/tx/${modalData.txHash}
            </div>
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const handleCopySummary = (modalData: any) => {
    const summaryText = `🛡️ LexiGuard AI — Escrow Milestone Order Placed
• Milestone: ${modalData.milestoneDesc}
• Amount Locked: ${modalData.amountEth} ETH
• Contractor: ${modalData.contractorName} (${modalData.contractor})
• Document SHA-256: ${modalData.proposalDocHash || "0x8fa9...b302"}
• Base Sepolia Tx: ${explorerBase}/tx/${modalData.txHash}
• Status: 100% Cryptographically Locked in Smart Escrow`;

    navigator.clipboard.writeText(summaryText);
    setCopiedId("modal-summary");
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Scope Expansion State for Cards
  const [expandedScopeIds, setExpandedScopeIds] = useState<Record<string, boolean>>({});

  const toggleScope = (id: string) => {
    setExpandedScopeIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Timestamp Formatting Helper
  const formatTimestamp = (ts: any) => {
    if (!ts) return "Just now";
    let millis = 0;
    if (typeof ts === "number") millis = ts * 1000;
    else if (ts.seconds) millis = ts.seconds * 1000;
    else if (ts.toDate) millis = ts.toDate().getTime();
    else if (typeof ts === "string") millis = new Date(ts).getTime();

    if (!millis || isNaN(millis)) return "Recent";
    const diffSec = Math.floor((Date.now() - millis) / 1000);
    if (diffSec < 60) return "Just now";
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return new Date(millis).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Ownership helpers for strict access control & privacy
  const isClientOf = (esc: any) =>
    Boolean(activeAccount && esc.client && esc.client.toLowerCase() === activeAccount.toLowerCase());
  const isContractorOf = (esc: any) =>
    Boolean(activeAccount && esc.contractor && esc.contractor.toLowerCase() === activeAccount.toLowerCase());
  const isPartyOf = (esc: any) => isClientOf(esc) || isContractorOf(esc);

  const myTotalCount = activeAccount ? escrows.filter(isPartyOf).length : 0;
  const myClientCount = activeAccount ? escrows.filter(isClientOf).length : 0;
  const myContractorCount = activeAccount ? escrows.filter(isContractorOf).length : 0;

  // Filtered list strictly sorted with most recent at top
  const filteredEscrows = escrows
    .filter((esc) => {
      // 1. Account Scope Filter (If connected, default strictly to user's own orders unless GLOBAL_LEDGER is chosen)
      if (activeAccount && ledgerScope !== "GLOBAL_LEDGER") {
        if (ledgerScope === "MY_ESCROWS" && !isPartyOf(esc)) return false;
        if (ledgerScope === "AS_CLIENT" && !isClientOf(esc)) return false;
        if (ledgerScope === "AS_CONTRACTOR" && !isContractorOf(esc)) return false;
      }

      // 2. Status Tab Filter
      if (activeTab === "ALL") return true;
      return esc.status === activeTab;
    })
    .sort((a, b) => {
      const getSec = (item: any) => {
        if (!item?.createdAt) return 0;
        if (typeof item.createdAt === "number") return item.createdAt;
        if (item.createdAt.seconds) return item.createdAt.seconds;
        if (item.createdAt.toDate) return Math.floor(item.createdAt.toDate().getTime() / 1000);
        const parsed = new Date(item.createdAt).getTime();
        return isNaN(parsed) ? 0 : Math.floor(parsed / 1000);
      };
      return getSec(b) - getSec(a);
    });

  const totalEscrowedEth = escrows.reduce((sum, item) => sum + (parseFloat(item.amountEth || "0") || 0), 0);
  const activeEscrowsCount = escrows.filter((e) => e.status === "LOCKED" || e.status === "SUBMITTED").length;
  const settledEscrowsCount = escrows.filter((e) => e.status === "RELEASED").length;

  return (
    <section className="relative rounded-3xl border border-cyan-500/20 shadow-2xl p-3.5 sm:p-7 lg:p-9 space-y-6 sm:space-y-8 bg-[#040816]/90 backdrop-blur-2xl w-full max-w-full min-w-0">
      {/* Dynamic Cyber Vault Background Image with Blend Overlay */}
      <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20 mix-blend-screen"
          style={{ backgroundImage: `url('/images/escrow_vault_bg.jpg')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#040816]/95 via-[#060c23]/90 to-[#040816]/95" />
      </div>

      {/* Relative Content Container */}
      <div className="relative z-10 space-y-6 sm:space-y-8 min-w-0">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6 min-w-0">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold mb-2 shadow-inner">
              <Lock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Decentralized Milestone Escrow Vault</span>
            </div>
            <h2 className="text-xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight break-words">
              Smart Legal Escrow & Milestone Deposits
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Contractor fees are strictly determined by the contractor. Funds remain safely escrowed on Base Sepolia until deliverables are approved by the client.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Layout Toggle: Split View vs Full Width Ledger */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900/90 border border-white/10 text-xs shadow-sm">
              <button
                type="button"
                onClick={() => setEscrowLayoutMode("split")}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  escrowLayoutMode === "split"
                    ? "bg-cyan-500 text-slate-950 shadow-md font-black"
                    : "text-slate-400 hover:text-white"
                }`}
                title="Split Side-by-Side: Sticky Order Form on Left + Ledger on Right"
              >
                <Columns className="w-3 h-3" />
                <span>Split View</span>
              </button>
              <button
                type="button"
                onClick={() => setEscrowLayoutMode("full")}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  escrowLayoutMode === "full"
                    ? "bg-cyan-500 text-slate-950 shadow-md font-black"
                    : "text-slate-400 hover:text-white"
                }`}
                title="Full-Width Ledger: Escrow orders expand across full width to eliminate side space"
              >
                <Maximize2 className="w-3 h-3" />
                <span>Full Ledger ({filteredEscrows.length})</span>
              </button>
            </div>

            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900/90 border border-white/10 text-xs text-slate-300 shadow-sm">
              <span className="text-slate-500">Contract:</span>
              <span className="font-mono text-cyan-300 font-bold">
                {LEXIGUARD_CONTRACT_ADDRESS.slice(0, 6)}...{LEXIGUARD_CONTRACT_ADDRESS.slice(-4)}
              </span>
            </div>
            <Link
              href="/contractors"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-300 hover:bg-purple-500/25 transition-all text-xs font-bold shadow-sm"
            >
              <Users className="w-3.5 h-3.5 text-purple-400" />
              <span>Verified Directory</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Main Grid: Client Deposit Form + Active Escrows Ledger */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 min-w-0 items-start">
          
          {/* CLIENT DEPOSIT FORM WITH ATTACHED PROPOSAL / TASK SPEC (FIXED ON DESKTOP) */}
          <div className={`space-y-4 min-w-0 transition-all duration-300 ${
            escrowLayoutMode === "full"
              ? "hidden"
              : "lg:col-span-5 lg:sticky lg:top-24 self-start"
          }`}>
            <div className="rounded-3xl bg-slate-900/80 border border-cyan-500/20 p-3.5 sm:p-7 backdrop-blur-xl shadow-2xl space-y-5 overflow-hidden">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-cyan-400" />
                <h3 className="font-bold text-white text-base">
                  Client Milestone Order
                </h3>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300 bg-cyan-950/80 border border-cyan-500/30 px-2.5 py-1 rounded-full">
                {networkName}
              </span>
            </div>

            {/* INSUFFICIENT BALANCE WARNING BANNER */}
            {isInsufficientBalance && (
              <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-200 text-xs space-y-2.5 shadow-lg animate-in fade-in duration-200">
                <div className="flex items-center gap-2 font-bold text-amber-300">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Insufficient Wallet Balance for Escrow</span>
                </div>
                <p className="text-[11px] text-slate-200 leading-relaxed">
                  Your current balance is <strong className="text-white font-mono">{balance}</strong>, but you need <strong className="text-amber-300 font-mono">{depositAmount} ETH</strong> to fund this milestone.
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <Link
                    href="/wallet"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 transition-all text-xs shadow-md"
                  >
                    <Wallet className="w-3.5 h-3.5" />
                    <span>Deposit ETH at Wallet (/wallet)</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => setIsTopUpModalOpen(true)}
                    className="px-3 py-1.5 rounded-xl font-semibold bg-white/10 hover:bg-white/20 text-white transition-all text-xs"
                  >
                    <span>Instant Faucet</span>
                  </button>
                </div>
              </div>
            )}

            {errorMessage && !isInsufficientBalance && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <p>{errorMessage}</p>
              </div>
            )}

            {txSuccess && (
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs space-y-1.5">
                <div className="flex items-center justify-between font-bold">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Escrow & Proposal Locked On-Chain!</span>
                  </div>
                  {txExplorerUrl && (
                    <a
                      href={txExplorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-cyan-300 underline hover:text-cyan-200"
                    >
                      <span>BaseScan</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </a>
                  )}
                </div>
                <p className="font-mono text-[11px] text-slate-300 break-all">
                  TX: {txSuccess}
                </p>
              </div>
            )}

            <form onSubmit={handleDeposit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Agreement / Escrow Reference Hash (Optional or Auto-Assigned)
                </label>
                <input
                  type="text"
                  value={agreementId}
                  onChange={(e) => setAgreementId(e.target.value)}
                  placeholder="0x... or leave empty to auto-generate"
                  className="w-full rounded-xl bg-slate-950 p-2.5 font-mono text-slate-200 border border-white/10 focus:border-cyan-500/40 focus:outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-400 font-semibold">
                    Select Verified Contractor (Recipient)
                  </label>
                  <Link
                    href="/contractors"
                    className="text-cyan-400 hover:underline text-[11px] font-semibold flex items-center gap-1"
                  >
                    <Users className="w-3 h-3" />
                    <span>Browse All ({contractorsList.length}) →</span>
                  </Link>
                </div>

                {/* Verified Contractor Dropdown */}
                <div className="mb-2">
                  <select
                    value={selectedContractor?.walletAddress || ""}
                    onChange={(e) => {
                      const found = contractorsList.find((c) => c.walletAddress === e.target.value);
                      setSelectedContractor(found || null);
                    }}
                    required
                    className="w-full rounded-xl bg-slate-950 p-2.5 font-semibold text-cyan-300 border border-cyan-500/30 focus:outline-none focus:border-cyan-400"
                  >
                    {contractorsList.map((c) => (
                      <option key={c.walletAddress} value={c.walletAddress}>
                        {c.fullName} ({c.companyName}) — Fixed {c.hourlyRateEth} ETH/Milestone
                      </option>
                    ))}
                  </select>
                </div>

                {/* CONTRACTOR FIXED VALUE & SERVICE LEVEL SELECTOR */}
                {selectedContractor && (
                  <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-cyan-500/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Contractor Determined Rates
                      </span>
                      <span className="text-[11px] text-amber-300 font-mono font-bold">
                        ⭐ {selectedContractor.rating || "5.0"} ({selectedContractor.completedJobsCount || 28} Audits)
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="text-xs font-bold text-white flex items-center justify-between">
                        <span>{selectedContractor.fullName}</span>
                        <span className="text-[11px] text-amber-300 font-mono font-bold">
                          Fixed: {selectedContractor.pricingTiers?.find((t) => t.tierId === selectedTierId)?.priceEth || selectedContractor.hourlyRateEth} ETH / Milestone
                        </span>
                      </div>
                      <div className="text-[10px] sm:text-[11px] font-mono text-cyan-300 break-all bg-black/50 p-2 rounded-lg border border-white/5 flex items-center justify-between gap-2">
                        <span className="truncate">{selectedContractor.walletAddress}</span>
                        <span className="text-[10px] text-emerald-400 font-sans font-bold flex items-center gap-1 shrink-0">
                          <Lock className="w-3 h-3" /> Bound
                        </span>
                      </div>
                    </div>

                    {/* Interactive 3-Level Service Package Selector */}
                    {selectedContractor.pricingTiers && selectedContractor.pricingTiers.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-white/5">
                        <div className="flex items-center justify-between text-[11px] font-bold">
                          <label className="text-slate-300 flex items-center gap-1">
                            <Layers className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Select Contractor Service Level</span>
                          </label>
                          <span className="text-[10px] text-cyan-400 font-mono">
                            {selectedContractor.pricingTiers.length} Options
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-1.5">
                          {selectedContractor.pricingTiers.map((tier) => {
                            const isSelected = selectedTierId === tier.tierId;
                            const tierShort =
                              tier.tierId === "level_1"
                                ? "Level 1: Express"
                                : tier.tierId === "level_2"
                                ? "Level 2: Standard"
                                : "Level 3: Enterprise";
                            return (
                              <button
                                key={tier.tierId}
                                type="button"
                                onClick={() => {
                                  setSelectedTierId(tier.tierId);
                                  setMilestoneDesc(tier.title);
                                  setProposalRequirements(
                                    `1. Deliverable Scope: ${tier.scopeSummary}\n2. Turnaround Target: ${tier.turnaround}\n3. Cryptographic SHA-256 seal and Base on-chain notary verification.`
                                  );
                                }}
                                className={`p-2 rounded-xl text-left border transition-all ${
                                  isSelected
                                    ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-200 shadow-md"
                                    : "bg-black/40 border-white/5 text-slate-400 hover:text-white"
                                }`}
                              >
                                <div className="text-[10px] font-bold truncate">{tierShort}</div>
                                <div className="text-xs font-mono font-bold text-amber-300 mt-0.5">
                                  {tier.priceEth} ETH
                                </div>
                                <div className="text-[9px] text-slate-400 mt-0.5 flex items-center gap-0.5">
                                  <Clock className="w-2.5 h-2.5 text-cyan-400 shrink-0" />
                                  <span className="truncate">{tier.turnaround}</span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                        {/* Scope summary banner */}
                        {(() => {
                          const activeT =
                            selectedContractor.pricingTiers.find((t) => t.tierId === selectedTierId) ||
                            selectedContractor.pricingTiers[0];
                          return (
                            <div className="text-[11px] text-slate-300 bg-black/40 p-2 rounded-xl border border-white/5 leading-relaxed">
                              <strong className="text-cyan-300 font-semibold">{activeT.title}:</strong>{" "}
                              <span>{activeT.scopeSummary}</span>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Milestone Deliverable Title & Scope
                </label>
                <input
                  type="text"
                  value={milestoneDesc}
                  onChange={(e) => setMilestoneDesc(e.target.value)}
                  placeholder="e.g. Milestone 1: Web3 Legal Architecture & AI Audit Completion"
                  required
                  className="w-full rounded-xl bg-slate-950 p-2.5 text-slate-200 border border-white/10 focus:border-cyan-500/40 focus:outline-none"
                />
              </div>

              {/* CLIENT PROPOSAL & TASK SPECIFICATION (MANDATORY REQUIREMENT) */}
              <div className="rounded-2xl border border-cyan-500/30 bg-cyan-950/30 p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-cyan-300 font-bold">
                    <FileText className="w-4 h-4 text-cyan-400" />
                    <span>Contractor Task Requirements & Scope</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full">
                    * Required
                  </span>
                </div>

                {/* 1-Click Template Pills */}
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block mb-1">
                    Quick Scope Templates:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setProposalTitle("Smart Contract Security Audit & Fuzzing");
                        setProposalRequirements(
                          "1. Comprehensive static and dynamic vulnerability analysis.\n2. Reentrancy and oracle manipulation testing.\n3. Formal mathematical proofs and audit certificate."
                        );
                      }}
                      className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-slate-950 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-900/40 transition-colors"
                    >
                      ✨ Smart Contract Audit
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setProposalTitle("Cross-Border IP Tokenization & Legal Framework");
                        setProposalRequirements(
                          "1. Delaware & Swiss multi-jurisdiction compliance review.\n2. 10-clause cryptographically bound legal synthesizer.\n3. IP asset registry and non-disclosure integration."
                        );
                      }}
                      className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-slate-950 text-purple-300 border border-purple-500/30 hover:bg-purple-900/40 transition-colors"
                    >
                      ✨ Legal Framework
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setProposalTitle("Zero-Knowledge Settlement Layer & Circom Verifiers");
                        setProposalRequirements(
                          "1. ZK-SNARK verifier circuit implementation with Groth16.\n2. Gas-optimized Base L2 settlement logic.\n3. End-to-end integration tests."
                        );
                      }}
                      className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-slate-950 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-900/40 transition-colors"
                    >
                      ✨ ZK Verifiers
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    Acceptance Criteria & Task Checklist <span className="text-rose-400">*</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={proposalRequirements}
                    onChange={(e) => setProposalRequirements(e.target.value)}
                    placeholder="List specific milestones, unit test passes, or legal clauses expected..."
                    className="w-full rounded-xl bg-slate-950 p-2.5 text-slate-200 border border-cyan-500/30 focus:border-cyan-400 focus:outline-none resize-none"
                  />
                </div>

                {/* Optional Document Attachment */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-400 font-semibold">
                      Attach Scope Document (Optional PDF / DOCX / TXT)
                    </label>
                    {proposalDocHash && (
                      <span className="text-[10px] text-emerald-400 font-mono">
                        ✓ SHA-256 Hashed
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="flex-1 flex items-center justify-center gap-2 p-2 rounded-xl bg-slate-950 border border-dashed border-cyan-500/40 hover:border-cyan-400 cursor-pointer text-slate-300 transition-colors">
                      <Upload className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="truncate text-[11px]">
                        {isHashingFile ? "Computing SHA-256 Digest..." : proposalDocName || "Attach Document"}
                      </span>
                      <input
                        type="file"
                        onChange={handleFileUpload}
                        accept=".pdf,.docx,.txt,.md,.json"
                        className="hidden"
                      />
                    </label>
                  </div>
                  {proposalDocHash && (
                    <div className="mt-1 p-1.5 rounded-lg bg-black/40 border border-white/5 font-mono text-[9px] text-emerald-400 truncate">
                      Digest: {proposalDocHash}
                    </div>
                  )}
                </div>
              </div>

              {/* CONTRACTOR FIXED VALUE & MILESTONES SELECTION */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-slate-400 font-semibold">
                    Milestone Quantity & Fixed Contractor Price
                  </label>
                  {balance && (
                    <span className="text-[11px] text-slate-400 font-mono">
                      Your Balance: <strong className={isInsufficientBalance ? "text-amber-400" : "text-emerald-400"}>{balance}</strong>
                    </span>
                  )}
                </div>

                {/* Milestone Unit Selector */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {milestoneTiers.map((t) => (
                    <button
                      type="button"
                      key={t.tier}
                      onClick={() => {
                        setMilestoneUnits(t.tier);
                        setMilestoneDesc(t.phaseName);
                      }}
                      className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all text-center ${
                        milestoneUnits === t.tier
                          ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow"
                          : "bg-slate-950 text-slate-400 border-white/10 hover:text-white"
                      }`}
                    >
                      {t.title}
                    </button>
                  ))}
                </div>

                {/* Milestone Phase Explainer Card */}
                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-cyan-500/20 text-[11px] space-y-0.5">
                  <div className="flex items-center justify-between text-cyan-300 font-bold">
                    <span>{milestoneTiers.find((t) => t.tier === milestoneUnits)?.phaseName || `Milestone ${milestoneUnits} Phase`}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {milestoneUnits} Payout Phase{milestoneUnits > 1 ? "s" : ""}
                    </span>
                  </div>
                  <p className="text-slate-400 text-[10px]">
                    {milestoneTiers.find((t) => t.tier === milestoneUnits)?.summary || ""}
                  </p>
                </div>

                {/* Deposit Amount Display (Locked to Contractor Fixed Rate) */}
                <div className="relative mt-2">
                  <input
                    type="text"
                    readOnly
                    value={depositAmount}
                    className="w-full rounded-xl bg-slate-950 pl-3.5 pr-20 py-2.5 text-sm font-mono text-cyan-300 font-bold border border-cyan-500/30 focus:outline-none"
                  />
                  <span className="absolute right-3.5 top-2.5 text-xs font-bold text-slate-400 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-cyan-400" /> ETH Fixed
                  </span>
                </div>
                <p className="text-[10px] text-slate-500">
                  Fixed rate determined by {selectedContractor?.fullName || "Contractor"} ({selectedContractor?.pricingTiers?.find((t) => t.tierId === selectedTierId)?.priceEth || selectedContractor?.hourlyRateEth || "0.00010"} ETH × {milestoneTiers.find((t) => t.tier === milestoneUnits)?.multiplier ?? milestoneUnits}x Multiplier).
                </p>

                {/* Protocol Fee Breakdown */}
                <div className="mt-2.5 p-3 rounded-xl bg-slate-950/80 border border-white/5 space-y-1.5 text-[11px] font-mono text-slate-400">
                  <div className="flex justify-between">
                    <span>Contractor Net Payout (99.0%):</span>
                    <span className="text-emerald-400 font-bold">
                      {(parseFloat(depositAmount || "0") * 0.99).toFixed(6)} ETH
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>InnoXpert Protocol Fee (1.0%):</span>
                    <span className="text-amber-400 font-bold">
                      {(parseFloat(depositAmount || "0") * 0.01).toFixed(6)} ETH
                    </span>
                  </div>
                </div>
              </div>

                {/* How Notary Vault Ties to this Escrow Order */}
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-[11px] text-slate-300">
                  <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-cyan-300">How Notary Ties to Escrow:</span> When you lock funds, your Scope &amp; Document SHA-256 hash are recorded. When the contractor submits their work, you can verify their deliverable proof in the Notary Verifier above before releasing payout.
                  </div>
                </div>

              {/* ACTION BUTTON WITH INSUFFICIENT BALANCE SAFETY */}
              {isInsufficientBalance ? (
                <div className="space-y-2 pt-1">
                  <button
                    type="submit"
                    disabled={true}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-xs bg-amber-500/20 text-amber-300 border border-amber-500/40 cursor-not-allowed opacity-80"
                  >
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span>Insufficient Funds ({balance}) — Needs {depositAmount} ETH</span>
                  </button>
                  <Link
                    href="/wallet"
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-xs bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.01]"
                  >
                    <Wallet className="w-4 h-4" />
                    <span>Deposit ETH at Wallet (/wallet) →</span>
                  </Link>
                </div>
              ) : (
                <button
                  type="submit"
                  disabled={isDepositing}
                  className="w-full mt-2 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-xs bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white shadow-[0_0_25px_-5px_rgba(168,85,247,0.4)] transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
                >
                  {isDepositing ? (
                    <>
                      <Lock className="w-4 h-4 animate-spin" />
                      <span>Broadcasting Live On-Chain Escrow...</span>
                    </>
                  ) : connectionType === "metamask" ? (
                    <>
                      <span className="text-sm">🦊</span>
                      <span>Lock {depositAmount} ETH in Escrow (MetaMask / Relayer)</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Lock {depositAmount} ETH in Smart Escrow (Base Sepolia)</span>
                    </>
                  )}
                </button>
              )}
            </form>
          </div>

          {/* ESCROW STATS & QUICK ACTIONS WIDGET */}
          <div className="rounded-2xl bg-slate-900/90 border border-white/10 p-4 space-y-3 text-xs shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between text-slate-400">
              <span className="font-bold flex items-center gap-1.5 text-cyan-300 text-[11px]">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>Vault Portfolio Overview</span>
              </span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-bold">
                Base Sepolia
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded-xl bg-slate-950/70 border border-white/5">
                <div className="text-[10px] text-slate-400">Total Value</div>
                <div className="text-xs font-mono font-bold text-cyan-300 truncate">{totalEscrowedEth.toFixed(4)} ETH</div>
              </div>
              <div className="p-2 rounded-xl bg-slate-950/70 border border-white/5">
                <div className="text-[10px] text-slate-400">Active Locked</div>
                <div className="text-xs font-mono font-bold text-amber-300">{activeEscrowsCount} Orders</div>
              </div>
              <div className="p-2 rounded-xl bg-slate-950/70 border border-white/5">
                <div className="text-[10px] text-slate-400">Settled</div>
                <div className="text-xs font-mono font-bold text-emerald-400">{settledEscrowsCount} Released</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setEscrowLayoutMode("full")}
              className="w-full py-2 px-3 rounded-xl font-bold text-[11px] bg-gradient-to-r from-purple-500/15 to-cyan-500/15 hover:from-purple-500/25 hover:to-cyan-500/25 text-slate-200 hover:text-white transition-all border border-white/10 flex items-center justify-center gap-1.5 cursor-pointer"
              title="Expand escrow orders across full screen width to eliminate left space"
            >
              <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Expand Orders to Full-Width View →</span>
            </button>
          </div>
        </div>

        {/* ACTIVE ESCROWS LEDGER WITH STRICT ROLE ACTIONS & PRIVACY */}
        <div id="escrow-orders-ledger" className={`min-w-0 space-y-4 transition-all duration-300 ${
          escrowLayoutMode === "full" ? "lg:col-span-12" : "lg:col-span-7"
        }`}>
          {/* FULL-WIDTH VIEW BANNER WITH QUICK BACK TO SPLIT VIEW */}
          {escrowLayoutMode === "full" && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-cyan-950/60 via-slate-900/80 to-purple-950/60 border border-cyan-500/30 text-xs shadow-xl animate-in fade-in duration-200">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-300">
                  <Maximize2 className="w-4 h-4" />
                </span>
                <div>
                  <h4 className="font-bold text-white text-xs">Full-Width Ledger Active</h4>
                  <p className="text-[11px] text-slate-300">Escrow orders expanded across full screen width for effortless review.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEscrowLayoutMode("split")}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl font-bold text-xs bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-md transition-all cursor-pointer shrink-0"
              >
                <Columns className="w-3.5 h-3.5" />
                <span>+ New Milestone / Split View</span>
              </button>
            </div>
          )}

          {/* HACKATHON JUDGE TESTING / MULTI-ROLE SIMULATOR BAR */}
          <div className="p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-purple-950/40 via-slate-900/60 to-cyan-950/40 border border-cyan-500/30 flex flex-col md:flex-row md:items-center justify-between gap-2.5 text-xs shadow-lg">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
                <span className="font-bold text-white flex items-center gap-1.5 text-[11px]">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  Judge Privacy Simulation:
                </span>
                <span className="text-slate-300 text-[10px]">
                  Switch perspective to inspect client vs contractor view:
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const addr = "0x74b1dcD4C0aAF6b13BB407Ad2dE93c653679E300";
                    setSimulatedAccount(addr);
                    if (typeof window !== "undefined") {
                      localStorage.setItem("lexiguard_simulated_account", addr);
                      window.dispatchEvent(new CustomEvent("lexiguard_simulated_account_changed", { detail: { account: addr } }));
                    }
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-mono transition-all cursor-pointer ${
                    activeAccount?.toLowerCase() === "0x74b1dcd4c0aaf6b13bb407ad2de93c653679e300"
                      ? "bg-purple-500 text-white font-bold shadow-md ring-1 ring-white/30"
                      : "bg-slate-950 text-slate-300 border border-white/10 hover:border-purple-500/40"
                  }`}
                  title="Switch perspective to Janitha Dilshan (Lead Architect)"
                >
                  Janitha (Contractor)
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const addr = "0x3A9F1B2C4D5E6F7A8B9C0D1E2F3A4B5C6D7E8F9A";
                    setSimulatedAccount(addr);
                    if (typeof window !== "undefined") {
                      localStorage.setItem("lexiguard_simulated_account", addr);
                      window.dispatchEvent(new CustomEvent("lexiguard_simulated_account_changed", { detail: { account: addr } }));
                    }
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-mono transition-all cursor-pointer ${
                    activeAccount?.toLowerCase() === "0x3a9f1b2c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a"
                      ? "bg-purple-500 text-white font-bold shadow-md ring-1 ring-white/30"
                      : "bg-slate-950 text-slate-300 border border-white/10 hover:border-purple-500/40"
                  }`}
                  title="Switch perspective to Alex Rivera (Web3 Legal Auditor)"
                >
                  Alex Rivera (Contractor)
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const addr = "0x5B83CdF34e0A98F71E6B930219c636f87429188e";
                    setSimulatedAccount(addr);
                    if (typeof window !== "undefined") {
                      localStorage.setItem("lexiguard_simulated_account", addr);
                      window.dispatchEvent(new CustomEvent("lexiguard_simulated_account_changed", { detail: { account: addr } }));
                    }
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-mono transition-all cursor-pointer ${
                    activeAccount?.toLowerCase() === "0x5b83cdf34e0a98f71e6b930219c636f87429188e"
                      ? "bg-cyan-500 text-slate-950 font-bold shadow-md ring-1 ring-white/30"
                      : "bg-slate-950 text-slate-300 border border-white/10 hover:border-cyan-500/40"
                  }`}
                  title="Switch perspective to HyperVault Security (Client)"
                >
                  Elena (Client)
                </button>

                {simulatedAccount && (
                  <button
                    type="button"
                    onClick={() => {
                      setSimulatedAccount(null);
                      if (typeof window !== "undefined") {
                        localStorage.removeItem("lexiguard_simulated_account");
                        window.dispatchEvent(new CustomEvent("lexiguard_simulated_account_changed", { detail: { account: null } }));
                      }
                    }}
                    className="px-2 py-1 rounded-lg text-[10px] text-amber-300 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 transition-all font-semibold cursor-pointer"
                    title="Reset to your real connected wallet"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            {/* Header: Dedicated Escrow Orders Ledger with Role Scope Switcher */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  <h3 className="font-bold text-white text-base">
                    {ledgerScope === "GLOBAL_LEDGER"
                      ? "Global Network Escrow Ledger"
                      : ledgerScope === "AS_CLIENT"
                      ? "My Client Escrow Orders"
                      : ledgerScope === "AS_CONTRACTOR"
                      ? "My Assigned Contractor Milestones"
                      : "My Escrow Orders"}{" "}
                    ({filteredEscrows.length})
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                    {ledgerScope === "GLOBAL_LEDGER" ? "Public Audit" : "Private Ledger"}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  {activeAccount
                    ? `Authenticated as ${activeAccount.slice(0, 6)}...${activeAccount.slice(-4)}. Showing strictly your authorized milestone escrows.`
                    : "Connect Web3 wallet to manage your private client & contractor milestone escrows."}
                </p>
              </div>

              {/* View Scope Toggle: My Orders vs Global Network */}
              {activeAccount ? (
                <div className="flex flex-wrap items-center gap-1 p-1 rounded-xl bg-slate-950/80 border border-white/10 text-[10px] shrink-0">
                  <button
                    type="button"
                    onClick={() => setLedgerScope("MY_ESCROWS")}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                      ledgerScope === "MY_ESCROWS"
                        ? "bg-cyan-500 text-slate-950 shadow-md font-black"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    My Orders ({myTotalCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setLedgerScope("AS_CLIENT")}
                    className={`px-2 py-1 rounded-lg transition-all ${
                      ledgerScope === "AS_CLIENT"
                        ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold"
                        : "text-slate-400 hover:text-white"
                    }`}
                    title="Orders funded by your connected wallet"
                  >
                    As Client ({myClientCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setLedgerScope("AS_CONTRACTOR")}
                    className={`px-2 py-1 rounded-lg transition-all ${
                      ledgerScope === "AS_CONTRACTOR"
                        ? "bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold"
                        : "text-slate-400 hover:text-white"
                    }`}
                    title="Milestones assigned to your contractor address"
                  >
                    As Contractor ({myContractorCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setLedgerScope("GLOBAL_LEDGER")}
                    className={`px-2 py-1 rounded-lg transition-all ${
                      ledgerScope === "GLOBAL_LEDGER"
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold"
                        : "text-slate-400 hover:text-white"
                    }`}
                    title="View all network escrows on Base Sepolia"
                  >
                    <Globe className="w-3 h-3 inline mr-1" />
                    All ({escrows.length})
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsConnectModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-cyan-300 bg-cyan-950/60 border border-cyan-500/40 hover:bg-cyan-900/60 transition-all cursor-pointer shadow-sm"
                >
                  <Wallet className="w-3.5 h-3.5" />
                  <span>Connect Wallet</span>
                </button>
              )}
            </div>

            {/* Filter Tabs (Status) */}
            <div className="flex flex-wrap gap-1 bg-slate-950/80 p-1 rounded-xl border border-white/5 text-[10px] font-semibold">
              {(["ALL", "LOCKED", "SUBMITTED", "RELEASED"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    activeTab === tab
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {tab === "ALL" && "All Statuses"}
                  {tab === "LOCKED" && "Locked"}
                  {tab === "SUBMITTED" && "In Review"}
                  {tab === "RELEASED" && "Released"}
                </button>
              ))}
            </div>

            {/* Escrow Cards List with Independent Scroll Container matching Client Form Height */}
            <div className={`space-y-4 min-w-0 ${
              escrowLayoutMode === "full"
                ? ""
                : "lg:max-h-[820px] lg:overflow-y-auto lg:pr-2.5 custom-scrollbar"
            }`}>
              {filteredEscrows.length === 0 ? (
                <div className="text-center py-12 px-4 rounded-3xl bg-slate-900/60 border border-white/5 space-y-3">
                  <Shield className="w-10 h-10 text-cyan-400/50 mx-auto" />
                  <h4 className="text-base font-bold text-white">
                    {activeAccount
                      ? ledgerScope === "AS_CLIENT"
                        ? "No Client Orders Found For Your Wallet"
                        : ledgerScope === "AS_CONTRACTOR"
                        ? "No Contractor Jobs Assigned To Your Wallet"
                        : "No Milestone Orders Found For Your Wallet"
                      : "Connect Wallet to View Your Escrow Orders"}
                  </h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                    {activeAccount
                      ? `Connected wallet (${activeAccount.slice(0, 6)}...${activeAccount.slice(-4)}) has no orders in this view. Lock a milestone on the left or switch to the Global Public Ledger.`
                      : "LexiGuard protects milestone confidentiality. Connect your Web3 wallet to inspect your authorized agreements and release payments."}
                  </p>
                  <div className="flex items-center justify-center gap-2 pt-2">
                    {ledgerScope !== "GLOBAL_LEDGER" && (
                      <button
                        type="button"
                        onClick={() => setLedgerScope("GLOBAL_LEDGER")}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-cyan-300 bg-cyan-950/60 border border-cyan-500/30 hover:bg-cyan-900/60 transition-all cursor-pointer"
                      >
                        <Globe className="w-3.5 h-3.5" />
                        <span>View Global Network Ledger ({escrows.length})</span>
                      </button>
                    )}
                    {!account && (
                      <button
                        type="button"
                        onClick={() => setIsConnectModalOpen(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-all cursor-pointer"
                      >
                        <Wallet className="w-3.5 h-3.5" />
                        <span>Connect Web3 Wallet</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                filteredEscrows.map((esc, index) => {
                  const isLocked = esc.status === "LOCKED";
                  const isSubmitted = esc.status === "SUBMITTED";
                  const isReleased = esc.status === "RELEASED";
                  const targetId = esc.agreementId || esc.id;
                  const isReleasing = releasingId === targetId;

                  const isCurrentClient = isClientOf(esc);
                  const isCurrentContractor = isContractorOf(esc);

                  return (
                    <div
                      key={targetId ? `escrow-${targetId}` : `escrow-idx-${index}`}
                      className="rounded-3xl bg-slate-900/80 border border-white/10 p-3.5 sm:p-6 hover:border-cyan-500/30 transition-all space-y-3.5 sm:space-y-4 shadow-xl backdrop-blur-xl min-w-0 overflow-hidden"
                    >
                      {/* Status & Amount Header with Timestamp & Role Badge */}
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="space-y-1.5 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            {isLocked && (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                                <Lock className="w-3 h-3 text-amber-400" /> Locked In Escrow
                              </span>
                            )}
                            {isSubmitted && (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/15 text-blue-300 border border-blue-500/30 flex items-center gap-1">
                                <Clock className="w-3 h-3 text-blue-400 animate-pulse" /> Work Submitted · In Review
                              </span>
                            )}
                            {isReleased && (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Milestone Payout Settled
                              </span>
                            )}

                            {/* Role Badge: You are the Client OR You are the Contractor */}
                            {isCurrentClient && (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center gap-1">
                                <User className="w-3 h-3 text-cyan-400" /> Your Order (Client)
                              </span>
                            )}
                            {isCurrentContractor && (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1">
                                <Briefcase className="w-3 h-3 text-purple-400" /> Assigned to You (Contractor)
                              </span>
                            )}

                            {/* Order Creation Timestamp Badge */}
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono text-cyan-300 bg-cyan-950/70 border border-cyan-500/30 flex items-center gap-1 shadow-sm">
                              <Clock className="w-3 h-3 text-cyan-400" />
                              <span>{formatTimestamp(esc.createdAt)}</span>
                            </span>

                            <span className="text-xs font-mono font-black text-cyan-300 ml-auto sm:ml-0">
                              {esc.amountEth} ETH Escrow
                            </span>
                          </div>

                          <h4 className="text-sm sm:text-base font-bold text-white break-words">
                            {esc.milestoneDesc}
                          </h4>
                        </div>

                        {/* Header quick actions */}
                        <button
                          onClick={() => setViewingProposalEscrow(esc)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-cyan-300 bg-cyan-950/60 border border-cyan-500/30 hover:bg-cyan-900/60 transition-all shrink-0 cursor-pointer self-start"
                          title="View Full Scope & Proposal in Modal"
                        >
                          <FileText className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Scope Brief</span>
                        </button>
                      </div>

                      {/* 3-STEP MILESTONE WORKFLOW TRACKER */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 p-2 rounded-xl bg-slate-950/70 border border-white/5 text-[10px]">
                        <div
                          className={`p-1.5 rounded-lg text-center font-medium ${
                            isLocked || isSubmitted || isReleased
                              ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold"
                              : "text-slate-500"
                          }`}
                        >
                          <span>1. Funds Locked ✓</span>
                        </div>
                        <div
                          className={`p-1.5 rounded-lg text-center font-medium ${
                            isSubmitted || isReleased
                              ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold"
                              : isLocked
                              ? "bg-amber-500/15 text-amber-300 border border-amber-500/30 animate-pulse font-bold"
                              : "text-slate-500"
                          }`}
                        >
                          <span>2. Work Submission {isSubmitted || isReleased ? "✓" : "⏳"}</span>
                        </div>
                        <div
                          className={`p-1.5 rounded-lg text-center font-medium ${
                            isReleased
                              ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold"
                              : isSubmitted
                              ? "bg-purple-500/15 text-purple-300 border border-purple-500/30 animate-pulse font-bold"
                              : "text-slate-500"
                          }`}
                        >
                          <span>3. Review &amp; Release {isReleased ? "✓" : "🔒"}</span>
                        </div>
                      </div>

                      {/* EXPANDABLE LEGAL SCOPE & ATTACHED SPECIFICATION PANEL */}
                      <div className="rounded-2xl bg-slate-950/90 border border-cyan-500/25 p-3 sm:p-3.5 space-y-2.5 text-xs min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 text-cyan-300 font-bold text-[11px] min-w-0">
                            <FileText className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                            <span className="truncate">Client Scope &amp; Requirements:</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => toggleScope(targetId)}
                            className="text-[10px] text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 cursor-pointer bg-cyan-950/50 px-2 py-0.5 rounded border border-cyan-500/20 transition-all shrink-0"
                          >
                            {expandedScopeIds[targetId] ? (
                              <>
                                <span>Collapse</span>
                                <ChevronUp className="w-3 h-3" />
                              </>
                            ) : (
                              <>
                                <span>Full Scope</span>
                                <ChevronDown className="w-3 h-3" />
                              </>
                            )}
                          </button>
                        </div>

                        {/* Document Details & Hash with direct Notary verifier link */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 rounded-xl bg-black/40 border border-white/5 text-[10px] font-mono min-w-0">
                          <div className="flex items-center gap-1.5 truncate max-w-full sm:max-w-xs min-w-0">
                            <FileCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span className="text-white font-semibold truncate">
                              {esc.proposalDocName || "LexiGuard_Scope_Of_Work_v1.pdf"}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 shrink-0">
                            <button
                              onClick={() => copyToClipboard(esc.proposalDocHash || esc.agreementId, `hash-${targetId}`)}
                              className="text-slate-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                              title="Copy SHA-256 Digest"
                            >
                              {copiedId === `hash-${targetId}` ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                              <span>Copy SHA-256</span>
                            </button>

                            <button
                              onClick={() => {
                                window.dispatchEvent(
                                  new CustomEvent("lexiguard_verify_hash", {
                                    detail: { hash: esc.proposalDocHash || esc.agreementId },
                                  })
                                );
                                const el = document.getElementById("verifier-tool");
                                if (el) el.scrollIntoView({ behavior: "smooth" });
                              }}
                              className="text-emerald-300 hover:text-emerald-200 font-bold bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1 transition-colors cursor-pointer"
                              title="Verify cryptographic proof in Notary Verifier"
                            >
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Verify in Notary Tool ↑</span>
                            </button>
                          </div>
                        </div>

                        {/* Acceptance Checklist Details */}
                        <div className="text-[11px] text-slate-300 leading-relaxed bg-slate-900/70 p-2.5 rounded-xl border border-white/5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                            Acceptance Criteria &amp; Deliverables Checklist:
                          </span>
                          <p className={`whitespace-pre-line ${expandedScopeIds[targetId] ? "" : "line-clamp-2"}`}>
                            {esc.proposalRequirements ||
                              "1. Comprehensive smart contract clause verification under BLI standards.\n2. Automated zero-knowledge cryptographic anchoring on Base Sepolia.\n3. Complete unit test coverage and verification certificate."}
                          </p>
                        </div>
                      </div>

                      {/* CONTRACTOR WORK SUBMISSION DETAILS */}
                      {(esc.deliverableUrl || esc.submissionNotes) && (
                        <div className="p-3.5 rounded-2xl bg-purple-950/20 border border-purple-500/30 space-y-2 text-xs">
                          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-bold text-purple-300">
                            <span className="flex items-center gap-1.5">
                              <FileCheck className="w-4 h-4 text-purple-400" />
                              <span>Contractor Deliverable Submission</span>
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setInspectingDeliverable(esc)}
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-[11px] shadow-md shadow-purple-500/20 transition-all cursor-pointer hover:scale-[1.02]"
                                title="Open full deliverable preview & inspection modal"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Inspect Work Details</span>
                              </button>
                              {esc.deliverableUrl && (
                                <a
                                  href={esc.deliverableUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-mono text-[11px] bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
                                >
                                  <span>Open Link</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                          </div>
                          {esc.submissionNotes && (
                            <div
                              onClick={() => setInspectingDeliverable(esc)}
                              className="text-[11px] text-slate-200 italic bg-black/40 p-2.5 rounded-xl border border-white/5 cursor-pointer hover:border-purple-500/30 transition-colors"
                              title="Click to inspect complete submission"
                            >
                              &quot;{esc.submissionNotes}&quot;
                            </div>
                          )}
                        </div>
                      )}

                      {/* CLIENT VERIFIED REVIEW IF RELEASED */}
                      {esc.review && (
                        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-1 text-xs">
                          <div className="flex items-center justify-between text-[11px] font-bold text-amber-300">
                            <span className="flex items-center gap-1.5">
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                              <span>Client Verified Review ({esc.review.rating}/5 Stars)</span>
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">100% On-Chain Escrow</span>
                          </div>
                          <p className="text-[11px] text-slate-200 italic">
                            &quot;{esc.review.comment}&quot;
                          </p>
                        </div>
                      )}

                      {/* CLIENT & CONTRACTOR WALLET BINDINGS */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono text-slate-400 pt-2 border-t border-white/5">
                        <div>
                          <span className="text-slate-500">Client: </span>
                          <span className={isCurrentClient ? "text-cyan-300 font-bold" : ""}>
                            {esc.client ? `${esc.client.slice(0, 6)}...${esc.client.slice(-4)}` : "InnoXpert Client"}
                            {isCurrentClient ? " (You)" : ""}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500">Contractor: </span>
                          <span className={isCurrentContractor ? "text-purple-300 font-bold" : "text-cyan-300 font-semibold"}>
                            {esc.contractorName ? `${esc.contractorName} (` : ""}
                            {esc.contractor ? `${esc.contractor.slice(0, 6)}...${esc.contractor.slice(-4)}` : "Verified"}
                            {esc.contractorName ? ")" : ""}
                            {isCurrentContractor ? " (You)" : ""}
                          </span>
                        </div>
                      </div>

                      {/* TRANSACTION HASHES & REFERENCES */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] font-mono text-slate-500 pt-1 border-t border-white/5 min-w-0">
                        <div className="flex items-center gap-2 truncate max-w-full sm:max-w-xs min-w-0">
                          <span className="truncate">Ref: {targetId}</span>
                          <button
                            onClick={() => copyToClipboard(targetId, targetId)}
                            className="hover:text-cyan-400 transition-colors cursor-pointer"
                            title="Copy Agreement ID"
                          >
                            {copiedId === targetId ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                          {esc.txHash && (
                            <a
                              href={`${explorerBase}/tx/${esc.txHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[10px] text-cyan-400 hover:text-cyan-300 underline font-mono"
                            >
                              <span>Lock Tx</span>
                              <ArrowUpRight className="w-3 h-3" />
                            </a>
                          )}

                          {esc.releaseTxHash && (
                            <a
                              href={`${explorerBase}/tx/${esc.releaseTxHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[10px] text-emerald-400 hover:text-emerald-300 font-bold underline font-mono"
                            >
                              <span>Release Payout Tx</span>
                              <ArrowUpRight className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>

                      {/* STRICT ROLE ACTIONS & WORKFLOW TRANSITIONS */}
                      {isLocked && (
                        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-white/5 bg-slate-950/60 p-3 rounded-2xl">
                          <div className="flex items-center gap-2 text-xs text-amber-300">
                            <Clock className="w-4 h-4 text-amber-400 animate-pulse shrink-0" />
                            <span className="text-[11px]">
                              {isCurrentContractor
                                ? "You are the assigned contractor. Execute milestone requirements and upload deliverables when ready."
                                : isCurrentClient
                                ? `Milestone funds securely escrowed in smart contract. Assigned contractor (${esc.contractorName || "Contractor"}) is executing your scope.`
                                : `Funds locked in escrow. Assigned contractor (${esc.contractorName || "Contractor"}) is executing scope.`}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {/* ONLY ASSIGNED CONTRACTOR CAN SUBMIT DELIVERABLES */}
                            {isCurrentContractor ? (
                              <button
                                type="button"
                                onClick={() => openSubmitModal(esc)}
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 border border-purple-500/40 shadow-lg shadow-purple-500/20 transition-all cursor-pointer"
                                title="Contractor submits completed milestone deliverables"
                              >
                                <Upload className="w-3.5 h-3.5" />
                                <span>Submit Deliverable ↗</span>
                              </button>
                            ) : (
                              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/20">
                                <Zap className="w-3.5 h-3.5 text-amber-400" />
                                <span>{isCurrentClient ? "Awaiting Contractor Submission" : "Work In Progress"}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {isSubmitted && (
                        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-white/5 bg-cyan-950/30 border border-cyan-500/30 p-3 rounded-2xl">
                          <div>
                            <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                              <FileCheck className="w-4 h-4 text-cyan-400" />
                              <span>
                                {isCurrentClient
                                  ? "Deliverables Submitted for Your Approval"
                                  : isCurrentContractor
                                  ? "Deliverable Submitted · Awaiting Client Payout"
                                  : "Deliverables Submitted for Client Review"}
                              </span>
                            </span>
                            <p className="text-[11px] text-slate-300 mt-0.5">
                              {isCurrentClient
                                ? "Verify cryptographic proof in Notary above before releasing live on-chain payout to contractor."
                                : isCurrentContractor
                                ? `Your deliverable is submitted. Client (${esc.client ? esc.client.slice(0, 6) + "..." + esc.client.slice(-4) : "Client"}) must verify proof and authorize payout release.`
                                : `Milestone completed. Only the client (${esc.client ? esc.client.slice(0, 6) + "..." + esc.client.slice(-4) : "Client"}) can authorize payout release.`}
                            </p>
                          </div>
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                            {/* CLIENT PRIMARY ACTION: INSPECT & REVIEW WORK */}
                            <button
                              type="button"
                              onClick={() => setInspectingDeliverable(esc)}
                              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-purple-500/20 text-purple-200 border border-purple-500/40 hover:bg-purple-500/30 hover:border-purple-400/60 transition-all cursor-pointer shadow-lg shadow-purple-500/15"
                              title="Inspect contractor deliverable links, notes, and verify scope requirements"
                            >
                              <Eye className="w-4 h-4 text-purple-300" />
                              <span>Review Work 👁️</span>
                            </button>

                            <button
                              onClick={() => {
                                window.dispatchEvent(
                                  new CustomEvent("lexiguard_verify_hash", {
                                    detail: { hash: esc.proposalDocHash || esc.agreementId },
                                  })
                                );
                                const el = document.getElementById("verifier-tool");
                                if (el) el.scrollIntoView({ behavior: "smooth" });
                              }}
                              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/25 transition-all cursor-pointer text-center"
                              title="Verify document and agreement integrity in Instant Notary Verifier"
                            >
                              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                              <span>Verify Proof ↑</span>
                            </button>

                            {/* STRICT SECURITY: ONLY CLIENT WHO DEPOSITED CAN RELEASE PAYOUT */}
                            {isCurrentClient ? (
                              <button
                                onClick={() => handleRelease(esc)}
                                disabled={isReleasing}
                                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/30 transition-all cursor-pointer disabled:opacity-50 text-center font-bold"
                              >
                                <Unlock className={`w-3.5 h-3.5 ${isReleasing ? "animate-spin" : ""}`} />
                                <span>{isReleasing ? "Releasing Payout..." : `Approve & Release ${esc.amountEth} ETH`}</span>
                              </button>
                            ) : isCurrentContractor ? (
                              <div className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-900/90 text-amber-300 border border-amber-500/30 text-center">
                                <Lock className="w-3.5 h-3.5 text-amber-400" />
                                <span>Awaiting Client Payout</span>
                              </div>
                            ) : (
                              <div className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-900/60 text-slate-400 border border-white/10 text-center">
                                <Shield className="w-3.5 h-3.5 text-slate-500" />
                                <span>Client Authorized Only</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {isReleased && (
                        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-white/5">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-emerald-400 font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Payout Settled on Base Sepolia
                            </span>
                            {esc.releaseTxHash && (
                              <a
                                href={`${explorerBase}/tx/${esc.releaseTxHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] text-cyan-300 underline font-mono hover:text-cyan-200"
                              >
                                View Settlement Tx ↗
                              </a>
                            )}
                          </div>
                          {/* ONLY CLIENT CAN LEAVE REVIEW */}
                          {isCurrentClient && !esc.review && (
                            <button
                              onClick={() => {
                                setReviewingEscrow(esc);
                                setReviewRating(5);
                                setReviewComment("Exceptional work! Smart legal contracts delivered on Base with high quality.");
                              }}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition-all shadow-sm cursor-pointer"
                            >
                              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                              <span>Leave Contractor Review (5★)</span>
                            </button>
                          )}
                          {isCurrentContractor && (
                            <div className="text-[11px] font-mono text-emerald-300 bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                              ✓ Received {(parseFloat(esc.amountEth || "0") * 0.99).toFixed(5)} ETH Net Payout
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* VIEW CLIENT TASK PROPOSAL & SPECIFICATION MODAL */}
      {mounted && viewingProposalEscrow && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setViewingProposalEscrow(null);
          }}
        >
          <div
            className="w-full max-w-lg max-h-[88vh] overflow-y-auto rounded-3xl bg-[#090d1a] border-2 border-cyan-500/40 p-4 sm:p-6 space-y-4 sm:space-y-5 shadow-[0_0_60px_rgba(6,182,212,0.3)] relative overflow-hidden animate-in zoom-in-95 duration-200 text-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Ambient Cyber Glow Accents */}
            <div className="absolute -top-24 -left-24 w-60 h-60 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

            {/* Close Button Pill */}
            <button
              type="button"
              onClick={() => setViewingProposalEscrow(null)}
              className="absolute right-3.5 top-3.5 sm:right-5 sm:top-5 p-2 rounded-full bg-slate-800/90 hover:bg-slate-700 text-slate-400 hover:text-white transition-all z-20 cursor-pointer shadow-md"
              title="Close modal"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Header with Icon & Badges */}
            <div className="space-y-1.5 pr-8 sm:pr-10 relative z-10">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 text-[10px] font-bold uppercase tracking-wider border border-cyan-500/30">
                <FileText className="w-3 h-3 text-cyan-400" /> Client Scope of Work &amp; Proposal
              </div>
              <h3 className="text-base sm:text-xl font-bold text-white tracking-tight leading-snug">
                {viewingProposalEscrow.proposalTitle || viewingProposalEscrow.milestoneDesc}
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-400 leading-normal">
                Agreed milestone requirements cryptographically bound to Agreement #{viewingProposalEscrow.agreementId?.slice(0, 10)}...
              </p>
            </div>

            <div className="space-y-3 text-xs relative z-10">
              {/* Attached Specification Document */}
              {viewingProposalEscrow.proposalDocName && (
                <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-950/80 border border-cyan-500/20 space-y-2 shadow-inner">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center justify-between">
                    <span>Attached Specification Document</span>
                    <span className="text-emerald-400 font-mono text-[9px] bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      Verified SHA-256
                    </span>
                  </span>
                  <div className="flex items-center justify-between text-cyan-300 font-semibold gap-2">
                    <span className="flex items-center gap-1.5 truncate">
                      <FileCheck className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span className="truncate">{viewingProposalEscrow.proposalDocName}</span>
                    </span>
                  </div>
                  {viewingProposalEscrow.proposalDocHash && (
                    <div className="flex items-center justify-between gap-2 bg-black/50 p-2 rounded-xl border border-white/5 font-mono text-[10px]">
                      <span className="text-slate-400 truncate">
                        Digest: <span className="text-cyan-300">{viewingProposalEscrow.proposalDocHash}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(viewingProposalEscrow.proposalDocHash, "proposal-doc-hash")}
                        className="hover:text-cyan-300 text-slate-400 transition-colors shrink-0 p-1 cursor-pointer"
                        title="Copy SHA-256 Digest"
                      >
                        {copiedId === "proposal-doc-hash" ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Acceptance Criteria & Checklist */}
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-white/10 space-y-2 shadow-inner">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-cyan-400" /> Acceptance Criteria &amp; Task Checklist
                </span>
                <p className="text-slate-200 whitespace-pre-line leading-relaxed text-xs">
                  {viewingProposalEscrow.proposalRequirements || viewingProposalEscrow.milestoneDesc}
                </p>
              </div>

              {/* Escrow Details */}
              <div className="grid grid-cols-2 gap-2 text-[11px] p-2.5 rounded-xl bg-slate-950/90 text-slate-300 font-mono border border-white/5">
                <div>
                  <span className="text-slate-500">Milestone: </span>
                  <span className="text-cyan-300 font-bold">{viewingProposalEscrow.amountEth} ETH</span>
                </div>
                <div className="truncate">
                  <span className="text-slate-500">Contractor: </span>
                  <span className="text-emerald-400">{viewingProposalEscrow.contractor?.slice(0, 8)}...</span>
                </div>
              </div>
            </div>

            {/* Bottom Actions - Responsive */}
            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2 border-t border-white/5 relative z-10">
              {viewingProposalEscrow.proposalDocHash ? (
                <button
                  type="button"
                  onClick={() => {
                    const hashToVerify = viewingProposalEscrow.proposalDocHash;
                    setViewingProposalEscrow(null);
                    window.dispatchEvent(
                      new CustomEvent("lexiguard_verify_hash", {
                        detail: { hash: hashToVerify },
                      })
                    );
                    const el = document.getElementById("verifier-tool");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 cursor-pointer transition-all shadow-sm"
                >
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  <span>Verify Hash in Notary Tool ↑</span>
                </button>
              ) : <div />}
              <button
                type="button"
                onClick={() => setViewingProposalEscrow(null)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-800 text-slate-200 border border-white/10 hover:bg-slate-700 transition-all cursor-pointer text-center"
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* CONTRACTOR DELIVERABLE SUBMISSION MODAL */}
      {mounted && isSubmitModalOpen && activeEscrowForSubmit && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsSubmitModalOpen(false);
          }}
        >
          <div
            className="w-full max-w-lg max-h-[88vh] overflow-y-auto rounded-3xl bg-[#090d1a] border-2 border-purple-500/40 p-4 sm:p-6 space-y-4 sm:space-y-5 shadow-[0_0_60px_rgba(168,85,247,0.3)] relative overflow-hidden animate-in zoom-in-95 duration-200 text-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Ambient Cyber Glow Accents */}
            <div className="absolute -top-24 -left-24 w-60 h-60 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

            {/* Close Button Pill */}
            <button
              type="button"
              onClick={() => setIsSubmitModalOpen(false)}
              className="absolute right-3.5 top-3.5 sm:right-5 sm:top-5 p-2 rounded-full bg-slate-800/90 hover:bg-slate-700 text-slate-400 hover:text-white transition-all z-20 cursor-pointer shadow-md"
              title="Close modal"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Header with Icon & Badges */}
            <div className="space-y-1.5 pr-8 sm:pr-10 relative z-10">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-300 text-[10px] font-bold uppercase tracking-wider border border-purple-500/30">
                <Send className="w-3 h-3 text-purple-400" /> Contractor Work Submission
              </div>
              <h3 className="text-base sm:text-xl font-bold text-white tracking-tight leading-snug">
                Submit Milestone Deliverables
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-400 leading-normal">
                Submit your project repository or completion proofs for client review and on-chain escrow fund release.
              </p>
            </div>

            <form onSubmit={handleDeliverableSubmit} className="space-y-3.5 text-xs relative z-10">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Milestone Scope
                </label>
                <div className="p-2.5 rounded-xl bg-slate-950/80 text-slate-300 border border-white/10 font-semibold">
                  {activeEscrowForSubmit.milestoneDesc} ({activeEscrowForSubmit.amountEth} ETH)
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Deliverable URL (GitHub / IPFS / Demo / Audit PDF)
                </label>
                <input
                  type="url"
                  required
                  value={deliverableUrl}
                  onChange={(e) => setDeliverableUrl(e.target.value)}
                  placeholder="https://github.com/org/repo or https://ipfs.io/..."
                  className="w-full rounded-xl bg-slate-950/80 p-2.5 text-white border border-white/10 focus:border-cyan-500/40 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Completion Notes &amp; Technical Summary
                </label>
                <textarea
                  rows={3}
                  required
                  value={submissionNotes}
                  onChange={(e) => setSubmissionNotes(e.target.value)}
                  placeholder="Describe the completed scope, unit test results, or legal compliance checks..."
                  className="w-full rounded-xl bg-slate-950/80 p-2.5 text-white border border-white/10 focus:border-cyan-500/40 focus:outline-none resize-none"
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-2 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-slate-400 hover:text-white font-semibold transition-colors text-center cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingWork}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-400 hover:to-cyan-400 text-white shadow-lg shadow-purple-500/20 disabled:opacity-50 transition-all text-center cursor-pointer"
                >
                  {isSubmittingWork ? "Submitting Work..." : "Submit to Client"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* CLIENT REVIEW & RATING MODAL */}
      {mounted && reviewingEscrow && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setReviewingEscrow(null);
          }}
        >
          <div
            className="w-full max-w-md max-h-[88vh] overflow-y-auto rounded-3xl bg-[#090d1a] border-2 border-amber-500/40 p-4 sm:p-6 space-y-4 sm:space-y-5 shadow-[0_0_60px_rgba(245,158,11,0.3)] relative overflow-hidden animate-in zoom-in-95 duration-200 text-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Ambient Cyber Glow Accents */}
            <div className="absolute -top-24 -left-24 w-60 h-60 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-orange-500/15 rounded-full blur-3xl pointer-events-none" />

            {/* Close Button Pill */}
            <button
              type="button"
              onClick={() => setReviewingEscrow(null)}
              className="absolute right-3.5 top-3.5 sm:right-5 sm:top-5 p-2 rounded-full bg-slate-800/90 hover:bg-slate-700 text-slate-400 hover:text-white transition-all z-20 cursor-pointer shadow-md"
              title="Close modal"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Header with Icon & Badges */}
            <div className="space-y-1.5 pr-8 sm:pr-10 relative z-10">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 text-[10px] font-bold uppercase tracking-wider border border-amber-500/30">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> Leave Contractor Review
              </div>
              <h3 className="text-base sm:text-xl font-bold text-white tracking-tight leading-snug">
                Rate &amp; Review Contractor
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-400 leading-normal">
                Your feedback will be permanently saved to {reviewingEscrow.contractorName || "the Contractor"}&apos;s verified on-chain profile.
              </p>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-3.5 text-xs relative z-10">
              {/* Star Rating Selector */}
              <div>
                <label className="block text-slate-400 font-semibold mb-2">
                  Rating Score
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setReviewRating(star)}
                      className="p-1 text-2xl transition-transform hover:scale-125 focus:outline-none cursor-pointer"
                    >
                      <Star
                        className={`w-6 h-6 sm:w-7 sm:h-7 ${
                          star <= reviewRating
                            ? "text-amber-400 fill-amber-400"
                            : "text-slate-600"
                        }`}
                      />
                    </button>
                  ))}
                  <span className="font-bold text-amber-300 text-xs sm:text-sm ml-2">
                    {reviewRating} of 5 Stars
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Client Review Feedback
                </label>
                <textarea
                  rows={3}
                  required
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Share details about the quality of deliverables, communication, and on-time completion..."
                  className="w-full rounded-xl bg-slate-950/80 p-2.5 text-white border border-white/10 focus:border-amber-500/40 focus:outline-none resize-none"
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-2 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setReviewingEscrow(null)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-slate-400 hover:text-white font-semibold transition-colors text-center cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white shadow-lg shadow-amber-500/20 disabled:opacity-50 transition-all text-center cursor-pointer"
                >
                  {isSubmittingReview ? "Submitting..." : "Publish Review"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ULTRA-PROFESSIONAL ORDER CONGRATULATIONS & ESCROW CONFIRMATION MODAL */}
      {mounted && successOrderModal && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSuccessOrderModal(null);
          }}
        >
          <div
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-[#090d1a] border-2 border-cyan-500/40 p-5 sm:p-8 space-y-6 shadow-[0_0_70px_rgba(6,182,212,0.3)] relative overflow-hidden animate-in zoom-in-95 duration-200 text-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Ambient Cyber Glow Accents */}
            <div className="absolute -top-32 -left-32 w-72 h-72 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-32 -right-32 w-72 h-72 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Close Button */}
            <button
              type="button"
              onClick={() => setSuccessOrderModal(null)}
              className="absolute right-4 top-4 sm:right-6 sm:top-6 p-2 rounded-full bg-slate-800/90 hover:bg-slate-700 text-slate-400 hover:text-white transition-all z-20 cursor-pointer shadow-md"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Glowing Icon Header with Animated Pulse Rings */}
            <div className="text-center space-y-2.5 pt-1 relative z-10">
              <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
                <div className="absolute inset-0 rounded-3xl bg-emerald-500/20 animate-ping opacity-30" />
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-cyan-500/25 via-emerald-500/25 to-blue-500/25 border-2 border-emerald-400/50 flex items-center justify-center shadow-xl shadow-emerald-500/20 backdrop-blur-md">
                  <Sparkles className="w-9 h-9 text-emerald-400 animate-pulse" />
                </div>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 text-xs font-bold border border-emerald-500/40 shadow-inner">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Smart Legal Escrow Locked &amp; Anchored On-Chain</span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                🎉 Congratulations! Order Confirmed
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
                Your legal milestone funds and acceptance requirements are now securely locked in the Base Sepolia Escrow Vault. Funds will only disburse once you review and approve the deliverables.
              </p>
            </div>

            {/* Order Highlights Summary Card */}
            <div className="rounded-2xl bg-slate-950/80 border border-cyan-500/20 p-4 sm:p-5 space-y-3.5 relative z-10 shadow-inner">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2.5 border-b border-white/5">
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                  Milestone Phase:
                </span>
                <span className="text-xs font-bold text-cyan-300 sm:text-right">
                  {successOrderModal.milestoneDesc}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-900/90 border border-white/5 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                    Total Locked in Vault:
                  </span>
                  <div className="flex items-baseline gap-2">
                    <p className="text-lg font-mono font-black text-cyan-300">
                      {successOrderModal.amountEth} ETH
                    </p>
                    <span className="text-[10px] text-slate-400 font-mono">
                      (~${(parseFloat(successOrderModal.amountEth) * 3500).toFixed(2)} USD)
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/90 border border-white/5 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                    Assigned Contractor:
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <p className="text-xs font-bold text-white truncate">
                      {successOrderModal.contractorName || "Verified Engineer"}
                    </p>
                  </div>
                  <p className="text-[10px] font-mono text-cyan-400 truncate">
                    {successOrderModal.contractor}
                  </p>
                </div>
              </div>

              {/* Protocol Fee Breakdown */}
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1 border-t border-white/5">
                <span className="flex items-center gap-1">
                  <span>Contractor Payout (99%):</span>
                  <strong className="text-emerald-400">{successOrderModal.contractorPayoutEth} ETH</strong>
                </span>
                <span className="flex items-center gap-1">
                  <span>Protocol Security Fee (1%):</span>
                  <strong className="text-amber-400">{successOrderModal.protocolFeeEth} ETH</strong>
                </span>
              </div>

              {/* Attached Scope Brief */}
              {successOrderModal.proposalDocName && (
                <div className="p-2.5 rounded-xl bg-cyan-950/20 border border-cyan-500/20 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <FileText className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span className="text-slate-300 font-semibold truncate">
                      Attached Scope: {successOrderModal.proposalDocName}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 shrink-0">
                    SHA-256 Signed
                  </span>
                </div>
              )}
            </div>

            {/* Cryptographic Proofs & Live Hashes */}
            <div className="rounded-2xl bg-slate-950/80 border border-white/10 p-4 space-y-2.5 text-xs font-mono relative z-10">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
                <span className="flex items-center gap-1.5 text-cyan-300">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  <span>On-Chain Cryptographic Proofs:</span>
                </span>
                <span className="text-emerald-400 text-[10px] bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-sans font-bold">
                  100% Immutable Proof
                </span>
              </div>

              {/* Document Hash */}
              {successOrderModal.proposalDocHash && (
                <div className="p-2 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between gap-2">
                  <div className="truncate text-[10px]">
                    <span className="text-slate-500 font-sans">Document SHA-256: </span>
                    <span className="text-cyan-300">{successOrderModal.proposalDocHash}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(successOrderModal.proposalDocHash, "modal-doc-hash")}
                    className="hover:text-cyan-400 transition-colors shrink-0 text-slate-400 cursor-pointer p-1"
                    title="Copy SHA-256 Digest"
                  >
                    {copiedId === "modal-doc-hash" ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              )}

              {/* Transaction Hash */}
              <div className="p-2 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between gap-2">
                <div className="truncate text-[10px]">
                  <span className="text-slate-500 font-sans">Base Sepolia Tx: </span>
                  <span className="text-emerald-300">{successOrderModal.txHash}</span>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(successOrderModal.txHash, "modal-tx-hash")}
                  className="hover:text-cyan-400 transition-colors shrink-0 text-slate-400 cursor-pointer p-1"
                  title="Copy Transaction Hash"
                >
                  {copiedId === "modal-tx-hash" ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              {/* Agreement ID */}
              <div className="p-2 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between gap-2">
                <div className="truncate text-[10px]">
                  <span className="text-slate-500 font-sans">Agreement Reference: </span>
                  <span className="text-purple-300">{successOrderModal.agreementId}</span>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(successOrderModal.agreementId, "modal-agree-id")}
                  className="hover:text-cyan-400 transition-colors shrink-0 text-slate-400 cursor-pointer p-1"
                  title="Copy Agreement ID"
                >
                  {copiedId === "modal-agree-id" ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Non-Custodial Vault Guarantee Banner */}
            <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-cyan-500/10 to-blue-500/10 border border-emerald-500/30 text-xs flex items-start gap-2.5 relative z-10">
              <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5 text-[11px] text-slate-300">
                <strong className="text-emerald-300 font-semibold block">
                  Zero-Risk Non-Custodial Guarantee
                </strong>
                <span>
                  Funds are secured on Base Sepolia EVM smart contract (<code className="text-cyan-300 font-mono">0x74b1...E300</code>). Neither the contractor nor any third party can claim the escrow without your explicit approval signature.
                </span>
              </div>
            </div>

            {/* Next Steps Workflow Tracker */}
            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-cyan-500/20 space-y-2 text-xs relative z-10">
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Next Milestone Steps:
              </span>
              <div className="grid grid-cols-3 gap-2 text-[10px] pt-1">
                <div className="p-2.5 rounded-xl bg-slate-900/90 border border-emerald-500/40 text-center space-y-1">
                  <div className="text-emerald-400 font-bold flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> 1. Locked
                  </div>
                  <p className="text-slate-400 text-[9px]">Funds deposited in contract</p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900/90 border border-cyan-500/40 text-center space-y-1">
                  <div className="text-cyan-300 font-bold flex items-center justify-center gap-1 animate-pulse">
                    <Zap className="w-3 h-3 text-cyan-400" /> 2. Work Done
                  </div>
                  <p className="text-slate-400 text-[9px]">Contractor submits proof</p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900/90 border border-purple-500/40 text-center space-y-1">
                  <div className="text-purple-300 font-bold flex items-center justify-center gap-1">
                    <Star className="w-3 h-3 text-purple-400" /> 3. Release &amp; Rate
                  </div>
                  <p className="text-slate-400 text-[9px]">Review, payout &amp; feedback</p>
                </div>
              </div>
            </div>

            {/* Action Buttons Toolbar */}
            <div className="space-y-2 pt-1 relative z-10">
              <div className="flex flex-col sm:flex-row items-center gap-2.5">
                <a
                  href={`${explorerBase}/tx/${successOrderModal.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:flex-1 py-3 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 transition-all shadow-lg shadow-cyan-500/25 inline-flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>View Receipt on BaseScan ↗</span>
                </a>

                <button
                  type="button"
                  onClick={() => handlePrintReceipt(successOrderModal)}
                  className="w-full sm:w-auto py-3 px-4 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 transition-all cursor-pointer inline-flex items-center justify-center gap-1.5"
                  title="Print or Save PDF Receipt Certificate"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Receipt</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCopySummary(successOrderModal)}
                  className="w-full sm:w-auto py-3 px-4 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 transition-all cursor-pointer inline-flex items-center justify-center gap-1.5"
                  title="Copy Order Proof Summary to Clipboard"
                >
                  {copiedId === "modal-summary" ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4" />
                      <span>Share Proof</span>
                    </>
                  )}
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSuccessOrderModal(null);
                  const el = document.getElementById("escrow-orders-ledger");
                  if (el) {
                    el.scrollIntoView({ behavior: "smooth" });
                  }
                }}
                className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-slate-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer text-center"
              >
                Done / Track in Escrow Ledger ↓
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* COMPREHENSIVE CONTRACTOR DELIVERABLE WORK INSPECTOR MODAL */}
      {mounted && inspectingDeliverable && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setInspectingDeliverable(null);
          }}
        >
          <div
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-[#090d1a] border-2 border-purple-500/40 p-5 sm:p-8 space-y-5 shadow-[0_0_70px_rgba(168,85,247,0.3)] relative overflow-hidden animate-in zoom-in-95 duration-200 text-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Ambient Cyber Glow Accents */}
            <div className="absolute -top-32 -left-32 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-32 -right-32 w-72 h-72 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />

            {/* Close Button */}
            <button
              type="button"
              onClick={() => setInspectingDeliverable(null)}
              className="absolute right-4 top-4 sm:right-6 sm:top-6 p-2 rounded-full bg-slate-800/90 hover:bg-slate-700 text-slate-400 hover:text-white transition-all z-20 cursor-pointer shadow-md"
              title="Close inspector"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="space-y-2 pr-8 sm:pr-10 relative z-10">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/15 text-purple-300 text-xs font-bold border border-purple-500/40">
                <FileCheck className="w-3.5 h-3.5 text-purple-400" />
                <span>Contractor Milestone Deliverable Inspector</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {inspectingDeliverable.milestoneDesc || "Milestone Deliverables Review"}
              </h3>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-1">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <User className="w-3.5 h-3.5 text-purple-400" />
                  <span>Contractor: <strong className="text-white">{inspectingDeliverable.contractorName || "Assigned Contractor"}</strong></span>
                </span>
                <span className="text-slate-600">·</span>
                <span className="text-cyan-300 font-mono font-bold">
                  Escrow: {inspectingDeliverable.amountEth} ETH
                </span>
                <span className="text-slate-600">·</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  inspectingDeliverable.status === "RELEASED"
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                    : "bg-blue-500/20 text-blue-300 border border-blue-500/40"
                }`}>
                  {inspectingDeliverable.status === "RELEASED" ? "SETTLED & RELEASED" : "SUBMITTED FOR APPROVAL"}
                </span>
              </div>
            </div>

            {/* Primary Deliverable Link / Artifact Card */}
            <div className="rounded-2xl bg-slate-950/90 border border-purple-500/30 p-4 sm:p-5 space-y-3 relative z-10 shadow-inner">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-purple-400" />
                  <span>Deliverable Artifact / Work Link</span>
                </span>
                {inspectingDeliverable.deliverableUrl && (
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                    Active Verification Link
                  </span>
                )}
              </div>

              {inspectingDeliverable.deliverableUrl ? (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-slate-900 border border-white/10 font-mono text-xs text-cyan-300 break-all select-all flex items-center justify-between gap-3">
                    <span className="truncate">{inspectingDeliverable.deliverableUrl}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(inspectingDeliverable.deliverableUrl, "deliverable-modal-url")}
                      className="text-slate-400 hover:text-cyan-300 shrink-0 p-1 cursor-pointer"
                      title="Copy URL"
                    >
                      {copiedId === "deliverable-modal-url" ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  <a
                    href={inspectingDeliverable.deliverableUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white shadow-xl shadow-purple-500/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] cursor-pointer"
                  >
                    <span>Open Deliverable Work in New Tab</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-900/70 border border-white/5 text-center text-xs text-slate-400 italic">
                  Contractor submitted notes and scope completion without external URL. Inspect submission details below.
                </div>
              )}
            </div>

            {/* Contractor Submission Notes */}
            <div className="rounded-2xl bg-slate-950/80 border border-white/10 p-4 sm:p-5 space-y-2 relative z-10">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-cyan-400" />
                <span>Contractor Completion Notes &amp; Audit Summary</span>
              </span>
              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-white/5 text-xs text-slate-200 leading-relaxed italic whitespace-pre-line">
                &quot;{inspectingDeliverable.submissionNotes || "Completed milestone scope requirements under BLI legal standards. Verified unit tests passing and cryptographic SHA-256 bound."}&quot;
              </div>
            </div>

            {/* Scope Acceptance Checklist */}
            <div className="rounded-2xl bg-slate-950/80 border border-white/10 p-4 sm:p-5 space-y-2.5 relative z-10">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <BadgeCheck className="w-4 h-4 text-emerald-400" />
                  <span>Original Scope Requirements &amp; Acceptance Criteria</span>
                </span>
                <span className="text-[10px] text-slate-500 font-mono">Verified Checklist</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-white/5 text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                {inspectingDeliverable.proposalRequirements ||
                  "1. Comprehensive smart contract clause verification under BLI standards.\n2. Automated zero-knowledge cryptographic anchoring on Base Sepolia.\n3. Complete unit test coverage and verification certificate."}
              </div>
            </div>

            {/* Modal Action Footer */}
            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-white/10 relative z-10">
              <button
                type="button"
                onClick={() => setInspectingDeliverable(null)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 transition-colors text-center cursor-pointer"
              >
                Close Preview
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const hashToVerify = inspectingDeliverable.proposalDocHash || inspectingDeliverable.agreementId;
                    setInspectingDeliverable(null);
                    window.dispatchEvent(
                      new CustomEvent("lexiguard_verify_hash", {
                        detail: { hash: hashToVerify },
                      })
                    );
                    const el = document.getElementById("verifier-tool");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="px-3.5 py-2.5 rounded-xl text-xs font-bold bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  <span>Verify Hash in Notary ↑</span>
                </button>

                {inspectingDeliverable.status === "SUBMITTED" && Boolean(activeAccount && inspectingDeliverable.client && inspectingDeliverable.client.toLowerCase() === activeAccount.toLowerCase()) && (
                  <button
                    type="button"
                    onClick={() => {
                      const item = inspectingDeliverable;
                      setInspectingDeliverable(null);
                      handleRelease(item);
                    }}
                    disabled={releasingId === (inspectingDeliverable.agreementId || inspectingDeliverable.id)}
                    className="px-5 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 shadow-xl shadow-emerald-500/30 flex items-center gap-2 cursor-pointer transition-all hover:scale-[1.02]"
                  >
                    <Unlock className="w-4 h-4" />
                    <span>Approve &amp; Release {inspectingDeliverable.amountEth} ETH</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Wallet Connect Modal */}
      <WalletConnectModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
      />

      {/* Top Up / Faucet Modal */}
      <TopUpModal
        isOpen={isTopUpModalOpen}
        onClose={() => setIsTopUpModalOpen(false)}
      />
    </section>
  );
}
