import sys
import os
from passlib.context import CryptContext
from sqlalchemy.orm import Session
import bcrypt

# Monkeypatch bcrypt for passlib compatibility
if not hasattr(bcrypt, "__about__"):
    bcrypt.__about__ = type('about', (object,), {'__version__': bcrypt.__version__})


# Add the backend directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal, engine
from app import models
from app.models import User
from app.api.auth import get_password_hash

# Create tables
models.Base.metadata.create_all(bind=engine)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def seed_user():
    db = SessionLocal()
    try:
        email = "adwaithgopinath@gmail.com".lower()
        name = "Adwaith Gopinath"
        password = "Adwaith@19"
        
        # Check if user exists
        user = db.query(User).filter(User.email == email).first()
        if user:
            db.delete(user)
            db.commit()

        hashed_password = get_password_hash(password)
        
        new_user = User(
            name=name,
            email=email,
            hashed_password=hashed_password,
            balance=100000.0,
            tier="PRO"
        )
        db.add(new_user)
        db.commit()
        print(f"Successfully (re)created user: {email}")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_user()
