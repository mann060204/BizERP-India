'use client';
import { useState, useRef } from 'react';
import Topbar from '../../../../components/layout/Topbar';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, Info, Download } from 'lucide-react';
import Papa from 'papaparse';
import toast from 'react-hot-toast';
import { productsApi, customersApi, suppliersApi, inventoryApi } from '../../../../lib/erp-api';

type ImportType = 'products' | 'customers' | 'suppliers';

export default function BulkImportPage() {
  const [importType, setImportType] = useState<ImportType>('products');
  const [file, setFile] = useState<File | null>(null);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = () => {
    let headers = '';
    let filename = '';
    if (importType === 'products') {
      const cols = [
        'Category','Brand','Group','SubGroup',
        'Item Code / SKU','Product Name','Print Name',
        'Purchase Price (Rs)','MRP (Rs)',
        'Sale Price 1 (Retail) (Rs)','Sale Price 2 (Wholesale) (Rs)','Sale Price 3 (Rs)','Min. Sale Price (Rs)',
        'Sale Discount','Sale Discount Type',
        'Unit','Secondary Unit','Conversion Rate',
        'Opening Stock','Opening Stock Value (Rs)','Current Stock',
        'Reorder Level','Low Level Limit',
        'HSN / SAC Code','GST Rate (%)','Cess Rate (%)','IGST Rate (%)',
        'Product Type','Location/Rack','Batch No.',
        'Product Description',
        'Print Description','One Click Sale','Enable Tracking','Print Batch No','Print Expiry Date','Not For Sale',
        'Batch No (Detail)','Batch Stock','Batch Sale Price','Batch MRP','Mfg Date','Expiry Date',
      ];
      const sample = [
        'Grocery','Brand X','Main Group','Sub Group 1',
        'SKU001','Basmati Rice','Basmati Rice',
        '90','130',
        '120','110','105','100',
        '5','percentage',
        'Nos','Box','10',
        '50','4500','50',
        '5','2',
        '100630','5','0','0',
        'General','Rack A','BATCH-01',
        'Premium quality basmati rice',
        'FALSE','FALSE','FALSE','FALSE','FALSE','FALSE',
        'BATCH-01','50','120','130','2025-01-01','2027-12-31',
      ];
      headers = cols.map(h => `"${h}"`).join(',') + '\n' + sample.map(v => `"${v}"`).join(',');
      filename = 'full_inventory_import_template.csv';
    } else if (importType === 'suppliers') {
      headers = 'Name,Mobile,Email,GSTIN,PAN No,Trade Name,Opening Balance,Street,City,State,Pincode\n"Supplier ABC","9876543211","supplier@example.com","27AADCB2230M1Z3","ABCDE1234G","ABC Enterprises","0","123 Industrial St","Pune","Maharashtra","411001"';
      filename = 'suppliers_import_template.csv';
    } else {
      headers = 'Name,Mobile,Email,GSTIN,PAN No,Trade Name,Credit Limit,Opening Balance,Street,City,State,Pincode\n"John Doe","9876543210","john@example.com","27AADCB2230M1Z2","ABCDE1234F","Doe Enterprises","50000","0","123 Main St","Mumbai","Maharashtra","400001"';
      filename = 'customers_import_template.csv';
    }
    const blob = new Blob([headers], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

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
        // Map every row using ALL 43-column headers from Full Export
        const mapped = data.map((item: any) => {
          const bool = (v: any) => String(v || '').toUpperCase() === 'TRUE';
          const num  = (v: any, def = 0) => parseFloat(String(v || '').replace(/[^\d.]/g, '')) || def;
          return {
            name:             item['Product Name'] || item.Name || item.name || '',
            printName:        item['Print Name']   || item.printName   || '',
            sku:              item['Item Code / SKU'] || item.SKU || item.sku || '',
            category:         item.Category        || item.category    || '',
            brand:            item.Brand           || item.brand       || '',
            group:            item.Group           || item.group       || '',
            subGroup:         item.SubGroup        || item.subGroup    || '',
            unit:             item.Unit            || item.unit        || 'Nos',
            secondaryUnit:    item['Secondary Unit']    || item.secondaryUnit    || '',
            conversionRate:   num(item['Conversion Rate'] || item.conversionRate, 1),
            purchasePrice:    num(item['Purchase Price (Rs)']  || item['Purchase Price'] || item.purchasePrice),
            mrp:              num(item['MRP (Rs)']  || item.MRP  || item.mrp),
            sellingPrice:     num(item['Sale Price 1 (Retail) (Rs)']  || item['Selling Price'] || item.sellingPrice),
            sellingPrice2:    num(item['Sale Price 2 (Wholesale) (Rs)'] || item.sellingPrice2),
            sellingPrice3:    num(item['Sale Price 3 (Rs)']             || item.sellingPrice3),
            minSalePrice:     num(item['Min. Sale Price (Rs)']          || item.minSalePrice),
            saleDiscount:     num(item['Sale Discount'] || item.saleDiscount),
            saleDiscountType: (item['Sale Discount Type'] || item['Discount Type'] || 'percentage').toLowerCase(),
            openingStock:     num(item['Opening Stock'] || item.openingStock || item.Stock),
            openingStockValue:num(item['Opening Stock Value (Rs)'] || item.openingStockValue),
            reorderLevel:     num(item['Reorder Level'] || item.reorderLevel, 5),
            lowLevelLimit:    num(item['Low Level Limit'] || item.lowLevelLimit),
            hsnCode:          item['HSN / SAC Code'] || item['HSN Code'] || item.hsnCode || '',
            gstRate:          num(item['GST Rate (%)'] || item['GST %'] || item.gstRate),
            cessRate:         num(item['Cess Rate (%)'] || item.cessRate),
            igstRate:         num(item['IGST Rate (%)'] || item.igstRate),
            productType:      item['Product Type']  || item.productType  || 'General',
            location:         item['Location/Rack'] || item.Location     || item.location || '',
            batchNo:          item['Batch No.']     || item['Batch No']  || item.batchNo  || '',
            description:      item['Product Description'] || item.description || '',
            printDescription: bool(item['Print Description'] || item.printDescription),
            oneClickSale:     bool(item['One Click Sale']   || item.oneClickSale),
            enableTracking:   bool(item['Enable Tracking']  || item.enableTracking),
            printBatchNo:     bool(item['Print Batch No']   || item.printBatchNo),
            printExpiryDate:  bool(item['Print Expiry Date']|| item.printExpiryDate),
            notForSale:       bool(item['Not For Sale']     || item.notForSale),
            // Batch detail columns
            batchDetail: {
              batchNo:      item['Batch No (Detail)'] || item['Batch No'] || '',
              currentStock: num(item['Batch Stock']),
              salePrice:    num(item['Batch Sale Price']),
              mrp:          num(item['Batch MRP']),
              manufacturingDate: item['Mfg Date'] || '',
              expiryDate:        item['Expiry Date'] || '',
            },
            isActive: true,
          };
        }).filter((p: any) => p.name.trim() !== '');

        // Try full inventory import first, fall back to simple bulk create
        try {
          const res = await inventoryApi.bulkImport({ records: data });
          toast.success(res.data.message);
          if (res.data.errors?.length > 0) {
            console.warn('Import errors:', res.data.errors);
            toast(`${res.data.errors.length} rows had errors — check console`, { icon: '⚠️' });
          }
        } catch {
          // Fallback: create products without batch details
          const payload = { products: mapped };
          const res = await productsApi.bulkCreate(payload);
          toast.success(res.data.message);
        }
      } else if (importType === 'suppliers') {
        const payload = {
          suppliers: data.map(item => ({
            name: item.name || item.Name,
            mobile: item.mobile || item.Mobile || '',
            email: item.email || item.Email || '',
            gstin: item.gstin || item.GSTIN || '',
            panNo: item.panNo || item['PAN No'] || '',
            tradeName: item.tradeName || item['Trade Name'] || '',
            openingBalance: parseFloat(item.openingBalance || item['Opening Balance'] || '0'),
            billingAddress: {
              street: item.street || item.Street || '',
              city: item.city || item.City || '',
              state: item.state || item.State || '',
              pincode: item.pincode || item.Pincode || ''
            },
            isActive: true
          }))
        };
        const res = await suppliersApi.bulkCreate(payload);
        toast.success(res.data.message);
      } else {
        const payload = {
          customers: data.map(item => ({
            name: item.name || item.Name,
            mobile: item.mobile || item.Mobile || '',
            email: item.email || item.Email || '',
            gstin: item.gstin || item.GSTIN || '',
            panNo: item.panNo || item['PAN No'] || '',
            tradeName: item.tradeName || item['Trade Name'] || '',
            creditLimit: parseFloat(item.creditLimit || item['Credit Limit'] || '0'),
            openingBalance: parseFloat(item.openingBalance || item['Opening Balance'] || '0'),
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
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Upload className="w-5 h-5 text-slate-700" /> Bulk Import
          </h2>
          <p className="text-slate-600 text-sm mt-1">Upload CSV files to securely add hundreds of records at once.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            {/* Import Type */}
            <div className="glass rounded-2xl p-6 border border-slate-200">
              <label className="block text-xs font-medium text-slate-600 mb-3 uppercase tracking-wider">Select Entity to Import</label>
              <div className="flex flex-col gap-3">
                <button onClick={() => { setImportType('products'); setFile(null); setData([]); }} 
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${importType === 'products' ? 'bg-[#D4D4D4]/10 border-[#D4D4D4] text-slate-700' : 'bg-white border-slate-200 text-slate-900 hover:border-[#475569]'}`}>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${importType === 'products' ? 'border-[#D4D4D4]' : 'border-[#475569]'}`}>
                    {importType === 'products' && <div className="w-2 h-2 rounded-full bg-[#D4D4D4]" />}
                  </div>
                  <span className="font-medium">Products / Inventory</span>
                </button>
                <button onClick={() => { setImportType('customers'); setFile(null); setData([]); }} 
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${importType === 'customers' ? 'bg-[#D4D4D4]/10 border-[#D4D4D4] text-slate-700' : 'bg-white border-slate-200 text-slate-900 hover:border-[#475569]'}`}>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${importType === 'customers' ? 'border-[#D4D4D4]' : 'border-[#475569]'}`}>
                    {importType === 'customers' && <div className="w-2 h-2 rounded-full bg-[#D4D4D4]" />}
                  </div>
                  <span className="font-medium">Customers</span>
                </button>
                <button onClick={() => { setImportType('suppliers'); setFile(null); setData([]); }} 
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${importType === 'suppliers' ? 'bg-[#D4D4D4]/10 border-[#D4D4D4] text-slate-700' : 'bg-white border-slate-200 text-slate-900 hover:border-[#475569]'}`}>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${importType === 'suppliers' ? 'border-[#D4D4D4]' : 'border-[#475569]'}`}>
                    {importType === 'suppliers' && <div className="w-2 h-2 rounded-full bg-[#D4D4D4]" />}
                  </div>
                  <span className="font-medium">Suppliers</span>
                </button>
              </div>
            </div>

            {/* Formatting Info */}
            <div className="glass rounded-2xl p-6 border border-slate-200 bg-primary/5">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-400 mt-0.5" />
                <div>
                  <h4 className="text-slate-900 font-medium text-sm mb-1">CSV Formatting Guide</h4>
                  <p className="text-slate-600 text-xs leading-relaxed mb-3">Ensure your CSV contains column headers in the first row. The system will automatically attempt to match common header names.</p>
                  
                  {importType === 'products' ? (
                  <div className="text-xs text-slate-600 font-mono bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                      <p className="text-slate-700 font-semibold mb-1">Expected Headers (43 columns):</p>
                      <p><span className="text-violet-500">Classification:</span> Category, Brand, Group, <span className="text-emerald-500">SubGroup</span></p>
                      <p><span className="text-violet-500">Identity:</span> Item Code / SKU, <span className="text-emerald-500">Product Name</span>, Print Name</p>
                      <p><span className="text-violet-500">Pricing:</span> Purchase Price (Rs), MRP (Rs), <span className="text-emerald-500">Sale Price 1 (Retail) (Rs)</span>, Sale Price 2 (Wholesale) (Rs), Sale Price 3 (Rs), Min. Sale Price (Rs), Sale Discount, Sale Discount Type</p>
                      <p><span className="text-violet-500">Unit &amp; Stock:</span> Unit, Secondary Unit, Conversion Rate, Opening Stock, Opening Stock Value (Rs), Current Stock, Reorder Level, Low Level Limit</p>
                      <p><span className="text-violet-500">GST:</span> HSN / SAC Code, GST Rate (%), Cess Rate (%), IGST Rate (%)</p>
                      <p><span className="text-violet-500">Other:</span> Product Type, Location/Rack, Batch No., Product Description</p>
                      <p><span className="text-violet-500">Settings:</span> Print Description, One Click Sale, Enable Tracking, Print Batch No, Print Expiry Date, Not For Sale</p>
                      <p className="text-blue-500 mt-1">+ Batch Detail (optional): Batch No (Detail), Batch Stock, Batch Sale Price, Batch MRP, Mfg Date, Expiry Date</p>
                      <p className="text-amber-600 mt-1">💡 Tip: Use &quot;Full Export (with Batches)&quot; from Inventory page — the file can be re-uploaded directly here!</p>
                    </div>
                  ) : importType === 'suppliers' ? (
                    <div className="text-xs text-slate-600 font-mono bg-slate-50 p-3 rounded-lg border border-slate-200">
                      Expected Headers:<br/>
                      <span className="text-emerald-400">Name</span>, Mobile, Email, GSTIN, PAN No, Trade Name, Opening Balance, Street, City, State, Pincode
                    </div>
                  ) : (
                    <div className="text-xs text-slate-600 font-mono bg-slate-50 p-3 rounded-lg border border-slate-200">
                      Expected Headers:<br/>
                      <span className="text-emerald-400">Name</span>, Mobile, Email, GSTIN, PAN No, Trade Name, Credit Limit, Opening Balance, Street, City, State, Pincode
                    </div>
                  )}

                  <button onClick={downloadTemplate} className="mt-4 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition flex items-center gap-2 shadow-sm">
                    <Download className="w-4 h-4" /> Download Template
                  </button>
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
                  <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <FileText className="w-8 h-8 text-slate-600 group-hover:text-[#D4D4D4] transition-colors" />
                  </div>
                  <h3 className="text-slate-900 font-semibold text-lg mb-1">Click to Upload CSV</h3>
                  <p className="text-slate-600 text-sm">or drag and drop here</p>
                </>
              ) : (
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4 mx-auto">
                    <CheckCircle className="w-8 h-8 text-emerald-400" />
                  </div>
                  <h3 className="text-slate-900 font-semibold text-lg mb-1">{file.name}</h3>
                  <p className="text-emerald-400 text-sm font-medium">{data.length} records parsed successfully</p>
                  <button onClick={(e) => { e.stopPropagation(); setFile(null); setData([]); if(fileInputRef.current) fileInputRef.current.value=''; }} 
                    className="mt-4 text-slate-600 hover:text-slate-900 text-xs underline">
                    Remove and select another file
                  </button>
                </div>
              )}
            </div>

            {/* Preview & Action */}
            {data.length > 0 && (
              <div className="glass rounded-2xl p-6 border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-slate-900 font-semibold text-sm uppercase tracking-wider">Data Preview (Top 3)</h3>
                  <button onClick={processImport} disabled={loading}
                    className="px-6 py-2.5 rounded-xl bg-primary text-white hover:bg-primary-hover font-semibold flex items-center gap-2 hover:opacity-90 disabled:opacity-50 transition shadow-lg shadow-white/10/30">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    Import {data.length} Records
                  </button>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-white text-slate-900">
                      <tr>
                        {Object.keys(data[0] || {}).slice(0, 5).map(header => (
                          <th key={header} className="px-4 py-3 font-medium">{header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1A1A1A]">
                      {data.slice(0, 3).map((row, i) => (
                        <tr key={i} className="hover:bg-[#0A0A0A]">
                          {Object.values(row).slice(0, 5).map((val: any, j) => (
                            <td key={j} className="px-4 py-3 truncate max-w-[150px]">{val || '-'}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {data.length > 3 && (
                    <div className="p-3 text-center text-xs text-slate-600 bg-white">
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
