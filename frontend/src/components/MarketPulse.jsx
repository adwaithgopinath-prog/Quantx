import React from 'react';
import { motion } from 'framer-motion';
import { Activity, Globe, Server, Database, ArrowUpRight, ArrowDownRight, RefreshCcw } from 'lucide-react';

export default function MarketPulse({ state }) {
  if (!state || !state.global_metrics) return null;

  const { global_metrics, sector_data, source_health, last_sync } = state;

  return (
    <div className="space-y-6">
      <div className="groww-card !p-8 border-l-4 border-l-[#00d09c]">
        <div className="flex justify-between items-center mb-8">
           <h2 className="text-xl font-black text-[#44475b] uppercase tracking-wider flex items-center gap-3">
             <Globe size={24} className="text-[#00d09c]" /> Global Market Pulse
           </h2>
           <div className="flex items-center gap-2 text-[10px] font-black text-[#7c7e8c] bg-gray-50 px-3 py-1 rounded-full border border-gray-100 uppercase">
             <RefreshCcw size={10} className="animate-spin text-[#00d09c]" /> 
             Sync: {new Date(last_sync).toLocaleTimeString()}
           </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
           {[
             { label: 'VIX Volatility', val: global_metrics.vix_index, sub: 'Stability Index' },
             { label: 'Fear & Greed', val: global_metrics.fgi_index, sub: 'Market Sentiment' },
             { label: 'Advancers', val: global_metrics.advancers, sub: 'Daily Up', color: 'text-[#00d09c]' },
             { label: 'Decliners', val: global_metrics.decliners, sub: 'Daily Down', color: 'text-[#eb5b3c]' }
           ].map((stat, i) => (
             <div key={i} className="flex flex-col gap-1 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <span className="text-[10px] font-black text-[#7c7e8c] uppercase tracking-widest">{stat.label}</span>
                <span className={`text-2xl font-black ${stat.color || 'text-[#44475b]'}`}>{stat.val}</span>
                <span className="text-[8px] font-bold text-[#7c7e8c] uppercase">{stat.sub}</span>
             </div>
           ))}
        </div>

        <div className="space-y-4">
           <h3 className="text-[10px] font-black text-[#7c7e8c] uppercase tracking-widest flex items-center gap-2">
             <Server size={14} className="text-[#5367ff]" /> Ingestion Health
           </h3>
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {Object.entries(global_metrics?.source_health || {}).map(([source, status], i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl">
                   <span className="text-[10px] font-bold text-[#44475b] uppercase">{source.replace('_', ' ')}</span>
                   <span className="text-[9px] font-black text-[#00d09c] bg-[#00d09c]/10 px-2 py-0.5 rounded uppercase">
                     {status}
                   </span>
                </div>
              ))}
           </div>
        </div>
      </div>

      <div className="groww-card !p-8">
         <h2 className="text-xl font-black text-[#44475b] uppercase tracking-wider mb-8 flex items-center gap-3">
           <Database size={24} className="text-[#5367ff]" /> Sector Rotation
         </h2>
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {(sector_data || []).map((sector, i) => (
              <motion.div 
                key={i} 
                whileHover={{ y: -5 }}
                className="p-5 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col gap-3 group cursor-pointer"
              >
                 <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold text-[#44475b] max-w-[100px] leading-tight group-hover:text-[#5367ff] transition-colors">{sector.sector}</span>
                    <div className={`flex items-center gap-1 text-xs font-black ${(sector.change || 0) >= 0 ? 'text-[#00d09c]' : 'text-[#eb5b3c]'}`}>
                      {(sector.change || 0) >= 0 ? <ArrowUpRight size={14}/> : <ArrowDownRight size={14}/>}
                      {sector.change || 0}%
                    </div>
                 </div>
                 <div className="pt-3 border-t border-gray-200">
                    <span className="text-[9px] font-bold text-[#7c7e8c] uppercase block mb-1">Top Leader</span>
                    <span className="text-[10px] font-black text-[#44475b]">{sector.top_performer}</span>
                 </div>
              </motion.div>
            ))}
         </div>
      </div>
      {/* Feature Engineering Pipeline Stats */}
      <div className="groww-card !p-8 border-l-4 border-l-[#5367ff]">
         <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-black text-[#44475b] uppercase tracking-wider flex items-center gap-3">
              <RefreshCcw size={24} className="text-[#5367ff]" /> Predictive Ingestion Pipeline
            </h2>
            <div className="flex gap-2">
               <span className="text-[9px] font-black bg-[#5367ff]/10 text-[#5367ff] px-3 py-1 rounded-full uppercase">CSV Output Active</span>
            </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
               <span className="text-[10px] font-black text-[#7c7e8c] uppercase tracking-widest block mb-2">Training Rows Collected</span>
               <div className="flex items-center gap-3">
                  <span className="text-3xl font-black text-[#44475b]">{state.pipeline_stats?.total_rows || 0}</span>
                  <div className="h-6 w-[1px] bg-gray-300"></div>
                  <span className="text-[10px] font-bold text-[#7c7e8c] uppercase">Dataset Growth</span>
               </div>
            </div>

            <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
               <span className="text-[10px] font-black text-[#7c7e8c] uppercase tracking-widest block mb-2">Active Feature Vector</span>
               <div className="flex items-center gap-3">
                  <span className="text-3xl font-black text-[#44475b]">{state.pipeline_stats?.feature_count || 14}</span>
                  <div className="h-6 w-[1px] bg-gray-300"></div>
                  <span className="text-[10px] font-bold text-[#7c7e8c] uppercase">Densely Mapped</span>
               </div>
            </div>

            <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
               <span className="text-[10px] font-black text-[#7c7e8c] uppercase tracking-widest block mb-2">Avg Pipe Sentiment</span>
               <div className="flex items-center gap-3">
                  <span className={`text-3xl font-black ${(state.pipeline_stats?.avg_sentiment || 0) > 0 ? 'text-[#00d09c]' : 'text-[#eb5b3c]'}`}>
                    {(state.pipeline_stats?.avg_sentiment || 0) > 0 ? '+' : ''}{state.pipeline_stats?.avg_sentiment || 0}
                  </span>
                  <div className="h-6 w-[1px] bg-gray-300"></div>
                  <span className="text-[10px] font-bold text-[#7c7e8c] uppercase">Global Bias</span>
               </div>
            </div>
         </div>

         <div className="mt-6 flex items-center justify-between p-4 bg-[#5367ff]/5 rounded-xl border border-[#5367ff]/10">
            <div className="flex items-center gap-3">
               <div className="w-2 h-2 rounded-full bg-[#5367ff] animate-pulse"></div>
               <span className="text-xs font-bold text-[#44475b]">Pipeline Status: Aggregating Multi-Source signals into training_dataset.csv</span>
            </div>
            <span className="text-[10px] font-black text-[#7c7e8c] uppercase tracking-widest">
               Last Event: {state.pipeline_stats?.last_update ? new Date(state.pipeline_stats.last_update).toLocaleTimeString() : 'Awaiting Request...'}
            </span>
         </div>
      </div>
    </div>
  );
}
