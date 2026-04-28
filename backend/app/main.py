import sys
import os
import asyncio
import random
import logging
import subprocess
import time
from datetime import datetime, timedelta

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("QuantX")

# Ensure the backend directory is on the Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI, WebSocket, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.api import endpoints, auth
from app.services import market_engine, data_fetcher, stock_universe
from app.database import engine
from app import models

# Create database tables
models.Base.metadata.create_all(bind=engine)

# Rate Limiter setup
limiter = Limiter(key_func=get_remote_address)
app = FastAPI(title="QuantX - AI Trading Platform")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# CORS setup - allow all origins so Vercel frontend can connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(endpoints.router, prefix="/api", tags=["Endpoints"])

@app.get("/api/ping")
def ping():
    return {"status": "ok"}

def check_and_fetch_stocks():
    data_dir = os.path.join(os.path.dirname(__file__), "data")
    json_path = os.path.join(data_dir, "all_stocks.json")
    
    needs_fetch = False
    if not os.path.exists(json_path):
        needs_fetch = True
    else:
        file_time = os.path.getmtime(json_path)
        if time.time() - file_time > 7 * 24 * 60 * 60: # 7 days
            needs_fetch = True
            
    if needs_fetch:
        fetch_script = os.path.join(data_dir, "fetch_stocks.py")
        try:
            subprocess.run([sys.executable, fetch_script], check=True)
        except Exception as e:
            print(f"Error running fetch_stocks.py: {e}")

@app.on_event("startup")
async def startup_event():
    # Ensure stock list is current
    check_and_fetch_stocks()
    # Start the Market Data Collection Engine (Pipeline)
    market_engine.start_engine()
    # Load the Comprehensive Stock Universe
    stock_universe.load_universe()
    stock_universe.start_universe_scheduler()
    
    # Detailed breakdown logging
    universe = stock_universe.STOCK_UNIVERSE
    nse_count = len([s for s in universe if s.get("exchange") == "NSE" and s.get("type") == "STOCK"])
    etf_count = len([s for s in universe if s.get("type") == "ETF"])
    idx_count = len([s for s in universe if s.get("type") == "INDEX"])
    global_count = len([s for s in universe if s.get("type") == "GLOBAL"])
    crypto_count = len([s for s in universe if s.get("type") == "CRYPTO"])
    
    print(f"""
    QuantX Universe Loaded:
    |-- NSE Stocks  : {nse_count}
    |-- ETFs        : {etf_count}
    |-- Indices     : {idx_count}
    |-- Global      : {global_count}
    |-- Crypto      : {crypto_count}
    """)

@app.websocket("/ws/ticker/{symbol}")
async def websocket_endpoint(websocket: WebSocket, symbol: str):
    await websocket.accept()
    
    # Background heartbeat task
    async def send_heartbeat():
        try:
            while True:
                await asyncio.sleep(30)
                await websocket.send_json({"type": "HEARTBEAT", "timestamp": datetime.now().isoformat()})
        except Exception:
            pass

    heartbeat_task = asyncio.create_task(send_heartbeat())
    
    try:
        info = data_fetcher.get_stock_info(symbol)
        base_price = info.get("price", 150.0)
        while True:
            try:
                # Check for client messages (like pong)
                data = await asyncio.wait_for(websocket.receive_text(), timeout=0.1)
                if data == "ping":
                    await websocket.send_text("pong")
            except asyncio.TimeoutError:
                pass
            
            jitter = random.uniform(-base_price * 0.0005, base_price * 0.0005)
            base_price += jitter
            await websocket.send_json({
                "symbol": symbol.upper(),
                "price": round(base_price, 2),
                "change": round(jitter, 4),
                "timestamp": datetime.now().isoformat()
            })
            await asyncio.sleep(0.5)
    except Exception as e:
        logger.error(f"WS Disconnected for {symbol}: {e}")
    finally:
        heartbeat_task.cancel()

@app.websocket("/ws/trades/{symbol}")
async def trade_websocket(websocket: WebSocket, symbol: str):
    await websocket.accept()
    try:
        while True:
            await asyncio.sleep(random.randint(5, 10))
            side = random.choice(["BUY", "SELL"])
            info = data_fetcher.get_stock_info(symbol)
            price = info.get("price", 150.0) + random.uniform(-2, 2)
            await websocket.send_json({
                "type": "TRADE_EXECUTION",
                "symbol": symbol.upper(),
                "side": side,
                "price": round(price, 2),
                "volume": random.randint(100, 5000),
                "timestamp": asyncio.get_event_loop().time()
            })
    except Exception as e:
        print(f"Trade WS Disconnected: {e}")

@app.websocket("/ws/depth/{symbol}")
async def depth_websocket(websocket: WebSocket, symbol: str):
    """
    Simulated Level 2 Order Book Depth feed.
    Sub-millisecond latency simulation.
    """
    await websocket.accept()
    try:
        info = data_fetcher.get_stock_info(symbol)
        price = info.get("price", 150.0)
        while True:
            # Generate 10 levels of bids and asks
            bids = []
            asks = []
            for i in range(1, 11):
                bids.append({
                    "price": round(price - (i * 0.05), 2),
                    "size": random.randint(100, 5000),
                    "total": random.randint(5000, 20000)
                })
                asks.append({
                    "price": round(price + (i * 0.05), 2),
                    "size": random.randint(100, 5000),
                    "total": random.randint(5000, 20000)
                })
            
            await websocket.send_json({
                "symbol": symbol.upper(),
                "bids": bids,
                "asks": asks,
                "timestamp": asyncio.get_event_loop().time()
            })
            await asyncio.sleep(0.2) # High frequency updates
    except Exception as e:
        print(f"Depth WS Disconnected: {e}")

@app.websocket("/ws/hft/{symbol}")
async def hft_websocket(websocket: WebSocket, symbol: str):
    """
    Simulated Sub-millisecond High Frequency Trade feed.
    """
    await websocket.accept()
    try:
        info = data_fetcher.get_stock_info(symbol)
        price = info.get("price", 150.0)
        while True:
            # Bursts of micro-trades
            burst_size = random.randint(1, 5)
            for _ in range(burst_size):
                await websocket.send_json({
                    "type": "TICK",
                    "price": round(price + random.uniform(-0.02, 0.02), 2),
                    "volume": random.randint(1, 100),
                    "latency_ms": random.uniform(0.1, 0.8)
                })
            await asyncio.sleep(0.1)
    except Exception as e:
        print(f"HFT WS Disconnected: {e}")

@app.get("/")
def read_root():
    return {"status": "ok", "message": "QuantX Engine Running"}

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
