import re

def update_api():
    filepath = 'd:/ERP WEBSITE/erp-frontend/lib/erp-api.ts'
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Add ledger methods to customersApi
    customer_replacement = """    delete: (id: string) => api.delete(`/customers/${id}`),
    getLedger: (id: string) => api.get(`/customers/${id}/ledger`),
    recordPayment: (id: string, data: any) => api.post(`/customers/${id}/payments`, data),"""
    content = content.replace("    delete: (id: string) => api.delete(`/customers/${id}`),", customer_replacement, 1)

    # Add ledger methods to suppliersApi
    supplier_replacement = """    delete: (id: string) => api.delete(`/suppliers/${id}`),
    getLedger: (id: string) => api.get(`/suppliers/${id}/ledger`),
    recordPayment: (id: string, data: any) => api.post(`/suppliers/${id}/payments`, data),"""
    
    content = content.replace("    delete: (id: string) => api.delete(`/suppliers/${id}`),", supplier_replacement, 1)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

update_api()
print("Updated erp-api.ts correctly!")
