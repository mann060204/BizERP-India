'use client';
import { useState, useEffect } from 'react';
import { Plus, Search, Hammer, Trash2, ArrowRight } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { manufacturingApi, bomApi } from '../../../../lib/erp-api';
import Topbar from '../../../../components/layout/Topbar';

export default function ManufacturingOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [boms, setBoms] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [form, setForm] = useState<any>({
    bomId: '',
    quantityToProduce: 1,
  });
  
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [moRes, bomRes] = await Promise.all([
        manufacturingApi.getAll(),
        bomApi.getAll()
      ]);
      setOrders(moRes.data.mos);
      setBoms(bomRes.data.boms);
    } catch (err: any) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMO = async () => {
    try {
      if (!form.bomId) return toast.error('Select a BOM');
      if (form.quantityToProduce < 1) return toast.error('Quantity must be at least 1');

      const selectedBOM = boms.find(b => b._id === form.bomId);
      if (!selectedBOM) return;

      const rawMaterials = selectedBOM.components.map((c: any) => ({
        productId: c.productId,
        productName: c.productName,
        quantityRequired: c.quantity * form.quantityToProduce,
        unit: c.unit,
        costPerUnit: c.costPerUnit,
        totalCost: (c.quantity * form.quantityToProduce) * c.costPerUnit
      }));

      const payload = {
        bomId: selectedBOM._id,
        productId: selectedBOM.productId,
        productName: selectedBOM.productName,
        quantityToProduce: form.quantityToProduce,
        rawMaterials,
        estimatedLaborCost: selectedBOM.directLaborCost * form.quantityToProduce,
        estimatedOverhead: selectedBOM.manufacturingOverhead * form.quantityToProduce,
        totalEstimatedCost: selectedBOM.totalEstimatedCost * form.quantityToProduce,
        actualLaborCost: selectedBOM.directLaborCost * form.quantityToProduce,
        actualOverhead: selectedBOM.manufacturingOverhead * form.quantityToProduce,
      };

      await manufacturingApi.create(payload);
      toast.success('Production Order Created');
      setIsModalOpen(false);
      setForm({ bomId: '', quantityToProduce: 1 });
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create order');
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      if (!confirm(`Are you sure you want to mark this order as ${status}? This will affect inventory.`)) return;
      await manufacturingApi.updateStatus(id, status);
      toast.success(`Order marked as ${status}`);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending': return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium border border-yellow-200">Pending</span>;
      case 'In-Progress': return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium border border-blue-200">In-Progress (WIP)</span>;
      case 'Completed': return <span className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded text-xs font-medium border border-emerald-200">Completed</span>;
      default: return <span className="px-2 py-1 bg-slate-100 text-slate-800 rounded text-xs font-medium border border-slate-200">{status}</span>;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-900 font-sans">
      <Topbar title="Production Orders" />
      <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        
        <div className="flex items-center justify-between">
          <div className="relative w-72">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search Orders..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm" />
          </div>
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition text-sm font-medium">
            <Plus className="w-4 h-4" /> New Order
          </button>
        </div>

        {/* Order List */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
              <tr>
                <th className="px-6 py-4">Order No.</th>
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">Qty</th>
                <th className="px-6 py-4">Est. Cost</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Progress Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map((mo: any) => (
                <tr key={mo._id} className="hover:bg-slate-50 transition">
                  <td className="px-6 py-4 font-medium text-slate-900">{mo.orderNumber}</td>
                  <td className="px-6 py-4 text-slate-700">{mo.productName}</td>
                  <td className="px-6 py-4 font-medium">{mo.quantityToProduce}</td>
                  <td className="px-6 py-4 text-slate-700">₹{mo.totalEstimatedCost?.toFixed(2)}</td>
                  <td className="px-6 py-4">{getStatusBadge(mo.status)}</td>
                  <td className="px-6 py-4 text-right space-x-2">
                    {mo.status === 'Pending' && (
                      <button onClick={() => updateStatus(mo._id, 'In-Progress')} className="text-xs font-medium bg-blue-50 text-blue-600 px-3 py-1.5 rounded border border-blue-200 hover:bg-blue-100 transition inline-flex items-center gap-1">
                        Start Production <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                    {mo.status === 'In-Progress' && (
                      <button onClick={() => updateStatus(mo._id, 'Completed')} className="text-xs font-medium bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded border border-emerald-200 hover:bg-emerald-100 transition inline-flex items-center gap-1">
                        Mark Completed
                      </button>
                    )}
                    {mo.status === 'Completed' && (
                      <span className="text-xs text-slate-400">Finalized</span>
                    )}
                  </td>
                </tr>
              ))}
              {orders.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <Hammer className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    No Production Orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </div>

      </main>

      {/* CREATE ORDER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md flex flex-col">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">New Production Order</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-900 text-2xl leading-none">&times;</button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Select BOM</label>
                <select value={form.bomId} onChange={e => setForm({ ...form, bomId: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:border-slate-900">
                  <option value="">Select a Bill of Materials</option>
                  {boms.map(b => (
                    <option key={b._id} value={b._id}>[{b.bomNumber}] {b.productName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Quantity to Produce</label>
                <input type="number" min="1" value={form.quantityToProduce} onChange={e => setForm({ ...form, quantityToProduce: parseInt(e.target.value) || 1 })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-900" />
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 flex justify-end gap-3 bg-slate-50 rounded-b-xl">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:text-slate-900 font-medium text-sm transition">Cancel</button>
              <button onClick={handleCreateMO} className="bg-slate-900 text-white px-6 py-2 rounded-lg hover:bg-slate-800 transition text-sm font-medium">Create Order</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
