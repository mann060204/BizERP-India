const fs = require('fs');
const path = require('path');

function hidePaymentDetails(filepath) {
  if (!fs.existsSync(filepath)) return;
  let content = fs.readFileSync(filepath, 'utf8');

  // Hide the title
  content = content.replace(
    /<div className="bg-\[#F1F5F9\] p-1 text-\[10px\] font-bold text-center border border-slate-200">PAYMENT\s+DETAILS<\/div>/g,
    '<div className="hidden bg-[#F1F5F9] p-1 text-[10px] font-bold text-center border border-slate-200">PAYMENT DETAILS</div>'
  );
  
  // Hide the grid containing inputs
  content = content.replace(
    /<div className="grid grid-cols-2 gap-4 flex-1">/g,
    '<div className="hidden grid grid-cols-2 gap-4 flex-1">'
  );

  // We should also remove them from the save payload so we don't send validation errors to backend.
  // We'll replace the variables in the payload creation.
  content = content.replace(/paymentMode1,/g, "");
  content = content.replace(/paymentMode2,/g, "");
  content = content.replace(/amountReceived1,/g, "");
  content = content.replace(/amountReceived2,/g, "");
  content = content.replace(/paymentDate1,/g, "");
  content = content.replace(/paymentDate2,/g, "");
  content = content.replace(/txnId1,/g, "");
  content = content.replace(/txnId2,/g, "");

  // Make sure to replace getLastPrice with invoicesApi if needed
  content = content.replace(/quotationsApi\.getLastPrice/g, "invoicesApi.getLastPrice");
  
  fs.writeFileSync(filepath, content, 'utf8');
}

hidePaymentDetails(path.join(__dirname, 'app', 'dashboard', 'quotations', 'new', 'page.tsx'));
hidePaymentDetails(path.join(__dirname, 'app', 'dashboard', 'quotations', '[id]', 'edit', 'page.tsx'));

console.log('Payment details hidden and payload cleaned.');
