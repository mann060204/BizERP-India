const fs = require('fs');
const path = require('path');

const colorMap = {
  // Backgrounds
  'bg-black': 'bg-[#F8FAFC]',
  'bg-\\[#000000\\]': 'bg-[#F8FAFC]',
  'bg-\\[#050505\\]': 'bg-[#F1F5F9]',
  'bg-\\[#0A0A0A\\]': 'bg-white',
  'bg-\\[#111111\\]': 'bg-[#F1F5F9]',
  'bg-\\[#1A1A1A\\]': 'bg-[#E2E8F0]',
  
  // Hover Backgrounds
  'hover:bg-\\[#1A1A1A\\]': 'hover:bg-[#E2E8F0]',
  'hover:bg-\\[#111111\\]': 'hover:bg-[#F1F5F9]',
  'hover:bg-black': 'hover:bg-[#F8FAFC]',

  // Borders
  'border-\\[#1A1A1A\\]': 'border-[#E2E8F0]',
  'border-\\[#262626\\]': 'border-[#CBD5E1]',
  'border-\\[#333333\\]': 'border-[#94A3B8]',

  // Text Colors
  'text-white': 'text-[#0F172A]',
  'text-\\[#D4D4D4\\]': 'text-[#334155]',
  'text-\\[#94a3b8\\]': 'text-[#64748B]',
  'text-\\[#64748b\\]': 'text-[#475569]',
  
  // Hover Text
  'hover:text-white': 'hover:text-[#0F172A]',
};

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

function processFile(filePath) {
  if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;

  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  for (const [darkClass, lightClass] of Object.entries(colorMap)) {
    // Use i flag for case-insensitivity on hex codes
    const regex = new RegExp(`(?<=\\s|"|'|\`)${darkClass}(?=\\s|"|'|\`)`, 'gi');
    content = content.replace(regex, lightClass);
  }

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

const targetDirs = [
  path.join(__dirname, 'app'),
  path.join(__dirname, 'components'),
  path.join(__dirname, 'lib')
];

targetDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    walkDir(dir, processFile);
  }
});

console.log('Migration complete!');
