import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, YAxis } from 'recharts';
import { Filter, Zap, Target, TrendingUp, AlertTriangle, ShieldCheck, Plus, ExternalLink, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function TopAssetsScreener({ onSelectSymbol, onQuickTrade }) {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Filters
  const [minPrice, setMinPrice] = useState(1);
  const [maxPrice, setMaxPrice] = useState(10000);
  const [sector, setSector] = useState("All");

  const predefinedRanges = [
    { label: "Penny (₹1-₹50)", min: 1, max: 50 },
    { label: "Mid (₹50-₹500)", min: 50, max: 500 },
    { label: "Large (₹500-₹2500)", min: 500, max: 2500 },
    { label: "Bluechip (₹2500+)", min: 2500, max: 20000 }
  ];

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:8000/api/screener`, {
        params: {
          min_price: minPrice,
          max_price: maxPrice,
          sector: sector
        }
      });
      setAssets(res.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAssets();
    const interval = setInterval(fetchAssets, 120000); // refresh every 2 minutes
    return () => clearInterval(interval);
  }, [minPrice, maxPrice, sector]);

  const applyRange = (min, max) => {
    setMinPrice(min);
    setMaxPrice(max);
  };

  return (
    <div className="groww-card !p-0 overflow-hidden border border-gray-100 shadow-sm mt-8">
      
      {/* Header & Filters */}
      <div className="p-6 border-b border-gray-100 bg-white shadow-sm relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-[#00d09c]/10 rounded-xl flex items-center justify-center">
               <Filter size={18} className="text-[#00d09c]" />
             </div>
             <div>
               <h2 className="text-xl font-black text-[#44475b] tracking-tight">AI Asset Screener</h2>
               <p className="text-[10px] font-bold text-[#7c7e8c] uppercase tracking-widest mt-0.5">Top 10 AI-Ranked Assets by Price Range</p>
             </div>
          </div>
          
          <button onClick={fetchAssets} className="text-xs font-bold text-[#7c7e8c] flex items-center gap-2 hover:text-[#5367ff] transition-colors">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-4">
           {predefinedRanges.map((r, i) => (
             <button
               key={i}
               onClick={() => applyRange(r.min, r.max)}
               className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                 minPrice === r.min && maxPrice === r.max 
                 ? "bg-[#00d09c] text-white shadow-md shadow-emerald-500/20" 
                 : "bg-[#f0f3f7] text-[#7c7e8c] hover:bg-gray-200"
               }`}
             >
               {r.label}
             </button>
           ))}
           
           <div className="h-6 w-px bg-gray-200 mx-2"></div>
           
           {/* Custom Range */}
           <div className="flex items-center gap-2 bg-[#f0f3f7] px-3 py-1.5 rounded-lg border border-transparent focus-within:border-[#00d09c] transition-all">
              <span className="text-[10px] font-black text-[#7c7e8c] uppercase tracking-wider">Custom: ₹</span>
              <input 
                type="number" 
                value={minPrice} 
                onChange={(e) => setMinPrice(Number(e.target.value))} 
                className="w-16 bg-transparent text-xs font-bold text-[#44475b] outline-none text-center"
              />
              <span className="text-xs text-[#7c7e8c]">-</span>
              <input 
                type="number" 
                value={maxPrice} 
                onChange={(e) => setMaxPrice(Number(e.target.value))} 
                className="w-16 bg-transparent text-xs font-bold text-[#44475b] outline-none text-center"
              />
           </div>

           {/* Sector Filter */}
           <select 
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              className="bg-[#f0f3f7] px-4 py-2 rounded-lg text-xs font-bold text-[#44475b] outline-none"
           >
              <option value="All">All Sectors</option>
              <option value="Tech">Technology</option>
              <option value="Finance">Financial Services</option>
              <option value="Energy">Energy</option>
              <option value="Healthcare">Healthcare</option>
              <option value="Consumer">Consumer</option>
              <option value="Auto">Auto</option>
           </select>
        </div>
      </div>

      {/* Table Section */}
      <div className="overflow-x-auto relative">
         {loading && (
           <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-20 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-[#00d09c]/20 border-t-[#00d09c] rounded-full animate-spin"></div>
           </div>
         )}
         
         <table className="w-full text-left min-w-[1000px]">
            <thead>
               <tr className="bg-gray-50/50 border-b border-gray-100 text-[10px] font-black text-[#7c7e8c] uppercase tracking-widest">
                  <th className="py-4 px-6">Asset Name</th>
                  <th className="py-4">Price & Change</th>
                  <th className="py-4">AI Score</th>
                  <th className="py-4">Sentiment & Risk</th>
                  <th className="py-4">Trend (30D)</th>
                  <th className="py-4">Action</th>
               </tr>
            </thead>
            <tbody className="text-sm font-bold text-[#44475b]">
               <AnimatePresence>
                 {assets.map((asset, i) => (
                   <motion.tr 
                     key={asset.symbol} 
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     exit={{ opacity: 0 }}
                     transition={{ delay: i * 0.05 }}
                     className="group border-b border-gray-50 last:border-0 hover:bg-[#f8f9fa] transition-colors"
                   >
                     {/* Asset Name */}
                     <td className="py-5 px-6">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-lg bg-[#5367ff]/10 text-[#5367ff] flex items-center justify-center font-black text-xs">
                             {asset.symbol[0]}
                           </div>
                           <div className="flex flex-col">
                             <span className="font-black text-[#44475b]">{asset.symbol}</span>
                             <span className="text-[10px] text-[#7c7e8c] font-bold uppercase">{asset.sector}</span>
                           </div>
                        </div>
                     </td>

                     {/* Price & Change */}
                     <td className="py-5">
                       <div className="flex flex-col">
                         <span className="text-sm font-black text-[#44475b]">₹{asset.current_price.toLocaleString()}</span>
                         <span className={`text-[10px] font-black flex items-center gap-1 ${asset.change_pct >= 0 ? "text-[#00d09c]" : "text-[#eb5b3c]"}`}>
                           {asset.change_pct >= 0 ? '+' : ''}{asset.change_pct}%
                         </span>
                       </div>
                     </td>

                     {/* AI Score Base */}
                     <td className="py-5">
                        <div className="flex items-center gap-2">
                           <div className="flex flex-col items-center mr-2">
                              <span className="text-lg font-black text-[#5367ff]">{asset.ai_score}</span>
                              <span className="text-[8px] text-[#7c7e8c] uppercase tracking-widest">/ 100</span>
                           </div>
                           <div className={`px-2 py-1 rounded border text-[10px] font-black uppercase tracking-wider ${
                             asset.recommendation.includes("Buy") 
                             ? "bg-[#00d09c]/10 text-[#00d09c] border-[#00d09c]/20" 
                             : asset.recommendation.includes("Sell") 
                             ? "bg-[#eb5b3c]/10 text-[#eb5b3c] border-[#eb5b3c]/20"
                             : "bg-gray-100 text-[#7c7e8c] border-gray-200"
                           }`}>
                             {asset.recommendation}
                           </div>
                        </div>
                     </td>

                     {/* Sentiment & Risk */}
                     <td className="py-5">
                        <div className="flex flex-col gap-2">
                           <div className="flex items-center gap-2 text-[10px] font-black">
                              <span className="text-[#7c7e8c] uppercase tracking-wider w-12">Sent:</span>
                              <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                 <div className="h-full bg-[#00d09c]" style={{ width: `${asset.sentiment_score}%` }}></div>
                              </div>
                              <span className={asset.sentiment_score > 60 ? "text-[#00d09c]" : "text-[#44475b]"}>{asset.sentiment_score}</span>
                           </div>
                           <div className="flex items-center gap-2 text-[10px] font-black">
                              <span className="text-[#7c7e8c] uppercase tracking-wider w-12">Risk:</span>
                              <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                 <div className={`h-full ${asset.risk_score > 60 ? "bg-[#eb5b3c]" : asset.risk_score > 30 ? "bg-[#ffb100]" : "bg-[#00d09c]"}`} style={{ width: `${asset.risk_score}%` }}></div>
                              </div>
                              <span className={asset.risk_score > 60 ? "text-[#eb5b3c]" : "text-[#44475b]"}>{asset.risk_score}</span>
                           </div>
                        </div>
                     </td>

                     {/* Mini Chart */}
                     <td className="py-5 w-32">
                        <div className="w-[100px] h-[30px] opacity-70 group-hover:opacity-100 transition-opacity">
                          <LineChart width={100} height={30} data={asset.mini_chart}>
                            <YAxis domain={['auto', 'auto']} hide />
                            <Line 
                               type="monotone" 
                               dataKey="price" 
                               stroke={asset.change_pct >= 0 ? "#00d09c" : "#eb5b3c"} 
                               strokeWidth={1.5} 
                               dot={false} 
                               isAnimationActive={false}
                            />
                          </LineChart>
                        </div>
                     </td>

                     {/* Actions */}
                     <td className="py-5 pr-6">
                        <div className="flex items-center gap-2">
                           <button 
                             onClick={() => onSelectSymbol(asset.symbol)}
                             className="p-1.5 rounded-lg bg-[#5367ff]/5 hover:bg-[#5367ff]/10 text-[#5367ff] transition-colors border border-[#5367ff]/10 group/btn tooltip-trigger"
                             title="Deep Analysis"
                           >
                             <ExternalLink size={16} />
                           </button>
                           <button 
                             onClick={() => onQuickTrade(asset.symbol, asset.current_price)}
                             className="px-3 py-1.5 rounded-lg bg-[#00d09c] hover:bg-[#00b085] text-white transition-colors text-xs font-black uppercase tracking-wider shadow-sm shadow-emerald-500/20 flex items-center gap-1"
                           >
                             <Plus size={14} /> Add
                           </button>
                        </div>
                     </td>
                   </motion.tr>
                 ))}
               </AnimatePresence>
            </tbody>
         </table>
         
         {assets.length === 0 && !loading && (
           <div className="p-12 text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-[#7c7e8c] mb-3">
                 <AlertTriangle size={20} />
              </div>
              <p className="text-sm font-bold text-[#44475b]">No highly ranked assets found in this range.</p>
              <p className="text-xs font-medium text-[#7c7e8c] mt-1">Try expanding your price constraints or changing sectors.</p>
           </div>
         )}
      </div>
    </div>
  );
}
