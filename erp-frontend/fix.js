const fs = require('fs');
const file = 'app/dashboard/sales/[id]/edit/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace title
content = content.replace('New Sales Invoice', 'Edit Sales Invoice');

// Replace useEffect
const initHook = `
  useEffect(() => {
    const init = async () => {
      try {
        const [cRes, pRes, iRes] = await Promise.all([
          customersApi.list({ limit: 200 }),
          productsApi.list({ limit: 500 }),
          invoicesApi.get(id)
        ]);
        
        setCustomers(cRes.data.customers);
        setProducts(pRes.data.products);
        
        const inv = iRes.data.invoice;
        setInvoiceNumber(inv.invoiceNumber);
        if (inv.invoiceNumber.startsWith('GST')) setInvoiceType('GST');
        else if (inv.invoiceNumber.startsWith('NON-GST')) setInvoiceType('NON-GST');
        
        setInvoiceDate(new Date(inv.invoiceDate).toISOString().split('T')[0]);
        if (inv.dueDate) setDueDate(new Date(inv.dueDate).toISOString().split('T')[0]);
        setPlaceOfSupply(inv.placeOfSupply);
        setIsInterState(inv.isInterState);
        setBillTo(inv.billTo || 'Customer');
        setCustomerSearch(inv.customerSnapshot.name);
        setContactNo(inv.customerSnapshot.mobile || '');
        setCustomerAddress(inv.customerSnapshot.address || '');
        setCustomerGstin(inv.customerSnapshot.gstin || '');
        if (inv.customerId) setSelectedCustomer(cRes.data.customers.find(c => c._id === (inv.customerId._id || inv.customerId)));
        
        setLineItems(inv.lineItems.map(item => ({
          ...item,
          batchNo: item.batchNo || '',
          tag: item.tag || '',
          description: item.description || '',
          cess: item.cess || 0,
          mrp: item.mrp || item.rate,
          primaryUnit: item.primaryUnit || item.unit,
          secondaryUnit: item.secondaryUnit || item.unit,
          primaryRate: item.primaryRate || item.rate,
          selectedBaseRate: item.selectedBaseRate || item.rate
        })));
        
        // Wait, payment state variables may have different names in [id]/edit/page.tsx
        // because it was copied from new/page.tsx. Let's make sure it matches.
        
        setPaymentMode1(inv.paymentMode || 'Cash');
        setAmountReceived1(inv.amountReceived || 0);
        if (inv.paymentDate) setPaymentDate1(new Date(inv.paymentDate).toISOString().split('T')[0]);
        setTxnId1(inv.txnId || '');
        
        setShippingCharge(inv.shippingCharge || 0);
        setRemarks(inv.notes || '');
        setDeliveryTerms(inv.deliveryTerms || '');
        setSoldBy(inv.soldBy || '');
        
      } catch (e) {
        console.error(e);
        toast.error('Failed to load invoice');
        router.push('/dashboard/sales');
      } finally {
        setLoading(false);
      }
    };
    if (id) init();
  }, [id]);
`;

const regex = /useEffect\(\(\) => \{\r?\n\s*const fetchData = async \(\) => \{[\s\S]*?\}, \[\]\);/;
if (regex.test(content)) {
  content = content.replace(regex, initHook);
  fs.writeFileSync(file, content);
  console.log('Fixed page.tsx');
} else {
  console.log('Could not find useEffect fetchData in edit page');
}
