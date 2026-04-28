import pandas as pd
import requests
import json
import os
import io
import time
from datetime import datetime

def fetch_nse():
    print("Fetching NSE stock list...")
    url = "https://archives.nseindia.com/content/equities/EQUITY_L.csv"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "*/*",
        "Referer": "https://www.nseindia.com/"
    }
    
    session = requests.Session()
    try:
        # First hit the main NSE page to get session cookies
        session.get("https://www.nseindia.com", headers=headers, timeout=10)
        time.sleep(2)
        r = session.get(url, headers=headers, timeout=15)
        r.raise_for_status()
        df = pd.read_csv(io.StringIO(r.text))
        
        # Clean column names (remove leading/trailing spaces)
        df.columns = [c.strip() for c in df.columns]
        
        stocks = []
        for _, row in df.iterrows():
            symbol = str(row.get('SYMBOL', '')).strip()
            if not symbol or symbol == 'nan': continue
            
            series = str(row.get('SERIES', '')).strip()
            # Most common equity series
            if series not in ['EQ', 'BE', 'SM']:
                continue
                
            stocks.append({
                "symbol": f"{symbol}.NS",
                "display": str(row.get('NAME OF COMPANY', symbol)).strip(),
                "sector": "Equity",
                "exchange": "NSE",
                "isin": str(row.get('ISIN NUMBER', '')).strip()
            })
        print(f"Parsed {len(stocks)} NSE stocks")
        return stocks
    except Exception as e:
        print(f"Error fetching NSE: {e}")
        return []

def fetch_bse():
    print("Fetching BSE stock list...")
    url = "https://api.bseindia.com/BseIndiaAPI/api/ListofScripData/w?Group=&Scripcode=&industry=&segment=Equity&status=Active"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Referer": "https://www.bseindia.com/"
    }
    try:
        r = requests.get(url, headers=headers, timeout=15)
        r.raise_for_status()
        data = r.json()
        
        items = []
        if isinstance(data, dict):
            items = data.get("Table", [])
        elif isinstance(data, list):
            items = data
            
        stocks = []
        for item in items:
            symbol = str(item.get('SCRIP_CD', '')).strip()
            if not symbol or symbol == 'nan': continue
            
            isin = str(item.get('ISIN_Code') or item.get('ISIN_NUMBER') or item.get('ISIN') or '').strip()
            
            stocks.append({
                "symbol": f"{symbol}.BO",
                "display": str(item.get('Scrip_Name') or item.get('SCRIP_NAME') or symbol).strip(),
                "sector": str(item.get('INDUSTRY') or item.get('Industry') or 'Equity').strip(),
                "exchange": "BSE",
                "isin": isin
            })
        print(f"Parsed {len(stocks)} BSE stocks")
        return stocks
    except Exception as e:
        print(f"Error fetching BSE: {e}")
        return []

def fetch_nse_sectors():
    url = "https://archives.nseindia.com/content/indices/ind_nifty500list.csv"
    sectors = {}
    try:
        r = requests.get(url, headers={"User-Agent": "Mozilla/5.0"}, timeout=10)
        r.raise_for_status()
        df = pd.read_csv(io.StringIO(r.text))
        # Nifty 500 list also has spaces sometimes
        df.columns = [c.strip() for c in df.columns]
        for _, row in df.iterrows():
            sym = str(row.get('Symbol') or row.get('SYMBOL', '')).strip()
            industry = str(row.get('Industry') or row.get('INDUSTRY', '')).strip()
            if sym and industry:
                sectors[f"{sym}.NS"] = industry
    except:
        pass
    return sectors

def run():
    nse_stocks = fetch_nse()
    bse_stocks = fetch_bse()
    
    if not nse_stocks and not bse_stocks:
        print("Failed to fetch any stocks. Skipping update.")
        return

    nse_sectors = fetch_nse_sectors()
    # Apply sectors where available
    for s in nse_stocks:
        if s['symbol'] in nse_sectors:
            s['sector'] = nse_sectors[s['symbol']]

    # Deduplicate
    unified = {}
    # Process BSE first
    for s in bse_stocks:
        key = s.get('isin') or s['symbol']
        if key:
            unified[key] = s
            
    # Process NSE
    for s in nse_stocks:
        key = s.get('isin') or s['symbol']
        if key:
            unified[key] = s
            
    final_list = list(unified.values())
    
    data_dir = os.path.dirname(os.path.abspath(__file__))
    output_path = os.path.join(data_dir, "all_stocks.json")
    
    with open(output_path, "w", encoding='utf-8') as f:
        json.dump(final_list, f, indent=2, ensure_ascii=False)
    
    print(f"Successfully saved {len(final_list)} stocks to all_stocks.json")

if __name__ == "__main__":
    run()
