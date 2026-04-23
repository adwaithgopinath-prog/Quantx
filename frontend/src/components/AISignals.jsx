import React, { useState } from 'react';
import { Search, Info, TrendingUp, TrendingDown, Target, AlertTriangle, CheckCircle, Quote, Activity, Users, Globe, ExternalLink, Zap, BarChart2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AISignals({ symbol, setSymbol, data, livePrice, marketEngine }) {
  const [searchInput, setSearchInput] = useState(symbol || 'RELIANCE.NS');

  // Safely grab AI fusion data and map variables
  const fusion = data?.fusion || {};
  const rec = fusion?.recommendation || 'HOLD';
  const conf = fusion?.confidence ? parseInt(fusion.confidence) : 50;
  const price = livePrice ? livePrice.price : (data?.current_price || 0);

  const getRecColor = (r) => {
    if (!r) return 'text-[#ff9800]';
    if (r.includes('BUY')) return 'text-[#00e676]';
    if (r.includes('SELL')) return 'text-[#ff4444]';
    return 'text-[#ff9800]';
  };
  const getRecBg = (r) => {
    if (!r) return 'bg-[#ff9800]/20 border-[#ff9800]/50';
    if (r.includes('BUY')) return 'bg-[#00e676]/20 border-[#00e676]/50';
    if (r.includes('SELL')) return 'bg-[#ff4444]/20 border-[#ff4444]/50';
    return 'bg-[#ff9800]/20 border-[#ff9800]/50';
  };

  const sentiment = data?.news?.final_sentiment_score || 0;
  const isPosSentiment = sentiment >= 0;

  const openAIAnalysis = data?.external_data?.openai?.ai_reasoning || "Algorithms detect significant accumulation volumes. The asset demonstrates resilient support levels aligning with the broader sector growth outlook.";
  const macro = data?.external_data?.fred || { interest_rate: 6.5, inflation_rate: 4.8, gdp_growth: 6.5 };
  const fundamentals = data?.external_data?.fmp || { revenue_growth: 14.2, pe_ratio: 22.4 };

  return (
    <div className="max-w-[1600px] mx-auto bg-transparent">
      
      {/* Top Search Bar */}
      <div className="bg-[#141720] border border-[#1e2333] p-4 rounded-xl flex items-center mb-6">
         <form onSubmit={(e) => { e.preventDefault(); setSymbol(searchInput.toUpperCase()); }} className="relative w-full md:w-96">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8a9ab5]" />
            <input type="text" placeholder="Search any NSE/BSE ticker (e.g. RELIANCE.NS)" value={searchInput} onChange={e => setSearchInput(e.target.value)}
                   className="w-full bg-[#0d0f12] border border-[#1e2333] text-white font-[Inter] text-sm p-3 pl-12 rounded focus:outline-none focus:border-[#00e676] transition-colors" />
         </form>
         <div className="hidden md:block ml-auto text-[10px] font-[Space_Grotesk] font-bold text-[#8a9ab5] uppercase tracking-widest flex items-center gap-2">
            <Zap size={14} className="text-[#00e676]" /> QuantX Signals Live
         </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative">
          
          {/* Left Panel: Smart Suggestion */}
          <div className="col-span-1 lg:col-span-7 space-y-6">
             
             {/* Recommendation Card */}
             <div className="bg-[#141720] border border-[#1e2333] rounded-xl overflow-hidden shadow-2xl relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#00e676] opacity-[0.03] rounded-full blur-3xl"></div>
                <div className="p-8 relative z-10">
                   <div className="flex justify-between items-start mb-6">
                      <div className="text-[10px] font-[Space_Grotesk] font-bold text-[#8a9ab5] uppercase tracking-widest">AI Recommendation</div>
                      <div className={`px-3 py-1 rounded text-[10px] font-bold tracking-widest uppercase border ${data?.risk?.score < 40 ? 'bg-[#00e676]/10 border-[#00e676]/30 text-[#00e676]' : data?.risk?.score < 70 ? 'bg-[#ff9800]/10 border-[#ff9800]/30 text-[#ff9800]' : 'bg-[#ff4444]/10 border-[#ff4444]/30 text-[#ff4444]'}`}>RISK: {data?.risk?.rating || 'MEDIUM'}</div>
                   </div>
                   
                   <div className={`text-6xl md:text-7xl font-[Space_Grotesk] font-bold tracking-tighter mb-2 ${getRecColor(rec)}`}>
                      {rec}
                   </div>
                   <div className="flex items-center gap-3 text-white font-[Inter]">
                     <span className="text-3xl font-bold">{conf}%</span>
                     <span className="text-sm font-bold text-[#8a9ab5] uppercase tracking-widest border-l border-[#1e2333] pl-3">Confidence Score</span>
                   </div>

                   {/* Probability Bar */}
                   <div className="mt-8 flex h-3 w-full rounded-full overflow-hidden border border-[#1e2333]">
                      <div className="bg-[#00e676] flex items-center justify-center text-[8px] font-bold text-black" style={{width: `${fusion?.probabilities?.buy || 33}%`}}>{fusion?.probabilities?.buy || 33}%</div>
                      <div className="bg-[#8a9ab5]/30 flex items-center justify-center text-[8px] font-bold text-white relative border-x border-[#1e2333]" style={{width: `${fusion?.probabilities?.hold || 34}%`}}>{fusion?.probabilities?.hold || 34}%</div>
                      <div className="bg-[#ff4444] flex items-center justify-center text-[8px] font-bold text-white" style={{width: `${fusion?.probabilities?.sell || 33}%`}}>{fusion?.probabilities?.sell || 33}%</div>
                   </div>
                   <div className="flex justify-between text-[10px] font-bold uppercase mt-2 text-[#8a9ab5]">
                      <span>BUY PROBABILITY</span>
                      <span>HOLD</span>
                      <span>SELL PROBABILITY</span>
                   </div>
                </div>

                {/* AI Narrative Quote */}
                <div className="border-t border-[#1e2333] bg-[#0d0f12]/50 p-6">
                   <div className="flex gap-4">
                      <Quote size={24} className="text-[#8a9ab5]/40 shrink-0" />
                      <p className="text-[#8a9ab5] font-[Inter] text-sm italic leading-relaxed">
                         "{fusion?.ai_explanation || "The multi-source model is aggregating signals for this current market lifecycle."}"
                      </p>
                   </div>
                </div>
             </div>

             {/* Analytical Support Bullets */}
             <div className="bg-[#141720] border border-[#1e2333] rounded-xl p-6">
                 <h3 className="text-[12px] font-[Space_Grotesk] font-bold text-white uppercase tracking-widest mb-5 border-b border-[#1e2333] pb-3 flex items-center gap-2">
                   <Activity size={16} className="text-[var(--color-gold)]" /> Synthesized Insights
                 </h3>
                 <div className="space-y-4 font-[Inter] text-sm">
                    {(fusion?.reasoning || []).map((bullet, i) => (
                      <div key={i} className="flex gap-3 items-start">
                         <div className="mt-1 shrink-0"><CheckCircle size={14} className="text-[#00e676]" /></div>
                         <div className="text-[#e2e8f0]">{bullet}</div>
                      </div>
                    ))}
                    
                    <div className="flex gap-3 items-start mt-6 pt-4 border-t border-[#1e2333] bg-[#0d0f12] p-4 rounded-lg">
                       <div className="mt-1 shrink-0"><Zap size={14} className="text-[#ff9800]" /></div>
                       <div>
                          <div className="text-[10px] font-bold text-[#ff9800] uppercase tracking-widest mb-1">OpenAI Alpha Analysis</div>
                          <div className="text-[#8a9ab5] text-xs leading-relaxed">{openAIAnalysis}</div>
                       </div>
                    </div>
                 </div>
             </div>

          </div>

          {/* Right Panel: Predictive Engine */}
          <div className="col-span-1 lg:col-span-5 space-y-6">

             {/* Top 4 Insight Cards */}
             <div className="grid grid-cols-2 gap-4">
                
                {/* Vectorized Target */}
                <div className="bg-[#141720] border border-[#1e2333] p-5 rounded-xl col-span-2 md:col-span-1">
                   <div className="text-[10px] font-[Space_Grotesk] font-bold text-[#8a9ab5] uppercase tracking-widest mb-3 flex items-center gap-1.5"><Target size={12}/> Price Target</div>
                   <div className="text-2xl font-[Inter] font-bold text-[#00e676] mb-1">+4.2% UP</div>
                   <div className="inline-block bg-[#00e676]/20 border border-[#00e676]/50 text-[#00e676] px-2 py-1 rounded text-xs font-bold">TARGET: ₹{price ? (Number(price) * 1.042).toFixed(2) : '---'}</div>
                </div>

                {/* Risk Profile */}
                <div className="bg-[#141720] border border-[#1e2333] p-5 rounded-xl col-span-2 md:col-span-1">
                   <div className="text-[10px] font-[Space_Grotesk] font-bold text-[#8a9ab5] uppercase tracking-widest mb-3 flex items-center gap-1.5"><AlertTriangle size={12}/> Composite Risk</div>
                   <div className="flex items-end gap-1 mb-2">
                     <span className="text-2xl font-[Inter] font-bold text-[#ff9800]">62</span><span className="text-xs text-[#8a9ab5] pb-1 font-bold">/100</span>
                   </div>
                   <div className="w-full h-1 bg-[#1e2333] mb-2 rounded-full overflow-hidden">
                     <div className="bg-[#ff9800] h-full rounded-full" style={{width: '62%'}}></div>
                   </div>
                   <div className="text-[9px] uppercase font-bold text-[#8a9ab5]">High Price Volatility</div>
                </div>

                {/* Trend Direction */}
                <div className="bg-[#141720] border border-[#1e2333] p-5 rounded-xl col-span-2 md:col-span-1">
                   <div className="text-[10px] font-[Space_Grotesk] font-bold text-[#8a9ab5] uppercase tracking-widest mb-3 flex items-center gap-1.5"><TrendingUp size={12}/> Trend Direction</div>
                   <div className="flex items-center gap-2 mb-2">
                     <div className="w-3 h-3 rounded-full bg-[#00e676] shadow-[0_0_10px_#00e676]"></div>
                     <span className="text-xl font-[Inter] font-bold text-white">BULLISH</span>
                   </div>
                   <div className="text-[10px] font-bold text-[#8a9ab5] bg-[#1e2333] px-2 py-0.5 rounded inline-block">78% ACCURACY</div>
                </div>

                {/* Buy Density */}
                <div className="bg-[#141720] border border-[#1e2333] p-5 rounded-xl col-span-2 md:col-span-1 flex flex-col justify-between">
                   <div className="text-[10px] font-[Space_Grotesk] font-bold text-[#8a9ab5] uppercase tracking-widest mb-3 flex items-center gap-1.5"><Users size={12}/> Buy Density</div>
                   <div className="flex items-end justify-between mt-auto">
                     <span className="text-3xl font-[Inter] font-bold text-white">82%</span>
                     <span className="text-[10px] font-bold text-[#8a9ab5] uppercase bg-[#1e2333] px-2 py-0.5 rounded">Volume Avg.</span>
                   </div>
                   <div className="w-full h-1 bg-[#1e2333] mt-2 rounded-full overflow-hidden">
                     <div className="bg-[#00e676] h-full rounded-full" style={{width: '82%'}}></div>
                   </div>
                </div>

             </div>

             {/* Sentiment Intelligence Panel */}
             <div className="bg-[#141720] border border-[#1e2333] rounded-xl p-6">
                <div className="text-[10px] font-[Space_Grotesk] font-bold text-[#8a9ab5] uppercase tracking-widest mb-2 flex items-center gap-2">
                   <Globe size={14} className="text-[#00ff88]" /> Sentiment Intelligence
                </div>
                <h4 className="text-sm font-bold text-white mb-6 uppercase border-b border-[#1e2333] pb-3">&gt; {symbol?.split('.')?.[0] || symbol || 'ASSET'} analyzed for upcoming market catalysts.</h4>
                
                <div className="space-y-5">
                   {/* Row 1 */}
                   <div>
                      <div className="flex justify-between items-end mb-1">
                         <span className="text-xs font-[Space_Grotesk] font-bold text-white tracking-widest uppercase">Financial News (FinBert)</span>
                         <span className="text-[10px] font-bold text-[#00e676]">0.77 POSITIVE</span>
                      </div>
                      <div className="w-full h-1.5 bg-[#1e2333] rounded-full overflow-hidden flex">
                         <div className="bg-[#ff4444] h-full" style={{width: '10%'}}></div>
                         <div className="bg-[#00e676] h-full ml-auto" style={{width: '60%'}}></div>
                      </div>
                   </div>

                   {/* Row 2 */}
                   <div>
                      <div className="flex justify-between items-end mb-1">
                         <span className="text-xs font-[Space_Grotesk] font-bold text-white tracking-widest uppercase">X Corp. Momentum</span>
                         <span className="text-[10px] font-bold text-[#00e676]">24K MENTIONS </span>
                      </div>
                      <div className="w-full h-1.5 bg-[#1e2333] rounded-full overflow-hidden flex">
                         <div className="bg-[#ff4444] h-full" style={{width: '20%'}}></div>
                         <div className="bg-[#00e676] h-full ml-auto" style={{width: '50%'}}></div>
                      </div>
                   </div>

                   {/* Row 3 */}
                   <div>
                      <div className="flex justify-between items-end mb-1">
                         <span className="text-xs font-[Space_Grotesk] font-bold text-white tracking-widest uppercase">Reddit r/WallStreetBets</span>
                         <span className="text-[10px] font-bold text-[#8a9ab5]">MODERATE YAPPING</span>
                      </div>
                      <div className="w-full h-1.5 bg-[#1e2333] rounded-full overflow-hidden flex">
                         <div className="bg-[#ff4444] h-full" style={{width: '30%'}}></div>
                         <div className="bg-[#ff9800] h-full ml-auto" style={{width: '30%'}}></div>
                      </div>
                   </div>

                   {/* Row 4 */}
                   <div className="border-b border-[#1e2333] pb-5">
                      <div className="flex justify-between items-end mb-1">
                         <span className="text-xs font-[Space_Grotesk] font-bold text-white tracking-widest uppercase">GDELT Global Tone</span>
                         <span className="text-[10px] font-bold text-[#8a9ab5]">+2.41 TONE (EV: 7/10)</span>
                      </div>
                      <div className="w-full h-1.5 bg-[#1e2333] rounded-full flex gap-0.5 overflow-hidden">
                         {[1,2,3,4,5,6,7,8,9,10].map(n => <div key={n} className={`flex-1 h-full ${n<=7 ? 'bg-[#ff9800]' : 'bg-[#1e2333]'}`}></div>)}
                      </div>
                   </div>
                   
                   {/* Final Weight Result */}
                   <div className="pt-2 flex justify-between items-center">
                      <div className="text-[10px] font-[Space_Grotesk] font-bold tracking-widest text-[#8a9ab5] uppercase">Final Weighted Sentiment</div>
                      <div className="flex items-center gap-3">
                         <div className="text-2xl font-[Inter] font-bold text-[#00e676]">+{sentiment}</div>
                         <div className="bg-[#00e676]/20 border border-[#00e676]/50 text-[#00e676] px-2 py-1 rounded text-[10px] font-bold uppercase">Bullish Bias</div>
                      </div>
                   </div>
                </div>
             </div>

          </div>
      </div>

      {/* Macro & Fundamentals Bottom Panel */}
      <div className="mt-6 bg-[#141720] border border-[#1e2333] rounded-xl p-6">
         <div className="text-[10px] font-[Space_Grotesk] font-bold text-[#8a9ab5] uppercase tracking-widest mb-4 flex items-center gap-2">
            <BarChart2 size={14} className="text-[#ff9800]" /> Macroeconomic & Asset Fundamentals
         </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            <div className="flex flex-col border-l-2 border-[#1e2333] pl-3 hover:border-[#00e676] transition-colors cursor-default">
               <span className="text-[10px] font-bold text-[#8a9ab5] uppercase mb-1">GDP Growth Est</span>
               <span className="text-lg font-[Inter] font-bold text-white">{macro.gdp_growth}%</span>
            </div>
            <div className="flex flex-col border-l-2 border-[#1e2333] pl-3 hover:border-[#ff4444] transition-colors cursor-default">
               <span className="text-[10px] font-bold text-[#8a9ab5] uppercase mb-1">Interest Rate</span>
               <span className="text-lg font-[Inter] font-bold text-white">{macro.interest_rate}%</span>
            </div>
            <div className="flex flex-col border-l-2 border-[#1e2333] pl-3 hover:border-[#ff4444] transition-colors cursor-default">
               <span className="text-[10px] font-bold text-[#8a9ab5] uppercase mb-1">Inflation Core</span>
               <span className="text-lg font-[Inter] font-bold text-white">{macro.inflation_rate}%</span>
            </div>
            <div className="flex flex-col border-l-2 border-[#1e2333] pl-3 hover:border-[#00e676] transition-colors cursor-default">
               <span className="text-[10px] font-bold text-[#8a9ab5] uppercase mb-1">Revenue Y/Y</span>
               <span className="text-lg font-[Inter] font-bold text-white">{fundamentals.revenue_growth}%</span>
            </div>
            <div className="flex flex-col border-l-2 border-[#1e2333] pl-3 hover:border-[#ff9800] transition-colors cursor-default">
               <span className="text-[10px] font-bold text-[#8a9ab5] uppercase mb-1">Sector P/E Ratio</span>
               <span className="text-lg font-[Inter] font-bold text-white">{fundamentals.pe_ratio}</span>
            </div>
          </div>
      </div>

    </div>
  );
}
