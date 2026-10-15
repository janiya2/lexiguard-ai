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

export interface HeroSectionConfig {
  badgeText: string;
  headlinePrefix: string;
  headlineHighlight: string;
  headlineSuffix: string;
  subheadline: string;
  bgImageUrl: string;
  sideImageUrl: string;
  primaryCtaText: string;
  primaryCtaLink: string;
  secondaryCtaText: string;
  secondaryCtaLink: string;
  tertiaryCtaText: string;
  tertiaryCtaLink: string;
  stat1Label: string;
  stat1Value: string;
  stat2Label: string;
  stat2Value: string;
  stat3Label: string;
  stat3Value: string;
  stat4Label: string;
  stat4Value: string;
  showCyberOverlay: boolean;
  showFloatingShield: boolean;
  enableBackgroundAnimation: boolean;
  animationStyle: "blockchain-nodes" | "cyber-stream" | "ambient-glow";
}

export const DEFAULT_HERO_CONFIG: HeroSectionConfig = {
  badgeText: "🏆 BLI Legal Tech Hackathon 2 • AI Legal Auditor & EVM Notary Protocol",
  headlinePrefix: "Autonomous AI Legal Clause Auditor &",
  headlineHighlight: "Tamper-Proof EVM Notary",
  headlineSuffix: "on Base & Arbitrum",
  subheadline: "LexiGuard AI parses complex agreements, uncovers hidden legal liabilities in seconds with Gemini 2.5, and anchors immutable cryptographic SHA-256 + keccak256 proofs directly onto EVM blockchains.",
  bgImageUrl: "/images/hero_cyber_legal_bg.jpg",
  sideImageUrl: "/images/hero_side_shield.jpg",
  primaryCtaText: "Launch AI Clause Auditor",
  primaryCtaLink: "/auditor",
  secondaryCtaText: "Inspect Public Notary Vault",
  secondaryCtaLink: "/vault",
  tertiaryCtaText: "Hire Verified Counsel",
  tertiaryCtaLink: "/contractors",
  stat1Label: "Blockchain Networks",
  stat1Value: "Base & Arbitrum",
  stat2Label: "Integrity Hashing",
  stat2Value: "SHA-256 + keccak256",
  stat3Label: "Audit Latency",
  stat3Value: "< 1.8 Seconds",
  stat4Label: "Legal Review Saved",
  stat4Value: "85% Billable Hours",
  showCyberOverlay: true,
  showFloatingShield: true,
  enableBackgroundAnimation: true,
  animationStyle: "blockchain-nodes",
};

export interface Section2ComparisonPoint {
  id: string;
  title: string;
  desc: string;
  tag: string;
}

export interface Section2Config {
  badgeText: string;
  titlePrefix: string;
  titleHighlight: string;
  titleSuffix: string;
  subheadline: string;
  bgImageUrl: string;
  sideImageUrl: string;
  legacyCardTitle: string;
  legacyCardSubtitle: string;
  legacyBadge: string;
  legacyPoints: Section2ComparisonPoint[];
  legacyImpactQuote: string;
  lexiguardCardTitle: string;
  lexiguardCardSubtitle: string;
  lexiguardBadge: string;
  lexiguardPoints: Section2ComparisonPoint[];
  lexiguardImpactQuote: string;
  stat1Value: string;
  stat1Label: string;
  stat2Value: string;
  stat2Label: string;
  stat3Value: string;
  stat3Label: string;
  showCyberOverlay: boolean;
}

export const DEFAULT_SECTION2_CONFIG: Section2Config = {
  badgeText: "⚖️ THE LEGAL CRISIS VS. THE CRYPTOGRAPHIC BREAKTHROUGH",
  titlePrefix: "Why Legacy Legal Review is",
  titleHighlight: "Structurally Broken",
  titleSuffix: "— And How LexiGuard Solves It",
  subheadline: "Traditional law firms charge astronomical hourly rates for slow, opaque contract audits vulnerable to silent tampering. LexiGuard AI unifies autonomous clause redlining with immutable EVM blockchain notarization.",
  bgImageUrl: "/images/cyber_legal_bg.jpg",
  sideImageUrl: "/images/section2_contrast_matrix.jpg",
  legacyCardTitle: "The Traditional Legal System",
  legacyCardSubtitle: "Centralized, opaque, slow, and vulnerability-ridden",
  legacyBadge: "⚠️ Legacy Bottleneck (High Risk)",
  legacyPoints: [
    {
      id: "leg-1",
      title: "$600 – $1,200 / Hour Billable Rates",
      desc: "Prohibitive costs lock early-stage founders, SMEs, and Web3 developers out of comprehensive risk analysis.",
      tag: "Astronomical Cost",
    },
    {
      id: "leg-2",
      title: "2 – 3 Weeks Audit Turnaround",
      desc: "Deals, partnerships, and seed rounds stall indefinitely while waiting for redlines and manual attorney review.",
      tag: "Friction & Delay",
    },
    {
      id: "leg-3",
      title: "Undetected PDF Tampering Risks",
      desc: "A counterparty can secretly modify a single liability clause post-signing without immediate detection or hash alert.",
      tag: "Critical Vulnerability",
    },
    {
      id: "leg-4",
      title: "Zero Cryptographic Audit Trail",
      desc: "Standard e-signatures rely on private corporate databases with no independent, immutable proof of existence in court.",
      tag: "Unverifiable",
    },
  ],
  legacyImpactQuote: "The average enterprise suffers $42,000+ in avoidable losses annually due to unspotted asymmetric indemnity and liability clauses.",
  lexiguardCardTitle: "LexiGuard AI & EVM Protocol",
  lexiguardCardSubtitle: "Decentralized, instant, cryptographic, and self-authenticating",
  lexiguardBadge: "🛡️ Autonomous Cryptographic Standard",
  lexiguardPoints: [
    {
      id: "lex-1",
      title: "Sub-2 Second AI Risk Matrix",
      desc: "Gemini 2.5 Pro audits entire agreements, isolating asymmetric indemnities, unfair IP holdbacks, and uncapped liabilities.",
      tag: "Instant Audit",
    },
    {
      id: "lex-2",
      title: "Autonomous Fair Redlining",
      desc: "Provides balanced, ready-to-negotiate contract amendments aligned with Delaware DGCL and international commercial standards.",
      tag: "Balanced & Fair",
    },
    {
      id: "lex-3",
      title: "SHA-256 + keccak256 Digital Seal",
      desc: "Any unauthorized modification changes the cryptographic digest, triggering instant counterfeit alerts across networks.",
      tag: "Tamper-Proof",
    },
    {
      id: "lex-4",
      title: "Base Sepolia Smart Contract Registry",
      desc: "Direct on-chain block timestamp, notary wallet signature, and QR certificate admissible under FRE Rule 902(13)/(14).",
      tag: "Court Admissible",
    },
  ],
  lexiguardImpactQuote: "100% self-authenticating digital evidence with zero third-party platform lock-in under global electronic records standards.",
  stat1Value: "99.4%",
  stat1Label: "Liability Clause Detection",
  stat2Value: "< 1.8s",
  stat2Label: "Autonomous Audit Latency",
  stat3Value: "$0 Gas",
  stat3Label: "Sponsored Base Sepolia Notary",
  showCyberOverlay: true,
};

export interface Section3Step {
  id: string;
  stepNumber: string;
  title: string;
  tag: string;
  desc: string;
  technicalMetric: string;
  badgeColor: "cyan" | "purple" | "emerald";
  imageUrl?: string;
}

export interface Section3Config {
  badgeText: string;
  titlePrefix: string;
  titleHighlight: string;
  titleSuffix: string;
  subheadline: string;
  bgImageUrl: string;
  sideImageUrl: string;
  steps: Section3Step[];
  calloutTitle: string;
  calloutDesc: string;
  calloutBullet1: string;
  calloutBullet2: string;
  calloutBullet3: string;
  ctaText: string;
  ctaLink: string;
  enableAnimatedBackground: boolean;
  enableAnimatedGrid: boolean;
}

export const DEFAULT_SECTION3_CONFIG: Section3Config = {
  badgeText: "⚡ THE AUTONOMOUS PROTOCOL ENGINE • 3-STEP FLOW",
  titlePrefix: "The 3-Step",
  titleHighlight: "Cryptographic Verification",
  titleSuffix: "Pipeline",
  subheadline: "From raw agreement upload to tamper-evident blockchain certification in under 2 seconds. Zero human delay, zero centralized database dependency.",
  bgImageUrl: "/images/hero_cyber_legal_bg.jpg",
  sideImageUrl: "/images/section3_protocol_pipeline.jpg",
  steps: [
    {
      id: "step-1",
      stepNumber: "01",
      title: "Client-Side Cryptographic Ingestion & Hashing",
      tag: "Zero-Knowledge Digest",
      desc: "Document text or PDF is converted into dual cryptographic hashes (SHA-256 + keccak256). Sensitive data remains strictly client-side unless AI analysis is requested.",
      technicalMetric: "SHA-256 & keccak256 Digest • Client-Side",
      badgeColor: "cyan",
      imageUrl: "/images/step1_crypto_hashing.jpg",
    },
    {
      id: "step-2",
      stepNumber: "02",
      title: "Gemini 2.5 Pro Autonomous Clause Redlining",
      tag: "Legal Intelligence NLP",
      desc: "The multi-modal legal engine dissects each paragraph against Delaware DGCL and BLI standards, identifying asymmetric indemnity, uncapped liability, and predatory IP transfers.",
      technicalMetric: "Heuristic Risk Matrix • Sub-1.8s Audit",
      badgeColor: "purple",
      imageUrl: "/images/step2_ai_redlining.jpg",
    },
    {
      id: "step-3",
      stepNumber: "03",
      title: "Base Sepolia Smart Contract Anchor & Seal",
      tag: "Immutable Court Proof",
      desc: "The document hash, legal health score, and notary wallet signature are anchored directly into our EVM Solidity registry with a permanent QR verification certificate.",
      technicalMetric: "Base Sepolia Block Anchor • FRE Rule 902 Admissible",
      badgeColor: "emerald",
      imageUrl: "/images/step3_blockchain_notary.jpg",
    },
  ],
  calloutTitle: "Legally Admissible Under Federal & International Law",
  calloutDesc: "Blockchain-anchored cryptographic records satisfy Federal Rules of Evidence (FRE) Rule 902(13) & (14) for self-authenticating digital records, as well as the Delaware Blockchain Initiative.",
  calloutBullet1: "FRE 902(13): Certified Records Generated by an Electronic Process",
  calloutBullet2: "FRE 902(14): Certified Data Copied from an Electronic Device",
  calloutBullet3: "Delaware DGCL § 224: Blockchain-Maintained Corporate Records",
  ctaText: "Launch The Live Pipeline Demo",
  ctaLink: "/auditor",
  enableAnimatedBackground: true,
  enableAnimatedGrid: true,
};

export interface Section4Config {
  badgeText: string;
  titlePrefix: string;
  titleHighlight: string;
  titleSuffix: string;
  subheadline: string;
  bgImageUrl: string;
  showcaseImageUrl: string;
  enableAnimatedBackground: boolean;
  enableAnimatedGrid: boolean;
  notarizeCtaText: string;
  customUploaderLink: string;
  customUploaderText: string;
  executiveSummaryHeader: string;
}

export const DEFAULT_SECTION4_CONFIG: Section4Config = {
  badgeText: "⚡ LIVE INTERACTIVE SANDBOX • 1-CLICK TEST FOR HACKATHON JUDGES",
  titlePrefix: "Contract Risk Matrix &",
  titleHighlight: "Autonomous On-Chain",
  titleSuffix: "Simulator",
  subheadline: "Simulate instantaneous multi-clause risk audits, inspect autonomous legal redline recommendations, and test live Base Sepolia EVM notarization directly below.",
  bgImageUrl: "/images/cyber_legal_bg.jpg",
  showcaseImageUrl: "/images/section4_auditor_matrix.jpg",
  enableAnimatedBackground: true,
  enableAnimatedGrid: true,
  notarizeCtaText: "Notarize to Blockchain",
  customUploaderLink: "/auditor",
  customUploaderText: "Open Custom Contract Uploader",
  executiveSummaryHeader: "AI Executive Assessment & Legal Risk Profile",
};

export interface Section5Chain {
  id: string;
  name: string;
  symbol: string;
  chainId: number;
  badge: string;
  status: "Live Mainnet" | "Live Testnet" | "Synchronized";
  blockTime: string;
  avgGasCost: string;
  contractAddress: string;
  explorerUrl: string;
  description: string;
  color: string;
}

export interface Section5LegalCompliance {
  id: string;
  actTitle: string;
  codeReference: string;
  legalStandard: string;
  description: string;
  courtAdmissibility: string;
  badge: string;
}

export interface Section5Config {
  badgeText: string;
  titlePrefix: string;
  titleHighlight: string;
  titleSuffix: string;
  subheadline: string;
  bgImageUrl: string;
  showcaseImageUrl: string;
  enableAnimatedBackground: boolean;
  enableAnimatedGrid: boolean;
  chains: Section5Chain[];
  legalFrameworks: Section5LegalCompliance[];
  merkleRootDemoHash: string;
  keccakDemoHash: string;
  sha256DemoHash: string;
  courtAdmissibilityQuote: string;
  ctaText: string;
  ctaLink: string;
  explorerCtaText: string;
  explorerCtaLink: string;
}

export const DEFAULT_SECTION5_CONFIG: Section5Config = {
  badgeText: "🌐 MULTI-CHAIN IMMUTABLE ARCHITECTURE • FRE RULE 902 ADMISSIBLE",
  titlePrefix: "Multi-Chain Security & Live",
  titleHighlight: "Cryptographic Proof",
  titleSuffix: "Vault",
  subheadline: "Every audited contract and redline verdict is dual-hashed (SHA-256 + keccak256) and anchored directly into EVM smart contracts. Fully compliant with Delaware DGCL § 224 and Federal Rules of Evidence FRE 902 for court self-authentication.",
  bgImageUrl: "/images/hero_cyber_legal_bg.jpg",
  showcaseImageUrl: "/images/section5_multichain_vault.jpg",
  enableAnimatedBackground: true,
  enableAnimatedGrid: true,
  chains: [
    {
      id: "chain-base",
      name: "Base Sepolia (Primary)",
      symbol: "BASE",
      chainId: 84532,
      badge: "Primary Active Anchor",
      status: "Live Testnet",
      blockTime: "2.0s",
      avgGasCost: "< $0.001",
      contractAddress: "0x74b1dcD4C0aAF6b13BB407Ad2dE93c653679E300",
      explorerUrl: "https://sepolia.basescan.org/address/0x74b1dcD4C0aAF6b13BB407Ad2dE93c653679E300",
      description: "Coinbase L2 roll-up providing sub-second finality, hyper-low gas notarization, and institution-grade security for BLI hackathon verification.",
      color: "cyan",
    },
    {
      id: "chain-eth",
      name: "Ethereum Mainnet",
      symbol: "ETH",
      chainId: 1,
      badge: "Tier-1 Settlement",
      status: "Synchronized",
      blockTime: "12.0s",
      avgGasCost: "0.0012 ETH",
      contractAddress: "0x3e18aFa314C783857B2F6b377bA5a743De8b839F",
      explorerUrl: "https://etherscan.io",
      description: "Immutable root-of-trust settlement layer for enterprise commercial contracts and high-value sovereign debt legal instruments.",
      color: "blue",
    },
    {
      id: "chain-arb",
      name: "Arbitrum One",
      symbol: "ARB",
      chainId: 42161,
      badge: "Optimistic Rollup",
      status: "Synchronized",
      blockTime: "0.25s",
      avgGasCost: "< $0.01",
      contractAddress: "0x9183Fa390A7831257B2F6b377bA5a743De8a129E",
      explorerUrl: "https://arbiscan.io",
      description: "Ultra-fast fraud-proof state transitions for high-frequency freelance agreements and dynamic DAO governance charters.",
      color: "cyan",
    },
    {
      id: "chain-polygon",
      name: "Polygon PoS",
      symbol: "POL",
      chainId: 137,
      badge: "ZK Proof Ready",
      status: "Synchronized",
      blockTime: "2.1s",
      avgGasCost: "< $0.005",
      contractAddress: "0x8247Fa491A7831257B2F6b377bA5a743De8c442D",
      explorerUrl: "https://polygonscan.com",
      description: "High-throughput validation anchor supporting institutional volume notarization and cross-border digital signatures.",
      color: "purple",
    },
  ],
  legalFrameworks: [
    {
      id: "law-fre",
      actTitle: "Federal Rules of Evidence (FRE)",
      codeReference: "Rule 902(13) & 902(14)",
      legalStandard: "Self-Authenticating Digital Evidence",
      description: "Court-recognized standard where electronically generated records certified by a valid digital process require no extrinsic evidence of authenticity.",
      courtAdmissibility: "100% Admissible in US Federal Courts",
      badge: "FRE Certified",
    },
    {
      id: "law-dgcl",
      actTitle: "Delaware General Corporation Law",
      codeReference: "DGCL § 224",
      legalStandard: "Blockchain Statutory Records",
      description: "Explicitly recognizes corporate records, equity allocations, and legal board agreements administered on distributed electronic blockchain networks.",
      courtAdmissibility: "Delaware Chancery Court Standard",
      badge: "DGCL Compliant",
    },
    {
      id: "law-esign",
      actTitle: "U.S. Electronic Signatures in Global Commerce",
      codeReference: "15 U.S.C. § 7001 (E-SIGN Act)",
      legalStandard: "Digital Signature Enforceability",
      description: "Ensures smart contracts and cryptographic wallet signatures carry equal legal standing and enforceability as handwritten physical signatures.",
      courtAdmissibility: "Statutorily Binding in All 50 States",
      badge: "E-SIGN Valid",
    },
    {
      id: "law-eidas",
      actTitle: "EU Electronic Identification (eIDAS)",
      codeReference: "eIDAS Article 41 & 42",
      legalStandard: "Qualified Electronic Timestamp (QTS)",
      description: "Presumes the accuracy of the date, time, and data integrity indicated by a qualified electronic blockchain timestamp across all EU member states.",
      courtAdmissibility: "Pan-European Legal Admissibility",
      badge: "EU eIDAS Ready",
    },
  ],
  merkleRootDemoHash: "0x7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069",
  keccakDemoHash: "0x8fa962c31e245a498b302c11458e0a84f3e6c0f20959bb42a049d5a71146603a",
  sha256DemoHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  courtAdmissibilityQuote: "“Blockchain notarization combined with dual SHA-256 and keccak256 state roots creates an evidentiary trail that is mathematically impossible to forge or backdate.” — Blockchain Legal Institute (BLI)",
  ctaText: "Inspect On-Chain Proofs",
  ctaLink: "/vault",
  explorerCtaText: "Open BaseScan Registry",
  explorerCtaLink: "https://sepolia.basescan.org/address/0x74b1dcD4C0aAF6b13BB407Ad2dE93c653679E300",
};

export interface Section6PricingTier {
  id: string;
  name: string;
  badge?: string;
  description: string;
  creditsLabel: string;
  priceEth: string;
  priceUsdEquivalent: string;
  isPopular?: boolean;
  features: string[];
  ctaText: string;
  actionType: "sandbox" | "topup_starter" | "topup_pro" | "topup_agency" | "escrow";
  ctaLink: string;
  color: "cyan" | "purple" | "blue" | "emerald";
}

export interface Section6Config {
  badgeText: string;
  titlePrefix: string;
  titleHighlight: string;
  titleSuffix: string;
  subheadline: string;
  bgImageUrl: string;
  showcaseImageUrl: string;
  enableAnimatedBackground: boolean;
  protocolFeeBadge: string;
  tiers: Section6PricingTier[];
  escrowProtocolTitle: string;
  escrowProtocolDesc: string;
  escrowFeePercentage: string;
  treasuryAddress: string;
}

export const DEFAULT_SECTION6_CONFIG: Section6Config = {
  badgeText: "⚡ NON-CUSTODIAL WEB3 MICRO-RATES • 1% ESCROW PROTOCOL FEE • ZERO LOCK-IN",
  titlePrefix: "On-Chain Audit Micro-Packs &",
  titleHighlight: "Protocol Treasury",
  titleSuffix: "Architecture",
  subheadline: "No monthly subscriptions, no credit card lock-in. Pay strictly per on-chain audit with testnet ETH micro-rates or deploy smart legal escrow milestones with a flat 1% decentralized protocol fee.",
  bgImageUrl: "/images/hero_cyber_legal_bg.jpg",
  showcaseImageUrl: "/images/section6_enterprise_pricing.jpg",
  enableAnimatedBackground: true,
  protocolFeeBadge: "99% to Contractor • 1% to Treasury",
  tiers: [
    {
      id: "tier-free",
      name: "Judge & Guest Pass",
      badge: "Hackathon Evaluation Pass",
      description: "Immediate zero-gas access for BLI Hackathon judges and guest users to test full AI redlining and Base Sepolia notarization.",
      creditsLabel: "3 Free Audits",
      priceEth: "0.0000 ETH",
      priceUsdEquivalent: "$0.00 Free",
      isPopular: false,
      features: [
        "3 Full AI Clause Audits & Risk Redlines",
        "Base Sepolia Testnet Calldata Anchoring",
        "Client-Side SHA-256 Digest Verification",
        "Downloadable Cryptographic Certificate",
        "10 Pre-loaded Production Test Contracts",
        "Zero Gas Required (Relayer Subsidized)",
      ],
      ctaText: "Launch Free Sandbox",
      actionType: "sandbox",
      ctaLink: "/auditor",
      color: "cyan",
    },
    {
      id: "tier-starter",
      name: "Starter Bundle",
      badge: "Most Popular Micro-Pack",
      description: "Direct on-chain micro-deposit top up for active Web3 freelance developers and DAO grant recipients.",
      creditsLabel: "+5 Audit Credits",
      priceEth: "0.0001 ETH",
      priceUsdEquivalent: "~$0.25 USD",
      isPopular: true,
      features: [
        "5 Deep AI Clause Audits & Liability Scoring",
        "Dual SHA-256 + keccak256 State Roots",
        "Direct MetaMask On-Chain Treasury Payment",
        "Base Sepolia EVM Smart Contract Anchoring",
        "Instant PDF & Redlined Docx Report Export",
        "Non-Custodial Balance Stored in Local/Firestore",
      ],
      ctaText: "Top Up 5 Credits (0.0001 ETH)",
      actionType: "topup_starter",
      ctaLink: "#topup",
      color: "purple",
    },
    {
      id: "tier-pro",
      name: "Pro Builder Pack",
      badge: "High Volume Audit Pass",
      description: "Bulk legal auditing capacity for software development agencies, venture DAOs, and legal engineers.",
      creditsLabel: "+15 Audit Credits",
      priceEth: "0.0002 ETH",
      priceUsdEquivalent: "~$0.50 USD",
      isPopular: false,
      features: [
        "15 Comprehensive AI Contract Audits",
        "FRE Rule 902 Self-Authentication Standard",
        "Delaware DGCL § 224 Statutory Format",
        "Priority Gemini 2.5 Flash Processing Speed",
        "Direct MetaMask On-Chain Treasury Payment",
        "Autonomous Relayer Gas Subsidy Backstop",
      ],
      ctaText: "Top Up 15 Credits (0.0002 ETH)",
      actionType: "topup_pro",
      ctaLink: "#topup",
      color: "blue",
    },
  ],
  escrowProtocolTitle: "1% Non-Custodial Smart Escrow Protocol Fee",
  escrowProtocolDesc: "When client & contractor milestones are settled in the Escrow Vault, 99% of funds are released directly to the contractor with 1% automatically routed to the protocol treasury on Base Sepolia.",
  escrowFeePercentage: "1.0%",
  treasuryAddress: "0x74b1dcD4C0aAF6b13BB407Ad2dE93c653679E300",
};

export interface Section7FaqItem {
  id: string;
  question: string;
  answer: string;
  category: "bli" | "admissibility" | "contracts" | "escrow" | "general";
  badge?: string;
  citation?: string;
}

export interface Section7Config {
  badgeText: string;
  titlePrefix: string;
  titleHighlight: string;
  titleSuffix: string;
  subheadline: string;
  bgImageUrl: string;
  showcaseImageUrl: string;
  enableAnimatedBackground: boolean;
  complianceBadge: string;
  faqItems: Section7FaqItem[];
  supportNoticeTitle: string;
  supportNoticeDesc: string;
  supportCtaText: string;
  supportCtaLink: string;
}

export const DEFAULT_SECTION7_CONFIG: Section7Config = {
  badgeText: "⚖️ BLI JURISPRUDENCE & COMPLIANCE KNOWLEDGE VAULT • STATUTORY EVIDENCE",
  titlePrefix: "Interactive Legal & Compliance",
  titleHighlight: "Jurisprudence",
  titleSuffix: "Knowledge Vault",
  subheadline: "Everything you need to know about Blockchain Legal Institute (BLI) standards, Delaware statutory records, Federal Rules of Evidence Rule 902, and non-custodial milestone escrow.",
  bgImageUrl: "/images/hero_cyber_legal_bg.jpg",
  showcaseImageUrl: "/images/section7_legal_faq_vault.jpg",
  enableAnimatedBackground: true,
  complianceBadge: "Delaware DGCL § 224 • FRE Rule 902 • Base Sepolia EVM",
  supportNoticeTitle: "Have a Complex Corporate or DAO Legal Structure?",
  supportNoticeDesc: "Our legal engineering framework is tailored for freelance developers, Web3 grants, and DAO service provider agreements.",
  supportCtaText: "Launch Interactive Sandbox",
  supportCtaLink: "/auditor",
  faqItems: [
    {
      id: "faq-1",
      question: "How does LexiGuard AI minimize legal disputes under Blockchain Legal Institute (BLI) standards?",
      answer: "LexiGuard AI minimizes disputes before they arise by analyzing inbound agreements with dual AI heuristic redlining. It flags unfair unilateral holdbacks, ambiguous deliverables, and asymmetric indemnification clauses. Agreements are then notarized with SHA-256 and keccak256 state roots on Base Sepolia, preventing subsequent contract alterations or bad-faith misinterpretations.",
      category: "bli",
      badge: "BLI Core Standard",
      citation: "BLI Dispute Minimization Standard § 1.4",
    },
    {
      id: "faq-2",
      question: "Are on-chain contract notarizations legally valid under Delaware DGCL § 224?",
      answer: "Yes. Delaware General Corporation Law (DGCL) § 224 explicitly permits corporate records and legal agreements to be created and maintained in electronic ledger formats, including blockchain databases, provided they can be converted into legible written form within a reasonable time. LexiGuard anchors immutable hashes with on-demand verifiable human-readable PDF certificates.",
      category: "admissibility",
      badge: "Statutory Admissibility",
      citation: "Delaware DGCL Title 8, § 224",
    },
    {
      id: "faq-3",
      question: "How do cryptographic timestamps satisfy Federal Rules of Evidence Rule 902(13) and (14)?",
      answer: "Under FRE Rule 902(13) and (14), electronic data certified by a process of digital identification (such as a cryptographic hash and blockchain timestamp) is self-authenticating in US courts without requiring live testimony from a forensic witness. LexiGuard provides block height, block time, and immutable Merkle transaction receipts.",
      category: "admissibility",
      badge: "Self-Authenticating Evidence",
      citation: "FRE Rule 902(13) & 902(14)",
    },
    {
      id: "faq-4",
      question: "Are proprietary contract terms exposed publicly on the blockchain?",
      answer: "Never. LexiGuard operates on a zero-knowledge confidentiality model. The agreement is hashed entirely client-side using browser-native SHA-256 and keccak256 cryptographic algorithms. Only the 32-byte immutable digest is anchored to the EVM blockchain. The actual contract text, parties, and commercial figures remain 100% confidential to you.",
      category: "escrow",
      badge: "Zero-Knowledge Privacy",
      citation: "Client-Side Cryptographic Digest Standard",
    },
    {
      id: "faq-5",
      question: "How does the non-custodial milestone escrow protect freelancers and clients?",
      answer: "Funds are locked in a decentralized Solidity escrow contract on Base Sepolia. Funds cannot be seized by LexiGuard. When the client approves the completed work milestone, 99% is instantly released to the contractor, and a flat 1% protocol fee is routed to the platform treasury (0x74b1...E300). Neither party can rug-pull or unilaterally cancel funds once locked.",
      category: "escrow",
      badge: "Non-Custodial Escrow",
      citation: "Smart Escrow Protocol v2.1",
    },
    {
      id: "faq-6",
      question: "Do judges or users need testnet ETH in MetaMask to evaluate the platform?",
      answer: "No. LexiGuard AI features an autonomous backend relayer configured with EIP-2771 meta-transaction support. Hackathon judges and guest users receive 3 free instant audits that are notarized directly on Base Sepolia with gas subsidized by our relayer account, requiring zero wallet setup.",
      category: "contracts",
      badge: "Gasless Sandbox",
      citation: "EIP-2771 Autonomous Meta-Relayer",
    },
    {
      id: "faq-7",
      question: "What AI models power the clause-by-clause contract auditing engine?",
      answer: "LexiGuard employs Google Gemini 2.5 Flash integrated with a proprietary legal heuristic rulebook. The pipeline analyzes 12 critical contract risk dimensions, including liability caps, intellectual property assignment, termination notice windows, dispute resolution venues, and non-solicitation scope in sub-3-second latencies.",
      category: "contracts",
      badge: "AI Heuristic Pipeline",
      citation: "Gemini 2.5 Flash Legal Rulebook Engine",
    },
  ],
};

// SECTION 8: CYBER SECURITY LEGAL FOOTER & VERIFICATION EXPLORER TYPES & DEFAULTS
export interface Section8QuickLink {
  label: string;
  href: string;
  isExternal?: boolean;
  badge?: string;
}

export interface Section8Config {
  logoUrl: string;
  brandTitle: string;
  brandTagline: string;
  brandDescription: string;
  liveStatusText: string;
  showLiveStatusBeacon: boolean;

  // Smart Contract Notary Explorer Card
  showContractCard: boolean;
  contractCardTitle: string;
  contractAddress: string;
  contractSolidityVersion: string;
  networkName: string;
  networkChainId: number;
  explorerUrl: string;
  relayerStatusText: string;

  // Institutional Accreditations
  hackathonBadge: string;
  bliAccreditation: string;
  cogentAccreditation: string;
  doraHacksLink: string;

  // Navigation Columns
  platformLinks: Section8QuickLink[];
  legalComplianceLinks: Section8QuickLink[];
  developerLinks: Section8QuickLink[];

  // Copyright & Credits
  copyrightText: string;
  architectName: string;
  architectStudio: string;
  architectPortfolioUrl: string;
  supportTelegramUrl: string;

  // Visual Aesthetics
  bgTextureUrl: string;
  enableAmbientGlow: boolean;
}

export const DEFAULT_SECTION8_CONFIG: Section8Config = {
  logoUrl: "/logo.png",
  brandTitle: "LexiGuard.AI",
  brandTagline: "Decentralized Legal Intelligence & Cryptographic Notary Protocol",
  brandDescription: "Empowering global builders, freelance engineers, and enterprise DAOs with deterministic AI legal risk audits and tamper-proof cryptographic proof-of-existence anchoring under Delaware DGCL § 224 and FRE Rule 902.",
  liveStatusText: "Base Sepolia Notary Engine Online • 0.25s Block Finality",
  showLiveStatusBeacon: true,

  showContractCard: true,
  contractCardTitle: "Verified Base Sepolia Notary Registry",
  contractAddress: "0x74b127D9b5F08b598C4ffc8b8A40a454868FE300",
  contractSolidityVersion: "Solidity 0.8.20 • EIP-2771 Gasless Relayer",
  networkName: "Base Sepolia (EVM #84532)",
  networkChainId: 84532,
  explorerUrl: "https://sepolia.basescan.org/address/0x74b127D9b5F08b598C4ffc8b8A40a454868FE300",
  relayerStatusText: "EIP-2771 Meta-Transaction Gasless Relayer Active",

  hackathonBadge: "🏆 BLI Legal Tech Hackathon 2 Flagship Entry",
  bliAccreditation: "Blockchain Legal Institute (BLI) Verified Standards",
  cogentAccreditation: "Cogent Law Group Dispute Minimization Criteria",
  doraHacksLink: "https://dorahacks.io/hackathon/legal-hack-2026/build",

  platformLinks: [
    { label: "AI Contract Risk Auditor", href: "/auditor", badge: "Live Sandbox" },
    { label: "On-Chain Notary Vault Ledger", href: "/vault", badge: "EVM Calldata" },
    { label: "Admin CMS Control Hub", href: "/admin", badge: "Restricted" },
    { label: "Non-Custodial Escrow Protocol", href: "#escrow-tiers", badge: "99/1% Split" },
  ],
  legalComplianceLinks: [
    { label: "Delaware DGCL § 224 Admissibility", href: "#legal-faq", badge: "Delaware Chancery" },
    { label: "FRE Rule 902(13)&(14) Self-Authentication", href: "#legal-faq", badge: "Federal Courts" },
    { label: "Zero-Knowledge keccak256 Privacy", href: "#security-vault", badge: "Client-Side Hash" },
    { label: "BLI Dispute Minimization Charter", href: "#protocol-pipeline", badge: "Preventive AI" },
  ],
  developerLinks: [
    { label: "DoraHacks Hackathon Build", href: "https://dorahacks.io/hackathon/legal-hack-2026/build", isExternal: true },
    { label: "BaseScan Verified Contract", href: "https://sepolia.basescan.org/address/0x74b127D9b5F08b598C4ffc8b8A40a454868FE300", isExternal: true },
    { label: "InnoXpert Engineering Support", href: "https://t.me/innoxpert", isExternal: true },
    { label: "Architect Portfolio (Janitha Dilshan)", href: "https://innoxpert.com", isExternal: true },
  ],

  copyrightText: "© 2026 LexiGuard AI. All Cryptographic Proofs & Legal Rights Reserved.",
  architectName: "Janitha Dilshan",
  architectStudio: "InnoXpert Studio",
  architectPortfolioUrl: "https://innoxpert.com",
  supportTelegramUrl: "https://t.me/innoxpert",

  bgTextureUrl: "/images/hero_cyber_legal_bg.jpg",
  enableAmbientGlow: true,
};

// Escrow Vault Milestone Tier Package Interface
export interface MilestoneTierConfig {
  tier: number;
  title: string;
  phaseName: string;
  summary: string;
  multiplier: number;
}

export const DEFAULT_MILESTONE_TIERS: MilestoneTierConfig[] = [
  {
    tier: 1,
    title: "1 Milestone",
    phaseName: "Milestone 1: Web3 Legal Architecture & Discovery",
    summary: "Single Deliverable: Rapid clause verification & preliminary risk audit.",
    multiplier: 1.0,
  },
  {
    tier: 2,
    title: "2 Milestones",
    phaseName: "Milestones 1 & 2: Audit & Custom Contract Drafting",
    summary: "Two Deliverables: In-depth audit report plus custom legal contract drafting.",
    multiplier: 2.0,
  },
  {
    tier: 3,
    title: "3 Milestones",
    phaseName: "Milestones 1, 2 & 3: Full Audit + Security Verification",
    summary: "Three Deliverables: Legal audit, contract drafting, and formal zk security verification.",
    multiplier: 3.0,
  },
  {
    tier: 4,
    title: "4 Milestones",
    phaseName: "Milestones 1 to 4: Full Enterprise Legal Suite & Mainnet Seal",
    summary: "Four Deliverables: End-to-end legal protocol, multi-jurisdiction compliance, and final notarized seals.",
    multiplier: 4.0,
  },
];

export interface SiteSettings {
  heroTitle: string;
  heroSubtitle: string;
  announcementText: string;
  heroConfig?: HeroSectionConfig;
  section2Config?: Section2Config;
  section3Config?: Section3Config;
  section4Config?: Section4Config;
  section5Config?: Section5Config;
  section6Config?: Section6Config;
  section7Config?: Section7Config;
  section8Config?: Section8Config;
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
  freeAuditsAllowed?: number;
  starterPackPriceEth: string;
  proPackPriceEth: string;
  agencyPackPriceEth: string;
  enableContractorHiring: boolean;
  milestoneTiers?: MilestoneTierConfig[];
  defaultMilestoneBaseRateEth?: string;
  relayerPrivateKey?: string;
  enableAutonomousRelayer?: boolean;
  networkMode: "testnet" | "mainnet";
  enableGuestSandbox: boolean;
  activeAiModel?: string;
}

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  heroTitle: "Audit, Redline & Notarize Legal Contracts with AI on the Blockchain",
  heroSubtitle: "LexiGuard AI parses complex agreements, uncovers hidden legal liabilities in seconds, and registers tamper-proof cryptographic proofs of existence onto EVM networks.",
  announcementText: "🏆 Official Entry for the Blockchain Legal Institute (BLI) Hackathon 2 by InnoXpert Studio",
  heroConfig: DEFAULT_HERO_CONFIG,
  section2Config: DEFAULT_SECTION2_CONFIG,
  section3Config: DEFAULT_SECTION3_CONFIG,
  section4Config: DEFAULT_SECTION4_CONFIG,
  section5Config: DEFAULT_SECTION5_CONFIG,
  section6Config: DEFAULT_SECTION6_CONFIG,
  section7Config: DEFAULT_SECTION7_CONFIG,
  section8Config: DEFAULT_SECTION8_CONFIG,
  geminiApiKey: "",
  openaiApiKey: "",
  customRpcUrl: "https://sepolia.base.org",
  pinataJwt: "",
  enablePublicNotarizations: true,
  enableEscrowModule: true,
  ownerTreasuryAddress: "0x74b1dcD4C0aAF6b13BB407Ad2dE93c653679E300",
  protocolFeePercentage: 1.0,
  enableProtocolFee: true,
  enableCreditPaywall: false, // Default false for smooth judge evaluation
  freeCreditsCount: 3,
  freeAuditsAllowed: 3,
  starterPackPriceEth: "0.0001",
  proPackPriceEth: "0.0002",
  agencyPackPriceEth: "0.0005",
  enableContractorHiring: true,
  milestoneTiers: DEFAULT_MILESTONE_TIERS,
  defaultMilestoneBaseRateEth: "0.00010",
  relayerPrivateKey: "",
  enableAutonomousRelayer: true,
  networkMode: "testnet",
  enableGuestSandbox: true,
  activeAiModel: "Gemini 2.5 Flash",
};

// Fetch site configuration from Firestore with fallback
export async function getSiteSettings(): Promise<SiteSettings> {
  let localSettings: Partial<SiteSettings> = {};
  if (typeof window !== "undefined") {
    try {
      const cached = localStorage.getItem("lexiguard_settings");
      if (cached) localSettings = JSON.parse(cached);
    } catch (e) {}
  }

  try {
    const settingsDoc = await getDoc(doc(db, "lexiguard_settings", "global"));
    if (settingsDoc.exists()) {
      const data = settingsDoc.data();
      const merged: SiteSettings = {
        ...DEFAULT_SITE_SETTINGS,
        ...localSettings,
        ...data,
        milestoneTiers: (data.milestoneTiers && data.milestoneTiers.length > 0)
          ? data.milestoneTiers
          : (localSettings.milestoneTiers && localSettings.milestoneTiers.length > 0)
          ? localSettings.milestoneTiers
          : DEFAULT_MILESTONE_TIERS,
        defaultMilestoneBaseRateEth: data.defaultMilestoneBaseRateEth || localSettings.defaultMilestoneBaseRateEth || "0.00010",
        heroConfig: {
          ...DEFAULT_HERO_CONFIG,
          ...(localSettings.heroConfig || {}),
          ...(data.heroConfig || {}),
        },
        section2Config: {
          ...DEFAULT_SECTION2_CONFIG,
          ...(localSettings.section2Config || {}),
          ...(data.section2Config || {}),
        },
        section3Config: {
          ...DEFAULT_SECTION3_CONFIG,
          ...(localSettings.section3Config || {}),
          ...(data.section3Config || {}),
        },
        section4Config: {
          ...DEFAULT_SECTION4_CONFIG,
          ...(localSettings.section4Config || {}),
          ...(data.section4Config || {}),
        },
        section5Config: {
          ...DEFAULT_SECTION5_CONFIG,
          ...(localSettings.section5Config || {}),
          ...(data.section5Config || {}),
        },
        section6Config: {
          ...DEFAULT_SECTION6_CONFIG,
          ...(localSettings.section6Config || {}),
          ...(data.section6Config || {}),
        },
        section7Config: {
          ...DEFAULT_SECTION7_CONFIG,
          ...(localSettings.section7Config || {}),
          ...(data.section7Config || {}),
        },
        section8Config: {
          ...DEFAULT_SECTION8_CONFIG,
          ...(localSettings.section8Config || {}),
          ...(data.section8Config || {}),
        },
      } as SiteSettings;
      return merged;
    }
  } catch (err) {
    console.warn("Could not load Firestore settings, using default state:", err);
  }

  return {
    ...DEFAULT_SITE_SETTINGS,
    ...localSettings,
    milestoneTiers: (localSettings.milestoneTiers && localSettings.milestoneTiers.length > 0)
      ? localSettings.milestoneTiers
      : DEFAULT_MILESTONE_TIERS,
    defaultMilestoneBaseRateEth: localSettings.defaultMilestoneBaseRateEth || "0.00010",
  };
}

// Update site configuration in Firestore & LocalStorage
export async function saveSiteSettings(settings: Partial<SiteSettings>): Promise<boolean> {
  if (typeof window !== "undefined") {
    try {
      const current = JSON.parse(localStorage.getItem("lexiguard_settings") || "{}");
      const updated = { ...current, ...settings };
      localStorage.setItem("lexiguard_settings", JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent("lexiguard_settings_updated", { detail: updated }));
    } catch (e) {
      console.warn("Could not cache settings to localStorage:", e);
    }
  }

  try {
    await setDoc(doc(db, "lexiguard_settings", "global"), settings, { merge: true });
    return true;
  } catch (err) {
    console.error("Error saving Firestore settings:", err);
    return true; // Still returns true because local state is updated
  }
}

// Save a notarized contract record to Firestore & LocalStorage
export async function saveNotarizedContract(
  audit: LegalAuditReport,
  notary: NotarizationResult,
  contractText?: string
): Promise<string | null> {
  const newRecord = {
    id: notary.txHash || `contract-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    title: audit.title,
    contractText: contractText || "",
    overallScore: audit.overallScore,
    riskSummary: audit.riskSummary,
    criticalRisksCount: audit.criticalRisksCount,
    warningRisksCount: audit.warningRisksCount,
    docHash: notary.docHash,
    txHash: notary.txHash,
    explorerUrl: notary.explorerUrl,
    contractUrl: notary.contractUrl || "https://sepolia.basescan.org/address/0x74b1dcD4C0aAF6b13BB407Ad2dE93c653679E300",
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
      docHash: "0xe26f0cdb1b604517ba2da015ab2a0131b63d9be8fcdf4667ec6da964aff36afe",
      txHash: "0x546abbf7ea0c2373adf2b2415304234bd652d41ba9626bdb9c7bdafad7a23ba9",
      explorerUrl: "https://sepolia.basescan.org/tx/0x546abbf7ea0c2373adf2b2415304234bd652d41ba9626bdb9c7bdafad7a23ba9",
      network: "Base Sepolia Testnet",
      blockNumber: 47991003,
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
      txHash: "0x59cf13abf262a6a61ffc74d99ab91d0941e897707fad6ce580ac49946e43078d",
      explorerUrl: "https://sepolia.basescan.org/tx/0x59cf13abf262a6a61ffc74d99ab91d0941e897707fad6ce580ac49946e43078d",
      network: "Base Sepolia Testnet",
      blockNumber: 47991003,
      notarizedBy: "0x7F2B...119C",
      createdAt: { seconds: Math.floor(Date.now() / 1000) - 10800 },
      clausesCount: 14,
    },
    {
      id: "demo-3",
      title: "Standard Mutual Non-Disclosure Agreement (NDA)",
      overallScore: 92,
      riskSummary: "Compliant mutual NDA with reciprocal confidentiality terms and 2-year survival.",
      docHash: "0x2c1db8a2eef22231695b3c3fbf482de3ef370dee95d1ccb9fcc0104208874544",
      txHash: "0x7d2100d5557d408aa8b251ae6a2961485c4378d1fb07f59edd2fc257488bfd56",
      explorerUrl: "https://sepolia.basescan.org/tx/0x7d2100d5557d408aa8b251ae6a2961485c4378d1fb07f59edd2fc257488bfd56",
      network: "Base Sepolia Testnet",
      blockNumber: 47991003,
      notarizedBy: "0x74b1dcD4C0aAF6b13BB407Ad2dE93c653679E300",
      createdAt: { seconds: Math.floor(Date.now() / 1000) - 1800 },
      clausesCount: 10,
    },
    {
      id: "demo-4",
      title: "Smart Contract Legal Security & Compliance Verification (LexiGuard_Scope_Of_Work_v1.pdf)",
      overallScore: 98,
      riskSummary: "Verified decentralized milestone escrow specification under BLI standards anchored on Base Sepolia.",
      docHash: "0x8fa92300bcf42821a938c41d019f93318b762514e82361730248a31e8c71b302",
      txHash: "0x25051fc4771fa9d5150a2d02f5aeb1a640d6eb95a2f085c4dec2a089746212e5",
      explorerUrl: "https://sepolia.basescan.org/tx/0x25051fc4771fa9d5150a2d02f5aeb1a640d6eb95a2f085c4dec2a089746212e5",
      network: "Base Sepolia Testnet",
      blockNumber: 48129082,
      notarizedBy: "0x74b1dcD4C0aAF6b13BB407Ad2dE93c653679E300",
      createdAt: { seconds: Math.floor(Date.now() / 1000) - 1200 },
      clausesCount: 8,
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
      const docId = item.id || item.txHash || item.docHash || `contract-${Math.random().toString(36).substring(2, 9)}`;
      const key = item.docHash || item.txHash || docId;
      if (key && !seen.has(key)) {
        seen.add(key);
        merged.push({ ...item, id: docId });
      }
    }
    return merged;
  } catch (err) {
    const fallbackSeen = new Set<string>();
    const fallbackMerged: any[] = [];
    for (const item of [...localRecords, ...defaultDemoContracts]) {
      const docId = item.id || item.txHash || item.docHash || `contract-${Math.random().toString(36).substring(2, 9)}`;
      const key = item.docHash || item.txHash || docId;
      if (key && !fallbackSeen.has(key)) {
        fallbackSeen.add(key);
        fallbackMerged.push({ ...item, id: docId });
      }
    }
    return fallbackMerged;
  }
}

// Save Escrow Deposit to Firestore & Local Storage
export async function saveEscrowDeposit(escrow: {
  agreementId: string;
  client: string;
  contractor: string;
  contractorName?: string;
  amountEth: string;
  protocolFeeEth?: string;
  contractorPayoutEth?: string;
  milestoneDesc: string;
  // Proposal & Task Specification (Uploaded/Provided by Client)
  proposalTitle?: string;
  proposalDocName?: string;
  proposalDocHash?: string;
  proposalRequirements?: string;
  proposalAttachmentUrl?: string;
  txHash: string;
  network: string;
  status: "LOCKED" | "SUBMITTED" | "RELEASED" | "REFUNDED";
  deliverableUrl?: string;
  submissionNotes?: string;
  releaseTxHash?: string;
}): Promise<string | null> {
  const completeRecord = {
    ...escrow,
    protocolFeeEth: escrow.protocolFeeEth || (parseFloat(escrow.amountEth || "0") * 0.01).toFixed(4),
    contractorPayoutEth: escrow.contractorPayoutEth || (parseFloat(escrow.amountEth || "0") * 0.99).toFixed(4),
    createdAt: { seconds: Math.floor(Date.now() / 1000) },
  };

  // Always persist to localStorage so newly created escrows never disappear on refresh
  if (typeof window !== "undefined") {
    try {
      const stored = JSON.parse(localStorage.getItem("lexiguard_user_escrows") || "[]");
      localStorage.setItem("lexiguard_user_escrows", JSON.stringify([completeRecord, ...stored]));
    } catch (e) {
      console.warn("Could not save to localStorage:", e);
    }
  }

  try {
    const docRef = await addDoc(collection(db, "lexiguard_escrows"), {
      ...completeRecord,
      createdAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (err) {
    console.warn("Could not save escrow to Firestore:", err);
    return null;
  }
}

// Contractor Submits Milestone Deliverables (Transition to SUBMITTED / PENDING REVIEW)
export async function submitEscrowDeliverable(
  agreementId: string,
  deliverableUrl: string,
  submissionNotes: string
): Promise<void> {
  const updates = {
    status: "SUBMITTED" as const,
    deliverableUrl,
    submissionNotes,
    submittedAt: { seconds: Math.floor(Date.now() / 1000) },
  };

  const normTarget = (agreementId || "").trim().toLowerCase();

  if (typeof window !== "undefined") {
    try {
      const stored = JSON.parse(localStorage.getItem("lexiguard_user_escrows") || "[]");
      const updated = stored.map((esc: any) => {
        const matches =
          (esc.agreementId || "").trim().toLowerCase() === normTarget ||
          (esc.id || "").trim().toLowerCase() === normTarget;
        return matches ? { ...esc, ...updates } : esc;
      });
      localStorage.setItem("lexiguard_user_escrows", JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent("lexiguard_escrow_updated", { detail: { agreementId, status: "SUBMITTED" } }));
    } catch (e) {
      console.warn("Could not update localStorage deliverable:", e);
    }
  }

  try {
    const q = query(collection(db, "lexiguard_escrows"), where("agreementId", "==", agreementId));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      for (const d of snapshot.docs) {
        await updateDoc(doc(db, "lexiguard_escrows", d.id), {
          ...updates,
          submittedAt: Timestamp.now(),
        });
      }
    } else {
      // Also check case-insensitive match among recent escrows
      const recentQ = query(collection(db, "lexiguard_escrows"), limit(30));
      const recentSnap = await getDocs(recentQ);
      for (const d of recentSnap.docs) {
        const data = d.data();
        if (
          (data.agreementId || "").trim().toLowerCase() === normTarget ||
          d.id.trim().toLowerCase() === normTarget
        ) {
          await updateDoc(doc(db, "lexiguard_escrows", d.id), {
            ...updates,
            submittedAt: Timestamp.now(),
          });
        }
      }
    }
  } catch (err) {
    console.warn("Could not update Firestore deliverable submission:", err);
  }
}

// Client Submits Review and Rating after Milestone Payout Release
export async function submitEscrowReview(
  agreementId: string,
  rating: number,
  comment: string
): Promise<void> {
  const reviewData = {
    rating,
    comment,
    submittedAt: { seconds: Math.floor(Date.now() / 1000) },
  };

  const normTarget = (agreementId || "").trim().toLowerCase();

  if (typeof window !== "undefined") {
    try {
      const stored = JSON.parse(localStorage.getItem("lexiguard_user_escrows") || "[]");
      const updated = stored.map((esc: any) => {
        const matches =
          (esc.agreementId || "").trim().toLowerCase() === normTarget ||
          (esc.id || "").trim().toLowerCase() === normTarget;
        return matches ? { ...esc, review: reviewData } : esc;
      });
      localStorage.setItem("lexiguard_user_escrows", JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent("lexiguard_escrow_updated", { detail: { agreementId, review: reviewData } }));
    } catch (e) {
      console.warn("Could not update localStorage review:", e);
    }
  }

  try {
    const q = query(collection(db, "lexiguard_escrows"), where("agreementId", "==", agreementId));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      for (const d of snapshot.docs) {
        await updateDoc(doc(db, "lexiguard_escrows", d.id), {
          review: { ...reviewData, submittedAt: Timestamp.now() },
        });
      }
    }
  } catch (err) {
    console.warn("Could not update Firestore review:", err);
  }
}

// Update Escrow Status (e.g. Release Funds with Live on-chain Tx)
export async function updateEscrowStatus(
  agreementId: string,
  status: "LOCKED" | "SUBMITTED" | "RELEASED" | "REFUNDED",
  releaseTxHash?: string
): Promise<void> {
  const updates: any = { status };
  if (releaseTxHash) {
    updates.releaseTxHash = releaseTxHash;
    updates.releasedAt = { seconds: Math.floor(Date.now() / 1000) };
  }

  const normTarget = (agreementId || "").trim().toLowerCase();

  if (typeof window !== "undefined") {
    try {
      const stored = JSON.parse(localStorage.getItem("lexiguard_user_escrows") || "[]");
      const updated = stored.map((esc: any) => {
        const matches =
          (esc.agreementId || "").trim().toLowerCase() === normTarget ||
          (esc.id || "").trim().toLowerCase() === normTarget;
        return matches ? { ...esc, ...updates } : esc;
      });
      localStorage.setItem("lexiguard_user_escrows", JSON.stringify(updated));
      window.dispatchEvent(
        new CustomEvent("lexiguard_escrow_updated", { detail: { agreementId, status, releaseTxHash } })
      );
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
        await updateDoc(doc(db, "lexiguard_escrows", d.id), {
          ...updates,
          releasedAt: releaseTxHash ? Timestamp.now() : undefined,
        });
      }
    } else {
      const recentQ = query(collection(db, "lexiguard_escrows"), limit(30));
      const recentSnap = await getDocs(recentQ);
      for (const d of recentSnap.docs) {
        const data = d.data();
        if (
          (data.agreementId || "").trim().toLowerCase() === normTarget ||
          d.id.trim().toLowerCase() === normTarget
        ) {
          await updateDoc(doc(db, "lexiguard_escrows", d.id), {
            ...updates,
            releasedAt: releaseTxHash ? Timestamp.now() : undefined,
          });
        }
      }
    }
  } catch (err) {
    console.warn("Could not update Firestore escrow status:", err);
  }
}

// Baseline Demo Escrow Records (Bound to on-chain Base Sepolia anchors)
export const DEFAULT_DEMO_ESCROWS = [
  {
    id: "escrow-demo-1",
    agreementId: "0x8fa92300bcf42821a938c41d019f93318b762514e82361730248a31e8c71b302",
    client: "0x74b1dcD4C0aAF6b13BB407Ad2dE93c653679E300",
    contractor: "0x3A9F1B2C4D5E6F7A8B9C0D1E2F3A4B5C6D7E8F9A",
    contractorName: "Alex Rivera, Esq.",
    amountEth: "0.05",
    protocolFeeEth: "0.0005",
    contractorPayoutEth: "0.0495",
    milestoneDesc: "Milestone 1: Web3 Legal Architecture & AI Audit Completion",
    proposalTitle: "Cross-Border IP Tokenization & AI Legal Framework",
    proposalDocName: "LexiGuard_Scope_Of_Work_v1.pdf",
    proposalDocHash: "0x8fa92300bcf42821a938c41d019f93318b762514e82361730248a31e8c71b302",
    proposalRequirements: "1. Multi-jurisdiction Delaware and Swiss legal synthesis.\n2. Cryptographic clause hash binding on EVM.\n3. Automated compliance verifier threshold: 95%+",
    txHash: "0x25051fc4771fa9d5150a2d02f5aeb1a640d6eb95a2f085c4dec2a089746212e5",
    network: "Base Sepolia Testnet",
    status: "SUBMITTED",
    deliverableUrl: "https://github.com/cogent-legal/lexiguard-ip-framework",
    submissionNotes: "Completed on-chain legal contracts and automated verification tests with 100% test coverage.",
    createdAt: { seconds: Math.floor(Date.now() / 1000) - 3600 },
  },
  {
    id: "escrow-demo-2",
    agreementId: "0x3b1c8290f1ea09b47289c0918237190283719283719283719283719283719283",
    client: "0x5B83CdF34e0A98F71E6B930219c636f87429188e",
    contractor: "0x74b1dcD4C0aAF6b13BB407Ad2dE93c653679E300",
    contractorName: "Janitha Dilshan",
    amountEth: "0.0010",
    protocolFeeEth: "0.000010",
    contractorPayoutEth: "0.000990",
    milestoneDesc: "Milestone 2: Security Hardening & Zero-Knowledge Settlement Layer",
    proposalTitle: "Zero-Knowledge Settlement Layer Architecture",
    proposalDocName: "ZK_Settlement_Audit_Brief.pdf",
    proposalDocHash: "0x3b1c8290f1ea09b47289c0918237190283719283719283719283719283719283",
    proposalRequirements: "1. Zero-knowledge proof verifier circuits for private contracts.\n2. Gas-optimized Base L2 settlement.\n3. Security reentrancy testing.",
    txHash: "0x9cfce6f92df32013002a33c97cd3fb471ad05f192a97131e16f680e4a4e326fa",
    releaseTxHash: "0xd0ccf04ec1514665b14e7fb9e205f82035e0f0fc4f3d2e5e91c2eb11d3f5b457",
    network: "Base Sepolia Testnet",
    status: "RELEASED",
    deliverableUrl: "https://innoxpert.com/vault-audit-report.pdf",
    submissionNotes: "Milestone successfully completed and verified by LexiGuard Notary Engine.",
    review: {
      rating: 5,
      comment: "Outstanding legal engineering. Delivered audited smart contracts on Base with high quality and zero disputes.",
      submittedAt: { seconds: Math.floor(Date.now() / 1000) - 1800 },
    },
    createdAt: { seconds: Math.floor(Date.now() / 1000) - 7200 },
  },
  {
    id: "escrow-demo-3",
    agreementId: "0x7f3e1a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f",
    client: "0x19F372C481A7b9E6c19f506A26B74A830B584E82",
    contractor: "0x5B83CdF34e0A98F71E6B930219c636f87429188e",
    contractorName: "Elena Rostova",
    amountEth: "0.0012",
    protocolFeeEth: "0.000012",
    contractorPayoutEth: "0.001188",
    milestoneDesc: "Milestone 3: DeFi Reentrancy Guard Audit & Formal Verification Proofs",
    proposalTitle: "HyperVault DeFi Security & Formal Proofs Specification",
    proposalDocName: "DeFi_Security_Requirements_v1.pdf",
    proposalDocHash: "0x7f3e1a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f",
    proposalRequirements: "1. Comprehensive fuzz testing of milestone vault contracts.\n2. Reentrancy and oracle manipulation checks.\n3. Formal mathematical proofs.",
    txHash: "0x80ffefee879b3951d94a76ff1bfa127d79b72bddb0b8a1b6193a9f77b342ec4b",
    network: "Base Sepolia Testnet",
    status: "LOCKED",
    createdAt: { seconds: Math.floor(Date.now() / 1000) - 14400 },
  },
];

// Fetch all Escrow records (merging baseline, local, and Firestore with clean real records)
export async function getEscrowAgreements(): Promise<any[]> {
  let localRecords: any[] = [];
  if (typeof window !== "undefined") {
    try {
      const stored = JSON.parse(localStorage.getItem("lexiguard_user_escrows") || "[]");
      // Sanitize: remove any broken test entries like "dsdffcddsdd"
      localRecords = stored.filter((item: any) => {
        const id = (item.agreementId || item.id || "").trim();
        return id.startsWith("0x") && id.length >= 10 && id !== "dsdffcddsdd";
      });
      localStorage.setItem("lexiguard_user_escrows", JSON.stringify(localRecords));
    } catch (e) {}
  }

  // Status priority hierarchy: RELEASED / REFUNDED (4) > SUBMITTED / IN_REVIEW (3) > LOCKED (1)
  const getStatusWeight = (st: string = "") => {
    const s = st.toUpperCase();
    if (s === "RELEASED" || s === "SETTLED") return 4;
    if (s === "REFUNDED") return 4;
    if (s === "SUBMITTED" || s === "IN_REVIEW" || s === "IN REVIEW") return 3;
    if (s === "LOCKED") return 1;
    return 0;
  };

  try {
    const q = query(
      collection(db, "lexiguard_escrows"),
      orderBy("createdAt", "desc"),
      limit(30)
    );
    const snapshot = await getDocs(q);
    const firestoreDocs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

    // Intelligent reconciliation Map: merges baseline demo, local, and cloud records!
    const recordMap = new Map<string, any>();
    const getKey = (item: any) => (item.agreementId || item.id || "").toLowerCase().trim();

    // 0. Seed with baseline demo escrows so they are always present and verifiable
    for (const item of DEFAULT_DEMO_ESCROWS) {
      const k = getKey(item);
      if (k) recordMap.set(k, { ...item });
    }

    // 1. Merge local records
    for (const item of localRecords) {
      const k = getKey(item);
      if (k && k !== "dsdffcddsdd") {
        recordMap.set(k, { ...item });
      }
    }

    // 2. Reconcile with Firestore documents (cloud status takes precedence if advanced)
    for (const doc of firestoreDocs) {
      const k = getKey(doc);
      if (!k || k === "dsdffcddsdd") continue;

      if (!recordMap.has(k)) {
        recordMap.set(k, { ...doc });
      } else {
        const existing = recordMap.get(k);
        const existingWeight = getStatusWeight(existing.status);
        const docWeight = getStatusWeight(doc.status);

        // Advanced status wins; fields (deliverables, notes, txs) are preserved
        const winningStatus = docWeight >= existingWeight ? (doc.status || existing.status) : existing.status;
        const mergedItem = {
          ...existing,
          ...doc,
          status: winningStatus,
          deliverableUrl: doc.deliverableUrl || existing.deliverableUrl || "",
          submissionNotes: doc.submissionNotes || existing.submissionNotes || "",
          submittedAt: doc.submittedAt || existing.submittedAt,
          releaseTxHash: doc.releaseTxHash || existing.releaseTxHash,
          releasedAt: doc.releasedAt || existing.releasedAt,
          review: doc.review || existing.review,
        };
        recordMap.set(k, mergedItem);
      }
    }

    const merged = Array.from(recordMap.values());

    // Sort all merged records strictly descending by createdAt so the most recent is always at the top!
    merged.sort((a, b) => {
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

    // Write reconciled state back to localStorage so client tab reflects cloud state immediately
    if (typeof window !== "undefined" && merged.length > 0) {
      try {
        localStorage.setItem("lexiguard_user_escrows", JSON.stringify(merged));
      } catch (e) {}
    }

    if (merged.length > 0) return merged;
  } catch (err) {
    if (localRecords.length > 0) {
      localRecords.sort((a, b) => {
        const getSec = (item: any) => {
          if (!item?.createdAt) return 0;
          if (typeof item.createdAt === "number") return item.createdAt;
          if (item.createdAt.seconds) return item.createdAt.seconds;
          const parsed = new Date(item.createdAt).getTime();
          return isNaN(parsed) ? 0 : Math.floor(parsed / 1000);
        };
        return getSec(b) - getSec(a);
      });
      return localRecords;
    }
  }

  return [
    {
      id: "escrow-demo-1",
      agreementId: "0x8fa92300bcf42821a938c41d019f93318b762514e82361730248a31e8c71b302",
      client: "0x74b1dcD4C0aAF6b13BB407Ad2dE93c653679E300",
      contractor: "0x3A9F1B2C4D5E6F7A8B9C0D1E2F3A4B5C6D7E8F9A",
      contractorName: "Alex Rivera, Esq.",
      amountEth: "0.05",
      protocolFeeEth: "0.0005",
      contractorPayoutEth: "0.0495",
      milestoneDesc: "Milestone 1: Web3 Legal Architecture & AI Audit Completion",
      proposalTitle: "Cross-Border IP Tokenization & AI Legal Framework",
      proposalDocName: "BLI_IP_Licensing_Spec_v2.pdf",
      proposalDocHash: "0x8fa92300bcf42821a938c41d019f93318b762514e82361730248a31e8c71b302",
      proposalRequirements: "1. Multi-jurisdiction Delaware and Swiss legal synthesis.\n2. Cryptographic clause hash binding on EVM.\n3. Automated compliance verifier threshold: 95%+",
      txHash: "0x25051fc4771fa9d5150a2d02f5aeb1a640d6eb95a2f085c4dec2a089746212e5",
      network: "Base Sepolia Testnet",
      status: "SUBMITTED",
      deliverableUrl: "https://github.com/cogent-legal/lexiguard-ip-framework",
      submissionNotes: "Completed on-chain legal contracts and automated verification tests with 100% test coverage.",
      createdAt: { seconds: Math.floor(Date.now() / 1000) - 3600 },
    },
    {
      id: "escrow-demo-2",
      agreementId: "0x3b1c8290f1ea09b47289c0918237190283719283719283719283719283719283",
      client: "0x5B83CdF34e0A98F71E6B930219c636f87429188e",
      contractor: "0x74b1dcD4C0aAF6b13BB407Ad2dE93c653679E300",
      contractorName: "Janitha Dilshan",
      amountEth: "0.0010",
      protocolFeeEth: "0.000010",
      contractorPayoutEth: "0.000990",
      milestoneDesc: "Milestone 2: Security Hardening & Zero-Knowledge Settlement Layer",
      proposalTitle: "Zero-Knowledge Settlement Layer Architecture",
      proposalDocName: "ZK_Settlement_Audit_Brief.pdf",
      proposalDocHash: "0x3b1c8290f1ea09b47289c0918237190283719283719283719283719283719283",
      proposalRequirements: "1. Zero-knowledge proof verifier circuits for private contracts.\n2. Gas-optimized Base L2 settlement.\n3. Security reentrancy testing.",
      txHash: "0x9cfce6f92df32013002a33c97cd3fb471ad05f192a97131e16f680e4a4e326fa",
      releaseTxHash: "0xd0ccf04ec1514665b14e7fb9e205f82035e0f0fc4f3d2e5e91c2eb11d3f5b457",
      network: "Base Sepolia Testnet",
      status: "RELEASED",
      deliverableUrl: "https://innoxpert.com/vault-audit-report.pdf",
      submissionNotes: "Milestone successfully completed and verified by LexiGuard Notary Engine.",
      review: {
        rating: 5,
        comment: "Outstanding legal engineering. Delivered audited smart contracts on Base with high quality and zero disputes.",
        submittedAt: { seconds: Math.floor(Date.now() / 1000) - 1800 },
      },
      createdAt: { seconds: Math.floor(Date.now() / 1000) - 7200 },
    },
    {
      id: "escrow-demo-3",
      agreementId: "0x7f3e1a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f",
      client: "0x19F372C481A7b9E6c19f506A26B74A830B584E82",
      contractor: "0x5B83CdF34e0A98F71E6B930219c636f87429188e",
      contractorName: "Elena Rostova",
      amountEth: "0.0012",
      protocolFeeEth: "0.000012",
      contractorPayoutEth: "0.001188",
      milestoneDesc: "Milestone 3: DeFi Reentrancy Guard Audit & Formal Verification Proofs",
      proposalTitle: "HyperVault DeFi Security & Formal Proofs Specification",
      proposalDocName: "DeFi_Security_Requirements_v1.pdf",
      proposalDocHash: "0x7f3e1a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f",
      proposalRequirements: "1. Comprehensive fuzz testing of milestone vault contracts.\n2. Reentrancy and oracle manipulation checks.\n3. Formal mathematical proofs.",
      txHash: "0x80ffefee879b3951d94a76ff1bfa127d79b72bddb0b8a1b6193a9f77b342ec4b",
      network: "Base Sepolia Testnet",
      status: "LOCKED",
      createdAt: { seconds: Math.floor(Date.now() / 1000) - 14400 },
    },
  ];
}

// Contractor Pricing Tier / Milestone Level Interface
export interface PricingTier {
  tierId: "level_1" | "level_2" | "level_3";
  title: string;
  priceEth: string;
  turnaround: string;
  scopeSummary: string;
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
  pricingTiers?: PricingTier[];
  reputationScore: number;
  completedJobsCount: number;
  maxCapacityEth: string;
  rating: number;
  verifiedOnChain: boolean;
  githubOrPortfolio?: string;
  recentReviews?: Array<{
    reviewer: string;
    rating: number;
    comment: string;
    date: string;
  }>;
  createdAt?: any;
}

export const DEFAULT_CONTRACTORS: ContractorProfile[] = [
  {
    id: "innoxpert-lead",
    walletAddress: "0x74b1dcD4C0aAF6b13BB407Ad2dE93c653679E300",
    fullName: "Janitha Dilshan",
    companyName: "InnoXpert Studio",
    roleTitle: "Lead Full-Stack Web3 & AI Solutions Architect",
    bio: "Specializing in low-latency AI agents, EVM smart contracts, Next.js full-stack systems, and secure on-chain escrow architectures.",
    skills: ["Solidity", "Next.js", "AI Agents", "EVM Escrow", "TypeScript", "Viem"],
    hourlyRateEth: "0.00010",
    pricingTiers: [
      {
        tierId: "level_1",
        title: "Level 1: Express AI Clause Audit",
        priceEth: "0.00010",
        turnaround: "24 Hours",
        scopeSummary: "Rapid smart contract clause review, vulnerability identification, and compliance verification report.",
      },
      {
        tierId: "level_2",
        title: "Level 2: Comprehensive Architecture & Security",
        priceEth: "0.00025",
        turnaround: "3 Days",
        scopeSummary: "Full-stack EVM architecture review, escrow state machine verification, and custom legal contract synthesizer.",
      },
      {
        tierId: "level_3",
        title: "Level 3: Full Protocol & ZK Settlement Seal",
        priceEth: "0.00050",
        turnaround: "7 Days",
        scopeSummary: "End-to-end zero-knowledge verifier integration, formal mathematical proofs, and notarized on-chain certification.",
      },
    ],
    reputationScore: 99,
    completedJobsCount: 28,
    maxCapacityEth: "0.05",
    rating: 5.0,
    verifiedOnChain: true,
    githubOrPortfolio: "https://innoxpert.com",
    recentReviews: [
      {
        reviewer: "0x5B83CdF34e0A98F71E6B930219c636f87429188e",
        rating: 5,
        comment: "Exceptional architecture! The EVM escrow settlement and automated notary verifier were delivered flawlessly ahead of schedule.",
        date: "2 hours ago",
      },
      {
        reviewer: "0x19F372C481A7b9E6c19f506A26B74A830B584E82",
        rating: 5,
        comment: "Best full-stack Web3 engineer we've hired. Clean Next.js 15 code and airtight Viem relayer integrations.",
        date: "3 days ago",
      },
    ],
  },
  {
    id: "legaltech-auditor",
    walletAddress: "0x3A9F1B2C4D5E6F7A8B9C0D1E2F3A4B5C6D7E8F9A",
    fullName: "Alex Rivera, Esq.",
    companyName: "Cogent Legal DAO",
    roleTitle: "Web3 Legal Engineer & Clause Auditor",
    bio: "Cross-border token advisory, smart contract compliance audits, and IP protection under Delaware, Swiss, and BLI standards.",
    skills: ["Legal Engineering", "IP Licensing", "DAO Governance", "Compliance", "BLI Standards"],
    hourlyRateEth: "0.00015",
    pricingTiers: [
      {
        tierId: "level_1",
        title: "Level 1: Statutory Compliance Review",
        priceEth: "0.00015",
        turnaround: "24 Hours",
        scopeSummary: "Delaware and BLI legal compliance review and preliminary risk assessment memo.",
      },
      {
        tierId: "level_2",
        title: "Level 2: Cross-Border Token & IP Advisory",
        priceEth: "0.00035",
        turnaround: "3 Days",
        scopeSummary: "Multi-jurisdiction IP licensing, Swiss Foundation advisory, and cryptographically anchored clause drafting.",
      },
      {
        tierId: "level_3",
        title: "Level 3: Comprehensive DAO Legal Engineering",
        priceEth: "0.00075",
        turnaround: "7 Days",
        scopeSummary: "Full DAO legal wrapper, dispute resolution smart contract architecture, and immutable notary stamp.",
      },
    ],
    reputationScore: 97,
    completedJobsCount: 19,
    maxCapacityEth: "0.05",
    rating: 4.9,
    verifiedOnChain: true,
    githubOrPortfolio: "https://github.com/cogent-legal",
    recentReviews: [
      {
        reviewer: "0x74b1dcD4C0aAF6b13BB407Ad2dE93c653679E300",
        rating: 5,
        comment: "Top-tier cross-border legal compliance. Delaware and Swiss law synthesis with cryptographic clause hash binding works perfectly.",
        date: "1 day ago",
      },
    ],
  },
  {
    id: "defi-auditor-elena",
    walletAddress: "0x5B83CdF34e0A98F71E6B930219c636f87429188e",
    fullName: "Elena Rostova",
    companyName: "HyperVault Security",
    roleTitle: "Senior DeFi Smart Contract Security Auditor",
    bio: "Comprehensive vulnerability discovery, reentrancy guards, formal verification, and automated cryptographic proof audits on EVM chains.",
    skills: ["Smart Contract Audits", "DeFi Security", "EVM Assembly", "Fuzzing", "Foundry"],
    hourlyRateEth: "0.00012",
    pricingTiers: [
      {
        tierId: "level_1",
        title: "Level 1: Automated Fuzzing & Static Analysis",
        priceEth: "0.00012",
        turnaround: "24 Hours",
        scopeSummary: "Automated Foundry fuzzing suite, static vulnerability scan, and Slither/Mythril report.",
      },
      {
        tierId: "level_2",
        title: "Level 2: DeFi Reentrancy & Oracle Hardening",
        priceEth: "0.00030",
        turnaround: "3 Days",
        scopeSummary: "In-depth reentrancy audit, flash loan attack simulations, and oracle manipulation hardening.",
      },
      {
        tierId: "level_3",
        title: "Level 3: Formal Verification & Invariant Proofs",
        priceEth: "0.00060",
        turnaround: "7 Days",
        scopeSummary: "Certora formal verification, mathematical invariant proofs, and complete security sign-off.",
      },
    ],
    reputationScore: 98,
    completedJobsCount: 34,
    maxCapacityEth: "0.05",
    rating: 5.0,
    verifiedOnChain: true,
    githubOrPortfolio: "https://github.com/hypervault-sec",
    recentReviews: [
      {
        reviewer: "0x3A9F1B2C4D5E6F7A8B9C0D1E2F3A4B5C6D7E8F9A",
        rating: 5,
        comment: "Found two critical reentrancy vulnerabilities and provided rock-solid formal verification fixes. Highly recommended.",
        date: "4 days ago",
      },
    ],
  },
  {
    id: "zk-engineer-marcus",
    walletAddress: "0x19F372C481A7b9E6c19f506A26B74A830B584E82",
    fullName: "Marcus Vance",
    companyName: "ZeroProof Labs",
    roleTitle: "Zero-Knowledge Cryptographer & Protocol Dev",
    bio: "Expert in private on-chain settlements, zk-SNARK verifiers, cryptographic identity hashing, and confidential legal instruments.",
    skills: ["zk-SNARKs", "Circom", "Cryptographic Proofs", "Ethereum Layer 2", "Rust"],
    hourlyRateEth: "0.00008",
    pricingTiers: [
      {
        tierId: "level_1",
        title: "Level 1: zk Proof Validation & Testing",
        priceEth: "0.00008",
        turnaround: "24 Hours",
        scopeSummary: "Circom circuit constraint checking and zero-knowledge verifier test suite.",
      },
      {
        tierId: "level_2",
        title: "Level 2: Custom zk-SNARK Verifier Circuit",
        priceEth: "0.00020",
        turnaround: "3 Days",
        scopeSummary: "Custom Groth16 / Plonk verifier contract for confidential escrow settlements on Base.",
      },
      {
        tierId: "level_3",
        title: "Level 3: Full Private Settlement Architecture",
        priceEth: "0.00045",
        turnaround: "7 Days",
        scopeSummary: "End-to-end confidential legal instrument with off-chain witness generation and on-chain Base settlement.",
      },
    ],
    reputationScore: 96,
    completedJobsCount: 14,
    maxCapacityEth: "0.05",
    rating: 4.8,
    verifiedOnChain: true,
    githubOrPortfolio: "https://github.com/zeroproof-labs",
    recentReviews: [
      {
        reviewer: "0x74b1dcD4C0aAF6b13BB407Ad2dE93c653679E300",
        rating: 5,
        comment: "Ultra-fast zk-SNARK verification circuits with low gas overhead on Base Sepolia. Impressive cryptographic rigor.",
        date: "1 week ago",
      },
    ],
  },
];

// Save or Update Contractor Profile (Strictly enforces valid 42-char EVM wallet)
export async function saveContractorProfile(profile: ContractorProfile): Promise<boolean> {
  const cleanAddr = (profile.walletAddress || "").trim();
  if (!cleanAddr.startsWith("0x") || cleanAddr.length !== 42) {
    console.warn("Cannot save contractor without valid 42-character EVM wallet address.");
    return false;
  }

  const profileToSave: ContractorProfile = {
    ...profile,
    walletAddress: cleanAddr,
  };

  // Sync to localStorage immediately for instant reactive update across open browser tabs
  if (typeof window !== "undefined") {
    try {
      const stored: ContractorProfile[] = JSON.parse(localStorage.getItem("lexiguard_contractors") || "[]");
      const filtered = stored.filter(
        (c) => c.walletAddress?.toLowerCase() !== cleanAddr.toLowerCase()
      );
      const updatedList = [profileToSave, ...filtered];
      localStorage.setItem("lexiguard_contractors", JSON.stringify(updatedList));
      window.dispatchEvent(new CustomEvent("lexiguard_contractors_updated", { detail: profileToSave }));
    } catch (e) {
      console.warn("Could not cache contractor profile to localStorage:", e);
    }
  }

  try {
    const docId = cleanAddr.toLowerCase();
    await setDoc(doc(db, "lexiguard_contractors", docId), {
      ...profileToSave,
      updatedAt: Timestamp.now(),
      isCustomRate: true,
    }, { merge: true });
    return true;
  } catch (err) {
    console.warn("Could not save contractor profile to Firestore:", err);
    return true; // Still true because local cache and memory are updated
  }
}

// Fetch all Contractor Profiles (Strictly excludes invalid or unconfigured wallets)
export async function getContractorProfiles(): Promise<ContractorProfile[]> {
  let localContractors: ContractorProfile[] = [];
  if (typeof window !== "undefined") {
    try {
      localContractors = JSON.parse(localStorage.getItem("lexiguard_contractors") || "[]");
    } catch (e) {}
  }

  try {
    const q = query(collection(db, "lexiguard_contractors"), limit(30));
    const snapshot = await getDocs(q);
    
    // Combine Firestore docs and local cache
    const firestoreRecords = !snapshot.empty 
      ? snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as ContractorProfile)) 
      : [];

    const combinedMap = new Map<string, ContractorProfile>();

    // Seed with defaults
    for (const def of DEFAULT_CONTRACTORS) {
      combinedMap.set(def.walletAddress.toLowerCase(), def);
    }

    // Overlay Firestore
    for (const fs of firestoreRecords) {
      if (fs.walletAddress && fs.walletAddress.startsWith("0x") && fs.walletAddress.length === 42) {
        const def = combinedMap.get(fs.walletAddress.toLowerCase());
        const tiers = (fs.pricingTiers && fs.pricingTiers.length > 0) ? fs.pricingTiers : def?.pricingTiers;
        
        // Preserve custom rates; only fallback if hourlyRateEth is missing or legacy high rate (> 0.04) without custom update
        const isLegacyHigh = def && (!fs.hourlyRateEth || (parseFloat(fs.hourlyRateEth) >= 0.04 && !(fs as any).isCustomRate && !(fs as any).updatedAt));
        const finalHourly = isLegacyHigh ? def.hourlyRateEth : (fs.hourlyRateEth || def?.hourlyRateEth || "0.00010");

        combinedMap.set(fs.walletAddress.toLowerCase(), {
          ...def,
          ...fs,
          hourlyRateEth: finalHourly,
          pricingTiers: tiers,
        });
      }
    }

    // Overlay LocalStorage (most recent admin edits)
    for (const loc of localContractors) {
      if (loc.walletAddress && loc.walletAddress.startsWith("0x") && loc.walletAddress.length === 42) {
        const existing = combinedMap.get(loc.walletAddress.toLowerCase());
        combinedMap.set(loc.walletAddress.toLowerCase(), {
          ...existing,
          ...loc,
        });
      }
    }

    return Array.from(combinedMap.values());
  } catch (err) {
    console.warn("Using default verified contractors:", err);
  }

  // Fallback with local cache if Firestore fails
  if (localContractors.length > 0) {
    const map = new Map(DEFAULT_CONTRACTORS.map((d) => [d.walletAddress.toLowerCase(), d]));
    for (const loc of localContractors) {
      if (loc.walletAddress) map.set(loc.walletAddress.toLowerCase(), { ...map.get(loc.walletAddress.toLowerCase()), ...loc });
    }
    return Array.from(map.values());
  }

  return DEFAULT_CONTRACTORS.filter(
    (c) => c.walletAddress && c.walletAddress.startsWith("0x") && c.walletAddress.length === 42
  );
}

// Credit Purchase Interface & Functions
export interface CreditPurchase {
  id?: string;
  walletAddress: string;
  packName?: string;
  packageName?: string;
  creditsAdded: number;
  amountEth?: string;
  ethAmount?: string;
  txHash: string;
  network: string;
  createdAt?: any;
  timestamp?: string;
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
      walletAddress: "0x74b1dcD4C0aAF6b13BB407Ad2dE93c653679E300",
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
  const cleanAddr = (walletAddress || "0x74b1dcD4C0aAF6b13BB407Ad2dE93c653679E300").toLowerCase();
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


