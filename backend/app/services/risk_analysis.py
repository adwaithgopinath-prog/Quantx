import pandas as pd
import numpy as np

def calculate_risk_score(df: pd.DataFrame, news_sentiment: dict, indicators: dict):
    """
    Calculates a risk score from 0 to 100.
    0-30: Low Risk
    31-70: Medium Risk
    71-100: High Risk (Danger)
    """
    if df.empty or len(df) < 20:
        return {"score": 50, "rating": "Medium", "factors": ["Insufficient data"]}

    # 1. Volatility (Standard Deviation of returns)
    returns = df['Close'].pct_change().dropna()
    volatility = returns.std() * np.sqrt(252) * 100 # Annualized volatility %
    
    vol_score = min(volatility * 2, 40) # Max 40 points from volatility
    
    # 2. RSI Extreme conditions
    rsi = indicators.get("rsi", 50)
    rsi_risk = 0
    if rsi > 80 or rsi < 20:
        rsi_risk = 20
    elif rsi > 70 or rsi < 30:
        rsi_risk = 10
        
    # 3. News Sentiment Impact
    news_impact = news_sentiment.get("combined_score", 0)
    sentiment_risk = 0
    if news_impact < -0.3:
        sentiment_risk = 25
    elif news_impact < -0.1:
        sentiment_risk = 12
        
    # 4. Beta (Mocked for now since we need a benchmark, let's assume market correlation)
    # Higher beta = higher risk
    beta_mock = 1.2 # Assume slightly more volatile than market
    beta_risk = (beta_mock - 1.0) * 10 if beta_mock > 1 else 0
    
    total_score = min(vol_score + rsi_risk + sentiment_risk + beta_risk, 100)
    
    rating = "Low" if total_score < 30 else "Medium" if total_score < 70 else "High"
    
    factors = []
    if vol_score > 20: factors.append("High price volatility")
    if rsi_risk > 0: factors.append("Technical over-extension")
    if sentiment_risk > 0: factors.append("Negative news sentiment")
    if beta_mock > 1.5: factors.append("High market sensitivity")

    return {
        "score": round(total_score, 1),
        "rating": rating,
        "volatility_annualized": f"{round(volatility, 2)}%",
        "risk_factors": factors if factors else ["Stable market conditions"]
    }
