'use client';
import { useState, useEffect } from 'react';
import Topbar from '../../../../components/layout/Topbar';
import { businessApi } from '../../../../lib/erp-api';
import { Loader2, Save, X, Layers, Plus, Tag, ChevronDown, ChevronRight, Edit3, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface SubGroup {
  name: string;
  brands: string[];
}

interface Group {
  name: string;
  subGroups: SubGroup[];
}

interface Category {
  name: string;
  groups: Group[];
}

export default function CategoryMasterPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [expandedSubGroup, setExpandedSubGroup] = useState<string | null>(null);

  const [newCategoryName, setNewCategoryName] = useState('');
  const [newGroupInputs, setNewGroupInputs] = useState<Record<string, string>>({});
  const [newSubGroupInputs, setNewSubGroupInputs] = useState<Record<string, string>>({});
  const [newBrandInputs, setNewBrandInputs] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await businessApi.getProfile();
        // Convert old data to new format if needed, or just cast
        const raw = data.business?.productCategories || [];
        setCategories(raw.map((c: any) => ({
          name: c.name,
          groups: (c.groups || []).map((g: any) => ({
            name: g.name,
            subGroups: (g.subGroups || []).map((sg: any) => ({
              name: sg.name,
              brands: sg.brands || []
            }))
          }))
        })));
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

  // Add Level 1: Category
  const addCategory = () => {
    const name = newCategoryName.trim();
    if (name && !categories.some(c => c.name.toLowerCase() === name.toLowerCase())) {
      setCategories([...categories, { name, groups: [] }]);
      setNewCategoryName('');
      setExpandedCategory(name);
    } else if (name) {
      toast.error('Category already exists');
    }
  };

  const removeCategory = (catName: string) => {
    setCategories(categories.filter(c => c.name !== catName));
  };

  // Add Level 2: Group
  const addGroup = (catName: string) => {
    const groupName = (newGroupInputs[catName] || '').trim();
    if (!groupName) return;
    
    setCategories(categories.map(cat => {
      if (cat.name === catName) {
        if (!cat.groups.some(g => g.name.toLowerCase() === groupName.toLowerCase())) {
          return { ...cat, groups: [...cat.groups, { name: groupName, subGroups: [] }] };
        } else {
          toast.error('Group already exists in this category');
        }
      }
      return cat;
    }));
    setNewGroupInputs({ ...newGroupInputs, [catName]: '' });
    setExpandedGroup(`${catName}-${groupName}`);
  };

  const removeGroup = (catName: string, groupName: string) => {
    setCategories(categories.map(cat => {
      if (cat.name === catName) {
        return { ...cat, groups: cat.groups.filter(g => g.name !== groupName) };
      }
      return cat;
    }));
  };

  // Add Level 3: SubGroup
  const addSubGroup = (catName: string, groupName: string) => {
    const key = `${catName}-${groupName}`;
    const subGroupName = (newSubGroupInputs[key] || '').trim();
    if (!subGroupName) return;

    setCategories(categories.map(cat => {
      if (cat.name === catName) {
        return {
          ...cat,
          groups: cat.groups.map(g => {
            if (g.name === groupName) {
              if (!g.subGroups.some(sg => sg.name.toLowerCase() === subGroupName.toLowerCase())) {
                return { ...g, subGroups: [...g.subGroups, { name: subGroupName, brands: [] }] };
              } else {
                toast.error('SubGroup already exists');
              }
            }
            return g;
          })
        };
      }
      return cat;
    }));
    setNewSubGroupInputs({ ...newSubGroupInputs, [key]: '' });
    setExpandedSubGroup(`${catName}-${groupName}-${subGroupName}`);
  };

  const removeSubGroup = (catName: string, groupName: string, subGroupName: string) => {
    setCategories(categories.map(cat => {
      if (cat.name === catName) {
        return {
          ...cat,
          groups: cat.groups.map(g => {
            if (g.name === groupName) {
              return { ...g, subGroups: g.subGroups.filter(sg => sg.name !== subGroupName) };
            }
            return g;
          })
        };
      }
      return cat;
    }));
  };

  // Add Level 4: Brand
  const addBrand = (catName: string, groupName: string, subGroupName: string) => {
    const key = `${catName}-${groupName}-${subGroupName}`;
    const brandName = (newBrandInputs[key] || '').trim();
    if (!brandName) return;

    setCategories(categories.map(cat => {
      if (cat.name === catName) {
        return {
          ...cat,
          groups: cat.groups.map(g => {
            if (g.name === groupName) {
              return {
                ...g,
                subGroups: g.subGroups.map(sg => {
                  if (sg.name === subGroupName) {
                    if (!sg.brands.some(b => b.toLowerCase() === brandName.toLowerCase())) {
                      return { ...sg, brands: [...sg.brands, brandName] };
                    } else {
                      toast.error('Brand already exists in this SubGroup');
                    }
                  }
                  return sg;
                })
              };
            }
            return g;
          })
        };
      }
      return cat;
    }));
    setNewBrandInputs({ ...newBrandInputs, [key]: '' });
  };

  const removeBrand = (catName: string, groupName: string, subGroupName: string, brandName: string) => {
    setCategories(categories.map(cat => {
      if (cat.name === catName) {
        return {
          ...cat,
          groups: cat.groups.map(g => {
            if (g.name === groupName) {
              return {
                ...g,
                subGroups: g.subGroups.map(sg => {
                  if (sg.name === subGroupName) {
                    return { ...sg, brands: sg.brands.filter(b => b !== brandName) };
                  }
                  return sg;
                })
              };
            }
            return g;
          })
        };
      }
      return cat;
    }));
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-slate-700 animate-spin" /></div>;

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar title="Category Master" />
      <main className="flex-1 p-6 space-y-6 max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-4 text-sm font-medium text-slate-600 mb-4">
          <Link href="/dashboard/masters" className="hover:text-slate-900 transition">Master Dashboard</Link>
          <span>/</span>
          <span className="text-slate-900">Category Master</span>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Product Categories (4-Level)</h2>
            <p className="text-slate-600 text-sm mt-0.5">Define your taxonomy: Category &gt; Group &gt; SubGroup &gt; Brand</p>
          </div>
          <button onClick={handleSave} disabled={saving} className="px-5 py-2.5 rounded-xl bg-primary text-white hover:bg-primary-hover font-semibold text-sm hover:opacity-90 transition flex items-center gap-2 shadow-lg shadow-white/10/30 disabled:opacity-60">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Changes
          </button>
        </div>

        <div className="glass rounded-2xl p-6 border border-slate-200 space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Layers className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Categories</h3>
              <p className="text-slate-600 text-xs mt-0.5">Create top-level categories (e.g. Electronics, Furniture)</p>
            </div>
          </div>

          <div className="flex gap-2 max-w-md">
            <input value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCategory(); } }} 
              className="flex-1 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-[#D4D4D4] text-sm transition" placeholder="Add new category..." />
            <button type="button" onClick={addCategory} className="px-4 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-semibold transition flex items-center justify-center shadow-lg shadow-primary/20"><Plus className="w-5 h-5" /></button>
          </div>

          <div className="space-y-4 pt-4">
            {categories.length === 0 && (
              <div className="text-center p-8 border border-dashed border-slate-300 rounded-xl text-slate-600">
                No categories defined yet. Create a category to get started.
              </div>
            )}
            
            {categories.map((cat) => {
              const isCatExpanded = expandedCategory === cat.name;
              
              return (
                <div key={cat.name} className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                  {/* Category Header */}
                  <div 
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition group"
                    onClick={() => setExpandedCategory(isCatExpanded ? null : cat.name)}
                  >
                    <div className="flex items-center gap-3">
                      {isCatExpanded ? <ChevronDown className="w-5 h-5 text-slate-600" /> : <ChevronRight className="w-5 h-5 text-slate-600" />}
                      <span className="font-bold text-slate-900 text-lg">{cat.name}</span>
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{cat.groups.length} Groups</span>
                    </div>
                    <div className="flex items-center opacity-0 group-hover:opacity-100 transition">
                      <button onClick={(e) => { e.stopPropagation(); removeCategory(cat.name); }} className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition" title="Delete Category">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Level 2: Groups */}
                  {isCatExpanded && (
                    <div className="p-4 pt-0 border-t border-slate-200 bg-slate-50">
                      
                      <div className="mt-3 mb-4 flex gap-2 max-w-sm">
                        <input 
                          value={newGroupInputs[cat.name] || ''} 
                          onChange={e => setNewGroupInputs({...newGroupInputs, [cat.name]: e.target.value})} 
                          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addGroup(cat.name); } }} 
                          className="flex-1 px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-primary text-sm transition" 
                          placeholder={`Add group to ${cat.name}...`} 
                        />
                        <button type="button" onClick={() => addGroup(cat.name)} className="px-3 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-900 rounded-lg text-sm font-semibold transition">Add Group</button>
                      </div>

                      <div className="space-y-3 pl-4 border-l-2 border-slate-200 ml-2">
                        {cat.groups.map(group => {
                          const groupKey = `${cat.name}-${group.name}`;
                          const isGrpExpanded = expandedGroup === groupKey;
                          
                          return (
                            <div key={groupKey} className="border border-slate-200 rounded-lg bg-white shadow-sm overflow-hidden">
                              {/* Group Header */}
                              <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-slate-50 transition group/grp"
                                onClick={() => setExpandedGroup(isGrpExpanded ? null : groupKey)}>
                                <div className="flex items-center gap-2">
                                  {isGrpExpanded ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
                                  <span className="font-semibold text-slate-800 text-base">{group.name}</span>
                                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">{group.subGroups.length} SubGroups</span>
                                </div>
                                <button onClick={(e) => { e.stopPropagation(); removeGroup(cat.name, group.name); }} className="p-1 opacity-0 group-hover/grp:opacity-100 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded transition">
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              {/* Level 3: SubGroups */}
                              {isGrpExpanded && (
                                <div className="p-3 pt-0 border-t border-slate-100 bg-slate-50/50">
                                  <div className="mt-2 mb-3 flex gap-2 max-w-xs">
                                    <input 
                                      value={newSubGroupInputs[groupKey] || ''} 
                                      onChange={e => setNewSubGroupInputs({...newSubGroupInputs, [groupKey]: e.target.value})} 
                                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSubGroup(cat.name, group.name); } }} 
                                      className="flex-1 px-2.5 py-1.5 rounded bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-primary text-xs transition" 
                                      placeholder={`Add subgroup...`} 
                                    />
                                    <button type="button" onClick={() => addSubGroup(cat.name, group.name)} className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded text-xs font-semibold transition">Add</button>
                                  </div>

                                  <div className="space-y-2 pl-3 border-l-2 border-slate-200 ml-1">
                                    {group.subGroups.map(subGroup => {
                                      const sgKey = `${groupKey}-${subGroup.name}`;
                                      const isSgExpanded = expandedSubGroup === sgKey;

                                      return (
                                        <div key={sgKey} className="border border-slate-200 rounded-md bg-white">
                                          {/* SubGroup Header */}
                                          <div className="flex items-center justify-between p-2 cursor-pointer hover:bg-slate-50 transition group/sg"
                                            onClick={() => setExpandedSubGroup(isSgExpanded ? null : sgKey)}>
                                            <div className="flex items-center gap-1.5">
                                              {isSgExpanded ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                                              <span className="font-medium text-slate-700 text-sm">{subGroup.name}</span>
                                              <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 rounded">{subGroup.brands.length} Brands</span>
                                            </div>
                                            <button onClick={(e) => { e.stopPropagation(); removeSubGroup(cat.name, group.name, subGroup.name); }} className="p-0.5 opacity-0 group-hover/sg:opacity-100 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded transition">
                                              <X className="w-3 h-3" />
                                            </button>
                                          </div>

                                          {/* Level 4: Brands */}
                                          {isSgExpanded && (
                                            <div className="p-2 pt-0 border-t border-slate-100 bg-white">
                                              <div className="flex flex-wrap gap-1.5 mb-2 mt-2">
                                                {subGroup.brands.map((brand, idx) => (
                                                  <div key={idx} className="flex items-center gap-1 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-xs text-slate-700 group/brand">
                                                    <span>{brand}</span>
                                                    <button onClick={() => removeBrand(cat.name, group.name, subGroup.name, brand)} className="text-slate-400 hover:text-red-500">
                                                      <X className="w-3 h-3" />
                                                    </button>
                                                  </div>
                                                ))}
                                                {subGroup.brands.length === 0 && <span className="text-[10px] text-slate-400 italic">No brands</span>}
                                              </div>
                                              <div className="flex gap-1 max-w-[200px]">
                                                <input 
                                                  value={newBrandInputs[sgKey] || ''} 
                                                  onChange={e => setNewBrandInputs({...newBrandInputs, [sgKey]: e.target.value})} 
                                                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addBrand(cat.name, group.name, subGroup.name); } }} 
                                                  className="flex-1 px-2 py-1 rounded bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none text-[10px]" 
                                                  placeholder={`Add brand...`} 
                                                />
                                                <button type="button" onClick={() => addBrand(cat.name, group.name, subGroup.name)} className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-[10px] font-semibold">Add</button>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                    {group.subGroups.length === 0 && <div className="text-xs text-slate-400 italic py-1">No subgroups added.</div>}
                                  </div>

                                </div>
                              )}
                            </div>
                          );
                        })}
                        {cat.groups.length === 0 && <div className="text-sm text-slate-400 italic py-2">No groups added.</div>}
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
