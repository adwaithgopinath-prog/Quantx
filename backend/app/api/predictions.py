from fastapi import APIRouter, HTTPException, Body
import yfinance as yf
import pandas as pd
import numpy as np
import time
from datetime import datetime, timedelta
from sklearn.linear_model import LinearRegression
from typing import List, Dict, Optional
from app.services import data_fetcher

router = APIRouter()

# 6-hour cache
prediction_cache = {}
CACHE_EXPIRY = 6 * 60 * 60 

def get_cached_prediction(symbol):
    if symbol in prediction_cache:
        data, timestamp = prediction_cache[symbol]
        if time.time() - timestamp < CACHE_EXPIRY:
            return data
    return None

def set_cached_prediction(symbol, data):
    prediction_cache[symbol] = (data, time.time())

def calculate_predictions(symbol: str):
    # Fetch 2 years of data
    formatted_symbol = data_fetcher.format_ticker(symbol)
    ticker = yf.Ticker(formatted_symbol)
    df = ticker.history(period="2y")
    
    if df.empty or len(df) < 100:
        return None

    info = data_fetcher.get_stock_info(symbol)
    current_price = info["price"]
    market_open = info["market_open"]
    
    # ─── Model 1: Linear Regression (Trend) ─────────────────────────
    # We use all 2 years for the long-term trend
    df['Days'] = np.arange(len(df))
    X = df[['Days']].values
    y = df['Close'].values
    
    model_lr = LinearRegression()
    model_lr.fit(X, y)
    
    last_day = df['Days'].iloc[-1]
    # Horizons in trading days (approx 21 per month)
    horizons = {"1M": 21, "6M": 126, "12M": 252}
    
    lr_preds = {}
    for h_key, h_days in horizons.items():
        future_day = last_day + h_days
        lr_preds[h_key] = float(model_lr.predict([[future_day]])[0])

    # ─── Model 2: Monte Carlo Simulation ────────────────────────────
    # Use last 1 year for returns distribution
    df_1y = df.tail(252).copy()
    df_1y['Returns'] = df_1y['Close'].pct_change().dropna()
    mu = df_1y['Returns'].mean()
    sigma = df_1y['Returns'].std()
    
    mc_results = {}
    num_sims = 1000
    
    for h_key, h_days in horizons.items():
        # Generate 1000 paths
        sim_returns = np.random.normal(mu, sigma, (h_days, num_sims))
        # Cumulative product of (1 + r)
        sim_prices = current_price * np.prod(1 + sim_returns, axis=0)
        
        mc_results[h_key] = {
            "bear": float(np.percentile(sim_prices, 25)),
            "base": float(np.median(sim_prices)),
            "bull": float(np.percentile(sim_prices, 75))
        }

    # ─── Model 3: EMA Projection ────────────────────────────────────
    # Last 6 months for EMAs
    df_6m = df.tail(126).copy()
    ema20 = df_6m['Close'].ewm(span=20, adjust=False).mean()
    ema50 = df_6m['Close'].ewm(span=50, adjust=False).mean()
    
    curr_ema20 = ema20.iloc[-1]
    curr_ema50 = ema50.iloc[-1]
    
    # Simple projection: assume current gap/slope continues
    # Calculate average daily change in gap over last 10 days
    gap = ema20 - ema50
    gap_slope = (gap.iloc[-1] - gap.iloc[-10]) / 10
    
    ema_preds = {}
    for h_key, h_days in horizons.items():
        projected_gap = gap.iloc[-1] + (gap_slope * h_days)
        # Prediction: if gap is widening bullishly, project higher
        # We'll use a conservative multiplier based on EMA crossover
        base_ema_pred = current_price * (1 + (projected_gap / curr_ema50) * 0.1)
        ema_preds[h_key] = float(base_ema_pred)

    # ─── Ensemble & Output ──────────────────────────────────────────
    final_prediction = {}
    total_agreement_score = 0
    
    for h_key in horizons.keys():
        # Weighted Average for Base Case
        # Weights: MC(0.5), LR(0.3), EMA(0.2)
        base_case = (mc_results[h_key]["base"] * 0.5) + (lr_preds[h_key] * 0.3) + (ema_preds[h_key] * 0.2)
        
        # Bear and Bull are taken directly from Monte Carlo 25/75 percentiles
        bear_case = mc_results[h_key]["bear"]
        bull_case = mc_results[h_key]["bull"]
        
        # Calculate Confidence
        # How much do the 3 models agree on direction relative to current price?
        curr = current_price
        dirs = [
            1 if lr_preds[h_key] > curr else -1,
            1 if mc_results[h_key]["base"] > curr else -1,
            1 if ema_preds[h_key] > curr else -1
        ]
        agreement = abs(sum(dirs)) # 3 if all same, 1 if 2 vs 1
        
        # Variance-based confidence
        preds = [lr_preds[h_key], mc_results[h_key]["base"], ema_preds[h_key]]
        std_dev = np.std(preds)
        variation = std_dev / base_case
        var_conf = max(0, 100 - (variation * 500)) # Penalize variation
        
        confidence = (agreement / 3.0) * 0.7 * 100 + (var_conf * 0.3)
        
        final_prediction[h_key] = {
            "bear": round(bear_case, 2),
            "base": round(base_case, 2),
            "bull": round(bull_case, 2),
            "bear_pct": round(((bear_case - curr) / curr) * 100, 2),
            "base_pct": round(((base_case - curr) / curr) * 100, 2),
            "bull_pct": round(((bull_case - curr) / curr) * 100, 2),
            "confidence": int(min(99, max(15, confidence)))
        }

    # Model Agreement logic
    signals = [p['base_pct'] for p in final_prediction.values()]
    avg_sig = sum(signals) / len(signals)
    
    if avg_sig > 5: agreement_str = "STRONG BULLISH"
    elif avg_sig > 1: agreement_str = "BULLISH"
    elif avg_sig < -5: agreement_str = "STRONG BEARISH"
    elif avg_sig < -1: agreement_str = "BEARISH"
    else: agreement_str = "NEUTRAL"

    # Indicators
    trend_val = (lr_preds["12M"] - current_price) / current_price
    ema_cross = "BULLISH CROSSOVER" if curr_ema20 > curr_ema50 else "BEARISH CROSSOVER"
    vol_val = sigma * np.sqrt(252) # Annualized vol
    
    return {
        "symbol": symbol.replace('.NS', '').replace('.BO', ''),
        "current_price": round(current_price, 2),
        "prediction": final_prediction,
        "model_agreement": agreement_str,
        "signals": {
            "trend": "UP" if trend_val > 0.02 else "DOWN" if trend_val < -0.02 else "SIDEWAYS",
            "ema_signal": ema_cross,
            "volatility": "HIGH" if vol_val > 0.3 else "MEDIUM" if vol_val > 0.15 else "LOW",
            "monte_carlo_skew": "POSITIVE" if mc_results["12M"]["base"] > lr_preds["12M"] else "NEGATIVE"
        },
        "history": df['Close'].tail(252).round(2).tolist(),
        "market_open": market_open,
        "stale": info["stale"],
        "generated_at": datetime.now().isoformat()
    }

@router.get("/predict/{symbol}")
async def get_prediction(symbol: str):
    symbol = data_fetcher.format_ticker(symbol)
        
    cached = get_cached_prediction(symbol)
    if cached: return cached
    
    try:
        result = calculate_predictions(symbol)
        if not result:
            raise HTTPException(status_code=404, detail="Prediction unavailable for this symbol")
        
        set_cached_prediction(symbol, result)
        return result
    except Exception as e:
        print(f"Prediction error for {symbol}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/predict/portfolio")
async def predict_portfolio(portfolio: Dict = Body(...)):
    """
    portfolio format: { "balance": 1000, "positions": [{"symbol": "RELIANCE.NS", "quantity": 10}, ...] }
    """
    positions = portfolio.get("positions", [])
    if not positions:
        return {
            "current_value": portfolio.get("balance", 0),
            "projections": {"1M": 0, "6M": 0, "12M": 0},
            "profit_pct": {"1M": 0, "6M": 0, "12M": 0}
        }
    
    total_now = float(portfolio.get("balance", 0))
    proj_1m = total_now
    proj_6m = total_now
    proj_12m = total_now
    
    for pos in positions:
        sym = pos['symbol']
        qty = float(pos['quantity'])
        
        pred = await get_prediction(sym)
        curr_p = pred['current_price']
        
        total_now += (curr_p * qty)
        proj_1m += (pred['prediction']['1M']['base'] * qty)
        proj_6m += (pred['prediction']['6M']['base'] * qty)
        proj_12m += (pred['prediction']['12M']['base'] * qty)
        
    return {
        "current_value": round(total_now, 2),
        "projections": {
            "1M": round(proj_1m, 2),
            "6M": round(proj_6m, 2),
            "12M": round(proj_12m, 2)
        },
        "profit_abs": {
            "1M": round(proj_1m - total_now, 2),
            "6M": round(proj_6m - total_now, 2),
            "12M": round(proj_12m - total_now, 2)
        },
        "profit_pct": {
            "1M": round(((proj_1m - total_now) / total_now) * 100, 2) if total_now > 0 else 0,
            "6M": round(((proj_6m - total_now) / total_now) * 100, 2) if total_now > 0 else 0,
            "12M": round(((proj_12m - total_now) / total_now) * 100, 2) if total_now > 0 else 0
        }
    }
