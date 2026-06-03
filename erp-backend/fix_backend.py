import re

def fix_customer_controller():
    filepath = 'd:/ERP WEBSITE/erp-backend/src/controllers/customer.controller.ts'
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    content = content.replace("const customerId = req.params['id'];", "const customerId = req.params['id'] as string;")
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

def fix_supplier_controller():
    filepath = 'd:/ERP WEBSITE/erp-backend/src/controllers/supplier.controller.ts'
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    content = content.replace("const supplierId = req.params['id'];", "const supplierId = req.params['id'] as string;")
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

def fix_supplier_routes():
    filepath = 'd:/ERP WEBSITE/erp-backend/src/routes/supplier.routes.ts'
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    content = content.replace("createBulkSuppliers, getSupplierLedger, recordPayment", "createBulkSuppliers } from '../controllers/supplier.controller';\nimport { getSupplierLedger, recordPayment")
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

fix_customer_controller()
fix_supplier_controller()
fix_supplier_routes()
print("Fixed backend controllers!")
