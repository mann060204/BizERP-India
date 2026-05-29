'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from "next/navigation";
import Topbar from '../../../../../components/layout/Topbar';
import { customersApi, productsApi, quotationsApi, invoicesApi, businessApi } from '../../../../../lib/erp-api';
import { 
  Plus, Trash2, Search, Loader2, Save, CheckCircle, 
  Printer, RotateCcw, Calculator, Bell, Truck, Wallet, Hand, X, 
  Calendar, ChevronDown, User, MapPin, CreditCard, Tag as TagIcon, Pencil, UserPlus
} from 'lucide-react';
import toast from 'react-hot-toast';
import QuickAddItemModal from '../../../../../components/modals/QuickAddItemModal';
import QuickAddCustomerModal from '../../../../../components/modals/QuickAddCustomerModal';

interface Customer { _id: string; name: string; mobile?: string; gstin?: string; billingAddress?: string; priceCategory?: string; openingBalance?: number; currentBalance?: number; }
interface Product { _id: string; name: string; sellingPrice: number; sellingPrice2?: number; sellingPrice3?: number; gstRate: number; hsnCode?: string; unit: string; secondaryUnit?: string; secSalePrice?: number; conversionRate?: number; isDefaultSecondaryUnit?: boolean; mrp?: number; location?: string; currentStock?: number; group?: string; brand?: string; }
interface LineItem { 
  productId?: string; productName: string; hsnCode: string; batchNo: string; tag: string; description: string;
  quantity: number; unit: string; rate: number; mrp: number; discount: number; gstRate: number; cess: number;
  taxableAmount: number; cgst: number; sgst: number; igst: number; totalAmount: number; 
  primaryUnit?: string; secondaryUnit?: string; primaryRate?: number; sellingPrice2?: number; sellingPrice3?: number; secSalePrice?: number; conversionRate?: number;
  selectedBaseRate?: number;
}

const PAYMENT_MODES = ['Cash', 'UPI', 'NEFT', 'RTGS', 'Cheque', 'Credit'];
const STATES = ['Andhra Pradesh','Assam','Bihar','Chhattisgarh','Delhi','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal'];

const round2 = (n: number) => Math.round(n * 100) / 100;

export default function NewQuotationPage() {
  const router = useRouter();
  const { id } = useParams();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [units, setUnits] = useState<string[]>(['Nos', 'Kg', 'Ltr', 'Box', 'Pcs', 'Mtr']);
  const [discountSchemes, setDiscountSchemes] = useState<any[]>([]);
  const [selectedSchemeId, setSelectedSchemeId] = useState('');

  // Header State
  const [quotationType, setQuotationType] = useState('GST');
  const [quotationNumber, setQuotationNumber] = useState('EST-001');
  const [quotationDate, setQuotationDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [placeOfSupply, setPlaceOfSupply] = useState('Gujarat');
  const [billTo, setBillTo] = useState<'Cash' | 'Customer'>('Customer');
  const [contactNo, setContactNo] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDD, setShowCustomerDD] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerGstin, setCustomerGstin] = useState('');
  const [isInterState, setIsInterState] = useState(false);
  const [useShippingAddress, setUseShippingAddress] = useState(false);
  const [shippingAddress, setShippingAddress] = useState('');

  // Particulars (Input Row) State
  const [itemInput, setItemInput] = useState<LineItem>({
    productName: '', hsnCode: '', batchNo: '', tag: '', description: '',
    quantity: 1, unit: 'Nos', rate: 0, mrp: 0, discount: 0, gstRate: 0, cess: 0,
    taxableAmount: 0, cgst: 0, sgst: 0, igst: 0, totalAmount: 0
  });
  const [itemSearch, setItemSearch] = useState('');
  const [showItemDD, setShowItemDD] = useState(false);
  const [lastPriceInfo, setLastPriceInfo] = useState<{ price: number, date: string } | null>(null);

  // Advanced Search Modal State
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);
  const [showQuickAddCustomerModal, setShowQuickAddCustomerModal] = useState(false);
  const [advGroup, setAdvGroup] = useState('');
  const [advBrand, setAdvBrand] = useState('');
  const [advLocation, setAdvLocation] = useState('');
  const [advText, setAdvText] = useState('');

  // Main List
  const [lineItems, setLineItems] = useState<LineItem[]>([]);

  // Footer State
  const [soldBy, setSoldBy] = useState('');
  const [deliveryTerms, setDeliveryTerms] = useState('');
  const [remarks, setRemarks] = useState('');
  const [paymentMode1, setPaymentMode1] = useState('Cash');
  const [amountReceived1, setAmountReceived1] = useState(0);
  const [txnId1, setTxnId1] = useState('');
  const [paymentDate1, setPaymentDate1] = useState(new Date().toISOString().split('T')[0]);

  const [paymentMode2, setPaymentMode2] = useState('');
  const [amountReceived2, setAmountReceived2] = useState(0);
  const [txnId2, setTxnId2] = useState('');
  const [paymentDate2, setPaymentDate2] = useState(new Date().toISOString().split('T')[0]);

  const [shippingCharge, setShippingCharge] = useState(0);
  
  const totalAmountReceived = 0;
  const combinedPaymentMode = paymentMode2 && amountReceived2 > 0 ? `${paymentMode1} & ${paymentMode2}` : paymentMode1;
  const combinedTxnId = (txnId1 && txnId2 && amountReceived2 > 0) ? `${txnId1} (Date: ${paymentDate1}) | ${txnId2} (Date: ${paymentDate2})` : (txnId1 ? `${txnId1} (Date: ${paymentDate1})` : (txnId2 ? `${txnId2} (Date: ${paymentDate2})` : ''));

  
  useEffect(() => {
    const init = async () => {
      try {
        const [cRes, pRes, iRes, bRes] = await Promise.all([
          customersApi.list({ limit: 200 }),
          productsApi.list({ limit: 500 }),
          quotationsApi.getById(id as string),
          businessApi.getProfile()
        ]);
        
        setCustomers(cRes.data.customers);
        setProducts(pRes.data.products);
        const bizUnits = bRes.data?.business?.units;
        if (bizUnits && bizUnits.length > 0) setUnits(bizUnits);
        const bizDiscounts = bRes.data?.business?.discountSchemes || [];
        setDiscountSchemes(bizDiscounts.filter((d: any) => d.isActive));
        
        const inv = iRes.quotation;
        setQuotationNumber(inv.quotationNumber);
        if (inv.quotationNumber.startsWith('GST')) setQuotationType('GST');
        else if (inv.quotationNumber.startsWith('NON-GST')) setQuotationType('NON-GST');
        
        setQuotationDate(new Date(inv.quotationDate).toISOString().split('T')[0]);
        if (inv.dueDate) setDueDate(new Date(inv.dueDate).toISOString().split('T')[0]);
        setPlaceOfSupply(inv.placeOfSupply);
        setIsInterState(inv.isInterState);
        setBillTo(inv.billTo || 'Customer');
        setCustomerSearch(inv.customerSnapshot.name);
        setContactNo(inv.customerSnapshot.mobile || '');
        setCustomerAddress(inv.customerSnapshot.address || '');
        setCustomerGstin(inv.customerSnapshot.gstin || '');
        if (inv.customerId) setSelectedCustomer(cRes.data.customers.find((c: any) => c._id === (inv.customerId._id || inv.customerId)));
        
        setLineItems(inv.lineItems.map((item: any) => ({
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
        toast.error('Failed to load quotation');
        router.push('/dashboard/quotations');
      } finally {
        setLoading(false);
      }
    };
    if (id) init();
  }, [id]);

  const applyDiscountScheme = (schemeId: string) => {
    setSelectedSchemeId(schemeId);
    if (!schemeId) {
      setLineItems(prev => prev.map(item => calculateItem({ ...item, discount: 0 })));
      setItemInput(prev => ({ ...prev, discount: 0 }));
      toast.success('Discount scheme cleared');
      return;
    }
    const scheme = discountSchemes.find(s => (s._id || s.name) === schemeId);
    if (!scheme) return;
    
    let discountPercent = 0;
    if (scheme.type === 'PERCENTAGE') {
      discountPercent = scheme.value;
    } else {
      if (subtotal > 0) {
        discountPercent = round2((scheme.value / subtotal) * 100);
      }
    }
    
    setLineItems(prev => prev.map(item => calculateItem({ ...item, discount: discountPercent })));
    setItemInput(prev => ({ ...prev, discount: discountPercent }));
    toast.success(`Discount scheme "${scheme.name}" (${discountPercent}%) applied!`);
  };


  const filteredCustomers = customers.filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase()));
  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(itemSearch.toLowerCase()));

  const uniqueGroups = Array.from(new Set(products.map(p => p.group).filter(Boolean))) as string[];
  const uniqueBrands = Array.from(new Set(products.map(p => p.brand).filter(Boolean))) as string[];
  const uniqueLocations = Array.from(new Set(products.map(p => p.location).filter(Boolean))) as string[];

  const advFilteredProducts = products.filter(p => {
    if (advGroup && p.group !== advGroup) return false;
    if (advBrand && p.brand !== advBrand) return false;
    if (advLocation && p.location !== advLocation) return false;
    if (advText && !p.name.toLowerCase().includes(advText.toLowerCase()) && !p.hsnCode?.includes(advText)) return false;
    return true;
  });

  const pickCustomer = (c: Customer) => {
    setSelectedCustomer(c);
    setCustomerSearch(c.name);
    setContactNo(c.mobile || '');
    
    let addrStr = '';
    if (c.billingAddress) {
      if (typeof c.billingAddress === 'string') {
        addrStr = c.billingAddress;
      } else {
        const parts = [
          (c.billingAddress as any).street,
          (c.billingAddress as any).city,
          (c.billingAddress as any).state,
          (c.billingAddress as any).pinCode,
          (c.billingAddress as any).country
        ].filter(Boolean);
        addrStr = parts.join(', ');
      }
    }
    setCustomerAddress(addrStr);
    
    setCustomerGstin(c.gstin || '');
    setShowCustomerDD(false);
  };

  const pickProduct = async (p: Product) => {
    const isWholesale = selectedCustomer?.priceCategory === 'Wholesale';
    const primaryRate = isWholesale ? (p.sellingPrice2 || p.sellingPrice) : p.sellingPrice;
    const defaultUnit = p.isDefaultSecondaryUnit && p.secondaryUnit ? p.secondaryUnit : p.unit;
    const initialRate = defaultUnit === p.secondaryUnit && p.secSalePrice ? p.secSalePrice : primaryRate;

    setItemInput(prev => ({
      ...prev,
      productId: p._id,
      productName: p.name,
      hsnCode: p.hsnCode || '',
      rate: initialRate,
      mrp: p.mrp || p.sellingPrice,
      gstRate: p.gstRate,
      unit: defaultUnit,
      primaryUnit: p.unit,
      secondaryUnit: p.secondaryUnit,
      primaryRate: primaryRate,
      sellingPrice2: p.sellingPrice2,
      sellingPrice3: p.sellingPrice3,
      secSalePrice: p.secSalePrice,
      conversionRate: p.conversionRate,
      selectedBaseRate: primaryRate
    }));
    setItemSearch(p.name);
    setShowItemDD(false);

    if (selectedCustomer?._id) {
      try {
        const { data } = await invoicesApi.getLastPrice(selectedCustomer._id, p._id);
        if (data && data.lastPrice !== null) {
          setLastPriceInfo({ price: data.lastPrice, date: new Date(data.quotationDate).toLocaleDateString() });
        } else {
          setLastPriceInfo(null);
        }
      } catch (e) {
        setLastPriceInfo(null);
      }
    }
  };

  const calculateItem = (item: LineItem, invType = quotationType, interState = isInterState) => {
    const gross = item.quantity * item.rate;
    const discountAmt = (gross * item.discount) / 100;
    const taxableAmount = round2(gross - discountAmt);
    const cgst = (invType === 'GST' && !interState) ? round2((taxableAmount * item.gstRate) / 2 / 100) : 0;
    const sgst = (invType === 'GST' && !interState) ? round2((taxableAmount * item.gstRate) / 2 / 100) : 0;
    const igst = (invType === 'GST' && interState) ? round2((taxableAmount * item.gstRate) / 100) : 0;
    const cessAmt = invType === 'GST' ? round2((taxableAmount * item.cess) / 100) : 0;
    return { ...item, taxableAmount, cgst, sgst, igst, totalAmount: round2(taxableAmount + cgst + sgst + igst + cessAmt) };
  };

  useEffect(() => {
    setLineItems(prev => prev.map(item => calculateItem(item, quotationType, isInterState)));
    setQuotationNumber(prev => {
      if (quotationType === 'GST' && prev.startsWith('NON-GST')) return prev.replace('NON-GST', 'GST');
      if (quotationType === 'NON-GST' && prev.startsWith('GST')) return prev.replace('GST', 'NON-GST');
      return prev;
    });
  }, [quotationType, isInterState]);

  const addItem = () => {
    if (!itemInput.productName) { toast.error('Select an item first'); return; }
    const newItem = calculateItem(itemInput);
    setLineItems([...lineItems, newItem]);
    // Reset input
    setItemInput({
      productName: '', hsnCode: '', batchNo: '', tag: '', description: '',
      quantity: 1, unit: 'Nos', rate: 0, mrp: 0, discount: 0, gstRate: 0, cess: 0,
      taxableAmount: 0, cgst: 0, sgst: 0, igst: 0, totalAmount: 0
    });
    setItemSearch('');
    setLastPriceInfo(null);
  };

  const removeItem = (idx: number) => setLineItems(lineItems.filter((_, i) => i !== idx));

  const editItem = (idx: number) => {
    setItemInput(lineItems[idx]);
    setItemSearch(lineItems[idx].productName);
    setLineItems(lineItems.filter((_, i) => i !== idx));
  };

  // Totals
  const totalQty = lineItems.reduce((s, i) => s + i.quantity, 0);
  const subtotal = lineItems.reduce((s, i) => s + i.quantity * i.rate, 0);
  const totalDiscount = lineItems.reduce((s, i) => s + (i.quantity * i.rate * i.discount) / 100, 0);
  const totalTaxable = lineItems.reduce((s, i) => s + i.taxableAmount, 0);
  const shippingCGST = (quotationType === 'GST' && !isInterState) ? round2(shippingCharge * 0.09) : 0;
  const shippingSGST = (quotationType === 'GST' && !isInterState) ? round2(shippingCharge * 0.09) : 0;
  const shippingIGST = (quotationType === 'GST' && isInterState) ? round2(shippingCharge * 0.18) : 0;

  const totalCGST = lineItems.reduce((s, i) => s + i.cgst, 0) + shippingCGST;
  const totalSGST = lineItems.reduce((s, i) => s + i.sgst, 0) + shippingSGST;
  const totalIGST = lineItems.reduce((s, i) => s + i.igst, 0) + shippingIGST;
  const totalCess = lineItems.reduce((s, i) => s + (quotationType === 'GST' ? round2((i.taxableAmount * i.cess) / 100) : 0), 0);
  
  const preRoundTotal = totalTaxable + totalCGST + totalSGST + totalIGST + totalCess + shippingCharge;
  const grandTotal = Math.round(preRoundTotal);
  const roundOff = round2(grandTotal - preRoundTotal);
  const balance = round2(grandTotal - totalAmountReceived);

  
  const handleConvertToInvoice = async () => {
    if (!window.confirm('Are you sure you want to convert this quotation to an invoice?')) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/v1/quotations/${id}/convert`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('erp_token')}`
        }
      });
      if (!res.ok) throw new Error('Failed to convert');
      const data = await res.json();
      toast.success('Successfully converted to Invoice!');
      router.push(`/dashboard/sales/${data._id}/edit`);
    } catch (e: any) {
      toast.error(e.message || 'Error converting');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async (printAfterSave: boolean) => {
    if (lineItems.length === 0) { toast.error('Add at least one item'); return; }
    setSaving(true);
    try {
      const payload = {
        quotationNumber,
        quotationDate,
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
        quotationType,
        lineItems,
        paymentMode: combinedPaymentMode,
        amountReceived: totalAmountReceived,
          txnId: combinedTxnId,
          shippingCharge,
          balance,
        roundOff,
        subtotal,
        shippingAddress: useShippingAddress ? shippingAddress : '',
        notes: remarks,
        deliveryTerms,
        soldBy,
        billTo,
        status: 'Draft',
      };
      await quotationsApi.update(id as string, payload);
      toast.success('Quotation Updated!');
      if (printAfterSave) {
        window.open(`/print/quotation/${id}`, '_blank');
      }
      router.push('/dashboard/quotations');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to save quotation');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-slate-50"><Loader2 className="w-10 h-10 animate-spin text-slate-900" /></div>;

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
      <Topbar title="Update Quotation" />

      <main className="flex-1 overflow-y-auto p-1 space-y-1 pb-14">
        
        {/* Section 1: Quotation Information */}
        <div className="erp-container">
          <div className="erp-header py-1 text-xs">Quotation Information</div>
          <div className="p-1.5 grid grid-cols-6 gap-x-2 gap-y-1">
            <div>
              <label className="erp-label">Quotation Type</label>
              <select value={quotationType} onChange={e => setQuotationType(e.target.value)} disabled className="erp-input w-full bg-slate-100 cursor-not-allowed">
                <option>GST</option>
                <option>NON-GST</option>
              </select>
            </div>
            <div>
              <label className="erp-label">Quotation No. <span className="text-red-500">*</span></label>
              <input value={quotationNumber} onChange={e => setQuotationNumber(e.target.value)} className="erp-input w-full" />
            </div>
            <div>
              <label className="erp-label">Date</label>
              <input type="date" value={quotationDate} onChange={e => setQuotationDate(e.target.value)} className="erp-input w-full" />
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
                 {selectedCustomer && (() => {
                    const bal = selectedCustomer.currentBalance !== undefined ? selectedCustomer.currentBalance : (selectedCustomer.openingBalance || 0);
                    return (
                      <div className={`text-xs px-2 py-0.5 rounded font-bold border ${bal > 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : bal < 0 ? 'bg-red-50 text-red-700 border-red-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>
                        A/C Bal: {bal > 0 ? '₹' + bal.toFixed(2) + ' Dr' : bal < 0 ? '₹' + Math.abs(bal).toFixed(2) + ' Cr' : '₹0.00'}
                      </div>
                    );
                  })()}
              </div>
              <div className="relative">
                <input value={customerSearch} onChange={e => { setCustomerSearch(e.target.value); setShowCustomerDD(true); }} onFocus={() => setShowCustomerDD(true)} className="erp-input w-full pr-24" placeholder="Search customer..." />
                {selectedCustomer && (
                   <span className={`absolute right-1 top-1 text-[9px] px-1.5 py-1 rounded font-bold uppercase tracking-wider ${selectedCustomer.priceCategory === 'Wholesale' ? 'bg-purple-100 text-purple-700' : 'bg-action-100 text-action-600'}`}>
                      {selectedCustomer.priceCategory === 'Wholesale' ? 'Wholesaler' : 'Retailer'}
                   </span>
                )}
                {showCustomerDD && filteredCustomers.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 z-50 max-h-40 overflow-y-auto shadow-2xl">
                    {filteredCustomers.map(c => (
                      <div key={c._id} onClick={() => pickCustomer(c)} className="px-2 py-1 text-xs hover:bg-slate-100 cursor-pointer border-b border-slate-200">
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
            
            <div className="col-span-6 border-t border-slate-200 mt-2 pt-2">
              <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                <input type="checkbox" checked={useShippingAddress} onChange={e => setUseShippingAddress(e.target.checked)} className="accent-white" />
                Custom Shipping Address
              </label>
              {useShippingAddress && (
                <div className="mt-2">
                  <label className="erp-label">Shipping Address</label>
                  <textarea value={shippingAddress} onChange={e => setShippingAddress(e.target.value)} className="erp-input w-full resize-none h-12" placeholder="Enter complete shipping address..." />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section 2: Particulars Input */}
        <div className="erp-container">
          <div className="erp-header py-1 text-xs">Particulars</div>
          <div className="p-1.5 space-y-1">
            <div className="grid grid-cols-10 gap-2">
              <div className="col-span-1">
                <label className="erp-label">Batch No.</label>
                <input value={itemInput.batchNo} onChange={e => setItemInput({...itemInput, batchNo: e.target.value})} className="erp-input w-full bg-slate-50" />
              </div>
              <div className="col-span-3 flex flex-col justify-end">
                <div className="flex justify-between items-end mb-1">
                  <label className="erp-label !mb-0 flex items-center gap-1.5">
                    Item Name <span className="text-red-500">*</span>
                    <button onClick={() => setShowAdvancedSearch(true)} className="text-action-500 hover:text-blue-400 bg-action-500/10 p-1 rounded transition" title="Advanced Search">
                      <Search className="w-4 h-4" />
                    </button>
                    <button onClick={() => setShowQuickAddModal(true)} className="text-emerald-500 hover:text-emerald-400 bg-emerald-500/10 p-1 rounded transition ml-1" title="Add New Item">
                      <Plus className="w-4 h-4" />
                    </button>
                    <button onClick={async () => { try { const { data } = await productsApi.list({limit:500}); setProducts(data.products); toast.success('Products Refreshed!'); } catch(e){} }} className="text-slate-600 hover:text-slate-900 bg-[#E2E8F0] hover:bg-slate-100 p-1 rounded transition ml-1" title="Refresh Items">
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </label>
                  {itemInput.productId && (
                    <span className="text-xs text-slate-600">
                      Stock: <span className="text-emerald-600 font-bold text-sm">{products.find(p => p._id === itemInput.productId)?.currentStock || 0}</span> | Rack: <span className="text-slate-900">{products.find(p => p._id === itemInput.productId)?.location || 'N/A'}</span>
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input value={itemSearch} onChange={e => { setItemSearch(e.target.value); setShowItemDD(true); }} onFocus={() => setShowItemDD(true)} className="erp-input w-full" placeholder="Type item name..." />
                  {showItemDD && filteredProducts.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 z-50 max-h-40 overflow-y-auto shadow-2xl">
                      {filteredProducts.map(p => (
                        <div key={p._id} onClick={() => pickProduct(p)} className="px-2 py-1.5 text-xs hover:bg-slate-100 cursor-pointer border-b border-slate-200 flex justify-between items-center group">
                          <div className="flex flex-col">
                            <span className="text-slate-900 font-medium">{p.name}</span>
                            <span className="text-[9px] text-slate-600">Stock: <span className={p.currentStock! <= 0 ? 'text-red-600 font-bold' : 'text-emerald-600'}>{p.currentStock || 0}</span></span>
                          </div>
                          <div className="flex gap-2 items-center">
                             {p.sellingPrice2 && <span className="text-[9px] text-purple-400 bg-purple-900/20 px-1 rounded opacity-0 group-hover:opacity-100">W: ₹{p.sellingPrice2}</span>}
                             <span className="text-slate-600 font-semibold text-xs">₹{p.sellingPrice}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {itemInput.productId && lastPriceInfo && (
                  <div className="mt-1 text-xs text-emerald-700 font-semibold bg-emerald-50 px-2 py-1 rounded border border-emerald-200 inline-block">
                    Last Sold: ₹{lastPriceInfo.price} ({lastPriceInfo.date})
                  </div>
                )}
              </div>
              <div className="col-span-1">
                <label className="erp-label">Unit <span className="text-red-500">*</span></label>
                <select 
                  value={itemInput.unit}
                  onChange={e => {
                    const newUnit = e.target.value;
                    let newRate = itemInput.rate;
                    if (newUnit === itemInput.secondaryUnit) {
                       newRate = itemInput.conversionRate ? (itemInput.selectedBaseRate || 0) / itemInput.conversionRate : (itemInput.secSalePrice || itemInput.rate);
                    } else if (newUnit === itemInput.primaryUnit) {
                       newRate = itemInput.selectedBaseRate || itemInput.primaryRate || 0;
                    }
                    setItemInput({...itemInput, unit: newUnit, rate: newRate});
                  }} 
                  className="erp-input w-full"
                >
                  {itemInput.primaryUnit ? (
                    <>
                      <option value={itemInput.primaryUnit}>{itemInput.primaryUnit}</option>
                      {itemInput.secondaryUnit && <option value={itemInput.secondaryUnit}>{itemInput.secondaryUnit}</option>}
                    </>
                  ) : (
                    <>{units.map(u => <option key={u} value={u}>{u}</option>)}</>
                  )}
                </select>
              </div>
              <div>
                <label className="erp-label">Quantity <span className="text-red-500">*</span></label>
                <input type="number" value={itemInput.quantity === 0 ? '' : itemInput.quantity} onChange={e => setItemInput({...itemInput, quantity: parseFloat(e.target.value) || 0})} className="erp-input w-full" />
              </div>
              <div className="relative group">
                <label className="erp-label">Sale Price <span className="text-[9px] text-blue-400 lowercase cursor-pointer">(options)▼</span></label>
                <div className="relative">
                   <span className="absolute left-1 top-1 text-[10px] text-slate-600">₹</span>
                   <input type="number" value={itemInput.rate === 0 ? '' : itemInput.rate} onChange={e => setItemInput({...itemInput, rate: parseFloat(e.target.value) || 0})} className="erp-input w-full pl-3" />
                </div>
                
                {lastPriceInfo && (
                  <div className="absolute top-full left-0 mt-0.5 text-[9px] text-emerald-400 bg-slate-50/80 px-1 rounded shadow cursor-pointer hover:bg-[#F1F5F9] whitespace-nowrap z-40" onClick={() => {
                     let newRate = lastPriceInfo.price;
                     if (itemInput.unit === itemInput.secondaryUnit && itemInput.conversionRate) {
                       newRate = lastPriceInfo.price / itemInput.conversionRate;
                     }
                     setItemInput({...itemInput, rate: newRate, selectedBaseRate: lastPriceInfo.price});
                  }}>
                    Last: ₹{lastPriceInfo.price} ({lastPriceInfo.date})
                  </div>
                )}

                {/* Price Options Dropdown on hover */}
                {itemInput.productId && (
                  <div className="absolute top-full left-0 z-50 mt-1 hidden group-hover:block bg-white border border-slate-200 p-1 rounded-lg shadow-2xl min-w-max border-t-[#0078D7]">
                     <div className="text-[10px] px-2 py-1.5 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200 mb-1">Available Prices</div>
                     
                     {[{ label: 'Retail', price: itemInput.primaryRate, color: 'text-slate-900' },
                       { label: 'Wholesale', price: itemInput.sellingPrice2, color: 'text-purple-600' },
                       { label: 'Price 3', price: itemInput.sellingPrice3, color: 'text-action-500' },
                       { label: 'M.R.P.', price: itemInput.mrp, color: 'text-orange-600' },
                       ...(lastPriceInfo ? [{ label: `Last Sold (${lastPriceInfo.date})`, price: lastPriceInfo.price, color: 'text-emerald-600', isLast: true }] : [])
                     ].map((opt, i) => opt.price ? (
                        <div key={i} onClick={() => {
                           const basePrice = opt.price!;
                           let newRate = basePrice;
                           if (itemInput.unit === itemInput.secondaryUnit && itemInput.conversionRate) {
                             newRate = basePrice / itemInput.conversionRate;
                           }
                           setItemInput({...itemInput, rate: newRate, selectedBaseRate: basePrice});
                        }} className={`px-3 py-1.5 text-xs hover:bg-[#F1F5F9] cursor-pointer flex justify-between gap-4 rounded ${opt.color} ${(opt as any).isLast ? 'border-t border-slate-200 mt-1 pt-2' : ''}`}>
                          <span>{opt.label}</span> <span>₹{opt.price}</span>
                        </div>
                     ) : null)}
                  </div>
                )}
              </div>
              <div>
                <label className="erp-label">MRP</label>
                <div className="relative">
                   <span className="absolute left-1 top-1 text-[10px] text-slate-600">₹</span>
                   <input type="number" value={itemInput.mrp === 0 ? '' : itemInput.mrp} onChange={e => setItemInput({...itemInput, mrp: parseFloat(e.target.value) || 0})} className="erp-input w-full pl-3" />
                </div>
              </div>
              <div>
                <label className="erp-label">Disc. (%)</label>
                <input type="number" value={itemInput.discount === 0 ? '' : itemInput.discount} onChange={e => setItemInput({...itemInput, discount: parseFloat(e.target.value) || 0})} className="erp-input w-full" />
              </div>
              <div>
                <label className="erp-label">Tax (%)</label>
                <input type="number" value={itemInput.gstRate === 0 ? '' : itemInput.gstRate} onChange={e => setItemInput({...itemInput, gstRate: parseFloat(e.target.value) || 0})} className="erp-input w-full" />
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
                 <input type="number" value={itemInput.cess === 0 ? '' : itemInput.cess} onChange={e => setItemInput({...itemInput, cess: parseFloat(e.target.value) || 0})} className="erp-input w-full" />
               </div>
               <div className="col-span-2">
                  <label className="erp-label">Amount</label>
                  <div className="erp-input w-full bg-emerald-50 text-emerald-600 font-bold">₹{calculateItem(itemInput).totalAmount.toFixed(2)}</div>
               </div>
               <button onClick={addItem} className="bg-green-600 hover:bg-green-700 text-slate-900 p-1 rounded flex items-center justify-center">
                 <Plus className="w-5 h-5" />
               </button>
            </div>
          </div>
        </div>

        {/* Section 3: Item Grid */}
        <div className="erp-container flex-1 overflow-hidden flex flex-col min-h-[150px]">
           <div className="grid grid-cols-12 erp-grid-header border-b border-slate-200">
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
           <div className="flex-1 overflow-y-auto bg-white">
              {lineItems.length === 0 ? (
                <div className="p-10 text-center text-slate-400 italic text-sm">No items added yet...</div>
              ) : (
                lineItems.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 erp-grid-row group">
                    <div className="col-span-1 erp-grid-cell text-slate-600">{idx + 1}</div>
                    <div className="col-span-3 erp-grid-cell font-medium flex flex-col justify-center">
                      <div>
                        {item.productName}
                        {item.tag && <span className="ml-2 text-[9px] bg-[#E2E8F0] px-1 rounded text-slate-600">{item.tag}</span>}
                      </div>
                      {item.description && <div className="text-[10px] text-slate-600 font-normal leading-tight mt-0.5">{item.description}</div>}
                    </div>
                    <div className="col-span-1 erp-grid-cell text-center">{item.quantity}</div>
                    <div className="col-span-1 erp-grid-cell">{item.unit}</div>
                    <div className="col-span-1 erp-grid-cell text-right">₹{item.rate.toFixed(2)}</div>
                    <div className="col-span-1 erp-grid-cell text-center text-red-400">{item.discount}%</div>
                    {quotationType === 'GST' && <div className="col-span-1 erp-grid-cell text-center text-blue-400">{item.gstRate}%</div>}
                    {quotationType === 'GST' && <div className="col-span-1 erp-grid-cell text-center">{item.cess}%</div>}
                    <div className={`erp-grid-cell text-right font-bold text-emerald-400 flex justify-between items-center ${quotationType === 'GST' ? 'col-span-2' : 'col-span-4'}`}>
                      <span>₹{item.totalAmount.toFixed(2)}</span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                        <button onClick={() => editItem(idx)} className="p-1 text-blue-400 hover:bg-action-500/10 rounded">
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button onClick={() => removeItem(idx)} className="p-1 text-red-500 hover:bg-red-500/10 rounded">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
           </div>
        </div>

        {/* Section 4: Footer */}
        <div className="grid grid-cols-4 gap-2">
           
           {/* Column 1: Summary */}
           <div className="erp-footer-box flex flex-col justify-between">
              <div>
                <label className="erp-label block mb-1">Total Quantity</label>
                <div className="text-xl font-bold bg-yellow-50 p-1 border border-yellow-200 text-yellow-700 rounded text-center">{totalQty}</div>
              </div>
              {discountSchemes.length > 0 && (
                <div>
                  <label className="erp-label block mb-1">Discount Scheme</label>
                  <select 
                    value={selectedSchemeId} 
                    onChange={e => applyDiscountScheme(e.target.value)} 
                    className="erp-input w-full text-slate-900"
                  >
                    <option value="">No Scheme</option>
                    {discountSchemes.map(s => (
                      <option key={s._id || s.name} value={s._id || s.name}>
                        {s.name} ({s.type === 'PERCENTAGE' ? `${s.value}%` : `₹${s.value}`})
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="erp-label block mb-1">Sold By</label>
                <select value={soldBy} onChange={e => setSoldBy(e.target.value)} className="erp-input w-full">
                  <option value="">Select Agent</option>
                  <option>Admin</option><option>Quotations Executive A</option>
                </select>
              </div>
           </div>

           {/* Column 2 & 3: Payment Details & Remarks */}
           <div className="erp-footer-box space-y-2 col-span-2 flex flex-col">
              <div className="hidden bg-[#F1F5F9] p-1 text-[10px] font-bold text-center border border-slate-200">PAYMENT DETAILS</div>
              
              <div className="hidden grid grid-cols-2 gap-4 flex-1">
                <div className="space-y-1">
                  <div className="text-[9px] text-slate-600 font-bold">PAYMENT 1</div>
                  <select value={paymentMode1} onChange={e => setPaymentMode1(e.target.value)} className="erp-input w-full text-xs p-1 h-7">
                    {PAYMENT_MODES.map(m => <option key={m}>{m}</option>)}
                  </select>
                  <div className="relative">
                    <span className="absolute left-1 top-1 text-[10px] text-slate-600">₹</span>
                    <input type="number" value={amountReceived1 === 0 ? '' : amountReceived1} onChange={e => setAmountReceived1(parseFloat(e.target.value) || 0)} className="erp-input w-full pl-3 text-xs p-1 h-7 text-emerald-400 font-bold" placeholder="Amt 1" />
                  </div>
                  <div className="flex gap-1">
                    <input value={txnId1} onChange={e => setTxnId1(e.target.value)} className="erp-input w-1/2 text-xs p-1 h-7" placeholder="Txn ID" />
                    <input type="date" value={paymentDate1} onChange={e => setPaymentDate1(e.target.value)} className="erp-input w-1/2 text-xs p-1 h-7" />
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="text-[9px] text-slate-600 font-bold">PAYMENT 2 (Opt)</div>
                  <select value={paymentMode2} onChange={e => setPaymentMode2(e.target.value)} className="erp-input w-full text-xs p-1 h-7">
                    <option value="">None</option>
                    {PAYMENT_MODES.map(m => <option key={m}>{m}</option>)}
                  </select>
                  <div className="relative">
                    <span className="absolute left-1 top-1 text-[10px] text-slate-600">₹</span>
                    <input type="number" value={amountReceived2 === 0 ? '' : amountReceived2} onChange={e => setAmountReceived2(parseFloat(e.target.value) || 0)} className="erp-input w-full pl-3 text-xs p-1 h-7 text-emerald-400 font-bold" placeholder="Amt 2" />
                  </div>
                  <div className="flex gap-1">
                    <input value={txnId2} onChange={e => setTxnId2(e.target.value)} className="erp-input w-1/2 text-xs p-1 h-7" placeholder="Txn ID" />
                    <input type="date" value={paymentDate2} onChange={e => setPaymentDate2(e.target.value)} className="erp-input w-1/2 text-xs p-1 h-7" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-2">
                 <div>
                    <label className="erp-label block mb-1">Delivery Terms</label>
                    <textarea value={deliveryTerms} onChange={e => setDeliveryTerms(e.target.value)} className="erp-input w-full h-10 resize-none" />
                 </div>
                 <div>
                    <label className="erp-label block mb-1">Remarks (Private)</label>
                    <textarea value={remarks} onChange={e => setRemarks(e.target.value)} className="erp-input w-full h-10 resize-none" />
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
                {totalDiscount > 0 && (
                  <div className="flex justify-between text-red-400">
                    <span>Discount</span>
                    <span>-₹{totalDiscount.toFixed(2)}</span>
                  </div>
                )}
                
                {quotationType === 'GST' && (
                  <>
                    {!isInterState ? (
                      <>
                        <div className="flex justify-between text-slate-600">
                          <span>CGST</span>
                          <span>₹{totalCGST.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>SGST</span>
                          <span>₹{totalSGST.toFixed(2)}</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex justify-between text-slate-600">
                        <span>IGST</span>
                        <span>₹{totalIGST.toFixed(2)}</span>
                      </div>
                    )}
                  </>
                )}

                <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-200">
                  <span className="erp-label">Shipping</span>
                  <input type="number" value={shippingCharge === 0 ? '' : shippingCharge} onChange={e => setShippingCharge(parseFloat(e.target.value) || 0)} className="erp-input w-20 text-right h-7" />
                </div>
              </div>

              <div className="mt-4 pt-3 border-t-2 border-slate-300 space-y-1 bg-white -mx-2 -mb-2 p-3 rounded-b-lg">
                 {roundOff !== 0 && (
                   <div className="flex justify-between text-xs font-medium text-slate-600 mb-1">
                     <span>Round Off</span>
                     <span>{roundOff > 0 ? '+' : ''}{roundOff.toFixed(2)}</span>
                   </div>
                 )}
                 <div className="flex justify-between items-end">
                    <span className="text-sm font-bold text-yellow-600">GRAND TOTAL</span>
                    <span className="text-3xl font-black text-emerald-600 tracking-tight">₹{grandTotal.toFixed(2)}</span>
                 </div>
                 <div className="flex justify-between text-[11px] font-bold text-slate-600 mt-2 border-t border-slate-200 pt-2">
                    <span>Total Received</span>
                    <span>₹{totalAmountReceived.toFixed(2)}</span>
                 </div>
              </div>
           </div>
        </div>

      </main>

      {/* Advanced Item Search Modal */}
      {showAdvancedSearch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-50/60 backdrop-blur-sm">
          <div className="bg-[#F1F5F9] border border-slate-200 rounded-xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between p-3 border-b border-slate-200 bg-white">
              <h3 className="text-slate-900 font-bold text-sm">Item Search</h3>
              <button onClick={() => setShowAdvancedSearch(false)} className="p-1 rounded-lg hover:bg-[#F1F5F9] text-slate-600 hover:text-slate-900 transition"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-3 bg-white border-b border-slate-200 grid grid-cols-5 gap-3 items-end">
               <div className="col-span-1">
                 <label className="erp-label">Group</label>
                 <select value={advGroup} onChange={e => setAdvGroup(e.target.value)} className="erp-input w-full"><option value="">All Groups</option>{uniqueGroups.map(g => <option key={g} value={g}>{g}</option>)}</select>
               </div>
               <div className="col-span-1">
                 <label className="erp-label">Brand</label>
                 <select value={advBrand} onChange={e => setAdvBrand(e.target.value)} className="erp-input w-full"><option value="">All Brands</option>{uniqueBrands.map(g => <option key={g} value={g}>{g}</option>)}</select>
               </div>
               <div className="col-span-1">
                 <label className="erp-label">Location/Rack</label>
                 <select value={advLocation} onChange={e => setAdvLocation(e.target.value)} className="erp-input w-full"><option value="">All Locations</option>{uniqueLocations.map(g => <option key={g} value={g}>{g}</option>)}</select>
               </div>
               <div className="col-span-2 relative">
                 <label className="erp-label">Enter text to search</label>
                 <div className="relative">
                   <input value={advText} onChange={e => setAdvText(e.target.value)} className="erp-input w-full pr-10" placeholder="Search by name or code..." />
                   <Search className="w-4 h-4 text-slate-600 absolute right-3 top-1/2 -translate-y-1/2" />
                 </div>
               </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2 bg-[#F1F5F9]">
              <div className="text-[10px] text-slate-600 uppercase font-bold mb-2 ml-1">Search Result(s) - {advFilteredProducts.length} items</div>
              {advFilteredProducts.length === 0 ? (
                 <div className="flex flex-col items-center justify-center py-20 text-slate-600">
                   <Search className="w-10 h-10 mb-2 opacity-50" />
                   <p className="text-xs">No items found.</p>
                 </div>
              ) : (
                 <table className="w-full text-xs text-left">
                   <thead className="bg-white text-slate-600 sticky top-0">
                     <tr>
                       <th className="p-2 font-medium border-b border-slate-200">Item Name</th>
                       <th className="p-2 font-medium border-b border-slate-200">Group</th>
                       <th className="p-2 font-medium border-b border-slate-200">Brand</th>
                       <th className="p-2 font-medium border-b border-slate-200">Location</th>
                       <th className="p-2 font-medium border-b border-slate-200">Stock</th>
                       <th className="p-2 font-medium border-b border-slate-200">Price</th>
                     </tr>
                   </thead>
                   <tbody>
                     {advFilteredProducts.map(p => (
                       <tr key={p._id} onClick={() => { pickProduct(p); setShowAdvancedSearch(false); }} className="border-b border-[#1A1A1A]/50 hover:bg-[#F1F5F9] cursor-pointer transition">
                         <td className="p-2 text-slate-900 font-medium">{p.name}</td>
                         <td className="p-2 text-slate-600">{p.group || '—'}</td>
                         <td className="p-2 text-slate-600">{p.brand || '—'}</td>
                         <td className="p-2 text-slate-600">{p.location || '—'}</td>
                         <td className={`p-2 font-bold ${p.currentStock! > 0 ? 'text-emerald-400' : 'text-red-400'}`}>{p.currentStock || 0}</td>
                         <td className="p-2 text-slate-600">₹{p.sellingPrice}</td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick Add Item Modal */}
      {showQuickAddModal && (
        <QuickAddItemModal 
          onClose={() => setShowQuickAddModal(false)}
          onAdded={(newProduct) => {
            setShowQuickAddModal(false);
            setProducts([...products, newProduct]);
            pickProduct(newProduct);
          }}
        />
      )}

      {/* Quick Add Customer Modal */}
      {showQuickAddCustomerModal && (
        <QuickAddCustomerModal 
          onClose={() => setShowQuickAddCustomerModal(false)}
          onAdded={(newCustomer) => {
            setShowQuickAddCustomerModal(false);
            setCustomers([...customers, newCustomer]);
            pickCustomer(newCustomer);
          }}
        />
      )}

      {/* Bottom Toolbar */}
      <footer className="fixed bottom-0 left-0 right-0 h-12 bg-[#F1F5F9] border-t border-slate-200 flex items-center justify-between px-4 z-50">
        <div className="flex gap-4">
           <Bell className="w-5 h-5 text-slate-600 hover:text-slate-900 cursor-pointer" />
           <Calculator className="w-5 h-5 text-slate-600 hover:text-slate-900 cursor-pointer" />
           <Truck className="w-5 h-5 text-slate-600 hover:text-slate-900 cursor-pointer" />
           <Wallet className="w-5 h-5 text-slate-600 hover:text-slate-900 cursor-pointer" />
           <Hand className="w-5 h-5 text-slate-600 hover:text-slate-900 cursor-pointer" />
           <Search className="w-5 h-5 text-slate-600 hover:text-slate-900 cursor-pointer" />
           <RotateCcw className="w-5 h-5 text-slate-600 hover:text-slate-900 cursor-pointer" />
        </div>
        
        <div className="text-xs font-mono text-slate-600">
          Balance : <span className={balance > 0 ? 'text-red-500' : 'text-emerald-500'}>₹{balance.toFixed(2)}</span>
        </div>

        <div className="flex gap-2">
          
            <button onClick={handleConvertToInvoice} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded flex items-center gap-2 text-xs font-bold transition">
              <CheckCircle className="w-4 h-4" /> Convert to Invoice
            </button>
            <button onClick={() => handleSave(true)}
 disabled={saving} className="bg-action-500 hover:bg-action-600 text-white px-4 py-1.5 rounded flex items-center gap-2 text-xs font-bold transition shadow-[0_0_15px_rgba(37,99,235,0.2)]">
            <Printer className="w-4 h-4" /> Save and Print
          </button>
          <button onClick={() => handleSave(false)} disabled={saving} className="bg-action-700 hover:bg-action-800 text-white px-6 py-1.5 rounded flex items-center gap-2 text-xs font-bold transition">
            <Save className="w-4 h-4" /> Update
          </button>
        </div>
      </footer>
    </div>
  );
}
