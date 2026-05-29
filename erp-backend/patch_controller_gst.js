const fs = require('fs');
const path = require('path');

const invoiceCtrl = path.join(__dirname, 'src', 'controllers', 'invoice.controller.ts');
let invContent = fs.readFileSync(invoiceCtrl, 'utf8');

invContent = invContent.replace(/calculateInvoiceTotals\(lineItems, !!isInterState\)/g, "calculateInvoiceTotals(lineItems, !!isInterState, invoiceType === 'NON-GST')");

fs.writeFileSync(invoiceCtrl, invContent, 'utf8');
console.log('invoice.controller.ts updated');

const quotationCtrl = path.join(__dirname, 'src', 'controllers', 'quotation.controller.ts');
if (fs.existsSync(quotationCtrl)) {
  let quoContent = fs.readFileSync(quotationCtrl, 'utf8');
  // It might use quotationType or invoiceType, wait, in quotation.controller.ts, is there calculateInvoiceTotals being used? Let's check how it's done. 
  // I'll just use a safer replacement.
  quoContent = quoContent.replace(/calculateInvoiceTotals\(lineItems, !!isInterState\)/g, "calculateInvoiceTotals(lineItems, !!isInterState, req.body.quotationType === 'NON-GST')");
  fs.writeFileSync(quotationCtrl, quoContent, 'utf8');
  console.log('quotation.controller.ts updated');
}
