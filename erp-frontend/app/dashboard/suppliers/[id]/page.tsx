'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Topbar from '../../../../components/layout/Topbar';
import { suppliersApi } from '../../../../lib/erp-api';
import { Upload, Camera, RefreshCw, X, Save, User as UserIcon, Loader2, VideoOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { purchasesApi } from '../../../../lib/erp-api';

const INDIAN_STATES = ['Andhra Pradesh','Assam','Bihar','Chhattisgarh','Delhi','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal'];

export default function EditSupplierPage() {
  const router = useRouter();
  const { id } = useParams();
  const searchParams = useSearchParams();
  const isReadOnly = searchParams.get('mode') === 'view';
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('Profile');
  const tabs = ['Profile', 'Accounts', 'Payment History', 'Purchase Bills', 'Purchase Orders', 'Cheque / Cash Alerts'];

  // --- Photo State ---
  const [photo, setPhoto] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = useCallback(async () => {
    setCameraError('');
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); }
    } catch (err: any) {
      setCameraError(err.name === 'NotAllowedError' ? 'Camera permission denied.' : 'Could not access camera.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setShowCamera(false);
    setCameraError('');
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  useEffect(() => {
    if (showCamera && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play();
    }
  }, [showCamera]);

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      setPhoto(canvas.toDataURL('image/jpeg', 0.85));
      stopCamera();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return; }
    if (file.size > 2 * 1024 * 1024) { toast.error('Image must be smaller than 2MB'); return; }
    const reader = new FileReader();
    reader.onloadend = () => setPhoto(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const [form, setForm] = useState({
    name: '', billingAddress: '', city: '', state: '', pinCode: '', country: 'India',
    email: '', phoneNo: '', mobile: '',
    panNo: '', gstin: '', gstType: 'Unregistered', tradeName: '',
    balanceType: 'Debit', openingBalance: 0,
    documentType: '', documentNo: '',
    dobApplicable: false, dob: '',
    anniversaryApplicable: false, anniversary: '',
    creditAllowed: false, creditLimit: 0,
    priceCategory: 'Retail', remark: ''
  });

  // Load existing supplier data
  useEffect(() => {
    const fetchSupplier = async () => {
      try {
        const { data } = await suppliersApi.get(id as string);
        const c = data.supplier;
        setForm({
          name: c.name || '',
          billingAddress: c.billingAddress?.street || '',
          city: c.billingAddress?.city || '',
          state: c.billingAddress?.state || '',
          pinCode: c.billingAddress?.pinCode || '',
          country: c.billingAddress?.country || 'India',
          email: c.email || '',
          phoneNo: c.phoneNo || '',
          mobile: c.mobile || '',
          panNo: c.panNo || '',
          gstin: c.gstin || '',
          gstType: c.gstType || 'Unregistered',
          tradeName: c.tradeName || '',
          balanceType: c.balanceType || 'Debit',
          openingBalance: Math.abs(c.openingBalance) || 0,
          documentType: c.documentType || '',
          documentNo: c.documentNo || '',
          dobApplicable: !!c.dob,
          dob: c.dob ? new Date(c.dob).toISOString().split('T')[0] : '',
          anniversaryApplicable: !!c.anniversary,
          anniversary: c.anniversary ? new Date(c.anniversary).toISOString().split('T')[0] : '',
          creditAllowed: c.creditAllowed || false,
          creditLimit: c.creditLimit || 0,
          priceCategory: c.priceCategory || 'Retail',
          remark: c.remark || '',
        });
        if (c.photo) setPhoto(c.photo);
      } catch {
        toast.error('Failed to load supplier');
        router.push('/dashboard/suppliers');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchSupplier();
  }, [id, router]);

  
  const handlePaymentSubmit = async () => {
    if (!paymentForm.amount) return toast.error('Enter amount');
    try {
      await suppliersApi.recordPayment(id as string, paymentForm);
      toast.success('Payment recorded');
      setShowPaymentModal(false);
      
      // Refresh ledger
      const res = await suppliersApi.getLedger(id as string);
      setLedger(res.data.ledger || []);
      setCurrentBalance(res.data.currentBalance || 0);
    } catch(e:any) { toast.error(e.response?.data?.message || 'Error'); }
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Full Name is required'); return; }
    if (!form.mobile.trim()) { toast.error('Contact No is required'); return; }
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        billingAddress: { street: form.billingAddress, city: form.city, state: form.state, pinCode: form.pinCode, country: form.country },
        email: form.email, phoneNo: form.phoneNo, mobile: form.mobile,
        panNo: form.panNo, gstin: form.gstin, gstType: form.gstType, tradeName: form.tradeName,
        balanceType: form.balanceType,
        openingBalance: form.balanceType === 'Credit' ? -Math.abs(form.openingBalance) : Math.abs(form.openingBalance),
        documentType: form.documentType, documentNo: form.documentNo,
        dob: form.dobApplicable ? form.dob : undefined,
        anniversary: form.anniversaryApplicable ? form.anniversary : undefined,
        creditAllowed: form.creditAllowed, creditLimit: form.creditLimit,
        priceCategory: form.priceCategory, remark: form.remark,
        photo: photo || null,
      };
      await suppliersApi.update(id as string, payload);
      toast.success('Supplier updated successfully!');
      router.push('/dashboard/suppliers');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to update supplier');
    } finally {
      setSaving(false);
    }
  };

  
  const [ledger, setLedger] = useState<any[]>([]);
  const [currentBalance, setCurrentBalance] = useState<number>(0);
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ amount: '', mode: 'Cash', date: new Date().toISOString().split('T')[0], referenceNo: '', notes: '' });
  const [purchaseBills, setPurchaseBills] = useState<any[]>([]);
  useEffect(() => {
    if (id) {
      purchasesApi.list().then(res => {
         const supplierPurchaseBills = res.data.purchaseBills.filter((inv: any) => inv.supplierId === id || inv.supplierId?._id === id);
         setPurchaseBills(supplierPurchaseBills);
      }).catch(() => {});
      
      suppliersApi.getLedger(id as string).then(res => {
         setLedger(res.data.ledger || []);
         setCurrentBalance(res.data.currentBalance || 0);
      }).catch(() => {});
    }
  }, [id]);

  if (loading) return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-900">
      <Topbar title="Edit Supplier" />
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-slate-600" />
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
      <Topbar title="Edit Supplier" />
      <div className="flex px-4 pt-2 border-b border-slate-200 bg-[#F1F5F9]">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-xs font-semibold border ${activeTab === tab ? 'bg-[#F1F5F9] border-slate-200 border-b-0 rounded-t text-slate-900' : 'border-transparent text-slate-600 hover:text-[#94a3b8]'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <main className="flex-1 overflow-y-auto p-4 bg-[#F1F5F9]">
        <div className="flex flex-col md:flex-row gap-4 max-w-6xl mx-auto h-full">
          {/* Left Panel - Photo & Actions */}
          <div className={`w-full md:w-72 shrink-0 flex flex-col gap-4 ${isReadOnly ? 'pointer-events-none' : ''}`}>
            <fieldset className="border border-slate-200 rounded bg-slate-50 p-4 relative pt-6 shadow-sm">
              <legend className="text-[11px] font-semibold px-2 bg-slate-50 text-slate-600 absolute -top-2 left-2">Profile Pic</legend>

              <div className="w-40 h-40 mx-auto mb-4 relative">
                {showCamera ? (
                  <div className="w-full h-full rounded-full overflow-hidden border-4 border-[#1e3a8a] bg-slate-50 flex items-center justify-center">
                    {cameraError ? (
                      <div className="text-center p-2">
                        <VideoOff className="w-8 h-8 text-red-400 mx-auto mb-1" />
                        <p className="text-[9px] text-red-400">{cameraError}</p>
                      </div>
                    ) : (
                      <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                    )}
                  </div>
                ) : (
                  <div className="bg-white rounded-full w-full h-full flex items-center justify-center overflow-hidden border-4 border-[#1e3a8a]">
                    {photo ? (
                      <img src={photo} alt="Supplier" className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon className="w-24 h-24 text-action-500 mt-8" />
                    )}
                  </div>
                )}
              </div>

              <canvas ref={canvasRef} className="hidden" />
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />

              {showCamera ? (
                <div className="flex justify-center gap-3 px-2 mt-2">
                  {!cameraError && (
                    <button onClick={capturePhoto} className="flex-1 flex items-center justify-center gap-1 text-xs text-slate-900 bg-[#1e3a8a] hover:bg-action-600 py-1.5 rounded border border-[#1e3a8a] transition font-semibold">
                      <Camera className="w-4 h-4" /> Capture
                    </button>
                  )}
                  <button onClick={stopCamera} className="flex-1 flex items-center justify-center gap-1 text-xs text-red-400 bg-white hover:bg-red-50 py-1.5 rounded border border-slate-200 transition">
                    <X className="w-4 h-4" /> Cancel
                  </button>
                </div>
              ) : (
                <div className="flex justify-between px-2 items-center mt-2">
                  <button onClick={() => fileInputRef.current?.click()} className="text-green-500 hover:text-green-400 bg-white p-1.5 rounded border border-slate-200 transition" title="Upload from File"><Upload className="w-5 h-5" /></button>
                  <button onClick={startCamera} className="text-green-500 hover:text-green-400 bg-white p-1.5 rounded border border-slate-200 transition" title="Take Photo"><Camera className="w-5 h-5" /></button>
                  <button onClick={() => setPhoto(null)} disabled={!photo} className="text-red-500 hover:text-red-400 bg-white p-1.5 rounded border border-slate-200 transition disabled:opacity-40" title="Reset"><RefreshCw className="w-5 h-5" /></button>
                  <button onClick={() => setPhoto(null)} disabled={!photo} className="text-red-500 hover:text-red-400 bg-white p-1.5 rounded border border-slate-200 transition disabled:opacity-40" title="Delete"><X className="w-5 h-5" /></button>
                </div>
              )}
              {photo && !showCamera && <p className="text-center text-[10px] text-green-400 mt-2">✓ Photo set</p>}
              <p className="text-center text-[9px] text-slate-600 mt-1">Upload or take a photo (max 2MB)</p>
            </fieldset>

            <fieldset className="border border-slate-200 rounded bg-slate-50 p-4 relative pt-5 shadow-sm">
              <legend className="text-[11px] font-semibold px-2 bg-slate-50 text-slate-600 absolute -top-2 left-2">Account Information</legend>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-600">Supplier ID</span>
                  <span className="font-semibold text-slate-900">{(typeof id === 'string' ? id : id?.[0])?.slice(-6).toUpperCase() || 'NEW'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Account Balance</span>
                  <span className={`font-bold ${currentBalance < 0 ? 'text-green-500' : currentBalance > 0 ? 'text-red-500' : 'text-slate-900'}`}>₹{Math.abs(currentBalance).toFixed(2)} {currentBalance >= 0 ? 'Cr' : 'Dr'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Account Status</span>
                  <span className="font-bold text-green-500 uppercase tracking-wider">ACTIVE</span>
                </div>
              </div>
            </fieldset>

            <fieldset className="border border-slate-200 rounded bg-slate-50 p-4 relative pt-5 shadow-sm flex-1">
              <legend className="text-[11px] font-semibold px-2 bg-slate-50 text-slate-600 absolute -top-2 left-2">Account Actions</legend>
              <div className="grid grid-cols-2 gap-2 mb-4">
                <button className="py-2 text-xs border border-slate-200 rounded text-slate-600 hover:text-slate-900 hover:bg-[#F1F5F9] transition bg-white">New Purchase Bill</button>
                <button className="py-2 text-xs border border-slate-200 rounded text-slate-600 hover:text-slate-900 hover:bg-[#F1F5F9] transition bg-white">New Purchase Order</button>
                <button className="py-2 text-xs border border-slate-200 rounded text-slate-600 hover:text-slate-900 hover:bg-[#F1F5F9] transition bg-white">Send SMS</button>
                <button className="py-2 text-xs border border-slate-200 rounded text-slate-600 hover:text-slate-900 hover:bg-[#F1F5F9] transition bg-white">Send Email</button>
              </div>
              <button className="w-full py-2 text-xs border border-slate-200 rounded text-orange-400 hover:text-orange-300 hover:bg-[#F1F5F9] transition mb-3 bg-white">Disable A/c</button>
              <button className="w-full py-2 text-xs font-semibold rounded text-slate-900 bg-red-600 hover:bg-red-700 transition flex items-center justify-center gap-2"><X className="w-4 h-4" /> Delete Account</button>
            </fieldset>
          </div>

          <div className="flex-1 bg-slate-50 rounded border border-slate-200 p-4 shadow-sm min-h-0 overflow-y-auto">
               {activeTab === 'Profile' && (
                 <div className={`grid grid-cols-1 lg:grid-cols-2 gap-4 ${isReadOnly ? 'pointer-events-none opacity-80' : ''}`}>
                   <div className="space-y-4">
                     <fieldset className="border border-slate-200 rounded bg-slate-50 p-4 relative pt-5 shadow-sm">
                       <legend className="text-[11px] font-semibold px-2 bg-slate-50 text-slate-600 absolute -top-2 left-2">Supplier Details</legend>
                       <div className="grid grid-cols-[110px_1fr] gap-y-2.5 items-center text-xs">
                         <label className="text-slate-600">Full Name <span className="text-red-500">*</span></label>
                         <input className="erp-input w-full bg-[#F1F5F9]" value={form.name} onChange={e=>setForm({...form, name: e.target.value})} />
                         <label className="self-start mt-2 text-slate-600">Billing Address</label>
                         <textarea className="erp-input w-full h-16 resize-none bg-[#F1F5F9]" value={form.billingAddress} onChange={e=>setForm({...form, billingAddress: e.target.value})} />
                         <label className="text-slate-600">City</label>
                         <input className="erp-input w-full bg-[#F1F5F9]" value={form.city} onChange={e=>setForm({...form, city: e.target.value})} />
                         <label className="text-slate-600">State</label>
                         <select className="erp-input w-full bg-[#F1F5F9]" value={form.state} onChange={e=>setForm({...form, state: e.target.value})}>
                           <option value=""></option>
                           {INDIAN_STATES.map(s => <option key={s}>{s}</option>)}
                         </select>
                         <label className="text-slate-600">PIN Code</label>
                         <input className="erp-input w-full bg-[#F1F5F9]" value={form.pinCode} onChange={e=>setForm({...form, pinCode: e.target.value})} />
                         <label className="text-slate-600">Country</label>
                         <input className="erp-input w-full bg-[#F1F5F9]" value={form.country} onChange={e=>setForm({...form, country: e.target.value})} />
                         <label className="text-slate-600">Email ID</label>
                         <input className="erp-input w-full bg-[#F1F5F9]" value={form.email} onChange={e=>setForm({...form, email: e.target.value})} />
                         <label className="text-slate-600">Phone No</label>
                         <input className="erp-input w-full bg-[#F1F5F9]" value={form.phoneNo} onChange={e=>setForm({...form, phoneNo: e.target.value})} />
                         <label className="text-slate-600">Contact No <span className="text-red-500">*</span></label>
                         <input className="erp-input w-full bg-[#F1F5F9]" value={form.mobile} onChange={e=>setForm({...form, mobile: e.target.value})} />
                       </div>
                     </fieldset>

                     <fieldset className="border border-slate-200 rounded bg-slate-50 p-4 relative pt-5 shadow-sm">
                       <legend className="text-[11px] font-semibold px-2 bg-slate-50 text-slate-600 absolute -top-2 left-2">Tax Details</legend>
                       <div className="grid grid-cols-[110px_1fr] gap-y-2.5 items-center text-xs">
                         <label className="text-slate-600">PAN No.</label>
                         <input className="erp-input w-full bg-[#F1F5F9]" value={form.panNo} onChange={e=>setForm({...form, panNo: e.target.value})} />
                         <label className="text-slate-600">GSTIN</label>
                         <input className="erp-input w-full uppercase bg-[#F1F5F9]" value={form.gstin} onChange={e=>setForm({...form, gstin: e.target.value})} />
                         <label className="text-slate-600">GST Type</label>
                         <select className="erp-input w-full bg-[#F1F5F9]" value={form.gstType} onChange={e=>setForm({...form, gstType: e.target.value})}>
                           <option>Unregistered</option><option>Regular</option><option>Composition</option>
                         </select>
                         <label className="text-slate-600">Trade Name</label>
                         <input className="erp-input w-full bg-[#F1F5F9]" value={form.tradeName} onChange={e=>setForm({...form, tradeName: e.target.value})} />
                       </div>
                     </fieldset>
                   </div>
                   
                   <div className="space-y-4">
                     <fieldset className="border border-slate-200 rounded bg-slate-50 p-4 relative pt-5 shadow-sm">
                       <legend className="text-[11px] font-semibold px-2 bg-slate-50 text-slate-600 absolute -top-2 left-2">Account Details</legend>
                       <div className="grid grid-cols-[110px_1fr] gap-y-2.5 items-center text-xs">
                         <label className="text-slate-600">Type</label>
                         <div className="flex gap-4">
                            <label className="flex items-center gap-1.5 cursor-pointer"><input type="radio" name="balType" checked={form.balanceType === 'Debit'} onChange={() => setForm({...form, balanceType: 'Debit'})} className="accent-[#1e3a8a] w-3.5 h-3.5" /> Debit</label>
                            <label className="flex items-center gap-1.5 cursor-pointer"><input type="radio" name="balType" checked={form.balanceType === 'Credit'} onChange={() => setForm({...form, balanceType: 'Credit'})} className="accent-[#1e3a8a] w-3.5 h-3.5" /> Credit</label>
                         </div>
                         <label className="text-slate-600">Opening Balance</label>
                         <div className="flex">
                            <span className="bg-[#1e3a8a] text-slate-900 px-2.5 py-1 border border-slate-200 border-r-0 flex items-center">₹</span>
                            <input type="number" className="erp-input w-full rounded-l-none bg-[#F1F5F9]" value={form.openingBalance === 0 ? '' : form.openingBalance} onChange={e=>setForm({...form, openingBalance: parseFloat(e.target.value) || 0})} />
                         </div>
                       </div>
                     </fieldset>

                     <fieldset className="border border-slate-200 rounded bg-slate-50 p-4 relative pt-5 shadow-sm">
                       <legend className="text-[11px] font-semibold px-2 bg-slate-50 text-slate-600 absolute -top-2 left-2">Identity Details</legend>
                       <div className="grid grid-cols-[110px_1fr] gap-y-2.5 items-center text-xs">
                         <label className="text-slate-600">Document Type</label>
                         <select className="erp-input w-full bg-[#F1F5F9]" value={form.documentType} onChange={e=>setForm({...form, documentType: e.target.value})}>
                           <option></option><option>Aadhar</option><option>Passport</option><option>Driving License</option>
                         </select>
                         <label className="text-slate-600">Document No.</label>
                         <input className="erp-input w-full bg-[#F1F5F9]" value={form.documentNo} onChange={e=>setForm({...form, documentNo: e.target.value})} />
                       </div>
                     </fieldset>

                     <fieldset className="border border-slate-200 rounded bg-slate-50 p-4 relative pt-5 shadow-sm">
                       <legend className="text-[11px] font-semibold px-2 bg-slate-50 text-slate-600 absolute -top-2 left-2">Anniversary</legend>
                       <div className="grid grid-cols-[110px_1fr] gap-y-2.5 items-center text-xs">
                         <label className="text-slate-600">Date of Birth</label>
                         <div className="flex items-center gap-2">
                            <label className="flex items-center gap-1.5 cursor-pointer w-20"><input type="checkbox" checked={form.dobApplicable} onChange={e=>setForm({...form, dobApplicable: e.target.checked})} className="accent-[#1e3a8a] w-3.5 h-3.5" /> Applicable</label>
                            <input type="date" disabled={!form.dobApplicable} className="erp-input flex-1 disabled:opacity-40 bg-[#F1F5F9]" value={form.dob} onChange={e=>setForm({...form, dob: e.target.value})} />
                         </div>
                         <label className="text-slate-600">Anniversary</label>
                         <div className="flex items-center gap-2">
                            <label className="flex items-center gap-1.5 cursor-pointer w-20"><input type="checkbox" checked={form.anniversaryApplicable} onChange={e=>setForm({...form, anniversaryApplicable: e.target.checked})} className="accent-[#1e3a8a] w-3.5 h-3.5" /> Applicable</label>
                            <input type="date" disabled={!form.anniversaryApplicable} className="erp-input flex-1 disabled:opacity-40 bg-[#F1F5F9]" value={form.anniversary} onChange={e=>setForm({...form, anniversary: e.target.value})} />
                         </div>
                       </div>
                     </fieldset>

                     <fieldset className="border border-slate-200 rounded bg-slate-50 p-4 relative pt-5 shadow-sm">
                       <legend className="text-[11px] font-semibold px-2 bg-slate-50 text-slate-600 absolute -top-2 left-2">Other Details</legend>
                       <div className="grid grid-cols-[110px_1fr] gap-y-2.5 items-center text-xs">
                         <label className="text-slate-600">Credit Allowed</label>
                         <div className="flex gap-4">
                            <label className="flex items-center gap-1.5 cursor-pointer"><input type="radio" checked={form.creditAllowed} onChange={()=>setForm({...form, creditAllowed: true})} name="ca" className="accent-[#1e3a8a] w-3.5 h-3.5" /> Yes</label>
                            <label className="flex items-center gap-1.5 cursor-pointer"><input type="radio" checked={!form.creditAllowed} onChange={()=>setForm({...form, creditAllowed: false})} name="ca" className="accent-[#1e3a8a] w-3.5 h-3.5" /> No</label>
                         </div>
                         <label className="text-slate-600">Credit Limit</label>
                         <div className="flex">
                            <span className="bg-[#1e3a8a] text-slate-900 px-2.5 py-1 border border-slate-200 border-r-0 flex items-center" style={{ opacity: form.creditAllowed ? 1 : 0.4 }}>₹</span>
                            <input type="number" className="erp-input w-full rounded-l-none disabled:opacity-40 bg-[#F1F5F9]" disabled={!form.creditAllowed} value={form.creditLimit === 0 ? '' : form.creditLimit} onChange={e=>setForm({...form, creditLimit: parseFloat(e.target.value) || 0})} />
                         </div>
                         <label className="text-slate-600">Price Category</label>
                         <select className="erp-input w-full bg-[#F1F5F9]" value={form.priceCategory} onChange={e=>setForm({...form, priceCategory: e.target.value})}>
                           <option>Retail</option><option>Wholesale</option>
                         </select>
                         <label className="self-start mt-2 text-slate-600">Remark / Note</label>
                         <textarea className="erp-input w-full h-16 resize-none bg-[#F1F5F9]" value={form.remark} onChange={e=>setForm({...form, remark: e.target.value})} />
                       </div>
                     </fieldset>

                     <div className="flex justify-end gap-3 pt-4 pb-12 lg:pb-0">
                       <button onClick={() => router.push('/dashboard/suppliers')} className="px-6 py-2 rounded border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-[#D4D4D4] text-sm font-medium transition pointer-events-auto">
                         {isReadOnly ? 'Back' : 'Cancel'}
                       </button>
                       {!isReadOnly && (
                         <button onClick={handleSave} disabled={saving} className="bg-[#1e3a8a] hover:bg-action-600 text-slate-900 px-8 py-2 rounded flex items-center gap-2 text-sm font-semibold shadow-md transition disabled:opacity-50 pointer-events-auto">
                           {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Changes
                         </button>
                       )}
                     </div>
                   </div>
                 </div>
               )}

               {activeTab === 'Purchase Bills' && (
                 <div className="flex flex-col h-full">
                    <h3 className="font-semibold text-slate-900 mb-4">Supplier Purchase Bills</h3>
                    {purchaseBills.length > 0 ? (
                      <div className="overflow-x-auto border border-slate-200 rounded-xl flex-1">
                        <table className="w-full text-sm text-left">
                          <thead className="bg-[#F1F5F9] text-slate-600 text-xs uppercase">
                            <tr>
                              <th className="px-4 py-3 border-b border-slate-200">Purchase Bill No</th>
                              <th className="px-4 py-3 border-b border-slate-200">Date</th>
                              <th className="px-4 py-3 border-b border-slate-200">Items</th>
                              <th className="px-4 py-3 border-b border-slate-200">Status</th>
                              <th className="px-4 py-3 border-b border-slate-200 text-right">Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#1A1A1A]">
                            {purchaseBills.map((bill: any) => (
                               <tr key={bill._id} className="hover:bg-[#F1F5F9] cursor-pointer" onClick={() => router.push(`/dashboard/purchases`)}>
                                 <td className="px-4 py-3 text-blue-400 font-mono">{bill.purchaseBillNumber}</td>
                                 <td className="px-4 py-3">{new Date(bill.purchaseBillDate).toLocaleDateString()}</td>
                                 <td className="px-4 py-3">{bill.lineItems?.length || 0}</td>
                                 <td className="px-4 py-3">
                                   <span className={`px-2 py-1 text-[10px] rounded-full font-bold uppercase tracking-wide ${bill.status === 'paid' ? 'bg-emerald-900/40 text-emerald-400' : bill.status === 'partial' ? 'bg-orange-900/40 text-orange-400' : 'bg-red-900/40 text-red-400'}`}>{bill.status}</span>
                                 </td>
                                 <td className="px-4 py-3 text-right font-bold text-slate-900">₹{bill.grandTotal?.toFixed(2) || '0.00'}</td>
                               </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="flex h-full items-center justify-center flex-col text-slate-600 gap-3">
                        <div className="text-4xl">📄</div>
                        <p className="text-sm">No purchaseBills found for this supplier.</p>
                      </div>
                    )}
                 </div>
               )}

               {activeTab === 'Payment History' && (
                 <div className="flex flex-col h-full">
                    <h3 className="font-semibold text-slate-900 mb-4">Payment History</h3>
                    {ledger.filter((txn: any) => txn.referenceType === 'Payment' && txn.credit > 0).length > 0 ? (
                      <div className="overflow-x-auto border border-slate-200 rounded-xl flex-1">
                        <table className="w-full text-sm text-left">
                          <thead className="bg-[#F1F5F9] text-slate-600 text-xs uppercase">
                            <tr>
                              <th className="px-4 py-3 border-b border-slate-200">Date</th>
                              <th className="px-4 py-3 border-b border-slate-200">Description</th>
                              <th className="px-4 py-3 border-b border-slate-200">Ref / Txn ID</th>
                              <th className="px-4 py-3 border-b border-slate-200 text-right">Amount Received</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#1A1A1A]">
                            {ledger.filter((txn: any) => txn.referenceType === 'Payment' && txn.credit > 0).map((txn: any) => (
                               <tr key={txn._id} className="hover:bg-[#F1F5F9]">
                                 <td className="px-4 py-3">{new Date(txn.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}</td>
                                 <td className="px-4 py-3 text-slate-800">{txn.description}</td>
                                 <td className="px-4 py-3 text-blue-500 font-mono">{txn.referenceId || '—'}</td>
                                 <td className="px-4 py-3 text-right font-bold text-emerald-500">+ ₹{txn.credit?.toFixed(2)}</td>
                               </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="flex h-full items-center justify-center flex-col text-slate-600 gap-3">
                        <div className="text-4xl">💳</div>
                        <p className="text-sm">No payments recorded yet.</p>
                      </div>
                    )}
                 </div>
               )}

               {activeTab === 'Accounts' && (
                 <div className="flex flex-col h-full">
                    <h3 className="font-semibold text-slate-900 mb-4">Supplier Ledger (Statement of Account)</h3>
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="bg-[#F1F5F9] border border-slate-200 p-4 rounded-xl">
                         <div className="text-xs text-slate-600 uppercase">Current Balance</div>
                         <div className="text-xl font-bold mt-1 text-slate-900">₹{Math.abs(currentBalance).toFixed(2)} <span className="text-sm font-semibold">{currentBalance >= 0 ? 'Cr' : 'Dr'}</span></div>
                      </div>
                      <div className="bg-[#F1F5F9] border border-slate-200 p-4 rounded-xl">
                         <div className="text-xs text-slate-600 uppercase">Total Billed</div>
                         <div className="text-xl font-bold mt-1 text-orange-400">₹{purchaseBills.reduce((acc, inv) => acc + (inv.grandTotal || 0), 0).toFixed(2)}</div>
                      </div>
                      <div className="bg-[#F1F5F9] border border-slate-200 p-4 rounded-xl">
                         <div className="text-xs text-slate-600 uppercase">Total Paid</div>
                         <div className="text-xl font-bold mt-1 text-emerald-400">₹{purchaseBills.reduce((acc, inv) => acc + (inv.amountPaid || 0), 0).toFixed(2)}</div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col flex-1 h-full bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                      <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-600 uppercase">From</span>
                            <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="text-sm px-3 py-1.5 rounded-lg border border-slate-200 bg-white" />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-600 uppercase">To</span>
                            <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="text-sm px-3 py-1.5 rounded-lg border border-slate-200 bg-white" />
                          </div>
                        </div>
                        <button 
                          onClick={() => {
                            const query = new URLSearchParams();
                            if (fromDate) query.set('from', fromDate);
                            if (toDate) query.set('to', toDate);
                            window.open(`/print/ledger/supplier/${id}?${query.toString()}`, '_blank');
                          }}
                          className="flex items-center gap-1.5 px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-sm font-medium rounded-lg transition"
                        >
                          Print Ledger
                        </button>
                      </div>

                      <div className="flex-1 overflow-auto">
                        <table className="w-full text-sm text-left">
                          <thead className="bg-[#1A1A1A] sticky top-0">
                            <tr>
                              <th className="px-4 py-3 text-white font-medium text-xs tracking-wider">Date</th>
                              <th className="px-4 py-3 text-white font-medium text-xs tracking-wider">Particulars</th>
                              <th className="px-4 py-3 text-white font-medium text-xs tracking-wider">Vch Type</th>
                              <th className="px-4 py-3 text-white font-medium text-xs tracking-wider text-right">Debit</th>
                              <th className="px-4 py-3 text-white font-medium text-xs tracking-wider text-right">Credit</th>
                              <th className="px-4 py-3 text-white font-medium text-xs tracking-wider text-right">Balance</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {(() => {
                              const sortedLedger = [...ledger].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                              
                              const txnsBeforeFromDate = fromDate ? sortedLedger.filter(t => new Date(t.date) < new Date(fromDate)) : [];
                              const displayTxns = sortedLedger.filter(t => {
                                if (fromDate && new Date(t.date) < new Date(fromDate)) return false;
                                if (toDate && new Date(t.date) > new Date(toDate)) return false;
                                return true;
                              });

                              const initialOpening = form.balanceType === 'Debit' ? Math.abs(form.openingBalance) : -Math.abs(form.openingBalance);
                              const priorTxns = txnsBeforeFromDate.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                              
                              let currentBal = priorTxns.length > 0 && priorTxns[priorTxns.length - 1].closingBalance !== undefined 
                                ? priorTxns[priorTxns.length - 1].closingBalance 
                                : initialOpening + txnsBeforeFromDate.reduce((acc, t) => acc + (t.debit || 0) - (t.credit || 0), 0);
                              
                              let periodDr = 0;
                              let periodCr = 0;

                              const formatBal = (b: number | undefined) => {
                                if (b === undefined) return '';
                                return b >= 0 ? `${b.toFixed(2)} Dr` : `${Math.abs(b).toFixed(2)} Cr`;
                              };

                              return (
                                <>
                                  <tr className="bg-slate-50/80 font-semibold">
                                    <td className="px-4 py-3 text-slate-600"></td>
                                    <td className="px-4 py-3 text-slate-900" colSpan={4}>Opening Balance</td>
                                    <td className="px-4 py-3 text-right text-slate-900">{formatBal(currentBal)}</td>
                                  </tr>
                                  {displayTxns.map((txn, idx) => {
                                    if (txn.closingBalance !== undefined) {
                                      currentBal = txn.closingBalance;
                                    } else {
                                      currentBal = currentBal + (txn.debit || 0) - (txn.credit || 0);
                                    }
                                    
                                    periodDr += (txn.debit || 0);
                                    periodCr += (txn.credit || 0);
                                    
                                    let vchType = txn.referenceType || 'Journal';
                                    if (txn.referenceType === 'Purchase Bill') vchType = 'Purchases';
                                    else if (txn.referenceType === 'Payment') vchType = 'Receipt';

                                    return (
                                      <tr key={txn._id || idx} className="hover:bg-slate-50 transition group/row">
                                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{new Date(txn.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}</td>
                                        <td className="px-4 py-3 text-slate-900">{txn.description}</td>
                                        <td className="px-4 py-3 text-slate-600">{vchType}</td>
                                        <td className="px-4 py-3 text-right text-slate-600">{txn.debit > 0 ? txn.debit.toFixed(2) : ''}</td>
                                        <td className="px-4 py-3 text-right text-slate-600">{txn.credit > 0 ? txn.credit.toFixed(2) : ''}</td>
                                        <td className="px-4 py-3 text-right text-slate-900 font-medium">{formatBal(currentBal)}</td>
                                      </tr>
                                    );
                                  })}
                                  <tr className="bg-slate-50/80 font-bold border-t-2 border-slate-200">
                                    <td className="px-4 py-4 text-slate-800" colSpan={3}>Closing Balance</td>
                                    <td className="px-4 py-4 text-right text-slate-900">{periodDr.toFixed(2)}</td>
                                    <td className="px-4 py-4 text-right text-slate-900">{periodCr.toFixed(2)}</td>
                                    <td className="px-4 py-4 text-right text-slate-900">{formatBal(currentBal)}</td>
                                  </tr>
                                </>
                              );
                            })()}
                          </tbody>
                        </table>
                      </div>
                    </div>
                 </div>
               )}

               {activeTab === 'Purchase Orders' && (
                 <div className="flex flex-col h-full items-center justify-center text-slate-600 gap-3">
                    <div className="text-4xl">📝</div>
                    <p className="text-sm">No purchase orders generated.</p>
                    <button className="mt-2 text-action-500 hover:text-blue-400 text-xs font-semibold underline">Create Purchase Order</button>
                 </div>
               )}

               {activeTab === 'Cheque / Cash Alerts' && (
                 <div className="flex flex-col h-full items-center justify-center text-slate-600 gap-3">
                    <div className="text-4xl">🔔</div>
                    <p className="text-sm">No pending alerts for this account.</p>
                 </div>
               )}
          </div>
        </div>
      </main>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Receive Payment</h2>
              <button onClick={() => setShowPaymentModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"><X className="w-5 h-5"/></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="erp-label">Amount Received (₹)</label>
                <input type="number" value={paymentForm.amount} onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})} className="erp-input w-full" placeholder="0.00" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="erp-label">Payment Mode</label>
                  <select value={paymentForm.mode} onChange={e => setPaymentForm({...paymentForm, mode: e.target.value})} className="erp-input w-full">
                    <option>Cash</option><option>UPI</option><option>Bank Transfer</option><option>Cheque</option>
                  </select>
                </div>
                <div>
                  <label className="erp-label">Date</label>
                  <input type="date" value={paymentForm.date} onChange={e => setPaymentForm({...paymentForm, date: e.target.value})} className="erp-input w-full" />
                </div>
              </div>
              <div>
                <label className="erp-label">Reference No. (Cheque / UTR)</label>
                <input type="text" value={paymentForm.referenceNo} onChange={e => setPaymentForm({...paymentForm, referenceNo: e.target.value})} className="erp-input w-full" placeholder="Optional" />
              </div>
              <div>
                <label className="erp-label">Narration / Notes</label>
                <textarea value={paymentForm.notes} onChange={e => setPaymentForm({...paymentForm, notes: e.target.value})} className="erp-input w-full h-20 resize-none" placeholder="Enter ledger narration..." />
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button onClick={() => setShowPaymentModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900">Cancel</button>
              <button onClick={handlePaymentSubmit} className="px-6 py-2 bg-action-600 text-white text-sm font-medium rounded-xl hover:bg-action-700 shadow-sm shadow-action-600/20">Record Payment</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}




