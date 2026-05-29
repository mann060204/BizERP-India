const fs = require('fs');
const path = require('path');

function addImport(filepath) {
  let content = fs.readFileSync(filepath, 'utf8');
  if (content.includes('invoicesApi') && !content.includes(' invoicesApi,')) {
    // just add it to the first line after use client
    content = content.replace(/'use client';/, "'use client';\nimport { invoicesApi } from '../../../../lib/erp-api';");
  }
  fs.writeFileSync(filepath, content, 'utf8');
}

addImport(path.join(__dirname, 'app', 'dashboard', 'quotations', 'new', 'page.tsx'));
addImport(path.join(__dirname, 'app', 'dashboard', 'quotations', '[id]', 'edit', 'page.tsx'));

const apiPath = path.join(__dirname, 'lib', 'erp-api.ts');
let apiContent = fs.readFileSync(apiPath, 'utf8');
// remove the duplicated block I accidentally added
apiContent = apiContent.replace(
  /export const quotationsApi = \{\n  getAll: \(params\?: any\) => api\.get\('\/quotations', \{ params \}\)\.then\(res => res\.data\),\n  getById: \(id: string\) => api\.get\(`\/quotations\/\$\{id\}`\)\.then\(res => res\.data\),\n  summary: \(params\?: any\) => api\.get\('\/quotations\/summary', \{ params \}\)\.then\(res => res\.data\),\n  delete: \(id: string\) => api\.patch\(`\/quotations\/\$\{id\}\/status`, \{ status: 'Cancelled' \}\)\.then\(res => res\.data\),/g,
  "export const quotationsApi = {"
);
fs.writeFileSync(apiPath, apiContent, 'utf8');

console.log('Fixed stupid imports and dupes');
