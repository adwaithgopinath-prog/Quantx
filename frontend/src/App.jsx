import React, { useState, useEffect, useRef } from 'react';
import { API_BASE, WS_BASE } from './api';
import api from './api';
import { motion, useInView } from 'framer-motion';
import { Search, Activity, Zap,  CreditCard, LayoutDashboard, TrendingUp, ChevronRight, Terminal, BarChart2, Briefcase, PlayCircle } from 'lucide-react';
import ParticleBackground from './ParticleBackground';
import TickerStrip from './TickerStrip';
import CountUp from './CountUp';
import InstitutionalChart from './InstitutionalChart';
import AIChat from './components/AIChat';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, PieChart, Pie, Cell } from 'recharts';

export default function App() {
  const [symbol, setSymbol] = useState('RELIANCE.NS');
  const [searchInput, setSearchInput] = useState('');
  const [data, setData] = useState(null);
  const [backtest, setBacktest] = useState(null);
  const [marketEngine, setMarketEngine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [livePrice, setLivePrice] = useState(null);
  const [tradeFeed, setTradeFeed] = useState([]);
  
  const [portfolio, setPortfolio] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [tradeAmount, setTradeAmount] = useState(1);
  const [tradeSide, setTradeSide] = useState('BUY');
  
  const totalNAV = portfolio?.positions ? portfolio.positions.reduce((acc, pos) => acc + (pos.quantity * (pos.symbol === symbol && livePrice ? livePrice.price : (pos.current_price || pos.avg_price))), 0) + (portfolio.balance || 0) : 0;

  const fetchMarketEngine = async () => {
    try {
      const res = await api.get(`/api/market/engine`);
      const pipeStats = await api.get(`/api/pipeline/stats`);
      setMarketEngine({ ...res.data, pipeline_stats: pipeStats.data });
    } catch (err) {}
  };

  useEffect(() => {
    const interval = setInterval(fetchMarketEngine, 60000);
    fetchMarketEngine();
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let ws;
    let tradeWs;
    if (symbol) {
      ws = new WebSocket(`${WS_BASE}/ws/ticker/${symbol}`);
      ws.onmessage = (event) => setLivePrice(JSON.parse(event.data));

      tradeWs = new WebSocket(`${WS_BASE}/ws/trades/${symbol}`);
      tradeWs.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        setTradeFeed(prev => [msg, ...prev].slice(0, 5));
      };
    }
    return () => { ws?.close(); tradeWs?.close(); };
  }, [symbol]);

  const fetchDashboardData = async (sym) => {
    setLoading(true);
    try {
      const res = await api.get(`/api/dashboard/${sym}`);
      setData(res.data);
      const btRes = await api.get(`/api/backtest/${sym}`);
      setBacktest(btRes.data);
    } catch (err) {
      setData({ error: 'Connection Error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchPortfolio = async () => {
    try {
      const res = await api.get(`/api/portfolio`);
      setPortfolio(res.data);
    } catch (err) {}
  };

  const fetchPortfolioAnalytics = async () => {
    try {
      const res = await api.get(`/api/portfolio/analytics?rfr=0.05`);
      setAnalytics(res.data);
    } catch (err) {}
  };

  const handleTrade = async (side) => {
    try {
      const execPrice = livePrice?.price || data?.current_price || 150.0;
      await api.post(`/api/trade`, { symbol, side, quantity: parseInt(tradeAmount) || 1, price: execPrice });
      fetchPortfolio();
      fetchPortfolioAnalytics();
    } catch (err) {
      alert(err.response?.data?.detail || "Trade failed");
    }
  };

  useEffect(() => {
    fetchDashboardData(symbol);
    fetchPortfolio();
    fetchPortfolioAnalytics();
  }, [symbol]);

  const dashboardRef = useRef(null);
  const isDashboardInView = useInView(dashboardRef, { once: true, margin: "-100px" });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  return (
    <>
      <ParticleBackground />
      <div className="min-h-screen text-white" style={{ position: 'relative', zIndex: 1, paddingTop: '92px' }}>
      
      {/* Fixed NavBar */}
      <nav className="fixed w-full top-0 left-0 z-[100] bg-[#060810]/50 backdrop-blur-md border-b border-[var(--color-panel-border)] px-8 py-4 flex items-center justify-between h-[60px]">
        <div className="flex items-center gap-2">
          <Terminal size={24} className="text-[var(--color-gold)]" />
          <h1 className="text-xl font-bold tracking-widest text-white uppercase">Quant<span className="text-[var(--color-gold)]">X</span></h1>
        </div>
        <div className="hidden md:flex gap-8 text-[11px] font-mono tracking-widest uppercase text-[var(--color-silver)]">
          <a href="#markets" onClick={(e) => { e.preventDefault(); document.getElementById('markets').scrollIntoView({behavior: 'smooth'})}} className="hover:text-[var(--color-gold)] transition-colors">Markets</a>
          <a href="#strategy" onClick={(e) => { e.preventDefault(); document.getElementById('strategy').scrollIntoView({behavior: 'smooth'})}} className="hover:text-[var(--color-gold)] transition-colors">Strategy</a>
          <a href="#portfolio" onClick={(e) => { e.preventDefault(); document.getElementById('portfolio').scrollIntoView({behavior: 'smooth'})}} className="hover:text-[var(--color-gold)] transition-colors">Portfolio</a>
        </div>
        <div className="flex gap-4">
          <button className="px-5 py-2 text-xs font-mono uppercase border border-[var(--color-panel-border)] rounded hover:border-[var(--color-gold)] transition-colors bg-[var(--color-panel)]">Log In</button>
          <button className="px-5 py-2 text-xs font-mono uppercase bg-[var(--color-gold)] text-[#060810] rounded hover:bg-[var(--color-gold-light)] transition-colors shimmer-sweep font-bold">Get Started</button>
        </div>
      </nav>

      {/* Scrolling Ticker */}
      <TickerStrip />

      {/* Hero Section */}
      <motion.section 
        variants={containerVariants} 
        initial="hidden" 
        animate="visible"
        className="min-h-[80vh] flex flex-col items-center justify-center text-center px-4"
      >
        <motion.h1 variants={itemVariants} className="text-6xl md:text-8xl font-bold uppercase tracking-tight mb-6">
          Institutional <br /><span className="text-[var(--color-gold)]">Edge.</span>
        </motion.h1>
        <motion.p variants={itemVariants} className="text-[var(--color-silver)] font-mono text-sm md:text-base max-w-2xl mb-10 leading-relaxed">
          High-frequency trading dynamics fused with deep reinforcement learning. Absolute execution superiority engineered for the modern alpha seeker.
        </motion.p>
        <motion.div variants={itemVariants} className="flex gap-6 mb-20">
          <button className="px-8 py-3 text-sm font-bold font-mono uppercase bg-[var(--color-gold)] text-[#060810] rounded transition-transform hover:scale-105 shimmer-sweep">Launch Terminal</button>
          <button className="px-8 py-3 text-sm font-bold font-mono uppercase border border-[var(--color-panel-border)] rounded hover:border-[var(--color-silver)] transition-colors">View Whitepaper</button>
        </motion.div>
        
        {/* Stats Row */}
        <motion.div variants={itemVariants} className="flex flex-wrap justify-center gap-12 font-mono">
          <div className="flex flex-col items-center">
             <div className="text-3xl text-[var(--color-gold)] font-bold mb-2">&gt;<CountUp end={50} duration={2}/>+</div>
             <div className="text-[10px] text-[var(--color-silver)] uppercase tracking-widest">Global Instruments</div>
          </div>
          <div className="flex flex-col items-center">
             <div className="text-3xl text-[var(--color-gold)] font-bold mb-2"><CountUp end={2} duration={2}/>Yr</div>
             <div className="text-[10px] text-[var(--color-silver)] uppercase tracking-widest">Backtested Alpha</div>
          </div>
          <div className="flex flex-col items-center">
             <div className="text-3xl text-[var(--color-gold)] font-bold mb-2">&lt;<CountUp end={50} duration={2}/>ms</div>
             <div className="text-[10px] text-[var(--color-silver)] uppercase tracking-widest">Execution Latency</div>
          </div>
          <div className="flex flex-col items-center">
             <div className="text-3xl text-[var(--color-gold)] font-bold mb-2"><CountUp end={78} duration={2}/>%</div>
             <div className="text-[10px] text-[var(--color-silver)] uppercase tracking-widest">AI Prediction Accuracy</div>
          </div>
        </motion.div>
      </motion.section>

      {/* Main Dashboard Layout */}
      <div 
        id="markets"
        ref={dashboardRef} 
        className={`px-4 pb-24 transition-all duration-1000 ease-out ${isDashboardInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'}`}
      >
        <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Watchlist & Nav */}
          <div className="col-span-1 lg:col-span-3 space-y-6">
             <div className="bg-[var(--color-panel)] border border-[var(--color-panel-border)] p-5 rounded-lg">
                <form onSubmit={(e) => { e.preventDefault(); setSymbol(searchInput.toUpperCase()); }} className="relative mb-6">
                   <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-silver)]" />
                   <input type="text" placeholder="Search Symbol..." value={searchInput} onChange={e => setSearchInput(e.target.value)}
                          className="w-full bg-[#03040a] border border-[var(--color-panel-border)] text-white font-mono text-xs p-3 pl-10 rounded focus:outline-none focus:border-[var(--color-gold)] transition-colors" />
                </form>
                <div className="text-[10px] font-mono text-[var(--color-silver)] uppercase tracking-widest mb-4">Live Watchlist</div>
                <div className="space-y-3">
                   {['RELIANCE.NS','TCS.NS','HDFCBANK.NS','AAPL','MSFT'].map(s => (
                     <div key={s} onClick={() => setSymbol(s)} className={`flex justify-between items-center p-3 rounded cursor-pointer border ${symbol === s ? 'bg-[var(--color-gold)]/10 border-[var(--color-gold)]/50' : 'bg-[#03040a] border-transparent hover:border-[var(--color-panel-border)]'} transition-colors`}>
                        <div>
                           <div className="text-xs font-bold text-white mb-1">{s}</div>
                           <div className="text-[9px] text-[var(--color-silver)] font-mono">Series EQ</div>
                        </div>
                        <div className="text-right">
                           <div className="text-xs font-mono text-white">---</div>
                           <div className="text-[9px] font-mono text-[var(--color-bullish)]">+0.00%</div>
                        </div>
                     </div>
                   ))}
                </div>
             </div>
          </div>

          {/* Center Column: Chart & Indicators */}
          <div className="col-span-1 lg:col-span-6 space-y-6">
             <div className="bg-[var(--color-panel)] border border-[var(--color-panel-border)] p-5 rounded-lg flex flex-col">
                <div className="flex justify-between items-end mb-6">
                   <div>
                      <h2 className="text-2xl font-bold uppercase tracking-widest mb-1">{symbol}</h2>
                      <div className="text-[10px] font-mono text-[var(--color-silver)] uppercase">{data?.info?.sector || 'Global Equity'}</div>
                   </div>
                   <div className="text-right relative">
                      <div className="text-3xl font-mono relative overflow-hidden transition-all flashing-price">
                        {livePrice ? livePrice.price : (data?.current_price || '---')}
                      </div>
                      <div className={`text-xs font-mono mt-1 ${livePrice?.change >= 0 ? 'text-[var(--color-bullish)]' : 'text-[var(--color-bearish)]'}`}>
                         {livePrice?.change >= 0 ? '+' : ''}{livePrice?.change || '0.00'}
                      </div>
                   </div>
                </div>
                
                {/* Canvas Chart */}
                <InstitutionalChart data={data?.history} livePrice={livePrice} />
             </div>

             {/* Indicators Row */}
             <div className="grid grid-cols-4 gap-4">
                 {[{name:'RSI', val: data?.indicators?.rsi != null ? Number(data.indicators.rsi).toFixed(2) : '0.00'},
                  {name:'MACD', val: data?.indicators?.macd?.value != null ? Number(data.indicators.macd.value).toFixed(2) : '0.00'},
                  {name:'VOL', val: data?.history && data.history.length > 0 ? (data.history[data.history.length-1].volume / 1000).toFixed(0)+'K' : '---'},
                  {name:'AI SIG', val: (data?.fusion?.recommendation && data.fusion.recommendation.includes('BUY')) ? 'BUY' : 'HOLD', color: 'text-[var(--color-bullish)]'}
                ].map((ind, i) => (
                  <div key={i} className="bg-[var(--color-panel)] border border-[var(--color-panel-border)] p-4 rounded hover:border-[var(--color-gold)] transition-colors group cursor-default">
                     <div className="text-[9px] text-[var(--color-silver)] font-mono mb-2 uppercase">{ind.name}</div>
                     <div className={`text-sm font-mono font-bold ${ind.color || 'text-white'}`}>{ind.val}</div>
                  </div>
                ))}
             </div>
          </div>

          {/* Right Column: AI, Order, P&L */}
          <div className="col-span-1 lg:col-span-3 space-y-6">
             
             {/* AI Agent Box */}
             <div className="bg-[var(--color-panel)] border border-[var(--color-panel-border)] rounded-lg relative overflow-hidden max-h-[350px] overflow-y-auto">
                <AIChat symbol={symbol} />
             </div>

             {/* Order Form */}
             <div className="bg-[var(--color-panel)] border border-[var(--color-panel-border)] p-5 rounded-lg">
                <div className="flex border-b border-[var(--color-panel-border)] mb-5">
                   <button onClick={() => setTradeSide('BUY')} className={`flex-1 py-2 text-xs font-mono font-bold tracking-widest ${tradeSide === 'BUY' ? 'text-[var(--color-bullish)] border-b border-[var(--color-bullish)] bg-[var(--color-bullish)]/5' : 'text-[var(--color-silver)] hover:bg-white/5'}`}>BUY</button>
                   <button onClick={() => setTradeSide('SELL')} className={`flex-1 py-2 text-xs font-mono font-bold tracking-widest ${tradeSide === 'SELL' ? 'text-[var(--color-bearish)] border-b border-[var(--color-bearish)] bg-[var(--color-bearish)]/5' : 'text-[var(--color-silver)] hover:bg-white/5'}`}>SELL</button>
                </div>
                <div className="flex justify-between items-center bg-[#03040a] border border-[var(--color-panel-border)] p-3 rounded mb-3">
                   <span className="text-[10px] font-mono text-[var(--color-silver)]">PRICE</span>
                   <span className="text-xs font-mono font-bold">{livePrice?.price || data?.current_price || '---'}</span>
                </div>
                <div className="flex justify-between items-center bg-[#03040a] border border-[var(--color-panel-border)] p-3 rounded mb-4">
                   <span className="text-[10px] font-mono text-[var(--color-silver)]">QTY</span>
                   <input type="number" value={tradeAmount} onChange={e => setTradeAmount(e.target.value)} className="bg-transparent text-right outline-none text-xs font-mono font-bold w-20" />
                </div>
                <div className="flex gap-2 mb-6">
                   {['25%','50%','75%','MAX'].map(pct => (
                      <button key={pct} className="flex-1 py-1 text-[9px] font-mono text-[var(--color-silver)] bg-[#03040a] border border-[var(--color-panel-border)] rounded hover:border-[var(--color-gold)] hover:text-white transition-colors">{pct}</button>
                   ))}
                </div>
                <div className="flex justify-between text-[10px] font-mono mb-4 text-[var(--color-silver)]">
                   <span>VALUE</span>
                   <span className="text-white">₹{((livePrice?.price || data?.current_price || 0) * tradeAmount).toFixed(2)}</span>
                </div>
                <button onClick={() => handleTrade(tradeSide)} className={`w-full py-4 rounded text-xs font-mono font-bold tracking-widest uppercase glint-sweep ${tradeSide === 'BUY' ? 'bg-[var(--color-bullish)] text-[#060810]' : 'bg-[var(--color-bearish)] text-white'}`}>
                   EXECUTE {tradeSide}
                </button>
             </div>

             {/* Portfolio Short */}
             <div className="bg-[var(--color-panel)] border border-[var(--color-panel-border)] p-5 rounded-lg">
                <div className="text-[10px] font-mono text-[var(--color-silver)] uppercase tracking-widest mb-4">Active Holdings</div>
                <div className="space-y-3 mb-4">
                   {portfolio?.positions?.slice(0,3).map((p,i) => (
                      <div key={i} className="flex justify-between text-xs font-mono">
                         <div className="text-white">{p.symbol.split('.')[0]}</div>
                         <div className={p.pnl >= 0 ? 'text-[var(--color-bullish)]' : 'text-[var(--color-bearish)]'}>{p.pnl >= 0 ? '+' : ''}{p.pnl.toFixed(2)}</div>
                      </div>
                   ))}
                </div>
                <div className="border-t border-[var(--color-panel-border)] pt-3 flex justify-between text-xs font-mono font-bold">
                   <span className="text-[var(--color-gold)]">TOTAL NAV</span>
                   <span className="text-[var(--color-gold)]">₹{totalNAV.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                </div>
             </div>

          </div>
        </div>
      </div>

      {/* Strategy / Sandbox Section */}
      <section id="strategy" className="max-w-[1600px] mx-auto px-4 py-24 border-t border-[var(--color-panel-border)]">
         <h2 className="text-3xl font-bold uppercase mb-8 text-[var(--color-gold)] border-b border-[var(--color-gold)] pb-2 inline-block">Strategy Sandbox</h2>
         <div className="bg-[var(--color-panel)] border border-[var(--color-panel-border)] p-8 rounded-lg">
            {backtest ? (
               <div className="space-y-4">
                  <div className="flex justify-between items-end mb-6">
                     <div>
                        <p className="text-[10px] font-bold text-[var(--color-silver)] uppercase tracking-widest mb-1">Projected Return</p>
                        <span className={`text-3xl font-bold ${backtest.total_return_pct >= 0 ? 'text-[var(--color-bullish)]' : 'text-[var(--color-bearish)]'}`}>
                          {backtest.total_return_pct >= 0 ? '+' : ''}{backtest.total_return_pct}%
                        </span>
                     </div>
                     <div className="text-right">
                        <p className="text-[10px] font-bold text-[var(--color-silver)] uppercase tracking-widest mb-1">Win Probability</p>
                        <span className="text-sm font-bold text-white bg-[var(--color-panel-border)] px-4 py-2 rounded">{backtest.win_rate}</span>
                     </div>
                  </div>
                  {backtest.equity_curve && (
                     <div className="w-full h-[300px] mt-4 border border-[var(--color-panel-border)] rounded overflow-hidden">
                       <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={backtest.equity_curve} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                            <defs>
                              <linearGradient id="colorEq" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--color-gold)" stopOpacity={0.4}/>
                                <stop offset="95%" stopColor="var(--color-gold)" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <XAxis dataKey="date" hide={true} />
                            <YAxis domain={['dataMin - 1000', 'dataMax + 1000']} hide={true} />
                            <RechartsTooltip cursor={{ stroke: 'var(--color-panel-border)', strokeWidth: 1 }} contentStyle={{backgroundColor: '#060810', border: '1px solid var(--color-panel-border)', color: 'white'}} formatter={(val) => `₹${val}`} labelFormatter={(label) => `Date: ${label}`} />
                            <Area type="monotone" dataKey="value" stroke="var(--color-gold)" strokeWidth={2} fillOpacity={1} fill="url(#colorEq)" />
                          </AreaChart>
                       </ResponsiveContainer>
                     </div>
                  )}
               </div>
            ) : <p className="text-sm text-[var(--color-silver)] font-mono">Run backtest to see equity curve...</p>}
         </div>
      </section>

      {/* Portfolio Tracker Section */}
      <section id="portfolio" className="max-w-[1600px] mx-auto px-4 pb-24 border-t border-[var(--color-panel-border)] pt-24">
         <h2 className="text-3xl font-bold uppercase mb-8 text-[var(--color-gold)] border-b border-[var(--color-gold)] pb-2 inline-block">Portfolio Holdings</h2>
         <div className="bg-[var(--color-panel)] border border-[var(--color-panel-border)] rounded-lg overflow-hidden">
            <table className="w-full text-left font-mono text-xs">
               <thead>
                  <tr className="bg-[var(--color-panel-border)] text-[var(--color-silver)] text-[10px] uppercase tracking-widest border-b border-[var(--color-panel-border)]">
                     <th className="p-4 font-bold">Symbol</th>
                     <th className="p-4 font-bold">Quantity</th>
                     <th className="p-4 font-bold">Avg Price</th>
                     <th className="p-4 font-bold">Current Price</th>
                     <th className="p-4 font-bold text-right">P&L</th>
                  </tr>
               </thead>
               <tbody>
                  {portfolio?.positions?.map((pos, i) => (
                    <tr key={i} className="border-b border-[var(--color-panel-border)] last:border-0 hover:bg-[#03040a] transition-colors cursor-pointer" onClick={() => setSymbol(pos.symbol)}>
                       <td className="p-4 text-white font-bold">{pos.symbol}</td>
                       <td className="p-4 text-[var(--color-silver)]">{pos.quantity}</td>
                       <td className="p-4 text-[var(--color-silver)]">₹{pos.avg_price.toLocaleString()}</td>
                       <td className="p-4 text-white font-bold">₹{pos.current_price.toLocaleString()}</td>
                       <td className={`p-4 text-right font-bold ${pos.pnl >= 0 ? 'text-[var(--color-bullish)]' : 'text-[var(--color-bearish)]'}`}>
                         {pos.pnl >= 0 ? '+' : ''}{pos.pnl.toLocaleString()} ({pos.pnl_pct}%)
                       </td>
                    </tr>
                  ))}
                  {(!portfolio?.positions || portfolio.positions.length === 0) && (
                     <tr>
                        <td colSpan="5" className="p-8 text-center text-[var(--color-silver)] font-mono">No active holdings.</td>
                     </tr>
                  )}
               </tbody>
            </table>
         </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-[1200px] mx-auto px-4 py-24 border-t border-[var(--color-panel-border)]">
         <h2 className="text-3xl font-bold uppercase text-center mb-16">Terminal Architecture</h2>
         <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: "Algorithmic Engine", desc: "AI-powered signal generation combining RSI, MACD, and moving average crossovers with real-time market data" },
              { title: "Deep Learning Risk", desc: "ML-based risk scoring that evaluates portfolio exposure, volatility, and drawdown in real time" },
              { title: "Sub-Millisecond Feed", desc: "WebSocket-powered live price stream for 50+ NSE/BSE and global instruments with sub-50ms latency" },
              { title: "Dark Pool Access", desc: "Institutional order flow analysis detecting hidden accumulation and distribution patterns" },
              { title: "Strategy Sandbox", desc: "Backtest any strategy against 2 years of historical data with detailed win rate and return analytics" },
              { title: "Quantum Encryption", desc: "End-to-end encrypted order execution and portfolio data with zero-knowledge architecture" }
            ].map((feature, i) => (
               <div key={i} className="relative group bg-[var(--color-panel)] border border-[var(--color-panel-border)] p-8 rounded-lg overflow-hidden transition-colors hover:bg-[var(--color-panel-border)]">
                  {/* Hover Gold Line */}
                  <div className="absolute top-0 left-0 w-full h-[2px] bg-[var(--color-gold)] origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300 pointer-events-none"></div>
                  <div className="w-10 h-10 mb-6 bg-[#03040a] rounded flex items-center justify-center border border-[var(--color-panel-border)] group-hover:border-[var(--color-gold)] transition-colors">
                     <Terminal size={18} className="text-[var(--color-gold)]" />
                  </div>
                  <h3 className="text-sm font-bold uppercase tracking-widest mb-3">{feature.title}</h3>
                  <p className="text-[11px] font-mono text-[var(--color-silver)] leading-relaxed">{feature.desc}</p>
               </div>
            ))}
         </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--color-panel-border)] bg-[#03040a] py-8 px-8 text-center md:flex md:justify-between items-center">
         <div className="flex items-center gap-2 justify-center mb-4 md:mb-0">
            <Terminal size={18} className="text-[var(--color-gold)]" />
            <span className="text-sm font-bold tracking-widest uppercase">Quant<span className="text-[var(--color-gold)]">X</span></span>
         </div>
         <p className="text-[10px] font-mono text-[var(--color-silver)] uppercase tracking-widest">Architected for Alpha.</p>
         <div className="flex gap-4 justify-center mt-4 md:mt-0 font-mono text-[10px]">
            <a href="#" className="hover:text-[var(--color-gold)] transition-colors text-[var(--color-silver)]">GITHUB API</a>
            <a href="#" className="hover:text-[var(--color-gold)] transition-colors text-[var(--color-silver)]">LAUNCH APP</a>
         </div>
      </footer>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .flashing-price {
           animation: flash 1.8s infinite;
        }
        @keyframes flash {
           0% { text-shadow: 0 0 0px rgba(255,255,255,0); }
           50% { text-shadow: 0 0 10px rgba(255,255,255,0.8); }
           100% { text-shadow: 0 0 0px rgba(255,255,255,0); }
        }
      `}} />
    </>
  );
}
