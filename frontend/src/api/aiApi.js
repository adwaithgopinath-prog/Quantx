/**
 * aiApi.js — abstracted calls for AI signal endpoints
 */
import apiClient from '../api';

export const getAISignal = (symbol)               => apiClient.get(`/api/dashboard/${symbol}`);
export const getChat     = (symbol, query)        => apiClient.get('/api/chat', { params: { symbol, query } });
