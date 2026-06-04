const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(file);
    }
  });
  return results;
}

const formatStr = "new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format";

const files = walk('d:\\ERP WEBSITE\\erp-frontend\\app\\dashboard\\reports');

let changedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Replace `₹${Number(v||0).toFixed(2)}` and `₹${(v || 0).toFixed(2)}`
  content = content.replace(/`₹\$\{\s*(Number\([^)]+\)|\([^)]+\)|[a-zA-Z0-9_.]+(?:\|\|0)?)\.toFixed\(2\)\s*\}`/g, (match, p1) => {
    return `${formatStr}(${p1})`;
  });

  // Replace ₹{ ... .toFixed(2)}
  content = content.replace(/₹\{\s*(Number\([^)]+\)|[a-zA-Z0-9_.]+(?:\([^)]+\))?|[a-zA-Z0-9_.]+(?:\|\|0)?)\.toFixed\(2\)\s*\}/g, (match, p1) => {
    return `{${formatStr}(${p1})}`;
  });

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    changedCount++;
    console.log('Updated:', file);
  }
});

console.log('Total files updated:', changedCount);
