const fs = require('fs');
const path = require('path');

const sidebarPath = path.join(__dirname, 'components', 'layout', 'Sidebar.tsx');
let sidebar = fs.readFileSync(sidebarPath, 'utf8');

// Replace the logo div
sidebar = sidebar.replace(
  /<div className="w-9 h-9 rounded-xl bg-\[#1E3A5F\] flex items-center justify-center flex-shrink-0 shadow-md">\s*<BarChart3 className="w-5 h-5 text-white" \/>\s*<\/div>/,
  '<div className="w-9 h-9 flex items-center justify-center flex-shrink-0">\n            <img src="/icon.svg" alt="Logo" className="w-full h-full object-contain" />\n          </div>'
);

sidebar = sidebar.replace(
  /BizERP India/g,
  'Bissness'
);

fs.writeFileSync(sidebarPath, sidebar, 'utf8');
console.log('Sidebar updated');
