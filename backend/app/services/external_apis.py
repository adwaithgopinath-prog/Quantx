import random
import os
import logging
from functools import lru_cache
from datetime import datetime, timedelta

logger = logging.getLogger("ExternalAPIs")

# Simple cache for AI analysis
AI_CACHE = {}
AI_CACHE_EXPIRY = timedelta(hours=1)

def get_fred_economic_data():
    """
    Mock Federal Reserve Economic Data (FRED)
    """
    return {
        "interest_rate": round(random.uniform(4.5, 5.5), 2),
        "inflation_rate": round(random.uniform(2.5, 3.5), 2),
        "gdp_growth": round(random.uniform(1.5, 3.0), 2),
        "unemployment_rate": round(random.uniform(3.5, 4.5), 2)
    }

def get_fmp_fundamentals(symbol: str):
    """
    Mock Financial Modeling Prep data
    """
    return {
        "revenue_growth": round(random.uniform(-5.0, 20.0), 2),
        "earnings_per_share": round(random.uniform(1.0, 15.0), 2),
        "pe_ratio": round(random.uniform(10.0, 40.0), 2),
        "debt_to_equity": round(random.uniform(0.1, 2.0), 2),
        "free_cash_flow": round(random.uniform(500, 5000), 2)
    }

def get_openai_sentiment_analysis(symbol: str, news_data: dict, fundamentals: dict, indicators: dict = None):
    """
    AI Analysis Engine with structured prompts and caching.
    """
    cache_key = f"{symbol}_{datetime.now().strftime('%Y-%m-%d_%H')}"
    if cache_key in AI_CACHE:
        return AI_CACHE[cache_key]

    api_key = os.environ.get("OPENAI_API_KEY")
    
    if not api_key:
        # Fallback to enhanced mock
        result = _get_mock_ai_analysis(symbol, news_data, fundamentals, indicators)
        AI_CACHE[cache_key] = result
        return result

    try:
        from openai import OpenAI
        client = OpenAI(api_key=api_key)
        
        prompt = f"""
        Analyze the following financial data for {symbol} and provide a professional trading outlook.
        
        FUNDAMENTALS:
        - Revenue Growth: {fundamentals.get('revenue_growth')}%
        - EPS: {fundamentals.get('earnings_per_share')}
        - PE Ratio: {fundamentals.get('pe_ratio')}
        - Debt/Equity: {fundamentals.get('debt_to_equity')}
        
        TECHNICAL INDICATORS:
        - RSI: {indicators.get('rsi') if indicators else 'N/A'}
        - MACD Sentiment: {indicators.get('macd', {}).get('sentiment') if indicators else 'N/A'}
        - Trend: {indicators.get('moving_averages', {}).get('trend') if indicators else 'N/A'}
        
        NEWS SENTIMENT:
        - Score: {news_data.get('final_sentiment_score', 0)}
        - Highlights: {', '.join([n['title'] for n in news_data.get('articles', [])[:3]])}
        
        Provide:
        1. Overall Sentiment (Bullish/Bearish/Neutral)
        2. A 2-3 sentence technical and fundamental reasoning.
        3. A risk warning.
        """
        
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a professional Wall Street quantitative analyst."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=200
        )
        
        reasoning = response.choices[0].message.content
        sentiment = "Bullish" if "Bullish" in reasoning else "Bearish" if "Bearish" in reasoning else "Neutral"
        
        result = {
            "sentiment": sentiment,
            "ai_reasoning": reasoning
        }
        AI_CACHE[cache_key] = result
        return result

    except Exception as e:
        logger.error(f"OpenAI API Error: {e}")
        return _get_mock_ai_analysis(symbol, news_data, fundamentals, indicators)

def _get_mock_ai_analysis(symbol: str, news_data: dict, fundamentals: dict, indicators: dict = None):
    # Enhanced mock logic
    rev_growth = fundamentals.get("revenue_growth", 0)
    sentiment_score = news_data.get("final_sentiment_score", 0)
    rsi = indicators.get("rsi", 50) if indicators else 50
    
    if rev_growth > 10.0 and sentiment_score > 0.2:
        sentiment = "Bullish"
        reasoning = f"AI Analysis: Strong fundamental growth of {rev_growth}% and positive news sentiment suggest continued upside. Technical RSI at {rsi} shows healthy momentum."
    elif rev_growth < 0 or sentiment_score < -0.2:
        sentiment = "Bearish"
        reasoning = f"AI Analysis: Fundamental headwinds ({rev_growth}% growth) and negative news pressure indicate downward risk. RSI at {rsi} may suggest further weakness."
    else:
        sentiment = "Neutral"
        reasoning = f"AI Analysis: Consolidation phase for {symbol}. Mixed signals from fundamentals and news. Technical indicators suggest waiting for a clear breakout."

    return {
        "sentiment": sentiment,
        "ai_reasoning": reasoning
    }
