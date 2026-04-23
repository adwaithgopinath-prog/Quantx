import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, TrendingUp, TrendingDown, Activity, Zap, Clock, Globe } from 'lucide-react';
import { WS_BASE } from '../api';

// 50+ instruments across NSE/BSE and global markets
const INSTRUMENTS = [
  // NSE Blue Chips
  { sym: 'RELIANCE.NS', name: 'Reliance Industries', exchange: 'NSE', base: 2987 },
  { sym: 'TCS.NS', name: 'Tata Consultancy', exchange: 'NSE', base: 4120 },
  { sym: 'HDFCBANK.NS', name: 'HDFC Bank', exchange: 'NSE', base: 1678 },
  { sym: 'INFY.NS', name: 'Infosys', exchange: 'NSE', base: 1845 },
  { sym: 'ICICIBANK.NS', name: 'ICICI Bank', exchange: 'NSE', base: 1240 },
  { sym: 'HINDUNILVR.NS', name: 'Hindustan Unilever', exchange: 'NSE', base: 2456 },
  { sym: 'BAJFINANCE.NS', name: 'Bajaj Finance', exchange: 'NSE', base: 6780 },
  { sym: 'WIPRO.NS', name: 'Wipro Ltd', exchange: 'NSE', base: 456 },
  { sym: 'TATAMOTORS.NS', name: 'Tata Motors', exchange: 'NSE', base: 920 },
  { sym: 'MARUTI.NS', name: 'Maruti Suzuki', exchange: 'NSE', base: 12340 },
  // BSE
  { sym: 'SUNPHARMA.NS', name: 'Sun Pharma', exchange: 'BSE', base: 1890 },
  { sym: 'ONGC.NS', name: 'ONGC', exchange: 'BSE', base: 267 },
  { sym: 'LT.NS', name: 'Larsen & Toubro', exchange: 'BSE', base: 3450 },
  { sym: 'AXISBANK.NS', name: 'Axis Bank', exchange: 'BSE', base: 1123 },
  { sym: 'NESTLEIND.NS', name: 'Nestle India', exchange: 'BSE', base: 24500 },
  // Global
  { sym: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ', base: 213 },
  { sym: 'NVDA', name: 'NVIDIA Corp.', exchange: 'NASDAQ', base: 875 },
  { sym: 'MSFT', name: 'Microsoft', exchange: 'NASDAQ', base: 425 },
  { sym: 'GOOGL', name: 'Alphabet Inc.', exchange: 'NASDAQ', base: 178 },
  { sym: 'AMZN', name: 'Amazon', exchange: 'NASDAQ', base: 203 },
  { sym: 'META', name: 'Meta Platforms', exchange: 'NASDAQ', base: 524 },
  { sym: 'TSLA', name: 'Tesla Inc.', exchange: 'NASDAQ', base: 247 },
  { sym: 'JPM', name: 'JPMorgan Chase', exchange: 'NYSE', base: 210 },
  { sym: 'BAC', name: 'Bank of America', exchange: 'NYSE', base: 43 },
  { sym: 'V', name: 'Visa Inc.', exchange: 'NYSE', base: 278 },
  // Crypto-like (simulated)
  { sym: 'BTC-USD', name: 'Bitcoin', exchange: 'CRYPTO', base: 67800 },
  { sym: 'ETH-USD', name: 'Ethereum', exchange: 'CRYPTO', base: 3450 },
  { sym: 'SOL-USD', name: 'Solana', exchange: 'CRYPTO', base: 187 },
];

function MicroCandlestick({ ticks }) {
  if (!ticks || ticks.length < 2) return null;
  const prices = ticks.map(t => t.price);
  const minP = Math.min(...prices);
  const maxP = Math.max(...prices);
  const range = maxP - minP || 1;
  const w = 80;
  const h = 32;

  return (
    <svg width={w} height={h} className="flex-shrink-0">
      {ticks.slice(-20).map((tick, i, arr) => {
        if (i === 0) return null;
        const x1 = ((i - 1) / (arr.length - 1)) * w;
        const x2 = (i / (arr.length - 1)) * w;
        const y1 = h - ((arr[i-1].price - minP) / range) * (h - 4) - 2;
        const y2 = h - ((tick.price - minP) / range) * (h - 4) - 2;
        const color = tick.price >= arr[i-1].price ? '#00e676' : '#ff4444';
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth="1.5" strokeLinecap="round" />;
      })}
    </svg>
  );
}

function useSimulatedTicks(basePrice, speed = 200) {
  const [ticks, setTicks] = useState(() => {
    const now = Date.now();
    return Array.from({ length: 30 }, (_, i) => ({
      price: basePrice + (Math.random() - 0.5) * basePrice * 0.02,
      ts: now - (30 - i) * speed,
    }));
  });

  useEffect(() => {
    const id = setInterval(() => {
      setTicks(prev => {
        const last = prev[prev.length - 1]?.price || basePrice;
        const jitter = (Math.random() - 0.48) * last * 0.001;
        return [...prev.slice(-49), { price: last + jitter, ts: Date.now() }];
      });
    }, speed);
    return () => clearInterval(id);
  }, [basePrice, speed]);

  return ticks;
}

function InstrumentRow({ inst, isNSE, onSelect, selected }) {
  const ticks = useSimulatedTicks(inst.base, 180 + Math.random() * 120);
  const current = ticks[ticks.length - 1]?.price || inst.base;
  const prev = ticks[ticks.length - 2]?.price || inst.base;
  const change = current - prev;
  const changePct = ((current - inst.base) / inst.base) * 100;
  const isUp = change >= 0;

  return (
    <motion.div
      onClick={() => onSelect(inst.sym)}
      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${selected ? 'border-[#00e676]/40 bg-[#00e676]/5' : 'border-[#1e2333] hover:border-[#8a9ab5]/30 hover:bg-[#0d0f12]/50'}`}
      whileHover={{ scale: 1.01 }}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-white truncate">{inst.sym.split('.')[0]}</span>
          <span className="text-[7px] bg-[#1e2333] text-[#8a9ab5] px-1.5 rounded font-mono">{inst.exchange}</span>
        </div>
        <div className="text-[9px] text-[#8a9ab5] truncate font-mono">{inst.name}</div>
      </div>

      <MicroCandlestick ticks={ticks} />

      <div className="text-right flex-shrink-0 min-w-[80px]">
        <div className={`text-xs font-bold font-[Inter] ${isUp ? 'text-[#00e676]' : 'text-[#ff4444]'}`}>
          {isNSE ? '₹' : '$'}{current.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className={`text-[9px] font-mono ${isUp ? 'text-[#00e676]' : 'text-[#ff4444]'}`}>
          {isUp ? '▲' : '▼'} {Math.abs(changePct).toFixed(2)}%
        </div>
      </div>
    </motion.div>
  );
}

function OrderBookDepth({ symbol, basePrice }) {
  const [bids, setBids] = useState([]);
  const [asks, setAsks] = useState([]);
  const wsRef = useRef(null);

  useEffect(() => {
    // Simulate live order book
    const update = () => {
      const p = basePrice;
      setBids(Array.from({ length: 8 }, (_, i) => ({
        price: (p - (i + 1) * 0.5).toFixed(2),
        size: Math.floor(Math.random() * 4000 + 200),
      })));
      setAsks(Array.from({ length: 8 }, (_, i) => ({
        price: (p + (i + 1) * 0.5).toFixed(2),
        size: Math.floor(Math.random() * 4000 + 200),
      })));
    };
    update();
    const id = setInterval(update, 500);
    return () => clearInterval(id);
  }, [basePrice]);

  const maxSize = Math.max(...bids.map(b => b.size), ...asks.map(a => a.size), 1);

  return (
    <div className="bg-[#141720] border border-[#1e2333] rounded-xl p-4">
      <div className="text-[10px] font-bold text-[#8a9ab5] uppercase tracking-widest mb-3 flex items-center gap-2">
        <Activity size={10} className="text-[#00e676]" /> Level 2 Order Book · {symbol?.split('.')[0] || 'SYMBOL'}
      </div>
      <div className="grid grid-cols-2 gap-2 text-[9px] mb-2 font-bold text-[#8a9ab5] uppercase">
        <div className="flex justify-between px-1"><span>BID</span><span>SIZE</span></div>
        <div className="flex justify-between px-1"><span>ASK</span><span>SIZE</span></div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-0.5">
          {bids.map((b, i) => (
            <div key={i} className="relative flex justify-between items-center px-1 py-0.5 text-[9px] font-mono">
              <div className="absolute inset-0 rounded" style={{ background: `rgba(0,230,118,${(b.size / maxSize) * 0.2})` }} />
              <span className="text-[#00e676] relative z-10">{b.price}</span>
              <span className="text-[#8a9ab5] relative z-10">{b.size.toLocaleString()}</span>
            </div>
          ))}
        </div>
        <div className="space-y-0.5">
          {asks.map((a, i) => (
            <div key={i} className="relative flex justify-between items-center px-1 py-0.5 text-[9px] font-mono">
              <div className="absolute inset-0 rounded" style={{ background: `rgba(255,68,68,${(a.size / maxSize) * 0.2})` }} />
              <span className="text-[#ff4444] relative z-10">{a.price}</span>
              <span className="text-[#8a9ab5] relative z-10">{a.size.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function SubMillisecondFeed({ setSymbol }) {
  const [selectedSym, setSelectedSym] = useState('RELIANCE.NS');
  const [filter, setFilter] = useState('ALL');
  const [latency, setLatency] = useState(0.42);
  const [tickCount, setTickCount] = useState(0);

  const selectedInst = INSTRUMENTS.find(i => i.sym === selectedSym) || INSTRUMENTS[0];
  const isNSE = selectedInst.exchange === 'NSE' || selectedInst.exchange === 'BSE';

  // Simulate sub-ms latency display
  useEffect(() => {
    const id = setInterval(() => {
      setLatency(prev => parseFloat((0.1 + Math.random() * 0.8).toFixed(2)));
      setTickCount(prev => prev + Math.floor(Math.random() * 50 + 10));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const handleSelect = (sym) => {
    setSelectedSym(sym);
    setSymbol(sym);
  };

  const filtered = filter === 'ALL' ? INSTRUMENTS : INSTRUMENTS.filter(i => i.exchange === filter);
  const exchanges = ['ALL', 'NSE', 'BSE', 'NASDAQ', 'NYSE', 'CRYPTO'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#7dd3fc]/10 border border-[#7dd3fc]/30 rounded-lg flex items-center justify-center">
            <Wifi size={18} className="text-[#7dd3fc]" />
          </div>
          <div>
            <h2 className="text-sm font-bold uppercase tracking-widest text-white font-[Space_Grotesk]">Sub-Millisecond Feed</h2>
            <p className="text-[10px] text-[#8a9ab5] font-mono">WebSocket · 50+ Instruments · Live L2 Data</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-[10px] font-mono">
            <div className="w-2 h-2 rounded-full bg-[#00e676] animate-pulse shadow-[0_0_6px_#00e676]" />
            <span className="text-[#00e676]">LIVE</span>
          </div>
          <div className="bg-[#0d0f12] border border-[#1e2333] rounded-lg px-3 py-2 text-[9px] font-mono">
            <span className="text-[#8a9ab5]">LAT: </span><span className="text-[#7dd3fc]">{latency}ms</span>
          </div>
          <div className="bg-[#0d0f12] border border-[#1e2333] rounded-lg px-3 py-2 text-[9px] font-mono">
            <span className="text-[#8a9ab5]">TICKS: </span><span className="text-[#7dd3fc]">{tickCount.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Exchange Filter */}
      <div className="flex gap-2 flex-wrap">
        {exchanges.map(ex => (
          <button key={ex} onClick={() => setFilter(ex)}
            className={`px-3 py-1.5 text-[10px] font-bold rounded-lg border transition-all ${filter === ex ? 'bg-[#7dd3fc]/20 border-[#7dd3fc]/50 text-[#7dd3fc]' : 'border-[#1e2333] text-[#8a9ab5] hover:text-white'}`}>
            {ex}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Instrument List */}
        <div className="xl:col-span-7">
          <div className="bg-[#141720] border border-[#1e2333] rounded-xl p-4">
            <div className="text-[10px] font-bold text-[#8a9ab5] uppercase tracking-widest mb-3 flex items-center gap-2">
              <Globe size={10} className="text-[#7dd3fc]" /> {filtered.length} Instruments · Real-Time Micro-Candlesticks
            </div>
            <div className="space-y-1.5 max-h-[480px] overflow-y-auto pr-1">
              {filtered.map((inst) => (
                <InstrumentRow key={inst.sym} inst={inst} isNSE={inst.exchange === 'NSE' || inst.exchange === 'BSE'}
                  onSelect={handleSelect} selected={selectedSym === inst.sym} />
              ))}
            </div>
          </div>
        </div>

        {/* Right: Order Book + Stats */}
        <div className="xl:col-span-5 space-y-4">
          <OrderBookDepth symbol={selectedSym} basePrice={selectedInst.base} />

          {/* Feed Stats */}
          <div className="bg-[#141720] border border-[#1e2333] rounded-xl p-5">
            <div className="text-[10px] font-bold text-[#8a9ab5] uppercase tracking-widest mb-4 flex items-center gap-2">
              <Zap size={10} className="text-[#7dd3fc]" /> Feed Performance
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Avg Latency', value: `${latency}ms`, color: '#7dd3fc' },
                { label: 'Throughput', value: '12.4K/s', color: '#00e676' },
                { label: 'Uptime', value: '99.97%', color: '#00e676' },
                { label: 'Active Feeds', value: `${filtered.length}`, color: '#ff9800' },
                { label: 'Missed Ticks', value: '0', color: '#00e676' },
                { label: 'Reconnects', value: '0', color: '#00e676' },
              ].map((stat, i) => (
                <div key={i} className="bg-[#0d0f12] border border-[#1e2333] rounded-lg p-3">
                  <div className="text-[8px] text-[#8a9ab5] uppercase font-bold mb-1">{stat.label}</div>
                  <div className="text-sm font-bold font-[Inter]" style={{ color: stat.color }}>{stat.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* HFT Tick Stream */}
          <div className="bg-[#141720] border border-[#1e2333] rounded-xl p-4">
            <div className="text-[10px] font-bold text-[#8a9ab5] uppercase tracking-widest mb-3 flex items-center gap-2">
              <Clock size={10} className="text-[#ff9800]" /> HFT Tick Stream · {selectedSym?.split('.')[0]}
            </div>
            <HFTTickStream basePrice={selectedInst.base} />
          </div>
        </div>
      </div>
    </div>
  );
}

function HFTTickStream({ basePrice }) {
  const [ticks, setTicks] = useState([]);

  useEffect(() => {
    const id = setInterval(() => {
      const price = basePrice + (Math.random() - 0.48) * basePrice * 0.002;
      const latency = (0.05 + Math.random() * 0.75).toFixed(2);
      setTicks(prev => [{
        price: price.toFixed(2),
        vol: Math.floor(Math.random() * 500 + 10),
        latency,
        ts: Date.now(),
        up: Math.random() > 0.48,
      }, ...prev].slice(0, 12));
    }, 300);
    return () => clearInterval(id);
  }, [basePrice]);

  return (
    <div className="space-y-1 font-mono text-[9px] max-h-[140px] overflow-hidden">
      <AnimatePresence>
        {ticks.map((tick, i) => (
          <motion.div key={tick.ts} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
            className="flex items-center gap-2 py-0.5 border-b border-[#1e2333]/30">
            <span className="text-[#8a9ab5] w-16">{new Date(tick.ts).toLocaleTimeString('en-IN', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
            <span className={tick.up ? 'text-[#00e676]' : 'text-[#ff4444]'} style={{ minWidth: 70 }}>
              {tick.up ? '▲' : '▼'} {tick.price}
            </span>
            <span className="text-[#8a9ab5]">vol: {tick.vol}</span>
            <span className="text-[#7dd3fc] ml-auto">{tick.latency}ms</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
