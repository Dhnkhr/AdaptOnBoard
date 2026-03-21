from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, Optional
from backend.services.chat_agent import process_chat

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    pathway: Dict[str, Any]

class ChatResponse(BaseModel):
    reply: str
    updated_pathway: Optional[Dict[str, Any]] = None

@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(req: ChatRequest):
    try:
        reply, updated_pathway = process_chat(req.message, req.pathway)
        return ChatResponse(reply=reply, updated_pathway=updated_pathway)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
