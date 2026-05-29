const fs = require('fs');
const path = require('path');

function fixQuotationNewEdit(filepath) {
  if (!fs.existsSync(filepath)) return;
  let content = fs.readFileSync(filepath, 'utf8');

  // We need to just define the missing variables at the top of the component so the JSX doesn't crash, 
  // OR we remove the JSX. The easiest is to remove the JSX that references them.
  // The JSX starts at `PAYMENT 1` or `<select value={paymentMode1}`.
  
  // Let's just remove the whole `<div className="grid grid-cols-2 gap-4 flex-1">` block that contains the payment fields.
  content = content.replace(/<div className="grid grid-cols-2 gap-4 flex-1">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/, '</div></div>');

  // Or maybe define dummy variables just to satisfy TypeScript if they are used elsewhere in save payload (though I removed them from payload).
  content = content.replace(/quotationsApi\.getLastPrice/g, 'invoicesApi.getLastPrice');

  fs.writeFileSync(filepath, content, 'utf8');
}

fixQuotationNewEdit(path.join(__dirname, 'app', 'dashboard', 'quotations', 'new', 'page.tsx'));
fixQuotationNewEdit(path.join(__dirname, 'app', 'dashboard', 'quotations', '[id]', 'edit', 'page.tsx'));

const apiPath = path.join(__dirname, 'lib', 'erp-api.ts');
if (fs.existsSync(apiPath)) {
  let apiContent = fs.readFileSync(apiPath, 'utf8');
  // Add missing methods to quotationsApi
  if (!apiContent.includes('getLastPrice:')) {
    apiContent = apiContent.replace(
      /export const quotationsApi = \{/,
      "export const quotationsApi = {\n  list: (params?: any) => api.get('/quotations', { params }).then(res => res.data),\n  summary: (params?: any) => api.get('/quotations/summary', { params }).then(res => res.data),\n  cancel: (id: string) => api.patch(`/quotations/${id}/status`, { status: 'Cancelled' }).then(res => res.data),\n  getLastPrice: (customerId: string, itemId: string) => api.get(`/invoices/last-price/${customerId}/${itemId}`).then(res => res.data),"
    );
    fs.writeFileSync(apiPath, apiContent, 'utf8');
  }
}

console.log('Fixed typescript errors.');
