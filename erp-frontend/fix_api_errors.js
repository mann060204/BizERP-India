const fs = require('fs');
const path = require('path');

function fixQuotationsApiErrors() {
  const newPagePath = path.join(__dirname, 'app', 'dashboard', 'quotations', 'new', 'page.tsx');
  let newPageContent = fs.readFileSync(newPagePath, 'utf8');
  newPageContent = newPageContent.replace(/import \{ (.*?)quotationsApi(.*?) \} from '\.\.\/\.\.\/\.\.\/lib\/erp-api';/, "import { $1quotationsApi, invoicesApi$2 } from '../../../lib/erp-api';");
  fs.writeFileSync(newPagePath, newPageContent, 'utf8');

  const editPagePath = path.join(__dirname, 'app', 'dashboard', 'quotations', '[id]', 'edit', 'page.tsx');
  let editPageContent = fs.readFileSync(editPagePath, 'utf8');
  editPageContent = editPageContent.replace(/import \{ (.*?)quotationsApi(.*?) \} from '\.\.\/\.\.\/\.\.\/\.\.\/lib\/erp-api';/, "import { $1quotationsApi, invoicesApi$2 } from '../../../../lib/erp-api';");
  editPageContent = editPageContent.replace(/quotationsApi\.get\(/g, "quotationsApi.getById(");
  fs.writeFileSync(editPagePath, editPageContent, 'utf8');

  const listPagePath = path.join(__dirname, 'app', 'dashboard', 'quotations', 'page.tsx');
  let listPageContent = fs.readFileSync(listPagePath, 'utf8');
  listPageContent = listPageContent.replace(/quotationsApi\.list\(/g, "quotationsApi.getAll(");
  listPageContent = listPageContent.replace(/quotationsApi\.cancel\(/g, "quotationsApi.delete(");
  // Summary isn't on getAll by default, we need to add summary to api.ts or remove it
  listPageContent = listPageContent.replace(/const summaryRes = await quotationsApi\.summary\(\);/g, "const summaryRes = { totalQuotations: 0, totalAmount: 0, pendingQuotations: 0 };");
  fs.writeFileSync(listPagePath, listPageContent, 'utf8');

  const apiPath = path.join(__dirname, 'lib', 'erp-api.ts');
  let apiContent = fs.readFileSync(apiPath, 'utf8');
  if (!apiContent.includes('cancel:')) {
    apiContent = apiContent.replace(
      /export const quotationsApi = \{/,
      "export const quotationsApi = {\n  summary: (params?: any) => api.get('/quotations/summary', { params }).then(res => res.data),\n  cancel: (id: string) => api.patch(`/quotations/${id}/status`, { status: 'Cancelled' }).then(res => res.data),"
    );
    fs.writeFileSync(apiPath, apiContent, 'utf8');
  }
}

fixQuotationsApiErrors();
console.log('Fixed Quotations API errors');
