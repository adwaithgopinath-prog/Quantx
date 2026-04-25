import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, TrendingUp, TrendingDown, Clock, Globe, BarChart3, Database, Coins, ArrowUpRight, ArrowDownRight, Command } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api';
import { useSymbol } from '../context/SymbolContext';

const DEBOUNCE_MS = 200;

export default function StockSearch({ isCollapsed, setActiveTab }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [movers, setMovers] = useState({ gainers: [], losers: [], trending: [] });
  const [recentSearches, setRecentSearches] = useState([]);
  
  const { setActiveSymbol } = useSymbol();
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recent_searches');
    if (saved) setRecentSearches(JSON.parse(saved));
  }, []);

  // Fetch movers for discovery panel
  useEffect(() => {
    const fetchMovers = async () => {
      try {
        const [g, l, t] = await Promise.all([
          api.get('/api/markets/movers?sort=gainers'),
          api.get('/api/markets/movers?sort=losers'),
          api.get('/api/markets/movers?sort=volume')
        ]);
        setMovers({ gainers: g.data.slice(0, 5), losers: l.data.slice(0, 5), trending: t.data.slice(0, 5) });
      } catch (err) {
        console.error("Movers fetch failed", err);
      }
    };
    if (isOpen && !query) fetchMovers();
  }, [isOpen, query]);

  // Search logic with debounce
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await api.get(`/api/search?q=${query}&type=${activeFilter}`);
        setResults(res.data);
      } catch (err) {
        console.error("Search failed", err);
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query, activeFilter]);

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
    setActiveSymbol(stock.yf_symbol || stock.symbol);
    
    // Update recent searches
    const updatedRecent = [stock, ...recentSearches.filter(s => s.symbol !== stock.symbol)].slice(0, 8);
    setRecentSearches(updatedRecent);
    localStorage.setItem('recent_searches', JSON.stringify(updatedRecent));
    
    if (setActiveTab) setActiveTab('Explore');
    setIsOpen(false);
    setQuery('');
  };

  const removeRecent = (e, symbol) => {
    e.stopPropagation();
    const updated = recentSearches.filter(s => s.symbol !== symbol);
    setRecentSearches(updated);
    localStorage.setItem('recent_searches', JSON.stringify(updated));
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'STOCK': return <BarChart3 size={14} className="text-emerald-500" />;
      case 'INDEX': return <Globe size={14} className="text-blue-500" />;
      case 'ETF': return <Database size={14} className="text-amber-500" />;
      case 'GLOBAL': return <Globe size={14} className="text-purple-500" />;
      case 'CRYPTO': return <Coins size={14} className="text-orange-500" />;
      default: return <BarChart3 size={14} />;
    }
  };

  const getExchangeColor = (ex) => {
    switch (ex) {
      case 'NSE': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      case 'BSE': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'NASDAQ': return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
      case 'CRYPTO': return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const groupedResults = results.reduce((acc, stock) => {
    const type = stock.type || 'OTHER';
    if (!acc[type]) acc[type] = [];
    acc[type].push(stock);
    return acc;
  }, {});

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
            <span className="text-xs font-bold text-gray-400 truncate">Search stocks, ETFs, indices...</span>
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
              className="absolute inset-0 bg-white/60 backdrop-blur-xl"
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
                  placeholder="Search stocks, ETFs, indices, crypto..."
                  className="flex-1 bg-transparent border-none outline-none text-lg font-bold text-[#44475b] placeholder:text-gray-300"
                />
                {query && (
                  <button onClick={() => setQuery('')} className="p-2 hover:bg-gray-50 rounded-full text-gray-400 transition-colors">
                    <X size={20} />
                  </button>
                )}
              </div>

              {/* Filter Pills */}
              <div className="px-6 py-3 flex gap-2 overflow-x-auto no-scrollbar border-b border-gray-50 bg-gray-50/30">
                {['ALL', 'STOCK', 'ETF', 'INDEX', 'GLOBAL', 'CRYPTO'].map(f => (
                  <button
                    key={f}
                    onClick={() => setActiveFilter(f)}
                    className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${activeFilter === f ? 'bg-[#00d09c] text-white border-[#00d09c] shadow-md shadow-emerald-500/20' : 'bg-white text-gray-400 border-gray-100 hover:border-[#00d09c]/30 hover:text-[#00d09c]'}`}
                  >
                    {f}
                  </button>
                ))}
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                {!query ? (
                  /* Discovery Panel */
                  <div className="p-4 space-y-8">
                    {/* Recent Searches */}
                    {recentSearches.length > 0 && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 px-2">
                          <Clock size={14} className="text-gray-400" />
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Recent Searches</span>
                        </div>
                        <div className="flex flex-wrap gap-2 px-2">
                          {recentSearches.map(s => (
                            <button
                              key={s.symbol}
                              onClick={() => handleSelect(s)}
                              className="group flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-[#00d09c]/10 rounded-xl border border-gray-100 hover:border-[#00d09c]/20 transition-all"
                            >
                              <span className="text-xs font-black text-[#44475b] group-hover:text-[#00d09c]">{s.symbol}</span>
                              <X size={12} className="text-gray-300 hover:text-rose-500" onClick={(e) => removeRecent(e, s.symbol)} />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Trending / Movers */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-2">
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <TrendingUp size={14} className="text-emerald-500" />
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Top Gainers</span>
                        </div>
                        <div className="space-y-1">
                          {movers.gainers.map(s => (
                            <button
                              key={s.symbol}
                              onClick={() => handleSelect(s)}
                              className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-2xl transition-all group"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center font-black text-[10px]">{s.symbol[0]}</div>
                                <div className="text-left">
                                  <p className="text-xs font-black text-[#44475b]">{s.symbol.split('.')[0]}</p>
                                  <p className="text-[10px] font-bold text-gray-400 uppercase">{s.exchange}</p>
                                </div>
                              </div>
                              <span className="text-xs font-black text-emerald-500">+{s.change_pct}%</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <TrendingDown size={14} className="text-rose-500" />
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Top Losers</span>
                        </div>
                        <div className="space-y-1">
                          {movers.losers.map(s => (
                            <button
                              key={s.symbol}
                              onClick={() => handleSelect(s)}
                              className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-2xl transition-all group"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center font-black text-[10px]">{s.symbol[0]}</div>
                                <div className="text-left">
                                  <p className="text-xs font-black text-[#44475b]">{s.symbol.split('.')[0]}</p>
                                  <p className="text-[10px] font-bold text-gray-400 uppercase">{s.exchange}</p>
                                </div>
                              </div>
                              <span className="text-xs font-black text-rose-500">{s.change_pct}%</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Search Results */
                  <div className="space-y-6 p-2">
                    {Object.entries(groupedResults).map(([type, stocks]) => (
                      <div key={type} className="space-y-2">
                        <div className="px-4 py-2 flex items-center gap-2">
                          <div className="flex-1 h-px bg-gray-50" />
                          <span className="text-[9px] font-black text-gray-300 uppercase tracking-[0.3em]">{type}</span>
                          <div className="flex-1 h-px bg-gray-50" />
                        </div>
                        {stocks.map(s => (
                          <button
                            key={`${s.symbol}-${s.exchange}`}
                            onClick={() => handleSelect(s)}
                            className="w-full flex items-center justify-between p-4 hover:bg-[#00d09c]/5 rounded-2xl group transition-all"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center group-hover:bg-white transition-colors border border-transparent group-hover:border-gray-100 shadow-sm">
                                {getTypeIcon(s.type)}
                              </div>
                              <div className="text-left">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-black text-[#44475b]">{s.symbol}</span>
                                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-black border uppercase ${getExchangeColor(s.exchange)}`}>
                                    {s.exchange}
                                  </span>
                                </div>
                                <p className="text-xs font-bold text-gray-400 line-clamp-1">{s.name}</p>
                              </div>
                            </div>
                            
                            {s.price && (
                              <div className="text-right">
                                <p className="text-sm font-black text-[#44475b] font-mono">
                                  {s.exchange === 'NASDAQ' ? '$' : '₹'}{s.price.toLocaleString()}
                                </p>
                                <div className={`flex items-center justify-end gap-1 text-[10px] font-black font-mono ${s.change_pct >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                  {s.change_pct >= 0 ? <ArrowUpRight size={10}/> : <ArrowDownRight size={10}/>}
                                  {Math.abs(s.change_pct)}%
                                </div>
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    ))}

                    {results.length === 0 && !loading && (
                      <div className="py-20 flex flex-col items-center justify-center text-center opacity-50">
                        <Search size={48} className="text-gray-200 mb-4" />
                        <p className="text-sm font-bold text-gray-400">No instruments found matching "{query}"</p>
                        <p className="text-xs text-gray-300">Try a different symbol or name</p>
                      </div>
                    )}
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
