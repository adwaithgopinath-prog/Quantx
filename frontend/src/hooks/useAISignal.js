/**
 * useAISignal.js
 * Custom hook — fetches the AI signal + fusion data for a given symbol.
 * Returns the recommendation, confidence, sentiment, and narrative.
 */
import { useState, useEffect, useCallback } from 'react';
import { getAISignal } from '../api/aiApi';

export function useAISignal(symbol) {
  const [signal,  setSignal]  = useState(null);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async (sym) => {
    if (!sym) return;
    setLoading(true);
    try {
      const res = await getAISignal(sym);
      const fusion = res.data?.fusion || {};
      setSignal({
        recommendation: fusion.recommendation        || 'HOLD',
        confidence:     fusion.recommendation_score  || 0.71,
        sentiment:      fusion.sentiment              || 0.0,
        narrative:      fusion.ai_explanation         || '',
        riskScore:      res.data?.risk?.score         || 50,
        macd:           res.data?.indicators?.macd   || null,
        rsi:            res.data?.indicators?.rsi    || null,
        raw:            res.data,
      });
    } catch {
      setSignal(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(symbol); }, [symbol, fetch]);

  return { signal, loading, refetch: () => fetch(symbol) };
}
