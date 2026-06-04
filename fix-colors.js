const fs = require('fs');
const path = require('path');

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (!fullPath.includes('node_modules') && !fullPath.includes('.next')) {
                processDir(fullPath);
            }
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let orig = content;
            
            // Fix dark background buttons
            content = content.replace(/bg-\[#1e3a8a\] hover:bg-action-600 text-slate-900/g, 'bg-[#1e3a8a] hover:bg-action-600 text-white');
            content = content.replace(/bg-\[#1e3a8a\] text-slate-900/g, 'bg-[#1e3a8a] text-white');
            
            // Fix badges (Sales & Purchases & Inventory)
            content = content.replace(/text-green-400 bg-green-400\/10/g, 'text-emerald-700 bg-emerald-50 border border-emerald-200');
            content = content.replace(/text-orange-400 bg-orange-400\/10/g, 'text-orange-700 bg-orange-50 border border-orange-200');
            content = content.replace(/text-yellow-400 bg-yellow-400\/10/g, 'text-yellow-700 bg-yellow-50 border border-yellow-200');
            content = content.replace(/text-slate-400 bg-slate-400\/10/g, 'text-slate-700 bg-slate-100 border border-slate-200');
            content = content.replace(/text-blue-400 bg-blue-400\/10/g, 'text-blue-700 bg-blue-50 border border-blue-200');
            content = content.replace(/text-red-400 bg-red-400\/10/g, 'text-red-700 bg-red-50 border border-red-200');
            
            if (content !== orig) {
                console.log('Fixed', fullPath);
                fs.writeFileSync(fullPath, content);
            }
        }
    }
}

processDir(path.join(__dirname, 'erp-frontend'));
console.log('Done');
