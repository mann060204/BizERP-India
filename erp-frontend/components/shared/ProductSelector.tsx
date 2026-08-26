'use client';
import { useState, useEffect, useRef } from 'react';
import { Search, Tag } from 'lucide-react';
import { productsApi } from '../../lib/erp-api';

interface ProductSelectorProps {
  onSelect: (product: any) => void;
  placeholder?: string;
}

export default function ProductSelector({ onSelect, placeholder = 'Search by name, SKU, or service...' }: ProductSelectorProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
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
        const { data } = await productsApi.list({ search: query, limit: 10 });
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

  const handleSelect = (p: any) => {
    onSelect(p);
    setQuery('');
    setIsOpen(false);
    setResults([]);
  };

  return (
    <div className="relative w-full z-20" ref={wrapperRef}>
      <div className="relative flex items-center">
        <Search className="absolute left-3 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { if (results.length > 0) setIsOpen(true); }}
          placeholder={placeholder}
          className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-sm transition-all"
        />
        {loading && <div className="absolute right-3 w-4 h-4 border-2 border-slate-200 border-t-indigo-500 rounded-full animate-spin" />}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden py-1 max-h-60 overflow-y-auto">
          {results.map((p) => (
            <button
              key={p._id}
              onClick={() => handleSelect(p)}
              className="w-full flex items-start gap-3 p-2 hover:bg-slate-50 transition text-left border-b border-slate-50 last:border-0"
            >
              <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center shrink-0">
                <Tag className="w-4 h-4 text-slate-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-900 leading-tight">{p.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-medium text-slate-500">{p.sku || 'No SKU'}</span>
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">{p.category || 'N/A'}</span>
                  <span className="text-[10px] font-semibold text-emerald-600">₹{p.sellingPrice}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
