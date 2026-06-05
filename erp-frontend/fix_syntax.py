import re

files = [
    "d:/ERP WEBSITE/erp-frontend/app/dashboard/sales/page.tsx",
    "d:/ERP WEBSITE/erp-frontend/app/dashboard/quotations/page.tsx"
]

for file in files:
    with open(file, "r", encoding="utf-8") as f:
        content = f.read()
    
    # Fix the syntax error: inv: Invoice.property -> inv.property
    content = re.sub(r'inv:\s*Invoice\.', 'inv.', content)
    content = re.sub(r'inv:\s*Quotation\.', 'inv.', content)
    
    with open(file, "w", encoding="utf-8") as f:
        f.write(content)

print("Fixed syntax errors in sales and quotations page.tsx")
