'use client';
import { useState, useEffect } from 'react';
import Topbar from '../../../../../components/layout/Topbar';
import { inventoryApi } from '../../../../../lib/erp-api';
import { Loader2, AlertTriangle, AlertCircle, Clock, Search } from 'lucide-react';
import toast from 'react-hot-toast';

export default function BatchAlertsPage() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const res = await inventoryApi.getBatchAlerts();
      setAlerts(res.alerts);
    } catch (e) {
      toast.error('Failed to load batch alerts');
    } finally {
      setLoading(false);
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = alert.productName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          alert.batchNo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'ALL' || alert.alertType === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
      <Topbar title="Batch Alerts Dashboard" />

      <main className="flex-1 overflow-y-auto p-4 max-w-6xl mx-auto w-full">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Batch Alerts</h1>
            <p className="text-sm text-slate-600 mt-1">Monitor expiring batches, low stock, and failed quality checks.</p>
          </div>
          
          <div className="flex gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search Product or Batch..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary w-64"
              />
            </div>
            
            <select 
              value={filterType} 
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary"
            >
              <option value="ALL">All Alerts</option>
              <option value="EXPIRED">Expired</option>
              <option value="EXPIRING_SOON">Expiring Soon</option>
              <option value="LOW_STOCK">Low Stock</option>
              <option value="FAILED_QUALITY">Failed Quality</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-slate-700" />
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
            <CheckCircleIcon className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900">All Good!</h2>
            <p className="text-slate-600 mt-2">No batch alerts requiring attention.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAlerts.map((alert, idx) => (
              <div key={idx} className={`bg-white rounded-xl p-5 border-l-4 shadow-sm ${
                alert.alertType === 'EXPIRED' ? 'border-red-500' :
                alert.alertType === 'FAILED_QUALITY' ? 'border-red-500' :
                alert.alertType === 'LOW_STOCK' ? 'border-orange-500' :
                'border-yellow-500'
              }`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {alert.alertType === 'EXPIRED' || alert.alertType === 'FAILED_QUALITY' ? (
                      <AlertCircle className="w-5 h-5 text-red-500" />
                    ) : alert.alertType === 'LOW_STOCK' ? (
                      <AlertTriangle className="w-5 h-5 text-orange-500" />
                    ) : (
                      <Clock className="w-5 h-5 text-yellow-500" />
                    )}
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                      alert.alertType === 'EXPIRED' ? 'bg-red-100 text-red-700' :
                      alert.alertType === 'FAILED_QUALITY' ? 'bg-red-100 text-red-700' :
                      alert.alertType === 'LOW_STOCK' ? 'bg-orange-100 text-orange-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {alert.alertType.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                <div className="mt-4">
                  <h3 className="font-bold text-slate-900 truncate" title={alert.productName}>{alert.productName}</h3>
                  <div className="text-sm text-slate-600 font-mono mt-1">Batch: {alert.batchNo}</div>
                </div>

                <div className="mt-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <p className="text-sm text-slate-700 font-medium">{alert.message}</p>
                </div>
                
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-500">
                  <div>Stock: <span className="font-bold text-slate-900">{alert.stock}</span></div>
                  {alert.expiryDate && <div>Exp: <span className="font-bold text-slate-900">{new Date(alert.expiryDate).toLocaleDateString()}</span></div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function CheckCircleIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}
