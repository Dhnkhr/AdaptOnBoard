"""
Resume Parser Service
Extracts text from PDFs and uses Llama (via Groq) or keyword fallback to identify skills.
"""
import os
import re
import json
import pdfplumber
from io import BytesIO
from groq import Groq

# Try to configure Llama via Groq, but gracefully handle missing key
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

# ========== Keyword-based skill extraction (offline fallback) ==========

# Maps keyword patterns to taxonomy skill IDs
SKILL_KEYWORDS = {
    "python": ["python", "django", "flask", "fastapi", "pandas", "numpy", "scipy", "pytorch", "tensorflow", "keras"],
    "javascript": ["javascript", "js", "typescript", "es6", "es2015", "ecmascript", "node.js", "nodejs", "npm"],
    "java": ["java", "spring", "spring boot", "springboot", "j2ee", "jvm", "maven", "gradle", "hibernate"],
    "cpp": ["c++", "cpp", "c/c++", "stl", "boost"],
    "sql": ["sql", "mysql", "postgresql", "postgres", "sqlite", "oracle db", "plsql", "nosql", "mongodb", "database", "rdbms"],
    "machine_learning": ["machine learning", "ml", "scikit-learn", "sklearn", "xgboost", "random forest", "regression",
                         "classification", "supervised learning", "unsupervised learning", "model training"],
    "deep_learning": ["deep learning", "neural network", "cnn", "rnn", "lstm", "transformer", "pytorch", "tensorflow",
                      "keras", "gan", "reinforcement learning"],
    "nlp": ["nlp", "natural language processing", "text mining", "sentiment analysis", "tokenization", "bert",
            "gpt", "hugging face", "huggingface", "spacy", "nltk", "language model", "llm"],
    "react": ["react", "react.js", "reactjs", "next.js", "nextjs", "redux", "react native"],
    "node_js": ["node.js", "nodejs", "express", "express.js", "nestjs", "koa"],
    "html_css": ["html", "css", "html5", "css3", "sass", "scss", "less", "tailwind", "bootstrap", "responsive design",
                 "web design"],
    "docker": ["docker", "containerization", "container", "docker-compose", "dockerfile"],
    "kubernetes": ["kubernetes", "k8s", "kubectl", "helm", "openshift", "container orchestration"],
    "git": ["git", "github", "gitlab", "bitbucket", "version control", "svn", "mercurial"],
    "linux_cli": ["linux", "unix", "bash", "shell", "command line", "cli", "ubuntu", "centos", "terminal"],
    "cloud_aws": ["aws", "amazon web services", "ec2", "s3", "lambda", "azure", "gcp", "google cloud",
                  "cloud computing", "cloud"],
    "data_structures": ["data structures", "algorithms", "dsa", "algorithm", "sorting", "searching", "graph",
                        "tree", "linked list", "stack", "queue", "dynamic programming", "leetcode", "competitive programming"],
    "statistics": ["statistics", "probability", "hypothesis testing", "statistical analysis", "regression analysis",
                   "bayesian", "a/b testing"],
    "cybersecurity": ["cybersecurity", "cyber security", "information security", "infosec", "penetration testing",
                      "vulnerability", "firewall", "encryption", "soc", "siem"],
    "api_design": ["api", "rest", "restful", "graphql", "grpc", "microservices", "web services", "soap", "swagger",
                   "openapi", "postman"],
    "excel_advanced": ["excel", "spreadsheet", "vlookup", "pivot table", "macro", "vba", "google sheets"],
    "data_analysis": ["data analysis", "data analytics", "tableau", "power bi", "data visualization", "reporting",
                      "business intelligence", "bi"],
    "project_management": ["project management", "agile", "scrum", "kanban", "pmp", "jira", "trello", "waterfall",
                           "project planning", "sprint"],
    "business_writing": ["business writing", "technical writing", "documentation", "copywriting", "content writing",
                         "communication skills", "written communication"],
    "crm_tools": ["crm", "salesforce", "hubspot", "zoho", "customer relationship"],
    "digital_marketing": ["digital marketing", "seo", "sem", "google analytics", "social media marketing",
                          "content marketing", "email marketing", "ppc", "marketing"],
    "accounting_basics": ["accounting", "bookkeeping", "financial reporting", "gaap", "quickbooks", "tally",
                          "accounts payable", "accounts receivable"],
    "presentation_skills": ["presentation", "public speaking", "powerpoint", "keynote", "google slides"],
    "hr_management": ["human resources", "hr", "recruitment", "talent acquisition", "employee relations",
                      "performance management", "onboarding", "hris"],
    "legal_compliance": ["compliance", "regulatory", "legal", "gdpr", "hipaa", "sox", "audit"],
    "safety_training": ["safety", "osha", "workplace safety", "ppe", "safety training", "hazard"],
    "equipment_operation": ["equipment operation", "heavy equipment", "machinery", "cnc", "lathe", "mill",
                            "machine operation"],
    "quality_control": ["quality control", "qc", "quality assurance", "qa", "inspection", "iso", "iso 9001"],
    "inventory_management": ["inventory", "supply chain", "logistics", "warehouse", "procurement", "erp", "sap"],
    "lean_manufacturing": ["lean", "six sigma", "lean manufacturing", "kaizen", "5s", "continuous improvement",
                           "process improvement"],
    "forklift_certification": ["forklift", "material handling", "pallet jack"],
    "welding": ["welding", "fabrication", "mig", "tig", "arc welding", "soldering"],
    "electrical_basics": ["electrical", "wiring", "circuit", "plc", "electrical systems", "voltage", "ampere"],
    "plumbing": ["plumbing", "piping", "pipe fitting", "hvac"],
    "customer_service": ["customer service", "customer support", "client relations", "helpdesk", "help desk",
                         "call center"],
}

# Patterns for extracting candidate name (first lines before email/phone)
EMAIL_PATTERN = re.compile(r'[\w.+-]+@[\w-]+\.[\w.-]+')
PHONE_PATTERN = re.compile(r'[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}')


def _is_likely_resume(text: str) -> bool:
    """
    Advanced heuristic to determine if a document is likely a resume using a scoring system.
    Evaluates structural layout, semantic density, and linguistic features.
    """
    if not text or len(text) < 50:
        return False
        
    score = 0
    text_lower = text.lower()
    lines = [line.strip() for line in text.split('\n') if line.strip()]
    if not lines:
        return False
        
    # 1. Contact Info in Top 20% of Document (Max 45 pts)
    # Resumes almost always have contact info at the very beginning.
    top_text = "\n".join(lines[:max(15, len(lines)//5)])
    
    if EMAIL_PATTERN.search(top_text): 
        score += 15
    
    strict_phone_pattern = re.compile(r'\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b')
    if strict_phone_pattern.search(top_text): 
        score += 10
        
    # Social links are super strong resume signals
    if "linkedin.com/in/" in top_text.lower(): 
        score += 20
    if "github.com/" in top_text.lower(): 
        score += 10

    # 2. Section Header Probability (Max 35 pts)
    # Valid headers are usually standalone short lines.
    headers = ["experience", "education", "skills", "summary", "profile", "projects", "certifications", "work history", "employment", "professional experience"]
    found_headers = 0
    for line in lines:
        line_clean = line.lower().strip(':_*- ')
        if len(line_clean) < 30:
            if line_clean in headers or any(line_clean.startswith(h) for h in headers):
                found_headers += 1
                
    score += min(35, found_headers * 7)
    
    # 3. List Density / Bullet Point Ratio (Max 15 pts)
    # Resumes condense text using lists rather than paragraphs.
    bullet_chars = ["•", "-", "*", "▪", "➢", "➔", "✓", "o", "–"]
    bullet_count = sum(1 for line in lines if any(line.startswith(b) for b in bullet_chars))
    bullet_ratio = bullet_count / len(lines) if len(lines) > 0 else 0
    
    if bullet_ratio > 0.30:
        score += 15
    elif bullet_ratio > 0.15:
        score += 10
    elif bullet_ratio > 0.05:
        score += 5
        
    # 4. Action Verb Frequency (Max 15 pts)
    # Resumes frequently start sentences/bullets with past-tense action verbs.
    action_verbs = {"managed", "led", "developed", "created", "designed", "implemented", 
                    "analyzed", "built", "maintained", "improved", "increased", "reduced", 
                    "coordinated", "collaborated", "spearheaded", "engineered"}
    action_verb_count = 0
    for line in lines:
        clean_line = line
        for b in bullet_chars:
            if clean_line.startswith(b):
                clean_line = clean_line[1:].strip()
        if not clean_line: continue
        
        first_word = clean_line.split()[0].lower()
        if first_word in action_verbs:
            action_verb_count += 1
            
    if action_verb_count >= 10:
        score += 15
    elif action_verb_count >= 5:
        score += 10
    elif action_verb_count >= 2:
        score += 5
        
    # 5. General Document / Academic Penalties
    # Typical resumes are short. Books, research papers, and robust docs are long.
    if len(text) > 30000:
        score -= 50
    elif len(text) > 15000:
        score -= 25
        
    # Long narrative paragraphs indicate a general document, not a resume.
    long_paragraphs = sum(1 for line in lines if len(line) > 250)
    if long_paragraphs > 4:
        score -= 20
        
    if re.search(r'\b(?:chapter|table of contents|bibliography|conclusion|introduction)\b', text_lower):
        score -= 15

    # A score of >= 40 indicates a high probability of being a resume.
    return score >= 40


def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    """Extract raw text from a PDF file."""
    text_parts = []
    with pdfplumber.open(BytesIO(pdf_bytes)) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text_parts.append(page_text)
    return "\n".join(text_parts)


def _extract_skills_keyword(text: str) -> dict:
    """
    Keyword-based skill extraction fallback.
    Scans resume text for known skill keywords and maps to taxonomy IDs.
    """
    text_lower = text.lower()
    matched_taxonomy_ids = set()
    matched_details = []

    for taxonomy_id, keywords in SKILL_KEYWORDS.items():
        for keyword in keywords:
            # Use regex for word boundaries to avoid matching substrings (e.g., 'bi' in 'bird', 'api' in 'capital')
            pattern = r'\b' + re.escape(keyword.lower()) + r'\b'
            if re.search(pattern, text_lower):
                if taxonomy_id not in matched_taxonomy_ids:
                    matched_taxonomy_ids.add(taxonomy_id)
                    matched_details.append({
                        "raw_skill": keyword,
                        "taxonomy_id": taxonomy_id,
                        "confidence": 0.85,
                    })
                break  # one match per taxonomy_id is enough

    return {
        "matched_skills": matched_details,
        "taxonomy_ids": list(matched_taxonomy_ids),
        "unmatched_skills": [],
    }


def _extract_resume_data_keyword(text: str) -> dict:
    """
    Keyword-based resume data extraction fallback.
    Extracts name, email, phone, skills from text using patterns.
    """
    # Quick heuristic to see if this is actually a resume
    if not _is_likely_resume(text):
        return {
            "candidate_name": "Unknown",
            "email": None,
            "phone": None,
            "skills": [],
            "experience": [],
            "education": [],
            "certifications": [],
            "overall_experience_level": "entry",
            "primary_domain": "technical",
        }

    lines = text.strip().split("\n")

    # Email
    email_match = EMAIL_PATTERN.search(text)
    email = email_match.group() if email_match else None

    # Phone
    phone_match = PHONE_PATTERN.search(text)
    phone = phone_match.group() if phone_match else None

    # Try to get candidate name from first non-empty line
    candidate_name = "Candidate"
    for line in lines[:5]:
        line = line.strip()
        if line and not EMAIL_PATTERN.search(line) and not PHONE_PATTERN.search(line):
            # Likely the name — take first substantial line
            if len(line) < 60 and not any(kw in line.lower() for kw in ["resume", "curriculum", "cv", "objective", "summary", "address"]):
                candidate_name = line
                break
    # Email
    email_match = EMAIL_PATTERN.search(text)
    email = email_match.group() if email_match else None

    # Phone
    phone_match = PHONE_PATTERN.search(text)
    phone = phone_match.group() if phone_match else None

    # Skills (keyword-based)
    text_lower = text.lower()
    raw_skills = []
    for taxonomy_id, keywords in SKILL_KEYWORDS.items():
        for keyword in keywords:
            pattern = r'\b' + re.escape(keyword.lower()) + r'\b'
            if re.search(pattern, text_lower):
                raw_skills.append(keyword)
                break

    # Simple experience level heuristic
    exp_level = "entry"
    year_patterns = re.findall(r'(\d+)\+?\s*(?:years?|yrs?)\s*(?:of\s*)?(?:experience)?', text_lower)
    if year_patterns:
        max_years = max(int(y) for y in year_patterns)
        if max_years >= 10:
            exp_level = "senior"
        elif max_years >= 5:
            exp_level = "mid"
        elif max_years >= 2:
            exp_level = "junior"

    # Determine domain
    tech_count = sum(1 for sid in ["python", "javascript", "java", "react", "docker", "machine_learning"]
                     if any(kw in text_lower for kw in SKILL_KEYWORDS.get(sid, [])))
    desk_count = sum(1 for sid in ["excel_advanced", "project_management", "digital_marketing", "hr_management"]
                     if any(kw in text_lower for kw in SKILL_KEYWORDS.get(sid, [])))
    ops_count = sum(1 for sid in ["safety_training", "equipment_operation", "welding", "forklift_certification"]
                    if any(kw in text_lower for kw in SKILL_KEYWORDS.get(sid, [])))

    if tech_count >= desk_count and tech_count >= ops_count:
        domain = "technical"
    elif desk_count >= ops_count:
        domain = "desk"
    else:
        domain = "operational"

    return {
        "candidate_name": candidate_name,
        "email": email,
        "phone": phone,
        "skills": raw_skills,
        "experience": [],
        "education": [],
        "certifications": [],
        "overall_experience_level": exp_level,
        "primary_domain": domain,
    }


# ========== Main functions (try Llama via Groq, fall back to keyword) ==========


def _extract_json_object(text: str) -> dict | None:
    if not text:
        return None

    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.replace("```json", "").replace("```", "").strip()

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        start = cleaned.find("{")
        end = cleaned.rfind("}") + 1
        if start >= 0 and end > start:
            try:
                return json.loads(cleaned[start:end])
            except json.JSONDecodeError:
                return None
    return None


def _llama_json(prompt: str, max_tokens: int = 2048) -> dict | None:
    if not LLM_AVAILABLE or LLM_CLIENT is None:
        return None

    messages = [
        {
            "role": "system",
            "content": "Return only strict JSON. No markdown. No extra text.",
        },
        {"role": "user", "content": prompt},
    ]

    try:
        completion = LLM_CLIENT.chat.completions.create(
            model=LLM_MODEL,
            temperature=0,
            max_tokens=max_tokens,
            messages=messages,
        )
        content = completion.choices[0].message.content or ""
        return _extract_json_object(content)
    except Exception as e:
        if "rate limit" in str(e).lower() or "429" in str(e) or "rate_limit_exceeded" in str(e).lower():
            try:
                print(f"[LLM] Rate limit hit. Falling back to llama-3.1-8b-instant.")
                completion = LLM_CLIENT.chat.completions.create(
                    model="llama-3.1-8b-instant",
                    temperature=0,
                    max_tokens=max_tokens,
                    messages=messages,
                )
                content = completion.choices[0].message.content or ""
                return _extract_json_object(content)
            except Exception:
                pass
        return None

EXTRACTION_PROMPT = """You are an expert HR analyst. Analyze the following resume text and extract structured information.

Return ONLY a valid JSON object with this exact structure (no markdown, no extra text):
{
  "is_resume": true,
  "candidate_name": "Full Name",
  "email": "email if found or null",
  "phone": "phone if found or null",
  "skills": ["skill1", "skill2", ...],
  "experience": [
    {
      "title": "Job Title",
      "company": "Company Name",
      "duration": "e.g. 2 years",
      "description": "brief summary"
    }
  ],
  "education": [
    {
      "degree": "Degree Name",
      "institution": "Institution Name",
      "year": "Year if available"
    }
  ],
  "certifications": ["cert1", "cert2"],
  "overall_experience_level": "entry|junior|mid|senior|lead",
  "primary_domain": "technical|desk|operational"
}

Rules:
- CRITICAL: Evaluate if the document is actually a resume or CV. Set 'is_resume' to true or false.
- CRITICAL: If 'is_resume' is false, you MUST return empty lists for skills, experience, education, and certifications.
- Extract ALL skills mentioned including technical tools, programming languages, frameworks, soft skills, and domain-specific skills.
- Normalize skill names to lowercase.
- If the resume mentions related concepts, infer the skill.
- Be thorough but do not hallucinate skills that are not implied by the text.

Resume text:
---
{resume_text}
---
"""




async def extract_resume_data(resume_text: str) -> dict:
    """Extract structured data from resume text. Uses Llama if available, else keyword fallback."""
    # Strict heuristic check before doing anything (saves API calls & prevents hallucinations)
    if not _is_likely_resume(resume_text):
        return {
            "candidate_name": "Unknown",
            "email": None,
            "phone": None,
            "skills": [],
            "experience": [],
            "education": [],
            "certifications": [],
            "overall_experience_level": "entry",
            "primary_domain": "technical",
            "is_resume": False,
        }

    if LLM_AVAILABLE:
        prompt = EXTRACTION_PROMPT.replace("{resume_text}", resume_text)
        data = _llama_json(prompt, max_tokens=2048)
        if data:
            if not data.get("is_resume", True):
                data["skills"] = []
                data["experience"] = []
                data["education"] = []
                data["certifications"] = []
                data["is_resume"] = False
            return data

    # Fallback: keyword-based extraction
    data = _extract_resume_data_keyword(resume_text)
    data["is_resume"] = True
    return data


async def extract_portfolio_data(text: str) -> dict:
    """
    Bypasses the strict `_is_likely_resume` checks specifically used for PDF uploads.
    Used exclusively for generating skills from scraped URLs/Portfolios (e.g. GitHub repos).
    """
    # Try Llama first
    if LLM_AVAILABLE:
        prompt = f"""
You are an expert technical recruiter analyzing a candidate's portfolio or GitHub profile.
Identify the applicant's core skills based on their projects, repository descriptions, and primary languages.
Extract a list of technical skills and a guessed domain.

Raw Portfolio Text:
{text}

WARNING: Output ONLY a valid JSON object matching this schema. Do not include markdown blocks or any other text.
{{
    "skills": ["List", "of", "extracted", "skills"],
    "domain": "Software Engineering"
}}
"""
        data = _llama_json(prompt, max_tokens=1024)
        if data and data.get("skills"):
            return data
    
    # Keyword-based fallback: scan the scraped text for known skill patterns
    print("Using keyword fallback for portfolio extraction...")
    text_lower = text.lower()
    found_skills = set()
    
    for skill_id, keywords in SKILL_KEYWORDS.items():
        for kw in keywords:
            if kw.lower() in text_lower:
                # Convert skill_id to a readable name
                readable = skill_id.replace("_", " ").title()
                found_skills.add(readable)
                break
    
    # Also extract raw language names mentioned in the GitHub text
    language_patterns = [
        "python", "javascript", "typescript", "java", "c++", "c#", "ruby", "go",
        "rust", "swift", "kotlin", "php", "html", "css", "sql", "r", "scala",
        "dart", "flutter", "react", "angular", "vue", "node.js", "express",
        "django", "flask", "spring", "docker", "kubernetes", "aws", "azure",
        "gcp", "mongodb", "postgresql", "mysql", "redis", "graphql", "rest api",
        "git", "linux", "terraform", "jenkins", "ci/cd",
    ]
    for lang in language_patterns:
        if lang.lower() in text_lower:
            found_skills.add(lang.title())
    
    return {
        "skills": list(found_skills) if found_skills else ["General Programming"],
        "domain": "Software Engineering",
    }



