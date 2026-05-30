import React, { useState, useEffect, useCallback } from 'react';
import { productsApi, businessApi } from '../../lib/erp-api';
import { X, Loader2, Save, Layers, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
const GST_RATES = [0, 5, 12, 18, 28];
const UNITS = ['Nos', 'Bags', 'Bale', 'Bundles', 'Buckles', 'Billion of units', 'Box', 'Bottles', 'Bunches', 'Cans', 'Cubic meters', 'Cubic centimeters', 'Centimeters', 'Cartons', 'Dozens', 'Drums', 'Feet', 'Grams', 'Gross', 'Gallons', 'Hours', 'Job', 'Kilograms', 'Kilometers', 'Liters', 'Meters', 'Metric ton', 'Milligrams', 'Milliliters', 'Numbers', 'Packs', 'Pieces', 'Pairs', 'Quintals', 'Rolls', 'Sets', 'Square feet', 'Square meters', 'Tablets', 'Ten gross', 'Thousands', 'Tons', 'Tubes', 'US gallons', 'Yards'];

const emptyForm = {
  name: '', printName: '', group: '', brand: '', type: 'product', sku: '', hsnCode: '',
  category: '', unit: 'Nos', secondaryUnit: '', conversionRate: 1,
  purchasePrice: 0, sellingPrice: 0, sellingPrice2: 0, sellingPrice3: 0, minSalePrice: 0, mrp: 0,
  openingStock: 0, openingStockValue: 0, reorderLevel: 5, lowLevelLimit: 0,
  gstRate: 18, cessRate: 0, igstRate: 0, saleDiscount: 0, saleDiscountType: 'percentage',
  location: '', batchNo: '', description: '', productType: 'General',
  printDescription: false, printBatchNo: false, oneClickSale: false,
  enableTracking: false, printExpiryDate: false, notForSale: false,
  secSalePriceType: 'fixed', secSalePrice: 0, secMrp: 0, secMinSalePrice: 0, isDefaultSecondaryUnit: false,
};

// Reusable styling components defined OUTSIDE to prevent focus loss
const Input = ({ label, required = false, type = 'text', keyName, form, setForm, placeholder = '' }: any) => (
  <div>
    <label className="block text-[11px] font-medium text-slate-600 mb-1 uppercase tracking-wider">{label} {required && <span className="text-red-500">*</span>}</label>
    <input type={type}
      value={form[keyName] === 0 && type === 'number' ? '' : form[keyName]}
      onChange={e => setForm({ ...form, [keyName]: type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value })}
      placeholder={placeholder}
      className="w-full px-3 py-2 rounded-lg bg-[#F1F5F9] border border-slate-200 text-slate-900 placeholder-[#475569] focus:outline-none focus:border-[#D4D4D4] text-sm transition" />
  </div>
);

const Select = ({ label, required = false, keyName, form, setForm, options }: any) => (
  <div>
    <label className="block text-[11px] font-medium text-slate-600 mb-1 uppercase tracking-wider">{label} {required && <span className="text-red-500">*</span>}</label>
    <select value={form[keyName]} onChange={e => setForm({ ...form, [keyName]: e.target.value })}
      className="w-full px-3 py-2 rounded-lg bg-[#F1F5F9] border border-slate-200 text-slate-900 focus:outline-none focus:border-[#D4D4D4] text-sm transition appearance-none">
      {options.map((o: string) => <option key={o} value={o}>{o || 'Select...'}</option>)}
    </select>
  </div>
);

const Checkbox = ({ label, keyName, form, setForm, danger = false }: any) => (
  <label className={`flex items-center gap-2 text-sm cursor-pointer ${danger ? 'text-red-400 font-medium' : 'text-slate-900'}`}>
    <input type="checkbox" checked={form[keyName]} onChange={e => setForm({ ...form, [keyName]: e.target.checked })}
      className="w-4 h-4 rounded border-slate-200 bg-[#F1F5F9] text-action-500 focus:ring-action-400 focus:ring-offset-black" />
    {label}
  </label>
);

export default function QuickAddItemModal({ onClose, onAdded }: { onClose: () => void; onAdded: (product: any) => void; }) {

  const [showUnitModal, setShowUnitModal] = useState(false);
  const [form, setForm] = useState<any>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [productGroups, setProductGroups] = useState<string[]>([]);
  const [productBrands, setProductBrands] = useState<string[]>([]);
  const [productCategories, setProductCategories] = useState<{name: string, brands: string[]}[]>([]);
  const [dynamicUnits, setDynamicUnits] = useState<string[]>(UNITS);

  const fetchSettings = useCallback(async () => {
    try {
      const { data } = await businessApi.getProfile();
      setProductGroups(data.business?.productGroups || []);
      setProductBrands(data.business?.productBrands || []);
      setProductCategories(data.business?.productCategories || []);
      const bizUnits = data.business?.units || [];
      if (bizUnits.length > 0) {
        setDynamicUnits(Array.from(new Set([...bizUnits, ...UNITS])));
      }
    } catch (e) {
      console.error('Failed to load business settings', e);
    }
  }, []);

  useEffect(() => { 
    fetchSettings();
  }, [fetchSettings]);

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
  return (
    <>
<div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-50/60 backdrop-blur-sm">
          <div className="bg-[#F1F5F9] border border-slate-200 rounded-2xl w-full max-w-6xl shadow-2xl flex flex-col max-h-[90vh]">
            
            <div className="flex items-center justify-between p-5 border-b border-slate-200 shrink-0">
              <div>
                <h3 className="text-slate-900 font-bold text-lg">'Add New Item'</h3>
                <p className="text-xs text-slate-600 mt-0.5">Fill in the product details below</p>
              </div>
              <button onClick={() => onClose()} className="p-2 rounded-xl hover:bg-[#F1F5F9] text-slate-600 hover:text-slate-900 transition"><X className="w-5 h-5" /></button>
            </div>

            <div className="flex flex-1 overflow-hidden">
              <div className="flex-1 p-5 overflow-y-auto bg-white">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* Left Column */}
                  <div className="space-y-6">
                    {/* Product Details Section */}
                    <div className="border border-slate-200 rounded-xl p-4 bg-[#F1F5F9]">
                      <h4 className="text-sm font-semibold text-slate-900 mb-4 border-b border-slate-300 pb-2">Product Details</h4>
                      <div className="grid grid-cols-2 gap-4">
                        {(() => {
                          const availableGroups = productCategories.length > 0 ? productCategories.map(c => c.name) : productGroups;
                          const currentCat = productCategories.find(c => c.name === form.group);
                          const availableBrands = currentCat ? currentCat.brands : (productCategories.length > 0 && form.group ? [] : productBrands);
                          return (
                            <>
                              <Select label="Group" keyName="group" options={['', ...availableGroups]} form={form} setForm={(newForm: any) => {
                                 if (newForm.group !== form.group) newForm.brand = '';
                                 setForm(newForm);
                              }} />
                              <Select label="Brand" keyName="brand" options={['', ...availableBrands]} form={form} setForm={setForm} />
                            </>
                          );
                        })()}
                        <Input label="Item Code / SKU" keyName="sku" form={form} setForm={setForm} />
                        <Input label="Product Name" keyName="name" required form={form} setForm={setForm} />
                        <div className="col-span-2">
                          <Input label="Print Name (Optional)" keyName="printName" form={form} setForm={setForm} />
                        </div>
                      </div>
                    </div>
                    
                    {/* Price Details Section */}
                    <div className="border border-slate-200 rounded-xl p-4 bg-[#F1F5F9]">
                      <h4 className="text-sm font-semibold text-slate-900 mb-4 border-b border-slate-300 pb-2">Price Details</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <Input label="Purchase Price (₹)" type="number" keyName="purchasePrice" form={form} setForm={setForm} />
                        <Input label="M.R.P. (₹)" type="number" keyName="mrp" form={form} setForm={setForm} />
                        <Input label="Sale Price 1 (Retail) (₹)" type="number" keyName="sellingPrice" required form={form} setForm={setForm} />
                        <Input label="Sale Price 2 (Wholesale) (₹)" type="number" keyName="sellingPrice2" form={form} setForm={setForm} />
                        <Input label="Sale Price 3 (₹)" type="number" keyName="sellingPrice3" form={form} setForm={setForm} />
                        <Input label="Min. Sale Price (₹)" type="number" keyName="minSalePrice" form={form} setForm={setForm} />
                      </div>
                    </div>

                    {/* Stock and Unit Details */}
                    <div className="border border-slate-200 rounded-xl p-4 bg-[#F1F5F9]">
                      <h4 className="text-sm font-semibold text-slate-900 mb-4 border-b border-slate-300 pb-2">Stock and Unit Details</h4>
                      <div className="grid grid-cols-2 gap-4 items-end">
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <Select label="Unit" keyName="unit" options={dynamicUnits} required form={form} setForm={setForm} />
                          </div>
                          <button onClick={() => setShowUnitModal(true)} className="px-3 py-2 rounded-lg bg-action-500/20 text-blue-400 hover:bg-action-500/30 text-xs font-semibold whitespace-nowrap transition mt-5">
                            Secondary Unit
                          </button>
                        </div>
                        <div className="flex items-center h-9 text-xs text-slate-600">
                          {form.secondaryUnit && form.secondaryUnit !== form.unit && `1 ${form.unit} = ${form.conversionRate} ${form.secondaryUnit}`}
                        </div>
                        {form.type === 'product' && (
                          <>
                            <Input label="Opening Stock" type="number" keyName="openingStock" form={form} setForm={setForm} />
                            <Input label="Opening Stock Value (₹)" type="number" keyName="openingStockValue" form={form} setForm={setForm} />
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-6">
                    {/* GST Details */}
                    <div className="border border-slate-200 rounded-xl p-4 bg-[#F1F5F9]">
                      <h4 className="text-sm font-semibold text-slate-900 mb-4 border-b border-slate-300 pb-2">GST Details</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <Input label="HSN / SAC Code" keyName="hsnCode" form={form} setForm={setForm} />
                        <Select label="GST Rate (%)" keyName="gstRate" options={GST_RATES} form={form} setForm={setForm} />
                      </div>
                    </div>

                    {/* Other Details */}
                    <div className="border border-slate-200 rounded-xl p-4 bg-[#F1F5F9]">
                      <h4 className="text-sm font-semibold text-slate-900 mb-4 border-b border-slate-300 pb-2">Other Details</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-medium text-slate-600 mb-1 uppercase tracking-wider">Sale Discount</label>
                          <div className="flex rounded-lg overflow-hidden border border-slate-200">
                            <input type="number" value={form.saleDiscount === 0 ? '' : form.saleDiscount} onChange={e => setForm({ ...form, saleDiscount: parseFloat(e.target.value) || 0 })} placeholder="0" className="w-full px-3 py-2 bg-white text-slate-900 focus:outline-none text-sm" />
                            <select value={form.saleDiscountType} onChange={e => setForm({ ...form, saleDiscountType: e.target.value })} className="bg-[#E2E8F0] text-slate-900 px-2 py-2 text-sm focus:outline-none cursor-pointer border-l border-slate-200">
                              <option value="percentage">%</option>
                              <option value="amount">₹</option>
                            </select>
                          </div>
                        </div>
                        <Input label="Low Level Limit" type="number" keyName="lowLevelLimit" form={form} setForm={setForm} />
                        <Select label="Product Type" keyName="productType" options={['General', 'Raw Material', 'Finished Good', 'Consumable']} form={form} setForm={setForm} />
                        <Input label="Location/Rack" keyName="location" form={form} setForm={setForm} />
                        <div className="col-span-2">
                          <Input label="Batch No." keyName="batchNo" form={form} setForm={setForm} />
                        </div>
                      </div>
                    </div>

                    {/* Product Description */}
                    <div className="border border-slate-200 rounded-xl p-4 bg-[#F1F5F9]">
                      <h4 className="text-sm font-semibold text-slate-900 mb-4 border-b border-slate-300 pb-2">Product Description</h4>
                      <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={3}
                        className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 placeholder-[#475569] focus:outline-none focus:border-[#D4D4D4] text-sm transition resize-none" />
                    </div>

                    {/* Product Settings */}
                    <div className="border border-slate-200 rounded-xl p-4 bg-[#F1F5F9]">
                      <h4 className="text-sm font-semibold text-slate-900 mb-4 border-b border-slate-300 pb-2">Product Settings</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <Checkbox label="Print Description" keyName="printDescription" form={form} setForm={setForm} />
                        <Checkbox label="One Click Sale" keyName="oneClickSale" form={form} setForm={setForm} />
                        <Checkbox label="Enable Tracking" keyName="enableTracking" form={form} setForm={setForm} />
                        <Checkbox label="Print Batch No" keyName="printBatchNo" form={form} setForm={setForm} />
                        <Checkbox label="Print Expiry Date" keyName="printExpiryDate" form={form} setForm={setForm} />
                        <Checkbox label="Not For Sale" keyName="notForSale" danger form={form} setForm={setForm} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-5 border-t border-slate-200 bg-white shrink-0 rounded-b-2xl">
              <button onClick={() => onClose()} className="px-5 py-2 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-[#D4D4D4] font-medium text-sm transition">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving} className="px-8 py-2 rounded-xl bg-action-500 text-slate-900 hover:bg-action-500 font-semibold text-sm hover:opacity-90 disabled:opacity-60 transition flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />} 'Create Item'
              </button>
            </div>
          </div>
        </div>

{/* Unit Settings Modal - Dark Theme */}
      {showUnitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-50/60 backdrop-blur-sm">
          <div className="bg-[#F1F5F9] text-slate-900 border border-slate-200 w-full max-w-[440px] flex flex-col shadow-2xl rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-white">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-action-500/10 flex items-center justify-center">
                  <Layers className="w-4 h-4 text-blue-400" />
                </div>
                <h3 className="font-bold text-base text-slate-900">Unit Settings</h3>
              </div>
              <button onClick={() => setShowUnitModal(false)} className="p-2 rounded-xl hover:bg-[#F1F5F9] text-slate-600 hover:text-slate-900 transition"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-6 space-y-6 bg-[#F1F5F9]">
              {/* Base Unit & Secondary Unit */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="block text-[11px] font-medium text-slate-600 mb-1.5 uppercase tracking-wider">Base Unit</label>
                   <input type="text" disabled value={form.unit || 'Pieces'} className="w-full px-3 py-2.5 rounded-lg bg-white border border-slate-200 text-slate-600 focus:outline-none text-sm cursor-not-allowed" />
                </div>
                <div>
                   <label className="block text-[11px] font-medium text-slate-600 mb-1.5 uppercase tracking-wider">Secondary Unit <span className="text-red-500">*</span></label>
                   <select value={form.secondaryUnit} onChange={e => setForm({...form, secondaryUnit: e.target.value})} className="w-full px-3 py-2.5 rounded-lg bg-[#F1F5F9] border border-slate-200 text-slate-900 focus:outline-none focus:border-[#D4D4D4] text-sm transition appearance-none cursor-pointer">
                      {['', ...dynamicUnits].map(u => <option key={u} value={u}>{u}</option>)}
                   </select>
                </div>
              </div>

              {/* Inventory Conversion Factor */}
              <div className="p-4 rounded-xl border border-[#1e3a8a]/30 bg-white">
                 <div className="flex justify-between items-center mb-3">
                   <label className="block text-[11px] font-medium text-slate-600 uppercase tracking-wider">Conversion Factor</label>
                   <div className="text-[11px] text-blue-400 font-semibold bg-action-500/10 px-2 py-1 rounded-md border border-action-400/20">1 {form.unit || 'Pieces'} = {form.conversionRate || 1} {form.secondaryUnit || 'Feet'}</div>
                 </div>
                 <input type="number" value={form.conversionRate || ''} onChange={e => setForm({...form, conversionRate: parseFloat(e.target.value) || 0})} className="w-full px-3 py-2.5 rounded-lg bg-[#F1F5F9] border border-slate-200 text-slate-900 focus:border-[#D4D4D4] focus:outline-none text-sm transition" placeholder="e.g. 16" />
              </div>

              {/* Sale Price */}
              <div className="space-y-3">
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 text-sm text-slate-900 cursor-pointer group">
                    <input type="radio" checked={form.secSalePriceType !== 'margin'} onChange={() => setForm({...form, secSalePriceType: 'fixed'})} className="w-4 h-4 rounded-full border-slate-200 bg-[#F1F5F9] text-action-500 focus:ring-action-400 focus:ring-offset-black" />
                    Fixed Per Unit
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer hover:text-slate-900 transition group">
                    <input type="radio" checked={form.secSalePriceType === 'margin'} onChange={() => setForm({...form, secSalePriceType: 'margin'})} className="w-4 h-4 rounded-full border-slate-200 bg-[#F1F5F9] text-action-500 focus:ring-action-400 focus:ring-offset-black" />
                    Margin Per Unit
                  </label>
                </div>
                <div className="flex rounded-lg overflow-hidden border border-slate-200 focus-within:border-[#D4D4D4] transition">
                  <div className="bg-[#F1F5F9] text-slate-600 px-4 py-2.5 border-r border-slate-200 flex items-center justify-center text-sm font-medium">₹</div>
                  <input type="number" value={form.secSalePrice || ''} onChange={e => setForm({...form, secSalePrice: parseFloat(e.target.value) || 0})} className="flex-1 px-3 py-2.5 bg-white text-slate-900 focus:outline-none text-sm" placeholder="Secondary Sale Price" />
                </div>
              </div>

              {/* MRP & Min. Sale Price */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1.5 uppercase tracking-wider">M.R.P.</label>
                  <div className="flex rounded-lg overflow-hidden border border-slate-200 focus-within:border-[#D4D4D4] transition">
                    <div className="bg-[#F1F5F9] text-slate-600 px-3 py-2.5 border-r border-slate-200 flex items-center justify-center text-sm">₹</div>
                    <input type="number" value={form.secMrp || ''} onChange={e => setForm({...form, secMrp: parseFloat(e.target.value) || 0})} className="flex-1 px-3 py-2 bg-white text-slate-900 focus:outline-none text-sm" placeholder="0.00" />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1.5 uppercase tracking-wider">Min. Sale Price</label>
                  <div className="flex rounded-lg overflow-hidden border border-slate-200 focus-within:border-[#D4D4D4] transition">
                    <div className="bg-[#F1F5F9] text-slate-600 px-3 py-2.5 border-r border-slate-200 flex items-center justify-center text-sm">₹</div>
                    <input type="number" value={form.secMinSalePrice || ''} onChange={e => setForm({...form, secMinSalePrice: parseFloat(e.target.value) || 0})} className="flex-1 px-3 py-2 bg-white text-slate-900 focus:outline-none text-sm" placeholder="0.00" />
                  </div>
                </div>
              </div>

              {/* Default Sales Unit Checkbox */}
              <label className="flex items-center gap-3 text-sm text-slate-600 cursor-pointer hover:text-slate-900 transition pt-2">
                <input type="checkbox" checked={form.isDefaultSecondaryUnit || false} onChange={e => setForm({...form, isDefaultSecondaryUnit: e.target.checked})} className="w-4 h-4 rounded border-slate-200 bg-[#F1F5F9] text-action-500 focus:ring-action-400 focus:ring-offset-black" />
                Set as default sales unit
              </label>

            </div>

            {/* Footer */}
            <div className="p-5 border-t border-slate-200 bg-white flex justify-end gap-3">
              <button onClick={() => setShowUnitModal(false)} className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-[#D4D4D4] font-medium text-sm transition">
                Cancel
              </button>
              <button onClick={() => setShowUnitModal(false)} className="flex items-center gap-2 px-6 py-2.5 bg-action-500 hover:bg-action-500 text-slate-900 rounded-xl text-sm font-semibold transition shadow-lg shadow-blue-600/20">
                <Plus className="w-4 h-4" /> Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}