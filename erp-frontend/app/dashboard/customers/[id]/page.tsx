'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Topbar from '../../../../components/layout/Topbar';
import { customersApi } from '../../../../lib/erp-api';
import { Upload, Camera, RefreshCw, X, Save, User as UserIcon, Loader2, VideoOff } from 'lucide-react';
import toast from 'react-hot-toast';

const INDIAN_STATES = ['Andhra Pradesh','Assam','Bihar','Chhattisgarh','Delhi','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal'];

export default function EditCustomerPage() {
  const router = useRouter();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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

  // Load existing customer data
  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        const { data } = await customersApi.get(id as string);
        const c = data.customer;
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
        toast.error('Failed to load customer');
        router.push('/dashboard/customers');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchCustomer();
  }, [id, router]);

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
      await customersApi.update(id as string, payload);
      toast.success('Customer updated successfully!');
      router.push('/dashboard/customers');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to update customer');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col h-screen bg-black text-white">
      <Topbar title="Edit Customer" />
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-[#94a3b8]" />
      </div>
    </div>
  );

  const [activeTab, setActiveTab] = useState('Profile');
  const tabs = ['Profile', 'Accounts', 'Payment History', 'Invoices', 'Quotations', 'Cheque / Cash Alerts'];

  return (
    <div className="flex flex-col h-screen bg-black text-white font-sans overflow-hidden">
      <Topbar title="Edit Customer" />
      <div className="flex px-4 pt-2 border-b border-[#1A1A1A] bg-[#050505]">
         {tabs.map(tab => (
           <button 
             key={tab} 
             onClick={() => setActiveTab(tab)}
             className={`px-4 py-2 text-xs font-semibold border ${activeTab === tab ? 'bg-[#111111] border-[#1A1A1A] border-b-0 rounded-t text-white' : 'border-transparent text-[#475569] hover:text-[#94a3b8]'}`}
           >
             {tab}
           </button>
         ))}
      </div>
      
      <main className="flex-1 overflow-y-auto p-4 bg-[#050505]">
         <div className="flex flex-col md:flex-row gap-4 max-w-6xl mx-auto h-full">
            {/* Left Panel - Photo & Actions */}
            <div className="w-full md:w-72 shrink-0 flex flex-col gap-4">
               <fieldset className="border border-[#1A1A1A] rounded bg-black p-4 relative pt-6 shadow-sm">
                 <legend className="text-[11px] font-semibold px-2 bg-black text-[#94a3b8] absolute -top-2 left-2">Profile Pic</legend>
                 
                 <div className="w-40 h-40 mx-auto mb-4 relative">
                   {showCamera ? (
                     <div className="w-full h-full rounded-full overflow-hidden border-4 border-[#1e3a8a] bg-black flex items-center justify-center">
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
                         <img src={photo} alt="Customer" className="w-full h-full object-cover" />
                       ) : (
                         <UserIcon className="w-24 h-24 text-blue-500 mt-8" />
                       )}
                     </div>
                   )}
                 </div>

                 <canvas ref={canvasRef} className="hidden" />
                 <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />

                 {showCamera ? (
                   <div className="flex justify-center gap-3 px-2 mt-2">
                     {!cameraError && (
                       <button onClick={capturePhoto} className="flex-1 flex items-center justify-center gap-1 text-xs text-white bg-[#1e3a8a] hover:bg-blue-700 py-1.5 rounded border border-[#1e3a8a] transition font-semibold">
                         <Camera className="w-4 h-4" /> Capture
                       </button>
                     )}
                     <button onClick={stopCamera} className="flex-1 flex items-center justify-center gap-1 text-xs text-red-400 bg-[#0A0A0A] hover:bg-[#1a0000] py-1.5 rounded border border-[#1A1A1A] transition">
                       <X className="w-4 h-4" /> Cancel
                     </button>
                   </div>
                 ) : (
                   <div className="flex justify-between px-2 items-center mt-2">
                     <button onClick={() => fileInputRef.current?.click()} className="text-green-500 hover:text-green-400 bg-[#0A0A0A] p-1.5 rounded border border-[#1A1A1A] transition" title="Upload from File"><Upload className="w-5 h-5" /></button>
                     <button onClick={startCamera} className="text-green-500 hover:text-green-400 bg-[#0A0A0A] p-1.5 rounded border border-[#1A1A1A] transition" title="Take Photo"><Camera className="w-5 h-5" /></button>
                     <button onClick={() => setPhoto(null)} disabled={!photo} className="text-red-500 hover:text-red-400 bg-[#0A0A0A] p-1.5 rounded border border-[#1A1A1A] transition disabled:opacity-40" title="Reset"><RefreshCw className="w-5 h-5" /></button>
                     <button onClick={() => setPhoto(null)} disabled={!photo} className="text-red-500 hover:text-red-400 bg-[#0A0A0A] p-1.5 rounded border border-[#1A1A1A] transition disabled:opacity-40" title="Delete"><X className="w-5 h-5" /></button>
                   </div>
                 )}
                 {photo && !showCamera && <p className="text-center text-[10px] text-green-400 mt-2">✓ Photo set</p>}
                 <p className="text-center text-[9px] text-[#475569] mt-1">Upload or take a photo (max 2MB)</p>
               </fieldset>

               {/* Account Information */}
               <fieldset className="border border-[#1A1A1A] rounded bg-black p-4 relative pt-5 shadow-sm">
                 <legend className="text-[11px] font-semibold px-2 bg-black text-[#94a3b8] absolute -top-2 left-2">Account Information</legend>
                 <div className="space-y-3 text-xs">
                   <div className="flex justify-between">
                     <span className="text-[#94a3b8]">Customer ID</span>
                     <span className="font-semibold text-white">{id?.slice(-6).toUpperCase() || 'NEW'}</span>
                   </div>
                   <div className="flex justify-between">
                     <span className="text-[#94a3b8]">Account Balance</span>
                     <span className={`font-bold ${form.openingBalance > 0 ? 'text-green-500' : 'text-white'}`}>₹{form.openingBalance.toFixed(2)}</span>
                   </div>
                   <div className="flex justify-between">
                     <span className="text-[#94a3b8]">Account Status</span>
                     <span className="font-bold text-green-500 uppercase tracking-wider">ACTIVE</span>
                   </div>
                 </div>
               </fieldset>

               {/* Account Actions */}
               <fieldset className="border border-[#1A1A1A] rounded bg-black p-4 relative pt-5 shadow-sm flex-1">
                 <legend className="text-[11px] font-semibold px-2 bg-black text-[#94a3b8] absolute -top-2 left-2">Account Actions</legend>
                 <div className="grid grid-cols-2 gap-2 mb-4">
                   <button className="py-2 text-xs border border-[#1A1A1A] rounded text-[#94a3b8] hover:text-white hover:bg-[#111111] transition bg-[#0A0A0A]">New Invoice</button>
                   <button className="py-2 text-xs border border-[#1A1A1A] rounded text-[#94a3b8] hover:text-white hover:bg-[#111111] transition bg-[#0A0A0A]">New Quotation</button>
                   <button className="py-2 text-xs border border-[#1A1A1A] rounded text-[#94a3b8] hover:text-white hover:bg-[#111111] transition bg-[#0A0A0A]">Send SMS</button>
                   <button className="py-2 text-xs border border-[#1A1A1A] rounded text-[#94a3b8] hover:text-white hover:bg-[#111111] transition bg-[#0A0A0A]">Send Email</button>
                 </div>
                 <button className="w-full py-2 text-xs border border-[#1A1A1A] rounded text-orange-400 hover:text-orange-300 hover:bg-[#111111] transition mb-3 bg-[#0A0A0A]">Disable A/c</button>
                 <button className="w-full py-2 text-xs font-semibold rounded text-white bg-red-600 hover:bg-red-700 transition flex items-center justify-center gap-2">
                   <X className="w-4 h-4" /> Delete Account
                 </button>
               </fieldset>
            </div>
            
            {/* Right Panel */}
            <div className="flex-1 bg-black rounded border border-[#1A1A1A] p-4 shadow-sm min-h-0 overflow-y-auto">
               {activeTab === 'Profile' ? (
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                   {/* Column 1 */}
               <div className="space-y-4">
                 <fieldset className="border border-[#1A1A1A] rounded bg-black p-4 relative pt-5 shadow-sm">
                   <legend className="text-[11px] font-semibold px-2 bg-black text-[#94a3b8] absolute -top-2 left-2">Customer Details</legend>
                   <div className="grid grid-cols-[110px_1fr] gap-y-2.5 items-center text-xs">
                     <label className="text-[#94a3b8]">Full Name <span className="text-red-500">*</span></label>
                     <input className="erp-input w-full bg-[#111111]" value={form.name} onChange={e=>setForm({...form, name: e.target.value})} />
                     <label className="self-start mt-2 text-[#94a3b8]">Billing Address</label>
                     <textarea className="erp-input w-full h-16 resize-none bg-[#111111]" value={form.billingAddress} onChange={e=>setForm({...form, billingAddress: e.target.value})} />
                     <label className="text-[#94a3b8]">City</label>
                     <input className="erp-input w-full bg-[#111111]" value={form.city} onChange={e=>setForm({...form, city: e.target.value})} />
                     <label className="text-[#94a3b8]">State</label>
                     <select className="erp-input w-full bg-[#111111]" value={form.state} onChange={e=>setForm({...form, state: e.target.value})}>
                       <option value=""></option>
                       {INDIAN_STATES.map(s => <option key={s}>{s}</option>)}
                     </select>
                     <label className="text-[#94a3b8]">PIN Code</label>
                     <input className="erp-input w-full bg-[#111111]" value={form.pinCode} onChange={e=>setForm({...form, pinCode: e.target.value})} />
                     <label className="text-[#94a3b8]">Country</label>
                     <input className="erp-input w-full bg-[#111111]" value={form.country} onChange={e=>setForm({...form, country: e.target.value})} />
                     <label className="text-[#94a3b8]">Email ID</label>
                     <input className="erp-input w-full bg-[#111111]" value={form.email} onChange={e=>setForm({...form, email: e.target.value})} />
                     <label className="text-[#94a3b8]">Phone No</label>
                     <input className="erp-input w-full bg-[#111111]" value={form.phoneNo} onChange={e=>setForm({...form, phoneNo: e.target.value})} />
                     <label className="text-[#94a3b8]">Contact No <span className="text-red-500">*</span></label>
                     <input className="erp-input w-full bg-[#111111]" value={form.mobile} onChange={e=>setForm({...form, mobile: e.target.value})} />
                   </div>
                 </fieldset>

                 <fieldset className="border border-[#1A1A1A] rounded bg-black p-4 relative pt-5 shadow-sm">
                   <legend className="text-[11px] font-semibold px-2 bg-black text-[#94a3b8] absolute -top-2 left-2">Tax Details</legend>
                   <div className="grid grid-cols-[110px_1fr] gap-y-2.5 items-center text-xs">
                     <label className="text-[#94a3b8]">PAN No.</label>
                     <input className="erp-input w-full bg-[#111111]" value={form.panNo} onChange={e=>setForm({...form, panNo: e.target.value})} />
                     <label className="text-[#94a3b8]">GSTIN</label>
                     <input className="erp-input w-full uppercase bg-[#111111]" value={form.gstin} onChange={e=>setForm({...form, gstin: e.target.value})} />
                     <label className="text-[#94a3b8]">GST Type</label>
                     <select className="erp-input w-full bg-[#111111]" value={form.gstType} onChange={e=>setForm({...form, gstType: e.target.value})}>
                       <option>Unregistered</option><option>Regular</option><option>Composition</option>
                     </select>
                     <label className="text-[#94a3b8]">Trade Name</label>
                     <input className="erp-input w-full bg-[#111111]" value={form.tradeName} onChange={e=>setForm({...form, tradeName: e.target.value})} />
                   </div>
                 </fieldset>
               </div>
               
               {/* Column 2 */}
               <div className="space-y-4">
                 <fieldset className="border border-[#1A1A1A] rounded bg-black p-4 relative pt-5 shadow-sm">
                   <legend className="text-[11px] font-semibold px-2 bg-black text-[#94a3b8] absolute -top-2 left-2">Account Details</legend>
                   <div className="grid grid-cols-[110px_1fr] gap-y-2.5 items-center text-xs">
                     <label className="text-[#94a3b8]">Type</label>
                     <div className="flex gap-4">
                        <label className="flex items-center gap-1.5 cursor-pointer"><input type="radio" name="balType" checked={form.balanceType === 'Debit'} onChange={() => setForm({...form, balanceType: 'Debit'})} className="accent-[#1e3a8a] w-3.5 h-3.5" /> Debit</label>
                        <label className="flex items-center gap-1.5 cursor-pointer"><input type="radio" name="balType" checked={form.balanceType === 'Credit'} onChange={() => setForm({...form, balanceType: 'Credit'})} className="accent-[#1e3a8a] w-3.5 h-3.5" /> Credit</label>
                     </div>
                     <label className="text-[#94a3b8]">Opening Balance</label>
                     <div className="flex">
                        <span className="bg-[#1e3a8a] text-white px-2.5 py-1 border border-[#1A1A1A] border-r-0 flex items-center">₹</span>
                        <input type="number" className="erp-input w-full rounded-l-none bg-[#111111]" value={form.openingBalance === 0 ? '' : form.openingBalance} onChange={e=>setForm({...form, openingBalance: parseFloat(e.target.value) || 0})} />
                     </div>
                   </div>
                 </fieldset>

                 <fieldset className="border border-[#1A1A1A] rounded bg-black p-4 relative pt-5 shadow-sm">
                   <legend className="text-[11px] font-semibold px-2 bg-black text-[#94a3b8] absolute -top-2 left-2">Identity Details</legend>
                   <div className="grid grid-cols-[110px_1fr] gap-y-2.5 items-center text-xs">
                     <label className="text-[#94a3b8]">Document Type</label>
                     <select className="erp-input w-full bg-[#111111]" value={form.documentType} onChange={e=>setForm({...form, documentType: e.target.value})}>
                       <option></option><option>Aadhar</option><option>Passport</option><option>Driving License</option>
                     </select>
                     <label className="text-[#94a3b8]">Document No.</label>
                     <input className="erp-input w-full bg-[#111111]" value={form.documentNo} onChange={e=>setForm({...form, documentNo: e.target.value})} />
                   </div>
                 </fieldset>

                 <fieldset className="border border-[#1A1A1A] rounded bg-black p-4 relative pt-5 shadow-sm">
                   <legend className="text-[11px] font-semibold px-2 bg-black text-[#94a3b8] absolute -top-2 left-2">Anniversary</legend>
                   <div className="grid grid-cols-[110px_1fr] gap-y-2.5 items-center text-xs">
                     <label className="text-[#94a3b8]">Date of Birth</label>
                     <div className="flex items-center gap-2">
                        <label className="flex items-center gap-1.5 cursor-pointer w-20"><input type="checkbox" checked={form.dobApplicable} onChange={e=>setForm({...form, dobApplicable: e.target.checked})} className="accent-[#1e3a8a] w-3.5 h-3.5" /> Applicable</label>
                        <input type="date" disabled={!form.dobApplicable} className="erp-input flex-1 disabled:opacity-40 bg-[#111111]" value={form.dob} onChange={e=>setForm({...form, dob: e.target.value})} />
                     </div>
                     <label className="text-[#94a3b8]">Anniversary</label>
                     <div className="flex items-center gap-2">
                        <label className="flex items-center gap-1.5 cursor-pointer w-20"><input type="checkbox" checked={form.anniversaryApplicable} onChange={e=>setForm({...form, anniversaryApplicable: e.target.checked})} className="accent-[#1e3a8a] w-3.5 h-3.5" /> Applicable</label>
                        <input type="date" disabled={!form.anniversaryApplicable} className="erp-input flex-1 disabled:opacity-40 bg-[#111111]" value={form.anniversary} onChange={e=>setForm({...form, anniversary: e.target.value})} />
                     </div>
                   </div>
                 </fieldset>

                 <fieldset className="border border-[#1A1A1A] rounded bg-black p-4 relative pt-5 shadow-sm">
                   <legend className="text-[11px] font-semibold px-2 bg-black text-[#94a3b8] absolute -top-2 left-2">Other Details</legend>
                   <div className="grid grid-cols-[110px_1fr] gap-y-2.5 items-center text-xs">
                     <label className="text-[#94a3b8]">Credit Allowed</label>
                     <div className="flex gap-4">
                        <label className="flex items-center gap-1.5 cursor-pointer"><input type="radio" checked={form.creditAllowed} onChange={()=>setForm({...form, creditAllowed: true})} name="ca" className="accent-[#1e3a8a] w-3.5 h-3.5" /> Yes</label>
                        <label className="flex items-center gap-1.5 cursor-pointer"><input type="radio" checked={!form.creditAllowed} onChange={()=>setForm({...form, creditAllowed: false})} name="ca" className="accent-[#1e3a8a] w-3.5 h-3.5" /> No</label>
                     </div>
                     <label className="text-[#94a3b8]">Credit Limit</label>
                     <div className="flex">
                        <span className="bg-[#1e3a8a] text-white px-2.5 py-1 border border-[#1A1A1A] border-r-0 flex items-center" style={{ opacity: form.creditAllowed ? 1 : 0.4 }}>₹</span>
                        <input type="number" className="erp-input w-full rounded-l-none disabled:opacity-40 bg-[#111111]" disabled={!form.creditAllowed} value={form.creditLimit === 0 ? '' : form.creditLimit} onChange={e=>setForm({...form, creditLimit: parseFloat(e.target.value) || 0})} />
                     </div>
                     <label className="text-[#94a3b8]">Price Category</label>
                     <select className="erp-input w-full bg-[#111111]" value={form.priceCategory} onChange={e=>setForm({...form, priceCategory: e.target.value})}>
                       <option>Retail</option><option>Wholesale</option>
                     </select>
                     <label className="self-start mt-2 text-[#94a3b8]">Remark / Note</label>
                     <textarea className="erp-input w-full h-16 resize-none bg-[#111111]" value={form.remark} onChange={e=>setForm({...form, remark: e.target.value})} />
                   </div>
                 </fieldset>

                 <div className="flex justify-end gap-3 pt-4 pb-12 lg:pb-0">
                   <button onClick={() => router.push('/dashboard/customers')} className="px-6 py-2 rounded border border-[#1A1A1A] text-[#94a3b8] hover:text-white hover:border-[#D4D4D4] text-sm font-medium transition">
                     Cancel
                   </button>
                   <button onClick={handleSave} disabled={saving} className="bg-[#1e3a8a] hover:bg-blue-700 text-white px-8 py-2 rounded flex items-center gap-2 text-sm font-semibold shadow-md transition disabled:opacity-50">
                     {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Changes
                   </button>
                 </div>
               ) : (
                 <div className="flex h-full items-center justify-center flex-col text-[#475569] gap-4">
                   <div className="text-4xl">🚧</div>
                   <p className="text-sm font-semibold">{activeTab} details coming soon...</p>
                 </div>
               )}
            </div>
         </div>
      </main>
    </div>
  );
}
