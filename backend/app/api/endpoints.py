import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services import (
    data_fetcher, technical_indicators, news_sentiment,
    ml_models, signal_fusion, backtester, risk_analysis,
    portfolio_manager, market_engine, feature_pipeline,
    external_apis, screener_engine, portfolio_analytics,
    pattern_recognition, predictor
)
import pandas as pd
from typing import Optional

router = APIRouter()

class TradeRequest(BaseModel):
    symbol: str
    side: str # BUY/SELL
    quantity: int
    price: float

@router.get("/dashboard/{symbol}")
async def get_dashboard_data(symbol: str):
    # 1. Fetch Price History
    history = data_fetcher.get_stock_history(symbol, period="2y")
    stock_info = data_fetcher.get_stock_info(symbol)

    # 2. Check if data exists
    if history.empty:
        return {"error": "Symbol not found"}

    # 3. Tech Indicators
    indicators = technical_indicators.calculate_all(history)

    # 4. Patterns & Predictions
    patterns = pattern_recognition.detect_patterns(history)
    forecast = predictor.forecast_price(history)
    forecast_summary = predictor.get_forecast_summary(forecast)

    # 5. News & Social Sentiment
    news = news_sentiment.analyze_news(symbol)

    # 6. External APIs (FRED, FMP, OpenAI)
    fred_data = external_apis.get_fred_economic_data()
    fmp_data = external_apis.get_fmp_fundamentals(symbol)
    openai_analysis = external_apis.get_openai_sentiment_analysis(symbol, news, fmp_data)

    # 7. ML Predictions (Existing)
    predictions = ml_models.run_models(history, symbol, indicators)
    # Inject our new forest prediction logic if needed or wrap
    predictions["linear_forecast"] = forecast_summary

    # 8. Risk Analysis
    risk = risk_analysis.calculate_risk_score(history, news, indicators)

    # 9. Signal Fusion
    fusion_result = signal_fusion.evaluate_signals(
        indicators, news, predictions, risk, fred_data, fmp_data, openai_analysis
    )

    # 10. Feature Engineering Pipeline (Save vector for training)
    try:
        feature_pipeline.process_features(symbol, indicators, news, risk, predictions)
    except Exception as e:
        print(f"Pipeline error: {e}")

    return {
        "symbol": symbol.upper(),
        "info": stock_info,
        "chart_data": data_fetcher.format_for_chart(history),
        "indicators": indicators,
        "patterns": patterns,
        "forecast": forecast,
        "news": news,
        "predictions": predictions,
        "risk": risk,
        "fusion": fusion_result,
        "current_price": stock_info["price"],
        "price": stock_info["price"],
        "change": stock_info["change"],
        "change_pct": stock_info["change_pct"],
        "external_data": {
            "fred": fred_data,
            "fmp": fmp_data,
            "openai": openai_analysis
        }
    }

@router.get("/pipeline/stats")
async def get_pipeline_stats():
    return feature_pipeline.get_pipeline_stats()

@router.get("/market/engine")
def get_market_engine_state():
    return market_engine.get_market_state()

@router.get("/portfolio")
def get_portfolio():
    port = portfolio_manager.get_portfolio()
    current_prices = {}
    for sym in port.get("positions", {}).keys():
        hist = data_fetcher.get_stock_history(sym, period="5d")
        if not hist.empty:
            current_prices[sym] = hist["Close"].iloc[-1]
    return portfolio_manager.get_stats(current_prices)

@router.get("/portfolio/analytics")
def get_portfolio_analytics(rfr: float = 0.05):
    return portfolio_analytics.calculate_analytics(rfr)

@router.post("/trade")
def execute_trade(trade: TradeRequest):
    result = portfolio_manager.execute_trade(
        trade.symbol, trade.side, trade.price, trade.quantity
    )
    if result["status"] == "error":
        raise HTTPException(status_code=400, detail=result["message"])
    return result

@router.get("/backtest/{symbol}")
def run_backtest(symbol: str):
    history = data_fetcher.get_stock_history(symbol, period="2y")
    result = backtester.run_simple_backtest(history)
    return {
        "symbol": symbol.upper(),
        **result,
        "strategy": "RSI < 35 (BUY) | RSI > 65 (SELL)"
    }

@router.get("/chat")
def get_chat_response(query: str, symbol: str):
    # Mock AI chat response based on signal
    history = data_fetcher.get_stock_history(symbol)
    news = news_sentiment.analyze_news(symbol)
    indicators = technical_indicators.calculate_all(history)
    predictions = ml_models.run_models(history, symbol)
    risk = risk_analysis.calculate_risk_score(history, news, indicators)
    
    fred_data = external_apis.get_fred_economic_data()
    fmp_data = external_apis.get_fmp_fundamentals(symbol)
    openai_analysis = external_apis.get_openai_sentiment_analysis(symbol, news, fmp_data)
    
    fusion_result = signal_fusion.evaluate_signals(indicators, news, predictions, risk, fred_data, fmp_data, openai_analysis)
    
    return {
        "query": query,
        "response": fusion_result["ai_explanation"],
        "signal": fusion_result["recommendation"]
    }

@router.get("/market/trending")
def get_trending_market():
    symbols = data_fetcher.get_trending_symbols()
    trending_data = []
    for s in symbols:
        hist = data_fetcher.get_stock_history(s, period="1d")
        if not hist.empty:
            price = hist["Close"].iloc[-1]
            prev_price = hist["Open"].iloc[-1]
            change_pct = ((price - prev_price) / prev_price) * 100
            trending_data.append({
                "symbol": s,
                "price": round(price, 2),
                "change": round(change_pct, 2)
            })
    return trending_data

@router.get("/screener")
def get_top_assets(min_price: float = 0, max_price: float = 10000, sector: Optional[str] = "All"):
    return screener_engine.screener_engine.get_top_assets(min_price, max_price, sector)

# ─── Orders endpoints ────────────────────────────────────────────────────────
@router.get("/orders")
def get_orders(
    ticker: Optional[str] = None,
    status: Optional[str] = None,   # EXECUTED | PENDING | CANCELLED
    side:   Optional[str] = None,   # BUY | SELL
    date_from: Optional[str] = None,
    date_to:   Optional[str] = None,
    page:      int = 1,
    page_size: int = 20,
):
    """Return paginated order history from portfolio.json with optional filters."""
    portfolio = portfolio_manager.get_portfolio()
    history   = portfolio.get("history", [])

    # Enrich with status/id if not present
    enriched = []
    for i, h in enumerate(reversed(history)):          # newest first
        entry = {
            "id":      h.get("id",        f"ORD-{str(len(history)-i).zfill(4)}"),
            "date":    h.get("timestamp", ""),
            "ticker":  h.get("symbol",    ""),
            "type":    h.get("type",      "BUY"),
            "price":   h.get("price",     0),
            "shares":  h.get("quantity",  0),
            "value":   round(h.get("price", 0) * h.get("quantity", 0), 2),
            "status":  h.get("status",    "EXECUTED"),
        }
        enriched.append(entry)

    # Filter
    if ticker:
        t = ticker.upper()
        enriched = [o for o in enriched if t in o["ticker"].upper()]
    if status:
        enriched = [o for o in enriched if o["status"] == status.upper()]
    if side:
        enriched = [o for o in enriched if o["type"] == side.upper()]
    if date_from:
        enriched = [o for o in enriched if o["date"] >= date_from]
    if date_to:
        enriched = [o for o in enriched if o["date"] <= date_to + " 23:59:59"]

    total  = len(enriched)
    start  = (page - 1) * page_size
    paged  = enriched[start : start + page_size]

    return {
        "orders":     paged,
        "total":      total,
        "page":       page,
        "page_size":  page_size,
        "total_pages": max(1, -(-total // page_size)),  # ceil division
    }
