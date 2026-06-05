const fs = require('fs');
const file = 'd:/ERP WEBSITE/erp-frontend/app/dashboard/suppliers/[id]/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Fix 1: res.data.purchaseBills -> res.data.purchases
content = content.replace(/res\.data\.purchaseBills\.filter/g, 'res.data.purchases.filter');

// Fix 2: Payment History condition
content = content.replace(/txn\.referenceType === 'Payment' && txn\.credit > 0/g, "txn.referenceType === 'Payment' && txn.debit > 0");

// Fix 3: Display Amount
content = content.replace(/txn\.credit\?\.toFixed/g, 'txn.debit?.toFixed');

fs.writeFileSync(file, content);
console.log('Fixed supplier page');
