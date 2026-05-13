'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Loader2, BarChart3, ChevronRight, ChevronLeft, CheckCircle2 } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux';
import { registerUser, clearError } from '../../store/slices/authSlice';

// ── Schemas per step ─────────────────────────────────────────────────────────
const step1Schema = z.object({
  businessName: z.string().min(2, 'Business name is required'),
  ownerName: z.string().min(2, 'Owner name is required'),
  businessType: z.enum(['Retail', 'Wholesale', 'Service', 'Medical', 'Manufacturing', 'Other']),
});

const step2Schema = z.object({
  gstin: z.string().max(15).optional().or(z.literal('')),
  pan: z.string().max(10).optional().or(z.literal('')),
  isCompositionScheme: z.boolean().optional(),
});

const step3Schema = z.object({
  mobile: z.string().regex(/^\d{10}$/, 'Enter a valid 10-digit mobile number'),
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  city: z.string().optional(),
  state: z.string().min(1, 'Please select your state'),
  pinCode: z.string().optional(),
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;
type Step3Data = z.infer<typeof step3Schema>;

const STEPS = ['Business Info', 'Tax & GST', 'Contact & Account'];
const STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa',
  'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala',
  'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland',
  'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi', 'Jammu & Kashmir', 'Ladakh',
  'Puducherry', 'Chandigarh',
];

const schemas = [step1Schema, step2Schema, step3Schema];

export default function RegisterPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { loading, error, token } = useAppSelector((s) => s.auth);
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<Record<string, any>>({});

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(schemas[step] as any),
  });

  useEffect(() => { if (token) router.replace('/dashboard'); }, [token, router]);
  useEffect(() => {
    if (error) { toast.error(error); dispatch(clearError()); }
  }, [error, dispatch]);

  const onNext = (data: any) => {
    const merged = { ...formData, ...data };
    setFormData(merged);

    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
      reset();
    } else {
      // Build and submit final payload
      const payload = {
        businessName: merged.businessName,
        ownerName: merged.ownerName,
        businessType: merged.businessType,
        gstin: merged.gstin || undefined,
        pan: merged.pan || undefined,
        isCompositionScheme: !!merged.isCompositionScheme,
        mobile: merged.mobile,
        email: merged.email,
        password: merged.password,
        address: {
          city: merged.city || '',
          state: merged.state || '',
          pinCode: merged.pinCode || '',
        },
      };
      dispatch(registerUser(payload)).then((res: any) => {
        if (!res.error) toast.success('Business registered! Welcome to BizERP 🎉');
      });
    }
  };

  const Field = ({ label, name, type = 'text', placeholder = '', required = false }: {
    label: string; name: string; type?: string; placeholder?: string; required?: boolean;
  }) => (
    <div>
      <label className="block text-sm font-medium text-[#94a3b8] mb-2">
        {label}{required && <span className="text-red-400 ml-1">*</span>}
      </label>
      <input
        {...register(name as any)}
        type={type}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-xl bg-[#111111] border border-[#1A1A1A] text-white placeholder-[#475569] focus:outline-none focus:border-[#D4D4D4] focus:ring-1 focus:ring-[#D4D4D4] transition text-sm"
      />
      {(errors as any)[name] && (
        <p className="mt-1 text-xs text-red-400">{(errors as any)[name]?.message}</p>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#000000] flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-8 justify-center">
          <div className="w-8 h-8 rounded-lg gradient-accent flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-bold text-lg">BizERP India</span>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-center mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center">
              <div className="flex flex-col items-center gap-1">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300
                  ${i < step ? 'bg-white text-black hover:bg-gray-200' : i === step ? 'border-2 border-[#D4D4D4] text-[#D4D4D4]' : 'border-2 border-[#1A1A1A] text-[#475569]'}`}>
                  {i < step ? <CheckCircle2 className="w-5 h-5" /> : i + 1}
                </div>
                <span className={`text-xs font-medium hidden sm:block ${i === step ? 'text-[#D4D4D4]' : i < step ? 'text-white' : 'text-[#475569]'}`}>
                  {s}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-px w-16 sm:w-24 mx-1 mb-4 transition-colors ${i < step ? 'bg-[#D4D4D4]' : 'bg-[#1A1A1A]'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="glass rounded-2xl p-8 shadow-2xl">
          <h2 className="text-xl font-bold text-white mb-6">{STEPS[step]}</h2>

          <form onSubmit={handleSubmit(onNext)} className="space-y-4">
            {/* Step 1 — Business Info */}
            {step === 0 && (
              <>
                <Field label="Business Name" name="businessName" placeholder="e.g. Sharma Enterprises" required />
                <Field label="Owner Name" name="ownerName" placeholder="e.g. Rajesh Sharma" required />
                <div>
                  <label className="block text-sm font-medium text-[#94a3b8] mb-2">Business Type <span className="text-red-400">*</span></label>
                  <select {...register('businessType')}
                    className="w-full px-4 py-3 rounded-xl bg-[#111111] border border-[#1A1A1A] text-white focus:outline-none focus:border-[#D4D4D4] transition text-sm">
                    {['Retail', 'Wholesale', 'Service', 'Medical', 'Manufacturing', 'Other'].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {/* Step 2 — Tax & GST */}
            {step === 1 && (
              <>
                <Field label="GSTIN (optional)" name="gstin" placeholder="22AAAAA0000A1Z5" />
                <Field label="PAN Number (optional)" name="pan" placeholder="ABCDE1234F" />
                <div className="flex items-center gap-3 p-4 rounded-xl bg-[#111111] border border-[#1A1A1A]">
                  <input type="checkbox" {...register('isCompositionScheme')} id="comp" className="w-4 h-4 accent-[#D4D4D4]" />
                  <label htmlFor="comp" className="text-sm text-[#94a3b8] cursor-pointer">
                    Registered under GST Composition Scheme
                  </label>
                </div>
              </>
            )}

            {/* Step 3 — Contact & Account */}
            {step === 2 && (
              <>
                <Field label="Mobile Number" name="mobile" placeholder="9876543210" required />
                <Field label="Email Address" name="email" type="email" placeholder="owner@business.com" required />
                <Field label="Password" name="password" type="password" placeholder="Min 6 characters" required />
                <Field label="City" name="city" placeholder="Mumbai" />
                <div>
                  <label className="block text-sm font-medium text-[#94a3b8] mb-2">State <span className="text-red-400">*</span></label>
                  <select {...register('state')}
                    className="w-full px-4 py-3 rounded-xl bg-[#111111] border border-[#1A1A1A] text-white focus:outline-none focus:border-[#D4D4D4] transition text-sm">
                    <option value="">— Select State —</option>
                    {STATES.map(st => <option key={st} value={st}>{st}</option>)}
                  </select>
                  {(errors as any).state && (
                    <p className="mt-1 text-xs text-red-400">{(errors as any).state?.message}</p>
                  )}
                </div>
                <Field label="PIN Code" name="pinCode" placeholder="400001" />
              </>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-3 pt-2">
              {step > 0 && (
                <button type="button" onClick={() => { setStep(step - 1); reset(); }}
                  className="flex-1 py-3 rounded-xl border border-[#1A1A1A] text-[#94a3b8] hover:border-[#D4D4D4] hover:text-white font-medium flex items-center justify-center gap-2 transition">
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
              )}
              <button type="submit" disabled={loading}
                className="flex-1 py-3 rounded-xl bg-white text-black hover:bg-gray-200 font-semibold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-60 transition shadow-lg shadow-white/10/30">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {step < STEPS.length - 1
                  ? (<>Next <ChevronRight className="w-4 h-4" /></>)
                  : (loading ? 'Registering...' : 'Register Business')}
              </button>
            </div>
          </form>
        </div>

        <p className="text-center text-[#94a3b8] mt-6 text-sm">
          Already have an account?{' '}
          <Link href="/login" className="text-[#D4D4D4] hover:text-[#60A5FA] font-medium transition">
            Sign in →
          </Link>
        </p>
      </div>
    </div>
  );
}
