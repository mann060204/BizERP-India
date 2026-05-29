const fs = require('fs');
const path = require('path');

function patchQuotationFrontend(filepath) {
  if (!fs.existsSync(filepath)) return;
  let content = fs.readFileSync(filepath, 'utf8');

  // Change default quotationNumber
  content = content.replace(/useState\('GST-001'\)/g, "useState('EST-001')");
  content = content.replace(/useState\('NON-GST-001'\)/g, "useState('EST-001')");
  
  // Remove status: 'unpaid' from save object
  content = content.replace(/status: 'unpaid',/g, "status: 'Draft',");
  
  // Also we want to remove the UI for PAYMENT DETAILS. Let's just hide the UI for it.
  // The UI has: `<div className="erp-card mt-6 border border-brand-200">`... then `<div className="erp-card-title bg-brand-50 p-2 border-b border-brand-200 text-center font-bold text-xs uppercase text-brand-700">PAYMENT DETAILS</div>`
  
  // Let's remove the "Total Received" and "Balance" block
  // It's in the Subtotal block
  content = content.replace(/<div className="flex justify-between items-center text-sm font-bold text-emerald-600 mt-2">[\s\S]*?<\/div>/g, "");
  content = content.replace(/<div className="flex justify-between items-center text-sm font-bold text-rose-500 mt-2">[\s\S]*?<\/div>/g, "");
  
  // Remove "PAYMENT DETAILS" section. We can just use a regex if we know its shape, but it's tricky.
  // Let's replace the whole PAYMENT DETAILS section with nothing.
  const paymentDetailsRegex = /<div className="col-span-8">[\s\S]*?<div className="erp-card-title bg-action-50 p-2 border-b border-action-200 text-center font-bold text-xs uppercase text-action-700">PAYMENT DETAILS<\/div>[\s\S]*?<\/div>\s*<\/div>/;
  content = content.replace(paymentDetailsRegex, '<div className="col-span-8"></div>');

  // Wait, let's just make it easier by removing it in the AST or manually replacing the block.
  // We can just add `display: none` to the payment details container or strip out the properties from the payload.
  // The backend doesn't expect `paymentMode1`, etc. for quotations.
  // Actually, wait, `Quotation.model.ts` doesn't have these fields, but passing them in `...data` will either be ignored by Mongoose or throw a strict mode error. 
  // Let's just fix the payload:
  content = content.replace(/paymentMode1,/g, "");
  content = content.replace(/paymentMode2,/g, "");
  content = content.replace(/amountReceived1: Number\(amountReceived1\),/g, "");
  content = content.replace(/amountReceived2: Number\(amountReceived2\),/g, "");
  content = content.replace(/paymentDate1,/g, "");
  content = content.replace(/paymentDate2,/g, "");
  content = content.replace(/txnId1,/g, "");
  content = content.replace(/txnId2,/g, "");
  content = content.replace(/amountReceived1,/g, "");
  content = content.replace(/amountReceived2,/g, "");

  fs.writeFileSync(filepath, content, 'utf8');
}

patchQuotationFrontend(path.join(__dirname, 'app', 'dashboard', 'quotations', 'new', 'page.tsx'));
patchQuotationFrontend(path.join(__dirname, 'app', 'dashboard', 'quotations', '[id]', 'edit', 'page.tsx'));
console.log('Quotation frontend patched.');
