import os

frontend_dir = r"d:\ERP WEBSITE\erp-frontend"
sales_page_path = os.path.join(frontend_dir, "app/dashboard/sales/returns/new/page.tsx")

with open(sales_page_path, 'r', encoding='utf-8') as f:
    sales_content = f.read()

# I will find the EXACT <div className="p-1.5 grid grid-cols-6 gap-x-2 gap-y-1"> block
# and replace it with the new layout.
import re

pattern = re.compile(r'<div className="p-1\.5 grid grid-cols-6 gap-x-2 gap-y-1">.*?{/\* Section 2: Particulars Input \*/}', re.DOTALL)

new_grid_sales = """<div className="p-2 grid grid-cols-3 gap-x-4 gap-y-3">
            {/* Row 1 */}
            <div>
              <label className="erp-label block mb-1">Return Type <span className="text-red-500">*</span></label>
              <select value={salesReturnType} onChange={e => setsalesReturnType(e.target.value)} className="erp-input w-full">
                <option>GST</option>
                <option>NON-GST</option>
              </select>
            </div>
            <div>
              <label className="erp-label block mb-1">Date</label>
              <input type="date" value={salesReturnDate} onChange={e => setsalesReturnDate(e.target.value)} className="erp-input w-full" />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                 <label className="erp-label !mb-0 flex items-center gap-1.5">
                   Customer Name <span className="text-red-500">*</span>
                   <button onClick={() => setShowQuickAddCustomerModal(true)} className="text-emerald-500 hover:text-emerald-400 bg-emerald-500/10 p-0.5 rounded transition" title="Add Customer">
                     <UserPlus className="w-3.5 h-3.5" />
                   </button>
                 </label>
                 {selectedCustomer && selectedCustomer.openingBalance !== undefined && (
                   <div className={`text-xs px-2 py-0.5 rounded font-bold border ${selectedCustomer.openingBalance > 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : selectedCustomer.openingBalance < 0 ? 'bg-red-50 text-red-700 border-red-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>
                     A/C Bal: {selectedCustomer.openingBalance > 0 ? '₹' + selectedCustomer.openingBalance.toFixed(2) + ' Dr' : selectedCustomer.openingBalance < 0 ? '₹' + Math.abs(selectedCustomer.openingBalance).toFixed(2) + ' Cr' : '₹0.00'}
                   </div>
                 )}
              </div>
              <div className="relative">
                <div className="flex w-full relative">
                  <input value={customerSearch} onChange={e => { setCustomerSearch(e.target.value); setShowCustomerDD(true); }} onFocus={() => setShowCustomerDD(true)} className="erp-input w-full pr-24" placeholder="Search customer..." />
                  <button type="button" onClick={() => setShowCustomerDD(!showCustomerDD)} className="absolute right-8 top-1.5 text-slate-400 hover:text-slate-600 bg-white px-1">
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
                {selectedCustomer && (
                   <span className={`absolute right-1 top-1 text-[9px] px-1.5 py-1 rounded font-bold uppercase tracking-wider ${selectedCustomer.priceCategory === 'Wholesale' ? 'bg-purple-100 text-purple-700' : 'bg-action-100 text-action-600'}`}>
                      {selectedCustomer.priceCategory === 'Wholesale' ? 'Wholesaler' : 'Retailer'}
                   </span>
                )}
                {showCustomerDD && filteredCustomers.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 z-50 max-h-40 overflow-y-auto shadow-2xl">
                    {filteredCustomers.map(c => (
                      <div key={c._id} onClick={() => pickCustomer(c)} className="px-2 py-1 text-xs hover:bg-slate-100 cursor-pointer border-b border-slate-200">
                        {c.name} {c.mobile ? `- ${c.mobile}` : ''}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Row 2 */}
            <div>
              <label className="erp-label block mb-1">Place of Supply <span className="text-red-500">*</span></label>
              <select value={placeOfSupply} onChange={e => setPlaceOfSupply(e.target.value)} className="erp-input w-full">
                {STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="erp-label block mb-1">Return Bill No. <span className="text-red-500">*</span></label>
              <input value={salesReturnNumber} onChange={e => setsalesReturnNumber(e.target.value)} className="erp-input w-full" />
            </div>
            <div>
              <label className="erp-label block mb-1">Original Invoice No.</label>
              <div className="flex w-full">
                <input value={searchInvoiceNo} onChange={e => setSearchInvoiceNo(e.target.value)} placeholder="Invoice No" className="erp-input w-full rounded-r-none" />
                <button onClick={fetchOriginalInvoice} disabled={isFetchingInvoice || !searchInvoiceNo} className="bg-blue-600 hover:bg-blue-700 text-white px-3 border border-blue-600 rounded-r flex items-center justify-center transition disabled:opacity-50">
                  {isFetchingInvoice ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Fetch'}
                </button>
              </div>
            </div>
            
            {/* Hidden / Extra fields */}
            <div className="col-span-3 grid grid-cols-4 gap-x-2 gap-y-1 mt-2 p-2 bg-slate-50 border border-slate-200 rounded">
              <div>
                <label className="erp-label block mb-1 text-[10px]">Due Date</label>
                <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="erp-input w-full text-xs" />
              </div>
              <div className="flex flex-col justify-center pt-3">
                 <label className="flex items-center gap-1 text-[10px] cursor-pointer mb-1">
                   <input type="radio" checked={billTo === 'Cash'} onChange={() => setBillTo('Cash')} className="accent-white" /> Cash A/c
                 </label>
                 <label className="flex items-center gap-1 text-[10px] cursor-pointer">
                   <input type="radio" checked={billTo === 'Customer'} onChange={() => setBillTo('Customer')} className="accent-white" /> Customer A/c
                 </label>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Particulars Input */}"""

sales_content = re.sub(pattern, new_grid_sales, sales_content)

with open(sales_page_path, 'w', encoding='utf-8') as f:
    f.write(sales_content)


# Fix routing for purchase returns
pur_page_path = os.path.join(frontend_dir, "app/dashboard/purchases/returns/new/page.tsx")
with open(pur_page_path, 'r', encoding='utf-8') as f:
    pur_content = f.read()

pur_content = pur_content.replace("'/dashboard/purchaseReturns'", "'/dashboard/purchases/returns'")

with open(pur_page_path, 'w', encoding='utf-8') as f:
    f.write(pur_content)

pur_edit_path = os.path.join(frontend_dir, "app/dashboard/purchases/returns/[id]/edit/page.tsx")
with open(pur_edit_path, 'r', encoding='utf-8') as f:
    pur_edit_content = f.read()

pur_edit_content = pur_edit_content.replace("'/dashboard/purchaseReturns'", "'/dashboard/purchases/returns'")

with open(pur_edit_path, 'w', encoding='utf-8') as f:
    f.write(pur_edit_content)


print("Done")
