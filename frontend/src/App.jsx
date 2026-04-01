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
  Zap
} from 'lucide-react';
import { motion } from 'framer-motion';
import MarketWatch from './components/MarketWatch';
import ChartPanel from './components/ChartPanel';
import IndicatorsPanel from './components/IndicatorsPanel';
import SignalFusionAndInsights from './components/SignalFusionAndInsights';
import AIChat from './components/AIChat';
import MarketPulse from './components/MarketPulse';
import TopAssetsScreener from './components/TopAssetsScreener';

export default function App() {
  const [symbol, setSymbol] = useState('RELIANCE.NS');
  const [searchInput, setSearchInput] = useState('');
  const [data, setData] = useState(null);
  const [backtest, setBacktest] = useState(null);
  const [marketEngine, setMarketEngine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [livePrice, setLivePrice] = useState(null);
  const [tradeFeed, setTradeFeed] = useState([]);
  const [activeTab, setActiveTab] = useState('Explore');

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
    <div className="min-h-screen bg-[#f8f9fa] text-[#44475b]">
      
      {/* Adwaith's-style Navbar */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-12">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.location.reload()}>
             <div className="w-8 h-8 bg-[#00d09c] rounded-lg flex items-center justify-center text-white font-black">G</div>
             <h1 className="text-xl font-bold tracking-tight text-[#44475b]">Adwaith's <span className="text-[#00d09c] text-xs font-black ml-1 uppercase bg-emerald-50 px-1 rounded">QuantX AI</span></h1>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {['Explore', 'Investments'].map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`text-sm font-bold transition-all border-b-2 py-4 -mb-4 ${activeTab === tab ? 'border-[#00d09c] text-[#00d09c]' : 'border-transparent text-[#7c7e8c] hover:text-[#44475b]'}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 max-w-xl mx-12 hidden lg:block">
          <form onSubmit={handleSearch} className="relative">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
             <input 
               type="text" 
               placeholder="What are you looking for today?"
               value={searchInput}
               onChange={(e) => setSearchInput(e.target.value)}
               className="w-full bg-[#f0f3f7] border-none rounded-lg pl-12 pr-4 py-2.5 focus:ring-2 focus:ring-[#00d09c]/20 transition-all text-sm font-medium outline-none"
             />
          </form>
        </div>

        <div className="flex items-center gap-6">
          <button className="text-[#7c7e8c] hover:text-[#44475b] relative">
            <Bell size={22} />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#eb5b3c] rounded-full border-2 border-white"></span>
          </button>
          <button className="text-[#7c7e8c] hover:text-[#44475b]">
            <CreditCard size={22} />
          </button>
          <div className="w-8 h-8 rounded-full bg-[#5367ff]/10 text-[#5367ff] flex items-center justify-center font-bold text-xs border border-[#5367ff]/20">
            AQ
          </div>
        </div>
      </nav>

      <div className="max-w-[1400px] mx-auto px-6 py-8">
        
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
        ) : activeTab === 'Explore' ? (
          <div className="animate-fade-in space-y-8">
            
            {/* Market Pulse Header */}
            <MarketPulse state={marketEngine} />

            {/* AI Screener Dashboard Section */}
            <TopAssetsScreener 
              onSelectSymbol={(sym) => {
                setSymbol(sym);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }} 
              onQuickTrade={(sym, price) => handleTrade('BUY', sym, price)}
            />

            <div className="grid lg:grid-cols-[1fr_400px] gap-8 mt-8">
              
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

                {/* Advanced AI Insights Section */}
                <div className="space-y-6">
                    <SignalFusionAndInsights 
                      fusion={data.fusion_signal} 
                      news={data.news_sentiment} 
                      predictions={data.predictions} 
                      risk={data.risk || { score: 45, rating: "Medium", risk_factors: [] }}
                      externalData={data.external_data}
                    />

                    <div className="adwaith-card bg-indigo-50/20 border-indigo-100/50 p-8">
                      <div className="flex items-center gap-3 mb-6">
                         <Activity size={20} className="text-[#5367ff]" />
                         <h3 className="text-[11px] font-black text-[#44475b] uppercase tracking-wider">Technical Guard Radar</h3>
                      </div>
                      <IndicatorsPanel indicators={data.indicators} patterns={data.patterns} />
                    </div>
                </div>

                <AIChat symbol={data.symbol} />
              </div>

              {/* Right Column: Execution & Portfolio */}
              <div className="space-y-6">
                
                {/* Buy/Sell Mock Section */}
                <div className="adwaith-card space-y-6 sticky top-24 border border-gray-100 shadow-md">
                  <div className="flex border-b border-gray-100 -mx-6 px-6 pb-4 mb-4">
                    <button className="flex-1 text-sm font-black text-[#00d09c] border-b-2 border-[#00d09c] pb-2">BUY</button>
                    <button className="flex-1 text-sm font-black text-[#7c7e8c] pb-2">SELL</button>
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
                      onClick={() => handleTrade('BUY')}
                      className="w-full bg-[#00d09c] hover:bg-[#00b085] text-white py-4 rounded-xl shadow-xl shadow-emerald-500/10 font-black text-sm tracking-wider uppercase transition-all"
                    >
                      BUY {data.symbol.split('.')[0]}
                    </button>
                  </div>
                </div>

                <MarketWatch onSelectSymbol={setSymbol} currentSymbol={symbol} />

                <div className="adwaith-card border border-gray-100 shadow-sm">
                   <h3 className="text-sm font-black text-[#44475b] flex items-center gap-2 mb-6 uppercase tracking-wider">
                     <PieChart size={18} className="text-[#5367ff]" /> Strategy Edge
                   </h3>
                   {backtest ? (
                     <div className="space-y-6">
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
        ) : (
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

             <div className="adwaith-card border border-gray-100 shadow-md">
                <h3 className="text-lg font-black text-[#44475b] mb-8 uppercase tracking-wider px-2 flex items-center gap-3">
                  <LayoutDashboard size={20} className="text-[#00d09c]" /> Your Holdings ({portfolio?.positions?.length || 0})
                </h3>
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
                           <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => setSymbol(stock.symbol)}>
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

             {/* TRADE HISTORY SECTION */}
             <div className="adwaith-card border border-gray-100 shadow-md">
                <h3 className="text-lg font-black text-[#44475b] mb-8 uppercase tracking-wider px-2 flex items-center gap-3">
                  <Activity size={20} className="text-[#5367ff]" /> Trade History
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
                                  <span className="text-[9px] text-[#7c7e8c] font-bold uppercase">{trade.timestamp}</span>
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
        )}
      </div>

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
  );
}
