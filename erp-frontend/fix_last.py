import re

def fix_errors():
    filepath = 'd:/ERP WEBSITE/erp-frontend/app/dashboard/purchases/returns/[id]/edit/page.tsx'
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Revert the hacky amountPaid replacement
    content = content.replace("setAmountPaid(p.0 || 0);", "setAmountPaid(p.amountPaid || 0);")
    content = content.replace("additionalDiscount,\n        0,\n        txnId,", "additionalDiscount,\n        amountPaid: 0,\n        txnId,")
    content = content.replace("0 > 0 ? 'partial' : saveStatus", "false ? 'partial' : saveStatus")

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

fix_errors()
print("Fixed!")
