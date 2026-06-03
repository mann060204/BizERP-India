import re

def update_customers_list():
    filepath = 'd:/ERP WEBSITE/erp-frontend/app/dashboard/customers/page.tsx'
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Add currentBalance to interface
    content = content.replace("openingBalance: number;", "openingBalance: number; currentBalance?: number;")

    # 2. Change openingBalance to currentBalance in table
    content = content.replace("c.openingBalance || 0", "c.currentBalance || c.openingBalance || 0")
    content = content.replace("c.openingBalance > 0", "Math.abs(c.currentBalance || c.openingBalance || 0) > 0")
    # Actually wait, let's just replace the specific span logic:
    # <span className={c.openingBalance > 0 ? 'text-green-400' : c.openingBalance < 0 ? 'text-red-400' : 'text-slate-600'}>
    #   ₹{c.openingBalance?.toFixed(2) || '0.00'}
    
    # We can do this safely via regex
    old_span = r"<span className=\{c\.openingBalance > 0 \? 'text-green-400' : c\.openingBalance < 0 \? 'text-red-400' : 'text-slate-600'\}>\s*₹\{c\.openingBalance\?\.toFixed\(2\) \|\| '0\.00'\}"
    new_span = """<span className={(c.currentBalance || 0) > 0 ? 'text-orange-500' : (c.currentBalance || 0) < 0 ? 'text-emerald-500' : 'text-slate-600'}>
                          ₹{Math.abs(c.currentBalance || c.openingBalance || 0).toFixed(2)} {(c.currentBalance || 0) > 0 ? 'Dr' : (c.currentBalance || 0) < 0 ? 'Cr' : ''}"""
    
    content = re.sub(old_span, new_span, content)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

update_customers_list()
print("Updated customers list page!")
