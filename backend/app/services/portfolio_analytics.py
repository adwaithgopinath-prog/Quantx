import pandas as pd
import numpy as np
from app.services import data_fetcher, portfolio_manager

def calculate_analytics(rfr: float = 0.05):
    portfolio = portfolio_manager.get_portfolio()
    positions = portfolio.get("positions", {})
    
    symbols = list(positions.keys())
    if not symbols:
        return {
            "expected_return": "0.00%",
            "portfolio_risk": "0.00%",
            "sharpe_ratio": "0.00",
            "efficiency": "N/A",
            "weights": {}
        }

    prices_df = pd.DataFrame()
    for sym in symbols:
        hist = data_fetcher.get_stock_history(sym, period="1y")
        if not hist.empty:
            prices_df[sym] = hist['Close']
            
    if prices_df.empty:
         return {
            "expected_return": "0.00%",
            "portfolio_risk": "0.00%",
            "sharpe_ratio": "0.00",
            "efficiency": "N/A",
            "weights": {}
        }
    
    # Drop completely empty columns
    prices_df = prices_df.dropna(axis=1, how='all')
    valid_symbols = prices_df.columns.tolist()
    
    # Calculate daily percent returns
    returns = prices_df.pct_change().dropna()
    
    # Calculate individual weights based on current value
    latest_prices = prices_df.iloc[-1]
    
    total_val = 0
    val_map = {}
    for sym in valid_symbols:
        qty = positions[sym]["quantity"]
        val = qty * latest_prices[sym]
        val_map[sym] = val
        total_val += val
        
    if total_val == 0:
        return {
            "expected_return": "0.00%",
            "portfolio_risk": "0.00%",
            "sharpe_ratio": "0.00",
            "efficiency": "N/A",
            "weights": {}
        }

    weights = np.array([val_map[sym]/total_val for sym in valid_symbols])
    
    # 1. Expected Portfolio Return (Annualized)
    mean_daily_returns = returns.mean()
    exp_return = np.sum(mean_daily_returns * weights) * 252
    
    # 2. Portfolio Risk (Standard Deviation using Covariance Matrix)
    # Annualized Covariance Matrix
    cov_matrix = returns.cov() * 252
    port_risk = np.sqrt(np.dot(weights.T, np.dot(cov_matrix, weights)))
    
    # 3. Sharpe Ratio
    sharpe = (exp_return - rfr) / port_risk if port_risk > 0 else 0
    
    # 4. Efficiency Classification
    if sharpe < 1:
        efficiency = "Sub-optimal / Risky"
    elif sharpe < 2:
        efficiency = "Good / Efficient"
    else:
        efficiency = "Exceptional / Highly Efficient"
    
    weight_details = {sym: f"{round((val_map[sym]/total_val)*100, 2)}%" for sym in valid_symbols}
    
    return {
        "expected_return": f"{round(exp_return * 100, 2)}%",
        "portfolio_risk": f"{round(port_risk * 100, 2)}%",
        "sharpe_ratio": str(round(sharpe, 2)),
        "efficiency": efficiency,
        "weights": weight_details
    }
