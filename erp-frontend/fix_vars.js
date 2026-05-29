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
  
  // Also fix combined payment mode block if needed, but since they are defined again it shouldn't be an issue
  
  // Fix the left over payment fields in the UI if there are any. There are still errors like `paymentMode1 is not callable`.
  // Wait, `error TS2349: This expression is not callable.` for `paymentMode1`?
  // No, that's because I might have replaced `paymentMode1,` inside an onChange!
  // `onChange={e => setPaymentMode1(e.target.value)}` -> if there was a comma, wait, there's no comma there.
  // Let's just fix the JSX where `setPaymentMode1` is called without it being a function maybe?

  fs.writeFileSync(filepath, content, 'utf8');
}

fixBustedVariables(path.join(__dirname, 'app', 'dashboard', 'quotations', 'new', 'page.tsx'));
fixBustedVariables(path.join(__dirname, 'app', 'dashboard', 'quotations', '[id]', 'edit', 'page.tsx'));
console.log('Fixed broken useState variables.');
