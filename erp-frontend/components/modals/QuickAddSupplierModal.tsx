import React, { useState, useRef, useEffect, useCallback } from 'react';
import { suppliersApi } from '../../lib/erp-api';
import { Upload, Camera, RefreshCw, X, Save, User as UserIcon, VideoOff } from 'lucide-react';
import toast from 'react-hot-toast';
const INDIAN_STATES = ['Andhra Pradesh','Assam','Bihar','Chhattisgarh','Delhi','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal'];

export default function QuickAddSupplierModal({ onClose, onAdded }: { onClose: () => void; onAdded: (Supplier: any) => void; }) {
  const [saving, setSaving] = useState(false);

  // --- Photo State ---
  const [photo, setPhoto] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Start camera
  const startCamera = useCallback(async (mode: 'user' | 'environment' = 'user') => {
    setCameraError('');
    setShowCamera(true);
    setFacingMode(mode);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: mode }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); }
    } catch (err: any) {
      setCameraError(err.name === 'NotAllowedError' ? 'Camera permission denied.' : 'Could not access camera.');
    }
  }, []);

  // Stop camera stream
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
    setCameraError('');
  }, []);

  // Cleanup on unmount
  useEffect(() => { return () => stopCamera(); }, [stopCamera]);

  // Attach stream to video element after showCamera renders the video tag
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
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setPhoto(dataUrl);
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
    name: '', address: '', city: '', state: '', pinCode: '', country: 'India',
    email: '', phoneNo: '', mobile: '',
    panNo: '', gstin: '', gstType: 'Unregistered', tradeName: '',
    balanceType: 'Debit', openingBalance: 0,
    documentType: '', documentNo: '',
    dobApplicable: false, dob: '',
    anniversaryApplicable: false, anniversary: '',
    creditAllowed: false, creditLimit: 0,
    priceCategory: 'Retail', remark: ''
  });

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Full Name is required'); return; }
    if (!form.address.trim()) { toast.error('Billing Address is required'); return; }
    if (!form.state.trim()) { toast.error('State is required'); return; }
    if (!form.mobile.trim()) { toast.error('Contact No is required'); return; }

    setSaving(true);
    try {
      const payload = {
        name: form.name,
        address: { street: form.address, city: form.city, state: form.state, pinCode: form.pinCode, country: form.country },
        email: form.email,
        phoneNo: form.phoneNo,
        mobile: form.mobile,
        pan: form.panNo,
        gstin: form.gstin,
        gstType: form.gstType,
        tradeName: form.tradeName,
        balanceType: form.balanceType,
        openingBalance: form.balanceType === 'Credit' ? -Math.abs(form.openingBalance) : Math.abs(form.openingBalance),
        documentType: form.documentType,
        documentNo: form.documentNo,
        dob: form.dobApplicable ? form.dob : undefined,
        anniversary: form.anniversaryApplicable ? form.anniversary : undefined,
        creditAllowed: form.creditAllowed,
        creditLimit: form.creditLimit,
        priceCategory: form.priceCategory,
        note: form.remark,
        photo: photo || undefined,
      };
      const { data } = await suppliersApi.create(payload);
      toast.success('Supplier Information Saved!');
      onAdded(data.Supplier);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to save Supplier');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-50/60 backdrop-blur-sm">
      <div className="bg-[#F1F5F9] border border-slate-200 rounded-2xl w-full max-w-6xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-5 border-b border-slate-200 shrink-0 bg-white rounded-t-2xl">
          <div>
            <h3 className="text-slate-900 font-bold text-lg">Add New Supplier</h3>
            <p className="text-xs text-slate-600 mt-0.5">Fill in the Supplier details below</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-[#F1F5F9] text-slate-600 hover:text-slate-900 transition"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex flex-1 overflow-y-auto p-4 bg-[#F1F5F9]">
          {/* Inner content from page.tsx */}

         <div className="flex flex-col md:flex-row gap-4 max-w-6xl mx-auto">
            {/* Left Panel - Photo */}
            <div className="w-full md:w-64 shrink-0">
               <fieldset className="border border-slate-200 rounded bg-slate-50 p-4 relative pt-6 shadow-sm">
                 <legend className="text-[11px] font-semibold px-2 bg-slate-50 text-slate-600 absolute -top-2 left-2">Profile Pic</legend>
                 
                 {/* Photo Preview or Camera */}
                 <div className="w-40 h-40 mx-auto mb-4 relative">
                   {showCamera ? (
                     <div className="w-full h-full rounded-full overflow-hidden border-4 border-[#1e3a8a] bg-slate-50 flex items-center justify-center relative">
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

                 {/* Hidden canvas for capture */}
                 <canvas ref={canvasRef} className="hidden" />

                 {/* Hidden file input */}
                 <input
                   ref={fileInputRef}
                   type="file"
                   accept="image/*"
                   className="hidden"
                   onChange={handleFileUpload}
                 />

                 {/* Action Buttons */}
                 {showCamera ? (
                   <div className="flex justify-center gap-3 px-2 mt-2">
                     {!cameraError && (
                       <>
<button onClick={capturePhoto} className="flex-1 flex items-center justify-center gap-1 text-xs text-slate-900 bg-[#1e3a8a] hover:bg-action-600 py-1.5 rounded border border-[#1e3a8a] transition font-semibold">
                         <Camera className="w-4 h-4" /> Capture
                       </button>
                      <button onClick={() => startCamera(facingMode === 'user' ? 'environment' : 'user')} className="px-3 flex items-center justify-center text-slate-600 bg-white hover:bg-slate-50 py-1.5 rounded border border-slate-200 transition" title="Flip Camera">
                        <RefreshCw className="w-4 h-4" />
                      </button>
                     </>
)}
                     <button onClick={stopCamera} className="flex-1 flex items-center justify-center gap-1 text-xs text-red-400 bg-white hover:bg-[#1a0000] py-1.5 rounded border border-slate-200 transition">
                       <X className="w-4 h-4" /> Cancel
                     </button>
                   </div>
                 ) : (
                   <div className="flex justify-between px-2 items-center mt-2">
                     <button
                       onClick={() => fileInputRef.current?.click()}
                       className="text-green-500 hover:text-green-400 bg-white p-1.5 rounded border border-slate-200 transition"
                       title="Upload from File"
                     >
                       <Upload className="w-5 h-5" />
                     </button>
                     <button
                       onClick={() => startCamera()}
                       className="text-green-500 hover:text-green-400 bg-white p-1.5 rounded border border-slate-200 transition"
                       title="Take Photo with Camera"
                     >
                       <Camera className="w-5 h-5" />
                     </button>
                     <button
                       onClick={() => setPhoto(null)}
                       className="text-red-500 hover:text-red-400 bg-white p-1.5 rounded border border-slate-200 transition"
                       title="Reset Photo"
                       disabled={!photo}
                     >
                       <RefreshCw className="w-5 h-5" />
                     </button>
                     <button
                       onClick={() => setPhoto(null)}
                       className="text-red-500 hover:text-red-400 bg-white p-1.5 rounded border border-slate-200 transition"
                       title="Delete Photo"
                       disabled={!photo}
                     >
                       <X className="w-5 h-5" />
                     </button>
                   </div>
                 )}

                 {photo && !showCamera && (
                   <p className="text-center text-[10px] text-green-400 mt-2">✓ Photo set</p>
                 )}
                 <p className="text-center text-[9px] text-slate-600 mt-1">Upload or take a photo (max 2MB)</p>
               </fieldset>
            </div>
            
            {/* Right Panel */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4">
               {/* Column 1 */}
               <div className="space-y-4">
                 
                 <fieldset className="border border-slate-200 rounded bg-slate-50 p-4 relative pt-5 shadow-sm">
                   <legend className="text-[11px] font-semibold px-2 bg-slate-50 text-slate-600 absolute -top-2 left-2">Supplier Details</legend>
                   <div className="grid grid-cols-[110px_1fr] gap-y-2.5 items-center text-xs">
                     <label className="text-slate-600">Full Name <span className="text-red-500">*</span></label>
                     <input className="erp-input w-full bg-[#F1F5F9]" value={form.name} onChange={e=>setForm({...form, name: e.target.value})} />
                     
                     <label className="self-start mt-2 text-slate-600">Billing Address <span className="text-red-500">*</span></label>
                     <textarea className="erp-input w-full h-16 resize-none bg-[#F1F5F9]" value={form.address} onChange={e=>setForm({...form, address: e.target.value})} />
                     
                     <label className="text-slate-600">City</label>
                     <input className="erp-input w-full bg-[#F1F5F9]" value={form.city} onChange={e=>setForm({...form, city: e.target.value})} />
                     
                     <label className="text-slate-600">State <span className="text-red-500">*</span></label>
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
                       <option>Unregistered</option>
                       <option>Regular</option>
                       <option>Composition</option>
                     </select>
                     
                     <label className="text-slate-600">Trade Name</label>
                     <input className="erp-input w-full bg-[#F1F5F9]" value={form.tradeName} onChange={e=>setForm({...form, tradeName: e.target.value})} />
                   </div>
                   <div className="mt-3 pl-[118px]">
                     <a href="#" className="text-action-500 text-[10px] hover:underline hover:text-blue-400 transition">Check GSTIN/UIN Status</a>
                   </div>
                 </fieldset>
                 
               </div>
               
               {/* Column 2 */}
               <div className="space-y-4">
                 
                 <fieldset className="border border-slate-200 rounded bg-slate-50 p-4 relative pt-5 shadow-sm">
                   <legend className="text-[11px] font-semibold px-2 bg-slate-50 text-slate-600 absolute -top-2 left-2">Account Details</legend>
                   <div className="grid grid-cols-[110px_1fr] gap-y-2.5 items-center text-xs">
                     <label className="text-slate-600">Type</label>
                     <div className="flex gap-4">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                           <input type="radio" name="balType" checked={form.balanceType === 'Debit'} onChange={() => setForm({...form, balanceType: 'Debit'})} className="accent-[#1e3a8a] w-3.5 h-3.5" /> Debit
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                           <input type="radio" name="balType" checked={form.balanceType === 'Credit'} onChange={() => setForm({...form, balanceType: 'Credit'})} className="accent-[#1e3a8a] w-3.5 h-3.5" /> Credit
                        </label>
                     </div>
                     
                     <label className="text-slate-600">Opening Balance</label>
                     <div className="flex">
                        <span className="bg-[#1e3a8a] text-white px-2.5 py-1 border border-slate-200 border-r-0 flex items-center shadow-inner">₹</span>
                        <input type="number" className="erp-input w-full rounded-l-none bg-[#F1F5F9]" value={form.openingBalance === 0 ? '' : form.openingBalance} onChange={e=>setForm({...form, openingBalance: parseFloat(e.target.value) || 0})} />
                     </div>
                   </div>
                 </fieldset>
                 
                 <fieldset className="border border-slate-200 rounded bg-slate-50 p-4 relative pt-5 shadow-sm">
                   <legend className="text-[11px] font-semibold px-2 bg-slate-50 text-slate-600 absolute -top-2 left-2">Identity Details</legend>
                   <div className="grid grid-cols-[110px_1fr] gap-y-2.5 items-center text-xs">
                     <label className="text-slate-600">Document Type</label>
                     <select className="erp-input w-full bg-[#F1F5F9]" value={form.documentType} onChange={e=>setForm({...form, documentType: e.target.value})}>
                       <option></option>
                       <option>Aadhar</option><option>Passport</option><option>Driving License</option>
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
                        <label className="flex items-center gap-1.5 cursor-pointer w-20">
                           <input type="checkbox" checked={form.dobApplicable} onChange={e=>setForm({...form, dobApplicable: e.target.checked})} className="accent-[#1e3a8a] w-3.5 h-3.5" /> Applicable
                        </label>
                        <input type="date" disabled={!form.dobApplicable} className="erp-input flex-1 disabled:opacity-40 bg-[#F1F5F9]" value={form.dob} onChange={e=>setForm({...form, dob: e.target.value})} />
                     </div>
                     
                     <label className="text-slate-600">Anniversary</label>
                     <div className="flex items-center gap-2">
                        <label className="flex items-center gap-1.5 cursor-pointer w-20">
                           <input type="checkbox" checked={form.anniversaryApplicable} onChange={e=>setForm({...form, anniversaryApplicable: e.target.checked})} className="accent-[#1e3a8a] w-3.5 h-3.5" /> Applicable
                        </label>
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
                        <span className="bg-[#1e3a8a] text-white px-2.5 py-1 border border-slate-200 border-r-0 flex items-center shadow-inner opacity-[var(--tw-opacity)]" style={{ opacity: form.creditAllowed ? 1 : 0.4 }}>₹</span>
                        <input type="number" className="erp-input w-full rounded-l-none disabled:opacity-40 bg-[#F1F5F9]" disabled={!form.creditAllowed} value={form.creditLimit === 0 ? '' : form.creditLimit} onChange={e=>setForm({...form, creditLimit: parseFloat(e.target.value) || 0})} />
                     </div>
                     
                     <label className="text-slate-600">Price Category</label>
                     <select className="erp-input w-full bg-[#F1F5F9]" value={form.priceCategory} onChange={e=>setForm({...form, priceCategory: e.target.value})}>
                       <option>Retail</option>
                       <option>Wholesale</option>
                     </select>
                     
                     <label className="self-start mt-2 text-slate-600">Remark / Note</label>
                     <textarea className="erp-input w-full h-16 resize-none bg-[#F1F5F9]" value={form.remark} onChange={e=>setForm({...form, remark: e.target.value})} />
                   </div>
                 </fieldset>
                 
                 <div className="flex justify-end pt-4 pb-12 lg:pb-0">
                   <button onClick={handleSave} disabled={saving} className="bg-[#1e3a8a] hover:bg-action-600 text-white px-8 py-2 rounded flex items-center gap-2 text-sm font-semibold shadow-md transition disabled:opacity-50">
                     <Save className="w-4 h-4" /> Save
                   </button>
                 </div>
               </div>
            </div>
         </div>
      
        </div>

        <div className="p-5 border-t border-slate-200 bg-white flex justify-end gap-3 rounded-b-2xl shrink-0">

        </div>
      </div>
    </div>
  );
}

