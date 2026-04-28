/**
 * marketApi.js — abstracted calls for market data
 * All CRUD against the FastAPI backend's /api/market/* routes
 */
import apiClient from '../api';
import toast from 'react-hot-toast';

const marketCall = async (call) => {
  try {
    const response = await call();
    return response;
  } catch (error) {
    if (!error.response) {
      toast.error("Connecting to markets... (Backend might be waking up)");
      throw new Error("NETWORK_ERROR");
    } else {
      toast.error("Failed to load market data");
      throw new Error("DATA_ERROR");
    }
  }
};

export const getMarketEngine = () => marketCall(() => apiClient.get('/api/market/engine'));
export const getPipelineStats = () => marketCall(() => apiClient.get('/api/pipeline/stats'));
export const getTrending = () => marketCall(() => apiClient.get('/api/market/trending'));
export const getDashboard = (symbol) => marketCall(() => apiClient.get(`/api/dashboard/${symbol}`));
export const getBacktest = (symbol) => marketCall(() => apiClient.get(`/api/backtest/${symbol}`));
export const getScreener = (minPrice, maxPrice, sector) =>
  marketCall(() => apiClient.get('/api/screener', { params: { min_price: minPrice, max_price: maxPrice, sector } }));
