<div align="center">
  <h1>🚀 AI-Adaptive Onboarding Engine</h1>
  <p><b>A Zero-Manual-Effort, AI-Driven Adaptive Learning Engine for Intelligent Upskilling</b></p>

  <p>
    <img src="https://img.shields.io/badge/Python-3.11-blue?logo=python" alt="Python" />
    <img src="https://img.shields.io/badge/Next.js-15-black?logo=next.js" alt="Next.js" />
    <img src="https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi" alt="FastAPI" />
    <img src="https://img.shields.io/badge/React-19-blue?logo=react" alt="React 19" />
    <img src="https://img.shields.io/badge/LLaMA-3.3%2070B-orange" alt="LLaMA 3.3" />
    <img src="https://img.shields.io/badge/Groq-Fast_Inference-f85149" alt="Groq API" />
  </p>
</div>

---

## 🌟 Overview

The **AI-Adaptive Onboarding Engine** is a cutting-edge platform designed to revolutionize technical and non-technical onboarding. Built for seamless zero-manual-effort curriculum generation, the engine parses user resumes against target job roles—across any domain—and dynamically generates a hyper-personalized, highly-optimized learning pathway.

By leveraging state-of-the-art open-source LLMs (Llama 3.3 70B via the Groq engine) and bespoke **graph-based Topological Sorting**, the application guarantees optimal prerequisite mapping and avoids redundant training to dramatically reduce onboarding time.

---

## ✨ Core Features

1. **📄 Intelligent Resume Parsing & Gap Analysis**
   - Automatically parses complex, unstructured resumes (PDFs) into normalized skill vectors using `pdfplumber` and the Llama 3.3 70B model.
   - Calculates a detailed, granular gap analysis between existing employee expertise and target role requirements.

2. **🌀 Infinity-Domain Custom Role Mapping**
   - Eliminates hardcoded roles completely. Enter *any* job title—from "Quantum Computing Researcher" to "Social Science Teacher" or "Sustainability Consultant"—and the AI dynamically builds a tailored competency framework in real-time.

3. **🗺️ Adaptive Pathway & Graph Engine**
   - **Directed Acyclic Graph (DAG) Construction:** Analyzes underlying skill hierarchy and dependencies to compute the optimal learning sequence.
   - **Recursive Prerequisite Resolution:** Automatically identifies hidden foundational gaps (e.g., ensuring a candidate masters "JavaScript" before learning "React").
   - **Kahn's Priority Sorting:** Uses a custom priority-weighted topological sort to sequence learning modules precisely from "Foundations" to "Expert."

4. **🛡️ Resilient AI Chatbot & Rate Limit Fallback Mechanisms**
   - Integrated intelligent chatbot for onboarding assistance and live querying.
   - **Enterprise-Grade Availability:** The application proactively manages Groq API constraints. It implements real-time fallback algorithms that dynamically switch from the primary model (`llama-3.3-70b-versatile`) to available high-speed models (like `llama-3.1-8b-instant` or `llama3-8b-8192`) when hitting rate limits. No downtime during high-load demos!

5. **🧠 Radical Transparency & Reasoning Trace**
   - Every skill gap and learning recommendation is accompanied by an AI reasoning trace—providing pure transparency on *why* a module was suggested and *how* the roadmap was structured.

6. **📊 Integrated Dashboard & Progress Tracking**
   - Clean, modern interactive Next.js dashboard equipped with real-time UI states, modern framer animations, and graphical pathway progression reporting.

---

## 🏗️ Technical Architecture

### Tech Stack

- **Frontend:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Lucide React (Icons), Framer Motion.
- **Backend:** Python 3.11+, FastAPI, Pydantic, Python-Multipart.
- **AI/ML Layer:** Groq SDK, Llama-3.3-70b-Versatile (Primary), Llama-3.1-8b-Instant (Fallback).
- **Core Algorithms:** Custom Python-based Priority-Weighted Topological Sorter.
- **Infrastructure:** Containerization via Docker & Docker-Compose.

### Repository Structure

```text
IISc/
├── backend/
│   ├── main.py                    # FastAPI entry context
│   ├── requirements.txt           # Python dependencies
│   ├── routers/
│   │   └── upload.py              # Resume processing endpoints
│   ├── services/
│   │   ├── resume_parser.py       # PDF parsing & dynamic LLM extraction
│   │   ├── job_matcher.py         # Advanced skill-gap computation logic
│   │   └── pathway_engine.py      # Adaptive dependency mapping (DAG)
│   ├── data/
│   │   └── skill_taxonomy.json    # Foundational role taxonomy fallback
│   └── tests/                     # Integrations and Unit Testing
├── frontend/
│   ├── package.json               # Node.js dependencies
│   └── app/
│       ├── page.tsx               # Beautiful Landing UI
│       ├── upload/page.tsx        # Drag-and-drop Resume Upload Interface
│       ├── dashboard/page.tsx     # Comprehensive competency Dashboard
│       └── roadmap/page.tsx       # Graph-rendered Interactive Roadmap
├── Dockerfile                     # Unified Application Containerization
├── docker-compose.yml             # Local Orchestration
├── .env.example                   # Environment templates
└── README.md                      # Documentation
```

---

## 🚀 Getting Started

You can run this project locally on your machine either using direct commands or Docker.

### Prerequisites

- **Python 3.11+**
- **Node.js 20+**
- A free **Groq API Key** (Get yours at [console.groq.com](https://console.groq.com/keys))

### 1. Environment Configuration

Clone the repository and set up your variables:

```bash
git clone <your-repo-url>
cd IISc

# Create your .env file
echo "GROQ_API_KEY=your_groq_api_key_here" > .env
echo "GROQ_MODEL=llama-3.3-70b-versatile" >> .env
echo "PORT=8000" >> .env
```

### 2. Standard Local Run (Multi-Terminal)

#### Start the FastAPI Backend (Terminal 1)
```bash
# Navigate to the project root
python -m venv .venv
# On Windows use: .venv\Scripts\activate
source .venv/bin/activate 

pip install -r backend/requirements.txt

# Run the FastAPI server
python -m uvicorn backend.main:app --reload --port 8000
```
*The backend API will be available at [http://localhost:8000/docs](http://localhost:8000/docs).*

#### Start the Next.js Frontend (Terminal 2)
```bash
cd frontend
npm install
npm run dev
```
*The interactive dashboard will be running at [http://localhost:3000](http://localhost:3000).*

### 3. Running with Docker Compose (Alternative)

For a one-command setup, you can let Docker handle the orchestration:

```bash
docker-compose up --build
```
This boots both the FastAPI backend and Next.js frontend seamlessly.

---

## 🔒 Submission Compliance & Highlights

This project successfully fulfills the **AI-Adaptive Onboarding Engine** criteria:
1. **Unconstrained Adaptability**: Eliminates rule-based rigid templates in favor of pure LLM generative generation (supporting creative, operational, and deep technical disciplines seamlessly).
2. **Robustness Architecture**: Zero hallucinations with deeply engineered prompt chains, strict JSON parsing requirements (via Pydantic), and high-availability API fallback patterns perfectly suited for rate limits mapping.
3. **Advanced Personalization**: The Graph builder ensures a learner focuses solely on what they don’t know—accelerating competency by stripping out redundant corporate onboarding tasks.
4. **Transparent Design**: Employs reasoning trace strategies to surface exactly *why* gaps exist and the exact pedagogical framework driving them.

---

## 📚 Datasets & External References

- [Kaggle: Resume & Professional Profile Dataset](https://www.kaggle.com/datasets/snehaanbhawal/resume-dataset/data)
- [Kaggle: Job Descriptions Metadata](https://www.kaggle.com/datasets/kshitizregmi/jobs-and-job-description)
- [O*NET Online Occupational Taxonomy](https://www.onetonline.org/)
- [Groq AI & Inference API Docs](https://console.groq.com/docs/quickstart)
- [Meta Llama Organization](https://www.llama.com/)

---

<div align="center">
  <p><i>MIT License — Built over a weekend for empowering candidates to bypass redundancy and accelerate their onboarding capabilities. 💡</i></p>
</div>
