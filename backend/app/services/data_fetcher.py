import yfinance as yf
import pandas as pd
import random
import requests
import logging
import pytz
from datetime import datetime, timedelta, time
from app.services import stock_universe

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("error.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("DataFetcher")

# Simple in-memory cache for historical data and info
# Structure: {cache_key: (data, timestamp)}
HISTORY_CACHE = {}
INFO_CACHE = {}
CACHE_TTL = 60  # 60 seconds TTL

def is_market_open():
    """
    Detects if the Indian Market (NSE/BSE) is currently open.
    IST: 9:15 AM - 3:30 PM, Monday - Friday.
    """
    try:
        tz = pytz.timezone('Asia/Kolkata')
        now = datetime.now(tz)
        
        # Check weekend
        if now.weekday() >= 5:
            return False
            
        market_open_time = time(9, 15)
        market_close_time = time(15, 30)
        current_time = now.time()
        
        if current_time < market_open_time or current_time > market_close_time:
            return False
            
        return True
    except Exception as e:
        logger.error(f"Error checking market status: {e}")
        return True # Default to True to avoid false warnings if error

def format_ticker(symbol: str, exchange: str = "NSE"):
    """
    Helper function to ensure correct yfinance ticker format.
    NSE stocks -> .NS, BSE stocks -> .BO
    Global stocks -> no suffix
    """
    if not symbol:
        return symbol
    
    symbol = symbol.upper().strip()
    
    # If it's already a well-known index or crypto, return as is
    if symbol.startswith("^") or "-" in symbol:
        return symbol

    # If it already has a valid suffix, return as is
    if symbol.endswith(".NS") or symbol.endswith(".BO"):
        return symbol
    
    # If it's a numeric BSE code, add .BO
    if symbol.isdigit() and len(symbol) == 6:
        return f"{symbol}.BO"
        
    # If exchange is explicitly GLOBAL or it looks like a global ticker (no dot)
    # we don't add any suffix.
    if exchange.upper() == "GLOBAL" or "." not in symbol:
        return symbol
    
    # Otherwise, default to NSE for Indian stocks if no suffix
    if exchange.upper() == "NSE":
        return f"{symbol}.NS"
    if exchange.upper() == "BSE":
        return f"{symbol}.BO"
        
    return symbol

def validate_symbol(symbol: str):
    """
    Validates the symbol format according to requirements:
    NSE: ends in .NS
    BSE: ends in .BO
    Global: no suffix (standard US ticker)
    """
    if not symbol:
        raise ValueError("Symbol cannot be empty")
    
    symbol = symbol.strip().upper()
    
    # Exception for indices and crypto which might have special formats
    if symbol.startswith("^") or "-" in symbol:
        return True

    if symbol.endswith(".NS"):
        return True
    if symbol.endswith(".BO"):
        return True
    
    # If no suffix, it should be a global stock (letters only, max 5-6 chars)
    if "." not in symbol:
        return True
    
    raise ValueError(f"Invalid symbol format: {symbol}. NSE must end in .NS, BSE in .BO, Global no suffix.")

def get_stock_history(symbol: str, period: str = "3mo", source: str = "yahoo"):
    """
    Unified fetcher for historical stock prices with caching and error resilience.
    """
    validate_symbol(symbol)
    original_symbol = symbol
    symbol = format_ticker(symbol)
    cache_key = f"hist_{symbol}_{period}_{source}"
    now = datetime.now()
    
    # Check cache first
    if cache_key in HISTORY_CACHE:
        data, timestamp = HISTORY_CACHE[cache_key]
        if (now - timestamp).total_seconds() < CACHE_TTL:
            return data

    df = pd.DataFrame()
    if source == "yahoo":
        try:
            ticker = yf.Ticker(symbol)
            df = ticker.history(period=period)
            
            # If 1d is empty (market closed/no trades), try 5d to get last close
            if df.empty and period == "1d":
                df = ticker.history(period="5d")
                
            if not df.empty:
                HISTORY_CACHE[cache_key] = (df, now)
                return df
            
            # If still empty, try to return from cache even if expired
            if cache_key in HISTORY_CACHE:
                logger.warning(f"Returning expired cache for {symbol} due to empty yfinance response")
                return HISTORY_CACHE[cache_key][0]
                
        except Exception as e:
            logger.error(f"yfinance history call failed for {symbol}: {e}")
            if cache_key in HISTORY_CACHE:
                logger.info(f"Returning cached value for {symbol} after failure")
                return HISTORY_CACHE[cache_key][0]
            df = pd.DataFrame()

    elif source == "alpha_vantage":
        return get_alpha_vantage_data(symbol)
    elif source == "polygon":
        return get_polygon_data(symbol)
    
    if df.empty:
        logger.warning(f"Returning mock data for {symbol} due to empty fetch")
        # Generate MORE REALISTIC mock data if symbol is missing/invalid
        dates = pd.date_range(end=pd.Timestamp.now(), periods=90)
        base = random.uniform(500, 2500)
        prices = []
        curr = base
        for _ in range(90):
            curr += random.uniform(-curr*0.02, curr*0.02)
            prices.append(curr)
        
        df = pd.DataFrame({
            "Open": [p * 0.99 for p in prices],
            "High": [p * 1.01 for p in prices],
            "Low": [p * 0.98 for p in prices],
            "Close": prices,
            "Volume": [random.randint(500000, 5000000) for _ in range(90)]
        }, index=dates)
    
    return df

def get_alpha_vantage_data(symbol: str, api_key: str = "YOUR_API_KEY"):
    dates = pd.date_range(end=pd.Timestamp.now(), periods=10)
    df = pd.DataFrame({
        "Open": [random.uniform(500, 2000) for _ in range(10)],
        "Close": [random.uniform(500, 2000) for _ in range(10)],
        "Volume": [random.randint(100000, 500000) for _ in range(10)]
    }, index=dates)
    return df

def get_polygon_data(symbol: str, api_key: str = "YOUR_API_KEY"):
    return {
        "ticker": symbol,
        "todaysChange": random.uniform(-2, 2),
        "lastTrade": {"price": random.uniform(500, 2500), "size": 100},
        "source": "Polygon.io Tick Tape"
    }

def get_stock_info(symbol: str, exchange: str = "NSE"):
    """
    Robust info fetcher using fast_info with fallback logic and caching.
    Follows strict priority: fast_info -> info -> cache (stale)
    """
    validate_symbol(symbol)
    original_symbol = symbol
    symbol = format_ticker(symbol, exchange)
    cache_key = f"info_{symbol}"
    now = datetime.now()
    market_open = is_market_open()
    
    current_price = None
    info = {}
    stale = False

    try:
        ticker = yf.Ticker(symbol)
        
        # 1. Primary: fast_info["last_price"]
        try:
            current_price = ticker.fast_info.get("last_price")
        except:
            current_price = None
            
        # 2. Fallback: info["regularMarketPrice"]
        if current_price is None or pd.isna(current_price):
            try:
                info = ticker.info
                current_price = info.get("regularMarketPrice")
            except:
                info = {}
        else:
            # Still try to get basic info for metadata if possible
            try:
                info = ticker.info
            except:
                info = {}
                
    except Exception as e:
        logger.error(f"yfinance call failed for {symbol}: {e}")

    # 3. Last Resort: return error if no data
    if current_price is None or pd.isna(current_price) or current_price == 0:
        if cache_key in INFO_CACHE:
            result = INFO_CACHE[cache_key][0].copy()
            result["stale"] = True
            result["market_open"] = market_open
            return result
        else:
            return {"error": "data_unavailable", "message": "No data available for this stock"}

    # Calculate change metrics
    prev_close = info.get("previousClose")
    if not prev_close:
        try:
            # Minimal history call just for change calculation if info fails
            hist = ticker.history(period="5d")
            if not hist.empty and len(hist) > 1:
                prev_close = hist['Close'].iloc[-2]
        except:
            prev_close = current_price

    change = (current_price - prev_close) if current_price and prev_close else 0
    change_pct = (change / prev_close * 100) if prev_close and prev_close != 0 else 0

    result = {
        "market_cap": info.get("marketCap", 0),
        "pe_ratio": info.get("trailingPE", 0),
        "dividend_yield": info.get("dividendYield", 0),
        "fifty_two_week_high": info.get("fiftyTwoWeekHigh", 0),
        "fifty_two_week_low": info.get("fiftyTwoWeekLow", 0),
        "sector": info.get("sector", "Sector Unknown"),
        "full_name": info.get("longName", original_symbol),
        "volume": info.get("volume", 0),
        "price": round(float(current_price), 2) if current_price else 0,
        "change": round(float(change), 2),
        "change_pct": round(float(change_pct), 2),
        "market_open": market_open,
        "stale": stale
    }

    # Update cache if we have a valid price
    if current_price and current_price != 0:
        INFO_CACHE[cache_key] = (result, now)
        
    return result

def get_sector_performance():
    sector_map = {
        "Technology": ["TCS.NS", "INFY.NS", "WIPRO.NS", "HCLTECH.NS"],
        "Financial Services": ["HDFCBANK.NS", "ICICIBANK.NS", "SBIN.NS", "KOTAKBANK.NS"],
        "Energy": ["RELIANCE.NS", "ONGC.NS", "BPCL.NS", "COALINDIA.NS"],
        "Healthcare": ["SUNPHARMA.NS", "DRREDDY.NS", "CIPLA.NS", "APOLLOHOSP.NS"],
        "Consumer Cyclical": ["MM.NS", "MARUTI.NS", "EICHERMOT.NS"],
        "Basic Materials": ["TATASTEEL.NS", "JSWSTEEL.NS", "HINDALCO.NS", "ULTRACEMCO.NS"]
    }
    
    performance = []
    for sector, tickers in sector_map.items():
        total_change = 0
        valid_stocks = 0
        top_stock = tickers[0]
        max_change = -999
        
        for t in tickers:
            try:
                info = get_stock_info(t)
                if info.get("price") and not info.get("stale"):
                    total_change += info["change_pct"]
                    valid_stocks += 1
                    if info["change_pct"] > max_change:
                        max_change = info["change_pct"]
                        top_stock = t
            except Exception as e:
                logger.debug(f"Error in sector calc for {t}: {e}")
                continue
                
        avg_change = round(total_change / valid_stocks, 2) if valid_stocks > 0 else 0
        performance.append({
            "sector": sector,
            "change": avg_change,
            "top_performer": top_stock.split('.')[0]
        })
        
    return performance

def get_trending_symbols():
    return [
        "RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "INFY.NS", 
        "ICICIBANK.NS", "SBIN.NS", "HINDUNILVR.NS", "BHARTIARTL.NS",
        "ADANIENT.NS", "ITC.NS", "MM.NS", "BAJFINANCE.NS"
    ]

def format_for_chart(df: pd.DataFrame):
    if df.empty: return []
    
    try:
        # Calculate Moving Averages
        df['SMA20'] = df['Close'].rolling(window=20).mean()
        df['SMA50'] = df['Close'].rolling(window=50).mean()
        df['SMA200'] = df['Close'].rolling(window=200).mean()
        
        df_chart = df.tail(252)
        
        chart_data = []
        for date, row in df_chart.iterrows():
            chart_data.append({
                "time": date.strftime("%Y-%m-%d") if hasattr(date, 'strftime') else str(date),
                "open": round(row['Open'], 2),
                "high": round(row['High'], 2),
                "low": round(row['Low'], 2),
                "close": round(row['Close'], 2),
                "volume": int(row['Volume']),
                "sma20": round(row['SMA20'], 2) if pd.notnull(row['SMA20']) else None,
                "sma50": round(row['SMA50'], 2) if pd.notnull(row['SMA50']) else None,
                "sma200": round(row['SMA200'], 2) if pd.notnull(row['SMA200']) else None
            })
        return chart_data
    except Exception as e:
        logger.error(f"Error formatting chart data: {e}")
        return []
