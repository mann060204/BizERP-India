'use client';
import { useState, useEffect } from 'react';
import Topbar from '../../../../components/layout/Topbar';
import { businessApi } from '../../../../lib/erp-api';
import { Loader2, Save, X, Plus, Edit3, Check, HandCoins } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ExpenseMasterPage() {
  const [expenseCategories, setExpenseCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [newExpense, setNewExpense] = useState('');
  
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editInput, setEditInput] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await businessApi.getProfile();
        setExpenseCategories(data.business?.expenseCategories || []);
      } catch (error) { 
        toast.error('Failed to load expense categories'); 
      } finally { 
        setLoading(false); 
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      await businessApi.updateProfile({ expenseCategories });
      toast.success('Expense categories saved successfully');
    } catch (error) {
      toast.error('Failed to save expense categories');
    } finally {
      setSaving(false);
    }
  };

  const addExpense = () => {
    const trimmed = newExpense.trim();
    if (!trimmed) return;
    if (expenseCategories.some(u => u.toLowerCase() === trimmed.toLowerCase())) {
      toast.error('Expense category already exists');
      return;
    }
    setExpenseCategories([...expenseCategories, trimmed]);
    setNewExpense('');
  };

  const removeExpense = (idx: number) => {
    setExpenseCategories(expenseCategories.filter((_, i) => i !== idx));
  };

  const startEdit = (idx: number, name: string) => {
    setEditingIndex(idx);
    setEditInput(name);
  };

  const saveEdit = () => {
    if (editingIndex === null) return;
    const trimmed = editInput.trim();
    if (!trimmed) { setEditingIndex(null); return; }
    
    if (expenseCategories.some((u, i) => i !== editingIndex && u.toLowerCase() === trimmed.toLowerCase())) {
      toast.error('Expense category already exists');
      return;
    }
    
    const newExpenses = [...expenseCategories];
    newExpenses[editingIndex] = trimmed;
    setExpenseCategories(newExpenses);
    setEditingIndex(null);
  };

  if (loading) {
    return (
      <div className="flex flex-col h-screen bg-slate-50">
        <Topbar title="Expense Master" />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      <Topbar title="Expense Master" />
      <main className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="max-w-4xl mx-auto">
          
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                <HandCoins className="w-8 h-8 text-emerald-500" />
                Expense Master
              </h2>
              <p className="text-slate-600 mt-2">Manage categories for your business expenses (Rent, Salary, Travel, etc.)</p>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2.5 bg-emerald-600 text-slate-900 font-medium rounded-xl hover:bg-emerald-700 transition flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6">
            <div className="flex gap-4 mb-6">
              <input 
                type="text"
                placeholder="e.g. Electricity, Marketing, Office Supplies..."
                value={newExpense}
                onChange={e => setNewExpense(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addExpense()}
                className="flex-1 bg-[#F1F5F9] border border-slate-300 rounded-xl px-4 text-slate-900 focus:outline-none focus:border-emerald-500 transition"
              />
              <button 
                onClick={addExpense}
                className="px-5 py-2.5 bg-[#E2E8F0] text-slate-900 font-medium rounded-xl hover:bg-slate-100 border border-[#94A3B8] transition flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add Category
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {expenseCategories.map((expense, idx) => {
                const isEditing = editingIndex === idx;
                
                return (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-[#F1F5F9] border border-slate-200 group">
                    {isEditing ? (
                      <div className="flex items-center gap-2 w-full">
                        <input 
                          autoFocus
                          value={editInput}
                          onChange={e => setEditInput(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') saveEdit(); else if (e.key === 'Escape') setEditingIndex(null); }}
                          className="bg-[#E2E8F0] border border-emerald-500 rounded px-2 py-1 flex-1 text-slate-900 font-bold focus:outline-none"
                        />
                        <button onClick={saveEdit} className="p-1.5 text-green-400 hover:bg-green-400/10 rounded-lg"><Check className="w-4 h-4"/></button>
                        <button onClick={() => setEditingIndex(null)} className="p-1.5 text-red-400 hover:bg-red-400/10 rounded-lg"><X className="w-4 h-4"/></button>
                      </div>
                    ) : (
                      <>
                        <span className="font-bold text-slate-900">{expense}</span>
                        <div className="flex items-center opacity-0 group-hover:opacity-100 transition">
                          <button onClick={() => startEdit(idx, expense)} className="p-1.5 text-slate-600 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg mr-1 transition">
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button onClick={() => removeExpense(idx)} className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
              
              {expenseCategories.length === 0 && (
                <div className="col-span-full py-8 text-center border-2 border-dashed border-slate-200 rounded-xl text-slate-600">
                  No expense categories added yet. Add your first category above.
                </div>
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
