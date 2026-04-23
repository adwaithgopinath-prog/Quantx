import React from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSymbol } from '../context/SymbolContext';
import { 
  LayoutDashboard, BarChart2, Zap, TrendingUp, 
  PlayCircle, MessageSquare, Briefcase, FileText, 
  Shield, Bell, User, Globe, ChevronRight, Activity
} from 'lucide-react';

const SYNE = "font-[Syne]";
const DM_MONO = "font-mono";

const NAV_GROUPS = [
  {
    title: "Main",
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
      { id: 'markets', label: 'Markets', icon: BarChart2, path: '/markets' },
      { id: 'predict', label: 'Predictions', icon: Zap, path: '/predict' },
    ]
  },
  {
    title: "Analysis",
    items: [
      { id: 'charts', label: 'Charts', icon: TrendingUp, path: '/charts' },
      { id: 'backtest', label: 'Backtest', icon: PlayCircle, path: '/backtest' },
      { id: 'ai', label: 'AI Advisor', icon: MessageSquare, path: '/ai' },
    ]
  },
  {
    title: "Portfolio",
    items: [
      { id: 'portfolio', label: 'My Portfolio', icon: Briefcase, path: '/portfolio' },
      { id: 'orders', label: 'Order History', icon: FileText, path: '/orders' },
      { id: 'risk', label: 'Risk Monitor', icon: Shield, path: '/risk' },
    ]
  }
];

export default function AppLayout({ portfolio, marketEngine, totalNAV, livePrice, symbol }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { setActiveSymbol } = useSymbol();

  // Get NIFTY 50 from marketEngine
  const niftyData = marketEngine?.indices?.find(idx => idx.name === 'NIFTY 50');
  const nifty = {
    price: niftyData ? parseFloat(niftyData.value.replace(/,/g, '')) : 24173.05,
    change_pct: niftyData ? parseFloat(niftyData.changePercent.replace('%', '')) : -0.84
  };

  const watchlist = [
    { s: 'RELIANCE', p: '2,438.30', c: '+0.12%' },
    { s: 'TCS', p: '4,102.15', c: '-0.45%' },
    { s: 'HDFCBANK', p: '1,642.00', c: '+1.20%' },
  ];

  return (
    <div className="min-h-screen bg-[#060810] text-white">
      
      {/* ── TOPBAR ──────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 h-[56px] bg-[#060810] border-b border-[#C9A84C]/15 z-[100] px-6 flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center gap-2.5">
          <Globe size={22} className="text-[#00ff88]" />
          <span className="text-lg font-bold tracking-[0.2em] uppercase font-heading">AI <span className="text-[#00ff88]">TERMINAL</span></span>
        </Link>
        
        {/* ... (rest of topbar remains same) ... */}
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-3 bg-white/5 px-4 py-1.5 rounded-lg border border-white/5">
             <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">NIFTY 50</span>
             <div className={`text-xs font-bold ${DM_MONO} ${nifty.change_pct >= 0 ? 'text-[#00ff88]' : 'text-[#ff4444]'}`}>
                {nifty.price.toLocaleString()} ({nifty.change_pct > 0 ? '+' : ''}{nifty.change_pct.toFixed(2)}%)
             </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="text-gray-400 hover:text-white transition-colors relative"><Bell size={18} /><div className="absolute -top-1 -right-1 w-2 h-2 bg-[#C9A84C] rounded-full border border-[#060810]" /></button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#C9A84C] to-[#00ff88] p-0.5"><div className="w-full h-full rounded-full bg-[#060810] flex items-center justify-center"><User size={16} className="text-gray-400" /></div></div>
          </div>
        </div>
      </nav>

      {/* ── SIDEBAR ─────────────────────────────────────────────────────────── */}
      <aside className="fixed left-0 top-[56px] bottom-0 w-[220px] bg-[#0D1018] border-r border-white/5 z-50 flex flex-col">
        <div className="flex-1 py-6 px-4 space-y-6 overflow-y-auto no-scrollbar">
          {NAV_GROUPS.map((group) => (
            <div key={group.title} className="space-y-2">
              <h3 className="px-4 text-[9px] font-bold text-gray-600 uppercase tracking-[0.3em]">{group.title}</h3>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link 
                      key={item.id} 
                      to={item.path}
                      className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all relative ${
                        isActive ? 'bg-[#C9A84C]/10 text-white' : 'text-gray-500 hover:bg-[#C9A84C]/5 hover:text-white'
                      }`}
                    >
                      {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[#C9A84C] rounded-r-full" />}
                      <item.icon size={16} className={isActive ? 'text-[#C9A84C]' : ''} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}

          {/* WATCHLIST PREVIEW */}
          <div className="space-y-3 pt-4 border-t border-white/5">
             <h3 className="px-4 text-[9px] font-bold text-gray-600 uppercase tracking-[0.3em]">Watchlist</h3>
             <div className="space-y-1">
                {watchlist.map(item => (
                  <button 
                    key={item.s}
                    onClick={() => { setActiveSymbol(item.s); navigate('/dashboard'); }}
                    className="w-full flex justify-between items-center px-4 py-2 hover:bg-white/5 rounded-lg transition-all group"
                  >
                    <span className="text-[10px] font-bold text-gray-400 group-hover:text-white">{item.s}</span>
                    <span className={`text-[9px] font-mono ${item.c.startsWith('+') ? 'text-[#00ff88]' : 'text-[#ff4444]'}`}>{item.c}</span>
                  </button>
                ))}
             </div>
          </div>
        </div>

        {/* SIDEBAR BOTTOM CARD */}
        <div className="p-4 border-t border-white/5">
          <div className="bg-white/5 rounded-xl p-4 border border-white/5 space-y-3">
             <div className="space-y-1">
               <div className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">Total Portfolio NAV</div>
               <div className={`text-sm font-bold ${DM_MONO} text-[#C9A84C]`}>₹{totalNAV.toLocaleString()}</div>
             </div>
             <div className="flex justify-between items-center">
                <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">Today's P&L</span>
                <span className={`text-[10px] font-bold ${DM_MONO} text-[#00ff88]`}>+₹2,451.20</span>
             </div>
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT AREA ───────────────────────────────────────────────── */}
      <main className="ml-[220px] mt-[56px] h-[calc(100vh-56px)] overflow-y-auto no-scrollbar">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <Outlet context={{ portfolio, marketEngine, totalNAV, livePrice, symbol }} />
          </motion.div>
        </AnimatePresence>
      </main>

    </div>
  );
}
