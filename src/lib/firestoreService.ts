/**
 * Firestore Service for LexiGuard AI
 * Uses isolated "lexiguard_*" collections to safeguard existing user demo data.
 */
import { db } from "./firebase";
import {
  collection,
  doc,
  getDoc,
  setDoc,
  getDocs,
  query,
  orderBy,
  limit,
  addDoc,
  Timestamp,
} from "firebase/firestore";
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

// Save a notarized contract record to Firestore
export async function saveNotarizedContract(
  audit: LegalAuditReport,
  notary: NotarizationResult
): Promise<string | null> {
  try {
    const docRef = await addDoc(collection(db, "lexiguard_contracts"), {
      title: audit.title,
      overallScore: audit.overallScore,
      riskSummary: audit.riskSummary,
      criticalRisksCount: audit.criticalRisksCount,
      warningRisksCount: audit.warningRisksCount,
      docHash: notary.docHash,
      txHash: notary.txHash,
      explorerUrl: notary.explorerUrl,
      network: notary.network,
      blockNumber: notary.blockNumber,
      notarizedBy: notary.notarizedBy,
      createdAt: Timestamp.now(),
      clausesCount: audit.totalClausesAnalyzed,
    });
    return docRef.id;
  } catch (err) {
    console.warn("Could not save to Firestore, stored in local session:", err);
    return null;
  }
}

// Fetch all notarized contracts for public ledger
export async function getNotarizedContracts(): Promise<any[]> {
  try {
    const q = query(
      collection(db, "lexiguard_contracts"),
      orderBy("createdAt", "desc"),
      limit(20)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.warn("Could not fetch Firestore contracts, providing demo verified records:", err);
    return [
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
  }
}

// Save Escrow Deposit to Firestore
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

// Fetch all Escrow records
export async function getEscrowAgreements(): Promise<any[]> {
  try {
    const q = query(
      collection(db, "lexiguard_escrows"),
      orderBy("createdAt", "desc"),
      limit(20)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (err) {
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
