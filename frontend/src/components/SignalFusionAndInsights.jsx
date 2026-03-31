import React from 'react';
import { Newspaper, Brain, Activity, CheckCircle2, Zap, Target, Gauge, ShieldAlert, Share2, TrendingUp, Info, Globe } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SignalFusionAndInsights({ fusion, news, predictions, risk, externalData }) {
  if (!fusion || !news || !predictions) return null;

  const isBuy = (fusion?.recommendation || "").includes("BUY");
  const isSell = (fusion?.recommendation || "").includes("SELL");
  const signColor = isBuy ? "text-[#00d09c] bg-[#00d09c]/5 border-[#00d09c]/20" : 
                    isSell ? "text-[#eb5b3c] bg-[#eb5b3c]/5 border-[#eb5b3c]/20" : "text-[#7c7e8c] bg-gray-50 border-gray-100";
                    
  const riskColor = risk?.rating === "Low" ? "text-emerald-500" : risk?.rating === "Medium" ? "text-amber-500" : "text-rose-500";
  const riskBg = risk?.rating === "Low" ? "bg-emerald-50" : risk?.rating === "Medium" ? "bg-amber-50" : "bg-rose-50";

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      
      {/* Adwaith's-style Analysis Card */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="adwaith-card !p-8 flex flex-col relative overflow-hidden">
        <h2 className="text-xl font-black flex items-center gap-3 text-[#44475b] mb-8 uppercase tracking-wider">
          <Brain size={24} className="text-[#5367ff]" /> Smart Suggestion
        </h2>
        
        <div className="w-full flex flex-col items-center justify-center p-8 bg-gray-50 rounded-2xl border border-gray-100 mb-8 relative">
           <div className="absolute top-4 right-4 flex items-center gap-2">
             <span className={`text-[9px] font-black px-2 py-1 rounded-full uppercase ${riskBg} ${riskColor}`}>Risk: {risk?.rating || "Balanced"}</span>
           </div>
           <h3 className="text-[10px] font-black text-[#7c7e8c] uppercase tracking-widest mb-4">AI Recommendation</h3>
           <motion.div 
             animate={{ scale: [1, 1.02, 1] }} 
             transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
             className={`text-4xl font-black py-5 px-10 rounded-xl border ${signColor} transition-all duration-500 shadow-sm text-center`}
           >
             {fusion?.recommendation || "Analysing..."}
             <div className="text-[10px] font-bold uppercase tracking-wider mt-2 opacity-80">
                Confidence: {fusion?.confidence || "85%"}
             </div>
           </motion.div>

           {/* INSANE FEATURE: Buy/Hold/Sell Percentages */}
           <div className="w-full mt-6 px-4">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2">
                 <span className="text-[#00d09c]">Buy {fusion?.probabilities?.buy || 0}%</span>
                 <span className="text-gray-400">Hold {fusion?.probabilities?.hold || 0}%</span>
                 <span className="text-[#eb5b3c]">Sell {fusion?.probabilities?.sell || 0}%</span>
              </div>
              <div className="flex w-full h-3 rounded-full overflow-hidden shadow-sm">
                 <motion.div 
                   initial={{ width: 0 }} 
                   animate={{ width: `${fusion?.probabilities?.buy || 33}%` }} 
                   className="bg-[#00d09c] h-full"
                 />
                 <motion.div 
                   initial={{ width: 0 }} 
                   animate={{ width: `${fusion?.probabilities?.hold || 34}%` }} 
                   className="bg-gray-300 h-full"
                 />
                 <motion.div 
                   initial={{ width: 0 }} 
                   animate={{ width: `${fusion?.probabilities?.sell || 33}%` }} 
                   className="bg-[#eb5b3c] h-full"
                 />
              </div>
           </div>
        </div>

        {/* INSANE FEATURE: AI EXPLANATION */}
        <div className="mb-8 p-6 bg-[#5367ff]/5 rounded-2xl border border-[#5367ff]/10">
           <h4 className="text-[10px] font-black text-[#5367ff] uppercase tracking-widest mb-3 flex items-center gap-2">
             <Zap size={14} /> AI Narrative Explanation
           </h4>
           <p className="text-sm font-medium text-[#44475b] leading-relaxed italic">
             "{fusion?.ai_explanation || "The multi-source model is aggregating signals for this current market lifecycle."}"
           </p>
        </div>
        
        <div className="w-full space-y-3">
          <h4 className="text-[10px] font-black text-[#7c7e8c] uppercase tracking-widest mb-4 flex items-center gap-2">
             <Target size={12} /> Analytical Support
          </h4>
          <div className="space-y-2">
            {Array.isArray(fusion?.reasoning) ? fusion.reasoning.map((line, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-start gap-3 text-sm font-medium text-[#44475b] bg-white p-3 rounded-xl border border-gray-50 hover:border-[#00d09c]/20 transition-all"
              >
                <div className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${isBuy ? 'bg-[#00d09c]/10 text-[#00d09c]' : isSell ? 'bg-[#eb5b3c]/10 text-[#eb5b3c]' : 'bg-gray-100 text-[#7c7e8c]'}`}>
                  <CheckCircle2 size={12} />
                </div>
                <span>{line}</span>
              </motion.div>
            )) : (
              <p className="text-[#7c7e8c] text-sm italic">{fusion?.reasoning || "Compiling technical consensus..."}</p>
            )}
          </div>
        </div>
      </motion.div>

      {/* Models & News Insights */}
      <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="flex flex-col gap-6">
        
        {/* ML Models & Risk */}
        <div className="adwaith-card !p-8 group">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-black text-[#44475b] uppercase tracking-wider flex items-center gap-3">
               <Gauge size={20} className="text-[#5367ff]"/> Predictive Engine
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             <div className="flex flex-col gap-1 p-4 bg-gray-50 rounded-xl border border-gray-100 col-span-full">
                <span className="text-[10px] font-black text-[#7c7e8c] uppercase tracking-widest mb-1">Vectorized Price Target</span>
                <div className="flex items-center justify-between">
                  <span className={`text-2xl font-black ${(predictions?.lstm?.expected_increase_pct || 0) > 0 ? "text-[#00d09c]" : "text-[#eb5b3c]"}`}>
                    {(predictions?.lstm?.expected_increase_pct || 0) > 0 ? '+' : ''}{predictions?.lstm?.expected_increase_pct || 0}%
                  </span>
                  <span className="text-[11px] text-[#44475b] font-bold bg-white px-3 py-1 rounded-lg border border-gray-100">Target Forecast: ₹{predictions?.lstm?.predicted_price || "150.00"}</span>
                </div>
             </div>
             
             {/* Risk Score Display */}
             <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 col-span-full">
                <div className="flex items-center justify-between mb-3">
                   <span className="text-[10px] font-black text-[#7c7e8c] uppercase tracking-widest">Composite Risk Profile</span>
                   <span className={`text-xs font-black ${riskColor}`}>{risk?.score || 45}/100</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                   <motion.div 
                     initial={{ width: 0 }}
                     animate={{ width: `${risk?.score || 45}%` }}
                     className={`h-full ${(risk?.score || 45) > 70 ? 'bg-rose-500' : (risk?.score || 45) > 30 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                   />
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                   {(risk?.risk_factors || []).map((f, i) => (
                      <span key={i} className="text-[9px] font-bold bg-white px-2 py-0.5 rounded border border-gray-100 text-[#7c7e8c]">{f}</span>
                   ))}
                </div>
             </div>

             <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-[10px] font-black text-[#7c7e8c] uppercase tracking-widest block mb-2">Trend Direction</span>
                <div className="flex items-center gap-2 font-black text-[#44475b] text-sm uppercase">
                   <div className={`w-2 h-2 rounded-full ${predictions?.random_forest?.market_direction === 'Bullish' ? 'bg-[#00d09c]' : 'bg-[#eb5b3c]'}`}></div>
                   {predictions?.random_forest?.market_direction || "Neutral"}
                </div>
                <span className="text-[10px] font-bold text-[#5367ff] block mt-1">{predictions?.random_forest?.confidence || 0}% Accuracy</span>
             </div>
             <div className="p-4 bg-gray-100/50 rounded-xl border border-gray-100">
                <span className="text-[10px] font-black text-[#7c7e8c] uppercase tracking-widest block mb-2">Buy Density</span>
                <span className="text-xl font-black text-[#44475b]">{predictions?.gradient_boosting?.probability_of_increase_pct || 0}%</span>
                <div className="w-full h-1 bg-gray-200 rounded-full mt-2 overflow-hidden">
                   <div className="h-full bg-[#00d09c]" style={{ width: `${predictions?.gradient_boosting?.probability_of_increase_pct || 0}%` }}></div>
                </div>
             </div>
          </div>
        </div>

        {/* Sentiment Analysis Node */}
        <div className="adwaith-card !p-8 border-l-4 border-l-[#5367ff]">
          <h2 className="text-lg font-black text-[#44475b] uppercase tracking-wider mb-6 flex items-center gap-3">
             <Newspaper size={20} className="text-[#5367ff]" /> Sentiment Intelligence
          </h2>
          
          <div className="bg-gray-50 p-5 rounded-xl mb-8 relative italic font-medium text-[#44475b] text-sm border border-gray-100 leading-relaxed shadow-sm">
             <Info size={14} className="absolute -top-2 -left-2 text-[#5367ff] bg-white rounded-full shadow-sm" />
             "{news?.headline || "Decoding global market headlines..."}"
          </div>
          
          <div className="space-y-6">
            {/* Financial News (FinBERT) */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-black text-[#7c7e8c] uppercase tracking-widest flex items-center gap-2">
                  <Brain size={12} className="text-[#5367ff]"/> Financial News (FinBERT)
                </span>
                <span className={`text-[10px] font-black ${(news?.sources?.financial_news?.score || 0) > 0 ? 'text-[#00d09c]' : 'text-[#eb5b3c]'}`}>
                  Score: {news?.sources?.financial_news?.score || 0}
                </span>
              </div>
              <div className="flex h-1.5 w-full rounded-full overflow-hidden bg-gray-100">
                <div className="bg-[#00d09c] h-full" style={{ width: `${news?.sources?.financial_news?.positive || 0}%` }}></div>
                <div className="bg-gray-300 h-full" style={{ width: `${news?.sources?.financial_news?.neutral || 100}%` }}></div>
                <div className="bg-[#eb5b3c] h-full" style={{ width: `${news?.sources?.financial_news?.negative || 0}%` }}></div>
              </div>
            </div>

            {/* X Corp (Twitter) Intelligence */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-black text-[#7c7e8c] uppercase tracking-widest flex items-center gap-2">
                  <Share2 size={12} className="text-[#1DA1F2]"/> X Corp. Sentiment
                </span>
                <span className="text-[9px] font-bold text-[#7c7e8c]">Vol: {((news?.sources?.twitter_x?.volume || 0)/1000).toFixed(1)}k mentions</span>
              </div>
              <div className="flex h-1.5 w-full rounded-full overflow-hidden bg-gray-100">
                <div className="bg-[#00d09c] h-full" style={{ width: `${news?.sources?.twitter_x?.positive || 0}%` }}></div>
                <div className="bg-gray-300 h-full" style={{ width: `${news?.sources?.twitter_x?.neutral || 100}%` }}></div>
                <div className="bg-[#eb5b3c] h-full" style={{ width: `${news?.sources?.twitter_x?.negative || 0}%` }}></div>
              </div>
            </div>

            {/* Reddit Hype Tracker */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-black text-[#7c7e8c] uppercase tracking-widest flex items-center gap-2">
                   <Activity size={12} className="text-[#FF4500]"/> Reddit r/wallstreetbets
                </span>
                <span className="text-[9px] font-black text-[#5367ff] bg-[#5367ff]/5 px-2 py-0.5 rounded border border-[#5367ff]/10">
                  {news?.sources?.reddit_wsb?.hype_level || "Neutral"}
                </span>
              </div>
              <div className="flex h-1.5 w-full rounded-full overflow-hidden bg-gray-100">
                <div className="bg-[#00d09c] h-full" style={{ width: `${news?.sources?.reddit_wsb?.positive || 0}%` }}></div>
                <div className="bg-gray-300 h-full" style={{ width: `${news?.sources?.reddit_wsb?.neutral || 100}%` }}></div>
                <div className="bg-[#eb5b3c] h-full" style={{ width: `${news?.sources?.reddit_wsb?.negative || 0}%` }}></div>
              </div>
            </div>

            {/* GDELT Global Monitor Integration */}
            <div className="flex items-center justify-between p-4 bg-[#5367ff]/5 rounded-xl border border-[#5367ff]/10">
               <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm">
                     <Globe size={16} className="text-[#5367ff]" />
                  </div>
                  <div className="flex flex-col">
                     <span className="text-[10px] font-black text-[#7c7e8c] uppercase tracking-widest leading-none mb-1">GDELT Global Tone</span>
                     <span className={`text-sm font-black ${(news?.sources?.gdelt_monitor?.global_tone || 0) > 0 ? 'text-[#00d09c]' : 'text-[#eb5b3c]'}`}>
                        {(news?.sources?.gdelt_monitor?.global_tone || 0) > 0 ? '+' : ''}{news?.sources?.gdelt_monitor?.global_tone || 0} Stability
                     </span>
                  </div>
               </div>
               <div className="text-right">
                  <span className="text-[10px] font-black text-[#7c7e8c] uppercase tracking-widest block leading-none mb-1">Event Intensity</span>
                  <span className="text-xs font-black text-[#44475b]">{news?.sources?.gdelt_monitor?.event_intensity || 0} / 10.0</span>
               </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-8 mt-4 border-t border-gray-100">
             <div className="flex flex-col">
                <span className="text-[10px] font-black text-[#7c7e8c] uppercase tracking-widest mb-1 leading-none">Final Weighted Sentiment</span>
                <div className="flex items-center gap-3">
                  <span className={`text-2xl font-black ${(news?.final_sentiment_score || 0) > 0 ? 'text-[#00d09c]' : 'text-[#eb5b3c]'}`}>
                    {(news?.final_sentiment_score || 0) > 0 ? '+' : ''}{news?.final_sentiment_score || 0}
                  </span>
                  <div className="h-4 w-[1px] bg-gray-200"></div>
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#00d09c]"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-[#eb5b3c]"></div>
                  </div>
                </div>
             </div>
             <motion.div 
               whileHover={{ scale: 1.05 }}
               className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-sm border ${(news?.final_sentiment_score || 0) > 0 ? "bg-[#00d09c]/10 border-[#00d09c]/20 text-[#00d09c]" : "bg-[#eb5b3c]/10 border-[#eb5b3c]/20 text-[#eb5b3c]"}`}>
                {news?.impact || "Neutral"}
             </motion.div>
          </div>
        </div>
        {/* External Data Node (FRED, FMP, OpenAI) */}
        {externalData && (
          <div className="adwaith-card !p-8 border-l-4 border-l-[#ffb100]">
            <h2 className="text-lg font-black text-[#44475b] uppercase tracking-wider mb-6 flex items-center gap-3">
               <Globe size={20} className="text-[#ffb100]" /> Macro & Fundamentals
            </h2>

            {/* FMP Data Block */}
            {externalData.fmp && (
              <div className="mb-6 bg-gray-50 rounded-xl p-5 border border-gray-100 shadow-sm relative overflow-hidden">
                <div className="flex items-center gap-2 mb-4 relative z-10">
                  <TrendingUp size={16} className="text-[#00d09c]" />
                  <span className="text-[10px] font-black text-[#7c7e8c] uppercase tracking-widest">Financial Modeling Prep</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold text-[#7c7e8c] uppercase">Rev Growth</span>
                    <span className={`text-sm font-black ${externalData.fmp.revenue_growth >= 0 ? 'text-[#00d09c]':'text-[#eb5b3c]'}`}>
                      {externalData.fmp.revenue_growth >= 0 ? '+' : ''}{externalData.fmp.revenue_growth}%
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold text-[#7c7e8c] uppercase">P/E Ratio</span>
                    <span className="text-sm font-black text-[#44475b]">{externalData.fmp.pe_ratio}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold text-[#7c7e8c] uppercase">EPS</span>
                    <span className="text-sm font-black text-[#44475b]">${externalData.fmp.earnings_per_share}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold text-[#7c7e8c] uppercase">Free Cash Flow</span>
                    <span className="text-sm font-black text-[#44475b]">${externalData.fmp.free_cash_flow}M</span>
                  </div>
                </div>
              </div>
            )}

            {/* FRED Data Block */}
            {externalData.fred && (
               <div className="mb-6 rounded-xl overflow-hidden border border-gray-100 shadow-sm">
                 <div className="bg-[#44475b] p-3 flex items-center gap-2">
                   <Target size={14} className="text-[#ffb100]" />
                   <span className="text-[10px] font-black text-white uppercase tracking-widest">Federal Reserve Economic Data</span>
                 </div>
                 <div className="bg-white p-4 grid grid-cols-3 gap-2">
                    <div className="text-center">
                       <span className="block text-[9px] font-bold text-[#7c7e8c] uppercase mb-1">Interest Rate</span>
                       <span className="block text-sm font-black text-[#eb5b3c]">{externalData.fred.interest_rate}%</span>
                    </div>
                    <div className="text-center border-l border-r border-gray-100">
                       <span className="block text-[9px] font-bold text-[#7c7e8c] uppercase mb-1">Inflation</span>
                       <span className="block text-sm font-black text-[#ffb100]">{externalData.fred.inflation_rate}%</span>
                    </div>
                    <div className="text-center">
                       <span className="block text-[9px] font-bold text-[#7c7e8c] uppercase mb-1">GDP Growth</span>
                       <span className="block text-sm font-black text-[#00d09c]">{externalData.fred.gdp_growth}%</span>
                    </div>
                 </div>
               </div>
            )}

            {/* OpenAI Block */}
            {externalData.openai && (
               <div className="p-5 bg-gradient-to-br from-[#ebf5ff] to-white rounded-xl border border-blue-100 shadow-sm relative">
                  <div className="flex justify-between items-start mb-3">
                     <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest flex items-center gap-2">
                       <Brain size={14} className="text-blue-500" /> OpenAI Alpha Reasoning
                     </span>
                     <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${
                        externalData.openai.sentiment === 'Bullish' ? 'bg-[#00d09c]/10 text-[#00d09c]' :
                        externalData.openai.sentiment === 'Bearish' ? 'bg-[#eb5b3c]/10 text-[#eb5b3c]' : 'bg-gray-100 text-[#7c7e8c]'
                     }`}>
                        {externalData.openai.sentiment}
                     </span>
                  </div>
                  <p className="text-sm text-[#44475b] font-medium leading-relaxed italic border-l-2 border-blue-300 pl-3">
                    "{externalData.openai.ai_reasoning}"
                  </p>
               </div>
            )}
          </div>
        )}
        
      </motion.div>
    </div>
  );
}
