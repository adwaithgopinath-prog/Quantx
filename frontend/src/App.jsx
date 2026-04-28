import React, { useState, useEffect, useCallback, useMemo, Suspense, lazy } from 'react';
import { WS_BASE } from './api';
import api from './api';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { useSymbol } from './context/SymbolContext';
import { useAuth } from './context/AuthContext';

// Core components
import ParticleBackground from './ParticleBackground';
import TickerStrip from './TickerStrip';
import Login from './components/Login';
import Register from './components/Register';
import ErrorBoundary from './components/ErrorBoundary';

// Lazy loaded components
const MarketPulse = lazy(() => import('./components/MarketPulse'));
const AITerminal = lazy(() => import('./components/AITerminal'));
const AISignals = lazy(() => import('./components/AISignals'));
const AIScreener = lazy(() => import('./components/AIScreener'));
const PortfolioView = lazy(() => import('./components/PortfolioView'));
const OrdersView = lazy(() => import('./components/OrdersView'));
const AlgorithmicEngine = lazy(() => import('./components/AlgorithmicEngine'));
const DeepLearningRisk = lazy(() => import('./components/DeepLearningRisk'));
const SubMillisecondFeed = lazy(() => import('./components/SubMillisecondFeed'));
const DarkPoolAccess = lazy(() => import('./components/DarkPoolAccess'));
const StrategySandbox = lazy(() => import('./components/StrategySandbox'));
const QuantumEncryption = lazy(() => import('./components/QuantumEncryption'));
const Markets = lazy(() => import('./components/Markets'));
const Predictions = lazy(() => import('./components/Predictions'));
const AppLayout = lazy(() => import('./components/AppLayout'));
const AIChat = lazy(() => import('./components/AIChat'));
const InstitutionalChart = lazy(() => import('./InstitutionalChart'));

import { motion, useInView, AnimatePresence } from 'framer-motion';

// ─── Sub-components ─────────────────────────────────────────────────────────
function Section({ id, children, title, accent }) {
  const ref = React.useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <section id={`section-${id}`} ref={ref} className="max-w-[1600px] mx-auto px-4 pb-24 pt-24 border-t border-[#1e2333]">
      {title && (
        <div className="mb-8 flex items-center gap-4">
          <h2 className="text-2xl font-[Space_Grotesk] font-bold uppercase text-white">
            {title.split(' ').map((word, i, arr) =>
              i === arr.length - 1 ? <span key={i} style={{ color: accent || 'var(--color-gold)' }}>{word} </span>
              : <span key={i}>{word} </span>
            )}
          </h2>
          <div className="flex-1 h-px bg-gradient-to-r from-[#1e2333] to-transparent" />
        </div>
      )}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, ease: 'easeOut' }}>
        {children}
      </motion.div>
    </section>
  );
}

const DashboardPage = ({ 
  data, livePrice, handleTrade, 
  portfolio, tradeSide, setTradeSide, tradeAmount, 
  setTradeAmount, totalNAV, marketEngine, analytics, navigate 
}) => {
  const { activeSymbol, setActiveSymbol } = useSymbol();
  
  return (
    <div className="pb-20">
      <section id="section-hero" className="min-h-[50vh] flex flex-col items-center justify-center text-center px-4 relative">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[600px] h-[600px] bg-[#C9A84C] opacity-[0.03] rounded-full blur-3xl" />
        </div>
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="relative z-10">
          <div className="inline-flex items-center gap-2 bg-[#141720] border border-[#1e2333] px-4 py-2 rounded-full mb-8 text-[10px] font-mono text-[#8a9ab5]">
            <div className="w-1.5 h-1.5 rounded-full bg-[#00e676] animate-pulse" />
            INSTITUTIONAL GRADE AI TRADING PLATFORM · ALL 6 MODULES ACTIVE
          </div>
          <h1 className="text-5xl md:text-7xl font-bold uppercase tracking-tight mb-6 font-[Space_Grotesk]">
            Institutional <br /><span className="text-[#C9A84C]">Edge.</span>
          </h1>
          <p className="text-gray-500 font-mono text-xs max-w-2xl mb-10 leading-relaxed uppercase tracking-widest">
            Algo Engine · Deep Risk · Sub-ms Feed · Dark Pool · Strategy Sandbox · Quantum Encryption
          </p>
        </motion.div>
      </section>

      <Section id="dashboard" title="Market Pulse" accent="#00e676">
        <ErrorBoundary>
          {marketEngine ? <MarketPulse state={marketEngine} /> : <div className="text-sm font-mono text-[#8a9ab5] animate-pulse py-8">Initializing Global Market Engine...</div>}
        </ErrorBoundary>
      </Section>

      <section id="section-terminal" className="max-w-[1600px] mx-auto px-4 pb-24 border-t border-[#1e2333] pt-24">
        <div className="mb-8 flex items-center gap-4">
          <h2 className="text-2xl font-[Space_Grotesk] font-bold uppercase text-white">AI <span className="text-[#C9A84C]">Terminal</span></h2>
          <div className="flex-1 h-px bg-gradient-to-r from-[#1e2333] to-transparent" />
        </div>
        <ErrorBoundary>
          <AITerminal
            symbol={activeSymbol} setSymbol={setActiveSymbol} data={data} livePrice={livePrice}
            handleTrade={handleTrade} portfolio={portfolio} tradeSide={tradeSide}
            setTradeSide={setTradeSide} tradeAmount={tradeAmount} setTradeAmount={setTradeAmount} totalNAV={totalNAV}
          />
        </ErrorBoundary>
      </section>

      <Section id="algo" title="Algorithmic Engine" accent="#00e676">
        <ErrorBoundary><AlgorithmicEngine symbol={activeSymbol} data={data} livePrice={livePrice} /></ErrorBoundary>
      </Section>
    </div>
  );
};

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null; // Or a loader
  if (!user) return <Navigate to="/login" />;
  return children;
};

const LoadingFallback = () => (
  <div className="p-8 animate-pulse flex flex-col gap-4">
    <div className="h-40 bg-white/5 rounded-2xl" />
    <div className="h-20 bg-white/5 rounded-2xl" />
    <div className="grid grid-cols-3 gap-4">
      <div className="h-32 bg-white/5 rounded-2xl" />
      <div className="h-32 bg-white/5 rounded-2xl" />
      <div className="h-32 bg-white/5 rounded-2xl" />
    </div>
  </div>
);

// ─── Main Application ───────────────────────────────────────────────────────
export default function App() {
  const { activeSymbol, setActiveSymbol } = useSymbol();
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState(null);
  const [marketEngine, setMarketEngine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isWaking, setIsWaking] = useState(true);
  const [livePrice, setLivePrice] = useState(null);
  const [portfolio, setPortfolio] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [tradeAmount, setTradeAmount] = useState(1);
  const [tradeSide, setTradeSide] = useState('BUY');
  
  const navigate = useNavigate();

  // ── Connection check for Render cold start ─────────────────────────────────
  useEffect(() => {
    const checkBackend = async () => {
      try {
        await api.get('/');
        setIsWaking(false);
      } catch (err) {
        setTimeout(checkBackend, 2000);
      }
    };
    checkBackend();
  }, []);

  // ── Data fetching ──────────────────────────────────────────────────────────
  const fetchMarketEngine = useCallback(async () => {
    if (!user) return;
    try {
      const [res, pipeStats] = await Promise.all([
        api.get(`/api/market/engine`),
        api.get(`/api/pipeline/stats`)
      ]);
      setMarketEngine({ ...res.data, pipeline_stats: pipeStats.data });
    } catch {}
  }, [user]);

  const fetchDashboardData = useCallback(async (sym) => {
    if (isWaking || !user) return;
    setLoading(true);
    try {
      const res = await api.get(`/api/dashboard/${sym}`);
      setData(res.data);
    } catch {
      setData({ error: 'Connection Error' });
    } finally {
      setLoading(false);
    }
  }, [isWaking, user]);

  const fetchPortfolio = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.get(`/api/portfolio`);
      setPortfolio(res.data);
    } catch {}
  }, [user]);

  const fetchPortfolioAnalytics = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.get(`/api/portfolio/analytics?rfr=0.05`);
      setAnalytics(res.data);
    } catch {}
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const interval = setInterval(fetchMarketEngine, 60000);
    fetchMarketEngine();
    return () => clearInterval(interval);
  }, [fetchMarketEngine, user]);

  useEffect(() => {
    let ws;
    let reconnectTimeout;
    let lastMessageTime = Date.now();
    let watchdogInterval;

    const connect = () => {
      if (!activeSymbol || !user) return;
      
      ws = new WebSocket(`${WS_BASE}/ws/ticker/${activeSymbol}`);
      
      ws.onmessage = (event) => {
        lastMessageTime = Date.now();
        if (event.data === 'pong') return;
        
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'HEARTBEAT') return;
          setLivePrice(msg);
        } catch (e) {
          // Fallback if message is not JSON
        }
      };

      ws.onclose = () => {
        reconnectTimeout = setTimeout(connect, 3000);
      };

      // Heartbeat sender (Client to Server)
      const heartbeatInterval = setInterval(() => {
        if (ws?.readyState === WebSocket.OPEN) {
          ws.send('ping');
        }
      }, 5000);

      // Inactivity Watchdog (Server to Client)
      watchdogInterval = setInterval(() => {
        if (Date.now() - lastMessageTime > 45000) {
          console.warn('WebSocket inactive for 45s, reconnecting...');
          ws?.close();
        }
      }, 10000);

      return () => {
        clearInterval(heartbeatInterval);
        clearInterval(watchdogInterval);
      };
    };

    const cleanup = connect();
    
    return () => {
      ws?.close();
      clearTimeout(reconnectTimeout);
      if (cleanup) cleanup();
    };
  }, [activeSymbol, user]);

  useEffect(() => {
    if (!user) return;
    fetchDashboardData(activeSymbol);
    fetchPortfolio();
    fetchPortfolioAnalytics();
  }, [activeSymbol, fetchDashboardData, fetchPortfolio, fetchPortfolioAnalytics, user]);

  const handleTrade = useCallback(async (side, customExecPrice) => {
    try {
      const execPrice = customExecPrice || livePrice?.price || data?.current_price || 150.0;
      await api.post(`/api/trade`, { symbol: activeSymbol, side, quantity: parseInt(tradeAmount) || 1, price: execPrice });
      fetchPortfolio();
      fetchPortfolioAnalytics();
    } catch (err) {
      alert(err.response?.data?.detail || 'Trade failed');
    }
  }, [activeSymbol, livePrice, data, tradeAmount, fetchPortfolio, fetchPortfolioAnalytics]);

  const totalNAV = useMemo(() => {
    if (!portfolio?.positions) return Number(portfolio?.balance) || 0;
    return portfolio.positions.reduce((acc, pos) => {
      const qty = Number(pos.quantity) || 0;
      const currentP = (pos.symbol === activeSymbol && livePrice) 
        ? Number(livePrice.price) 
        : Number(pos.current_price || pos.avg_price || 0);
      return acc + (qty * currentP);
    }, 0) + (Number(portfolio.balance) || 0);
  }, [portfolio, activeSymbol, livePrice]);

  if (authLoading) {
    console.log("Auth is loading...");
    return null;
  }

  console.log("App Rendering. User:", user ? user.email : "Not logged in");

  if (isWaking) {
    return (
      <div className="fixed inset-0 z-[9999] bg-[#060810] flex flex-col items-center justify-center gap-6">
        <div className="relative">
          <div className="w-24 h-24 border-2 border-[#C9A84C]/20 rounded-full animate-[spin_3s_linear_infinite]" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 border-t-2 border-[#C9A84C] rounded-full animate-spin" />
          </div>
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold uppercase tracking-[0.2em] font-[Syne]">Quant<span className="text-[#C9A84C]">X</span></h2>
          <div className="flex items-center gap-2 text-[10px] font-mono text-gray-500 uppercase tracking-widest">
            <div className="w-1 h-1 rounded-full bg-[#C9A84C] animate-pulse" />
            Waking up institutional server...
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <ParticleBackground />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            <Route element={
              <ProtectedRoute>
                <AppLayout portfolio={portfolio} marketEngine={marketEngine} totalNAV={totalNAV} livePrice={livePrice} symbol={activeSymbol} />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="/dashboard" replace />} />
              
              <Route path="dashboard" element={
                <DashboardPage 
                  data={data} livePrice={livePrice} 
                  handleTrade={handleTrade} portfolio={portfolio} tradeSide={tradeSide} 
                  setTradeSide={setTradeSide} tradeAmount={tradeAmount} setTradeAmount={setTradeAmount} 
                  totalNAV={totalNAV} marketEngine={marketEngine} analytics={analytics} navigate={navigate}
                />
              } />
              
              <Route path="markets" element={<Markets setSymbol={setActiveSymbol} />} />
              <Route path="predict" element={<Predictions portfolio={portfolio} />} />
              
              <Route path="charts" element={
                <div className="p-8 h-full bg-[#060810]">
                   <div className="flex justify-between items-center mb-8">
                      <h2 className="text-2xl font-bold uppercase font-[Syne]">Institutional <span className="text-[#C9A84C]">Charts</span></h2>
                      <div className="px-4 py-2 bg-white/5 rounded-lg border border-white/5 font-mono text-sm text-[#C9A84C]">{activeSymbol}</div>
                   </div>
                   <div className="h-[calc(100vh-250px)] bg-[#141720] rounded-2xl border border-white/5 overflow-hidden">
                      <InstitutionalChart data={data?.history || []} livePrice={livePrice} symbol={activeSymbol} />
                   </div>
                </div>
              } />

              <Route path="backtest" element={<div className="p-8"><StrategySandbox symbol={activeSymbol} data={data} /></div>} />
              <Route path="ai" element={<div className="p-8 max-w-4xl mx-auto"><AIChat symbol={activeSymbol} /></div>} />
              
              <Route path="portfolio" element={<div className="p-8"><PortfolioView portfolio={portfolio} analytics={analytics} totalNAV={totalNAV} setSymbol={setActiveSymbol} /></div>} />
              <Route path="orders" element={<div className="p-8"><OrdersView liveOrders={portfolio?.history || []} /></div>} />
              <Route path="risk" element={<div className="p-8"><DeepLearningRisk symbol={activeSymbol} data={data} portfolio={portfolio} /></div>} />
              
              {/* 404 Fallback within Layout */}
              <Route path="*" element={<div className="p-8 text-center text-gray-500 font-mono">404 | NOT FOUND</div>} />
            </Route>

            {/* Global 404 Fallback */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>

        <style dangerouslySetInnerHTML={{ __html: `
          .no-scrollbar::-webkit-scrollbar { display: none; }
          .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        ` }} />
      </div>
    </>
  );
}
