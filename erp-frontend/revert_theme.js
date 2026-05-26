const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts') || fullPath.endsWith('.css')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let original = content;
      
      // Normalize hover:dark: to dark:hover:
      content = content.replace(/hover:dark:/g, 'dark:hover:');
      
      // Replace `dark:className somethingElse` with `className`
      content = content.replace(/dark:([^\s"']+)\s+[^\s"']+/g, '$1');
      
      // If there are any stray `dark:className` left, just strip `dark:`
      content = content.replace(/dark:([^\s"']+)/g, '$1');
      
      if (content !== original) {
        fs.writeFileSync(fullPath, content);
      }
    }
  }
}

processDir('d:/ERP WEBSITE/erp-frontend/app');
processDir('d:/ERP WEBSITE/erp-frontend/components');
console.log('Done');
