import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Activity, Zap, TrendingUp, BarChart2, Briefcase, FileText, ChevronRight, Maximize2, RefreshCw, Layers, Globe } from 'lucide-react';
import InstitutionalChart from '../InstitutionalChart';

export default function AITerminal({ 
  symbol, setSymbol, data, livePrice, handleTrade, 
  portfolio, tradeSide, setTradeSide, tradeAmount, setTradeAmount, totalNAV 
}) {
  const [activeTab, setActiveTab] = useState('TECHNICAL CHART');
  const [chartType, setChartType] = useState('CANDLE');
  const [timeframe, setTimeframe] = useState('1D');
  const [maToggles, setMaToggles] = useState({ MA20: true, MA200: false });
  const [searchQuery, setSearchQuery] = useState('');

  // Formatting helpers
  const price = Number(livePrice?.price || data?.current_price || data?.price || 0);
  const change = Number(livePrice?.change || data?.change || 0);
  const changePct = Number(livePrice?.change_pct || data?.change_pct || 0);
  const isPos = change >= 0;

  // Watchlist (Left Sidebar)
  const [watchlist, setWatchlist] = useState([]);

  // Fetch real RSI values on mount
  useEffect(() => {
    const symbols = ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'TATAMOTORS', 'SBIN', 'BHARTIARTL'];
    const fetchWatchlistData = async () => {
      const results = await Promise.all(symbols.map(async (s) => {
        try {
          const res = await fetch(`/api/algo/signals/${s}.NS`);
          const signalData = await res.json();
          return {
            symbol: s,
            rsi: signalData.indicators?.rsi ? Number(signalData.indicators.rsi).toFixed(1) : '—',
            status: signalData.master_signal || 'HOLD'
          };
        } catch (err) {
          console.error(`Error fetching RSI for ${s}:`, err);
          return { symbol: s, rsi: '—', status: 'HOLD' };
        }
      }));
      setWatchlist(results);
    };
    fetchWatchlistData();
  }, []);

  const getStatusColor = (status) => {
    if (status === 'BUY') return 'text-[#00ff88] bg-[#00ff88]/10';
    if (status === 'SELL') return 'text-[#ff4444] bg-[#ff4444]/10';
    return 'text-[#ff9800] bg-[#ff9800]/10';
  };

  const toggleMA = (ma) => setMaToggles(prev => ({ ...prev, [ma]: !prev[ma] }));

  const filteredWatchlist = watchlist.filter(item => 
    item.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex w-full min-h-[900px] gap-4 font-sans text-white p-2">
      
      {/* ── LEFT SIDEBAR: LIVE MONITOR ────────────────────────────────────── */}
      <aside className="w-[220px] flex flex-col gap-4">
        <div className="bg-[#141720] border border-[#1e2333] rounded-xl p-3 flex flex-col h-full shadow-2xl">
          <div className="relative mb-4">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a9ab5]" />
            <input 
              type="text" 
              placeholder="Search Watchlist..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0a0e1a] border border-[#1e2333] rounded-lg py-2 pl-9 pr-3 text-xs focus:border-[#00ff88] outline-none transition-all"
            />
          </div>

          <div className="text-[10px] font-bold text-[#8a9ab5] uppercase tracking-widest mb-3 px-1">Live Monitor</div>
          
          <div className="flex flex-col gap-2 overflow-y-auto no-scrollbar pr-1">
            {filteredWatchlist.map((stock) => (
              <motion.div 
                key={stock.symbol}
                whileHover={{ scale: 1.02, backgroundColor: '#1a1f2e' }}
                onClick={() => setSymbol(stock.symbol + '.NS')}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${(symbol && typeof symbol === 'string' && symbol.includes(stock.symbol)) ? 'border-[#00ff88] bg-[#00ff88]/5' : 'border-[#1e2333] bg-[#0d0f12]'}`}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-xs">{stock.symbol}</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${getStatusColor(stock.status)}`}>
                    {stock.status}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-[#8a9ab5]">RSI (14)</span>
                  <span className="font-mono text-[#00ff88]">{stock.rsi}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </aside>

      {/* ── CENTER PANEL: MAIN CONTENT ────────────────────────────────────── */}
      <main className="flex-1 flex flex-col gap-4">
        {/* Header Card */}
        <div className="bg-[#141720] border border-[#1e2333] rounded-xl p-5 shadow-xl">
          <div className="flex justify-between items-start">
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-bold font-[Syne] uppercase tracking-tight flex items-center gap-3">
                {data?.info?.full_name || symbol?.replace('.NS', '') || "Reliance Industries"}
                {data?.info?.market_closed && (
                  <span className="px-2 py-0.5 bg-[#ff4444]/20 text-[#ff4444] text-[9px] font-bold rounded border border-[#ff4444]/30 animate-pulse">
                    MARKET CLOSED
                  </span>
                )}
              </h1>
              <div className="flex gap-2 items-center">
                <span className="text-[10px] font-bold bg-[#1e2333] px-2 py-0.5 rounded text-[#8a9ab5]">NSE</span>
                <span className="text-[10px] font-bold bg-[#1e2333] px-2 py-0.5 rounded text-[#8a9ab5]">{data?.info?.sector || 'ENERGY'}</span>
                <span className="text-[10px] font-bold bg-[#1e2333] px-2 py-0.5 rounded text-[#00ff88]">SERIES EQ</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold font-mono">
                {price === 0 ? '—' : `₹${price.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
              </div>
              <div className={`text-sm font-bold flex items-center justify-end gap-1 ${isPos ? 'text-[#00ff88]' : 'text-[#ff4444]'}`}>
                {isPos ? '▲' : '▼'} {change.toFixed(2)} ({changePct.toFixed(2)}%)
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-6 mt-6 border-b border-[#1e2333]">
            {['TECHNICAL CHART', 'MARKET DEPTH', 'FUNDAMENTALS'].map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 text-[11px] font-bold uppercase tracking-widest relative transition-all ${activeTab === tab ? 'text-[#00ff88]' : 'text-[#8a9ab5] hover:text-white'}`}
              >
                {tab}
                {activeTab === tab && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#00ff88]" />}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'TECHNICAL CHART' && (
              <motion.div 
                key="chart-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div className="flex justify-between items-center py-4">
                  <div className="flex gap-2">
                    <div className="bg-[#0a0e1a] border border-[#1e2333] rounded-lg p-1 flex gap-1">
                      {['LINE', 'CANDLE'].map(t => (
                        <button key={t} onClick={() => setChartType(t)} className={`px-3 py-1 text-[9px] font-bold rounded ${chartType === t ? 'bg-[#1e2333] text-white' : 'text-[#8a9ab5] hover:text-white'}`}>{t}</button>
                      ))}
                    </div>
                    <div className="bg-[#0a0e1a] border border-[#1e2333] rounded-lg p-1 flex gap-1">
                      {['1D', '1W', '1M'].map(t => (
                        <button key={t} onClick={() => setTimeframe(t)} className={`px-3 py-1 text-[9px] font-bold rounded ${timeframe === t ? 'bg-[#1e2333] text-white' : 'text-[#8a9ab5] hover:text-white'}`}>{t}</button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {['MA20', 'MA200'].map(ma => (
                      <button 
                        key={ma} 
                        onClick={() => toggleMA(ma)}
                        className={`px-3 py-1 text-[9px] font-bold rounded border transition-all ${maToggles[ma] ? 'border-[#00ff88] text-[#00ff88] bg-[#00ff88]/5' : 'border-[#1e2333] text-[#8a9ab5]'}`}
                      >
                        {ma}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="h-[400px] w-full bg-[#0a0e1a] rounded-xl border border-[#1e2333] overflow-hidden relative">
                  <InstitutionalChart 
                    data={data?.history} 
                    livePrice={livePrice} 
                    chartType={chartType} 
                    showMA20={maToggles.MA20}
                    showMA200={maToggles.MA200}
                    symbol={symbol}
                  />
                </div>
              </motion.div>
            )}

            {activeTab === 'MARKET DEPTH' && (
              <motion.div key="depth-view" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="py-20 flex flex-col items-center justify-center gap-4 text-[#8a9ab5]">
                 <div className="w-80 h-40 flex items-end gap-1.5 px-6">
                    {[12,25,45,65,85,95,75,55,35,15].map((h, i) => (
                      <div key={i} className={`flex-1 ${i < 5 ? 'bg-[#ff4444]/30' : 'bg-[#00ff88]/30'} rounded-t-md`} style={{ height: `${h}%` }} />
                    ))}
                 </div>
                 <span className="text-[10px] font-bold uppercase tracking-[0.3em]">Institutional L2 Order Flow</span>
                 <span className="text-[9px] opacity-40 uppercase">Bid/Ask Gap: 0.05 | Imbalance: 4% Bullish Bias</span>
              </motion.div>
            )}

            {activeTab === 'FUNDAMENTALS' && (
              <motion.div key="funds-view" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="py-12 grid grid-cols-2 md:grid-cols-4 gap-6">
                 {[
                   { label: 'P/E RATIO', val: data?.info?.pe_ratio || '22.4' },
                   { label: 'DIV YIELD', val: (data?.info?.dividend_yield * 100).toFixed(2) + '%' || '1.12%' },
                   { label: 'MKT CAP', val: ((data?.info?.market_cap || 1500000000) / 10000000).toFixed(2) + ' Cr' },
                   { label: 'BETA', val: '1.08' }
                 ].map(f => (
                   <div key={f.label} className="p-5 bg-[#0d0f12] border border-[#1e2333] rounded-xl">
                     <div className="text-[9px] font-bold text-[#8a9ab5] uppercase mb-1 tracking-widest">{f.label}</div>
                     <div className="text-xl font-bold font-mono">{f.val}</div>
                   </div>
                 ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Indicators Grid */}
        <div className="grid grid-cols-3 gap-4">
           <IndicatorCard 
             title="RSI (14)" 
             value={data?.indicators?.rsi ? Number(data.indicators.rsi).toFixed(2) : '—'} 
             status={data?.indicators?.rsi > 70 ? 'OVERBOUGHT' : data?.indicators?.rsi < 30 ? 'OVERSOLD' : 'NEUTRAL'} 
             statusColor={data?.indicators?.rsi > 70 ? 'text-[#ff4444]' : data?.indicators?.rsi < 30 ? 'text-[#00ff88]' : 'text-[#ff9800]'} 
             progress={data?.indicators?.rsi || 50} 
             progressColor={data?.indicators?.rsi > 70 ? 'bg-[#ff4444]' : data?.indicators?.rsi < 30 ? 'bg-[#00ff88]' : 'bg-[#ff9800]'} 
           />
           <IndicatorCard title="MACD (12,26,9)" value="-11.06" status="BEARISH CROSS" statusColor="text-[#ff4444]" sparkline={[3,5,8,12,15,12,8,5,3]} />
           <div className="bg-[#141720] border border-[#1e2333] p-4 rounded-xl shadow-lg relative overflow-hidden flex flex-col justify-between h-[130px]">
             <div className="absolute top-0 right-0 w-24 h-24 bg-[#00ff88]/5 rounded-full blur-3xl" />
             <div className="flex justify-between items-start relative z-10">
               <span className="text-[10px] font-bold text-[#8a9ab5] uppercase tracking-wider">Pattern AI</span>
               <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#00ff88]/10 text-[#00ff88]">BULLISH</span>
             </div>
             <div className="text-sm font-bold text-white uppercase tracking-tight relative z-10">Bullish Engulfing</div>
             <div className="text-[9px] text-[#00ff88] flex items-center gap-1 relative z-10">
               <div className="w-1.5 h-1.5 rounded-full bg-[#00ff88] animate-pulse" /> 84% Conf.
             </div>
           </div>
        </div>
      </main>

      {/* ── RIGHT SIDEBAR: ACTION PANEL ───────────────────────────────────── */}
      <aside className="w-[280px] flex flex-col gap-4">
        <div className="bg-[#141720] border border-[#1e2333] rounded-xl p-5 shadow-xl">
          <div className="flex justify-between items-center mb-4">
            <span className="text-[10px] font-bold text-[#8a9ab5] uppercase tracking-widest">Portfolio NAV</span>
            <div className="w-2 h-2 rounded-full bg-[#00ff88] animate-pulse" />
          </div>
          <div className="text-2xl font-bold font-mono mb-2">₹{totalNAV.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
          <div className="text-[10px] text-[#8a9ab5] uppercase font-bold tracking-widest">Available Cash: <span className="text-white">₹{portfolio?.balance?.toLocaleString() || '0'}</span></div>
        </div>

        <div className="bg-[#141720] border border-[#1e2333] rounded-xl p-5 shadow-xl space-y-5">
          <div className="flex gap-2">
            <button onClick={() => setTradeSide('BUY')} className={`flex-1 py-3 text-xs font-bold rounded-lg transition-all ${tradeSide === 'BUY' ? 'bg-[#00ff88] text-[#0a0e1a]' : 'bg-[#1a1f2e] text-[#8a9ab5] hover:text-white'}`}>BUY</button>
            <button onClick={() => setTradeSide('SELL')} className={`flex-1 py-3 text-xs font-bold rounded-lg transition-all ${tradeSide === 'SELL' ? 'bg-[#ff4444] text-white' : 'bg-[#1a1f2e] text-[#8a9ab5] hover:text-white'}`}>SELL</button>
          </div>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-[#8a9ab5] uppercase tracking-widest ml-1">Execution Price</label>
              <div className="bg-[#0a0e1a] border border-[#1e2333] rounded-lg p-3 text-sm font-mono font-bold text-white">₹{price.toFixed(2)}</div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-[#8a9ab5] uppercase tracking-widest ml-1">Quantity</label>
              <input type="number" value={tradeAmount} onChange={(e) => setTradeAmount(e.target.value)} className="w-full bg-[#0a0e1a] border border-[#1e2333] rounded-lg p-3 text-sm font-mono font-bold text-white focus:border-[#00ff88] outline-none" />
            </div>
          </div>
          <button onClick={() => handleTrade(tradeSide)} className={`w-full py-4 font-bold rounded-lg text-sm uppercase tracking-[0.2em] shadow-lg transition-all ${tradeSide === 'BUY' ? 'bg-[#00ff88] text-[#0a0e1a] shadow-[#00ff88]/20' : 'bg-[#ff4444] text-white shadow-[#ff4444]/20'} hover:scale-[1.02] active:scale-95`}>
            Execute {tradeSide}
          </button>
        </div>

        <div className="bg-[#141720] border border-[#1e2333] rounded-xl p-5 shadow-xl">
           <h3 className="text-[10px] font-bold text-[#8a9ab5] uppercase tracking-widest mb-4">Network Tapes</h3>
           <div className="space-y-3">
              <div className="p-3 bg-[#0d0f12] rounded-lg border border-[#1e2333] flex justify-between items-center">
                 <span className="text-[10px] font-bold text-gray-400 uppercase">NSE_TICK_STREAM</span>
                 <span className="text-[10px] font-bold text-[#00ff88]">LIVE</span>
              </div>
              <div className="p-3 bg-[#0d0f12] rounded-lg border border-[#1e2333] flex justify-between items-center">
                 <span className="text-[10px] font-bold text-gray-400 uppercase">VOL_INDEX_ADJ</span>
                 <span className="text-[10px] font-bold text-white font-mono">1.2x</span>
              </div>
           </div>
        </div>
      </aside>
    </div>
  );
}

function IndicatorCard({ title, value, status, statusColor, progress, progressColor, sparkline }) {
  return (
    <div className="bg-[#141720] border border-[#1e2333] p-4 rounded-xl shadow-lg flex flex-col justify-between h-[130px]">
      <div className="flex justify-between items-start">
        <span className="text-[10px] font-bold text-[#8a9ab5] uppercase tracking-wider">{title}</span>
        {status && <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded bg-white/5 ${statusColor}`}>{status}</span>}
      </div>
      <div className="text-2xl font-bold font-mono">{value}</div>
      {progress && (
        <div className="w-full h-1 bg-[#1e2333] rounded-full overflow-hidden">
          <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className={`h-full ${progressColor}`} />
        </div>
      )}
      {sparkline && (
        <div className="h-4 flex items-end gap-[2px]">
          {sparkline.map((h, i) => (
            <div key={i} className="flex-1 bg-[#ff4444]/60 rounded-t-[1px]" style={{ height: `${h}px` }} />
          ))}
        </div>
      )}
    </div>
  );
}
