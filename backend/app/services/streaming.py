import random
import time

def simulate_limit_order(symbol, price, side="BUY"):
    """
    Simulates a Kafka-style event stream for trade execution.
    In a real system, this would push to a 'trades' topic.
    """
    print(f"EVENT: Order Placed | {symbol} | {side} @ {price}")
    # Simulate execution delay
    time.sleep(0.5)
    return {
        "order_id": random.randint(1000, 9999),
        "status": "FILLED",
        "symbol": symbol,
        "price": price,
        "shares": 10
    }
