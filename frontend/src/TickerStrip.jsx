import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function IndexTickerBar({ state }) {
  // Use real state if passed, otherwise fall back to dummy/mock data
  const indices = state?.indices || [
    { name: 'NIFTY 50', value: '22,514.65', change: '+1.24', changePercent: '+0.55%' },
    { name: 'SENSEX', value: '74,248.22', change: '+354.45', changePercent: '+0.48%' },
    { name: 'BANK NIFTY', value: '47,944.40', change: '-120.30', changePercent: '-0.25%' },
    { name: 'NIFTY NEXT 50', value: '62,230.15', change: '+412.10', changePercent: '+0.67%' }
  ];

  return (
    <div className="fixed top-[60px] left-0 z-[90] w-full bg-[#0d0f12] border-b border-[#1e2333] px-6 py-2 flex items-center justify-between overflow-x-auto hide-scrollbar shadow-lg">
       <div className="flex gap-4 w-full">
         {indices.map((idx, i) => {
            const isPositive = idx.changePercent?.startsWith('+');
            return (
              <div key={i} className="flex-1 flex justify-between items-center bg-[#141720] border border-[#1e2333] rounded-lg px-4 py-2 min-w-[200px]">
                 <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-[#8a9ab5] font-mono tracking-widest">{idx.name}</span>
                    <span className="text-sm font-bold text-white font-sans">{idx.value}</span>
                 </div>
                 <div className={`flex flex-col items-end ${isPositive ? 'text-[#00e676]' : 'text-[#ff4444]'}`}>
                    <div className="flex items-center gap-1 text-[11px] font-bold font-sans">
                      {isPositive ? <ArrowUpRight size={12}/> : <ArrowDownRight size={12}/>}
                      {idx.changePercent}
                    </div>
                 </div>
              </div>
            );
         })}
       </div>
    </div>
  );
}
