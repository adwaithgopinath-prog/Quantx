from sqlalchemy import Column, Integer, String, Float, DateTime, JSON, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    email = Column(String, unique=True, index=True)
    tier = Column(String, default="free") # free/pro
    balance = Column(Float, default=100000.0)
    
    portfolio = relationship("Portfolio", back_populates="owner")
    orders = relationship("Order", back_populates="owner")
    watchlist = relationship("Watchlist", back_populates="owner")

class Portfolio(Base):
    __tablename__ = "portfolio"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    ticker = Column(String)
    shares = Column(Integer)
    avg_buy_price = Column(Float)
    added_at = Column(DateTime, default=datetime.utcnow)
    
    owner = relationship("User", back_populates="portfolio")

class Order(Base):
    __tablename__ = "orders"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    ticker = Column(String)
    type = Column(String) # BUY/SELL
    price = Column(Float)
    shares = Column(Integer)
    status = Column(String, default="EXECUTED") # EXECUTED/PENDING/CANCELLED
    created_at = Column(DateTime, default=datetime.utcnow)
    
    owner = relationship("User", back_populates="orders")

class Watchlist(Base):
    __tablename__ = "watchlist"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    ticker = Column(String)
    
    owner = relationship("User", back_populates="watchlist")

class SignalsCache(Base):
    __tablename__ = "signals_cache"
    id = Column(Integer, primary_key=True, index=True)
    ticker = Column(String, index=True)
    signal_data = Column(JSON)
    generated_at = Column(DateTime, default=datetime.utcnow)

class MarketCache(Base):
    __tablename__ = "market_cache"
    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, index=True)
    value = Column(JSON)
    updated_at = Column(DateTime, default=datetime.utcnow)
