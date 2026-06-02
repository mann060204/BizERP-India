'use client';
import { useState, useEffect } from 'react';
import Topbar from '../../../../components/layout/Topbar';
import { inventoryApi } from '../../../../lib/erp-api';
import { Loader2, Search, ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

export default function BatchAuditTrailPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await inventoryApi.getBatchLogs();
      setLogs(res.logs);
    } catch (e) {
      toast.error('Failed to load batch audit logs');
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.batchNo?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          log.documentNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          log.productId?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'ALL' || log.action === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
      <Topbar title="Batch Audit Trail" />

      <main className="flex-1 overflow-y-auto p-4 max-w-6xl mx-auto w-full">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Batch Audit Trail</h1>
            <p className="text-sm text-slate-600 mt-1">Complete history of all batch movements (In/Out) across the system.</p>
          </div>
          
          <div className="flex gap-4">
            <button onClick={fetchLogs} className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600">
               <RefreshCw className="w-5 h-5" />
            </button>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search Product, Batch, or Doc No..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-action-500 w-72"
              />
            </div>
            
            <select 
              value={filterType} 
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-action-500"
            >
              <option value="ALL">All Actions</option>
              <option value="STOCK_IN">Stock In</option>
              <option value="STOCK_OUT">Stock Out</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                  <th className="p-4">Date & Time</th>
                  <th className="p-4">Action</th>
                  <th className="p-4">Product</th>
                  <th className="p-4">Batch No.</th>
                  <th className="p-4">Quantity</th>
                  <th className="p-4">Document</th>
                  <th className="p-4">User</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center">
                      <Loader2 className="w-8 h-8 animate-spin text-slate-700 mx-auto" />
                    </td>
                  </tr>
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-slate-500">
                      No logs found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log._id} className="border-b border-slate-100 hover:bg-slate-50 text-sm">
                      <td className="p-4 font-mono text-xs text-slate-600">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold ${
                          log.action === 'STOCK_IN' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {log.action === 'STOCK_IN' ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                          {log.action.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-4 font-medium text-slate-900">
                        {log.productId?.name || 'Unknown Product'}
                      </td>
                      <td className="p-4 font-mono text-slate-700">
                        {log.batchNo}
                      </td>
                      <td className={`p-4 font-bold ${
                          log.action === 'STOCK_IN' ? 'text-emerald-600' : 'text-red-600'
                      }`}>
                        {log.action === 'STOCK_IN' ? '+' : '-'}{log.quantity} {log.productId?.unit}
                      </td>
                      <td className="p-4">
                         <div className="flex flex-col">
                           <span className="font-semibold text-slate-800">{log.documentType}</span>
                           <span className="text-xs text-slate-500 font-mono">{log.documentNumber}</span>
                         </div>
                      </td>
                      <td className="p-4 text-slate-600">
                         {log.userId?.name || 'System'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
