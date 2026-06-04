// @ts-nocheck
'use client';
import { useState, useEffect } from 'react';
import Topbar from '../../../components/layout/Topbar';
import { businessApi, dataApi, financialYearApi } from '../../../lib/erp-api';
import { Loader2, Save, Building2, ShieldCheck, FileText, Package, X, Download, Upload, Trash2, AlertTriangle, CalendarDays, Palette, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import DocumentSequencesTab from './components/DocumentSequencesTab';
import { applyTheme, getStoredTheme, THEMES, type Theme } from '../../../components/ThemeProvider';
import { applyDateFormat, getStoredDateFormat, DATE_FORMATS, type DateFormat } from '../../../lib/utils';

const THEME_CONFIG = [
  { key: 'indigo', label: 'Midnight Indigo', desc: 'Deep indigo sidebar · Cyan accent', sidebar: '#1e1b4b', active: '#4f46e5', accent: '#06b6d4' },
  { key: 'emerald', label: 'Forest Emerald', desc: 'Forest green sidebar · Teal accent', sidebar: '#064e3b', active: '#059669', accent: '#0d9488' },
  { key: 'slate',   label: 'Charcoal Slate', desc: 'Charcoal sidebar · Royal blue accent', sidebar: '#0f172a', active: '#2563eb', accent: '#0ea5e9' },
  { key: 'rose',    label: 'Crimson Rose', desc: 'Deep rose sidebar · Pink accent', sidebar: '#4c0519', active: '#e11d48', accent: '#f43f5e' },
] as const;



export default function SettingsPage() {
  const [form, setForm] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'business' | 'sequences' | 'application'>('business');
  const [currentTheme, setCurrentTheme] = useState<Theme>('indigo');
  const [currentDateFormat, setCurrentDateFormat] = useState<DateFormat>('DD/MM/YYYY');
  
  const [exporting, setExporting] = useState(false);
  const [erasing, setErasing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [startingNewYear, setStartingNewYear] = useState(false);
  const [customYearLabel, setCustomYearLabel] = useState('');

  useEffect(() => {
    setCurrentTheme(getStoredTheme());
    setCurrentDateFormat(getStoredDateFormat());
  }, []);


  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await businessApi.getProfile();
        setForm(data.business);
      } catch { toast.error('Failed to load business profile'); }
      finally { setLoading(false); }
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    const businessName = form.name || form.businessName;
    if (!businessName?.trim()) { toast.error('Business name is required'); return; }
    setSaving(true);
    try {
      await businessApi.updateProfile({
        name: businessName,
        gstin: form.gstin,
        pan: form.pan,
        email: form.email,
        phone: form.phone || form.mobile,
        logo: form.logo,
        address: {
          street: form.address?.street,
          city: form.address?.city,
          state: form.address?.state,
          pinCode: form.address?.pinCode
        },
        bankDetails: {
          accountNumber: form.bankDetails?.accountNumber,
          bankName: form.bankDetails?.bankName,
          ifsc: form.bankDetails?.ifsc,
          branch: form.bankDetails?.branch,
          upiId: form.bankDetails?.upiId
        },
        termsAndConditions: form.termsAndConditions,
        invoiceTemplate: form.invoiceTemplate || 'A4',
        invoicePrefix: form.invoicePrefix || 'INV',
        nonGstInvoicePrefix: form.nonGstInvoicePrefix || 'NON-GST',
        purchaseOrderPrefix: form.purchaseOrderPrefix || 'PO',
        productGroups: form.productGroups || [],
        productBrands: form.productBrands || [],
        inventorySequencing: form.inventorySequencing || 'FIFO',
        enableManufacturing: form.enableManufacturing || false
      });
      toast.success('Settings saved successfully');
        setTimeout(() => window.location.reload(), 1500);
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed to update settings'); }
    finally { setSaving(false); }
  };

  const handleExportData = async () => {
    setExporting(true);
    try {
      const data = await dataApi.export();
      // Save as encrypted .erp file
      const blob = new Blob([data.encryptedBackup], { type: 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bizerp_backup_${new Date().toISOString().split('T')[0]}.erp`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Encrypted backup downloaded as .erp file!');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  const handleEraseData = async () => {
    const confirmText = prompt('WARNING: This will permanently delete ALL invoices, customers, inventory, and ledgers! Your business profile and login will remain. Type "ERASE" to confirm:');
    if (confirmText !== 'ERASE') {
      if (confirmText) toast.error('Confirmation text did not match. Aborted.');
      return;
    }
    setErasing(true);
    try {
      await dataApi.erase();
      toast.success('All business data erased successfully.');
      setTimeout(() => window.location.reload(), 2000);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to erase data');
      setErasing(false);
    }
  };

  const handleImportData = async (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.erp')) {
      toast.error('Please upload a valid .erp backup file.');
      e.target.value = '';
      return;
    }

    if (!confirm('WARNING: Restoring from a backup will permanently overwrite and erase ALL current data. Do you want to proceed?')) {
      e.target.value = '';
      return;
    }

    setImporting(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          // The file contains the raw encrypted string
          const encryptedBackup = event.target?.result as string;
          await dataApi.import({ encryptedBackup });
          toast.success('Data restored successfully!');
          setTimeout(() => window.location.reload(), 2000);
        } catch (err: any) {
          toast.error(err.response?.data?.message || 'Invalid backup file format');
          setImporting(false);
        }
      };
      reader.readAsText(file);
    } catch (err: any) {
      toast.error('Failed to read file');
      setImporting(false);
    }
  };

  const handleStartNewYear = async () => {
    if (!confirm('Are you sure you want to start a new financial year? This will create a fresh workspace and reset all invoice counters to 1. Your current data will remain safe in this year\'s profile.')) {
      return;
    }
    setStartingNewYear(true);
    try {
      const res = await financialYearApi.startNewYear(customYearLabel);
      toast.success(res.message || 'New financial year started successfully!');
      if (res.token) {
        localStorage.setItem('erp_token', res.token);
      }
      setTimeout(() => window.location.reload(), 2000);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to start new year');
      setStartingNewYear(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-slate-700 animate-spin" /></div>;
  if (!form) return null;

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar title="Settings" />
      <main className="flex-1 p-6 space-y-6 max-w-4xl mx-auto w-full">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Settings</h2>
            <p className="text-slate-600 text-sm mt-0.5">Manage your business and application preferences</p>
          </div>
          {activeTab === 'business' && (
            <button onClick={handleSave} disabled={saving} className="px-5 py-2.5 rounded-xl bg-action-500 text-white hover:bg-action-600 font-semibold text-sm hover:opacity-90 transition flex items-center gap-2 shadow-lg shadow-white/10/30 disabled:opacity-60">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Changes
            </button>
          )}
        </div>

        <div className="flex gap-6 border-b border-slate-200 overflow-x-auto whitespace-nowrap hide-scrollbar">
          <button onClick={() => setActiveTab('business')} className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'business' ? 'border-action-500 text-action-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Business Profile</button>
          <button onClick={() => setActiveTab('sequences')} className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'sequences' ? 'border-action-500 text-action-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Document Sequences</button>
          <button onClick={() => setActiveTab('application')} className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'application' ? 'border-action-500 text-action-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Application Settings</button>
        </div>

        {activeTab === 'business' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
            
            {/* Column 1: Company Profile & Address */}
            <div className="space-y-6">
              <div className="glass rounded-2xl p-5 border border-slate-200 text-center">
                <div className="w-20 h-20 mx-auto rounded-full bg-white border-2 border-slate-200 flex items-center justify-center mb-4 overflow-hidden relative group">
                  {form.logo ? (
                    <img src={form.logo} alt="Logo" className="w-full h-full object-contain bg-white" />
                  ) : (
                    <Building2 className="w-8 h-8 text-slate-600" />
                  )}
                  <label className="absolute inset-0 bg-slate-50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer">
                    <span className="text-[10px] font-semibold text-slate-600">Upload</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => setForm({ ...form, logo: reader.result as string });
                        reader.readAsDataURL(file);
                      }
                    }} />
                  </label>
                </div>
                {form.logo && (
                  <button onClick={() => setForm({ ...form, logo: null })} className="text-[10px] text-red-500 font-medium hover:underline mb-2 block mx-auto">Remove Logo</button>
                )}
                
                <div className="space-y-3 text-left mt-4 border-t border-slate-100 pt-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Business Name <span className="text-red-500">*</span></label>
                    <input value={form.name || form.businessName || ''} onChange={e => setForm({ ...form, name: e.target.value })} 
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 font-semibold focus:outline-none focus:border-[#D4D4D4] transition text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">GSTIN</label>
                    <input value={form.gstin || ''} onChange={e => setForm({ ...form, gstin: e.target.value })} 
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 font-mono focus:outline-none focus:border-[#D4D4D4] transition uppercase text-sm" placeholder="22AAAAA0000A1Z5" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">PAN Number</label>
                    <input value={form.pan || ''} onChange={e => setForm({ ...form, pan: e.target.value })} 
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 font-mono focus:outline-none focus:border-[#D4D4D4] transition uppercase text-sm" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
                      <input value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} type="email"
                        className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-[#D4D4D4] transition text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Phone / Mobile</label>
                      <input value={form.phone || form.mobile || ''} onChange={e => setForm({ ...form, phone: e.target.value })} 
                        className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-[#D4D4D4] transition text-sm" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="glass rounded-2xl p-6 border border-slate-200 space-y-4">
                <h3 className="font-semibold text-slate-900 border-b border-slate-200 pb-3">Registered Address</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Street Address</label>
                    <input value={form.address?.street || ''} onChange={e => setForm({ ...form, address: { ...form.address, street: e.target.value } })}
                      className="w-full px-3 py-2.5 rounded-lg bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-[#D4D4D4] text-sm transition" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">City</label>
                    <input value={form.address?.city || ''} onChange={e => setForm({ ...form, address: { ...form.address, city: e.target.value } })}
                      className="w-full px-3 py-2.5 rounded-lg bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-[#D4D4D4] text-sm transition" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">State</label>
                    <input value={form.address?.state || ''} onChange={e => setForm({ ...form, address: { ...form.address, state: e.target.value } })}
                      className="w-full px-3 py-2.5 rounded-lg bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-[#D4D4D4] text-sm transition" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">PIN Code</label>
                    <input value={form.address?.pinCode || ''} onChange={e => setForm({ ...form, address: { ...form.address, pinCode: e.target.value } })}
                      className="w-full px-3 py-2.5 rounded-lg bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-[#D4D4D4] text-sm transition" />
                  </div>
                </div>
              </div>
            </div>

            {/* Column 2: Bank Details & Inventory */}
            <div className="space-y-6">
              {/* Bank Details */}
              <div className="glass rounded-2xl p-6 border border-slate-200 space-y-4">
                <h3 className="font-semibold text-slate-900 border-b border-slate-200 pb-3">Bank Account Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Bank Name</label>
                    <input value={form.bankDetails?.bankName || ''} onChange={e => setForm({ ...form, bankDetails: { ...form.bankDetails, bankName: e.target.value } })}
                      className="w-full px-3 py-2.5 rounded-lg bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-[#D4D4D4] text-sm transition" />
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Account Number</label>
                    <input value={form.bankDetails?.accountNumber || ''} onChange={e => setForm({ ...form, bankDetails: { ...form.bankDetails, accountNumber: e.target.value } })}
                      className="w-full px-3 py-2.5 rounded-lg bg-white border border-slate-200 text-slate-900 font-mono focus:outline-none focus:border-[#D4D4D4] text-sm transition" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">IFSC Code</label>
                    <input value={form.bankDetails?.ifsc || ''} onChange={e => setForm({ ...form, bankDetails: { ...form.bankDetails, ifsc: e.target.value } })}
                      className="w-full px-3 py-2.5 rounded-lg bg-white border border-slate-200 text-slate-900 font-mono focus:outline-none focus:border-[#D4D4D4] text-sm transition uppercase" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Branch</label>
                    <input value={form.bankDetails?.branch || ''} onChange={e => setForm({ ...form, bankDetails: { ...form.bankDetails, branch: e.target.value } })}
                      className="w-full px-3 py-2.5 rounded-lg bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-[#D4D4D4] text-sm transition" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">UPI ID (Optional)</label>
                    <input value={form.bankDetails?.upiId || ''} onChange={e => setForm({ ...form, bankDetails: { ...form.bankDetails, upiId: e.target.value } })}
                      className="w-full px-3 py-2.5 rounded-lg bg-white border border-slate-200 text-slate-900 font-mono focus:outline-none focus:border-[#D4D4D4] text-sm transition" />
                  </div>
                </div>
              </div>

              {/* Inventory Settings */}
              <div className="glass rounded-2xl p-6 border border-slate-200 space-y-4 shadow-lg shadow-action-500/5 ring-1 ring-action-500/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                  <Package className="w-24 h-24 text-action-600" />
                </div>
                <div className="flex items-center gap-2 border-b border-slate-200 pb-3 relative z-10">
                  <Package className="w-5 h-5 text-action-600" />
                  <h3 className="font-semibold text-slate-900">Inventory Tracking</h3>
                </div>
                <div className="grid grid-cols-1 gap-4 relative z-10">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Batch Delivery Algorithm</label>
                    <select value={form.inventorySequencing || 'FIFO'} onChange={e => setForm({ ...form, inventorySequencing: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-lg bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-action-500 focus:ring-1 focus:ring-action-500 text-sm transition font-medium shadow-sm">
                      <option value="FIFO">FIFO (First In, First Out)</option>
                      <option value="FEFO">FEFO (First Expiring, First Out)</option>
                      <option value="LIFO">LIFO (Last In, First Out)</option>
                    </select>
                    <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">This determines the default sequence used when auto-assigning batches to sales invoices and production consumption.</p>
                  </div>
                  
                </div>
              </div>
            </div>

            {/* Column 3: Invoice Settings */}
            <div className="space-y-6">
              <div className="glass rounded-2xl p-6 border border-slate-200 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
                  <FileText className="w-5 h-5 text-slate-700" />
                  <h3 className="font-semibold text-slate-900">Invoice Settings</h3>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Invoice Print Template</label>
                    <select value={form.invoiceTemplate || 'A4'} onChange={e => setForm({ ...form, invoiceTemplate: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-lg bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-[#D4D4D4] text-sm transition">
                      <option value="A4">A4 Standard Format</option>
                      <option value="POS">Thermal Receipt (POS)</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-slate-600 mb-1.5">GST Invoice Prefix</label>
                      <input value={form.invoicePrefix || ''} onChange={e => setForm({ ...form, invoicePrefix: e.target.value.toUpperCase() })}
                        className="w-full px-3 py-2.5 rounded-lg bg-white border border-slate-200 text-slate-900 font-mono focus:outline-none focus:border-[#D4D4D4] text-sm transition uppercase" placeholder="INV" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-slate-600 mb-1.5">Non-GST Invoice Prefix</label>
                      <input value={form.nonGstInvoicePrefix || ''} onChange={e => setForm({ ...form, nonGstInvoicePrefix: e.target.value.toUpperCase() })}
                        className="w-full px-3 py-2.5 rounded-lg bg-white border border-slate-200 text-slate-900 font-mono focus:outline-none focus:border-[#D4D4D4] text-sm transition uppercase" placeholder="NON-GST" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-slate-600 mb-1.5">Purchase Order Prefix</label>
                      <input value={form.purchaseOrderPrefix || ''} onChange={e => setForm({ ...form, purchaseOrderPrefix: e.target.value.toUpperCase() })}
                        className="w-full px-3 py-2.5 rounded-lg bg-white border border-slate-200 text-slate-900 font-mono focus:outline-none focus:border-[#D4D4D4] text-sm transition uppercase" placeholder="PO" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Default Terms & Conditions</label>
                    <textarea value={form.termsAndConditions || ''} onChange={e => setForm({ ...form, termsAndConditions: e.target.value })}
                      placeholder="Enter default terms and conditions to print on invoices..."
                      className="w-full h-32 resize-none px-3 py-2.5 rounded-lg bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-[#D4D4D4] text-sm transition" />
                  </div>
                </div>
              </div>
            </div>

          </div>
        ) : activeTab === 'sequences' ? (
          <DocumentSequencesTab initialSequences={form.documentSequences} onUpdate={() => {}} />
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {/* Theme Picker */}
            <div className="glass rounded-2xl p-6 border border-slate-200 space-y-5">
               <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
                 <Palette className="w-5 h-5" style={{ color: 'var(--primary)' }} />
                 <h3 className="font-semibold text-slate-900">Theme & Appearance</h3>
                 <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full font-bold text-white" style={{ background: 'var(--primary)' }}>LIVE</span>
               </div>
               <p className="text-xs text-slate-500">Click any theme to apply it instantly across the entire application. Your choice is saved automatically.</p>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {THEME_CONFIG.map(theme => (
                   <button
                     key={theme.key}
                     onClick={() => {
                       applyTheme(theme.key as Theme);
                       setCurrentTheme(theme.key as Theme);
                       toast.success(`${theme.label} theme applied!`);
                     }}
                     className="relative rounded-xl overflow-hidden border-2 transition-all hover:scale-[1.02] hover:shadow-xl text-left group"
                     style={{
                       borderColor: currentTheme === theme.key ? theme.active : '#e2e8f0',
                       boxShadow: currentTheme === theme.key ? `0 0 0 3px ${theme.active}33` : undefined
                     }}
                   >
                     {/* Preview */}
                     <div className="flex h-20">
                       {/* Sidebar preview */}
                       <div className="w-12 flex flex-col p-1.5 gap-1" style={{ background: theme.sidebar }}>
                         <div className="w-full h-3 rounded" style={{ background: theme.active, opacity: 0.9 }} />
                         {[1,2,3].map(i => (
                           <div key={i} className="w-full h-2 rounded" style={{ background: 'rgba(255,255,255,0.15)' }} />
                         ))}
                       </div>
                       {/* Content preview */}
                       <div className="flex-1 p-2 bg-slate-50">
                         <div className="w-full h-2 rounded mb-1.5" style={{ background: theme.active, opacity: 0.8 }} />
                         <div className="w-3/4 h-1.5 rounded mb-1 bg-slate-200" />
                         <div className="w-1/2 h-1.5 rounded bg-slate-200" />
                         <div className="flex gap-1 mt-2">
                           <div className="h-5 flex-1 rounded" style={{ background: theme.active + '20', border: `1px solid ${theme.active}40` }}>
                             <div className="h-1.5 w-3/4 rounded m-1" style={{ background: theme.active }} />
                           </div>
                           <div className="h-5 flex-1 rounded bg-slate-100 border border-slate-200" />
                         </div>
                       </div>
                     </div>
                     {/* Label */}
                     <div className="px-3 py-2 border-t border-slate-100 flex items-center justify-between" style={{ background: '#fff' }}>
                       <div>
                         <p className="text-xs font-bold text-slate-800">{theme.label}</p>
                         <p className="text-[10px] text-slate-400">{theme.desc}</p>
                       </div>
                       {currentTheme === theme.key && (
                         <div className="w-5 h-5 rounded-full flex items-center justify-center text-white" style={{ background: theme.active }}>
                           <Check style={{ width: '10px', height: '10px' }} />
                         </div>
                       )}
                     </div>
                   </button>
                 ))}
               </div>
            </div>


            <div className="glass rounded-2xl p-6 border border-slate-200 space-y-4 shadow-sm">
               <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
                 <CalendarDays className="w-5 h-5 text-slate-500" />
                 <h3 className="font-semibold text-slate-900">Regional Settings</h3>
               </div>
               <div className="max-w-md">
                 <label className="block text-xs font-medium text-slate-600 mb-1.5">Date Format</label>
                 <select 
                   value={currentDateFormat} 
                   onChange={(e) => {
                     const fmt = e.target.value as DateFormat;
                     setCurrentDateFormat(fmt);
                     applyDateFormat(fmt);
                     toast.success('Date format updated');
                   }}
                   className="w-full px-3 py-2.5 rounded-lg bg-white border border-slate-200 text-slate-900 text-sm transition focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]"
                 >
                   {DATE_FORMATS.map(fmt => (
                     <option key={fmt} value={fmt}>{fmt}</option>
                   ))}
                 </select>
                 <p className="text-[10px] text-slate-500 mt-1">Changes are applied instantly to tables and documents across the application.</p>
               </div>
            </div>


            <div className="glass rounded-2xl p-6 border border-slate-200 space-y-4 shadow-sm border-red-100">
               <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
                 <ShieldCheck className="w-5 h-5 text-red-500" />
                 <h3 className="font-semibold text-slate-900">Data Management & Backup</h3>
               </div>
               <div className="space-y-4 max-w-lg">
                 <p className="text-xs text-slate-600 leading-relaxed">
                   Manage your entire business database. Backups are <strong>AES-256 encrypted</strong> and saved as <code className="bg-slate-100 px-1 rounded">.erp</code> files — only this system can restore them.
                 </p>
                 
                 <div className="flex flex-col gap-3 mt-4">
                   <button onClick={handleExportData} disabled={exporting || erasing || importing} className="w-full flex items-center justify-between px-4 py-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition text-sm font-medium text-slate-700 disabled:opacity-50">
                     <span className="flex items-center gap-2">
                       {exporting ? <Loader2 className="w-4 h-4 text-blue-500 animate-spin" /> : <Download className="w-4 h-4 text-blue-500" />} 
                       Download Full Backup
                     </span>
                     <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded">.ERP Encrypted File</span>
                   </button>
                   
                   <label className={`w-full flex items-center justify-between px-4 py-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition text-sm font-medium text-slate-700 ${importing || erasing || exporting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                     <span className="flex items-center gap-2">
                       {importing ? <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" /> : <Upload className="w-4 h-4 text-emerald-500" />} 
                       Restore from Backup
                     </span>
                     <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded">Upload</span>
                     <input type="file" accept=".erp" className="hidden" disabled={importing || erasing || exporting} onChange={handleImportData} />
                   </label>

                   <div className="mt-4 pt-4 border-t border-slate-100">
                     <button onClick={handleEraseData} disabled={erasing || importing || exporting} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition text-sm font-bold text-red-600 disabled:opacity-50">
                       {erasing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} 
                       Erase All Business Data
                     </button>
                     <p className="text-[10px] text-red-400 text-center mt-2 flex items-center justify-center gap-1">
                       <AlertTriangle className="w-3 h-3" /> Danger Zone: This action cannot be undone.
                     </p>
                   </div>
                 </div>
               </div>
            </div>
             <div className="glass rounded-2xl p-6 border border-slate-200 space-y-4 shadow-sm border-purple-100 mt-6">
               <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
                 <CalendarDays className="w-5 h-5 text-purple-600" />
                 <h3 className="font-semibold text-slate-900">Financial Year Management</h3>
               </div>
               <div className="space-y-4 max-w-lg">
                 <p className="text-xs text-slate-600 leading-relaxed">
                   Close the current financial year and start a new one. This will carry forward your closing balances (customers, suppliers, accounts, inventory) as opening balances for the new year, and reset all invoice numbers to 1.
                 </p>
                 
                 <div className="mt-4 space-y-3">
                   <div>
                     <label className="block text-xs font-medium text-slate-600 mb-1.5">Custom Year Label (Optional)</label>
                     <input 
                       value={customYearLabel} 
                       onChange={(e) => setCustomYearLabel(e.target.value)} 
                       placeholder="e.g. FY 2026-27"
                       className="w-full px-3 py-2.5 rounded-lg bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-purple-300 text-sm transition" 
                     />
                   </div>
                   <button onClick={handleStartNewYear} disabled={startingNewYear} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-50 border border-purple-200 rounded-xl hover:bg-purple-100 transition text-sm font-bold text-purple-700 disabled:opacity-50">
                     {startingNewYear ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarDays className="w-4 h-4" />} 
                     Start New Financial Year
                   </button>
                 </div>
               </div>
             </div>

          </div>
        )}
      </main>
    </div>
  );
}
