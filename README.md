# 🚀 QuantX - Insane AI Trading Platform

QuantX is a high-performance, real-time stock trading and analysis platform designed by **Adwaith**. It combines institutional-grade technical analysis, AI-driven insights, and a sleek, glassmorphic UI to provide a premium trading experience.

---

## 🎨 DESIGN SYSTEM
- **Theme:** Dark mode only. Background: `#0d0f12`, Cards: `#141720`, Borders: `#1e2333`
- **Accent color:** Neon green `#00e676` for buy/positive, Red `#ff4444` for sell/negative, Orange `#ff9800` for neutral/risk
- **Font:** Space Grotesk for headings, Inter for data/numbers
- **Layout:** Fixed left sidebar (280px) + main content area with top index ticker bar
- **Cards:** Rounded corners `border-radius: 12px`, subtle border, dark background
- **Logo:** "QuantX" with "AI TERMINAL" badge in green below it, teal-green square avatar

---

## 🗂️ PAGES & FEATURES

### 1. 📊 MARKET PULSE PAGE (`/market-pulse`)
**Top Index Bar (always visible across all pages):**
- Show 4 live index cards: NIFTY 50, SENSEX, BANK NIFTY, NIFTY NEXT 50
- Each card shows: current value + % change (green if positive, red if negative)
- Data source: Yahoo Finance API (`yfinance` Python library or `yahoo-finance` npm package)

**Global Market Pulse Section:**
- **Card: VIX VOLATILITY** — fetch India VIX (`^INDIAVIX`) — show value + label "STABILITY INDEX"
- **Card: FEAR & GREED** — compute a 0–100 score from: VIX level, advance/decline ratio, RSI average of top 50 stocks. Show label "MARKET SENTIMENT"
- **Card: ADVANCERS** — count of NSE stocks up today. Show label "DAILY UP" in green
- **Card: DECLINERS** — count of NSE stocks down today. Show label "DAILY DOWN" in red
- "SYNC: HH:MM:SS AM" timestamp top right, auto-refresh every 60 seconds

**Ingestion Health Section:**
4 status pills showing data source connectivity:
- YAHOO FINANCE → ONLINE (REST API) in green
- ALPHA VANTAGE → READY (INTRA-DAY ENGINE) in green
- POLYGON IO → READY (TICK REPLAY) in green
- NEWS SCRAPER → ACTIVE - 5 CHANNELS in green
*(Each pill is dynamically checked via a backend health-check endpoint)*

**Sector Rotation Section:**
- 8 sector cards in a 4x2 grid: Technology, Financial Services, Energy, Healthcare, Consumer Cyclical, Basic Materials, Industrials, Communication Services
- Each card shows: sector name, % change today (green arrow up or red arrow down), and "TOP LEADER: [TICKER]"

**Predictive Ingestion Pipeline Section:**
3 stat cards:
- **TRAINING ROWS COLLECTED** — count of rows in training CSV
- **ACTIVE FEATURE VECTOR** — number of features being tracked
- **AVG PIPE SENTIMENT** — average sentiment score across all data
- Pipeline status bar at bottom: "Pipeline Status: Aggregating Multi-Source signals into training_dataset.csv"

### 2. 🖥️ AI TERMINAL PAGE (`/ai-terminal`)
**Left panel — Live Monitor:**
- Shows a list of actively monitored stocks with RSI value and BUY/SELL signal badge

**Main Content — Stock Detail View:**
- Stock header: Name, exchange, sector, series, current price, % change
- 3 tabs: **TECHNICAL CHART** | **MARKET DEPTH** | **FUNDAMENTALS**

**Technical Chart Tab:**
- Interactive chart (using lightweight-charts or recharts)
- Toggle buttons: LINE / CANDLE
- Timeframe buttons: 1D / 1W / 1M
- Overlay toggles: MA20 / MA50 / MA200

**Technical Indicator Stream:**
- **RSI (14)** — value + label + progress bar
- **MACD (12,26,9)** — MACD Line value, Signal value, crossover label
- **MA 50 VS 200** — show both MA values, crossover status
- **BOLLINGER BANDS** — UPPER and LOWER band values + label
- **EMA (20)** — Exponential mean price
- **PATTERN AI** — detected candlestick pattern & confidence %

**Right Panel — Trade Panel:**
- BUY / SELL toggle tabs
- PORTFOLIO BALANCE
- Price field (editable) & Total Amount calculation
- Large CTA button: BUY [STOCKNAME] in green

### 3. ⚡ AI SIGNALS PAGE (`/ai-signals`)
**Left Panel — Smart Suggestion:**
- Large card: **AI RECOMMENDATION** (STRONG BUY / BUY / HOLD / SELL / STRONG SELL)
- Confidence % & Risk badge (LOW/MEDIUM/HIGH)
- Horizontal bar: BUY X% | HOLD X% | SELL X%

**AI Narrative Explanation Box:**
- Italic quote text explaining why the AI recommends what it does (Forecasting models, MACD, sentiment, risk profile)
- Analytical Support Bullets detailing indicators and sentiment

**Right Panel — Predictive Engine:**
- **VECTORIZED PRICE TARGET** — % change forecast
- **COMPOSITE RISK PROFILE** — score /100
- **TREND DIRECTION** — BULLISH / BEARISH dot indicator
- **BUY DENSITY** — % of buyers vs sellers

**Sentiment Intelligence Panel:**
- FINANCIAL NEWS (FINBERT)
- X CORP. SENTIMENT
- REDDIT r/WALLSTREETBETS
- GDELT GLOBAL TONE
- FINAL WEIGHTED SENTIMENT score

### 4. 🔍 AI ASSET SCREENER
- **Header:** "AI Asset Screener — TOP 10 AI-RANKED ASSETS BY PRICE RANGE"
- **Filter buttons:** Penny | Mid | Large | Bluechip | Custom Range | Sector dropdown
- **Table columns:** ASSET NAME, PRICE & CHANGE, AI SCORE, SENTIMENT & RISK, TREND (30D), ACTION

### 5. 💼 PORTFOLIO / INVESTMENTS VIEW PAGE (`/portfolio`)
- **3 Main Stat Cards:** CASH BALANCE, TOTAL EQUITY, TOTAL P&L
- **Portfolio Analytics Section:** EXPECTED RETURN (ANN.), PORTFOLIO RISK (STD DEV), SHARPE RATIO
- **Portfolio Optimization Engine:** MAX SHARPE ALLOCATION & MINIMUM RISK ALLOCATION algorithms

### 6. 📋 ORDERS PAGE (`/orders`)
- Table of all buy/sell orders (Date, Ticker, Type, Price, Shares, Status)
- Filters by date range, ticker, and status

---

## 🏗️ TECHNICAL ARCHITECTURE

### Frontend (React + Vite)
```text
/src
  /pages
    MarketPulse.jsx, AITerminal.jsx, AISignals.jsx, Portfolio.jsx, Orders.jsx
  /components
    Sidebar.jsx, IndexTickerBar.jsx, TechnicalChart.jsx, TradePanel.jsx, ...
```

### Backend (Node.js + Express)
```text
/server
  /routes
    market.js, signals.js, portfolio.js, orders.js, health.js
  /services
    yahooFinance.js, alphaVantage.js, newsScraper.js, openaiService.js, ...
```

### Python AI Engine (FastAPI or Flask)
```text
/ai_engine
  main.py, indicators.py, sentiment.py, screener.py, portfolio_optimizer.py, predictor.py
```

---

## 📦 KEY LIBRARIES & APIS

**Frontend**
- `react`, `react-router-dom` — routing
- `lightweight-charts` — TradingView-style charts
- `recharts` — sparklines and mini charts
- `axios` — API calls | `lucide-react` — icons

**Backend (Node.js)**
- `express`, `cors`, `dotenv`
- `yahoo-finance2` — live Indian stock data
- `openai` — OpenAI API for stock narrative

**Python AI Engine**
- `fastapi`, `uvicorn`
- `yfinance` — stock data
- `pandas`, `numpy`, `scipy`
- `ta` or `pandas-ta` — Technical indicators
- `transformers` + `ProsusAI/finbert` — FinBERT sentiment

---

## 🔌 API INTEGRATIONS
| Source | Purpose | Free? |
|--------|---------|-------|
| **Yahoo Finance** | Live NSE/BSE prices, history | ✅ Free |
| **Alpha Vantage** | Intraday tick data | ✅ Free tier |
| **Polygon.io** | Tick replay, market depth | Paid |
| **OpenAI GPT-4** | AI narrative, stock analysis | Paid |
| **HuggingFace** | News sentiment scoring | ✅ Free |
| **Reddit PRAW** | r/wallstreetbets sentiment | ✅ Free |
| **GDELT** | Global news tone | ✅ Free |

---

## 🗄️ DATABASE
**SQLite (local) / PostgreSQL (production)**
- `users`: id, name, email, tier, balance
- `portfolio`: user_id, ticker, shares, avg_buy_price, added_at
- `orders`: id, user_id, ticker, type, price, shares, status
- `watchlist` | `signals_cache` | `market_cache`

---

## ⚙️ ENVIRONMENT VARIABLES (`.env`)
```env
OPENAI_API_KEY=your_key
ALPHA_VANTAGE_KEY=your_key
POLYGON_API_KEY=your_key
REDDIT_CLIENT_ID=your_id
REDDIT_CLIENT_SECRET=your_secret
DATABASE_URL=sqlite:///quantx.db
PORT=3001
PYTHON_AI_URL=http://localhost:8000
```

---

## 🚀 HOW TO START

```bash
# 1. Start Python AI Engine
cd ai_engine
pip install -r requirements.txt
uvicorn main:app --port 8000 --reload

# 2. Start Node.js Backend
cd server
npm install
npm run dev   # runs on port 3001

# 3. Start React Frontend
cd client
npm install
npm run dev   # runs on port 5173
```

---

## ✅ DELIVERABLE CHECKLIST
- [ ] Dark theme UI matching all screenshots exactly
- [ ] All 5 pages working with routing
- [ ] Live NSE data via Yahoo Finance
- [ ] AI Signals with real technical indicators
- [ ] FinBERT sentiment integration
- [ ] OpenAI GPT narrative in AI Signals
- [ ] Portfolio CRUD with real P&L calculation
- [ ] Sharpe ratio & covariance portfolio analytics
- [ ] AI Asset Screener with price range filtering
- [ ] Sector rotation grid
- [ ] Predictive ingestion pipeline with CSV export
- [ ] Orders table
- [ ] Data source health checks
- [ ] Responsive layout (desktop first)
