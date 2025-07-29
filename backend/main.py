import os
import base64
from io import BytesIO
from typing import List, Dict, Any
import aiofiles
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from PIL import Image
from openai import OpenAI
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI(
    title="Product Design Coach AI",
    description="AI-powered design feedback tool",
    version="1.0.0"
)

# Configure CORS
origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure OpenAI
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Configuration
MAX_FILE_SIZE = int(os.getenv("MAX_FILE_SIZE", 10485760))  # 10MB
ALLOWED_EXTENSIONS = os.getenv("ALLOWED_EXTENSIONS", "png,jpg,jpeg").split(",")

class DesignFeedback(BaseModel):
    ux_feedback: Dict[str, Any]
    ui_feedback: Dict[str, Any]
    behavioral_feedback: Dict[str, Any]
    overall_score: int
    priority_recommendations: List[str]

def validate_image(file: UploadFile) -> bool:
    """Validate uploaded image file"""
    if not file.filename:
        return False
    
    extension = file.filename.split(".")[-1].lower()
    if extension not in ALLOWED_EXTENSIONS:
        return False
    
    return True

def encode_image_to_base64(image_bytes: bytes) -> str:
    """Convert image bytes to base64 string"""
    return base64.b64encode(image_bytes).decode('utf-8')

async def analyze_design_with_ai(image_base64: str) -> DesignFeedback:
    """Analyze design using OpenAI GPT-4 Vision"""
    
    prompt = """
    You are an expert product design coach. Analyze this screen design and provide comprehensive feedback in the following areas:

    1. UX (User Experience):
       - Navigation and information architecture
       - User flow and journey optimization
       - Accessibility considerations
       - Content organization and hierarchy

    2. UI (User Interface):
       - Visual hierarchy and layout
       - Typography choices and readability
       - Color scheme and contrast
       - Spacing and alignment
       - Consistency and design system adherence

    3. Behavioral Design:
       - Psychological principles applied
       - User motivation and engagement
       - Call-to-action effectiveness
       - Cognitive load considerations

    Please provide your response in JSON format with the following structure:
    {
        "ux_feedback": {
            "strengths": ["list of UX strengths"],
            "improvements": ["list of UX improvements"],
            "score": 0-100
        },
        "ui_feedback": {
            "strengths": ["list of UI strengths"],
            "improvements": ["list of UI improvements"],
            "score": 0-100
        },
        "behavioral_feedback": {
            "strengths": ["list of behavioral design strengths"],
            "improvements": ["list of behavioral design improvements"],
            "score": 0-100
        },
        "overall_score": 0-100,
        "priority_recommendations": ["top 3-5 most important recommendations"]
    }
    """

    try:
        response = client.chat.completions.create(
            model="gpt-4-vision-preview",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{image_base64}"
                            }
                        }
                    ]
                }
            ],
            max_tokens=2000
        )
        
        # Parse the JSON response
        import json
        feedback_data = json.loads(response.choices[0].message.content)
        return DesignFeedback(**feedback_data)
        
    except Exception as e:
        # Fallback response if AI analysis fails
        return DesignFeedback(
            ux_feedback={
                "strengths": ["Clean layout structure"],
                "improvements": ["Could not analyze - please check image quality"],
                "score": 50
            },
            ui_feedback={
                "strengths": ["Visible interface elements"],
                "improvements": ["Analysis temporarily unavailable"],
                "score": 50
            },
            behavioral_feedback={
                "strengths": ["Interface appears functional"],
                "improvements": ["Unable to assess behavioral aspects"],
                "score": 50
            },
            overall_score=50,
            priority_recommendations=["Please try uploading the image again", "Ensure image is clear and readable"]
        )

@app.get("/")
async def root():
    """Health check endpoint"""
    return {"message": "Product Design Coach AI is running!"}

@app.post("/analyze-design", response_model=DesignFeedback)
async def analyze_design(file: UploadFile = File(...)):
    """Upload and analyze a design screen"""
    
    # Validate file
    if not validate_image(file):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file. Allowed extensions: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # Check file size
    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size: {MAX_FILE_SIZE / 1024 / 1024:.1f}MB"
        )
    
    try:
        # Validate and process image
        image = Image.open(BytesIO(contents))
        
        # Convert to RGB if necessary
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Resize if too large (for API efficiency)
        max_dimension = 1024
        if max(image.size) > max_dimension:
            ratio = max_dimension / max(image.size)
            new_size = tuple(int(dim * ratio) for dim in image.size)
            image = image.resize(new_size, Image.Resampling.LANCZOS)
        
        # Convert to base64
        buffer = BytesIO()
        image.save(buffer, format='JPEG', quality=85)
        image_base64 = encode_image_to_base64(buffer.getvalue())
        
        # Analyze with AI
        feedback = await analyze_design_with_ai(image_base64)
        
        return feedback
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error processing image: {str(e)}"
        )

@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "openai_configured": bool(os.getenv("OPENAI_API_KEY")),
        "max_file_size_mb": MAX_FILE_SIZE / 1024 / 1024,
        "allowed_extensions": ALLOWED_EXTENSIONS
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)