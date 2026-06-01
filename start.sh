#!/bin/bash
# start.sh - Start both Backend and Expo app

echo "🚀 Starting SafeAuth..."
echo ""

# Start backend server in background
echo "▶️ Starting Better Auth backend server..."
cd /Users/Quant/Documents/GitHub/SafeAuth
pnpm start:server &
SERVER_PID=$!

# Wait for server to start
echo "⏳ Waiting for server to start..."
sleep 3

# Check if server is running
if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo "✅ Backend server is running on http://localhost:3000"
else
    echo "❌ Backend server failed to start"
    kill $SERVER_PID 2>/dev/null
    exit 1
fi

# Start Expo app
echo "▶️ Starting Expo app..."
echo ""
pnpm start

# Cleanup on exit
trap "kill $SERVER_PID 2>/dev/null" EXIT
