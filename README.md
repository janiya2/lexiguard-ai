# 🛡️ LexiGuard AI — On-Chain Legal Intelligence & Automated Compliance Vault

[![License: Apache-2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Next.js](https://img.shields.io/badge/Next.js-15.1.7-black)](https://nextjs.org/)
[![Base Sepolia](https://img.shields.io/badge/Network-Base_Sepolia-0052FF)](https://sepolia.basescan.org)

> **Official DoraHacks Submission for BLI Legal Tech Hackathon 2**  
> **Organized by:** Blockchain Legal Institute (BLI) & Cogent Law Group  
> **Built by:** InnoXpert Studio (Janitha Dilshan — Lead Solutions Architect)  
> **Category:** Legal Technology, RegTech, Compliance, Web3 & AI Convergence  
> **Verified Smart Contract:** `0x74b127D9b5F08b598C4ffc8b8A40a454868FE300` (Base Sepolia EVM)  
> **Live Demo:** [https://lexiguard-ai.vercel.app](https://lexiguard-ai.vercel.app)  

---

## 🏛️ Executive Summary & Dispute Minimization

Traditional commercial agreements—from freelance developer contracts to enterprise Web3 master service agreements—suffer from two structural vulnerabilities:
1. **Asymmetric Risk & Hidden Liabilities:** Complex legalese conceals predatory indemnity terms, perpetual IP forfeitures, and one-sided termination clauses that disadvantage builders and SMEs.
2. **Post-Signing Tamper Vulnerability:** Off-chain PDF documents lack immutable cryptographic proof of existence. If a party discreetly alters terms, proving original document integrity in court requires costly forensic discovery.

**LexiGuard AI solves both challenges under official BLI & US statutory standards:**
* **Instant AI Legal Risk Auditing:** Powered by Google Gemini 2.5 Flash and deterministic legal heuristics to parse agreements, flag critical liabilities, generate 0–100 Legal Health Scores, and recommend balanced redlines.
* **On-Chain Cryptographic Proof of Existence:** Anchors SHA-256 and keccak256 digests onto Base Sepolia EVM via a verified Solidity 0.8.20 smart contract, satisfying **Delaware DGCL § 224** (corporate electronic records) and **FRE Rule 902(13)&(14)** (self-authenticating digital evidence in US Federal Courts).
* **Non-Custodial Milestone Escrow:** Autonomous 99% / 1% split escrow releasing funds to contractors upon verified milestone deliverables.
* **Autonomous EIP-2771 Gasless Relayer:** Allows non-Web3 lawyers and hackathon judges to notarize agreements on Base Sepolia in ~2 seconds without MetaMask or testnet ETH.
* **Master Admin Control Hub & CMS:** Complete governance portal (`/admin`) for configuring all 8 landing page sections, API keys, contractor directories, and 1% treasury fees without redeployment.

---

## ⚡ Architecture Pipeline

```text
[ Legal Agreement / PDF / Contract Text ]
                     │
                     ▼
       ┌───────────────────────────┐
       │     LexiGuard AI Engine   │  <-- Gemini 1.5 Pro / Flash & Legal Heuristics
       └─────────────┬─────────────┘
                     │
         ┌───────────┴───────────┐
         ▼                       ▼
  [ Risk Audit & Redline ]   [ SHA-256 Digest Computation ]
  - Legal Health Score (0-100)      - Native Web Crypto API
  - Critical Liability Flags       - Zero-Knowledge Client Hashing
  - AI Redline Recommendations    - Immutable Document Hash
         │                       │
         ▼                       ▼
  [ Firestore Cloud Vault ]   [ EVM Smart Contract Notary ]
  - Collection: lexiguard_*       - LexiGuardNotary.sol (0.8.20)
  - Isolated Namespace            - Base Sepolia / Arbitrum Sepolia
  - 100% Private Offline Option   - Transaction Hash & Block Height
                     │
                     ▼
      ┌─────────────────────────────┐
      │  Verifiable Legal Certificate│
      │  & Public On-Chain Ledger   │
      └─────────────────────────────┘
```

---

## 💎 Key Features

### 1. 🔍 Clause-by-Clause AI Risk Auditor
* **Instant Risk Matrix:** Categorizes provisions into *Critical*, *Warning*, and *Acceptable* with legal rationale.
* **Automated Redlines:** Provides balanced, industry-standard contract clauses ready for negotiation.
* **AI Legal Co-Pilot:** An interactive Q&A assistant to query specific terms ("Can the client withhold fees?", "What are my termination obligations?").

### 2. ⛓️ Cryptographic Proof of Existence (Notary Vault)
* **Zero-Knowledge Privacy:** Document text is hashed client-side; raw confidential terms are never leaked onto public ledgers.
* **Tamper-Proof Verification Tool:** Users can paste any contract to mathematically verify if it matches the on-chain recorded digest down to the last byte.

### 3. 🤝 Web3 Smart Contract Escrow
* Integrates milestone escrow agreements directly into `LexiGuardNotary.sol`, locking funds until AI-verified milestone criteria are fulfilled.

### 4. 🎛️ Enterprise Admin Hub & CMS
* **Live Landing Page CMS:** Modify titles, subtitles, and hackathon announcements in real time via Firebase Firestore.
* **API Key Vault:** Securely configure Google Gemini API keys, custom EVM RPC endpoints, and IPFS gateways.
* **Document Ledger:** Real-time visibility into all notarized contracts and verification proofs.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend Framework** | Next.js 16 (App Router), React 19, TypeScript |
| **Styling & Aesthetics** | Tailwind CSS v4, Lucide Icons, Glassmorphism UI, Canvas Confetti |
| **Backend & Database** | Firebase Firestore & Firebase Storage (`web-b61f1`) |
| **Smart Contract** | Solidity 0.8.20 (`LexiGuardNotary.sol`), EVM ABI |
| **Web3 Telemetry** | Viem / Wagmi standards, Base Sepolia, Arbitrum Sepolia |
| **AI Intelligence** | Google Gemini 1.5 Pro / Flash & Deterministic Legal Heuristic Engine |

---

## 🚀 Getting Started

### Prerequisites
* Node.js 18+ or 20+
* npm or pnpm

### 1. Clone & Install
```bash
git clone https://github.com/janiya2/lexiguard-ai.git
cd lexiguard-ai
npm install
```

### 2. Configure Environment Variables
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=web-b61f1.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=web-b61f1
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=web-b61f1.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=806029963863
NEXT_PUBLIC_FIREBASE_APP_ID=1:806029963863:web:...
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📜 Smart Contract Reference

* **Contract File:** `src/contracts/LexiGuardNotary.sol`
* **Solidity Version:** `^0.8.20`
* **Network Tested:** Base Sepolia Testnet (Chain ID: `84532`) & Arbitrum Sepolia (Chain ID: `421614`)
* **Core Interface:**
  * `notarizeContract(bytes32 _docHash, string _docTitle, string _metadataURI, uint8 _complianceScore)`
  * `verifyDocument(bytes32 _docHash)`
  * `createEscrow(...)` / `releaseEscrow(...)`

---

## 🏆 Hackathon Credits & Disclaimer
Developed by **Janitha Dilshan** (Founder & Lead Architect, InnoXpert Studio) for the **BLI Legal Tech Hackathon 2**.
LexiGuard AI is an automated compliance intelligence tool and does not constitute formal legal counsel. Always consult certified legal practitioners for binding jurisprudence.

---

## 📄 License

This project is open-source and licensed under the **Apache License 2.0** — see the [LICENSE](LICENSE) file for details.  
Copyright © 2026 Janitha Dilshan (InnoXpert Studio). All rights reserved.
