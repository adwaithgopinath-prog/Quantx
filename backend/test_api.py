import requests

urls = [
    "http://localhost:8000/api/market/engine",
    "http://localhost:8000/api/pipeline/stats",
    "http://localhost:8000/api/dashboard/RELIANCE.NS",
    "http://localhost:8000/api/backtest/RELIANCE.NS"
]

for u in urls:
    print(f"Testing {u}")
    try:
        r = requests.get(u, timeout=5)
        print(r.status_code)
    except Exception as e:
        print("ERROR:", e)
 