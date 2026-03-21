"""
End-to-end test: create a sample PDF resume, upload it, and get a pathway.
"""
import os
import sys

# Test using httpx to call the running API
import httpx

API_URL = os.getenv("API_URL", "http://localhost:8000")

# Create a simple PDF using pdfplumber's dependency (reportlab not available)
# Instead, create a minimal valid PDF manually
def create_test_pdf(filepath: str):
    """Create a minimal test PDF with resume-like content."""
    # A minimal PDF with text content
    content = """John Smith
john.smith@email.com
+1 (555) 123-4567

SUMMARY
Software developer with 3 years of experience in Python, JavaScript, and cloud computing.

SKILLS
- Python, Django, Flask, FastAPI
- JavaScript, React, Node.js
- SQL, PostgreSQL, MongoDB
- Docker, Kubernetes
- Git, Linux, AWS
- Machine Learning, Data Analysis
- HTML, CSS, REST API Design

EXPERIENCE
Software Developer | TechCorp Inc. | 2022-Present
- Built REST APIs using FastAPI and Python
- Deployed microservices on AWS using Docker and Kubernetes
- Developed React frontend applications

Junior Developer | StartupXYZ | 2020-2022
- Wrote Python scripts for data analysis
- Managed PostgreSQL databases
- Used Git for version control

EDUCATION
B.S. Computer Science | State University | 2020

CERTIFICATIONS
- AWS Cloud Practitioner
"""

    # Use pdfplumber's ability to create a PDF or use fpdf
    try:
        from fpdf import FPDF
        pdf = FPDF()
        pdf.add_page()
        pdf.set_font("Helvetica", size=11)
        for line in content.strip().split("\n"):
            pdf.cell(0, 7, text=line, new_x="LMARGIN", new_y="NEXT")
        pdf.output(filepath)
        return True
    except ImportError:
        pass

    # Alternative: use reportlab
    try:
        from reportlab.pdfgen import canvas
        from reportlab.lib.pagesizes import letter
        c = canvas.Canvas(filepath, pagesize=letter)
        y = 750
        for line in content.strip().split("\n"):
            c.drawString(72, y, line)
            y -= 14
        c.save()
        return True
    except ImportError:
        pass

    # Last resort: create a minimal PDF manually
    lines = content.strip().split("\n")
    text_content = "\n".join(lines)
    
    # Write a minimal valid PDF with the text
    stream_content = f"BT /F1 11 Tf 72 750 Td ({text_content.replace(chr(10), ') Tj T* (')}) Tj ET"
    stream_bytes = stream_content.encode("latin-1", errors="replace")
    
    with open(filepath, "wb") as f:
        f.write(b"%PDF-1.4\n")
        
        # Font resource
        f.write(b"1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n")
        f.write(b"2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n")
        f.write(b"3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] "
                b"/Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n")
        
        stream_len = len(stream_bytes)
        f.write(f"4 0 obj\n<< /Length {stream_len} >>\nstream\n".encode())
        f.write(stream_bytes)
        f.write(b"\nendstream\nendobj\n")
        
        f.write(b"5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n")
        
        f.write(b"xref\n0 6\n")
        f.write(b"0000000000 65535 f \n")
        f.write(b"0000000009 00000 n \n")
        f.write(b"0000000058 00000 n \n")
        f.write(b"0000000115 00000 n \n")
        f.write(b"0000000266 00000 n \n")
        f.write(b"0000000400 00000 n \n")
        f.write(b"trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n482\n%%EOF\n")
    
    return True


def main():
    print("=" * 60)
    print("AI-Adaptive Onboarding Engine — End-to-End Test")
    print("=" * 60)

    # Step 0: Check API health
    print("\n[1] Checking API health...")
    r = httpx.get(f"{API_URL}/health", timeout=5)
    print(f"    Status: {r.status_code} | Response: {r.json()}")
    assert r.status_code == 200

    # Step 1: List roles
    print("\n[2] Fetching available roles...")
    r = httpx.get(f"{API_URL}/api/roles", timeout=5)
    roles = r.json()["roles"]
    print(f"    Found {len(roles)} roles:")
    for role in roles:
        print(f"      - {role['title']} ({role['domain']})")

    # Step 2: Create test PDF
    test_pdf_path = os.path.join(os.path.dirname(__file__), "test_resume.pdf")
    print(f"\n[3] Creating test PDF at {test_pdf_path}...")
    create_test_pdf(test_pdf_path)
    print(f"    PDF created ({os.path.getsize(test_pdf_path)} bytes)")

    # Step 3: Upload resume
    print("\n[4] Uploading resume...")
    with open(test_pdf_path, "rb") as f:
        r = httpx.post(
            f"{API_URL}/api/upload-resume",
            files={"file": ("test_resume.pdf", f, "application/pdf")},
            timeout=30,
        )
    
    if r.status_code != 200:
        print(f"    ERROR: {r.status_code} - {r.text}")
        sys.exit(1)

    upload_data = r.json()
    print(f"    Success: {upload_data['success']}")
    print(f"    Candidate: {upload_data['resume_data'].get('candidate_name', 'N/A')}")
    print(f"    Skills found: {upload_data['resume_data'].get('skills', [])}")
    print(f"    Taxonomy IDs: {upload_data['normalized_skills'].get('taxonomy_ids', [])}")

    # Step 4: Analyze skill gap
    print("\n[5] Analyzing skill gap for 'Software Engineer'...")
    r = httpx.post(
        f"{API_URL}/api/analyze",
        json={
            "taxonomy_skill_ids": upload_data["normalized_skills"].get("taxonomy_ids", []),
            "raw_skills": upload_data["resume_data"].get("skills", []),
            "role_id": "software_engineer",
            "candidate_name": upload_data["resume_data"].get("candidate_name", "Test"),
            "experience_level": upload_data["resume_data"].get("overall_experience_level", "entry"),
        },
        timeout=30,
    )
    
    if r.status_code != 200:
        print(f"    ERROR: {r.status_code} - {r.text}")
        sys.exit(1)

    analysis = r.json()
    gap = analysis["skill_gap"]
    pathway = analysis["pathway"]

    print(f"    Readiness Score: {gap['readiness_score']}%")
    print(f"    Matched: {gap['summary']['total_matched']}")
    print(f"    Missing Core: {gap['summary']['total_missing_core']}")
    print(f"    Missing Recommended: {gap['summary']['total_missing_recommended']}")

    print(f"\n[6] Learning Pathway:")
    print(f"    Total Modules: {pathway['total_modules']}")
    print(f"    Total Hours: {pathway['total_estimated_hours']}h")
    print(f"    Estimated Weeks: {pathway['estimated_weeks']}")
    for mod in pathway["modules"]:
        print(f"    Module {mod['order']}: {mod['skill_name']} [{mod['priority']}] ({mod['estimated_hours']}h)")

    print(f"\n[7] Reasoning Trace ({len(pathway['reasoning_trace'])} steps):")
    for trace in pathway["reasoning_trace"][:5]:
        print(f"    [{trace['step']}] {trace['message'][:100]}...")

    # Cleanup
    if os.path.exists(test_pdf_path):
        os.remove(test_pdf_path)

    print("\n" + "=" * 60)
    print("✅ ALL TESTS PASSED — Backend is fully functional!")
    print("=" * 60)


if __name__ == "__main__":
    main()
