const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
  });
}

function replaceColors(filepath) {
  if (!filepath.endsWith('.tsx') && !filepath.endsWith('.ts')) return;
  let content = fs.readFileSync(filepath, 'utf8');
  let original = content;

  // Blue mapping to Action
  content = content.replace(/bg-blue-50/g, 'bg-action-50');
  content = content.replace(/bg-blue-100/g, 'bg-action-100');
  content = content.replace(/bg-blue-200/g, 'bg-action-200');
  content = content.replace(/bg-blue-500/g, 'bg-action-400');
  content = content.replace(/bg-blue-600/g, 'bg-action-500');
  content = content.replace(/bg-blue-700/g, 'bg-action-600');
  content = content.replace(/bg-blue-800/g, 'bg-action-700');
  content = content.replace(/bg-blue-900/g, 'bg-action-800');

  content = content.replace(/text-blue-50/g, 'text-action-50');
  content = content.replace(/text-blue-500/g, 'text-action-400');
  content = content.replace(/text-blue-600/g, 'text-action-500');
  content = content.replace(/text-blue-700/g, 'text-action-600');

  content = content.replace(/border-blue-500/g, 'border-action-400');
  content = content.replace(/border-blue-600/g, 'border-action-500');

  content = content.replace(/ring-blue-500/g, 'ring-action-400');
  content = content.replace(/ring-blue-600/g, 'ring-action-500');

  // Slate mapping to Brand
  // content = content.replace(/bg-slate-900/g, 'bg-sidebar');
  // content = content.replace(/bg-slate-800/g, 'bg-brand-800');
  // ... let's not touch slate globally because it's used for standard text, but let's change specific semantic colors

  if (content !== original) {
    fs.writeFileSync(filepath, content, 'utf8');
  }
}

walkDir(path.join(__dirname, 'app'), replaceColors);
walkDir(path.join(__dirname, 'components'), replaceColors);

console.log('Global color replacements complete.');
