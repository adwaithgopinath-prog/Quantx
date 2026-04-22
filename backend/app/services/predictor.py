import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from datetime import datetime, timedelta

def forecast_price(df: pd.DataFrame, days=7):
    """
    Predicts future price using a simple Linear Regression model on historical Close prices.
    In production, this would be an LSTM or Prophet model.
    """
    if len(df) < 30:
        return []

    # Features: indices (0, 1, 2...)
    X = np.array(range(len(df))).reshape(-1, 1)
    y = df['Close'].values

    model = LinearRegression()
    model.fit(X, y)

    # Predict future values
    future_X = np.array(range(len(df), len(df) + days)).reshape(-1, 1)
    future_y = model.predict(future_X)

    last_date = df.index[-1]
    if not isinstance(last_date, datetime):
        last_date = datetime.now()

    forecast = []
    for i, val in enumerate(future_y):
        next_date = last_date + timedelta(days=i+1)
        forecast.append({
            "date": next_date.strftime("%Y-%m-%d"),
            "predicted_price": round(float(val), 2)
        })

    return forecast

def get_forecast_summary(forecast: list):
    if not forecast:
        return "Insufficient data for forecasting."
    
    start_price = forecast[0]['predicted_price']
    end_price = forecast[-1]['predicted_price']
    diff_pct = ((end_price / start_price) - 1) * 100
    
    trend = "UPWARD" if diff_pct > 0.5 else "DOWNWARD" if diff_pct < -0.5 else "SIDEWAYS"
    return {
        "trend": trend,
        "projection_7d": round(diff_pct, 2),
        "target_price": end_price
    }
