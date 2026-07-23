'use client';
import { useState, useEffect, useCallback } from 'react';
import Topbar from '../../../../components/layout/Topbar';
import { paymentModesApi, accountsApi } from '../../../../lib/erp-api';
import {
  CreditCard, Plus, Edit2, Trash2, CheckCircle2, XCircle,
  AlertTriangle, Link2, Banknote, Building2, Loader2, X, Save
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Account { _id: string; name: string; type: string; bankName?: string; currentBalance: number; }
interface PaymentMode {
  _id: string; name: string; ledgerType: 'CASH' | 'BANK';
  linkedAccountId: Account | null; isActive: boolean; isDefault: boolean; sortOrder: number;
}

const LEDGER_BADGE: Record<string, string> = {
  CASH: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  BANK: 'bg-blue-100 text-blue-700 border border-blue-200',
};

export default function PaymentModesPage() {
  const [modes, setModes] = useState<PaymentMode[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState<PaymentMode | null>(null);
  const [form, setForm] = useState({ name: '', ledgerType: 'BANK' as 'CASH' | 'BANK', linkedAccountId: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [modesRes, acctRes] = await Promise.all([
        paymentModesApi.list(),
        accountsApi.list({ type: 'Bank' }),
      ]);
      setModes(modesRes.data.modes || []);
      setAccounts(acctRes.accounts || []);
    } catch { toast.error('Failed to load payment modes'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditMode(null);
    setForm({ name: '', ledgerType: 'BANK', linkedAccountId: '' });
    setShowModal(true);
  };

  const openEdit = (mode: PaymentMode) => {
    setEditMode(mode);
    setForm({
      name: mode.name,
      ledgerType: mode.ledgerType,
      linkedAccountId: (mode.linkedAccountId as any)?._id || mode.linkedAccountId || '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Mode name is required'); return; }
    if (form.ledgerType === 'BANK' && !form.linkedAccountId) {
      toast.error('Please link a bank account for BANK modes');
      return;
    }
    setSaving('modal');
    try {
      if (editMode) {
        await paymentModesApi.update(editMode._id, {
          ledgerType: form.ledgerType,
          linkedAccountId: form.linkedAccountId || null,
        });
        toast.success('Payment mode updated');
      } else {
        await paymentModesApi.create({
          name: form.name.trim(),
          ledgerType: form.ledgerType,
          linkedAccountId: form.linkedAccountId || null,
        });
        toast.success('Payment mode created');
      }
      setShowModal(false);
      load();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to save');
    } finally { setSaving(null); }
  };

  const toggleActive = async (mode: PaymentMode) => {
    setSaving(mode._id);
    try {
      await paymentModesApi.update(mode._id, { isActive: !mode.isActive });
      toast.success(mode.isActive ? `"${mode.name}" deactivated` : `"${mode.name}" activated`);
      load();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed to update'); }
    finally { setSaving(null); }
  };

  const handleDelete = async (mode: PaymentMode) => {
    if (!confirm(`Delete payment mode "${mode.name}"?`)) return;
    try {
      await paymentModesApi.delete(mode._id);
      toast.success('Payment mode deleted');
      load();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed to delete'); }
  };

  // Modes with no linked account (risk)
  const unconfigured = modes.filter(m => m.isActive && m.ledgerType === 'BANK' && !m.linkedAccountId);

  return (
    <div className="flex flex-col min-h-screen bg-[var(--bg-base,#f8fafc)]">
      <Topbar title="Payment Modes" />
      <main className="flex-1 p-6 space-y-6 max-w-4xl mx-auto w-full">

        {/* ─── Warning Banner ─── */}
        {unconfigured.length > 0 && (
          <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-amber-800 text-sm">Unconfigured payment modes — transactions will fail</p>
              <p className="text-amber-700 text-xs mt-0.5">
                The following modes have no linked bank account. Any expense or receipt using them will return an error until you configure them:
              </p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {unconfigured.map(m => (
                  <span key={m._id} className="text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded-full">
                    ⚠ {m.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ─── Header ─── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Payment Mode Master</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Each payment mode must be linked to exactly one ledger account (Cash or Bank).
              This drives all ledger posting across Expenses, Sales, and Purchases.
            </p>
          </div>
          <button onClick={openCreate}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-primary-hover transition shadow">
            <Plus className="w-4 h-4" /> Add Mode
          </button>
        </div>

        {/* ─── Modes Table ─── */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="grid grid-cols-12 bg-slate-50 border-b border-slate-200 px-4 py-2.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <div className="col-span-3">Mode Name</div>
              <div className="col-span-2">Ledger Type</div>
              <div className="col-span-4">Linked Account</div>
              <div className="col-span-2 text-center">Status</div>
              <div className="col-span-1" />
            </div>

            {modes.length === 0 ? (
              <div className="p-10 text-center text-slate-400 italic text-sm">No payment modes yet. Click "Add Mode" to get started.</div>
            ) : (
              modes.map(mode => (
                <div key={mode._id}
                  className={`grid grid-cols-12 items-center px-4 py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition ${!mode.isActive ? 'opacity-50' : ''}`}>

                  {/* Mode Name */}
                  <div className="col-span-3 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{mode.name}</p>
                      {mode.isDefault && (
                        <span className="text-[9px] text-slate-400 uppercase tracking-wide">System Default</span>
                      )}
                    </div>
                  </div>

                  {/* Ledger Type */}
                  <div className="col-span-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${LEDGER_BADGE[mode.ledgerType]}`}>
                      {mode.ledgerType === 'CASH' ? '💵 Cash' : '🏦 Bank'}
                    </span>
                  </div>

                  {/* Linked Account */}
                  <div className="col-span-4">
                    {mode.ledgerType === 'CASH' ? (
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Banknote className="w-3.5 h-3.5 text-emerald-500" />
                        Cash in Hand
                      </span>
                    ) : mode.linkedAccountId ? (
                      <span className="text-xs text-slate-700 flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-blue-500" />
                        <span className="font-medium">{(mode.linkedAccountId as any).name}</span>
                        {(mode.linkedAccountId as any).bankName && (
                          <span className="text-slate-400">— {(mode.linkedAccountId as any).bankName}</span>
                        )}
                      </span>
                    ) : (
                      <span className="text-xs text-amber-600 flex items-center gap-1 font-semibold">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Not configured — click Edit
                      </span>
                    )}
                  </div>

                  {/* Status Toggle */}
                  <div className="col-span-2 flex justify-center">
                    <button onClick={() => toggleActive(mode)} disabled={saving === mode._id}
                      className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border transition ${
                        mode.isActive
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                      }`}>
                      {saving === mode._id ? <Loader2 className="w-3 h-3 animate-spin" /> :
                        mode.isActive ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {mode.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="col-span-1 flex items-center justify-end gap-1">
                    <button onClick={() => openEdit(mode)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {!mode.isDefault && (
                      <button onClick={() => handleDelete(mode)}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ─── Info Box ─── */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-sm text-blue-800 space-y-1.5">
          <p className="font-semibold flex items-center gap-2"><Link2 className="w-4 h-4" /> How payment posting works</p>
          <ul className="text-xs space-y-1 text-blue-700 list-disc list-inside ml-1">
            <li><strong>Cash</strong> → always posts to your Cash in Hand account</li>
            <li><strong>UPI, Cheque, NEFT, RTGS, Card</strong> → must be linked to a specific Bank account here</li>
            <li>Every expense, sales receipt, and purchase payment uses this master to determine the correct ledger</li>
            <li>If a mode has no linked account, the transaction will be blocked with an error</li>
          </ul>
        </div>
      </main>

      {/* ─── Create/Edit Modal ─── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h2 className="font-bold text-slate-900 text-lg">
                {editMode ? `Edit "${editMode.name}"` : 'Add Payment Mode'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Name */}
              {!editMode && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Mode Name *</label>
                  <input
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. PhonePe, Paytm, Crypto"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              )}

              {/* Ledger Type */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Ledger Type *</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['CASH', 'BANK'] as const).map(t => (
                    <button key={t} onClick={() => setForm(f => ({ ...f, ledgerType: t, linkedAccountId: '' }))}
                      className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-semibold transition ${
                        form.ledgerType === t
                          ? t === 'CASH' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}>
                      {t === 'CASH' ? <Banknote className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
                      {t === 'CASH' ? '💵 Cash' : '🏦 Bank'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Linked Account (only for BANK) */}
              {form.ledgerType === 'BANK' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Linked Bank Account *</label>
                  <select
                    value={form.linkedAccountId}
                    onChange={e => setForm(f => ({ ...f, linkedAccountId: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="">— Select Account —</option>
                    {accounts.map(a => (
                      <option key={a._id} value={a._id}>{a.name}{a.bankName ? ` — ${a.bankName}` : ''}</option>
                    ))}
                  </select>
                  {accounts.length === 0 && (
                    <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> No bank accounts found. Create one in Accounts first.
                    </p>
                  )}
                </div>
              )}

              {/* Preview */}
              <div className={`rounded-xl p-3 text-xs font-medium flex items-center gap-2 ${
                form.ledgerType === 'CASH' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 
                form.linkedAccountId ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                {form.ledgerType === 'CASH' ? '✅ Transactions will post to: Cash in Hand' :
                  form.linkedAccountId
                    ? `✅ Transactions will post to: ${accounts.find(a => a._id === form.linkedAccountId)?.name || 'Selected Account'}`
                    : '⚠ No account selected — transactions will be blocked until configured'}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl transition">Cancel</button>
              <button onClick={handleSave} disabled={saving === 'modal'}
                className="flex items-center gap-2 px-5 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-hover transition disabled:opacity-50">
                {saving === 'modal' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {editMode ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
