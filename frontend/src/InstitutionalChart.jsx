import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createChart, ColorType, CrosshairMode } from 'lightweight-charts';
import { Maximize2, Minimize2, Activity, Info, Zap } from 'lucide-react';

/**
 * InstitutionalChart
 * Professional-grade technical analysis chart powered by Lightweight Charts.
 * Now featuring a built-in Fullscreen mode and enhanced 'Quantum Sync' telemetry.
 */
export default function InstitutionalChart({ 
  data, 
  livePrice, 
  chartType = 'CANDLE', 
  showMA20 = true, 
  showMA200 = false,
  symbol = 'ASSET'
}) {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const ma20Ref = useRef(null);
  const ma200Ref = useRef(null);
  const lastTimeRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Initialize Chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#060810' },
        textColor: '#8a9ab5',
        fontSize: 10,
        fontFamily: 'Inter, sans-serif',
      },
      grid: {
        vertLines: { color: 'rgba(30, 35, 51, 0.15)' },
        horzLines: { color: 'rgba(30, 35, 51, 0.15)' },
      },
      width: chartContainerRef.current.clientWidth || 800,
      height: chartContainerRef.current.clientHeight || 400,
      timeScale: {
        borderColor: 'rgba(201, 168, 76, 0.15)',
        timeVisible: true,
        secondsVisible: false,
        barSpacing: 6,
      },
      rightPriceScale: {
        borderColor: 'rgba(201, 168, 76, 0.15)',
        autoScale: true,
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: '#C9A84C', labelBackgroundColor: '#C9A84C', width: 1, style: 2 },
        horzLine: { color: '#C9A84C', labelBackgroundColor: '#C9A84C', width: 1, style: 2 },
      },
      handleScroll: true,
      handleScale: true,
    });

    chartRef.current = chart;

    const resizeObserver = new ResizeObserver(entries => {
      if (entries.length === 0 || !entries[0].contentRect) return;
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) {
        chart.applyOptions({ width, height });
      }
    });

    resizeObserver.observe(chartContainerRef.current);
    setIsReady(true);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
    };
  }, [isFullscreen]); // Re-initialize on fullscreen toggle to ensure clean resize

  // Sync Data and Indicators
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || !isReady) return;

    if (seriesRef.current) { chart.removeSeries(seriesRef.current); seriesRef.current = null; }
    if (ma20Ref.current) { chart.removeSeries(ma20Ref.current); ma20Ref.current = null; }
    if (ma200Ref.current) { chart.removeSeries(ma200Ref.current); ma200Ref.current = null; }
    
    const rawData = Array.isArray(data) ? data : [];
    const formattedData = rawData.map(d => {
      let time = d.time || d.Date || d.date;
      if (typeof time === 'string' && time.includes('T')) time = time.split('T')[0];
      
      return {
        time: time,
        open: parseFloat(d.open || d.Open || 0),
        high: parseFloat(d.high || d.High || 0),
        low: parseFloat(d.low || d.Low || 0),
        close: parseFloat(d.close || d.Close || 0),
      };
    }).filter(d => d.time && !isNaN(d.close) && d.close > 0)
      .sort((a, b) => new Date(a.time) - new Date(b.time));

    const uniqueData = [];
    const seen = new Set();
    for (const d of formattedData) {
      if (!seen.has(d.time)) {
        uniqueData.push(d);
        seen.add(d.time);
      }
    }

    let finalData = uniqueData;
    const isMockData = finalData.length === 0;

    if (isMockData) {
      const now = new Date();
      finalData = Array.from({ length: 120 }).map((_, i) => {
        const d = new Date(now);
        d.setDate(d.getDate() - (120 - i));
        const base = 1300 + Math.sin(i / 10) * 100;
        return {
          time: d.toISOString().split('T')[0],
          open: base + Math.random() * 20,
          high: base + 30 + Math.random() * 20,
          low: base - 10 + Math.random() * 20,
          close: base + 15 + Math.random() * 20,
        };
      });
    }

    try {
      if (chartType === 'CANDLE') {
        seriesRef.current = chart.addCandlestickSeries({
          upColor: '#00E5A0',
          downColor: '#FF3D5A',
          borderVisible: false,
          wickUpColor: '#00E5A0',
          wickDownColor: '#FF3D5A',
        });
        seriesRef.current.setData(finalData);
      } else {
        seriesRef.current = chart.addLineSeries({
          color: '#C9A84C',
          lineWidth: 2,
        });
        seriesRef.current.setData(finalData.map(d => ({ time: d.time, value: d.close })));
      }

      lastTimeRef.current = finalData[finalData.length - 1];

      if (showMA20 && finalData.length > 20) {
        ma20Ref.current = chart.addLineSeries({ color: '#00E5A0', lineWidth: 1, lineStyle: 2, title: 'MA20' });
        ma20Ref.current.setData(calculateMA(finalData, 20));
      }
      
      if (showMA200 && finalData.length > 200) {
        ma200Ref.current = chart.addLineSeries({ color: '#C9A84C', lineWidth: 1, lineStyle: 2, title: 'MA200' });
        ma200Ref.current.setData(calculateMA(finalData, 200));
      }

      chart.timeScale().fitContent();
    } catch (err) {
      console.error("Technical Chart Error:", err);
    }
  }, [data, chartType, showMA20, showMA200, isReady, isFullscreen]);

  // Real-time Tick Synchronization
  useEffect(() => {
    if (seriesRef.current && livePrice && livePrice.price && lastTimeRef.current) {
      const p = parseFloat(livePrice.price);
      if (isNaN(p)) return;

      try {
        if (chartType === 'CANDLE') {
          seriesRef.current.update({
            time: lastTimeRef.current.time,
            open: lastTimeRef.current.open,
            high: Math.max(lastTimeRef.current.high, p),
            low: Math.min(lastTimeRef.current.low, p),
            close: p,
          });
        } else {
          seriesRef.current.update({
            time: lastTimeRef.current.time,
            value: p,
          });
        }
      } catch {}
    }
  }, [livePrice, chartType]);

  const toggleFullscreen = () => setIsFullscreen(!isFullscreen);

  const chartContent = (
    <div className={`relative w-full h-full bg-[#060810] group ${isFullscreen ? 'fixed inset-0 z-[2000]' : ''}`}>
      <div ref={chartContainerRef} className="absolute inset-0 w-full h-full z-10" />
      
      {/* Chart Top Controls (Floating) */}
      <div className="absolute top-4 left-4 z-20 flex gap-2">
        <div className="bg-[#141720]/80 backdrop-blur-md border border-white/5 rounded-lg px-3 py-1.5 flex items-center gap-3">
          <span className="text-[10px] font-bold text-[#C9A84C] tracking-widest uppercase">{symbol.replace('.NS', '')}</span>
          <div className="w-[1px] h-3 bg-white/10" />
          <span className="text-[9px] font-mono text-gray-400">{chartType} | {data?.length || 0} BARS</span>
        </div>
      </div>

      {/* Chart Right Controls (Floating) */}
      <div className="absolute top-4 right-4 z-20 flex gap-2">
        <button 
          onClick={toggleFullscreen}
          className="bg-[#141720]/80 backdrop-blur-md border border-white/5 p-2 rounded-lg text-gray-400 hover:text-white transition-all"
          title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
        >
          {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>
      </div>

      {/* Synchronization HUD */}
      {(!data || data.length === 0) && (
        <div className="absolute top-20 right-4 flex items-center gap-3 bg-[#141720]/90 border border-[#C9A84C]/30 px-4 py-2 rounded-lg z-20 backdrop-blur-md pointer-events-none shadow-2xl">
          <div className="relative w-4 h-4">
            <div className="w-full h-full border border-[#C9A84C]/20 rounded-full" />
            <div className="w-full h-full border-t border-[#C9A84C] rounded-full animate-spin absolute inset-0" />
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-bold text-[#C9A84C] uppercase tracking-[0.2em]">Quantum Sync Active</span>
            <span className="text-[7px] text-[#8a9ab5] uppercase tracking-widest opacity-60">Reconstructing Tapes...</span>
          </div>
        </div>
      )}

      {/* Grid Lines Backdrop */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none z-0">
        <div className="w-full h-full bg-[linear-gradient(rgba(201,168,76,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(201,168,76,0.1)_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      {/* Watermark */}
      <div className="absolute bottom-16 right-6 z-0 opacity-10 pointer-events-none select-none">
         <span className="text-4xl font-bold font-heading tracking-[0.5em] text-white uppercase">QUANT<span className="text-[#C9A84C]">X</span></span>
      </div>
    </div>
  );

  return chartContent;
}

function calculateMA(data, period) {
  const res = [];
  for (let i = period - 1; i < data.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) sum += data[i - j].close;
    res.push({ time: data[i].time, value: sum / period });
  }
  return res;
}
