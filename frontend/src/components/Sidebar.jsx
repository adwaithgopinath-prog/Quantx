import React from 'react';
import { 
  Compass, 
  Briefcase, 
  Activity, 
  Settings, 
  HelpCircle, 
  Wallet, 
  TrendingUp,
  X,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User as UserIcon,
  Zap,
  BarChart4
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MarketWatch from './MarketWatch';

const Sidebar = ({ 
  activeTab, 
  setActiveTab, 
  isOpen, 
  setIsOpen, 
  isCollapsed, 
  setIsCollapsed,
  symbol,
  setSymbol,
  livePrice,
  data,
  portfolio,
  handleTrade
}) => {
  const navItems = [
    { id: 'Pulse', icon: <BarChart4 size={20} />, label: 'Market Pulse' },
    { id: 'Explore', icon: <Compass size={20} />, label: 'AI Terminal' },
    { id: 'Signals', icon: <Zap size={20} />, label: 'AI Signals' },
    { id: 'Investments', icon: <Briefcase size={20} />, label: 'Portfolio' },
    { id: 'History', icon: <Activity size={20} />, label: 'Orders' },
  ];

  const sidebarVariants = {
    open: { width: isCollapsed ? 88 : 288, x: 0 },
    closed: { x: '-100%' },
  };

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[70] xl:hidden"
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial="closed"
        animate="open"
        variants={sidebarVariants}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className={`fixed xl:sticky top-0 left-0 h-screen bg-white border-r border-gray-100 flex flex-col z-[80] shadow-[1px_0_10px_rgba(0,0,0,0.02)] overflow-hidden ${isOpen ? 'translate-x-0' : '-translate-x-full xl:translate-x-0'}`}
      >
        {/* Header */}
        <div className="p-6 flex items-center justify-between">
          <div className={`flex items-center gap-3 transition-opacity duration-300 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>
            <div className="w-10 h-10 bg-[#00d09c] rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-emerald-500/20">G</div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-[#44475b]">QuantX</h1>
              <p className="text-[10px] font-black text-[#00d09c] uppercase tracking-widest bg-emerald-50 px-1.5 py-0.5 rounded w-fit">AI Terminal</p>
            </div>
          </div>
          
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden xl:flex w-8 h-8 items-center justify-center rounded-lg hover:bg-gray-50 text-gray-400 hover:text-[#44475b] transition-colors"
          >
            {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>

          <button 
            onClick={() => setIsOpen(false)}
            className="xl:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-50 text-gray-400"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <div className="px-4 py-4 space-y-1.5">
          <p className={`text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 px-4 transition-opacity ${isCollapsed ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100'}`}>
            Main Menu
          </p>
          {navItems.map(item => (
            <button 
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                if (window.innerWidth < 1280) setIsOpen(false);
              }}
              title={isCollapsed ? item.label : ''}
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all relative overflow-hidden group ${activeTab === item.id ? 'bg-[#00d09c]/10 text-[#00d09c]' : 'text-[#7c7e8c] hover:bg-gray-50 hover:text-[#44475b]'}`}
            >
              <span className="min-w-[24px] flex justify-center">{item.icon}</span>
              <span className={`transition-all duration-300 ${isCollapsed ? 'opacity-0 translate-x-4 w-0' : 'opacity-100 translate-x-0'}`}>{item.label}</span>
              
              {activeTab === item.id && (
                <motion.div layoutId="sidebar-blob" className="absolute left-0 w-1.5 h-6 bg-[#00d09c] rounded-r-full" />
              )}
            </button>
          ))}
        </div>

        {/* Dynamic Contextual Widgets */}
        <div className={`flex-1 px-4 py-8 overflow-y-auto space-y-10 custom-scrollbar ${isCollapsed ? 'hidden' : 'block'}`}>
           {activeTab === 'Explore' && data ? (
             <div className="space-y-6 animate-fade-in animate-in slide-in-from-left-4 duration-500">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-4">Live Monitor</p>
                <div className="bg-gray-50/50 rounded-3xl p-5 border border-gray-100 backdrop-blur-sm mx-2">
                   <div className="flex items-center gap-4 mb-6">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center font-black text-[#00d09c] text-sm shadow-md border border-gray-50">{symbol[0]}</div>
                      <div className="truncate">
                         <p className="text-sm font-black text-[#44475b] truncate">{symbol}</p>
                         <p className="text-xs font-bold text-[#00d09c]">₹{livePrice?.price || data.current_price}</p>
                      </div>
                   </div>
                   <div className="space-y-4">
                      <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-gray-50 shadow-sm">
                         <span className="text-[10px] font-bold text-gray-400 uppercase">RSI Score</span>
                         <span className={`text-xs font-black ${data.indicators?.rsi > 70 ? 'text-[#eb5b3c]' : data.indicators?.rsi < 30 ? 'text-[#00d09c]' : 'text-[#44475b]'}`}>{data.indicators?.rsi}</span>
                      </div>
                      <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-gray-50 shadow-sm">
                         <span className="text-[10px] font-bold text-gray-400 uppercase">AI Signal</span>
                         <span className="text-xs font-black text-[#5367ff] uppercase">{data.fusion_signal?.recommendation || "Neutral"}</span>
                      </div>
                   </div>
                   <button onClick={() => handleTrade('BUY')} className="w-full mt-6 bg-[#00d09c] text-white py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-emerald-500/20 hover:bg-[#00b085] hover:scale-[1.02] active:scale-95 transition-all">Instant Buy</button>
                </div>
                
                <div className="space-y-4 pt-4">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-4">Trending (NSE)</p>
                    <div className="bg-white border rounded-3xl overflow-hidden shadow-sm">
                        <MarketWatch onSelectSymbol={(sym) => {setSymbol(sym); setActiveTab('Explore');}} currentSymbol={symbol} />
                    </div>
                </div>
             </div>
           ) : (activeTab === 'Investments' || activeTab === 'History') && portfolio ? (
             <div className="space-y-6 animate-fade-in animate-in slide-in-from-left-4 duration-500">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-4">Portfolio Health</p>
                <div className="bg-[#5367ff]/5 rounded-3xl p-6 border border-[#5367ff]/10 backdrop-blur-sm mx-2">
                   <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center font-black text-[#5367ff] text-lg shadow-lg border border-[#5367ff]/10"><Wallet size={24}/></div>
                      <div>
                         <p className="text-lg font-black text-[#44475b]">₹{portfolio.total_equity?.toLocaleString()}</p>
                         <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Equity</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-2 p-3 bg-white rounded-xl border border-[#00d09c]/10 text-xs font-black text-[#00d09c]">
                      <TrendingUp size={16} />
                      <span>{portfolio.total_pnl >= 0 ? '+' : ''}₹{portfolio.total_pnl?.toLocaleString()} Total P&L</span>
                   </div>
                </div>
             </div>
           ) : null}
        </div>

        {/* User Profile & Actions */}
        <div className="p-4 border-t border-gray-50 space-y-2 bg-white mt-auto">
           <button className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-xs font-bold text-[#7c7e8c] hover:bg-gray-50 hover:text-[#44475b] transition-all group overflow-hidden">
              <span className="min-w-[24px] flex justify-center"><Settings size={20} className="group-hover:rotate-45 transition-transform duration-300" /></span>
              <span className={`transition-all duration-300 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>Settings</span>
           </button>
           <button className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-xs font-bold text-[#7c7e8c] hover:bg-gray-50 hover:text-[#44475b] transition-all group overflow-hidden">
              <span className="min-w-[24px] flex justify-center"><HelpCircle size={20} /></span>
              <span className={`transition-all duration-300 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>Support</span>
           </button>
           
           <div className={`mt-4 p-3 bg-[#f8f9fa] rounded-2xl border border-gray-100 flex items-center justify-between transition-all ${isCollapsed ? 'justify-center p-2' : ''}`}>
              <div className="flex items-center gap-3 overflow-hidden">
                 <div className="w-10 h-10 rounded-xl bg-[#5367ff] text-white flex-shrink-0 flex items-center justify-center font-black text-sm shadow-md">AG</div>
                 <div className={`transition-all duration-300 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>
                    <p className="text-xs font-black text-[#44475b] truncate">Adwaith G.</p>
                    <p className="text-[10px] font-bold text-[#00d09c] uppercase tracking-wider">Pro Tier</p>
                 </div>
              </div>
              {!isCollapsed && (
                <button className="p-2 hover:bg-white rounded-lg text-gray-400 hover:text-rose-500 transition-colors shadow-sm border border-transparent hover:border-gray-100">
                  <LogOut size={16} />
                </button>
              )}
           </div>
        </div>
      </motion.aside>
    </>
  );
};

export default Sidebar;
