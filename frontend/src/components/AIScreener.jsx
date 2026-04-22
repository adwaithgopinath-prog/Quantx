import React, { useState, useMemo } from 'react';
import { ExternalLink, Plus, RefreshCw, ChevronDown, TrendingUp, TrendingDown } from 'lucide-react';

// Mini inline sparkline using SVG
function Sparkline({ data, positive }) {
  if (!data || data.length === 0) return <div className="w-16 h-6 bg-[#1e2333] rounded" />;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 64, h = 24;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  }).join(' ');
  const color = positive ? '#00e676' : '#ff4444';
  return (
    <svg width={w} height={h} className="overflow-visible">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx={pts.split(' ').at(-1).split(',')[0]} cy={pts.split(' ').at(-1).split(',')[1]} r="2" fill={color} />
    </svg>
  );
}

// Seeded random so values are stable per symbol
function seededRand(seed, min, max) {
  let s = seed;
  s = (s * 1664525 + 1013904223) & 0xffffffff;
  return min + (Math.abs(s) % (max - min + 1));
}
function makeSparkline(seed) {
  let v = 100;
  return Array.from({ length: 12 }, (_, i) => {
    v += seededRand(seed + i * 997, -6, 7);
    return Math.max(70, v);
  });
}

const SECTORS = ['All Sectors', 'Technology', 'Finance', 'Healthcare', 'Energy', 'Consumer', 'Auto', 'Metals'];

const UNIVERSE = [
  { name: 'RELIANCE INDUSTRIES', ticker: 'RELIANCE.NS', sector: 'Energy',     price: 2987.50, chg: +1.24, seed: 1 },
  { name: 'HDFC BANK',           ticker: 'HDFCBANK.NS',  sector: 'Finance',    price: 1432.10, chg: +0.81, seed: 2 },
  { name: 'TATA CONSULTANCY',    ticker: 'TCS.NS',        sector: 'Technology', price: 4120.00, chg: -0.53, seed: 3 },
  { name: 'INFOSYS',             ticker: 'INFY.NS',       sector: 'Technology', price: 1589.05, chg: +0.37, seed: 4 },
  { name: 'BHARTI AIRTEL',       ticker: 'BHARTIARTL.NS', sector: 'Technology', price: 1701.30, chg: +2.11, seed: 5 },
  { name: 'TATA MOTORS',         ticker: 'TATAMOTORS.NS', sector: 'Auto',       price: 710.45,  chg: +1.62, seed: 6 },
  { name: 'WIPRO',               ticker: 'WIPRO.NS',      sector: 'Technology', price: 236.80,  chg: -0.44, seed: 7 },
  { name: 'BAJAJ FINANCE',       ticker: 'BAJFINANCE.NS', sector: 'Finance',    price: 9100.00, chg: +0.95, seed: 8 },
  { name: 'ITC',                 ticker: 'ITC.NS',        sector: 'Consumer',   price: 465.25,  chg: +0.22, seed: 9 },
  { name: 'CIPLA',               ticker: 'CIPLA.NS',      sector: 'Healthcare', price: 1499.80, chg: -0.68, seed: 10 },
  { name: 'JSW STEEL',           ticker: 'JSWSTEEL.NS',   sector: 'Metals',     price: 875.50,  chg: +1.05, seed: 11 },
  { name: 'MARUTI SUZUKI',       ticker: 'MARUTI.NS',     sector: 'Auto',       price: 12340.0, chg: -0.30, seed: 12 },
  { name: 'ZOMATO',              ticker: 'ZOMATO.NS',     sector: 'Consumer',   price: 190.25,  chg: +3.21, seed: 13 },
  { name: 'ADANI PORTS',         ticker: 'ADANIPORTS.NS', sector: 'Energy',     price: 1218.00, chg: -1.10, seed: 14 },
  { name: 'IRCTC',               ticker: 'IRCTC.NS',      sector: 'Consumer',   price: 812.60,  chg: +0.58, seed: 15 },
  { name: 'POWER GRID',          ticker: 'POWERGRID.NS',  sector: 'Energy',     price: 337.45,  chg: +0.16, seed: 16 },
  { name: 'MOTHERSON SUMI',      ticker: 'MOTHERSON.NS',  sector: 'Auto',       price: 127.80,  chg: -0.89, seed: 17 },
  { name: 'ASTER DM HEALTH',     ticker: 'ASTERDM.NS',    sector: 'Healthcare', price: 448.00,  chg: +1.77, seed: 18 },
  { name: 'PAYTM',               ticker: 'PAYTM.NS',      sector: 'Finance',    price: 389.50,  chg: -2.45, seed: 19 },
  { name: 'NAZARA TECH',         ticker: 'NAZARA.NS',     sector: 'Technology', price: 805.00,  chg: +4.12, seed: 20 },
];

// Derive AI scores, sentiment, risk from seeded values
function enrich(asset) {
  const aiScore  = seededRand(asset.seed * 13, 42, 97);
  const sent     = (seededRand(asset.seed * 7, 30, 85) / 100).toFixed(2);
  const risk     = seededRand(asset.seed * 11, 18, 78);
  const rec      = aiScore >= 72 ? 'BUY' : aiScore >= 55 ? 'HOLD' : 'SELL';
  const sparkRaw = makeSparkline(asset.seed * 31);
  const sparkPos = sparkRaw[sparkRaw.length - 1] >= sparkRaw[0];
  return { ...asset, aiScore, sent, risk, rec, sparkRaw, sparkPos };
}

const PRICE_RANGES = [
  { label: 'All', min: 0,    max: Infinity },
  { label: 'Penny ₹1–50',   min: 1,    max: 50 },
  { label: 'Mid ₹50–500',   min: 50,   max: 500 },
  { label: 'Large ₹500–₹2500', min: 500,  max: 2500 },
  { label: 'Bluechip ₹2500+', min: 2500, max: Infinity },
];

const ENRICHED = UNIVERSE.map(enrich);

export default function AIScreener({ setSymbol, portfolio }) {
  const [activeRange, setActiveRange] = useState(0);
  const [customMin, setCustomMin]     = useState('');
  const [customMax, setCustomMax]     = useState('');
  const [sector, setSector]           = useState('All Sectors');
  const [addedSet, setAddedSet]       = useState(new Set());
  const [key, setKey]                 = useState(0); // force re-render on refresh

  const filtered = useMemo(() => {
    let min = PRICE_RANGES[activeRange].min;
    let max = PRICE_RANGES[activeRange].max;
    if (customMin !== '') min = parseFloat(customMin) || 0;
    if (customMax !== '') max = parseFloat(customMax) || Infinity;

    return ENRICHED.filter(a => {
      const inRange  = a.price >= min && a.price <= max;
      const inSector = sector === 'All Sectors' || a.sector === sector;
      return inRange && inSector;
    }).sort((a, b) => b.aiScore - a.aiScore);
  }, [activeRange, customMin, customMax, sector, key]);

  const topTen = filtered.slice(0, 10);

  const recColor = rec => rec === 'BUY' ? 'text-[#00e676] bg-[#00e676]/15 border-[#00e676]/40'
                        : rec === 'SELL' ? 'text-[#ff4444] bg-[#ff4444]/15 border-[#ff4444]/40'
                        : 'text-[#ff9800] bg-[#ff9800]/15 border-[#ff9800]/40';

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-[Space_Grotesk] font-bold text-white uppercase tracking-widest">
            AI Asset Screener
          </h3>
          <p className="text-[11px] font-[Inter] text-[#8a9ab5] mt-0.5">
            TOP 10 AI-RANKED ASSETS BY PRICE RANGE
          </p>
        </div>
        <button
          onClick={() => setKey(k => k + 1)}
          className="flex items-center gap-2 px-4 py-2 bg-[#1e2333] border border-[#1e2333] text-[#8a9ab5] hover:text-white hover:border-[#8a9ab5] rounded-lg text-xs font-bold uppercase transition-colors"
        >
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Filter bar */}
      <div className="bg-[#141720] border border-[#1e2333] rounded-xl p-4 flex flex-wrap gap-3 items-center">
        {/* Range pills */}
        <div className="flex flex-wrap gap-2">
          {PRICE_RANGES.map((r, i) => (
            <button key={i} onClick={() => setActiveRange(i)}
              className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded-md border transition-colors font-[Space_Grotesk]
                ${activeRange === i
                  ? 'bg-[#00e676] text-[#0d0f12] border-[#00e676]'
                  : 'bg-[#0d0f12] text-[#8a9ab5] border-[#1e2333] hover:border-[#8a9ab5]'}`}>
              {r.label}
            </button>
          ))}
        </div>

        {/* Custom range */}
        <div className="flex items-center gap-2 border-l border-[#1e2333] pl-3">
          <span className="text-[10px] text-[#8a9ab5] font-bold uppercase">Custom:</span>
          <input type="number" placeholder="₹ MIN" value={customMin} onChange={e => setCustomMin(e.target.value)}
            className="w-20 bg-[#0d0f12] border border-[#1e2333] text-white text-[11px] p-1.5 px-2 rounded focus:outline-none focus:border-[#00e676] font-[Inter]" />
          <span className="text-[#8a9ab5] text-xs">—</span>
          <input type="number" placeholder="₹ MAX" value={customMax} onChange={e => setCustomMax(e.target.value)}
            className="w-20 bg-[#0d0f12] border border-[#1e2333] text-white text-[11px] p-1.5 px-2 rounded focus:outline-none focus:border-[#00e676] font-[Inter]" />
        </div>

        {/* Sector dropdown */}
        <div className="relative ml-auto">
          <select value={sector} onChange={e => setSector(e.target.value)}
            className="appearance-none bg-[#0d0f12] border border-[#1e2333] text-white text-[11px] font-bold p-2 pl-3 pr-8 rounded-lg focus:outline-none focus:border-[#00e676] cursor-pointer font-[Inter]">
            {SECTORS.map(s => <option key={s}>{s}</option>)}
          </select>
          <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8a9ab5] pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#141720] border border-[#1e2333] rounded-xl overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-[2fr_1.2fr_1fr_1.4fr_1fr_auto] gap-4 px-5 py-3 border-b border-[#1e2333] bg-[#0d0f12]">
          {['ASSET NAME', 'PRICE & CHANGE', 'AI SCORE', 'SENTIMENT & RISK', 'TREND 30D', 'ACTION'].map(col => (
            <div key={col} className="text-[9px] font-bold uppercase tracking-widest text-[#8a9ab5] font-[Space_Grotesk]">
              {col}
            </div>
          ))}
        </div>

        {topTen.length === 0 && (
          <div className="py-16 text-center text-[#8a9ab5] text-sm font-[Inter]">
            No assets match the selected filters.
          </div>
        )}

        {topTen.map((asset, idx) => (
          <div key={asset.ticker}
            className={`grid grid-cols-[2fr_1.2fr_1fr_1.4fr_1fr_auto] gap-4 px-5 py-4 items-center border-b border-[#1e2333] last:border-0
              hover:bg-[#1e2333]/40 transition-colors group cursor-pointer`}
            onClick={() => setSymbol(asset.ticker)}>

            {/* Asset Name */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-[#0d0f12] shrink-0"
                style={{ background: `hsl(${(asset.seed * 47) % 360}, 65%, 60%)` }}>
                {asset.name[0]}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-white truncate font-[Inter]">{asset.ticker.split('.')[0]}</div>
                <div className="text-[9px] text-[#8a9ab5] truncate">{asset.name}</div>
                <span className="inline-block text-[8px] font-bold uppercase bg-[#1e2333] text-[#8a9ab5] px-1.5 py-0.5 rounded mt-0.5">
                  {asset.sector}
                </span>
              </div>
            </div>

            {/* Price & Change */}
            <div>
              <div className="text-sm font-bold text-white font-[Inter]">
                ₹{asset.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </div>
              <div className={`text-[11px] font-bold font-[Inter] ${asset.chg >= 0 ? 'text-[#00e676]' : 'text-[#ff4444]'}`}>
                {asset.chg >= 0 ? '▲' : '▼'} {Math.abs(asset.chg).toFixed(2)}%
              </div>
            </div>

            {/* AI Score */}
            <div className="flex flex-col gap-1">
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold text-[#7dd3fc] font-[Inter]">{asset.aiScore}</span>
                <span className="text-[10px] text-[#8a9ab5]">/100</span>
              </div>
              <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded border uppercase ${recColor(asset.rec)}`}>
                {asset.rec}
              </span>
            </div>

            {/* Sentiment & Risk */}
            <div className="space-y-1.5">
              <div>
                <div className="flex justify-between text-[9px] text-[#8a9ab5] mb-0.5">
                  <span>SENT</span><span className="text-[#00e676]">{asset.sent}</span>
                </div>
                <div className="w-full h-1 bg-[#0d0f12] rounded-full overflow-hidden">
                  <div className="h-full bg-[#00e676] rounded-full transition-all" style={{ width: `${parseFloat(asset.sent) * 100}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[9px] text-[#8a9ab5] mb-0.5">
                  <span>RISK</span><span className="text-[#ff9800]">{asset.risk}</span>
                </div>
                <div className="w-full h-1 bg-[#0d0f12] rounded-full overflow-hidden">
                  <div className="h-full bg-[#ff9800] rounded-full transition-all" style={{ width: `${asset.risk}%` }} />
                </div>
              </div>
            </div>

            {/* Sparkline */}
            <div className="flex items-center">
              <Sparkline data={asset.sparkRaw} positive={asset.sparkPos} />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={e => { e.stopPropagation(); window.open(`https://finance.yahoo.com/quote/${asset.ticker}`, '_blank'); }}
                className="p-1.5 rounded bg-[#1e2333] text-[#8a9ab5] hover:text-white transition-colors">
                <ExternalLink size={12} />
              </button>
              <button
                onClick={e => {
                  e.stopPropagation();
                  setAddedSet(s => new Set([...s, asset.ticker]));
                  setSymbol(asset.ticker);
                }}
                className={`px-2.5 py-1.5 rounded text-[10px] font-bold uppercase transition-all border font-[Space_Grotesk]
                  ${addedSet.has(asset.ticker)
                    ? 'bg-[#00e676]/20 text-[#00e676] border-[#00e676]/40'
                    : 'bg-[#00e676] text-[#0d0f12] border-transparent hover:brightness-110'}`}>
                {addedSet.has(asset.ticker) ? '✓ ADDED' : <span className="flex items-center gap-0.5"><Plus size={10} />ADD</span>}
              </button>
            </div>
          </div>
        ))}
      </div>

      {filtered.length > 10 && (
        <p className="text-center text-[11px] text-[#8a9ab5] font-[Inter]">
          Showing top 10 of {filtered.length} results by AI score.
        </p>
      )}
    </div>
  );
}
