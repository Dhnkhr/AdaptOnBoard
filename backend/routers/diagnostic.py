import os
import json
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from google import genai
from google.genai import types

from dotenv import load_dotenv

load_dotenv(override=True)

router = APIRouter()

class DiagnosticRequest(BaseModel):
    skill_name: str
    role_title: str

def get_llm_client():
    api_key = os.getenv("GEMINI_API_KEY", "")
    if api_key and api_key != "your_gemini_api_key_here":
        try:
            return genai.Client(api_key=api_key)
        except Exception:
            return None
    return None

@router.post("/diagnostic/generate")
async def generate_diagnostic(req: DiagnosticRequest):
    client = get_llm_client()
    if client is None:
        raise HTTPException(status_code=503, detail="Gemini API is not configured. Set GEMINI_API_KEY in .env.")

    prompt = (
        f"You are an expert technical interviewer evaluating a candidate for a '{req.role_title}' role. "
        f"The candidate claims to have the skill: '{req.skill_name}'. "
        "Generate a 3-question multiple choice diagnostic quiz to verify their practical, real-world proficiency in this skill. "
        "Return ONLY strict JSON with this exact schema:\n"
        "{\n"
        '  "questions": [\n'
        "    {\n"
        '      "questionText": "A real-world scenario question testing their knowledge.",\n'
        '      "options": ["Answer A", "Answer B", "Answer C", "Answer D"],\n'
        '      "correctIndex": 2,\n'
        '      "explanation": "Why this answer is the best choice"\n'
        "    }\n"
        "  ]\n"
        "}"
    )

    model_name = os.getenv("GEMINI_MODEL", "gemini-3.6-flash")
    try:
        response = client.models.generate_content(
            model=model_name,
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.2,
                max_output_tokens=1000,
                response_mime_type="application/json",
            ),
        )
        content = (response.text or "").strip()
        
        # Cleanup markdown fences if LLM hallucinates them
        if content.startswith("```"):
            content = content.replace("```json", "").replace("```", "").strip()
            
        return json.loads(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
