import json
import os
from datetime import datetime

PORTFOLIO_FILE = "portfolio.json"

def get_portfolio():
    if not os.path.exists(PORTFOLIO_FILE):
        initial = {
            "balance": 100000.0, # Starting with $100k
            "positions": {}, # { "SYMBOL": { "avg_price": 150.0, "quantity": 10 } }
            "history": []
        }
        save_portfolio(initial)
        return initial
    
    with open(PORTFOLIO_FILE, "r") as f:
        return json.load(f)

def save_portfolio(data):
    with open(PORTFOLIO_FILE, "w") as f:
        json.dump(data, f, indent=4)

def execute_trade(symbol, side, price, quantity):
    portfolio = get_portfolio()
    symbol = symbol.upper()
    total_cost = price * quantity
    
    if side == "BUY":
        if portfolio["balance"] >= total_cost:
            portfolio["balance"] -= total_cost
            if symbol in portfolio["positions"]:
                pos = portfolio["positions"][symbol]
                new_qty = pos["quantity"] + quantity
                new_avg = ((pos["avg_price"] * pos["quantity"]) + total_cost) / new_qty
                portfolio["positions"][symbol] = {"avg_price": round(new_avg, 2), "quantity": new_qty}
            else:
                portfolio["positions"][symbol] = {"avg_price": price, "quantity": quantity}
            
            portfolio["history"].append({
                "type": "BUY",
                "symbol": symbol,
                "price": price,
                "quantity": quantity,
                "total": total_cost,
                "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            })
            save_portfolio(portfolio)
            return {"status": "success", "message": f"Bought {quantity} of {symbol}"}
        else:
            return {"status": "error", "message": "Insufficient funds"}
            
    elif side == "SELL":
        if symbol in portfolio["positions"] and portfolio["positions"][symbol]["quantity"] >= quantity:
            portfolio["balance"] += total_cost
            portfolio["positions"][symbol]["quantity"] -= quantity
            
            if portfolio["positions"][symbol]["quantity"] == 0:
                del portfolio["positions"][symbol]
                
            portfolio["history"].append({
                "type": "SELL",
                "symbol": symbol,
                "price": price,
                "quantity": quantity,
                "total": total_cost,
                "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            })
            save_portfolio(portfolio)
            return {"status": "success", "message": f"Sold {quantity} of {symbol}"}
        else:
            return {"status": "error", "message": "Insufficient holdings"}

def get_stats(current_prices: dict):
    portfolio = get_portfolio()
    total_equity = portfolio["balance"]
    pos_details = []
    
    for symbol, pos in portfolio["positions"].items():
        curr_price = current_prices.get(symbol, pos["avg_price"])
        value = curr_price * pos["quantity"]
        pnl = (curr_price - pos["avg_price"]) * pos["quantity"]
        pnl_pct = ((curr_price / pos["avg_price"]) - 1) * 100
        
        total_equity += value
        pos_details.append({
            "symbol": symbol,
            "quantity": pos["quantity"],
            "avg_price": pos["avg_price"],
            "current_price": curr_price,
            "value": round(value, 2),
            "pnl": round(pnl, 2),
            "pnl_pct": round(pnl_pct, 2)
        })
        
    return {
        "balance": round(portfolio["balance"], 2),
        "total_equity": round(total_equity, 2),
        "positions": pos_details,
        "total_pnl": round(total_equity - 100000.0, 2),
        "history": portfolio.get("history", [])
    }
