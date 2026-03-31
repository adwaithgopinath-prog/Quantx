import React, { useState, useMemo } from 'react';
import { TrendingUp, RefreshCw, BarChart3, LineChart as LineChartIcon, Maximize2 } from 'lucide-react';
import { ComposedChart, Bar, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Candle = (props) => {
  const { x, y, width, height, low, high, open, close } = props;
  if (x === undefined || y === undefined) return null;

  const isUp = close >= open;
  const color = isUp ? '#00d09c' : '#eb5b3c';
  const candleWidth = Math.max(width * 0.6, 2);
  const xOffset = (width - candleWidth) / 2;

  const absChange = Math.abs(open - close) || 0.01;
  const pixelPerUnit = height / absChange;
  
  const highDiff = high - Math.max(open, close);
  const lowDiff = Math.min(open, close) - low;
  
  const wickTopY = y - (highDiff * pixelPerUnit);
  const wickBottomY = y + height + (lowDiff * pixelPerUnit);

  return (
    <g>
      <line
        x1={x + width / 2}
        y1={wickTopY}
        x2={x + width / 2}
        y2={wickBottomY}
        stroke={color}
        strokeWidth={1}
      />
      <rect
        x={x + xOffset}
        y={y}
        width={candleWidth}
        height={Math.max(height, 1)}
        fill={color}
        rx={1}
      />
    </g>
  );
};

export default function ChartPanel({ data, symbol }) {
  const [view, setView] = useState('area'); 

  const chartData = useMemo(() => {
    return data.map(d => ({
      ...d,
      candle: [d.open, d.close],
    }));
  }, [data]);

  if (!data || data.length === 0) return (
    <div className="p-12 min-h-[400px] flex flex-col items-center justify-center gap-4 bg-white rounded-xl">
       <div className="w-8 h-8 border-3 border-[#00d09c]/20 border-t-[#00d09c] rounded-full animate-spin"></div>
       <p className="text-[#7c7e8c] font-bold text-xs uppercase tracking-widest text-center">Opening Live Charts...</p>
    </div>
  );

  return (
    <div className="w-full h-full p-4">
      
      <div className="flex items-center justify-between mb-6 px-2">
        <div className="flex items-center gap-4">
           <div className="flex bg-[#f0f3f7] p-1 rounded-lg">
              <button 
                onClick={() => setView('area')}
                className={`px-3 py-1.5 rounded-md text-[10px] font-black transition-all ${view === 'area' ? 'bg-white text-[#44475b] shadow-sm' : 'text-[#7c7e8c] hover:text-[#44475b]'}`}
              >
                LINE
              </button>
              <button 
                onClick={() => setView('candle')}
                className={`px-3 py-1.5 rounded-md text-[10px] font-black transition-all ${view === 'candle' ? 'bg-white text-[#44475b] shadow-sm' : 'text-[#7c7e8c] hover:text-[#44475b]'}`}
              >
                CANDLE
              </button>
           </div>
           <span className="text-[10px] font-bold text-[#7c7e8c] uppercase tracking-widest bg-gray-50 px-2 py-1 rounded">1D</span>
           <span className="text-[10px] font-bold text-[#7c7e8c] uppercase tracking-widest bg-gray-50 px-2 py-1 rounded">1W</span>
           <span className="text-[10px] font-bold text-[#7c7e8c] uppercase tracking-widest bg-gray-50 px-2 py-1 rounded">1M</span>
        </div>
        <div className="flex gap-2">
           <button className="p-2 text-[#7c7e8c] hover:text-[#00d09c] hover:bg-emerald-50 rounded-lg transition-all">
              <Maximize2 size={16} />
           </button>
           <button className="p-2 text-[#7c7e8c] hover:text-[#5367ff] hover:bg-indigo-50 rounded-lg transition-all">
              <RefreshCw size={16} />
           </button>
        </div>
      </div>

      <div className="w-full h-[320px] relative">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00d09c" stopOpacity={0.15}/>
                <stop offset="95%" stopColor="#00d09c" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f3f7" vertical={false} />
            <XAxis dataKey="time" hide={true} />
            <YAxis 
              stroke="#e2e4e7" 
              domain={['auto', 'auto']} 
              tick={{fontSize: 9, fontWeight: 700, fill: '#7c7e8c'}} 
              tickLine={false} 
              axisLine={false} 
              tickFormatter={(value) => `₹${value}`}
            />
            <Tooltip 
              cursor={{ stroke: '#e2e4e7', strokeWidth: 1 }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload;
                  return (
                    <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-xl min-w-[120px]">
                      <p className="text-[9px] text-[#7c7e8c] font-bold uppercase tracking-widest mb-2 border-b border-gray-50 pb-1">{d.time}</p>
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-[#7c7e8c] font-bold text-[9px]">CLOSE</span>
                          <span className="text-[#44475b] font-black">₹{d.close}</span>
                        </div>
                        {view === 'candle' && (
                          <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-1 pt-1 border-t border-gray-50">
                             <div className="text-[8px] text-[#00d09c] font-bold">H: ₹{d.high}</div>
                             <div className="text-[8px] text-[#eb5b3c] font-bold text-right">L: ₹{d.low}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            
            {view === 'candle' ? (
              <Bar 
                dataKey="candle" 
                shape={<Candle />}
                animationDuration={800}
              />
            ) : (
              <Area 
                type="monotone" 
                dataKey="close" 
                stroke="#00d09c" 
                strokeWidth={2.5} 
                fillOpacity={1} 
                fill="url(#colorArea)" 
                animationDuration={800}
                activeDot={{ r: 4, fill: "#00d09c", strokeWidth: 2, stroke: "#fff" }}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 flex flex-wrap gap-x-8 gap-y-2 px-4">
        {[ { label: 'Open', key: 'open', color: '#7c7e8c' }, { label: 'High', key: 'high', color: '#00d09c' }, { label: 'Low', key: 'low', color: '#eb5b3c' }, { label: 'Volume', key: 'volume', color: '#5367ff' }].map(item => (
           <div key={item.label} className="flex flex-col gap-0.5">
              <span className="text-[9px] font-bold text-[#7c7e8c] uppercase tracking-wider">{item.label}</span>
              <span className="text-xs font-black text-[#44475b] tracking-tight">
                {item.key === 'volume' ? (data[0][item.key] / 1000000).toFixed(1) + 'M' : '₹' + data[0][item.key]}
              </span>
           </div>
        ))}
      </div>
    </div>
  );
}
