from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import random
from .api import endpoints
from .services import market_engine

app = FastAPI(title="QuantX - Insane AI Trading Platform")

# CORS setup
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
        base_price = 150.0 # Mock base
        while True:
            # Simulate high-frequency ticker stream
            jitter = random.uniform(-0.1, 0.1)
            base_price += jitter
            await websocket.send_json({
                "symbol": symbol.upper(),
                "price": round(base_price, 2),
                "change": round(jitter, 4)
            })
            await asyncio.sleep(0.5) # Fast updates
    except Exception as e:
        print(f"WS Disconnected: {e}")

@app.websocket("/ws/trades/{symbol}")
async def trade_websocket(websocket: WebSocket, symbol: str):
    await websocket.accept()
    try:
        while True:
            # Simulate a "whale" trade or signal execution every few seconds
            await asyncio.sleep(random.randint(5, 10))
            side = random.choice(["BUY", "SELL"])
            price = 150.0 + random.uniform(-2, 2)
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
    uvicorn.run(app, host="0.0.0.0", port=8000)
