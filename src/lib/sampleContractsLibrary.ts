/**
 * LexiGuard AI — 10 Production-Grade Test Legal Contracts
 * Specifically drafted for testing AI legal risk analysis, clause redlining, and on-chain notarization.
 */

export interface SampleContractDoc {
  id: string;
  title: string;
  category: "Freelance & Services" | "Confidentiality & NDA" | "Web3 & Blockchain" | "SaaS & Cloud" | "Employment & HR" | "Intellectual Property";
  riskProfile: "HIGH RISK / PREDATORY" | "MODERATE RISK" | "BALANCED / COMPLIANT";
  riskScoreExpectation: number; // e.g. 35, 75, 95
  summary: string;
  fileFormat: "TXT" | "PDF" | "DOCX";
  fileName: string;
  keyClausesTested: string[];
  fullText: string;
}

export const TEN_TEST_LEGAL_CONTRACTS: SampleContractDoc[] = [
  {
    id: "test-01-predatory-freelance",
    title: "Unfair Freelancer Master Services Agreement (MSA)",
    category: "Freelance & Services",
    riskProfile: "HIGH RISK / PREDATORY",
    riskScoreExpectation: 35,
    summary: "Contains unilateral perpetual IP surrender, Net 90 payment with 30% retention holdback, and termination without compensation.",
    fileFormat: "TXT",
    fileName: "01_predatory_freelance_msa.txt",
    keyClausesTested: [
      "Perpetual IP surrender across universe",
      "Net 90 payment with 30% warranty holdback",
      "Immediate termination without compensation",
      "One-sided Delaware litigation forum"
    ],
    fullText: `MASTER SERVICES AGREEMENT (FREELANCER ENGAGEMENT)

This Master Services Agreement ("Agreement") is made and entered into on this 13th day of October, 2026, by and between Enterprise Client Corp ("Client") and the Independent Contractor ("Contractor").

WHEREAS, Client desires to retain Contractor to perform software development and technical services, and Contractor desires to perform such services under the terms herein;
NOW, THEREFORE, the Parties agree as follows:

1. IP ASSIGNMENT & PERPETUAL EXCLUSIVITY:
The Contractor irrevocably assigns, transfers, and conveys to Client all rights, title, and interest in and to all inventions, software source code, designs, algorithms, methodologies, and general knowledge acquired during or prior to this engagement to the Client in perpetuity across the universe without compensation beyond the base milestone invoice.

2. UNLIMITED UNILATERAL INDEMNIFICATION:
The Contractor agrees to indemnify, defend, and hold harmless the Client and its parent companies, affiliates, directors, and agents from and against any and all claims, liabilities, losses, damages, and legal fees arising out of any defect, bug, delay, or subjective dissatisfaction, regardless of cause or willful misconduct.

3. PAYMENT TERMS & HOLDBACKS:
Invoices shall be payable Net 90 days following Client's subjective verification. Client reserves the unilateral right to withhold 30% of each invoice for 180 days as warranty escrow. Contractor waives all statutory rights to late interest fees or invoice penalties.

4. TERMINATION WITHOUT CAUSE & FORFEITURE:
Client may terminate this Agreement immediately at any time without advance notice and without obligation to compensate Contractor for in-progress hours or unapproved milestones. Contractor must provide 60 days advance written notice.

5. NON-COMPETE & RESTRICTIVE COVENANTS:
Contractor agrees not to engage, consult, or provide services to any competitor of Client globally for a period of twenty-four (24) months following termination, without geographic limitation.

6. UNILATERAL SCOPE CHANGES:
Client reserves the right to modify deliverables, milestones, and technical specifications at any time without adjusting project timeline or compensation.

7. WORK-FOR-HIRE & MORAL RIGHTS SURRENDER:
Contractor irrevocably waives all moral rights, paternity rights, and integrity rights in any deliverables created under this Agreement, in all jurisdictions worldwide.

8. AUDIT & SURVEILLANCE RIGHTS:
Client shall have continuous unrestricted access to inspect Contractor's local development environment, repositories, and private hardware during the term of this engagement.

9. GOVERNING LAW & JURISDICTION:
This Agreement shall be governed strictly by the laws of the State of Delaware. Contractor agrees to submit exclusively to the courts of New Castle County, Delaware, bearing all travel and legal costs personally.

10. ENTIRE AGREEMENT & AMENDMENT RESTRICTIONS:
This Agreement supersedes all prior agreements. Client may unilaterally amend these terms upon posting revised terms, which shall take immediate effect.`
  },
  {
    id: "test-02-mutual-nda",
    title: "Standard Mutual Non-Disclosure Agreement (NDA)",
    category: "Confidentiality & NDA",
    riskProfile: "BALANCED / COMPLIANT",
    riskScoreExpectation: 94,
    summary: "Balanced bilateral confidentiality terms protecting proprietary source code, cryptographic keys, and customer data with standard 2-year expiration.",
    fileFormat: "TXT",
    fileName: "02_mutual_nda_agreement.txt",
    keyClausesTested: [
      "Mutual bilateral confidentiality obligations",
      "Standard carve-outs for public domain information",
      "Reasonable 2-year term limit",
      "Injunction relief upon breach"
    ],
    fullText: `MUTUAL NON-DISCLOSURE AND CONFIDENTIALITY AGREEMENT

This Mutual Non-Disclosure Agreement ("Agreement") is made and entered into on this 13th day of October, 2026, by and between:
Party A ("Disclosing/Receiving Party") and Party B ("Disclosing/Receiving Party"), collectively referred to as the "Parties".

WHEREAS, the Parties desire to engage in confidential business and technical discussions regarding mutual software engineering, smart contract integration, and commercial collaboration; and
WHEREAS, such exploration requires the exchange of valuable proprietary materials, source code, cryptographic assets, and trade secrets;
NOW, THEREFORE, in consideration of the mutual covenants contained herein, the Parties agree as follows:

1. DEFINITION OF CONFIDENTIAL INFORMATION:
Confidential Information includes all non-public technical, operational, smart contract architecture, cryptographic keys, financial, and business information disclosed by either party, whether orally or in writing.

2. MUTUAL OBLIGATIONS OF NON-DISCLOSURE & STANDARD OF CARE:
Each party agrees to safeguard the other party's Confidential Information with the same degree of care as its own proprietary data, but no less than reasonable care. Neither party shall disclose Confidential Information to third parties without prior written consent. Access shall be restricted strictly to authorized personnel with a clear need to know.

3. STANDARD PERMITTED EXCLUSIONS:
Confidential Information shall not include information that: (a) is or becomes publicly known through no breach of this Agreement; (b) was already known to receiving party prior to disclosure; (c) is independently developed without reference to disclosing party's data; or (d) is required to be disclosed pursuant to a lawful court order.

4. RETURN OR CERTIFIED CRYPTOGRAPHIC DESTRUCTION:
Upon written request or upon termination of discussions, the receiving party shall promptly return or permanently destroy all documents, digital media, repositories, and cryptographic keys containing Confidential Information, and certify such action in writing within fourteen (14) days.

5. INTELLECTUAL PROPERTY & NO IMPLIED LICENSE:
All Confidential Information remains the exclusive property of the disclosing party. Nothing in this Agreement shall be construed as granting or conferring, either expressly or by implication, any license, patent, copyright, trademark, or ownership interest in the disclosing party's intellectual property.

6. TERM, DURATION & SURVIVAL:
The confidentiality obligations under this Agreement shall survive for a period of two (2) years following the date of disclosure; provided that trade secrets and core smart contract security blueprints shall remain protected indefinitely.

7. NON-CIRCUMVENTION & MUTUAL INTEGRITY:
The Parties agree not to bypass, circumvent, or avoid each other regarding proprietary contacts, developers, clients, or investors introduced during the confidential disclosure period for a duration of twelve (12) months.

8. EQUITABLE REMEDIES & INJUNCTIVE RELIEF:
The parties acknowledge that unauthorized disclosure may cause irreparable harm for which monetary damages are inadequate, entitling the non-breaching party to seek injunctive relief without bond.

9. GOVERNING LAW & DECENTRALIZED ARBITRATION:
This Agreement shall be governed in accordance with international commercial legal standards and the procedural guidelines established by the Blockchain Legal Institute (BLI). Any dispute shall be resolved through binding digital arbitration before an accredited panel.

10. ENTIRE AGREEMENT & MISCELLANEOUS:
This Agreement represents the entire understanding between the Parties regarding confidentiality and supersedes all prior discussions. Any modification must be executed in writing by both Parties.`
  },
  {
    id: "test-03-web3-token-advisor",
    title: "Web3 Strategic Advisor & Token Grant Agreement",
    category: "Web3 & Blockchain",
    riskProfile: "BALANCED / COMPLIANT",
    riskScoreExpectation: 91,
    summary: "Defines advisory scope (5 hrs/month), token grant allocation (50k tokens), 12-month linear vesting with 3-month cliff, and SEC compliance warranties.",
    fileFormat: "TXT",
    fileName: "03_web3_token_advisor_agreement.txt",
    keyClausesTested: [
      "Defined monthly advisory commitment (5 hrs)",
      "Vesting schedule with standard 3-month cliff",
      "Mutual indemnification limited to gross negligence",
      "Securities law compliance representations"
    ],
    fullText: `WEB3 STRATEGIC ADVISOR & TOKEN GRANT AGREEMENT

This Web3 Advisor Agreement is entered into between LexiGuard Labs Foundation ("Company") and the Strategic Technical Advisor ("Advisor").

1. ADVISORY SCOPE & COMMITMENT:
Advisor shall provide strategic guidance on smart contract security architectures, token economics, and EVM decentralized compliance. Total advisory time shall not exceed five (5) hours per calendar month without mutual written agreement.

2. TOKEN ALLOCATION & VESTING SCHEDULE:
In consideration of Advisory Services, Company grants Advisor 50,000 Governance Tokens. The tokens shall vest over twelve (12) months in equal monthly tranches, following a three (3) month initial cliff from Token Generation Event (TGE).

3. REGULATORY COMPLIANCE WARRANTIES:
Advisor warrants that Advisor is an accredited participant and will not engage in manipulative market trading. Company warrants that token generation conforms with prevailing decentralized utility guidelines.

4. MUTUAL INDEMNITY & LIABILITY LIMITATION:
Each party agrees to indemnify the other solely against third-party claims resulting directly from gross negligence or intentional fraud. Aggregate liability shall not exceed the fair market value of vested tokens under this Agreement.

5. TERMINATION:
Either party may terminate this advisory arrangement with thirty (30) days advance written notice. Vested tokens shall remain Advisor's property.`
  },
  {
    id: "test-04-saas-enterprise-sla",
    title: "Enterprise SaaS Service Level Agreement (SLA)",
    category: "SaaS & Cloud",
    riskProfile: "MODERATE RISK",
    riskScoreExpectation: 74,
    summary: "Enterprise cloud subscription agreement with 99.5% uptime commitment, anonymized telemetry usage, and 12-month fee liability cap.",
    fileFormat: "TXT",
    fileName: "04_saas_enterprise_sla.txt",
    keyClausesTested: [
      "99.5% uptime service guarantee with service credits",
      "Customer data ownership with telemetry carve-out",
      "Liability capped at 12 months fees paid",
      "30-day termination for convenience with prorated refund"
    ],
    fullText: `ENTERPRISE SOFTWARE-AS-A-SERVICE (SaaS) AGREEMENT

This SaaS Agreement is made between Cloud Services Provider ("Provider") and the Subscribing Enterprise ("Customer").

1. SERVICE AVAILABILITY & SLA COMMITMENT:
Provider guarantees 99.5% service uptime per calendar month. In the event of unscheduled downtime exceeding 0.5%, Provider shall issue service credits equal to 5% of monthly fees for each hour of continuous outage, up to a maximum of 50% monthly credit.

2. DATA PRIVACY & TELEMETRY USAGE:
Customer retains all proprietary ownership of Customer Data stored within Provider's cloud infrastructure. Provider is permitted to analyze aggregated, anonymized usage telemetry solely for infrastructure load balancing and model optimization.

3. LIMITATION OF LIABILITY:
Neither party shall be held liable for consequential, punitive, or loss of anticipated revenue. Provider's total aggregate liability arising under this Agreement shall be limited to the total fees actually paid by Customer in the preceding twelve (12) months.

4. DATA PORTABILITY & HANDOVER:
Upon termination, Customer shall have thirty (30) calendar days to export all stored database records in standard JSON/CSV format at no additional cost.

5. GOVERNING LAW:
This Agreement shall be governed by the laws of the State of California, with disputes submitted to neutral arbitration in San Francisco.`
  },
  {
    id: "test-05-software-dev-holdback",
    title: "Software Engineering Agreement (Heavy Retention & Net 60)",
    category: "Freelance & Services",
    riskProfile: "HIGH RISK / PREDATORY",
    riskScoreExpectation: 42,
    summary: "Imposes 60-day payment delays, 25% warranty escrow retention for 9 months, and full developer liability for third-party open source library vulnerabilities.",
    fileFormat: "TXT",
    fileName: "05_software_dev_contract_net60.txt",
    keyClausesTested: [
      "Net 60 payment terms upon subjective QA approval",
      "25% retention holdback for 270 days",
      "Developer strictly liable for upstream open source bugs",
      "Perpetual non-compete preventing work in same industry"
    ],
    fullText: `CUSTOM SOFTWARE DEVELOPMENT AGREEMENT

This Custom Software Agreement is between FinTech Client ("Client") and the Independent Software Developer ("Developer").

1. SCOPE OF DELIVERABLES & SUBJECTIVE QA:
Developer shall engineer custom backend microservices. Payment is contingent upon Client's subjective internal QA sign-off, which Client may defer for up to sixty (60) days without penalty.

2. PAYMENT TERMS & WARRANTY RETENTION:
Invoices are payable Net 60 days following formal acceptance. Client shall retain twenty-five percent (25%) of all invoice totals for nine (9) months (270 days) to insure against software bugs or downtime.

3. THIRD-PARTY OPEN SOURCE INDEMNITY:
Developer expressly warrants and indemnifies Client against any security vulnerability, CVE alert, or intellectual property dispute arising from any open-source dependency or package imported into the software, regardless of whether Developer authored such package.

4. PERPETUAL RESTRICTIVE COVENANT:
Developer agrees that for a period of two (2) years following project handover, Developer will not develop or consult on any financial software application for any other client globally.`
  },
  {
    id: "test-06-ip-assignment",
    title: "Independent Contractor Inventions & IP Assignment",
    category: "Intellectual Property",
    riskProfile: "HIGH RISK / PREDATORY",
    riskScoreExpectation: 38,
    summary: "Seeks to confiscate pre-existing tools, open source frameworks, and personal inventions created outside working hours.",
    fileFormat: "TXT",
    fileName: "06_independent_contractor_ip_assignment.txt",
    keyClausesTested: [
      "Confiscation of pre-existing background codebases",
      "Assignment of off-hours personal inventions",
      "Perpetual moral rights waiver worldwide",
      "No royalty compensation beyond nominal $1"
    ],
    fullText: `CONFIDENTIALITY AND INVENTIONS ASSIGNMENT AGREEMENT

This Agreement is made by Contractor in favor of Technology Ventures Corp ("Company").

1. BROAD ASSIGNMENT OF ALL INVENTIONS:
Contractor assigns to Company all right, title, and interest in all works of authorship, inventions, code libraries, designs, and patentable discoveries conceived, reduced to practice, or developed by Contractor during the term of this engagement, whether developed on Company premises or on Contractor's personal equipment during personal hours.

2. PRE-EXISTING TOOLS & FRAMEWORKS:
Contractor agrees that any pre-existing software, frameworks, or tools utilized in the delivery of services shall automatically be licensed to Company on a perpetual, royalty-free, exclusive, worldwide basis with unrestricted rights to sublicense and modify.

3. MORAL RIGHTS WAIVER:
Contractor unconditionally and irrevocably waives all moral rights, paternity rights, and integrity rights in any deliverables created under this Agreement across all jurisdictions worldwide.`
  },
  {
    id: "test-07-consulting-retainer",
    title: "Executive Strategic Consulting Retainer Agreement",
    category: "Freelance & Services",
    riskProfile: "MODERATE RISK",
    riskScoreExpectation: 78,
    summary: "Standard monthly retainer ($8,000/mo) with Net 15 invoices, 20 hours allocation, and mutual 30-day termination notice.",
    fileFormat: "TXT",
    fileName: "07_consulting_retainer_agreement.txt",
    keyClausesTested: [
      "Fixed monthly retainer payable in advance",
      "Reasonable 20 hours/month capacity limit",
      "Mutual 30-day termination notice",
      "Client reimburses pre-approved out-of-pocket expenses"
    ],
    fullText: `EXECUTIVE STRATEGIC CONSULTING RETAINER AGREEMENT

This Retainer Agreement is entered into between Corporate Enterprise Inc ("Client") and the Strategic Advisor ("Consultant").

1. RETAINER FEE & ALLOCATION:
Client shall pay Consultant a monthly retainer of $8,000 USD payable on the first calendar day of each month. The retainer reserves up to twenty (20) hours of strategic advisory per month. Unused hours do not roll over to subsequent months.

2. EXPENSE REIMBURSEMENT:
Client shall reimburse Consultant for all reasonable, pre-approved travel and out-of-pocket expenses incurred in the performance of services within fifteen (15) days of receipt of invoice.

3. INDEPENDENT CONTRACTOR STATUS:
Consultant is an independent contractor and is not an employee, agent, or partner of Client. Consultant is responsible for all income taxes and statutory contributions.

4. TERM & TERMINATION:
This Agreement shall continue on a month-to-month basis. Either party may terminate with thirty (30) days advance written notice.`
  },
  {
    id: "test-08-b2b-commission",
    title: "B2B Technology Affiliate & Sales Referral Agreement",
    category: "Freelance & Services",
    riskProfile: "BALANCED / COMPLIANT",
    riskScoreExpectation: 88,
    summary: "Equitable 15% referral commission model with verified milestone tracking, Net 30 payouts, and clear dispute resolution.",
    fileFormat: "TXT",
    fileName: "08_b2b_sales_commission_agreement.txt",
    keyClausesTested: [
      "Clear 15% net revenue commission calculation",
      "Net 30 payout following client invoice collection",
      "12-month attribution window for introduced clients",
      "Mutual non-disparagement and confidentiality"
    ],
    fullText: `B2B TECHNOLOGY REFERRAL AND REVENUE SHARE AGREEMENT

This Referral Agreement is made between LexiGuard Software Corp ("Company") and the Referral Partner ("Partner").

1. REFERRAL FEE STRUCTURE:
Company agrees to pay Partner a referral commission equal to fifteen percent (15%) of the Net Contract Value actually collected from any qualified client introduced by Partner.

2. PAYMENT TIMELINE:
Referral fees shall be calculated monthly and paid within thirty (30) days following the end of the month in which Company collects payment from the referred customer.

3. ATTRIBUTION WINDOW:
Partner is entitled to commissions on all contract renewals and expansion revenue from the introduced client for a period of twelve (12) months from the initial transaction date.

4. AUDIT RIGHTS:
Partner shall have the right, upon reasonable written notice, to inspect Company's referral accounting records up to once per calendar year to verify fee calculations.`
  },
  {
    id: "test-09-executive-noncompete",
    title: "Senior Engineering Offer with Punitive Non-Compete",
    category: "Employment & HR",
    riskProfile: "HIGH RISK / PREDATORY",
    riskScoreExpectation: 45,
    summary: "Imposes global 24-month non-compete without salary continuation, clawback of vested bonuses, and mandatory wage deductions.",
    fileFormat: "TXT",
    fileName: "09_executive_offer_noncompete.txt",
    keyClausesTested: [
      "Overbroad 24-month global non-compete clause",
      "No compensation or severance during non-compete period",
      "Clawback of earned bonuses if departing within 18 months",
      "Arbitrary employer wage deductions for minor errors"
    ],
    fullText: `SENIOR EXECUTIVE EMPLOYMENT AGREEMENT & RESTRICTIVE COVENANTS

This Agreement is between Global Tech Holdings ("Employer") and the Executive Employee ("Employee").

1. RESTRICTIVE NON-COMPETE COVENANT:
Employee covenants that for a period of twenty-four (24) months following termination of employment for any reason, Employee shall not directly or indirectly work for, consult with, invest in, or assist any entity operating in the software or legal technology sector anywhere globally.

2. NO SEVERANCE DURING RESTRICTION:
Employer shall have no obligation to pay salary continuation, compensation, or garden leave benefits to Employee during the twenty-four (24) month non-compete period.

3. RETROACTIVE BONUS CLAWBACK:
In the event Employee resigns within eighteen (18) months of receiving any performance bonus or equity grant, Employee shall repay one hundred percent (100%) of such bonus to Employer within thirty (30) days.

4. UNILATERAL WAGE DEDUCTIONS:
Employer reserves the right to deduct from Employee's final salary any sums deemed by Employer to represent equipment wear-and-tear or project delay costs.`
  },
  {
    id: "test-10-smart-escrow-contract",
    title: "On-Chain Smart Escrow Milestone Services Agreement",
    category: "Web3 & Blockchain",
    riskProfile: "BALANCED / COMPLIANT",
    riskScoreExpectation: 96,
    summary: "Model contract designed for LexiGuard On-Chain Escrow Vault. Features cryptographic hash verification, milestone lock, and decentralized dispute arbitration.",
    fileFormat: "TXT",
    fileName: "10_escrow_milestone_contract.txt",
    keyClausesTested: [
      "Cryptographic SHA-256 document notarization on Base Sepolia",
      "100% funds locked in smart contract escrow prior to milestone kickoff",
      "Mutual multi-sig release upon verified delivery",
      "Decentralized digital arbitration via BLI tribunal"
    ],
    fullText: `ON-CHAIN SMART ESCROW SERVICES AGREEMENT (EVM DEPLOYED)

This Agreement is anchored on the Base Sepolia network between Client and Contractor.

1. IMMUTABLE ON-CHAIN DEPOSIT:
Client shall deposit 100% of the milestone funds into the verified LexiGuard Smart Escrow Vault prior to Contractor commencing work. Funds cannot be unilaterally reclaimed by Client while milestone is in active development.

2. CRYPTOGRAPHIC NOTARIZATION OF DELIVERABLES:
All specifications and code deliverables shall be verified via SHA-256 cryptographic hash anchored to the EVM blockchain.

3. MILESTONE INSPECTION & RELEASE:
Client shall have seven (7) calendar days to inspect milestone deliverables. Upon inspection approval, escrowed funds are instantly released to Contractor's wallet address. If Client fails to approve or reject within seven days, funds are automatically released.

4. DECENTRALIZED DISPUTE RESOLUTION:
In the event of an irreconcilable dispute, either party may trigger the Blockchain Legal Institute (BLI) digital arbitration module. The arbitrator's cryptographic signature shall direct the escrow vault to release funds according to the arbitral decision.`
  }
];
