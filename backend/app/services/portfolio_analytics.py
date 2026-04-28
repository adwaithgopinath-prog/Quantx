import pandas as pd
import numpy as np
import scipy.optimize as sco
from app.services import data_fetcher, portfolio_manager

def calculate_analytics(user_id: int, rfr: float = 0.05):
    portfolio = portfolio_manager.get_portfolio(user_id)
    positions = portfolio.get("positions", {})
    
    symbols = list(positions.keys())
    
    empty_res = {
        "expected_return": 0.0,
        "portfolio_risk": 0.0,
        "sharpe_ratio": 0.0,
        "efficiency": "N/A",
        "weights": {},
        "optimization": {
            "max_sharpe": {},
            "min_risk": {}
        }
    }
    
    if not symbols: return empty_res

    prices_df = pd.DataFrame()
    for sym in symbols:
        hist = data_fetcher.get_stock_history(sym, period="1y")
        if not hist.empty:
            prices_df[sym] = hist['Close']
            
    if prices_df.empty: return empty_res
    
    prices_df = prices_df.dropna(axis=1, how='all')
    valid_symbols = prices_df.columns.tolist()
    
    if len(valid_symbols) == 0: return empty_res

    returns = prices_df.pct_change().dropna()
    latest_prices = prices_df.iloc[-1]
    
    total_val = 0
    val_map = {}
    for sym in valid_symbols:
        qty = positions[sym]["quantity"]
        val = qty * latest_prices[sym]
        val_map[sym] = val
        total_val += val
        
    if total_val == 0: return empty_res

    weights = np.array([val_map[sym]/total_val for sym in valid_symbols])
    
    # Base computations
    mean_daily_returns = returns.mean()
    exp_return = np.sum(mean_daily_returns * weights) * 252
    
    cov_matrix = returns.cov() * 252
    port_risk = np.sqrt(np.dot(weights.T, np.dot(cov_matrix, weights)))
    
    sharpe = (exp_return - rfr) / port_risk if port_risk > 0 else 0
    
    if sharpe < 1:
        efficiency = "Sub-optimal / Risky"
    elif sharpe < 2:
        efficiency = "Good / Efficient"
    else:
        efficiency = "Exceptional / Highly Efficient"
    
    weight_details = {sym: f"{round((val_map[sym]/total_val)*100, 2)}%" for sym in valid_symbols}

    # ==========================================
    # MEAN-VARIANCE OPTIMIZATION (MPT) ENGINE
    # ==========================================
    optimization = {
        "max_sharpe": {},
        "min_risk": {}
    }
    
    efficient_frontier = []
    
    # Can only optimize meaningfully with >1 assets
    if len(valid_symbols) > 1:
        num_assets = len(valid_symbols)
        
        def portfolio_annualised_performance(weights, mean_returns, cov_matrix):
            ret = np.sum(mean_returns * weights) * 252
            std = np.sqrt(np.dot(weights.T, np.dot(cov_matrix, weights)))
            return std, ret

        def negative_sharpe(weights, mean_returns, cov_matrix, rfr):
            p_std, p_ret = portfolio_annualised_performance(weights, mean_returns, cov_matrix)
            if p_std == 0: return 0
            return -(p_ret - rfr) / p_std

        def portfolio_volatility(weights, mean_returns, cov_matrix):
            return portfolio_annualised_performance(weights, mean_returns, cov_matrix)[0]

        constraints = ({'type': 'eq', 'fun': lambda x: np.sum(x) - 1})
        bounds = tuple((0.0, 1.0) for asset in range(num_assets))
        init_guess = num_assets * [1. / num_assets,]
        
        # Max Sharpe Optimization
        opt_sharpe = sco.minimize(negative_sharpe, init_guess, args=(mean_daily_returns, cov_matrix, rfr), method='SLSQP', bounds=bounds, constraints=constraints)
        if opt_sharpe.success:
            s_weights = opt_sharpe.x
            for i, s in enumerate(valid_symbols):
                if s_weights[i] > 0.01: # Cap tiny weights
                    optimization["max_sharpe"][s] = f"{round(s_weights[i]*100, 1)}%"
            ms_std, ms_ret = portfolio_annualised_performance(s_weights, mean_daily_returns, cov_matrix)
            optimization["max_sharpe_stats"] = {"risk": round(ms_std * 100, 2), "return": round(ms_ret * 100, 2)}
                    
        # Min Risk (Variance) Optimization
        opt_risk = sco.minimize(portfolio_volatility, init_guess, args=(mean_daily_returns, cov_matrix), method='SLSQP', bounds=bounds, constraints=constraints)
        if opt_risk.success:
            r_weights = opt_risk.x
            for i, s in enumerate(valid_symbols):
                if r_weights[i] > 0.01:
                    optimization["min_risk"][s] = f"{round(r_weights[i]*100, 1)}%"
            mr_std, mr_ret = portfolio_annualised_performance(r_weights, mean_daily_returns, cov_matrix)
            optimization["min_risk_stats"] = {"risk": round(mr_std * 100, 2), "return": round(mr_ret * 100, 2)}

        # Generate random portfolios for Efficient Frontier scatter plot
        np.random.seed(42)
        for _ in range(500):
            w = np.random.random(num_assets)
            w /= np.sum(w)
            p_std, p_ret = portfolio_annualised_performance(w, mean_daily_returns, cov_matrix)
            efficient_frontier.append({
                "risk": round(p_std * 100, 2),
                "return": round(p_ret * 100, 2)
            })

    # ==========================================
    # MONTE CARLO SIMULATION
    # ==========================================
    mc_simulations = []
    if total_val > 0:
        np.random.seed(42)
        # Daily metrics
        daily_mean = np.sum(mean_daily_returns * weights)
        daily_std = np.sqrt(np.dot(weights.T, np.dot(returns.cov(), weights)))
        
        num_simulations = 50
        days_to_simulate = 252
        
        for _ in range(num_simulations):
            # 1. Generate random returns
            sim_returns = np.random.normal(daily_mean, daily_std, days_to_simulate)
            # 2. Simulate cumulative portfolio value
            sim_values = total_val * np.cumprod(1 + sim_returns)
            # We can prepend the current total value at day 0
            sim_path = [round(total_val, 2)] + [round(v, 2) for v in sim_values]
            mc_simulations.append(sim_path)

    # Asset Risk vs Return scatter data
    asset_scatter = []
    for sym in valid_symbols:
        s_ret = mean_daily_returns[sym] * 252
        s_std = returns[sym].std() * np.sqrt(252)
        asset_scatter.append({
            "symbol": sym,
            "return": round(s_ret * 100, 2),
            "risk": round(s_std * 100, 2)
        })

    # Correlation Matrix
    corr_matrix = returns.corr().round(2).to_dict()

    return {
        "expected_return": float(exp_return),
        "portfolio_risk": float(port_risk),
        "sharpe_ratio": float(sharpe),
        "efficiency": efficiency,
        "weights": weight_details,
        "optimization": optimization,
        "efficient_frontier": efficient_frontier,
        "monte_carlo": mc_simulations,
        "correlation": corr_matrix,
        "assets_risk_return": asset_scatter
    }
