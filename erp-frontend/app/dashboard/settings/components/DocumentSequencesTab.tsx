'use client';

import React, { useState } from 'react';
import { Save, Loader2, Info, FileText } from 'lucide-react';
import { businessApi } from '../../../../lib/erp-api';
import toast from 'react-hot-toast';

const DOC_TYPES = [
  { key: 'GST_INVOICE', label: 'GST Invoice', defaultFormat: 'INV-YYYY-SEQ' },
  { key: 'NON_GST_INVOICE', label: 'Non-GST Invoice', defaultFormat: 'NON-GST-YYYY-SEQ' },
  { key: 'QUOTATION', label: 'Quotation', defaultFormat: 'QTN-YYYY-SEQ' },
  { key: 'PROFORMA_INVOICE', label: 'Proforma Invoice (Estimate)', defaultFormat: 'EST-YYYY-SEQ' },
  { key: 'SALE_RETURN', label: 'Credit Note (Sale Return)', defaultFormat: 'CRN-YYYY-SEQ' },
  { key: 'PURCHASE_RETURN', label: 'Debit Note (Purchase Return)', defaultFormat: 'DBN-YYYY-SEQ' },
  { key: 'PURCHASE_ORDER', label: 'Purchase Order', defaultFormat: 'PO-YYYY-SEQ' },
];

export default function DocumentSequencesTab({ 
  initialSequences = {}
}: { 
  initialSequences?: Record<string, { format: string, nextNumber: number }>
}) {
  const [sequences, setSequences] = useState(() => {
    const state: any = {};
    DOC_TYPES.forEach(doc => {
      state[doc.key] = {
        format: initialSequences[doc.key]?.format || doc.defaultFormat,
        nextNumber: initialSequences[doc.key]?.nextNumber || 1,
      };
    });
    return state;
  });
  
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await businessApi.updateSequences({ sequences });
      toast.success('Document sequences updated successfully');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to update sequences');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (key: string, field: 'format' | 'nextNumber', value: any) => {
    setSequences((prev: any) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value
      }
    }));
  };

  const generatePreview = (format: string, nextNumber: number) => {
    const year = new Date().getFullYear();
    const nextYear = year + 1;
    const shortYear = year.toString().slice(-2);
    const shortNextYear = nextYear.toString().slice(-2);
    
    // FY format: 2023-24
    const fy = `${year}-${shortNextYear}`;
    
    let res = format;
    res = res.replace('YYYY', year.toString());
    res = res.replace('YY', shortYear);
    res = res.replace('FY', fy);
    res = res.replace('MM', (new Date().getMonth() + 1).toString().padStart(2, '0'));
    res = res.replace('DD', new Date().getDate().toString().padStart(2, '0'));
    res = res.replace('SEQ', nextNumber.toString().padStart(4, '0'));
    
    return res;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Document Sequences</h3>
          <p className="text-slate-500 text-sm mt-1">Configure custom numbering formats for all your documents</p>
        </div>
        <button 
          onClick={handleSave} 
          disabled={saving} 
          className="px-5 py-2.5 rounded-xl bg-action-500 text-white hover:bg-action-600 font-semibold text-sm hover:opacity-90 transition flex items-center gap-2 shadow-lg shadow-white/10/30 disabled:opacity-60"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Sequences
        </button>
      </div>

      <div className="glass rounded-2xl p-6 border border-blue-200 bg-blue-50/50 space-y-3">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-900 text-sm mb-1">Available Keywords for Formatting</h4>
            <p className="text-xs text-blue-800/80 mb-3 leading-relaxed">
              Use these exact keywords in your format string. They will be automatically replaced when a document is generated.
            </p>
            <div className="flex flex-wrap gap-2">
              <code className="px-2 py-1 bg-white rounded border border-blue-200 text-xs font-mono text-blue-700">YYYY - Current Year (e.g., 2024)</code>
              <code className="px-2 py-1 bg-white rounded border border-blue-200 text-xs font-mono text-blue-700">YY - Short Year (e.g., 24)</code>
              <code className="px-2 py-1 bg-white rounded border border-blue-200 text-xs font-mono text-blue-700">FY - Financial Year (e.g., 2024-25)</code>
              <code className="px-2 py-1 bg-white rounded border border-blue-200 text-xs font-mono text-blue-700">MM - Current Month (e.g., 05)</code>
              <code className="px-2 py-1 bg-white rounded border border-blue-200 text-xs font-mono text-blue-700">DD - Current Date (e.g., 14)</code>
              <code className="px-2 py-1 bg-white rounded border border-blue-200 text-xs font-mono text-blue-700 font-semibold">SEQ - 4-Digit Sequence (e.g., 0001)</code>
            </div>
            <p className="text-xs text-blue-800/80 mt-3 font-medium">
              Example: <code>INV/FY/SEQ</code> becomes <code>INV/2024-25/0001</code>
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {DOC_TYPES.map(doc => {
          const config = sequences[doc.key];
          const preview = generatePreview(config.format, config.nextNumber);
          
          return (
            <div key={doc.key} className="glass rounded-xl p-5 border border-slate-200 flex flex-col md:flex-row gap-6 items-start md:items-center">
              <div className="w-full md:w-1/3">
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="w-4 h-4 text-slate-500" />
                  <h4 className="font-semibold text-slate-900 text-sm">{doc.label}</h4>
                </div>
                <p className="text-xs text-slate-500 font-mono mt-2 bg-slate-100 p-2 rounded truncate" title="Live Preview">
                  Preview: <span className="font-semibold text-slate-700">{preview}</span>
                </p>
              </div>
              
              <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Format String</label>
                  <input 
                    type="text" 
                    value={config.format}
                    onChange={(e) => handleChange(doc.key, 'format', e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-action-500 text-sm font-mono transition"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Next Number</label>
                  <input 
                    type="number" 
                    min="1"
                    value={config.nextNumber}
                    onChange={(e) => handleChange(doc.key, 'nextNumber', parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-action-500 text-sm font-mono transition"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
