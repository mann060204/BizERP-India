const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir(path.join(__dirname, 'components'), (filepath) => {
  if (filepath.endsWith('.tsx') || filepath.endsWith('.ts') || filepath.endsWith('.js') || filepath.endsWith('.jsx')) {
    let content = fs.readFileSync(filepath, 'utf8');
    if (content.includes('/icon.svg')) {
      content = content.replace(/\/icon\.svg/g, '/logo.png');
      fs.writeFileSync(filepath, content, 'utf8');
    }
  }
});

walkDir(path.join(__dirname, 'app'), (filepath) => {
  if (filepath.endsWith('.tsx') || filepath.endsWith('.ts') || filepath.endsWith('.js') || filepath.endsWith('.jsx')) {
    let content = fs.readFileSync(filepath, 'utf8');
    if (content.includes('/icon.svg')) {
      content = content.replace(/\/icon\.svg/g, '/logo.png');
      fs.writeFileSync(filepath, content, 'utf8');
    }
  }
});

console.log('Replaced /icon.svg with /logo.png');
