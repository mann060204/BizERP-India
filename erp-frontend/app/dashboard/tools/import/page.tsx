'use client';
import { useState, useRef } from 'react';
import Topbar from '../../../../components/layout/Topbar';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, Info } from 'lucide-react';
import Papa from 'papaparse';
import toast from 'react-hot-toast';
import { productsApi, customersApi } from '../../../../lib/erp-api';

type ImportType = 'products' | 'customers';

export default function BulkImportPage() {
  const [importType, setImportType] = useState<ImportType>('products');
  const [file, setFile] = useState<File | null>(null);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;
    
    if (uploadedFile.type !== 'text/csv' && !uploadedFile.name.endsWith('.csv')) {
      toast.error('Please upload a valid CSV file');
      return;
    }

    setFile(uploadedFile);
    
    Papa.parse(uploadedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          toast.error('Error parsing CSV. Please check formatting.');
          console.error(results.errors);
        } else {
          setData(results.data);
          toast.success(`Found ${results.data.length} records`);
        }
      }
    });
  };

  const processImport = async () => {
    if (data.length === 0) return;
    setLoading(true);

    try {
      if (importType === 'products') {
        const payload = {
          products: data.map(item => ({
            name: item.name || item.Name,
            sku: item.sku || item.SKU || '',
            category: item.category || item.Category || 'General',
            unit: item.unit || item.Unit || 'Nos',
            sellingPrice: parseFloat(item.sellingPrice || item['Selling Price'] || '0'),
            purchasePrice: parseFloat(item.purchasePrice || item['Purchase Price'] || '0'),
            gstRate: parseFloat(item.gstRate || item['GST %'] || '18'),
            hsnCode: item.hsnCode || item['HSN Code'] || '',
            openingStock: parseFloat(item.openingStock || item.Stock || '0'),
            isActive: true
          }))
        };
        const res = await productsApi.bulkCreate(payload);
        toast.success(res.data.message);
      } else {
        const payload = {
          customers: data.map(item => ({
            name: item.name || item.Name,
            mobile: item.mobile || item.Mobile || '',
            email: item.email || item.Email || '',
            gstin: item.gstin || item.GSTIN || '',
            billingAddress: {
              street: item.street || item.Street || '',
              city: item.city || item.City || '',
              state: item.state || item.State || '',
              pincode: item.pincode || item.Pincode || ''
            },
            isActive: true
          }))
        };
        const res = await customersApi.bulkCreate(payload);
        toast.success(res.data.message);
      }
      
      setFile(null);
      setData([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Import failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar title="Bulk Import" />
      <main className="flex-1 p-6 space-y-6 max-w-5xl mx-auto w-full">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Upload className="w-5 h-5 text-[#D4D4D4]" /> Bulk Import
          </h2>
          <p className="text-[#94a3b8] text-sm mt-1">Upload CSV files to securely add hundreds of records at once.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            {/* Import Type */}
            <div className="glass rounded-2xl p-6 border border-[#1A1A1A]">
              <label className="block text-xs font-medium text-[#94a3b8] mb-3 uppercase tracking-wider">Select Entity to Import</label>
              <div className="flex flex-col gap-3">
                <button onClick={() => { setImportType('products'); setFile(null); setData([]); }} 
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${importType === 'products' ? 'bg-[#D4D4D4]/10 border-[#D4D4D4] text-[#D4D4D4]' : 'bg-[#0A0A0A] border-[#1A1A1A] text-white hover:border-[#475569]'}`}>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${importType === 'products' ? 'border-[#D4D4D4]' : 'border-[#475569]'}`}>
                    {importType === 'products' && <div className="w-2 h-2 rounded-full bg-[#D4D4D4]" />}
                  </div>
                  <span className="font-medium">Products / Inventory</span>
                </button>
                <button onClick={() => { setImportType('customers'); setFile(null); setData([]); }} 
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${importType === 'customers' ? 'bg-[#D4D4D4]/10 border-[#D4D4D4] text-[#D4D4D4]' : 'bg-[#0A0A0A] border-[#1A1A1A] text-white hover:border-[#475569]'}`}>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${importType === 'customers' ? 'border-[#D4D4D4]' : 'border-[#475569]'}`}>
                    {importType === 'customers' && <div className="w-2 h-2 rounded-full bg-[#D4D4D4]" />}
                  </div>
                  <span className="font-medium">Customers</span>
                </button>
              </div>
            </div>

            {/* Formatting Info */}
            <div className="glass rounded-2xl p-6 border border-[#1A1A1A] bg-blue-500/5">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-400 mt-0.5" />
                <div>
                  <h4 className="text-white font-medium text-sm mb-1">CSV Formatting Guide</h4>
                  <p className="text-[#94a3b8] text-xs leading-relaxed mb-3">Ensure your CSV contains column headers in the first row. The system will automatically attempt to match common header names.</p>
                  
                  {importType === 'products' ? (
                    <div className="text-xs text-[#94a3b8] font-mono bg-[#000000] p-3 rounded-lg border border-[#1A1A1A]">
                      Expected Headers:<br/>
                      <span className="text-emerald-400">Name</span>, SKU, Category, Unit, <span className="text-emerald-400">Selling Price</span>, Purchase Price, GST %, HSN Code, Stock
                    </div>
                  ) : (
                    <div className="text-xs text-[#94a3b8] font-mono bg-[#000000] p-3 rounded-lg border border-[#1A1A1A]">
                      Expected Headers:<br/>
                      <span className="text-emerald-400">Name</span>, Mobile, Email, GSTIN, Street, City, State, Pincode
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            {/* Uploader Zone */}
            <div className="glass rounded-2xl p-8 border border-dashed border-[#475569] flex flex-col items-center justify-center min-h-[250px] transition hover:border-[#D4D4D4] hover:bg-[#D4D4D4]/5 relative group cursor-pointer"
                 onClick={() => fileInputRef.current?.click()}>
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".csv" className="hidden" />
              
              {!file ? (
                <>
                  <div className="w-16 h-16 rounded-full bg-[#0A0A0A] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <FileText className="w-8 h-8 text-[#94a3b8] group-hover:text-[#D4D4D4] transition-colors" />
                  </div>
                  <h3 className="text-white font-semibold text-lg mb-1">Click to Upload CSV</h3>
                  <p className="text-[#94a3b8] text-sm">or drag and drop here</p>
                </>
              ) : (
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4 mx-auto">
                    <CheckCircle className="w-8 h-8 text-emerald-400" />
                  </div>
                  <h3 className="text-white font-semibold text-lg mb-1">{file.name}</h3>
                  <p className="text-emerald-400 text-sm font-medium">{data.length} records parsed successfully</p>
                  <button onClick={(e) => { e.stopPropagation(); setFile(null); setData([]); if(fileInputRef.current) fileInputRef.current.value=''; }} 
                    className="mt-4 text-[#94a3b8] hover:text-white text-xs underline">
                    Remove and select another file
                  </button>
                </div>
              )}
            </div>

            {/* Preview & Action */}
            {data.length > 0 && (
              <div className="glass rounded-2xl p-6 border border-[#1A1A1A]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-semibold text-sm uppercase tracking-wider">Data Preview (Top 3)</h3>
                  <button onClick={processImport} disabled={loading}
                    className="px-6 py-2.5 rounded-xl bg-white text-black hover:bg-gray-200 font-semibold flex items-center gap-2 hover:opacity-90 disabled:opacity-50 transition shadow-lg shadow-white/10/30">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    Import {data.length} Records
                  </button>
                </div>

                <div className="overflow-x-auto rounded-xl border border-[#1A1A1A]">
                  <table className="w-full text-left text-sm text-[#94a3b8]">
                    <thead className="bg-[#0A0A0A] text-white">
                      <tr>
                        {Object.keys(data[0] || {}).slice(0, 5).map(header => (
                          <th key={header} className="px-4 py-3 font-medium">{header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1A1A1A]">
                      {data.slice(0, 3).map((row, i) => (
                        <tr key={i} className="hover:bg-[#0A0A0A]/50">
                          {Object.values(row).slice(0, 5).map((val: any, j) => (
                            <td key={j} className="px-4 py-3 truncate max-w-[150px]">{val || '-'}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {data.length > 3 && (
                    <div className="p-3 text-center text-xs text-[#475569] bg-[#0A0A0A]/30">
                      ... and {data.length - 3} more records
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
