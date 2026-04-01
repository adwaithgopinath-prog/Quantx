import os
import re

TARGET_DIR = r"d:\PROJECT FILE 4\frontend\src"

for root, dirs, files in os.walk(TARGET_DIR):
    for file in files:
        if file.endswith(".jsx"):
            filepath = os.path.join(root, file)
            with open(filepath, "r", encoding="utf-8") as f:
                content = f.read()
            
            modified = False
            
            # 1. Replace HTTP hardcoded strings using template literals
            if "http://localhost:8000" in content:
                # Replace 'http://localhost:8000/api...' with `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api...`
                # Careful not to double backtick if already in template literal
                content = re.sub(r"'http://localhost:8000([^']*)'", r'`${import.meta.env.VITE_API_URL || "http://localhost:8000"}\1`', content)
                content = re.sub(r'"http://localhost:8000([^"]*)"', r'`${import.meta.env.VITE_API_URL || "http://localhost:8000"}\1`', content)
                content = re.sub(r'`http://localhost:8000([^`]*)`', r'`${import.meta.env.VITE_API_URL || "http://localhost:8000"}\1`', content)
                modified = True

            # 2. Replace WS hardcoded strings using template literals in App.jsx
            if "ws://localhost:8000" in content:
                # Create a WS URL string logic directly inline
                ws_fallback = '${(import.meta.env.VITE_API_URL || "http://localhost:8000").replace("http", "ws")}'
                content = re.sub(r'`ws://localhost:8000([^`]*)`', f'`{ws_fallback}\\1`', content)
                modified = True
                
            if modified:
                with open(filepath, "w", encoding="utf-8") as f:
                    f.write(content)
                print(f"Fixed URLs in: {filepath}")

print("All frontend URLs updated!")
