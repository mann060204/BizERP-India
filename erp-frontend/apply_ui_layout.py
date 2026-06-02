import os

frontend_dir = r"d:\ERP WEBSITE\erp-frontend"

# 1. Update purchase return new page
pur_page_path = os.path.join(frontend_dir, "app/dashboard/purchases/returns/new/page.tsx")
with open(pur_page_path, 'r', encoding='utf-8') as f:
    pur_content = f.read()

# I need to remove the top fetch bar
pur_content = pur_content.replace("""            <div className="col-span-6 flex items-end gap-2 bg-slate-100 p-2 rounded mb-2">
              <div className="flex-1">
                <label className="erp-label">Fetch Original Purchase Bill</label>
                <div className="flex gap-2">
                  <input value={searchBillNo} onChange={e => setSearchBillNo(e.target.value)} placeholder="Enter exact Bill No" className="erp-input w-full" />
                  <button onClick={fetchOriginalBill} disabled={isFetchingBill || !searchBillNo} className="btn-action bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 flex items-center gap-1 shrink-0">
                    {isFetchingBill ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    Fetch Details
                  </button>
                </div>
              </div>
            </div>""", "")

# Replace the grid layout for purchase returns
# Note: Currently grid is: <div className="p-1.5 grid grid-cols-5 gap-x-2 gap-y-1">
# It has: Type, Date, Supplier, Payment Terms, Due Date, Place of Supply, Return No, Order No, Order Date, E-Way Bill

old_grid = """          <div className="p-1.5 grid grid-cols-5 gap-x-2 gap-y-1">
            <div>
              <label className="erp-label block mb-1">purchaseReturn Type <span className="text-red-500">*</span></label>
              <select value={purchaseReturnType} onChange={e => setpurchaseReturnType(e.target.value)} className="erp-input w-full">
                <option>GST</option>
                <option value="Non-GST">Non-GST</option>
                <option>Bill of Supply</option>
              </select>
            </div>
            <div>
              <label className="erp-label block mb-1">purchaseReturn Date</label>
              <input type="date" value={billDate} onChange={e => setBillDate(e.target.value)} className="erp-input w-full" />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                 <label className="erp-label block">Supplier Name <span className="text-red-500">*</span></label>
                 <div className="flex gap-2">
                   {supplierId && supplierSnapshot && (
                     <span onClick={() => setShowEditSupplierModal(true)} className="text-[10px] text-blue-600 hover:text-blue-800 cursor-pointer underline flex items-center"><Edit className="w-3 h-3 mr-0.5" /> Edit</span>
                   )}
                   <span onClick={() => setShowQuickAddSupplierModal(true)} className="text-[10px] text-blue-600 hover:text-blue-800 cursor-pointer underline flex items-center"><Plus className="w-3 h-3 mr-0.5" /> Add</span>
                 </div>
              </div>
              <div className="relative">
                <div className="flex w-full relative">
                  <input value={supplierSearch} onChange={e => { setSupplierSearch(e.target.value); setShowSupplierDD(true); }} onFocus={() => setShowSupplierDD(true)} className="erp-input w-full pr-8" placeholder="Select or type..." />
                  <button type="button" onClick={() => setShowSupplierDD(!showSupplierDD)} className="absolute right-2 top-1.5 text-slate-400 hover:text-slate-600 bg-white px-1">
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
                {showSupplierDD && filteredSuppliers.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 z-50 max-h-40 overflow-y-auto shadow-2xl">
                    {filteredSuppliers.map(s => (
                      <div key={s._id} onClick={() => pickSupplier(s)} className="px-2 py-1 text-xs hover:bg-slate-100 cursor-pointer border-b border-slate-200">
                        {s.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="erp-label block mb-1">Payment Terms (Credit Period)</label>
              <input 
                list="paymentTermsOptions" 
                value={paymentTerms} 
                onChange={e => setPaymentTerms(e.target.value)} 
                className="erp-input w-full"
                placeholder="e.g. Net 30 or 45 days"
              />
              <datalist id="paymentTermsOptions">
                <option value="Due on Receipt" />
                <option value="Net 15" />
                <option value="Net 30" />
                <option value="Net 45" />
                <option value="Net 60" />
              </datalist>
            </div>
            <div>
              <label className="erp-label block mb-1">Due Date</label>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="erp-input w-full" />
            </div>

            <div>
              <label className="erp-label block mb-1">Place of Supply <span className="text-red-500">*</span></label>
              <select value={placeOfSupply} onChange={e => setPlaceOfSupply(e.target.value)} className="erp-input w-full">
                {STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="erp-label block mb-1">purchaseReturn Return No.</label>
              <input value={billNumber} onChange={e => setBillNumber(e.target.value)} className="erp-input w-full" />
            </div>
            <div>
              <label className="erp-label block mb-1">purchaseReturn Order No.</label>
              <input value={purchaseReturnOrderNo} onChange={e => setpurchaseReturnOrderNo(e.target.value)} className="erp-input w-full" />
            </div>
            <div>
              <label className="erp-label block mb-1">purchaseReturn Order Date</label>
              <input type="date" value={purchaseReturnOrderDate} onChange={e => setpurchaseReturnOrderDate(e.target.value)} className="erp-input w-full" />
            </div>
            <div>
              <label className="erp-label block mb-1">E-Way Bill No.</label>
              <input value={ewayBillNo} onChange={e => setEwayBillNo(e.target.value)} className="erp-input w-full" />
            </div>
          </div>"""

new_grid = """          <div className="p-2 grid grid-cols-3 gap-x-4 gap-y-3">
            {/* Row 1 */}
            <div>
              <label className="erp-label block mb-1">Return Type <span className="text-red-500">*</span></label>
              <select value={purchaseReturnType} onChange={e => setpurchaseReturnType(e.target.value)} className="erp-input w-full">
                <option>GST</option>
                <option value="Non-GST">Non-GST</option>
                <option>Bill of Supply</option>
              </select>
            </div>
            <div>
              <label className="erp-label block mb-1">Date</label>
              <input type="date" value={billDate} onChange={e => setBillDate(e.target.value)} className="erp-input w-full" />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                 <label className="erp-label block">Supplier Name <span className="text-red-500">*</span></label>
                 <div className="flex gap-2">
                   {supplierId && supplierSnapshot && (
                     <span onClick={() => setShowEditSupplierModal(true)} className="text-[10px] text-blue-600 hover:text-blue-800 cursor-pointer underline flex items-center"><Edit className="w-3 h-3 mr-0.5" /> Edit</span>
                   )}
                   <span onClick={() => setShowQuickAddSupplierModal(true)} className="text-[10px] text-blue-600 hover:text-blue-800 cursor-pointer underline flex items-center"><Plus className="w-3 h-3 mr-0.5" /> Add</span>
                 </div>
              </div>
              <div className="relative">
                <div className="flex w-full relative">
                  <input value={supplierSearch} onChange={e => { setSupplierSearch(e.target.value); setShowSupplierDD(true); }} onFocus={() => setShowSupplierDD(true)} className="erp-input w-full pr-8" placeholder="Select or type..." />
                  <button type="button" onClick={() => setShowSupplierDD(!showSupplierDD)} className="absolute right-2 top-1.5 text-slate-400 hover:text-slate-600 bg-white px-1">
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
                {showSupplierDD && filteredSuppliers.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 z-50 max-h-40 overflow-y-auto shadow-2xl">
                    {filteredSuppliers.map(s => (
                      <div key={s._id} onClick={() => pickSupplier(s)} className="px-2 py-1 text-xs hover:bg-slate-100 cursor-pointer border-b border-slate-200">
                        {s.name}
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
              <input value={billNumber} onChange={e => setBillNumber(e.target.value)} className="erp-input w-full" />
            </div>
            <div>
              <label className="erp-label block mb-1">Purchase Bill No.</label>
              <div className="flex w-full">
                <input value={searchBillNo} onChange={e => setSearchBillNo(e.target.value)} placeholder="Original Bill No" className="erp-input w-full rounded-r-none" />
                <button onClick={fetchOriginalBill} disabled={isFetchingBill || !searchBillNo} className="bg-blue-600 hover:bg-blue-700 text-white px-3 border border-blue-600 rounded-r flex items-center justify-center transition disabled:opacity-50">
                  {isFetchingBill ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Fetch'}
                </button>
              </div>
            </div>

            {/* Hidden / Extra fields moved to a details block or bottom */}
            <div className="col-span-3 grid grid-cols-5 gap-x-2 gap-y-1 mt-2 p-2 bg-slate-50 border border-slate-200 rounded">
              <div>
                <label className="erp-label block mb-1 text-[10px]">Payment Terms</label>
                <input list="paymentTermsOptions" value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)} className="erp-input w-full text-xs" />
              </div>
              <div>
                <label className="erp-label block mb-1 text-[10px]">Due Date</label>
                <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="erp-input w-full text-xs" />
              </div>
              <div>
                <label className="erp-label block mb-1 text-[10px]">Order No.</label>
                <input value={purchaseReturnOrderNo} onChange={e => setpurchaseReturnOrderNo(e.target.value)} className="erp-input w-full text-xs" />
              </div>
              <div>
                <label className="erp-label block mb-1 text-[10px]">Order Date</label>
                <input type="date" value={purchaseReturnOrderDate} onChange={e => setpurchaseReturnOrderDate(e.target.value)} className="erp-input w-full text-xs" />
              </div>
              <div>
                <label className="erp-label block mb-1 text-[10px]">E-Way Bill No.</label>
                <input value={ewayBillNo} onChange={e => setEwayBillNo(e.target.value)} className="erp-input w-full text-xs" />
              </div>
            </div>
          </div>"""

pur_content = pur_content.replace(old_grid, new_grid)

with open(pur_page_path, 'w', encoding='utf-8') as f:
    f.write(pur_content)


# 2. Update sales return new page
sales_page_path = os.path.join(frontend_dir, "app/dashboard/sales/returns/new/page.tsx")
with open(sales_page_path, 'r', encoding='utf-8') as f:
    sales_content = f.read()

# I need to remove the top fetch bar
sales_content = sales_content.replace("""            <div className="col-span-6 flex items-end gap-2 bg-slate-100 p-2 rounded mb-2">
              <div className="flex-1">
                <label className="erp-label">Fetch Original Invoice</label>
                <div className="flex gap-2">
                  <input value={searchInvoiceNo} onChange={e => setSearchInvoiceNo(e.target.value)} placeholder="Enter exact Invoice No (e.g. INV-2026-0001)" className="erp-input w-full" />
                  <button onClick={fetchOriginalInvoice} disabled={isFetchingInvoice || !searchInvoiceNo} className="btn-action bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 flex items-center gap-1 shrink-0">
                    {isFetchingInvoice ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    Fetch Details
                  </button>
                </div>
              </div>
            </div>""", "")

# Replace the grid layout for sales returns
# Note: Currently grid is: <div className="p-1.5 grid grid-cols-6 gap-x-2 gap-y-1">

old_grid_sales = """          <div className="p-1.5 grid grid-cols-6 gap-x-2 gap-y-1">
            <div>
              <label className="erp-label">Sales Return Type</label>
              <select value={salesReturnType} onChange={e => setsalesReturnType(e.target.value)} className="erp-input w-full">
                <option>GST</option>
                <option>NON-GST</option>
              </select>
            </div>
            <div>
              <label className="erp-label">Sales Return No. <span className="text-red-500">*</span></label>
              <input value={salesReturnNumber} onChange={e => setsalesReturnNumber(e.target.value)} className="erp-input w-full" />
            </div>
            <div>
              <label className="erp-label">Date</label>
              <input type="date" value={salesReturnDate} onChange={e => setsalesReturnDate(e.target.value)} className="erp-input w-full" />
            </div>
            <div>
              <label className="erp-label">Place of Supply <span className="text-red-500">*</span></label>
              <select value={placeOfSupply} onChange={e => setPlaceOfSupply(e.target.value)} className="erp-input w-full">
                {STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="erp-label">Due Date</label>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="erp-input w-full" />
            </div>
            <div className="flex items-center gap-2 pt-4">
               <label className="flex items-center gap-1 text-[10px] cursor-pointer">
                 <input type="radio" checked={billTo === 'Cash'} onChange={() => setBillTo('Cash')} className="accent-white" /> Cash A/c
               </label>
               <label className="flex items-center gap-1 text-[10px] cursor-pointer">
                 <input type="radio" checked={billTo === 'Customer'} onChange={() => setBillTo('Customer')} className="accent-white" /> Customer A/c
               </label>
            </div>

            <div className="col-span-2">
              <div className="flex justify-between items-center mb-1">
                 <label className="erp-label !mb-0 flex items-center gap-1.5">
                   Customer <span className="text-red-500">*</span>
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
            </div>"""

new_grid_sales = """          <div className="p-2 grid grid-cols-3 gap-x-4 gap-y-3">
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
          </div>"""

sales_content = sales_content.replace(old_grid_sales, new_grid_sales)

with open(sales_page_path, 'w', encoding='utf-8') as f:
    f.write(sales_content)

print("Done")
