const fs = require('fs');
const path = require('path');

function cleanEverything(filepath) {
  if (!fs.existsSync(filepath)) return;
  let content = fs.readFileSync(filepath, 'utf8');

  // remove the standalone import invoicesApi from line 2
  content = content.replace(/import \{ invoicesApi \} from '(.*?)';\n/g, "");

  // make sure invoicesApi is only in the main api import
  // it was already added by clean_imports.js to the main import, so we just remove the standalone ones

  fs.writeFileSync(filepath, content, 'utf8');
}

cleanEverything(path.join(__dirname, 'app', 'dashboard', 'quotations', 'new', 'page.tsx'));
cleanEverything(path.join(__dirname, 'app', 'dashboard', 'quotations', '[id]', 'edit', 'page.tsx'));

const apiPath = path.join(__dirname, 'lib', 'erp-api.ts');
let apiContent = fs.readFileSync(apiPath, 'utf8');
if (!apiContent.includes('summary: (params?: any) => api.get(\'/quotations/summary\'')) {
  apiContent = apiContent.replace(
    /export const quotationsApi = \{/,
    "export const quotationsApi = {\n  summary: (params?: any) => api.get('/quotations/summary', { params }).then(res => res.data),"
  );
  fs.writeFileSync(apiPath, apiContent, 'utf8');
}

console.log('Final TS fix complete');
