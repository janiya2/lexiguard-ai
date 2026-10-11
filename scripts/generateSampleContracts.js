const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, '..', 'public', 'sample-contracts');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const libPath = path.join(__dirname, '..', 'src', 'lib', 'sampleContractsLibrary.ts');
const content = fs.readFileSync(libPath, 'utf8');

const regex = /fileName:\s*"([^"]+)"[\s\S]*?fullText:\s*`([\s\S]*?)`/g;
let match;
let count = 0;

while ((match = regex.exec(content)) !== null) {
  const fileName = match[1];
  const text = match[2].trim();
  fs.writeFileSync(path.join(outDir, fileName), text, 'utf8');
  console.log(`Generated file: ${fileName} (${text.length} chars)`);
  count++;
}

console.log(`Successfully generated ${count} sample contract TXT files in public/sample-contracts/`);

// Also generate formatted .doc (Microsoft Word) versions for key test files
const docFiles = ['01_predatory_freelance_msa', '02_mutual_nda_agreement', '03_web3_token_advisor_agreement'];
for (const f of docFiles) {
  const txt = fs.readFileSync(path.join(outDir, f + '.txt'), 'utf8');
  const docHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${f}</title><style>body{font-family:Calibri,sans-serif;font-size:12pt;line-height:1.6;margin:40px;color:#1e293b;}h1{color:#0f172a;border-bottom:2px solid #0284c7;padding-bottom:8px;}p{margin-bottom:14px;}</style></head><body><h1>${f.replace(/_/g, ' ').toUpperCase()}</h1><p>${txt.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br/>')}</p></body></html>`;
  fs.writeFileSync(path.join(outDir, f + '.doc'), docHtml, 'utf8');
  console.log(`Generated Word Document: ${f}.doc`);
}

