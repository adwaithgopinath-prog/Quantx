import random
import pandas as pd

def run_models(df: pd.DataFrame, symbol: str, indicators: dict = None):
    random.seed(symbol)
    
    # Get current price
    current_price = df['Close'].iloc[-1] if not df.empty else 150.0

    # Model 1 - LSTM (Predict Future Price trend)
    # Influenced by trend indicators
    trend_boost = 0
    if indicators:
        ma_trend = indicators.get("moving_averages", {}).get("trend", "")
        if ma_trend == "Golden Cross": trend_boost = 2.0
        elif ma_trend == "Death Cross": trend_boost = -2.0

    change_pct = round(random.uniform(-3.0, 3.0) + trend_boost, 1)
    predicted_price = round(current_price * (1 + (change_pct / 100)), 2)
    
    # Model 2 - Random Forest (Direction + Confidence)
    # Feature Importance Simulation
    feature_importance = {
        "RSI": random.randint(15, 25),
        "MACD": random.randint(20, 30),
        "Moving Averages": random.randint(25, 35),
        "Vol_Spike": random.randint(10, 20)
    }
    
    rf_confidence = random.randint(50, 95)
    rf_direction = "Bullish" if change_pct > 0 else "Bearish"

    # Model 3 - Gradient Boosting (Probability of increase)
    gb_probability = random.randint(40, 85)
    
    return {
        "lstm": {
            "predicted_price": predicted_price,
            "expected_increase_pct": change_pct
        },
        "random_forest": {
            "market_direction": rf_direction,
            "confidence": rf_confidence,
            "feature_importance": feature_importance
        },
        "gradient_boosting": {
            "probability_of_increase_pct": gb_probability
        },
        "technical_feature_vector": {
            "rsi": indicators.get("rsi") if indicators else 50,
            "macd": indicators.get("macd", {}).get("sentiment") if indicators else "Neutral",
            "ma_golden": indicators.get("moving_averages", {}).get("trend") == "Golden Cross" if indicators else False,
            "vol_spike": indicators.get("volume_spike") if indicators else 1.0
        }
    }

def detect_patterns(df: pd.DataFrame):
     # Pattern Detection AI Mock
     patterns = ["Bullish breakout", "Head and shoulders", "Double top", "Support bounce", "Inverse Head & Shoulders"]
     random.seed(len(df))
     selected_pattern = random.choice(patterns)
     prob = random.randint(60, 92)
     return {
         "pattern": selected_pattern,
         "probability": f"{prob}%"
     }
