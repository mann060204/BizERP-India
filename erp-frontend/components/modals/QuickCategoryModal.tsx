import React, { useState } from 'react';
import { X, Loader2, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { businessApi } from '../../lib/erp-api';

export interface QuickCategoryModalProps {
  onClose: () => void;
  onSuccess: (newName: string) => void;
  mode: 'category' | 'brand' | 'group' | 'subgroup';
  parentContext: {
    category?: string;
    brand?: string;
    group?: string;
  };
}

export default function QuickCategoryModal({ onClose, onSuccess, mode, parentContext }: QuickCategoryModalProps) {
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  const getTitle = () => {
    switch (mode) {
      case 'category': return 'Add New Category';
      case 'brand': return `Add Brand to ${parentContext.category || 'Category'}`;
      case 'group': return `Add Group to ${parentContext.brand || 'Brand'}`;
      case 'subgroup': return `Add Subgroup to ${parentContext.group || 'Group'}`;
      default: return 'Add Item';
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }

    if (mode !== 'category' && !parentContext.category) {
      toast.error('Please select a Category first');
      return;
    }
    if ((mode === 'group' || mode === 'subgroup') && !parentContext.brand) {
      toast.error('Please select a Brand first');
      return;
    }
    if (mode === 'subgroup' && !parentContext.group) {
      toast.error('Please select a Group first');
      return;
    }

    setSaving(true);
    try {
      // 1. Fetch latest profile
      const { data } = await businessApi.getProfile();
      let categories = data.business?.productCategories || [];

      // Clean up legacy string arrays just in case, to prevent CastError
      categories = categories.map((c: any) => ({
        ...c,
        brands: (c.brands || []).map((b: any) => typeof b === 'string' ? { name: b, groups: [] } : b)
      }));

      // 2. Append to the correct level
      const catName = mode === 'category' ? name : parentContext.category!;
      let catIndex = categories.findIndex((c: any) => c.name === catName);

      if (catIndex === -1) {
        if (mode !== 'category') { toast.error('Category not found'); setSaving(false); return; }
        categories.push({ name: catName, brands: [] });
        catIndex = categories.length - 1;
      }

      const cat = categories[catIndex];

      if (mode === 'brand') {
        if (cat.brands.some((b: any) => b.name === name)) { toast.error('Brand already exists in this category'); setSaving(false); return; }
        cat.brands.push({ name, groups: [] });
      } else if (mode === 'group' || mode === 'subgroup') {
        const brandName = parentContext.brand!;
        let brandIndex = cat.brands.findIndex((b: any) => b.name === brandName);
        if (brandIndex === -1) { toast.error('Brand not found'); setSaving(false); return; }
        
        const brand = cat.brands[brandIndex];
        
        if (mode === 'group') {
          if (brand.groups.some((g: any) => g.name === name)) { toast.error('Group already exists in this brand'); setSaving(false); return; }
          brand.groups.push({ name, subGroups: [] });
        } else if (mode === 'subgroup') {
          const groupName = parentContext.group!;
          let groupIndex = brand.groups.findIndex((g: any) => g.name === groupName);
          if (groupIndex === -1) { toast.error('Group not found'); setSaving(false); return; }
          
          const group = brand.groups[groupIndex];
          if (!group.subGroups) group.subGroups = [];
          if (group.subGroups.includes(name)) { toast.error('Subgroup already exists'); setSaving(false); return; }
          group.subGroups.push(name);
        }
      }

      // 3. Save profile
      await businessApi.updateProfile({
        ...data.business,
        productCategories: categories
      });

      toast.success('Successfully added');
      onSuccess(name);
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-50/60 backdrop-blur-sm">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl flex flex-col overflow-hidden">
        
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-slate-900 font-bold text-base">{getTitle()}</h3>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6">
          <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wider">
            {mode} Name <span className="text-red-500">*</span>
          </label>
          <input 
            type="text" 
            autoFocus
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSave(); }}
            placeholder={`Enter ${mode} name`}
            className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition"
          />
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300 font-medium text-sm transition bg-white shadow-sm">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving} className="px-6 py-2.5 rounded-xl bg-primary text-white hover:bg-primary-hover font-semibold text-sm disabled:opacity-70 transition shadow-lg shadow-primary/20 flex items-center gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save {mode}
          </button>
        </div>

      </div>
    </div>
  );
}
