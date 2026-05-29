const fs = require('fs');
const path = require('path');

const filepath = path.join(__dirname, 'lib', 'erp-api.ts');
let content = fs.readFileSync(filepath, 'utf8');

if (!content.includes('quotationsApi')) {
  const replacement = `export const quotationsApi = {
  getAll: (params?: any) => api.get('/quotations', { params }).then(res => res.data),
  getById: (id: string) => api.get(\`/quotations/\${id}\`).then(res => res.data),
  create: (data: any) => api.post('/quotations', data).then(res => res.data),
  update: (id: string, data: any) => api.put(\`/quotations/\${id}\`, data).then(res => res.data),
  delete: (id: string) => api.delete(\`/quotations/\${id}\`).then(res => res.data),
  getNextNumber: (type?: string) => api.get(\`/quotations/next-number\${type ? \`?type=\${type}\` : ''}\`).then(res => res.data),
  convertToInvoice: (id: string) => api.post(\`/quotations/\${id}/convert\`).then(res => res.data),
};

export const`;

  content = content.replace(/export const/g, replacement);
  // This will replace the FIRST 'export const', which is fine. Or wait, let's just append it.
  
  let actualContent = fs.readFileSync(filepath, 'utf8');
  actualContent += `\n\nexport const quotationsApi = {
  getAll: (params?: any) => api.get('/quotations', { params }).then(res => res.data),
  getById: (id: string) => api.get(\`/quotations/\${id}\`).then(res => res.data),
  create: (data: any) => api.post('/quotations', data).then(res => res.data),
  update: (id: string, data: any) => api.put(\`/quotations/\${id}\`, data).then(res => res.data),
  delete: (id: string) => api.delete(\`/quotations/\${id}\`).then(res => res.data),
  getNextNumber: (type?: string) => api.get(\`/quotations/next-number\${type ? \`?type=\${type}\` : ''}\`).then(res => res.data),
  convertToInvoice: (id: string) => api.post(\`/quotations/\${id}/convert\`).then(res => res.data),
};`;
  
  fs.writeFileSync(filepath, actualContent, 'utf8');
  console.log('erp-api.ts updated with quotationsApi');
}
