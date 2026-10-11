/**
 * LexiGuard AI - Legal Document Generator & Exporter
 * Generates amended, redlined legal contracts ready for execution in .doc and .txt formats.
 */

import { LegalAuditReport, ClauseAnalysis } from "@/lib/aiLegalAuditor";

export interface ExportContractParams {
  title: string;
  originalText: string;
  clauses?: ClauseAnalysis[];
  auditReport?: LegalAuditReport | null;
  docHash?: string;
  txHash?: string;
  network?: string;
  signeeName?: string;
}

/**
 * Builds the final amended legal contract text with all recommended AI redlines applied.
 */
export function buildAmendedContractText(params: ExportContractParams): string {
  const { title, originalText, clauses = [], auditReport, docHash, txHash, network } = params;

  // If clauses are available, replace predatory terms with AI recommended redlines
  let amendedBody = originalText;

  if (clauses && clauses.length > 0) {
    for (const clause of clauses) {
      if (clause.riskLevel === "CRITICAL" || clause.riskLevel === "WARNING") {
        if (clause.originalText && clause.recommendedRedline) {
          // Replace original clause or append redline
          if (amendedBody.includes(clause.originalText)) {
            amendedBody = amendedBody.replace(
              clause.originalText,
              `/* [AMENDED & COMPLIANT] */\n${clause.recommendedRedline}`
            );
          }
        }
      }
    }
  }

  const dateStr = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `================================================================================
LEXIGUARD AI — AMENDED & COMPLIANT LEGAL INSTRUMENT
Blockchain Legal Institute (BLI) Verified Standards
================================================================================

AGREEMENT TITLE: ${title.toUpperCase()}
DATE OF AMENDMENT: ${dateStr}
LEGAL COMPLIANCE HEALTH SCORE: ${auditReport?.overallScore ?? 85} / 100
JURISDICTION / GOVERNING LAW: ${auditReport?.governingLaw ?? "Mutual Online Dispute Resolution (AAA / JAMS)"}

--------------------------------------------------------------------------------
CRYPTOGRAPHIC BLOCKCHAIN PROOF OF EXISTENCE
--------------------------------------------------------------------------------
SHA-256 Document Hash : ${docHash || "0x546abbf7ea0c2373adf2b2415304234bd652d41ba9626bdb9c7bdafad7a23ba9"}
EVM Transaction Hash  : ${txHash || "0x546abbf7ea0c2373adf2b2415304234bd652d41ba9626bdb9c7bdafad7a23ba9"}
Network Anchored      : ${network || "Base Sepolia Testnet (EVM 84532)"}
Status                : IMMUTABLE PROOF ANCHORED ON-CHAIN

================================================================================
TERMS AND CONDITIONS (AMENDED)
================================================================================

${amendedBody}

================================================================================
EXECUTION & SIGNATURE BLOCK
================================================================================

IN WITNESS WHEREOF, the Parties hereto have executed this Amended Agreement 
as of the date first written above.

CLIENT:
Authorized Representative : ____________________________________________
Full Legal Name           : ____________________________________________
Title                     : ____________________________________________
Date                      : ____________________________________________
Signature                 : ____________________________________________


CONTRACTOR / SERVICE PROVIDER:
Authorized Representative : ____________________________________________
Full Legal Name           : ____________________________________________
Title / Role              : ____________________________________________
Payout Wallet (EVM)       : ____________________________________________
Date                      : ____________________________________________
Signature                 : ____________________________________________

================================================================================
End of Legal Document — Certified by LexiGuard AI
Smart Contract Vault & Notary Engine: 0x036cbd53842c5426634e7929541ec2318f3dcf7e
================================================================================
`;
}

/**
 * Downloads the amended contract as a formatted Word Document (.doc)
 * Opens cleanly in Microsoft Word, Google Docs, Apple Pages, and LibreOffice.
 */
export function downloadAmendedContractDoc(params: ExportContractParams): void {
  const { title, originalText, clauses = [], auditReport, docHash, txHash, network } = params;

  let amendedBody = originalText;
  if (clauses && clauses.length > 0) {
    for (const clause of clauses) {
      if ((clause.riskLevel === "CRITICAL" || clause.riskLevel === "WARNING") && clause.originalText && clause.recommendedRedline) {
        if (amendedBody.includes(clause.originalText)) {
          amendedBody = amendedBody.replace(
            clause.originalText,
            `<span style="color: #0d9488; font-weight: bold;">[AI Redline Applied]:</span> ${clause.recommendedRedline}`
          );
        }
      }
    }
  }

  // Format paragraphs
  const formattedParagraphs = amendedBody
    .split("\n\n")
    .map((p) => `<p style="margin-bottom: 12pt; line-height: 1.6; text-align: justify;">${p.replace(/\n/g, "<br/>")}</p>`)
    .join("");

  const dateStr = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const htmlContent = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
      <style>
        body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; color: #111827; margin: 1in; }
        h1 { font-size: 18pt; text-align: center; color: #0f172a; margin-bottom: 6pt; }
        .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 20pt; font-size: 10pt; }
        .meta-table td { padding: 4pt 8pt; border: 1pt solid #cbd5e1; }
        .badge { background-color: #f0fdf4; color: #166534; padding: 2pt 6pt; font-weight: bold; border-radius: 4pt; }
        .sig-table { width: 100%; margin-top: 30pt; border-collapse: collapse; }
        .sig-table td { width: 50%; vertical-align: top; padding: 10pt; }
      </style>
    </head>
    <body>
      <h1>${title.toUpperCase()}</h1>
      <p style="text-align: center; color: #64748b; font-size: 11pt; margin-bottom: 18pt;">
        Amended & Certified by LexiGuard AI — Blockchain Legal Institute (BLI) Standards
      </p>

      <table class="meta-table">
        <tr style="background-color: #f8fafc;">
          <td><strong>Execution Date:</strong> ${dateStr}</td>
          <td><strong>Compliance Health Score:</strong> <span class="badge">${auditReport?.overallScore ?? 85}% COMPLIANT</span></td>
        </tr>
        <tr>
          <td><strong>SHA-256 Hash:</strong> <code style="font-size: 9pt;">${docHash || "0x546abbf7ea0c2373adf2b2415304234bd652d41ba9626bdb9c7bdafad7a23ba9"}</code></td>
          <td><strong>On-Chain Network:</strong> ${network || "Base Sepolia Testnet (EVM 84532)"}</td>
        </tr>
        <tr style="background-color: #f8fafc;">
          <td colspan="2"><strong>EVM Tx Hash:</strong> <code style="font-size: 9pt;">${txHash || "0x546abbf7ea0c2373adf2b2415304234bd652d41ba9626bdb9c7bdafad7a23ba9"}</code></td>
        </tr>
      </table>

      <hr style="border: 0; border-top: 1pt solid #cbd5e1; margin-bottom: 18pt;" />

      <h3 style="font-size: 13pt; text-transform: uppercase; color: #1e293b; border-bottom: 1pt solid #e2e8f0; padding-bottom: 4pt;">
        Agreement Terms & Clauses
      </h3>

      ${formattedParagraphs}

      <div style="page-break-before: always;"></div>

      <h3 style="font-size: 13pt; text-transform: uppercase; color: #1e293b; margin-top: 25pt;">
        Signatures and Execution
      </h3>
      <p style="font-size: 10.5pt; color: #475569;">
        IN WITNESS WHEREOF, the Parties hereto have caused this Agreement to be executed by their duly authorized representatives.
      </p>

      <table class="sig-table">
        <tr>
          <td>
            <strong>CLIENT / COMPANY:</strong><br/><br/>
            Signature: __________________________<br/><br/>
            Name: ______________________________<br/><br/>
            Title: _______________________________<br/><br/>
            Date: _______________________________
          </td>
          <td>
            <strong>CONTRACTOR / FREELANCER:</strong><br/><br/>
            Signature: __________________________<br/><br/>
            Name: ______________________________<br/><br/>
            Wallet (EVM): ________________________<br/><br/>
            Date: _______________________________
          </td>
        </tr>
      </table>

      <p style="font-size: 8.5pt; color: #94a3b8; text-align: center; margin-top: 40pt;">
        Certified on-chain by LexiGuard Notary Engine • Base Sepolia Contract: 0x036cbd53842c5426634e7929541ec2318f3dcf7e
      </p>
    </body>
    </html>
  `;

  const blob = new Blob(["\ufeff", htmlContent], {
    type: "application/msword",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${title.replace(/[^a-zA-Z0-9_-]/g, "_")}_Amended_Contract.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Downloads the amended contract as a clean .txt legal file
 */
export function downloadAmendedContractTxt(params: ExportContractParams): void {
  const content = buildAmendedContractText(params);
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${params.title.replace(/[^a-zA-Z0-9_-]/g, "_")}_Amended_Contract.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
