'use client';
import { useState, useEffect } from 'react';
import Topbar from '../../../../components/layout/Topbar';
import { businessApi } from '../../../../lib/erp-api';
import { Loader2, Save, X, Plus, Calendar, Edit3, Check } from 'lucide-react';
import toast from 'react-hot-toast';

interface Holiday {
  date: string; // ISO date string from backend
  name: string;
}

export default function HolidayMasterPage() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [newDate, setNewDate] = useState('');
  const [newName, setNewName] = useState('');
  
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editDateInput, setEditDateInput] = useState('');
  const [editNameInput, setEditNameInput] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await businessApi.getProfile();
        // Convert to YYYY-MM-DD for easier input handling
        const fetchedHolidays = (data.business?.holidays || []).map((h: any) => ({
          date: new Date(h.date).toISOString().split('T')[0],
          name: h.name
        }));
        
        // Sort by date
        fetchedHolidays.sort((a: Holiday, b: Holiday) => new Date(a.date).getTime() - new Date(b.date).getTime());
        setHolidays(fetchedHolidays);
      } catch (error) { 
        toast.error('Failed to load holidays'); 
      } finally { 
        setLoading(false); 
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      // Backend expects Date objects, string works fine
      await businessApi.updateProfile({ holidays });
      toast.success('Holidays saved successfully');
    } catch (error) {
      toast.error('Failed to save holidays');
    } finally {
      setSaving(false);
    }
  };

  const addHoliday = async () => {
    const trimmedName = newName.trim();
    if (!trimmedName || !newDate) {
      toast.error('Please enter both date and name');
      return;
    }
    if (holidays.some(h => h.date === newDate)) {
      toast.error('A holiday already exists on this date');
      return;
    }
    
    const newHolidays = [...holidays, { date: newDate, name: trimmedName }];
    newHolidays.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    setHolidays(newHolidays);
    setNewName('');
    setNewDate('');
    try {
      await businessApi.updateProfile({ holidays: newHolidays });
      toast.success(`Holiday "${trimmedName}" added & saved`);
    } catch {
      toast.error('Failed to save holiday');
    }
  };

  const removeHoliday = async (idx: number) => {
    const newHolidays = holidays.filter((_, i) => i !== idx);
    setHolidays(newHolidays);
    try {
      await businessApi.updateProfile({ holidays: newHolidays });
      toast.success('Holiday removed');
    } catch {
      toast.error('Failed to save');
    }
  };

  const startEdit = (idx: number, h: Holiday) => {
    setEditingIndex(idx);
    setEditDateInput(h.date);
    setEditNameInput(h.name);
  };

  const saveEdit = async () => {
    if (editingIndex === null) return;
    const trimmed = editNameInput.trim();
    if (!trimmed || !editDateInput) { setEditingIndex(null); return; }
    
    if (holidays.some((h, i) => i !== editingIndex && h.date === editDateInput)) {
      toast.error('A holiday already exists on this date');
      return;
    }
    
    const newHolidays = [...holidays];
    newHolidays[editingIndex] = { date: editDateInput, name: trimmed };
    newHolidays.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    setHolidays(newHolidays);
    setEditingIndex(null);
    try {
      await businessApi.updateProfile({ holidays: newHolidays });
      toast.success('Holiday updated successfully');
    } catch {
      toast.error('Failed to save updated holiday');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-screen bg-slate-50">
        <Topbar title="Holiday Master" />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      <Topbar title="Holiday Master" />
      <main className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="max-w-4xl mx-auto">
          
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                <Calendar className="w-8 h-8 text-amber-500" />
                Holiday Master
              </h2>
              <p className="text-slate-600 mt-2">Manage official business holidays</p>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2.5 bg-amber-600 text-slate-900 font-medium rounded-xl hover:bg-amber-700 transition flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6">
            <div className="flex flex-col md:flex-row gap-4 mb-6 bg-[#F1F5F9] p-4 rounded-xl border border-slate-300">
              <input 
                type="date"
                value={newDate}
                onChange={e => setNewDate(e.target.value)}
                className="bg-[#E2E8F0] border border-[#94A3B8] rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:border-amber-500 transition [color-scheme:dark]"
              />
              <input 
                type="text"
                placeholder="Holiday Name (e.g. Diwali, Christmas...)"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addHoliday()}
                className="flex-1 bg-[#E2E8F0] border border-[#94A3B8] rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:border-amber-500 transition"
              />
              <button 
                onClick={addHoliday}
                className="px-5 py-2.5 bg-amber-500 text-black font-bold rounded-xl hover:bg-amber-400 transition flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add Holiday
              </button>
            </div>

            <div className="space-y-3">
              {holidays.map((h, idx) => {
                const isEditing = editingIndex === idx;
                
                return (
                  <div key={idx} className="flex items-center justify-between p-4 rounded-xl bg-[#F1F5F9] border border-slate-200 group">
                    {isEditing ? (
                      <div className="flex items-center gap-3 w-full">
                        <input 
                          type="date"
                          value={editDateInput}
                          onChange={e => setEditDateInput(e.target.value)}
                          className="bg-[#E2E8F0] border border-amber-500 rounded px-3 py-1.5 text-slate-900 focus:outline-none [color-scheme:dark]"
                        />
                        <input 
                          autoFocus
                          value={editNameInput}
                          onChange={e => setEditNameInput(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') saveEdit(); else if (e.key === 'Escape') setEditingIndex(null); }}
                          className="bg-[#E2E8F0] border border-amber-500 rounded px-3 py-1.5 flex-1 text-slate-900 font-bold focus:outline-none"
                        />
                        <button onClick={saveEdit} className="p-2 text-green-400 hover:bg-green-400/10 rounded-lg"><Check className="w-5 h-5"/></button>
                        <button onClick={() => setEditingIndex(null)} className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg"><X className="w-5 h-5"/></button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-4">
                          <div className="bg-[#E2E8F0] border border-[#94A3B8] px-4 py-2 rounded-lg text-center min-w-[80px]">
                            <div className="text-xs text-slate-600 uppercase font-bold tracking-wider">{new Date(h.date).toLocaleDateString('en-US', { month: 'short' })}</div>
                            <div className="text-xl font-bold text-slate-900">{new Date(h.date).getDate()}</div>
                          </div>
                          <div>
                            <span className="text-lg font-bold text-slate-900 block">{h.name}</span>
                            <span className="text-sm text-slate-600">{new Date(h.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric' })}</span>
                          </div>
                        </div>
                        <div className="flex items-center opacity-0 group-hover:opacity-100 transition">
                          <button onClick={() => startEdit(idx, h)} className="p-2 text-slate-600 hover:text-amber-400 hover:bg-amber-500/10 rounded-xl mr-2 transition">
                            <Edit3 className="w-5 h-5" />
                          </button>
                          <button onClick={() => removeHoliday(idx)} className="p-2 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition">
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
              
              {holidays.length === 0 && (
                <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-xl text-slate-600">
                  <Calendar className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  No holidays added yet.
                </div>
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
