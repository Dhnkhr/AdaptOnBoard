"""
API Router — Upload & Analysis Endpoints
"""
import json
from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from typing import Optional

from backend.services.resume_parser import (
    extract_text_from_pdf,
    extract_resume_data,
    extract_portfolio_data,
)
from backend.services.job_matcher import (
    compute_skill_gap_custom_role,
)
from backend.services.pathway_engine import generate_pathway
from backend.services.url_parser import parse_github_profile

router = APIRouter()


# ----- Pydantic Models -----

class AnalyzeRequest(BaseModel):
    raw_skills: list[str]
    role_id: str
    custom_role_title: Optional[str] = None
    job_description: Optional[str] = None
    candidate_name: Optional[str] = "Candidate"
    experience_level: Optional[str] = "entry"


class UrlUploadRequest(BaseModel):
    url: str


# ----- Endpoints -----



@router.post("/upload-resume")
async def upload_resume(file: UploadFile = File(...)):
    """
    Upload a resume PDF. Extracts text, parses skills using LLM,
    and normalizes them against the skill taxonomy.
    """
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    try:
        pdf_bytes = await file.read()

        # Step 1: Extract text from PDF
        resume_text = extract_text_from_pdf(pdf_bytes)
        if not resume_text.strip():
            raise HTTPException(
                status_code=400,
                detail="Could not extract text from PDF. The file may be image-only.",
            )

        # Step 2: Use LLM to extract structured resume data
        resume_data = await extract_resume_data(resume_text)

        # Step 2.5: Ensure it was actually identified as a resume
        if not resume_data.get("is_resume", True):
            raise HTTPException(
                status_code=400,
                detail="The uploaded document does not appear to be a valid Resume or CV. Please upload a legitimate resume (1-5 pages, containing contact info, work experience, or education).",
            )

        raw_skills = resume_data.get("skills", [])

        return {
            "success": True,
            "resume_data": resume_data,
            "raw_skills": raw_skills,
            "resume_text_preview": resume_text[:500] + "..." if len(resume_text) > 500 else resume_text,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing resume: {str(e)}")


@router.post("/analyze-url")
async def analyze_url(req: UrlUploadRequest):
    """
    Analyze a GitHub profile URL. Scrapes public repos via the GitHub API,
    then uses Llama (via Groq) to extract skills from the portfolio text.
    """
    try:
        # Step 1: Scrape GitHub profile into portfolio text
        portfolio_text = parse_github_profile(req.url)

        # Step 2: Use Groq-powered LLM to extract skills from portfolio
        resume_data = await extract_portfolio_data(portfolio_text)

        raw_skills = resume_data.get("skills", [])

        return {
            "success": True,
            "resume_data": resume_data,
            "raw_skills": raw_skills,
            "resume_text_preview": portfolio_text[:500] + "..." if len(portfolio_text) > 500 else portfolio_text,
        }
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing URL: {str(e)}")

@router.post("/analyze")
async def analyze_gap(request: AnalyzeRequest):
    """
    Compute skill gap and generate a personalized learning pathway.
    """
    try:
        # Compute skill gap for known or custom roles.
        if request.role_id == "__custom__":
            custom_title = (request.custom_role_title or "").strip()
            if not custom_title:
                raise HTTPException(status_code=400, detail="custom_role_title is required when role_id is __custom__")
            gap = compute_skill_gap_custom_role(
                request.raw_skills, 
                custom_title, 
                job_description=request.job_description[:500] if request.job_description else None
            )
            if "error" in gap:
                raise HTTPException(status_code=500, detail=gap["error"])
        else:
            raise HTTPException(status_code=400, detail="Only __custom__ role_id is supported now.")

        # Generate adaptive pathway
        pathway = generate_pathway(gap)

        return {
            "success": True,
            "candidate_name": request.candidate_name,
            "experience_level": request.experience_level,
            "skill_gap": gap,
            "pathway": pathway,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error in analysis: {str(e)}")
