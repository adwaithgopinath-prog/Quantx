import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Zap, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Clock, BarChart2, Filter, Bell, RefreshCw } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, ReferenceLine, BarChart, Bar, Cell } from 'recharts';
import api from '../api';

const TIMEFRAMES = ['1m', '5m', '15m', '1h', '4h', '1D'];

const MOCK_SIGNALS = [
  { id: 1, symbol: 'RELIANCE.NS', type: 'BUY', confidence: 87, indicator: 'MACD Crossover', timeframe: '1h', time: '09:32', pnl: '+2.4%' },
  { id: 2, symbol: 'TCS.NS', type: 'SELL', confidence: 72, indicator: 'RSI Overbought', timeframe: '15m', time: '09:45', pnl: '-0.8%' },
  { id: 3, symbol: 'HDFCBANK.NS', type: 'BUY', confidence: 91, indicator: 'Golden Cross', timeframe: '1D', time: '09:15', pnl: '+3.1%' },
  { id: 4, symbol: 'INFY.NS', type: 'HOLD', confidence: 58, indicator: 'RSI Neutral', timeframe: '4h', time: '08:55', pnl: '+0.2%' },
  { id: 5, symbol: 'TATAMOTORS.NS', type: 'BUY', confidence: 79, indicator: 'MA Crossover', timeframe: '1h', time: '10:02', pnl: '+1.7%' },
  { id: 6, symbol: 'WIPRO.NS', type: 'SELL', confidence: 83, indicator: 'Death Cross', timeframe: '4h', time: '08:30', pnl: '-1.2%' },
];

function generateSignalData() {
  return Array.from({ length: 50 }, (_, i) => ({
    t: i,
    price: 2800 + Math.sin(i * 0.3) * 80 + Math.random() * 30,
    signal: i === 15 ? 'BUY' : i === 32 ? 'SELL' : null,
    confidence: 60 + Math.random() * 30,
  }));
}

function ConfidenceMeter({ value, color }) {
  const r = 40;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference - (value / 100) * circumference;
  return (
    <svg width="100" height="100" className="rotate-[-90deg]">
      <circle cx="50" cy="50" r={r} fill="none" stroke="#1e2333" strokeWidth="8" />
      <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="8"
        strokeDasharray={circumference} strokeDashoffset={dashOffset}
        strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease' }} />
      <text x="50" y="58" textAnchor="middle" fill="white" fontSize="18" fontWeight="bold"
        style={{ transform: 'rotate(90deg)', transformOrigin: '50% 50%', fontFamily: 'Inter' }}>
        {value}%
      </text>
    </svg>
  );
}

export default function AlgorithmicEngine({ symbol, data, livePrice }) {
  const [activeTimeframe, setActiveTimeframe] = useState('1h');
  const [signalData] = useState(generateSignalData());
  const [alerts, setAlerts] = useState([]);
  const [filterType, setFilterType] = useState('ALL');
  const [scanning, setScanning] = useState(false);
  const [signalQueue, setSignalQueue] = useState(MOCK_SIGNALS);

  const indicators = data?.indicators || {};
  const rsi = indicators.rsi ? Number(indicators.rsi).toFixed(1) : 52.4;
  const macd = indicators.macd?.value ? Number(indicators.macd.value).toFixed(2) : 1.24;
  const macdSignal = indicators.macd?.signal ? Number(indicators.macd.signal).toFixed(2) : 0.86;
  const fusion = data?.fusion || {};
  const confidence = fusion.confidence ? parseInt(fusion.confidence) : 74;
  const rec = fusion.recommendation || 'BUY';
  const recColor = (rec && typeof rec === 'string') 
    ? (rec.includes('BUY') ? '#00e676' : rec.includes('SELL') ? '#ff4444' : '#ff9800')
    : '#ff9800';

  const runScan = () => {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      const newAlert = {
        id: Date.now(),
        symbol: (symbol && typeof symbol === 'string') ? (symbol.split('.')[0] || 'ASSET') : 'ASSET',
        type: Math.random() > 0.5 ? 'BUY' : 'SELL',
        confidence: Math.round(65 + Math.random() * 30),
        indicator: ['RSI Crossover', 'MACD Signal', 'Golden Cross', 'BB Squeeze'][Math.floor(Math.random() * 4)],
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        timeframe: activeTimeframe,
      };
      setAlerts(prev => [newAlert, ...prev].slice(0, 5));
    }, 1800);
  };

  const filtered = filterType === 'ALL' ? signalQueue : signalQueue.filter(s => s.type === filterType);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#00e676]/10 border border-[#00e676]/30 rounded-lg flex items-center justify-center">
            <Activity size={18} className="text-[#00e676]" />
          </div>
          <div>
            <h2 className="text-sm font-bold uppercase tracking-widest text-white font-[Space_Grotesk]">Algorithmic Engine</h2>
            <p className="text-[10px] text-[#8a9ab5] font-mono">RSI · MACD · MA Crossovers · Signal Fusion</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-[#0d0f12] border border-[#1e2333] rounded-lg p-0.5">
            {TIMEFRAMES.map(tf => (
              <button key={tf} onClick={() => setActiveTimeframe(tf)}
                className={`px-3 py-1.5 text-[10px] font-bold rounded transition-all ${activeTimeframe === tf ? 'bg-[#00e676] text-[#0d0f12]' : 'text-[#8a9ab5] hover:text-white'}`}>
                {tf}
              </button>
            ))}
          </div>
          <button onClick={runScan} disabled={scanning}
            className="flex items-center gap-2 px-4 py-2 bg-[#00e676]/10 border border-[#00e676]/30 text-[#00e676] rounded-lg text-[10px] font-bold uppercase hover:bg-[#00e676]/20 transition-all">
            {scanning ? <RefreshCw size={12} className="animate-spin" /> : <Zap size={12} />}
            {scanning ? 'SCANNING...' : 'RUN SCAN'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left: Signal Overview */}
        <div className="xl:col-span-8 space-y-6">
          {/* 3 Indicator Cards */}
          <div className="grid grid-cols-3 gap-4">
            {/* RSI Card */}
            <div className="bg-[#141720] border border-[#1e2333] rounded-xl p-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-[#ff9800] opacity-5 rounded-full blur-2xl" />
              <div className="text-[10px] font-bold text-[#8a9ab5] uppercase tracking-widest mb-1">RSI (14)</div>
              <div className="text-3xl font-bold text-white font-[Inter] mb-2">{rsi}</div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-[#ff9800] shadow-[0_0_6px_#ff9800]" />
                <span className="text-[10px] font-bold text-[#ff9800] uppercase">
                  {rsi > 70 ? 'OVERBOUGHT' : rsi < 30 ? 'OVERSOLD' : 'NEUTRAL'}
                </span>
              </div>
              <div className="w-full h-2 bg-[#0d0f12] rounded-full overflow-hidden border border-[#1e2333]">
                <div className="h-full bg-gradient-to-r from-[#ff4444] via-[#ff9800] to-[#00e676] rounded-full"
                  style={{ width: `${rsi}%` }} />
              </div>
              <div className="flex justify-between text-[8px] text-[#8a9ab5] mt-1 font-mono">
                <span>OVERSOLD 30</span><span>70 OVERBOUGHT</span>
              </div>
            </div>

            {/* MACD Card */}
            <div className="bg-[#141720] border border-[#1e2333] rounded-xl p-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-[#00e676] opacity-5 rounded-full blur-2xl" />
              <div className="text-[10px] font-bold text-[#8a9ab5] uppercase tracking-widest mb-1">MACD (12,26,9)</div>
              <div className="flex items-end gap-2 mb-2">
                <span className={`text-3xl font-bold font-[Inter] ${macd > 0 ? 'text-[#00e676]' : 'text-[#ff4444]'}`}>{macd}</span>
                <span className="text-xs text-[#8a9ab5] mb-1 font-mono">sig: {macdSignal}</span>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-2 h-2 rounded-full ${macd > macdSignal ? 'bg-[#00e676] shadow-[0_0_6px_#00e676]' : 'bg-[#ff4444] shadow-[0_0_6px_#ff4444]'}`} />
                <span className={`text-[10px] font-bold uppercase ${macd > macdSignal ? 'text-[#00e676]' : 'text-[#ff4444]'}`}>
                  {macd > macdSignal ? 'BULLISH CROSS' : 'BEARISH CROSS'}
                </span>
              </div>
              <div className="flex gap-2">
                <div className="flex-1 bg-[#0d0f12] border border-[#1e2333] p-2 rounded text-center">
                  <div className="text-[8px] text-[#8a9ab5] mb-0.5">HISTOGRAM</div>
                  <div className={`text-xs font-bold ${macd - macdSignal > 0 ? 'text-[#00e676]' : 'text-[#ff4444]'}`}>
                    {(macd - macdSignal).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>

            {/* Confidence Meter */}
            <div className="bg-[#141720] border border-[#1e2333] rounded-xl p-5 flex flex-col items-center justify-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 opacity-5 rounded-full blur-2xl" style={{ background: recColor }} />
              <div className="text-[10px] font-bold text-[#8a9ab5] uppercase tracking-widest mb-3">Signal Confidence</div>
              <ConfidenceMeter value={confidence} color={recColor} />
              <div className="mt-2 text-xs font-bold uppercase" style={{ color: recColor }}>{rec}</div>
            </div>
          </div>

          {/* Signal Chart */}
          <div className="bg-[#141720] border border-[#1e2333] rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="text-[10px] font-bold text-[#8a9ab5] uppercase tracking-widest">Price Action · Signal Points</div>
              <div className="flex items-center gap-3 text-[9px] font-bold">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#00e676]"/> BUY SIGNAL</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#ff4444]"/> SELL SIGNAL</span>
              </div>
            </div>
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={signalData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="algGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00e676" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#00e676" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="t" hide />
                  <YAxis domain={['dataMin - 20', 'dataMax + 20']} hide />
                  <Tooltip contentStyle={{ background: '#141720', border: '1px solid #1e2333', borderRadius: 8, fontSize: 11, color: 'white' }} formatter={v => [`₹${v.toFixed(2)}`, 'Price']} />
                  <Area type="monotone" dataKey="price" stroke="#00e676" strokeWidth={1.5} fill="url(#algGrad)" dot={false} />
                  {signalData.filter(d => d.signal).map((d, i) => (
                    <ReferenceLine key={i} x={d.t} stroke={d.signal === 'BUY' ? '#00e676' : '#ff4444'} strokeDasharray="3 3" />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Moving Average Crossovers */}
          <div className="bg-[#141720] border border-[#1e2333] rounded-xl p-5">
            <div className="text-[10px] font-bold text-[#8a9ab5] uppercase tracking-widest mb-4 flex items-center gap-2">
              <BarChart2 size={12} className="text-[var(--color-gold)]" /> Moving Average Matrix
            </div>
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'MA20 vs MA50', status: 'BULLISH', color: '#00e676', ma1: 2831, ma2: 2798 },
                { label: 'MA50 vs MA200', status: 'CONSOLIDATING', color: '#ff9800', ma1: 2798, ma2: 2745 },
                { label: 'EMA9 vs EMA21', status: 'BULLISH', color: '#00e676', ma1: 2845, ma2: 2820 },
                { label: 'VWAP vs Price', status: 'ABOVE VWAP', color: '#00e676', ma1: null, ma2: null },
              ].map((item, i) => (
                <div key={i} className="bg-[#0d0f12] border border-[#1e2333] p-3 rounded-lg hover:border-[#8a9ab5]/40 transition-colors">
                  <div className="text-[9px] text-[#8a9ab5] uppercase mb-2 font-bold">{item.label}</div>
                  <div className="w-2 h-2 rounded-full mb-2 shadow-lg" style={{ background: item.color, boxShadow: `0 0 8px ${item.color}` }} />
                  <div className="text-[10px] font-bold uppercase" style={{ color: item.color }}>{item.status}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Alerts & Signal Feed */}
        <div className="xl:col-span-4 space-y-4">
          {/* Live Alert Feed */}
          <div className="bg-[#141720] border border-[#1e2333] rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="text-[10px] font-bold text-[#8a9ab5] uppercase tracking-widest flex items-center gap-2">
                <Bell size={12} className="text-[#ff9800]" /> Live Alerts
              </div>
              <div className="w-2 h-2 rounded-full bg-[#00e676] animate-pulse shadow-[0_0_6px_#00e676]" />
            </div>
            <AnimatePresence>
              {alerts.length === 0 ? (
                <div className="text-[10px] text-[#8a9ab5] font-mono text-center py-4">
                  Click "RUN SCAN" to generate alerts
                </div>
              ) : (
                <div className="space-y-2">
                  {alerts.map(alert => (
                    <motion.div key={alert.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                      className={`p-3 rounded-lg border ${alert.type === 'BUY' ? 'bg-[#00e676]/5 border-[#00e676]/20' : 'bg-[#ff4444]/5 border-[#ff4444]/20'}`}>
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-bold text-white">{alert.symbol}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${alert.type === 'BUY' ? 'bg-[#00e676]/20 text-[#00e676]' : 'bg-[#ff4444]/20 text-[#ff4444]'}`}>
                          {alert.type}
                        </span>
                      </div>
                      <div className="text-[9px] text-[#8a9ab5] mt-1 font-mono">{alert.indicator} · {alert.timeframe} · {alert.time}</div>
                      <div className="mt-1.5 w-full h-1 bg-[#1e2333] rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${alert.confidence}%`, background: alert.type === 'BUY' ? '#00e676' : '#ff4444' }} />
                      </div>
                      <div className="text-[8px] text-[#8a9ab5] mt-0.5 font-mono">{alert.confidence}% confidence</div>
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Signal Queue */}
          <div className="bg-[#141720] border border-[#1e2333] rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="text-[10px] font-bold text-[#8a9ab5] uppercase tracking-widest">Signal Queue</div>
              <div className="flex gap-1">
                {['ALL', 'BUY', 'SELL', 'HOLD'].map(f => (
                  <button key={f} onClick={() => setFilterType(f)}
                    className={`px-2 py-1 text-[8px] font-bold rounded transition-colors ${filterType === f ? 'bg-[#1e2333] text-white' : 'text-[#8a9ab5]'}`}>
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
              {filtered.map(sig => (
                <div key={sig.id} className="flex items-center justify-between p-2.5 bg-[#0d0f12] rounded-lg border border-[#1e2333] hover:border-[#8a9ab5]/30 transition-colors">
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${sig.type === 'BUY' ? 'bg-[#00e676]' : sig.type === 'SELL' ? 'bg-[#ff4444]' : 'bg-[#ff9800]'}`} />
                    <div>
                      <div className="text-[10px] font-bold text-white">{sig.symbol.split('.')[0]}</div>
                      <div className="text-[8px] text-[#8a9ab5] font-mono">{sig.indicator}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${sig.type === 'BUY' ? 'bg-[#00e676]/20 text-[#00e676]' : sig.type === 'SELL' ? 'bg-[#ff4444]/20 text-[#ff4444]' : 'bg-[#ff9800]/20 text-[#ff9800]'}`}>
                      {sig.type}
                    </div>
                    <div className="text-[8px] text-[#8a9ab5] mt-0.5 font-mono">{sig.timeframe} · {sig.confidence}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
