import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { TrendingUp, TrendingDown, Eye, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

export default function MarketWatch({ onSelectSymbol, currentSymbol }) {
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTrending = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:8000/api/market/trending');
      setTrending(res.data);
    } catch (err) {
      console.error("Market Watch error", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTrending();
    const interval = setInterval(fetchTrending, 30000); // 30s update
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="adwaith-card !p-6 flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-black text-[#44475b] flex items-center gap-2 uppercase tracking-wider">
          <Eye size={18} className="text-[#5367ff]" /> Top Assets
        </h3>
        <button 
          onClick={fetchTrending}
          className="p-1.5 hover:bg-gray-50 rounded-lg transition-all text-[#7c7e8c] hover:text-[#44475b]"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="space-y-1 overflow-y-auto pr-1 hide-scrollbar -mx-2">
        {loading && trending.length === 0 ? (
          [...Array(6)].map((_, i) => (
            <div key={i} className="h-16 w-full bg-gray-50 rounded-xl animate-pulse"></div>
          ))
        ) : (
          trending.map((stock) => (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              key={stock.symbol}
              onClick={() => onSelectSymbol(stock.symbol)}
              className={`p-3 rounded-xl transition-all cursor-pointer group flex items-center justify-between ${
                currentSymbol === stock.symbol 
                  ? 'bg-[#00d09c]/5' 
                  : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex flex-col">
                <span className={`text-sm font-bold transition-colors ${currentSymbol === stock.symbol ? 'text-[#00d09c]' : 'text-[#44475b]'}`}>
                  {stock.symbol.split('.')[0]}
                </span>
                <span className="text-[10px] text-[#7c7e8c] font-bold uppercase tracking-widest">{stock.symbol.split('.')[1] || 'IND'}</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-sm font-bold text-[#44475b]">₹{stock.price}</span>
                <div className={`flex items-center gap-1 text-[10px] font-black ${stock.change >= 0 ? 'text-[#00d09c]' : 'text-[#eb5b3c]'}`}>
                  {stock.change >= 0 ? '+' : ''}{stock.change}%
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
      
      <div className="mt-6 pt-6 border-t border-gray-100">
        <div className="p-4 bg-[#5367ff]/5 rounded-xl border border-[#5367ff]/10 relative overflow-hidden">
           <p className="text-[10px] font-black text-[#5367ff] uppercase tracking-wider mb-1">Portfolio Balance</p>
           <p className="text-xl font-black text-[#44475b] tracking-tight">₹3,42,920.44</p>
           <div className="mt-2 flex items-center justify-between">
              <span className="text-[9px] font-bold text-[#00d09c] flex items-center gap-1">
                <TrendingUp size={10} /> +12.4%
              </span>
              <button className="text-[9px] font-black text-[#5367ff] hover:underline uppercase tracking-widest">DETAILS</button>
           </div>
        </div>
      </div>
    </div>
  );
}
