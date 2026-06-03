import re

def fix_erp_api():
    filepath = 'd:/ERP WEBSITE/erp-frontend/lib/erp-api.ts'
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find customersApi block
    customers_match = re.search(r'(export const customersApi = \{[^}]+)};', content)
    if customers_match:
        inner = customers_match.group(1)
        new_inner = inner.rstrip() + ",\n    getLedger: (id: string) => api.get(`/customers/${id}/ledger`),\n    recordPayment: (id: string, data: any) => api.post(`/customers/${id}/payments`, data),\n  };\n"
        content = content[:customers_match.start()] + new_inner + content[customers_match.end():]

    suppliers_match = re.search(r'(export const suppliersApi = \{[^}]+)};', content)
    if suppliers_match:
        inner = suppliers_match.group(1)
        new_inner = inner.rstrip() + ",\n    getLedger: (id: string) => api.get(`/suppliers/${id}/ledger`),\n    recordPayment: (id: string, data: any) => api.post(`/suppliers/${id}/payments`, data),\n  };\n"
        content = content[:suppliers_match.start()] + new_inner + content[suppliers_match.end():]

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

fix_erp_api()
print("Fixed erp-api.ts with regex!")
