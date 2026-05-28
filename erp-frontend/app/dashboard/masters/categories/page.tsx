'use client';
import { useState, useEffect } from 'react';
import Topbar from '../../../../components/layout/Topbar';
import { businessApi } from '../../../../lib/erp-api';
import { Loader2, Save, X, Layers, Plus, Tag, ChevronDown, ChevronRight, Edit3, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface Category {
  name: string;
  brands: string[];
}

export default function CategoryMasterPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  
  const [newGroup, setNewGroup] = useState('');
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [newBrandInputs, setNewBrandInputs] = useState<Record<string, string>>({});
  
  const [editingGroup, setEditingGroup] = useState<string | null>(null);
  const [editGroupInput, setEditGroupInput] = useState('');
  
  const [editingBrand, setEditingBrand] = useState<{group: string, idx: number} | null>(null);
  const [editBrandInput, setEditBrandInput] = useState('');


  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await businessApi.getProfile();
        setCategories(data.business?.productCategories || []);
      } catch { toast.error('Failed to load categories'); }
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
        productCategories: categories
      });
      toast.success('Categories updated successfully');
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed to update categories'); }
    finally { setSaving(false); }
  };

  const addGroup = () => {
    const name = newGroup.trim();
    if (name && !categories.some(c => c.name.toLowerCase() === name.toLowerCase())) {
      setCategories([...categories, { name, brands: [] }]);
      setNewGroup('');
      setExpandedGroup(name);
    } else if (name) {
      toast.error('Group already exists');
    }
  };

  const removeGroup = (groupName: string) => {
    setCategories(categories.filter(c => c.name !== groupName));
  };

  const addBrand = (groupName: string) => {
    const brandName = (newBrandInputs[groupName] || '').trim();
    if (!brandName) return;

    setCategories(categories.map(cat => {
      if (cat.name === groupName) {
        if (!cat.brands.some(b => b.toLowerCase() === brandName.toLowerCase())) {
          return { ...cat, brands: [...cat.brands, brandName] };
        } else {
          toast.error('Brand already exists in this group');
        }
      }
      return cat;
    }));
    setNewBrandInputs({ ...newBrandInputs, [groupName]: '' });
  };

  const removeBrand = (groupName: string, brandIdx: number) => {
    setCategories(categories.map(cat => {
      if (cat.name === groupName) {
        return { ...cat, brands: cat.brands.filter((_, idx) => idx !== brandIdx) };
      }
      return cat;
    }));
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-[#D4D4D4] animate-spin" /></div>;

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar title="Category Master" />
      <main className="flex-1 p-6 space-y-6 max-w-4xl mx-auto w-full">
        <div className="flex items-center gap-4 text-sm font-medium text-[#475569] mb-4">
          <Link href="/dashboard/masters" className="hover:text-[#0F172A] transition">Master Dashboard</Link>
          <span>/</span>
          <span className="text-[#0F172A]">Category Master</span>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#0F172A]">Category & Brand Master</h2>
            <p className="text-[#94a3b8] text-sm mt-0.5">Define your product groups and assign specific brands to them.</p>
          </div>
          <button onClick={handleSave} disabled={saving} className="px-5 py-2.5 rounded-xl bg-white text-black hover:bg-gray-200 font-semibold text-sm hover:opacity-90 transition flex items-center gap-2 shadow-lg shadow-white/10/30 disabled:opacity-60">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Changes
          </button>
        </div>

        <div className="glass rounded-2xl p-6 border border-[#1A1A1A] space-y-6">
          
          <div className="flex items-center gap-3 border-b border-[#1A1A1A] pb-4">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
              <Layers className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="font-semibold text-[#0F172A]">Product Groups</h3>
              <p className="text-[#94a3b8] text-xs mt-0.5">Create top-level groups (e.g. T-Shirts, Electronics)</p>
            </div>
          </div>

          <div className="flex gap-2 max-w-md">
            <input value={newGroup} onChange={e => setNewGroup(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addGroup(); } }} 
              className="flex-1 px-4 py-2.5 rounded-xl bg-[#0A0A0A] border border-[#1A1A1A] text-[#0F172A] focus:outline-none focus:border-[#D4D4D4] text-sm transition" placeholder="Add new group (e.g. T-Shirts)..." />
            <button type="button" onClick={addGroup} className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-[#0F172A] rounded-xl text-sm font-semibold transition flex items-center justify-center shadow-lg shadow-indigo-600/20"><Plus className="w-5 h-5" /></button>
          </div>

          <div className="space-y-4 pt-4">
            {categories.length === 0 && (
              <div className="text-center p-8 border border-dashed border-[#262626] rounded-xl text-[#64748b]">
                No categories defined yet. Create a group to get started.
              </div>
            )}
            
            {categories.map((cat) => {
              const isExpanded = expandedGroup === cat.name;
              
              return (
                <div key={cat.name} className="border border-[#1A1A1A] rounded-xl overflow-hidden bg-[#0A0A0A]">
                  {/* Group Header */}
                  <div 
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-[#111111] transition group"
                    onClick={() => { if (!editingGroup) setExpandedGroup(isExpanded ? null : cat.name); }}
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? <ChevronDown className="w-5 h-5 text-[#64748b]" /> : <ChevronRight className="w-5 h-5 text-[#64748b]" />}
                      
                      {editingGroup === cat.name ? (
                        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                          <input 
                            autoFocus
                            value={editGroupInput} 
                            onChange={e => setEditGroupInput(e.target.value)} 
                            onKeyDown={e => { if (e.key === 'Enter') saveGroupEdit(cat.name, e); else if (e.key === 'Escape') setEditingGroup(null); }}
                            className="bg-[#1A1A1A] border border-indigo-500 rounded px-2 py-1 text-[#0F172A] text-lg font-bold focus:outline-none"
                          />
                          <button onClick={(e) => saveGroupEdit(cat.name, e)} className="p-1 text-green-400 hover:bg-green-400/10 rounded"><Check className="w-4 h-4"/></button>
                          <button onClick={() => setEditingGroup(null)} className="p-1 text-red-400 hover:bg-red-400/10 rounded"><X className="w-4 h-4"/></button>
                        </div>
                      ) : (
                        <>
                          <span className="font-bold text-[#0F172A] text-lg">{cat.name}</span>
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[#1A1A1A] text-[#94a3b8]">{cat.brands.length} Brands</span>
                        </>
                      )}
                    </div>
                    
                    {!editingGroup && (
                      <div className="flex items-center opacity-0 group-hover:opacity-100 transition">
                        <button 
                          onClick={(e) => startEditGroup(cat.name, e)} 
                          className="p-1.5 text-[#64748b] hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition mr-1"
                          title="Edit Group"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); removeGroup(cat.name); }} 
                          className="p-1.5 text-[#64748b] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                          title="Delete Group"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Brands List (Nested) */}
                  {isExpanded && (
                    <div className="p-4 pt-0 border-t border-[#1A1A1A] bg-[#050505]">
                      <div className="mt-4 mb-3 flex items-center gap-2">
                        <Tag className="w-4 h-4 text-[#94a3b8]" />
                        <span className="text-xs font-semibold uppercase tracking-wider text-[#94a3b8]">Connected Brands</span>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mb-4">
                        {cat.brands.map((brand, idx) => {
                              const isEditing = editingBrand?.group === cat.name && editingBrand?.idx === idx;
                              return (
                                <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-[#111111] border border-[#1A1A1A] group">
                                  {isEditing ? (
                                    <div className="flex items-center gap-2 w-full">
                                      <input 
                                        autoFocus
                                        value={editBrandInput}
                                        onChange={e => setEditBrandInput(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter') saveBrandEdit(); else if (e.key === 'Escape') setEditingBrand(null); }}
                                        className="bg-[#1A1A1A] border border-indigo-500 rounded px-2 py-1 flex-1 text-sm text-[#0F172A] focus:outline-none"
                                      />
                                      <button onClick={saveBrandEdit} className="p-1 text-green-400 hover:bg-green-400/10 rounded"><Check className="w-3.5 h-3.5"/></button>
                                      <button onClick={() => setEditingBrand(null)} className="p-1 text-red-400 hover:bg-red-400/10 rounded"><X className="w-3.5 h-3.5"/></button>
                                    </div>
                                  ) : (
                                    <>
                                      <span className="text-sm font-medium text-[#D4D4D4]">{brand}</span>
                                      <div className="flex items-center opacity-0 group-hover:opacity-100 transition">
                                        <button onClick={() => startEditBrand(cat.name, idx, brand)} className="p-1 text-[#64748b] hover:text-indigo-400 hover:bg-indigo-500/10 rounded mr-1">
                                          <Edit3 className="w-3.5 h-3.5" />
                                        </button>
                                        <button onClick={() => removeBrand(cat.name, idx)} className="p-1 text-[#64748b] hover:text-red-400 hover:bg-red-500/10 rounded">
                                          <X className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </>
                                  )}
                                </div>
                              );
                            })}
                        {cat.brands.length === 0 && (
                          <span className="text-sm text-[#475569] italic">No brands assigned to {cat.name}.</span>
                        )}
                      </div>

                      <div className="flex gap-2 max-w-sm">
                        <input 
                          value={newBrandInputs[cat.name] || ''} 
                          onChange={e => setNewBrandInputs({...newBrandInputs, [cat.name]: e.target.value})} 
                          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addBrand(cat.name); } }} 
                          className="flex-1 px-3 py-2 rounded-lg bg-[#0F0F0F] border border-[#262626] text-[#0F172A] focus:outline-none focus:border-indigo-500 text-xs transition" 
                          placeholder={`Add brand to ${cat.name} (e.g. ZARA)...`} 
                        />
                        <button type="button" onClick={() => addBrand(cat.name)} className="px-3 py-2 bg-[#1A1A1A] hover:bg-[#262626] text-[#0F172A] rounded-lg text-xs font-semibold transition">Add Brand</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </main>
    </div>
  );
}
