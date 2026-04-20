import React, { useEffect, useRef, useState } from 'react';

export default function InstitutionalChart({ data, livePrice }) {
  const canvasRef = useRef(null);
  const [visibleCandles, setVisibleCandles] = useState(0);

  const defaultData = Array.from({length: 250}).map((_, i) => ({
    Open: 150 + Math.sin(i*0.1)*10,
    High: 150 + Math.sin(i*0.1)*10 + Math.random()*5,
    Low: 150 + Math.sin(i*0.1)*10 - Math.random()*5,
    Close: 150 + Math.sin((i+0.5)*0.1)*10,
    Volume: Math.random()*1000
  }));

  const chartData = (data && data.length > 0) ? data : defaultData;

  useEffect(() => {
    setVisibleCandles(0);
    const interval = setInterval(() => {
      setVisibleCandles(prev => {
        if (prev >= chartData.length) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 20); // sped up load time since there's more candles
    return () => clearInterval(interval);
  }, [data, chartData.length]);

  const [tickOffset, setTickOffset] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      if (livePrice?.price) {
        setTickOffset(livePrice.price - (chartData[chartData.length-1]?.Close || 0));
      } else {
         setTickOffset((Math.random() - 0.5) * 5);
      }
    }, 1800);
    return () => clearInterval(interval);
  }, [livePrice, chartData]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const candleWidth = w / Math.max(chartData.length, 1);
    const currentData = chartData.slice(0, visibleCandles);
    
    if (currentData.length === 0) return;

    let min = Math.min(...chartData.map(d => d.Low || d.Close - 5));
    let max = Math.max(...chartData.map(d => d.High || d.Close + 5));

    // Volume background bars
    const maxVol = Math.max(...chartData.map(d => d.Volume || 1));
    currentData.forEach((d, i) => {
      const isUp = d.Close >= d.Open;
      const color = isUp ? 'rgba(0, 229, 160, 0.15)' : 'rgba(255, 61, 90, 0.15)';
      const cw = candleWidth * 0.8;
      const x = i * candleWidth + candleWidth*0.1;
      const volH = (d.Volume / maxVol) * 60; // Up to 60px height
      ctx.fillStyle = color;
      ctx.fillRect(x, h - volH, cw, volH);
    });

    const drawSMA = (period, color) => {
       ctx.beginPath();
       ctx.strokeStyle = color;
       ctx.lineWidth = 1;
       ctx.setLineDash([2, 4]);
       currentData.forEach((d, i) => {
          const closes = currentData.slice(Math.max(0, i - period + 1), i + 1).map(x => x.Close);
          const sma = closes.reduce((a,b)=>a+b,0)/closes.length;
          const x = i * candleWidth + candleWidth/2;
          const y = h - ((sma - min) / (max - min) * (h - 20)) - 10;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
       });
       ctx.stroke();
       ctx.setLineDash([]);
    };

    drawSMA(20, '#00e5a0'); // SMA 20 in bullish green
    drawSMA(50, '#f0d080'); // SMA 50 in gold
    drawSMA(200, '#8a9ab5'); // SMA 200 in silver

    currentData.forEach((d, i) => {
      const isLast = i === chartData.length - 1;
      let close = d.Close;
      if (isLast) close += tickOffset;

      const isUp = close >= d.Open;
      const color = isUp ? '#00e5a0' : '#ff3d5a';

      const x = i * candleWidth + candleWidth*0.1;
      const cw = candleWidth * 0.8;
      
      const pxHigh = h - ((d.High - min) / (max - min) * (h - 20)) - 10;
      const pxLow = h - ((d.Low - min) / (max - min) * (h - 20)) - 10;
      const pxOpen = h - ((d.Open - min) / (max - min) * (h - 20)) - 10;
      const pxClose = h - ((close - min) / (max - min) * (h - 20)) - 10;

      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.moveTo(x + cw/2, pxHigh);
      ctx.lineTo(x + cw/2, pxLow);
      ctx.stroke();

      ctx.fillStyle = color;
      ctx.fillRect(x, Math.min(pxOpen, pxClose), cw, Math.max(Math.abs(pxOpen - pxClose), 1));
    });

  }, [visibleCandles, chartData, tickOffset]);

  return (
    <div className="w-full h-64 border border-[var(--color-panel-border)] bg-[#03040a] rounded overflow-hidden">
      <canvas ref={canvasRef} width={800} height={256} className="w-full h-full" />
    </div>
  );
}
