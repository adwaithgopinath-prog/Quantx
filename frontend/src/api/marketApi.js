/**
 * marketApi.js — abstracted calls for market data
 * All CRUD against the FastAPI backend's /api/market/* routes
 */
import apiClient from '../api';

export const getMarketEngine = ()                          => apiClient.get('/api/market/engine');
export const getPipelineStats = ()                         => apiClient.get('/api/pipeline/stats');
export const getTrending = ()                              => apiClient.get('/api/market/trending');
export const getDashboard = (symbol)                       => apiClient.get(`/api/dashboard/${symbol}`);
export const getBacktest  = (symbol)                       => apiClient.get(`/api/backtest/${symbol}`);
export const getScreener  = (minPrice, maxPrice, sector)  =>
  apiClient.get('/api/screener', { params: { min_price: minPrice, max_price: maxPrice, sector } });
