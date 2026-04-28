import os
import sys

# Add the parent directory to sys.path so 'app' can be found
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from app.main import app

# Vercel looks for 'app' or 'handler'
handler = app
