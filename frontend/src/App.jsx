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
import MarketPulse from './components/MarketPulse';
import AITerminal from './components/AITerminal';
import AISignals from './components/AISignals';
import AIScreener from './components/AIScreener';
import PortfolioView from './components/PortfolioView';
import OrdersView from './components/OrdersView';
import ErrorBoundary from './components/ErrorBoundary';
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

  const handleTrade = async (side, customExecPrice) => {
    try {
      const execPrice = customExecPrice || livePrice?.price || data?.current_price || 150.0;
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
        <div className="hidden md:flex gap-5 text-[11px] font-[Inter] tracking-wider uppercase text-[#8a9ab5] font-bold">
          <a href="#market-pulse" onClick={(e) => { e.preventDefault(); document.getElementById('market-pulse').scrollIntoView({behavior: 'smooth'})}} className="hover:text-white transition-colors">Pulse</a>
          <a href="#terminal" onClick={(e) => { e.preventDefault(); document.getElementById('terminal').scrollIntoView({behavior: 'smooth'})}} className="hover:text-white transition-colors">Terminal</a>
          <a href="#ai-signals" onClick={(e) => { e.preventDefault(); document.getElementById('ai-signals').scrollIntoView({behavior: 'smooth'})}} className="hover:text-white transition-colors">Signals</a>
          <a href="#screener" onClick={(e) => { e.preventDefault(); document.getElementById('screener').scrollIntoView({behavior: 'smooth'})}} className="hover:text-white transition-colors">Screener</a>
          <a href="#portfolio" onClick={(e) => { e.preventDefault(); document.getElementById('portfolio').scrollIntoView({behavior: 'smooth'})}} className="hover:text-white transition-colors">Portfolio</a>
          <a href="#orders" onClick={(e) => { e.preventDefault(); document.getElementById('orders').scrollIntoView({behavior: 'smooth'})}} className="hover:text-white transition-colors">Orders</a>
        </div>
        <div className="flex gap-4">
          <button className="px-5 py-2 text-xs font-mono uppercase border border-[var(--color-panel-border)] rounded hover:border-[var(--color-gold)] transition-colors bg-[var(--color-panel)]">Log In</button>
          <button className="px-5 py-2 text-xs font-mono uppercase bg-[var(--color-gold)] text-[#060810] rounded hover:bg-[var(--color-gold-light)] transition-colors shimmer-sweep font-bold">Get Started</button>
        </div>
      </nav>

      {/* Scrolling Ticker */}
      <TickerStrip state={marketEngine} />

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

      {/* Market Pulse Section */}
      <section id="market-pulse" className="max-w-[1600px] mx-auto px-4 pb-24 border-t border-[#1e2333] pt-24">
         <div className="mb-8 flex items-center justify-between">
           <h2 className="text-3xl font-[Space_Grotesk] font-bold uppercase text-white">Market <span className="text-[#00e676]">Pulse</span></h2>
         </div>
         <ErrorBoundary>
          {marketEngine ? (
              <MarketPulse state={marketEngine} />
          ) : (
              <div className="text-sm font-mono text-[#8a9ab5] animate-pulse">Initializing Global Market Engine...</div>
          )}
         </ErrorBoundary>
      </section>

      {/* Main Dashboard Layout / Terminal */}
      <div 
        id="terminal"
        ref={dashboardRef} 
        className={`px-4 pb-24 transition-all duration-1000 ease-out ${isDashboardInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'} pt-16`}
      >
        <ErrorBoundary>
          <AITerminal 
             symbol={symbol}
             setSymbol={setSymbol}
             data={data}
             livePrice={livePrice}
             handleTrade={handleTrade}
             portfolio={portfolio}
             tradeSide={tradeSide}
             setTradeSide={setTradeSide}
             tradeAmount={tradeAmount}
             setTradeAmount={setTradeAmount}
             totalNAV={totalNAV}
          />
        </ErrorBoundary>
      </div>

      {/* AI Signals Section */}
      <section id="ai-signals" className="max-w-[1600px] mx-auto px-4 pb-24 border-t border-[#1e2333] pt-24">
         <div className="mb-8 flex items-center justify-between">
           <h2 className="text-3xl font-[Space_Grotesk] font-bold uppercase text-white">AI <span className="text-[#00e676]">Signals</span></h2>
         </div>
         <ErrorBoundary>
          <AISignals 
              symbol={symbol}
              setSymbol={setSymbol}
              data={data}
              livePrice={livePrice}
              marketEngine={marketEngine}
          />
         </ErrorBoundary>
       </section>

      {/* AI Screener Section */}
      <section id="screener" className="max-w-[1600px] mx-auto px-4 pb-24 border-t border-[#1e2333] pt-24">
         <ErrorBoundary>
          <AIScreener setSymbol={setSymbol} portfolio={portfolio} />
         </ErrorBoundary>
      </section>

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

      {/* Portfolio Section */}
      <section id="portfolio" className="max-w-[1600px] mx-auto px-4 pb-24 border-t border-[#1e2333] pt-24">
         <div className="mb-8 flex items-center justify-between">
           <h2 className="text-3xl font-[Space_Grotesk] font-bold uppercase text-white">Portfolio <span className="text-[#7dd3fc]">Holdings</span></h2>
         </div>
         <ErrorBoundary>
          <PortfolioView
            portfolio={portfolio}
            analytics={analytics}
            totalNAV={totalNAV}
            setSymbol={setSymbol}
          />
         </ErrorBoundary>
      </section>

      {/* Orders Section */}
      <section id="orders" className="max-w-[1600px] mx-auto px-4 pb-24 border-t border-[#1e2333] pt-24">
         <div className="mb-8 flex items-center justify-between">
           <h2 className="text-3xl font-[Space_Grotesk] font-bold uppercase text-white">Order <span className="text-[#ff9800]">History</span></h2>
         </div>
         <ErrorBoundary>
          <OrdersView liveOrders={portfolio?.history || []} />
         </ErrorBoundary>
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
