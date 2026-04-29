import random
import pandas as pd
from datetime import datetime, timedelta

# List of plausible prominent Indian stock symbols to use in the mock
SYMBOLS = [
    "RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "INFY.NS", "ICICIBANK.NS", 
    "HINDUNILVR.NS", "ITC.NS", "SBIN.NS", "BHARTIARTL.NS", "KOTAKBANK.NS",
    "BAJFINANCE.NS", "LT.NS", "ASIANPAINT.NS", "AXISBANK.NS", "MARUTI.NS",
    "SUNPHARMA.NS", "TITAN.NS", "WIPRO.NS", "ULTRACEMCO.NS", "TATASTEEL.NS",
    "POWERGRID.NS", "NTPC.NS", "BAJAJFINSV.NS", "M&M.NS", "LTIM.NS",
    "ADANIENTS.NS", "ADANIPORTS.NS", "ONGC.NS", "DRREDDY.NS", "HCLTECH.NS",
    "JSWSTEEL.NS", "GRASIM.NS", "CIPLA.NS", "SBILIFE.NS",
    "HDFCLIFE.NS", "BRITANNIA.NS", "TECHM.NS", "APOLLOHOSP.NS", "EICHERMOT.NS",
    "INDUSINDBK.NS", "DIVISLAB.NS", "BPCL.NS", "HEROMOTOCO.NS", "TATARETAIL.NS"
]

class MockScreenerEngine:
    def __init__(self):
        self.assets = self._generate_mock_universe()

    def _generate_mock_universe(self):
        assets = []
        bases = [random.uniform(20, 100), random.uniform(100, 500), random.uniform(500, 2500), random.uniform(2500, 8000)]
        
        # Create ~100 assets (mix of real symbols and generated ones)
        for i in range(100):
            if i < len(SYMBOLS):
                symbol = SYMBOLS[i]
            else:
                symbol = f"ASSET{i}.NS"
                
            base_price = random.choice(bases) + random.uniform(-10, 10)
            if base_price < 5:
                base_price = 5
                
            volatility = random.uniform(0.01, 0.05)
            
            # Generate 30 days of mini-chart history
            history = []
            curr_price = base_price * random.uniform(0.8, 1.2)
            for d in range(30, 0, -1):
                date = (datetime.now() - timedelta(days=d)).strftime("%Y-%m-%d")
                curr_price = curr_price * (1 + random.uniform(-volatility, volatility))
                history.append({"time": date, "price": round(curr_price, 2)})
            
            current_price = history[-1]["price"]
            prev_price = history[-2]["price"]
            change = current_price - prev_price
            change_pct = (change / prev_price) * 100

            # Generate AI composite stats
            ai_score = random.uniform(30, 98)
            sentiment_score = random.uniform(20, 95)
            risk_score = random.uniform(10, 80)
            volume = random.randint(100000, 15000000)
            
            # Momentum
            rsi = random.uniform(20, 80)
            macd = "Bullish" if ai_score > 60 else "Bearish"

            req_rec = "Hold"
            composite = (ai_score * 0.4) + (sentiment_score * 0.3) - (risk_score * 0.1) + (rsi * 0.1)
            
            if composite > 65:
                req_rec = "Strong Buy"
            elif composite > 50:
                req_rec = "Buy"
            elif composite < 30:
                req_rec = "Sell"
                
            assets.append({
                "symbol": symbol,
                "name": symbol.split('.')[0] + " Corp",
                "current_price": round(current_price, 2),
                "change_pct": round(change_pct, 2),
                "ai_score": round(ai_score, 1),
                "sentiment_score": round(sentiment_score, 1),
                "risk_score": round(risk_score, 1),
                "volume": volume,
                "rsi": round(rsi, 1),
                "macd": macd,
                "recommendation": req_rec,
                "composite_score": composite,
                "mini_chart": history,
                "sector": random.choice(["Tech", "Finance", "Energy", "Healthcare", "Consumer", "Auto"])
            })
        return assets

    def get_top_assets(self, min_price: float, max_price: float, sector: str = None, limit: int = 10):
        from app.services.data_fetcher import is_market_open
        market_open = is_market_open()
        
        filtered = [a for a in self.assets if min_price <= a["current_price"] <= max_price]
        if sector and sector != "All":
            filtered = [a for a in filtered if a["sector"] == sector]
            
        # Sort by the composite score
        sorted_assets = sorted(filtered, key=lambda x: x["composite_score"], reverse=True)
        
        results = sorted_assets[:limit]
        for a in results:
            a["market_open"] = market_open
            
        return results

# Global instance
screener_engine = MockScreenerEngine()
