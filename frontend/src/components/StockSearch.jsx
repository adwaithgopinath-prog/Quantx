import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Globe, BarChart3, Command, ChevronDown, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api';
import { useSymbol } from '../context/SymbolContext';

const DEBOUNCE_MS = 300;

export default function StockSearch({ isCollapsed, setActiveTab }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('ALL'); // ALL, NSE, BSE, GLOBAL
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  
  const { setActiveSymbol } = useSymbol();
  const inputRef = useRef(null);
  const scrollRef = useRef(null);

  // Search logic
  const fetchStocks = useCallback(async (searchQuery, filter, pageNum, append = false) => {
    setLoading(true);
    try {
      let data;
      if (filter === 'GLOBAL') {
        const res = await api.get('/api/stocks/list/global');
        // Client-side filtering for global since it's a fixed list
        const allGlobal = res.data;
        const filtered = searchQuery 
          ? allGlobal.filter(s => 
              s.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || 
              s.display.toLowerCase().includes(searchQuery.toLowerCase())
            )
          : allGlobal;
        
        data = {
          stocks: filtered.slice((pageNum - 1) * 50, pageNum * 50),
          total: filtered.length
        };
      } else {
        const res = await api.get(`/api/stocks/list`, {
          params: {
            query: searchQuery,
            exchange: filter,
            page: pageNum,
            limit: 50
          }
        });
        data = res.data;
      }

      if (append) {
        setResults(prev => [...prev, ...data.stocks]);
      } else {
        setResults(data.stocks);
      }
      setTotal(data.total);
      setHasMore(data.stocks.length === 50 && (pageNum * 50) < data.total);
    } catch (err) {
      console.error("Search failed", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isOpen) {
        setPage(1);
        fetchStocks(query, activeFilter, 1);
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query, activeFilter, isOpen, fetchStocks]);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchStocks(query, activeFilter, nextPage, true);
  };

  // Global hotkey (Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSelect = (stock) => {
    setActiveSymbol(stock.symbol);
    if (setActiveTab) setActiveTab('Explore');
    setIsOpen(false);
    setQuery('');
  };

  const getExchangeColor = (ex) => {
    switch (ex) {
      case 'NSE': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      case 'BSE': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'GLOBAL': return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  return (
    <div className="relative px-4 mb-6">
      {/* Search Trigger */}
      <div 
        onClick={() => { setIsOpen(true); setTimeout(() => inputRef.current?.focus(), 100); }}
        className={`flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-2xl cursor-text group transition-all hover:bg-gray-100/80 ${isCollapsed ? 'p-3 justify-center' : 'p-3.5'}`}
      >
        <Search size={18} className="text-gray-400 group-hover:text-[#00d09c] transition-colors" />
        {!isCollapsed && (
          <div className="flex-1 flex justify-between items-center overflow-hidden">
            <span className="text-xs font-bold text-gray-400 truncate">Search {total > 0 ? `${total.toLocaleString()} ` : ''}stocks...</span>
            <div className="flex items-center gap-1 px-1.5 py-0.5 bg-gray-200/50 rounded-md text-[9px] font-black text-gray-500">
              <Command size={10} /> K
            </div>
          </div>
        )}
      </div>

      {/* Fullscreen Search Overlay */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex flex-col items-center pt-24 px-4 overflow-hidden">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-[#0a0b14]/40 backdrop-blur-md"
            />
            
            <motion.div 
              initial={{ opacity: 0, y: -20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.98 }}
              className="w-full max-w-2xl bg-white rounded-3xl shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] border border-gray-100 overflow-hidden relative z-10 flex flex-col max-h-[80vh]"
            >
              {/* Header Input */}
              <div className="p-6 border-b border-gray-50 flex items-center gap-4">
                <Search size={22} className={loading ? "text-[#00d09c] animate-pulse" : "text-gray-400"} />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by company name or symbol..."
                  className="flex-1 bg-transparent border-none outline-none text-lg font-bold text-[#44475b] placeholder:text-gray-300"
                />
                <div className="flex items-center gap-2">
                  {loading && <Loader2 size={18} className="text-[#00d09c] animate-spin" />}
                  {query && (
                    <button onClick={() => setQuery('')} className="p-2 hover:bg-gray-50 rounded-full text-gray-400 transition-colors">
                      <X size={20} />
                    </button>
                  )}
                </div>
              </div>

              {/* Filter Pills and Total Count */}
              <div className="px-6 py-3 flex items-center justify-between border-b border-gray-50 bg-gray-50/30">
                <div className="flex gap-2 overflow-x-auto no-scrollbar">
                  {['ALL', 'NSE', 'BSE', 'GLOBAL'].map(f => (
                    <button
                      key={f}
                      onClick={() => setActiveFilter(f)}
                      className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${activeFilter === f ? 'bg-[#00d09c] text-white border-[#00d09c] shadow-md shadow-emerald-500/20' : 'bg-white text-gray-400 border-gray-100 hover:border-[#00d09c]/30 hover:text-[#00d09c]'}`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                  {total.toLocaleString()} stocks available
                </div>
              </div>

              {/* Scrollable Content */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scrollbar p-2 min-h-[300px]">
                <div className="space-y-1">
                  {results.map((s, idx) => (
                    <button
                      key={`${s.symbol}-${s.exchange}-${idx}`}
                      onClick={() => handleSelect(s)}
                      className="w-full flex items-center justify-between p-4 hover:bg-[#00d09c]/5 rounded-2xl group transition-all border border-transparent hover:border-[#00d09c]/10"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center group-hover:bg-white transition-colors border border-transparent group-hover:border-gray-100 shadow-sm">
                          <BarChart3 size={18} className="text-gray-400 group-hover:text-[#00d09c]" />
                        </div>
                        <div className="text-left">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-[#44475b] group-hover:text-[#00d09c] transition-colors">{s.symbol}</span>
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-black border uppercase ${getExchangeColor(s.exchange)}`}>
                              {s.exchange}
                            </span>
                          </div>
                          <p className="text-xs font-bold text-gray-400 line-clamp-1">{s.display || s.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-gray-300 group-hover:text-[#00d09c] transition-colors">
                        <span className="text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity">{s.sector}</span>
                        <ChevronDown size={14} className="-rotate-90" />
                      </div>
                    </button>
                  ))}
                </div>

                {hasMore && (
                  <div className="p-4 flex justify-center">
                    <button 
                      onClick={loadMore}
                      disabled={loading}
                      className="px-6 py-2 bg-gray-50 hover:bg-gray-100 text-gray-500 text-xs font-black rounded-xl transition-all border border-gray-100"
                    >
                      {loading ? 'Loading...' : 'Load More Results'}
                    </button>
                  </div>
                )}

                {results.length === 0 && !loading && (
                  <div className="py-20 flex flex-col items-center justify-center text-center opacity-50">
                    <Search size={48} className="text-gray-200 mb-4" />
                    <p className="text-sm font-bold text-gray-400">No instruments found matching "{query}"</p>
                    <p className="text-xs text-gray-300">Try adjusting your filters or search term</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
