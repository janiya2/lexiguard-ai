# 🛡️ LexiGuard AI — Master Architecture Blueprint & Project State
> **Hackathon Edition**: BLI Legal Tech Hackathon 2026  
> **Status**: Production Build Deployed & Active on `http://localhost:3005`  
> **Last Updated**: 2026-10-12 07:15 AM (Morning Checkpoint)

---

## 📌 1. Project Overview & Core Value Proposition
**LexiGuard AI** is an enterprise-grade LegalTech & Web3 platform combining **AI Contract Auditing** with **Cryptographic On-Chain Notarization and Milestone Escrow Vaults** on **Base Sepolia (Ethereum L2)**.

* **Problem Solved**: Small businesses, freelancers, and legal contractors frequently fall victim to predatory contract clauses, ambiguous milestones, and non-payment risks. Traditional notarization is slow, centralized, and expensive.
* **LexiGuard Solution**:
  1. **Instant AI Legal Auditor**: Analyzes complex legal contracts in seconds, flags high-risk clauses, predatory liabilities, and ambiguous payment schedules.
  2. **Cryptographic Proofs**: Generates SHA-256 digests of signed contracts, notarizing them immutably on Base Sepolia EVM.
  3. **Zero-Gas Instant Verifier**: Anyone (judges, clients, courts) can paste a document to mathematically verify if a single character or percentage was altered.
  4. **Smart Legal Escrow Vault**: Clients lock milestone funds in smart contracts; payment releases automatically upon verified milestone proof.
  5. **Gasless Web3 Relayer**: Non-crypto users and hackathon judges can test all features seamlessly without installing MetaMask or buying crypto.

---

## 🌐 2. Web3 & Blockchain Infrastructure (Base Sepolia L2)

| Parameter | Value / Configuration |
| :--- | :--- |
| **Network** | Base Sepolia Testnet |
| **Chain ID** | `84532` |
| **RPC Endpoint** | `https://sepolia.base.org` |
| **Block Explorer** | [sepolia.basescan.org](https://sepolia.basescan.org) |
| **Active Funded Wallet** | `0x74b1dcD4C0aAF6b13BB407Ad2dE93c653679E300` |
| **Wallet Balance** | `~0.0100 ETH` (Funded via Base Sepolia Faucet) |
| **Live Explorer Link** | [BaseScan: 0x74b1dcD4...E300](https://sepolia.basescan.org/address/0x74b1dcD4C0aAF6b13BB407Ad2dE93c653679E300) |
| **Confirmed On-Chain Txs** | **8+ Live Transactions** recorded on BaseScan |
| **Notary Smart Contract** | `0x036cbd53842c5426634e7929541ec2318f3dcf7e` |

---

## 🏗️ 3. Application Architecture & Pages

### 1. **AI Auditor (`/auditor`)**
- Full-featured contract analyzer with support for text input, file upload (.pdf, .docx, .txt), and pre-loaded sample agreements.
- Detects predatory clauses, indemnification traps, and non-competes.
- Calculates an objective **Legal Health Score (0–100)**.
- Generates verified cryptographic legal notarization anchored directly to Base Sepolia.

### 2. **On-Chain Legal Notary & Escrow Vault (`/vault`)**
- **Instant Document Integrity Verifier**:
  - Computes SHA-256 digest on client-side and validates against on-chain hash registry.
  - Interactive "Load Authentic Agreement" vs "Load Tampered (Altered 4.5% → 1.0%)" buttons to demonstrate anti-fraud verification to judges.
- **Smart Legal Escrow & Milestone Deposits**:
  - Create escrow deals with locked ETH.
  - Milestone release mechanism and dispute protections.

### 3. **Treasury & Web3 Wallet Hub (`/wallet`)**
- Displays connected wallet info: Network (`Base Sepolia`), Chain ID (`84532`), and Active Address (`0x74b1dcD4C0aAF6b13BB407Ad2dE93c653679E300`).
- Displays live **Sepolia ETH Balance** (`0.0100 ETH`) and **Audit Credits Balance** (`100 Audits`).
- Financial metrics: Escrow Value Locked, Payouts Released, Active Escrow Deals, Top-Up Purchases.
- **Top-Up Credits Modal**:
  - Real MetaMask transaction broadcast (for live crypto users).
  - Instant Zero-Gas Sandbox demo (for hackathon judges).

### 4. **Contractors Directory (`/contractors`)**
- Vetted legal specialists and smart contract developers.
- Direct integration to hire contractors through escrow vaults.

### 5. **Audit History & Verification Explorer (`/history`)**
- Comprehensive table of all notarized contracts and escrow transactions.
- Direct one-click BaseScan explorer links.
- Cryptographic receipt downloader (JSON proof with SHA-256 and block metadata).

### 6. **Admin Dashboard (`/admin`)**
- Realtime treasury configuration (`ownerTreasuryAddress`).
- Audit credit overrides, contractor management, and Firestore data sync.

---

## 🗄️ 4. Database & State Management (Firestore & LocalStorage)

### Firestore Collections:
1. `lexiguard_settings/global`:
   - `ownerTreasuryAddress`: `0x74b1dcD4C0aAF6b13BB407Ad2dE93c653679E300`
   - `defaultCreditsPerNewWallet`: `100`
   - `network`: `Base Sepolia EVM`
2. `lexiguard_credits/{walletAddress}`:
   - Stores live audit credit balance for each user.
3. `lexiguard_escrows`:
   - Active, locked, and released escrow contracts.
4. `lexiguard_audits`:
   - Saved contract audits, hashes, and verification metadata.

---

## 🚀 5. Key Fixes Completed in Today's Session

1. **Fixed Placeholder Address Issue**:
   - Replaced all instances of stale `0x7F2B89a4...` (which had 0 ETH and 0 txs) with the real funded address `0x74b1dcD4C0aAF6b13BB407Ad2dE93c653679E300`.
   - Cleared and migrated stale LocalStorage cache automatically.
2. **Verified BaseScan Integration**:
   - Clicking BaseScan explorer buttons opens the active funded address with **0.0100 ETH** and **8+ live transactions**.
3. **Optimized Pricing & Top-Up Packs**:
   - Aligned pricing tiers with faucet balance (`0.001 ETH`, `0.002 ETH`, `0.005 ETH`).
   - Added instant sandbox demo for judges without requiring gas.
4. **Production Build & Stability**:
   - Verified clean compilation with `npm run build`.
   - Running smoothly on `http://localhost:3005`.

---

## 📋 6. Tasks for Next Session (When Waking Up)

1. [ ] **Escrow Vault Fine-Tuning (`/vault`)**:
   - Review and implement any pending UX modifications or edge-case handling for escrow release/dispute.
2. [ ] **Landing Page Polish (`/`)**:
   - Review hero section, interactive demo widgets, feature callouts, and presentation flow for BLI hackathon judges.
3. [ ] **Final Rehearsal & Pitch Alignment**:
   - Test full flow: Landing Page → AI Auditor → Notary Hash → Vault Escrow → Wallet Top-Up → History Verification.
