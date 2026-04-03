import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { MessageSquare, Send, Bot, User as UserIcon, Loader2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { API_BASE } from '../api';

export default function AIChat({ symbol }) {
  const [query, setQuery] = useState('');
  const [chatLog, setChatLog] = useState([
    { sender: 'ai', text: `Hi! I'm your Adwaith's AI assistant. I've analyzed ${symbol.toUpperCase()} for you. Ask me anything about its technicals or recent signals.` }
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
      const res = await axios.get(`${API_BASE}/api/chat`, { params: { query: userMsg, symbol }});
      setChatLog(prev => [...prev, { sender: 'ai', text: res.data.response }]);
    } catch (e) {
      setChatLog(prev => [...prev, { sender: 'ai', text: "I'm having some trouble connecting to my brain. Please try again in a moment!" }]);
    }
    setLoading(false);
  };

  return (
    <div className="adwaith-card flex flex-col h-[500px] !p-0 overflow-hidden relative border border-gray-100 shadow-sm">
      
      <div className="p-5 border-b border-gray-50 flex justify-between items-center bg-white shadow-sm">
        <div className="flex gap-3 items-center">
          <div className="w-10 h-10 bg-[#00d09c]/10 rounded-xl flex items-center justify-center text-[#00d09c]">
             <Sparkles size={20} />
          </div>
          <div>
             <h3 className="font-bold text-[#44475b] text-sm">Adwaith's AI Insights</h3>
             <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00d09c] animate-pulse"></span>
                <p className="text-[10px] text-[#7c7e8c] font-bold uppercase tracking-widest pl-0.5">Active</p>
             </div>
          </div>
        </div>
        <div className="px-2 py-1 bg-gray-50 rounded-lg text-[9px] font-bold text-[#7c7e8c] uppercase tracking-wider">QuantX Engine</div>
      </div>
      
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth hide-scrollbar bg-white">
        <AnimatePresence mode="popLayout">
          {chatLog.map((msg, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm ${msg.sender === 'user' ? 'bg-[#5367ff] text-white' : 'bg-[#00d09c]/10 text-[#00d09c]'}`}>
                {msg.sender === 'user' ? <UserIcon size={14} /> : <Sparkles size={14} />}
              </div>
              <div className={`p-4 max-w-[85%] rounded-2xl text-[13px] font-medium leading-relaxed ${msg.sender === 'user' ? 'bg-[#5367ff] text-white rounded-tr-none' : 'bg-[#f0f3f7] text-[#44475b] rounded-tl-none'}`}>
                 {msg.text}
              </div>
            </motion.div>
          ))}
          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start gap-3">
               <div className="w-8 h-8 rounded-lg bg-[#00d09c]/10 text-[#00d09c] flex items-center justify-center animate-pulse">
                 <Loader2 size={14} className="animate-spin" />
               </div>
               <div className="p-3 bg-[#f0f3f7] rounded-2xl text-[11px] font-bold text-[#7c7e8c] animate-pulse">
                  Analyzing insights for {symbol}...
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      <div className="p-5 bg-white border-t border-gray-50">
        <div className="relative group">
          <input 
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={`Ask about ${symbol}...`}
            className="w-full bg-[#f0f3f7] border-none rounded-xl pl-5 pr-14 py-3.5 text-sm focus:ring-2 focus:ring-[#00d09c]/10 text-[#44475b] placeholder-gray-400 font-medium transition-all outline-none"
          />
          <button 
            onClick={handleSend} 
            className="absolute right-1.5 top-1.5 bottom-1.5 px-4 bg-[#00d09c] hover:opacity-90 text-white flex items-center justify-center rounded-lg transition-all shadow-md shadow-emerald-500/10 active:scale-95"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
