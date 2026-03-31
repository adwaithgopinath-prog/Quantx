import pandas as pd
import numpy as np

def calculate_all(df: pd.DataFrame):
    if df.empty or len(df) < 50:
        # Fallback for short history
        return {
            "rsi": 50.0,
            "rsi_signal": "Neutral",
            "macd": {"value": 0, "signal_line": 0, "sentiment": "Neutral"},
            "moving_averages": {"ma50": 0, "ma200": 0, "trend": "Neutral"},
            "ema": 0,
            "bollinger": {"upper": 0, "lower": 0, "signal": "Neutral"},
            "stochastic": {"k": 50, "d": 50, "signal": "Neutral"},
            "atr": 0,
            "volume_spike": 1.0
        }

    close = df['Close']
    high = df['High']
    low = df['Low']
    volume = df['Volume']
    
    # 1. RSI
    delta = close.diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
    rs = gain / loss
    rsi = 100 - (100 / (1 + rs))
    current_rsi = round(rsi.iloc[-1], 2)
    rsi_signal = "Oversold" if current_rsi < 30 else "Overbought" if current_rsi > 70 else "Neutral"
    
    # 2. MACD
    ema_12 = close.ewm(span=12, adjust=False).mean()
    ema_26 = close.ewm(span=26, adjust=False).mean()
    macd_line = ema_12 - ema_26
    signal_line = macd_line.ewm(span=9, adjust=False).mean()
    macd_val = round(macd_line.iloc[-1], 3)
    macd_sig = round(signal_line.iloc[-1], 3)
    macd_sentiment = "Bullish crossover" if macd_val > macd_sig else "Bearish"
    
    # 3. Moving Averages (50 & 200)
    ma50 = close.rolling(window=50).mean()
    ma200 = close.rolling(window=200).mean() if len(df) >= 200 else ma50
    curr_ma50 = round(ma50.iloc[-1], 2)
    curr_ma200 = round(ma200.iloc[-1], 2)
    
    ma_trend = "Golden Cross" if curr_ma50 > curr_ma200 else "Death Cross"
    if abs(curr_ma50 - curr_ma200) / curr_ma200 < 0.02:
        ma_trend = "Consolidating"

    # 4. EMA
    ema20 = close.ewm(span=20, adjust=False).mean()
    curr_ema20 = round(ema20.iloc[-1], 2)

    # 5. Volatility: Bollinger Bands
    std = close.rolling(window=20).std()
    sma20 = close.rolling(window=20).mean()
    upper_bb = sma20 + (std * 2)
    lower_bb = sma20 - (std * 2)
    curr_upper = round(upper_bb.iloc[-1], 2)
    curr_lower = round(lower_bb.iloc[-1], 2)
    
    bb_signal = "Price at Resistance" if close.iloc[-1] >= curr_upper else "Price at Support" if close.iloc[-1] <= curr_lower else "Neutral"

    # 6. Momentum: Stochastic Oscillator
    low_14 = low.rolling(window=14).min()
    high_14 = high.rolling(window=14).max()
    stoch_k = 100 * (close - low_14) / (high_14 - low_14)
    stoch_d = stoch_k.rolling(window=3).mean()
    curr_k = round(stoch_k.iloc[-1], 2)
    curr_d = round(stoch_d.iloc[-1], 2)
    stoch_signal = "Oversold" if curr_k < 20 else "Overbought" if curr_k > 80 else "Neutral"

    # 7. Volatility: ATR
    tr1 = high - low
    tr2 = abs(high - close.shift())
    tr3 = abs(low - close.shift())
    tr = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)
    atr = tr.rolling(window=14).mean()
    curr_atr = round(atr.iloc[-1], 2)

    # 8. Volume Spike
    avg_vol = volume.rolling(window=20).mean()
    vol_spike = round(volume.iloc[-1] / avg_vol.iloc[-1], 2) if avg_vol.iloc[-1] > 0 else 1.0

    return {
        "rsi": current_rsi,
        "rsi_signal": rsi_signal,
        "macd": {
            "value": macd_val,
            "signal_line": macd_sig,
            "sentiment": macd_sentiment
        },
        "moving_averages": {
            "ma50": curr_ma50,
            "ma200": curr_ma200,
            "trend": ma_trend,
            "ema20": curr_ema20
        },
        "bollinger": {
            "upper": curr_upper,
            "lower": curr_lower,
            "signal": bb_signal
        },
        "stochastic": {
            "k": curr_k,
            "d": curr_d,
            "signal": stoch_signal
        },
        "atr": curr_atr,
        "volume_spike": vol_spike
    }
