import os
import re

frontend_dir = r"d:\ERP WEBSITE\erp-frontend"

# We want to apply the same logic to the edit pages as we did manually to the new pages.
# The user's goal: move shipping out of the summary box.

# 1. Sales Edit Page
sales_edit_path = os.path.join(frontend_dir, r"app\dashboard\sales\[id]\edit\page.tsx")
if os.path.exists(sales_edit_path):
    with open(sales_edit_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Inject additionalDiscount state variables
    state_replace = "const [shippingCharge, setShippingCharge] = useState(0);\n  const [shippingGstRate, setShippingGstRate] = useState(0);\n  const [additionalDiscount, setAdditionalDiscount] = useState(0);\n  const [additionalDiscountType, setAdditionalDiscountType] = useState<'amount'|'percentage'>('amount');"
    content = re.sub(r'const \[shippingCharge, setShippingCharge\] = useState\(0\);\s*const \[shippingGstRate, setShippingGstRate\] = useState\(0\);', state_replace, content)

    # In useEffect, map discountAmount back
    # `setShippingGstRate(inv.shippingGstRate || 0);`
    load_replace = "setShippingGstRate(inv.shippingGstRate || 0);\n        if (inv.discountAmount) { setAdditionalDiscount(inv.discountAmount); setAdditionalDiscountType('amount'); }"
    content = re.sub(r'setShippingGstRate\(inv\.shippingGstRate \|\| 0\);', load_replace, content)

    # Totals calculation
    calc_replace = """const globalDiscountAmount = additionalDiscountType === 'percentage' ? round2((totalTaxable * additionalDiscount) / 100) : additionalDiscount;
  const preRoundTotal = totalTaxable - globalDiscountAmount + totalCGST + totalSGST + totalIGST + shippingCharge;"""
    content = re.sub(r'const preRoundTotal = totalTaxable \+ totalCGST \+ totalSGST \+ totalIGST \+ shippingCharge;', calc_replace, content)

    # Save Payload
    payload_replace = """invoiceType,
        discountAmount: globalDiscountAmount,"""
    content = re.sub(r'invoiceType,', payload_replace, content, count=1)

    # UI updates
    # Add Add'l Discount and Shipping inputs below Discount Scheme
    ui_left_add = """</div>
              )}
              <div>
                <label className="erp-label block mb-1">Add'l Discount</label>
                <div className="flex w-full">
                   <input 
                     type="number" 
                     value={additionalDiscount === 0 ? '' : additionalDiscount} 
                     onChange={e => setAdditionalDiscount(parseFloat(e.target.value) || 0)} 
                     className="erp-input w-full rounded-none" 
                     placeholder="Discount..."
                   />
                   <select 
                     value={additionalDiscountType} 
                     onChange={e => setAdditionalDiscountType(e.target.value as 'amount'|'percentage')} 
                     className="erp-input rounded-l-none bg-slate-100 px-2 border-l-0 text-xs cursor-pointer outline-none focus:ring-0">
                     <option value="percentage">%</option>
                     <option value="amount">₹</option>
                   </select>
                </div>
              </div>
              <div>
                <label className="erp-label block mb-1">Shipping / GST%</label>
                <div className="flex gap-1">
                  <input type="number" value={shippingCharge === 0 ? '' : shippingCharge} onChange={e => setShippingCharge(parseFloat(e.target.value) || 0)} className="erp-input w-2/3" placeholder="Amount" />
                  <input type="number" value={shippingGstRate === 0 ? '' : shippingGstRate} onChange={e => setShippingGstRate(parseFloat(e.target.value) || 0)} className="erp-input w-1/3" placeholder="GST%" />
                </div>
              </div>
              <div>"""
    content = re.sub(r'</div>\s*\)}\s*<div>\s*<label className="erp-label block mb-1">Sold By</label>', ui_left_add + '\n                <label className="erp-label block mb-1">Sold By</label>', content)

    # Fix UI in Summary Box
    summary_discount_replace = """{(totalDiscount + globalDiscountAmount) > 0 && (
                  <div className="flex justify-between text-red-400">
                    <span>Discount</span>
                    <span>-₹{(totalDiscount + globalDiscountAmount).toFixed(2)}</span>
                  </div>
                )}
                {shippingCharge > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Shipping</span>
                    <span>₹{shippingCharge.toFixed(2)}</span>
                  </div>
                )}"""
    content = re.sub(r'\{totalDiscount > 0 && \(\s*<div className="flex justify-between text-red-400">\s*<span>Discount</span>\s*<span>-₹\{totalDiscount\.toFixed\(2\)\}</span>\s*</div>\s*\)\}', summary_discount_replace, content)

    # Remove shipping from summary
    content = re.sub(r'<div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-200">\s*<span className="erp-label">Shipping / GST%</span>\s*<div className="flex gap-1">\s*<input[^>]*>\s*<input[^>]*>\s*</div>\s*</div>', '', content)

    with open(sales_edit_path, 'w', encoding='utf-8') as f:
        f.write(content)

# 2. Purchases Edit Page
purch_edit_path = os.path.join(frontend_dir, r"app\dashboard\purchases\[id]\edit\page.tsx")
if os.path.exists(purch_edit_path):
    with open(purch_edit_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Move Shipping inputs to left
    ui_left_add_purch = """</div>
              )}
              <div>
                <label className="erp-label block mb-1 mt-2">Shipping / GST%</label>
                <div className="flex gap-1">
                  <input type="number" value={shippingCharge === 0 ? '' : shippingCharge} onChange={e => setShippingCharge(parseFloat(e.target.value) || 0)} className="erp-input w-2/3" placeholder="Amount" />
                  <input type="number" value={shippingGstRate === 0 ? '' : shippingGstRate} onChange={e => setShippingGstRate(parseFloat(e.target.value) || 0)} className="erp-input w-1/3" placeholder="GST%" />
                </div>
              </div>
           </div>

           <div className="col-span-1">"""
    
    content = re.sub(r'</div>\s*\)}\s*</div>\s*<div className="col-span-1">', ui_left_add_purch, content)

    # Fix UI in Summary Box
    summary_shipping_replace = """{shippingCharge > 0 && (
                   <div className="flex justify-between items-center py-2 border-b border-slate-100">
                     <span className="text-[10px] text-slate-500 font-medium uppercase">Shipping</span>
                     <span className="text-sm font-bold text-slate-800">₹ {shippingCharge.toFixed(2)}</span>
                   </div>
                 )}"""
    
    content = re.sub(r'<div className="flex justify-between items-center py-2 border-b border-slate-100">\s*<span className="text-\[10px\] text-slate-500 font-medium uppercase">Shipping / GST%</span>\s*<div className="flex gap-2">\s*<input[^>]*>\s*<input[^>]*>\s*</div>\s*</div>', summary_shipping_replace, content)

    with open(purch_edit_path, 'w', encoding='utf-8') as f:
        f.write(content)

print("Applied layout fixes to edit pages")
