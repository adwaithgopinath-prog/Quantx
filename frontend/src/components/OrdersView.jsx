import React, { useState, useMemo } from 'react';
import { Filter, Search, X, ArrowUpRight, ArrowDownLeft, Clock, CheckCircle2, XCircle, ChevronDown, Download } from 'lucide-react';

// ─── Helpers ─────────────────────────────────────────────────────────────────
function seeded(seed, min, max) {
  let s = (seed * 1664525 + 1013904223) & 0xffffffff;
  return min + (Math.abs(s) % (max - min + 1));
}

const SYMBOLS  = ['RELIANCE.NS','HDFCBANK.NS','TCS.NS','INFY.NS','TATAMOTORS.NS','WIPRO.NS','ZOMATO.NS','AAPL','MSFT','NVDA'];
const STATUSES = ['EXECUTED', 'EXECUTED', 'EXECUTED', 'PENDING', 'CANCELLED'];
const SIDES    = ['BUY', 'SELL'];

// Generate realistic-looking mock order history
function buildMockOrders(n = 48) {
  const now = Date.now();
  return Array.from({ length: n }, (_, i) => {
    const seed = i * 997 + 42;
    const sym  = SYMBOLS[seeded(seed,       0, SYMBOLS.length  - 1)];
    const side = SIDES  [seeded(seed * 3,   0, SIDES.length    - 1)];
    const stat = STATUSES[seeded(seed * 7,  0, STATUSES.length - 1)];
    const price = 100 + seeded(seed * 13,   0, 11900);
    const shares = seeded(seed * 17,        1, 50);
    // spread orders over last 90 days
    const daysAgo = seeded(seed * 5,        0, 89);
    const ts = new Date(now - daysAgo * 86400_000 - seeded(seed * 11, 0, 86399) * 1000);

    return {
      id:     `ORD-${String(i + 1).padStart(4, '0')}`,
      date:   ts,
      ticker: sym,
      type:   side,
      price,
      shares,
      status: stat,
      value:  price * shares,
    };
  }).sort((a, b) => b.date - a.date);
}

const ALL_ORDERS = buildMockOrders(48);

// ─── Sub-components ────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const cfg = {
    EXECUTED:  { color: 'text-[#00e676] bg-[#00e676]/15 border-[#00e676]/40', icon: <CheckCircle2 size={10}/> },
    PENDING:   { color: 'text-[#ff9800] bg-[#ff9800]/15 border-[#ff9800]/40', icon: <Clock        size={10}/> },
    CANCELLED: { color: 'text-[#ff4444] bg-[#ff4444]/15 border-[#ff4444]/40', icon: <XCircle      size={10}/> },
  }[status] || {};
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[9px] font-bold uppercase font-[Space_Grotesk] ${cfg.color}`}>
      {cfg.icon}{status}
    </span>
  );
}

function TypeBadge({ type }) {
  return type === 'BUY'
    ? <span className="inline-flex items-center gap-1 text-[#00e676] font-bold text-[11px]"><ArrowUpRight size={13}/>BUY</span>
    : <span className="inline-flex items-center gap-1 text-[#ff4444] font-bold text-[11px]"><ArrowDownLeft size={13}/>SELL</span>;
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function OrdersView({ liveOrders = [] }) {
  // Merge live + mock; live orders come first
  const allOrders = useMemo(() => {
    const live = liveOrders.map((o, i) => ({ 
      ...o, 
      id: `LIVE-${i}`, 
      ticker: o.ticker || o.symbol || 'N/A',
      date: new Date(o.date || Date.now()) 
    }));
    return [...live, ...ALL_ORDERS];
  }, [liveOrders]);

  // Filter state
  const [search,     setSearch]     = useState('');
  const [statusFilt, setStatusFilt] = useState('ALL');
  const [typeFilt,   setTypeFilt]   = useState('ALL');
  const [dateFrom,   setDateFrom]   = useState('');
  const [dateTo,     setDateTo]     = useState('');
  const [page,       setPage]       = useState(1);
  const PAGE_SIZE = 12;

  const filtered = useMemo(() => {
    return allOrders.filter(o => {
      const ticker = (o.ticker || '').toLowerCase();
      const orderId = (o.id || '').toLowerCase();
      const searchTerm = search.toLowerCase();
      
      const matchSearch = !search || ticker.includes(searchTerm) || orderId.includes(searchTerm);
      const matchStatus = statusFilt === 'ALL' || o.status === statusFilt;
      const matchType   = typeFilt   === 'ALL' || o.type   === typeFilt;
      const matchFrom   = !dateFrom  || o.date >= new Date(dateFrom);
      const matchTo     = !dateTo    || o.date <= new Date(dateTo + 'T23:59:59');
      return matchSearch && matchStatus && matchType && matchFrom && matchTo;
    });
  }, [allOrders, search, statusFilt, typeFilt, dateFrom, dateTo]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const stats = useMemo(() => ({
    executed:  allOrders.filter(o => o.status === 'EXECUTED').length,
    pending:   allOrders.filter(o => o.status === 'PENDING').length,
    cancelled: allOrders.filter(o => o.status === 'CANCELLED').length,
    totalVol:  allOrders.filter(o => o.status === 'EXECUTED').reduce((s, o) => s + o.value, 0),
  }), [allOrders]);

  const clearFilters = () => {
    setSearch(''); setStatusFilt('ALL'); setTypeFilt('ALL');
    setDateFrom(''); setDateTo(''); setPage(1);
  };
  const hasFilters = search || statusFilt !== 'ALL' || typeFilt !== 'ALL' || dateFrom || dateTo;

  const fmtDate = (d) => d.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'2-digit' });
  const fmtTime = (d) => d.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit', hour12: true });

  return (
    <div className="space-y-6">

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Executed',     value: stats.executed,  color: 'text-[#00e676]', bg: 'border-[#00e676]/30' },
          { label: 'Pending',      value: stats.pending,   color: 'text-[#ff9800]', bg: 'border-[#ff9800]/30' },
          { label: 'Cancelled',    value: stats.cancelled, color: 'text-[#ff4444]', bg: 'border-[#ff4444]/30' },
          { label: 'Total Volume', value: `₹${stats.totalVol.toLocaleString(undefined,{maximumFractionDigits:0})}`, color: 'text-[#7dd3fc]', bg: 'border-[#7dd3fc]/30' },
        ].map(s => (
          <div key={s.label} className={`bg-[#141720] border ${s.bg} rounded-xl p-4`}>
            <div className="text-[10px] font-bold text-[#8a9ab5] uppercase tracking-widest font-[Space_Grotesk] mb-1">{s.label}</div>
            <div className={`text-2xl font-bold font-[Inter] ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="bg-[#141720] border border-[#1e2333] rounded-xl p-4">
        <div className="flex flex-wrap gap-3 items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-48">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a9ab5]"/>
            <input
              value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search ticker or order ID…"
              className="w-full bg-[#0d0f12] border border-[#1e2333] text-white text-xs p-2.5 pl-8 rounded-lg focus:outline-none focus:border-[#00e676] font-[Inter] transition-colors"
            />
          </div>

          {/* Status */}
          <div className="flex gap-1.5">
            {['ALL','EXECUTED','PENDING','CANCELLED'].map(s => (
              <button key={s} onClick={() => { setStatusFilt(s); setPage(1); }}
                className={`px-3 py-1.5 text-[9px] font-bold uppercase rounded border transition-colors font-[Space_Grotesk]
                  ${statusFilt === s
                    ? s === 'EXECUTED' ? 'bg-[#00e676] text-[#0d0f12] border-[#00e676]'
                    : s === 'PENDING' ? 'bg-[#ff9800] text-[#0d0f12] border-[#ff9800]'
                    : s === 'CANCELLED' ? 'bg-[#ff4444] text-white border-[#ff4444]'
                    : 'bg-white text-[#0d0f12] border-white'
                    : 'bg-[#0d0f12] text-[#8a9ab5] border-[#1e2333] hover:border-[#8a9ab5]'}`}>
                {s}
              </button>
            ))}
          </div>

          {/* Type */}
          <div className="flex gap-1.5 border-l border-[#1e2333] pl-3">
            {['ALL','BUY','SELL'].map(t => (
              <button key={t} onClick={() => { setTypeFilt(t); setPage(1); }}
                className={`px-3 py-1.5 text-[9px] font-bold uppercase rounded border transition-colors font-[Space_Grotesk]
                  ${typeFilt === t
                    ? t === 'BUY' ? 'bg-[#00e676] text-[#0d0f12] border-[#00e676]'
                    : t === 'SELL' ? 'bg-[#ff4444] text-white border-[#ff4444]'
                    : 'bg-white text-[#0d0f12] border-white'
                    : 'bg-[#0d0f12] text-[#8a9ab5] border-[#1e2333] hover:border-[#8a9ab5]'}`}>
                {t}
              </button>
            ))}
          </div>

          {/* Date range */}
          <div className="flex items-center gap-2 border-l border-[#1e2333] pl-3">
            <span className="text-[9px] text-[#8a9ab5] font-bold uppercase">From</span>
            <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }}
              className="bg-[#0d0f12] border border-[#1e2333] text-white text-[10px] p-1.5 rounded focus:outline-none focus:border-[#00e676] font-[Inter] transition-colors" />
            <span className="text-[9px] text-[#8a9ab5] font-bold uppercase">To</span>
            <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }}
              className="bg-[#0d0f12] border border-[#1e2333] text-white text-[10px] p-1.5 rounded focus:outline-none focus:border-[#00e676] font-[Inter] transition-colors" />
          </div>

          {/* Clear */}
          {hasFilters && (
            <button onClick={clearFilters}
              className="flex items-center gap-1 px-3 py-1.5 text-[9px] font-bold uppercase rounded border border-[#ff4444]/40 text-[#ff4444] bg-[#ff4444]/10 hover:bg-[#ff4444]/20 transition-colors font-[Space_Grotesk]">
              <X size={10}/> Clear
            </button>
          )}

          {/* Export stub */}
          <button className="ml-auto flex items-center gap-1.5 px-3 py-2 text-[9px] font-bold uppercase rounded border border-[#1e2333] text-[#8a9ab5] hover:text-white hover:border-[#8a9ab5] transition-colors font-[Space_Grotesk]">
            <Download size={11}/> Export CSV
          </button>
        </div>

        <div className="mt-3 text-[10px] text-[#8a9ab5] font-[Inter]">
          Showing <span className="text-white font-bold">{filtered.length}</span> orders
          {hasFilters && <span> (filtered from {allOrders.length} total)</span>}
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#141720] border border-[#1e2333] rounded-xl overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[2fr_1.6fr_1fr_1.2fr_1fr_1.4fr_1.4fr] gap-4 px-5 py-3 border-b border-[#1e2333] bg-[#0d0f12]">
          {['ORDER ID','DATE & TIME','TYPE','TICKER','SHARES','PRICE','STATUS'].map(col => (
            <div key={col} className="text-[9px] font-bold uppercase tracking-widest text-[#8a9ab5] font-[Space_Grotesk]">{col}</div>
          ))}
        </div>

        {paged.length === 0 && (
          <div className="py-20 text-center font-[Inter] text-[#8a9ab5] text-sm">No orders match your filters.</div>
        )}

        {paged.map((order, i) => (
          <div key={order.id}
            className="grid grid-cols-[2fr_1.6fr_1fr_1.2fr_1fr_1.4fr_1.4fr] gap-4 px-5 py-4 items-center border-b border-[#1e2333] last:border-0 hover:bg-[#1e2333]/40 transition-colors">

            {/* Order ID */}
            <div className="font-mono text-[11px] text-[#8a9ab5]">{order.id}</div>

            {/* Date */}
            <div>
              <div className="text-xs font-bold text-white font-[Inter]">{fmtDate(order.date)}</div>
              <div className="text-[10px] text-[#8a9ab5]">{fmtTime(order.date)}</div>
            </div>

            {/* Type */}
            <div><TypeBadge type={order.type}/></div>

            {/* Ticker */}
            <div>
              <div className="text-xs font-bold text-white font-[Inter]">{order.ticker?.split('.')[0] || order.ticker}</div>
              <div className="text-[10px] text-[#8a9ab5]">{order.ticker?.includes('.NS') ? 'NSE' : 'NASDAQ'}</div>
            </div>

            {/* Shares */}
            <div className="text-sm font-bold text-white font-[Inter]">{order.shares}</div>

            {/* Price */}
            <div>
              <div className="text-sm font-bold text-white font-[Inter]">₹{order.price.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</div>
              <div className="text-[9px] text-[#8a9ab5]">≈ ₹{order.value.toLocaleString(undefined,{maximumFractionDigits:0})}</div>
            </div>

            {/* Status */}
            <div><StatusBadge status={order.status}/></div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-[#8a9ab5] font-[Inter]">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-4 py-2 text-[10px] font-bold uppercase rounded border border-[#1e2333] text-[#8a9ab5] hover:text-white hover:border-[#8a9ab5] disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-[Space_Grotesk]">
              ← Prev
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
              return (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-9 h-9 text-[10px] font-bold rounded border transition-colors font-[Space_Grotesk]
                    ${p === page ? 'bg-[#00e676] text-[#0d0f12] border-[#00e676]' : 'border-[#1e2333] text-[#8a9ab5] hover:text-white hover:border-[#8a9ab5]'}`}>
                  {p}
                </button>
              );
            })}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="px-4 py-2 text-[10px] font-bold uppercase rounded border border-[#1e2333] text-[#8a9ab5] hover:text-white hover:border-[#8a9ab5] disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-[Space_Grotesk]">
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
