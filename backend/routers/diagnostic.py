import os
import json
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from groq import Groq

router = APIRouter()

class DiagnosticRequest(BaseModel):
    skill_name: str
    role_title: str

LLM_AVAILABLE = False
LLM_CLIENT = None
LLM_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
try:
    api_key = os.getenv("GROQ_API_KEY", "")
    if api_key and api_key != "your_groq_api_key_here":
        LLM_CLIENT = Groq(api_key=api_key)
        LLM_AVAILABLE = True
except Exception:
    pass

@router.post("/diagnostic/generate")
async def generate_diagnostic(req: DiagnosticRequest):
    if not LLM_AVAILABLE or LLM_CLIENT is None:
        raise HTTPException(status_code=503, detail="LLM API is not available offline.")

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

    try:
        completion = LLM_CLIENT.chat.completions.create(
            model=LLM_MODEL,
            temperature=0.2,
            max_tokens=1000,
            messages=[
                {"role": "system", "content": "Return only strict JSON. No markdown fences. No extra text."},
                {"role": "user", "content": prompt},
            ],
        )
        content = (completion.choices[0].message.content or "").strip()
        
        # Cleanup markdown fences if LLM hallucinates them
        if content.startswith("```"):
            content = content.replace("```json", "").replace("```", "").strip()
            
        return json.loads(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
