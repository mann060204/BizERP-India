const fs = require('fs');
const path = require('path');

function replaceImport(filepath) {
  if (!fs.existsSync(filepath)) return;
  let content = fs.readFileSync(filepath, 'utf8');
  if (content.includes('quotationsApi') && !content.includes('invoicesApi')) {
    content = content.replace(/import \{ customersApi, productsApi, quotationsApi \} from '(.*?)';/, "import { customersApi, productsApi, quotationsApi, invoicesApi } from '$1';");
  }
  fs.writeFileSync(filepath, content, 'utf8');
}

replaceImport(path.join(__dirname, 'app', 'dashboard', 'quotations', 'new', 'page.tsx'));
replaceImport(path.join(__dirname, 'app', 'dashboard', 'quotations', '[id]', 'edit', 'page.tsx'));

const apiPath = path.join(__dirname, 'lib', 'erp-api.ts');
let apiContent = fs.readFileSync(apiPath, 'utf8');
apiContent = apiContent.replace(
  /export const quotationsApi = \{/,
  "export const quotationsApi = {\n  getAll: (params?: any) => api.get('/quotations', { params }).then(res => res.data),\n  getById: (id: string) => api.get(`/quotations/${id}`).then(res => res.data),\n  summary: (params?: any) => api.get('/quotations/summary', { params }).then(res => res.data),\n  delete: (id: string) => api.patch(`/quotations/${id}/status`, { status: 'Cancelled' }).then(res => res.data),"
);
fs.writeFileSync(apiPath, apiContent, 'utf8');

console.log('Fixed API and imports');
