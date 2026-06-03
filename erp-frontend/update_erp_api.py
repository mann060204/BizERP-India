import re

def update_erp_api():
    filepath = 'd:/ERP WEBSITE/erp-frontend/lib/erp-api.ts'
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Update customersApi
    customers_old = "    update: (id: string, data: any) => api.put(`/customers/${id}`, data),\n    delete: (id: string) => api.delete(`/customers/${id}`),\n  };"
    customers_new = "    update: (id: string, data: any) => api.put(`/customers/${id}`, data),\n    delete: (id: string) => api.delete(`/customers/${id}`),\n    getLedger: (id: string) => api.get(`/customers/${id}/ledger`),\n    recordPayment: (id: string, data: any) => api.post(`/customers/${id}/payments`, data),\n  };"
    content = content.replace(customers_old, customers_new)

    # Update suppliersApi
    suppliers_old = "    update: (id: string, data: any) => api.put(`/suppliers/${id}`, data),\n    delete: (id: string) => api.delete(`/suppliers/${id}`),\n  };"
    suppliers_new = "    update: (id: string, data: any) => api.put(`/suppliers/${id}`, data),\n    delete: (id: string) => api.delete(`/suppliers/${id}`),\n    getLedger: (id: string) => api.get(`/suppliers/${id}/ledger`),\n    recordPayment: (id: string, data: any) => api.post(`/suppliers/${id}/payments`, data),\n  };"
    content = content.replace(suppliers_old, suppliers_new)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

update_erp_api()
print("Updated erp-api.ts!")
