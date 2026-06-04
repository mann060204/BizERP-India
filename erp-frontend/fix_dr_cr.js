const fs = require('fs');
const glob = require('glob');

const RED = 'bg-red-50 text-red-700 border-red-200';
const GREEN = 'bg-emerald-50 text-emerald-700 border-emerald-200';
const YELLOW = 'bg-yellow-50 text-yellow-700 border-yellow-200';

function run() {
  const files = glob.sync('d:/ERP WEBSITE/erp-frontend/app/dashboard/**/*.tsx');
  for (const f of files) {
    let text = fs.readFileSync(f, 'utf8');
    let changed = false;

    if (f.includes('purchases')) {
      // Supplier: bal > 0 is Cr (Green), bal < 0 is Dr (Red)
      const target = `bal > 0 ? '${GREEN}' : bal < 0 ? '${RED}' : '${YELLOW}'`;
      const regex1 = new RegExp(`bal > 0 \\? '${RED}' : bal < 0 \\? '${GREEN}' : '${YELLOW}'`, 'g');
      if (regex1.test(text)) {
        text = text.replace(regex1, target);
        changed = true;
      }
    } else {
      // Customer: bal > 0 is Dr (Red), bal < 0 is Cr (Green)
      const target = `bal > 0 ? '${RED}' : bal < 0 ? '${GREEN}' : '${YELLOW}'`;
      const regex2 = new RegExp(`bal > 0 \\? '${GREEN}' : bal < 0 \\? '${RED}' : '${YELLOW}'`, 'g');
      if (regex2.test(text)) {
        text = text.replace(regex2, target);
        changed = true;
      }
    }

    if (changed) {
      console.log('Fixed:', f);
      fs.writeFileSync(f, text);
    }
  }
}
run();
