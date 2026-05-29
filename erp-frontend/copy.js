const fs = require('fs');
let newPage = fs.readFileSync('app/dashboard/sales/new/page.tsx', 'utf8');

// Replacements
newPage = newPage.replace('export default function CreateInvoicePage() {', 'export default function EditInvoicePage() {');
newPage = newPage.replace(/import \{ useRouter \} from 'next\/navigation';/, 'import { useRouter, useParams } from "next/navigation";');

// Add id parsing
newPage = newPage.replace('const router = useRouter();', 'const router = useRouter();\n  const { id } = useParams();');

// Add init hook after state declarations
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
        
        setPaymentMode(inv.paymentMode);
        setAmountReceived(inv.amountReceived);
        if (inv.paymentDate) setPaymentDate(new Date(inv.paymentDate).toISOString().split('T')[0]);
        setTxnId(inv.txnId || '');
        setPaymentMode2(inv.paymentMode2 || 'Cash');
        setAmountReceived2(inv.amountReceived2 || 0);
        if (inv.paymentDate2) setPaymentDate2(new Date(inv.paymentDate2).toISOString().split('T')[0]);
        setTxnId2(inv.txnId2 || '');
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

newPage = newPage.replace(/useEffect\(\(\) => \{\n    const fetchData = async \(\) => \{[\s\S]*?\}, \[\]\);/, initHook);

newPage = newPage.replace(/const handleSave = async \(saveStatus: 'draft' \| 'sent' \| 'paid'\) => \{/g, "const handleUpdate = async (saveStatus: 'draft' | 'sent' | 'paid') => {");
newPage = newPage.replace(/await invoicesApi\.create\(payload\);/g, "await invoicesApi.update(id, payload);");
newPage = newPage.replace(/toast\.success\(\`Invoice \$\{saveStatus === 'draft' \? 'Saved as Draft' : 'Created'\}\!\`\);/g, "toast.success('Invoice Updated!');");

// Button replacement
newPage = newPage.replace(/<Save className="w-4 h-4" \/> Save Invoice/g, '<Save className="w-4 h-4" /> Update Invoice');
// Because there is a "Save and Print" button that calls handleSave('paid')
newPage = newPage.replace(/handleSave\('/g, "handleUpdate('");

// Add 1 level up to all relative imports since edit is in [id]/edit instead of new/
newPage = newPage.replace(/\.\.\/\.\.\/\.\.\/\.\.\//g, '../../../../../');

fs.writeFileSync('app/dashboard/sales/[id]/edit/page.tsx', newPage);
console.log('Done');
