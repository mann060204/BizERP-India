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
    
    # Determine the type variable
    type_var = "purchaseType"
    if "invoiceType" in content:
        type_var = "invoiceType"
    if "quotationType" in content:
        type_var = "quotationType"
    
    # 1. Update the input row grid columns
    # We look for `<div className="grid grid-cols-[1fr_2fr_1fr_1fr_1.5fr_1fr_1fr_1fr_1fr_auto] gap-2 items-end mb-4">`
    grid_pattern = re.compile(r'<div className="grid grid-cols-\[1fr_2fr_1fr_1fr_1\.5fr_1fr_1fr_1fr_1fr_auto\] gap-2 items-end mb-4">')
    new_grid = f'<div className={{`grid gap-2 items-end mb-4 ${{ {type_var} !== \'Non-GST\' ? \'grid-cols-[1fr_2fr_1fr_1fr_1.5fr_1fr_1fr_1fr_1fr_1fr_auto]\' : \'grid-cols-[1fr_2fr_1fr_1fr_1.5fr_1fr_1fr_1fr_1fr_auto]\' }}`}}>'
    content = grid_pattern.sub(new_grid, content)

    # 2. Add Disc. (₹) and update Disc. (%)
    # Search for:
    # <div>
    #   <label className="erp-label block mb-1">Disc. (%)</label>
    #   <div className="flex">
    #     <input type="number" value={itemInput.discount === 0 ? '' : itemInput.discount} onChange={e => setItemInput({...itemInput, discount: parseFloat(e.target.value) || 0})} className="erp-input w-full rounded-none" />
    #     <span className="bg-slate-100 px-2 py-1 text-xs border border-slate-200 border-l-0 flex items-center">%</span>
    #   </div>
    # </div>
    disc_pattern = re.compile(
        r'<div>\s*<label className="erp-label block mb-1">Disc\. \(\%\)</label>\s*<div className="flex">\s*<input type="number" value=\{itemInput\.discount === 0 \? \'\' : itemInput\.discount\} onChange=\{e => setItemInput\(\{\.\.\.itemInput, discount: parseFloat\(e\.target\.value\) \|\| 0\}\)\} className="erp-input w-full rounded-none" />\s*<span className="bg-slate-100 px-2 py-1 text-xs border border-slate-200 border-l-0 flex items-center">%</span>\s*</div>\s*</div>',
        re.MULTILINE | re.DOTALL
    )
    new_disc = """              <div>
                <label className="erp-label block mb-1">Disc. (%)</label>
                <div className="flex">
                  <input type="number" value={itemInput.discount === 0 ? '' : itemInput.discount} onChange={e => setItemInput({...itemInput, discount: parseFloat(e.target.value) || 0, discountType: 'percentage'})} className="erp-input w-full rounded-none" />
                  <span className="bg-slate-100 px-2 py-1 text-xs border border-slate-200 border-l-0 flex items-center">%</span>
                </div>
              </div>
              <div>
                <label className="erp-label block mb-1">Disc. (₹)</label>
                <div className="flex">
                  <span className="bg-slate-100 px-2 py-1 text-xs border border-slate-200 border-r-0 flex items-center">₹</span>
                  <input type="number" value={itemInput.discountAmount === 0 ? '' : itemInput.discountAmount} onChange={e => setItemInput({...itemInput, discountAmount: parseFloat(e.target.value) || 0, discountType: 'amount'})} className="erp-input w-full rounded-none" />
                </div>
              </div>"""
    content = disc_pattern.sub(new_disc, content)

    # 3. Update Tax (%) and Cess (%) wrapping with Type_VAR !== 'Non-GST'
    tax_cess_pattern = re.compile(
        r'<div>\s*<label className="erp-label block mb-1">Tax \(\%\)</label>\s*<input type="number" value=\{itemInput\.gstRate === 0 \? \'\' : itemInput\.gstRate\} onChange=\{e => setItemInput\(\{\.\.\.itemInput, gstRate: parseFloat\(e\.target\.value\) \|\| 0\}\)\} className="erp-input w-full" />\s*</div>\s*<div>\s*<label className="erp-label block mb-1">Cess \(\%\)</label>\s*<input type="number" value=\{itemInput\.cess === 0 \? \'\' : itemInput\.cess\} onChange=\{e => setItemInput\(\{\.\.\.itemInput, cess: parseFloat\(e\.target\.value\) \|\| 0\}\)\} className="erp-input w-full" />\s*</div>',
        re.MULTILINE | re.DOTALL
    )
    new_tax_cess = f"""              {{{type_var} !== 'Non-GST' && (
                <>
                  <div>
                    <label className="erp-label block mb-1">Tax (%)</label>
                    <input type="number" value={{itemInput.gstRate === 0 ? '' : itemInput.gstRate}} onChange={{e => setItemInput({{{{...itemInput, gstRate: parseFloat(e.target.value) || 0}}}}) }} className="erp-input w-full" />
                  </div>
                  <div>
                    <label className="erp-label block mb-1">Cess (%)</label>
                    <input type="number" value={{itemInput.cess === 0 ? '' : itemInput.cess}} onChange={{e => setItemInput({{{{...itemInput, cess: parseFloat(e.target.value) || 0}}}}) }} className="erp-input w-full" />
                  </div>
                </>
              )}}"""
    content = tax_cess_pattern.sub(new_tax_cess, content)

    # 4. Update the added items table headers
    table_header_pattern = re.compile(
        r'<div className="grid grid-cols-11 bg-\[#F1F5F9\] text-slate-600 text-\[10px\] font-bold uppercase tracking-wider sticky top-0 z-10 border-b border-slate-200">(.*?)<div className="col-span-3 px-2 py-1\.5 text-center">Amount</div>\s*</div>',
        re.MULTILINE | re.DOTALL
    )
    # The new grid will use dynamic columns. Let's say 14 cols for GST, 11 for non-GST
    new_table_header = f"""<div className={{`grid ${{ {type_var} !== 'Non-GST' ? 'grid-cols-14' : 'grid-cols-11' }} bg-[#F1F5F9] text-slate-600 text-[10px] font-bold uppercase tracking-wider sticky top-0 z-10 border-b border-slate-200`}}>
             <div className="border-r border-slate-200 px-2 py-1.5 text-center">S. No.</div>
             <div className="border-r border-slate-200 px-2 py-1.5 text-center">Item Name</div>
             <div className="border-r border-slate-200 px-2 py-1.5 text-center">Quantity</div>
             <div className="border-r border-slate-200 px-2 py-1.5 text-center">Unit</div>
             <div className="border-r border-slate-200 px-2 py-1.5 text-center">Price/Unit</div>
             <div className="border-r border-slate-200 px-2 py-1.5 text-center">Disc (%)</div>
             <div className="border-r border-slate-200 px-2 py-1.5 text-center">Disc (₹)</div>
             {{{type_var} !== 'Non-GST' && (
                <>
                  <div className="border-r border-slate-200 px-2 py-1.5 text-center">Tax (%)</div>
                  <div className="border-r border-slate-200 px-2 py-1.5 text-center">CGST</div>
                  <div className="border-r border-slate-200 px-2 py-1.5 text-center">SGST</div>
                  <div className="border-r border-slate-200 px-2 py-1.5 text-center">IGST</div>
                  <div className="border-r border-slate-200 px-2 py-1.5 text-center">Cess (%)</div>
                </>
             )}}
             <div className="col-span-2 px-2 py-1.5 text-center">Amount</div>
           </div>"""
    content = table_header_pattern.sub(new_table_header, content)

    # 5. Update the added items table rows
    table_row_pattern = re.compile(
        r'<div key=\{idx\} className="grid grid-cols-11 hover:bg-slate-50 border-b border-slate-100 text-\[11px\] group">\s*(.*?)<div className="border-r border-slate-100 px-2 py-1\.5 text-center">\{item\.discount \|\| \'\'\}</div>\s*<div className="border-r border-slate-100 px-2 py-1\.5 text-center">\{item\.gstRate\}</div>\s*<div className="border-r border-slate-100 px-2 py-1\.5 text-center">\{item\.cess \|\| \'\'\}</div>\s*<div className="col-span-3 px-2 py-1\.5 text-right font-medium flex justify-between items-center">',
        re.MULTILINE | re.DOTALL
    )
    new_table_row = f"""<div key={{idx}} className={{`grid ${{ {type_var} !== 'Non-GST' ? 'grid-cols-14' : 'grid-cols-11' }} hover:bg-slate-50 border-b border-slate-100 text-[11px] group`}}>
                    \\1<div className="border-r border-slate-100 px-2 py-1.5 text-center">{{item.discount || ''}}</div>
                    <div className="border-r border-slate-100 px-2 py-1.5 text-center">{{item.discountAmount > 0 ? '₹' + item.discountAmount.toFixed(2) : ''}}</div>
                    {{{type_var} !== 'Non-GST' && (
                        <>
                          <div className="border-r border-slate-100 px-2 py-1.5 text-center">{{item.gstRate}}</div>
                          <div className="border-r border-slate-100 px-2 py-1.5 text-right">{{item.cgst > 0 ? item.cgst.toFixed(2) : '-'}}</div>
                          <div className="border-r border-slate-100 px-2 py-1.5 text-right">{{item.sgst > 0 ? item.sgst.toFixed(2) : '-'}}</div>
                          <div className="border-r border-slate-100 px-2 py-1.5 text-right">{{item.igst > 0 ? item.igst.toFixed(2) : '-'}}</div>
                          <div className="border-r border-slate-100 px-2 py-1.5 text-center">{{item.cess || ''}}</div>
                        </>
                    )}}
                    <div className="col-span-2 px-2 py-1.5 text-right font-medium flex justify-between items-center">"""
    content = table_row_pattern.sub(new_table_row, content)

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)

print("Applied phase 2 changes.")
