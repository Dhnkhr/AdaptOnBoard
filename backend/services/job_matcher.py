"""
Job Matcher Service
Matches resume skills against job role requirements and computes skill gaps using the LLM.
"""
import json
import os
import re
from groq import Groq

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

def _create_chat_completion_with_fallback(**kwargs):
    try:
        return LLM_CLIENT.chat.completions.create(**kwargs)
    except Exception as e:
        if "rate limit" in str(e).lower() or "429" in str(e) or "rate_limit_exceeded" in str(e).lower():
            print(f"[LLM] Rate limit hit for {kwargs.get('model')}. Falling back to llama-3.1-8b-instant.")
            kwargs["model"] = "llama-3.1-8b-instant"
            return LLM_CLIENT.chat.completions.create(**kwargs)
        raise e

def _is_valid_job_title(title: str) -> bool:
    """
    Fast LLM check to see if the input is a reasonable job title or domain,
    preventing garbage input from wasting tokens on the main generation phase.
    """
    if not LLM_AVAILABLE or LLM_CLIENT is None:
        return True  # Bypass if no LLM

    # Fast heuristics
    title = title.strip()
    if len(title) < 2 or len(title) > 100:
        return False
    # If the title is just special characters/numbers
    if all(char in "0123456789!@#$%^&*()_+={}[]|\\:;\"'<>,.?/~ \t\n" for char in title):
        return False

    prompt = (
        f"Is '{title}' a valid, recognizable, or plausible job title, profession, or career domain? "
        "Reply ONLY with 'YES' or 'NO'."
    )
    try:
        completion = _create_chat_completion_with_fallback(
            model=LLM_MODEL,
            temperature=0,
            max_tokens=10,
            messages=[{"role": "user", "content": prompt}],
        )
        content = (completion.choices[0].message.content or "").strip().upper()
        return "YES" in content
    except Exception:
        return True  # Fail open if API errors


def compute_skill_gap_custom_role(candidate_raw_skills: list, custom_role_title: str, job_description: str = None) -> dict:
    """
    Compute skill gap for a custom role title using LLM-generated skills.
    The LLM generates complete skill objects (name, category, resources, prerequisites)
    and we match against the candidate's raw skills.
    """
    if not LLM_AVAILABLE or LLM_CLIENT is None:
        return {
            "error": "LLM API is not available. Cannot analyze custom roles without the API.",
            "role_id": f"custom:{_slugify(custom_role_title)}",
            "role_title": custom_role_title,
        }

    if not _is_valid_job_title(custom_role_title):
        return {
            "error": f"'{custom_role_title}' does not appear to be a valid profession or job title. Please provide a real role.",
            "role_id": f"custom:{_slugify(custom_role_title)}",
            "role_title": custom_role_title,
        }

    llm_result = _generate_skills_with_llm(custom_role_title, candidate_raw_skills, job_description)

    if not llm_result:
        return {
            "error": "Could not generate skill requirements for this role. Please try again.",
            "role_id": f"custom:{_slugify(custom_role_title)}",
            "role_title": custom_role_title,
        }

    core_skills = llm_result.get("core_skills", [])
    recommended_skills = llm_result.get("recommended_skills", [])

    # Build IDs from slugified names
    for skill in core_skills:
        if "id" not in skill:
            skill["id"] = _slugify(skill.get("name", "unknown"))
        skill["priority"] = "core"

    for skill in recommended_skills:
        if "id" not in skill:
            skill["id"] = _slugify(skill.get("name", "unknown"))
        skill["priority"] = "recommended"

    all_required_ids = {s["id"] for s in core_skills} | {s["id"] for s in recommended_skills}
    # Slugify the candidate's raw skills to approximate matches
    candidate_set = {_slugify(sk) for sk in candidate_raw_skills}

    matched_ids = set()
    matched_cand_ids = set()
    stop_words = {"and", "or", "in", "of", "with", "management", "development", "engineering", "skills", "basics", "advanced", "knowledge", "design", "the", "a", "tool", "tools", "systems", "system", "for", "to"}
    for req_id in all_required_ids:
        for cand_id in candidate_set:
            match_found = False
            if req_id == cand_id:
                match_found = True
            elif len(req_id) >= 4 and req_id in cand_id:
                match_found = True
            elif len(cand_id) >= 4 and cand_id in req_id:
                match_found = True
            else:
                req_words = set(req_id.split('_'))
                cand_words = set(cand_id.split('_'))
                req_keywords = req_words - stop_words
                cand_keywords = cand_words - stop_words
                if req_keywords and cand_keywords and req_keywords.intersection(cand_keywords):
                    match_found = True
            
            if match_found:
                matched_ids.add(req_id)
                matched_cand_ids.add(cand_id)
                break
    core_ids = {s["id"] for s in core_skills}
    rec_ids = {s["id"] for s in recommended_skills}

    missing_core = [s for s in core_skills if s["id"] not in matched_ids]
    missing_recommended = [s for s in recommended_skills if s["id"] not in matched_ids]
    matched_details = [s for s in core_skills + recommended_skills if s["id"] in matched_ids]
    
    # We don't have detailed objects for extra skills, just the raw strings that didn't match
    extra_skills = [sk for sk in candidate_raw_skills if _slugify(sk) not in matched_cand_ids]

    # Compute gap score (0 = no gaps, 1 = all gaps)
    total_weight = len(core_ids) * 2 + len(rec_ids)
    matched_core = len(matched_ids & core_ids)
    matched_rec = len(matched_ids & rec_ids)
    matched_weight = matched_core * 2 + matched_rec

    gap_score = 1 - (matched_weight / total_weight) if total_weight > 0 else 0
    readiness_score = round((1 - gap_score) * 100, 1)

    return {
        "role_id": f"custom:{_slugify(custom_role_title)}",
        "role_title": custom_role_title,
        "readiness_score": readiness_score,
        "gap_score": round(gap_score, 3),
        "matched_skills": matched_details,
        "missing_core_skills": missing_core,
        "missing_recommended_skills": missing_recommended,
        "extra_skills": extra_skills,
        "summary": {
            "total_required": len(all_required_ids),
            "total_matched": len(matched_ids),
            "total_missing_core": len(missing_core),
            "total_missing_recommended": len(missing_recommended),
        },
        "llm_generated": True,
        "domain": llm_result.get("domain", "general"),
    }


def _generate_skills_with_llm(
    custom_role_title: str,
    candidate_raw_skills: list,
    job_description: str = None
) -> dict | None:
    """
    Use the LLM to generate complete skill requirements for ANY custom role.
    Returns full skill objects with name, category, resources, prerequisites, and levels.
    """
    if not LLM_AVAILABLE or LLM_CLIENT is None:
        return None

    prompt = (
        "You are an expert career advisor and skills analyst. "
        "Given a job/occupation title, generate the complete list of skills someone needs for that role.\n\n"
        "Return ONLY strict JSON with this exact schema:\n"
        "{\n"
        '  "domain": "the broad domain of this role (e.g. Education, Healthcare, Technology, Business, Trades, etc.)",\n'
        '  "core_skills": [\n'
        "    {\n"
        '      "name": "Skill Name",\n'
        '      "category": "Category (e.g. Pedagogy, Communication, Technical, etc.)",\n'
        '      "levels": ["beginner", "intermediate", "advanced"],\n'
        '      "prerequisites": [],\n'
        '      "resources": [\n'
        "        {\n"
        '          "title": "Resource Title",\n'
        '          "url": "https://real-url-to-course-or-resource",\n'
        '          "type": "course",\n'
        '          "hours": 20\n'
        "        }\n"
        "      ]\n"
        "    }\n"
        "  ],\n"
        '  "recommended_skills": [\n'
        "    // same structure as core_skills\n"
        "  ]\n"
        "}\n\n"
        "CRITICAL RULES:\n"
        "- Generate 3-6 core skills that are ESSENTIAL for this specific role.\n"
        "- Generate 2-4 recommended skills that are nice-to-have.\n"
        "- For resource URLs, DO NOT guess specific course links as they may 404. ALWAYS generate verifiable search URLs (e.g., 'https://www.coursera.org/search?query=Skill+Name' or 'https://www.youtube.com/results?search_query=Learn+Skill+Name').\n"
        "- Skills must be RELEVANT to the actual occupation. Do NOT suggest programming skills for non-tech roles.\n"
        "- For each skill, provide 1-2 real learning resources with actual URLs from platforms like "
        "Coursera, edX, Khan Academy, YouTube, Udemy, LinkedIn Learning, official docs, etc.\n"
        "- Resource hours should be realistic estimates.\n"
        "- Prerequisites should reference other skill names from your list (if applicable).\n"
        "- Think carefully about what someone in this job ACTUALLY does day-to-day.\n\n"
        f"Job Title: {custom_role_title}\n"
        f"Job Description (Source of Requirements): {job_description if job_description else 'N/A'}\n"
        f"Candidate's existing skills (raw strings from resume): {json.dumps(candidate_raw_skills)}\n"
        "Note: prioritize extraction of specific skills mentioned in the Job Description if provided."
    )

    try:
        completion = _create_chat_completion_with_fallback(
            model=LLM_MODEL,
            temperature=0,
            max_tokens=3000,
            messages=[
                {"role": "system", "content": "Return only strict JSON. No markdown fences. No extra text."},
                {"role": "user", "content": prompt},
            ],
        )
        content = (completion.choices[0].message.content or "").strip()

        # Clean markdown fences if present
        if content.startswith("```"):
            content = content.replace("```json", "").replace("```", "").strip()
        start = content.find("{")
        end = content.rfind("}") + 1
        if start >= 0 and end > start:
            content = content[start:end]

        data = json.loads(content)

        core_skills = data.get("core_skills", [])
        recommended_skills = data.get("recommended_skills", [])

        # Validate structure — ensure each skill has required fields
        validated_core = []
        for skill in core_skills:
            if isinstance(skill, dict) and skill.get("name"):
                validated_core.append(_ensure_skill_structure(skill))

        validated_rec = []
        for skill in recommended_skills:
            if isinstance(skill, dict) and skill.get("name"):
                validated_rec.append(_ensure_skill_structure(skill))

        if not validated_core and not validated_rec:
            return None

        return {
            "domain": data.get("domain", "General"),
            "core_skills": validated_core,
            "recommended_skills": validated_rec,
        }
    except Exception as e:
        print(f"[LLM] Error generating skills for '{custom_role_title}': {e}")
        return None


def _ensure_skill_structure(skill: dict) -> dict:
    """Ensure a skill object has all required fields with proper types."""
    name = skill.get("name", "Unknown Skill")
    return {
        "id": _slugify(name),
        "name": name,
        "category": skill.get("category", "General"),
        "levels": skill.get("levels", ["beginner", "intermediate", "advanced"]),
        "prerequisites": skill.get("prerequisites", []),
        "resources": _validate_resources(skill.get("resources", [])),
        "domain": skill.get("domain", "general"),
    }


def _validate_resources(resources: list) -> list:
    """Ensure each resource has required fields."""
    validated = []
    for r in resources:
        if isinstance(r, dict) and r.get("title"):
            validated.append({
                "title": r.get("title", "Learning Resource"),
                "url": r.get("url", "#"),
                "type": r.get("type", "course"),
                "hours": r.get("hours", 10),
            })
    # If no valid resources, add a generic one
    if not validated:
        validated.append({
            "title": "Search for courses on this topic",
            "url": "https://www.coursera.org/",
            "type": "course",
            "hours": 10,
        })
    return validated


def _slugify(text: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "_", (text or "").strip().lower())
    slug = re.sub(r"_+", "_", slug).strip("_")
    return slug or "custom_skill"
