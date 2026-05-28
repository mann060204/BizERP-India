'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Topbar from '../../../../components/layout/Topbar';
import { customersApi, productsApi, invoicesApi } from '../../../../lib/erp-api';
import { 
  Plus, Trash2, Search, Loader2, Save, CheckCircle, 
  Printer, RotateCcw, Calculator, Bell, Truck, Wallet, Hand, X, 
  Calendar, ChevronDown, User, MapPin, CreditCard, Tag as TagIcon, Pencil, UserPlus
} from 'lucide-react';
import toast from 'react-hot-toast';
import QuickAddItemModal from '../../../../components/modals/QuickAddItemModal';
import QuickAddCustomerModal from '../../../../components/modals/QuickAddCustomerModal';

interface Customer { _id: string; name: string; mobile?: string; gstin?: string; billingAddress?: string; priceCategory?: string; openingBalance?: number; }
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

export default function NewInvoicePage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Header State
  const [invoiceType, setInvoiceType] = useState('GST');
  const [invoiceNumber, setInvoiceNumber] = useState('GST-001');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
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
    quantity: 1, unit: 'Nos', rate: 0, mrp: 0, discount: 0, gstRate: 18, cess: 0,
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
  
  const totalAmountReceived = amountReceived1 + amountReceived2;
  const combinedPaymentMode = paymentMode2 && amountReceived2 > 0 ? `${paymentMode1} & ${paymentMode2}` : paymentMode1;
  const combinedTxnId = (txnId1 && txnId2 && amountReceived2 > 0) ? `${txnId1} (Date: ${paymentDate1}) | ${txnId2} (Date: ${paymentDate2})` : (txnId1 ? `${txnId1} (Date: ${paymentDate1})` : (txnId2 ? `${txnId2} (Date: ${paymentDate2})` : ''));

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cRes, pRes] = await Promise.all([
          customersApi.list({ limit: 200 }),
          productsApi.list({ limit: 500 })
        ]);
        setCustomers(cRes.data.customers);
        setProducts(pRes.data.products);
      } catch (err) {
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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
          setLastPriceInfo({ price: data.lastPrice, date: new Date(data.invoiceDate).toLocaleDateString() });
        } else {
          setLastPriceInfo(null);
        }
      } catch (e) {
        setLastPriceInfo(null);
      }
    }
  };

  const calculateItem = (item: LineItem, invType = invoiceType, interState = isInterState) => {
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
    setLineItems(prev => prev.map(item => calculateItem(item, invoiceType, isInterState)));
    // Fetch next invoice number based on type
    invoicesApi.getNextNumber(invoiceType as 'GST' | 'NON-GST')
      .then(res => {
        if (res.data?.nextInvoiceNumber) {
          setInvoiceNumber(res.data.nextInvoiceNumber);
        }
      })
      .catch(() => {
        // Fallback
        setInvoiceNumber(prev => {
          if (invoiceType === 'GST' && prev.startsWith('NON-GST')) return prev.replace('NON-GST', 'GST');
          if (invoiceType === 'NON-GST' && prev.startsWith('GST')) return prev.replace('GST', 'NON-GST');
          return prev;
        });
      });
  }, [invoiceType, isInterState]);

  const addItem = () => {
    if (!itemInput.productName) { toast.error('Select an item first'); return; }
    const newItem = calculateItem(itemInput);
    setLineItems([...lineItems, newItem]);
    // Reset input
    setItemInput({
      productName: '', hsnCode: '', batchNo: '', tag: '', description: '',
      quantity: 1, unit: 'Nos', rate: 0, mrp: 0, discount: 0, gstRate: 18, cess: 0,
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
  const shippingCGST = (invoiceType === 'GST' && !isInterState) ? round2(shippingCharge * 0.09) : 0;
  const shippingSGST = (invoiceType === 'GST' && !isInterState) ? round2(shippingCharge * 0.09) : 0;
  const shippingIGST = (invoiceType === 'GST' && isInterState) ? round2(shippingCharge * 0.18) : 0;

  const totalCGST = lineItems.reduce((s, i) => s + i.cgst, 0) + shippingCGST;
  const totalSGST = lineItems.reduce((s, i) => s + i.sgst, 0) + shippingSGST;
  const totalIGST = lineItems.reduce((s, i) => s + i.igst, 0) + shippingIGST;
  
  const preRoundTotal = totalTaxable + totalCGST + totalSGST + totalIGST + shippingCharge;
  const grandTotal = Math.round(preRoundTotal);
  const roundOff = round2(grandTotal - preRoundTotal);
  const balance = round2(grandTotal - totalAmountReceived);

  const handleSave = async (saveStatus: 'draft' | 'sent' | 'paid') => {
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
        invoiceType,
        lineItems,
        paymentMode: combinedPaymentMode,
        amountReceived: totalAmountReceived,
        txnId: combinedTxnId,
        shippingCharge,
          roundOff,
          subtotal,
        shippingAddress: useShippingAddress ? shippingAddress : '',
        notes: remarks,
        deliveryTerms,
        soldBy,
        billTo,
        status: saveStatus === 'paid' ? 'paid' : totalAmountReceived > 0 ? 'partial' : saveStatus,
      };
      const { data } = await invoicesApi.create(payload);
      toast.success(`Invoice ${data.invoice.invoiceNumber} Saved!`);
      router.push('/dashboard/sales');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to save invoice');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-[#F8FAFC]"><Loader2 className="w-10 h-10 animate-spin text-[#0F172A]" /></div>;

  return (
    <div className="flex flex-col h-screen bg-[#F8FAFC] text-[#0F172A] font-sans overflow-hidden">
      <Topbar title="New Invoice" />

      <main className="flex-1 overflow-y-auto p-1 space-y-1 pb-14">
        
        {/* Section 1: Invoice Information */}
        <div className="erp-container">
          <div className="erp-header py-1 text-xs">Invoice Information</div>
          <div className="p-1.5 grid grid-cols-6 gap-x-2 gap-y-1">
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
              <div className="flex justify-between items-center mb-1">
                 <label className="erp-label !mb-0 flex items-center gap-1.5">
                   Customer <span className="text-red-500">*</span>
                   <button onClick={() => setShowQuickAddCustomerModal(true)} className="text-emerald-500 hover:text-emerald-400 bg-emerald-500/10 p-0.5 rounded transition" title="Add Customer">
                     <UserPlus className="w-3.5 h-3.5" />
                   </button>
                 </label>
                 {selectedCustomer && selectedCustomer.openingBalance !== undefined && (
                   <div className={`text-[9px] px-1.5 py-0.5 rounded font-bold border ${selectedCustomer.openingBalance > 0 ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30' : selectedCustomer.openingBalance < 0 ? 'bg-red-500/20 text-red-500 border-red-500/30' : 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30'}`}>
                     A/C Bal: {selectedCustomer.openingBalance > 0 ? '₹' + selectedCustomer.openingBalance.toFixed(2) + ' Dr' : selectedCustomer.openingBalance < 0 ? '₹' + Math.abs(selectedCustomer.openingBalance).toFixed(2) + ' Cr' : '₹0.00'}
                   </div>
                 )}
              </div>
              <div className="relative">
                <input value={customerSearch} onChange={e => { setCustomerSearch(e.target.value); setShowCustomerDD(true); }} onFocus={() => setShowCustomerDD(true)} className="erp-input w-full pr-24" placeholder="Search customer..." />
                {selectedCustomer && (
                   <span className={`absolute right-1 top-1 text-[9px] px-1.5 py-1 rounded font-bold uppercase tracking-wider ${selectedCustomer.priceCategory === 'Wholesale' ? 'bg-purple-900/40 text-purple-400' : 'bg-blue-900/40 text-blue-400'}`}>
                      {selectedCustomer.priceCategory === 'Wholesale' ? 'Wholesaler' : 'Retailer'}
                   </span>
                )}
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
            
            <div className="col-span-6 border-t border-[#1A1A1A] mt-2 pt-2">
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
                <input value={itemInput.batchNo} onChange={e => setItemInput({...itemInput, batchNo: e.target.value})} className="erp-input w-full bg-[#1a0000]" />
              </div>
              <div className="col-span-3 flex flex-col justify-end">
                <div className="flex justify-between items-end mb-1">
                  <label className="erp-label !mb-0 flex items-center gap-1.5">
                    Item Name <span className="text-red-500">*</span>
                    <button onClick={() => setShowAdvancedSearch(true)} className="text-blue-500 hover:text-blue-400 bg-blue-500/10 p-1 rounded transition" title="Advanced Search">
                      <Search className="w-4 h-4" />
                    </button>
                    <button onClick={() => setShowQuickAddModal(true)} className="text-emerald-500 hover:text-emerald-400 bg-emerald-500/10 p-1 rounded transition ml-1" title="Add New Item">
                      <Plus className="w-4 h-4" />
                    </button>
                    <button onClick={async () => { try { const { data } = await productsApi.list({limit:500}); setProducts(data.products); toast.success('Products Refreshed!'); } catch(e){} }} className="text-[#475569] hover:text-[#0F172A] bg-[#1A1A1A] hover:bg-[#262626] p-1 rounded transition ml-1" title="Refresh Items">
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </label>
                  {itemInput.productId && (
                    <span className="text-[9px] text-[#94a3b8]">
                      Stock: <span className="text-emerald-400 font-bold">{products.find(p => p._id === itemInput.productId)?.currentStock || 0}</span> | Rack: <span className="text-[#0F172A]">{products.find(p => p._id === itemInput.productId)?.location || 'N/A'}</span>
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input value={itemSearch} onChange={e => { setItemSearch(e.target.value); setShowItemDD(true); }} onFocus={() => setShowItemDD(true)} className="erp-input w-full" placeholder="Type item name..." />
                  {showItemDD && filteredProducts.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-[#0A0A0A] border border-[#1A1A1A] z-50 max-h-40 overflow-y-auto shadow-2xl">
                      {filteredProducts.map(p => (
                        <div key={p._id} onClick={() => pickProduct(p)} className="px-2 py-1.5 text-xs hover:bg-[#262626] cursor-pointer border-b border-[#1A1A1A] flex justify-between items-center group">
                          <div className="flex flex-col">
                            <span className="text-[#0F172A] font-medium">{p.name}</span>
                            <span className="text-[9px] text-[#94a3b8]">Stock: <span className={p.currentStock! <= 0 ? 'text-red-400 font-bold' : 'text-emerald-400'}>{p.currentStock || 0}</span></span>
                          </div>
                          <div className="flex gap-2 items-center">
                             {p.sellingPrice2 && <span className="text-[9px] text-purple-400 bg-purple-900/20 px-1 rounded opacity-0 group-hover:opacity-100">W: ₹{p.sellingPrice2}</span>}
                             <span className="text-[#475569] font-semibold text-xs">₹{p.sellingPrice}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
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
                    <><option>Nos</option><option>Kgs</option><option>Pcs</option><option>Mtr</option><option>Box</option></>
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
                   <span className="absolute left-1 top-1 text-[10px] text-[#475569]">₹</span>
                   <input type="number" value={itemInput.rate === 0 ? '' : itemInput.rate} onChange={e => setItemInput({...itemInput, rate: parseFloat(e.target.value) || 0})} className="erp-input w-full pl-3" />
                </div>
                
                {/* Price Options Dropdown on hover */}
                {itemInput.productId && (
                  <div className="absolute top-full left-0 z-50 mt-1 hidden group-hover:block bg-[#050505] border border-[#1A1A1A] p-1 rounded-lg shadow-2xl min-w-max border-t-[#0078D7]">
                     <div className="text-[9px] px-2 py-1.5 text-[#475569] font-bold uppercase tracking-wider border-b border-[#1A1A1A] mb-1">Available Prices</div>
                     
                     {[{ label: 'Retail', price: itemInput.primaryRate, color: 'text-[#0F172A]' },
                       { label: 'Wholesale', price: itemInput.sellingPrice2, color: 'text-purple-400' },
                       { label: 'Price 3', price: itemInput.sellingPrice3, color: 'text-blue-400' },
                       { label: 'M.R.P.', price: itemInput.mrp, color: 'text-orange-400' },
                       ...(lastPriceInfo ? [{ label: `Last Sold (${lastPriceInfo.date})`, price: lastPriceInfo.price, color: 'text-emerald-400', isLast: true }] : [])
                     ].map((opt, i) => opt.price ? (
                        <div key={i} onClick={() => {
                           const basePrice = opt.price!;
                           let newRate = basePrice;
                           if (itemInput.unit === itemInput.secondaryUnit && itemInput.conversionRate) {
                             newRate = basePrice / itemInput.conversionRate;
                           }
                           setItemInput({...itemInput, rate: newRate, selectedBaseRate: basePrice});
                        }} className={`px-3 py-1.5 text-xs hover:bg-[#111111] cursor-pointer flex justify-between gap-4 rounded ${opt.color} ${(opt as any).isLast ? 'border-t border-[#1A1A1A] mt-1 pt-2' : ''}`}>
                          <span>{opt.label}</span> <span>₹{opt.price}</span>
                        </div>
                     ) : null)}
                  </div>
                )}
              </div>
              <div>
                <label className="erp-label">MRP</label>
                <div className="relative">
                   <span className="absolute left-1 top-1 text-[10px] text-[#475569]">₹</span>
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
                  <div className="erp-input w-full bg-[#001a00] text-emerald-400 font-bold">₹{calculateItem(itemInput).totalAmount.toFixed(2)}</div>
               </div>
               <button onClick={addItem} className="bg-green-600 hover:bg-green-700 text-[#0F172A] p-1 rounded flex items-center justify-center">
                 <Plus className="w-5 h-5" />
               </button>
            </div>
          </div>
        </div>

        {/* Section 3: Item Grid */}
        <div className="erp-container flex-1 overflow-hidden flex flex-col min-h-[150px]">
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
                    <div className="col-span-3 erp-grid-cell font-medium flex flex-col justify-center">
                      <div>
                        {item.productName}
                        {item.tag && <span className="ml-2 text-[9px] bg-[#1A1A1A] px-1 rounded text-[#94a3b8]">{item.tag}</span>}
                      </div>
                      {item.description && <div className="text-[10px] text-[#475569] font-normal leading-tight mt-0.5">{item.description}</div>}
                    </div>
                    <div className="col-span-1 erp-grid-cell text-center">{item.quantity}</div>
                    <div className="col-span-1 erp-grid-cell">{item.unit}</div>
                    <div className="col-span-1 erp-grid-cell text-right">₹{item.rate.toFixed(2)}</div>
                    <div className="col-span-1 erp-grid-cell text-center text-red-400">{item.discount}%</div>
                    <div className="col-span-1 erp-grid-cell text-center text-blue-400">{item.gstRate}%</div>
                    <div className="col-span-1 erp-grid-cell text-center">{item.cess}%</div>
                    <div className="col-span-2 erp-grid-cell text-right font-bold text-emerald-400 flex justify-between items-center">
                      <span>₹{item.totalAmount.toFixed(2)}</span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                        <button onClick={() => editItem(idx)} className="p-1 text-blue-400 hover:bg-blue-500/10 rounded">
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

           {/* Column 2 & 3: Payment Details & Remarks */}
           <div className="erp-footer-box space-y-2 col-span-2 flex flex-col">
              <div className="bg-[#111111] p-1 text-[10px] font-bold text-center border border-[#1A1A1A]">PAYMENT DETAILS</div>
              
              <div className="grid grid-cols-2 gap-4 flex-1">
                <div className="space-y-1">
                  <div className="text-[9px] text-[#94a3b8] font-bold">PAYMENT 1</div>
                  <select value={paymentMode1} onChange={e => setPaymentMode1(e.target.value)} className="erp-input w-full text-xs p-1 h-7">
                    {PAYMENT_MODES.map(m => <option key={m}>{m}</option>)}
                  </select>
                  <div className="relative">
                    <span className="absolute left-1 top-1 text-[10px] text-[#475569]">₹</span>
                    <input type="number" value={amountReceived1 === 0 ? '' : amountReceived1} onChange={e => setAmountReceived1(parseFloat(e.target.value) || 0)} className="erp-input w-full pl-3 text-xs p-1 h-7 text-emerald-400 font-bold" placeholder="Amt 1" />
                  </div>
                  <div className="flex gap-1">
                    <input value={txnId1} onChange={e => setTxnId1(e.target.value)} className="erp-input w-1/2 text-xs p-1 h-7" placeholder="Txn ID" />
                    <input type="date" value={paymentDate1} onChange={e => setPaymentDate1(e.target.value)} className="erp-input w-1/2 text-xs p-1 h-7" />
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="text-[9px] text-[#94a3b8] font-bold">PAYMENT 2 (Opt)</div>
                  <select value={paymentMode2} onChange={e => setPaymentMode2(e.target.value)} className="erp-input w-full text-xs p-1 h-7">
                    <option value="">None</option>
                    {PAYMENT_MODES.map(m => <option key={m}>{m}</option>)}
                  </select>
                  <div className="relative">
                    <span className="absolute left-1 top-1 text-[10px] text-[#475569]">₹</span>
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
                <div className="flex justify-between text-[#94a3b8]">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                {totalDiscount > 0 && (
                  <div className="flex justify-between text-red-400">
                    <span>Discount</span>
                    <span>-₹{totalDiscount.toFixed(2)}</span>
                  </div>
                )}
                
                {invoiceType === 'GST' && (
                  <>
                    {!isInterState ? (
                      <>
                        <div className="flex justify-between text-[#94a3b8]">
                          <span>CGST</span>
                          <span>₹{totalCGST.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-[#94a3b8]">
                          <span>SGST</span>
                          <span>₹{totalSGST.toFixed(2)}</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex justify-between text-[#94a3b8]">
                        <span>IGST</span>
                        <span>₹{totalIGST.toFixed(2)}</span>
                      </div>
                    )}
                  </>
                )}

                <div className="flex justify-between items-center mt-2 pt-2 border-t border-[#1A1A1A]">
                  <span className="erp-label">Shipping</span>
                  <input type="number" value={shippingCharge === 0 ? '' : shippingCharge} onChange={e => setShippingCharge(parseFloat(e.target.value) || 0)} className="erp-input w-20 text-right h-7" />
                </div>
              </div>

              <div className="mt-4 pt-3 border-t-2 border-[#262626] space-y-1 bg-[#0A0A0A] -mx-2 -mb-2 p-3 rounded-b-lg">
                 {roundOff !== 0 && (
                   <div className="flex justify-between text-xs font-medium text-[#94a3b8] mb-1">
                     <span>Round Off</span>
                     <span>{roundOff > 0 ? '+' : ''}{roundOff.toFixed(2)}</span>
                   </div>
                 )}
                 <div className="flex justify-between items-end">
                    <span className="text-sm font-bold text-yellow-400">GRAND TOTAL</span>
                    <span className="text-3xl font-black text-emerald-400 tracking-tight">₹{grandTotal.toFixed(2)}</span>
                 </div>
                 <div className="flex justify-between text-[11px] font-bold text-[#94a3b8] mt-2 border-t border-[#1A1A1A] pt-2">
                    <span>Total Received</span>
                    <span>₹{totalAmountReceived.toFixed(2)}</span>
                 </div>
              </div>
           </div>
        </div>

      </main>

      {/* Advanced Item Search Modal */}
      {showAdvancedSearch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#F8FAFC]/60 backdrop-blur-sm">
          <div className="bg-[#050505] border border-[#1A1A1A] rounded-xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between p-3 border-b border-[#1A1A1A] bg-[#0A0A0A]">
              <h3 className="text-[#0F172A] font-bold text-sm">Item Search</h3>
              <button onClick={() => setShowAdvancedSearch(false)} className="p-1 rounded-lg hover:bg-[#111111] text-[#94a3b8] hover:text-[#0F172A] transition"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-3 bg-[#0A0A0A] border-b border-[#1A1A1A] grid grid-cols-5 gap-3 items-end">
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
                   <Search className="w-4 h-4 text-[#475569] absolute right-3 top-1/2 -translate-y-1/2" />
                 </div>
               </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2 bg-[#050505]">
              <div className="text-[10px] text-[#475569] uppercase font-bold mb-2 ml-1">Search Result(s) - {advFilteredProducts.length} items</div>
              {advFilteredProducts.length === 0 ? (
                 <div className="flex flex-col items-center justify-center py-20 text-[#475569]">
                   <Search className="w-10 h-10 mb-2 opacity-50" />
                   <p className="text-xs">No items found.</p>
                 </div>
              ) : (
                 <table className="w-full text-xs text-left">
                   <thead className="bg-[#0A0A0A] text-[#94a3b8] sticky top-0">
                     <tr>
                       <th className="p-2 font-medium border-b border-[#1A1A1A]">Item Name</th>
                       <th className="p-2 font-medium border-b border-[#1A1A1A]">Group</th>
                       <th className="p-2 font-medium border-b border-[#1A1A1A]">Brand</th>
                       <th className="p-2 font-medium border-b border-[#1A1A1A]">Location</th>
                       <th className="p-2 font-medium border-b border-[#1A1A1A]">Stock</th>
                       <th className="p-2 font-medium border-b border-[#1A1A1A]">Price</th>
                     </tr>
                   </thead>
                   <tbody>
                     {advFilteredProducts.map(p => (
                       <tr key={p._id} onClick={() => { pickProduct(p); setShowAdvancedSearch(false); }} className="border-b border-[#1A1A1A]/50 hover:bg-[#111111] cursor-pointer transition">
                         <td className="p-2 text-[#0F172A] font-medium">{p.name}</td>
                         <td className="p-2 text-[#94a3b8]">{p.group || '—'}</td>
                         <td className="p-2 text-[#94a3b8]">{p.brand || '—'}</td>
                         <td className="p-2 text-[#94a3b8]">{p.location || '—'}</td>
                         <td className={`p-2 font-bold ${p.currentStock! > 0 ? 'text-emerald-400' : 'text-red-400'}`}>{p.currentStock || 0}</td>
                         <td className="p-2 text-[#94a3b8]">₹{p.sellingPrice}</td>
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
      <footer className="fixed bottom-0 left-0 right-0 h-12 bg-[#050505] border-t border-[#1A1A1A] flex items-center justify-between px-4 z-50">
        <div className="flex gap-4">
           <Bell className="w-5 h-5 text-[#475569] hover:text-[#0F172A] cursor-pointer" />
           <Calculator className="w-5 h-5 text-[#475569] hover:text-[#0F172A] cursor-pointer" />
           <Truck className="w-5 h-5 text-[#475569] hover:text-[#0F172A] cursor-pointer" />
           <Wallet className="w-5 h-5 text-[#475569] hover:text-[#0F172A] cursor-pointer" />
           <Hand className="w-5 h-5 text-[#475569] hover:text-[#0F172A] cursor-pointer" />
           <Search className="w-5 h-5 text-[#475569] hover:text-[#0F172A] cursor-pointer" />
           <RotateCcw className="w-5 h-5 text-[#475569] hover:text-[#0F172A] cursor-pointer" />
        </div>
        
        <div className="text-xs font-mono text-[#475569]">
          Balance : <span className={balance > 0 ? 'text-red-500' : 'text-emerald-500'}>₹{balance.toFixed(2)}</span>
        </div>

        <div className="flex gap-2">
          <button onClick={() => handleSave('paid')} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-[#0F172A] px-4 py-1.5 rounded flex items-center gap-2 text-xs font-bold transition shadow-[0_0_15px_rgba(37,99,235,0.2)]">
            <Printer className="w-4 h-4" /> Save and Print
          </button>
          <button onClick={() => handleSave('sent')} disabled={saving} className="bg-blue-800 hover:bg-blue-900 text-[#0F172A] px-6 py-1.5 rounded flex items-center gap-2 text-xs font-bold transition">
            <Save className="w-4 h-4" /> Save
          </button>
        </div>
      </footer>
    </div>
  );
}
