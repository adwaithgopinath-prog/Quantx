import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Command, TrendingUp, ArrowUpRight, ArrowDownRight, Globe, BarChart2, Zap, Briefcase, Calculator } from 'lucide-react';
import api from '../api';
import { useSymbol } from '../context/SymbolContext';

const DM_MONO = "font-mono";
const SYNE = "font-[Syne]";

export default function GlobalSearch({ variant }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeType, setActiveType] = useState('ALL');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState([]);
  const [trendingData, setTrendingData] = useState({ trending: [], gainers: [], losers: [] });
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  const navigate = useNavigate();
  const { setActiveSymbol } = useSymbol();
  const inputRef = useRef(null);
  const modalRef = useRef(null);
  const abortControllerRef = useRef(null);
  const cacheRef = useRef(new Map());

  // Load recent searches
  useEffect(() => {
    const saved = localStorage.getItem('quantx_recent_searches');
    if (saved) setRecentSearches(JSON.parse(saved));
  }, []);

  // Keyboard shortcut Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch trending data once on open
  useEffect(() => {
    if (isOpen && !isDataLoaded) {
      const fetchMovers = async () => {
        try {
          const [trending, gainers, losers] = await Promise.all([
            api.get('/api/markets/movers?sort=volume&limit=8'),
            api.get('/api/markets/movers?sort=gainers&limit=5'),
            api.get('/api/markets/movers?sort=losers&limit=5')
          ]);
          setTrendingData({
            trending: trending.data,
            gainers: gainers.data,
            losers: losers.data
          });
          setIsDataLoaded(true);
          // Cache for 60s
          setTimeout(() => setIsDataLoaded(false), 60000);
        } catch (err) {
          console.error("Failed to fetch movers", err);
        }
      };
      fetchMovers();
    }
  }, [isOpen, isDataLoaded]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current.focus(), 100);
    }
  }, [isOpen]);

  // Search API call with debounce
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      const cacheKey = `${query}_${activeType}`;
      if (cacheRef.current.has(cacheKey)) {
        setResults(cacheRef.current.get(cacheKey));
        return;
      }

      setLoading(true);
      if (abortControllerRef.current) abortControllerRef.current.abort();
      abortControllerRef.current = new AbortController();

      try {
        const res = await api.get(`/api/search?q=${query}&type=${activeType}`, {
          signal: abortControllerRef.current.signal
        });
        setResults(res.data);
        cacheRef.current.set(cacheKey, res.data);
        // Expire cache in 30s
        setTimeout(() => cacheRef.current.delete(cacheKey), 30000);
      } catch (err) {
        if (err.name !== 'CanceledError') console.error(err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query, activeType]);

  const handleSelect = (item) => {
    const symbol = item.yf_symbol || item.symbol;
    setActiveSymbol(symbol);
    
    // Save to recent
    const newRecent = [symbol, ...recentSearches.filter(s => s !== symbol)].slice(0, 8);
    setRecentSearches(newRecent);
    localStorage.setItem('quantx_recent_searches', JSON.stringify(newRecent));

    setIsOpen(false);
    setQuery('');
    navigate('/dashboard');
  };

  const removeRecent = (symbol) => {
    const newRecent = recentSearches.filter(s => s !== symbol);
    setRecentSearches(newRecent);
    localStorage.setItem('quantx_recent_searches', JSON.stringify(newRecent));
  };

  const clearAllRecent = () => {
    setRecentSearches([]);
    localStorage.removeItem('quantx_recent_searches');
  };

  const handleKeyDown = (e) => {
    if (results.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
    } else if (e.key === 'Enter') {
      handleSelect(results[selectedIndex]);
    }
  };

  const getTypeIcon = (type) => {
    switch(type) {
      case 'STOCK': return <TrendingUp size={14} className="text-[#00E5A0]" />;
      case 'INDEX': return <BarChart2 size={14} className="text-[#C9A84C]" />;
      case 'ETF': return <Briefcase size={14} className="text-blue-400" />;
      case 'GLOBAL': return <Globe size={14} className="text-purple-400" />;
      case 'CRYPTO': return <Zap size={14} className="text-orange-400" />;
      default: return <TrendingUp size={14} />;
    }
  };

  const getExchangeBadgeStyle = (exchange) => {
    switch(exchange) {
      case 'NSE': return "bg-[#00E5A0]/10 text-[#00E5A0]";
      case 'BSE': return "bg-blue-500/10 text-blue-500";
      case 'NASDAQ':
      case 'NYSE': return "bg-purple-500/10 text-purple-500";
      case 'CRYPTO': return "bg-orange-500/10 text-orange-500";
      default: return "bg-white/10 text-gray-400";
    }
  };

  if (variant === 'topbar') {
    return (
      <div 
        className="w-[40%] h-9 bg-white/[0.06] border border-[#C9A84C]/20 rounded-md px-3 flex items-center gap-2 cursor-pointer hover:bg-white/[0.08] transition-all group"
        onClick={() => setIsOpen(true)}
      >
        <Search size={14} className="text-gray-500 group-hover:text-[#C9A84C]" />
        <span className="flex-1 text-[#8A9AB5] text-xs font-mono truncate">Search stocks, ETFs, indices, crypto...</span>
        <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-white/5 rounded border border-white/5 text-[9px] font-mono text-gray-600">
           <span>Ctrl</span><span>K</span>
        </div>
      </div>
    );
  }

  if (variant === 'sidebar') {
    return (
      <div className="px-4 mb-4">
        <div 
          className="w-full h-8 bg-white/[0.04] border border-white/[0.08] rounded flex items-center gap-2 px-3 cursor-pointer hover:bg-white/[0.06] transition-all"
          onClick={() => setIsOpen(true)}
        >
          <Search size={12} className="text-gray-600" />
          <span className="text-gray-600 text-[10px] font-bold uppercase tracking-wider">Search...</span>
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[1000]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20, x: '-50%' }}
            animate={{ opacity: 1, scale: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, scale: 0.95, y: -20, x: '-50%' }}
            transition={{ duration: 0.15 }}
            className="fixed top-[15vh] left-1/2 w-full max-w-[640px] bg-[#0D1018] border border-[#C9A84C]/20 rounded-xl shadow-[0_40px_80px_rgba(0,0,0,0.8)] z-[1001] flex flex-col overflow-hidden"
          >
            {/* Input Header */}
            <div className="p-4 flex items-center gap-4 border-b border-white/5">
              <Search size={20} className="text-[#C9A84C]" />
              <input 
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search stocks, ETFs, indices, crypto..."
                className="flex-1 bg-transparent border-none outline-none text-lg text-white placeholder:text-gray-600 font-mono caret-[#C9A84C]"
              />
              <div className="text-[10px] font-bold text-gray-600 border border-white/10 px-1.5 py-0.5 rounded">ESC</div>
            </div>

            {/* Filter Pills */}
            <div className="px-4 py-3 flex gap-2 overflow-x-auto no-scrollbar border-b border-white/5">
              {['ALL', 'STOCK', 'ETF', 'INDEX', 'GLOBAL', 'CRYPTO'].map(type => (
                <button
                  key={type}
                  onClick={() => setActiveType(type)}
                  className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all border ${
                    activeType === type 
                    ? 'bg-[#C9A84C] text-[#0D1018] border-[#C9A84C]' 
                    : 'bg-transparent text-[#8A9AB5] border-white/10 hover:border-[#C9A84C]/50'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            {/* Results / Empty State */}
            <div className="flex-1 overflow-y-auto max-height-[50vh] no-scrollbar">
              {query.trim() === '' ? (
                <div className="p-6 space-y-8">
                  {/* Recent Searches */}
                  {recentSearches.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <h4 className="text-[8px] font-bold text-gray-500 uppercase tracking-[0.25em]">Recent Searches</h4>
                        <button onClick={clearAllRecent} className="text-[8px] font-bold text-[#C9A84C] uppercase tracking-widest hover:underline">Clear all</button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {recentSearches.map(sym => (
                          <div key={sym} className="flex items-center gap-2 bg-white/5 border border-white/5 px-3 py-1.5 rounded-md group hover:border-[#C9A84C]/30 transition-all">
                            <span 
                              onClick={() => handleSelect({ symbol: sym })}
                              className="text-xs font-mono text-silver cursor-pointer hover:text-white"
                            >
                              {sym}
                            </span>
                            <X size={12} onClick={() => removeRecent(sym)} className="text-gray-600 hover:text-red-400 cursor-pointer" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Trending */}
                  <div className="space-y-3">
                    <h4 className="text-[8px] font-bold text-gray-500 uppercase tracking-[0.25em]">Trending Today</h4>
                    <div className="flex flex-wrap gap-3">
                      {trendingData.trending.map(item => (
                        <button 
                          key={item.symbol} 
                          onClick={() => handleSelect(item)}
                          className="flex items-center gap-2 bg-white/5 border border-white/5 px-3 py-2 rounded-lg hover:border-[#C9A84C]/30 transition-all group"
                        >
                          <span className="text-xs font-bold font-mono group-hover:text-[#C9A84C]">{item.symbol}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${getExchangeBadgeStyle('NSE')}`}>NSE</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Gainers / Losers Grid */}
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <h4 className="text-[8px] font-bold text-[#00E5A0] uppercase tracking-[0.25em]">Top Gainers</h4>
                      <div className="space-y-1">
                        {trendingData.gainers.map(item => (
                          <div 
                            key={item.symbol} 
                            onClick={() => handleSelect(item)}
                            className="flex justify-between items-center p-2 rounded hover:bg-white/5 cursor-pointer transition-all group"
                          >
                            <div className="flex flex-col">
                              <span className="text-xs font-bold font-mono group-hover:text-[#00E5A0]">{item.symbol}</span>
                              <span className="text-[9px] text-gray-600 uppercase truncate max-w-[100px]">{item.name}</span>
                            </div>
                            <span className="text-xs font-mono text-[#00E5A0]">+{item.change_pct}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-3">
                      <h4 className="text-[8px] font-bold text-[#FF3D5A] uppercase tracking-[0.25em]">Top Losers</h4>
                      <div className="space-y-1">
                        {trendingData.losers.map(item => (
                          <div 
                            key={item.symbol} 
                            onClick={() => handleSelect(item)}
                            className="flex justify-between items-center p-2 rounded hover:bg-white/5 cursor-pointer transition-all group"
                          >
                            <div className="flex flex-col">
                              <span className="text-xs font-bold font-mono group-hover:text-[#FF3D5A]">{item.symbol}</span>
                              <span className="text-[9px] text-gray-600 uppercase truncate max-w-[100px]">{item.name}</span>
                            </div>
                            <span className="text-xs font-mono text-[#FF3D5A]">{item.change_pct}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-2">
                  {results.length > 0 ? (
                    results.map((item, index) => (
                      <div
                        key={`${item.symbol}_${item.exchange}`}
                        onClick={() => handleSelect(item)}
                        onMouseEnter={() => setSelectedIndex(index)}
                        className={`h-12 px-4 flex items-center gap-4 cursor-pointer transition-all relative ${
                          selectedIndex === index ? 'bg-[#C9A84C]/10 border-l-2 border-[#C9A84C]' : 'border-l-2 border-transparent'
                        }`}
                      >
                        <div className="w-8 flex justify-center">{getTypeIcon(item.type)}</div>
                        <div className="flex-1 flex items-center gap-4">
                           <span className="w-24 text-sm font-bold text-[#C9A84C] font-mono">{item.symbol}</span>
                           <span className="flex-1 text-xs text-[#8A9AB5] font-mono truncate">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-4">
                           <span className={`px-2 py-0.5 rounded-[4px] text-[9px] font-bold uppercase tracking-wider ${getExchangeBadgeStyle(item.exchange)}`}>
                             {item.exchange}
                           </span>
                           {index < 5 && item.price && (
                             <div className="w-24 text-right flex flex-col justify-center">
                                <span className="text-xs font-mono text-white">₹{item.price.toLocaleString()}</span>
                                <span className={`text-[10px] font-mono ${item.change_pct >= 0 ? 'text-[#00E5A0]' : 'text-[#FF3D5A]'}`}>
                                  {item.change_pct >= 0 ? '+' : ''}{item.change_pct}%
                                </span>
                             </div>
                           )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-12 text-center text-gray-600 text-xs font-mono uppercase tracking-[0.2em]">
                      {loading ? 'Searching Universe...' : 'No instruments found'}
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
