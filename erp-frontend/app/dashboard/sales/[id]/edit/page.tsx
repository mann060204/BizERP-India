'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Topbar from '../../../../../components/layout/Topbar';
import { customersApi, productsApi, invoicesApi } from '../../../../../lib/erp-api';
import { Plus, Trash2, Search, Loader2, Save, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface Customer { _id: string; name: string; mobile?: string; gstin?: string; billingAddress?: any; }
interface Product { _id: string; name: string; sellingPrice: number; gstRate: number; hsnCode?: string; unit: string; }
interface LineItem { productId?: string; productName: string; hsnCode: string; quantity: number; unit: string; rate: number; discount: number; gstRate: number; taxableAmount: number; cgst: number; sgst: number; igst: number; totalAmount: number; }

const PAYMENT_MODES = ['Cash', 'UPI', 'NEFT', 'RTGS', 'Cheque', 'Credit'];
const STATES = ['Andhra Pradesh','Assam','Bihar','Chhattisgarh','Delhi','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal'];

const round2 = (n: number) => Math.round(n * 100) / 100;

const calcItem = (item: LineItem, isInterState: boolean): LineItem => {
  const gross = item.quantity * item.rate;
  const discountAmt = (gross * item.discount) / 100;
  const taxableAmount = round2(gross - discountAmt);
  const cgst = isInterState ? 0 : round2((taxableAmount * item.gstRate) / 2 / 100);
  const sgst = isInterState ? 0 : round2((taxableAmount * item.gstRate) / 2 / 100);
  const igst = isInterState ? round2((taxableAmount * item.gstRate) / 100) : 0;
  return { ...item, taxableAmount, cgst, sgst, igst, totalAmount: round2(taxableAmount + cgst + sgst + igst) };
};

const newLine = (): LineItem => ({ productName: '', hsnCode: '', quantity: 1, unit: 'Nos', rate: 0, discount: 0, gstRate: 18, taxableAmount: 0, cgst: 0, sgst: 0, igst: 0, totalAmount: 0 });

export default function EditInvoicePage() {
  const router = useRouter();
  const { id } = useParams();
  
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [productSearch, setProductSearch] = useState<Record<number, string>>({});
  const [showCustomerDD, setShowCustomerDD] = useState(false);
  const [showProductDD, setShowProductDD] = useState<Record<number, boolean>>({});
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [placeOfSupply, setPlaceOfSupply] = useState('');
  const [isInterState, setIsInterState] = useState(false);
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [amountReceived, setAmountReceived] = useState(0);
  const [notes, setNotes] = useState('');
  const [lineItems, setLineItems] = useState<LineItem[]>([newLine()]);
  const [saving, setSaving] = useState(false);

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
        setCustomerSearch(inv.customerSnapshot.name);
        if (inv.customerId) setSelectedCustomer(cRes.data.customers.find((c: Customer) => c._id === inv.customerId._id));
        setPlaceOfSupply(inv.placeOfSupply);
        setIsInterState(inv.isInterState);
        setPaymentMode(inv.paymentMode);
        setAmountReceived(inv.amountReceived);
        setNotes(inv.notes || '');
        setLineItems(inv.lineItems.map((item: any) => calcItem({...item}, inv.isInterState)));
        
        const initialPSearch: Record<number, string> = {};
        inv.lineItems.forEach((item: any, idx: number) => initialPSearch[idx] = item.productName);
        setProductSearch(initialPSearch);
        
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
  const filteredProducts = (idx: number) => products.filter(p => p.name.toLowerCase().includes((productSearch[idx] || '').toLowerCase()));

  const pickCustomer = (c: Customer) => { setSelectedCustomer(c); setCustomerSearch(c.name); setShowCustomerDD(false); };

  const pickProduct = (idx: number, p: Product) => {
    const updated = [...lineItems];
    updated[idx] = calcItem({ ...updated[idx], productId: p._id, productName: p.name, hsnCode: p.hsnCode || '', unit: p.unit, rate: p.sellingPrice, gstRate: p.gstRate }, isInterState);
    setLineItems(updated);
    setProductSearch({ ...productSearch, [idx]: p.name });
    setShowProductDD({ ...showProductDD, [idx]: false });
  };

  const updateLine = (idx: number, key: keyof LineItem, value: any) => {
    const updated = [...lineItems];
    (updated[idx] as any)[key] = value;
    updated[idx] = calcItem(updated[idx], isInterState);
    setLineItems(updated);
  };

  const addLine = () => setLineItems([...lineItems, newLine()]);
  const removeLine = (idx: number) => { if (lineItems.length === 1) return; setLineItems(lineItems.filter((_, i) => i !== idx)); };

  useEffect(() => {
    setLineItems(lines => lines.map(l => calcItem(l, isInterState)));
  }, [isInterState]);

  const subtotal = lineItems.reduce((s, i) => s + i.quantity * i.rate, 0);
  const totalDiscount = lineItems.reduce((s, i) => s + (i.quantity * i.rate * i.discount) / 100, 0);
  const totalTaxable = lineItems.reduce((s, i) => s + i.taxableAmount, 0);
  const totalCGST = lineItems.reduce((s, i) => s + i.cgst, 0);
  const totalSGST = lineItems.reduce((s, i) => s + i.sgst, 0);
  const totalIGST = lineItems.reduce((s, i) => s + i.igst, 0);
  const grandTotal = round2(totalTaxable + totalCGST + totalSGST + totalIGST);
  const balance = round2(grandTotal - amountReceived);

  const handleSave = async (saveStatus: 'draft' | 'sent' | 'paid') => {
    if (!lineItems.some(i => i.productName.trim())) { toast.error('Add at least one item'); return; }
    setSaving(true);
    try {
      const payload = {
        customerId: selectedCustomer?._id,
        customerSnapshot: selectedCustomer
          ? { name: selectedCustomer.name, mobile: selectedCustomer.mobile, gstin: selectedCustomer.gstin }
          : { name: 'Walk-in Customer' },
        placeOfSupply, isInterState, lineItems, paymentMode,
        amountReceived, notes,
        status: saveStatus === 'paid' ? 'paid' : amountReceived > 0 ? 'partial' : saveStatus,
      };
      await invoicesApi.update(id as string, payload);
      toast.success(`Invoice updated successfully!`);
      router.push('/dashboard/sales');
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed to update invoice'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex justify-center items-center h-screen"><Loader2 className="w-12 h-12 animate-spin text-[#D4D4D4]" /></div>;

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar title="Edit Invoice" />
      <main className="flex-1 p-6 space-y-6 max-w-6xl mx-auto w-full">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Edit GST Invoice</h2>
          <div className="flex gap-2">
            <button onClick={() => handleSave('draft')} disabled={saving} className="px-4 py-2 rounded-xl border border-[#1A1A1A] text-[#94a3b8] hover:text-white text-sm font-medium transition flex items-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Draft
            </button>
            <button onClick={() => handleSave('sent')} disabled={saving} className="px-4 py-2 rounded-xl bg-white text-black hover:bg-gray-200 text-sm font-semibold transition hover:opacity-90 flex items-center gap-2 shadow-lg shadow-white/10/30">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />} Update Invoice
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="glass rounded-2xl p-5 space-y-4">
              <h3 className="text-white font-semibold text-sm uppercase tracking-wider">Customer Details</h3>
              <div className="relative">
                <label className="block text-xs font-medium text-[#94a3b8] mb-1.5">Customer</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#475569]" />
                  <input value={customerSearch} onChange={e => { setCustomerSearch(e.target.value); setShowCustomerDD(true); if (!e.target.value) setSelectedCustomer(null); }}
                    onFocus={() => setShowCustomerDD(true)} placeholder="Search or type customer name..."
                    className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-[#111111] border border-[#1A1A1A] text-white placeholder-[#475569] focus:outline-none focus:border-[#D4D4D4] text-sm transition" />
                </div>
                {showCustomerDD && filteredCustomers.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-[#0A0A0A] border border-[#1A1A1A] rounded-xl shadow-xl z-20 max-h-48 overflow-y-auto">
                    {filteredCustomers.slice(0, 8).map(c => (
                      <button key={c._id} onClick={() => pickCustomer(c)} className="w-full text-left px-4 py-3 hover:bg-[#111111] transition text-sm">
                        <p className="text-white font-medium">{c.name}</p>
                        {c.mobile && <p className="text-[#475569] text-xs">{c.mobile}</p>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {selectedCustomer?.gstin && <p className="text-xs text-[#94a3b8]">GSTIN: <span className="font-mono text-white">{selectedCustomer.gstin}</span></p>}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#94a3b8] mb-1.5">Place of Supply</label>
                  <select value={placeOfSupply} onChange={e => { setPlaceOfSupply(e.target.value); }}
                    className="w-full px-3 py-2.5 rounded-lg bg-[#111111] border border-[#1A1A1A] text-white focus:outline-none focus:border-[#D4D4D4] text-sm transition">
                    <option value="">— Select State —</option>
                    {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#94a3b8] mb-1.5">Supply Type</label>
                  <div className="flex rounded-lg overflow-hidden border border-[#1A1A1A]">
                    {[{ label: 'Intra-state', v: false }, { label: 'Inter-state', v: true }].map(({ label, v }) => (
                      <button key={label} type="button" onClick={() => setIsInterState(v)}
                        className={`flex-1 py-2.5 text-xs font-medium transition ${isInterState === v ? 'bg-white text-black hover:bg-gray-200' : 'bg-[#111111] text-[#94a3b8] hover:text-white'}`}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="glass rounded-2xl p-5 space-y-3">
              <h3 className="text-white font-semibold text-sm uppercase tracking-wider">Line Items</h3>
              {lineItems.map((item, idx) => (
                <div key={idx} className="bg-[#111111] border border-[#1A1A1A] rounded-xl p-4 space-y-3">
                  <div className="flex items-start gap-2">
                    <div className="flex-1 relative">
                      <label className="block text-xs text-[#475569] mb-1">Item</label>
                      <div className="relative">
                        <input value={productSearch[idx] || item.productName}
                          onChange={e => { setProductSearch({ ...productSearch, [idx]: e.target.value }); updateLine(idx, 'productName', e.target.value); setShowProductDD({ ...showProductDD, [idx]: true }); }}
                          onFocus={() => setShowProductDD({ ...showProductDD, [idx]: true })}
                          placeholder="Search item..."
                          className="w-full px-3 py-2 rounded-lg bg-[#0A0A0A] border border-[#1A1A1A] text-white placeholder-[#475569] focus:outline-none focus:border-[#D4D4D4] text-sm transition" />
                        {showProductDD[idx] && filteredProducts(idx).length > 0 && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-[#0A0A0A] border border-[#1A1A1A] rounded-xl shadow-xl z-20 max-h-36 overflow-y-auto">
                            {filteredProducts(idx).slice(0, 6).map(p => (
                              <button key={p._id} onClick={() => pickProduct(idx, p)} className="w-full text-left px-3 py-2.5 hover:bg-[#111111] transition text-xs">
                                <span className="text-white">{p.name}</span>
                                <span className="text-[#475569] ml-2">₹{p.sellingPrice} | {p.gstRate}%</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <button onClick={() => removeLine(idx)} className="mt-5 p-2 text-[#475569] hover:text-red-400 hover:bg-red-900/10 rounded-lg transition"><Trash2 className="w-4 h-4" /></button>
                  </div>

                  <div className="grid grid-cols-5 gap-2">
                    {[
                      { label: 'Qty', key: 'quantity', type: 'number' },
                      { label: 'Rate (₹)', key: 'rate', type: 'number' },
                      { label: 'Disc (%)', key: 'discount', type: 'number' },
                      { label: 'GST %', key: 'gstRate', type: 'number' },
                    ].map(({ label, key, type }) => (
                      <div key={key}>
                        <label className="block text-xs text-[#475569] mb-1">{label}</label>
                        <input type={type} 
                          value={(item as any)[key] === 0 ? '' : (item as any)[key]}
                          onChange={e => updateLine(idx, key as keyof LineItem, e.target.value === '' ? 0 : parseFloat(e.target.value))}
                          className="w-full px-2 py-1.5 rounded-lg bg-[#0A0A0A] border border-[#1A1A1A] text-white text-sm focus:outline-none focus:border-[#D4D4D4] transition" />
                      </div>
                    ))}
                    <div>
                      <label className="block text-xs text-[#475569] mb-1">Amount</label>
                      <div className="px-2 py-1.5 rounded-lg bg-[#000000] border border-[#1A1A1A] text-emerald-400 text-sm font-semibold">₹{item.totalAmount.toFixed(2)}</div>
                    </div>
                  </div>
                  {item.taxableAmount > 0 && (
                    <div className="flex gap-3 text-xs text-[#475569]">
                      <span>Taxable: <span className="text-white">₹{item.taxableAmount.toFixed(2)}</span></span>
                      {!isInterState ? (<><span>CGST: <span className="text-white">₹{item.cgst.toFixed(2)}</span></span><span>SGST: <span className="text-white">₹{item.sgst.toFixed(2)}</span></span></>) : (<span>IGST: <span className="text-white">₹{item.igst.toFixed(2)}</span></span>)}
                    </div>
                  )}
                </div>
              ))}
              <button onClick={addLine} className="w-full py-2.5 rounded-xl border border-dashed border-[#1A1A1A] text-[#94a3b8] hover:text-[#D4D4D4] hover:border-[#D4D4D4] text-sm flex items-center justify-center gap-2 transition">
                <Plus className="w-4 h-4" /> Add Line Item
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="glass rounded-2xl p-5 space-y-3 sticky top-20">
              <h3 className="text-white font-semibold text-sm uppercase tracking-wider">Invoice Summary</h3>

              <div className="space-y-2 text-sm">
                {[
                  { label: 'Subtotal', val: subtotal },
                  { label: 'Total Discount', val: -totalDiscount },
                  { label: 'Taxable Amount', val: totalTaxable },
                ].map(r => (
                  <div key={r.label} className="flex justify-between text-[#94a3b8]">
                    <span>{r.label}</span>
                    <span className={r.val < 0 ? 'text-red-400' : 'text-white'}>₹{Math.abs(r.val).toFixed(2)}</span>
                  </div>
                ))}
                {!isInterState ? (
                  <>
                    <div className="flex justify-between text-[#94a3b8]"><span>CGST</span><span className="text-white">₹{totalCGST.toFixed(2)}</span></div>
                    <div className="flex justify-between text-[#94a3b8]"><span>SGST</span><span className="text-white">₹{totalSGST.toFixed(2)}</span></div>
                  </>
                ) : (
                  <div className="flex justify-between text-[#94a3b8]"><span>IGST</span><span className="text-white">₹{totalIGST.toFixed(2)}</span></div>
                )}
                <div className="border-t border-[#1A1A1A] pt-2 flex justify-between font-bold text-base">
                  <span className="text-white">Grand Total</span>
                  <span className="text-[#D4D4D4]">₹{grandTotal.toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t border-[#1A1A1A]">
                <div>
                  <label className="block text-xs font-medium text-[#94a3b8] mb-1.5">Payment Mode</label>
                  <select value={paymentMode} onChange={e => setPaymentMode(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#111111] border border-[#1A1A1A] text-white focus:outline-none focus:border-[#D4D4D4] text-sm transition">
                    {PAYMENT_MODES.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#94a3b8] mb-1.5">Amount Received (₹)</label>
                  <input type="number" value={amountReceived === 0 ? '' : amountReceived} onChange={e => setAmountReceived(e.target.value === '' ? 0 : parseFloat(e.target.value))}
                    max={grandTotal}
                    className="w-full px-3 py-2 rounded-lg bg-[#111111] border border-[#1A1A1A] text-white focus:outline-none focus:border-[#D4D4D4] text-sm transition" />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#94a3b8]">Balance Due</span>
                  <span className={balance > 0 ? 'text-red-400 font-bold' : 'text-green-400 font-bold'}>₹{balance.toFixed(2)}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#94a3b8] mb-1.5">Notes</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Payment terms, thank you note..."
                  className="w-full px-3 py-2 rounded-lg bg-[#111111] border border-[#1A1A1A] text-white placeholder-[#475569] focus:outline-none focus:border-[#D4D4D4] text-sm transition resize-none" />
              </div>

              <button onClick={() => handleSave('sent')} disabled={saving} className="w-full py-3 rounded-xl bg-white text-black hover:bg-gray-200 font-semibold text-sm hover:opacity-90 disabled:opacity-60 transition flex items-center justify-center gap-2 shadow-lg shadow-white/10/30">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />} Update Invoice
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
