'use client';
import { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Tag, IndianRupee, Info, X } from 'lucide-react';
import { productsApi } from '../../lib/erp-api';

export default function ProductQuickSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: any) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [wrapperRef]);

  useEffect(() => {
    const search = async () => {
      if (query.trim().length < 2) {
        setResults([]);
        setIsOpen(false);
        return;
      }
      setLoading(true);
      try {
        const { data } = await productsApi.getAll({ search: query, limit: 5 });
        setResults(data.products || []);
        setIsOpen(true);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    const timeoutId = setTimeout(search, 300);
    return () => clearTimeout(timeoutId);
  }, [query]);

  return (
    <div className="relative w-full max-w-md z-30" ref={wrapperRef}>
      <div className="relative flex items-center">
        <Search className="absolute left-3 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { if (results.length > 0) setIsOpen(true); }}
          placeholder="Quick search products..."
          className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-action-500 focus:ring-2 focus:ring-action-100 shadow-sm transition-all"
        />
        {loading && <div className="absolute right-3 w-4 h-4 border-2 border-slate-200 border-t-action-500 rounded-full animate-spin" />}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden py-1 max-h-80 overflow-y-auto">
          {results.map((p) => (
            <button
              key={p._id}
              onClick={() => {
                setSelectedProduct(p);
                setIsOpen(false);
                setQuery('');
              }}
              className="w-full flex items-start gap-3 p-3 hover:bg-slate-50 transition text-left border-b border-slate-50 last:border-0"
            >
              <div className="w-10 h-10 rounded bg-slate-100 flex items-center justify-center shrink-0">
                <Tag className="w-5 h-5 text-slate-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">{p.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded">Stock: {p.stock || 0}</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 bg-green-50 text-green-700 rounded border border-green-100">₹{p.salesPrice}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {selectedProduct && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button 
              onClick={() => setSelectedProduct(null)}
              className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="bg-slate-50 border-b border-slate-100 p-5 pt-8 text-center">
              <div className="w-16 h-16 bg-white border-2 border-slate-200 rounded-2xl shadow-sm mx-auto flex items-center justify-center mb-3">
                <Tag className="w-8 h-8 text-indigo-500" />
              </div>
              <h3 className="font-bold text-lg text-slate-900">{selectedProduct.name}</h3>
              <p className="text-xs text-slate-500 font-mono mt-1">{selectedProduct.itemCode || 'No Code'}</p>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">Selling Price</span>
                  <div className="text-sm font-bold text-emerald-700 flex items-center gap-1">
                    <IndianRupee className="w-3.5 h-3.5" />
                    {selectedProduct.salesPrice}
                  </div>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">Purchase Price</span>
                  <div className="text-sm font-bold text-slate-700 flex items-center gap-1">
                    <IndianRupee className="w-3.5 h-3.5" />
                    {selectedProduct.purchasePrice || 0}
                  </div>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">Current Stock</span>
                  <div className="text-sm font-bold text-slate-900">
                    {selectedProduct.stock || 0} {selectedProduct.primaryUnit || 'Units'}
                  </div>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">Location</span>
                  <div className="text-sm font-bold text-slate-700 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {selectedProduct.location || 'Not Set'}
                  </div>
                </div>
              </div>
              <div className="pt-2">
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                  <Info className="w-3.5 h-3.5" />
                  <span className="font-semibold">Category:</span> {selectedProduct.category || 'N/A'}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Tag className="w-3.5 h-3.5" />
                  <span className="font-semibold">Brand:</span> {selectedProduct.brand || 'N/A'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
