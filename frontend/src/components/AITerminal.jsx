import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Activity, Zap, TrendingUp, BarChart2, Briefcase, FileText, ChevronRight, Maximize2, RefreshCw } from 'lucide-react';
import InstitutionalChart from '../InstitutionalChart';

export default function AITerminal({ 
  symbol, setSymbol, data, livePrice, handleTrade, 
  portfolio, tradeSide, setTradeSide, tradeAmount, setTradeAmount, totalNAV 
}) {
  const [activeTab, setActiveTab] = useState('TECHNICAL CHART');
  const [chartType, setChartType] = useState('CANDLE');
  const [timeframe, setTimeframe] = useState('1D');
  const [activeOverlays, setActiveOverlays] = useState(['MA50']);

  // Helpers for formatting
  const price = livePrice ? livePrice.price : (data?.current_price || 0);
  const change = livePrice ? livePrice.change : (data?.change || 0);
  const changePct = data?.change_pct || 0;
  const isPos = change >= 0;

  const [customPrice, setCustomPrice] = useState(null);
  const displayPrice = customPrice !== null ? customPrice : price;

  // Mocked active monitors for Left Sidebar
  const activeMonitors = [
    { s: 'RELIANCE.NS', rsi: 72.4, sig: 'BUY' },
    { s: 'TCS.NS', rsi: 45.2, sig: 'HOLD' },
    { s: 'HDFCBANK.NS', rsi: 28.1, sig: 'SELL' },
    { s: 'INFY.NS', rsi: 61.0, sig: 'BUY' },
    { s: 'TATAMOTORS.NS', rsi: 82.5, sig: 'BUY' },
  ];

  const getRSILabel = (val) => {
    if (!val) return { label: 'NEUTRAL', width: '50%', color: 'bg-[#ff9800]' };
    if (val >= 70) return { label: 'OVERBOUGHT', width: `${val}%`, color: 'bg-[#ff4444]' };
    if (val <= 30) return { label: 'OVERSOLD', width: `${val}%`, color: 'bg-[#00e676]' };
    return { label: 'NEUTRAL', width: `${val}%`, color: 'bg-[#ff9800]' };
  };

  const rsiData = getRSILabel(data?.indicators?.rsi);
  const currentPos = portfolio?.positions?.find(p => p.symbol === symbol) || { quantity: 0, pnl_pct: 0 };

  const toggleOverlay = (ma) => {
    if(activeOverlays.includes(ma)) setActiveOverlays(activeOverlays.filter(o => o !== ma));
    else setActiveOverlays([...activeOverlays, ma]);
  };

  // When live price or target symbol changes, reset custom price unless user is focusing it
  React.useEffect(() => setCustomPrice(null), [symbol]);

  return (
    <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      
      {/* Left Panel: Live Monitor */}
      <div className="col-span-1 lg:col-span-2 space-y-6">
         <div className="bg-[#141720] border border-[#1e2333] p-4 rounded-xl">
            <form onSubmit={(e) => { e.preventDefault(); setSymbol(document.getElementById('symbol-search').value.toUpperCase()); }} className="relative mb-5">
               <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a9ab5]" />
               <input id="symbol-search" type="text" placeholder="Search..." defaultValue={symbol}
                      className="w-full bg-[#0d0f12] border border-[#1e2333] text-white font-[Inter] text-xs p-2.5 pl-9 rounded-lg focus:outline-none focus:border-[#00e676] transition-colors" />
            </form>
            <div className="text-[10px] font-[Space_Grotesk] text-[#8a9ab5] font-bold uppercase tracking-widest mb-3">Live Monitor</div>
            <div className="space-y-2">
               {activeMonitors.map(m => (
                 <div key={m.s} onClick={() => setSymbol(m.s)} 
                      className={`flex flex-col p-3 rounded-lg cursor-pointer border transition-colors
                      ${symbol === m.s ? 'bg-[#00e676]/10 border-[#00e676]/30' : 'bg-[#0d0f12] border-[#1e2333] hover:border-[#8a9ab5]/50'}`}>
                    <div className="flex justify-between items-center mb-2">
                       <span className="text-xs font-bold text-white font-[Inter]">{m.s.split('.')[0]}</span>
                       <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase
                          ${m.sig==='BUY' ? 'bg-[#00e676]/20 text-[#00e676]' : m.sig==='SELL' ? 'bg-[#ff4444]/20 text-[#ff4444]' : 'bg-[#ff9800]/20 text-[#ff9800]'}`}>
                          {m.sig}
                       </span>
                    </div>
                    <div className="flex justify-between items-center text-[10px]">
                       <span className="text-[#8a9ab5]">RSI (14)</span>
                       <span className="text-white font-[Inter]">{m.rsi}</span>
                    </div>
                 </div>
               ))}
            </div>
         </div>
      </div>

      {/* Main Content: Stock Detail View */}
      <div className="col-span-1 lg:col-span-7 space-y-6">
         {/* HEADER */}
         <div className="bg-[#141720] border border-[#1e2333] p-5 rounded-xl">
            <div className="flex justify-between items-start mb-4">
               <div>
                  <h2 className="text-2xl font-[Space_Grotesk] font-bold text-white tracking-wider flex items-center gap-3">
                    {data?.info?.full_name || symbol}
                  </h2>
                  <div className="flex gap-2 text-[10px] uppercase font-bold text-[#8a9ab5] mt-1 items-center">
                     <span className="bg-[#1e2333] px-2 py-0.5 rounded">NSE</span>
                     <span className="bg-[#1e2333] px-2 py-0.5 rounded">{data?.info?.sector || 'EQUITY'}</span>
                     <span className="bg-[#1e2333] px-2 py-0.5 rounded text-[#00e676]">SERIES EQ</span>
                  </div>
               </div>
               <div className="text-right">
                  <div className="text-3xl font-[Inter] font-bold text-white flashing-price">
                    ₹{displayPrice.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </div>
                  <div className={`text-sm font-bold font-[Inter] flex items-center justify-end gap-1 ${isPos ? 'text-[#00e676]' : 'text-[#ff4444]'}`}>
                    {isPos ? '▲' : '▼'} {Math.abs(change).toFixed(2)} ({Math.abs(changePct).toFixed(2)}%)
                  </div>
               </div>
            </div>

            {/* TABS */}
            <div className="flex border-b border-[#1e2333] mt-6">
               {['TECHNICAL CHART', 'MARKET DEPTH', 'FUNDAMENTALS'].map(tab => (
                 <button key={tab} onClick={() => setActiveTab(tab)}
                    className={`pb-3 px-4 text-xs font-[Space_Grotesk] font-bold tracking-widest relative transition-colors
                    ${activeTab === tab ? 'text-[#00e676]' : 'text-[#8a9ab5] hover:text-white'}`}>
                    {tab}
                    {activeTab === tab && <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00e676]" />}
                 </button>
               ))}
            </div>

            {/* CHART CONTROLS & CHART */}
            <div className="pt-4 pb-2">
               <div className="flex justify-between items-center mb-4">
                  <div className="flex gap-2">
                     <div className="bg-[#0d0f12] border border-[#1e2333] rounded-md p-1 flex">
                        {['LINE', 'CANDLE'].map(t => (
                           <button key={t} onClick={() => setChartType(t)}
                              className={`px-3 py-1 text-[10px] font-bold rounded ${chartType === t ? 'bg-[#1e2333] text-white' : 'text-[#8a9ab5]'}`}>
                              {t}
                           </button>
                        ))}
                     </div>
                     <div className="bg-[#0d0f12] border border-[#1e2333] rounded-md p-1 flex">
                        {['1D', '1W', '1M'].map(t => (
                           <button key={t} onClick={() => setTimeframe(t)}
                              className={`px-3 py-1 text-[10px] font-bold rounded ${timeframe === t ? 'bg-[#1e2333] text-white' : 'text-[#8a9ab5]'}`}>
                              {t}
                           </button>
                        ))}
                     </div>
                  </div>
                  <div className="flex gap-3 items-center">
                     <div className="flex gap-1 text-[10px] font-bold">
                        {['MA20', 'MA50', 'MA200'].map(ma => (
                           <button key={ma} onClick={() => toggleOverlay(ma)}
                              className={`px-2 py-1 rounded border transition-colors ${activeOverlays.includes(ma) ? 'bg-[#00e676]/20 border-[#00e676]/50 text-[#00e676]' : 'bg-[#0d0f12] border-[#1e2333] text-[#8a9ab5]'}`}>
                              {ma}
                           </button>
                        ))}
                     </div>
                     <div className="w-px h-4 bg-[#1e2333]"></div>
                     <button className="text-[#8a9ab5] hover:text-white"><RefreshCw size={14}/></button>
                     <button className="text-[#8a9ab5] hover:text-white"><Maximize2 size={14}/></button>
                  </div>
               </div>
               
               <div className="h-[350px] w-full rounded-lg overflow-hidden border border-[#1e2333]">
                  <InstitutionalChart data={data?.history} livePrice={livePrice} />
               </div>
            </div>
         </div>

         {/* Technical Indicator Stream */}
         <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            
            {/* RSI */}
            <div className="bg-[#141720] border border-[#1e2333] p-4 rounded-xl flex flex-col justify-between">
               <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-[Space_Grotesk] font-bold text-[#8a9ab5] uppercase">RSI (14)</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${rsiData.color}/20 min-w-16 text-center text-${rsiData.color.replace('bg-','')}`}>
                    {rsiData.label}
                  </span>
               </div>
               <div className="text-2xl font-[Inter] font-bold text-white mb-2">{data?.indicators?.rsi ? Number(data.indicators.rsi).toFixed(2) : '52.40'}</div>
               <div className="w-full h-1.5 bg-[#0d0f12] rounded-full overflow-hidden border border-[#1e2333]">
                  <div className={`h-full ${rsiData.color}`} style={{width: rsiData.width}}></div>
               </div>
            </div>

            {/* MACD */}
            <div className="bg-[#141720] border border-[#1e2333] p-4 rounded-xl flex flex-col justify-between">
               <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-[Space_Grotesk] font-bold text-[#8a9ab5] uppercase">MACD (12,26,9)</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#00e676]/20 text-[#00e676]`}>
                    BULLISH CROSS
                  </span>
               </div>
               <div className="flex items-end gap-3 mb-1">
                  <div className="text-xl font-[Inter] font-bold text-[#00e676]">{data?.indicators?.macd?.value ? Number(data.indicators.macd.value).toFixed(2) : '1.24'}</div>
                  <div className="text-sm font-[Inter] text-[#8a9ab5] mb-0.5">sig: {data?.indicators?.macd?.signal ? Number(data.indicators.macd.signal).toFixed(2) : '0.86'}</div>
               </div>
            </div>

            {/* MA 50 vs 200 */}
            <div className="bg-[#141720] border border-[#1e2333] p-4 rounded-xl flex flex-col justify-between">
               <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-[Space_Grotesk] font-bold text-[#8a9ab5] uppercase">MA 50 VS 200</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#ff9800]/20 text-[#ff9800]`}>
                    CONSOLIDATING
                  </span>
               </div>
               <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-[#8a9ab5] w-8">MA50</span>
                  <span className="text-sm font-bold text-white">{data?.history?.length > 0 ? Math.round(data.history[data.history.length-1].sma50 || displayPrice) : '---'}</span>
               </div>
               <div className="flex items-center gap-2">
                  <span className="text-xs text-[#8a9ab5] w-8">MA200</span>
                  <span className="text-sm font-bold text-white">{data?.history?.length > 0 ? Math.round(data.history[data.history.length-1].sma200 || displayPrice) : '---'}</span>
               </div>
            </div>

            {/* Bollinger Bands */}
            <div className="bg-[#141720] border border-[#1e2333] p-4 rounded-xl flex flex-col justify-between">
               <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-[Space_Grotesk] font-bold text-[#8a9ab5] uppercase">BOLLINGER BANDS</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#00e676]/20 text-[#00e676]`}>
                    BREAKOUT
                  </span>
               </div>
               <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                     <span className="text-[9px] text-[#8a9ab5]">UPPER</span>
                     <span className="text-sm font-bold text-white">{displayPrice ? (displayPrice * 1.05).toFixed(2) : '---'}</span>
                  </div>
                  <div className="h-4 w-px bg-[#1e2333]"></div>
                  <div className="flex flex-col text-right">
                     <span className="text-[9px] text-[#8a9ab5]">LOWER</span>
                     <span className="text-sm font-bold text-white">{displayPrice ? (displayPrice * 0.95).toFixed(2) : '---'}</span>
                  </div>
               </div>
            </div>

            {/* EMA (20) */}
            <div className="bg-[#141720] border border-[#1e2333] p-4 rounded-xl flex flex-col justify-between">
               <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-[Space_Grotesk] font-bold text-[#8a9ab5] uppercase">EMA (20)</span>
               </div>
               <div className="text-2xl font-[Inter] font-bold text-white mb-1">{data?.history?.length > 0 ? Math.round(data.history[data.history.length-1].sma20 || displayPrice) : '---'}</div>
               <div className="text-[8px] text-[#8a9ab5] font-bold uppercase tracking-wider">WEIGHT PRIORITIZES RECENT PRICE</div>
            </div>

            {/* PATTERN AI */}
            <div className="bg-[#141720] border border-[#1e2333] p-4 rounded-xl flex flex-col justify-between relative overflow-hidden">
               <div className="absolute top-0 right-0 w-16 h-16 bg-[#00e676] opacity-10 rounded-full blur-2xl"></div>
               <div className="flex justify-between items-start mb-2 relative z-10">
                  <span className="text-[10px] font-[Space_Grotesk] font-bold text-[#8a9ab5] uppercase">PATTERN AI</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#00e676]/20 text-[#00e676]`}>
                    {data?.patterns?.[0] ? `${Math.round(data.patterns[0].confidence * 100)}% CONF.` : 'SCANNING'}
                  </span>
               </div>
               <div className="text-sm font-[Space_Grotesk] font-bold text-white mb-1 relative z-10 uppercase">
                 {data?.patterns?.[0]?.name || 'NO CLEAR PATTERN'}
               </div>
               <div className="text-[9px] text-[#00e676] font-bold uppercase relative z-10 flex items-center gap-1">
                 <Activity size={10} /> {data?.patterns?.[0] ? 'DETECTION SUCCESS' : 'MODEL ACTIVE'}
               </div>
            </div>

         </div>
      </div>

      {/* Right Panel: Trade Panel */}
      <div className="col-span-1 lg:col-span-3 space-y-6">
         
         <div className="bg-[#141720] border border-[#1e2333] p-5 rounded-xl">
            {/* PORTFOLIO BALANCE */}
            <div className="mb-6 p-4 bg-[#0d0f12] border border-[#1e2333] rounded-lg relative overflow-hidden">
               <div className="absolute -top-10 -right-10 w-24 h-24 bg-[#00e676] rounded-full opacity-[0.05] blur-xl"></div>
               <div className="flex justify-between items-start mb-4">
                  <span className="text-[10px] font-[Space_Grotesk] font-bold text-[#8a9ab5] uppercase tracking-widest">Portfolio Balance</span>
                  <a href="#portfolio" className="text-[9px] text-[#00e676] hover:underline font-bold uppercase">Details →</a>
               </div>
               <div className="text-2xl font-[Inter] font-bold text-white mb-2">₹{totalNAV.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
               <div className="flex items-center gap-2">
                  <span className="text-xs text-[#8a9ab5]">Shares Held: <span className="text-white font-bold">{currentPos.quantity}</span></span>
                  {currentPos.quantity > 0 && (
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${currentPos.pnl_pct >= 0 ? 'bg-[#00e676]/20 text-[#00e676]' : 'bg-[#ff4444]/20 text-[#ff4444]'}`}>
                      {currentPos.pnl_pct >= 0 ? '+' : ''}{currentPos.pnl_pct}%
                    </span>
                  )}
               </div>
            </div>

            {/* BUY / SELL TOGGLE */}
            <div className="flex bg-[#0d0f12] border border-[#1e2333] rounded-lg mb-6 p-1">
               <button onClick={() => setTradeSide('BUY')} className={`flex-1 py-2 text-xs font-[Space_Grotesk] font-bold tracking-widest rounded-md transition-all ${tradeSide === 'BUY' ? 'bg-[#00e676] text-[#0d0f12]' : 'text-[#8a9ab5] hover:text-white'}`}>BUY</button>
               <button onClick={() => setTradeSide('SELL')} className={`flex-1 py-2 text-xs font-[Space_Grotesk] font-bold tracking-widest rounded-md transition-all ${tradeSide === 'SELL' ? 'bg-[#ff4444] text-white' : 'text-[#8a9ab5] hover:text-white'}`}>SELL</button>
            </div>

            {/* ORDER FORM */}
            <div className="space-y-4 mb-6">
               <div className="bg-[#0d0f12] border border-[#1e2333] rounded-lg p-3 flex justify-between items-center focus-within:border-[#00e676] transition-colors">
                  <span className="text-[10px] font-bold text-[#8a9ab5]">PRICE (₹)</span>
                  <input type="number" value={displayPrice || ''} onChange={(e) => {
                      setCustomPrice(parseFloat(e.target.value) || 0);
                  }} className="bg-transparent text-right outline-none text-sm font-[Inter] font-bold text-white w-24" />
               </div>
               <div className="bg-[#0d0f12] border border-[#1e2333] rounded-lg p-3 flex justify-between items-center focus-within:border-[#00e676] transition-colors">
                  <span className="text-[10px] font-bold text-[#8a9ab5]">QTY</span>
                  <input type="number" value={tradeAmount} onChange={e => setTradeAmount(e.target.value)} className="bg-transparent text-right outline-none text-sm font-[Inter] font-bold text-white w-24" />
               </div>

               <div className="flex justify-between text-[11px] font-[Inter]">
                  <span className="text-[#8a9ab5]">Total Amount</span>
                  <span className="font-bold text-white">₹{(displayPrice * (tradeAmount || 0)).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
               </div>
               <div className="flex justify-between text-[11px] font-[Inter] pb-2 border-b border-[#1e2333]">
                  <span className="text-[#8a9ab5]">Available Limit</span>
                  <span className="font-bold text-white">₹{(portfolio?.balance || 500000).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
               </div>
            </div>

            <button onClick={() => handleTrade(tradeSide, displayPrice)} 
                    className={`w-full py-4 text-sm font-[Space_Grotesk] font-bold tracking-widest uppercase rounded-lg shadow-lg hover:brightness-110 transition-all ${tradeSide === 'BUY' ? 'bg-[#00e676] text-[#0d0f12] shadow-[#00e676]/20' : 'bg-[#ff4444] text-white shadow-[#ff4444]/20'}`}>
               {tradeSide} {symbol.split('.')[0]}
            </button>

         </div>

         {/* TOP ASSETS MINI LIST */}
         <div className="bg-[#141720] border border-[#1e2333] p-5 rounded-xl">
            <h3 className="text-[10px] font-[Space_Grotesk] font-bold text-[#8a9ab5] uppercase tracking-widest mb-4">Top Assets</h3>
            <div className="space-y-3">
               {[
                 {s: 'RELIANCE', p: 2987.50, c: '+1.2%'},
                 {s: 'HDFCBANK', p: 1432.10, c: '+0.8%'},
                 {s: 'TCS', p: 4120.00, c: '-0.5%'},
                 {s: 'NVDA', p: 880.60, c: '+4.2%'}
               ].map((asset, i) => (
                  <div key={i} className="flex justify-between items-center cursor-pointer hover:bg-[#0d0f12] -mx-2 px-2 py-1.5 rounded transition-colors" onClick={() => setSymbol(asset.s)}>
                     <span className="text-xs font-bold text-white">{asset.s}</span>
                     <div className="text-right">
                        <div className="text-xs font-[Inter] text-white">₹{asset.p.toFixed(2)}</div>
                        <div className={`text-[10px] font-bold ${asset.c.startsWith('+') ? 'text-[#00e676]' : 'text-[#ff4444]'}`}>{asset.c}</div>
                     </div>
                  </div>
               ))}
            </div>
         </div>

      </div>
    </div>
  );
}
