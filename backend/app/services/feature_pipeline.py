import pandas as pd
import numpy as np
from datetime import datetime
import os
import json

# Path to store the engineered feature dataset for model training
DATASET_PATH = os.path.join(os.path.dirname(__file__), "training_dataset.csv")

def process_features(symbol: str, indicators: dict, news: dict, risk: dict, predictions: dict):
    """
    Transforms raw engine signals into a structured feature vector for the ML pipeline.
    This mimics the preprocessing step before model training/inference.
    """
    
    # 1. Extract raw features from our specialized engines
    feature_row = {
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "stock": symbol,
        
        # Momentum Features
        "rsi": indicators.get("rsi", 50),
        "stoch_k": indicators.get("stochastic", {}).get("k", 50),
        
        # Trend Features
        "macd_val": indicators.get("macd", {}).get("value", 0),
        "ma_trend": 1 if indicators.get("moving_averages", {}).get("trend") == "Golden Cross" else -1 if indicators.get("moving_averages", {}).get("trend") == "Death Cross" else 0,
        "ema_dist": indicators.get("moving_averages", {}).get("ema20", 0),
        
        # Volatility & Volume Features
        "vol_spike": indicators.get("volume_spike", 1.0),
        "atr": indicators.get("atr", 0),
        
        # Sentiment Features (The Intelligence Node)
        "sentiment_score": news.get("final_sentiment_score", 0),
        "news_impact": 1 if news.get("impact") == "Bullish" else 2 if news.get("impact") == "Extremely Bullish" else -1 if news.get("impact") == "Bearish" else -2 if news.get("impact") == "Extremely Bearish" else 0,
        
        # Risk Features
        "risk_score": risk.get("score", 50),
        
        # Target Variable Simulation (Next Day Price Change)
        # In a real system, this is filled after 24 hours. Here we simulate the 'Target' we are training for.
        "target_next_day_change": predictions.get("lstm", {}).get("expected_increase_pct", 0)
    }
    
    # 2. Append to a persistent CSV for training data collection
    try:
        df = pd.DataFrame([feature_row])
        if not os.path.isfile(DATASET_PATH):
            df.to_csv(DATASET_PATH, index=False)
        else:
            df.to_csv(DATASET_PATH, mode='a', header=False, index=False)
    except Exception as e:
        print(f"Error saving to pipeline: {e}")
        
    return feature_row

def get_pipeline_stats():
    """Returns metadata about the collected features for the UI"""
    if not os.path.exists(DATASET_PATH):
        return {"total_rows": 0, "last_update": None, "feature_count": 14}
    
    df = pd.read_csv(DATASET_PATH)
    return {
        "total_rows": len(df),
        "last_update": df['timestamp'].iloc[-1] if not df.empty else None,
        "feature_count": len(df.columns),
        "avg_sentiment": round(df['sentiment_score'].mean(), 2) if not df.empty else 0,
        "avg_vol_spike": round(df['vol_spike'].mean(), 2) if not df.empty else 0
    }
