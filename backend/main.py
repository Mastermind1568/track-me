import os
import sys

# Ensure the current directory is in path so we can import 'app' and other scripts
_root = os.path.dirname(os.path.abspath(__file__))
if _root not in sys.path:
    sys.path.insert(0, _root)

from app.main import app

# Vercel needs the 'app' object to be available at the module level.
# We expose it here so that vercel.json's rewrite to main.py works.
