'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Topbar from '../../../../../components/layout/Topbar';
import { suppliersApi, productsApi, purchasesApi, businessApi } from '../../../../../lib/erp-api';
import { 
  Plus, Trash2, Search, Loader2, Save, CheckCircle, 
  Printer, RotateCcw, Calculator, Bell, Truck, Wallet, Hand, X, 
  Calendar, ChevronDown, User, MapPin, CreditCard, Barcode
} from 'lucide-react';
import toast from 'react-hot-toast';
import QuickAddItemModal from '../../../../../components/modals/QuickAddItemModal';
import QuickAddSupplierModal from '../../../../../components/modals/QuickAddSupplierModal';

interface Supplier { _id: string; name: string; mobile?: string; gstin?: string; address?: string; }
interface Product { _id: string; name: string; purchasePrice: number; gstRate: number; hsnCode?: string; unit: string; mrp?: number; }
interface LineItem { 
  productId?: string; productName: string; hsnCode: string; batchNo: string; tag: string; description: string;
  quantity: number; unit: string; rate: number; mrp: number; discount: number; gstRate: number; cess: number;
  taxableAmount: number; cgst: number; sgst: number; igst: number; totalAmount: number; 
}

interface BatchConfig {
  productId: string;
  productName: string;
  batchNo: string;
  mrp: number;
  salePrice: number;
  minSalePrice: number;
  expiryDate: string;
}

const PAYMENT_MODES = ['Cash', 'UPI', 'NEFT', 'RTGS', 'Cheque', 'Credit'];
const STATES = ['Andhra Pradesh','Assam','Bihar','Chhattisgarh','Delhi','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal'];

const round2 = (n: number) => Math.round(n * 100) / 100;

export default function EditPurchasePage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [units, setUnits] = useState<string[]>(['Nos', 'Kg', 'Ltr', 'Box', 'Pcs', 'Mtr']);

  const [activeTab, setActiveTab] = useState<'bill' | 'batches'>('bill');
  const [batches, setBatches] = useState<BatchConfig[]>([]);
  const [batchInput, setBatchInput] = useState<BatchConfig>({
    productId: '', productName: '', batchNo: '', mrp: 0, salePrice: 0, minSalePrice: 0, expiryDate: ''
  });

  // Header State
  const [purchaseType, setPurchaseType] = useState('GST');
  const [billDate, setBillDate] = useState(new Date().toISOString().split('T')[0]);
  const [supplierSearch, setSupplierSearch] = useState('');
  const [showSupplierDD, setShowSupplierDD] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  
  const [showQuickAddSupplierModal, setShowQuickAddSupplierModal] = useState(false);
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);
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
    quantity: 1, unit: 'Nos', rate: 0, mrp: 0, discount: 0, gstRate: 0, cess: 0,
    taxableAmount: 0, cgst: 0, sgst: 0, igst: 0, totalAmount: 0
  });
  const [itemSearch, setItemSearch] = useState('');
  const [showItemDD, setShowItemDD] = useState(false);
  const [itemIdentifierType, setItemIdentifierType] = useState<'tag' | 'code'>('tag');
  const [lastPrices, setLastPrices] = useState<any[]>([]);

  // Main List
  const [lineItems, setLineItems] = useState<LineItem[]>([]);

  // Footer State
  const [showAdditionalDiscount, setShowAdditionalDiscount] = useState(false);
  const [showAdditionalDiscount, setShowAdditionalDiscount] = useState(false);
  const [additionalDiscount, setAdditionalDiscount] = useState(0);
  const [shippingCharge, setShippingCharge] = useState(0);
  const [shippingGstRate, setShippingGstRate] = useState(0);
  const [remarks, setRemarks] = useState('');
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [amountPaid, setAmountPaid] = useState(0);
  const [txnId, setTxnId] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sRes, pRes, bRes] = await Promise.all([
          suppliersApi.list({ limit: 200 }),
          productsApi.list({ limit: 500 }),
          businessApi.getProfile()
        ]);
        setSuppliers(sRes.data.suppliers);
        setProducts(pRes.data.products);
        const bizUnits = bRes.data?.business?.units;
        if (bizUnits && bizUnits.length > 0) {
          setUnits(bizUnits);
          setItemInput(prev => ({ ...prev, unit: bizUnits[0] }));
        }

        if (id) {
          const { data } = await purchasesApi.get(id);
          const p = data.purchase;
          
          setPurchaseType(p.purchaseType || 'GST');
          setBillNumber(p.billNumber || '');
          setBillDate(new Date(p.billDate).toISOString().split('T')[0]);
          if (p.dueDate) setDueDate(new Date(p.dueDate).toISOString().split('T')[0]);
          setPlaceOfSupply(p.placeOfSupply || 'Gujarat');
          setPurchaseOrderNo(p.purchaseOrderNo || '');
          if (p.purchaseOrderDate) setPurchaseOrderDate(new Date(p.purchaseOrderDate).toISOString().split('T')[0]);
          setPaymentTerms(p.paymentTerms || '');
          setEwayBillNo(p.ewayBillNo || '');
          
          if (p.supplierId) {
            setSelectedSupplier(p.supplierId);
            setSupplierSearch(p.supplierId.name);
            setContactNo(p.supplierId.mobile || '');
            let addrStr = '';
            if (p.supplierId.address) {
              if (typeof p.supplierId.address === 'string') {
                addrStr = p.supplierId.address;
              } else {
                const parts = [
                  p.supplierId.address.street,
                  p.supplierId.address.city,
                  p.supplierId.address.state,
                  p.supplierId.address.pinCode,
                  p.supplierId.address.country
                ].filter(Boolean);
                addrStr = parts.join(', ');
              }
            }
            setSupplierAddress(addrStr);
            setSupplierGstin(p.supplierId.gstin || '');
          } else if (p.supplierSnapshot) {
            setSupplierSearch(p.supplierSnapshot.name || 'Walk-in Supplier');
          }
          
          setLineItems(p.lineItems || []);
          setBatches(p.batches || []);
          
          setAdditionalDiscount(p.additionalDiscount || 0);
          setShippingCharge(p.shippingCharge || 0);
          setShippingGstRate(p.shippingGstRate || 0);
          setRemarks(p.notes || '');
          
          setPaymentMode(p.paymentMode || 'Cash');
          setAmountPaid(p.amountPaid || 0);
          setTxnId(p.txnId || '');
        }
      } catch (err) {
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const filteredSuppliers = suppliers.filter(s => s.name.toLowerCase().includes(supplierSearch.toLowerCase()));
  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(itemSearch.toLowerCase()));

  const pickSupplier = (s: Supplier) => {
    setSelectedSupplier(s);
    setSupplierSearch(s.name);
    setContactNo(s.mobile || '');
    let addrStr = '';
    if (s.address) {
      if (typeof s.address === 'string') {
        addrStr = s.address;
      } else {
        const parts = [
          (s.address as any).street,
          (s.address as any).city,
          (s.address as any).state,
          (s.address as any).pinCode,
          (s.address as any).country
        ].filter(Boolean);
        addrStr = parts.join(', ');
      }
    }
    setSupplierAddress(addrStr);
    setSupplierGstin(s.gstin || '');
    setShowSupplierDD(false);
  };

  const pickProduct = async (p: Product) => {
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

    if (selectedSupplier?._id || (selectedSupplier as any)) {
      const supplierId = selectedSupplier._id || (selectedSupplier as any);
      try {
        const { data } = await purchasesApi.getLastPrices(supplierId, p._id);
        setLastPrices(data.prices || []);
      } catch (err) {
        setLastPrices([]);
      }
    } else {
      setLastPrices([]);
    }
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
      quantity: 1, unit: 'Nos', rate: 0, mrp: 0, discount: 0, gstRate: 0, cess: 0,
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
        batches,
        subtotal,
        totalDiscount,
        totalTaxableAmount,
        totalCGST,
        totalSGST,
        totalIGST,
        totalGST,
        grandTotal,
        shippingCharge,
        shippingGstRate,
        additionalDiscount,
        amountPaid,
        txnId,
        notes: remarks,
        status: saveStatus === 'paid' ? 'paid' : amountPaid > 0 ? 'partial' : saveStatus,
      };
      await purchasesApi.update(id, payload);
      toast.success(`Purchase Bill ${billNumber} Updated!`);
      router.push('/dashboard/purchases');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to save purchase bill');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-slate-50"><Loader2 className="w-10 h-10 animate-spin text-slate-900" /></div>;

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
      <Topbar title="Edit Purchase Bill" />

      {/* Tabs */}
      <div className="flex px-4 pt-2 border-b border-slate-200 bg-[#F1F5F9] gap-1">
         <div onClick={() => setActiveTab('bill')} className={`px-4 py-2 text-xs font-semibold cursor-pointer ${activeTab === 'bill' ? 'bg-[#F1F5F9] border border-b-0 border-slate-200 rounded-t text-slate-900' : 'text-slate-600 hover:text-slate-900 border border-transparent'}`}>Purchase Bill</div>
         <div onClick={() => setActiveTab('batches')} className={`px-4 py-2 text-xs font-semibold cursor-pointer ${activeTab === 'batches' ? 'bg-white border-t-2 border-t-red-500 border-l border-r border-slate-200 rounded-t text-slate-900' : 'text-slate-600 hover:text-slate-900 border border-transparent'}`}>Batch Numbers</div>
      </div>

      <main className="flex-1 overflow-y-auto p-1 space-y-1 pb-14 bg-slate-50">
        
        {activeTab === 'bill' ? (
          <>
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
              <div className="flex justify-between items-center mb-1">
                 <label className="erp-label block">Supplier Name <span className="text-red-500">*</span></label>
                 <span onClick={() => setShowQuickAddSupplierModal(true)} className="text-[10px] text-action-500 hover:text-blue-400 cursor-pointer underline flex items-center"><Plus className="w-3 h-3 mr-0.5" /> Add Supplier</span>
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
                   <span onClick={() => setShowQuickAddModal(true)} className="text-[10px] text-action-500 hover:text-blue-400 cursor-pointer underline">Add Item</span>
                </div>
                <div className="relative">
                  <div className="flex w-full relative">
                    <input value={itemSearch} onChange={e => { setItemSearch(e.target.value); setShowItemDD(true); }} onFocus={() => setShowItemDD(true)} className="erp-input w-full pr-8" placeholder="Select item..." />
                    <button type="button" onClick={() => setShowItemDD(!showItemDD)} className="absolute right-2 top-1.5 text-slate-400 hover:text-slate-600 bg-white px-1">
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                  {showItemDD && filteredProducts.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 z-50 max-h-40 overflow-y-auto shadow-2xl">
                      {filteredProducts.map(p => (
                        <div key={p._id} onClick={() => pickProduct(p)} className="px-2 py-1 text-xs hover:bg-slate-100 cursor-pointer border-b border-slate-200 flex justify-between">
                          <span>{p.name}</span>
                          <span className="text-slate-600">₹{p.purchasePrice}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="erp-label block mb-1">Unit <span className="text-red-500">*</span></label>
                <select value={itemInput.unit} onChange={e => setItemInput({...itemInput, unit: e.target.value})} className="erp-input w-full uppercase">
                  {units.map(u => <option key={u} value={u}>{u.toUpperCase()}</option>)}
                </select>
              </div>
              <div>
                <label className="erp-label block mb-1">Quantity <span className="text-red-500">*</span></label>
                <input type="number" value={itemInput.quantity === 0 ? '' : itemInput.quantity} onChange={e => setItemInput({...itemInput, quantity: parseFloat(e.target.value) || 0})} className="erp-input w-full" />
              </div>
              <div>
                <label className="erp-label block mb-1">Purchase Price <span className="text-red-500">*</span></label>
                <div className="flex">
                   <span className="bg-[#1e3a8a] text-slate-900 px-2 py-1 text-xs border border-slate-200 border-r-0 flex items-center">₹</span>
                   <input type="number" value={itemInput.rate === 0 ? '' : itemInput.rate} onChange={e => setItemInput({...itemInput, rate: parseFloat(e.target.value) || 0})} className="erp-input w-full rounded-none" />
                </div>
              </div>
              <div>
                <label className="erp-label block mb-1">Disc. (%)</label>
                <div className="flex">
                  <input type="number" value={itemInput.discount === 0 ? '' : itemInput.discount} onChange={e => setItemInput({...itemInput, discount: parseFloat(e.target.value) || 0})} className="erp-input w-full rounded-none" />
                  <span className="bg-[#1e3a8a] text-slate-900 px-2 py-1 text-xs border border-slate-200 border-l-0 flex items-center">%</span>
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
                   <span className="bg-[#1e3a8a] text-slate-900 px-2 py-1 text-xs border border-slate-200 border-r-0 flex items-center">₹</span>
                   <div className="erp-input w-full rounded-none bg-white flex items-center">{calculateItem(itemInput).totalAmount > 0 ? calculateItem(itemInput).totalAmount.toFixed(2) : ''}</div>
                </div>
              </div>
              <div className="flex items-center justify-center pb-[2px]">
                 <button onClick={addItem} className="bg-green-600 hover:bg-green-700 text-slate-900 p-1 rounded-sm w-7 h-7 flex items-center justify-center transition">
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
           <div className="grid grid-cols-11 bg-[#F1F5F9] text-slate-600 text-[10px] font-bold uppercase tracking-wider sticky top-0 z-10 border-b border-slate-200">
             <div className="border-r border-slate-200 px-2 py-1.5 text-center">S. No.</div>
             <div className="border-r border-slate-200 px-2 py-1.5 text-center">Item Name</div>
             <div className="border-r border-slate-200 px-2 py-1.5 text-center">Quantity</div>
             <div className="border-r border-slate-200 px-2 py-1.5 text-center">Unit</div>
             <div className="border-r border-slate-200 px-2 py-1.5 text-center">Price/Unit</div>
             <div className="border-r border-slate-200 px-2 py-1.5 text-center">Disc (%)</div>
             <div className="border-r border-slate-200 px-2 py-1.5 text-center">Tax (%)</div>
             <div className="border-r border-slate-200 px-2 py-1.5 text-center">Cess (%)</div>
             <div className="col-span-3 px-2 py-1.5 text-center">Amount</div>
           </div>
           
           <div className="flex-1 overflow-y-auto bg-[#E2E8F0]">
              {lineItems.length === 0 ? (
                <div className="p-10 text-center text-slate-600 italic text-sm"></div>
              ) : (
                lineItems.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-11 erp-grid-row group text-[11px]">
                    <div className="border-r border-slate-200 px-2 py-1.5 text-center text-slate-600">{idx + 1}</div>
                    <div className="border-r border-slate-200 px-2 py-1.5 font-medium">
                      {item.productName}
                      {item.tag && <span className="ml-2 text-[9px] bg-[#E2E8F0] px-1 rounded text-slate-600">{item.tag}</span>}
                    </div>
                    <div className="border-r border-slate-200 px-2 py-1.5 text-center">{item.quantity}</div>
                    <div className="border-r border-slate-200 px-2 py-1.5 text-center">{item.unit}</div>
                    <div className="border-r border-slate-200 px-2 py-1.5 text-right">₹{item.rate.toFixed(2)}</div>
                    <div className="border-r border-slate-200 px-2 py-1.5 text-center">{item.discount || ''}</div>
                    <div className="border-r border-slate-200 px-2 py-1.5 text-center">{item.gstRate}</div>
                    <div className="border-r border-slate-200 px-2 py-1.5 text-center">{item.cess || ''}</div>
                    <div className="col-span-3 px-2 py-1.5 text-right font-medium flex justify-between items-center">
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
                <span className="text-slate-700">Add'l Discount</span>
              </label>
              {showAdditionalDiscount && (
                <div className="flex">
                   <span className="bg-[#1e3a8a] text-slate-900 px-2 py-1 text-xs border border-slate-200 border-r-0 flex items-center">₹</span>
                   <input type="number" value={additionalDiscount === 0 ? '' : additionalDiscount} onChange={e => setAdditionalDiscount(parseFloat(e.target.value) || 0)} className="erp-input w-full rounded-none" />
                </div>
              )}

              {lastPrices.length > 0 && (
                <div className="mt-4 w-full p-2 bg-blue-50 border border-blue-100 rounded text-[10px] text-blue-800">
                  <p className="font-bold mb-1 border-b border-blue-200 pb-1">Last 5 Purchases ({itemInput.productName})</p>
                  {lastPrices.map((lp, idx) => (
                    <div key={idx} className="flex justify-between border-b border-blue-200/50 last:border-0 py-1">
                      <span>{new Date(lp.date).toLocaleDateString('en-GB')}</span>
                      <span>{lp.billNumber}</span>
                      <span className="font-medium text-sm">₹{lp.rate}</span>
                    </div>
                  ))}
                </div>
              )}
           </div>

           <div className="col-span-1">
              <div className="erp-container border-slate-200">
                <div className="erp-header bg-transparent border-none py-1">Remarks (Private Use)</div>
                <textarea value={remarks} onChange={e => setRemarks(e.target.value)} className="erp-input w-full h-12 resize-none border-none border-t border-slate-200" />
              </div>
           </div>

           <div className="col-span-1">
              <div className="erp-container border-slate-200">
                <div className="erp-header bg-transparent border-none py-1">Payments</div>
                <div className="p-2 space-y-2 border-t border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-600 w-12">Mode</span>
                    <select value={paymentMode} onChange={e => setPaymentMode(e.target.value)} className="erp-input flex-1">
                      {PAYMENT_MODES.map(m => <option key={m}>{m}</option>)}
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-600 w-12">Txn. ID</span>
                    <input value={txnId} onChange={e => setTxnId(e.target.value)} className="erp-input flex-1" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-600 w-12">Amount</span>
                    <div className="flex flex-1">
                       <span className="bg-[#1e3a8a] text-slate-900 px-2 py-1 text-[10px] border border-slate-200 border-r-0 flex items-center">₹</span>
                       <input type="number" value={amountPaid === 0 ? '' : amountPaid} onChange={e => setAmountPaid(parseFloat(e.target.value) || 0)} className="erp-input w-full rounded-none" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-600 w-12">Balance</span>
                    <div className="flex flex-1">
                       <span className="bg-[#1e3a8a] text-slate-900 px-2 py-1 text-[10px] border border-slate-200 border-r-0 flex items-center">₹</span>
                       <div className="erp-input w-full rounded-none bg-white flex items-center">{balance.toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              </div>
           </div>

           <div className="col-span-1">
              <div className="erp-container border-slate-200 h-full flex flex-col p-3 space-y-2">
                 <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                   <span className="text-xs font-bold text-slate-600">Sub Total</span>
                   <span className="text-sm font-bold text-slate-800">₹ {subtotal.toFixed(2)}</span>
                 </div>
                 <div className="flex flex-col gap-1 py-2 border-b border-slate-100">
                   <div className="flex justify-between items-center">
                     <span className="text-[10px] text-slate-500 font-medium uppercase">Shipping (₹)</span>
                     <input type="number" value={shippingCharge === 0 ? '' : shippingCharge} onChange={e => setShippingCharge(parseFloat(e.target.value) || 0)} className="erp-input w-24 text-right" placeholder="0" />
                   </div>
                   <div className="flex justify-between items-center">
                     <span className="text-[10px] text-slate-500 font-medium uppercase">Shipping GST (%)</span>
                     <input type="number" value={shippingGstRate === 0 ? '' : shippingGstRate} onChange={e => setShippingGstRate(parseFloat(e.target.value) || 0)} className="erp-input w-24 text-right" placeholder="0" />
                   </div>
                 </div>
                 <div className="flex justify-between items-center pt-2">
                   <span className="text-xs font-bold text-slate-800 uppercase">Total Amount</span>
                   <span className="text-base font-bold text-slate-900">₹ {grandTotal.toFixed(2)}</span>
                 </div>
              </div>
           </div>
        </div>
          </>
        ) : (
          <div className="erp-container h-full flex flex-col">
            <div className="erp-header py-1 text-xs">Add batch number</div>
            <div className="p-2 grid grid-cols-6 gap-2 items-end border-b border-slate-200 bg-white">
              <div className="col-span-1">
                 <label className="erp-label block mb-1">Item Name</label>
                 <select 
                    value={batchInput.productId} 
                    onChange={e => {
                       const pName = e.target.options[e.target.selectedIndex].text;
                       const existingBatch = lineItems.find(l => l.productId === e.target.value)?.batchNo || '';
                       setBatchInput({...batchInput, productId: e.target.value, productName: pName, batchNo: existingBatch});
                    }} 
                    className="erp-input w-full"
                 >
                   <option value="">Select</option>
                   {Array.from(new Set(lineItems.filter(l => !!l.productId).map(l => l.productId))).map(pid => {
                      const item = lineItems.find(l => l.productId === pid);
                      return item && <option key={pid} value={pid}>{item.productName}</option>;
                   })}
                 </select>
              </div>
              <div className="col-span-1">
                 <label className="erp-label block mb-1">M.R.P.</label>
                 <div className="flex">
                    <span className="bg-[#1e3a8a] text-slate-900 px-2 py-1 text-xs border border-slate-200 border-r-0 flex items-center">₹</span>
                    <input type="number" value={batchInput.mrp || ''} onChange={e => setBatchInput({...batchInput, mrp: parseFloat(e.target.value) || 0})} className="erp-input w-full rounded-none" />
                 </div>
              </div>
              <div className="col-span-1">
                 <label className="erp-label block mb-1">Sale Price</label>
                 <div className="flex">
                    <span className="bg-[#1e3a8a] text-slate-900 px-2 py-1 text-xs border border-slate-200 border-r-0 flex items-center">₹</span>
                    <input type="number" value={batchInput.salePrice || ''} onChange={e => setBatchInput({...batchInput, salePrice: parseFloat(e.target.value) || 0})} className="erp-input w-full rounded-none" />
                 </div>
              </div>
              <div className="col-span-1">
                 <label className="erp-label block mb-1">Min. Sale Price</label>
                 <div className="flex">
                    <span className="bg-[#1e3a8a] text-slate-900 px-2 py-1 text-xs border border-slate-200 border-r-0 flex items-center">₹</span>
                    <input type="number" value={batchInput.minSalePrice || ''} onChange={e => setBatchInput({...batchInput, minSalePrice: parseFloat(e.target.value) || 0})} className="erp-input w-full rounded-none" />
                 </div>
              </div>
              <div className="col-span-1">
                 <label className="erp-label block mb-1">Batch No.</label>
                 <input value={batchInput.batchNo} onChange={e => setBatchInput({...batchInput, batchNo: e.target.value})} className="erp-input w-full" placeholder="||||||" />
                 <div className="mt-1">
                   {batchInput.expiryDate ? (
                     <input type="date" value={batchInput.expiryDate} onChange={e => setBatchInput({...batchInput, expiryDate: e.target.value})} className="erp-input w-full text-[10px] p-0.5" />
                   ) : (
                     <button onClick={() => setBatchInput({...batchInput, expiryDate: new Date().toISOString().split('T')[0]})} className="w-full bg-slate-200 hover:bg-slate-300 text-action-600 font-bold text-[10px] py-1 rounded transition">Set Expiry Date</button>
                   )}
                 </div>
              </div>
              <div className="col-span-1 flex gap-2 mb-[22px]">
                 <button onClick={() => {
                    if(!batchInput.productId || !batchInput.batchNo) { toast.error("Select item and enter Batch No"); return; }
                    setBatches([...batches.filter(b => !(b.productId === batchInput.productId && b.batchNo === batchInput.batchNo)), batchInput]);
                    setBatchInput({productId: '', productName: '', batchNo: '', mrp: 0, salePrice: 0, minSalePrice: 0, expiryDate: ''});
                 }} className="bg-[#1e3a8a] hover:bg-blue-900 text-white px-3 py-1 rounded text-xs flex items-center gap-1 transition"><Save className="w-3.5 h-3.5" /> Save</button>
                 <button onClick={() => setBatchInput({productId: '', productName: '', batchNo: '', mrp: 0, salePrice: 0, minSalePrice: 0, expiryDate: ''})} className="bg-[#1e3a8a] hover:bg-blue-900 text-white px-3 py-1 rounded text-xs flex items-center gap-1 transition"><RotateCcw className="w-3.5 h-3.5" /> Reset</button>
              </div>
            </div>

            <div className="erp-header py-1 text-xs border-t-0 bg-transparent text-slate-500 font-medium ml-1 mt-1">Existing batch number(s)</div>
            <div className="flex-1 overflow-y-auto bg-slate-50 p-2">
               {batches.length === 0 ? (
                 <div className="flex flex-col items-center justify-center h-[200px] text-slate-400 opacity-50">
                    <Search className="w-16 h-16 mb-2 text-yellow-500 opacity-80" />
                    <span className="text-sm">No batches added yet</span>
                 </div>
               ) : (
                 <table className="w-full text-left border-collapse bg-white shadow-sm border border-slate-200">
                   <thead>
                     <tr className="bg-[#F1F5F9] text-slate-700 text-[10px] uppercase">
                       <th className="p-2 border border-slate-200">Item Name</th>
                       <th className="p-2 border border-slate-200">Batch No</th>
                       <th className="p-2 border border-slate-200">M.R.P.</th>
                       <th className="p-2 border border-slate-200">Sale Price</th>
                       <th className="p-2 border border-slate-200">Min. Sale Price</th>
                       <th className="p-2 border border-slate-200">Expiry</th>
                       <th className="p-2 border border-slate-200 w-10"></th>
                     </tr>
                   </thead>
                   <tbody>
                     {batches.map((b, i) => (
                       <tr key={i} className="text-xs hover:bg-slate-50">
                         <td className="p-2 border border-slate-200 text-slate-800">{b.productName}</td>
                         <td className="p-2 border border-slate-200 font-medium text-slate-900">{b.batchNo}</td>
                         <td className="p-2 border border-slate-200">₹{b.mrp.toFixed(2)}</td>
                         <td className="p-2 border border-slate-200">₹{b.salePrice.toFixed(2)}</td>
                         <td className="p-2 border border-slate-200">₹{b.minSalePrice.toFixed(2)}</td>
                         <td className="p-2 border border-slate-200 text-slate-600">{b.expiryDate || '-'}</td>
                         <td className="p-2 border border-slate-200 text-center">
                            <button onClick={() => setBatches(batches.filter((_, idx) => idx !== i))} className="text-red-500 hover:text-red-700 p-1 bg-red-50 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               )}
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      {showQuickAddSupplierModal && (
        <QuickAddSupplierModal 
          onClose={() => setShowQuickAddSupplierModal(false)}
          onAdded={(newSupplier: any) => {
            setSuppliers([...suppliers, newSupplier]);
            setShowQuickAddSupplierModal(false);
            pickSupplier(newSupplier);
          }}
        />
      )}
      {showQuickAddModal && (
        <QuickAddItemModal 
          onClose={() => setShowQuickAddModal(false)}
          onSuccess={(newProduct: any) => {
            setProducts([...products, newProduct]);
            setShowQuickAddModal(false);
            pickProduct(newProduct);
          }}
        />
      )}

      {/* Bottom Toolbar */}
      <footer className="fixed bottom-0 left-0 right-0 h-12 bg-[#F1F5F9] border-t border-slate-200 flex items-center justify-between px-4 z-50">
          <div className="flex gap-4">
             <Bell className="w-5 h-5 text-slate-600 hover:text-slate-900 cursor-pointer" />
             <Calculator className="w-5 h-5 text-slate-600 hover:text-slate-900 cursor-pointer" />
             <Truck className="w-5 h-5 text-slate-600 hover:text-slate-900 cursor-pointer" />
             <Barcode className="w-5 h-5 text-slate-600 hover:text-slate-900 cursor-pointer" />
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => handleSave('received')} disabled={saving} className="bg-[#1e3a8a] hover:bg-action-700 text-white px-6 py-1.5 rounded flex items-center gap-2 text-xs font-bold transition">
              <Printer className="w-4 h-4" /> Save and Print
            </button>
            <button onClick={() => handleSave('received')} disabled={saving} className="bg-action-700 hover:bg-action-800 text-white px-6 py-1.5 rounded flex items-center gap-2 text-xs font-bold transition">
              <Save className="w-4 h-4" /> Save
            </button>
          </div>
      </footer>
    </div>
  );
}
