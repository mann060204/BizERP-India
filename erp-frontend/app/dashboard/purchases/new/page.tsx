'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Topbar from '../../../../components/layout/Topbar';
import { suppliersApi, productsApi, purchasesApi } from '../../../../lib/erp-api';
import { 
  Plus, Trash2, Search, Loader2, Save, CheckCircle, 
  Printer, RotateCcw, Calculator, Bell, Truck, Wallet, Hand, X, 
  Calendar, ChevronDown, User, MapPin, CreditCard, Barcode
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Supplier { _id: string; name: string; mobile?: string; gstin?: string; address?: string; }
interface Product { _id: string; name: string; purchasePrice: number; gstRate: number; hsnCode?: string; unit: string; mrp?: number; }
interface LineItem { 
  productId?: string; productName: string; hsnCode: string; batchNo: string; tag: string; description: string;
  quantity: number; unit: string; rate: number; mrp: number; discount: number; gstRate: number; cess: number;
  taxableAmount: number; cgst: number; sgst: number; igst: number; totalAmount: number; 
}

const PAYMENT_MODES = ['Cash', 'UPI', 'NEFT', 'RTGS', 'Cheque', 'Credit'];
const STATES = ['Andhra Pradesh','Assam','Bihar','Chhattisgarh','Delhi','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal'];

const round2 = (n: number) => Math.round(n * 100) / 100;

export default function NewPurchasePage() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Header State
  const [purchaseType, setPurchaseType] = useState('GST');
  const [billDate, setBillDate] = useState(new Date().toISOString().split('T')[0]);
  const [supplierSearch, setSupplierSearch] = useState('');
  const [showSupplierDD, setShowSupplierDD] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [paymentTerms, setPaymentTerms] = useState('');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [placeOfSupply, setPlaceOfSupply] = useState('Gujarat');
  const [billNumber, setBillNumber] = useState('');
  const [purchaseOrderNo, setPurchaseOrderNo] = useState('');
  const [purchaseOrderDate, setPurchaseOrderDate] = useState('');
  const [ewayBillNo, setEwayBillNo] = useState('');

  const [contactNo, setContactNo] = useState('');
  const [supplierAddress, setSupplierAddress] = useState('');
  const [supplierGstin, setSupplierGstin] = useState('');

  // Particulars (Input Row) State
  const [itemInput, setItemInput] = useState<LineItem>({
    productName: '', hsnCode: '', batchNo: '', tag: '', description: '',
    quantity: 1, unit: 'Nos', rate: 0, mrp: 0, discount: 0, gstRate: 18, cess: 0,
    taxableAmount: 0, cgst: 0, sgst: 0, igst: 0, totalAmount: 0
  });
  const [itemSearch, setItemSearch] = useState('');
  const [showItemDD, setShowItemDD] = useState(false);
  const [itemIdentifierType, setItemIdentifierType] = useState<'tag' | 'code'>('tag');

  // Main List
  const [lineItems, setLineItems] = useState<LineItem[]>([]);

  // Footer State
  const [showAdditionalDiscount, setShowAdditionalDiscount] = useState(false);
  const [additionalDiscount, setAdditionalDiscount] = useState(0);
  const [showShipping, setShowShipping] = useState(false);
  const [shippingCharge, setShippingCharge] = useState(0);
  const [remarks, setRemarks] = useState('');
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [amountPaid, setAmountPaid] = useState(0);
  const [txnId, setTxnId] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sRes, pRes] = await Promise.all([
          suppliersApi.list({ limit: 200 }),
          productsApi.list({ limit: 500 })
        ]);
        setSuppliers(sRes.data.suppliers);
        setProducts(pRes.data.products);
      } catch (err) {
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredSuppliers = suppliers.filter(s => s.name.toLowerCase().includes(supplierSearch.toLowerCase()));
  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(itemSearch.toLowerCase()));

  const pickSupplier = (s: Supplier) => {
    setSelectedSupplier(s);
    setSupplierSearch(s.name);
    setContactNo(s.mobile || '');
    setSupplierAddress(s.address || '');
    setSupplierGstin(s.gstin || '');
    setShowSupplierDD(false);
  };

  const pickProduct = (p: Product) => {
    setItemInput(prev => ({
      ...prev,
      productId: p._id,
      productName: p.name,
      hsnCode: p.hsnCode || '',
      rate: p.purchasePrice,
      mrp: p.mrp || p.purchasePrice,
      gstRate: p.gstRate,
      unit: p.unit
    }));
    setItemSearch(p.name);
    setShowItemDD(false);
  };

  // Determine if Inter-State based on placeOfSupply vs 'Gujarat' (assuming company state is Gujarat for now)
  const isInterState = placeOfSupply !== 'Gujarat';

  const calculateItem = (item: LineItem) => {
    const gross = item.quantity * item.rate;
    const discountAmt = (gross * item.discount) / 100;
    const taxableAmount = round2(gross - discountAmt);
    const cgst = isInterState ? 0 : round2((taxableAmount * item.gstRate) / 2 / 100);
    const sgst = isInterState ? 0 : round2((taxableAmount * item.gstRate) / 2 / 100);
    const igst = isInterState ? round2((taxableAmount * item.gstRate) / 100) : 0;
    const cessAmt = round2((taxableAmount * item.cess) / 100);
    return { ...item, taxableAmount, cgst, sgst, igst, totalAmount: round2(taxableAmount + cgst + sgst + igst + cessAmt) };
  };

  const addItem = () => {
    if (!itemInput.productName) { toast.error('Select an item first'); return; }
    const newItem = calculateItem(itemInput);
    setLineItems([...lineItems, newItem]);
    setItemInput({
      productName: '', hsnCode: '', batchNo: '', tag: '', description: '',
      quantity: 1, unit: 'Nos', rate: 0, mrp: 0, discount: 0, gstRate: 18, cess: 0,
      taxableAmount: 0, cgst: 0, sgst: 0, igst: 0, totalAmount: 0
    });
    setItemSearch('');
  };

  const removeItem = (idx: number) => setLineItems(lineItems.filter((_, i) => i !== idx));

  // Totals
  const totalTaxable = lineItems.reduce((s, i) => s + i.taxableAmount, 0);
  const totalCGST = lineItems.reduce((s, i) => s + i.cgst, 0);
  const totalSGST = lineItems.reduce((s, i) => s + i.sgst, 0);
  const totalIGST = lineItems.reduce((s, i) => s + i.igst, 0);
  const subtotal = round2(totalTaxable + totalCGST + totalSGST + totalIGST);
  const grandTotal = round2(subtotal - additionalDiscount + shippingCharge);
  const balance = round2(grandTotal - amountPaid);

  const handleSave = async (saveStatus: 'draft' | 'received' | 'paid') => {
    if (!billNumber.trim()) { toast.error('Purchase Bill No. is required'); return; }
    if (lineItems.length === 0) { toast.error('Add at least one item'); return; }
    setSaving(true);
    try {
      const payload = {
        purchaseType,
        billNumber,
        billDate,
        dueDate,
        placeOfSupply,
        purchaseOrderNo,
        purchaseOrderDate: purchaseOrderDate ? purchaseOrderDate : undefined,
        paymentTerms,
        ewayBillNo,
        supplierId: selectedSupplier?._id,
        supplierSnapshot: selectedSupplier ? {
          name: selectedSupplier.name,
          mobile: contactNo,
          gstin: supplierGstin,
          address: supplierAddress
        } : { name: supplierSearch || 'Cash Supplier' },
        isInterState,
        lineItems,
        additionalDiscount,
        shippingCharge,
        paymentMode,
        amountPaid,
        txnId,
        notes: remarks,
        status: saveStatus === 'paid' ? 'paid' : amountPaid > 0 ? 'partial' : saveStatus,
      };
      await purchasesApi.create(payload);
      toast.success(`Purchase Bill ${billNumber} Recorded!`);
      router.push('/dashboard/purchases');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to save purchase bill');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-[#F8FAFC]"><Loader2 className="w-10 h-10 animate-spin text-[#0F172A]" /></div>;

  return (
    <div className="flex flex-col h-screen bg-[#F8FAFC] text-[#0F172A] font-sans overflow-hidden">
      <Topbar title="Unsaved Purchase Bill" />

      {/* Tabs */}
      <div className="flex px-4 pt-2 border-b border-[#E2E8F0] bg-[#F1F5F9]">
         <div className="px-4 py-2 text-xs font-semibold bg-[#F1F5F9] border border-b-0 border-[#E2E8F0] rounded-t text-[#0F172A]">Purchase Bill</div>
         <div className="px-4 py-2 text-xs font-semibold text-[#64748B] hover:text-[#0F172A] cursor-pointer">Batch Numbers</div>
      </div>

      <main className="flex-1 overflow-y-auto p-1 space-y-1 pb-14 bg-[#F8FAFC]">
        
        {/* Section 1: Purchase bill information */}
        <div className="erp-container">
          <div className="erp-header py-1 text-xs">Purchase bill information</div>
          <div className="p-1.5 grid grid-cols-5 gap-x-2 gap-y-1">
            {/* Row 1 */}
            <div>
              <label className="erp-label block mb-1">Purchase Type <span className="text-red-500">*</span></label>
              <select value={purchaseType} onChange={e => setPurchaseType(e.target.value)} className="erp-input w-full">
                <option>GST</option>
                <option>NON-GST</option>
                <option>Bill of Supply</option>
              </select>
            </div>
            <div>
              <label className="erp-label block mb-1">Purchase Date</label>
              <input type="date" value={billDate} onChange={e => setBillDate(e.target.value)} className="erp-input w-full" />
            </div>
            <div>
              <label className="erp-label block mb-1">Supplier Name <span className="text-red-500">*</span></label>
              <div className="relative">
                <input value={supplierSearch} onChange={e => { setSupplierSearch(e.target.value); setShowSupplierDD(true); }} onFocus={() => setShowSupplierDD(true)} className="erp-input w-full" placeholder="Select or type..." />
                {showSupplierDD && filteredSuppliers.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-[#E2E8F0] z-50 max-h-40 overflow-y-auto shadow-2xl">
                    {filteredSuppliers.map(s => (
                      <div key={s._id} onClick={() => pickSupplier(s)} className="px-2 py-1 text-xs hover:bg-[#262626] cursor-pointer border-b border-[#E2E8F0]">
                        {s.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="erp-label block mb-1">Payment Terms (Credit Period)</label>
              <select value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)} className="erp-input w-full">
                <option value="">Select...</option>
                <option value="Net 0">Due on Receipt</option>
                <option value="Net 15">Net 15</option>
                <option value="Net 30">Net 30</option>
              </select>
            </div>
            <div>
              <label className="erp-label block mb-1">Due Date</label>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="erp-input w-full" />
            </div>

            {/* Row 2 */}
            <div>
              <label className="erp-label block mb-1">Place of Supply <span className="text-red-500">*</span></label>
              <select value={placeOfSupply} onChange={e => setPlaceOfSupply(e.target.value)} className="erp-input w-full">
                {STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="erp-label block mb-1">Purchase Bill No.</label>
              <input value={billNumber} onChange={e => setBillNumber(e.target.value)} className="erp-input w-full" />
            </div>
            <div>
              <label className="erp-label block mb-1">Purchase Order No.</label>
              <input value={purchaseOrderNo} onChange={e => setPurchaseOrderNo(e.target.value)} className="erp-input w-full" />
            </div>
            <div>
              <label className="erp-label block mb-1">Purchase Order Date</label>
              <input type="date" value={purchaseOrderDate} onChange={e => setPurchaseOrderDate(e.target.value)} className="erp-input w-full" />
            </div>
            <div>
              <label className="erp-label block mb-1">E-Way Bill No.</label>
              <input value={ewayBillNo} onChange={e => setEwayBillNo(e.target.value)} className="erp-input w-full" />
            </div>
          </div>
        </div>

        {/* Section 2: Particulars Input */}
        <div className="erp-container">
          <div className="erp-header py-1 text-xs flex justify-between items-center">
            <span>Particulars</span>
          </div>
          <div className="p-1.5 space-y-1">
            <div className="grid grid-cols-[1fr_2fr_0.8fr_0.8fr_1fr_0.8fr_0.8fr_0.8fr_1fr_auto] gap-2 items-end">
              <div>
                <label className="erp-label block mb-1">Batch No.</label>
                <input value={itemInput.batchNo} onChange={e => setItemInput({...itemInput, batchNo: e.target.value})} className="erp-input w-full bg-[#1a1a00] text-yellow-100 placeholder-yellow-900/50" placeholder="||||||" />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                   <label className="erp-label block">Item Name <span className="text-red-500">*</span></label>
                   <span className="text-[10px] text-blue-500 hover:text-blue-400 cursor-pointer underline">Add Item</span>
                </div>
                <div className="relative">
                  <input value={itemSearch} onChange={e => { setItemSearch(e.target.value); setShowItemDD(true); }} onFocus={() => setShowItemDD(true)} className="erp-input w-full" placeholder="Select item..." />
                  {showItemDD && filteredProducts.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-white border border-[#E2E8F0] z-50 max-h-40 overflow-y-auto shadow-2xl">
                      {filteredProducts.map(p => (
                        <div key={p._id} onClick={() => pickProduct(p)} className="px-2 py-1 text-xs hover:bg-[#262626] cursor-pointer border-b border-[#E2E8F0] flex justify-between">
                          <span>{p.name}</span>
                          <span className="text-[#475569]">₹{p.purchasePrice}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="erp-label block mb-1">Unit <span className="text-red-500">*</span></label>
                <select value={itemInput.unit} onChange={e => setItemInput({...itemInput, unit: e.target.value})} className="erp-input w-full uppercase">
                  <option>NOS</option><option>KGS</option><option>PCS</option><option>MTR</option><option>BOX</option>
                </select>
              </div>
              <div>
                <label className="erp-label block mb-1">Quantity <span className="text-red-500">*</span></label>
                <input type="number" value={itemInput.quantity === 0 ? '' : itemInput.quantity} onChange={e => setItemInput({...itemInput, quantity: parseFloat(e.target.value) || 0})} className="erp-input w-full" />
              </div>
              <div>
                <label className="erp-label block mb-1">Purchase Price <span className="text-red-500">*</span></label>
                <div className="flex">
                   <span className="bg-[#1e3a8a] text-[#0F172A] px-2 py-1 text-xs border border-[#E2E8F0] border-r-0 flex items-center">₹</span>
                   <input type="number" value={itemInput.rate === 0 ? '' : itemInput.rate} onChange={e => setItemInput({...itemInput, rate: parseFloat(e.target.value) || 0})} className="erp-input w-full rounded-none" />
                </div>
              </div>
              <div>
                <label className="erp-label block mb-1">Disc. (%)</label>
                <div className="flex">
                  <input type="number" value={itemInput.discount === 0 ? '' : itemInput.discount} onChange={e => setItemInput({...itemInput, discount: parseFloat(e.target.value) || 0})} className="erp-input w-full rounded-none" />
                  <span className="bg-[#1e3a8a] text-[#0F172A] px-2 py-1 text-xs border border-[#E2E8F0] border-l-0 flex items-center">%</span>
                </div>
              </div>
              <div>
                <label className="erp-label block mb-1">Tax (%)</label>
                <input type="number" value={itemInput.gstRate === 0 ? '' : itemInput.gstRate} onChange={e => setItemInput({...itemInput, gstRate: parseFloat(e.target.value) || 0})} className="erp-input w-full" />
              </div>
              <div>
                 <label className="erp-label block mb-1">Cess (%)</label>
                 <input type="number" value={itemInput.cess === 0 ? '' : itemInput.cess} onChange={e => setItemInput({...itemInput, cess: parseFloat(e.target.value) || 0})} className="erp-input w-full" />
               </div>
              <div>
                <label className="erp-label block mb-1">Amount <span className="text-red-500">*</span></label>
                <div className="flex">
                   <span className="bg-[#1e3a8a] text-[#0F172A] px-2 py-1 text-xs border border-[#E2E8F0] border-r-0 flex items-center">₹</span>
                   <div className="erp-input w-full rounded-none bg-[#0a0a0a] flex items-center">{calculateItem(itemInput).totalAmount > 0 ? calculateItem(itemInput).totalAmount.toFixed(2) : ''}</div>
                </div>
              </div>
              <div className="flex items-center justify-center pb-[2px]">
                 <button onClick={addItem} className="bg-green-600 hover:bg-green-700 text-[#0F172A] p-1 rounded-sm w-7 h-7 flex items-center justify-center transition">
                   <Plus className="w-5 h-5" />
                 </button>
              </div>
            </div>
            
            <div className="grid grid-cols-[1fr_8fr] gap-2 items-center pt-1">
               <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1 text-[11px] cursor-pointer">
                    <input type="radio" checked={itemIdentifierType === 'tag'} onChange={() => setItemIdentifierType('tag')} className="accent-white" /> Item Tag
                  </label>
                  <label className="flex items-center gap-1 text-[11px] cursor-pointer">
                    <input type="radio" checked={itemIdentifierType === 'code'} onChange={() => setItemIdentifierType('code')} className="accent-white" /> Item Code
                  </label>
               </div>
               <div>
                 <input value={itemInput.description} onChange={e => setItemInput({...itemInput, description: e.target.value})} className="erp-input w-full" placeholder="Item Description" />
               </div>
            </div>
          </div>
        </div>

        {/* Section 3: Item Grid */}
        <div className="erp-container flex-1 overflow-hidden flex flex-col min-h-[150px]">
           <div className="grid grid-cols-11 bg-[#F1F5F9] text-[#64748B] text-[10px] font-bold uppercase tracking-wider sticky top-0 z-10 border-b border-[#E2E8F0]">
             <div className="border-r border-[#E2E8F0] px-2 py-1.5 text-center">S. No.</div>
             <div className="border-r border-[#E2E8F0] px-2 py-1.5 text-center">Item Name</div>
             <div className="border-r border-[#E2E8F0] px-2 py-1.5 text-center">Quantity</div>
             <div className="border-r border-[#E2E8F0] px-2 py-1.5 text-center">Unit</div>
             <div className="border-r border-[#E2E8F0] px-2 py-1.5 text-center">Price/Unit</div>
             <div className="border-r border-[#E2E8F0] px-2 py-1.5 text-center">Disc (%)</div>
             <div className="border-r border-[#E2E8F0] px-2 py-1.5 text-center">Tax (%)</div>
             <div className="border-r border-[#E2E8F0] px-2 py-1.5 text-center">Cess (%)</div>
             <div className="col-span-3 px-2 py-1.5 text-center">Amount</div>
           </div>
           
           <div className="flex-1 overflow-y-auto bg-[#1a1a1a]">
              {lineItems.length === 0 ? (
                <div className="p-10 text-center text-[#475569] italic text-sm"></div>
              ) : (
                lineItems.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-11 erp-grid-row group text-[11px]">
                    <div className="border-r border-[#1a1a1a] px-2 py-1.5 text-center text-[#475569]">{idx + 1}</div>
                    <div className="border-r border-[#1a1a1a] px-2 py-1.5 font-medium">
                      {item.productName}
                      {item.tag && <span className="ml-2 text-[9px] bg-[#E2E8F0] px-1 rounded text-[#64748B]">{item.tag}</span>}
                    </div>
                    <div className="border-r border-[#1a1a1a] px-2 py-1.5 text-center">{item.quantity}</div>
                    <div className="border-r border-[#1a1a1a] px-2 py-1.5 text-center">{item.unit}</div>
                    <div className="border-r border-[#1a1a1a] px-2 py-1.5 text-right">₹{item.rate.toFixed(2)}</div>
                    <div className="border-r border-[#1a1a1a] px-2 py-1.5 text-center">{item.discount || ''}</div>
                    <div className="border-r border-[#1a1a1a] px-2 py-1.5 text-center">{item.gstRate}</div>
                    <div className="border-r border-[#1a1a1a] px-2 py-1.5 text-center">{item.cess || ''}</div>
                    <div className="col-span-3 px-2 py-1.5 text-right font-medium flex justify-between items-center group-hover:bg-[#1a1a1a]">
                      <span>₹{item.totalAmount.toFixed(2)}</span>
                      <button onClick={() => removeItem(idx)} className="opacity-0 group-hover:opacity-100 p-0.5 text-red-500 hover:text-red-400 transition">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
           </div>
        </div>

        {/* Section 4: Footer */}
        <div className="grid grid-cols-4 gap-4 mt-1">
           <div className="col-span-1 space-y-2">
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input type="checkbox" checked={showAdditionalDiscount} onChange={e => setShowAdditionalDiscount(e.target.checked)} className="accent-white" />
                <span className="text-[#d4d4d4]">Add'l Discount</span>
              </label>
              {showAdditionalDiscount && (
                <div className="flex">
                   <span className="bg-[#1e3a8a] text-[#0F172A] px-2 py-1 text-xs border border-[#E2E8F0] border-r-0 flex items-center">₹</span>
                   <input type="number" value={additionalDiscount === 0 ? '' : additionalDiscount} onChange={e => setAdditionalDiscount(parseFloat(e.target.value) || 0)} className="erp-input w-full rounded-none" />
                </div>
              )}

              <label className="flex items-center gap-2 text-xs cursor-pointer pt-2">
                <input type="checkbox" checked={showShipping} onChange={e => setShowShipping(e.target.checked)} className="accent-white" />
                <span className="text-[#d4d4d4]">Add Shipping</span>
              </label>
              {showShipping && (
                <div className="flex">
                   <span className="bg-[#1e3a8a] text-[#0F172A] px-2 py-1 text-xs border border-[#E2E8F0] border-r-0 flex items-center">₹</span>
                   <input type="number" value={shippingCharge === 0 ? '' : shippingCharge} onChange={e => setShippingCharge(parseFloat(e.target.value) || 0)} className="erp-input w-full rounded-none" />
                </div>
              )}
           </div>

           <div className="col-span-1">
              <div className="erp-container border-[#E2E8F0]">
                <div className="erp-header bg-transparent border-none py-1">Remarks (Private Use)</div>
                <textarea value={remarks} onChange={e => setRemarks(e.target.value)} className="erp-input w-full h-12 resize-none border-none border-t border-[#E2E8F0]" />
              </div>
           </div>

           <div className="col-span-1">
              <div className="erp-container border-[#E2E8F0]">
                <div className="erp-header bg-transparent border-none py-1">Payments</div>
                <div className="p-2 space-y-2 border-t border-[#E2E8F0]">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#64748B] w-12">Mode</span>
                    <select value={paymentMode} onChange={e => setPaymentMode(e.target.value)} className="erp-input flex-1">
                      {PAYMENT_MODES.map(m => <option key={m}>{m}</option>)}
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#64748B] w-12">Txn. ID</span>
                    <input value={txnId} onChange={e => setTxnId(e.target.value)} className="erp-input flex-1" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#64748B] w-12">Amount</span>
                    <div className="flex flex-1">
                       <span className="bg-[#1e3a8a] text-[#0F172A] px-2 py-1 text-[10px] border border-[#E2E8F0] border-r-0 flex items-center">₹</span>
                       <input type="number" value={amountPaid === 0 ? '' : amountPaid} onChange={e => setAmountPaid(parseFloat(e.target.value) || 0)} className="erp-input w-full rounded-none" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#64748B] w-12">Balance</span>
                    <div className="flex flex-1">
                       <span className="bg-[#1e3a8a] text-[#0F172A] px-2 py-1 text-[10px] border border-[#E2E8F0] border-r-0 flex items-center">₹</span>
                       <div className="erp-input w-full rounded-none bg-[#0a0a0a] flex items-center">{balance.toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              </div>
           </div>

           <div className="col-span-1">
              <div className="erp-container border-[#E2E8F0] h-full flex flex-col p-3 space-y-2">
                 <div className="flex justify-between items-center">
                   <span className="text-xs font-bold">Sub Total</span>
                   <span className="text-sm font-bold">₹ {subtotal.toFixed(2)}</span>
                 </div>
                 <div className="flex justify-between items-center">
                   <span className="text-xs font-bold uppercase">Total Amount</span>
                   <span className="text-sm font-bold">₹ {grandTotal.toFixed(2)}</span>
                 </div>
              </div>
           </div>
        </div>

      </main>

      {/* Bottom Toolbar */}
      <footer className="fixed bottom-0 left-0 right-0 h-12 bg-[#F1F5F9] border-t border-[#E2E8F0] flex items-center justify-between px-4 z-50">
          <div className="flex gap-4">
             <Bell className="w-5 h-5 text-[#475569] hover:text-[#0F172A] cursor-pointer" />
             <Calculator className="w-5 h-5 text-[#475569] hover:text-[#0F172A] cursor-pointer" />
             <Truck className="w-5 h-5 text-[#475569] hover:text-[#0F172A] cursor-pointer" />
             <Barcode className="w-5 h-5 text-[#475569] hover:text-[#0F172A] cursor-pointer" />
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => handleSave('received')} disabled={saving} className="bg-[#1e3a8a] hover:bg-blue-800 text-[#0F172A] px-6 py-1.5 rounded flex items-center gap-2 text-xs font-bold transition">
              <Printer className="w-4 h-4" /> Save and Print
            </button>
            <button onClick={() => handleSave('received')} disabled={saving} className="bg-blue-800 hover:bg-blue-900 text-[#0F172A] px-6 py-1.5 rounded flex items-center gap-2 text-xs font-bold transition">
              <Save className="w-4 h-4" /> Save
            </button>
          </div>
      </footer>
    </div>
  );
}
