import re
import os

def fix_duplicates(filepath, vars_to_remove):
    if not os.path.exists(filepath):
        return
    
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    new_lines = []
    # We will remove the first occurrence of these specific lines because they were injected right after `useRouter()`
    removed_vars = {v: False for v in vars_to_remove}
    
    for line in lines:
        skip = False
        for var in vars_to_remove:
            if var in line and not removed_vars[var] and line.strip().startswith('const ['):
                skip = True
                removed_vars[var] = True
                break
        if not skip:
            new_lines.append(line)
            
    with open(filepath, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)

fix_duplicates('d:/ERP WEBSITE/erp-frontend/app/dashboard/purchases/new/page.tsx', [
    'additionalDiscount', 'globalDiscountAmount', 'discountPercent'
])

fix_duplicates('d:/ERP WEBSITE/erp-frontend/app/dashboard/purchases/returns/new/page.tsx', [
    'purchaseType', 'amountPaid'
])

fix_duplicates('d:/ERP WEBSITE/erp-frontend/app/dashboard/purchases/returns/[id]/edit/page.tsx', [
    'purchaseType', 'amountPaid'
])

print("Duplicates removed!")
