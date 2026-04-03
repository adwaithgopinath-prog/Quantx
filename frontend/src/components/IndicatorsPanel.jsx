import React from 'react';
import { TrendingUp, TrendingDown, Activity, AlertCircle, Zap, ShieldAlert, Target, BarChart3, Layers } from 'lucide-react';
import { motion } from 'framer-motion';

export default function IndicatorsPanel({ indicators, patterns }) {
  if (!indicators) return null;

  return (
    <div className="w-full h-full p-2">
      <h2 className="text-sm font-black text-[#44475b] flex items-center gap-3 mb-6 uppercase tracking-wider">
        <Activity size={18} className="text-[#5367ff]" /> Technical Indicator Stream
      </h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Momentum: RSI */}
        <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100 hover:border-[#5367ff]/20 transition-all flex flex-col justify-between h-36">
          <div className="text-[10px] font-black text-[#7c7e8c] uppercase tracking-widest mb-2 flex items-center gap-2">
            RSI (14) <div className="h-[1px] flex-1 bg-gray-200"></div>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-3xl font-black text-[#44475b] tracking-tight">{indicators.rsi}</p>
            <span className={`text-[9px] font-black px-2.5 py-1 rounded-lg border ${indicators.rsi_signal === 'Overbought' ? 'bg-[#eb5b3c]/5 border-[#eb5b3c]/20 text-[#eb5b3c]' : indicators.rsi_signal === 'Oversold' ? 'bg-[#00d09c]/5 border-[#00d09c]/20 text-[#00d09c]' : 'bg-gray-100 border-gray-200 text-[#7c7e8c]'} uppercase tracking-wider`}>
              {indicators.rsi_signal}
            </span>
          </div>
          <div className="w-full bg-gray-200 h-1 rounded-full overflow-hidden mt-3">
             <div className="bg-[#5367ff] h-full" style={{ width: `${indicators.rsi}%` }}></div>
          </div>
        </div>

        {/* Trend Momentum: MACD */}
        <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100 hover:border-[#5367ff]/20 transition-all flex flex-col justify-between h-36">
          <div className="text-[10px] font-black text-[#7c7e8c] uppercase tracking-widest mb-2 flex items-center gap-2">
            MACD (12,26,9) <div className="h-[1px] flex-1 bg-gray-200"></div>
          </div>
          <div className="flex flex-col gap-1">
             <div className="flex justify-between items-center text-xs font-black">
                <span className="text-[#7c7e8c]">MACD Line</span>
                <span className="text-[#44475b]">{indicators.macd?.value || 0}</span>
             </div>
             <div className="flex justify-between items-center text-xs font-black">
                <span className="text-[#7c7e8c]">Signal</span>
                <span className="text-[#44475b]">{indicators.macd?.signal_line || 0}</span>
             </div>
          </div>
          <span className={`text-[9px] font-black py-1 px-2 rounded w-fit uppercase tracking-widest ${(indicators.macd?.sentiment || "").includes('Bullish') ? 'bg-[#00d09c]/10 text-[#00d09c]' : 'bg-[#eb5b3c]/10 text-[#eb5b3c]'}`}>
            {indicators.macd?.sentiment || "SYNCING"}
          </span>
        </div>

        {/* Trend: MA 50 & 200 */}
        <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100 hover:border-[#5367ff]/20 transition-all flex flex-col justify-between h-36">
          <div className="text-[10px] font-black text-[#7c7e8c] uppercase tracking-widest mb-2 flex items-center gap-2">
            MA 50 vs 200 <div className="h-[1px] flex-1 bg-gray-200"></div>
          </div>
          <div className="flex flex-col gap-1">
             <div className="flex justify-between items-center text-xs font-black">
                <span className="text-[#7c7e8c]">50 MA</span>
                <span className="text-[#44475b]">₹{indicators.moving_averages?.ma50 || 0}</span>
             </div>
             <div className="flex justify-between items-center text-xs font-black">
                <span className="text-[#7c7e8c]">200 MA</span>
                <span className="text-[#44475b]">₹{indicators.moving_averages?.ma200 || 0}</span>
             </div>
          </div>
          <div className={`text-[9px] font-black py-1 px-2 rounded w-fit uppercase tracking-widest ${(indicators.moving_averages?.trend || "").includes('Golden') ? 'bg-[#00d09c]/10 text-[#00d09c]' : 'bg-[#eb5b3c]/10 text-[#eb5b3c]'}`}>
            {indicators.moving_averages?.trend || "SYNCING"}
          </div>
        </div>

        {/* Volatility: Bollinger Bands */}
        <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100 hover:border-[#5367ff]/20 transition-all flex flex-col justify-between h-36">
          <div className="text-[10px] font-black text-[#7c7e8c] uppercase tracking-widest mb-2 flex items-center gap-2">
            Bollinger Bands <div className="h-[1px] flex-1 bg-gray-200"></div>
          </div>
          <div className="flex flex-col gap-1">
             <div className="flex justify-between text-[10px] font-bold text-[#7c7e8c]">
                <span>UPPER</span>
                <span>LOWER</span>
             </div>
             <div className="flex justify-between text-sm font-black text-[#44475b]">
                <span>₹{indicators.bollinger?.upper || 0}</span>
                <span>₹{indicators.bollinger?.lower || 0}</span>
             </div>
          </div>
          <span className="text-[9px] font-black text-[#5367ff] uppercase bg-[#5367ff]/5 px-2 py-0.5 rounded w-fit">
            {indicators.bollinger?.signal || "SCANNING"}
          </span>
        </div>

        {/* Trend: Exponential Moving Average */}
        <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100 hover:border-[#5367ff]/20 transition-all flex flex-col justify-between h-36">
          <div className="text-[10px] font-black text-[#7c7e8c] uppercase tracking-widest mb-2 flex items-center gap-2">
            EMA (20) <div className="h-[1px] flex-1 bg-gray-200"></div>
          </div>
          <div className="flex items-center justify-between mt-2">
             <div className="flex flex-col">
                <span className="text-[9px] font-black text-[#7c7e8c] uppercase">Exp. Mean</span>
                <span className="text-2xl font-black text-[#44475b]">₹{indicators.moving_averages?.ema20 || 0}</span>
             </div>
             <Activity size={24} className="text-[#5367ff]/30" />
          </div>
          <span className="text-[9px] font-bold text-[#7c7e8c] uppercase mt-2">Weight prioritizes recent price</span>
        </div>

        {/* Pattern Recognition AI */}
        <div className="bg-[#5367ff]/5 p-5 rounded-2xl border border-[#5367ff]/10 hover:bg-[#5367ff]/10 transition-all flex flex-col justify-between h-36">
          <div className="text-[10px] font-black text-[#5367ff] uppercase tracking-widest mb-2 flex items-center gap-2">
            <Target size={14}/> Pattern AI <div className="h-[1px] flex-1 bg-[#5367ff]/20"></div>
          </div>
          <div>
            <p className="text-xs font-black text-[#44475b] leading-tight mb-2 uppercase">{(patterns?.pattern && patterns.pattern !== 'Scanning...') ? patterns.pattern : "Decoding Chart..."}</p>
            <div className="flex items-center justify-between mt-2 px-2 py-1 bg-white/50 rounded-lg border border-[#5367ff]/10">
              <span className="text-[9px] font-bold text-[#7c7e8c] uppercase">Confidence</span>
              <span className="text-[9px] font-black text-[#5367ff]">{patterns?.probability || "SYNCING"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
