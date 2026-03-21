"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { FileText, CheckCircle2, AlertTriangle, Rocket } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function UploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [customRoleInput, setCustomRoleInput] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");



  const handleFile = useCallback((f: File) => {
    if (!f.name.toLowerCase().endsWith(".pdf")) {
      setError("Please upload a PDF file.");
      return;
    }
    setFile(f);
    setError("");
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
    },
    [handleFile]
  );

  const handleSubmit = async () => {
    if (!file) {
      setError("Please upload your resume first.");
      return;
    }
    if (!customRoleInput.trim()) {
      setError("Please type your target job role.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      setStatus("Extracting text from your resume…");
      const formData = new FormData();
      formData.append("file", file as Blob);

      const uploadRes = await fetch(`${API_URL}/api/upload-resume`, {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        const err = await uploadRes.json();
        throw new Error(err.detail || "Upload failed");
      }
      const uploadData = await uploadRes.json();

      // Step 2: Analyze skill gap & get pathway
      setStatus("Analyzing skill gaps and generating your pathway…");
        const analyzeRes = await fetch(`${API_URL}/api/analyze`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            raw_skills: uploadData.raw_skills || [],
            role_id: "__custom__",
            custom_role_title: customRoleInput.trim(),
            job_description: jobDescription.trim(),
          candidate_name:
            uploadData.resume_data?.candidate_name || "Candidate",
          experience_level:
            uploadData.resume_data?.overall_experience_level || "entry",
        }),
      });

      if (!analyzeRes.ok) {
        const err = await analyzeRes.json();
        throw new Error(err.detail || "Analysis failed");
      }

      const analyzeData = await analyzeRes.json();

      // Store results and navigate
      sessionStorage.setItem(
        "onboarding_results",
        JSON.stringify(analyzeData)
      );
      sessionStorage.setItem(
        "resume_data",
        JSON.stringify(uploadData.resume_data)
      );

      router.push("/dashboard");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
    } finally {
      setLoading(false);
      setStatus("");
    }
  };



  return (
    <main style={{ padding: "60px 0", position: "relative", zIndex: 1 }}>
      <div className="container" style={{ maxWidth: "700px" }}>
        <div
          className="section-header animate-in"
          style={{ textAlign: "center" }}
        >
          <h1>Start Your Onboarding</h1>
          <p>
            Upload your resume to build your personalized roadmap.
          </p>
        </div>

        {/* Input Zone */}
          <div
            className={`upload-zone animate-in animate-delay-1 ${
              dragOver ? "drag-over" : ""
            }`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            style={{ marginBottom: "32px" }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              style={{ display: "none" }}
              onChange={(e) => {
                if (e.target.files?.[0]) handleFile(e.target.files[0]);
              }}
            />
            {file ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ marginBottom: "16px", color: "var(--success)" }}>
                  <CheckCircle2 size={48} />
                </div>
                <h3>{file.name}</h3>
                <p>
                  {(file.size / 1024).toFixed(1)} KB — Click or drop to replace
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ marginBottom: "16px", color: "var(--text-accent)" }}>
                  <FileText size={48} />
                </div>
                <h3>Drag & drop your resume here</h3>
                <p>or click to browse — PDF files only</p>
              </div>
            )}
          </div>

        {/* Role & JD inputs */}
        <div
          className="animate-in animate-delay-2"
          style={{ marginBottom: "32px", display: "grid", gap: "24px" }}
        >
          <div>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: 600,
                fontSize: "0.95rem",
              }}
            >
              Target Job Title
            </label>
            <input
              type="text"
              value={customRoleInput}
              onChange={(e) => {
                setCustomRoleInput(e.target.value);
                setError("");
              }}
              placeholder="e.g. Senior Frontend Developer"
              style={{
                width: "100%",
                padding: "12px 14px",
                background: "var(--bg-primary)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
                color: "white",
                fontSize: "0.95rem",
                outline: "none",
              }}
            />
          </div>

          <div>
             <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "8px" }}>
               <label
                style={{
                  display: "block",
                  fontWeight: 600,
                  fontSize: "0.95rem",
                }}
               >
                 Job Description (Optional)
               </label>
               <span style={{ fontSize: "0.75rem", color: jobDescription.length >= 500 ? "#f87171" : "var(--text-muted)" }}>
                 {jobDescription.length}/500
               </span>
             </div>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the full job description here for much more accurate results..."
              maxLength={500}
              style={{
                width: "100%",
                height: "120px",
                padding: "12px 14px",
                background: "var(--bg-primary)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
                color: "white",
                fontSize: "0.9rem",
                outline: "none",
                resize: "vertical",
                lineHeight: 1.5
              }}
            />
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "6px" }}>
              Our AI will extract implicit skills and experience requirements directly from the JD text.
            </p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div
            style={{
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: "var(--radius-md)",
              padding: "14px 20px",
              color: "#f87171",
              marginBottom: "24px",
              fontSize: "0.9rem",
              display: "flex",
              gap: "8px",
              alignItems: "center"
            }}
          >
            <AlertTriangle size={18} /> {error}
          </div>
        )}

        {/* Submit */}
        <div
          className="animate-in animate-delay-3"
          style={{ textAlign: "center" }}
        >
          <button
            className="btn btn-primary btn-lg"
            onClick={handleSubmit}
            disabled={loading}
            style={{
              width: "100%",
              opacity: loading ? 0.7 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? (
              <>
                <span className="spinner" /> {status}
              </>
            ) : (
              <span style={{ display: "flex", alignItems: "center", gap: "8px" }}><Rocket size={20} /> Analyze & Generate Pathway</span>
            )}
          </button>
        </div>
      </div>
    </main>
  );
}
