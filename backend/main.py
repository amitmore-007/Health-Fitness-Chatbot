from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from utils.ai_helper import generate_ai_response


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5174"],  # Or whatever port your React app runs on
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str

@app.get("/")
async def root():
    return {"message": "HealthBot API is running"}

@app.get("/health")
async def health_check():
    return {"status": "OK"}

@app.post("/api/chat")
async def chat(request: ChatRequest):
    try:
        user_msg = request.message
        ai_response = generate_ai_response(user_msg)

        # Include YouTube links only if the user asks
        keywords = ["video", "youtube", "tutorial", "watch"]
        if any(keyword in user_msg.lower() for keyword in keywords):
            youtube_links = search_youtube_videos(user_msg)
        else:
            youtube_links = []

        return {
            "response": ai_response,
            "videos": youtube_links
        }
    except Exception as e:
        print(f"Endpoint Error: {str(e)}")
        return {
            "response": "Sorry, we're facing an issue processing your request. Please try again later.",
            "videos": []
        }
