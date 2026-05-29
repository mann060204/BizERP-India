const fs = require('fs');
const path = require('path');

function replaceBranding(filepath) {
  if (!fs.existsSync(filepath)) return;
  let content = fs.readFileSync(filepath, 'utf8');

  // Replace BizERP India with Bissness
  content = content.replace(/BizERP India/g, 'Bissness');
  content = content.replace(/BizERP/g, 'Bissness');

  // Replace <BarChart3> logo with the logo.png
  content = content.replace(
    /<div className="w-10 h-10 rounded-xl gradient-accent flex items-center justify-center">\s*<BarChart3 className="w-6 h-6 text-slate-900" \/>\s*<\/div>/g,
    '<div className="w-12 h-12 flex items-center justify-center">\n                <img src="/logo.png" alt="Bissness Logo" className="w-full h-full object-contain drop-shadow-md" />\n              </div>'
  );
  
  content = content.replace(
    /<div className="w-8 h-8 rounded-lg gradient-accent flex items-center justify-center">\s*<BarChart3 className="w-5 h-5 text-slate-900" \/>\s*<\/div>/g,
    '<div className="w-10 h-10 flex items-center justify-center">\n                <img src="/logo.png" alt="Bissness Logo" className="w-full h-full object-contain drop-shadow-md" />\n              </div>'
  );

  fs.writeFileSync(filepath, content, 'utf8');
}

replaceBranding(path.join(__dirname, 'app', 'login', 'page.tsx'));
replaceBranding(path.join(__dirname, 'app', 'register', 'page.tsx'));
console.log('Login/Register branding updated');
