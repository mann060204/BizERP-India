const fs = require('fs');
const path = require('path');

const qCtrlPath = path.join(__dirname, 'src', 'controllers', 'quotation.controller.ts');
let qCtrl = fs.readFileSync(qCtrlPath, 'utf8');

// Ensure createdBy is set during createQuotation
qCtrl = qCtrl.replace(
  /const quotation = new Quotation\(\{ \.\.\.data, businessId \}\);/g,
  "const quotation = new Quotation({ ...data, businessId, createdBy: (req as any).user._id });"
);

// If status is passed incorrectly by frontend, we can sanitize it.
// Replace any invalid status with 'Draft' by default.
// Wait, 'unpaid' comes from frontend. I should just fix it in frontend.

// Also, the invoice creation inside convertToInvoice should set createdBy
qCtrl = qCtrl.replace(
  /const invoice = new Invoice\(invoiceData\);/g,
  "invoiceData.createdBy = (req as any).user._id;\n    const invoice = new Invoice(invoiceData);"
);

fs.writeFileSync(qCtrlPath, qCtrl, 'utf8');
console.log('quotation.controller.ts updated for createdBy');
