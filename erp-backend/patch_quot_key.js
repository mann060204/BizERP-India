const fs = require('fs');
const path = require('path');

const qCtrlPath = path.join(__dirname, 'src', 'controllers', 'quotation.controller.ts');
let qCtrl = fs.readFileSync(qCtrlPath, 'utf8');

// Fix nextQuotationNumber response key
qCtrl = qCtrl.replace(
  /res\.json\(\{ nextInvoiceNumber: nextNumber \}\);/g,
  "res.json({ nextQuotationNumber: nextNumber });"
);

fs.writeFileSync(qCtrlPath, qCtrl, 'utf8');
console.log('quotation.controller.ts updated for nextQuotationNumber key');
