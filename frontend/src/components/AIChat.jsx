import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, Bot, User as UserIcon, Loader2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api';

export default function AIChat({ symbol }) {
  const [query, setQuery] = useState('');
  const [history, setHistory] = useState([
    { id: 1, title: 'Reliance Q3 Analysis', date: '2h ago', content: 'Bullish momentum confirmed by EMA-200 support.' },
    { id: 2, title: 'Nifty Correction Risks', date: '5h ago', content: 'Overbought RSI suggests short-term cooling.' },
    { id: 3, title: 'TCS Momentum Check', date: 'Yesterday', content: 'Sideways trend with high volume accumulation.' },
  ]);
  const [activeHistory, setActiveHistory] = useState(null);
  const [chatLog, setChatLog] = useState([
    { sender: 'ai', text: `Hi! I'm your QuantX AI assistant. I've analyzed ${symbol.toUpperCase()} for you. Ask me anything about its technicals or recent signals.` }
  ]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatLog, loading]);

  const handleSend = async () => {
    if (!query.trim()) return;
    const userMsg = query;
    setChatLog(prev => [...prev, { sender: 'user', text: userMsg }]);
    setQuery('');
    setLoading(true);
    
    try {
      const res = await api.get(`/api/chat`, { params: { query: userMsg, symbol }});
      setChatLog(prev => [...prev, { sender: 'ai', text: res.data.response }]);
    } catch (e) {
      setChatLog(prev => [...prev, { sender: 'ai', text: "I'm having some trouble connecting to my brain. Please try again in a moment!" }]);
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = (item) => {
    setActiveHistory(item);
    setChatLog([
      { sender: 'user', text: `Load past analysis: ${item.title}` },
      { sender: 'ai', text: item.content }
    ]);
  };

  return (
    <div className="flex gap-6 h-[700px] font-sans">
      
      {/* HISTORY PANEL */}
      <aside className="w-[300px] bg-[#141720] border border-[#1e2333] rounded-3xl overflow-hidden flex flex-col">
        <div className="p-6 border-b border-[#1e2333]">
           <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
             <Bot size={16} className="text-[#C9A84C]" />
             Analysis History
           </h3>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar">
           {history.map(item => (
             <button 
               key={item.id} 
               onClick={() => loadHistory(item)}
               className={`w-full text-left p-4 rounded-xl transition-all border ${
                 activeHistory?.id === item.id ? 'bg-[#C9A84C]/10 border-[#C9A84C]/30' : 'border-transparent hover:bg-white/5'
               }`}
             >
               <div className="text-xs font-bold text-white mb-1">{item.title}</div>
               <div className="text-[10px] text-gray-500 font-mono uppercase">{item.date}</div>
             </button>
           ))}
        </div>
      </aside>

      {/* CHAT WINDOW */}
      <div className="flex-1 bg-[#141720] border border-[#1e2333] rounded-3xl overflow-hidden flex flex-col relative">
        <div className="p-5 border-b border-[#1e2333] flex justify-between items-center bg-[#141720]">
          <div className="flex gap-3 items-center">
            <div className="w-10 h-10 bg-[#C9A84C]/10 rounded-xl flex items-center justify-center text-[#C9A84C]">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Adwaith's AI Insights</h3>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00ff88] animate-pulse"></span>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest pl-0.5">Active for {symbol}</p>
              </div>
            </div>
          </div>
          <div className="px-3 py-1 bg-white/5 rounded-lg text-[9px] font-bold text-gray-400 uppercase tracking-wider border border-white/5">QuantX Engine v4.0</div>
        </div>
        
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar bg-[#0d0f12]">
          <AnimatePresence mode="popLayout">
            {chatLog.map((msg, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm ${msg.sender === 'user' ? 'bg-[#C9A84C] text-[#060810]' : 'bg-white/5 text-[#C9A84C]'}`}>
                  {msg.sender === 'user' ? <UserIcon size={14} /> : <Sparkles size={14} />}
                </div>
                <div className={`p-4 max-w-[85%] rounded-2xl text-[13px] font-medium leading-relaxed ${msg.sender === 'user' ? 'bg-[#C9A84C]/10 text-white border border-[#C9A84C]/20 rounded-tr-none' : 'bg-white/5 text-gray-300 border border-white/5 rounded-tl-none'}`}>
                  {msg.text}
                </div>
              </motion.div>
            ))}
            {loading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/5 text-[#C9A84C] flex items-center justify-center animate-pulse">
                  <Loader2 size={14} className="animate-spin" />
                </div>
                <div className="p-3 bg-white/5 rounded-2xl text-[11px] font-bold text-gray-500 animate-pulse border border-white/5">
                  Analyzing insights for {symbol}...
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <div className="p-5 bg-[#141720] border-t border-[#1e2333]">
          <div className="relative group">
            <input 
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={`Ask about ${symbol}...`}
              className="w-full bg-[#0d0f12] border border-[#1e2333] rounded-xl pl-5 pr-14 py-4 text-sm focus:border-[#C9A84C] text-white placeholder-gray-600 font-medium transition-all outline-none"
            />
            <button 
              onClick={handleSend} 
              className="absolute right-2 top-2 bottom-2 px-4 bg-[#C9A84C] hover:brightness-110 text-[#060810] flex items-center justify-center rounded-lg transition-all shadow-md active:scale-95"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
