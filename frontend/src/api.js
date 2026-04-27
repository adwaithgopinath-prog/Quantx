// Central API configuration
// Set VITE_API_URL in your Vercel environment variables to your Render backend URL
// e.g. https://your-quantx-backend.onrender.com

export const API_BASE = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8001").replace(/\/$/, "");
export const WS_BASE = API_BASE.replace("https", "wss").replace("http", "ws");

// Configured axios instance with timeout so the app never hangs on a slow/sleeping backend
import axios from "axios";

const api = axios.create({
  baseURL: API_BASE,
  timeout: 60000, // 60s
});

// Global error handler (Issue 7)
import toast from "react-hot-toast";

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED') {
      toast.error("Request timed out. Server might be waking up.");
    } else if (!error.response) {
      toast.error("Network Error. Check your connection.");
    } else if (error.response.status >= 500) {
      toast.error("Internal Server Error. Please try again later.");
    }
    return Promise.reject(error);
  }
);

export default api;
