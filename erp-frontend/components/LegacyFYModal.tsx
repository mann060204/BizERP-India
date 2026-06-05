'use client';
import { useState, useEffect } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

export default function LegacyFYModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newFyName, setNewFyName] = useState('');

  useEffect(() => {
    const checkFY = async () => {
      try {
        const { data } = await api.get('/business');
        if (data && data.business?.financialYearLabel === 'FY Legacy') {
          setIsOpen(true);
        }
      } catch (e) {
        console.error('Failed to check FY', e);
      } finally {
        setLoading(false);
      }
    };
    
    // Only run this if we have a token
    if (localStorage.getItem('erp_token')) {
      checkFY();
    } else {
      setLoading(false);
    }
  }, []);

  const handleRename = async () => {
    if (!newFyName.trim()) {
      toast.error('Please enter a valid Financial Year name');
      return;
    }

    setSubmitting(true);
    try {
      await api.put('/business/financial-year/rename', {
        newFinancialYearLabel: newFyName
      });
      toast.success('Financial Year successfully renamed! All data shifted.');
      setIsOpen(false);
      window.location.reload();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to rename Financial Year');
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Legacy Financial Year Detected</h3>
              <p className="text-sm text-slate-500">Please shift to a new Financial Year</p>
            </div>
          </div>
          
          <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <p className="text-sm text-slate-700 leading-relaxed">
              We noticed your current financial year is labeled as <strong>"FY Legacy"</strong>. 
              To ensure proper accounting and record keeping, please provide a proper name for your current financial year. All your existing data will be shifted there automatically.
            </p>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">New Financial Year Name</label>
            <input
              type="text"
              value={newFyName}
              onChange={(e) => setNewFyName(e.target.value)}
              placeholder="e.g. FY 2024-25"
              className="w-full px-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-action-500 focus:ring-1 focus:ring-action-500 transition"
              autoFocus
            />
          </div>

          <button
            onClick={handleRename}
            disabled={submitting || !newFyName.trim()}
            className="w-full py-3 bg-action-600 hover:bg-action-700 text-white font-bold rounded-xl transition shadow-lg shadow-action-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Shift Data & Rename'}
          </button>
        </div>
      </div>
    </div>
  );
}
