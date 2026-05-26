'use client';
import { useState, useEffect } from 'react';
import Topbar from '../../../../components/layout/Topbar';
import { businessApi } from '../../../../lib/erp-api';
import { Loader2, Save, X, Layers, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function GroupMasterPage() {
  const [groups, setGroups] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newItem, setNewItem] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await businessApi.getProfile();
        setGroups(data.business?.productGroups || []);
      } catch { toast.error('Failed to load groups'); }
      finally { setLoading(false); }
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await businessApi.getProfile();
      await businessApi.updateProfile({
        ...data.business,
        productGroups: groups
      });
      toast.success('Groups updated successfully');
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed to update groups'); }
    finally { setSaving(false); }
  };

  const addGroup = () => {
    if (newItem.trim() && !groups.includes(newItem.trim())) {
      setGroups([...groups, newItem.trim()]);
      setNewItem('');
    }
  };

  const removeGroup = (idxToRemove: number) => {
    setGroups(groups.filter((_, idx) => idx !== idxToRemove));
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-[#D4D4D4] animate-spin" /></div>;

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar title="Group Master" />
      <main className="flex-1 p-6 space-y-6 max-w-4xl mx-auto w-full">
        <div className="flex items-center gap-4 text-sm font-medium text-[#475569] mb-4">
          <Link href="/dashboard/masters" className="hover:text-white transition">Master Dashboard</Link>
          <span>/</span>
          <span className="text-white">Group Master</span>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Group Master</h2>
            <p className="text-[#94a3b8] text-sm mt-0.5">Manage all your product categories and groups</p>
          </div>
          <button onClick={handleSave} disabled={saving} className="px-5 py-2.5 rounded-xl bg-white text-black hover:bg-gray-200 font-semibold text-sm hover:opacity-90 transition flex items-center gap-2 shadow-lg shadow-white/10/30 disabled:opacity-60">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Changes
          </button>
        </div>

        <div className="glass rounded-2xl p-6 border border-[#1A1A1A] space-y-6">
          <div className="flex items-center gap-3 border-b border-[#1A1A1A] pb-4">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Layers className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Custom Groups</h3>
              <p className="text-[#94a3b8] text-xs mt-0.5">These will appear in the item creation dropdown</p>
            </div>
          </div>

          <div className="max-w-md">
            <label className="block text-xs font-medium text-[#94a3b8] mb-2 uppercase tracking-wider">Add New Group</label>
            <div className="flex gap-2">
              <input value={newItem} onChange={e => setNewItem(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addGroup(); } }} 
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#0A0A0A] border border-[#1A1A1A] text-white focus:outline-none focus:border-[#D4D4D4] text-sm transition" placeholder="e.g. Electronics, Medicine, Apparel..." />
              <button type="button" onClick={addGroup} className="px-4 py-2.5 bg-[#111111] border border-[#1A1A1A] hover:bg-[#1A1A1A] text-white rounded-xl text-sm font-semibold transition flex items-center justify-center"><Plus className="w-5 h-5" /></button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#94a3b8] mb-3 uppercase tracking-wider">Active Groups ({groups.length})</label>
            <div className="flex flex-wrap gap-3">
              {groups.map((item, i) => (
                <div key={i} className="px-3 py-2 bg-[#0A0A0A] border border-[#1A1A1A] hover:border-[#333333] transition rounded-lg text-sm text-white flex items-center gap-3 shadow-sm group">
                  <span className="font-medium">{item}</span>
                  <button type="button" onClick={() => removeGroup(i)} className="text-[#475569] group-hover:text-red-400 p-0.5 rounded-md hover:bg-red-900/20 transition"><X className="w-3.5 h-3.5" /></button>
                </div>
              ))}
              {groups.length === 0 && <span className="text-[#475569] text-sm italic p-4 bg-[#0A0A0A] border border-[#1A1A1A] rounded-xl w-full text-center">No groups added yet.</span>}
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
