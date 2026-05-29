const fs = require('fs');
const path = require('path');

const filepath = path.join(__dirname, 'app', 'dashboard', 'quotations', '[id]', 'edit', 'page.tsx');
let content = fs.readFileSync(filepath, 'utf8');

// Add convert function
const convertFunc = `
  const handleConvertToInvoice = async () => {
    if (!window.confirm('Are you sure you want to convert this quotation to an invoice?')) return;
    setSaving(true);
    try {
      const res = await fetch(\`/api/v1/quotations/\${id}/convert\`, {
        method: 'POST',
        headers: {
          'Authorization': \`Bearer \${localStorage.getItem('erp_token')}\`
        }
      });
      if (!res.ok) throw new Error('Failed to convert');
      const data = await res.json();
      toast.success('Successfully converted to Invoice!');
      router.push(\`/dashboard/sales/\${data._id}/edit\`);
    } catch (e: any) {
      toast.error(e.message || 'Error converting');
    } finally {
      setSaving(false);
    }
  };
`;

if (!content.includes('handleConvertToInvoice')) {
  content = content.replace(/const handleSave =/g, convertFunc + '\n  const handleSave =');
}

// Add the button
const buttonHtml = `
            <button onClick={handleConvertToInvoice} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded flex items-center gap-2 text-xs font-bold transition">
              <CheckCircle className="w-4 h-4" /> Convert to Invoice
            </button>
            <button onClick={() => handleSave(true)}
`;

content = content.replace(/<button onClick=\{\(\) => handleSave\(true\)\}/g, buttonHtml);

// Fix status to be uppercase inside handleSave since Quotation model uses 'Draft', 'Sent', etc.
// Actually, let's keep status 'Draft' or 'Invoiced'. The UI might have saved it as lowercase initially.
content = content.replace(/status: \(totalAmountReceived >= preRoundTotal \|\| totalAmountReceived >= grandTotal\) \? 'paid' : totalAmountReceived > 0 \? 'partial' : 'unpaid',/g, "status: 'Draft',");

fs.writeFileSync(filepath, content, 'utf8');
console.log('Quotation edit page updated with convert button');
