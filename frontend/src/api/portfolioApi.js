/**
 * portfolioApi.js — abstracted calls for portfolio + orders
 */
import apiClient from '../api';

export const getPortfolio         = ()                              => apiClient.get('/api/portfolio');
export const getPortfolioAnalytics = (rfr = 0.05)                  => apiClient.get('/api/portfolio/analytics', { params: { rfr } });
export const executeTrade         = (symbol, side, quantity, price) =>
  apiClient.post('/api/trade', { symbol, side, quantity, price });
export const getOrders            = (params = {})                  => apiClient.get('/api/orders', { params });
