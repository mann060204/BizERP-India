import re

def fix_erp_api_robust():
    filepath = 'd:/ERP WEBSITE/erp-frontend/lib/erp-api.ts'
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find where delete ends for customersApi and inject
    content = re.sub(
        r"(delete: \(id: string\) => api\.delete\(`/customers/\$\{id\}`\),)",
        r"\1\n    getLedger: (id: string) => api.get(`/customers/${id}/ledger`),\n    recordPayment: (id: string, data: any) => api.post(`/customers/${id}/payments`, data),",
        content
    )

    # Find where delete ends for suppliersApi and inject
    content = re.sub(
        r"(delete: \(id: string\) => api\.delete\(`/suppliers/\$\{id\}`\),)",
        r"\1\n    getLedger: (id: string) => api.get(`/suppliers/${id}/ledger`),\n    recordPayment: (id: string, data: any) => api.post(`/suppliers/${id}/payments`, data),",
        content
    )

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

fix_erp_api_robust()
print("Fixed erp-api.ts robustly!")
