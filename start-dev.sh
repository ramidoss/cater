#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting Product Design Coach AI Development Environment${NC}"

# Check if OpenAI API key is set
if [ ! -f "backend/.env" ]; then
    echo -e "${RED}❌ Error: backend/.env file not found${NC}"
    echo -e "${YELLOW}Please copy backend/.env.example to backend/.env and add your OpenAI API key${NC}"
    exit 1
fi

# Check if node_modules exists
if [ ! -d "frontend/node_modules" ]; then
    echo -e "${YELLOW}📦 Installing frontend dependencies...${NC}"
    cd frontend && npm install && cd ..
fi

# Check if Python dependencies are installed
if [ ! -d "backend/venv" ]; then
    echo -e "${YELLOW}🐍 Creating Python virtual environment...${NC}"
    cd backend && python -m venv venv && cd ..
fi

echo -e "${YELLOW}📚 Installing backend dependencies...${NC}"
cd backend && source venv/bin/activate && pip install -r requirements.txt && cd ..

# Start both services
echo -e "${GREEN}🔧 Starting backend server...${NC}"
cd backend && source venv/bin/activate && uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!

echo -e "${GREEN}⚛️  Starting frontend server...${NC}"
cd frontend && npm start &
FRONTEND_PID=$!

# Function to cleanup processes on exit
cleanup() {
    echo -e "\n${YELLOW}🛑 Shutting down servers...${NC}"
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

echo -e "\n${GREEN}✅ Both servers are starting up!${NC}"
echo -e "${GREEN}📱 Frontend: http://localhost:3000${NC}"
echo -e "${GREEN}🔧 Backend: http://localhost:8000${NC}"
echo -e "${GREEN}📖 API Docs: http://localhost:8000/docs${NC}"
echo -e "\n${YELLOW}Press Ctrl+C to stop both servers${NC}\n"

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID