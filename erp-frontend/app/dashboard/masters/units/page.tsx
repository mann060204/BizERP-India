'use client';
import { useState, useEffect } from 'react';
import Topbar from '../../../../components/layout/Topbar';
import { businessApi } from '../../../../lib/erp-api';
import { Loader2, Save, X, Plus, Edit3, Check, Scale, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function UnitMasterPage() {
  const [units, setUnits] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [newUnit, setNewUnit] = useState('');
  
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editInput, setEditInput] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await businessApi.getProfile();
        setUnits(data.business?.units || []);
      } catch (error) { 
        toast.error('Failed to load units'); 
      } finally { 
        setLoading(false); 
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      await businessApi.updateProfile({ units });
      toast.success('Units saved successfully');
    } catch (error) {
      toast.error('Failed to save units');
    } finally {
      setSaving(false);
    }
  };

  const addUnit = async () => {
    const trimmed = newUnit.trim();
    if (!trimmed) return;
    if (units.some(u => u.toLowerCase() === trimmed.toLowerCase())) {
      toast.error('Unit already exists');
      return;
    }
    const updated = [...units, trimmed];
    setUnits(updated);
    setNewUnit('');
    try {
      await businessApi.updateProfile({ units: updated });
      toast.success(`Unit "${trimmed}" added & saved`);
    } catch { toast.error('Failed to save unit'); }
  };

  const removeUnit = async (idx: number) => {
    const updated = units.filter((_, i) => i !== idx);
    setUnits(updated);
    try {
      await businessApi.updateProfile({ units: updated });
      toast.success('Unit removed');
    } catch { toast.error('Failed to save'); }
  };

  const startEdit = (idx: number, name: string) => {
    setEditingIndex(idx);
    setEditInput(name);
  };

  const saveEdit = async () => {
    if (editingIndex === null) return;
    const trimmed = editInput.trim();
    if (!trimmed) { setEditingIndex(null); return; }
    
    if (units.some((u, i) => i !== editingIndex && u.toLowerCase() === trimmed.toLowerCase())) {
      toast.error('Unit already exists');
      return;
    }
    
    const newUnits = [...units];
    newUnits[editingIndex] = trimmed;
    setUnits(newUnits);
    setEditingIndex(null);
    try {
      await businessApi.updateProfile({ units: newUnits });
      toast.success('Unit updated successfully');
    } catch {
      toast.error('Failed to save updated unit');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-screen bg-slate-50">
        <Topbar title="Unit Master" />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-action-500 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      <Topbar title="Unit Master" />
      <main className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="max-w-4xl mx-auto">
          
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                <Scale className="w-8 h-8 text-action-500" />
                Unit Master
              </h2>
              <p className="text-slate-600 mt-2">Manage units of measurement for your items (Nos, Kg, Ltr, etc.)</p>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2.5 bg-action-500 text-white font-medium rounded-xl hover:bg-action-600 transition flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6">
            <div className="flex gap-4 mb-6">
              <input 
                type="text"
                placeholder="e.g. Box, Pcs, Mtr..."
                value={newUnit}
                onChange={e => setNewUnit(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addUnit()}
                className="flex-1 bg-[#F1F5F9] border border-slate-300 rounded-xl px-4 text-slate-900 focus:outline-none focus:border-action-400 transition"
              />
              <button 
                onClick={addUnit}
                className="px-5 py-2.5 bg-[#E2E8F0] text-slate-900 font-medium rounded-xl hover:bg-slate-100 border border-[#94A3B8] transition flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add Unit
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {units.map((unit, idx) => {
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
                          className="bg-[#E2E8F0] border border-action-400 rounded px-2 py-1 flex-1 text-slate-900 font-bold focus:outline-none"
                        />
                        <button onClick={saveEdit} className="p-1.5 text-green-400 hover:bg-green-400/10 rounded-lg"><Check className="w-4 h-4"/></button>
                        <button onClick={() => setEditingIndex(null)} className="p-1.5 text-red-400 hover:bg-red-400/10 rounded-lg"><X className="w-4 h-4"/></button>
                      </div>
                    ) : (
                      <>
                        <span className="font-bold text-slate-900">{unit}</span>
                        <div className="flex items-center opacity-0 group-hover:opacity-100 transition">
                          <button onClick={() => startEdit(idx, unit)} className="p-1.5 text-slate-600 hover:text-blue-400 hover:bg-action-500/10 rounded-lg mr-1 transition">
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button onClick={() => removeUnit(idx)} className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
              
              {units.length === 0 && (
                <div className="col-span-full py-8 text-center border-2 border-dashed border-slate-200 rounded-xl text-slate-600">
                  No units added yet. Add your first unit above.
                </div>
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
