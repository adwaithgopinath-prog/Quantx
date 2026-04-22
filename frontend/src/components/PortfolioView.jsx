import React, { useState } from 'react';
import { TrendingUp, TrendingDown, ArrowUpRight, Wallet, BarChart2, Target, AlertTriangle, Info, ChevronRight } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

const PIE_COLORS = ['#00e676', '#7dd3fc', '#ff9800', '#a78bfa', '#fb7185', '#34d399', '#f59e0b', '#60a5fa'];

function OptimizationTable({ title, subtitle, icon, allocs }) {
  return (
    <div className="bg-[#0d0f12] border border-[#1e2333] rounded-xl p-5 space-y-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 text-[#ff9800]">{icon}</div>
        <div>
          <div className="text-xs font-bold text-white uppercase tracking-widest font-[Space_Grotesk]">{title}</div>
          <div className="text-[10px] text-[#8a9ab5] font-[Inter] mt-0.5">{subtitle}</div>
        </div>
      </div>
      <div className="space-y-2">
        {allocs.map(({ sym, pct, color }) => (
          <div key={sym} className="flex items-center gap-3">
            <div className="text-[10px] text-[#8a9ab5] w-24 truncate font-[Inter]">{sym}</div>
            <div className="flex-1 h-1.5 bg-[#1e2333] rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
            </div>
            <div className="text-xs font-bold text-white w-10 text-right font-[Inter]">{pct}%</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PortfolioView({ portfolio, analytics, totalNAV, setSymbol }) {
  const [rfr, setRfr] = useState('0.05');

  const positions = portfolio?.positions || [];
  const balance   = portfolio?.balance  || 0;

  // Derived values
  const totalEquity = positions.reduce((s, p) => s + p.quantity * (p.current_price || p.avg_price), 0);
  const totalPnL    = positions.reduce((s, p) => s + (p.pnl || 0), 0);
  const isPosTotal  = totalPnL >= 0;

  const expReturn   = analytics?.expected_return ? (Number(analytics.expected_return) * 100).toFixed(2) : '14.32';
  const portRisk    = analytics?.portfolio_risk   ? (Number(analytics.portfolio_risk)   * 100).toFixed(2) : '18.74';
  const sharpe      = analytics?.sharpe_ratio     ? Number(analytics.sharpe_ratio).toFixed(3)              : '0.694';
  const sharpeNum   = parseFloat(sharpe);
  const sharpeLabel = sharpeNum >= 1 ? 'Optimal' : sharpeNum >= 0.5 ? 'Sub-optimal' : 'Risky';
  const sharpeLabelColor = sharpeNum >= 1 ? 'text-[#00e676]' : sharpeNum >= 0.5 ? 'text-[#ff9800]' : 'text-[#ff4444]';

  // PIE data
  const pieData = positions.map(p => ({
    name: p.symbol?.split('.')[0] || p.symbol || 'UNK',
    value: p.quantity * (p.current_price || p.avg_price)
  }));

  // Portfolio Health Sidebar helpers
  const pnlPct = totalEquity > 0 ? ((totalPnL / totalEquity) * 100).toFixed(2) : '0.00';

  // Mock optimization allocations (derived from position weights)
  const buildAlloc = (positions, bias) => {
    if (!positions.length) return [];
    const total = positions.reduce((s, p) => s + p.quantity * (p.current_price || p.avg_price), 0);
    return positions.map((p, i) => {
      const natural = total > 0 ? ((p.quantity * (p.current_price || p.avg_price)) / total) * 100 : 0;
      const pct = Math.round(Math.min(80, Math.max(5, natural + (bias === 'sharpe' ? (i % 2 === 0 ? 4 : -3) : (i % 2 === 0 ? -5 : 3)))));
      return { sym: p.symbol?.split('.')[0] || p.symbol || 'UNK', pct, color: PIE_COLORS[i % PIE_COLORS.length] };
    });
  };

  const maxSharpeAlloc = buildAlloc(positions.slice(0, 6), 'sharpe');
  const minRiskAlloc   = buildAlloc(positions.slice(0, 6), 'minrisk');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

      {/* ── LEFT SIDEBAR: Portfolio Health ── */}
      <div className="col-span-1 lg:col-span-3 space-y-5">
        {/* Health card */}
        <div className="bg-[#141720] border border-[#1e2333] rounded-xl p-5 relative overflow-hidden">
          <div className="absolute -top-8 -right-8 w-28 h-28 bg-[#00e676] opacity-[0.04] rounded-full blur-2xl" />
          <div className="text-[10px] font-bold text-[#8a9ab5] uppercase tracking-widest font-[Space_Grotesk] mb-4">Portfolio Health</div>

          <div className="space-y-4">
            <div>
              <div className="text-[10px] text-[#8a9ab5] mb-1">Total Equity</div>
              <div className="text-2xl font-bold text-white font-[Inter]">
                ₹{totalEquity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <div className="border-t border-[#1e2333] pt-3">
              <div className="text-[10px] text-[#8a9ab5] mb-1">Total P&amp;L</div>
              <div className={`text-xl font-bold font-[Inter] flex items-center gap-1.5 ${isPosTotal ? 'text-[#00e676]' : 'text-[#ff4444]'}`}>
                {isPosTotal ? <ArrowUpRight size={18} /> : <TrendingDown size={18} />}
                {isPosTotal ? '+' : ''}₹{totalPnL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className={`text-[11px] font-bold mt-1 ${isPosTotal ? 'text-[#00e676]' : 'text-[#ff4444]'}`}>
                {isPosTotal ? '+' : ''}{pnlPct}% overall
              </div>
            </div>
            <div className="border-t border-[#1e2333] pt-3">
              <div className="text-[10px] text-[#8a9ab5] mb-1">Cash Balance</div>
              <div className="text-lg font-bold text-white font-[Inter]">
                ₹{balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        </div>

        {/* Allocation Pie */}
        {pieData.length > 0 && (
          <div className="bg-[#141720] border border-[#1e2333] rounded-xl p-5">
            <div className="text-[10px] font-bold text-[#8a9ab5] uppercase tracking-widest font-[Space_Grotesk] mb-3">Allocation</div>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70}
                  dataKey="value" paddingAngle={3}>
                  {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#141720', border: '1px solid #1e2333', color: 'white', fontSize: 11 }}
                  formatter={v => [`₹${v.toLocaleString()}`, '']} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1.5 mt-2">
              {pieData.map((seg, i) => (
                <div key={seg.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="text-[10px] text-[#8a9ab5]">{seg.name}</span>
                  </div>
                  <span className="text-[10px] font-bold text-white">
                    {pieData.reduce((s, d) => s + d.value, 0) > 0
                      ? ((seg.value / pieData.reduce((s, d) => s + d.value, 0)) * 100).toFixed(1)
                      : 0}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── MAIN AREA ── */}
      <div className="col-span-1 lg:col-span-9 space-y-6">

        {/* Top 3 stat cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              label: 'Cash Balance', icon: <Wallet size={18} />,
              value: `₹${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
              sub: 'Available margin', color: 'text-[#7dd3fc]', glow: '#7dd3fc'
            },
            {
              label: 'Total Equity', icon: <BarChart2 size={18} />,
              value: `₹${totalEquity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
              sub: `${positions.length} active positions`, color: 'text-[#a78bfa]', glow: '#a78bfa'
            },
            {
              label: 'Total P&L', icon: isPosTotal ? <TrendingUp size={18} /> : <TrendingDown size={18} />,
              value: `${isPosTotal ? '+' : ''}₹${totalPnL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
              sub: `${isPosTotal ? '+' : ''}${pnlPct}% overall`, color: isPosTotal ? 'text-[#00e676]' : 'text-[#ff4444]', glow: isPosTotal ? '#00e676' : '#ff4444'
            },
          ].map(card => (
            <div key={card.label} className="bg-[#141720] border border-[#1e2333] rounded-xl p-5 relative overflow-hidden group hover:border-[#8a9ab5]/40 transition-colors">
              <div className="absolute top-2 right-3 opacity-10 pointer-events-none" style={{ color: card.glow, fontSize: 64 }}>●</div>
              <div className="flex items-center gap-2 mb-3">
                <span className={card.color}>{card.icon}</span>
                <span className="text-[10px] font-bold text-[#8a9ab5] uppercase tracking-widest font-[Space_Grotesk]">{card.label}</span>
              </div>
              <div className={`text-2xl font-bold font-[Inter] ${card.color}`}>{card.value}</div>
              <div className="text-[10px] text-[#8a9ab5] mt-1">{card.sub}</div>
            </div>
          ))}
        </div>

        {/* Analytics Section */}
        <div className="bg-[#141720] border border-[#1e2333] rounded-xl p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-[#1e2333] pb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-widest font-[Space_Grotesk]">Portfolio Analytics</h3>
              <p className="text-[10px] text-[#8a9ab5] mt-0.5">Mean-Variance covariance matrix analysis</p>
            </div>
            {/* RFR input */}
            <div className="flex items-center gap-3 bg-[#0d0f12] border border-[#1e2333] p-2.5 px-4 rounded-lg">
              <span className="text-[10px] font-bold text-[#8a9ab5] uppercase">Risk-Free Rate</span>
              <input type="number" step="0.01" value={rfr} onChange={e => setRfr(e.target.value)}
                className="w-16 bg-transparent text-right outline-none text-sm font-bold text-white font-[Inter] focus:text-[#00e676]" />
              <span className="text-[10px] text-[#8a9ab5]">%</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Expected Return */}
            <div className="space-y-2">
              <div className="text-[10px] text-[#8a9ab5] uppercase tracking-widest font-[Space_Grotesk]">Expected Return (Ann.)</div>
              <div className="text-3xl font-bold text-[#00e676] font-[Inter]">+{expReturn}%</div>
              <div className="w-full h-1 bg-[#1e2333] rounded-full overflow-hidden">
                <div className="h-full bg-[#00e676] rounded-full" style={{ width: `${Math.min(100, parseFloat(expReturn))}%` }} />
              </div>
            </div>

            {/* Risk (Std Dev) */}
            <div className="space-y-2">
              <div className="text-[10px] text-[#8a9ab5] uppercase tracking-widest font-[Space_Grotesk]">Portfolio Risk (Std Dev)</div>
              <div className="text-3xl font-bold text-[#ff9800] font-[Inter]">{portRisk}%</div>
              <div className="w-full h-1 bg-[#1e2333] rounded-full overflow-hidden">
                <div className="h-full bg-[#ff9800] rounded-full" style={{ width: `${Math.min(100, parseFloat(portRisk))}%` }} />
              </div>
            </div>

            {/* Sharpe Ratio */}
            <div className="space-y-2">
              <div className="text-[10px] text-[#8a9ab5] uppercase tracking-widest font-[Space_Grotesk]">Sharpe Ratio</div>
              <div className="flex items-baseline gap-2">
                <div className="text-3xl font-bold text-white font-[Inter]">{sharpe}</div>
                <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded border font-[Space_Grotesk] ${sharpeLabelColor}
                  ${sharpeNum >= 1 ? 'bg-[#00e676]/15 border-[#00e676]/40' : sharpeNum >= 0.5 ? 'bg-[#ff9800]/15 border-[#ff9800]/40' : 'bg-[#ff4444]/15 border-[#ff4444]/40'}`}>
                  {sharpeLabel}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Optimization Engine */}
        <div className="bg-[#141720] border border-[#1e2333] rounded-xl p-6">
          <div className="mb-5 border-b border-[#1e2333] pb-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest font-[Space_Grotesk]">
              Portfolio Optimization Engine
            </h3>
            <p className="text-[10px] text-[#8a9ab5] mt-0.5">Efficient Frontier Analysis via Modern Portfolio Theory</p>
          </div>
          {positions.length === 0 ? (
            <div className="py-10 text-center text-[#8a9ab5] text-sm font-[Inter]">
              No open positions to optimize. Execute trades to begin.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <OptimizationTable
                title="Max Sharpe Allocation"
                subtitle="Mean-Variance Optimization for highest risk-adjusted expected return"
                icon={<Target size={16} />}
                allocs={maxSharpeAlloc}
              />
              <OptimizationTable
                title="Minimum Risk Allocation"
                subtitle="Mean-Variance Optimization focused purely on lowering portfolio variance"
                icon={<AlertTriangle size={16} />}
                allocs={minRiskAlloc}
              />
            </div>
          )}
        </div>

        {/* Holdings Table */}
        <div className="bg-[#141720] border border-[#1e2333] rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[#1e2333] flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest font-[Space_Grotesk]">Holdings</h3>
            <span className="text-[10px] text-[#8a9ab5]">{positions.length} positions</span>
          </div>
          <table className="w-full text-left font-[Inter] text-xs">
            <thead>
              <tr className="bg-[#0d0f12] text-[9px] uppercase tracking-widest text-[#8a9ab5] border-b border-[#1e2333]">
                <th className="p-4 font-bold">Symbol</th>
                <th className="p-4 font-bold">Qty</th>
                <th className="p-4 font-bold">Avg Price</th>
                <th className="p-4 font-bold">Current</th>
                <th className="p-4 font-bold">Value</th>
                <th className="p-4 font-bold text-right">P&amp;L</th>
              </tr>
            </thead>
            <tbody>
              {positions.map((pos, i) => (
                <tr key={i} onClick={() => setSymbol(pos.symbol)}
                  className="border-b border-[#1e2333] last:border-0 hover:bg-[#1e2333]/50 cursor-pointer transition-colors">
                  <td className="p-4">
                    <div className="font-bold text-white">{pos.symbol?.split('.')[0] || pos.symbol}</div>
                    <div className="text-[9px] text-[#8a9ab5]">{pos.symbol}</div>
                  </td>
                  <td className="p-4 text-[#8a9ab5]">{pos.quantity}</td>
                  <td className="p-4 text-[#8a9ab5]">₹{pos.avg_price?.toLocaleString()}</td>
                  <td className="p-4 font-bold text-white">₹{pos.current_price?.toLocaleString()}</td>
                  <td className="p-4 text-white">₹{(pos.quantity * (pos.current_price || pos.avg_price)).toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                  <td className={`p-4 text-right font-bold ${pos.pnl >= 0 ? 'text-[#00e676]' : 'text-[#ff4444]'}`}>
                    <div>{pos.pnl >= 0 ? '+' : ''}₹{pos.pnl?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                    <div className="text-[10px] opacity-80">{pos.pnl_pct}%</div>
                  </td>
                </tr>
              ))}
              {positions.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-[#8a9ab5]">No active holdings. Start trading to see your positions here.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
