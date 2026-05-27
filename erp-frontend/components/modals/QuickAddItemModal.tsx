import React, { useState } from 'react';
import { X, Loader2, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { productsApi } from '../../../lib/erp-api';

const GST_RATES = [0, 5, 12, 18, 28];
const UNITS = ['Nos', 'Bags', 'Bale', 'Bundles', 'Buckles', 'Billion of units', 'Box', 'Bottles', 'Bunches', 'Cans', 'Cubic meters', 'Cubic centimeters', 'Centimeters', 'Cartons', 'Dozens', 'Drums', 'Feet', 'Grams', 'Gross', 'Gallons', 'Hours', 'Job', 'Kilograms', 'Kilometers', 'Liters', 'Meters', 'Metric ton', 'Milligrams', 'Milliliters', 'Numbers', 'Packs', 'Pieces', 'Pairs', 'Quintals', 'Rolls', 'Sets', 'Square feet', 'Square meters', 'Tablets', 'Ten gross', 'Thousands', 'Tons', 'Tubes', 'US gallons', 'Yards'];

const Input = ({ label, required = false, type = 'text', keyName, form, setForm, placeholder = '' }: any) => (
  <div>
    <label className="block text-[11px] font-medium text-[#94a3b8] mb-1 uppercase tracking-wider">{label} {required && <span className="text-red-500">*</span>}</label>
    <input type={type}
      value={form[keyName] === 0 && type === 'number' ? '' : form[keyName]}
      onChange={e => setForm({ ...form, [keyName]: type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value })}
      placeholder={placeholder}
      className="w-full px-3 py-2 rounded-lg bg-[#111111] border border-[#1A1A1A] text-white placeholder-[#475569] focus:outline-none focus:border-[#D4D4D4] text-sm transition" />
  </div>
);

const Select = ({ label, required = false, keyName, form, setForm, options }: any) => (
  <div>
    <label className="block text-[11px] font-medium text-[#94a3b8] mb-1 uppercase tracking-wider">{label} {required && <span className="text-red-500">*</span>}</label>
    <select value={form[keyName]} onChange={e => setForm({ ...form, [keyName]: e.target.value })}
      className="w-full px-3 py-2 rounded-lg bg-[#111111] border border-[#1A1A1A] text-white focus:outline-none focus:border-[#D4D4D4] text-sm transition appearance-none">
      {options.map((o: string) => <option key={o} value={o}>{o || 'Select...'}</option>)}
    </select>
  </div>
);

export default function QuickAddItemModal({ onClose, onAdded }: { onClose: () => void, onAdded: (product: any) => void }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '', type: 'product', hsnCode: '', unit: 'Nos',
    sellingPrice: 0, mrp: 0, gstRate: 18, currentStock: 0, location: '',
    purchasePrice: 0, reorderLevel: 5
  });

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Item name is required'); return; }
    if (!form.sellingPrice || form.sellingPrice <= 0) { toast.error('Selling Price must be greater than 0'); return; }
    
    setSaving(true);
    try {
      const payload = {
        ...form,
        openingStock: form.currentStock,
        conversionRate: 1
      };
      const { data } = await productsApi.create(payload);
      toast.success('Item created successfully!');
      onAdded(data.product || data);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to create item');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#050505] border border-[#1A1A1A] rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-5 border-b border-[#1A1A1A] shrink-0">
          <div>
            <h3 className="text-white font-bold text-lg">Quick Add Item</h3>
            <p className="text-xs text-[#94a3b8] mt-0.5">Add a new product to your inventory</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-[#111111] text-[#94a3b8] hover:text-white transition"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 p-5 overflow-y-auto bg-[#0A0A0A]">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
               <Select label="Type" keyName="type" options={['product', 'service']} form={form} setForm={setForm} />
            </div>
            <div className="col-span-2">
               <Input label="Item Name" keyName="name" required form={form} setForm={setForm} placeholder="e.g. Premium T-Shirt" />
            </div>
            <Select label="Unit" keyName="unit" options={UNITS} form={form} setForm={setForm} />
            <Input label="HSN Code" keyName="hsnCode" form={form} setForm={setForm} />
            <Input label="Selling Price" type="number" keyName="sellingPrice" required form={form} setForm={setForm} />
            <Input label="MRP" type="number" keyName="mrp" form={form} setForm={setForm} />
            <Select label="GST Rate (%)" keyName="gstRate" options={GST_RATES} form={form} setForm={setForm} />
            <Input label="Purchase Price" type="number" keyName="purchasePrice" form={form} setForm={setForm} />
            {form.type === 'product' && (
              <>
                <Input label="Opening Stock" type="number" keyName="currentStock" form={form} setForm={setForm} />
                <Input label="Location/Rack" keyName="location" form={form} setForm={setForm} />
              </>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-[#1A1A1A] bg-[#0A0A0A] shrink-0 flex justify-end gap-3 rounded-b-2xl">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl font-medium text-white hover:bg-[#1A1A1A] transition text-sm">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition disabled:opacity-50 text-sm">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Item
          </button>
        </div>
      </div>
    </div>
  );
}
