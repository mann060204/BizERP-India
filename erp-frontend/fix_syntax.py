import os
import re

frontend_dir = r"d:\ERP WEBSITE\erp-frontend\app\dashboard"

files_to_process = [
    "purchases/new/page.tsx",
    "purchases/[id]/edit/page.tsx",
    "purchases/returns/new/page.tsx",
    "purchases/returns/[id]/edit/page.tsx",
    "purchases/orders/new/page.tsx",
    "purchases/orders/[id]/edit/page.tsx",
    "sales/new/page.tsx",
    "sales/[id]/edit/page.tsx",
    "sales/returns/new/page.tsx",
    "sales/returns/[id]/edit/page.tsx",
    "quotations/new/page.tsx",
    "quotations/[id]/edit/page.tsx"
]

for rel_path in files_to_process:
    file_path = os.path.join(frontend_dir, rel_path)
    if not os.path.exists(file_path):
        continue
    
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    # Fix {{...itemInput, ...}} back to {...itemInput, ...}
    # specifically for gstRate and cess inside the onChange handlers
    
    content = content.replace(
        "setItemInput({{...itemInput, gstRate: parseFloat(e.target.value) || 0}})",
        "setItemInput({...itemInput, gstRate: parseFloat(e.target.value) || 0})"
    )
    
    content = content.replace(
        "setItemInput({{...itemInput, cess: parseFloat(e.target.value) || 0}})",
        "setItemInput({...itemInput, cess: parseFloat(e.target.value) || 0})"
    )

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)

print("Syntax errors fixed.")
