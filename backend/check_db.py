
from sqlalchemy import create_engine, text

engine = create_engine("sqlite:///d:/Quantx/quantx.db")
with engine.connect() as conn:
    result = conn.execute(text("SELECT name, email, hashed_password FROM users"))
    for row in result:
        print(f"Name: {row[0]}, Email: {row[1]}, Hashed Password: {row[2][:20]}...")
