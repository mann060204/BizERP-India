'use client';
import { useState, useEffect } from 'react';
import { Plus, Search, Factory, Edit, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { bomApi, productsApi } from '../../../../lib/erp-api';
import Topbar from '../../../../components/layout/Topbar';

export default function BOMPage() {
  const [boms, setBoms] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [form, setForm] = useState<any>({
    productId: '',
    productName: '',
    directLaborCost: 0,
    manufacturingOverhead: 0,
  });
  const [components, setComponents] = useState<any[]>([]);
  const [scrapItems, setScrapItems] = useState<any[]>([]);
  
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [bomRes, prodRes] = await Promise.all([
        bomApi.getAll(),
        productsApi.list()
      ]);
      setBoms(bomRes.data.boms);
      setProducts(prodRes.data.products);
    } catch (err: any) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleProductSelect = (id: string) => {
    const prod = products.find(p => p._id === id);
    if (prod) {
      setForm({ ...form, productId: id, productName: prod.name });
    } else {
      setForm({ ...form, productId: '', productName: '' });
    }
  };

  
  const handleAddScrap = () => {
    setScrapItems([...scrapItems, { productId: '', productName: '', quantity: 1, recoveryCostPerUnit: 0, unit: 'Nos', totalRecoveryValue: 0 }]);
  };

  const updateScrap = (index: number, field: string, value: any) => {
    const updated = [...scrapItems];
    updated[index][field] = value;
    if (field === 'productId') {
      const prod = products.find(p => p._id === value);
      if (prod) {
        updated[index].productName = prod.name;
        updated[index].recoveryCostPerUnit = prod.sellingPrice || 0;
        updated[index].unit = prod.unit || 'Nos';
      }
    }
    updated[index].totalRecoveryValue = updated[index].quantity * updated[index].recoveryCostPerUnit;
    setScrapItems(updated);
  };

  const removeScrap = (index: number) => {
    setScrapItems(scrapItems.filter((_, i) => i !== index));
  };

  const handleAddComponent = () => {
    setComponents([...components, { productId: '', productName: '', quantity: 1, costPerUnit: 0, unit: 'Nos', totalCost: 0 }]);
  };

  const updateComponent = (index: number, field: string, value: any) => {
    const updated = [...components];
    updated[index][field] = value;
    
    if (field === 'productId') {
      const prod = products.find(p => p._id === value);
      if (prod) {
        updated[index].productName = prod.name;
        updated[index].costPerUnit = prod.purchasePrice || 0;
        updated[index].unit = prod.unit || 'Nos';
      }
    }

    // Auto calculate total cost
    updated[index].totalCost = updated[index].quantity * updated[index].costPerUnit;
    setComponents(updated);
  };

  const removeComponent = (index: number) => {
    setComponents(components.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    try {
      if (!form.productId) return toast.error('Select a Finished Good');
      if (components.length === 0) return toast.error('Add at least one component');

      const materialCost = components.reduce((acc, curr) => acc + curr.totalCost, 0);
      const totalEstimatedCost = materialCost + Number(form.directLaborCost) + Number(form.manufacturingOverhead);

      const payload = {
        ...form,
        components,
        scrapItems,
        totalEstimatedCost
      };

      await bomApi.create(payload);
      toast.success('BOM created successfully');
      setIsModalOpen(false);
      setForm({ productId: '', productName: '', directLaborCost: 0, manufacturingOverhead: 0 });
      setComponents([]);
      setScrapItems([]);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save BOM');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-900 font-sans">
      <Topbar title="Bill of Materials" />
      <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        
        <div className="flex items-center justify-between">
          <div className="relative w-72">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search BOMs..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm" />
          </div>
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition text-sm font-medium">
            <Plus className="w-4 h-4" /> Create BOM
          </button>
        </div>

        {/* BOM List */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
              <tr>
                <th className="px-6 py-4">BOM No.</th>
                <th className="px-6 py-4">Finished Good</th>
                <th className="px-6 py-4">Components</th>
                <th className="px-6 py-4">Est. Cost</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {boms.map((bom: any) => (
                <tr key={bom._id} className="hover:bg-slate-50 transition">
                  <td className="px-6 py-4 font-medium text-slate-900">{bom.bomNumber}</td>
                  <td className="px-6 py-4 text-slate-700">{bom.productName}</td>
                  <td className="px-6 py-4 text-slate-500">{bom.components.length} Items</td>
                  <td className="px-6 py-4 text-slate-700">₹{bom.totalEstimatedCost?.toFixed(2)}</td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-slate-400 hover:text-slate-900 p-1"><Edit className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
              {boms.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <Factory className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    No Bill of Materials found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </div>

      </main>

      {/* CREATE BOM MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Create Bill of Materials</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-900 text-2xl leading-none">&times;</button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Target Finished Good</label>
                <select value={form.productId} onChange={e => handleProductSelect(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white">
                  <option value="">Select a Product (Finished Good)</option>
                  {products.map(p => (
                    <option key={p._id} value={p._id}>{p.name} {p.sku ? `(${p.sku})` : ''}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Direct Labor Cost (₹)</label>
                  <input type="number" value={form.directLaborCost} onChange={e => setForm({ ...form, directLaborCost: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Manufacturing Overhead (₹)</label>
                  <input type="number" value={form.manufacturingOverhead} onChange={e => setForm({ ...form, manufacturingOverhead: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-slate-700">Raw Materials / Components</label>
                  <button onClick={handleAddComponent} className="text-sm text-blue-600 hover:text-blue-700 font-medium">+ Add Component</button>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto w-full">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-100 border-b border-slate-200">
                      <tr>
                        <th className="p-2 w-1/2">Material</th>
                        <th className="p-2 w-24">Qty</th>
                        <th className="p-2 w-24">Cost/Unit</th>
                        <th className="p-2 w-24">Total</th>
                        <th className="p-2 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {components.map((comp, idx) => (
                        <tr key={idx}>
                          <td className="p-2">
                            <select value={comp.productId} onChange={e => updateComponent(idx, 'productId', e.target.value)} className="w-full px-2 py-1 text-sm border border-slate-200 rounded">
                              <option value="">Select Material</option>
                              {products.map(p => (
                                <option key={p._id} value={p._id}>{p.name}</option>
                              ))}
                            </select>
                          </td>
                          <td className="p-2"><input type="number" value={comp.quantity} onChange={e => updateComponent(idx, 'quantity', parseFloat(e.target.value) || 0)} className="w-full px-2 py-1 text-sm border border-slate-200 rounded" /></td>
                          <td className="p-2"><input type="number" value={comp.costPerUnit} onChange={e => updateComponent(idx, 'costPerUnit', parseFloat(e.target.value) || 0)} className="w-full px-2 py-1 text-sm border border-slate-200 rounded" /></td>
                          <td className="p-2 text-slate-700 font-medium">₹{comp.totalCost?.toFixed(2)}</td>
                          <td className="p-2 text-right">
                            <button onClick={() => removeComponent(idx)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>
                  {components.length === 0 && <div className="text-center text-sm text-slate-500 py-4">No components added.</div>}
                </div>
              </div>

            </div>

            <div className="p-6 border-t border-slate-200 flex justify-end gap-3 bg-slate-50 rounded-b-xl">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:text-slate-900 font-medium text-sm transition">Cancel</button>
              <button onClick={handleSave} className="bg-slate-900 text-white px-6 py-2 rounded-lg hover:bg-slate-800 transition text-sm font-medium">Save BOM</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
