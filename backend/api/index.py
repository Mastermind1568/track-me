import os
import sys

# Add the backend root to sys.path
# This ensures 'from app.main import app' works
_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _root not in sys.path:
    sys.path.insert(0, _root)

from app.main import app

# Vercel looks for 'app' or 'handler'
handler = app
