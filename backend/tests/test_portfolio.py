import pytest
import pandas as pd
import numpy as np
from app.services import portfolio_analytics, portfolio_manager

def test_calculate_analytics_empty():
    # Mock portfolio manager to return empty portfolio
    from unittest.mock import patch
    with patch('app.services.portfolio_manager.get_portfolio', return_value={"positions": {}}):
        result = portfolio_analytics.calculate_analytics()
        assert result["expected_return"] == 0.0
        assert result["weights"] == {}

def test_calculate_analytics_with_data():
    from unittest.mock import patch
    
    mock_portfolio = {
        "positions": {
            "AAPL": {"quantity": 10, "avg_buy_price": 150.0}
        }
    }
    
    # Mock data fetcher to return some history
    np.random.seed(42)
    dates = pd.date_range(start="2020-01-01", periods=100)
    close = np.cumsum(np.random.randn(100)) + 150
    mock_history = pd.DataFrame({'Close': close}, index=dates)
    
    with patch('app.services.portfolio_manager.get_portfolio', return_value=mock_portfolio):
        with patch('app.services.data_fetcher.get_stock_history', return_value=mock_history):
            result = portfolio_analytics.calculate_analytics()
            assert "expected_return" in result
            assert "portfolio_risk" in result
            assert "weights" in result
            assert "AAPL" in result["weights"]
