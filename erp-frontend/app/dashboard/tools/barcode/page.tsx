'use client';
import { useState, useEffect } from 'react';
import Topbar from '../../../../components/layout/Topbar';
import { productsApi } from '../../../../lib/erp-api';
import Barcode from 'react-barcode';
import { Search, Printer, FileText } from 'lucide-react';

interface Product { _id: string; name: string; sellingPrice: number; sku?: string; }

export default function BarcodeGeneratorPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState<number>(24); // 24 stickers per A4 page approx
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    productsApi.list({ limit: 500 }).then(res => setProducts(res.data.products)).catch(() => {});
  }, []);

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  const handlePrint = () => {
    window.print();
  };

  const selectProduct = (p: Product) => {
    setSelectedProduct(p);
    setSearch(p.name);
    setShowDropdown(false);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="print:hidden">
        <Topbar title="Barcode Generator" />
      </div>
      
      <main className="flex-1 p-6 space-y-6 max-w-5xl mx-auto w-full print:p-0 print:m-0 print:w-full print:max-w-none">
        <div className="print:hidden">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#D4D4D4]" /> Barcode Generator
          </h2>
          <p className="text-[#94a3b8] text-sm mt-1">Generate and print barcode sticker grids for your products.</p>
        </div>

        {/* Controls - Hidden during print */}
        <div className="glass rounded-2xl p-6 border border-[#1A1A1A] grid grid-cols-1 md:grid-cols-3 gap-6 print:hidden">
          <div className="md:col-span-2 relative">
            <label className="block text-xs font-medium text-[#94a3b8] mb-1.5">Select Product</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#475569]" />
              <input value={search} onChange={e => { setSearch(e.target.value); setShowDropdown(true); if(!e.target.value) setSelectedProduct(null); }}
                onFocus={() => setShowDropdown(true)} placeholder="Search inventory..."
                className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-[#0A0A0A] border border-[#1A1A1A] text-white placeholder-[#475569] focus:outline-none focus:border-[#D4D4D4] text-sm transition" />
            </div>
            {showDropdown && filteredProducts.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[#0A0A0A] border border-[#1A1A1A] rounded-xl shadow-xl z-20 max-h-48 overflow-y-auto">
                {filteredProducts.slice(0, 10).map(p => (
                  <button key={p._id} onClick={() => selectProduct(p)} className="w-full text-left px-4 py-3 hover:bg-[#111111] transition text-sm flex justify-between">
                    <span className="text-white font-medium">{p.name}</span>
                    <span className="text-emerald-400 font-medium">₹{p.sellingPrice}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <div>
            <label className="block text-xs font-medium text-[#94a3b8] mb-1.5">Quantity (Stickers)</label>
            <input type="number" value={quantity} onChange={e => setQuantity(parseInt(e.target.value) || 0)} min="1" max="100"
              className="w-full px-4 py-2.5 rounded-lg bg-[#0A0A0A] border border-[#1A1A1A] text-white focus:outline-none focus:border-[#D4D4D4] text-sm transition" />
          </div>

          <div className="md:col-span-3 flex justify-end">
            <button onClick={handlePrint} disabled={!selectedProduct}
              className="px-6 py-2.5 rounded-xl bg-white text-black hover:bg-gray-200 font-semibold flex items-center gap-2 hover:opacity-90 disabled:opacity-50 transition shadow-lg shadow-white/10/30">
              <Printer className="w-4 h-4" /> Print Barcodes
            </button>
          </div>
        </div>

        {/* Print Preview Grid */}
        <div className="glass rounded-2xl p-6 border border-[#1A1A1A] print:glass-none print:border-none print:p-0 print:block">
          <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-6 print:hidden">Print Preview</h3>
          
          {selectedProduct ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 print:grid-cols-4 print:gap-2">
              {Array.from({ length: quantity }).map((_, i) => (
                <div key={i} className="bg-white p-3 rounded-lg flex flex-col items-center justify-center border border-gray-200 print:border-dashed print:border-gray-400 print:rounded-none">
                  <p className="text-black text-xs font-bold mb-1 truncate w-full text-center">{selectedProduct.name}</p>
                  <Barcode value={selectedProduct.sku || selectedProduct._id.substring(0, 10)} width={1.2} height={40} fontSize={12} margin={0} />
                  <p className="text-black text-xs font-bold mt-1">₹{selectedProduct.sellingPrice.toFixed(2)}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-[#475569] print:hidden">
              <Barcode value="123456789" width={1.5} height={50} displayValue={false} lineColor="#475569" background="transparent" />
              <p className="mt-4 text-sm">Select a product to preview barcodes</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
