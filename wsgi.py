"""
WSGI entry point for Render deployment
"""
import sys
import os

# Add backend directory to Python path
backend_path = os.path.join(os.path.dirname(__file__), 'backend')
sys.path.insert(0, backend_path)

# Import the Flask app
from app import app

if __name__ == "__main__":
    app.run()
