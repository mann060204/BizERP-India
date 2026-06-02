import os

frontend_dir = r"d:\ERP WEBSITE\erp-frontend"

# Update sales return new page
sales_page_path = os.path.join(frontend_dir, "app/dashboard/sales/returns/new/page.tsx")
with open(sales_page_path, 'r', encoding='utf-8') as f:
    sales_content = f.read()

# 1. Add state for fetch
state_inject = """  const [lastPriceInfo, setLastPriceInfo] = useState<{ price: number, date: string } | null>(null);
  
  const [searchInvoiceNo, setSearchInvoiceNo] = useState('');
  const [isFetchingInvoice, setIsFetchingInvoice] = useState(false);
"""
sales_content = sales_content.replace(
    "  const [lastPriceInfo, setLastPriceInfo] = useState<{ price: number, date: string } | null>(null);",
    state_inject
)

# 2. Add fetchOriginalInvoice function
fetch_logic = """
  const fetchOriginalInvoice = async () => {
    if (!searchInvoiceNo) return;
    setIsFetchingInvoice(true);
    try {
      const res = await invoicesApi.list({ invoiceNumber: searchInvoiceNo, limit: 1 });
      const invoices = res.data.invoices;
      if (!invoices || invoices.length === 0) {
        toast.error('Invoice not found');
        return;
      }
      const inv = invoices[0];
      
      // Populate customer
      if (inv.customerId) {
        const c = customers.find(x => x._id === inv.customerId._id || x._id === inv.customerId);
        if (c) pickCustomer(c);
      } else {
        setCustomerSearch(inv.customerSnapshot?.name || 'Walk-in Customer');
        setSelectedCustomer(null);
      }
      
      setPlaceOfSupply(inv.placeOfSupply || 'Gujarat');
      setIsInterState(inv.isInterState || false);
      
      // Populate line items
      const newItems = inv.lineItems.map((item: any) => ({
        ...item,
        productId: item.productId?._id || item.productId,
        productName: item.productName || item.name,
      }));
      setLineItems(newItems.map((item: any) => calculateItem(item)));
      
      toast.success('Original Invoice Fetched');
    } catch (err) {
      toast.error('Failed to fetch invoice');
    } finally {
      setIsFetchingInvoice(false);
    }
  };

  const pickCustomer = (c: Customer) => {"""

sales_content = sales_content.replace(
    "  const pickCustomer = (c: Customer) => {",
    fetch_logic
)

# 3. Add UI
ui_inject = """            <div className="col-span-6 flex items-end gap-2 bg-slate-100 p-2 rounded mb-2">
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
            </div>

            <div>
              <label className="erp-label">Sales Return Type</label>"""

sales_content = sales_content.replace(
    """            <div>
              <label className="erp-label">Sales Return Type</label>""",
    ui_inject
)

with open(sales_page_path, 'w', encoding='utf-8') as f:
    f.write(sales_content)


# Update purchase return new page
pur_page_path = os.path.join(frontend_dir, "app/dashboard/purchases/returns/new/page.tsx")
with open(pur_page_path, 'r', encoding='utf-8') as f:
    pur_content = f.read()

# 1. Add state for fetch
state_inject_pur = """  const [lastPrices, setLastPrices] = useState<any[]>([]);
  
  const [searchBillNo, setSearchBillNo] = useState('');
  const [isFetchingBill, setIsFetchingBill] = useState(false);
"""
pur_content = pur_content.replace(
    "  const [lastPrices, setLastPrices] = useState<any[]>([]);",
    state_inject_pur
)

# 2. Add fetch logic
fetch_logic_pur = """
  const fetchOriginalBill = async () => {
    if (!searchBillNo) return;
    setIsFetchingBill(true);
    try {
      const res = await purchasesApi.list({ billNumber: searchBillNo, limit: 1 });
      const purchases = res.data.purchases;
      if (!purchases || purchases.length === 0) {
        toast.error('Purchase bill not found');
        return;
      }
      const pb = purchases[0];
      
      // Populate supplier
      if (pb.supplierId) {
        const s = suppliers.find(x => x._id === pb.supplierId._id || x._id === pb.supplierId);
        if (s) pickSupplier(s);
      } else {
        setSupplierSearch(pb.supplierSnapshot?.name || 'Walk-in Supplier');
        setSupplierSnapshot(pb.supplierSnapshot);
        setSupplierId('');
      }
      
      setPlaceOfSupply(pb.isInterState ? 'Other' : 'Gujarat');
      
      // Populate line items
      const newItems = pb.lineItems.map((item: any) => ({
        ...item,
        productId: item.productId?._id || item.productId,
        productName: item.productName || item.name,
      }));
      setLineItems(newItems.map((item: any) => calculateItem(item)));
      
      toast.success('Original Purchase Bill Fetched');
    } catch (err) {
      toast.error('Failed to fetch purchase bill');
    } finally {
      setIsFetchingBill(false);
    }
  };

  const pickSupplier = (s: Supplier) => {"""

pur_content = pur_content.replace(
    "  const pickSupplier = (s: Supplier) => {",
    fetch_logic_pur
)

# 3. Add UI
ui_inject_pur = """            <div className="col-span-6 flex items-end gap-2 bg-slate-100 p-2 rounded mb-2">
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
            </div>

            <div>
              <label className="erp-label">Purchase Return Type</label>"""

pur_content = pur_content.replace(
    """            <div>
              <label className="erp-label">Purchase Return Type</label>""",
    ui_inject_pur
)

with open(pur_page_path, 'w', encoding='utf-8') as f:
    f.write(pur_content)

print("Done")
