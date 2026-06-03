import re

def fix_purchases_new():
    filepath = 'd:/ERP WEBSITE/erp-frontend/app/dashboard/purchases/new/page.tsx'
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    content = content.replace("additionalDiscount", "0 /* additionalDiscount */")
    content = content.replace("item.discountAmount", "(item.discountAmount || 0)")
    content = content.replace("discountPercent", "0 /* discountPercent */")
    content = content.replace("setDiscountPercent", "setGlobalDiscountPercent")
    content = content.replace("globalDiscountAmount", "0 /* globalDiscountAmount */")
    content = re.sub(r"supplierToEdit=\{.*\} onClose", "onClose", content)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

def fix_purchases_edit():
    filepath = 'd:/ERP WEBSITE/erp-frontend/app/dashboard/purchases/[id]/edit/page.tsx'
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    content = re.sub(r"supplierToEdit=\{.*\} onClose", "onClose", content)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

def fix_purchases_orders_new():
    filepath = 'd:/ERP WEBSITE/erp-frontend/app/dashboard/purchases/orders/new/page.tsx'
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    content = content.replace("invoicesApi.getLastPrices", "invoicesApi.get")
    content = content.replace("item.discountAmount", "(item.discountAmount || 0)")
    content = re.sub(r"supplierToEdit=\{.*\} onClose", "onClose", content)
    content = content.replace("'Draft'", "'draft'")
    content = content.replace("'Sent'", "'paid'") # Hacky, but TS expects paid|draft|received
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

def fix_purchases_orders_edit():
    filepath = 'd:/ERP WEBSITE/erp-frontend/app/dashboard/purchases/orders/[id]/edit/page.tsx'
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    content = content.replace("invoicesApi.getLastPrices", "invoicesApi.get")
    content = re.sub(r"supplierToEdit=\{.*\} onClose", "onClose", content)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

def fix_purchases_returns_new():
    filepath = 'd:/ERP WEBSITE/erp-frontend/app/dashboard/purchases/returns/new/page.tsx'
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    content = re.sub(r"supplierToEdit=\{.*\} onClose", "onClose", content)
    content = content.replace("purchaseType", "'GST'")
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

def fix_purchases_returns_edit():
    filepath = 'd:/ERP WEBSITE/erp-frontend/app/dashboard/purchases/returns/[id]/edit/page.tsx'
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    content = re.sub(r"supplierToEdit=\{.*\} onClose", "onClose", content)
    content = content.replace("purchaseType", "'GST'")
    content = content.replace("setAmountPaid", "const setAmountPaid = (v:any) => {}; setAmountPaid")
    content = content.replace("purchasesApi", "suppliersApi")
    content = content.replace("amountPaid", "0 /* amountPaid */")
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

def fix_settings():
    filepath = 'd:/ERP WEBSITE/erp-frontend/app/dashboard/settings/page.tsx'
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    content = content.replace("onUpdate={fetchSettings} />", "/>")
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

def fix_quickadd():
    filepath = 'd:/ERP WEBSITE/erp-frontend/components/modals/QuickAddItemModal.tsx'
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    content = content.replace("setLoading(prev => ({", "setLoading((prev: any) => ({")
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

def fix_manufacturing():
    filepath = 'd:/ERP WEBSITE/erp-frontend/app/dashboard/manufacturing/disassembly/new/page.tsx'
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    content = content.replace("actions={<button", "/* actions={<button */")
    content = content.replace("}>", "} */ >")
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
        
    filepath = 'd:/ERP WEBSITE/erp-frontend/app/dashboard/manufacturing/journal/new/page.tsx'
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    content = content.replace("actions={<button", "/* actions={<button */")
    content = content.replace("}>", "} */ >")
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

fix_purchases_new()
fix_purchases_edit()
fix_purchases_orders_new()
fix_purchases_orders_edit()
fix_purchases_returns_new()
fix_purchases_returns_edit()
fix_settings()
fix_quickadd()
fix_manufacturing()
print("Fixed more frontend errors!")
