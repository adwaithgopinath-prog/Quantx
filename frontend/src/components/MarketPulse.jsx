import React from 'react';
import { motion } from 'framer-motion';
import { Activity, Globe, Server, Database, ArrowUpRight, ArrowDownRight, RefreshCcw, Cpu } from 'lucide-react';

export default function MarketPulse({ state }) {
  if (!state || !state.global_metrics) return null;

  const { global_metrics, sector_data, source_health, last_sync } = state;

  return (
    <div className="space-y-6">
      {/* Global Market Pulse */}
      <div className="bg-[#141720] border border-[#1e2333] rounded-xl p-6">
        <div className="flex justify-between items-center mb-6">
           <h2 className="text-xl text-white font-[Space_Grotesk] font-bold uppercase tracking-wider flex items-center gap-3">
             <Globe size={24} className="text-[#00e676]" /> Global Market Pulse
           </h2>
           <div className="flex items-center gap-2 text-xs font-mono text-[#8a9ab5] bg-[#0d0f12] px-3 py-1 rounded-md border border-[#1e2333] uppercase">
             <RefreshCcw size={12} className="animate-spin text-[#00e676]" /> 
             Sync: {last_sync ? new Date(last_sync).toLocaleTimeString() : 'Awaiting...'}
           </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
           {[
             { label: 'VIX Volatility', val: global_metrics.vix_index, sub: 'STABILITY INDEX' },
             { label: 'Fear & Greed', val: global_metrics.fgi_index, sub: 'MARKET SENTIMENT' },
             { label: 'Advancers', val: global_metrics.advancers, sub: 'DAILY UP', color: 'text-[#00e676]' },
             { label: 'Decliners', val: global_metrics.decliners, sub: 'DAILY DOWN', color: 'text-[#ff4444]' }
           ].map((stat, i) => (
             <div key={i} className="flex flex-col gap-1 p-4 bg-[#0d0f12] rounded-lg border border-[#1e2333]">
                <span className="text-xs font-semibold text-[#8a9ab5] uppercase tracking-wider font-[Space_Grotesk]">{stat.label}</span>
                <span className={`text-2xl font-bold font-sans ${stat.color || 'text-white'}`}>{stat.val}</span>
                <span className="text-[10px] font-bold text-gray-500 uppercase">{stat.sub}</span>
             </div>
           ))}
        </div>

        <div className="space-y-3">
           <h3 className="text-xs font-bold text-[#8a9ab5] uppercase tracking-widest flex items-center gap-2 font-[Space_Grotesk]">
             <Server size={14} className="text-[#8a9ab5]" /> Ingestion Health
           </h3>
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {Object.entries(global_metrics?.source_health || {}).map(([source, status], i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-[#0d0f12] border border-[#1e2333] rounded-lg">
                   <span className="text-xs font-semibold text-gray-300 uppercase">{source.replace('_', ' ')}</span>
                   <span className="text-[10px] font-bold text-[#00e676] bg-[#00e676]/10 px-2 py-0.5 rounded uppercase">
                     {status}
                   </span>
                </div>
              ))}
           </div>
        </div>
      </div>

      {/* Sector Rotation */}
      <div className="bg-[#141720] border border-[#1e2333] rounded-xl p-6">
         <h2 className="text-xl text-white font-[Space_Grotesk] font-bold uppercase tracking-wider mb-6 flex items-center gap-3">
           <Database size={24} className="text-[#ff9800]" /> Sector Rotation
         </h2>
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {(sector_data || []).map((sector, i) => (
              <motion.div 
                key={i} 
                whileHover={{ y: -4 }}
                className="p-4 bg-[#0d0f12] rounded-lg border border-[#1e2333] flex flex-col gap-3 group cursor-pointer"
              >
                 <div className="flex justify-between items-start">
                    <span className="text-[11px] font-semibold text-gray-300 max-w-[100px] leading-tight group-hover:text-white transition-colors">{sector.sector}</span>
                    <div className={`flex items-center gap-1 text-xs font-bold font-sans ${(sector.change || 0) >= 0 ? 'text-[#00e676]' : 'text-[#ff4444]'}`}>
                      {(sector.change || 0) >= 0 ? <ArrowUpRight size={14}/> : <ArrowDownRight size={14}/>}
                      {sector.change || 0}%
                    </div>
                 </div>
                 <div className="pt-3 border-t border-[#1e2333]">
                    <span className="text-[9px] font-bold text-[#8a9ab5] uppercase block mb-1">Top Leader</span>
                    <span className="text-[11px] font-bold text-white uppercase">{sector.top_performer}</span>
                 </div>
              </motion.div>
            ))}
         </div>
      </div>

      {/* Feature Engineering Pipeline Stats */}
      <div className="bg-[#141720] border border-[#1e2333] rounded-xl p-6 relative overflow-hidden">
         <div className="absolute top-0 left-0 w-1 h-full bg-[#00e676]"></div>
         <div className="flex justify-between items-center mb-6 pl-2">
            <h2 className="text-xl text-white font-[Space_Grotesk] font-bold uppercase tracking-wider flex items-center gap-3">
              <Cpu size={24} className="text-[#00e676]" /> Predictive Ingestion Pipeline
            </h2>
            <div className="flex gap-2">
               <span className="text-[10px] font-bold bg-[#00e676]/10 text-[#00e676] px-3 py-1 rounded-full uppercase border border-[#00e676]/20">CSV Output Active</span>
            </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pl-2">
            <div className="p-4 bg-[#0d0f12] rounded-lg border border-[#1e2333]">
               <span className="text-xs font-semibold text-[#8a9ab5] uppercase tracking-wider block mb-2 font-[Space_Grotesk]">Training Rows Collected</span>
               <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-white font-sans">{state.pipeline_stats?.total_rows || 0}</span>
                  <div className="h-6 w-[1px] bg-[#1e2333]"></div>
                  <span className="text-[10px] font-bold text-gray-500 uppercase">Dataset Growth</span>
               </div>
            </div>

            <div className="p-4 bg-[#0d0f12] rounded-lg border border-[#1e2333]">
               <span className="text-xs font-semibold text-[#8a9ab5] uppercase tracking-wider block mb-2 font-[Space_Grotesk]">Active Feature Vector</span>
               <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-white font-sans">{state.pipeline_stats?.feature_count || 14}</span>
                  <div className="h-6 w-[1px] bg-[#1e2333]"></div>
                  <span className="text-[10px] font-bold text-gray-500 uppercase">Densely Mapped</span>
               </div>
            </div>

            <div className="p-4 bg-[#0d0f12] rounded-lg border border-[#1e2333]">
               <span className="text-xs font-semibold text-[#8a9ab5] uppercase tracking-wider block mb-2 font-[Space_Grotesk]">Avg Pipe Sentiment</span>
               <div className="flex items-center gap-3">
                  <span className={`text-2xl font-bold font-sans ${(state.pipeline_stats?.avg_sentiment || 0) > 0 ? 'text-[#00e676]' : 'text-[#ff4444]'}`}>
                    {(state.pipeline_stats?.avg_sentiment || 0) > 0 ? '+' : ''}{state.pipeline_stats?.avg_sentiment || 0}
                  </span>
                  <div className="h-6 w-[1px] bg-[#1e2333]"></div>
                  <span className="text-[10px] font-bold text-gray-500 uppercase">Global Bias</span>
               </div>
            </div>
         </div>

         <div className="mt-6 ml-2 flex items-center justify-between p-3 bg-[#0d0f12] rounded-lg border border-[#1e2333]">
            <div className="flex items-center gap-3">
               <div className="w-2 h-2 rounded-full bg-[#00e676] animate-pulse"></div>
               <span className="text-xs font-semibold text-gray-300">Pipeline Status: Aggregating Multi-Source signals into training_dataset.csv</span>
            </div>
            <span className="text-[10px] font-bold text-[#8a9ab5] uppercase tracking-widest font-mono">
               Last Event: {state.pipeline_stats?.last_update ? new Date(state.pipeline_stats.last_update).toLocaleTimeString() : 'Awaiting Request...'}
            </span>
         </div>
      </div>
    </div>
  );
}
