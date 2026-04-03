import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  LineChart, 
  Search, 
  Bell, 
  Activity, 
  LayoutDashboard, 
  TrendingUp, 
  CreditCard, 
  User, 
  PieChart,
  Zap,
  Compass, 
  Briefcase, 
  BarChart4, 
  Settings, 
  HelpCircle, 
  ChevronRight, 
  Wallet
} from 'lucide-react';
import { motion } from 'framer-motion';
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceDot, LineChart as RechartsLineChart, Line as RechartsLine, PieChart as RechartsPieChart, Pie, Cell, AreaChart as RechartsAreaChart, Area as RechartsArea } from 'recharts';
import MarketWatch from './components/MarketWatch';
import ChartPanel from './components/ChartPanel';
import IndicatorsPanel from './components/IndicatorsPanel';
import SignalFusionAndInsights from './components/SignalFusionAndInsights';
import AIChat from './components/AIChat';
import MarketPulse from './components/MarketPulse';
import TopAssetsScreener from './components/TopAssetsScreener';
import Sidebar from './components/Sidebar';
import { Menu, Target, Layers } from 'lucide-react';

export default function App() {
  const [symbol, setSymbol] = useState('RELIANCE.NS');
  const [searchInput, setSearchInput] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [data, setData] = useState(null);
  const [backtest, setBacktest] = useState(null);
  const [marketEngine, setMarketEngine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [livePrice, setLivePrice] = useState(null);
  const [tradeFeed, setTradeFeed] = useState([]);
  const [activeTab, setActiveTab] = useState('Explore');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const fetchMarketEngine = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/market/engine`);
      const pipeStats = await axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/pipeline/stats`);
      setMarketEngine({ ...res.data, pipeline_stats: pipeStats.data });
    } catch (err) {
      console.error("Market Engine fetch error", err);
    }
  };

  useEffect(() => {
    const interval = setInterval(fetchMarketEngine, 60000); // 1 min sync for pipeline
    fetchMarketEngine();
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let ws;
    let tradeWs;
    if (symbol) {
      ws = new WebSocket(`${(import.meta.env.VITE_API_URL || "http://localhost:8000").replace("http", "ws")}/ws/ticker/${symbol}`);
      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        setLivePrice(msg);
      };

      tradeWs = new WebSocket(`${(import.meta.env.VITE_API_URL || "http://localhost:8000").replace("http", "ws")}/ws/trades/${symbol}`);
      tradeWs.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        setTradeFeed(prev => [msg, ...prev].slice(0, 5));
      };
    }
    return () => {
      ws?.close();
      tradeWs?.close();
    };
  }, [symbol]);

  const fetchDashboardData = async (sym) => {
    setLoading(true);
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/dashboard/${sym}`);
      setData(res.data);
      const btRes = await axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/backtest/${sym}`);
      setBacktest(btRes.data);
    } catch (err) {
      console.error("Dashboard backend error", err);
    }
    setLoading(false);
  };

  const [portfolio, setPortfolio] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [riskFreeRate, setRiskFreeRate] = useState(5.0);
  const [tradeAmount, setTradeAmount] = useState(1);
  const [tradeSide, setTradeSide] = useState('BUY');

  const fetchPortfolio = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/portfolio`);
      setPortfolio(res.data);
    } catch (err) {
      console.error("Portfolio error", err);
    }
  };

  const fetchPortfolioAnalytics = async (rfr = riskFreeRate) => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/portfolio/analytics?rfr=${rfr / 100}`);
      setAnalytics(res.data);
    } catch (err) {
      console.error("Analytics error", err);
    }
  };

  const handleTrade = async (side, customSymbol = null, customPrice = null) => {
    try {
      const execSymbol = customSymbol || symbol;
      const execPrice = customPrice || livePrice?.price || data?.current_price || 150.0;
      await axios.post(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/trade`, {
        symbol: execSymbol,
        side: side,
        quantity: parseInt(tradeAmount) || 1,
        price: execPrice
      });
      alert(`Successfully executed ${side} order for ${tradeAmount || 1} shares of ${execSymbol}`);
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

  const handleSearch = (e) => {
    e.preventDefault();
    if(searchInput.trim()) {
      setSymbol(searchInput.toUpperCase());
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-[#44475b] flex">
      
      {/* PERSISTENT CONTEXTUAL SIDEBAR */}
      <Sidebar 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        symbol={symbol}
        setSymbol={setSymbol}
        livePrice={livePrice}
        data={data}
        portfolio={portfolio}
        handleTrade={handleTrade}
      />

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto overflow-x-hidden">
        {/* NAV HEADER */}
        <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100 px-6 lg:px-10 py-5 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4 lg:gap-8">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="xl:hidden p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
            >
              <Menu size={24} />
            </button>
            <h2 className="text-sm lg:text-base font-black text-[#44475b] uppercase tracking-widest flex items-center gap-3">
               {activeTab === 'Explore' ? <Compass size={20} className="text-[#00d09c]"/> : activeTab === 'Investments' ? <Briefcase size={20} className="text-[#5367ff]"/> : activeTab === 'Pulse' ? <BarChart4 size={20} className="text-[#00d09c]"/> : activeTab === 'Signals' ? <Zap size={20} className="text-[#5367ff]"/> : <Activity size={20} className="text-[#ec4899]"/>}
               <span className="hidden sm:inline">{activeTab} View</span>
               <span className="sm:hidden">{activeTab}</span>
            </h2>
          </div>

          <div className="flex-1 max-w-[600px] mx-4 lg:mx-10 hidden md:block">
            <div className="relative group">
              <form onSubmit={handleSearch}>
                 <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#00d09c] transition-colors" size={20} />
                 <input 
                   type="text" 
                   placeholder="Search assets..."
                   value={searchInput}
                   onChange={(e) => {setSearchInput(e.target.value); setShowDropdown(true);}}
                   onFocus={() => setShowDropdown(true)}
                   onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                   className="w-full bg-[#f3f5f8] border-transparent rounded-[20px] pl-14 pr-6 py-3.5 focus:bg-white focus:ring-4 focus:ring-[#00d09c]/10 focus:border-[#00d09c]/20 transition-all text-xs font-bold outline-none border hover:border-gray-200"
                 />
              </form>
              {showDropdown && (
                <div className="absolute top-full mt-2 w-full bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden z-[100] max-h-[300px] overflow-y-auto">
                  {["RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "INFY.NS", "ICICIBANK.NS", "SBI.NS", "HINDUNILVR.NS", "BHARTIARTL.NS", "ADANIENT.NS", "ITC.NS", "WIPRO.NS", "ASIANPAINT.NS", "MARUTI.NS", "TATAMOTORS.NS", "SUNPHARMA.NS", "AAPL", "MSFT", "TSLA", "NVDA", "AMZN", "AXISBANK.NS", "KOTAKBANK.NS", "BAJFINANCE.NS", "LT.NS", "TITAN.NS", "ULTRACEMCO.NS", "TATASTEEL.NS", "POWERGRID.NS", "NTPC.NS", "BAJAJFINSV.NS", "M&M.NS", "LTIM.NS", "ADANIPORTS.NS", "ONGC.NS", "DRREDDY.NS", "HCLTECH.NS", "JSWSTEEL.NS", "GRASIM.NS", "CIPLA.NS", "SBILIFE.NS", "HDFCLIFE.NS", "BRITANNIA.NS", "TECHM.NS", "APOLLOHOSP.NS", "EICHERMOT.NS", "INDUSINDBK.NS", "DIVISLAB.NS", "BPCL.NS", "HEROMOTOCO.NS", "TATARETAIL.NS"]
                    .filter(s => !searchInput.trim() || s.toLowerCase().includes(searchInput.toLowerCase()))
                    .map((s) => (
                      <div 
                        key={s} 
                        className="px-4 py-3 hover:bg-gray-50 cursor-pointer text-sm font-bold text-[#44475b] flex items-center gap-3"
                        onClick={() => {
                           setSearchInput(s);
                           setSymbol(s);
                           setShowDropdown(false);
                        }}
                      >
                         <Search size={14} className="text-gray-400" /> {s}
                      </div>
                  ))}
                  {searchInput.trim().length > 0 && !["RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "INFY.NS", "ICICIBANK.NS", "SBI.NS", "HINDUNILVR.NS", "BHARTIARTL.NS", "ADANIENT.NS", "ITC.NS", "WIPRO.NS", "ASIANPAINT.NS", "MARUTI.NS", "TATAMOTORS.NS", "SUNPHARMA.NS", "AAPL", "MSFT", "TSLA", "NVDA", "AMZN", "AXISBANK.NS", "KOTAKBANK.NS", "BAJFINANCE.NS", "LT.NS", "TITAN.NS", "ULTRACEMCO.NS", "TATASTEEL.NS", "POWERGRID.NS", "NTPC.NS", "BAJAJFINSV.NS", "M&M.NS", "LTIM.NS", "ADANIPORTS.NS", "ONGC.NS", "DRREDDY.NS", "HCLTECH.NS", "JSWSTEEL.NS", "GRASIM.NS", "CIPLA.NS", "SBILIFE.NS", "HDFCLIFE.NS", "BRITANNIA.NS", "TECHM.NS", "APOLLOHOSP.NS", "EICHERMOT.NS", "INDUSINDBK.NS", "DIVISLAB.NS", "BPCL.NS", "HEROMOTOCO.NS", "TATARETAIL.NS"].some(s => s.toLowerCase() === searchInput.toLowerCase()) && (
                     <div 
                        className="px-4 py-3 hover:bg-gray-50 cursor-pointer text-sm font-bold text-[#44475b] flex items-center gap-3 border-t border-gray-50"
                        onClick={() => {
                           setSymbol(searchInput.toUpperCase());
                           setShowDropdown(false);
                        }}
                      >
                         <Search size={14} className="text-gray-400" /> Search externally for "{searchInput}"
                      </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 lg:gap-8">
            <button className="text-[#7c7e8c] hover:text-[#44475b] transition-colors relative">
              <Bell size={24} />
              <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-[#eb5b3c] rounded-full border-2 border-white"></span>
            </button>
            <div className="flex md:hidden items-center">
                <div className="w-10 h-10 rounded-2xl bg-[#5367ff] text-white flex items-center justify-center font-black text-sm shadow-lg shadow-indigo-500/20">
                  AG
                </div>
            </div>
            <div className="hidden md:flex items-center gap-4 border-l border-gray-100 pl-8">
               <div className="text-right hidden lg:block">
                  <p className="text-xs font-black text-[#44475b]">Adwaith G.</p>
                  <p className="text-[10px] font-bold text-[#00d09c] uppercase">Pro Tier</p>
               </div>
               <div className="w-10 h-10 rounded-2xl bg-[#5367ff] text-white flex items-center justify-center font-black text-sm shadow-lg shadow-indigo-500/20">
                 AG
               </div>
            </div>
          </div>
        </nav>

        <main className="flex-1 max-w-[1400px] w-full mx-auto px-10 py-10">
        
        {/* Indices Section */}
        <div className="flex gap-4 mb-8 overflow-x-auto pb-2 hide-scrollbar">
           {[ { name: 'NIFTY 50', val: '22,479.50', chg: '+0.85%' }, { name: 'SENSEX', val: '74,119.39', chg: '+0.78%' }, { name: 'BANK NIFTY', val: '47,835.80', chg: '-0.12%' }, { name: 'NIFTY NEXT 50', val: '60,123.45', chg: '+1.24%' }].map((idx, i) => (
             <div key={i} className="min-w-[180px] adwaith-card py-4 px-6 flex flex-col gap-1 cursor-pointer">
                <span className="text-[10px] font-bold text-[#7c7e8c] uppercase tracking-wider">{idx.name}</span>
                <div className="flex items-center justify-between">
                   <span className="text-sm font-bold text-[#44475b]">{idx.val}</span>
                   <span className={`text-[10px] font-black ${idx.chg.startsWith('+') ? 'text-[#00d09c]' : 'text-[#eb5b3c]'}`}>{idx.chg}</span>
                </div>
             </div>
           ))}
        </div>

        {loading ? (
          <div className="flex flex-col gap-4 items-center justify-center h-[60vh]">
            <div className="w-10 h-10 border-4 border-[#00d09c]/20 border-t-[#00d09c] rounded-full animate-spin"></div>
            <p className="text-sm font-bold text-[#7c7e8c] animate-pulse">Syncing with NSE/BSE Exchanges...</p>
          </div>
        ) : !data || data.error ? (
          <div className="flex flex-col gap-4 items-center justify-center h-[60vh]">
            <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center text-rose-500">
               <Zap size={24} />
            </div>
            <p className="text-sm font-black text-[#44475b] uppercase tracking-widest">{data?.error || "Connection Error"}</p>
            <p className="text-xs text-[#7c7e8c] font-bold">Please check the symbol (e.g. RELIANCE.NS) or try again later.</p>
            <button 
              onClick={() => setSymbol('RELIANCE.NS')}
              className="mt-4 px-6 py-2 bg-[#00d09c] text-white rounded-lg font-bold text-xs"
            >
              BACK TO DEFAULT
            </button>
          </div>
        ) : activeTab === 'Pulse' ? (
          <div className="animate-fade-in space-y-8">
            <MarketPulse state={marketEngine} />
            <TopAssetsScreener 
              onSelectSymbol={(sym) => {
                setSymbol(sym);
                setActiveTab('Explore');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }} 
              onQuickTrade={(sym, price) => handleTrade('BUY', sym, price)}
            />
          </div>
        ) : activeTab === 'Explore' ? (
          <div className="animate-fade-in space-y-8">
            <div className="grid lg:grid-cols-[1fr_400px] gap-8 mt-4">
              
              {/* Left Column: Asset View */}
              <div className="space-y-6">
                
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center font-black text-lg text-[#00d09c]">
                      {data.symbol[0]}
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold text-[#44475b] tracking-tight">{data.info?.full_name || data.symbol.split('.')[0]}</h2>
                      <p className="text-xs font-bold text-[#7c7e8c]">{data.symbol.includes('.NS') ? 'NSE' : 'BSE'} · {data.info?.sector} · SERIES EQ</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-[#44475b]">₹{livePrice?.price || data.current_price}</p>
                    <p className={`text-sm font-bold ${livePrice?.change >= 0 ? 'text-[#00d09c]' : 'text-[#eb5b3c]'}`}>
                      {livePrice?.change >= 0 ? '+' : ''}{livePrice?.change || '0.00'} ({livePrice?.change ? ((livePrice.change / 150) * 100).toFixed(2) : '0.00'}%)
                    </p>
                  </div>
                </div>

                <div className="adwaith-card !p-0 overflow-hidden border border-gray-100 shadow-sm min-h-[450px]">
                  <div className="p-6 border-b border-gray-100 flex gap-6">
                     <button className="text-[11px] font-black text-[#00d09c] border-b-2 border-[#00d09c] pb-2 uppercase tracking-wider">Technical Chart</button>
                     <button className="text-[11px] font-bold text-[#7c7e8c] hover:text-[#44475b] pb-2 uppercase tracking-wider">Market Depth</button>
                     <button className="text-[11px] font-bold text-[#7c7e8c] hover:text-[#44475b] pb-2 uppercase tracking-wider">Fundamentals</button>
                  </div>
                  <ChartPanel data={data.history} symbol={data.symbol} />
                </div>

                {/* Company Vitals Dashboard */}
                <div className="adwaith-card !p-8 border border-gray-100 shadow-sm">
                  <h3 className="text-[11px] font-black text-[#44475b] uppercase tracking-wider mb-6">Company Vitals (Real-time via Market Engine)</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                     {[
                       { label: 'Market Cap', val: `₹${(data.info?.market_cap / 1e12).toFixed(2)}T` },
                       { label: 'P/E Ratio', val: data.info?.pe_ratio?.toFixed(2) || 'N/A' },
                       { label: 'Div. Yield', val: `${(data.info?.dividend_yield * 100).toFixed(2)}%` },
                       { label: '52W High', val: `₹${data.info?.fifty_two_week_high?.toLocaleString()}` }
                     ].map((stat, i) => (
                       <div key={i}>
                          <p className="text-[9px] font-black text-[#7c7e8c] uppercase mb-1">{stat.label}</p>
                          <p className="text-sm font-black text-[#44475b]">{stat.val}</p>
                       </div>
                     ))}
                  </div>
                </div>

                <div className="adwaith-card bg-indigo-50/20 border-indigo-100/50 p-8">
                  <div className="flex items-center gap-3 mb-6">
                     <Activity size={20} className="text-[#5367ff]" />
                     <h3 className="text-[11px] font-black text-[#44475b] uppercase tracking-wider">Technical Guard Radar</h3>
                  </div>
                  <IndicatorsPanel indicators={data.indicators} patterns={data.patterns} />
                </div>

                <AIChat symbol={data.symbol} />
              </div>

              {/* Right Column: Execution & Portfolio */}
              <div className="space-y-6">
                
                {/* Buy/Sell Mock Section */}
                <div className="adwaith-card space-y-6 sticky top-24 border border-gray-100 shadow-md">
                  <div className="flex border-b border-gray-100 -mx-6 px-6 pb-4 mb-4">
                    <button 
                      className={`flex-1 text-sm font-black pb-2 transition-colors ${tradeSide === 'BUY' ? 'text-[#00d09c] border-b-2 border-[#00d09c]' : 'text-[#7c7e8c] hover:text-[#44475b]'}`}
                      onClick={() => setTradeSide('BUY')}
                    >BUY</button>
                    <button 
                      className={`flex-1 text-sm font-black pb-2 transition-colors ${tradeSide === 'SELL' ? 'text-[#eb5b3c] border-b-2 border-[#eb5b3c]' : 'text-[#7c7e8c] hover:text-[#44475b]'}`}
                      onClick={() => setTradeSide('SELL')}
                    >SELL</button>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center bg-[#f0f3f7] p-3.5 rounded-xl">
                      <span className="text-xs font-bold text-[#7c7e8c]">Shares</span>
                      <input 
                        type="number" 
                        value={tradeAmount}
                        onChange={(e) => setTradeAmount(e.target.value)}
                        className="bg-transparent border-none text-right outline-none font-black text-sm w-20 text-[#44475b]" 
                      />
                    </div>
                    <div className="flex justify-between items-center bg-[#f0f3f7] p-3.5 rounded-xl">
                      <span className="text-xs font-bold text-[#7c7e8c]">Price</span>
                      <span className="font-black text-sm text-[#44475b]">₹{livePrice?.price || data.current_price}</span>
                    </div>
                    
                    <div className="pt-4 space-y-2">
                      <div className="flex justify-between text-xs font-bold">
                         <span className="text-[#7c7e8c]">Total Amount</span>
                         <span className="text-[#44475b]">₹{((livePrice?.price || data.current_price) * tradeAmount).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-xs font-bold">
                         <span className="text-[#7c7e8c]">Available Limit</span>
                         <span className="text-[#5367ff]">₹{portfolio?.balance?.toLocaleString() || "0"}</span>
                      </div>
                    </div>

                    <button 
                      onClick={() => handleTrade(tradeSide)}
                      className={`w-full text-white py-4 rounded-xl shadow-xl font-black text-sm tracking-wider uppercase transition-all ${tradeSide === 'BUY' ? 'bg-[#00d09c] hover:bg-[#00b085] shadow-emerald-500/10' : 'bg-[#eb5b3c] hover:bg-[#d64528] shadow-rose-500/10'}`}
                    >
                      {tradeSide} {data.symbol.split('.')[0]}
                    </button>
                  </div>
                </div>

                <MarketWatch onSelectSymbol={setSymbol} currentSymbol={symbol} />

                <div className="adwaith-card border border-gray-100 shadow-sm">
                   <h3 className="text-sm font-black text-[#44475b] flex items-center gap-2 mb-6 uppercase tracking-wider">
                     <PieChart size={18} className="text-[#5367ff]" /> Strategy Edge
                   </h3>
                   {backtest ? (
                     <div className="space-y-4">
                        <div className="flex justify-between items-end">
                           <div>
                              <p className="text-[10px] font-bold text-[#7c7e8c] uppercase tracking-widest mb-1">Projected Return</p>
                              <span className={`text-3xl font-black ${backtest.total_return_pct >= 0 ? 'text-[#00d09c]' : 'text-[#eb5b3c]'}`}>
                                {backtest.total_return_pct >= 0 ? '+' : ''}{backtest.total_return_pct}%
                              </span>
                           </div>
                           <div className="text-right">
                              <p className="text-[10px] font-bold text-[#7c7e8c] uppercase tracking-widest mb-1">Win Probability</p>
                              <span className="text-sm font-black text-[#44475b] bg-[#f0f3f7] px-2 py-1 rounded">{backtest.win_rate}</span>
                           </div>
                        </div>
                        {backtest.equity_curve && (
                           <div className="w-full h-[180px] mt-4 border border-gray-100 rounded-xl overflow-hidden p-2">
                             <ResponsiveContainer width="100%" height="100%">
                                <RechartsAreaChart data={backtest.equity_curve} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                                  <defs>
                                    <linearGradient id="colorEq" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#5367ff" stopOpacity={0.2}/>
                                      <stop offset="95%" stopColor="#5367ff" stopOpacity={0}/>
                                    </linearGradient>
                                  </defs>
                                  <XAxis dataKey="date" hide={true} />
                                  <YAxis domain={['dataMin - 1000', 'dataMax + 1000']} hide={true} />
                                  <RechartsTooltip cursor={{ stroke: '#e2e4e7', strokeWidth: 1 }} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '11px', fontWeight: '900', color: '#44475b'}} formatter={(val) => `₹${val}`} labelFormatter={(label) => `Date: ${label}`} />
                                  <RechartsArea type="monotone" dataKey="value" stroke="#5367ff" strokeWidth={2} fillOpacity={1} fill="url(#colorEq)" activeDot={{ r: 4, strokeWidth: 0, fill: '#5367ff' }} />
                                </RechartsAreaChart>
                             </ResponsiveContainer>
                           </div>
                        )}
                     </div>
                   ) : (
                     <div className="animate-pulse h-24 bg-gray-50 rounded-xl"></div>
                   )}
                </div>

                {/* Execution Stream */}
                <div className="adwaith-card border border-gray-100 shadow-sm">
                   <h3 className="text-sm font-black text-[#44475b] flex items-center gap-2 mb-6 uppercase tracking-wider">
                     <Activity size={18} className="text-[#00d09c]" /> Live Trade Executions
                   </h3>
                   <div className="space-y-3">
                      {tradeFeed.length > 0 ? tradeFeed.map((trade, i) => (
                         <div key={i} className="flex justify-between items-center border-b border-gray-50 pb-3 last:border-0 hover:bg-gray-50 p-2 rounded-lg transition-all">
                            <div className="flex items-center gap-3">
                               <div className={`w-2 h-2 rounded-full ${trade.side === 'BUY' ? 'bg-[#00d09c]' : 'bg-[#eb5b3c]'}`}></div>
                               <span className="text-xs font-bold text-[#44475b]">{trade.side} {trade.volume}</span>
                            </div>
                            <span className="text-xs font-black text-[#7c7e8c]">₹{trade.price}</span>
                         </div>
                      )) : (
                        <p className="text-[10px] text-[#7c7e8c] font-bold italic text-center py-4">Scanning ticker stream...</p>
                      )}
                   </div>
                </div>

              </div>
            </div>
          </div>
        ) : activeTab === 'Signals' ? (
           <div className="animate-fade-in space-y-8">
              <SignalFusionAndInsights 
                fusion={data.fusion_signal} 
                news={data.news_sentiment} 
                predictions={data.predictions} 
                risk={data.risk || { score: 45, rating: "Medium", risk_factors: [] }}
                externalData={data.external_data}
              />
              <div className="adwaith-card border border-indigo-100 bg-indigo-50/10">
                 <h3 className="text-sm font-black text-[#44475b] mb-4 uppercase">AI Signal Strategy Explanation</h3>
                 <p className="text-xs text-[#7c7e8c] leading-relaxed">
                   The Signal Fusion engine combines real-time technical indicators, social sentiment from X/Telegram, and deep learning prediction models to provide a unified trading recommendation. It currently monitors {data.symbol} with a confidence score of {data.predictions?.confidence || '0.00'}%.
                 </p>
              </div>
           </div>
        ) : activeTab === 'Investments' ? (
          /* Investments Tab View - Linked to Real Backend Portfolio */
          <div className="animate-fade-in space-y-8">
             <div className="grid md:grid-cols-3 gap-6">
                {[ 
                  { label: 'Cash Balance', val: `₹${portfolio?.balance?.toLocaleString() || "0"}` }, 
                  { label: 'Total Equity', val: `₹${portfolio?.total_equity?.toLocaleString() || "0"}`, color: 'text-[#5367ff]' }, 
                  { label: 'Total P&L', val: `₹${portfolio?.total_pnl?.toLocaleString() || "0"}`, color: portfolio?.total_pnl >= 0 ? 'text-[#00d09c]' : 'text-[#eb5b3c]' }
                ].map((stat, i) => (
                  <div key={i} className="adwaith-card !p-8 border border-gray-100 shadow-sm">
                     <p className="text-[10px] font-black text-[#7c7e8c] uppercase tracking-widest mb-2">{stat.label}</p>
                     <p className={`text-3xl font-black ${stat.color || 'text-[#44475b]'}`}>{stat.val}</p>
                  </div>
                ))}
             </div>
             
             <div className="adwaith-card border border-gray-100 shadow-md">
                <h3 className="text-lg font-black text-[#44475b] mb-8 uppercase tracking-wider px-2 flex items-center gap-3">
                  <PieChart size={20} className="text-[#00d09c]" /> Portfolio Analytics
                </h3>
                {analytics && analytics.weights ? (
                  <div className="grid md:grid-cols-3 gap-8 px-2">
                     <div className="space-y-2">
                        <p className="text-[10px] font-black text-[#7c7e8c] uppercase tracking-widest">Expected Return (Ann.)</p>
                        <p className={`text-4xl font-black tracking-tight ${analytics.expected_return.startsWith('-') ? 'text-[#eb5b3c]' : 'text-[#00d09c]'}`}>
                          {analytics.expected_return}
                        </p>
                        <p className="text-[10px] font-bold text-[#7c7e8c] pt-2">Based on daily historical changes</p>
                     </div>
                     <div className="space-y-2">
                        <p className="text-[10px] font-black text-[#7c7e8c] uppercase tracking-widest">Portfolio Risk (Std Dev)</p>
                        <p className="text-4xl font-black text-[#44475b] tracking-tight">{analytics.portfolio_risk}</p>
                        <p className="text-[10px] font-bold text-[#7c7e8c] pt-2">Via Covariance Matrix</p>
                     </div>
                     <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <p className="text-[10px] font-black text-[#7c7e8c] uppercase tracking-widest">Sharpe Ratio</p>
                            <div className="flex items-center gap-1">
                               <p className="text-[8px] font-bold text-[#7c7e8c] uppercase">RFR:</p>
                               <input type="number" 
                                      className="w-12 text-[9px] font-black text-[#44475b] bg-gray-100 rounded px-1.5 py-0.5 outline-none custom-number-input" 
                                      value={riskFreeRate} 
                                      onChange={(e) => setRiskFreeRate(Number(e.target.value))} 
                                      onBlur={(e) => fetchPortfolioAnalytics(Number(e.target.value))}
                               />
                               <span className="text-[9px] font-black text-[#44475b]">%</span>
                            </div>
                        </div>
                        <p className="text-4xl font-black text-[#5367ff] tracking-tight">{analytics.sharpe_ratio}</p>
                        <p className={`text-[10px] font-bold pt-2 ${analytics.efficiency.includes('Risky') ? 'text-[#eb5b3c]' : 'text-[#00d09c]'}`}>{analytics.efficiency}</p>
                     </div>
                  </div>
                ) : (
                  <div className="flex animate-pulse space-x-4 px-2">
                    <div className="flex-1 h-20 bg-gray-50 rounded-xl"></div>
                    <div className="flex-1 h-20 bg-gray-50 rounded-xl"></div>
                    <div className="flex-1 h-20 bg-gray-50 rounded-xl"></div>
                  </div>
                )}
             </div>

             {/* OPTIMIZATION SECTION */}
             <div className="adwaith-card border border-gray-100 shadow-md">
                <h3 className="text-lg font-black text-[#44475b] mb-8 uppercase tracking-wider px-2 flex items-center gap-3">
                  <Zap size={20} className="text-[#5367ff]" /> Portfolio Optimization Engine
                </h3>
                {analytics && analytics.optimization && (Object.keys(analytics.optimization.max_sharpe).length > 0 || Object.keys(analytics.optimization.min_risk).length > 0) ? (
                   <div className="space-y-8 px-2">
                      <div className="grid md:grid-cols-2 gap-8">
                         <div className="border border-gray-100 rounded-xl p-6 bg-emerald-50/30">
                            <h4 className="text-[12px] font-black text-[#00d09c] uppercase tracking-widest mb-2">Max Sharpe Allocation</h4>
                            <p className="text-xs font-bold text-[#7c7e8c] mb-6">Mean-Variance Optimization for highest risk-adjusted expected return.</p>
                            <div className="space-y-4">
                               {Object.entries(analytics.optimization.max_sharpe).map(([sym, weight]) => (
                                  <div key={sym} className="flex justify-between items-center text-sm font-black text-[#44475b] border-b border-gray-100 pb-2 last:border-0">
                                     <span>{sym}</span>
                                     <span className="text-[#00d09c]">{weight}</span>
                                  </div>
                               ))}
                            </div>
                         </div>
                         <div className="border border-gray-100 rounded-xl p-6 bg-indigo-50/30">
                            <h4 className="text-[12px] font-black text-[#5367ff] uppercase tracking-widest mb-2">Minimum Risk Allocation</h4>
                            <p className="text-xs font-bold text-[#7c7e8c] mb-6">Mean-Variance Optimization focused purely on lowering portfolio variance.</p>
                            <div className="space-y-4">
                               {Object.entries(analytics.optimization.min_risk).map(([sym, weight]) => (
                                  <div key={sym} className="flex justify-between items-center text-sm font-black text-[#44475b] border-b border-gray-100 pb-2 last:border-0">
                                     <span>{sym}</span>
                                     <span className="text-[#5367ff]">{weight}</span>
                                  </div>
                               ))}
                            </div>
                         </div>
                      </div>
                      
                      {analytics.efficient_frontier && analytics.efficient_frontier.length > 0 && (
                         <div className="border border-gray-100 rounded-xl p-6 bg-white overflow-hidden shadow-sm">
                            <h4 className="text-[12px] font-black text-[#44475b] uppercase tracking-widest mb-2">Efficient Frontier Mapping</h4>
                            <p className="text-xs font-bold text-[#7c7e8c] mb-6">Visualizing simulated portfolios. X-axis: Risk (Std Dev %), Y-axis: Return (Ann %)</p>
                            <div className="h-[300px] w-full">
                               <ResponsiveContainer width="100%" height="100%">
                                  <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                                     <XAxis type="number" dataKey="risk" name="Risk" unit="%" tick={{fontSize: 10, fill: '#7c7e8c', fontWeight: 900}} stroke="#f0f3f7" tickLine={false} domain={['auto', 'auto']} />
                                     <YAxis type="number" dataKey="return" name="Return" unit="%" tick={{fontSize: 10, fill: '#7c7e8c', fontWeight: 900}} stroke="#f0f3f7" tickLine={false} domain={['auto', 'auto']} />
                                     <RechartsTooltip cursor={{strokeDasharray: '3 3'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', fontSize: '12px', fontWeight: '900', color: '#44475b'}} />
                                     <Scatter name="Portfolios" data={analytics.efficient_frontier} fill="#5367ff" opacity={0.3} line={false} />
                                     
                                     {analytics.optimization.max_sharpe_stats && (
                                        <ReferenceDot x={analytics.optimization.max_sharpe_stats.risk} y={analytics.optimization.max_sharpe_stats.return} r={6} fill="#00d09c" stroke="white" strokeWidth={2} />
                                     )}
                                     {analytics.optimization.min_risk_stats && (
                                        <ReferenceDot x={analytics.optimization.min_risk_stats.risk} y={analytics.optimization.min_risk_stats.return} r={6} fill="#eb5b3c" stroke="white" strokeWidth={2} />
                                     )}
                                  </ScatterChart>
                               </ResponsiveContainer>
                            </div>
                            <div className="flex justify-center gap-6 mt-4">
                               <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full bg-[#00d09c]"></div>
                                  <span className="text-[10px] uppercase font-black text-[#7c7e8c]">Max Sharpe Portfolio</span>
                               </div>
                               <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full bg-[#eb5b3c]"></div>
                                  <span className="text-[10px] uppercase font-black text-[#7c7e8c]">Min Risk Portfolio</span>
                               </div>
                            </div>
                         </div>
                      )}
                   </div>
                ) : (
                   <div className="px-2 text-[#7c7e8c] text-sm font-bold italic py-4 bg-gray-50 rounded-xl text-center">Buy at least two distinct assets to ignite the Mean-Variance Optimization Engine.</div>
                )}
             </div>

             {/* MONTE CARLO SIMULATION SECTION */}
             <div className="adwaith-card border border-gray-100 shadow-md">
                <h3 className="text-lg font-black text-[#44475b] mb-8 uppercase tracking-wider px-2 flex items-center gap-3">
                  <Activity size={20} className="text-[#ec4899]" /> Monte Carlo Simulation
                </h3>
                {analytics && analytics.monte_carlo && analytics.monte_carlo.length > 0 ? (
                   <div className="space-y-4 px-2">
                       <p className="text-xs font-bold text-[#7c7e8c] mb-6">50 Simulated Portfolio Value Trajectories (1-Year Outlook)</p>
                       <div className="w-full h-[350px] bg-white border border-gray-100 rounded-xl p-4 overflow-hidden shadow-sm">
                          <ResponsiveContainer width="100%" height="100%">
                             <RechartsLineChart margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                                <XAxis dataKey="day" type="category" name="Day" stroke="#e2e4e7" tick={{fontSize: 10, fill: '#7c7e8c', fontWeight: 900}} tickLine={false} allowDuplicatedCategory={false} />
                                <YAxis type="number" name="Value" domain={['auto', 'auto']} stroke="#e2e4e7" tick={{fontSize: 10, fill: '#7c7e8c', fontWeight: 900}} tickLine={false} tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`} />
                                <RechartsTooltip cursor={{ stroke: '#e2e4e7', strokeWidth: 1 }} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '11px', fontWeight: '900', color: '#44475b'}} formatter={(val) => `₹${val}`} labelFormatter={(label) => `Day ${label}`} />
                                {analytics.monte_carlo.map((sim, i) => {
                                   const lineData = sim.map((val, idx) => ({ day: idx.toString(), value: val }));
                                   return (
                                     <RechartsLine 
                                        key={i} 
                                        data={lineData} 
                                        type="monotone" 
                                        dataKey="value" 
                                        stroke={i % 5 === 0 ? "#00d09c" : i % 5 === 1 ? "#5367ff" : "#ec4899"} 
                                        strokeWidth={1} 
                                        dot={false} 
                                        activeDot={false} 
                                        opacity={0.3} 
                                        isAnimationActive={true}
                                        animationDuration={1500 + i * 50} 
                                     />
                                   );
                                })}
                             </RechartsLineChart>
                          </ResponsiveContainer>
                       </div>
                   </div>
                ) : (
                   <div className="px-2 text-[#7c7e8c] text-sm font-bold italic py-4 bg-gray-50 rounded-xl text-center">Fund your portfolio to run robust 1-Year Monte Carlo Projections.</div>
                )}
             </div>

             <div className="grid lg:grid-cols-2 gap-8">
                 {/* ASSET RISK VS RETURN */}
                 <div className="adwaith-card border border-gray-100 shadow-md">
                    <h3 className="text-lg font-black text-[#44475b] mb-4 uppercase tracking-wider px-2 flex items-center gap-3">
                      <Target size={20} className="text-[#00d09c]" /> Asset Risk vs Return
                    </h3>
                    {analytics && analytics.assets_risk_return && analytics.assets_risk_return.length > 0 ? (
                       <div className="w-full h-[300px]">
                          <ResponsiveContainer width="100%" height="100%">
                             <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                                <XAxis type="number" dataKey="risk" name="Risk" unit="%" tick={{fontSize: 10, fill: '#7c7e8c', fontWeight: 900}} stroke="#f0f3f7" tickLine={false} domain={['auto', 'auto']} />
                                <YAxis type="number" dataKey="return" name="Return" unit="%" tick={{fontSize: 10, fill: '#7c7e8c', fontWeight: 900}} stroke="#f0f3f7" tickLine={false} domain={['auto', 'auto']} />
                                <RechartsTooltip cursor={{strokeDasharray: '3 3'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', fontSize: '12px', fontWeight: '900', color: '#44475b'}} formatter={(val, name, props) => [`${val}%`, name]} />
                                <Scatter name="Assets" data={analytics.assets_risk_return} fill="#5367ff">
                                  {analytics.assets_risk_return.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={['#00d09c', '#5367ff', '#eb5b3c', '#f59e0b', '#8b5cf6'][index % 5]} />
                                  ))}
                                </Scatter>
                             </ScatterChart>
                          </ResponsiveContainer>
                       </div>
                    ) : (
                       <div className="px-2 text-[#7c7e8c] text-sm font-bold italic py-4 bg-gray-50 rounded-xl text-center">Not enough data to map asset matrix.</div>
                    )}
                 </div>

                 {/* CORRELATION HEATMAP */}
                 <div className="adwaith-card border border-gray-100 shadow-md flex flex-col">
                    <h3 className="text-lg font-black text-[#44475b] mb-4 uppercase tracking-wider px-2 flex items-center gap-3">
                      <Layers size={20} className="text-[#f59e0b]" /> Correlation Heatmap
                    </h3>
                    {analytics && analytics.correlation && Object.keys(analytics.correlation).length > 0 ? (
                       <div className="flex-1 overflow-auto rounded-xl border border-gray-100 p-2">
                           <div className="grid gap-1" style={{ gridTemplateColumns: `auto repeat(${Object.keys(analytics.correlation).length}, minmax(40px, 1fr))` }}>
                               <div className="font-bold text-[9px] text-[#7c7e8c]"></div>
                               {Object.keys(analytics.correlation).map(k => <div key={`h-`+k} className="text-center font-black text-[9px] truncate px-1 text-[#44475b]">{k.split('.')[0]}</div>)}
                               
                               {Object.entries(analytics.correlation).map(([rowKey, rowData]) => (
                                  <React.Fragment key={`r-`+rowKey}>
                                     <div className="flex items-center text-[9px] font-black text-[#44475b] pr-2 truncate">{rowKey.split('.')[0]}</div>
                                     {Object.keys(analytics.correlation).map(colKey => {
                                         const val = rowData[colKey];
                                         const bgIntensity = Math.floor(Math.abs(val) * 100);
                                         const bgColor = val >= 0 ? `rgba(0, 208, 156, ${val})` : `rgba(235, 91, 60, ${Math.abs(val)})`;
                                         const isDark = Math.abs(val) > 0.6;
                                         return (
                                            <div key={`c-${rowKey}-${colKey}`} className="flex items-center justify-center rounded-md h-8 text-[9px] font-black" style={{ backgroundColor: bgColor, color: isDark ? 'white' : '#44475b' }}>
                                              {val}
                                            </div>
                                         );
                                     })}
                                  </React.Fragment>
                               ))}
                            </div>
                        </div>
                     ) : (
                       <div className="px-2 text-[#7c7e8c] text-sm font-bold italic py-4 bg-gray-50 rounded-xl text-center">Not enough data to generate correlation heatmap.</div>
                    )}
                 </div>
             </div>

             <div className="adwaith-card border border-gray-100 shadow-md">
                <h3 className="text-lg font-black text-[#44475b] mb-8 uppercase tracking-wider px-2 flex items-center gap-3">
                  <LayoutDashboard size={20} className="text-[#00d09c]" /> Your Holdings ({portfolio?.positions?.length || 0})
                </h3>
                        
                {portfolio?.positions?.length > 0 && (
                  <div className="w-full h-[220px] mb-8">
                     <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                          <Pie data={portfolio.positions} dataKey="quantity" nameKey="symbol" cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5}>
                             {portfolio.positions.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={['#00d09c', '#5367ff', '#eb5b3c', '#f59e0b', '#8b5cf6'][index % 5]} />
                             ))}
                          </Pie>
                          <RechartsTooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '11px', fontWeight: '900', color: '#44475b'}} formatter={(val, name) => [`${val} Shares`, name]} />
                        </RechartsPieChart>
                     </ResponsiveContainer>
                  </div>
                )}
                <div className="overflow-x-auto">
                   <table className="w-full text-left">
                      <thead>
                         <tr className="border-b border-gray-100 text-[10px] font-black text-[#7c7e8c] uppercase tracking-widest">
                            <th className="pb-4 px-4">Stock Asset</th>
                            <th className="pb-4">Qty</th>
                            <th className="pb-4">Avg. Price</th>
                            <th className="pb-4">Market Price</th>
                            <th className="pb-4 text-right pr-4">Unrealized P&L</th>
                         </tr>
                      </thead>
                      <tbody className="text-sm font-bold text-[#44475b]">
                         {portfolio?.positions?.map((stock, i) => (
                           <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => {setSymbol(stock.symbol); setActiveTab('Explore');}}>
                              <td className="py-5 px-4 font-black">
                                <div className="flex flex-col">
                                  <span>{stock.symbol}</span>
                                  <span className="text-[9px] text-[#7c7e8c] font-bold uppercase">Equity</span>
                                </div>
                              </td>
                              <td className="py-5">{stock.quantity}</td>
                              <td className="py-5">₹{stock.avg_price.toLocaleString()}</td>
                              <td className="py-5">₹{stock.current_price.toLocaleString()}</td>
                              <td className={`py-5 text-right pr-4 font-black ${stock.pnl >= 0 ? 'text-[#00d09c]' : 'text-[#eb5b3c]'}`}>
                                ₹{stock.pnl.toLocaleString()} ({stock.pnl_pct}%)
                              </td>
                           </tr>
                         ))}
                         {(!portfolio?.positions || portfolio.positions.length === 0) && (
                           <tr>
                             <td colSpan="5" className="py-20 text-center text-[#7c7e8c] italic font-medium">Your portfolio is empty. Start trading to see your holdings!</td>
                           </tr>
                         )}
                      </tbody>
                   </table>
                </div>
             </div>
          </div>
        ) : activeTab === 'History' ? (
             <div className="animate-fade-in space-y-8">
              {/* TRADE HISTORY SECTION */}
              <div className="adwaith-card border border-gray-100 shadow-md">
                 <h3 className="text-lg font-black text-[#44475b] mb-8 uppercase tracking-wider px-2 flex items-center gap-3">
                   <Activity size={20} className="text-[#ec4899]" /> Trade Execution History
                 </h3>
                 <div className="overflow-x-auto">
                    <table className="w-full text-left">
                       <thead>
                          <tr className="border-b border-gray-100 text-[10px] font-black text-[#7c7e8c] uppercase tracking-widest">
                             <th className="pb-4 px-4">Action</th>
                             <th className="pb-4">Asset Name</th>
                             <th className="pb-4">Quantity</th>
                             <th className="pb-4">Execute Price</th>
                             <th className="pb-4 text-right pr-4">Total Value</th>
                          </tr>
                       </thead>
                       <tbody className="text-sm font-bold text-[#44475b]">
                          {portfolio?.history?.slice().reverse().map((trade, i) => (
                            <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                               <td className="py-5 px-4">
                                 <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${trade.type === 'BUY' ? 'bg-[#00d09c]/10 text-[#00d09c]' : 'bg-[#eb5b3c]/10 text-[#eb5b3c]'}`}>
                                    {trade.type}
                                 </span>
                               </td>
                               <td className="py-5">
                                 <div className="flex flex-col">
                                   <span className="font-black text-[#44475b]">{trade.symbol}</span>
                                   <span className="text-[9px] text-[#7c7e8c] font-bold uppercase">{new Date(trade.timestamp).toLocaleString()}</span>
                                 </div>
                               </td>
                               <td className="py-5">{trade.quantity}</td>
                               <td className="py-5">₹{trade.price.toLocaleString()}</td>
                               <td className="py-5 text-right pr-4 font-black">
                                 ₹{trade.total.toLocaleString()}
                               </td>
                            </tr>
                          ))}
                          {(!portfolio?.history || portfolio.history.length === 0) && (
                            <tr>
                              <td colSpan="5" className="py-12 text-center text-[#7c7e8c] italic font-medium">No previous trades recorded.</td>
                            </tr>
                          )}
                       </tbody>
                    </table>
                 </div>
              </div>
             </div>
        ) : null}
      </main>

      <footer className="bg-white border-t border-gray-100 py-16 px-6 mt-20">
         <div className="max-w-[1400px] mx-auto grid md:grid-cols-4 gap-12">
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                 <div className="w-8 h-8 bg-[#00d09c] rounded-lg flex items-center justify-center text-white text-xs font-black">G</div>
                 <span className="text-lg font-bold text-[#44475b]">Adwaith's QuantX AI</span>
              </div>
              <p className="text-xs text-[#7c7e8c] font-medium leading-[1.8]">
                India's most advanced AI-integrated trading terminal. Built for the modern Indian investor who demands precision and speed.
              </p>
            </div>
            {[ { title: 'Products', items: ['Stocks', 'Mutual Funds', 'US Stocks', 'Gold', 'Fixed Deposits'] }, { title: 'Adwaith\'s', items: ['About Us', 'Contact Us', 'Careers', 'Media Kit'] }, { title: 'Quick Links', items: ['AMC Mutual Funds', 'Calculators', 'Glossary', 'Sitemap'] }].map(col => (
               <div key={col.title} className="space-y-6">
                  <h4 className="text-[11px] font-black text-[#44475b] uppercase tracking-widest">{col.title}</h4>
                  <div className="flex flex-col gap-3">
                     {col.items.map(item => (
                        <span key={item} className="text-xs text-[#7c7e8c] font-medium hover:text-[#00d09c] cursor-pointer transition-colors">{item}</span>
                     ))}
                  </div>
               </div>
             ))}
           </div>
          </footer>
        </div>
      </div>
    );
  }
