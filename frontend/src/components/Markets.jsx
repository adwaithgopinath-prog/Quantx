import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, TrendingDown, Activity, PieChart, 
  BarChart3, Calendar, Search, ChevronRight, 
  ArrowUpRight, ArrowDownRight, RefreshCw, 
  Layers, Zap, Play
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSymbol } from '../context/SymbolContext';
import PriceRangeSidebar from './PriceRangeSidebar';
import toast from 'react-hot-toast';

const DM_MONO = "font-mono";
const SYNE = "font-[Syne]";

// Helper to format volume
const formatVol = (val) => {
  if (val >= 10000000) return (val / 10000000).toFixed(2) + 'Cr';
  if (val >= 100000) return (val / 100000).toFixed(2) + 'L';
  if (val >= 1000) return (val / 1000).toFixed(1) + 'K';
  return val;
};

// Skeleton Loader Component
const Skeleton = ({ className }) => (
  <div className={`bg-white/5 animate-pulse rounded ${className}`} />
);

export default function Markets() {
  const { setActiveSymbol } = useSymbol();
  const [activeTab, setActiveTab] = useState('Overview');
  const [indices, setIndices] = useState([]);
  const [movers, setMovers] = useState([]);
  const [moverSort, setMoverSort] = useState('volume');
  const [sectors, setSectors] = useState([]);
  const [earnings, setEarnings] = useState([]);
  const [priceRanges, setPriceRanges] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pinging, setPinging] = useState(false);
  const backendWakedUp = useRef(false);
  const navigate = useNavigate();

  const TABS = ['Overview', 'Stocks', 'Gainers', 'Losers', 'Most Active', 'Most Volatile', 'AI Screener', 'Earnings Calendar'];

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      // Backend Wake-up Ping (only on first load or if previously failed)
      if (!backendWakedUp.current && !isRefresh) {
        setPinging(true);
        try {
          await api.get('/api/ping');
          backendWakedUp.current = true;
        } catch (err) {
          if (!err.response) {
            console.warn("Backend still waking up...");
          }
        } finally {
          setPinging(false);
        }
      }

      const [idxRes, movRes, secRes, ernRes, prRes] = await Promise.all([
        api.get('/api/markets/indices'),
        api.get(`/api/markets/movers?sort=${moverSort}`),
        api.get('/api/markets/sectors'),
        api.get('/api/markets/earnings'),
        api.get('/api/markets/price-ranges')
      ]);

      setIndices(idxRes.data);
      setMovers(movRes.data);
      setSectors(secRes.data);
      setEarnings(ernRes.data);
      setPriceRanges(prRes.data);
    } catch (error) {
      console.error("Error fetching market data:", error);
      if (!error.response) {
        toast.error("Connecting to markets... (Backend might be waking up)");
      } else {
        toast.error("Failed to load market data");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [moverSort]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    
    // Mapping tabs to sorts
    if (tab === 'Gainers') { setMoverSort('gainers'); scrollToSection('stocks'); }
    else if (tab === 'Losers') { setMoverSort('losers'); scrollToSection('stocks'); }
    else if (tab === 'Most Active') { setMoverSort('volume'); scrollToSection('stocks'); }
    else if (tab === 'Most Volatile') { setMoverSort('volatile'); scrollToSection('stocks'); }
    else if (tab === 'Stocks') { scrollToSection('stocks'); }
    else {
      scrollToSection(tab.toLowerCase().replace(' ', '-'));
    }
  };

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      const offset = 120; // navbar + subnav height
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = el.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#060810] text-white">
      {/* Sticky Sub-Navigation */}
      <div className="sticky top-[56px] z-[150] bg-[#060810]/80 backdrop-blur-md border-b border-white/5 px-6">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between h-14 overflow-x-auto no-scrollbar">
          <div className="flex gap-8">
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => handleTabClick(tab)}
                className={`text-[11px] font-bold uppercase tracking-wider whitespace-nowrap transition-all relative py-4 ${
                  activeTab === tab ? 'text-[#C9A84C]' : 'text-gray-500 hover:text-white'
                }`}
              >
                {tab}
                {activeTab === tab && (
                  <motion.div 
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C9A84C]"
                  />
                )}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-4 text-[10px] text-gray-500 font-mono">
            {refreshing ? <RefreshCw size={12} className="animate-spin text-[#C9A84C]" /> : <div className="w-2 h-2 rounded-full bg-[#00E5A0] animate-pulse" />}
            MARKET DATA LIVE (refreshing in 60s)
          </div>
        </div>
      </div>

      <div className="flex w-full min-h-[calc(100vh-112px)]">
        {/* MAIN CONTENT AREA */}
        <div className="flex-1 px-6 py-12 space-y-24 overflow-y-auto no-scrollbar">
        
        {/* SECTION 1: MAJOR INDICES */}
        <section id="overview" className="space-y-8">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-[#C9A84C] uppercase tracking-[0.3em]">Market Core</span>
            <h2 className={`text-4xl font-bold uppercase ${SYNE}`}>Major Indices</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {pinging ? (
              <div className="col-span-full h-40 flex flex-col items-center justify-center bg-white/5 rounded-xl border border-white/5 animate-pulse">
                <RefreshCw className="animate-spin text-[#C9A84C] mb-2" size={24} />
                <span className="text-sm font-bold uppercase tracking-widest text-gray-400">Connecting to Backend...</span>
              </div>
            ) : loading ? [1,2,3,4].map(i => <Skeleton key={i} className="h-40" />) : 
              indices.map(idx => <IndexCard key={idx.symbol} data={idx} />)
            }
          </div>
        </section>

        {/* SECTION 2: MARKET MOVERS */}
        <section id="stocks" className="space-y-8">
          <div className="flex items-end justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-[#C9A84C] uppercase tracking-[0.3em]">Equities Engine</span>
              <h2 className={`text-4xl font-bold uppercase ${SYNE}`}>Market Movers</h2>
            </div>
            <div className="flex bg-white/5 rounded p-1">
              {['volume', 'gainers', 'losers', 'volatile'].map(s => (
                <button
                  key={s}
                  onClick={() => setMoverSort(s)}
                  className={`px-4 py-1.5 text-[10px] font-bold uppercase rounded transition-all ${
                    moverSort === s ? 'bg-[#C9A84C] text-[#060810]' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {s === 'volume' ? 'Most Active' : s}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white/[0.03] border border-[#C9A84C]/10 rounded-xl overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-white/5 border-b border-white/5">
                <tr className="text-[10px] font-bold uppercase text-gray-500">
                  <th className="px-6 py-4">#</th>
                  <th className="px-6 py-4">Stock</th>
                  <th className="px-6 py-4 text-right">Price</th>
                  <th className="px-6 py-4 text-right">Change</th>
                  <th className="px-6 py-4 text-right">Volume</th>
                  <th className="px-6 py-4 text-center">Trend (5D)</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? [1,2,3,4,5,6,7,8,9,10].map(i => (
                  <tr key={i}><td colSpan="7" className="p-4"><Skeleton className="h-10 w-full" /></td></tr>
                )) : movers.map((stock, i) => (
                  <MoverRow key={stock.symbol} rank={i+1} data={stock} setActiveSymbol={setActiveSymbol} navigate={navigate} />
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* SECTION 3: SECTOR HEATMAP */}
        <section id="gainers" className="space-y-8">
          <div className="space-y-1 text-center">
            <span className="text-[10px] font-bold text-[#C9A84C] uppercase tracking-[0.3em]">Sector Analysis</span>
            <h2 className={`text-4xl font-bold uppercase ${SYNE}`}>Sectoral Heatmap</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {loading ? [1,2,3,4,5,6,7,8].map(i => <Skeleton key={i} className="h-32" />) : 
              sectors.map(sector => <SectorTile key={sector.name} data={sector} />)
            }
          </div>
        </section>

        {/* SECTION 4: AI SCREENER (PRICE RANGES) */}
        <section id="ai-screener" className="space-y-12">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-[#C9A84C] uppercase tracking-[0.3em]">AI Intelligence</span>
            <h2 className={`text-4xl font-bold uppercase ${SYNE}`}>Top 10 AI-Ranked Assets by Price Range</h2>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {['Penny', 'Mid', 'Large', 'Bluechip'].map(range => (
              <div key={range} className="space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-[#C9A84C]">{range} Range</h3>
                  <span className="text-[9px] font-mono text-gray-500">
                    {range === 'Penny' ? 'Under ₹100' : range === 'Mid' ? '₹100 - ₹500' : range === 'Large' ? '₹500 - ₹2500' : '₹2500+'}
                  </span>
                </div>
                <div className="bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-white/5 border-b border-white/5">
                      <tr className="text-[9px] font-bold uppercase text-gray-500">
                        <th className="px-4 py-3">Asset</th>
                        <th className="px-4 py-3 text-right">Price</th>
                        <th className="px-4 py-3 text-right">AI Score</th>
                        <th className="px-4 py-3 text-right">Rec.</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {loading ? [1,2,3].map(i => (
                        <tr key={i}><td colSpan="4" className="p-2"><Skeleton className="h-8 w-full" /></td></tr>
                      )) : (priceRanges[range] || []).map(asset => (
                        <tr key={asset.symbol} className="hover:bg-white/[0.03] transition-all cursor-pointer group" onClick={() => { setActiveSymbol(asset.symbol); navigate('/dashboard'); }}>
                          <td className="px-4 py-3">
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-white group-hover:text-[#C9A84C] transition-colors">{asset.symbol.replace('.NS', '')}</span>
                              <span className="text-[8px] text-gray-600 uppercase">{asset.sector}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-xs">₹{(asset.current_price ?? 0).toLocaleString()}</td>
                          <td className="px-4 py-3 text-right font-mono text-xs text-[#C9A84C]">{asset.ai_score ?? 0}</td>
                          <td className="px-4 py-3 text-right">
                            <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full ${
                              (asset.recommendation ?? '').includes('Buy') ? 'bg-[#00E5A0]/10 text-[#00E5A0]' : 
                              (asset.recommendation ?? '').includes('Sell') ? 'bg-[#FF3D5A]/10 text-[#FF3D5A]' : 
                              'bg-gray-500/10 text-gray-400'
                            }`}>
                              {asset.recommendation ?? 'Hold'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 5: EARNINGS CALENDAR */}
        <section id="earnings-calendar" className="space-y-8">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-[#C9A84C] uppercase tracking-[0.3em]">Financial Pipeline</span>
            <h2 className={`text-4xl font-bold uppercase ${SYNE}`}>Earnings Calendar</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white/[0.03] border border-[#C9A84C]/10 rounded-xl overflow-hidden">
               <table className="w-full text-left">
                <thead className="bg-white/5 border-b border-white/5">
                  <tr className="text-[10px] font-bold uppercase text-gray-500">
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Company</th>
                    <th className="px-6 py-4 text-right">Est. EPS</th>
                    <th className="px-6 py-4 text-right">Actual EPS</th>
                    <th className="px-6 py-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {loading ? [1,2,3,4,5].map(i => (
                    <tr key={i}><td colSpan="5" className="p-4"><Skeleton className="h-10 w-full" /></td></tr>
                  )) : earnings.map((entry, i) => (
                    <EarningsRow key={i} data={entry} />
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="space-y-6">
              <h3 className="text-sm font-bold uppercase tracking-widest text-[#C9A84C]">Community Trending</h3>
              <div className="space-y-3">
                {movers.slice(0, 10).map(stock => (
                  <TrendingPill key={stock.symbol} data={stock} setActiveSymbol={setActiveSymbol} navigate={navigate} />
                ))}
              </div>
            </div>
          </div>
        </section>
        </div>

        {/* PRICE RANGE SIDEBAR */}
        <aside className="w-[260px] min-w-[260px] border-l border-white/5 sticky top-[112px] h-[calc(100vh-112px)] bg-[#060810]/40 overflow-hidden">
           <PriceRangeSidebar />
        </aside>
      </div>
    </div>
  );
}

// ── Index Card ─────────────────────────────────────────────────────────────
function IndexCard({ data }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (canvasRef.current && data.sparkline) {
      const ctx = canvasRef.current.getContext('2d');
      const d = data.sparkline;
      const w = canvasRef.current.width;
      const h = canvasRef.current.height;
      const min = Math.min(...d);
      const max = Math.max(...d);
      const range = max === min ? 1 : max - min;
      
      ctx.clearRect(0, 0, w, h);
      ctx.beginPath();
      ctx.strokeStyle = data.change >= 0 ? '#00E5A0' : '#FF3D5A';
      ctx.lineWidth = 2;
      
      d.forEach((val, i) => {
        const x = (i / (d.length - 1)) * w;
        const y = h - ((val - min) / range) * h * 0.8 - h * 0.1;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }
  }, [data]);

  return (
    <div className="bg-white/[0.03] border border-white/5 p-6 rounded-xl space-y-4 hover:border-[#C9A84C]/30 transition-all group">
      <div className="flex justify-between items-start">
        <div>
          <div className="text-[10px] font-bold text-gray-500 uppercase">{data.symbol.replace('^', '')}</div>
          <div className={`text-lg font-bold uppercase ${SYNE}`}>{data.name}</div>
        </div>
        <div className={`text-[8px] px-2 py-0.5 rounded font-bold ${data.status === 'OPEN' ? 'bg-[#00E5A0]/10 text-[#00E5A0]' : 'bg-gray-500/10 text-gray-500'}`}>
          {data.status}
        </div>
      </div>
      
      <div className="space-y-1">
        <div className={`text-3xl font-bold ${DM_MONO}`}>{(data.price ?? 0).toLocaleString()}</div>
        <div className={`text-xs font-bold flex items-center gap-1 ${data.change >= 0 ? 'text-[#00E5A0]' : 'text-[#FF3D5A]'}`}>
          {data.change >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {Math.abs(data.change ?? 0).toFixed(2)} ({(data.change_pct ?? 0).toFixed(2)}%)
        </div>
      </div>

      <canvas ref={canvasRef} width="200" height="40" className="w-full" />
    </div>
  );
}

// ── Mover Row ─────────────────────────────────────────────────────────────
function MoverRow({ rank, data, setActiveSymbol, navigate }) {
  return (
    <tr 
      className="hover:bg-white/[0.02] transition-colors group cursor-pointer"
      onClick={() => {
        setActiveSymbol(data.symbol);
        navigate('/dashboard');
      }}
    >
      <td className="px-6 py-4 text-[10px] font-mono text-gray-600">#{rank.toString().padStart(2, '0')}</td>
      <td className="px-6 py-4">
        <div className="flex flex-col">
          <span className="text-sm font-bold text-white group-hover:text-[#C9A84C] transition-colors">{data.symbol.replace('.NS', '')}</span>
          <span className="text-[9px] text-gray-500 uppercase">{data.name}</span>
        </div>
      </td>
      <td className={`px-6 py-4 text-right font-bold ${DM_MONO}`}>{(data.price ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
      <td className={`px-6 py-4 text-right font-bold ${DM_MONO} ${data.change >= 0 ? 'text-[#00E5A0]' : 'text-[#FF3D5A]'}`}>
        {(data.change_pct ?? 0).toFixed(2)}%
      </td>
      <td className={`px-6 py-4 text-right text-[11px] font-mono text-gray-400`}>{formatVol(data.volume)}</td>
      <td className="px-6 py-4 text-center">
        <div className="flex items-end justify-center gap-0.5 h-6">
          {(data.mini_chart || []).map((val, i) => {
            const arr = data.mini_chart || [];
            const min = Math.min(...arr);
            const max = Math.max(...arr);
            const height = max === min ? 50 : ((val - min) / (max - min)) * 100;
            return (
              <div 
                key={i} 
                className={`w-1.5 rounded-t-sm ${data.change >= 0 ? 'bg-[#00E5A0]/40' : 'bg-[#FF3D5A]/40'}`} 
                style={{ height: `${Math.max(20, height)}%` }} 
              />
            );
          })}
        </div>
      </td>
      <td className="px-6 py-4 text-right">
        <div className="p-2 rounded bg-white/5 text-[#C9A84C] opacity-0 group-hover:opacity-100 transition-all hover:bg-[#C9A84C] hover:text-[#060810]">
          <Play size={12} fill="currentColor" />
        </div>
      </td>
    </tr>
  );
}

// ── Sector Tile ─────────────────────────────────────────────────────────────
function SectorTile({ data }) {
  const [hovered, setHovered] = useState(false);
  const color = data.change > 2 ? 'bg-[#00E5A0]' : data.change > 0 ? 'bg-[#00E5A0]/40' : data.change > -2 ? 'bg-[#FF3D5A]/40' : 'bg-[#FF3D5A]';
  const textColor = (data.change > 2 || data.change < -2) ? 'text-[#060810]' : 'text-white';

  return (
    <div 
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`relative h-32 p-4 rounded-xl transition-all cursor-default ${color} ${textColor} overflow-hidden`}
    >
      <div className="absolute top-2 right-2 opacity-10">
        <Layers size={40} />
      </div>
      <div className="relative z-10 space-y-1">
        <div className="text-[10px] font-bold uppercase opacity-80">{data.name}</div>
        <div className={`text-2xl font-bold ${DM_MONO}`}>{data.change >= 0 ? '+' : ''}{(data.change ?? 0).toFixed(2)}%</div>
      </div>

      <AnimatePresence>
        {hovered && data.top_stocks.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute inset-0 bg-[#060810]/95 p-4 flex flex-col justify-center space-y-2"
          >
            {data.top_stocks.map(s => (
              <div key={s.symbol} className="flex justify-between text-[10px] font-bold">
                <span className="text-[#C9A84C]">{s.symbol.replace('.NS', '')}</span>
                <span className={s.change >= 0 ? 'text-[#00E5A0]' : 'text-[#FF3D5A]'}>
                  {s.change >= 0 ? '+' : ''}{(s.change ?? 0).toFixed(2)}%
                </span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Earnings Row ─────────────────────────────────────────────────────────────
function EarningsRow({ data }) {
  return (
    <tr className="hover:bg-white/[0.02] transition-colors">
      <td className="px-6 py-4">
        <div className="flex flex-col">
          <span className="text-xs font-bold text-white">{data.day_label}</span>
          <span className="text-[9px] text-gray-500 font-mono">{data.date}</span>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex flex-col">
          <span className="text-sm font-bold text-[#C9A84C]">{data.symbol.replace('.NS', '')}</span>
          <span className="text-[9px] text-gray-500 uppercase">{data.company}</span>
        </div>
      </td>
      <td className={`px-6 py-4 text-right font-mono text-[11px] text-gray-300`}>₹{data.est_eps}</td>
      <td className={`px-6 py-4 text-right font-mono text-[11px] ${data.act_eps ? 'text-white' : 'text-gray-600 italic'}`}>
        {data.act_eps ? `₹${data.act_eps}` : '--'}
      </td>
      <td className="px-6 py-4 text-center">
        <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full ${
          data.status === 'BEAT' ? 'bg-[#00E5A0]/10 text-[#00E5A0]' : 
          data.status === 'MISS' ? 'bg-[#FF3D5A]/10 text-[#FF3D5A]' : 
          'bg-gray-500/10 text-gray-400'
        }`}>
          {data.status}
        </span>
      </td>
    </tr>
  );
}

// ── Trending Pill ─────────────────────────────────────────────────────────────
function TrendingPill({ data, setActiveSymbol, navigate }) {
  return (
    <button 
      onClick={() => {
        setActiveSymbol(data.symbol);
        navigate('/dashboard');
      }}
      className="w-full flex items-center gap-4 p-3 rounded-lg bg-white/5 border border-white/5 hover:border-[#C9A84C]/50 hover:bg-white/[0.08] transition-all group"
    >
      <div className={`p-2 rounded bg-white/5 text-gray-500 group-hover:text-[#C9A84C]`}>
        <TrendingUp size={16} />
      </div>
      <div className="flex-1 text-left">
        <div className="text-xs font-bold text-white uppercase">{data.symbol.replace('.NS', '')}</div>
        <div className="text-[9px] text-gray-500 uppercase">{data.name}</div>
      </div>
      <div className={`text-xs font-bold ${DM_MONO} ${data.change >= 0 ? 'text-[#00E5A0]' : 'text-[#FF3D5A]'}`}>
        {data.change >= 0 ? '+' : ''}{(data.change_pct ?? 0).toFixed(1)}%
      </div>
    </button>
  );
}
