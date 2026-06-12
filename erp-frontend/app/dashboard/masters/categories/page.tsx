'use client';
import { useState, useEffect } from 'react';
import Topbar from '../../../../components/layout/Topbar';
import { businessApi } from '../../../../lib/erp-api';
import { Loader2, Save, X, Plus, ChevronRight, Edit2, Check, Layers } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface Group {
  name: string;
  subGroups: string[];
}

interface Brand {
  name: string;
  groups: Group[];
}

interface Category {
  name: string;
  brands: Brand[];
}

export default function CategoryMasterPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Selection state
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  // New item inputs
  const [newCat, setNewCat] = useState('');
  const [newBrand, setNewBrand] = useState('');
  const [newGroup, setNewGroup] = useState('');
  const [newSubGroup, setNewSubGroup] = useState('');

  // Editing state
  const [editingPath, setEditingPath] = useState<{ type: string, oldName: string, catName?: string, brandName?: string, groupName?: string } | null>(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await businessApi.getProfile();
        const raw = data.business?.productCategories || [];
        setCategories(raw.map((c: any) => ({
          name: c.name,
          brands: (c.brands || []).map((b: any) => ({
            name: b.name,
            groups: (b.groups || []).map((g: any) => ({
              name: g.name,
              subGroups: g.subGroups || []
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
      toast.success('Taxonomy saved successfully');
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  // Add Handlers
  const addCategory = () => {
    const name = newCat.trim();
    if (!name) return;
    if (categories.some(c => c.name.toLowerCase() === name.toLowerCase())) {
      toast.error('Category already exists'); return;
    }
    setCategories([...categories, { name, brands: [] }]);
    setNewCat('');
    setSelectedCat(name);
    setSelectedBrand(null);
    setSelectedGroup(null);
  };

  const addBrand = () => {
    const name = newBrand.trim();
    if (!name || !selectedCat) return;
    setCategories(categories.map(c => {
      if (c.name === selectedCat) {
        if (c.brands.some(b => b.name.toLowerCase() === name.toLowerCase())) {
          toast.error('Brand already exists'); return c;
        }
        return { ...c, brands: [...c.brands, { name, groups: [] }] };
      }
      return c;
    }));
    setNewBrand('');
    setSelectedBrand(name);
    setSelectedGroup(null);
  };

  const addGroup = () => {
    const name = newGroup.trim();
    if (!name || !selectedCat || !selectedBrand) return;
    setCategories(categories.map(c => {
      if (c.name === selectedCat) {
        return { ...c, brands: c.brands.map(b => {
          if (b.name === selectedBrand) {
            if (b.groups.some(g => g.name.toLowerCase() === name.toLowerCase())) {
              toast.error('Group already exists'); return b;
            }
            return { ...b, groups: [...b.groups, { name, subGroups: [] }] };
          }
          return b;
        })};
      }
      return c;
    }));
    setNewGroup('');
    setSelectedGroup(name);
  };

  const addSubGroup = () => {
    const name = newSubGroup.trim();
    if (!name || !selectedCat || !selectedBrand || !selectedGroup) return;
    setCategories(categories.map(c => {
      if (c.name === selectedCat) {
        return { ...c, brands: c.brands.map(b => {
          if (b.name === selectedBrand) {
            return { ...b, groups: b.groups.map(g => {
              if (g.name === selectedGroup) {
                if (g.subGroups.some(sg => sg.toLowerCase() === name.toLowerCase())) {
                  toast.error('SubGroup already exists'); return g;
                }
                return { ...g, subGroups: [...g.subGroups, name] };
              }
              return g;
            })};
          }
          return b;
        })};
      }
      return c;
    }));
    setNewSubGroup('');
  };

  // Delete Handlers
  const deleteCategory = (name: string) => {
    setCategories(categories.filter(c => c.name !== name));
    if (selectedCat === name) { setSelectedCat(null); setSelectedBrand(null); setSelectedGroup(null); }
  };

  const deleteBrand = (cName: string, bName: string) => {
    setCategories(categories.map(c => c.name === cName ? { ...c, brands: c.brands.filter(b => b.name !== bName) } : c));
    if (selectedBrand === bName) { setSelectedBrand(null); setSelectedGroup(null); }
  };

  const deleteGroup = (cName: string, bName: string, gName: string) => {
    setCategories(categories.map(c => c.name === cName ? { ...c, brands: c.brands.map(b => b.name === bName ? { ...b, groups: b.groups.filter(g => g.name !== gName) } : b) } : c));
    if (selectedGroup === gName) { setSelectedGroup(null); }
  };

  const deleteSubGroup = (cName: string, bName: string, gName: string, sgName: string) => {
    setCategories(categories.map(c => c.name === cName ? { ...c, brands: c.brands.map(b => b.name === bName ? { ...b, groups: b.groups.map(g => g.name === gName ? { ...g, subGroups: g.subGroups.filter(sg => sg !== sgName) } : g) } : b) } : c));
  };

  // Edit Handlers
  const startEdit = (type: string, oldName: string, cName?: string, bName?: string, gName?: string) => {
    setEditingPath({ type, oldName, catName: cName, brandName: bName, groupName: gName });
    setEditValue(oldName);
  };

  const commitEdit = () => {
    if (!editingPath || !editValue.trim()) return;
    const { type, oldName, catName, brandName, groupName } = editingPath;
    const newN = editValue.trim();
    if (newN === oldName) { setEditingPath(null); return; }

    if (type === 'cat') {
      if (categories.some(c => c.name.toLowerCase() === newN.toLowerCase())) { toast.error('Name exists'); return; }
      setCategories(categories.map(c => c.name === oldName ? { ...c, name: newN } : c));
      if (selectedCat === oldName) setSelectedCat(newN);
    } else if (type === 'brand') {
      setCategories(categories.map(c => c.name === catName ? { ...c, brands: c.brands.map(b => b.name === oldName ? { ...b, name: newN } : b) } : c));
      if (selectedBrand === oldName) setSelectedBrand(newN);
    } else if (type === 'group') {
      setCategories(categories.map(c => c.name === catName ? { ...c, brands: c.brands.map(b => b.name === brandName ? { ...b, groups: b.groups.map(g => g.name === oldName ? { ...g, name: newN } : g) } : b) } : c));
      if (selectedGroup === oldName) setSelectedGroup(newN);
    } else if (type === 'subgroup') {
      setCategories(categories.map(c => c.name === catName ? { ...c, brands: c.brands.map(b => b.name === brandName ? { ...b, groups: b.groups.map(g => g.name === groupName ? { ...g, subGroups: g.subGroups.map(sg => sg === oldName ? newN : sg) } : g) } : b) } : c));
    }
    setEditingPath(null);
  };

  // Derived state
  const currentCatObj = categories.find(c => c.name === selectedCat);
  const currentBrandObj = currentCatObj?.brands.find(b => b.name === selectedBrand);
  const currentGroupObj = currentBrandObj?.groups.find(g => g.name === selectedGroup);

  const ListItem = ({ name, isSelected, onClick, onEdit, onDelete, isEditing, setEditValue, editValue, commitEdit }: any) => {
    return (
      <div 
        onClick={() => !isEditing && onClick()}
        className={`group flex items-center justify-between p-3 cursor-pointer border-b border-slate-100 transition-all ${isSelected ? 'bg-primary/5 border-l-2 border-l-primary' : 'hover:bg-slate-50 border-l-2 border-l-transparent'} `}
      >
        {isEditing ? (
          <div className="flex items-center gap-2 w-full">
            <input autoFocus value={editValue} onChange={e => setEditValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && commitEdit()} onBlur={commitEdit} className="flex-1 px-2 py-1 text-sm bg-white border border-primary rounded focus:outline-none" />
          </div>
        ) : (
          <>
            <span className={`text-sm font-medium truncate ${isSelected ? 'text-primary font-semibold' : 'text-slate-700'}`}>{name}</span>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
              <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="p-1 text-slate-400 hover:text-primary transition rounded"><Edit2 className="w-3.5 h-3.5" /></button>
              <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-1 text-slate-400 hover:text-red-500 transition rounded"><X className="w-4 h-4" /></button>
              <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-primary' : 'text-slate-300'}`} />
            </div>
          </>
        )}
      </div>
    );
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-slate-700 animate-spin" /></div>;

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar title="Category Master" />
      <main className="flex-1 p-6 space-y-6 w-full">
        <div className="flex items-center gap-4 text-sm font-medium text-slate-600 mb-4 max-w-7xl mx-auto">
          <Link href="/dashboard/masters" className="hover:text-slate-900 transition">Master Dashboard</Link>
          <span>/</span>
          <span className="text-slate-900">Taxonomy System</span>
        </div>

        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Layers className="w-4 h-4 text-primary" />
              </div>
              Taxonomy Structure
            </h2>
            <p className="text-slate-500 text-sm mt-1">Manage Categories, Brands, Groups, and SubGroups hierarchically.</p>
          </div>
          <button onClick={handleSave} disabled={saving} className="px-6 py-2.5 rounded-xl bg-primary text-white hover:bg-primary-hover font-semibold text-sm transition flex items-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-60">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Master
          </button>
        </div>

        {/* Miller Columns Container */}
        <div className="glass rounded-2xl border border-slate-200 overflow-hidden max-w-7xl mx-auto flex h-[600px] shadow-sm">
          
          {/* Column 1: Categories */}
          <div className="flex-1 flex flex-col border-r border-slate-200 bg-white min-w-[200px]">
            <div className="p-3 bg-slate-50 border-b border-slate-200 font-semibold text-slate-800 text-sm uppercase tracking-wider flex justify-between items-center">
              Category
              <span className="bg-slate-200 text-slate-600 text-[10px] px-2 py-0.5 rounded-full">{categories.length}</span>
            </div>
            <div className="p-2 border-b border-slate-100 bg-white">
              <div className="flex items-center bg-slate-50 rounded-lg border border-slate-200 overflow-hidden focus-within:border-primary transition">
                <input value={newCat} onChange={e => setNewCat(e.target.value)} onKeyDown={e => e.key === 'Enter' && addCategory()} placeholder="New Category..." className="w-full bg-transparent px-3 py-2 text-sm focus:outline-none" />
                <button onClick={addCategory} className="p-2 text-slate-400 hover:text-primary"><Plus className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
              {categories.map(c => (
                <ListItem 
                  key={c.name} name={c.name} isSelected={selectedCat === c.name} 
                  onClick={() => { setSelectedCat(c.name); setSelectedBrand(null); setSelectedGroup(null); }}
                  onEdit={() => startEdit('cat', c.name)} onDelete={() => deleteCategory(c.name)}
                  isEditing={editingPath?.type === 'cat' && editingPath.oldName === c.name}
                  setEditValue={setEditValue} editValue={editValue} commitEdit={commitEdit}
                />
              ))}
            </div>
          </div>

          {/* Column 2: Brands */}
          <div className="flex-1 flex flex-col border-r border-slate-200 bg-[#FAFAFA] min-w-[200px]">
            <div className="p-3 bg-slate-50 border-b border-slate-200 font-semibold text-slate-800 text-sm uppercase tracking-wider flex justify-between items-center">
              Brand
              {currentCatObj && <span className="bg-slate-200 text-slate-600 text-[10px] px-2 py-0.5 rounded-full">{currentCatObj.brands.length}</span>}
            </div>
            {selectedCat ? (
              <>
                <div className="p-2 border-b border-slate-100 bg-[#FAFAFA]">
                  <div className="flex items-center bg-white rounded-lg border border-slate-200 overflow-hidden focus-within:border-primary transition">
                    <input value={newBrand} onChange={e => setNewBrand(e.target.value)} onKeyDown={e => e.key === 'Enter' && addBrand()} placeholder={`New Brand in ${selectedCat}...`} className="w-full bg-transparent px-3 py-2 text-sm focus:outline-none" />
                    <button onClick={addBrand} className="p-2 text-slate-400 hover:text-primary"><Plus className="w-4 h-4" /></button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
                  {currentCatObj?.brands.map(b => (
                    <ListItem 
                      key={b.name} name={b.name} isSelected={selectedBrand === b.name} 
                      onClick={() => { setSelectedBrand(b.name); setSelectedGroup(null); }}
                      onEdit={() => startEdit('brand', b.name, selectedCat)} onDelete={() => deleteBrand(selectedCat, b.name)}
                      isEditing={editingPath?.type === 'brand' && editingPath.oldName === b.name && editingPath.catName === selectedCat}
                      setEditValue={setEditValue} editValue={editValue} commitEdit={commitEdit}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-400 text-xs text-center p-6">Select a category to view brands</div>
            )}
          </div>

          {/* Column 3: Groups */}
          <div className="flex-1 flex flex-col border-r border-slate-200 bg-[#F5F5F5] min-w-[200px]">
            <div className="p-3 bg-slate-50 border-b border-slate-200 font-semibold text-slate-800 text-sm uppercase tracking-wider flex justify-between items-center">
              Group
              {currentBrandObj && <span className="bg-slate-200 text-slate-600 text-[10px] px-2 py-0.5 rounded-full">{currentBrandObj.groups.length}</span>}
            </div>
            {selectedBrand ? (
              <>
                <div className="p-2 border-b border-slate-100 bg-[#F5F5F5]">
                  <div className="flex items-center bg-white rounded-lg border border-slate-200 overflow-hidden focus-within:border-primary transition">
                    <input value={newGroup} onChange={e => setNewGroup(e.target.value)} onKeyDown={e => e.key === 'Enter' && addGroup()} placeholder={`New Group in ${selectedBrand}...`} className="w-full bg-transparent px-3 py-2 text-sm focus:outline-none" />
                    <button onClick={addGroup} className="p-2 text-slate-400 hover:text-primary"><Plus className="w-4 h-4" /></button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
                  {currentBrandObj?.groups.map(g => (
                    <ListItem 
                      key={g.name} name={g.name} isSelected={selectedGroup === g.name} 
                      onClick={() => setSelectedGroup(g.name)}
                      onEdit={() => startEdit('group', g.name, selectedCat!, selectedBrand)} onDelete={() => deleteGroup(selectedCat!, selectedBrand, g.name)}
                      isEditing={editingPath?.type === 'group' && editingPath.oldName === g.name && editingPath.catName === selectedCat && editingPath.brandName === selectedBrand}
                      setEditValue={setEditValue} editValue={editValue} commitEdit={commitEdit}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-400 text-xs text-center p-6">Select a brand to view groups</div>
            )}
          </div>

          {/* Column 4: SubGroups */}
          <div className="flex-1 flex flex-col bg-[#F0F0F0] min-w-[200px]">
            <div className="p-3 bg-slate-50 border-b border-slate-200 font-semibold text-slate-800 text-sm uppercase tracking-wider flex justify-between items-center">
              SubGroup
              {currentGroupObj && <span className="bg-slate-200 text-slate-600 text-[10px] px-2 py-0.5 rounded-full">{currentGroupObj.subGroups.length}</span>}
            </div>
            {selectedGroup ? (
              <>
                <div className="p-2 border-b border-slate-100 bg-[#F0F0F0]">
                  <div className="flex items-center bg-white rounded-lg border border-slate-200 overflow-hidden focus-within:border-primary transition">
                    <input value={newSubGroup} onChange={e => setNewSubGroup(e.target.value)} onKeyDown={e => e.key === 'Enter' && addSubGroup()} placeholder={`New SubGroup in ${selectedGroup}...`} className="w-full bg-transparent px-3 py-2 text-sm focus:outline-none" />
                    <button onClick={addSubGroup} className="p-2 text-slate-400 hover:text-primary"><Plus className="w-4 h-4" /></button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
                  {currentGroupObj?.subGroups.map(sg => (
                    <ListItem 
                      key={sg} name={sg} isSelected={false} 
                      onClick={() => {}}
                      onEdit={() => startEdit('subgroup', sg, selectedCat!, selectedBrand!, selectedGroup)} onDelete={() => deleteSubGroup(selectedCat!, selectedBrand!, selectedGroup, sg)}
                      isEditing={editingPath?.type === 'subgroup' && editingPath.oldName === sg && editingPath.catName === selectedCat && editingPath.brandName === selectedBrand && editingPath.groupName === selectedGroup}
                      setEditValue={setEditValue} editValue={editValue} commitEdit={commitEdit}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-400 text-xs text-center p-6">Select a group to view subgroups</div>
            )}
          </div>

        </div>

      </main>
    </div>
  );
}
