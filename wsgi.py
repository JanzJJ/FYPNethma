"""
WSGI entry point for Render deployment
"""
import sys
import os

# Get the directory where this wsgi.py file is located (project root)
project_root = os.path.dirname(os.path.abspath(__file__))

# Add the backend directory to the Python path
backend_path = os.path.join(project_root, 'backend')
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

# Change to the backend directory before importing to ensure relative paths work
os.chdir(backend_path)

try:
    # Import the Flask app from backend/app.py
    from app import app
    print(f"Successfully imported Flask app from {backend_path}")
except ImportError as e:
    print(f"Error importing app: {e}")
    print(f"Python path: {sys.path}")
    print(f"Backend path: {backend_path}")
    print(f"Backend files: {os.listdir(backend_path) if os.path.exists(backend_path) else 'Not found'}")
    raise

if __name__ == "__main__":
    app.run()
