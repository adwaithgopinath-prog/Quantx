# 🚀 QuantX - Insane AI Trading Platform

QuantX is a high-performance, real-time stock trading and analysis platform designed by **Adwaith**. It combines institutional-grade technical analysis, AI-driven insights, and a sleek, glassmorphic UI to provide a premium trading experience.

---

## 🔥 Key Features

*   **⚡ Real-Time Ticker Stream**: WebSocket-powered live price updates for 50+ major Indian (NSE/BSE) and Global stocks.
*   **📊 Institutional Charts**: Professional-grade candle charts with built-in moving averages (SMA 20/50/200).
*   **🤖 AI Analysis Engine**: Integrated AI chat that analyzes specific stock technicals, news sentiment, and fundamentals in real-time.
*   **🏗️ Backtesting Suite**: Test your strategies (like RSI) against 2 years of historical data with detailed results on win rates and returns.
*   **💼 Portfolio Tracker**: Manage virtual holdings, track real-time P&L, and analyze portfolio risk scores.
*   **📱 Glassmorphic UI**: Ultra-premium, dark-mode design with smooth animations and responsive layout.

---

## 🛠️ Technology Stack

### **Frontend**
- **React (Vite)**: Ultra-fast UI development and rendering.
- **Tailwind CSS**: Modern, utility-first styling for a premium look.
- **Framer Motion**: Smooth, cinematic micro-interactions and transitions.
- **Recharts**: Advanced data visualization for history and metrics.
- **Lucide Icons**: Crisp, professional iconography.

### **Backend**
- **FastAPI**: High-performance Python framework for low-latency API and WebSockets.
- **YFinance**: Reliable integration for major market data and historical analysis.
- **Scikit-Learn/SciPy**: Powering the advanced technical indicators and predictive models.
- **APScheduler**: Background market engine for syncing sector and sentiment data.

---

## 🚀 Quick Start (Local Development)

### **1. Clone & Setup Backend**
```bash
cd backend
python -m venv venv
source venv/bin/scripts/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### **2. Setup Frontend**
```bash
cd frontend
npm install
npm run dev
```

---

## 🌍 Deployment Guide

### **Backend (Render Recommended)**
1. Host the `backend` folder as a **Web Service** on [Render.com](https://render.com/).
2. Set the `PORT` environment variable (Render provides this automatically).
3. Ensure you have the latest `requirements.txt` installed.

### **Frontend (Vercel)**
1. Host the `frontend` folder as a project on [Vercel.com](https://vercel.app).
2. **CRITICAL**: Add an environment variable `VITE_API_URL` pointing to your Render backend URL.
3. Redeploy your frontend to pick up the new API URL.

---

## 💡 Configuration
To ensure perfect connectivity between frontend and backend in all environments:
*   The frontend uses a centralized `api.js` to normalize the API base URL.
*   The backend respects the `PORT` environment variable for cloud hosting compatibility.

---

## 👨‍💻 Powered by Adwaith
QuantX was built to demonstrate the power of modern web technologies combined with real-time financial data processing. 
