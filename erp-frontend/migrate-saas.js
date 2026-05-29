const fs = require('fs');
const path = require('path');

const targetDirs = [
  path.join(__dirname, 'app'),
  path.join(__dirname, 'components')
];

// Mapping of current styles to new SaaS palette styles
const replaceMap = [
  // 1. Text Colors
  // Currently text-[#0F172A] is used for titles and general text.
  // We can keep text-[#0F172A] for titles. But let's use tailwind classes.
  { regex: /text-\[\#0F172A\]/gi, replace: 'text-slate-900' },
  { regex: /text-\[\#334155\]/gi, replace: 'text-slate-700' },
  { regex: /text-\[\#475569\]/gi, replace: 'text-slate-600' },
  { regex: /text-\[\#64748B\]/gi, replace: 'text-slate-500' },
  
  // 2. Background Colors (Surfaces)
  { regex: /bg-\[\#F8FAFC\]/gi, replace: 'bg-slate-50' },
  { regex: /bg-\[\#FFFFFF\]/gi, replace: 'bg-white' },
  
  // 3. Borders
  { regex: /border-\[\#E2E8F0\]/gi, replace: 'border-slate-200' },
  { regex: /border-\[\#CBD5E1\]/gi, replace: 'border-slate-300' },
  
  // 4. Action Buttons (Currently some are bg-[#0F172A] and some are indigo-600, or bg-white text-black from legacy)
  { regex: /bg-\[\#0F172A\] text-white/gi, replace: 'bg-blue-600 text-white' }, // Convert dark slate buttons to Action Blue
  { regex: /bg-white text-black/gi, replace: 'bg-blue-600 text-white' }, // Convert legacy buttons to Action Blue
  { regex: /hover:bg-\[\#1e293b\]/gi, replace: 'hover:bg-blue-700' }, // Hover for action buttons
  { regex: /hover:bg-gray-200/gi, replace: 'hover:bg-blue-700' }, // Hover for legacy buttons
  { regex: /hover:bg-\[\#262626\]/gi, replace: 'hover:bg-slate-100' }, // Stray dark hover
  
  // Migrate Indigo to Blue (Action Color)
  { regex: /indigo-50/g, replace: 'blue-50' },
  { regex: /indigo-100/g, replace: 'blue-100' },
  { regex: /indigo-400/g, replace: 'blue-400' },
  { regex: /indigo-500/g, replace: 'blue-500' },
  { regex: /indigo-600/g, replace: 'blue-600' },
  { regex: /indigo-700/g, replace: 'blue-700' },
  { regex: /indigo-900/g, replace: 'blue-900' },
  
  // Primary brand Navy: #1E3A5F
  { regex: /bg-\[\#2563EB\]/gi, replace: 'bg-blue-600' }, // Standardize
];

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let originalContent = content;
      
      for (const { regex, replace } of replaceMap) {
        content = content.replace(regex, replace);
      }
      
      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

targetDirs.forEach(dir => processDirectory(dir));
console.log('SaaS Palette Migration complete!');
