const fs = require('fs');
const path = require('path');

const filepath = path.join(__dirname, 'src', 'services', 'gst.service.ts');
let content = fs.readFileSync(filepath, 'utf8');

content = content.replace(
  /export const calculateInvoiceTotals = \(\n  items: LineItemInput\[\],\n  isInterState: boolean\n\): InvoiceTotals => \{/g,
  `export const calculateInvoiceTotals = (
  items: LineItemInput[],
  isInterState: boolean,
  isNonGst: boolean = false
): InvoiceTotals => {`
);

content = content.replace(
  /if \(isInterState\) \{/g,
  `if (isNonGst) {
      cgst = 0;
      sgst = 0;
      igst = 0;
    } else if (isInterState) {`
);

fs.writeFileSync(filepath, content, 'utf8');
console.log('gst.service.ts updated');
