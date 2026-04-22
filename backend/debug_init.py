import sys
import os
sys.path.insert(0, os.getcwd())

try:
    from app.database import engine
    from app import models
    print("Imports successful")
    models.Base.metadata.create_all(bind=engine)
    print("Database created")
except Exception as e:
    print(f"Error: {e}")
