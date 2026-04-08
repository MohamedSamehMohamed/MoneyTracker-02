#!/bin/bash

# ANSI color codes
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RESET='\033[0m'

echo -e "${BLUE}Starting MoneyTracker Development Environment${RESET}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo ""

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Function to handle cleanup
cleanup() {
    echo -e "\n${YELLOW}Shutting down all processes...${RESET}"
    kill %1 %2 2>/dev/null
    wait %1 %2 2>/dev/null
    exit 0
}

# Set trap for Ctrl+C
trap cleanup SIGINT SIGTERM

# Start server in background
cd "$SCRIPT_DIR/server"
echo -e "${BLUE}[Server]${RESET} Starting on port 3001..."
npm run dev &
SERVER_PID=$!

# Start client in background
cd "$SCRIPT_DIR/client"
echo -e "${GREEN}[Client]${RESET} Starting on port 5173..."
npm run dev &
CLIENT_PID=$!

echo ""
echo -e "${GREEN}✓ Server running at http://localhost:3001${RESET}"
echo -e "${GREEN}✓ Client running at http://localhost:5173${RESET}"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop both servers${RESET}"
echo ""

# Wait for both processes
wait $SERVER_PID $CLIENT_PID
