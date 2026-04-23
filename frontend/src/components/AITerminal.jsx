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

  // Formatting helpers
  const price = Number(livePrice?.price || data?.current_price || 1365.21);
  const change = Number(livePrice?.change || data?.change || 0.14);
  const changePct = Number(livePrice?.change_pct || data?.change_pct || 0.65);
  const isPos = change >= 0;

  // Watchlist (Left Sidebar)
  const [watchlist, setWatchlist] = useState([
    { symbol: 'RELIANCE', rsi: 53.2, status: 'BUY' },
    { symbol: 'TCS', rsi: 48.5, status: 'HOLD' },
    { symbol: 'HDFCBANK', rsi: 32.1, status: 'BUY' },
    { symbol: 'INFY', rsi: 61.4, status: 'SELL' },
    { symbol: 'TATAMOTORS', rsi: 55.7, status: 'HOLD' },
  ]);

  // Update watchlist RSI/Price mock every second
  useEffect(() => {
    const interval = setInterval(() => {
      setWatchlist(prev => prev.map(item => ({
        ...item,
        rsi: (Number(item.rsi) + (Math.random() - 0.5)).toFixed(1)
      })));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status) => {
    if (status === 'BUY') return 'text-[#00ff88] bg-[#00ff88]/10';
    if (status === 'SELL') return 'text-[#ff4444] bg-[#ff4444]/10';
    return 'text-[#ff9800] bg-[#ff9800]/10';
  };

  const toggleMA = (ma) => setMaToggles(prev => ({ ...prev, [ma]: !prev[ma] }));

  return (
    <div className="flex w-full min-h-[900px] gap-4 font-sans text-white p-2">
      
      {/* ── LEFT SIDEBAR: LIVE MONITOR (220px) ──────────────────────────────── */}
      <aside className="w-[220px] flex flex-col gap-4">
        <div className="bg-[#141720] border border-[#1e2333] rounded-xl p-3 flex flex-col h-full shadow-2xl">
          <div className="relative mb-4">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a9ab5]" />
            <input 
              type="text" 
              placeholder="RELIANCE.NS" 
              className="w-full bg-[#0a0e1a] border border-[#1e2333] rounded-lg py-2 pl-9 pr-3 text-xs focus:border-[#00ff88] outline-none transition-all"
            />
          </div>

          <div className="text-[10px] font-bold text-[#8a9ab5] uppercase tracking-widest mb-3 px-1">Live Monitor</div>
          
          <div className="flex flex-col gap-2 overflow-y-auto custom-scrollbar pr-1">
            {watchlist.map((stock) => (
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

      {/* ── CENTER PANEL: MAIN CHART VIEW ──────────────────────────────────── */}
      <main className="flex-1 flex flex-col gap-4">
        {/* Stock Header Card */}
        <div className="bg-[#141720] border border-[#1e2333] rounded-xl p-5 shadow-xl">
          <div className="flex justify-between items-start">
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-bold font-heading uppercase tracking-tight">
                {data?.info?.full_name || "Reliance Industries Limited"}
              </h1>
              <div className="flex gap-2 items-center">
                <span className="text-[10px] font-bold bg-[#1e2333] px-2 py-0.5 rounded text-[#8a9ab5]">NSE</span>
                <span className="text-[10px] font-bold bg-[#1e2333] px-2 py-0.5 rounded text-[#8a9ab5]">ENERGY</span>
                <span className="text-[10px] font-bold bg-[#1e2333] px-2 py-0.5 rounded text-[#00ff88]">SERIES EQ</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold font-mono flashing-price">
                ₹{price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div className={`text-sm font-bold flex items-center justify-end gap-1 ${isPos ? 'text-[#00ff88]' : 'text-[#ff4444]'}`}>
                {isPos ? '▲' : '▼'} {change.toFixed(2)} ({changePct.toFixed(2)}%)
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
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

          {/* Chart Controls */}
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
            <div className="flex gap-3 items-center">
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
              <div className="flex gap-2 ml-2 border-l border-[#1e2333] pl-3">
                <button className="text-[#8a9ab5] hover:text-white"><RefreshCw size={14} /></button>
                <button className="text-[#8a9ab5] hover:text-white"><Maximize2 size={14} /></button>
              </div>
            </div>
          </div>

          {/* Main Chart Area */}
          <div className="h-[400px] w-full bg-[#0a0e1a] rounded-xl border border-[#1e2333] overflow-hidden relative">
            <InstitutionalChart 
              data={data?.history} 
              livePrice={livePrice} 
              chartType={chartType} 
              timeframe={timeframe}
              showMA20={maToggles.MA20}
              showMA200={maToggles.MA200}
            />
          </div>
        </div>

        {/* Technical Indicators Grid */}
        <div className="grid grid-cols-3 gap-4">
          {/* Card 1: RSI */}
          <div className="bg-[#141720] border border-[#1e2333] p-4 rounded-xl shadow-lg flex flex-col justify-between h-[120px]">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-[#8a9ab5] uppercase tracking-wider">RSI (14)</span>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#ff9800]/10 text-[#ff9800]">NEUTRAL</span>
            </div>
            <div className="text-2xl font-bold font-mono">53.27</div>
            <div className="w-full h-1 bg-[#1e2333] rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: '53.27%' }} className="h-full bg-[#ff9800]" />
            </div>
          </div>

          {/* Card 2: MACD */}
          <div className="bg-[#141720] border border-[#1e2333] p-4 rounded-xl shadow-lg flex flex-col justify-between h-[120px]">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-[#8a9ab5] uppercase tracking-wider">MACD (12,26,9)</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold font-mono text-[#ff4444]">-11.06</span>
              <span className="text-[10px] text-[#8a9ab5]">sig: 0.86</span>
            </div>
            <div className="h-4 flex items-end gap-[2px]">
              {[3,5,8,12,15,12,8,5,3].map((h, i) => (
                <div key={i} className="flex-1 bg-[#00ff88]/60 rounded-t-[1px]" style={{ height: `${h}px` }} />
              ))}
            </div>
          </div>

          {/* Card 3: MA 50 vs 200 */}
          <div className="bg-[#141720] border border-[#1e2333] p-4 rounded-xl shadow-lg flex flex-col justify-between h-[120px]">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-[#8a9ab5] uppercase tracking-wider">MA 50 vs 200</span>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#ff9800]/10 text-[#ff9800]">CONSOLIDATING</span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-[#8a9ab5]">MA50</span>
                <span>1391</span>
              </div>
              <div className="flex justify-between text-xs font-mono">
                <span className="text-[#8a9ab5]">MA200</span>
                <span>1439</span>
              </div>
            </div>
          </div>

          {/* Card 4: Bollinger Bands */}
          <div className="bg-[#141720] border border-[#1e2333] p-4 rounded-xl shadow-lg flex flex-col justify-between h-[120px]">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-[#8a9ab5] uppercase tracking-wider">Bollinger Bands</span>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#00ff88]/10 text-[#00ff88]">NORMAL</span>
            </div>
            <div className="flex justify-between text-[11px] font-mono">
              <div className="flex flex-col">
                <span className="text-[#8a9ab5] text-[9px]">UPPER</span>
                <span>1433.47</span>
              </div>
              <div className="flex flex-col text-right">
                <span className="text-[#8a9ab5] text-[9px]">LOWER</span>
                <span>1296.95</span>
              </div>
            </div>
          </div>

          {/* Card 5: EMA (20) */}
          <div className="bg-[#141720] border border-[#1e2333] p-4 rounded-xl shadow-lg flex flex-col justify-between h-[120px]">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-[#8a9ab5] uppercase tracking-wider">EMA (20)</span>
            </div>
            <div className="text-2xl font-bold font-mono">1357</div>
            <div className="text-[8px] font-bold text-[#8a9ab5] uppercase tracking-widest">Weight prioritizes recent price</div>
          </div>

          {/* Card 6: Pattern AI */}
          <div className="bg-[#141720] border border-[#1e2333] p-4 rounded-xl shadow-lg flex flex-col justify-between h-[120px] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#00ff88]/5 rounded-full blur-3xl" />
            <div className="flex justify-between items-start relative z-10">
              <span className="text-[10px] font-bold text-[#8a9ab5] uppercase tracking-wider">Pattern AI</span>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#00ff88]/10 text-[#00ff88]">BULLISH</span>
            </div>
            <div className="text-sm font-bold text-white uppercase tracking-tight relative z-10">Bullish Engulfing</div>
            <div className="text-[9px] text-[#00ff88] flex items-center gap-1 relative z-10">
              <div className="w-1.5 h-1.5 rounded-full bg-[#00ff88] animate-pulse" />
              Pattern detected with 84% confidence
            </div>
          </div>
        </div>
      </main>

      {/* ── RIGHT SIDEBAR: TRADING PANEL (280px) ───────────────────────────── */}
      <aside className="w-[280px] flex flex-col gap-4">
        {/* Portfolio Card */}
        <div className="bg-[#141720] border border-[#1e2333] rounded-xl p-5 shadow-xl">
          <div className="flex justify-between items-center mb-4">
            <span className="text-[10px] font-bold text-[#8a9ab5] uppercase tracking-widest">Portfolio Balance</span>
            <button className="text-[9px] text-[#00ff88] font-bold uppercase hover:underline">Details →</button>
          </div>
          <div className="text-2xl font-bold font-mono mb-2">₹100,000.54</div>
          <div className="flex items-center gap-2 text-[11px]">
            <span className="text-[#8a9ab5]">Shares Held: <span className="text-white font-bold">1</span></span>
            <span className="px-1.5 py-0.5 rounded bg-[#ff4444]/10 text-[#ff4444] font-bold text-[9px]">-0.8%</span>
          </div>
        </div>

        {/* Trading Controls */}
        <div className="bg-[#141720] border border-[#1e2333] rounded-xl p-5 shadow-xl space-y-5">
          <div className="flex gap-2">
            <button 
              onClick={() => setTradeSide('BUY')}
              className={`flex-1 py-3 text-xs font-bold rounded-lg transition-all ${tradeSide === 'BUY' ? 'bg-[#00ff88] text-[#0a0e1a]' : 'bg-[#1a1f2e] text-[#8a9ab5] hover:text-white'}`}
            >
              BUY
            </button>
            <button 
              onClick={() => setTradeSide('SELL')}
              className={`flex-1 py-3 text-xs font-bold rounded-lg transition-all ${tradeSide === 'SELL' ? 'bg-[#ff4444] text-white' : 'bg-[#1a1f2e] text-[#8a9ab5] hover:text-white'}`}
            >
              SELL
            </button>
          </div>

          <div className="space-y-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-[#8a9ab5] uppercase ml-1">Price (₹)</label>
              <input 
                type="text" 
                readOnly 
                value={price.toFixed(2)}
                className="w-full bg-[#0a0e1a] border border-[#1e2333] rounded-lg p-3 text-sm font-mono font-bold text-white cursor-not-allowed"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-[#8a9ab5] uppercase ml-1">QTY</label>
              <input 
                type="number" 
                value={tradeAmount}
                onChange={(e) => setTradeAmount(e.target.value)}
                className="w-full bg-[#0a0e1a] border border-[#1e2333] rounded-lg p-3 text-sm font-mono font-bold text-white focus:border-[#00ff88] outline-none"
              />
            </div>
          </div>

          <div className="space-y-1 py-2 border-t border-[#1e2333]">
            <div className="flex justify-between text-xs">
              <span className="text-[#8a9ab5]">Total Amount</span>
              <span className="font-mono font-bold">₹{(price * tradeAmount).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[#8a9ab5]">Available Limit</span>
              <span className="font-mono text-[#8a9ab5]">₹98,635.33</span>
            </div>
          </div>

          <button 
            onClick={() => handleTrade(tradeSide)}
            className="w-full py-4 bg-[#00ff88] text-[#0a0e1a] font-bold rounded-lg text-sm uppercase tracking-widest shadow-lg shadow-[#00ff88]/20 hover:brightness-110 active:scale-95 transition-all"
          >
            BUY RELIANCE
          </button>
        </div>

        {/* Top Assets Card */}
        <div className="bg-[#141720] border border-[#1e2333] rounded-xl p-5 shadow-xl">
          <h3 className="text-[10px] font-bold text-[#8a9ab5] uppercase tracking-widest mb-4">Top Assets</h3>
          <div className="space-y-4">
            {[
              { s: 'RELIANCE', v: '2987.50', c: '+1.2%', p: true },
              { s: 'HDFCBANK', v: '1432.10', c: '+0.8%', p: true },
              { s: 'TCS', v: '4120.00', c: '-0.5%', p: false },
              { s: 'NVDA', v: '880.60', c: '+4.2%', p: true }
            ].map((asset) => (
              <div key={asset.s} className="flex justify-between items-center group cursor-pointer">
                <div className="flex flex-col">
                  <span className="text-xs font-bold group-hover:text-[#00ff88] transition-colors">{asset.s}</span>
                </div>
                <div className="text-right flex flex-col">
                  <span className="text-xs font-mono font-bold">₹{asset.v}</span>
                  <span className={`text-[9px] font-bold ${asset.p ? 'text-[#00ff88]' : 'text-[#ff4444]'}`}>{asset.c}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>

    </div>
  );
}
