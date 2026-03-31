def evaluate_signals(indicators: dict, news: dict, predictions: dict, risk: dict, fred: dict = None, fmp: dict = None, openai_analysis: dict = None):
    # Core algorithm that combines all signals
    score = 0
    reasoning_points = []
    
    # 1. Prediction Model Influence (+2 /-2)
    lstm_pct = predictions["lstm"]["expected_increase_pct"]
    if lstm_pct > 1.5:
        score += 2
        reasoning_points.append(f"AI Forecasting models predict a strong bullish trend (+{lstm_pct}%)")
    elif lstm_pct < -1.5:
        score -= 2
        reasoning_points.append(f"Forecasting models indicate potential downside pressure ({lstm_pct}%)")

    # 2. Momentum Indicators (RSI & Stochastic)
    if indicators["rsi_signal"] == "Oversold":
        score += 1
        reasoning_points.append("Technical RSI is in oversold territory, suggesting a potential bounce")
    elif indicators["rsi_signal"] == "Overbought":
        score -= 1
        reasoning_points.append("RSI is overbought; momentum may be exhausting")

    if indicators["stochastic"]["signal"] == "Oversold":
        score += 1
        reasoning_points.append("Stochastic Oscillator confirms oversold conditions (K < 20)")
    elif indicators["stochastic"]["signal"] == "Overbought":
        score -= 1
        reasoning_points.append("Stochastic Oscillator warns of overbought exhaustion")

    # 3. Trend Indicators (MACD & MA Cross)
    if "Bullish" in indicators["macd"]["sentiment"]:
        score += 1
        reasoning_points.append("Positive MACD crossover detected")
    
    ma_trend = indicators["moving_averages"]["trend"]
    if ma_trend == "Golden Cross":
        score += 2
        reasoning_points.append("GOLDEN CROSS detected: 50MA has crossed above 200MA (Major Bullish Trend)")
    elif ma_trend == "Death Cross":
        score -= 2
        reasoning_points.append("DEATH CROSS detected: Bearish trend reversal confirmed")

    # 4. Volatility & Volume
    if indicators["bollinger"]["signal"] == "Price at Support":
        score += 1
        reasoning_points.append("Price is testing the Lower Bollinger Band (Potential Support)")
    
    if indicators.get("volume_spike", 1.0) > 1.5:
        score += 1
        reasoning_points.append(f"Significant volume spike ({indicators['volume_spike']}x) indicates high institutional interest")

    # 5. News & Social Sentiment Impact
    combined_sentiment = news.get("final_sentiment_score", 0)
    if combined_sentiment > 0.4:
        score += 2
        reasoning_points.append(f"Multi-channel sentiment (News+Twitter+WSB) is heavily positive (+{combined_sentiment})")
    elif combined_sentiment > 0.1:
        score += 1
        reasoning_points.append("Social sentiment and news are trending positive")
    elif combined_sentiment < -0.4:
        score -= 2
        reasoning_points.append("Significant negative sentiment across all social and financial channels")
    elif combined_sentiment < -0.1:
        score -= 1
        reasoning_points.append("Minor negative sentiment detected in social channels")

    # 6. Risk Constraint
    if risk["rating"] == "High":
        score -= 1
        reasoning_points.append("High market risk detected; caution is advised")

    # 7. FRED Economic Data Impact
    if fred:
        if fred["interest_rate"] > 5.0:
            score -= 1
            reasoning_points.append(f"High interest rates ({fred['interest_rate']}%) may pressure equities.")
        if fred["gdp_growth"] > 2.0:
            score += 1
            reasoning_points.append(f"Solid GDP growth ({fred['gdp_growth']}%) supports market expansion.")

    # 8. FMP Fundamentals Impact
    if fmp:
        if fmp["revenue_growth"] > 10.0:
            score += 2
            reasoning_points.append(f"Strong revenue growth ({fmp['revenue_growth']}%) indicates robust fundamentals.")
        elif fmp["revenue_growth"] < 0:
            score -= 2
            reasoning_points.append(f"Negative revenue growth ({fmp['revenue_growth']}%) is a bearish fundamental signal.")
        
        if fmp["pe_ratio"] < 15.0:
            score += 1
            reasoning_points.append(f"Low P/E ratio ({fmp['pe_ratio']}) suggests the stock is undervalued.")
        elif fmp["pe_ratio"] > 35.0:
            score -= 1
            reasoning_points.append(f"High P/E ratio ({fmp['pe_ratio']}) points to potential overvaluation.")

    # 9. OpenAI Sentiment Impact
    if openai_analysis:
        if openai_analysis["sentiment"] == "Bullish":
            score += 2
            reasoning_points.append(openai_analysis["ai_reasoning"])
        elif openai_analysis["sentiment"] == "Bearish":
            score -= 2
            reasoning_points.append(openai_analysis["ai_reasoning"])

    # Final Decision
    if score >= 4:
        signal = "STRONG BUY"
    elif score >= 1:
        signal = "BUY"
    elif score <= -4:
        signal = "STRONG SELL"
    elif score <= -1:
        signal = "SELL"
    else:
        signal = "HOLD"
        
    # Base probabilities mapped around score 0 (which is HOLD)
    # Score range expanded due to new APIs (Approx -10 to +10)
    # We will use a simple softmax or heuristic normalization
    
    # Heuristic mapping for percentages:
    base_buy = 33.3
    base_sell = 33.3
    base_hold = 33.4
    
    # Adjust percentages based on score
    buy_pct = min(max(base_buy + (score * 5), 5), 90)
    sell_pct = min(max(base_sell - (score * 5), 5), 90)
    
    # Hold makes up the remainder
    hold_pct = 100 - buy_pct - sell_pct
    
    # Normalize if something went below 0 or Hold became weird
    if hold_pct < 5:
        hold_pct = 5
        # Re-distribute the other two
        total_remaining = buy_pct + sell_pct
        buy_pct = (buy_pct / total_remaining) * 95
        sell_pct = (sell_pct / total_remaining) * 95

    # Confidence calculation remains somewhat similar
    rf_conf = predictions["random_forest"]["confidence"] if "random_forest" in predictions else 50
    confidence = min(rf_conf + abs(score)*3, 99) 

    # Generate INSANE AI Explanation (Narrative)
    explanation = generate_narrative(signal, reasoning_points, risk, news, indicators)

    return {
        "total_score": score,
        "recommendation": signal,
        "confidence": f"{int(confidence)}%",
        "probabilities": {
            "buy": round(buy_pct, 1),
            "hold": round(hold_pct, 1),
            "sell": round(sell_pct, 1)
        },
        "reasoning": reasoning_points,
        "ai_explanation": explanation
    }

def generate_narrative(signal, points, risk, news, indicators):
    sentiment_context = "bullish" if news.get("combined_score", 0) > 0 else "cautious"
    risk_level = risk["rating"].lower()
    
    if signal == "HOLD":
        return f"The market is currently in a state of equilibrium. While {points[0] if points else 'technicals are steady'}, the overall risk is {risk_level}. My stochastic engines (K:{indicators['stochastic']['k']}) suggests high consolidation before the next major move."
    
    verb = "highly recommend" if "STRONG" in signal else "suggest"
    action = "entering a long position" if "BUY" in signal else "exiting or shorting"
    
    narrative = f"My analysis engines {verb} {action}. This is primarily driven by the fact that {points[0] if points else 'multiple signals align'}. "
    
    if indicators['volume_spike'] > 1.2:
        narrative += f"Note the volume surge of {indicators['volume_spike']}x which validates this move. "
        
    narrative += f"Additionally, we are seeing {news['impact']} news impact. "
    
    if risk_level == "high":
        narrative += f"However, with an ATR of {indicators['atr']}, market volatility is significant—please ensure tight stop-losses."
    else:
        narrative += f"The risk profile remains {risk_level}, providing a solid foundation for this {signal} signal."
        
    return narrative
