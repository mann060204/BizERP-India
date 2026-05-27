import os
import re

with open('d:/ERP WEBSITE/erp-frontend/app/dashboard/masters/items/page.tsx', 'r', encoding='utf-8') as f:
    items_content = f.read()

imports = """import React, { useState, useEffect, useCallback } from 'react';
import { productsApi, businessApi } from '../../lib/erp-api';
import { X, Loader2, Save, Layers, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
"""

helpers_match = re.search(r'(const GST_RATES.*?)\nexport default function MastersPage', items_content, re.DOTALL)
helpers = helpers_match.group(1) if helpers_match else ''

component_start = """
export default function QuickAddItemModal({ onClose, onAdded }: { onClose: () => void; onAdded: (product: any) => void; }) {
"""

states = """
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [form, setForm] = useState<any>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [productGroups, setProductGroups] = useState<string[]>([]);
  const [productBrands, setProductBrands] = useState<string[]>([]);
  const [productCategories, setProductCategories] = useState<{name: string, brands: string[]}[]>([]);
"""

fetch_settings = """
  const fetchSettings = useCallback(async () => {
    try {
      const { data } = await businessApi.getProfile();
      setProductGroups(data.business?.productGroups || []);
      setProductBrands(data.business?.productBrands || []);
      setProductCategories(data.business?.productCategories || []);
    } catch (e) {
      console.error('Failed to load business settings', e);
    }
  }, []);

  useEffect(() => { 
    fetchSettings();
  }, [fetchSettings]);
"""

handle_save = """
  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Item name is required'); return; }
    if (!form.sellingPrice || form.sellingPrice <= 0) { toast.error('Sale Price 1 must be greater than 0'); return; }
    setSaving(true);
    try {
      const payload = { ...form, currentStock: form.openingStock };
      const { data } = await productsApi.create(payload);
      toast.success('Item saved');
      onAdded(data.product);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to save item');
    } finally {
      setSaving(false);
    }
  };
"""

jsx_match = re.search(r'\{/\* New Modern Dark Modal - Expanded Two-Column Layout \*/\}\s*\{showModal && \(\s*(<div className="fixed inset-0 z-40.*?)<div className="flex justify-end gap-3 p-5 border-t border-\[\#1A1A1A\] bg-\[\#0A0A0A\] shrink-0 rounded-b-2xl">', items_content, re.DOTALL)
jsx_head = jsx_match.group(1) if jsx_match else ''

jsx_tail_match = re.search(r'<div className="flex justify-end gap-3 p-5 border-t border-\[\#1A1A1A\] bg-\[\#0A0A0A\] shrink-0 rounded-b-2xl">(.*?)\)\}', items_content, re.DOTALL)
jsx_tail = '<div className="flex justify-end gap-3 p-5 border-t border-[#1A1A1A] bg-[#0A0A0A] shrink-0 rounded-b-2xl">' + (jsx_tail_match.group(1) if jsx_tail_match else '')

jsx = jsx_head + jsx_tail
jsx = jsx.replace('setShowModal(false)', 'onClose()')
jsx = jsx.replace('{editing ? \'Edit Item\' : \'Add New Item\'}', "'Add New Item'")
jsx = jsx.replace("{editing ? 'Update Item' : 'Create Item'}", "'Create Item'")

unit_jsx_match = re.search(r'(\{/\* Unit Settings Modal - Dark Theme \*/\}.*?\n      \)\})', items_content, re.DOTALL)
unit_jsx = unit_jsx_match.group(1) if unit_jsx_match else ''

final_code = imports + helpers + component_start + states + fetch_settings + handle_save + "  return (\n    <>\n" + jsx + "\n" + unit_jsx + "\n    </>\n  );\n}"

with open('d:/ERP WEBSITE/erp-frontend/components/modals/QuickAddItemModal.tsx', 'w', encoding='utf-8') as f:
    f.write(final_code)
