import os
import re

def update_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 1. Update handleSave status payload
    old_payload = """          amountReceived: totalAmountReceived,
          txnId: combinedTxnId,
          shippingCharge,
          soldBy,
          billTo,
          status: totalAmountReceived >= grandTotal ? 'paid' : totalAmountReceived > 0 ? 'partial' : 'unpaid',
        };"""
    new_payload = """          amountReceived: totalAmountReceived,
          txnId: combinedTxnId,
          shippingCharge,
          balance,
          soldBy,
          billTo,
          status: (totalAmountReceived >= preRoundTotal || totalAmountReceived >= grandTotal) ? 'paid' : totalAmountReceived > 0 ? 'partial' : 'unpaid',
        };"""
    content = content.replace(old_payload, new_payload)

    if 'balance,' not in content and 'balance: balance,' not in content:
        # Fallback if the first replace failed
        content = re.sub(
            r"amountReceived:\s*totalAmountReceived,\s*txnId:\s*combinedTxnId,\s*shippingCharge,",
            "amountReceived: totalAmountReceived,\n          txnId: combinedTxnId,\n          shippingCharge,\n          balance,",
            content
        )
        content = re.sub(
            r"status:\s*totalAmountReceived >= grandTotal \? 'paid' : totalAmountReceived > 0 \? 'partial' : 'unpaid',",
            "status: (totalAmountReceived >= preRoundTotal || totalAmountReceived >= grandTotal) ? 'paid' : totalAmountReceived > 0 ? 'partial' : 'unpaid',",
            content
        )
        
    # 2. Hide Tax% and Cess% inputs in section 2
    old_input1 = """                <div>
                  <label className="erp-label">Tax (%)</label>
                  <input type="number" value={itemInput.gstRate === 0 ? '' : itemInput.gstRate} onChange={e => setItemInput({...itemInput, gstRate: parseFloat(e.target.value) || 0})} className="erp-input w-full" />
                </div>"""
    new_input1 = """                {invoiceType === 'GST' && (
                  <div>
                    <label className="erp-label">Tax (%)</label>
                    <input type="number" value={itemInput.gstRate === 0 ? '' : itemInput.gstRate} onChange={e => setItemInput({...itemInput, gstRate: parseFloat(e.target.value) || 0})} className="erp-input w-full" />
                  </div>
                )}"""
    content = content.replace(old_input1, new_input1)
    
    old_input2 = """                 <div>
                   <label className="erp-label">Cess (%)</label>
                   <input type="number" value={itemInput.cess === 0 ? '' : itemInput.cess} onChange={e => setItemInput({...itemInput, cess: parseFloat(e.target.value) || 0})} className="erp-input w-full" />
                 </div>"""
    new_input2 = """                 {invoiceType === 'GST' && (
                   <div>
                     <label className="erp-label">Cess (%)</label>
                     <input type="number" value={itemInput.cess === 0 ? '' : itemInput.cess} onChange={e => setItemInput({...itemInput, cess: parseFloat(e.target.value) || 0})} className="erp-input w-full" />
                   </div>
                 )}"""
    content = content.replace(old_input2, new_input2)

    # 3. Grid headers
    old_headers = """               <div className="col-span-1 erp-grid-cell text-center">Disc%</div>
               <div className="col-span-1 erp-grid-cell text-center">Tax%</div>
               <div className="col-span-1 erp-grid-cell text-center">Cess%</div>
               <div className="col-span-2 erp-grid-cell text-right">Total</div>"""
    
    new_headers = """               <div className="col-span-1 erp-grid-cell text-center">Disc%</div>
               {invoiceType === 'GST' && <div className="col-span-1 erp-grid-cell text-center">Tax%</div>}
               {invoiceType === 'GST' && <div className="col-span-1 erp-grid-cell text-center">Cess%</div>}
               <div className={`erp-grid-cell text-right ${invoiceType === 'GST' ? 'col-span-2' : 'col-span-4'}`}>Total</div>"""
    content = content.replace(old_headers, new_headers)

    # 4. Grid rows
    old_rows = """                    <div className="col-span-1 erp-grid-cell text-center text-red-400">{item.discount}%</div>
                    <div className="col-span-1 erp-grid-cell text-center text-blue-400">{item.gstRate}%</div>
                    <div className="col-span-1 erp-grid-cell text-center">{item.cess}%</div>
                    <div className="col-span-2 erp-grid-cell text-right font-bold text-emerald-400 flex justify-between items-center">"""
    
    new_rows = """                    <div className="col-span-1 erp-grid-cell text-center text-red-400">{item.discount}%</div>
                    {invoiceType === 'GST' && <div className="col-span-1 erp-grid-cell text-center text-blue-400">{item.gstRate}%</div>}
                    {invoiceType === 'GST' && <div className="col-span-1 erp-grid-cell text-center">{item.cess}%</div>}
                    <div className={`erp-grid-cell text-right font-bold text-emerald-400 flex justify-between items-center ${invoiceType === 'GST' ? 'col-span-2' : 'col-span-4'}`}>"""
    content = content.replace(old_rows, new_rows)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)


files = [
    r'd:\ERP WEBSITE\erp-frontend\app\dashboard\sales\new\page.tsx',
    r'd:\ERP WEBSITE\erp-frontend\app\dashboard\sales\[id]\edit\page.tsx'
]

for file in files:
    if os.path.exists(file):
        update_file(file)
        print(f"Updated {file}")
    else:
        print(f"Skipping {file}, not found")
