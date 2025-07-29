# Product Design Coach AI - Setup Guide

## Prerequisites

Before you begin, ensure you have the following installed:

- **Python 3.8+** (for the backend)
- **Node.js 16+** and **npm** (for the frontend)
- **OpenAI API Key** (required for AI analysis)

## Quick Start

### 1. Clone and Navigate to Project
```bash
git clone <your-repo-url>
cd product-design-coach-ai
```

### 2. Set Up Environment Variables
```bash
# Copy the example environment file
cp backend/.env.example backend/.env

# Edit the .env file and add your OpenAI API key
# OPENAI_API_KEY=sk-your-actual-openai-api-key-here
```

### 3. Run the Development Environment
```bash
# Make the startup script executable
chmod +x start-dev.sh

# Start both backend and frontend
./start-dev.sh
```

This will automatically:
- Install Python dependencies in a virtual environment
- Install Node.js dependencies
- Start the FastAPI backend on http://localhost:8000
- Start the React frontend on http://localhost:3000

## Manual Setup

If you prefer to set up each component manually:

### Backend Setup

1. **Create Virtual Environment**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set Environment Variables**
   ```bash
   cp .env.example .env
   # Edit .env file with your OpenAI API key
   ```

4. **Start Backend Server**
   ```bash
   uvicorn main:app --reload --port 8000
   ```

### Frontend Setup

1. **Install Dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm start
   ```

## Configuration

### Environment Variables

The backend uses the following environment variables (configured in `backend/.env`):

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENAI_API_KEY` | Your OpenAI API key (required) | - |
| `MAX_FILE_SIZE` | Maximum upload file size in bytes | 10485760 (10MB) |
| `ALLOWED_EXTENSIONS` | Comma-separated list of allowed file extensions | png,jpg,jpeg |
| `CORS_ORIGINS` | Comma-separated list of allowed CORS origins | http://localhost:3000 |

### Frontend Configuration

The frontend can be configured with the following environment variables (create `frontend/.env` if needed):

| Variable | Description | Default |
|----------|-------------|---------|
| `REACT_APP_API_URL` | Backend API URL | http://localhost:8000 |

## API Documentation

Once the backend is running, you can access the interactive API documentation at:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Usage

1. **Access the Application**: Open http://localhost:3000 in your browser
2. **Upload Design**: Drag and drop or click to upload a design screen (PNG, JPG, JPEG)
3. **Get Feedback**: The AI will analyze your design and provide feedback on:
   - **UX**: Navigation, information architecture, user journey
   - **UI**: Visual hierarchy, typography, colors, spacing
   - **Behavioral Design**: Psychology, motivation, engagement

## Troubleshooting

### Common Issues

1. **"OpenAI API key not configured"**
   - Ensure you've set the `OPENAI_API_KEY` in `backend/.env`
   - Verify your API key is valid and has sufficient credits

2. **"Module not found" errors**
   - Make sure you've activated the Python virtual environment
   - Run `pip install -r requirements.txt` in the backend directory

3. **CORS errors**
   - Check that the frontend URL is included in `CORS_ORIGINS` in `backend/.env`
   - Ensure both servers are running on the correct ports

4. **File upload fails**
   - Check file size (default limit: 10MB)
   - Ensure file format is supported (PNG, JPG, JPEG)

### Port Conflicts

If you need to change the default ports:

**Backend** (default: 8000):
```bash
uvicorn main:app --reload --port 8001
```

**Frontend** (default: 3000):
```bash
PORT=3001 npm start
```

Remember to update the `REACT_APP_API_URL` in the frontend if you change the backend port.

## Development

### Project Structure
```
product-design-coach-ai/
├── backend/                 # FastAPI backend
│   ├── main.py             # Main application file
│   ├── requirements.txt    # Python dependencies
│   ├── .env.example       # Environment variables template
│   └── .env               # Your environment variables
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── services/      # API services
│   │   ├── types/         # TypeScript types
│   │   └── App.tsx        # Main app component
│   ├── package.json       # Node.js dependencies
│   └── tailwind.config.js # Tailwind CSS config
├── start-dev.sh           # Development startup script
└── README.md              # Project documentation
```

### Adding New Features

1. **Backend**: Add new endpoints in `backend/main.py`
2. **Frontend**: Create components in `frontend/src/components/`
3. **Styling**: Use Tailwind CSS classes for consistent styling
4. **Types**: Define TypeScript interfaces in `frontend/src/types/`

## Production Deployment

For production deployment, consider:

1. **Environment Variables**: Use production-grade secret management
2. **HTTPS**: Enable SSL/TLS for secure communication
3. **File Storage**: Consider cloud storage for uploaded files
4. **Rate Limiting**: Implement API rate limiting
5. **Monitoring**: Add logging and monitoring solutions
6. **Scaling**: Use load balancers and container orchestration

## Support

If you encounter issues or need help:

1. Check the troubleshooting section above
2. Review the API documentation at http://localhost:8000/docs
3. Ensure all prerequisites are properly installed
4. Verify your OpenAI API key has sufficient credits