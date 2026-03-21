"""
AI-Adaptive Onboarding Engine — FastAPI Backend
"""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="AI-Adaptive Onboarding Engine",
    description="Parses resumes, identifies skill gaps, and generates personalized learning pathways.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from backend.routers import upload, chat, diagnostic  # noqa: E402

app.include_router(upload.router, prefix="/api", tags=["onboarding"])
app.include_router(chat.router, prefix="/api", tags=["chat"])
app.include_router(diagnostic.router, prefix="/api", tags=["diagnostic"])

@app.get("/")
async def root():
    return {"message": "AI-Adaptive Onboarding Engine API", "status": "running"}


@app.get("/health")
async def health():
    return {"status": "healthy"}
