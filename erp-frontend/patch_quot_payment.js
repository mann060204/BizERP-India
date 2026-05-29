const fs = require('fs');
const path = require('path');

function removePaymentDetails(filepath) {
  if (!fs.existsSync(filepath)) return;
  let content = fs.readFileSync(filepath, 'utf8');

  // Replace the PAYMENT DETAILS section with just Remarks
  content = content.replace(
    /\{\/\* Column 2 & 3: Payment Details & Remarks \*\/\}[\s\S]*?<div className="space-y-1 mt-2">/g,
    `{/* Column 2 & 3: Remarks */}
             <div className="erp-footer-box space-y-2 col-span-2 flex flex-col">
                <div className="space-y-1 mt-2">`
  );

  // Remove "Total Received" and "Balance" if they still exist
  content = content.replace(
    /<div className="flex justify-between items-center text-\[10px\] font-bold text-emerald-400 mt-2 pb-1 border-b border-slate-100">[\s\S]*?<\/div>/g,
    ""
  );
  content = content.replace(
    /<div className="flex justify-between items-center text-\[10px\] font-bold text-rose-400 mt-1 pb-1">[\s\S]*?<\/div>/g,
    ""
  );

  // Remove the Total Received line that has `amountReceived1 + amountReceived2`
  content = content.replace(/const totalAmountReceived = amountReceived1 \+ amountReceived2;/g, "const totalAmountReceived = 0;");
  content = content.replace(/const balance = totals.grandTotal - totalAmountReceived;/g, "const balance = totals.grandTotal;");

  fs.writeFileSync(filepath, content, 'utf8');
}

removePaymentDetails(path.join(__dirname, 'app', 'dashboard', 'quotations', 'new', 'page.tsx'));
removePaymentDetails(path.join(__dirname, 'app', 'dashboard', 'quotations', '[id]', 'edit', 'page.tsx'));
console.log('Payment UI removed.');
