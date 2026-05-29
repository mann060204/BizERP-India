const fs = require('fs');
const path = require('path');

const sidebarPath = path.join(__dirname, 'components', 'layout', 'Sidebar.tsx');
let sidebar = fs.readFileSync(sidebarPath, 'utf8');

sidebar = sidebar.replace(/bg-slate-900/g, 'bg-sidebar');
sidebar = sidebar.replace(/bg-gray-900/g, 'bg-sidebar');
sidebar = sidebar.replace(/bg-blue-600/g, 'bg-action-500');
sidebar = sidebar.replace(/text-blue-400/g, 'text-action-400');
sidebar = sidebar.replace(/text-blue-500/g, 'text-action-500');
sidebar = sidebar.replace(/bg-blue-900\/50/g, 'bg-sidebar-active');
sidebar = sidebar.replace(/bg-slate-800/g, 'bg-sidebar-active');
// Find where it highlights active route, probably something like bg-slate-800 or text-white
sidebar = sidebar.replace(/bg-slate-800/g, 'bg-sidebar-active');

fs.writeFileSync(sidebarPath, sidebar, 'utf8');
console.log('Sidebar patched.');

const topbarPath = path.join(__dirname, 'components', 'layout', 'Topbar.tsx');
if (fs.existsSync(topbarPath)) {
  let topbar = fs.readFileSync(topbarPath, 'utf8');
  topbar = topbar.replace(/text-blue-600/g, 'text-action-500');
  topbar = topbar.replace(/bg-blue-600/g, 'bg-action-500');
  topbar = topbar.replace(/bg-blue-50/g, 'bg-action-50');
  fs.writeFileSync(topbarPath, topbar, 'utf8');
  console.log('Topbar patched.');
}

const globalsPath = path.join(__dirname, 'app', 'globals.css');
if (fs.existsSync(globalsPath)) {
  let globals = fs.readFileSync(globalsPath, 'utf8');
  // Just in case we need to update root variables
  // Actually Tailwind config takes care of it.
  fs.writeFileSync(globalsPath, globals, 'utf8');
  console.log('globals patched.');
}
