import re

def fix_supplier_routes():
    filepath = 'd:/ERP WEBSITE/erp-backend/src/routes/supplier.routes.ts'
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    content = content.replace("import { getSuppliers, getSupplier, createSupplier, updateSupplier, deleteSupplier } from '../controllers/supplier.controller';", "import { getSuppliers, getSupplier, createSupplier, updateSupplier, deleteSupplier, getSupplierLedger, recordPayment } from '../controllers/supplier.controller';")
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

def fix_frontend_line_item(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    content = content.replace("discount: number; gstRate: number;", "discount: number; discountAmount?: number; discountType?: 'percentage' | 'amount'; gstRate: number;")
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

fix_supplier_routes()
fix_frontend_line_item('d:/ERP WEBSITE/erp-frontend/app/dashboard/sales/new/page.tsx')
fix_frontend_line_item('d:/ERP WEBSITE/erp-frontend/app/dashboard/sales/[id]/edit/page.tsx')
fix_frontend_line_item('d:/ERP WEBSITE/erp-frontend/app/dashboard/sales/returns/new/page.tsx')
fix_frontend_line_item('d:/ERP WEBSITE/erp-frontend/app/dashboard/sales/returns/[id]/edit/page.tsx')

def fix_settings_page():
    filepath = 'd:/ERP WEBSITE/erp-frontend/app/dashboard/settings/page.tsx'
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    # It complains about onUpdate on DocumentSequencesTab.
    # Let's remove onUpdate={fetchSettings} or add it to the interface.
    content = content.replace("onUpdate={fetchSettings} />", "/>")
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

def fix_quick_add():
    filepath = 'd:/ERP WEBSITE/erp-frontend/components/modals/QuickAddItemModal.tsx'
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    content = content.replace("setLoading(prev => ({ ...prev, [type]: true }));", "setLoading((prev: any) => ({ ...prev, [type]: true }));")
    content = content.replace("setLoading(prev => ({ ...prev, [type]: false }));", "setLoading((prev: any) => ({ ...prev, [type]: false }));")
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

fix_settings_page()
fix_quick_add()
print("Fixed!")
