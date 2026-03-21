<div align="center">
  <h1>AI-Adaptive Onboarding Engine</h1>
  <p><b>Hackathon Submission — AI-Adaptive Onboarding Engine Challenge</b></p>
  <p><i>A Zero-Manual-Effort, LLM-Driven Adaptive Learning Engine for Intelligent, Role-Specific Upskilling</i></p>

  <p>
    <img src="https://img.shields.io/badge/Python-3.11-blue?logo=python" alt="Python" />
    <img src="https://img.shields.io/badge/Next.js-15-black?logo=next.js" alt="Next.js" />
    <img src="https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi" alt="FastAPI" />
    <img src="https://img.shields.io/badge/React-19-blue?logo=react" alt="React 19" />
    <img src="https://img.shields.io/badge/LLaMA-3.3%2070B-orange" alt="LLaMA 3.3" />
    <img src="https://img.shields.io/badge/Groq-Fast_Inference-f85149" alt="Groq API" />
    <img src="https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker" alt="Docker" />
  </p>
</div>

---

## 1. Problem Statement

Corporate onboarding today is broken. Organizations rely on static, "one-size-fits-all" training curricula that ignore an individual's existing competencies. As a result:

- **Experienced hires waste time** on basics they already know.
- **Beginners are left overwhelmed** by modules beyond their current level.
- **HR teams spend weeks** manually curating learning paths for each new role.

**The Challenge:** Build an AI-driven, adaptive learning engine that:
1. Parses a new hire's current capabilities from a **Resume (PDF)** or **GitHub Profile**.
2. Accepts a **Target Job Role** (any role — technical or non-technical) and an optional **Job Description**.
3. Dynamically identifies the precise **skill gap** between where the candidate is and where they need to be.
4. Generates a **personalized, prerequisite-ordered learning pathway** to close that gap efficiently.

---

## 2. Minimum Required Features 

The judging criteria require the following features — all are fully implemented:

| Requirement | Status | Implementation |
|---|---|---|
| **Intelligent Parsing** | Done | LLM-powered extraction of skills & experience from Resume PDFs and GitHub profiles |
| **Dynamic Mapping** | Done | Custom-role skill gap identification via Llama 3.3 70B on any job title |
| **Functional Interface** | Done | Full Next.js web app — upload Resume or GitHub URL, view Dashboard + Roadmap |
| **Reasoning Trace** | Done | Every skill gap recommendation includes an AI-generated explanation *why* |

---

## 3. Core Features

### 3.1 Multi-Source Input — Resume PDF & GitHub Profile
- **Resume Upload:** Drag-and-drop PDF parsing via `pdfplumber`, followed by LLM-based structured extraction of skills, experience level, and candidate metadata.
- **GitHub Profile URL:** Enter a public GitHub profile URL. The engine fetches up to 15 most-recently-pushed **original** (non-forked) repositories via the GitHub public API, extracts languages, topics, and descriptions, and builds a synthetic "portfolio resume" for skill extraction — no authentication required.

### 3.2 Infinity-Domain Custom Role Mapping
- Completely eliminates hardcoded role databases.
- Enter **any** job title — `"Social Science Teacher"`, `"Quantum Computing Researcher"`, `"Sustainability Consultant"`, `"Senior Frontend Developer"` — and the LLM dynamically constructs a full competency framework in real time.
- Optionally paste a **Job Description** (up to 500 characters) for precision extraction of implicit skills, experience requirements, and domain-specific knowledge from the actual JD text.

### 3.3 Adaptive Pathway & Graph Engine
- **Directed Acyclic Graph (DAG):** Analyzes skill hierarchy and dependencies to compute the optimal prerequisite-respecting learning sequence.
- **Recursive Prerequisite Resolution:** Detects hidden foundational gaps — e.g., ensures a candidate learns "JavaScript fundamentals" before "React" before "Next.js".
- **Kahn's Priority-Weighted Topological Sort:** Sequences all learning modules from Foundations → Intermediate → Advanced → Expert, respecting all inter-skill dependencies simultaneously.

### 3.4 Reasoning Trace (Transparency)
- Every skill gap recommendation is accompanied by an AI-generated *reasoning explanation*: why this skill is needed, how critical it is, and where it sits in the learning sequence.
- Powered by the `llama-3.3-70b-versatile` model via Groq's ultra-fast inference API.

### 3.5 Resilient AI Chatbot with Rate-Limit Fallback
- Integrated onboarding assistant chatbot for real-time Q&A about the generated pathway.
- **Enterprise-grade availability:** Proactively manages Groq API rate limits using an automatic fallback chain:
  - Primary: `llama-3.3-70b-versatile`
  - Fallback 1: `llama-3.1-8b-instant`
  - Fallback 2: `llama3-8b-8192`
- Zero downtime during high-load demos.

### 3.6 Interactive Dashboard & Roadmap
- Modern Next.js 15 frontend with real-time animated UI.
- **Dashboard:** Visualizes matched skills, skill gap summary, experience level, and pathway overview.
- **Roadmap View:** Step-by-step interactive learning pathway with priority ordering and reasoning annotations.

---

## 4. Technical Architecture

### 4.1 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 15 (App Router), React 19, TypeScript, Vanilla CSS |
| **Backend** | Python 3.11+, FastAPI, Pydantic, Uvicorn |
| **AI / LLM Layer** | Groq SDK, Llama-3.3-70b-versatile (Primary), Llama-3.1-8b-instant & llama3-8b-8192 (Fallback) |
| **PDF Parsing** | pdfplumber |
| **GitHub Integration** | GitHub Public REST API (no auth required) |
| **Core Algorithm** | Custom Priority-Weighted Topological Sort (Kahn's Algorithm) on a DAG |
| **Infrastructure** | Docker, Docker Compose |

### 4.2 System Architecture & Data Flow

```
User Input
(PDF Resume / GitHub URL / Custom Role / JD)
          │
          ▼
┌─────────────────────┐
│   Next.js Frontend  │  ← Upload, Role Entry, JD Paste
│  (Port 3000)        │
└────────┬────────────┘
         │  REST API calls
         ▼
┌─────────────────────────────────────────────────────────┐
│                  FastAPI Backend (Port 8000)             │
│                                                         │
│  /api/upload-resume  →  PDF text extraction             │
│                         → LLM resume parsing (Groq)     │
│                         → Structured skill vector out   │
│                                                         │
│  /api/analyze-url    →  GitHub API scraping             │
│                         → Portfolio text synthesis      │
│                         → LLM portfolio skill parsing   │
│                                                         │
│  /api/analyze        →  Custom role skill gen (LLM)     │
│                         → Skill gap computation         │
│                         → DAG construction              │
│                         → Topological sort (Kahn's)     │
│                         → Reasoning trace generation    │
└─────────────────────────────────────────────────────────┘
         │
         ▼
 Personalized Learning Pathway
 (Dashboard + Roadmap, stored in sessionStorage)
```

### 4.3 Repository Structure

```text
IISc/
├── backend/
│   ├── main.py                    # FastAPI app entry point & CORS config
│   ├── requirements.txt           # Python dependencies
│   ├── routers/
│   │   └── upload.py              # All API endpoints (upload, analyze-url, analyze)
│   ├── services/
│   │   ├── resume_parser.py       # PDF parsing, LLM extraction, portfolio skill parsing
│   │   ├── job_matcher.py         # Skill gap computation, custom role LLM generation
│   │   ├── pathway_engine.py      # DAG construction & Kahn's topological sort
│   │   ├── url_parser.py          # GitHub public API scraper & portfolio builder
│   │   └── chat_agent.py          # AI chatbot with multi-model rate-limit fallback
│   ├── data/
│   │   └── skill_taxonomy.json    # Foundational skill taxonomy reference
│   └── tests/                     # Unit & integration tests
├── frontend/
│   ├── package.json               # Node.js dependencies
│   ├── app/
│   │   ├── page.tsx               # Landing page
│   │   ├── upload/page.tsx        # Resume upload + GitHub URL input + role/JD entry
│   │   ├── dashboard/page.tsx     # Skill gap summary & pathway overview
│   │   └── roadmap/page.tsx       # Detailed interactive learning roadmap
│   └── components/
│       ├── Chatbot.tsx            # Onboarding AI assistant
│       └── ThemeToggle.tsx        # Light/dark theme toggle
├── Dockerfile                     # Unified containerization
├── docker-compose.yml             # Local orchestration (backend + frontend)
├── .env.example                   # Environment variable template
└── README.md                      # This file
```

---

## 5. Setup & Running Locally

### Prerequisites

- **Python 3.11+**
- **Node.js 20+**
- A free **Groq API Key** → [console.groq.com/keys](https://console.groq.com/keys)

### Step 1 — Clone & Configure Environment

```bash
git clone https://github.com/Dhnkhr/AdaptOnBoard.git
cd AdaptOnBoard

# Copy the env template and add your Groq key
cp .env.example .env
# Edit .env and set: GROQ_API_KEY=your_key_here
```

**`.env` file contents:**
```env
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile
PORT=8000
```

---

### Option A — Standard Local Run (Recommended for Development)

#### Terminal 1 — FastAPI Backend

```bash
# Create & activate virtual environment
python -m venv .venv

# Windows
.venv\Scripts\activate
# macOS/Linux
source .venv/bin/activate

# Install dependencies
pip install -r backend/requirements.txt

# Start the backend server
python -m uvicorn backend.main:app --reload --port 8000
```

Backend API + Swagger docs available at: **http://localhost:8000/docs**

#### Terminal 2 — Next.js Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend available at: **http://localhost:3000**

---

### Option B — Docker Compose (One-Command Setup)

```bash
# Build and start both services
docker-compose up --build
```

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| API Docs (Swagger) | http://localhost:8000/docs |

---

### Option C — Production Docker Deployment

For production/judge evaluation with optimized settings:

```bash
# Build production image
docker build -t adaptonboard:prod .

# Run with production compose file
docker compose -f docker-compose.prod.yml up
```

**Production features:**
- Resource limits (2 CPU, 4GB RAM)
- Health checks with extended startup grace period
- JSON logging with rotation (10MB per file, max 3 files)
- Auto-restart on failure
- Custom network isolation
- Production-optimized API URLs

---

## 6. End-to-End User Journey

1. **Land** on the homepage → click **"Start Onboarding"**
2. **Choose input mode:**
   -  **Upload Resume** — drag & drop your PDF resume
   -  **GitHub Profile** — paste your GitHub profile URL (e.g. `https://github.com/username`)
3. **Enter Target Job Title** — any role, any domain
4. *(Optional)* **Paste Job Description** — for precision skill extraction
5. Click **"Analyze & Generate Pathway"**
6. View your **Dashboard** — skill matches, skill gaps, experience level
7. Navigate to **Roadmap** — your personalized, prerequisite-ordered learning pathway with AI reasoning
8. Use the **Chatbot** — ask follow-up questions about your pathway at any time

---

## 7. Datasets & External References

As required by the hackathon, all datasets used are publicly available:

| Dataset | Source | Usage |
|---|---|---|
| Resume & Professional Profile Dataset | [Kaggle — snehan/resume-dataset](https://www.kaggle.com/datasets/snehaanbhawal/resume-dataset/data) | Benchmarking resume parsing accuracy |
| Jobs and Job Descriptions | [Kaggle — kshitizregmi/jobs-and-job-description](https://www.kaggle.com/datasets/kshitizregmi/jobs-and-job-description) | Reference for role-skill mapping validation |
| O*NET Occupational Information Network | [onetonline.org](https://www.onetonline.org/db_releases.html) | Industry-standard occupational taxonomy reference |

**Models used (explicitly cited):**
- `llama-3.3-70b-versatile` — Primary LLM for skill extraction, gap analysis, and reasoning (via Groq)
- `llama-3.1-8b-instant` — Rate-limit fallback model
- `llama3-8b-8192` — Secondary fallback model

---

## 8. Evaluation Criteria Compliance

| Criterion | Weight | Our Implementation |
|---|---|---|
| **Technical Sophistication** | 20% | Custom DAG + Kahn's topological sort for prerequisite resolution; multi-stage LLM pipeline with strict Pydantic JSON validation; rate-limit fallback chain |
| **Grounding & Reliability** | 15% | Zero hallucination design: Pydantic-enforced structured outputs, strict JSON parsing with error recovery, Groq inference with deterministic prompts |
| **Reasoning Trace** | 10% | Every skill recommendation carries an AI-generated `reasoning` field explaining *why* it's needed and *where* in the learning sequence |
| **Productivity** | 10% | Redundant training elimination via prerequisite graph — learners only see what they don't already know |
| **User Experience** | 15% | Modern, animated Next.js UI; multi-input modes (PDF + GitHub); chatbot assistant; theme toggle; intuitive pipeline from upload to roadmap |
| **Cross-Domain Scalability** | 10% | Completely hardcoding-free: supports any job title via pure LLM generation — from "Data Scientist" to "Social Science Teacher" |
| **Communication & Documentation** | 20% | This README, GitHub public repository, inline code documentation, Swagger API docs auto-generated by FastAPI |

---

## 9. Presentation — 5-Slide Deck Outline

> *(As required by the hackathon submission format)*

**Slide 1 — Solution Overview**
- Problem: Static onboarding wastes experienced hires' time, overwhelms beginners
- Solution: AI engine that adapts to *every individual* using their actual skills
- Value proposition: Reduce onboarding time, eliminate redundancy, maximize ROI

**Slide 2 — Architecture & Workflow**
- System diagram: Frontend → FastAPI → Groq LLM → DAG engine → Pathway output
- Two input modes: Resume PDF + GitHub profile URL
- Data flow: Input → Skill Extraction → Gap Analysis → Topological Sort → Roadmap

**Slide 3 — Tech Stack & Models**
- Frontend: Next.js 15, React 19, TypeScript
- Backend: FastAPI, Python 3.11, pdfplumber, GitHub Public API
- LLMs: Llama 3.3 70B (primary), Llama 3.1 8B & llama3-8b-8192 (fallbacks) via Groq
- Algorithm: Priority-Weighted Topological Sort (Kahn's Algorithm) on a DAG

**Slide 4 — Algorithms, Training & Datasets**
- Skill gap computation logic & dependency graph construction
- Datasets: Kaggle Resume Dataset, Kaggle Jobs Dataset, O*NET taxonomy
- Internal metrics: skill match rate, gap coverage, pathway depth vs. experience level

**Slide 5 — Datasets & Metrics**
- Public datasets disclosed (see Section 7)
- Evaluation: Technical sophistication + UX + cross-domain generalization
- Originality: Fully custom "Adaptive Logic" — the DAG engine teaches only what the candidate needs

---

## 10. Docker Deployment & Troubleshooting

### Building & Running

**Local Development:**
```bash
docker compose up --build
```

**Production Build:**
```bash
docker compose -f docker-compose.prod.yml up --build
```

### Troubleshooting

| Issue | Solution |
|---|---|
| **Port 3000/8000 already in use** | Change ports in `docker-compose.yml`: `"3001:3000"` |
| **Health check failing** | Increase `start_period` to 60s; ensure `.env` has valid `GROQ_API_KEY` |
| **Frontend can't reach backend** | Verify `NEXT_PUBLIC_API_URL=http://app:8000` in Dockerfile stage 1 |
| **Docker daemon not running** | Start Docker Desktop or `systemctl start docker` (Linux) |
| **Permission denied on start.sh** | Run `chmod +x start.sh` before building |
| **Out of memory during build** | Increase Docker memory limit to 4GB+ in settings |

### Docker Best Practices Applied

✅ **Multi-stage builds** — Reduces final image size by excluding build tools  
✅ **Alpine/slim base images** — Smaller attack surface, faster pulls  
✅ **Health checks** — Monitors container readiness  
✅ **Environment isolation** — Separate `.env` and `.env.prod` configs  
✅ **Resource limits** — Prevents runaway containers in production  
✅ **Logging configuration** — JSON logs with rotation  

---

## 11. Originality Statement

This project was built from scratch for this hackathon. The **"Adaptive Logic"** (DAG-based prerequisite resolver + priority-weighted topological sorter) is an original implementation. No pre-built recommendation engines, curriculum APIs, or external learning path services are used. The LLM is used purely as an inference engine with structured output contracts enforced entirely by our own Pydantic models and prompt engineering.

---

<div align="center">
  <p><b>Repository:</b> <a href="https://github.com/Dhnkhr/AdaptOnBoard">github.com/Dhnkhr/AdaptOnBoard</a></p>
  <p><i>MIT License — Built for the AI-Adaptive Onboarding Engine Hackathon Challenge</i></p>
</div>
