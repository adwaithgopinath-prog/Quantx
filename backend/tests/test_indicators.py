import pandas as pd
import numpy as np
import pytest
from app.services import technical_indicators

def test_calculate_all_empty_df():
    df = pd.DataFrame()
    result = technical_indicators.calculate_all(df)
    assert result["rsi"] == 50.0
    assert result["rsi_signal"] == "Neutral"

def test_calculate_all_short_history():
    data = {
        'Open': np.random.randn(10),
        'High': np.random.randn(10),
        'Low': np.random.randn(10),
        'Close': np.random.randn(10),
        'Volume': np.random.randn(10)
    }
    df = pd.DataFrame(data)
    result = technical_indicators.calculate_all(df)
    assert result["rsi"] == 50.0

def test_calculate_all_valid_data():
    # Create 100 days of data
    np.random.seed(42)
    dates = pd.date_range(start="2020-01-01", periods=100)
    close = np.cumsum(np.random.randn(100)) + 100
    data = {
        'Open': close - 1,
        'High': close + 1,
        'Low': close - 2,
        'Close': close,
        'Volume': np.random.randint(1000, 10000, size=100)
    }
    df = pd.DataFrame(data, index=dates)
    result = technical_indicators.calculate_all(df)
    
    assert "rsi" in result
    assert "macd" in result
    assert "moving_averages" in result
    assert "bollinger" in result
    assert isinstance(result["rsi"], float)
    assert result["rsi_signal"] in ["Neutral", "Oversold", "Overbought"]
