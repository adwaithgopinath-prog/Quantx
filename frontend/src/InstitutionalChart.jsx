import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType } from 'lightweight-charts';

export default function InstitutionalChart({ 
  data, 
  livePrice, 
  chartType = 'CANDLE', 
  showMA20 = true, 
  showMA200 = false 
}) {
  const chartContainerRef = useRef(null);
  const [chartApi, setChartApi] = useState(null);
  const seriesRef = useRef(null);
  const ma20Ref = useRef(null);
  const ma200Ref = useRef(null);
  const lastTimeRef = useRef(null);

  // Initialize Chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const width = chartContainerRef.current.clientWidth || 800;
    const height = chartContainerRef.current.clientHeight || 400;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#060810' },
        textColor: '#8a9ab5',
      },
      grid: {
        vertLines: { color: 'rgba(30, 35, 51, 0.1)' },
        horzLines: { color: 'rgba(30, 35, 51, 0.1)' },
      },
      width: width,
      height: height,
      timeScale: {
        borderColor: 'rgba(201, 168, 76, 0.1)',
        timeVisible: true,
      },
      rightPriceScale: {
        borderColor: 'rgba(201, 168, 76, 0.1)',
        autoScale: true,
      },
      crosshair: {
        mode: 0,
        vertLine: { color: '#C9A84C', labelBackgroundColor: '#C9A84C' },
        horzLine: { color: '#C9A84C', labelBackgroundColor: '#C9A84C' },
      },
    });

    setChartApi(chart);

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ 
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight
        });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []);

  // Update Series when Data or Chart Type changes
  useEffect(() => {
    if (!chartApi || typeof chartApi.addCandlestickSeries !== 'function') return;

    // Clear existing series safely
    try {
      if (seriesRef.current) chartApi.removeSeries(seriesRef.current);
      if (ma20Ref.current) chartApi.removeSeries(ma20Ref.current);
      if (ma200Ref.current) chartApi.removeSeries(ma200Ref.current);
    } catch (e) {
      console.warn("Series removal failed:", e);
    }
    
    seriesRef.current = null;
    ma20Ref.current = null;
    ma200Ref.current = null;

    // Prepare data
    const formattedData = (Array.isArray(data) ? data : []).map(d => {
      let time = d.Date || d.time || d.date;
      if (typeof time === 'string') time = time.split('T')[0];
      
      return {
        time: time,
        open: parseFloat(d.Open || d.open || 0),
        high: parseFloat(d.High || d.high || 0),
        low: parseFloat(d.Low || d.low || 0),
        close: parseFloat(d.Close || d.close || 0),
      };
    }).filter(d => d.time && !isNaN(d.close) && d.close > 0).sort((a, b) => {
      const ta = new Date(a.time).getTime();
      const tb = new Date(b.time).getTime();
      return ta - tb;
    });

    // Remove duplicates by time
    const uniqueData = [];
    const seenTimes = new Set();
    for (const d of formattedData) {
      if (!seenTimes.has(d.time)) {
        uniqueData.push(d);
        seenTimes.add(d.time);
      }
    }

    // Fallback mock data if empty
    let finalData = uniqueData;
    if (finalData.length === 0) {
      finalData = Array.from({ length: 100 }).map((_, i) => ({
        time: new Date(Date.now() - (100 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        open: 1300 + Math.random() * 50,
        high: 1360 + Math.random() * 50,
        low: 1280 + Math.random() * 50,
        close: 1320 + Math.random() * 50,
      }));
    }

    try {
      if (chartType === 'CANDLE') {
        seriesRef.current = chartApi.addCandlestickSeries({
          upColor: '#00E5A0',
          downColor: '#FF3D5A',
          borderVisible: false,
          wickUpColor: '#00E5A0',
          wickDownColor: '#FF3D5A',
        });
        seriesRef.current.setData(finalData);
      } else {
        seriesRef.current = chartApi.addLineSeries({
          color: '#C9A84C',
          lineWidth: 2,
        });
        const lineData = finalData.map(d => ({ time: d.time, value: d.close }));
        seriesRef.current.setData(lineData);
      }

      lastTimeRef.current = finalData[finalData.length - 1];

      // Add Moving Averages
      if (showMA20) {
        ma20Ref.current = chartApi.addLineSeries({
          color: '#00E5A0',
          lineWidth: 1,
          lineStyle: 2,
          title: 'MA20',
        });
        const ma20Data = calculateMA(finalData, 20);
        ma20Ref.current.setData(ma20Data);
      }

      if (showMA200) {
        ma200Ref.current = chartApi.addLineSeries({
          color: '#C9A84C',
          lineWidth: 1,
          lineStyle: 2,
          title: 'MA200',
        });
        const ma200Data = calculateMA(finalData, 200);
        ma200Ref.current.setData(ma200Data);
      }

      chartApi.timeScale().fitContent();
    } catch (e) {
      console.error("Chart data application failed:", e);
    }
  }, [chartApi, data, chartType, showMA20, showMA200]);

  // Update last candle with live price
  useEffect(() => {
    if (seriesRef.current && livePrice && livePrice.price && lastTimeRef.current) {
      try {
        const price = parseFloat(livePrice.price);
        if (isNaN(price)) return;
        
        if (chartType === 'CANDLE') {
          seriesRef.current.update({
            time: lastTimeRef.current.time,
            open: lastTimeRef.current.open,
            high: Math.max(lastTimeRef.current.high, price),
            low: Math.min(lastTimeRef.current.low, price),
            close: price,
          });
        } else {
          seriesRef.current.update({
            time: lastTimeRef.current.time,
            value: price,
          });
        }
      } catch (e) {
        console.warn("Live update failed:", e);
      }
    }
  }, [livePrice, chartType]);

  return <div ref={chartContainerRef} className="w-full h-full min-h-[300px]" />;
}

function calculateMA(data, period) {
  const result = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period) continue;
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += data[i - j].close;
    }
    result.push({ time: data[i].time, value: sum / period });
  }
  return result;
}
