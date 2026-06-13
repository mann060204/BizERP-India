// @ts-nocheck
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Topbar from '../../../../components/layout/Topbar';
import { suppliersApi, productsApi, purchasesApi, businessApi, inventoryApi } from '../../../../lib/erp-api';
import { formatAccountingBalance } from '@/lib/utils';
import { ChevronDown, Loader2, Plus, ArrowRight, X, Edit, Trash2, Search, Save, Printer, RotateCcw, Calculator, Bell, Truck, Barcode, Pencil } from 'lucide-react';
import toast from 'react-hot-toast';
import QuickAddItemModal from '../../../../components/modals/QuickAddItemModal';
import QuickAddSupplierModal from '../../../../components/modals/QuickAddSupplierModal';
import { banksApi, accountsApi } from '../../../../lib/erp-api';

interface Supplier { _id: string; name: string; mobile?: string; gstin?: string; address?: string; currentBalance?: number; openingBalance?: number; }
interface Product { _id: string; name: string; purchasePrice: number; gstRate: number; hsnCode?: string; unit: string; mrp?: number; }
interface LineItem { 
  productId?: string; productName: string; hsnCode: string; batchNo: string; tag: string; description: string;
  quantity: number; unit: string; rate: number; mrp: number; discount: number; discountAmount?: number; discountType?: 'percentage' | 'amount'; gstRate: number; cess: number;
  taxableAmount: number; cgst: number; sgst: number; igst: number; totalAmount: number; 
}

interface BatchConfig {
  productId: string;
  productName: string;
  batchNo: string;
  mrp: number;
  salePrice: number;
  minSalePrice: number;
  quantity: number;
  expiryDate: string;
  manufacturingDate?: string;
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
  const [units, setUnits] = useState<string[]>(['Nos', 'Kg', 'Ltr', 'Box', 'Pcs', 'Mtr']);

  const [activeTab, setActiveTab] = useState<'bill' | 'batches'>('bill');
  const [batches, setBatches] = useState<BatchConfig[]>([]);
  const [batchInput, setBatchInput] = useState<BatchConfig>({
    productId: '', productName: '', batchNo: '', mrp: 0, salePrice: 0, minSalePrice: 0, quantity: 1, expiryDate: '', manufacturingDate: ''
  });

  // Header State
  const [purchaseType, setPurchaseType] = useState('GST');
  const [billDate, setBillDate] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [supplierSearch, setSupplierSearch] = useState('');
  const [supplierSnapshot, setSupplierSnapshot] = useState<any>(null);
  const [showSupplierDD, setShowSupplierDD] = useState(false);
  const [supplierHighlightIndex, setSupplierHighlightIndex] = useState(-1);
  const [showQuickAddSupplierModal, setShowQuickAddSupplierModal] = useState(false);
  const [showEditSupplierModal, setShowEditSupplierModal] = useState(false);
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);
  const [paymentTerms, setPaymentTerms] = useState('');
  const [dueDate, setDueDate] = useState('');
  
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
    quantity: 1, unit: 'Nos', rate: 0, mrp: 0, discount: 0, discountAmount: 0, discountType: 'percentage', gstRate: 0, cess: 0,
    taxableAmount: 0, cgst: 0, sgst: 0, igst: 0, totalAmount: 0
  });
  const [itemSearch, setItemSearch] = useState('');
  const [showItemDD, setShowItemDD] = useState(false);
  const [itemHighlightIndex, setItemHighlightIndex] = useState(-1);
  const [itemIdentifierType, setItemIdentifierType] = useState<'tag' | 'code'>('tag');
  const [lastPrices, setLastPrices] = useState<any[]>([]);

  // Main List
  const [lineItems, setLineItems] = useState<LineItem[]>([]);

  // Footer State
  const [showAdditionalDiscount, setShowAdditionalDiscount] = useState(false);
  const [globalDiscountPercent, setGlobalDiscountPercent] = useState(0);
  const [discountAmountFlat, setDiscountAmountFlat] = useState(0);
  const [shippingCharge, setShippingCharge] = useState(0);
  const [shippingGstRate, setShippingGstRate] = useState(0);
  const [roundOff, setRoundOff] = useState<string | number>('');
  const [remarks, setRemarks] = useState('');
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [amountPaid, setAmountPaid] = useState(0);
  const [txnId, setTxnId] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [banks, setBanks] = useState<any[]>([]);
  const [paymentBankId, setPaymentBankId] = useState('');

  useEffect(() => {
    if (paymentMode === 'UPI') {
      const defaultUpiBank = banks.find(b => b.isDefaultUpi);
      if (defaultUpiBank) setPaymentBankId(defaultUpiBank._id);
    } else if (paymentMode === 'Bank Transfer' || paymentMode === 'NEFT' || paymentMode === 'RTGS') {
      const defaultNeftBank = banks.find(b => b.isDefaultNeft);
      if (defaultNeftBank) setPaymentBankId(defaultNeftBank._id);
    } else if (paymentMode === 'Cheque') {
      const defaultChequeBank = banks.find(b => b.isDefaultCheque);
      if (defaultChequeBank) setPaymentBankId(defaultChequeBank._id);
    }
  }, [paymentMode, banks]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sRes, pRes, bRes, banksRes] = await Promise.all([
          suppliersApi.list({ limit: 200 }),
          productsApi.list({ limit: 500 }),
          businessApi.getProfile(),
          accountsApi.list({ type: 'Bank' })
        ]);
        setSuppliers(sRes.data.suppliers);
        const urlSuppId = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('supplier') : null;
        if (urlSuppId) {
          const supp = sRes.data.suppliers.find((s: any) => s._id === urlSuppId);
          if (supp) {
            setSupplierId(supp._id);
            setSupplierSnapshot(supp);
            setSupplierSearch(supp.name);
            setContactNo(supp.mobile || '');
            let addrStr = '';
            if (supp.billingAddress) {
              if (typeof supp.billingAddress === 'string') {
                addrStr = supp.billingAddress;
              } else {
                const parts = [
                  (supp.billingAddress as any).street,
                  (supp.billingAddress as any).city,
                  (supp.billingAddress as any).state,
                  (supp.billingAddress as any).pinCode,
                  (supp.billingAddress as any).country
                ].filter(Boolean);
                addrStr = parts.join(', ');
              }
            }
            setSupplierAddress(addrStr);
            setSupplierGstin(supp.gstin || '');
          }
        }
        setProducts(pRes.data.products);
        setBanks(banksRes.accounts || []);
        const bizUnits = bRes.data?.business?.units;
        if (bizUnits && bizUnits.length > 0) {
          setUnits(bizUnits);
          setItemInput(prev => ({ ...prev, unit: bizUnits[0] }));
        }
        const today = new Date().toISOString().split('T')[0];
        setBillDate(today);
        setDueDate(today);
        setPaymentDate(today);
      } catch (err) {
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Auto-calculate Due Date based on Payment Terms
  useEffect(() => {
    if (!billDate || !paymentTerms) return;
    const match = paymentTerms.match(/\d+/);
    if (match) {
      const days = parseInt(match[0], 10);
      const d = new Date(billDate);
      d.setDate(d.getDate() + days);
      setDueDate(d.toISOString().split('T')[0]);
    } else if (paymentTerms.toLowerCase() === 'due on receipt' || paymentTerms.toLowerCase().includes('cash')) {
      setDueDate(billDate);
    }
  }, [paymentTerms, billDate]);

  const filteredSuppliers = suppliers.filter(s => s?.name?.toLowerCase().includes(supplierSearch.toLowerCase()));
  const filteredProducts = products.filter(p => p?.name?.toLowerCase().includes(itemSearch.toLowerCase()));

  const pickSupplier = (s: Supplier) => {
    setSupplierId(s._id);
    setSupplierSearch(s.name);
    setSupplierSnapshot(s);
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
    
    if (supplierId) {
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

  const calculateItem = (item: LineItem, invType = purchaseType, interState = isInterState) => {
    const gross = item.quantity * item.rate;
    let discountAmt = item.discountAmount || 0;
    let discountPerc = item.discount || 0;
    
    if (item.discountType === 'amount') {
      discountPerc = gross > 0 ? (discountAmt / gross) * 100 : 0;
    } else {
      discountAmt = (gross * discountPerc) / 100;
    }
    
    const taxableAmount = round2(gross - discountAmt);
    const cgst = (invType === 'GST' && !interState) ? round2((taxableAmount * item.gstRate) / 2 / 100) : 0;
    const sgst = (invType === 'GST' && !interState) ? round2((taxableAmount * item.gstRate) / 2 / 100) : 0;
    const igst = (invType === 'GST' && interState) ? round2((taxableAmount * item.gstRate) / 100) : 0;
    const cessAmt = (invType === 'GST') ? round2((taxableAmount * item.cess) / 100) : 0;
    return { ...item, discount: round2(discountPerc), discountAmount: round2(discountAmt), taxableAmount, cgst, sgst, igst, totalAmount: round2(taxableAmount + cgst + sgst + igst + cessAmt) };
  };

  useEffect(() => {
    setLineItems(prev => prev.map(item => calculateItem(item, purchaseType, isInterState)));
  }, [purchaseType, isInterState]);

  const addItem = () => {
    if (!itemInput.productName) { toast.error('Select an item first'); return; }
    const newItem = calculateItem(itemInput);
    setLineItems([...lineItems, newItem]);

    setBatches(prev => {
       const productBatches = prev.filter(b => b.productId === newItem.productId);
       if (productBatches.length === 1) {
          return prev.map(b => b.productId === newItem.productId ? { ...b, quantity: newItem.quantity, mrp: newItem.mrp || newItem.rate } : b);
       }
       return prev;
    });
    setItemInput({
      productName: '', hsnCode: '', batchNo: '', tag: '', description: '',
      quantity: 1, unit: 'Nos', rate: 0, mrp: 0, discount: 0, discountAmount: 0, discountType: 'percentage', gstRate: 0, cess: 0,
      taxableAmount: 0, cgst: 0, sgst: 0, igst: 0, totalAmount: 0
    });
    setItemSearch('');
  };

  const removeItem = (idx: number) => setLineItems(lineItems.filter((_, i) => i !== idx));

  const editItem = (idx: number) => {
    setItemInput(lineItems[idx]);
    setItemSearch(lineItems[idx].productName);
    setLineItems(lineItems.filter((_, i) => i !== idx));
  };

  // Totals
  const totalTaxableAmount = lineItems.reduce((s, i) => s + i.taxableAmount, 0);

  let shipCGST = 0;
  let shipSGST = 0;
  let shipIGST = 0;
  
  if (shippingCharge > 0 && shippingGstRate > 0 && purchaseType === 'GST') {
    if (isInterState) {
      shipIGST = (shippingCharge * shippingGstRate) / 100;
    } else {
      shipCGST = (shippingCharge * shippingGstRate) / 2 / 100;
      shipSGST = (shippingCharge * shippingGstRate) / 2 / 100;
    }
  }

  const totalCGST = lineItems.reduce((s, i) => s + i.cgst, 0) + shipCGST;
  const totalSGST = lineItems.reduce((s, i) => s + i.sgst, 0) + shipSGST;
  const totalIGST = lineItems.reduce((s, i) => s + i.igst, 0) + shipIGST;
  
  const totalGST = totalCGST + totalSGST + totalIGST;
  const subtotal = round2(totalTaxableAmount + totalGST);
  const globalDiscountAmount = round2((subtotal * globalDiscountPercent) / 100) + discountAmountFlat;
  const additionalDiscount = globalDiscountAmount;
  const totalDiscount = lineItems.reduce((s, i) => s + ((i.quantity * i.rate) * i.discount / 100), 0);
  const grandTotal = round2(subtotal - additionalDiscount + shippingCharge + (parseFloat(roundOff as string) || 0));
  const balance = round2(grandTotal - amountPaid);

  const handleSave = async (saveStatus: 'draft' | 'received' | 'paid', printAfterSave: boolean = false) => {
    if (!billNumber.trim()) { toast.error('Purchase Bill No. is required'); return; }
    if (lineItems.length === 0) { toast.error('Add at least one item'); return; }
    
    // Strict batch validation
    const productRequiredQty: Record<string, { name: string, qty: number }> = {};
    for (const item of lineItems) {
       if (item.productId) {
         if (!productRequiredQty[item.productId]) {
            productRequiredQty[item.productId] = { name: item.productName, qty: 0 };
         }
         productRequiredQty[item.productId].qty += item.quantity;
       }
    }

    for (const productId of Object.keys(productRequiredQty)) {
       const itemBatches = batches.filter(b => b.productId === productId);
       if (itemBatches.length > 0) {
          const totalBatchQty = itemBatches.reduce((sum, b) => sum + (b.quantity || 0), 0);
          const requiredQty = productRequiredQty[productId].qty;
          if (totalBatchQty !== requiredQty) {
             toast.error(`Batch quantities for ${productRequiredQty[productId].name} must equal ${requiredQty}. Currently allocated: ${totalBatchQty}`);
             return;
          }
       }
    }

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
        supplierId: supplierId || undefined,
        supplierSnapshot: supplierSnapshot ? {
          name: supplierSnapshot?.name,
          mobile: contactNo,
          gstin: supplierGstin,
          address: supplierAddress
        } : { name: supplierSearch || 'Cash Supplier' },
        isInterState,
        lineItems,
        batches: batches,
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
        roundOff: parseFloat(roundOff as string) || 0,
        additionalDiscount,
        amountPaid,
        paymentMode,
        paymentBankId,
        paymentDate,
        txnId,
        notes: remarks,
        status: saveStatus === 'paid' ? 'paid' : (amountPaid + 0.05 >= grandTotal) ? 'paid' : amountPaid > 0 ? 'partial' : saveStatus,
      };
      const res = await purchasesApi.create(payload);
      toast.success(`Purchase Bill ${billNumber} Recorded!`);
      if (printAfterSave && res.data?.purchase?._id) {
        window.open(`/print/purchase/${res.data.purchase._id}`, '_blank');
      }
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
      <Topbar title="NEW PURCHASE BILL" />

      {/* Tabs */}
      <div className="flex px-4 pt-2 border-b border-slate-200 bg-[#F1F5F9] gap-1">
         <div onClick={() => setActiveTab('bill')} className={`px-4 py-2 text-xs font-semibold cursor-pointer ${activeTab === 'bill' ? 'bg-[#F1F5F9] border border-b-0 border-slate-200 rounded-t text-slate-900' : 'text-slate-600 hover:text-slate-900 border border-transparent'}`}>Purchase Bill</div>
         <div onClick={() => setActiveTab('batches')} className={`px-4 py-2 text-xs font-semibold cursor-pointer ${activeTab === 'batches' ? 'bg-white border-t-2 border-t-red-500 border-l border-r border-slate-200 rounded-t text-slate-900' : 'text-slate-600 hover:text-slate-900 border border-transparent'}`}>Batch Numbers</div>
      </div>

      <main className="flex-1 overflow-y-auto p-1 space-y-1 pb-14 bg-slate-50">
        
        {activeTab === 'bill' ? (
          <>
        <div className="erp-container">
          <div className="erp-header py-1 text-xs">Purchase bill information</div>
          <div className="p-1.5 grid grid-cols-5 gap-x-2 gap-y-1">
            <div>
              <label className="erp-label block mb-1">Purchase Type <span className="text-red-500">*</span></label>
              <select value={purchaseType} onChange={e => setPurchaseType(e.target.value)} className="erp-input w-full">
                <option>GST</option>
                <option value="Non-GST">Non-GST</option>
                <option>Bill of Supply</option>
              </select>
            </div>
            <div>
              <label className="erp-label block mb-1">Purchase Date</label>
              <input type="date" value={billDate} onChange={e => setBillDate(e.target.value)} className="erp-input w-full" />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                 <div className="flex items-center gap-2">
                   <label className="erp-label !mb-0">Supplier Name <span className="text-red-500">*</span></label>
                   {supplierId && supplierSnapshot && (
                     (() => {
                       const bal = supplierSnapshot.currentBalance !== undefined ? supplierSnapshot.currentBalance : (supplierSnapshot.openingBalance || 0);
                       return (
                         <div className={`text-[10px] px-1.5 py-0.5 rounded font-bold border ${bal > 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : bal < 0 ? 'bg-red-50 text-red-700 border-red-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>
                           A/C Bal: {formatAccountingBalance(bal, 'supplier').text}
                         </div>
                       );
                     })()
                   )}
                 </div>
                 <div className="flex gap-2">
                   {supplierId && supplierSnapshot && (
                     <span onClick={() => setShowEditSupplierModal(true)} className="text-[10px] text-blue-600 hover:text-blue-800 cursor-pointer underline flex items-center"><Edit className="w-3 h-3 mr-0.5" /> Edit</span>
                   )}
                   <span onClick={() => setShowQuickAddSupplierModal(true)} className="text-[10px] text-blue-600 hover:text-blue-800 cursor-pointer underline flex items-center"><Plus className="w-3 h-3 mr-0.5" /> Add</span>
                 </div>
              </div>
              <div className="relative">
                <div className="flex w-full relative">
                  <input value={supplierSearch} onChange={e => { setSupplierSearch(e.target.value); setShowSupplierDD(true); setSupplierHighlightIndex(-1); }} onFocus={() => setShowSupplierDD(true)} 
                    onKeyDown={e => {
                      if (!showSupplierDD) return;
                      if (e.key === 'ArrowDown') { e.preventDefault(); setSupplierHighlightIndex(prev => Math.min(prev + 1, filteredSuppliers.length - 1)); }
                      else if (e.key === 'ArrowUp') { e.preventDefault(); setSupplierHighlightIndex(prev => Math.max(prev - 1, 0)); }
                      else if (e.key === 'Enter') { e.preventDefault(); if (supplierHighlightIndex >= 0 && filteredSuppliers[supplierHighlightIndex]) pickSupplier(filteredSuppliers[supplierHighlightIndex]); }
                      else if (e.key === 'Escape') { setShowSupplierDD(false); }
                    }}
                    className="erp-input w-full pr-8" placeholder="Select or type..." />
                  <button type="button" onClick={() => setShowSupplierDD(!showSupplierDD)} className="absolute right-2 top-1.5 text-slate-400 hover:text-slate-600 bg-white px-1">
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
                {showSupplierDD && filteredSuppliers.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 z-50 max-h-40 overflow-y-auto shadow-2xl">
                    {filteredSuppliers.map((s, idx) => (
                      <div key={s._id} onClick={() => pickSupplier(s)} className={`px-2 py-1 text-xs cursor-pointer border-b border-slate-200 ${supplierHighlightIndex === idx ? 'bg-blue-100' : 'hover:bg-slate-100'}`}>
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

        <div className="erp-container">
          <div className="erp-header py-1 text-xs flex justify-between items-center">
            <span>Particulars</span>
          </div>
          <div className="p-1.5 space-y-1">
            <div className="grid grid-cols-[1fr_2fr_0.8fr_0.8fr_1fr_0.8fr_0.8fr_0.8fr_1fr] gap-2 items-end">
              <div>
                <label className="erp-label block mb-1">Batch No.</label>
                <input list="batch-list" value={itemInput.batchNo} onChange={e => setItemInput({...itemInput, batchNo: e.target.value})} className="erp-input w-full" placeholder="||||||" />
                <datalist id="batch-list">
                  {itemInput.productId && products.find(p => p._id === itemInput.productId)?.batches?.map((b: any) => (
                    <option key={b.batchNo} value={b.batchNo}>{b.batchNo} (Qty: {parseFloat((b.currentStock || 0).toFixed(2))})</option>
                  ))}
                </datalist>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                   <label className="erp-label block">Item Name <span className="text-red-500">*</span></label>
                   <span onClick={() => setShowQuickAddModal(true)} className="text-[10px] text-primary hover:text-blue-400 cursor-pointer underline">Add Item</span>
                </div>
                <div className="relative">
                  <div className="flex w-full relative">
                    <input value={itemSearch} onChange={e => { setItemSearch(e.target.value); setShowItemDD(true); setItemHighlightIndex(-1); }} onFocus={() => setShowItemDD(true)} 
                      onKeyDown={e => {
                        if (!showItemDD) return;
                        if (e.key === 'ArrowDown') { e.preventDefault(); setItemHighlightIndex(prev => Math.min(prev + 1, filteredProducts.length - 1)); }
                        else if (e.key === 'ArrowUp') { e.preventDefault(); setItemHighlightIndex(prev => Math.max(prev - 1, 0)); }
                        else if (e.key === 'Enter') { e.preventDefault(); if (itemHighlightIndex >= 0 && filteredProducts[itemHighlightIndex]) pickProduct(filteredProducts[itemHighlightIndex]); }
                        else if (e.key === 'Escape') { setShowItemDD(false); }
                      }}
                      className="erp-input w-full pr-8" placeholder="Select item..." />
                    <button type="button" onClick={() => setShowItemDD(!showItemDD)} className="absolute right-2 top-1.5 text-slate-400 hover:text-slate-600 bg-white px-1">
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                  {showItemDD && filteredProducts.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 z-50 max-h-40 overflow-y-auto shadow-2xl">
                      {filteredProducts.map((p, idx) => (
                        <div key={p._id} onClick={() => pickProduct(p)} className={`px-2 py-1 text-xs cursor-pointer border-b border-slate-200 flex justify-between ${itemHighlightIndex === idx ? 'bg-blue-100' : 'hover:bg-slate-100'}`}>
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
                <input type="number" value={itemInput.quantity === 0 ? '' : itemInput.quantity} step="0.001" onChange={e => setItemInput({...itemInput, quantity: parseFloat((parseFloat(e.target.value) || 0).toFixed(3))})} className="erp-input w-full" />
              </div>
              <div>
                <label className="erp-label block mb-1">Purchase Price <span className="text-red-500">*</span></label>
                <div className="flex">
                   <span className="bg-slate-100 px-2 py-1 text-xs border border-slate-200 border-r-0 flex items-center">₹</span>
                   <input type="number" value={itemInput.rate === 0 ? '' : itemInput.rate} step="0.001" onChange={e => setItemInput({...itemInput, rate: parseFloat((parseFloat(e.target.value) || 0).toFixed(3))})} className="erp-input w-full rounded-none" />
                </div>
              </div>
                            <div>
                <label className="erp-label block mb-1">Discount</label>
                <div className="flex">
                  <input 
                    type="number" 
                    value={itemInput.discountType === 'percentage' ? (itemInput.discount === 0 ? '' : itemInput.discount) : (itemInput.discountAmount === 0 ? '' : itemInput.discountAmount)} 
                    onChange={e => {
                      const val = parseFloat(e.target.value) || 0;
                      if(itemInput.discountType === 'percentage') {
                        setItemInput({...itemInput, discount: val, discountAmount: 0});
                      } else {
                        setItemInput({...itemInput, discountAmount: val, discount: 0});
                      }
                    }} 
                    className="erp-input w-full rounded-none" 
                  />
                  <select 
                    value={itemInput.discountType || 'percentage'} 
                    onChange={e => setItemInput({...itemInput, discountType: e.target.value as 'percentage' | 'amount', discount: 0, discountAmount: 0})} 
                    className="erp-input rounded-l-none bg-slate-100 px-1 border-l-0 text-xs w-12 cursor-pointer outline-none focus:ring-0">
                    <option value="percentage">%</option>
                    <option value="amount">₹</option>
                  </select>
                </div>
              </div>
                            {purchaseType === 'GST' && (
                <>
                  <div>
                    <label className="erp-label block mb-1">Tax (%)</label>
                    <input type="number" value={itemInput.gstRate === 0 ? '' : itemInput.gstRate} onChange={e => setItemInput({...itemInput, gstRate: parseFloat(e.target.value) || 0}) } className="erp-input w-full" />
                  </div>
                  <div>
                    <label className="erp-label block mb-1">Cess (%)</label>
                    <input type="number" value={itemInput.cess === 0 ? '' : itemInput.cess} step="0.001" onChange={e => setItemInput({...itemInput, cess: parseFloat((parseFloat(e.target.value) || 0).toFixed(3))})} className="erp-input w-full" />
                  </div>
                </>
              )}
              <div>
                <label className="erp-label block mb-1">Amount <span className="text-red-500">*</span></label>
                <div className="flex">
                   <span className="bg-slate-100 px-2 py-1 text-xs border border-slate-200 border-r-0 flex items-center">₹</span>
                   <div className="erp-input w-full rounded-none bg-white flex items-center">{calculateItem(itemInput).totalAmount > 0 ? calculateItem(itemInput).totalAmount.toFixed(2) : ''}</div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-[1fr_8fr_auto] gap-2 items-center pt-1">
               <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1 text-[11px] cursor-pointer">
                    <input type="radio" checked={itemIdentifierType === 'tag'} onChange={() => setItemIdentifierType('tag')} className="accent-blue-600" /> Item Tag
                  </label>
                  <label className="flex items-center gap-1 text-[11px] cursor-pointer">
                    <input type="radio" checked={itemIdentifierType === 'code'} onChange={() => setItemIdentifierType('code')} className="accent-blue-600" /> Item Code
                  </label>
               </div>
               <div>
                 <input value={itemInput.description} onChange={e => setItemInput({...itemInput, description: e.target.value})} className="erp-input w-full" placeholder="Item Description" />
               </div>
               <div className="flex items-center justify-center">
                 <button onClick={addItem} className="bg-slate-900 hover:bg-slate-800 text-white p-1 rounded-sm w-7 h-7 flex items-center justify-center transition mt-1">
                   <Plus className="w-5 h-5" />
                 </button>
               </div>
            </div>
          </div>
        </div>

        <div className="erp-container flex-1 overflow-hidden flex flex-col min-h-[150px]">
           <div 
             className={`erp-grid-header grid ${purchaseType === 'Non-GST' ? 'grid-cols-11' : ''} sticky top-0 z-10`}
             style={purchaseType === 'GST' ? { gridTemplateColumns: 'repeat(15, minmax(0, 1fr))' } : {}}
           >
               <div className="col-span-1 erp-grid-cell text-center">S.No.</div>
               <div className="col-span-3 erp-grid-cell">Item Details</div>
               <div className="col-span-1 erp-grid-cell text-center">Qty</div>
               <div className="col-span-1 erp-grid-cell text-center">Unit</div>
               <div className="col-span-1 erp-grid-cell text-center">Price</div>
               <div className="col-span-1 erp-grid-cell text-center">Disc</div>
               {purchaseType === 'GST' && (
                 <>
                   <div className="col-span-1 erp-grid-cell text-center">Tax (%)</div>
                   <div className="col-span-1 erp-grid-cell text-center">CGST</div>
                   <div className="col-span-1 erp-grid-cell text-center">SGST</div>
                   <div className="col-span-1 erp-grid-cell text-center">IGST</div>
                   <div className="col-span-1 erp-grid-cell text-center">Cess</div>
                 </>
               )}
               <div className={`erp-grid-cell text-right ${purchaseType === 'GST' ? 'col-span-1' : 'col-span-2'}`}>Amount</div>
               <div className="col-span-1 erp-grid-cell text-center"></div>
             </div>
           
           <div className="flex-1 overflow-y-auto bg-white">
              {lineItems.length === 0 ? (
                <div className="p-10 text-center text-slate-400 italic text-sm">No items added yet.</div>
              ) : (
                lineItems.map((item, idx) => (
                  <div 
                    key={idx} 
                    className={`grid ${purchaseType === 'Non-GST' ? 'grid-cols-11' : ''} hover:bg-slate-50 border-b border-slate-100 text-[11px] group`}
                    style={purchaseType === 'GST' ? { gridTemplateColumns: 'repeat(15, minmax(0, 1fr))' } : {}}
                  >
                    <div className="col-span-1 border-r border-slate-100 px-2 py-1.5 text-center text-slate-600">{idx + 1}</div>
                    <div className="col-span-3 border-r border-slate-100 px-2 py-1.5 font-medium text-slate-900">
                      {item.productName}
                      {item.tag && <span className="ml-2 text-[9px] bg-slate-200 px-1 rounded text-slate-600">{item.tag}</span>}
                      {item.description && <div className="text-[10px] text-slate-500 font-normal truncate mt-0.5" title={item.description}>{item.description}</div>}
                    </div>
                    <div className="col-span-1 border-r border-slate-100 px-2 py-1.5 text-center">{item.quantity}</div>
                    <div className="col-span-1 border-r border-slate-100 px-2 py-1.5 text-center">{item.unit}</div>
                    <div className="col-span-1 border-r border-slate-100 px-2 py-1.5 text-right">₹{(item.rate || 0).toFixed(3)}</div>
                    <div className="col-span-1 border-r border-slate-100 px-2 py-1.5 text-center text-red-500">
                      {item.discountType === 'percentage' && item.discount > 0 ? `${item.discount}%` : ''}
                      {item.discountType === 'amount' && item.discountAmount > 0 ? `₹${item.discountAmount.toFixed(2)}` : ''}
                    </div>
                    {purchaseType === 'GST' && (
                        <>
                          <div className="col-span-1 border-r border-slate-100 px-2 py-1.5 text-center">{item.gstRate}</div>
                          <div className="col-span-1 border-r border-slate-100 px-2 py-1.5 text-right">{item.cgst > 0 ? item.cgst.toFixed(2) : '-'}</div>
                          <div className="col-span-1 border-r border-slate-100 px-2 py-1.5 text-right">{item.sgst > 0 ? item.sgst.toFixed(2) : '-'}</div>
                          <div className="col-span-1 border-r border-slate-100 px-2 py-1.5 text-right">{item.igst > 0 ? item.igst.toFixed(2) : '-'}</div>
                          <div className="col-span-1 border-r border-slate-100 px-2 py-1.5 text-center">{item.cess || ''}</div>
                        </>
                    )}
                    <div className={`${purchaseType === 'GST' ? 'col-span-1' : 'col-span-2'} border-r border-slate-100 px-2 py-1.5 text-right font-medium flex items-center justify-end`}>
                      ₹{item.totalAmount.toFixed(2)}
                    </div>
                    <div className="col-span-1 px-2 py-1.5 flex items-center justify-center gap-1">
                      <button onClick={() => editItem(idx)} className="opacity-0 group-hover:opacity-100 p-0.5 text-blue-400 hover:text-blue-500 transition">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => removeItem(idx)} className="opacity-0 group-hover:opacity-100 p-0.5 text-red-500 hover:text-red-400 transition">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
             
             {/* Column 1: Summary */}
             <div className="erp-footer-box flex flex-col justify-between">
                <div>
                  <label className="erp-label block mb-1">Total Quantity</label>
                  <div className="text-xl font-bold bg-yellow-50 p-1 border border-yellow-200 text-yellow-700 rounded text-center">{lineItems.reduce((s, i) => s + i.quantity, 0)}</div>
                </div>
                
                <div className="flex gap-2 mt-2">
                  <div className="flex-1">
                    <label className="erp-label block mb-1">Discount (%)</label>
                    <input type="number" value={globalDiscountPercent === 0 ? '' : globalDiscountPercent} onChange={e => setGlobalDiscountPercent(parseFloat(e.target.value) || 0)} className="erp-input w-full" placeholder="%" />
                  </div>
                  <div className="flex-1">
                    <label className="erp-label block mb-1">Discount (₹)</label>
                    <input type="number" value={discountAmountFlat === 0 ? '' : discountAmountFlat} onChange={e => setDiscountAmountFlat(parseFloat(e.target.value) || 0)} className="erp-input w-full" placeholder="₹" />
                  </div>
                </div>

                {lastPrices.length > 0 && (
                  <div className="mt-2 w-full p-2 bg-yellow-50 border border-yellow-100 rounded text-[10px] text-red-600 font-bold">
                    <p className="font-bold mb-1 border-b border-yellow-200 pb-1">Last Purchases</p>
                    {lastPrices.slice(0,3).map((lp, idx) => (
                      <div key={idx} className="flex justify-between border-b border-yellow-200/50 last:border-0 py-0.5">
                        <span>{new Date(lp.date).toLocaleDateString('en-GB')}</span>
                        <span className="font-medium text-xs">₹{lp.rate}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-2">
                  <label className="erp-label block mb-1">Shipping Charge & GST</label>
                  <div className="flex gap-1">
                    <input type="number" value={shippingCharge === 0 ? '' : shippingCharge} onChange={e => setShippingCharge(parseFloat(e.target.value) || 0)} className="erp-input w-2/3" placeholder="Amount" />
                    <select value={shippingGstRate} onChange={e => setShippingGstRate(parseFloat(e.target.value))} className="erp-input w-1/3">
                      <option value="0">0%</option>
                      <option value="5">5%</option>
                      <option value="12">12%</option>
                      <option value="18">18%</option>
                      <option value="28">28%</option>
                    </select>
                  </div>
                </div>
             </div>

             {/* Column 2 & 3: Payment Details & Remarks */}
             <div className="erp-footer-box space-y-2 col-span-2 flex flex-col">
                <div className="bg-[#F1F5F9] p-1 text-[10px] font-bold text-center border border-slate-200">PAYMENT DETAILS & REMARKS</div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                  <div className="space-y-1">
                    <div className="text-[9px] text-slate-600 font-bold">PAYMENT DETAILS</div>
                    <select value={paymentMode} onChange={e => setPaymentMode(e.target.value)} className="erp-input w-full text-xs p-1 h-7 mb-1">
                      {PAYMENT_MODES.map(m => <option key={m}>{m}</option>)}
                    </select>
                    {['Bank Transfer', 'UPI', 'Cheque', 'NEFT', 'RTGS'].includes(paymentMode) && (
                      <select value={paymentBankId} onChange={e => setPaymentBankId(e.target.value)} className="erp-input w-full text-xs p-1 h-7 mb-1">
                        <option value="">-- Select Bank --</option>
                        {banks.map(b => <option key={b._id} value={b._id}>{b.bankName} ({b.accountNumber})</option>)}
                      </select>
                    )}
                    <div className="relative">
                      <span className="absolute left-1 top-1 text-[10px] text-slate-600">₹</span>
                      <input type="number" value={amountPaid === 0 ? '' : amountPaid} onChange={e => setAmountPaid(parseFloat(e.target.value) || 0)} className="erp-input w-full pl-3 text-xs p-1 h-7 text-emerald-400 font-bold" placeholder="Amount Paid" />
                    </div>
                    <div className="flex gap-1">
                      <input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} className="erp-input w-full text-xs p-1 h-7" title="Payment Date" />
                      <input value={txnId} onChange={e => setTxnId(e.target.value)} className="erp-input w-full text-xs p-1 h-7" placeholder="Txn ID" />
                    </div>
                  </div>
                  
                  <div className="space-y-1 h-full flex flex-col">
                    <div className="text-[9px] text-slate-600 font-bold">REMARKS (PRIVATE)</div>
                    <textarea value={remarks} onChange={e => setRemarks(e.target.value)} className="erp-input w-full flex-1 min-h-[60px] resize-none" placeholder="Enter remarks here..." />
                  </div>
                </div>
             </div>

             {/* Column 4: Totals & Grand Total */}
             <div className="erp-footer-box flex flex-col justify-between">
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                  {(globalDiscountAmount) > 0 && (
                    <div className="flex justify-between text-red-400">
                      <span>Discount</span>
                      <span>-₹{(globalDiscountAmount).toFixed(2)}</span>
                    </div>
                  )}
                  
                  {purchaseType === 'GST' && (
                    <>
                      <div className="flex justify-between text-slate-600">
                        <span>CGST</span>
                        <span>₹{totalCGST.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>SGST</span>
                        <span>₹{totalSGST.toFixed(2)}</span>
                      </div>
                      {totalIGST > 0 && (
                        <div className="flex justify-between text-slate-600">
                          <span>IGST</span>
                          <span>₹{totalIGST.toFixed(2)}</span>
                        </div>
                      )}
                      </>
                    )}
                    {shippingCharge > 0 && (
                      <div className="flex justify-between text-slate-600">
                        <span>Shipping Charge</span>
                        <span>₹{shippingCharge.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="pt-2 border-t border-slate-200 mt-2 space-y-1">
                  <div className="flex justify-between font-bold text-lg text-emerald-600">
                    <span>Grand Total</span>
                    <span>₹{grandTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500 items-center">
                    <span>Round Off</span>
                    <input type="number" value={roundOff} onChange={e => setRoundOff(e.target.value)} className="erp-input w-24 text-right h-7 p-1 text-xs" placeholder="0.00" />
                  </div>
                  <div className="flex justify-between font-bold text-sm text-blue-600 mt-1">
                    <span>Balance</span>
                    <span>₹{balance.toFixed(2)}</span>
                  </div>
                </div>
             </div>
        </div>
          </>
        ) : (
          <div className="erp-container h-full flex flex-col">
            <div className="erp-header py-1 text-xs">Add batch number</div>
            <div className="p-2 grid grid-cols-8 gap-2 items-end border-b border-slate-200 bg-white">
              <div className="col-span-2">
                 <label className="erp-label block mb-1">Item Name</label>
                 <select 
                    value={batchInput.productId} 
                    onChange={e => {
                       const pName = e.target.options[e.target.selectedIndex].text;
                       const existingBatch = lineItems.find(l => l.productId === e.target.value)?.batchNo || '';
                       const totalQty = lineItems.filter(l => l.productId === e.target.value).reduce((s, l) => s + l.quantity, 0);
                       const assignedQty = batches.filter(b => b.productId === e.target.value).reduce((s, b) => s + b.quantity, 0);
                       const remQty = Math.max(0, totalQty - assignedQty);
                       setBatchInput({...batchInput, productId: e.target.value, productName: pName, batchNo: existingBatch, quantity: remQty});
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
                 <label className="erp-label block mb-1">Batch No.</label>
                 <input value={batchInput.batchNo} onChange={e => setBatchInput({...batchInput, batchNo: e.target.value})} className="erp-input w-full" placeholder="||||||" />
              </div>
              <div className="col-span-1">
                 <label className="erp-label block mb-1">
                   Quantity 
                   {batchInput.productId && (
                     <span className="text-[10px] text-orange-600 font-bold ml-1">
                       (Rem: {Math.max(0, lineItems.filter(l => l.productId === batchInput.productId).reduce((s, l) => s + l.quantity, 0) - batches.filter(b => b.productId === batchInput.productId && b !== batchInput).reduce((s, b) => s + b.quantity, 0))})
                     </span>
                   )}
                 </label>
                 <input type="number" value={batchInput.quantity === 0 ? '' : batchInput.quantity} step="0.001" onChange={e => setBatchInput({...batchInput, quantity: parseFloat(e.target.value) || 0})} className="erp-input w-full" />
              </div>
              <div className="col-span-1">
                 <label className="erp-label block mb-1">Sale Price</label>
                 <div className="flex">
                    <span className="bg-slate-100 px-2 py-1 text-xs border border-slate-200 border-r-0 flex items-center">₹</span>
                    <input type="number" value={batchInput.salePrice || ''} onChange={e => setBatchInput({...batchInput, salePrice: parseFloat(e.target.value) || 0})} className="erp-input w-full rounded-none" />
                 </div>
              </div>
              <div className="col-span-2">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                   <div>
                     <label className="erp-label block mb-1">Mfg Date</label>
                     <input type="date" value={batchInput.manufacturingDate || ''} onChange={e => setBatchInput({...batchInput, manufacturingDate: e.target.value})} className="erp-input w-full text-[10px] p-0.5 h-[30px]" />
                   </div>
                   <div>
                     <label className="erp-label block mb-1">Expiry Date</label>
                     <input type="date" value={batchInput.expiryDate || ''} onChange={e => setBatchInput({...batchInput, expiryDate: e.target.value})} className="erp-input w-full text-[10px] p-0.5 h-[30px]" />
                   </div>
                 </div>
              </div>
              <div className="col-span-1 flex gap-2 mb-[2px]">
                 <button onClick={() => {
                    if(!batchInput.productId || !batchInput.batchNo) { toast.error("Select item and enter Batch No"); return; }
                    if(!batchInput.quantity || batchInput.quantity <= 0) { toast.error("Enter a valid quantity"); return; }
                    
                    const totalLineItemQty = lineItems.filter(l => l.productId === batchInput.productId).reduce((sum, l) => sum + l.quantity, 0);
                    const existingBatchQty = batches.filter(b => b.productId === batchInput.productId && !(b.productId === batchInput.productId && b.batchNo === batchInput.batchNo)).reduce((sum, b) => sum + (b.quantity || 0), 0);
                    if (existingBatchQty + batchInput.quantity > totalLineItemQty) {
                      toast.error(`Cannot add more. Max allowed for this item: ${totalLineItemQty}, Currently allocated: ${existingBatchQty}`);
                      return;
                    }

                    setBatches([...batches.filter(b => !(b.productId === batchInput.productId && b.batchNo === batchInput.batchNo)), batchInput]);
                    setBatchInput({productId: '', productName: '', batchNo: '', mrp: 0, salePrice: 0, minSalePrice: 0, quantity: 1, expiryDate: '', manufacturingDate: ''});
                 }} className="bg-slate-900 hover:bg-slate-800 text-white px-3 py-1 rounded text-xs flex items-center gap-1 transition h-[30px]"><Save className="w-3.5 h-3.5" /> Save</button>
              </div>
            </div>

            <div className="erp-header py-1 text-xs border-t-0 bg-transparent text-slate-500 font-medium ml-1 mt-1">Existing batch number(s)</div>
            <div className="flex-1 overflow-y-auto bg-slate-50 p-2">
               {batches.length === 0 ? (
                 <div className="flex flex-col items-center justify-center h-[200px] text-slate-400 opacity-50">
                    <Search className="w-16 h-16 mb-2 text-slate-400 opacity-80" />
                    <span className="text-sm">No batches added yet</span>
                 </div>
               ) : (
                 <div className="overflow-x-auto w-full">
                 <table className="w-full text-left border-collapse bg-white shadow-sm border border-slate-200">
                   <thead>
                     <tr className="bg-[#F1F5F9] text-slate-700 text-[10px] uppercase">
                       <th className="p-2 border border-slate-200">Item Name</th>
                       <th className="p-2 border border-slate-200">Batch No</th>
                       <th className="p-2 border border-slate-200 text-center">Qty</th>
                       <th className="p-2 border border-slate-200">Sale Price</th>
                       <th className="p-2 border border-slate-200 text-slate-500">Mfg Date</th>
                       <th className="p-2 border border-slate-200">Expiry</th>
                       <th className="p-2 border border-slate-200 w-10"></th>
                     </tr>
                   </thead>
                   <tbody>
                     {batches.map((b, i) => (
                       <tr key={i} className="text-xs hover:bg-slate-50">
                         <td className="p-2 border border-slate-200 text-slate-800">{b.productName}</td>
                         <td className="p-2 border border-slate-200 font-medium text-slate-900">{b.batchNo}</td>
                         <td className="p-2 border border-slate-200 text-center font-bold text-slate-700">{b.quantity}</td>
                         <td className="p-2 border border-slate-200">₹{(b.salePrice || 0).toFixed(2)}</td>
                         <td className="p-2 border border-slate-200 text-slate-500">{b.manufacturingDate || '-'}</td>
                         <td className="p-2 border border-slate-200 text-slate-600">{b.expiryDate || '-'}</td>
                         <td className="p-2 border border-slate-200 text-center flex justify-center gap-2">
                            <button onClick={() => setBatchInput(batches[i])} className="text-blue-500 hover:text-blue-700 p-1 bg-blue-50 rounded"><Pencil className="w-3.5 h-3.5" /></button>
                            <button onClick={() => setBatches(batches.filter((_, idx) => idx !== i))} className="text-red-500 hover:text-red-700 p-1 bg-red-50 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
                 </div>
               )}
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      {showQuickAddSupplierModal && (
        <QuickAddSupplierModal 
          onClose={() => setShowQuickAddSupplierModal(false)}
          onAdded={(s) => {
            setSuppliers([s, ...suppliers]);
            pickSupplier(s);
            setShowQuickAddSupplierModal(false);
          }}
        />
      )}

      {showEditSupplierModal && supplierSnapshot && (
        <QuickAddSupplierModal 
          supplierToEdit={{ ...supplierSnapshot, _id: supplierId }}
          onClose={() => setShowEditSupplierModal(false)}
          onAdded={(s) => {
            setSuppliers(suppliers.map(sup => sup._id === s._id ? s : sup));
            pickSupplier(s);
            setShowEditSupplierModal(false);
          }}
        />
      )}
      {showQuickAddModal && (
        <QuickAddItemModal 
          onClose={() => setShowQuickAddModal(false)}
          onAdded={(newProduct: any) => {
            setProducts([...products, newProduct]);
            setShowQuickAddModal(false);
            pickProduct(newProduct);
          }}
        />
      )}

      {/* Bottom Toolbar */}
      <footer className="fixed bottom-0 left-0 right-0 h-12 bg-[#F1F5F9] border-t border-slate-200 flex items-center justify-between px-4 z-50">
          <div className="flex gap-4"></div>
          <div className="flex items-center gap-4">
            <button onClick={() => handleSave('received', true)} disabled={saving} className="bg-[#1e3a8a] hover:bg-action-700 text-white px-6 py-1.5 rounded flex items-center gap-2 text-xs font-bold transition">
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


