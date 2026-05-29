const fs = require('fs');
const path = require('path');

function replaceInFile(filepath, replacements) {
  if (!fs.existsSync(filepath)) return;
  let content = fs.readFileSync(filepath, 'utf8');
  for (const { from, to } of replacements) {
    content = content.replace(from, to);
  }
  fs.writeFileSync(filepath, content, 'utf8');
}

const dir = path.join(__dirname, 'app', 'dashboard', 'quotations');

const replacements = [
  { from: /\/api\/v1\/invoices/g, to: '/api/v1/quotations' },
  { from: /\/dashboard\/sales/g, to: '/dashboard/quotations' },
  { from: /invoiceNumber/g, to: 'quotationNumber' },
  { from: /invoiceDate/g, to: 'quotationDate' },
  { from: /invoiceType/g, to: 'quotationType' },
  { from: /nextInvoiceNumber/g, to: 'nextQuotationNumber' },
  { from: /Invoice/g, to: 'Quotation' },
  { from: /invoice/gi, to: 'quotation' },
  { from: /Invoices/g, to: 'Quotations' },
  { from: /Sales/g, to: 'Quotations' },
  { from: /sales/g, to: 'quotations' },
  // specific label fixes
  { from: /Quotation Date/g, to: 'Quotation Date' },
  { from: /Quotation Number/g, to: 'Quotation Number' }
];

// Re-capitalize correctly for the UI
const fixUiCasing = [
  { from: /quotation Type/g, to: 'Quotation Type' },
  { from: /quotation Date/g, to: 'Quotation Date' },
  { from: /quotation Number/g, to: 'Quotation Number' },
  { from: /new quotation/g, to: 'New Quotation' },
  { from: /New quotation/g, to: 'New Quotation' },
  { from: /update quotation/g, to: 'Update Quotation' },
  { from: /Update quotation/g, to: 'Update Quotation' }
];

const files = [
  path.join(dir, 'page.tsx'),
  path.join(dir, 'new', 'page.tsx'),
  path.join(dir, '[id]', 'page.tsx'),
  path.join(dir, '[id]', 'edit', 'page.tsx')
];

for (const file of files) {
  replaceInFile(file, replacements);
  replaceInFile(file, fixUiCasing);
}
console.log('Quotation frontend files patched.');
