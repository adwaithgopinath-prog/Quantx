import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, AlertTriangle, TrendingUp, TrendingDown, BarChart2, Activity, Zap, RefreshCw } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, AreaChart, Area, ReferenceLine } from 'recharts';
import api from '../api';

function generateVolumeProfile(basePrice, numLevels = 16) {
  const range = basePrice * 0.12;
  const min = basePrice - range / 2;
  let pocIdx = Math.floor(numLevels * 0.55);
  return Array.from({ length: numLevels }, (_, i) => {
    const price = min + (i / numLevels) * range;
    let vol = Math.abs(Math.sin((i - pocIdx) * 0.7)) * 3000 + Math.random() * 1500;
    if (i === pocIdx) vol = 8000 + Math.random() * 2000;
    return {
      price: price.toFixed(2),
      volume: Math.round(vol),
      level: i === pocIdx ? 'POC' : i === pocIdx + 3 ? 'VAH' : i === pocIdx - 3 ? 'VAL' : 'NODE',
    };
  }).reverse();
}

function generateBlockTrades(basePrice) {
  return Array.from({ length: 8 }, (_, i) => ({
    id: i,
    time: `${String(9 + Math.floor(i * 0.7)).padStart(2, '0')}:${String(Math.floor(Math.random() * 59)).padStart(2, '0')}`,
    price: (basePrice + (Math.random() - 0.5) * basePrice * 0.02).toFixed(2),
    size: Math.floor(Math.random() * 450000 + 50000),
    type: Math.random() > 0.45 ? 'ACCUMULATION' : 'DISTRIBUTION',
    confidence: Math.floor(72 + Math.random() * 22),
  }));
}

function generateSmartMoneyFlow() {
  return Array.from({ length: 40 }, (_, i) => ({
    t: i,
    institutional: 40 + Math.sin(i * 0.3) * 25 + Math.random() * 10,
    retail: 30 + Math.cos(i * 0.4) * 15 + Math.random() * 8,
  }));
}

export default function DarkPoolAccess({ symbol, data, livePrice }) {
  const [basePrice, setBasePrice] = useState(data?.current_price || 2987);
  const [volumeProfile, setVolumeProfile] = useState([]);
  const [blockTrades, setBlockTrades] = useState([]);
  const [smartMoneyFlow, setSmartMoneyFlow] = useState([]);
  const [smartMoneyIndex, setSmartMoneyIndex] = useState(72);
  const [darkPoolRatio, setDarkPoolRatio] = useState('24%');
  const [loading, setLoading] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState(null);

  useEffect(() => {
    const price = livePrice?.price || data?.current_price || 2987;
    setBasePrice(price);
    setVolumeProfile(generateVolumeProfile(price));
    setBlockTrades(generateBlockTrades(price));
    setSmartMoneyFlow(generateSmartMoneyFlow());
    setSmartMoneyIndex(Math.round(55 + Math.random() * 35));
    setDarkPoolRatio(`${Math.round(15 + Math.random() * 20)}%`);
  }, [symbol, livePrice?.price, data?.current_price]);

  const refresh = () => {
    setLoading(true);
    setTimeout(() => {
      setVolumeProfile(generateVolumeProfile(basePrice));
      setBlockTrades(generateBlockTrades(basePrice));
      setSmartMoneyIndex(Math.round(55 + Math.random() * 35));
      setLoading(false);
    }, 1200);
  };

  const pocLevel = volumeProfile.find(v => v.level === 'POC');
  const vahLevel = volumeProfile.find(v => v.level === 'VAH');
  const valLevel = volumeProfile.find(v => v.level === 'VAL');
  const hiddenBias = smartMoneyIndex > 65 ? 'BULLISH ACCUMULATION' : smartMoneyIndex > 40 ? 'NEUTRAL FLOW' : 'BEARISH DISTRIBUTION';
  const biasColor = smartMoneyIndex > 65 ? '#00e676' : smartMoneyIndex > 40 ? '#ff9800' : '#ff4444';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#a855f7]/10 border border-[#a855f7]/30 rounded-lg flex items-center justify-center">
            <Eye size={18} className="text-[#a855f7]" />
          </div>
          <div>
            <h2 className="text-sm font-bold uppercase tracking-widest text-white font-[Space_Grotesk]">Dark Pool Access</h2>
            <p className="text-[10px] text-[#8a9ab5] font-mono">Block Trades · VPOC · Smart Money · Institutional Flow</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 bg-[#a855f7]/10 border border-[#a855f7]/30 rounded-lg text-[9px] font-mono">
            <Eye size={10} className="text-[#a855f7]" />
            <span className="text-[#a855f7]">DARK POOL: {darkPoolRatio}</span>
          </div>
          <button onClick={refresh} disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-[#0d0f12] border border-[#1e2333] text-[#8a9ab5] rounded-lg text-[10px] font-bold uppercase hover:text-white hover:border-[#8a9ab5]/40 transition-all">
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            REFRESH
          </button>
        </div>
      </div>

      {/* Smart Money Summary Bar */}
      <div className="bg-[#141720] border border-[#1e2333] rounded-xl p-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="flex flex-col border-l-2 pl-3" style={{ borderColor: biasColor }}>
            <span className="text-[9px] text-[#8a9ab5] uppercase font-bold mb-1">Smart Money Index</span>
            <span className="text-2xl font-bold font-[Inter]" style={{ color: biasColor }}>{smartMoneyIndex}</span>
            <span className="text-[9px] font-bold uppercase mt-1" style={{ color: biasColor }}>{hiddenBias}</span>
          </div>
          <div className="flex flex-col border-l-2 border-[#a855f7] pl-3">
            <span className="text-[9px] text-[#8a9ab5] uppercase font-bold mb-1">Dark Pool Ratio</span>
            <span className="text-2xl font-bold text-[#a855f7] font-[Inter]">{darkPoolRatio}</span>
            <span className="text-[9px] text-[#8a9ab5] font-mono mt-1">of total volume</span>
          </div>
          <div className="flex flex-col border-l-2 border-[var(--color-gold)] pl-3">
            <span className="text-[9px] text-[#8a9ab5] uppercase font-bold mb-1">VPOC Level</span>
            <span className="text-2xl font-bold text-[var(--color-gold)] font-[Inter]">₹{pocLevel?.price || '---'}</span>
            <span className="text-[9px] text-[#8a9ab5] font-mono mt-1">value area center</span>
          </div>
          <div className="flex flex-col border-l-2 border-[#ff9800] pl-3">
            <span className="text-[9px] text-[#8a9ab5] uppercase font-bold mb-1">Block Trades</span>
            <span className="text-2xl font-bold text-[#ff9800] font-[Inter]">{blockTrades.length}</span>
            <span className="text-[9px] text-[#8a9ab5] font-mono mt-1">detected today</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Volume Profile */}
        <div className="xl:col-span-4">
          <div className="bg-[#141720] border border-[#1e2333] rounded-xl p-5 h-full">
            <div className="text-[10px] font-bold text-[#8a9ab5] uppercase tracking-widest mb-4 flex items-center gap-2">
              <BarChart2 size={10} className="text-[var(--color-gold)]" /> Volume Profile (VPOC · VAH · VAL)
            </div>
            <div className="h-[360px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={volumeProfile} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="price" tick={{ fill: '#8a9ab5', fontSize: 8, fontFamily: 'monospace' }} width={52} />
                  <Tooltip
                    contentStyle={{ background: '#141720', border: '1px solid #1e2333', fontSize: 10, color: 'white' }}
                    formatter={(val, name, props) => [val.toLocaleString(), props.payload.level || 'Volume']}
                  />
                  <Bar dataKey="volume" radius={[0, 2, 2, 0]}>
                    {volumeProfile.map((v, i) => (
                      <Cell key={i}
                        fill={v.level === 'POC' ? 'var(--color-gold)' : v.level === 'VAH' ? '#00e676' : v.level === 'VAL' ? '#ff4444' : '#a855f7'}
                        opacity={v.level === 'POC' ? 1 : v.level === 'NODE' ? 0.4 : 0.7}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex gap-3 mt-2 flex-wrap text-[8px] font-bold font-mono">
              <span className="text-[var(--color-gold)]">■ POC</span>
              <span className="text-[#00e676]">■ VAH</span>
              <span className="text-[#ff4444]">■ VAL</span>
              <span className="text-[#a855f7]">■ NODE</span>
            </div>
          </div>
        </div>

        {/* Block Trades */}
        <div className="xl:col-span-4">
          <div className="bg-[#141720] border border-[#1e2333] rounded-xl p-5 h-full">
            <div className="text-[10px] font-bold text-[#8a9ab5] uppercase tracking-widest mb-4 flex items-center gap-2">
              <AlertTriangle size={10} className="text-[#ff9800]" /> Block Trade Alerts
            </div>
            <div className="space-y-2">
              {blockTrades.map((trade, i) => (
                <motion.div key={trade.id}
                  onClick={() => setSelectedBlock(selectedBlock === trade.id ? null : trade.id)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${trade.type === 'ACCUMULATION' ? 'border-[#00e676]/20 hover:bg-[#00e676]/5' : 'border-[#ff4444]/20 hover:bg-[#ff4444]/5'} ${selectedBlock === trade.id ? (trade.type === 'ACCUMULATION' ? 'bg-[#00e676]/5' : 'bg-[#ff4444]/5') : 'bg-[#0d0f12]'}`}
                  initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                >
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: trade.type === 'ACCUMULATION' ? '#00e676' : '#ff4444' }} />
                      <span className="text-[10px] font-bold text-white">{trade.type}</span>
                    </div>
                    <span className="text-[9px] text-[#8a9ab5] font-mono">{trade.time}</span>
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <div className="text-[9px] text-[#8a9ab5]">Price: <span className="text-white">₹{trade.price}</span></div>
                      <div className="text-[9px] text-[#8a9ab5]">Size: <span className="text-white">{trade.size.toLocaleString()}</span></div>
                    </div>
                    <div className="text-right">
                      <div className="text-[8px] text-[#8a9ab5] mb-1">Conf.</div>
                      <div className="text-xs font-bold" style={{ color: trade.type === 'ACCUMULATION' ? '#00e676' : '#ff4444' }}>{trade.confidence}%</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Smart Money Flow */}
        <div className="xl:col-span-4 space-y-4">
          <div className="bg-[#141720] border border-[#1e2333] rounded-xl p-5">
            <div className="text-[10px] font-bold text-[#8a9ab5] uppercase tracking-widest mb-4 flex items-center gap-2">
              <Activity size={10} className="text-[#a855f7]" /> Institutional vs Retail Flow
            </div>
            <div className="h-[160px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={smartMoneyFlow} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="instGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#a855f7" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#a855f7" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="retGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ff9800" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#ff9800" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="t" hide />
                  <YAxis hide domain={[0, 100]} />
                  <Tooltip contentStyle={{ background: '#141720', border: '1px solid #1e2333', fontSize: 10, color: 'white' }} />
                  <Area type="monotone" dataKey="institutional" stroke="#a855f7" strokeWidth={2} fill="url(#instGrad)" name="Institutional" dot={false} />
                  <Area type="monotone" dataKey="retail" stroke="#ff9800" strokeWidth={1.5} fill="url(#retGrad)" name="Retail" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex gap-4 text-[9px] font-bold mt-2">
              <span className="text-[#a855f7]">■ Institutional</span>
              <span className="text-[#ff9800]">■ Retail</span>
            </div>
          </div>

          {/* Hidden Bias Indicator */}
          <div className="bg-[#141720] border border-[#1e2333] rounded-xl p-5">
            <div className="text-[10px] font-bold text-[#8a9ab5] uppercase tracking-widest mb-4 flex items-center gap-2">
              <Zap size={10} className="text-[var(--color-gold)]" /> Smart Money Tracker
            </div>
            <div className="space-y-3">
              {[
                { label: 'Net Institutional Flow', val: '+₹2.4Cr', color: '#00e676' },
                { label: 'Block Trade Bias', val: hiddenBias, color: biasColor },
                { label: 'Dark Pool %', val: darkPoolRatio, color: '#a855f7' },
                { label: 'Accumulation Days', val: '7/10', color: '#00e676' },
                { label: 'Distribution Signal', val: 'WEAK', color: '#ff9800' },
              ].map((item, i) => (
                <div key={i} className="flex justify-between items-center border-b border-[#1e2333]/50 pb-2">
                  <span className="text-[9px] text-[#8a9ab5] font-bold uppercase">{item.label}</span>
                  <span className="text-[10px] font-bold font-mono" style={{ color: item.color }}>{item.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
