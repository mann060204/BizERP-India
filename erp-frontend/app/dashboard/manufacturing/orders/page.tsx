'use client';
import { useState, useEffect, useCallback } from 'react';
import { Plus, Hammer, RefreshCw, CheckCircle, XCircle, AlertTriangle, Eye, ChevronDown, ChevronRight, Clock, PackageCheck } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { manufacturingApi, productsApi } from '../../../../lib/erp-api';
import Topbar from '../../../../components/layout/Topbar';

type Product = { _id: string; name: string; productType: string; unit: string; currentStock: number; };
type PreviewLine = { productId: string; productName: string; unit: string; qtyPerUnit: number; required: number; available: number; shortage: number; rate: number; amount: number; ok: boolean; };
type PreviewData = { lines: PreviewLine[]; totalCost: number; costPerUnit: number; allAvailable: boolean; bom: any; };
type MO = { _id: string; orderNumber: string; productName: string; quantityToProduce: number; status: string; totalActualCost: number; totalEstimatedCost: number; createdAt: string; rawMaterials: any[]; notes?: string; };

const STATUS_MAP: Record<string, { label: string; cls: string; icon: any }> = {
  'Pending':   { label: 'Pending',   cls: 'bg-amber-100 text-amber-800 border border-amber-200',   icon: Clock },
  'Completed': { label: 'Confirmed', cls: 'bg-emerald-100 text-emerald-800 border border-emerald-200', icon: CheckCircle },
  'Cancelled': { label: 'Cancelled', cls: 'bg-red-100 text-red-700 border border-red-200',           icon: XCircle },
};

export default function ProductionPage() {
  const [tab, setTab] = useState<'new' | 'history'>('new');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<MO[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  // New entry form
  const [selectedProductId, setSelectedProductId] = useState('');
  const [produceQty, setProduceQty] = useState<number | ''>('');
  const [notes, setNotes] = useState('');
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // History
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [prodRes, moRes] = await Promise.all([
        productsApi.list({ limit: 500 }),
        manufacturingApi.getAll(),
      ]);
      setProducts(prodRes.data.products || []);
      setOrders(moRes.data.mos || []);
    } catch { toast.error('Failed to load data'); }
    finally { setLoadingOrders(false); }
  };

  const fgProducts = products.filter(p => p.productType === 'Finished Good' || p.productType === 'WIP Component');

  // Auto-fetch preview whenever product or qty changes (debounced)
  useEffect(() => {
    setPreview(null);
    if (!selectedProductId || !produceQty || Number(produceQty) <= 0) return;
    const timer = setTimeout(() => fetchPreview(), 400);
    return () => clearTimeout(timer);
  }, [selectedProductId, produceQty]);

  const fetchPreview = async () => {
    if (!selectedProductId || !produceQty || Number(produceQty) <= 0) return;
    setPreviewing(true);
    try {
      const res = await manufacturingApi.preview({ productId: selectedProductId, produceQty: Number(produceQty) });
      setPreview(res.data);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to fetch BOM preview');
      setPreview(null);
    } finally { setPreviewing(false); }
  };

  const handleSubmit = async () => {
    if (!selectedProductId) return toast.error('Select a Finished Good');
    if (!produceQty || Number(produceQty) <= 0) return toast.error('Enter produce quantity > 0');
    if (!preview?.allAvailable) return toast.error('Cannot confirm — some raw materials are short');
    setSubmitting(true);
    try {
      const draftRes = await manufacturingApi.create({ productId: selectedProductId, produceQty: Number(produceQty), notes });
      const moId = draftRes.data.mo._id;
      await manufacturingApi.confirm(moId);
      toast.success('Production confirmed! Stock updated.');
      setSelectedProductId(''); setProduceQty(''); setNotes(''); setPreview(null);
      setTab('history');
      loadData();
    } catch (e: any) {
      const shortages = e.response?.data?.shortages;
      if (shortages?.length) {
        toast.error(`Short: ${shortages.map((s: any) => `${s.productName} (need ${s.short} more)`).join(', ')}`);
      } else {
        toast.error(e.response?.data?.message || 'Failed to confirm production');
      }
    } finally { setSubmitting(false); }
  };

  const handleConfirm = async (id: string) => {
    if (!confirm('Confirm this production order? This will deduct RM stock and add FG stock.')) return;
    setConfirmingId(id);
    try {
      await manufacturingApi.confirm(id);
      toast.success('Production confirmed! Stock updated.');
      loadData();
    } catch (e: any) {
      const shortages = e.response?.data?.shortages;
      if (shortages?.length) {
        toast.error(`Insufficient stock: ${shortages.map((s: any) => `${s.productName} (short by ${s.short})`).join(', ')}`);
      } else {
        toast.error(e.response?.data?.message || 'Failed to confirm');
      }
    } finally { setConfirmingId(null); }
  };

  const handleCancel = async (mo: MO) => {
    const msg = mo.status === 'Completed'
      ? `Cancel "${mo.orderNumber}"? This will REVERSE all stock movements (RM returned, FG deducted).`
      : `Delete draft order "${mo.orderNumber}"?`;
    if (!confirm(msg)) return;
    setCancellingId(mo._id);
    try {
      if (mo.status === 'Completed') {
        await manufacturingApi.cancel(mo._id);
        toast.success('Production cancelled. Stock reversed.');
      } else {
        await manufacturingApi.cancel(mo._id);
        toast.success('Order cancelled.');
      }
      loadData();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to cancel');
    } finally { setCancellingId(null); }
  };

  const selectedProduct = products.find(p => p._id === selectedProductId);

  return (
    <div className="flex flex-col h-screen bg-[var(--bg-base,#f8fafc)]">
      <Topbar title="Production Entry" />

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200 px-6 flex gap-0">
        {([['new', 'New Production'], ['history', 'Production History']] as const).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-5 py-3 text-sm font-semibold border-b-2 transition ${tab === key ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            {label}
          </button>
        ))}
      </div>

      <main className="flex-1 overflow-y-auto p-6">

        {/* ─── TAB: NEW PRODUCTION ─── */}
        {tab === 'new' && (
          <div className="max-w-4xl mx-auto space-y-5">

            {/* Form */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-base font-bold text-slate-800 mb-5 flex items-center gap-2">
                <Hammer className="w-4 h-4 text-primary" /> Production Setup
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Finished Good to Produce *</label>
                  <select value={selectedProductId} onChange={e => setSelectedProductId(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30">
                    <option value="">— Select a Finished Good —</option>
                    {fgProducts.map(p => (
                      <option key={p._id} value={p._id}>{p.name} (Stock: {p.currentStock} {p.unit})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Produce Qty *</label>
                  <input type="number" min="1" step="1" placeholder="e.g. 50" value={produceQty}
                    onChange={e => setProduceQty(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Notes (optional)</label>
                  <input type="text" placeholder="Batch remarks, lot number, etc." value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
              </div>
            </div>

            {/* Preview */}
            {previewing && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 flex items-center justify-center gap-3 text-slate-400">
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span className="text-sm">Fetching BOM requirements...</span>
              </div>
            )}

            {!previewing && preview && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Availability banner */}
                <div className={`px-5 py-3 flex items-center gap-2.5 text-sm font-semibold ${preview.allAvailable ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-200' : 'bg-red-50 text-red-800 border-b border-red-200'}`}>
                  {preview.allAvailable
                    ? <><CheckCircle className="w-4 h-4" /> All materials available — ready to produce</>
                    : <><AlertTriangle className="w-4 h-4" /> Insufficient stock — cannot confirm until shortages are resolved</>}
                </div>

                {/* RM Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 font-medium uppercase tracking-wider">
                        <th className="px-4 py-2.5 text-left">Raw Material</th>
                        <th className="px-4 py-2.5 text-right">BOM Qty/unit</th>
                        <th className="px-4 py-2.5 text-right">Required ({Number(produceQty)} units)</th>
                        <th className="px-4 py-2.5 text-right">In Stock</th>
                        <th className="px-4 py-2.5 text-center">Status</th>
                        <th className="px-4 py-2.5 text-right">Rate</th>
                        <th className="px-4 py-2.5 text-right">Cost</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {preview.lines.map((line, i) => (
                        <tr key={i} className={`${line.ok ? 'hover:bg-slate-50' : 'bg-red-50/40 hover:bg-red-50'} transition`}>
                          <td className="px-4 py-3 font-medium text-slate-800">{line.productName}<span className="ml-1.5 text-[10px] text-slate-400">{line.unit}</span></td>
                          <td className="px-4 py-3 text-right text-slate-600">{line.qtyPerUnit}</td>
                          <td className="px-4 py-3 text-right font-semibold text-slate-700">{line.required}</td>
                          <td className="px-4 py-3 text-right font-semibold"
                            style={{ color: line.ok ? '#059669' : '#dc2626' }}>{line.available}</td>
                          <td className="px-4 py-3 text-center">
                            {line.ok
                              ? <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700"><CheckCircle className="w-3 h-3" /> OK</span>
                              : <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700"><XCircle className="w-3 h-3" /> Short by {line.shortage}</span>}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-600">₹{line.rate.toFixed(2)}</td>
                          <td className="px-4 py-3 text-right font-semibold text-slate-700">₹{line.amount.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Cost footer */}
                <div className="px-5 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                  <div className="text-sm text-slate-600">
                    Producing <strong>{Number(produceQty)} units</strong> of <strong>{selectedProduct?.name}</strong>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Total Material Cost</p>
                    <p className="text-xl font-bold text-slate-900">₹{preview.totalCost.toFixed(2)}</p>
                    <p className="text-xs text-slate-500">₹{preview.costPerUnit.toFixed(2)} per unit</p>
                  </div>
                </div>

                {/* Confirm button */}
                <div className="px-5 py-4 border-t border-slate-200">
                  <button onClick={handleSubmit} disabled={submitting || !preview.allAvailable}
                    className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition ${preview.allAvailable
                      ? 'bg-primary text-white hover:bg-primary-hover shadow-lg'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}>
                    {submitting
                      ? <><RefreshCw className="w-4 h-4 animate-spin" /> Confirming...</>
                      : preview.allAvailable
                        ? <><PackageCheck className="w-4 h-4" /> Confirm Production — Deduct RM & Add FG Stock</>
                        : <><XCircle className="w-4 h-4" /> Cannot Confirm — Resolve stock shortages first</>}
                  </button>
                </div>
              </div>
            )}

            {!previewing && !preview && selectedProductId && produceQty && Number(produceQty) > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-sm text-amber-800 flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                No BOM found for this product. Go to <strong>Bill of Materials</strong> to define the formula first.
              </div>
            )}
          </div>
        )}

        {/* ─── TAB: HISTORY ─── */}
        {tab === 'history' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800">Production History</h2>
              <button onClick={loadData} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition">
                <RefreshCw className="w-4 h-4" /> Refresh
              </button>
            </div>

            {loadingOrders ? (
              <div className="flex items-center justify-center py-16"><RefreshCw className="w-6 h-6 animate-spin text-slate-400" /></div>
            ) : orders.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-16 text-center text-slate-400">
                <Hammer className="w-12 h-12 mx-auto mb-3 text-slate-200" />
                <p className="font-semibold text-slate-500">No production orders yet.</p>
                <p className="text-sm mt-1">Create a new production entry from the first tab.</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 font-medium uppercase tracking-wider">
                      <th className="px-4 py-3 text-left w-8"></th>
                      <th className="px-4 py-3 text-left">Order No.</th>
                      <th className="px-4 py-3 text-left">Finished Good</th>
                      <th className="px-4 py-3 text-right">Qty</th>
                      <th className="px-4 py-3 text-right">Total Cost</th>
                      <th className="px-4 py-3 text-right">Cost/Unit</th>
                      <th className="px-4 py-3 text-left">Date</th>
                      <th className="px-4 py-3 text-center">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {orders.map(mo => {
                      const sc = STATUS_MAP[mo.status] || STATUS_MAP.Pending;
                      const StatusIcon = sc.icon;
                      const isExpanded = expandedId === mo._id;
                      const cost = mo.totalActualCost || mo.totalEstimatedCost || 0;
                      const qty = mo.quantityToProduce;
                      return [
                        <tr key={mo._id} className={`hover:bg-slate-50 transition cursor-pointer ${isExpanded ? 'bg-slate-50' : ''}`}
                          onClick={() => setExpandedId(isExpanded ? null : mo._id)}>
                          <td className="px-4 py-3 text-slate-400">
                            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </td>
                          <td className="px-4 py-3 font-mono font-semibold text-slate-700 text-xs">{mo.orderNumber}</td>
                          <td className="px-4 py-3 font-medium text-slate-800">{mo.productName}</td>
                          <td className="px-4 py-3 text-right text-slate-700">{qty}</td>
                          <td className="px-4 py-3 text-right font-semibold text-slate-800">₹{cost.toFixed(2)}</td>
                          <td className="px-4 py-3 text-right text-slate-600">₹{qty > 0 ? (cost / qty).toFixed(2) : '—'}</td>
                          <td className="px-4 py-3 text-slate-500 text-xs">{new Date(mo.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full ${sc.cls}`}>
                              <StatusIcon className="w-3 h-3" /> {sc.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5">
                              {mo.status === 'Pending' && (
                                <button onClick={() => handleConfirm(mo._id)} disabled={confirmingId === mo._id}
                                  className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition disabled:opacity-50">
                                  {confirmingId === mo._id ? <RefreshCw className="w-3 h-3 animate-spin" /> : 'Confirm'}
                                </button>
                              )}
                              {(mo.status === 'Pending' || mo.status === 'Completed') && (
                                <button onClick={() => handleCancel(mo)} disabled={cancellingId === mo._id}
                                  className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition disabled:opacity-50">
                                  {cancellingId === mo._id ? <RefreshCw className="w-3 h-3 animate-spin" /> : mo.status === 'Completed' ? 'Reverse' : 'Cancel'}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>,
                        isExpanded && (
                          <tr key={`${mo._id}-detail`} className="bg-slate-50/80">
                            <td colSpan={9} className="px-6 py-4">
                              <div className="rounded-lg border border-slate-200 overflow-hidden bg-white">
                                <div className="px-4 py-2 bg-slate-100 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-2">
                                  <Eye className="w-3.5 h-3.5" /> Raw Material Breakdown
                                </div>
                                <table className="w-full text-xs">
                                  <thead>
                                    <tr className="text-slate-500 border-b border-slate-200">
                                      <th className="px-4 py-2 text-left">RM Name</th>
                                      <th className="px-4 py-2 text-right">Qty Consumed</th>
                                      <th className="px-4 py-2 text-right">Rate</th>
                                      <th className="px-4 py-2 text-right">Amount</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {mo.rawMaterials?.map((rm: any, i: number) => (
                                      <tr key={i} className="hover:bg-slate-50">
                                        <td className="px-4 py-2 font-medium text-slate-700">{rm.productName}</td>
                                        <td className="px-4 py-2 text-right text-slate-600">{rm.quantityConsumed || rm.quantityRequired} {rm.unit}</td>
                                        <td className="px-4 py-2 text-right text-slate-600">₹{(rm.costPerUnit || 0).toFixed(2)}</td>
                                        <td className="px-4 py-2 text-right font-semibold text-slate-800">₹{(rm.totalCost || 0).toFixed(2)}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                  <tfoot>
                                    <tr className="bg-slate-50 border-t border-slate-200 font-bold">
                                      <td colSpan={3} className="px-4 py-2 text-right text-slate-700">Total</td>
                                      <td className="px-4 py-2 text-right text-primary">₹{cost.toFixed(2)}</td>
                                    </tr>
                                  </tfoot>
                                </table>
                                {mo.notes && <div className="px-4 py-2 border-t border-slate-200 text-xs text-slate-500">Notes: {mo.notes}</div>}
                              </div>
                            </td>
                          </tr>
                        )
                      ];
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
