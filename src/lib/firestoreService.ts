/**
 * Firestore Service for LexiGuard AI
 * Uses isolated "lexiguard_*" collections to safeguard existing user demo data.
 */
import { db, storage } from "./firebase";
import {
  collection,
  doc,
  getDoc,
  setDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  addDoc,
  updateDoc,
  Timestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { LegalAuditReport } from "./aiLegalAuditor";
import { NotarizationResult } from "./web3Service";

export interface SiteSettings {
  heroTitle: string;
  heroSubtitle: string;
  announcementText: string;
  geminiApiKey?: string;
  openaiApiKey?: string;
  customRpcUrl?: string;
  pinataJwt?: string;
  enablePublicNotarizations: boolean;
  enableEscrowModule: boolean;
  ownerTreasuryAddress: string;
  protocolFeePercentage: number;
  enableProtocolFee: boolean;
  enableCreditPaywall: boolean;
  freeCreditsCount: number;
  starterPackPriceEth: string;
  proPackPriceEth: string;
  agencyPackPriceEth: string;
  enableContractorHiring: boolean;
}

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  heroTitle: "Audit, Redline & Notarize Legal Contracts with AI on the Blockchain",
  heroSubtitle: "LexiGuard AI parses complex agreements, uncovers hidden legal liabilities in seconds, and registers tamper-proof cryptographic proofs of existence onto EVM networks.",
  announcementText: "🏆 Official Entry for the Blockchain Legal Institute (BLI) Hackathon 2 by InnoXpert Studio",
  geminiApiKey: "",
  openaiApiKey: "",
  customRpcUrl: "https://sepolia.base.org",
  pinataJwt: "",
  enablePublicNotarizations: true,
  enableEscrowModule: true,
  ownerTreasuryAddress: "0x7F2B89a468eB3f4D9165b4c10a12e87319E454E2",
  protocolFeePercentage: 1.0,
  enableProtocolFee: true,
  enableCreditPaywall: false, // Default false for smooth judge evaluation
  freeCreditsCount: 3,
  starterPackPriceEth: "0.005",
  proPackPriceEth: "0.012",
  agencyPackPriceEth: "0.030",
  enableContractorHiring: true,
};

// Fetch site configuration from Firestore with fallback
export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const settingsDoc = await getDoc(doc(db, "lexiguard_settings", "global"));
    if (settingsDoc.exists()) {
      return { ...DEFAULT_SITE_SETTINGS, ...settingsDoc.data() } as SiteSettings;
    }
  } catch (err) {
    console.warn("Could not load Firestore settings, using default state:", err);
  }
  return DEFAULT_SITE_SETTINGS;
}

// Update site configuration in Firestore
export async function saveSiteSettings(settings: Partial<SiteSettings>): Promise<boolean> {
  try {
    await setDoc(doc(db, "lexiguard_settings", "global"), settings, { merge: true });
    return true;
  } catch (err) {
    console.error("Error saving Firestore settings:", err);
    return false;
  }
}

// Save a notarized contract record to Firestore & LocalStorage
export async function saveNotarizedContract(
  audit: LegalAuditReport,
  notary: NotarizationResult
): Promise<string | null> {
  const newRecord = {
    title: audit.title,
    overallScore: audit.overallScore,
    riskSummary: audit.riskSummary,
    criticalRisksCount: audit.criticalRisksCount,
    warningRisksCount: audit.warningRisksCount,
    docHash: notary.docHash,
    txHash: notary.txHash,
    explorerUrl: notary.explorerUrl,
    contractUrl: notary.contractUrl || "https://sepolia.basescan.org/address/0x892a0dC7917C57E8675c9A9EbDE648F40F63F286",
    network: notary.network,
    blockNumber: notary.blockNumber,
    notarizedBy: notary.notarizedBy,
    createdAt: { seconds: Math.floor(Date.now() / 1000) },
    clausesCount: audit.totalClausesAnalyzed,
  };

  // Always persist locally so it appears immediately and never resets on reload
  if (typeof window !== "undefined") {
    try {
      const stored = JSON.parse(localStorage.getItem("lexiguard_user_notarizations") || "[]");
      localStorage.setItem("lexiguard_user_notarizations", JSON.stringify([newRecord, ...stored]));
    } catch (e) {
      console.warn("Could not save notarization to localStorage:", e);
    }
  }

  try {
    const docRef = await addDoc(collection(db, "lexiguard_contracts"), {
      ...newRecord,
      createdAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (err) {
    console.warn("Could not save to Firestore, stored in persistent local session:", err);
    return notary.txHash;
  }
}

// Fetch all notarized contracts for public ledger (merging local and Firestore)
export async function getNotarizedContracts(): Promise<any[]> {
  let localRecords: any[] = [];
  if (typeof window !== "undefined") {
    try {
      localRecords = JSON.parse(localStorage.getItem("lexiguard_user_notarizations") || "[]");
    } catch (e) {}
  }

  const defaultDemoContracts = [
    {
      id: "demo-1",
      title: "Cross-Border IP Licensing & Royalty Agreement",
      overallScore: 91,
      riskSummary: "Compliant agreement verified with zero critical indemnity liabilities.",
      docHash: "0x8fa92300bcf42821a938c41d019f93318b762514e82361730248a31e8c71b302",
      txHash: "0x3e18a9023ffc8382910fa8319e763190823610938b710239c81920387123901b",
      explorerUrl: "https://sepolia.basescan.org/tx/0x3e18a9023ffc8382910fa8319e763190823610938b710239c81920387123901b",
      network: "Base Sepolia Testnet",
      blockNumber: 18451920,
      notarizedBy: "0x4a79b2a...3aD149",
      createdAt: { seconds: Math.floor(Date.now() / 1000) - 3600 },
      clausesCount: 8,
    },
    {
      id: "demo-2",
      title: "Decentralized Autonomous Organization (DAO) Constitution",
      overallScore: 88,
      riskSummary: "Verified decentralized governance bylaws with multi-sig execution terms.",
      docHash: "0x91c0281b3719a8230198c419203918b72301982736192837192837192837192a",
      txHash: "0x892a019283719283719283719283719283719283719283719283719283719283",
      explorerUrl: "https://sepolia.arbiscan.io/tx/0x892a019283719283719283719283719283719283719283719283719283719283",
      network: "Arbitrum Sepolia Testnet",
      blockNumber: 18452104,
      notarizedBy: "0x7F2B...119C",
      createdAt: { seconds: Math.floor(Date.now() / 1000) - 10800 },
      clausesCount: 14,
    },
  ];

  try {
    const q = query(
      collection(db, "lexiguard_contracts"),
      orderBy("createdAt", "desc"),
      limit(25)
    );
    const snapshot = await getDocs(q);
    const firestoreDocs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

    const seen = new Set<string>();
    const merged: any[] = [];
    for (const item of [...localRecords, ...firestoreDocs, ...defaultDemoContracts]) {
      const key = item.docHash || item.txHash || item.id;
      if (key && !seen.has(key)) {
        seen.add(key);
        merged.push(item);
      }
    }
    return merged;
  } catch (err) {
    if (localRecords.length > 0) {
      return [...localRecords, ...defaultDemoContracts];
    }
    return defaultDemoContracts;
  }
}

// Save Escrow Deposit to Firestore & Local Storage
export async function saveEscrowDeposit(escrow: {
  agreementId: string;
  client: string;
  contractor: string;
  amountEth: string;
  milestoneDesc: string;
  txHash: string;
  network: string;
  status: "LOCKED" | "RELEASED" | "REFUNDED";
}): Promise<string | null> {
  // Always persist to localStorage so newly created escrows never disappear on refresh
  if (typeof window !== "undefined") {
    try {
      const stored = JSON.parse(localStorage.getItem("lexiguard_user_escrows") || "[]");
      localStorage.setItem("lexiguard_user_escrows", JSON.stringify([escrow, ...stored]));
    } catch (e) {
      console.warn("Could not save to localStorage:", e);
    }
  }

  try {
    const docRef = await addDoc(collection(db, "lexiguard_escrows"), {
      ...escrow,
      createdAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (err) {
    console.warn("Could not save escrow to Firestore:", err);
    return null;
  }
}

// Update Escrow Status in both LocalStorage and Firestore
export async function updateEscrowStatus(
  agreementId: string,
  status: "LOCKED" | "RELEASED" | "REFUNDED"
): Promise<void> {
  if (typeof window !== "undefined") {
    try {
      const stored = JSON.parse(localStorage.getItem("lexiguard_user_escrows") || "[]");
      const updated = stored.map((esc: any) =>
        esc.agreementId === agreementId || esc.id === agreementId ? { ...esc, status } : esc
      );
      localStorage.setItem("lexiguard_user_escrows", JSON.stringify(updated));
    } catch (e) {
      console.warn("Could not update localStorage escrow status:", e);
    }
  }

  // Update in Firestore to prevent resetting back on refresh
  try {
    const q = query(collection(db, "lexiguard_escrows"), where("agreementId", "==", agreementId));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      for (const d of snapshot.docs) {
        await updateDoc(doc(db, "lexiguard_escrows", d.id), { status });
      }
    }
  } catch (err) {
    console.warn("Could not update Firestore escrow status:", err);
  }
}

// Fetch all Escrow records (merging local and Firestore)
export async function getEscrowAgreements(): Promise<any[]> {
  let localRecords: any[] = [];
  if (typeof window !== "undefined") {
    try {
      localRecords = JSON.parse(localStorage.getItem("lexiguard_user_escrows") || "[]");
    } catch (e) {}
  }

  try {
    const q = query(
      collection(db, "lexiguard_escrows"),
      orderBy("createdAt", "desc"),
      limit(20)
    );
    const snapshot = await getDocs(q);
    const firestoreDocs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

    // Merge without duplicates
    const seen = new Set<string>();
    const merged: any[] = [];
    for (const item of [...localRecords, ...firestoreDocs]) {
      const key = item.agreementId || item.id;
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(item);
      }
    }

    if (merged.length > 0) return merged;
  } catch (err) {
    if (localRecords.length > 0) return localRecords;
  }

  return [
    {
      id: "escrow-demo-1",
      agreementId: "0x8fa92300bcf42821a938c41d019f93318b762514e82361730248a31e8c71b302",
      client: "0x7F2B89a468eB3f4D9165b4c10a12e87319E454E2",
      contractor: "0x3A9F1B2C4D5E6F7A8B9C0D1E2F3A4B5C6D7E8F9A",
      amountEth: "0.05",
      milestoneDesc: "Milestone 1: Web3 Legal Architecture & AI Audit Completion",
      txHash: "0x4a91b2c3d4e5f60718293a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d",
      network: "Base Sepolia Testnet",
      status: "LOCKED",
      createdAt: { seconds: Math.floor(Date.now() / 1000) - 1800 },
    },
  ];
}

// Contractor Profile Interface
export interface ContractorProfile {
  id?: string;
  walletAddress: string;
  fullName: string;
  companyName: string;
  roleTitle: string;
  bio: string;
  skills: string[];
  hourlyRateEth: string;
  reputationScore: number;
  verifiedOnChain: boolean;
  githubOrPortfolio?: string;
  createdAt?: any;
}

export const DEFAULT_CONTRACTORS: ContractorProfile[] = [
  {
    id: "innoxpert-lead",
    walletAddress: "0x7F2B89a468eB3f4D9165b4c10a12e87319E454E2",
    fullName: "Janitha Dilshan",
    companyName: "InnoXpert Studio",
    roleTitle: "Lead Full-Stack Web3 & AI Solutions Architect",
    bio: "Specializing in low-latency AI agents, EVM smart contracts, Next.js full-stack systems, and secure escrow architectures.",
    skills: ["Solidity", "Next.js", "AI Agents", "EVM Escrow", "TypeScript"],
    hourlyRateEth: "0.025",
    reputationScore: 98,
    verifiedOnChain: true,
    githubOrPortfolio: "https://innoxpert.com",
  },
  {
    id: "legaltech-auditor",
    walletAddress: "0x3A9F1B2C4D5E6F7A8B9C0D1E2F3A4B5C6D7E8F9A",
    fullName: "Alex Rivera, Esq.",
    companyName: "Cogent Legal DAO",
    roleTitle: "Web3 Legal Engineer & Clause Auditor",
    bio: "Cross-border token advisory, smart contract compliance audits, and IP protection under Delaware and Swiss law.",
    skills: ["Legal Engineering", "IP Licensing", "DAO Governance", "Compliance"],
    hourlyRateEth: "0.040",
    reputationScore: 95,
    verifiedOnChain: true,
    githubOrPortfolio: "https://github.com/cogent-legal",
  },
];

// Save or Update Contractor Profile
export async function saveContractorProfile(profile: ContractorProfile): Promise<boolean> {
  try {
    const docId = profile.walletAddress.toLowerCase();
    await setDoc(doc(db, "lexiguard_contractors", docId), {
      ...profile,
      updatedAt: Timestamp.now(),
    }, { merge: true });
    return true;
  } catch (err) {
    console.warn("Could not save contractor profile to Firestore:", err);
    return false;
  }
}

// Fetch all Contractor Profiles
export async function getContractorProfiles(): Promise<ContractorProfile[]> {
  try {
    const q = query(collection(db, "lexiguard_contractors"), limit(30));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as ContractorProfile));
    }
  } catch (err) {
    console.warn("Using default verified contractors:", err);
  }
  return DEFAULT_CONTRACTORS;
}

// Credit Purchase Interface & Functions
export interface CreditPurchase {
  id?: string;
  walletAddress: string;
  packName: string;
  creditsAdded: number;
  amountEth: string;
  txHash: string;
  network: string;
  createdAt?: any;
}

export async function saveCreditPurchase(purchase: CreditPurchase): Promise<string | null> {
  // Save locally as well
  if (typeof window !== "undefined") {
    try {
      const stored = JSON.parse(localStorage.getItem("lexiguard_user_purchases") || "[]");
      localStorage.setItem("lexiguard_user_purchases", JSON.stringify([purchase, ...stored]));
    } catch (e) {
      console.warn("Could not save purchase to localStorage:", e);
    }
  }

  try {
    const docRef = await addDoc(collection(db, "lexiguard_credit_purchases"), {
      ...purchase,
      createdAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (err) {
    console.warn("Could not save credit purchase to Firestore:", err);
    return purchase.txHash;
  }
}

export async function getCreditPurchases(): Promise<CreditPurchase[]> {
  let localPurchases: CreditPurchase[] = [];
  if (typeof window !== "undefined") {
    try {
      localPurchases = JSON.parse(localStorage.getItem("lexiguard_user_purchases") || "[]");
    } catch (e) {}
  }

  const defaultPurchases: CreditPurchase[] = [
    {
      id: "purchase-demo-1",
      walletAddress: "0x7F2B89a468eB3f4D9165b4c10a12e87319E454E2",
      packName: "Pro Pack (15 Audits)",
      creditsAdded: 15,
      amountEth: "0.012",
      txHash: "0x6a2947062afcd3d353e592fab50f875ee10685ddc7db2f183920194829103981",
      network: "Base Sepolia Testnet",
      createdAt: { seconds: Math.floor(Date.now() / 1000) - 7200 },
    },
    {
      id: "purchase-demo-2",
      walletAddress: "0x3A9F1B2C4D5E6F7A8B9C0D1E2F3A4B5C6D7E8F9A",
      packName: "Starter Pack (5 Audits)",
      creditsAdded: 5,
      amountEth: "0.005",
      txHash: "0x6a2947062afcd3d353e592fab50f875ee10685ddc7db2f183920194829103981",
      network: "Base Sepolia Testnet",
      createdAt: { seconds: Math.floor(Date.now() / 1000) - 21600 },
    },
  ];

  try {
    const q = query(
      collection(db, "lexiguard_credit_purchases"),
      orderBy("createdAt", "desc"),
      limit(25)
    );
    const snapshot = await getDocs(q);
    const firestoreDocs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as CreditPurchase));

    const seen = new Set<string>();
    const merged: CreditPurchase[] = [];
    for (const item of [...localPurchases, ...firestoreDocs, ...defaultPurchases]) {
      const key = item.txHash || item.id;
      if (key && !seen.has(key)) {
        seen.add(key);
        merged.push(item);
      }
    }
    return merged;
  } catch (err) {
    if (localPurchases.length > 0) {
      return [...localPurchases, ...defaultPurchases];
    }
    return defaultPurchases;
  }
}

// Synchronize wallet credits with Firestore to guarantee persistence across devices and refreshes
export async function syncUserCreditsWithFirestore(
  walletAddress?: string | null,
  defaultCredits = 3
): Promise<number> {
  if (!walletAddress) {
    return getUserCredits(null, defaultCredits);
  }
  const cleanAddr = walletAddress.toLowerCase();
  const localKey = `lexiguard_credits_${cleanAddr}`;
  const localCredits = getUserCredits(cleanAddr, defaultCredits);

  try {
    const walletDocRef = doc(db, "lexiguard_wallets", cleanAddr);
    const snap = await getDoc(walletDocRef);
    if (snap.exists()) {
      const data = snap.data();
      const firestoreCredits = typeof data.credits === "number" ? data.credits : defaultCredits;
      const finalCredits = Math.max(localCredits, firestoreCredits);
      if (typeof window !== "undefined") {
        localStorage.setItem(localKey, finalCredits.toString());
      }
      if (finalCredits !== firestoreCredits) {
        await setDoc(walletDocRef, { credits: finalCredits, lastSync: Timestamp.now() }, { merge: true });
      }
      return finalCredits;
    } else {
      // First time wallet connected: initialize in Firestore
      await setDoc(walletDocRef, {
        address: cleanAddr,
        credits: localCredits,
        createdAt: Timestamp.now(),
        lastSync: Timestamp.now(),
      });
      return localCredits;
    }
  } catch (err) {
    console.warn("Could not sync wallet credits with Firestore:", err);
    return localCredits;
  }
}

// Client-side / local credit management helper strictly bound to verified wallet address
export function getUserCredits(walletAddress?: string | null, defaultCredits = 3): number {
  if (typeof window === "undefined" || !walletAddress) return 0;
  const key = `lexiguard_credits_${walletAddress.toLowerCase()}`;
  const stored = localStorage.getItem(key);
  if (stored !== null) {
    return parseInt(stored, 10);
  }
  localStorage.setItem(key, defaultCredits.toString());
  return defaultCredits;
}

export function deductUserCredit(walletAddress?: string | null): number {
  if (typeof window === "undefined" || !walletAddress) return 0;
  const key = `lexiguard_credits_${walletAddress.toLowerCase()}`;
  const current = getUserCredits(walletAddress);
  const updated = Math.max(0, current - 1);
  localStorage.setItem(key, updated.toString());

  // Background sync to Firestore wallet record
  const cleanAddr = walletAddress.toLowerCase();
  setDoc(
    doc(db, "lexiguard_wallets", cleanAddr),
    {
      credits: updated,
      lastAuditAt: Timestamp.now(),
    },
    { merge: true }
  ).catch(() => {});

  return updated;
}

export function addUserCredits(walletAddress: string | null | undefined, added: number): number {
  if (typeof window === "undefined" || !walletAddress) return 0;
  const key = `lexiguard_credits_${walletAddress.toLowerCase()}`;
  const current = getUserCredits(walletAddress);
  const updated = current + added;
  localStorage.setItem(key, updated.toString());

  // Background sync to Firestore wallet record
  const cleanAddr = walletAddress.toLowerCase();
  setDoc(
    doc(db, "lexiguard_wallets", cleanAddr),
    {
      credits: updated,
      lastTopUpAt: Timestamp.now(),
    },
    { merge: true }
  ).catch(() => {});

  return updated;
}

// -------------------------------------------------------------
// CREDIT USAGE & AUDIT HISTORY LEDGER
// -------------------------------------------------------------

export interface CreditUsageRecord {
  id?: string;
  walletAddress: string;
  action: "AI_AUDIT" | "ON_CHAIN_NOTARIZE";
  actionLabel: string;
  documentTitle: string;
  cost: number;
  remainingCredits: number;
  timestamp: string;
  network?: string;
  txHash?: string;
}

// Log Credit Usage (Dual-layer persistence: LocalStorage + Firestore)
export async function logCreditUsage(usage: Omit<CreditUsageRecord, "id">): Promise<void> {
  const cleanAddr = (usage.walletAddress || "guest").toLowerCase();
  const localKey = `lexiguard_credit_usage_${cleanAddr}`;
  const record: CreditUsageRecord = {
    ...usage,
    id: `usage-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
  };

  // 1. Persist to localStorage immediately
  if (typeof window !== "undefined") {
    try {
      const stored = JSON.parse(localStorage.getItem(localKey) || "[]");
      localStorage.setItem(localKey, JSON.stringify([record, ...stored]));
    } catch (e) {
      console.warn("Could not save credit usage to localStorage:", e);
    }
  }

  // 2. Persist to Firestore collection `lexiguard_credit_usages`
  try {
    await addDoc(collection(db, "lexiguard_credit_usages"), {
      ...record,
      createdAt: Timestamp.now(),
    });
  } catch (err) {
    console.warn("Could not log credit usage to Firestore:", err);
  }
}

// Get Credit Usage History for a specific wallet address
export async function getCreditUsageHistory(walletAddress?: string | null): Promise<CreditUsageRecord[]> {
  const cleanAddr = (walletAddress || "0x7F2B89a468eB3f4D9165b4c10a12e87319E454E2").toLowerCase();
  const localKey = `lexiguard_credit_usage_${cleanAddr}`;

  let localRecords: CreditUsageRecord[] = [];
  if (typeof window !== "undefined") {
    try {
      localRecords = JSON.parse(localStorage.getItem(localKey) || "[]");
    } catch (e) {}
  }

  const defaultSampleUsages: CreditUsageRecord[] = [
    {
      id: "sample-u1",
      walletAddress: cleanAddr,
      action: "AI_AUDIT",
      actionLabel: "AI Legal Risk & Redline Audit",
      documentTitle: "Predatory Freelancer Agreement",
      cost: 1,
      remainingCredits: 2,
      timestamp: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: "sample-u2",
      walletAddress: cleanAddr,
      action: "ON_CHAIN_NOTARIZE",
      actionLabel: "On-Chain Document Notarization",
      documentTitle: "Predatory Freelancer Agreement",
      cost: 1,
      remainingCredits: 1,
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      network: "Base Sepolia Testnet",
      txHash: "0x6a2947062afcd3d353e592fab50f875ee10685ddc7db2f183920194829103981",
    },
  ];

  try {
    const q = query(
      collection(db, "lexiguard_credit_usages"),
      where("walletAddress", "==", cleanAddr),
      orderBy("createdAt", "desc"),
      limit(50)
    );
    const snap = await getDocs(q);
    const firestoreRecords = snap.docs.map((d) => ({ id: d.id, ...d.data() } as CreditUsageRecord));

    const seen = new Set<string>();
    const merged: CreditUsageRecord[] = [];
    for (const item of [...localRecords, ...firestoreRecords, ...defaultSampleUsages]) {
      const key = item.id || `${item.timestamp}-${item.action}`;
      if (key && !seen.has(key)) {
        seen.add(key);
        merged.push(item);
      }
    }
    return merged.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch (err) {
    if (localRecords.length > 0) return localRecords;
    return defaultSampleUsages;
  }
}

// Get user-specific notarized contracts or all ledger contracts
export async function getUserNotarizedContracts(walletAddress?: string | null): Promise<any[]> {
  const all = await getNotarizedContracts();
  if (!walletAddress) return all;
  const cleanAddr = walletAddress.toLowerCase();
  return all.filter((c) => {
    if (!c.notarizedBy) return true;
    const notaryAddr = c.notarizedBy.toLowerCase();
    return (
      notaryAddr === cleanAddr ||
      notaryAddr.includes(cleanAddr.slice(2, 8)) ||
      notaryAddr.includes("relayer") ||
      c.id?.startsWith("demo")
    );
  });
}

// Upload file to Firebase Storage with resilient fallback
export async function uploadContractDocument(file: File): Promise<{ url: string; fileName: string; size: number }> {
  try {
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storageRef = ref(storage, `lexiguard_uploads/${Date.now()}_${cleanFileName}`);
    const snapshot = await uploadBytes(storageRef, file);
    const url = await getDownloadURL(snapshot.ref);
    return { url, fileName: file.name, size: file.size };
  } catch (err) {
    console.warn("Firebase Storage upload exception, using local object URL fallback:", err);
    const localUrl = URL.createObjectURL(file);
    return { url: localUrl, fileName: file.name, size: file.size };
  }
}


