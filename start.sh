#!/bin/bash
set -e

echo "Starting backend server..."
cd /app/backend
python -m uvicorn main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

echo "Starting Next.js frontend..."
cd /app/frontend
npm start &
FRONTEND_PID=$!

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
