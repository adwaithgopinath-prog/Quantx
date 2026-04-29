import pandas as pd
import requests
import io
import json
import os
from datetime import datetime
from apscheduler.schedulers.background import BackgroundScheduler
import yfinance as yf

# Global in-memory store
STOCK_UNIVERSE = []
SEARCH_INDEX = {}  # symbol -> stock for O(1) lookup

def fetch_complete_nse_list():
    """
    Fetches every single equity listed on NSE from the
    official NSE archives. Updated daily by NSE.
    Contains 2000+ companies including all small/micro caps.
    """
    url = "https://archives.nseindia.com/content/equities/EQUITY_L.csv"

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "keep-alive",
        "Referer": "https://www.nseindia.com/",
        "Cookie": ""
    }

    # NSE blocks direct requests — use a session with cookies
    session = requests.Session()

    # First hit the main NSE page to get session cookies
    try:
        session.get(
            "https://www.nseindia.com",
            headers=headers,
            timeout=15
        )
    except:
        pass

    # Now download the CSV with the session cookies
    try:
        response = session.get(url, headers=headers, timeout=30)
        response.raise_for_status()

        df = pd.read_csv(io.StringIO(response.text))

        stocks = []
        for _, row in df.iterrows():
            symbol = str(row.get("SYMBOL", "")).strip()
            name = str(row.get("NAME OF COMPANY", "")).strip()
            isin = str(row.get("ISIN NUMBER", "")).strip()
            series = str(row.get("SERIES", "EQ")).strip()

            if not symbol or not name:
                continue

            # Only include EQ series (regular equity)
            # but also include BE, BZ, SM, ST series
            # to cover all tradeable instruments
            stocks.append({
                "symbol": symbol,
                "name": name,
                "exchange": "NSE",
                "yf_symbol": symbol + ".NS",
                "isin": isin,
                "series": series,
                "type": "STOCK",
                "sector": None,
                "market_cap_category": None
            })

        print(f"NSE: fetched {len(stocks)} total listed equities")
        return stocks
    except Exception as e:
        print(f"Primary NSE source fetch failed: {e}")
        raise e

def fetch_nse_classifications():
    """
    Downloads NSE index constituent lists to tag each stock
    with its sector and market cap category.
    """
    classifications = {}

    index_files = {
        "https://archives.nseindia.com/content/indices/ind_nifty500list.csv": "LARGE_MID",
        "https://archives.nseindia.com/content/indices/ind_niftymidcap150list.csv": "MID",
        "https://archives.nseindia.com/content/indices/ind_niftysmallcap250list.csv": "SMALL",
        "https://archives.nseindia.com/content/indices/ind_niftymicrocap250_list.csv": "MICRO",
    }

    headers = {"User-Agent": "Mozilla/5.0"}

    for url, cap_category in index_files.items():
        try:
            df = pd.read_csv(url, storage_options={"User-Agent": "Mozilla/5.0"})
            for _, row in df.iterrows():
                sym = str(row.get("Symbol", "")).strip()
                industry = str(row.get("Industry", "")).strip()
                if sym:
                    classifications[sym] = {
                        "sector": industry if industry != "nan" else None,
                        "market_cap_category": cap_category
                    }
        except Exception as e:
            print(f"Classification fetch failed for {url}: {e}")
            continue

    return classifications

def enrich_with_classifications(stocks, classifications):
    """
    Tags each stock with sector and market cap category.
    Stocks not in any index are tagged as MICRO or UNLISTED_SMALL.
    """
    for stock in stocks:
        sym = stock["symbol"]
        if sym in classifications:
            stock["sector"] = classifications[sym]["sector"]
            stock["market_cap_category"] = classifications[sym]["market_cap_category"]
        else:
            # Not in any major index — tag as micro/small cap
            stock["market_cap_category"] = "MICRO"
    return stocks

def validate_universe(stocks):
    """
    Spot check that specific stocks are present.
    These are known NSE listed stocks that were previously missing.
    """
    must_have = [
        "ANANTRAJ",    # Anant Raj Ltd
        "ZOMATO",      # Zomato Ltd
        "NYKAA",       # FSN E-Commerce (Nykaa)
        "PAYTM",       # One 97 Communications
        "DELHIVERY",   # Delhivery Ltd
        "POLICYBZR",   # PB Fintech (PolicyBazaar)
        "CARTRADE",    # CarTrade Tech
        "NAZARA",      # Nazara Technologies
        "IRCTC",       # Indian Railway Catering
        "RAILTEL",     # RailTel Corporation
        "HAPPSTMNDS",  # Happiest Minds (Correct symbol)
        "LATENTVIEW",  # LatentView Analytics
        "BIKAJI",      # Bikaji Foods
        "CAMPUS",      # Campus Activewear
        "MEDANTA",     # Global Health (Medanta)
    ]

    symbols_in_universe = {s["symbol"].upper() for s in stocks}
    missing = [s for s in must_have if s.upper() not in symbols_in_universe]

    if missing:
        print(f"WARNING: These stocks are missing from universe: {missing}")
        # Debug: Print first 10 symbols to check format
        print(f"First 10 symbols in universe: {list(symbols_in_universe)[:10]}")
    else:
        print("Validation passed — all spot check stocks present")

    return missing

def fetch_nse_fallback():
    """
    Fallback source if NSE archives blocks the request.
    Uses the NSE's own API endpoint as backup.
    """
    stocks = []

    # Fallback 1 — NSE API
    try:
        session = requests.Session()
        session.get("https://www.nseindia.com", headers={
            "User-Agent": "Mozilla/5.0"
        }, timeout=10)
        r = session.get(
            "https://www.nseindia.com/api/equity-stockIndices?index=SECURITIES%20IN%20F%26O",
            headers={"User-Agent": "Mozilla/5.0"},
            timeout=15
        )
        data = r.json()
        for item in data.get("data", []):
            sym = item.get("symbol", "").strip()
            if sym:
                stocks.append({
                    "symbol": sym,
                    "name": item.get("meta", {}).get("companyName", sym),
                    "exchange": "NSE",
                    "yf_symbol": sym + ".NS",
                    "isin": item.get("meta", {}).get("isin", ""),
                    "type": "STOCK",
                    "sector": item.get("meta", {}).get("industry", None),
                    "market_cap_category": None
                })
    except Exception as e:
        print(f"NSE API fallback failed: {e}")

    # Fallback 2 — use hardcoded Nifty 500 + known stocks
    # as absolute last resort
    if len(stocks) < 100:
        print("Using hardcoded fallback list")
        stocks = get_hardcoded_nse_stocks()

    return stocks

def get_hardcoded_nse_stocks():
    """
    Absolute last resort — top 500 NSE stocks hardcoded.
    Includes all major, mid, small cap stocks.
    """
    nse_symbols = [
        # NIFTY 50
        ("RELIANCE","Reliance Industries Ltd","Energy"),
        ("TCS","Tata Consultancy Services Ltd","IT"),
        ("HDFCBANK","HDFC Bank Ltd","Banking"),
        ("INFY","Infosys Ltd","IT"),
        ("ICICIBANK","ICICI Bank Ltd","Banking"),
        ("HINDUNILVR","Hindustan Unilever Ltd","FMCG"),
        ("ITC","ITC Ltd","FMCG"),
        ("SBIN","State Bank of India","Banking"),
        ("BHARTIARTL","Bharti Airtel Ltd","Telecom"),
        ("KOTAKBANK","Kotak Mahindra Bank Ltd","Banking"),
        ("LT","Larsen and Toubro Ltd","Infrastructure"),
        ("AXISBANK","Axis Bank Ltd","Banking"),
        ("ASIANPAINT","Asian Paints Ltd","Chemicals"),
        ("MARUTI","Maruti Suzuki India Ltd","Auto"),
        ("TITAN","Titan Company Ltd","Consumer"),
        ("BAJFINANCE","Bajaj Finance Ltd","Finance"),
        ("WIPRO","Wipro Ltd","IT"),
        ("ULTRACEMCO","UltraTech Cement Ltd","Cement"),
        ("NESTLEIND","Nestle India Ltd","FMCG"),
        ("POWERGRID","Power Grid Corporation","Energy"),
        ("NTPC","NTPC Ltd","Energy"),
        ("TECHM","Tech Mahindra Ltd","IT"),
        ("HCLTECH","HCL Technologies Ltd","IT"),
        ("TATAMOTORS","Tata Motors Ltd","Auto"),
        ("TATASTEEL","Tata Steel Ltd","Metals"),
        ("ADANIENTS","Adani Enterprises Ltd","Conglomerate"),
        ("ADANIPORTS","Adani Ports and SEZ Ltd","Infrastructure"),
        ("BAJAJFINSV","Bajaj Finserv Ltd","Finance"),
        ("JSWSTEEL","JSW Steel Ltd","Metals"),
        ("ONGC","Oil and Natural Gas Corporation","Energy"),
        ("COALINDIA","Coal India Ltd","Energy"),
        ("DIVISLAB","Divis Laboratories Ltd","Pharma"),
        ("DRREDDY","Dr Reddys Laboratories Ltd","Pharma"),
        ("SUNPHARMA","Sun Pharmaceutical Industries","Pharma"),
        ("CIPLA","Cipla Ltd","Pharma"),
        ("EICHERMOT","Eicher Motors Ltd","Auto"),
        ("HEROMOTOCO","Hero MotoCorp Ltd","Auto"),
        ("BPCL","Bharat Petroleum Corporation","Energy"),
        ("BRITANNIA","Britannia Industries Ltd","FMCG"),
        ("APOLLOHOSP","Apollo Hospitals Enterprise","Healthcare"),
        # NIFTY NEXT 50
        ("DMART","Avenue Supermarts Ltd","Retail"),
        ("PIDILITIND","Pidilite Industries Ltd","Chemicals"),
        ("SIEMENS","Siemens Ltd","Industrials"),
        ("HAVELLS","Havells India Ltd","Electricals"),
        ("DABUR","Dabur India Ltd","FMCG"),
        ("MARICO","Marico Ltd","FMCG"),
        ("GODREJCP","Godrej Consumer Products","FMCG"),
        ("BERGEPAINT","Berger Paints India Ltd","Chemicals"),
        ("TATACONSUM","Tata Consumer Products","FMCG"),
        ("INDUSINDBK","IndusInd Bank Ltd","Banking"),
        # MID CAP
        ("ANANTRAJ","Anant Raj Ltd","Realty"),
        ("ZOMATO","Zomato Ltd","Consumer Tech"),
        ("NYKAA","FSN E-Commerce Ventures","Retail"),
        ("PAYTM","One 97 Communications","Fintech"),
        ("DELHIVERY","Delhivery Ltd","Logistics"),
        ("IRCTC","Indian Railway Catering","Travel"),
        ("IRFC","Indian Railway Finance Corp","Finance"),
        ("POLICYBZR","PB Fintech Ltd","Insurance Tech"),
        ("HAPPSTMNDS","Happiest Minds Technologies","IT"),
        ("LATENTVIEW","LatentView Analytics Ltd","IT"),
        ("NAZARA","Nazara Technologies Ltd","Gaming"),
        ("MPHASIS","Mphasis Ltd","IT"),
        ("PERSISTENT","Persistent Systems Ltd","IT"),
        ("COFORGE","Coforge Ltd","IT"),
        ("LTIM","LTIMindtree Ltd","IT"),
        ("TATAELXSI","Tata Elxsi Ltd","IT"),
        ("BIKAJI","Bikaji Foods International","FMCG"),
        ("CAMPUS","Campus Activewear Ltd","Consumer"),
        ("MEDANTA","Global Health Ltd","Healthcare"),
        ("YATHARTH","Yatharth Hospital","Healthcare"),
        ("RAILTEL","RailTel Corporation","Telecom"),
        ("CARTRADE","CarTrade Tech Ltd","Auto Tech"),
        ("NUVOCO","Nuvoco Vistas Corporation","Cement"),
        ("SAPPHIRE","Sapphire Foods India","QSR"),
        ("DEVYANI","Devyani International","QSR"),
        ("WESTLIFE","Westlife Foodworld","QSR"),
        ("JUBLFOOD","Jubilant Foodworks","QSR"),
        ("PAGEIND","Page Industries Ltd","Textile"),
        ("TRENT","Trent Ltd","Retail"),
        ("VSTIND","VST Industries Ltd","FMCG"),
        ("CAMS","Computer Age Mgmt Services","Finance"),
        ("CDSL","Central Depository Services","Finance"),
        ("BSE","BSE Ltd","Finance"),
        ("MCLEODRUS","McLeod Russel India","Agri"),
        ("RVNL","Rail Vikas Nigam Ltd","Infrastructure"),
        ("IRCON","Ircon International Ltd","Infrastructure"),
        ("NBCC","NBCC India Ltd","Infrastructure"),
        ("HUDCO","Housing and Urban Dev Corp","Finance"),
        ("RECLTD","REC Ltd","Finance"),
        ("PFC","Power Finance Corporation","Finance"),
        ("SJVN","SJVN Ltd","Energy"),
        ("NHPC","NHPC Ltd","Energy"),
        ("NLCINDIA","NLC India Ltd","Energy"),
        ("BHEL","Bharat Heavy Electricals","Industrials"),
        ("SAIL","Steel Authority of India","Metals"),
        ("MOIL","MOIL Ltd","Metals"),
        ("NMDC","NMDC Ltd","Metals"),
        ("HINDZINC","Hindustan Zinc Ltd","Metals"),
        ("VEDL","Vedanta Ltd","Metals"),
        ("JINDALSTEL","Jindal Steel and Power","Metals"),
        ("JSWENERGY","JSW Energy Ltd","Energy"),
        ("TATAPOWER","Tata Power Company","Energy"),
        ("TORNTPOWER","Torrent Power Ltd","Energy"),
        ("CESC","CESC Ltd","Energy"),
    ]

    return [
        {
            "symbol": s[0],
            "name": s[1],
            "exchange": "NSE",
            "yf_symbol": s[0] + ".NS",
            "isin": "",
            "type": "STOCK",
            "sector": s[2],
            "market_cap_category": None
        }
        for s in nse_symbols
    ]

def fetch_bse_stocks():
    print("Fetching BSE stocks...")
    url = "https://api.bseindia.com/BseIndiaAPI/api/ListofScripData/w?Group=&Scripcode=&industry=&segment=Equity&status=Active"
    headers = {
        "User-Agent": "Mozilla/5.0",
        "Referer": "https://www.bseindia.com/"
    }
    try:
        r = requests.get(url, headers=headers, timeout=15)
        data = r.json()
        stocks = []
        
        # BSE API can return a dict with "Table" or a direct list
        items = []
        if isinstance(data, dict):
            items = data.get("Table", [])
        elif isinstance(data, list):
            items = data
            
        for item in items:
            stocks.append({
                "symbol": str(item.get("SCRIP_CD", "")).strip(),
                "name": str(item.get("Scrip_Name", "")).strip(),
                "exchange": "BSE",
                "yf_symbol": str(item.get("SCRIP_CD", "")).strip() + ".BO",
                "isin": str(item.get("ISIN_Code", "")).strip(),
                "type": "STOCK",
                "sector": str(item.get("INDUSTRY", "")).strip(),
                "market_cap_category": "BSE_UNCLASSIFIED"
            })
        return stocks
    except Exception as e:
        print(f"Error fetching BSE stocks: {e}")
        return []

def fetch_nse_etfs():
    print("Fetching NSE ETFs...")
    url = "https://archives.nseindia.com/content/equities/eq_etfseclist.csv"
    headers = {"User-Agent": "Mozilla/5.0"}
    try:
        # Use latin1 encoding as NSE CSVs often contain special characters
        df = pd.read_csv(url, storage_options={"User-Agent": "Mozilla/5.0"}, encoding='latin1')
        etfs = []
        for _, row in df.iterrows():
            etfs.append({
                "symbol": str(row.get("SYMBOL", "")).strip(),
                "name": str(row.get("SECURITY NAME", "")).strip(),
                "exchange": "NSE",
                "yf_symbol": str(row.get("SYMBOL", "")).strip() + ".NS",
                "isin": str(row.get("ISIN", "")).strip(),
                "type": "ETF",
                "sector": "ETF",
                "market_cap_category": "ETF"
            })
        return etfs
    except Exception as e:
        print(f"Error fetching NSE ETFs: {e}")
        return []

def fetch_nse_indices():
    return [
        {"symbol": "NIFTY50", "name": "Nifty 50 Index", "exchange": "NSE", "yf_symbol": "^NSEI", "type": "INDEX", "sector": "INDEX", "market_cap_category": "INDEX"},
        {"symbol": "SENSEX", "name": "BSE Sensex Index", "exchange": "BSE", "yf_symbol": "^BSESN", "type": "INDEX", "sector": "INDEX", "market_cap_category": "INDEX"},
        {"symbol": "BANKNIFTY", "name": "Nifty Bank Index", "exchange": "NSE", "yf_symbol": "^NSEBANK", "type": "INDEX", "sector": "INDEX", "market_cap_category": "INDEX"},
        {"symbol": "NIFTYMIDCAP", "name": "Nifty Midcap 100", "exchange": "NSE", "yf_symbol": "^CNXMIDCAP", "type": "INDEX", "sector": "INDEX", "market_cap_category": "INDEX"},
        {"symbol": "NIFTYIT", "name": "Nifty IT Index", "exchange": "NSE", "yf_symbol": "^CNXIT", "type": "INDEX", "sector": "INDEX", "market_cap_category": "INDEX"},
        {"symbol": "NIFTYPHARMA", "name": "Nifty Pharma Index", "exchange": "NSE", "yf_symbol": "^CNXPHARMA", "type": "INDEX", "sector": "INDEX", "market_cap_category": "INDEX"},
        {"symbol": "NIFTYAUTO", "name": "Nifty Auto Index", "exchange": "NSE", "yf_symbol": "^CNXAUTO", "type": "INDEX", "sector": "INDEX", "market_cap_category": "INDEX"},
        {"symbol": "NIFTYFMCG", "name": "Nifty FMCG Index", "exchange": "NSE", "yf_symbol": "^CNXFMCG", "type": "INDEX", "sector": "INDEX", "market_cap_category": "INDEX"},
        {"symbol": "NIFTYMETAL", "name": "Nifty Metal Index", "exchange": "NSE", "yf_symbol": "^CNXMETAL", "type": "INDEX", "sector": "INDEX", "market_cap_category": "INDEX"},
        {"symbol": "NIFTYREALTY", "name": "Nifty Realty Index", "exchange": "NSE", "yf_symbol": "^CNXREALTY", "type": "INDEX", "sector": "INDEX", "market_cap_category": "INDEX"},
        {"symbol": "NIFTY500", "name": "Nifty 500 Index", "exchange": "NSE", "yf_symbol": "^CNX500", "type": "INDEX", "sector": "INDEX", "market_cap_category": "INDEX"},
        {"symbol": "NIFTYNEXT50", "name": "Nifty Next 50", "exchange": "NSE", "yf_symbol": "^NSMIDCP50", "type": "INDEX", "sector": "INDEX", "market_cap_category": "INDEX"},
        {"symbol": "NIFTYSMALLCAP", "name": "Nifty Smallcap 100", "exchange": "NSE", "yf_symbol": "^CNXSMALLCAP", "type": "INDEX", "sector": "INDEX", "market_cap_category": "INDEX"},
    ]

def fetch_global_stocks():
    return [
        {"symbol": "AAPL", "name": "Apple Inc.", "exchange": "NASDAQ", "yf_symbol": "AAPL", "type": "GLOBAL", "sector": "Technology", "market_cap_category": "MEGA"},
        {"symbol": "MSFT", "name": "Microsoft Corporation", "exchange": "NASDAQ", "yf_symbol": "MSFT", "type": "GLOBAL", "sector": "Technology", "market_cap_category": "MEGA"},
        {"symbol": "GOOGL", "name": "Alphabet Inc.", "exchange": "NASDAQ", "yf_symbol": "GOOGL", "type": "GLOBAL", "sector": "Technology", "market_cap_category": "MEGA"},
        {"symbol": "AMZN", "name": "Amazon.com Inc.", "exchange": "NASDAQ", "yf_symbol": "AMZN", "type": "GLOBAL", "sector": "Consumer", "market_cap_category": "MEGA"},
        {"symbol": "NVDA", "name": "NVIDIA Corporation", "exchange": "NASDAQ", "yf_symbol": "NVDA", "type": "GLOBAL", "sector": "Technology", "market_cap_category": "MEGA"},
        {"symbol": "TSLA", "name": "Tesla Inc.", "exchange": "NASDAQ", "yf_symbol": "TSLA", "type": "GLOBAL", "sector": "Auto", "market_cap_category": "MEGA"},
        {"symbol": "META", "name": "Meta Platforms Inc.", "exchange": "NASDAQ", "yf_symbol": "META", "type": "GLOBAL", "sector": "Technology", "market_cap_category": "MEGA"},
        {"symbol": "BRK-B", "name": "Berkshire Hathaway", "exchange": "NYSE", "yf_symbol": "BRK-B", "type": "GLOBAL", "sector": "Finance", "market_cap_category": "MEGA"},
        {"symbol": "JPM", "name": "JPMorgan Chase", "exchange": "NYSE", "yf_symbol": "JPM", "type": "GLOBAL", "sector": "Banking", "market_cap_category": "MEGA"},
        {"symbol": "V", "name": "Visa Inc.", "exchange": "NYSE", "yf_symbol": "V", "type": "GLOBAL", "sector": "Finance", "market_cap_category": "MEGA"},
        {"symbol": "NFLX", "name": "Netflix Inc.", "exchange": "NASDAQ", "yf_symbol": "NFLX", "type": "GLOBAL", "sector": "Media", "market_cap_category": "MEGA"},
        {"symbol": "AMD", "name": "Advanced Micro Devices", "exchange": "NASDAQ", "yf_symbol": "AMD", "type": "GLOBAL", "sector": "Technology", "market_cap_category": "LARGE"},
        {"symbol": "UBER", "name": "Uber Technologies", "exchange": "NYSE", "yf_symbol": "UBER", "type": "GLOBAL", "sector": "Transport", "market_cap_category": "LARGE"},
        {"symbol": "COIN", "name": "Coinbase Global", "exchange": "NASDAQ", "yf_symbol": "COIN", "type": "GLOBAL", "sector": "Crypto", "market_cap_category": "LARGE"},
        {"symbol": "PLTR", "name": "Palantir Technologies", "exchange": "NYSE", "yf_symbol": "PLTR", "type": "GLOBAL", "sector": "Technology", "market_cap_category": "LARGE"},
    ]

def fetch_crypto():
    return [
        {"symbol": "BTC", "name": "Bitcoin", "exchange": "CRYPTO", "yf_symbol": "BTC-INR", "type": "CRYPTO", "sector": "Crypto", "market_cap_category": "CRYPTO"},
        {"symbol": "ETH", "name": "Ethereum", "exchange": "CRYPTO", "yf_symbol": "ETH-INR", "type": "CRYPTO", "sector": "Crypto", "market_cap_category": "CRYPTO"},
        {"symbol": "BNB", "name": "BNB", "exchange": "CRYPTO", "yf_symbol": "BNB-INR", "type": "CRYPTO", "sector": "Crypto", "market_cap_category": "CRYPTO"},
        {"symbol": "SOL", "name": "Solana", "exchange": "CRYPTO", "yf_symbol": "SOL-INR", "type": "CRYPTO", "sector": "Crypto", "market_cap_category": "CRYPTO"},
        {"symbol": "XRP", "name": "XRP", "exchange": "CRYPTO", "yf_symbol": "XRP-INR", "type": "CRYPTO", "sector": "Crypto", "market_cap_category": "CRYPTO"},
        {"symbol": "ADA", "name": "Cardano", "exchange": "CRYPTO", "yf_symbol": "ADA-INR", "type": "CRYPTO", "sector": "Crypto", "market_cap_category": "CRYPTO"},
        {"symbol": "DOGE", "name": "Dogecoin", "exchange": "CRYPTO", "yf_symbol": "DOGE-INR", "type": "CRYPTO", "sector": "Crypto", "market_cap_category": "CRYPTO"},
        {"symbol": "MATIC", "name": "Polygon", "exchange": "CRYPTO", "yf_symbol": "MATIC-INR", "type": "CRYPTO", "sector": "Crypto", "market_cap_category": "CRYPTO"},
    ]

def build_full_universe():
    print("Building stock universe...")
    stocks = []

    # Try primary NSE source
    try:
        stocks = fetch_complete_nse_list()
        if len(stocks) < 500:
            raise Exception("Too few stocks — primary source incomplete")
        print(f"Primary NSE source: {len(stocks)} stocks")
    except Exception as e:
        print(f"Primary NSE source failed: {e} — trying fallback")
        stocks = fetch_nse_fallback()

    # Enrich with sector and market cap classification
    try:
        classifications = fetch_nse_classifications()
        stocks = enrich_with_classifications(stocks, classifications)
        print(f"Enriched {len([s for s in stocks if s['sector']])} stocks with sector data")
    except Exception as e:
        print(f"Enrichment failed: {e}")

    # Add BSE stocks
    try:
        bse = fetch_bse_stocks()
        stocks += bse
        print(f"Added {len(bse)} BSE stocks")
    except Exception as e:
        print(f"BSE fetch failed: {e}")

    # Add ETFs
    try:
        etfs = fetch_nse_etfs()
        stocks += etfs
        print(f"Added {len(etfs)} ETFs")
    except Exception as e:
        print(f"ETF fetch failed: {e}")

    # Add indices
    stocks += fetch_nse_indices()

    # Add global stocks and crypto
    stocks += fetch_global_stocks()
    stocks += fetch_crypto()

    # Deduplicate
    seen = set()
    unique = []
    
    # Symbols to ensure are present (sometimes missing from primary CSV)
    ensure_symbols = {
        "ZOMATO": {"symbol": "ZOMATO", "name": "Zomato Limited", "exchange": "NSE", "yf_symbol": "ZOMATO.NS", "type": "STOCK", "market_cap_category": "LARGE_MID", "isin": "INE758T01015", "sector": "Consumer Services"},
        "HAPPSTMNDS": {"symbol": "HAPPSTMNDS", "name": "Happiest Minds Technologies Limited", "exchange": "NSE", "yf_symbol": "HAPPSTMNDS.NS", "type": "STOCK", "market_cap_category": "LARGE_MID", "isin": "INE419U01012", "sector": "Information Technology"}
    }
    
    for s in stocks:
        sym = s["symbol"].upper()
        # Use ISIN for deduplication if available, otherwise symbol+exchange
        key = s.get("isin") or f'{sym}_{s["exchange"]}'
        if key and key not in seen:
            seen.add(key)
            unique.append(s)
            
    # Final check for essential symbols
    existing_symbols = {s["symbol"].upper() for s in unique}
    for sym, data in ensure_symbols.items():
        if sym not in existing_symbols:
            unique.append(data)
            print(f"Ensured essential stock present: {sym}")

    # Validate
    validate_universe(unique)

    # Save to disk
    universe_path = os.path.join(os.path.dirname(__file__), "stock_universe.json")
    with open(universe_path, "w", encoding="utf-8") as f:
        json.dump(unique, f, ensure_ascii=False, indent=2)

    print(f"Final universe: {len(unique)} total instruments")
    return unique

def load_universe():
    global STOCK_UNIVERSE, SEARCH_INDEX
    STOCK_UNIVERSE = build_full_universe()
    SEARCH_INDEX = {s["symbol"]: s for s in STOCK_UNIVERSE}
    print(f"Universe loaded into memory: {len(STOCK_UNIVERSE)} instruments")

def start_universe_scheduler():
    scheduler = BackgroundScheduler()
    # Refresh every 24 hours
    scheduler.add_job(build_full_universe, 'interval', hours=24)
    scheduler.start()
