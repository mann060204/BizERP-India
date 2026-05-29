const fs = require('fs');
const files = ['d:/ERP WEBSITE/erp-frontend/app/dashboard/sales/new/page.tsx', 'd:/ERP WEBSITE/erp-frontend/app/dashboard/sales/[id]/edit/page.tsx'];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');

  // Interface Customer update
  content = content.replace(/openingBalance\?: number; \}/, 'openingBalance?: number; currentBalance?: number; }');

  // We will replace using string match instead of regex for simplicity
  const searchBg = "{`text-[9px] px-1.5 py-0.5 rounded font-bold border ${selectedCustomer.openingBalance > 0 ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30' : selectedCustomer.openingBalance < 0 ? 'bg-red-500/20 text-red-500 border-red-500/30' : 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30'}`}";
  const replaceBg = "{`text-[9px] px-1.5 py-0.5 rounded font-bold border ${((selectedCustomer.currentBalance !== undefined ? selectedCustomer.currentBalance : selectedCustomer.openingBalance) > 0) ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30' : ((selectedCustomer.currentBalance !== undefined ? selectedCustomer.currentBalance : selectedCustomer.openingBalance) < 0) ? 'bg-red-500/20 text-red-500 border-red-500/30' : 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30'}`}";
  
  content = content.replace(searchBg, replaceBg);

  const searchTxt = "A/C Bal: {selectedCustomer.openingBalance > 0 ? '₹' + selectedCustomer.openingBalance.toFixed(2) + ' Dr' : selectedCustomer.openingBalance < 0 ? '₹' + Math.abs(selectedCustomer.openingBalance).toFixed(2) + ' Cr' : '₹0.00'}";
  const replaceTxt = "A/C Bal: {((selectedCustomer.currentBalance !== undefined ? selectedCustomer.currentBalance : selectedCustomer.openingBalance) > 0) ? '₹' + (selectedCustomer.currentBalance !== undefined ? selectedCustomer.currentBalance : selectedCustomer.openingBalance).toFixed(2) + ' Dr' : ((selectedCustomer.currentBalance !== undefined ? selectedCustomer.currentBalance : selectedCustomer.openingBalance) < 0) ? '₹' + Math.abs((selectedCustomer.currentBalance !== undefined ? selectedCustomer.currentBalance : selectedCustomer.openingBalance)).toFixed(2) + ' Cr' : '₹0.00'}";

  content = content.replace(searchTxt, replaceTxt);

  fs.writeFileSync(file, content);
  console.log('Fixed', file);
}
