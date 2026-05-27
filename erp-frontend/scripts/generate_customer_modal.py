import os
import re

with open('d:/ERP WEBSITE/erp-frontend/app/dashboard/customers/new/page.tsx', 'r', encoding='utf-8') as f:
    cust_content = f.read()

imports = """import React, { useState, useRef, useEffect, useCallback } from 'react';
import { customersApi } from '../../lib/erp-api';
import { Upload, Camera, RefreshCw, X, Save, User as UserIcon, VideoOff } from 'lucide-react';
import toast from 'react-hot-toast';
"""

# Extract INDIAN_STATES
states_match = re.search(r'(const INDIAN_STATES =.*?)\nexport default', cust_content, re.DOTALL)
helpers = states_match.group(1) if states_match else ''

component_start = """
export default function QuickAddCustomerModal({ onClose, onAdded }: { onClose: () => void; onAdded: (customer: any) => void; }) {
"""

# Extract state from page.tsx
state_match = re.search(r'(  const \[saving, setSaving\] = useState\(false\);.*?  const handleSave = async \(\) => {)', cust_content, re.DOTALL)
states = state_match.group(1) if state_match else ''

handle_save = """
    if (!form.name.trim()) { toast.error('Full Name is required'); return; }
    if (!form.billingAddress.trim()) { toast.error('Billing Address is required'); return; }
    if (!form.state.trim()) { toast.error('State is required'); return; }
    if (!form.mobile.trim()) { toast.error('Contact No is required'); return; }

    setSaving(true);
    try {
      const payload = {
        name: form.name,
        billingAddress: { street: form.billingAddress, city: form.city, state: form.state, pinCode: form.pinCode, country: form.country },
        email: form.email,
        phoneNo: form.phoneNo,
        mobile: form.mobile,
        panNo: form.panNo,
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
        remark: form.remark,
        photo: photo || undefined,
      };
      const { data } = await customersApi.create(payload);
      toast.success('Customer Information Saved!');
      onAdded(data.customer);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to save customer');
    } finally {
      setSaving(false);
    }
  };
"""

# Now the JSX
# In the original file, it returns <div className="flex flex-col h-screen...
# We want to wrap it in a modal wrapper.
jsx_match = re.search(r'<main className="flex-1 overflow-y-auto p-4 bg-\[\#050505\]">(.*?)</main>', cust_content, re.DOTALL)
inner_jsx = jsx_match.group(1) if jsx_match else ''

# Replace save button logic to remove Save text if we want, or keep it.
# Replace <button onClick={() => router.push('/dashboard/customers')} with onClose()
# The original file has footer with Cancel and Save buttons
footer_match = re.search(r'<footer className="bg-\[\#0A0A0A\] border-t border-\[\#1A1A1A\] p-4 flex justify-end gap-4 shrink-0">(.*?)</footer>', cust_content, re.DOTALL)
footer_jsx = footer_match.group(1) if footer_match else ''
footer_jsx = footer_jsx.replace("router.push('/dashboard/customers')", "onClose()")
footer_jsx = footer_jsx.replace("Cancel", "Cancel")

modal_wrapper = """
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#050505] border border-[#1A1A1A] rounded-2xl w-full max-w-6xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-5 border-b border-[#1A1A1A] shrink-0 bg-[#0A0A0A] rounded-t-2xl">
          <div>
            <h3 className="text-white font-bold text-lg">Add New Customer</h3>
            <p className="text-xs text-[#94a3b8] mt-0.5">Fill in the customer details below</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-[#111111] text-[#94a3b8] hover:text-white transition"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex flex-1 overflow-y-auto p-4 bg-[#050505]">
          {/* Inner content from page.tsx */}
""" + inner_jsx + """
        </div>

        <div className="p-5 border-t border-[#1A1A1A] bg-[#0A0A0A] flex justify-end gap-3 rounded-b-2xl shrink-0">
""" + footer_jsx + """
        </div>
      </div>
    </div>
  );
}
"""

final_code = imports + helpers + component_start + states + handle_save + modal_wrapper

with open('d:/ERP WEBSITE/erp-frontend/components/modals/QuickAddCustomerModal.tsx', 'w', encoding='utf-8') as f:
    f.write(final_code)
