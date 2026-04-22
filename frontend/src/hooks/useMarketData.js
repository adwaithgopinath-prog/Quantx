/**
 * useMarketData.js
 * Custom hook — fetches market engine state and live dashboard data for a symbol.
 * WebSocket for live price, REST for history + indicators.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { WS_BASE } from '../api';
import { getMarketEngine, getPipelineStats, getDashboard, getBacktest } from '../api/marketApi';

export function useMarketData(symbol) {
  const [data,          setData]          = useState(null);
  const [backtest,      setBacktest]      = useState(null);
  const [marketEngine,  setMarketEngine]  = useState(null);
  const [livePrice,     setLivePrice]     = useState(null);
  const [loading,       setLoading]       = useState(true);
  const wsRef = useRef(null);

  // ── Fetch dashboard (history + indicators + fusion) ─────────────────────────
  const fetchDashboard = useCallback(async (sym) => {
    setLoading(true);
    try {
      const [dashRes, btRes] = await Promise.all([getDashboard(sym), getBacktest(sym)]);
      setData(dashRes.data);
      setBacktest(btRes.data);
    } catch {
      setData({ error: 'Connection Error' });
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Fetch market engine (macro, sectors, indices) ────────────────────────────
  const fetchMarketEngine = useCallback(async () => {
    try {
      const [engRes, pipeRes] = await Promise.all([getMarketEngine(), getPipelineStats()]);
      setMarketEngine({ ...engRes.data, pipeline_stats: pipeRes.data });
    } catch {}
  }, []);

  // ── WebSocket live price ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!symbol) return;
    wsRef.current?.close();
    const ws = new WebSocket(`${WS_BASE}/ws/ticker/${symbol}`);
    ws.onmessage = (e) => setLivePrice(JSON.parse(e.data));
    ws.onerror   = () => {};
    wsRef.current = ws;
    return () => ws.close();
  }, [symbol]);

  // ── Trigger dashboard fetch on symbol change ─────────────────────────────────
  useEffect(() => { fetchDashboard(symbol); }, [symbol, fetchDashboard]);

  // ── Poll market engine every 60s ─────────────────────────────────────────────
  useEffect(() => {
    fetchMarketEngine();
    const id = setInterval(fetchMarketEngine, 60_000);
    return () => clearInterval(id);
  }, [fetchMarketEngine]);

  return { data, backtest, marketEngine, livePrice, loading, refetch: () => fetchDashboard(symbol) };
}
