const fs = require('fs');
const path = require('path');

const files = [
  'app/dashboard/suppliers/[id]/page.tsx',
  'app/dashboard/suppliers/new/page.tsx',
  'app/dashboard/customers/[id]/page.tsx',
  'app/dashboard/customers/new/page.tsx',
  'components/modals/QuickAddCustomerModal.tsx',
  'components/modals/QuickAddSupplierModal.tsx'
];

for (const relPath of files) {
  const file = path.join(__dirname, 'erp-frontend', relPath);
  let content = fs.readFileSync(file, 'utf8');
  
  // Find where I injected the second button WITHOUT a fragment
  // Note: the original replacement was:
  // <button onClick={capturePhoto} ...> ... </button>
  // <button onClick={() => startCamera ... > ... </button>
  // And it is inside {!cameraError && ( ... )}

  // Regex to wrap the two buttons in <> and </>
  const regex = /(\{!cameraError && \(\s*)(<button onClick=\{capturePhoto\}[\s\S]*?<\/button>\s*<button onClick=\{\(\) => startCamera[\s\S]*?<\/button>\s*)(\)\})/;
  
  if (regex.test(content)) {
    content = content.replace(regex, '$1<>\n$2</>\n$3');
    fs.writeFileSync(file, content);
    console.log('Fixed', relPath);
  }
}
