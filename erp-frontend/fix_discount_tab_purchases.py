import os
import re

frontend_dir = r"d:\ERP WEBSITE\erp-frontend"

files_to_fix = [
    "app/dashboard/purchases/new/page.tsx",
    "app/dashboard/purchases/[id]/edit/page.tsx",
    "app/dashboard/purchases/returns/new/page.tsx",
    "app/dashboard/purchases/returns/[id]/edit/page.tsx",
    "app/dashboard/purchases/orders/new/page.tsx",
    "app/dashboard/purchases/orders/[id]/edit/page.tsx",
]

discount_ui_replacement = """<div>
                <label className="erp-label block mb-1">Discount</label>
                <div className="flex">
                  <input 
                    type="number" 
                    value={itemInput.discountType === 'percentage' ? (itemInput.discount === 0 ? '' : itemInput.discount) : (itemInput.discountAmount === 0 ? '' : itemInput.discountAmount)} 
                    onChange={e => {
                      const val = parseFloat(e.target.value) || 0;
                      if(itemInput.discountType === 'percentage') {
                        setItemInput({...itemInput, discount: val, discountAmount: 0});
                      } else {
                        setItemInput({...itemInput, discountAmount: val, discount: 0});
                      }
                    }} 
                    className="erp-input w-full rounded-none" 
                  />
                  <select 
                    value={itemInput.discountType || 'percentage'} 
                    onChange={e => setItemInput({...itemInput, discountType: e.target.value as 'percentage' | 'amount', discount: 0, discountAmount: 0})} 
                    className="erp-input rounded-l-none bg-slate-100 px-1 border-l-0 text-xs w-12 cursor-pointer outline-none focus:ring-0">
                    <option value="percentage">%</option>
                    <option value="amount">₹</option>
                  </select>
                </div>
              </div>"""

for rel_path in files_to_fix:
    path = os.path.join(frontend_dir, rel_path.replace('/', '\\'))
    if not os.path.exists(path):
        continue
    
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    # The block starts with <div>\n<label...Disc. (%) and ends before {purchaseType or <div><label>Tax
    # Since we know exact structure, we can just use a simpler regex
    pattern = re.compile(r'<div>\s*<label className="erp-label block mb-1">Disc\.\s*\(\%\)</label>.*?</div>\s*</div>\s*(?:<div>\s*<label className="erp-label block mb-1">Disc\.\s*\([^)]*\)</label>.*?</div>\s*</div>)?', re.DOTALL | re.IGNORECASE)
    
    content, count = pattern.subn(discount_ui_replacement, content)
    print(f"{path}: Replaced input fields {count} times")

    # Fix table rows and headers if they weren't fixed
    header_pattern1 = re.compile(r'<div className="border-r border-slate-200 px-2 py-1\.5 text-center">Disc\s*\(\%\)</div>\s*<div className="border-r border-slate-200 px-2 py-1\.5 text-center">Disc\s*\([^)]*\)</div>')
    content, count_h1 = header_pattern1.subn('<div className="border-r border-slate-200 px-2 py-1.5 text-center">Discount</div>', content)
    
    row_cell_replacement_border = """<div className="border-r border-slate-100 px-2 py-1.5 text-center text-red-500">
                      {item.discountType === 'percentage' && item.discount > 0 ? `${item.discount}%` : ''}
                      {item.discountType === 'amount' && item.discountAmount > 0 ? `₹${item.discountAmount.toFixed(2)}` : ''}
                    </div>"""
    
    row_pattern1 = re.compile(r'<div className="border-r border-slate-100 px-2 py-1\.5 text-center">\{item\.discount \|\| \'\'\}</div>\s*<div className="border-r border-slate-100 px-2 py-1\.5 text-center">\{item\.discountAmount > 0 \? \'[^\']*\' \+ item\.discountAmount\.toFixed\(2\) : \'\'\}</div>')
    content, count_r1 = row_pattern1.subn(row_cell_replacement_border, content)
    
    if count_h1 > 0:
        content = content.replace("grid-cols-14", "grid-cols-13")
        content = content.replace("grid-cols-11", "grid-cols-10")

    print(f"  Headers: {count_h1}, Rows: {count_r1}")

    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
