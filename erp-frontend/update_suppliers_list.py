import re

def update_suppliers_list():
    filepath = 'd:/ERP WEBSITE/erp-frontend/app/dashboard/suppliers/page.tsx'
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Add currentBalance to interface
    content = content.replace("openingBalance: number; balanceType?: 'Debit'|'Credit';", "openingBalance: number; currentBalance?: number; balanceType?: 'Debit'|'Credit';")

    # 2. Change openingBalance to currentBalance in table
    # We can do this safely via regex
    old_span = r"<span className=\{s\.openingBalance > 0 \? 'text-red-400' : s\.openingBalance < 0 \? 'text-green-400' : 'text-slate-600'\}>\s*₹\{s\.openingBalance\?\.toFixed\(2\) \|\| '0\.00'\}"
    new_span = """<span className={(s.currentBalance || 0) > 0 ? 'text-orange-500' : (s.currentBalance || 0) < 0 ? 'text-emerald-500' : 'text-slate-600'}>
                          ₹{Math.abs(s.currentBalance || s.openingBalance || 0).toFixed(2)} {(s.currentBalance || 0) > 0 ? 'Dr' : (s.currentBalance || 0) < 0 ? 'Cr' : ''}"""
    
    content = re.sub(old_span, new_span, content)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

update_suppliers_list()
print("Updated suppliers list page!")
