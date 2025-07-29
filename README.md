# Product Design Coach AI

An AI-powered tool that analyzes uploaded screen designs and provides comprehensive feedback on:

- **UX (User Experience)**: Navigation flow, information architecture, user journey optimization
- **UI (User Interface)**: Visual hierarchy, typography, color schemes, spacing, consistency
- **Behavioral Design**: Psychological principles, user motivation, engagement patterns

## Features

- Upload screen designs (PNG, JPG, JPEG)
- AI-powered analysis using computer vision and design principles
- Detailed feedback with actionable recommendations
- Modern, responsive web interface
- Real-time analysis results

## Tech Stack

- **Backend**: FastAPI (Python)
- **Frontend**: React with TypeScript
- **AI Analysis**: OpenAI GPT-4 Vision API
- **Styling**: Tailwind CSS
- **File Handling**: Pillow for image processing

## Getting Started

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

The application will be available at `http://localhost:3000`