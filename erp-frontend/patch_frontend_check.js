const fs = require('fs');
const path = require('path');

function fixFrontend(filepath) {
  if (!fs.existsSync(filepath)) return;
  let content = fs.readFileSync(filepath, 'utf8');

  // Fix line item cgst/sgst/igst/cess
  content = content.replace(
    /const cgst = \(invType === 'GST' && !interState\) \? round2\(\(taxableAmount \* item\.gstRate\) \/ 2 \/ 100\) : 0;/g,
    "const cgst = (invType === 'GST' && !interState) ? round2((taxableAmount * item.gstRate) / 2 / 100) : 0;"
  ); // this is already fine on frontend because of `invType === 'GST'`! Wait...
  
  // Wait, let's look at the frontend file again.
  // The frontend calculateItem already checks invType === 'GST'!
  // Why was it charging GST in the backend?
  // Because when the form submits, the backend receives the line items, but then backend RECALCULATES the totals using `calculateInvoiceTotals` and overwrites whatever the frontend sent.
  // And `calculateInvoiceTotals` didn't know about `invType === 'GST'`, so it calculated GST for non-gst invoices!
  // And when it's saved, the DB has the GST applied. 
  // Then when we view it in print or edit, it fetches from DB and shows GST.
  // The frontend was right all along! 
  
  // Is there any other place where frontend calculates it wrongly?
  // Let's check shipping taxes in frontend just in case.
  content = content.replace(
    /const shippingCGST = \(invoiceType === 'GST' && !isInterState\) \? round2\(shippingCharge \* 0\.09\) : 0;/g,
    "const shippingCGST = (invoiceType === 'GST' && !isInterState) ? round2(shippingCharge * 0.09) : 0;"
  );
  // It also correctly checks `invoiceType === 'GST'`!

  // Let's just make sure.
}

console.log('Backend was the culprit. Frontend already checks invoiceType === GST');
