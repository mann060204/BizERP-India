const fs = require('fs');
const path = require('path');

function cleanImports(filepath, level) {
  if (!fs.existsSync(filepath)) return;
  let content = fs.readFileSync(filepath, 'utf8');

  // remove the bad ones
  content = content.replace(/import \{ invoicesApi \} from '\.\.\/\.\.\/\.\.\/\.\.\/lib\/erp-api';\n/g, "");
  content = content.replace(/import \{ invoicesApi \} from '\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/lib\/erp-api';\n/g, "");

  // add invoicesApi to the main import
  if (!content.includes(', invoicesApi } from') && !content.includes('invoicesApi, ') && content.includes('quotationsApi')) {
    content = content.replace(/import \{ (.*?)quotationsApi(.*?) \} from '(.*?)';/, "import { $1quotationsApi$2, invoicesApi } from '$3';");
  }

  fs.writeFileSync(filepath, content, 'utf8');
}

cleanImports(path.join(__dirname, 'app', 'dashboard', 'quotations', 'new', 'page.tsx'), 4);
cleanImports(path.join(__dirname, 'app', 'dashboard', 'quotations', '[id]', 'edit', 'page.tsx'), 5);

console.log('Cleaned imports.');
