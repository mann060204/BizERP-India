const fs = require('fs');
const path = require('path');

function fixBustedVariables(filepath) {
  if (!fs.existsSync(filepath)) return;
  let content = fs.readFileSync(filepath, 'utf8');

  // Fix the useState destructuring
  content = content.replace(/const \[ setPaymentMode1\] = useState\(/g, "const [paymentMode1, setPaymentMode1] = useState(");
  content = content.replace(/const \[ setPaymentMode2\] = useState\(/g, "const [paymentMode2, setPaymentMode2] = useState(");
  content = content.replace(/const \[ setAmountReceived1\] = useState\(/g, "const [amountReceived1, setAmountReceived1] = useState(");
  content = content.replace(/const \[ setAmountReceived2\] = useState\(/g, "const [amountReceived2, setAmountReceived2] = useState(");
  content = content.replace(/const \[ setPaymentDate1\] = useState\(/g, "const [paymentDate1, setPaymentDate1] = useState(");
  content = content.replace(/const \[ setPaymentDate2\] = useState\(/g, "const [paymentDate2, setPaymentDate2] = useState(");
  content = content.replace(/const \[ setTxnId1\] = useState\(/g, "const [txnId1, setTxnId1] = useState(");
  content = content.replace(/const \[ setTxnId2\] = useState\(/g, "const [txnId2, setTxnId2] = useState(");
  
  // Add import invoicesApi if missing
  if (content.includes('invoicesApi') && !content.includes('invoicesApi,')) {
    content = content.replace(/import { (.*?)quotationsApi(.*?) } from '\.\.\/\.\.\/\.\.\/lib\/erp-api';/, "import { $1quotationsApi, invoicesApi$2 } from '../../../lib/erp-api';");
  }

  fs.writeFileSync(filepath, content, 'utf8');
}

fixBustedVariables(path.join(__dirname, 'app', 'dashboard', 'quotations', 'new', 'page.tsx'));
fixBustedVariables(path.join(__dirname, 'app', 'dashboard', 'quotations', '[id]', 'edit', 'page.tsx'));

const apiPath = path.join(__dirname, 'lib', 'erp-api.ts');
if (fs.existsSync(apiPath)) {
  let apiContent = fs.readFileSync(apiPath, 'utf8');
  if (!apiContent.includes('getLastPrice:')) {
    apiContent = apiContent.replace(
      /export const quotationsApi = \{/,
      "export const quotationsApi = {\n  list: (params?: any) => api.get('/quotations', { params }).then(res => res.data),\n  summary: (params?: any) => api.get('/quotations/summary', { params }).then(res => res.data),\n  cancel: (id: string) => api.patch(`/quotations/${id}/status`, { status: 'Cancelled' }).then(res => res.data),\n  getLastPrice: (customerId: string, itemId: string) => api.get(`/invoices/last-price/${customerId}/${itemId}`).then(res => res.data),"
    );
    fs.writeFileSync(apiPath, apiContent, 'utf8');
  }
}

console.log('Fixed broken useState variables and api.');
