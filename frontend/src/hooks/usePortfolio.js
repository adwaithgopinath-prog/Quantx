/**
 * usePortfolio.js
 * Custom hook — manages portfolio state, trade execution, and analytics.
 */
import { useState, useEffect, useCallback } from 'react';
import { getPortfolio, getPortfolioAnalytics, executeTrade } from '../api/portfolioApi';

export function usePortfolio(symbol, livePrice, currentPrice) {
  const [portfolio,  setPortfolio]  = useState(null);
  const [analytics,  setAnalytics]  = useState(null);
  const [tradeAmount, setTradeAmount] = useState(1);
  const [tradeSide,   setTradeSide]   = useState('BUY');

  const totalNAV = portfolio?.positions
    ? portfolio.positions.reduce((acc, pos) =>
        acc + pos.quantity * (pos.symbol === symbol && livePrice ? livePrice.price : (pos.current_price || pos.avg_price)), 0
      ) + (portfolio.balance || 0)
    : 0;

  const fetchPortfolio = useCallback(async () => {
    try {
      const res = await getPortfolio();
      setPortfolio(res.data);
    } catch {}
  }, []);

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await getPortfolioAnalytics(0.05);
      setAnalytics(res.data);
    } catch {}
  }, []);

  const handleTrade = useCallback(async (side, price) => {
    try {
      const execPrice = price || livePrice?.price || currentPrice || 150;
      await executeTrade(symbol, side, parseInt(tradeAmount) || 1, execPrice);
      await fetchPortfolio();
      await fetchAnalytics();
    } catch (err) {
      alert(err?.response?.data?.detail || 'Trade failed');
    }
  }, [symbol, livePrice, currentPrice, tradeAmount, fetchPortfolio, fetchAnalytics]);

  useEffect(() => {
    fetchPortfolio();
    fetchAnalytics();
  }, [symbol, fetchPortfolio, fetchAnalytics]);

  return {
    portfolio, analytics, totalNAV,
    tradeAmount, setTradeAmount,
    tradeSide, setTradeSide,
    handleTrade, refetchPortfolio: fetchPortfolio,
  };
}
