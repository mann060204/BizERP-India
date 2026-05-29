const fs = require('fs');

function fixFile(file) {
  let lines = fs.readFileSync(file, 'utf8').split('\n');
  let newLines = [];
  let seenMainImport = false;
  for (let line of lines) {
    if (line.includes('import { invoicesApi } from') && !line.includes('quotationsApi')) {
      // standalone invoicesApi import, delete it
      continue;
    }
    newLines.push(line);
  }
  fs.writeFileSync(file, newLines.join('\n'), 'utf8');
}

fixFile('d:/ERP WEBSITE/erp-frontend/app/dashboard/quotations/new/page.tsx');
fixFile('d:/ERP WEBSITE/erp-frontend/app/dashboard/quotations/[id]/edit/page.tsx');
console.log('Done cleaning');
