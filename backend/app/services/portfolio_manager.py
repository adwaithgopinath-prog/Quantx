from sqlalchemy.orm import Session
from datetime import datetime
from app.models import User, Portfolio, Order
from app.database import SessionLocal
import os

# For simplicity, we use a single user ID for local terminal mode
DEFAULT_USER_ID = 1

def ensure_user(db: Session):
    user = db.query(User).filter(User.id == DEFAULT_USER_ID).first()
    if not user:
        user = User(id=DEFAULT_USER_ID, name="QuantX Trader", email="trader@quantx.ai")
        db.add(user)
        db.commit()
        db.refresh(user)
    return user

def get_portfolio():
    db = SessionLocal()
    try:
        user = ensure_user(db)
        positions = db.query(Portfolio).filter(Portfolio.user_id == user.id).all()
        history = db.query(Order).filter(Order.user_id == user.id).order_by(Order.created_at.desc()).all()
        
        pos_dict = {
            pos.ticker: {"avg_price": pos.avg_buy_price, "quantity": pos.shares}
            for pos in positions
        }
        
        hist_list = [
            {
                "id": f"ORD-{str(o.id).zfill(4)}",
                "type": o.type,
                "symbol": o.ticker,
                "price": o.price,
                "quantity": o.shares,
                "total": o.price * o.shares,
                "timestamp": o.created_at.strftime("%Y-%m-%d %H:%M:%S"),
                "status": o.status
            }
            for o in history
        ]
        
        return {
            "balance": user.balance,
            "positions": pos_dict,
            "history": hist_list
        }
    finally:
        db.close()

def execute_trade(symbol, side, price, quantity):
    db = SessionLocal()
    try:
        user = ensure_user(db)
        symbol = symbol.upper()
        total_cost = price * quantity
        
        if side == "BUY":
            if user.balance >= total_cost:
                user.balance -= total_cost
                
                pos = db.query(Portfolio).filter(Portfolio.user_id == user.id, Portfolio.ticker == symbol).first()
                if pos:
                    new_qty = pos.shares + quantity
                    new_avg = ((pos.avg_buy_price * pos.shares) + total_cost) / new_qty
                    pos.shares = new_qty
                    pos.avg_buy_price = round(new_avg, 2)
                else:
                    new_pos = Portfolio(user_id=user.id, ticker=symbol, shares=quantity, avg_buy_price=price)
                    db.add(new_pos)
                
                order = Order(user_id=user.id, ticker=symbol, type="BUY", price=price, shares=quantity, status="EXECUTED")
                db.add(order)
                db.commit()
                return {"status": "success", "message": f"Bought {quantity} of {symbol}"}
            else:
                return {"status": "error", "message": "Insufficient funds"}
                
        elif side == "SELL":
            pos = db.query(Portfolio).filter(Portfolio.user_id == user.id, Portfolio.ticker == symbol).first()
            if pos and pos.shares >= quantity:
                user.balance += total_cost
                pos.shares -= quantity
                
                if pos.shares == 0:
                    db.delete(pos)
                    
                order = Order(user_id=user.id, ticker=symbol, type="SELL", price=price, shares=quantity, status="EXECUTED")
                db.add(order)
                db.commit()
                return {"status": "success", "message": f"Sold {quantity} of {symbol}"}
            else:
                return {"status": "error", "message": "Insufficient holdings"}
    finally:
        db.close()

def get_stats(current_prices: dict):
    port_data = get_portfolio()
    total_equity = port_data["balance"]
    pos_details = []
    
    for symbol, pos in port_data["positions"].items():
        curr_price = current_prices.get(symbol, pos["avg_price"])
        value = curr_price * pos["quantity"]
        pnl = (curr_price - pos["avg_price"]) * pos["quantity"]
        pnl_pct = ((curr_price / pos["avg_price"]) - 1) * 100 if pos["avg_price"] > 0 else 0
        
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
        "balance": round(port_data["balance"], 2),
        "total_equity": round(total_equity, 2),
        "positions": pos_details,
        "total_pnl": round(total_equity - 100000.0, 2),
        "history": port_data["history"]
    }
