import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSymbol } from '../context/SymbolContext';
import { ChevronRight, ChevronDown, RefreshCw, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api';

const RANGES = [
  { key: 'Penny',    label: 'Penny',       color: '#8A9AB5' },
  { key: 'Mid',      label: 'Mid',         color: '#4E9FFF' },
  { key: 'Large',    label: 'Large',       color: '#C9A84C' },
  { key: 'Bluechip', label: 'Bluechip',    color: '#00E5A0' },
];

const DM_MONO = "font-mono";
const SYNE = "font-[Syne]";

function MiniSparkline({ symbol, isUp }) {
  // Generate pseudo-random points based on symbol for consistency
  const generateSparkPoints = (sym, up) => {
    let hash = 0;
    for (let i = 0; i < sym.length; i++) hash = sym.charCodeAt(i) + ((hash << 5) - hash);
    const seed = Math.abs(hash);
    const points = [];
    let last = up ? 40 : 60;
    for (let i = 0; i < 5; i++) {
        const step = (Math.sin(seed + i) * 10) + (up ? 5 : -5);
        last += step;
        points.push(last);
    }
    return points;
  };

  const points = generateSparkPoints(symbol, isUp);
  const w = 32, h = 12;
  const minP = Math.min(...points);
  const maxP = Math.max(...points);
  const range = maxP - minP || 1;
  const coords = points.map((p, i) =>
    `${(i/(points.length-1))*w},${h - ((p-minP)/range)*h}`
  ).join(' ');

  return (
    <svg width={w} height={h} style={{ opacity: 0.6 }} className="mx-2">
      <polyline
        points={coords}
        fill="none"
        stroke={isUp ? '#00E5A0' : '#FF3D5A'}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const SkeletonRow = () => (
  <div className="h-11 px-3 flex items-center justify-between border-b border-white/5">
    <div className="flex items-center gap-2">
        <div className="w-4 h-3 bg-white/5 rounded animate-pulse" />
        <div className="space-y-1">
            <div className="w-12 h-3 bg-white/5 rounded animate-pulse" />
            <div className="w-16 h-2 bg-white/5 rounded animate-pulse" />
        </div>
    </div>
    <div className="text-right space-y-1">
        <div className="w-10 h-3 bg-white/5 rounded animate-pulse" />
        <div className="w-8 h-2 bg-white/5 rounded animate-pulse ml-auto" />
    </div>
  </div>
);

export default function PriceRangeSidebar() {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expanded, setExpanded] = useState({ Penny: true });
  const [lastUpdated, setLastUpdated] = useState(null);
  const { setActiveSymbol } = useSymbol();
  const navigate = useNavigate();

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await api.get('/api/markets/all-price-ranges');
      setData(res.data);
      setLastUpdated(new Date());
    } catch (e) {
      console.error('Price range fetch failed:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), 300000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleStockClick = (symbol) => {
    setActiveSymbol(symbol);
    navigate('/dashboard');
  };

  const toggleSection = (key) => {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const getUpdatedTimeLabel = () => {
    if (!lastUpdated) return '';
    const diff = Math.floor((new Date() - lastUpdated) / 60000);
    if (diff === 0) return 'Just now';
    return `Updated ${diff} min ago`;
  };

  return (
    <div className="flex flex-col h-full bg-[#0D1018]/40 border-l border-white/5 select-none">
      {/* HEADER */}
      <div className="p-4 border-b border-white/5 space-y-1 bg-[#060810]/40">
        <div className="flex justify-between items-center">
            <span className="text-[8px] font-bold text-[#C9A84C] uppercase tracking-[2.5px]">Stocks by Price Range</span>
            <button 
                onClick={() => fetchData(true)}
                className={`p-1.5 rounded-lg hover:bg-white/5 text-gray-500 hover:text-[#C9A84C] transition-all ${refreshing ? 'animate-spin' : ''}`}
            >
                <RefreshCw size={12} />
            </button>
        </div>
        <div className="text-[8px] font-mono text-gray-600 uppercase tracking-wider">{getUpdatedTimeLabel()}</div>
      </div>

      {/* SECTIONS */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-10">
        {RANGES.map((range) => {
          const rangeData = data[range.key] || { stocks: [] };
          const isExpanded = expanded[range.key];

          return (
            <div key={range.key} className="border-b border-white/5 last:border-0">
              {/* SECTION HEADER */}
              <button 
                onClick={() => toggleSection(range.key)}
                className="w-full flex items-center p-3 bg-white/[0.02] hover:bg-white/[0.04] transition-all group relative overflow-hidden"
              >
                <div className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ backgroundColor: range.color }} />
                <div className="flex-1 flex flex-col items-start gap-0.5 ml-1">
                   <div className="flex items-center gap-2">
                       {isExpanded ? <ChevronDown size={12} className="text-gray-500" /> : <ChevronRight size={12} className="text-gray-500" />}
                       <span className={`text-[11px] font-bold uppercase tracking-wider ${SYNE}`}>{range.label}</span>
                   </div>
                   <div className="text-[8px] font-bold text-gray-600 uppercase ml-5">
                       {loading ? '---' : `${rangeData.stocks.length} stocks · top gainers`}
                   </div>
                </div>
              </button>

              {/* STOCK LIST */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden bg-[#060810]/20"
                  >
                    {loading ? Array(5).fill(0).map((_, i) => <SkeletonRow key={i} />) : 
                     rangeData.stocks.length === 0 ? (
                       <div className="p-6 text-center text-[10px] text-gray-600 italic">No data available</div>
                     ) : (
                      rangeData.stocks.map((stock, idx) => (
                        <div 
                          key={stock.symbol}
                          onClick={() => handleStockClick(stock.symbol)}
                          className="h-11 px-3 flex items-center justify-between border-b border-white/[0.03] last:border-0 cursor-pointer hover:bg-[#C9A84C]/5 transition-all group relative"
                        >
                          <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#C9A84C] scale-y-0 group-hover:scale-y-100 transition-transform origin-center" />
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-bold text-[#C9A84C] w-4">#{idx + 1}</span>
                            <div className="flex flex-col min-w-0">
                                <span className={`text-[11px] font-bold text-white group-hover:text-[#C9A84C] transition-colors truncate ${DM_MONO}`}>{stock.symbol}</span>
                                <span className="text-[8px] text-gray-600 uppercase truncate max-w-[80px]">{stock.name}</span>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <MiniSparkline symbol={stock.symbol} isUp={stock.change_pct >= 0} />
                            <div className="text-right flex flex-col">
                                <span className={`text-[11px] font-bold text-white ${DM_MONO}`}>₹{stock.price.toLocaleString()}</span>
                                <div className={`text-[10px] font-bold flex items-center justify-end gap-1 ${DM_MONO} ${stock.change_pct >= 0 ? 'text-[#00E5A0]' : 'text-[#FF3D5A]'}`}>
                                    <span>{stock.change_pct > 0 ? '▲' : '▼'}</span>
                                    <span>{Math.abs(stock.change_pct).toFixed(1)}%</span>
                                </div>
                            </div>
                          </div>
                        </div>
                      ))
                     )
                    }
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
