"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, AlertCircle, Info, BookOpen, Briefcase, Rocket, BrainCircuit, Map } from "lucide-react";

interface SkillDetail {
  id: string;
  name: string;
  category: string;
  priority?: string;
  resources?: { title: string; url: string; type: string; hours: number }[];
}

interface SkillGap {
  role_title: string;
  readiness_score: number;
  matched_skills: SkillDetail[];
  missing_core_skills: SkillDetail[];
  missing_recommended_skills: SkillDetail[];
  summary: {
    total_required: number;
    total_matched: number;
    total_missing_core: number;
    total_missing_recommended: number;
  };
}

interface AnalysisResult {
  candidate_name: string;
  experience_level: string;
  skill_gap: SkillGap & { reasoning_trace?: { step: string; message: string }[] };
  pathway: {
    total_modules: number;
    total_estimated_hours: number;
    estimated_weeks: number;
    reasoning_trace?: { step: string; message: string }[];
  };
}

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<AnalysisResult | null>(null);
  const [resumeData, setResumeData] = useState<any>(null);
  const [viewMode, setViewMode] = useState<"candidate" | "manager">("candidate");

  // Diagnostic Modal State
  const [diagnosticOpen, setDiagnosticOpen] = useState(false);
  const [activeSkill, setActiveSkill] = useState("");
  const [diagnosticLoading, setDiagnosticLoading] = useState(false);
  const [diagnosticData, setDiagnosticData] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [diagnosticResult, setDiagnosticResult] = useState<"pass" | "fail" | null>(null);

  const handleOpenDiagnostic = async (skillName: string, roleTitle: string) => {
    setActiveSkill(skillName);
    setDiagnosticOpen(true);
    setDiagnosticLoading(true);
    setDiagnosticData(null);
    setAnswers({});
    setDiagnosticResult(null);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    try {
      const res = await fetch(`${apiUrl}/api/diagnostic/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skill_name: skillName, role_title: roleTitle })
      });
      const json = await res.json();
      setDiagnosticData(json);
    } catch (e) {
      console.error(e);
    } finally {
      setDiagnosticLoading(false);
    }
  };

  const submitDiagnostic = () => {
    if (!diagnosticData) return;
    let score = 0;
    diagnosticData.questions.forEach((q: any, i: number) => {
      if (answers[i] === q.correctIndex) score++;
    });
    setDiagnosticResult(score >= 2 ? "pass" : "fail");
  };

  useEffect(() => {
    const stored = sessionStorage.getItem("onboarding_results");
    const storedResume = sessionStorage.getItem("resume_data");

    if (!stored) {
      router.push("/upload");
      return;
    }
    setData(JSON.parse(stored));
    if (storedResume) {
      try {
        setResumeData(JSON.parse(storedResume));
      } catch (e) {
        console.error("Failed to parse resume_data");
      }
    }
  }, [router]);

  if (!data) {
    return (
      <div className="loading-overlay">
        <span className="spinner" />
        <p>Loading results…</p>
      </div>
    );
  }

  const { skill_gap, pathway, candidate_name } = data;
  const score = skill_gap.readiness_score;

  const circumference = 2 * Math.PI * 56;
  const dashOffset = circumference - (score / 100) * circumference;

  const scoreColor =
    score >= 70
      ? "var(--success)"
      : score >= 40
        ? "var(--warning)"
        : "var(--danger)";

  return (
    <main style={{ padding: "60px 0", position: "relative", zIndex: 1 }}>
      <div className="container">
        {/* Header with Toggle */}
        <div className="animate-in" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "16px" }}>
          <div className="section-header" style={{ marginBottom: 0 }}>
            <h1>Skill Gap Analysis</h1>
            <p>
              Results for <strong>{candidate_name}</strong> →{" "}
              <strong>{skill_gap.role_title}</strong>
            </p>
          </div>

          <div style={{ display: "flex", gap: "8px", background: "var(--bg-secondary)", padding: "6px", borderRadius: "12px", border: "1px solid var(--border)" }}>
            <button
              onClick={() => setViewMode("candidate")}
              style={{ padding: "8px 16px", borderRadius: "8px", border: "none", background: viewMode === "candidate" ? "var(--accent-1)" : "transparent", color: viewMode === "candidate" ? "#fff" : "var(--text-secondary)", fontWeight: 600, cursor: "pointer", fontSize: "0.85rem", transition: "all 0.2s" }}
            >
              Candidate View
            </button>
            <button
              onClick={() => setViewMode("manager")}
              style={{ padding: "8px 16px", borderRadius: "8px", border: "none", background: viewMode === "manager" ? "var(--accent-3)" : "transparent", color: viewMode === "manager" ? "#fff" : "var(--text-secondary)", fontWeight: 600, cursor: "pointer", fontSize: "0.85rem", transition: "all 0.2s" }}
            >
              Manager ROI View
            </button>
          </div>
        </div>

        <hr style={{ borderColor: "var(--border)", margin: "24px 0 32px 0" }} />

        {/* Extracted Profile / Experience */}
        {resumeData && resumeData.experience && resumeData.experience.length > 0 && (
          <div className="animate-in animate-delay-1" style={{ marginBottom: "32px", padding: "24px", background: "var(--bg-secondary)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)" }}>
            <h3 style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px", fontSize: "1.1rem" }}>
              <Briefcase size={20} color="var(--accent-1)" /> Extracted Experience Profile
              <span className="badge badge-domain" style={{ marginLeft: "8px", fontSize: "0.75rem", background: "var(--accent-3)", color: "white" }}>
                Classified as: {resumeData.overall_experience_level?.toUpperCase() || "ENTRY"}
              </span>
            </h3>
            <div style={{ display: "grid", gap: "16px", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))" }}>
              {resumeData.experience.slice(0, 3).map((exp: any, i: number) => (
                <div key={i} style={{ padding: "12px", background: "var(--bg-primary)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-light)" }}>
                  <h4 style={{ fontSize: "0.95rem", fontWeight: 700, margin: "0 0 4px 0" }}>{exp.title}</h4>
                  <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "8px" }}>
                    {exp.company} • {exp.duration}
                  </div>
                  {exp.description && (
                    <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: 0, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {exp.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Conditional Content based on View Mode */}
        {viewMode === "manager" ? (
          <div className="animate-in animate-delay-1" style={{ marginBottom: "40px" }}>
            <h2 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: "20px", color: "var(--accent-3)", display: "flex", alignItems: "center", gap: "8px" }}>
              <Briefcase size={22} /> Business Impact (ROI)
            </h2>
            <div className="stats-row" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
              <div className="stat-card" style={{ borderLeft: "4px solid var(--success)", padding: "24px" }}>
                <div className="stat-value" style={{ color: "var(--success)", fontSize: "2.5rem" }}>
                  ₹{(skill_gap.matched_skills.length * 20 * 2000).toLocaleString('en-IN')}
                </div>
                <div className="stat-label" style={{ fontSize: "0.9rem" }}>Est. Training Cost Avoided</div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "8px" }}>Based on ₹2,000/hr fully-loaded corporate rate</div>
              </div>
              <div className="stat-card" style={{ borderLeft: "4px solid var(--accent-1)", padding: "24px" }}>
                <div className="stat-value" style={{ fontSize: "2.5rem" }}>{skill_gap.matched_skills.length * 20}h</div>
                <div className="stat-label" style={{ fontSize: "0.9rem" }}>Redundant Training Avoided</div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "8px" }}>Time saved leveraging existing skills</div>
              </div>
              <div className="stat-card" style={{ borderLeft: "4px solid var(--warning)", padding: "24px" }}>
                <div className="stat-value" style={{ color: "var(--warning)", fontSize: "2.5rem" }}>{pathway.estimated_weeks}w</div>
                <div className="stat-label" style={{ fontSize: "0.9rem" }}>Time to Full Productivity</div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "8px" }}>Estimated weeks to bridge all core gaps</div>
              </div>
              <div className="stat-card" style={{ borderLeft: "4px solid var(--accent-3)", padding: "24px" }}>
                <div className="stat-value" style={{ color: "var(--accent-3)", fontSize: "2.5rem" }}>{skill_gap.readiness_score}%</div>
                <div className="stat-label" style={{ fontSize: "0.9rem" }}>Day-One Readiness</div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "8px" }}>Percentage of core skills possessed</div>
              </div>
            </div>

            <div className="glass-card" style={{ marginTop: "24px", padding: "24px" }}>
              <h3 style={{ fontSize: "1.1rem", marginBottom: "12px", color: "var(--text-primary)" }}>Manager Summary</h3>
              <p style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>
                <strong>{candidate_name}</strong> is an excellent initial fit for the <strong>{skill_gap.role_title}</strong> role,
                starting with a baseline readiness of {skill_gap.readiness_score}%. By bypassing {skill_gap.matched_skills.length * 20} hours
                of redundant foundational tracking, this candidate will save approximately ₹{(skill_gap.matched_skills.length * 20 * 2000).toLocaleString('en-IN')} in wasted onboarding costs.
                They require focused upskilling on {skill_gap.missing_core_skills.length} core gaps before reaching full competency.
              </p>
            </div>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 200px",
              gap: "24px",
              marginBottom: "40px",
              alignItems: "start",
            }}
            className="animate-in animate-delay-1"
          >
            <div className="stats-row" style={{ marginBottom: 0 }}>
              <div className="stat-card">
                <div className="stat-value">
                  {skill_gap.summary.total_matched}
                </div>
                <div className="stat-label">Skills Matched</div>
              </div>
              <div className="stat-card">
                <div
                  className="stat-value"
                  style={{
                    background:
                      "linear-gradient(135deg, var(--danger), var(--warning))",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  {skill_gap.summary.total_missing_core}
                </div>
                <div className="stat-label">Core Gaps</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">
                  {pathway.total_modules}
                </div>
                <div className="stat-label">Learning Modules</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">
                  {pathway.estimated_weeks}w
                </div>
                <div className="stat-label">Est. Duration</div>
              </div>
            </div>

            {/* Readiness Gauge */}
            <div
              className="glass-card"
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "24px",
              }}
            >
              <div className="progress-ring">
                <svg width="130" height="130">
                  <circle
                    className="track"
                    cx="65"
                    cy="65"
                    r="56"
                    strokeWidth="8"
                  />
                  <circle
                    className="fill"
                    cx="65"
                    cy="65"
                    r="56"
                    strokeWidth="8"
                    stroke={scoreColor}
                    strokeDasharray={circumference}
                    strokeDashoffset={dashOffset}
                  />
                </svg>
                <span
                  className="label"
                  style={{
                    background: "none",
                    WebkitTextFillColor: scoreColor,
                    color: scoreColor,
                  }}
                >
                  {score}%
                </span>
              </div>
              <span
                style={{
                  color: "var(--text-muted)",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  marginTop: "8px",
                }}
              >
                Readiness Score
              </span>
            </div>
          </div>
        )}



        {/* Matched Skills */}
        {skill_gap.matched_skills.length > 0 && (
          <div
            className="animate-in animate-delay-2"
            style={{ marginBottom: "40px" }}
          >
            <h2
              style={{
                fontSize: "1.3rem",
                fontWeight: 700,
                marginBottom: "16px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <CheckCircle2 size={24} color="#34d399" /> Matched Skills
              <span className="badge badge-matched">
                {skill_gap.matched_skills.length}
              </span>
            </h2>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "10px",
              }}
            >
              {skill_gap.matched_skills.map((s) => (
                <div
                  key={s.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    background: "rgba(16, 185, 129, 0.08)",
                    border: "1px solid rgba(16, 185, 129, 0.2)",
                    borderRadius: "var(--radius-sm)",
                    padding: "6px 12px 6px 16px",
                    fontSize: "0.88rem",
                    color: "#34d399",
                    fontWeight: 500,
                  }}
                >
                  {s.name}
                  <button
                    onClick={() => handleOpenDiagnostic(s.name, skill_gap.role_title)}
                    style={{
                      background: "rgba(16,185,129,0.15)",
                      border: "1px solid rgba(16,185,129,0.3)",
                      color: "#34d399",
                      padding: "4px 8px",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      transition: "all 0.2s"
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = "rgba(16,185,129,0.3)"}
                    onMouseOut={(e) => e.currentTarget.style.background = "rgba(16,185,129,0.15)"}
                  >
                    <BrainCircuit size={12} /> Verify
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Missing Core Skills */}
        {skill_gap.missing_core_skills.length > 0 && (
          <div
            className="animate-in animate-delay-3"
            style={{ marginBottom: "40px" }}
          >
            <h2
              style={{
                fontSize: "1.3rem",
                fontWeight: 700,
                marginBottom: "16px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <AlertCircle size={24} color="#f87171" /> Missing Core Skills
              <span className="badge badge-core">
                {skill_gap.missing_core_skills.length}
              </span>
            </h2>
            <div className="skills-grid">
              {skill_gap.missing_core_skills.map((s) => (
                <div className="skill-card" key={s.id}>
                  <div className="skill-header">
                    <span className="skill-name">{s.name}</span>
                    <span className="badge badge-core">Core</span>
                  </div>
                  <span className="skill-category">{s.category}</span>
                  <div className="skill-resources">
                    {s.resources?.slice(0, 2).map((r, i) => (
                      <div key={i} style={{ marginBottom: "8px" }}>
                        <a
                          href={r.url}
                          target="_blank"
                          rel="noreferrer"
                          className="resource-link"
                        >
                          <BookOpen size={14} style={{ display: "inline", marginBottom: "-2px" }} /> {r.title}{" "}
                          <span style={{ color: "var(--text-muted)" }}>
                            ({r.hours}h)
                          </span>
                        </a>
                        <div style={{ fontSize: "0.7rem", color: "#34d399", display: "flex", alignItems: "center", gap: "4px", marginTop: "2px", opacity: 0.8 }}>
                          <CheckCircle2 size={10} /> Verified Learning Resource
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Missing Recommended Skills */}
        {skill_gap.missing_recommended_skills.length > 0 && (
          <div
            className="animate-in animate-delay-4"
            style={{ marginBottom: "40px" }}
          >
            <h2
              style={{
                fontSize: "1.3rem",
                fontWeight: 700,
                marginBottom: "16px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <Info size={24} color="#60a5fa" /> Missing Recommended Skills
              <span className="badge badge-recommended">
                {skill_gap.missing_recommended_skills.length}
              </span>
            </h2>
            <div className="skills-grid">
              {skill_gap.missing_recommended_skills.map((s) => (
                <div className="skill-card" key={s.id}>
                  <div className="skill-header">
                    <span className="skill-name">{s.name}</span>
                    <span className="badge badge-recommended">
                      Recommended
                    </span>
                  </div>
                  <span className="skill-category">{s.category}</span>
                  {s.resources && s.resources.length > 0 && (
                    <div className="skill-resources">
                      {s.resources.slice(0, 2).map((r, i) => (
                        <a
                          key={i}
                          href={r.url}
                          target="_blank"
                          rel="noreferrer"
                          className="resource-link"
                        >
                          📚 {r.title}{" "}
                          <span style={{ color: "var(--text-muted)" }}>
                            ({r.hours}h)
                          </span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Reasoning Section */}
        <div style={{ marginTop: "40px" }} className="animate-in animate-delay-4">
          <h2 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: "20px", color: "var(--accent-1)", display: "flex", alignItems: "center", gap: "8px" }}>
            <BrainCircuit size={22} /> AI Analytical Reasoning
          </h2>
          <div className="glass-card" style={{ padding: "0", overflow: "hidden" }}>
            <div style={{ background: "rgba(139, 92, 246, 0.05)", padding: "16px 24px", borderBottom: "1px solid var(--border-light)" }}>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>Pathfinding Logic & Relevance Analysis</p>
            </div>
            <div style={{ padding: "24px" }}>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "16px" }}>
                {pathway.reasoning_trace?.slice(0, 3).map((step, idx) => (
                  <li key={idx} style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
                    <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "var(--accent-1)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 700, flexShrink: 0, marginTop: "2px" }}>
                      {idx + 1}
                    </div>
                    <div>
                      <p style={{ fontSize: "0.95rem", color: "var(--text-primary)", lineHeight: 1.5 }}>{step.message}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* The Future Hire Preview - WOW Factor */}
        <div
          className="animate-in"
          style={{
            marginTop: "60px",
            padding: "40px",
            background: "linear-gradient(135deg, rgba(6, 182, 212, 0.1), rgba(139, 92, 246, 0.1))",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--accent-1)",
            position: "relative",
            overflow: "hidden"
          }}
        >
          <div style={{ position: "absolute", top: "-20px", right: "-20px", opacity: 0.1 }}>
            <Rocket size={150} />
          </div>

          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
              <span style={{ padding: "6px 12px", background: "var(--accent-1)", color: "white", borderRadius: "20px", fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase" }}>The Outcome</span>
              <h2 style={{ fontSize: "1.5rem", fontWeight: 800, margin: 0 }}>The "Future Hire" Preview</h2>
            </div>

            <p style={{ color: "var(--text-secondary)", marginBottom: "32px", maxWidth: "600px", lineHeight: 1.6 }}>
              Upon completing this personalized pathway, <strong>{candidate_name}</strong> will possess 100% of the core competencies required for the <strong>{skill_gap.role_title}</strong> role.
            </p>

            <div className="glass-card" style={{ padding: "32px", border: "1px dashed var(--accent-1)", background: "rgba(10, 15, 30, 0.4)" }}>
              <div style={{ display: "flex", gap: "24px", alignItems: "center", flexWrap: "wrap" }}>
                <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "linear-gradient(45deg, var(--accent-1), var(--accent-3))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem", fontWeight: 800, color: "white" }}>
                  {candidate_name.charAt(0)}
                </div>
                <div>
                  <h3 style={{ fontSize: "1.4rem", marginBottom: "4px" }}>{candidate_name}</h3>
                  <p style={{ color: "#34d399", fontWeight: 700, fontSize: "1rem" }}>{skill_gap.role_title} <CheckCircle2 size={16} style={{ display: "inline", marginLeft: "4px", position: "relative", top: "2px" }} /></p>
                </div>
              </div>

              <div style={{ marginTop: "24px", display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {skill_gap.matched_skills.map(s => (
                  <span key={s.id} style={{ padding: "4px 10px", background: "rgba(16, 185, 129, 0.15)", color: "#34d399", borderRadius: "6px", fontSize: "0.8rem", fontWeight: 600 }}>{s.name}</span>
                ))}
                {skill_gap.missing_core_skills.map(s => (
                  <span key={s.id} style={{ padding: "4px 10px", background: "rgba(139, 92, 246, 0.2)", color: "var(--accent-1)", borderRadius: "6px", fontSize: "0.8rem", fontWeight: 700, border: "1px solid var(--accent-1)" }}>{s.name}</span>
                ))}
              </div>

              <div style={{ marginTop: "24px", paddingTop: "20px", borderTop: "1px solid var(--border-light)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Post-Pathing Status: <strong>Ready for High-Impact Tasks</strong></span>
                <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--accent-2)" }}>Level: Verified Professional</span>
              </div>
            </div>
          </div>
        </div>

        {/* CTA to Roadmap */}
        <div style={{ textAlign: "center", marginTop: "48px" }}>
          <button
            className="btn btn-primary btn-lg"
            onClick={() => router.push("/roadmap")}
          >
            <span style={{ display: "flex", alignItems: "center", gap: "8px" }}><Map size={20} /> View Learning Roadmap</span>
          </button>
        </div>
      </div>

      {/* Diagnostic Modal */}
      {diagnosticOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(10, 15, 30, 0.85)", backdropFilter: "blur(8px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div className="animate-in" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", width: "100%", maxWidth: "600px", maxHeight: "90vh", overflowY: "auto", position: "relative", padding: "32px" }}>
            <button
              onClick={() => setDiagnosticOpen(false)}
              style={{ position: "absolute", top: "20px", right: "20px", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "1.5rem" }}
            >
              &times;
            </button>
            <h2 style={{ fontSize: "1.4rem", marginBottom: "8px", display: "flex", alignItems: "center", gap: "10px", color: "var(--text-primary)" }}>
              <BrainCircuit size={24} color="var(--accent-1)" /> Competency Verification
            </h2>
            <p style={{ color: "var(--text-secondary)", marginBottom: "24px", fontSize: "0.95rem" }}>
              Verifying practical proficiency for: <strong style={{ color: "var(--accent-1)" }}>{activeSkill}</strong>
            </p>

            {diagnosticLoading ? (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <div className="spinner" style={{ width: "40px", height: "40px", border: "4px solid rgba(139, 92, 246, 0.2)", borderTopColor: "var(--accent-1)" }}></div>
                <p style={{ marginTop: "16px", color: "var(--text-secondary)", fontSize: "0.9rem" }}>AI generates dynamic practical scenario...</p>
              </div>
            ) : diagnosticData ? (
              <div>
                {!diagnosticResult ? (
                  <>
                    <div style={{ display: "flex", flexDirection: "column", gap: "24px", marginBottom: "32px" }}>
                      {diagnosticData.questions?.map((q: any, qIdx: number) => (
                        <div key={qIdx} style={{ background: "var(--bg-primary)", padding: "20px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-light)" }}>
                          <p style={{ fontWeight: 600, fontSize: "0.95rem", marginBottom: "16px", lineHeight: 1.5 }}>
                            {qIdx + 1}. {q.questionText}
                          </p>
                          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                            {q.options.map((opt: string, oIdx: number) => (
                              <label key={oIdx} style={{ display: "flex", alignItems: "flex-start", gap: "12px", cursor: "pointer", padding: "12px", background: answers[qIdx] === oIdx ? "rgba(139, 92, 246, 0.15)" : "rgba(255,255,255,0.03)", border: `1px solid ${answers[qIdx] === oIdx ? "var(--accent-1)" : "transparent"}`, borderRadius: "8px", transition: "all 0.2s" }}>
                                <input
                                  type="radio"
                                  name={`q-${qIdx}`}
                                  checked={answers[qIdx] === oIdx}
                                  onChange={() => setAnswers({ ...answers, [qIdx]: oIdx })}
                                  style={{ marginTop: "4px", accentColor: "var(--accent-1)" }}
                                />
                                <span style={{ fontSize: "0.9rem", color: answers[qIdx] === oIdx ? "var(--accent-1)" : "var(--text-secondary)", lineHeight: 1.4 }}>{opt}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={submitDiagnostic}
                      className="btn btn-primary"
                      style={{ width: "100%", padding: "14px", fontSize: "1rem" }}
                      disabled={Object.keys(answers).length < diagnosticData.questions.length}
                    >
                      Submit Verification
                    </button>
                  </>
                ) : (
                  <div style={{ textAlign: "center", padding: "20px 0" }}>
                    <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: diagnosticResult === "pass" ? "rgba(16, 185, 129, 0.1)" : "rgba(248, 113, 113, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px auto" }}>
                      {diagnosticResult === "pass" ? <CheckCircle2 size={40} color="#34d399" /> : <AlertCircle size={40} color="#f87171" />}
                    </div>
                    <h3 style={{ fontSize: "1.5rem", marginBottom: "12px", color: diagnosticResult === "pass" ? "#34d399" : "#f87171" }}>
                      {diagnosticResult === "pass" ? "Verification Passed! ✅" : "Verification Failed ❌"}
                    </h3>
                    <p style={{ color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: "24px" }}>
                      {diagnosticResult === "pass"
                        ? "You've proven practical competency in this skill. It will safely remain in your 'Matched Skills' list."
                        : "You did not pass the competency threshold. In a production environment, this skill would now be dynamically added to your Core Gaps pathway."}
                    </p>
                    <button onClick={() => setDiagnosticOpen(false)} className="btn btn-secondary">Close Verification</button>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "20px", color: "#f87171" }}>Failed to generate quiz. Please try again.</div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
