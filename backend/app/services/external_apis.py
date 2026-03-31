import random

def get_fred_economic_data():
    """
    Mock Federal Reserve Economic Data (FRED)
    Provides: Interest rates, Inflation data, GDP growth, unemployment rate
    """
    return {
        "interest_rate": round(random.uniform(4.5, 5.5), 2), # e.g. 5.25%
        "inflation_rate": round(random.uniform(2.5, 3.5), 2), # e.g. 3.1%
        "gdp_growth": round(random.uniform(1.5, 3.0), 2), # e.g. 2.4%
        "unemployment_rate": round(random.uniform(3.5, 4.5), 2) # e.g. 3.9%
    }

def get_fmp_fundamentals(symbol: str):
    """
    Mock Financial Modeling Prep data
    Provides: Revenue, Earnings, PE ratio, Balance sheet health, Cash flow
    """
    return {
        "revenue_growth": round(random.uniform(-5.0, 20.0), 2), # % growth
        "earnings_per_share": round(random.uniform(1.0, 15.0), 2),
        "pe_ratio": round(random.uniform(10.0, 40.0), 2),
        "debt_to_equity": round(random.uniform(0.1, 2.0), 2),
        "free_cash_flow": round(random.uniform(500, 5000), 2) # in millions
    }

def get_openai_sentiment_analysis(symbol: str, news_data: dict, fundamentals: dict):
    """
    Mock OpenAI API analysis
    Use for: Sentiment explanation, AI reasoning for recommendations, Financial text analysis
    """
    # Simply generate a mock AI narrative based on the data
    sentiments = ["Bullish", "Bearish", "Neutral"]
    
    # We can fake a reasoned response based on fundamentals
    if fundamentals["revenue_growth"] > 10.0 and news_data.get("final_sentiment_score", 0) > 0:
        sentiment = "Bullish"
        reasoning = f"OpenAI Analysis: High revenue growth ({fundamentals['revenue_growth']}%) combined with positive news sentiment indicates a strong upward trajectory for {symbol}. The market is reacting favorably to recent developments."
    elif fundamentals["revenue_growth"] < 0:
        sentiment = "Bearish"
        reasoning = f"OpenAI Analysis: Negative revenue growth ({fundamentals['revenue_growth']}%) raises concerns about {symbol}'s near-term profitability. Furthermore, macroeconomic conditions might add pressure."
    else:
        sentiment = random.choice(sentiments)
        if sentiment == "Bullish":
            reasoning = f"OpenAI Analysis: {symbol} shows decent fundamentals. The current PE ratio of {fundamentals['pe_ratio']} suggests it might be fairly valued with room for growth. AI sentiment is cautiously optimistic."
        elif sentiment == "Bearish":
            reasoning = f"OpenAI Analysis: Despite steady cash flows, {symbol} faces headwinds. AI analysis of recent financial texts suggests market hesitation."
        else:
            reasoning = f"OpenAI Analysis: Mixed signals for {symbol}. The AI model suggests waiting for a clearer trend break before committing capital."

    return {
        "sentiment": sentiment,
        "ai_reasoning": reasoning
    }
