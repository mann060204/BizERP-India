'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Topbar from '../../../../components/layout/Topbar';
import { suppliersApi, productsApi, purchasesApi } from '../../../../lib/erp-api';
import { 
  Plus, Trash2, Search, Loader2, Save, CheckCircle, 
  Printer, RotateCcw, Calculator, Bell, Truck, Wallet, Hand, X, 
  Calendar, ChevronDown, User, MapPin, CreditCard
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
  const [billNumber, setBillNumber] = useState('');
  const [billDate, setBillDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [isInterState, setIsInterState] = useState(false);
  const [billTo, setBillTo] = useState<'Cash' | 'Supplier'>('Supplier');
  const [contactNo, setContactNo] = useState('');
  const [supplierSearch, setSupplierSearch] = useState('');
  const [showSupplierDD, setShowSupplierDD] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
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

  // Main List
  const [lineItems, setLineItems] = useState<LineItem[]>([]);

  // Footer State
  const [purchasedBy, setPurchasedBy] = useState('');
  const [deliveryTerms, setDeliveryTerms] = useState('');
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
  const totalQty = lineItems.reduce((s, i) => s + i.quantity, 0);
  const totalTaxable = lineItems.reduce((s, i) => s + i.taxableAmount, 0);
  const totalCGST = lineItems.reduce((s, i) => s + i.cgst, 0);
  const totalSGST = lineItems.reduce((s, i) => s + i.sgst, 0);
  const totalIGST = lineItems.reduce((s, i) => s + i.igst, 0);
  const grandTotal = round2(totalTaxable + totalCGST + totalSGST + totalIGST);
  const balance = round2(grandTotal - amountPaid);

  const handleSave = async (saveStatus: 'draft' | 'received' | 'paid') => {
    if (!billNumber.trim()) { toast.error('Bill Number is required'); return; }
    if (lineItems.length === 0) { toast.error('Add at least one item'); return; }
    setSaving(true);
    try {
      const payload = {
        billNumber,
        billDate,
        dueDate,
        supplierId: selectedSupplier?._id,
        supplierSnapshot: selectedSupplier ? {
          name: selectedSupplier.name,
          mobile: contactNo,
          gstin: supplierGstin,
          address: supplierAddress
        } : { name: supplierSearch || 'Cash Supplier' },
        isInterState,
        lineItems,
        paymentMode,
        amountPaid,
        txnId,
        notes: remarks,
        deliveryTerms,
        purchasedBy,
        billTo,
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

  if (loading) return <div className="flex h-screen items-center justify-center bg-black"><Loader2 className="w-10 h-10 animate-spin text-white" /></div>;

  return (
    <div className="flex flex-col h-screen bg-black text-white font-sans overflow-hidden">
      <Topbar title="Add Purchase Bill" />

      <main className="flex-1 overflow-y-auto p-2 space-y-2 pb-20">
        
        {/* Section 1: Bill Information */}
        <div className="erp-container">
          <div className="erp-header">Purchase Bill Information</div>
          <div className="p-2 grid grid-cols-6 gap-x-4 gap-y-2">
            <div>
              <label className="erp-label">Bill Number <span className="text-red-500">*</span></label>
              <input value={billNumber} onChange={e => setBillNumber(e.target.value)} className="erp-input w-full" placeholder="SUP-INV-001" />
            </div>
            <div>
              <label className="erp-label">Bill Date</label>
              <input type="date" value={billDate} onChange={e => setBillDate(e.target.value)} className="erp-input w-full" />
            </div>
            <div>
              <label className="erp-label">Due Date</label>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="erp-input w-full" />
            </div>
            <div className="flex items-center gap-2 pt-4 col-span-1">
               <label className="flex items-center gap-1 text-[10px] cursor-pointer">
                 <input type="radio" checked={billTo === 'Cash'} onChange={() => setBillTo('Cash')} className="accent-white" /> Cash A/c
               </label>
               <label className="flex items-center gap-1 text-[10px] cursor-pointer">
                 <input type="radio" checked={billTo === 'Supplier'} onChange={() => setBillTo('Supplier')} className="accent-white" /> Supplier A/c
               </label>
            </div>
            <div className="col-span-2 flex items-end pb-1">
                <label className="flex items-center gap-2 text-xs cursor-pointer group">
                  <input type="checkbox" checked={isInterState} onChange={e => setIsInterState(e.target.checked)} className="accent-white" />
                  <span className="text-[#94a3b8] group-hover:text-white transition">Inter-State Purchase (IGST)</span>
                </label>
            </div>

            <div className="col-span-2">
              <label className="erp-label">Supplier <span className="text-red-500">*</span></label>
              <div className="relative">
                <input value={supplierSearch} onChange={e => { setSupplierSearch(e.target.value); setShowSupplierDD(true); }} onFocus={() => setShowSupplierDD(true)} className="erp-input w-full" placeholder="Search supplier..." />
                {showSupplierDD && filteredSuppliers.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-[#0A0A0A] border border-[#1A1A1A] z-50 max-h-40 overflow-y-auto shadow-2xl">
                    {filteredSuppliers.map(s => (
                      <div key={s._id} onClick={() => pickSupplier(s)} className="px-2 py-1 text-xs hover:bg-[#262626] cursor-pointer border-b border-[#1A1A1A]">
                        {s.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="erp-label">Contact No.</label>
              <input value={contactNo} onChange={e => setContactNo(e.target.value)} className="erp-input w-full" />
            </div>
            <div className="col-span-2">
              <label className="erp-label">Address</label>
              <input value={supplierAddress} onChange={e => setSupplierAddress(e.target.value)} className="erp-input w-full" />
            </div>
            <div>
              <label className="erp-label">Supplier GSTIN</label>
              <input value={supplierGstin} onChange={e => setSupplierGstin(e.target.value)} className="erp-input w-full font-mono uppercase" />
            </div>
          </div>
        </div>

        {/* Section 2: Particulars Input */}
        <div className="erp-container">
          <div className="erp-header">Particulars</div>
          <div className="p-2 space-y-2">
            <div className="grid grid-cols-10 gap-2">
              <div className="col-span-1">
                <label className="erp-label">Batch No.</label>
                <input value={itemInput.batchNo} onChange={e => setItemInput({...itemInput, batchNo: e.target.value})} className="erp-input w-full bg-[#1a0000]" />
              </div>
              <div className="col-span-3">
                <label className="erp-label">Item Name <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input value={itemSearch} onChange={e => { setItemSearch(e.target.value); setShowItemDD(true); }} onFocus={() => setShowItemDD(true)} className="erp-input w-full" placeholder="Type item name..." />
                  {showItemDD && filteredProducts.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-[#0A0A0A] border border-[#1A1A1A] z-50 max-h-40 overflow-y-auto shadow-2xl">
                      {filteredProducts.map(p => (
                        <div key={p._id} onClick={() => pickProduct(p)} className="px-2 py-1 text-xs hover:bg-[#262626] cursor-pointer border-b border-[#1A1A1A] flex justify-between">
                          <span>{p.name}</span>
                          <span className="text-[#475569]">₹{p.purchasePrice}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="col-span-1">
                <label className="erp-label">Unit <span className="text-red-500">*</span></label>
                <select value={itemInput.unit} onChange={e => setItemInput({...itemInput, unit: e.target.value})} className="erp-input w-full">
                  <option>Nos</option><option>Kgs</option><option>Pcs</option><option>Mtr</option><option>Box</option>
                </select>
              </div>
              <div>
                <label className="erp-label">Quantity <span className="text-red-500">*</span></label>
                <input type="number" value={itemInput.quantity} onChange={e => setItemInput({...itemInput, quantity: parseFloat(e.target.value) || 0})} className="erp-input w-full" />
              </div>
              <div>
                <label className="erp-label">Pur Price</label>
                <div className="relative">
                   <span className="absolute left-1 top-1 text-[10px] text-[#475569]">₹</span>
                   <input type="number" value={itemInput.rate} onChange={e => setItemInput({...itemInput, rate: parseFloat(e.target.value) || 0})} className="erp-input w-full pl-3" />
                </div>
              </div>
              <div>
                <label className="erp-label">MRP</label>
                <div className="relative">
                   <span className="absolute left-1 top-1 text-[10px] text-[#475569]">₹</span>
                   <input type="number" value={itemInput.mrp} onChange={e => setItemInput({...itemInput, mrp: parseFloat(e.target.value) || 0})} className="erp-input w-full pl-3" />
                </div>
              </div>
              <div>
                <label className="erp-label">Disc. (%)</label>
                <input type="number" value={itemInput.discount} onChange={e => setItemInput({...itemInput, discount: parseFloat(e.target.value) || 0})} className="erp-input w-full" />
              </div>
              <div>
                <label className="erp-label">Tax (%)</label>
                <input type="number" value={itemInput.gstRate} onChange={e => setItemInput({...itemInput, gstRate: parseFloat(e.target.value) || 0})} className="erp-input w-full" />
              </div>
            </div>
            
            <div className="grid grid-cols-10 gap-2 items-end">
               <div className="col-span-1 flex flex-col gap-1">
                  <label className="flex items-center gap-1 text-[9px] cursor-pointer"><input type="radio" checked className="accent-white" /> Item Tag</label>
                  <label className="flex items-center gap-1 text-[9px] cursor-pointer"><input type="radio" className="accent-white" /> Item Code</label>
               </div>
               <div className="col-span-1">
                 <input value={itemInput.tag} onChange={e => setItemInput({...itemInput, tag: e.target.value})} className="erp-input w-full" placeholder="Tag..." />
               </div>
               <div className="col-span-4">
                 <input value={itemInput.description} onChange={e => setItemInput({...itemInput, description: e.target.value})} className="erp-input w-full" placeholder="Item Description" />
               </div>
               <div>
                 <label className="erp-label">Cess (%)</label>
                 <input type="number" value={itemInput.cess} onChange={e => setItemInput({...itemInput, cess: parseFloat(e.target.value) || 0})} className="erp-input w-full" />
               </div>
               <div className="col-span-2">
                  <label className="erp-label">Amount</label>
                  <div className="erp-input w-full bg-[#001a00] text-emerald-400 font-bold">₹{calculateItem(itemInput).totalAmount.toFixed(2)}</div>
               </div>
               <button onClick={addItem} className="bg-blue-600 hover:bg-blue-700 text-white p-1 rounded flex items-center justify-center">
                 <Plus className="w-5 h-5" />
               </button>
            </div>
          </div>
        </div>

        {/* Section 3: Item Grid */}
        <div className="erp-container flex-1 overflow-hidden flex flex-col min-h-[300px]">
           <div className="grid grid-cols-12 erp-grid-header border-b border-[#1A1A1A]">
             <div className="col-span-1 erp-grid-cell">S.No</div>
             <div className="col-span-3 erp-grid-cell">Item Name</div>
             <div className="col-span-1 erp-grid-cell text-center">Qty</div>
             <div className="col-span-1 erp-grid-cell">Unit</div>
             <div className="col-span-1 erp-grid-cell text-right">Unit Price</div>
             <div className="col-span-1 erp-grid-cell text-center">Disc%</div>
             <div className="col-span-1 erp-grid-cell text-center">Tax%</div>
             <div className="col-span-1 erp-grid-cell text-center">Cess%</div>
             <div className="col-span-2 erp-grid-cell text-right">Total</div>
           </div>
           <div className="flex-1 overflow-y-auto bg-[#020202]">
              {lineItems.length === 0 ? (
                <div className="p-10 text-center text-[#262626] italic text-sm">No items added yet...</div>
              ) : (
                lineItems.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 erp-grid-row group">
                    <div className="col-span-1 erp-grid-cell text-[#475569]">{idx + 1}</div>
                    <div className="col-span-3 erp-grid-cell font-medium">
                      {item.productName}
                      {item.tag && <span className="ml-2 text-[9px] bg-[#1A1A1A] px-1 rounded text-[#94a3b8]">{item.tag}</span>}
                    </div>
                    <div className="col-span-1 erp-grid-cell text-center">{item.quantity}</div>
                    <div className="col-span-1 erp-grid-cell">{item.unit}</div>
                    <div className="col-span-1 erp-grid-cell text-right">₹{item.rate.toFixed(2)}</div>
                    <div className="col-span-1 erp-grid-cell text-center text-red-400">{item.discount}%</div>
                    <div className="col-span-1 erp-grid-cell text-center text-blue-400">{item.gstRate}%</div>
                    <div className="col-span-1 erp-grid-cell text-center">{item.cess}%</div>
                    <div className="col-span-2 erp-grid-cell text-right font-bold text-emerald-400 flex justify-between items-center">
                      <span>₹{item.totalAmount.toFixed(2)}</span>
                      <button onClick={() => removeItem(idx)} className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:bg-red-500/10 rounded">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
           </div>
        </div>

        {/* Section 4: Footer */}
        <div className="grid grid-cols-4 gap-2">
           <div className="erp-footer-box flex flex-col justify-between">
              <div>
                <label className="erp-label block mb-1">Total Quantity</label>
                <div className="text-xl font-bold bg-[#1a1a00] p-1 border border-yellow-900/30 text-yellow-400">{totalQty}</div>
              </div>
              <div>
                <label className="erp-label block mb-1">Purchased By</label>
                <select value={purchasedBy} onChange={e => setPurchasedBy(e.target.value)} className="erp-input w-full">
                  <option value="">Select Staff</option>
                  <option>Admin</option><option>Purchase Manager</option>
                </select>
              </div>
           </div>

           <div className="erp-footer-box">
              <label className="erp-label block mb-1">Delivery Terms</label>
              <textarea value={deliveryTerms} onChange={e => setDeliveryTerms(e.target.value)} className="erp-input w-full h-20 resize-none" />
           </div>

           <div className="erp-footer-box">
              <label className="erp-label block mb-1">Remarks (Private Use)</label>
              <textarea value={remarks} onChange={e => setRemarks(e.target.value)} className="erp-input w-full h-20 resize-none" />
           </div>

           <div className="erp-footer-box space-y-2">
              <div className="bg-[#111111] p-1 text-[10px] font-bold text-center border border-[#1A1A1A]">PAYMENT DETAILS</div>
              <div className="flex justify-between items-center">
                <span className="erp-label">Mode</span>
                <select value={paymentMode} onChange={e => setPaymentMode(e.target.value)} className="erp-input w-2/3">
                  {PAYMENT_MODES.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div className="flex justify-between items-center">
                <span className="erp-label">Txn ID</span>
                <input value={txnId} onChange={e => setTxnId(e.target.value)} className="erp-input w-2/3" />
              </div>
              <div className="flex justify-between items-center">
                <span className="erp-label">Amount Paid</span>
                <div className="relative w-2/3">
                   <span className="absolute left-1 top-1 text-[10px] text-[#475569]">₹</span>
                   <input type="number" value={amountPaid} onChange={e => setAmountPaid(parseFloat(e.target.value) || 0)} className="erp-input w-full pl-3 font-bold text-emerald-400" />
                </div>
              </div>
              <div className="pt-2 border-t border-[#1A1A1A] flex justify-between font-bold">
                <span className="text-xs">GRAND TOTAL</span>
                <span className="text-emerald-400">₹{grandTotal.toFixed(2)}</span>
              </div>
           </div>
        </div>

      </main>

      {/* Bottom Toolbar */}
      <footer className="fixed bottom-0 left-0 right-0 h-12 bg-[#050505] border-t border-[#1A1A1A] flex items-center justify-between px-4 z-50">
        <div className="flex gap-4">
           <Bell className="w-5 h-5 text-[#475569] hover:text-white cursor-pointer" />
           <Calculator className="w-5 h-5 text-[#475569] hover:text-white cursor-pointer" />
           <Truck className="w-5 h-5 text-[#475569] hover:text-white cursor-pointer" />
           <Wallet className="w-5 h-5 text-[#475569] hover:text-white cursor-pointer" />
           <Hand className="w-5 h-5 text-[#475569] hover:text-white cursor-pointer" />
           <Search className="w-5 h-5 text-[#475569] hover:text-white cursor-pointer" />
           <RotateCcw className="w-5 h-5 text-[#475569] hover:text-white cursor-pointer" />
        </div>
        
        <div className="text-xs font-mono text-[#475569]">
          Balance : <span className={balance > 0 ? 'text-red-500' : 'text-emerald-500'}>₹{balance.toFixed(2)}</span>
        </div>

        <div className="flex gap-2">
          <button onClick={() => handleSave('paid')} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded flex items-center gap-2 text-xs font-bold transition shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            <Save className="w-4 h-4" /> Save and Mark Paid
          </button>
          <button onClick={() => handleSave('received')} disabled={saving} className="bg-[#111111] hover:bg-[#1A1A1A] text-white border border-[#1A1A1A] px-6 py-1.5 rounded flex items-center gap-2 text-xs font-bold transition">
            <CheckCircle className="w-4 h-4" /> Mark Received
          </button>
        </div>
      </footer>
    </div>
  );
}
