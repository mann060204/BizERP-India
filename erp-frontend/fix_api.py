with open('d:/ERP WEBSITE/erp-frontend/lib/erp-api.ts', 'r', encoding='utf-8') as f:
    c = f.read()
    
c = c.replace("createReverse: (data: any) => api.post('/manufacturing/reverse', data),", "createReverse: (data: any) => api.post('/manufacturing/reverse', data),\n  getPlan: (data: any) => api.post('/manufacturing/plan', data),")

with open('d:/ERP WEBSITE/erp-frontend/lib/erp-api.ts', 'w', encoding='utf-8') as f:
    f.write(c)
