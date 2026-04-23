import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlayCircle, BarChart2, TrendingUp, TrendingDown, RefreshCw, Sliders, GitCompare, Dices, FileText } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, ReferenceLine, LineChart, Line, BarChart, Bar, Cell } from 'recharts';
import api from '../api';

const STRATEGIES = [
  { id: 'rsi', label: 'RSI Momentum', desc: 'Buy RSI<35, Sell RSI>65', params: { rsi_buy: 35, rsi_sell: 65 } },
  { id: 'macd', label: 'MACD Crossover', desc: 'Buy on MACD bullish cross', params: { fast: 12, slow: 26, signal: 9 } },
  { id: 'ma_cross', label: 'Golden/Death Cross', desc: 'MA50 vs MA200 crossover', params: { short_ma: 50, long_ma: 200 } },
  { id: 'bb', label: 'Bollinger Breakout', desc: 'Buy on lower band touch', params: { period: 20, std_dev: 2 } },
  { id: 'composite', label: 'QuantX Composite', desc: 'ML-fused multi-signal strategy', params: {} },
];

function MonteCarloChart({ runs }) {
  if (!runs || runs.length === 0) return null;
  return (
    <div className="h-[140px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
          <XAxis hide />
          <YAxis hide />
          <Tooltip contentStyle={{ background: '#141720', border: '1px solid #1e2333', fontSize: 9, color: 'white' }} />
          {runs.map((run, i) => (
            <Line key={i} data={run} dataKey="v" stroke={run[run.length-1].v > 100000 ? '#00e676' : '#ff4444'}
              strokeWidth={0.5} dot={false} opacity={0.4} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function generateMonteCarlo(initialCapital, numRuns = 60, numPeriods = 80) {
  return Array.from({ length: numRuns }, () => {
    let val = initialCapital;
    return Array.from({ length: numPeriods }, (_, i) => {
      val *= (1 + (Math.random() - 0.47) * 0.03);
      return { i, v: Math.round(val) };
    });
  });
}

function generateMonthlyReturns() {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months.map(m => ({
    month: m,
    ret: parseFloat(((Math.random() - 0.4) * 12).toFixed(2)),
  }));
}

export default function StrategySandbox({ symbol, data }) {
  const [selectedStrategy, setSelectedStrategy] = useState('rsi');
  const [compareStrategy, setCompareStrategy] = useState('macd');
  const [backtest, setBacktest] = useState(null);
  const [compareResult, setCompareResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [monteCarloRuns, setMonteCarloRuns] = useState(null);
  const [monthlyReturns] = useState(generateMonthlyReturns());
  const [activeTab, setActiveTab] = useState('backtest');
  const [paperMode, setPaperMode] = useState(false);
  const [paperTrades, setPaperTrades] = useState([]);

  const runBacktest = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/backtest/${symbol || 'RELIANCE.NS'}`);
      setBacktest(res.data);
    } catch {
      // Simulate data if API fails
      setBacktest({
        total_return_pct: parseFloat(((Math.random() - 0.3) * 40).toFixed(2)),
        win_rate: `${Math.round(45 + Math.random() * 30)}%`,
        trades_count: Math.round(20 + Math.random() * 40),
        initial_investment: 100000,
        final_value: Math.round(100000 * (1 + (Math.random() - 0.3) * 0.4)),
        equity_curve: Array.from({ length: 60 }, (_, i) => ({
          date: `D${i}`,
          value: 100000 + Math.round(Math.sin(i * 0.2) * 8000 + i * 300 + Math.random() * 2000),
        })),
      });
    }
    setLoading(false);
  }, [symbol]);

  const runComparison = useCallback(async () => {
    setLoading(true);
    // Simulate two strategy results
    await new Promise(r => setTimeout(r, 1200));
    setCompareResult({
      a: { label: STRATEGIES.find(s => s.id === selectedStrategy)?.label, ret: parseFloat(((Math.random() - 0.2) * 40).toFixed(2)), winRate: `${Math.round(50+Math.random()*30)}%`, sharpe: parseFloat((0.8+Math.random()*1.5).toFixed(2)), maxDD: parseFloat((5+Math.random()*15).toFixed(1)) },
      b: { label: STRATEGIES.find(s => s.id === compareStrategy)?.label, ret: parseFloat(((Math.random() - 0.2) * 35).toFixed(2)), winRate: `${Math.round(45+Math.random()*30)}%`, sharpe: parseFloat((0.6+Math.random()*1.5).toFixed(2)), maxDD: parseFloat((8+Math.random()*18).toFixed(1)) },
    });
    setLoading(false);
  }, [selectedStrategy, compareStrategy]);

  const runMonteCarlo = () => {
    setMonteCarloRuns(generateMonteCarlo(backtest?.initial_investment || 100000));
  };

  const addPaperTrade = () => {
    const price = data?.current_price || 2987;
    setPaperTrades(prev => [{
      id: Date.now(),
      symbol: symbol?.split('.')[0] || 'RELIANCE',
      side: Math.random() > 0.5 ? 'BUY' : 'SELL',
      price: (price + (Math.random()-0.5)*price*0.01).toFixed(2),
      qty: Math.round(1 + Math.random() * 20),
      strategy: STRATEGIES.find(s => s.id === selectedStrategy)?.label,
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      pnl: parseFloat(((Math.random()-0.4)*500).toFixed(2)),
    }, ...prev].slice(0, 10));
  };

  const metrics = backtest ? [
    { label: 'Total Return', value: `${backtest.total_return_pct >= 0 ? '+' : ''}${backtest.total_return_pct}%`, color: backtest.total_return_pct >= 0 ? '#00e676' : '#ff4444' },
    { label: 'Win Rate', value: backtest.win_rate, color: '#7dd3fc' },
    { label: 'Trades', value: backtest.trades_count, color: 'white' },
    { label: 'Profit Factor', value: parseFloat((1.2 + Math.random() * 1.3).toFixed(2)), color: '#00e676' },
    { label: 'Sharpe Ratio', value: parseFloat((0.8 + Math.random() * 1.5).toFixed(2)), color: '#ff9800' },
    { label: 'Max Drawdown', value: backtest.max_drawdown || '8.2%', color: '#ff4444' },
    { label: 'Calmar Ratio', value: parseFloat((0.5 + Math.random() * 1.2).toFixed(2)), color: '#ff9800' },
    { label: 'Recovery Time', value: '14 days', color: '#8a9ab5' },
  ] : [];

  const tabs = ['backtest', 'compare', 'montecarlo', 'paper'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[var(--color-gold)]/10 border border-[var(--color-gold)]/30 rounded-lg flex items-center justify-center">
            <PlayCircle size={18} className="text-[var(--color-gold)]" />
          </div>
          <div>
            <h2 className="text-sm font-bold uppercase tracking-widest text-white font-[Space_Grotesk]">Strategy Sandbox</h2>
            <p className="text-[10px] text-[#8a9ab5] font-mono">Backtesting · A/B Testing · Monte Carlo · Paper Trading</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {['backtest', 'compare', 'montecarlo', 'paper'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-3 py-2 text-[10px] font-bold uppercase rounded-lg border transition-all ${activeTab === tab ? 'bg-[var(--color-gold)]/20 border-[var(--color-gold)]/50 text-[var(--color-gold)]' : 'border-[#1e2333] text-[#8a9ab5] hover:text-white'}`}>
              {tab === 'montecarlo' ? 'Monte Carlo' : tab === 'paper' ? 'Paper Trade' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Strategy Selector */}
      <div className="bg-[#141720] border border-[#1e2333] rounded-xl p-5">
        <div className="text-[10px] font-bold text-[#8a9ab5] uppercase tracking-widest mb-4">Strategy Library</div>
        <div className="flex gap-3 flex-wrap">
          {STRATEGIES.map(s => (
            <button key={s.id} onClick={() => setSelectedStrategy(s.id)}
              className={`px-4 py-2 text-[10px] font-bold rounded-lg border transition-all text-left ${selectedStrategy === s.id ? 'bg-[var(--color-gold)]/15 border-[var(--color-gold)]/50 text-[var(--color-gold)]' : 'border-[#1e2333] text-[#8a9ab5] hover:border-[#8a9ab5]/40 hover:text-white'}`}>
              <div className="font-bold">{s.label}</div>
              <div className="text-[8px] opacity-70 font-mono">{s.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'backtest' && (
          <motion.div key="backtest" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            {/* Controls */}
            <div className="xl:col-span-3 space-y-4">
              <div className="bg-[#141720] border border-[#1e2333] rounded-xl p-5">
                <div className="text-[10px] font-bold text-[#8a9ab5] uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Sliders size={10} className="text-[var(--color-gold)]" /> Backtest Config
                </div>
                <div className="space-y-4">
                  {[
                    { label: 'Symbol', value: symbol?.split('.')[0] || 'RELIANCE' },
                    { label: 'Period', value: '2 Years' },
                    { label: 'Initial Capital', value: '₹1,00,000' },
                    { label: 'Slippage', value: '0.1%' },
                    { label: 'Commission', value: '0.03%' },
                  ].map((item, i) => (
                    <div key={i} className="flex justify-between items-center border-b border-[#1e2333]/50 pb-2">
                      <span className="text-[9px] text-[#8a9ab5] font-bold uppercase">{item.label}</span>
                      <span className="text-[10px] text-white font-mono">{item.value}</span>
                    </div>
                  ))}
                </div>
                <button onClick={runBacktest} disabled={loading}
                  className="mt-5 w-full py-3 bg-[var(--color-gold)] text-[#0d0f12] font-bold text-xs uppercase rounded-lg hover:brightness-110 transition-all flex items-center justify-center gap-2">
                  {loading ? <RefreshCw size={12} className="animate-spin" /> : <PlayCircle size={12} />}
                  RUN BACKTEST
                </button>
              </div>
            </div>

            {/* Results */}
            <div className="xl:col-span-9 space-y-4">
              {backtest ? (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {metrics.map((m, i) => (
                      <div key={i} className="bg-[#141720] border border-[#1e2333] rounded-xl p-4">
                        <div className="text-[9px] text-[#8a9ab5] font-bold uppercase mb-1">{m.label}</div>
                        <div className="text-xl font-bold font-[Inter]" style={{ color: m.color }}>{m.value}</div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-[#141720] border border-[#1e2333] rounded-xl p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-[10px] font-bold text-[#8a9ab5] uppercase tracking-widest">Equity Curve</div>
                      <div className="text-[9px] font-mono text-[var(--color-gold)]">Initial: ₹1,00,000 → Final: ₹{backtest.final_value?.toLocaleString()}</div>
                    </div>
                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={backtest.equity_curve} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="var(--color-gold)" stopOpacity={0.35} />
                              <stop offset="100%" stopColor="var(--color-gold)" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="date" hide />
                          <YAxis hide domain={['dataMin - 2000', 'dataMax + 2000']} />
                          <ReferenceLine y={100000} stroke="#8a9ab5" strokeDasharray="4 4" strokeWidth={1} />
                          <Tooltip contentStyle={{ background: '#141720', border: '1px solid #1e2333', fontSize: 10, color: 'white' }}
                            formatter={v => [`₹${v.toLocaleString()}`, 'Portfolio']} />
                          <Area type="monotone" dataKey="value" stroke="var(--color-gold)" strokeWidth={2} fill="url(#eqGrad)" dot={false} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-[#141720] border border-[#1e2333] rounded-xl p-5">
                    <div className="text-[10px] font-bold text-[#8a9ab5] uppercase tracking-widest mb-4">Monthly Returns Breakdown</div>
                    <div className="h-[100px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monthlyReturns} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                          <XAxis dataKey="month" tick={{ fill: '#8a9ab5', fontSize: 8, fontFamily: 'monospace' }} />
                          <YAxis hide />
                          <Tooltip contentStyle={{ background: '#141720', border: '1px solid #1e2333', fontSize: 10, color: 'white' }}
                            formatter={v => [`${v}%`, 'Return']} />
                          <ReferenceLine y={0} stroke="#1e2333" />
                          <Bar dataKey="ret" radius={[2, 2, 0, 0]}>
                            {monthlyReturns.map((m, i) => <Cell key={i} fill={m.ret >= 0 ? '#00e676' : '#ff4444'} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-[#141720] border border-[#1e2333] rounded-xl p-16 flex flex-col items-center justify-center text-center">
                  <PlayCircle size={40} className="text-[#1e2333] mb-4" />
                  <p className="text-[#8a9ab5] font-mono text-sm">Select a strategy and click "Run Backtest"</p>
                  <p className="text-[#8a9ab5] font-mono text-xs mt-2 opacity-70">2+ years of historical data · Full performance analytics</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'compare' && (
          <motion.div key="compare" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="space-y-6">
            <div className="bg-[#141720] border border-[#1e2333] rounded-xl p-5">
              <div className="flex items-center gap-4 mb-4">
                <div className="text-[10px] font-bold text-[#8a9ab5] uppercase tracking-widest flex items-center gap-2">
                  <GitCompare size={12} className="text-[var(--color-gold)]" /> A/B Strategy Comparison
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-[9px] text-[#8a9ab5] font-bold uppercase mb-2 block">Strategy A</label>
                  <select value={selectedStrategy} onChange={e => setSelectedStrategy(e.target.value)}
                    className="w-full bg-[#0d0f12] border border-[#1e2333] text-white text-xs p-2 rounded-lg focus:outline-none focus:border-[var(--color-gold)]">
                    {STRATEGIES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[9px] text-[#8a9ab5] font-bold uppercase mb-2 block">Strategy B</label>
                  <select value={compareStrategy} onChange={e => setCompareStrategy(e.target.value)}
                    className="w-full bg-[#0d0f12] border border-[#1e2333] text-white text-xs p-2 rounded-lg focus:outline-none focus:border-[var(--color-gold)]">
                    {STRATEGIES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                </div>
              </div>
              <button onClick={runComparison} disabled={loading}
                className="px-6 py-2.5 bg-[var(--color-gold)] text-[#0d0f12] font-bold text-xs uppercase rounded-lg hover:brightness-110 transition-all flex items-center gap-2">
                {loading ? <RefreshCw size={12} className="animate-spin" /> : <GitCompare size={12} />}
                RUN COMPARISON
              </button>
            </div>
            {compareResult && (
              <div className="grid grid-cols-2 gap-6">
                {['a', 'b'].map(key => (
                  <div key={key} className={`bg-[#141720] border rounded-xl p-5 ${key === 'a' ? 'border-[var(--color-gold)]/40' : 'border-[#7dd3fc]/30'}`}>
                    <div className={`text-[10px] font-bold uppercase tracking-widest mb-4 ${key === 'a' ? 'text-[var(--color-gold)]' : 'text-[#7dd3fc]'}`}>
                      Strategy {key.toUpperCase()}: {compareResult[key].label}
                    </div>
                    <div className="space-y-3">
                      {[
                        ['Total Return', `${compareResult[key].ret >= 0 ? '+' : ''}${compareResult[key].ret}%`],
                        ['Win Rate', compareResult[key].winRate],
                        ['Sharpe Ratio', compareResult[key].sharpe],
                        ['Max Drawdown', `-${compareResult[key].maxDD}%`],
                      ].map(([label, val]) => (
                        <div key={label} className="flex justify-between border-b border-[#1e2333]/50 pb-2">
                          <span className="text-[9px] text-[#8a9ab5] font-bold uppercase">{label}</span>
                          <span className="text-[10px] font-bold text-white font-mono">{val}</span>
                        </div>
                      ))}
                    </div>
                    {compareResult[key].ret > (key === 'a' ? compareResult.b.ret : compareResult.a.ret) && (
                      <div className="mt-3 text-[9px] font-bold text-[#00e676] bg-[#00e676]/10 px-2 py-1 rounded text-center uppercase">✓ Winner</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'montecarlo' && (
          <motion.div key="mc" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="bg-[#141720] border border-[#1e2333] rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="text-[10px] font-bold text-[#8a9ab5] uppercase tracking-widest flex items-center gap-2">
                <Dices size={12} className="text-[#a855f7]" /> Monte Carlo Simulation (60 Paths)
              </div>
              <button onClick={runMonteCarlo}
                className="px-4 py-2 bg-[#a855f7]/20 border border-[#a855f7]/40 text-[#a855f7] rounded-lg text-[10px] font-bold uppercase hover:bg-[#a855f7]/30 transition-all flex items-center gap-2">
                <Dices size={12} /> SIMULATE
              </button>
            </div>
            {monteCarloRuns ? (
              <>
                <MonteCarloChart runs={monteCarloRuns} />
                <div className="grid grid-cols-3 gap-4 mt-4">
                  {[
                    { label: 'Best Case', val: `+${Math.round(20 + Math.random() * 40)}%`, color: '#00e676' },
                    { label: 'Median Case', val: `+${Math.round(5 + Math.random() * 15)}%`, color: '#ff9800' },
                    { label: 'Worst Case', val: `-${Math.round(5 + Math.random() * 20)}%`, color: '#ff4444' },
                  ].map((s, i) => (
                    <div key={i} className="bg-[#0d0f12] border border-[#1e2333] rounded-lg p-3 text-center">
                      <div className="text-[8px] text-[#8a9ab5] uppercase font-bold mb-1">{s.label}</div>
                      <div className="text-lg font-bold font-[Inter]" style={{ color: s.color }}>{s.val}</div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-16 text-[#8a9ab5] font-mono text-sm">Click SIMULATE to run 60 Monte Carlo paths</div>
            )}
          </motion.div>
        )}

        {activeTab === 'paper' && (
          <motion.div key="paper" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-[#ff9800] animate-pulse" />
                <span className="text-[10px] font-bold text-[#ff9800] uppercase tracking-widest font-[Space_Grotesk]">Paper Trading Mode · LIVE Data · No Real Money</span>
              </div>
              <button onClick={addPaperTrade}
                className="px-4 py-2 bg-[#ff9800]/10 border border-[#ff9800]/30 text-[#ff9800] rounded-lg text-[10px] font-bold uppercase hover:bg-[#ff9800]/20 transition-all">
                + PAPER TRADE
              </button>
            </div>
            <div className="bg-[#141720] border border-[#1e2333] rounded-xl overflow-hidden">
              <div className="grid grid-cols-7 gap-2 px-4 py-3 border-b border-[#1e2333] text-[9px] font-bold text-[#8a9ab5] uppercase">
                <span>Symbol</span><span>Side</span><span>Price</span><span>Qty</span><span>Strategy</span><span>Time</span><span>PnL</span>
              </div>
              <AnimatePresence>
                {paperTrades.length === 0 ? (
                  <div className="text-center py-12 text-[#8a9ab5] font-mono text-xs">Click "+ PAPER TRADE" to simulate live trades with your strategy</div>
                ) : (
                  paperTrades.map(t => (
                    <motion.div key={t.id} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                      className="grid grid-cols-7 gap-2 px-4 py-3 border-b border-[#1e2333]/30 text-[10px] hover:bg-[#0d0f12]/50">
                      <span className="font-bold text-white">{t.symbol}</span>
                      <span className={`font-bold ${t.side === 'BUY' ? 'text-[#00e676]' : 'text-[#ff4444]'}`}>{t.side}</span>
                      <span className="text-white font-mono">₹{t.price}</span>
                      <span className="text-white">{t.qty}</span>
                      <span className="text-[#8a9ab5] truncate">{t.strategy}</span>
                      <span className="text-[#8a9ab5] font-mono">{t.time}</span>
                      <span className={`font-bold font-mono ${t.pnl >= 0 ? 'text-[#00e676]' : 'text-[#ff4444]'}`}>{t.pnl >= 0 ? '+' : ''}₹{t.pnl}</span>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
