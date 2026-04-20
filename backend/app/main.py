import sys
import os
import asyncio
import random

# Ensure the backend directory is on the Python path so that
# both local (uvicorn) and Vercel/Render serverless invocations work correctly.
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from app.api import endpoints
from app.services import market_engine, data_fetcher

app = FastAPI(title="QuantX - AI Trading Platform")

# CORS setup - allow all origins so Vercel frontend can connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(endpoints.router, prefix="/api")

@app.on_event("startup")
async def startup_event():
    # Start the Market Data Collection Engine (Pipeline)
    market_engine.start_engine()

@app.websocket("/ws/ticker/{symbol}")
async def websocket_endpoint(websocket: WebSocket, symbol: str):
    await websocket.accept()
    try:
        info = data_fetcher.get_stock_info(symbol)
        base_price = info.get("price", 150.0)
        while True:
            jitter = random.uniform(-base_price * 0.0005, base_price * 0.0005)
            base_price += jitter
            await websocket.send_json({
                "symbol": symbol.upper(),
                "price": round(base_price, 2),
                "change": round(jitter, 4)
            })
            await asyncio.sleep(0.5)
    except Exception as e:
        print(f"WS Disconnected: {e}")

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

@app.get("/")
def read_root():
    return {"status": "ok", "message": "QuantX Engine Running"}

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
