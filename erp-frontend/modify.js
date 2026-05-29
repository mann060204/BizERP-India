const fs = require('fs');

const files = [
  'app/dashboard/sales/new/page.tsx',
  'app/dashboard/sales/[id]/edit/page.tsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');

  // Replace Totals logic
  const newTotals = `  const shippingCGST = (invoiceType === 'GST' && !isInterState) ? round2(shippingCharge * 0.09) : 0;
  const shippingSGST = (invoiceType === 'GST' && !isInterState) ? round2(shippingCharge * 0.09) : 0;
  const shippingIGST = (invoiceType === 'GST' && isInterState) ? round2(shippingCharge * 0.18) : 0;

  const totalCGST = lineItems.reduce((s, i) => s + i.cgst, 0) + shippingCGST;
  const totalSGST = lineItems.reduce((s, i) => s + i.sgst, 0) + shippingSGST;
  const totalIGST = lineItems.reduce((s, i) => s + i.igst, 0) + shippingIGST;
  
  const preRoundTotal = totalTaxable + totalCGST + totalSGST + totalIGST + shippingCharge;
  const grandTotal = Math.round(preRoundTotal);
  const roundOff = round2(grandTotal - preRoundTotal);
  const balance = round2(grandTotal - totalAmountReceived);`;
  
  content = content.replace(/  const totalCGST = lineItems\.reduce\(\(s, i\) => s \+ i\.cgst, 0\);\s+const totalSGST = lineItems\.reduce\(\(s, i\) => s \+ i\.sgst, 0\);\s+const totalIGST = lineItems\.reduce\(\(s, i\) => s \+ i\.igst, 0\);\s+const grandTotal = round2\(totalTaxable \+ totalCGST \+ totalSGST \+ totalIGST \+ shippingCharge\);\s+const balance = round2\(grandTotal - totalAmountReceived\);/, newTotals);

  // Replace Payload
  content = content.replace(/shippingCharge,\s+subtotal,/, "shippingCharge,\n          roundOff,\n          subtotal,");

  // Replace UI
  const newUI = `<div className="mt-4 pt-3 border-t-2 border-[#262626] space-y-1 bg-[#0A0A0A] -mx-2 -mb-2 p-3 rounded-b-lg">
                 {roundOff !== 0 && (
                   <div className="flex justify-between text-xs font-medium text-[#94a3b8] mb-1">
                     <span>Round Off</span>
                     <span>{roundOff > 0 ? '+' : ''}{roundOff.toFixed(2)}</span>
                   </div>
                 )}
                 <div className="flex justify-between items-end">
                    <span className="text-sm font-bold text-yellow-400">GRAND TOTAL</span>`;
  
  content = content.replace(/<div className="mt-4 pt-3 border-t-2 border-\[#262626\] space-y-1 bg-\[#0A0A0A\] -mx-2 -mb-2 p-3 rounded-b-lg">\s*<div className="flex justify-between items-end">\s*<span className="text-sm font-bold text-yellow-400">GRAND TOTAL<\/span>/, newUI);

  fs.writeFileSync(file, content);
});
console.log('Done modifying files.');
