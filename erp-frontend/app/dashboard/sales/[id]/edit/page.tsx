'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Topbar from '../../../../../components/layout/Topbar';
import { customersApi, productsApi, invoicesApi } from '../../../../../lib/erp-api';
import { 
  Plus, Trash2, Search, Loader2, Save, CheckCircle, 
  Printer, RotateCcw, Calculator, Bell, Truck, Wallet, Hand, X, 
  Calendar, ChevronDown, User, MapPin, CreditCard, Tag as TagIcon
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Customer { _id: string; name: string; mobile?: string; gstin?: string; billingAddress?: string; }
interface Product { _id: string; name: string; sellingPrice: number; gstRate: number; hsnCode?: string; unit: string; mrp?: number; }
interface LineItem { 
  productId?: string; productName: string; hsnCode: string; batchNo: string; tag: string; description: string;
  quantity: number; unit: string; rate: number; mrp: number; discount: number; gstRate: number; cess: number;
  taxableAmount: number; cgst: number; sgst: number; igst: number; totalAmount: number; 
}

const PAYMENT_MODES = ['Cash', 'UPI', 'NEFT', 'RTGS', 'Cheque', 'Credit'];
const STATES = ['Andhra Pradesh','Assam','Bihar','Chhattisgarh','Delhi','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal'];

const round2 = (n: number) => Math.round(n * 100) / 100;

export default function EditInvoicePage() {
  const router = useRouter();
  const { id } = useParams();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Header State
  const [invoiceType, setInvoiceType] = useState('GST');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [placeOfSupply, setPlaceOfSupply] = useState('Gujarat');
  const [billTo, setBillTo] = useState<'Cash' | 'Customer'>('Customer');
  const [contactNo, setContactNo] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDD, setShowCustomerDD] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerGstin, setCustomerGstin] = useState('');
  const [isInterState, setIsInterState] = useState(false);

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
  const [soldBy, setSoldBy] = useState('');
  const [deliveryTerms, setDeliveryTerms] = useState('');
  const [remarks, setRemarks] = useState('');
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [amountReceived, setAmountReceived] = useState(0);
  const [txnId, setTxnId] = useState('');

  useEffect(() => {
    const init = async () => {
      try {
        const [cRes, pRes, iRes] = await Promise.all([
          customersApi.list({ limit: 200 }),
          productsApi.list({ limit: 500 }),
          invoicesApi.get(id as string)
        ]);
        
        setCustomers(cRes.data.customers);
        setProducts(pRes.data.products);
        
        const inv = iRes.data.invoice;
        setInvoiceNumber(inv.invoiceNumber);
        setInvoiceDate(new Date(inv.invoiceDate).toISOString().split('T')[0]);
        if (inv.dueDate) setDueDate(new Date(inv.dueDate).toISOString().split('T')[0]);
        setPlaceOfSupply(inv.placeOfSupply);
        setIsInterState(inv.isInterState);
        setBillTo(inv.billTo || 'Customer');
        setCustomerSearch(inv.customerSnapshot.name);
        setContactNo(inv.customerSnapshot.mobile || '');
        setCustomerAddress(inv.customerSnapshot.address || '');
        setCustomerGstin(inv.customerSnapshot.gstin || '');
        if (inv.customerId) setSelectedCustomer(cRes.data.customers.find((c: Customer) => c._id === (inv.customerId._id || inv.customerId)));
        
        setLineItems(inv.lineItems.map((item: any) => ({
          ...item,
          batchNo: item.batchNo || '',
          tag: item.tag || '',
          description: item.description || '',
          cess: item.cess || 0,
          mrp: item.mrp || item.rate
        })));
        
        setPaymentMode(inv.paymentMode);
        setAmountReceived(inv.amountReceived);
        setTxnId(inv.txnId || '');
        setRemarks(inv.notes || '');
        setDeliveryTerms(inv.deliveryTerms || '');
        setSoldBy(inv.soldBy || '');
        
      } catch (e) {
        toast.error('Failed to load invoice');
        router.push('/dashboard/sales');
      } finally {
        setLoading(false);
      }
    };
    if (id) init();
  }, [id]);

  const filteredCustomers = customers.filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase()));
  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(itemSearch.toLowerCase()));

  const pickCustomer = (c: Customer) => {
    setSelectedCustomer(c);
    setCustomerSearch(c.name);
    setContactNo(c.mobile || '');
    setCustomerAddress(c.billingAddress || '');
    setCustomerGstin(c.gstin || '');
    setShowCustomerDD(false);
  };

  const pickProduct = (p: Product) => {
    setItemInput(prev => ({
      ...prev,
      productId: p._id,
      productName: p.name,
      hsnCode: p.hsnCode || '',
      rate: p.sellingPrice,
      mrp: p.mrp || p.sellingPrice,
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
  const balance = round2(grandTotal - amountReceived);

  const handleUpdate = async (saveStatus: 'draft' | 'sent' | 'paid') => {
    if (lineItems.length === 0) { toast.error('Add at least one item'); return; }
    setSaving(true);
    try {
      const payload = {
        invoiceNumber,
        invoiceDate,
        dueDate,
        customerId: selectedCustomer?._id,
        customerSnapshot: selectedCustomer ? {
          name: selectedCustomer.name,
          mobile: contactNo,
          gstin: customerGstin,
          address: customerAddress
        } : { name: customerSearch || 'Cash Customer' },
        placeOfSupply,
        isInterState,
        lineItems,
        paymentMode,
        amountReceived,
        txnId,
        notes: remarks,
        deliveryTerms,
        soldBy,
        billTo,
        status: saveStatus === 'paid' ? 'paid' : amountReceived > 0 ? 'partial' : saveStatus,
      };
      await invoicesApi.update(id as string, payload);
      toast.success(`Invoice Updated!`);
      router.push('/dashboard/sales');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to update invoice');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-black"><Loader2 className="w-10 h-10 animate-spin text-white" /></div>;

  return (
    <div className="flex flex-col h-screen bg-black text-white font-sans overflow-hidden">
      <Topbar title="Edit Invoice" />

      <main className="flex-1 overflow-y-auto p-2 space-y-2 pb-20">
        
        {/* Section 1: Invoice Information */}
        <div className="erp-container">
          <div className="erp-header">Edit Invoice Information</div>
          <div className="p-2 grid grid-cols-6 gap-x-4 gap-y-2">
            <div>
              <label className="erp-label">Invoice Type</label>
              <select value={invoiceType} onChange={e => setInvoiceType(e.target.value)} className="erp-input w-full">
                <option>GST</option>
                <option>NON-GST</option>
              </select>
            </div>
            <div>
              <label className="erp-label">Invoice No. <span className="text-red-500">*</span></label>
              <input value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} className="erp-input w-full" />
            </div>
            <div>
              <label className="erp-label">Date</label>
              <input type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} className="erp-input w-full" />
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
              <label className="erp-label">Customer <span className="text-red-500">*</span></label>
              <div className="relative">
                <input value={customerSearch} onChange={e => { setCustomerSearch(e.target.value); setShowCustomerDD(true); }} onFocus={() => setShowCustomerDD(true)} className="erp-input w-full" placeholder="Search customer..." />
                {showCustomerDD && filteredCustomers.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-[#0A0A0A] border border-[#1A1A1A] z-50 max-h-40 overflow-y-auto shadow-2xl">
                    {filteredCustomers.map(c => (
                      <div key={c._id} onClick={() => pickCustomer(c)} className="px-2 py-1 text-xs hover:bg-[#262626] cursor-pointer border-b border-[#1A1A1A]">
                        {c.name}
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
              <input value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} className="erp-input w-full" />
            </div>
            <div>
              <label className="erp-label">Customer GSTIN</label>
              <input value={customerGstin} onChange={e => setCustomerGstin(e.target.value)} className="erp-input w-full font-mono uppercase" />
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
                          <span className="text-[#475569]">₹{p.sellingPrice}</span>
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
                <label className="erp-label">Sale Price</label>
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
               <button onClick={addItem} className="bg-green-600 hover:bg-green-700 text-white p-1 rounded flex items-center justify-center">
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
                <label className="erp-label block mb-1">Sold By</label>
                <select value={soldBy} onChange={e => setSoldBy(e.target.value)} className="erp-input w-full">
                  <option value="">Select Agent</option>
                  <option>Admin</option><option>Sales Executive A</option>
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
                <span className="erp-label">Amount Received</span>
                <div className="relative w-2/3">
                   <span className="absolute left-1 top-1 text-[10px] text-[#475569]">₹</span>
                   <input type="number" value={amountReceived} onChange={e => setAmountReceived(parseFloat(e.target.value) || 0)} className="erp-input w-full pl-3 font-bold text-emerald-400" />
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
          <button onClick={() => handleUpdate('sent')} disabled={saving} className="bg-white text-black hover:bg-gray-200 px-6 py-1.5 rounded flex items-center gap-2 text-xs font-bold transition">
            <Save className="w-4 h-4" /> Update Invoice
          </button>
        </div>
      </footer>
    </div>
  );
}
