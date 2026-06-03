import os
import re

frontend_dir = r"d:\ERP WEBSITE\erp-frontend"

# We have 12 files:
# sales: new, edit, returns/new, returns/edit
# purchases: new, edit, returns/new, returns/edit
# quotations: new, edit
# purchase orders: new, edit

files_to_fix = [
    "app/dashboard/sales/new/page.tsx",
    "app/dashboard/sales/[id]/edit/page.tsx",
    "app/dashboard/sales/returns/new/page.tsx",
    "app/dashboard/sales/returns/[id]/edit/page.tsx",
    "app/dashboard/purchases/new/page.tsx",
    "app/dashboard/purchases/[id]/edit/page.tsx",
    "app/dashboard/purchases/returns/new/page.tsx",
    "app/dashboard/purchases/returns/[id]/edit/page.tsx",
    "app/dashboard/quotations/new/page.tsx",
    "app/dashboard/quotations/[id]/edit/page.tsx",
    "app/dashboard/purchases/orders/new/page.tsx",
    "app/dashboard/purchases/orders/[id]/edit/page.tsx",
]

# We need to replace the `Disc. (%)` and `Disc. (₹)` input fields in the "Particulars" Add Item area.
# For purchases, there are BOTH `Disc. (%)` and `Disc. (₹)`.
# For sales, there is ONLY `Disc. (%)` or something similar.

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
        print(f"Not found: {path}")
        continue
    
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    # REPLACEMENT 1: Replace the input fields
    # In purchases, it looks like:
    # <div>\n  <label className="erp-label block mb-1">Disc. (%)</label> ... </div>\n  <div>\n  <label className="erp-label block mb-1">Disc. (₹)</label> ... </div>
    # In sales, it looks like:
    # <div>\n  <label className="erp-label">Disc. (%)</label> ... </div>
    # Let's use regex to find everything between `Disc. (%)` label block and `Tax (%)` or `Amount` label block.

    # Find the block starting with <div>...<label ...>Disc. (%)</label> and ending right before <div>...<label ...>Tax (%)</label> OR <div>...<label ...>Amount</label>
    pattern = re.compile(r'<div>\s*<label[^>]*>Disc\.\s*\(\%\)</label>.*?</div>\s*(?:<div>\s*<label[^>]*>Disc\.\s*\(₹\)</label>.*?</div>\s*)?(?=<div>\s*<label[^>]*>(?:Tax\s*\(\%\)|Amount|Taxable Amount))', re.DOTALL | re.IGNORECASE)
    
    # We will also catch cases where `Disc. (%)` is followed by `Tax (%)` without the `Disc. (₹)` block.
    # The regex handles it because `(?:...)?` is optional.
    
    content, count = pattern.subn(discount_ui_replacement + '\n              ', content)
    print(f"{path}: Replaced input fields {count} times")

    # REPLACEMENT 2: Replace table headers
    # <div className="border-r border-slate-200 px-2 py-1.5 text-center">Disc (%)</div>
    # <div className="border-r border-slate-200 px-2 py-1.5 text-center">Disc (₹)</div>
    # OR 
    # <div className="col-span-1 erp-grid-cell text-center">Disc (%)</div>
    # We want to replace it with a single "Discount" header.
    header_pattern1 = re.compile(r'<div className="border-r border-slate-200 px-2 py-1\.5 text-center">Disc\s*\(\%\)</div>\s*<div className="border-r border-slate-200 px-2 py-1\.5 text-center">Disc\s*\(₹\)</div>')
    content, count_h1 = header_pattern1.subn('<div className="border-r border-slate-200 px-2 py-1.5 text-center">Discount</div>', content)
    
    header_pattern2 = re.compile(r'<div className="border-r border-slate-200 px-2 py-1\.5 text-center">Disc\s*\(\%\)</div>')
    content, count_h2 = header_pattern2.subn('<div className="border-r border-slate-200 px-2 py-1.5 text-center">Discount</div>', content)

    header_pattern3 = re.compile(r'<div className="col-span-1 erp-grid-cell text-center">Disc\s*\(\%\)</div>')
    content, count_h3 = header_pattern3.subn('<div className="col-span-1 erp-grid-cell text-center">Discount</div>', content)

    # REPLACEMENT 3: Replace table row cells
    # purchases style:
    # <div className="border-r border-slate-100 px-2 py-1.5 text-center">{item.discount || ''}</div>
    # <div className="border-r border-slate-100 px-2 py-1.5 text-center">{item.discountAmount > 0 ? '₹' + item.discountAmount.toFixed(2) : ''}</div>
    # sales style:
    # <div className="col-span-1 erp-grid-cell text-center text-red-400">{item.discount}%</div>

    row_cell_replacement_border = """<div className="border-r border-slate-100 px-2 py-1.5 text-center text-red-500">
                      {item.discountType === 'percentage' && item.discount > 0 ? `${item.discount}%` : ''}
                      {item.discountType === 'amount' && item.discountAmount > 0 ? `₹${item.discountAmount.toFixed(2)}` : ''}
                    </div>"""
    
    row_pattern1 = re.compile(r'<div className="border-r border-slate-100 px-2 py-1\.5 text-center">\{item\.discount \|\| \'\'\}</div>\s*<div className="border-r border-slate-100 px-2 py-1\.5 text-center">\{item\.discountAmount > 0 \? \'₹\' \+ item\.discountAmount\.toFixed\(2\) : \'\'\}</div>')
    content, count_r1 = row_pattern1.subn(row_cell_replacement_border, content)
    
    row_pattern2 = re.compile(r'<div className="border-r border-slate-100 px-2 py-1\.5 text-center">\{item\.discount \|\| \'\'\}</div>')
    content, count_r2 = row_pattern2.subn(row_cell_replacement_border, content)

    row_cell_replacement_grid = """<div className="col-span-1 erp-grid-cell text-center text-red-400">
                      {item.discountType === 'percentage' && item.discount > 0 ? `${item.discount}%` : ''}
                      {item.discountType === 'amount' && item.discountAmount > 0 ? `₹${item.discountAmount.toFixed(2)}` : ''}
                    </div>"""
    
    row_pattern3 = re.compile(r'<div className="col-span-1 erp-grid-cell text-center text-red-400">\{item\.discount\}\%</div>')
    content, count_r3 = row_pattern3.subn(row_cell_replacement_grid, content)

    # REPLACEMENT 4: Also fix grid-cols in purchases table header and row if we removed a column
    # If count_h1 > 0, we removed 1 column from purchases table
    if count_h1 > 0:
        # grid-cols-14 -> grid-cols-13, grid-cols-11 -> grid-cols-10
        content = content.replace("grid-cols-14", "grid-cols-13")
        content = content.replace("grid-cols-11", "grid-cols-10")

    print(f"  Headers replaced: {count_h1 + count_h2 + count_h3}, Rows replaced: {count_r1 + count_r2 + count_r3}")

    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

print("Finished applying discount tab to all 12 modules!")
