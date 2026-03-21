"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Printer, Timer, GraduationCap, BookOpen, Puzzle, PlayCircle, Lock, BrainCircuit, RefreshCw, Calendar } from "lucide-react";
import Chatbot from "../../components/Chatbot";

interface Resource {
  title: string;
  url: string;
  type: string;
  hours: number;
}

interface PathwayModule {
  order: number;
  skill_id: string;
  skill_name: string;
  category: string;
  priority: string;
  estimated_hours: number;
  resources: Resource[];
  prerequisites_in_pathway: string[];
  status: string;
}

interface ReasoningStep {
  step: string;
  message: string;
}

interface TimeSavings {
  generic_hours: number;
  personalized_hours: number;
  hours_saved: number;
  percentage_saved: number;
  weeks_saved: number;
  message: string;
}

interface Pathway {
  role: string;
  total_modules: number;
  total_estimated_hours: number;
  estimated_weeks: number;
  modules: PathwayModule[];
  reasoning_trace: ReasoningStep[];
  readiness_score: number;
  time_savings?: TimeSavings;
}

// ===== localStorage helpers =====
function getStorageKey(role: string): string {
  return `onboarding_progress_${role.toLowerCase().replace(/\s+/g, "_")}`;
}

function loadProgress(role: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(getStorageKey(role));
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveProgress(role: string, completedIds: string[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getStorageKey(role), JSON.stringify(completedIds));
  } catch {
    // localStorage full or unavailable — silently ignore
  }
}

function getCompletedFromPathway(pathway: Pathway): Set<string> {
  return new Set(
    pathway.modules
      .filter((m) => m.status === "completed")
      .map((m) => m.skill_id)
  );
}

export default function RoadmapPage() {
  const router = useRouter();
  const [pathway, setPathway] = useState<Pathway | null>(null);
  const [completedModules, setCompletedModules] = useState<Set<string>>(
    new Set()
  );
  const [showReasoning, setShowReasoning] = useState(false);
  const [progressLoaded, setProgressLoaded] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem("onboarding_results");
    if (!stored) {
      router.push("/upload");
      return;
    }
    const data = JSON.parse(stored);
    const pw: Pathway = data.pathway;
    setPathway(pw);

    // Merge server-provided completion status with local progress.
    const saved = new Set(loadProgress(pw.role));
    const serverCompleted = getCompletedFromPathway(pw);
    const merged = new Set<string>([...saved, ...serverCompleted]);
    setCompletedModules(merged);
    saveProgress(pw.role, Array.from(merged));

    setProgressLoaded(true);
  }, [router]);

  const toggleModule = useCallback(
    (skillId: string) => {
      setCompletedModules((prev) => {
        const next = new Set(prev);
        if (next.has(skillId)) next.delete(skillId);
        else next.add(skillId);

        // Persist to localStorage
        if (pathway) {
          saveProgress(pathway.role, Array.from(next));
        }
        return next;
      });
    },
    [pathway]
  );

  const clearProgress = useCallback(() => {
    if (pathway) {
      setCompletedModules(new Set());
      saveProgress(pathway.role, []);
    }
  }, [pathway]);

  const handleExportICS = useCallback(() => {
    if (!pathway) return;

    let icsData = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//AI Learning Engine//Roadmap//EN\nCALSCALE:GREGORIAN\n";
    
    // Start dates tomorrow
    let currentDate = new Date();
    currentDate.setDate(currentDate.getDate() + 1);
    currentDate.setHours(9, 0, 0, 0); // 9 AM
    
    pathway.modules.forEach((mod) => {
      // Don't schedule completed skills
      if (completedModules.has(mod.skill_id)) return;

      const startDateStr = currentDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      
      // Calculate end date (assume 2 hours per sitting for the calendar event)
      const endDate = new Date(currentDate);
      endDate.setHours(endDate.getHours() + 2); 
      const endDateStr = endDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      
      icsData += "BEGIN:VEVENT\n";
      icsData += `DTSTART:${startDateStr}\n`;
      icsData += `DTEND:${endDateStr}\n`;
      icsData += `SUMMARY:Learn ${mod.skill_name}\n`;
      icsData += `DESCRIPTION:Learning module for ${mod.skill_name}. Estimated time: ${mod.estimated_hours}h.\\nPriority: ${mod.priority.toUpperCase()}\\n\\nResources:\\n`;
      // Escape commas and newlines for safe ICS rendering
      mod.resources.slice(0, 2).forEach(r => {
        icsData += `- ${r.title.replace(/,/g, '\\,')} (${r.url})\\n`;
      });
      icsData += "STATUS:CONFIRMED\n";
      icsData += "END:VEVENT\n";
      
      // Add 7 days for the next module
      currentDate.setDate(currentDate.getDate() + 7);
    });

    icsData += "END:VCALENDAR";

    const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `learning_roadmap_${pathway.role.toLowerCase().replace(/\s+/g, '_')}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [pathway, completedModules]);

  const handleUpdatePathway = useCallback((newPathway: any) => {
    setPathway(newPathway);

    // Keep completions for existing modules and merge in server-updated completed status.
    const currentModuleIds = new Set(newPathway.modules.map((m: any) => m.skill_id));
    const serverCompleted = new Set(
      newPathway.modules
        .filter((m: any) => m.status === "completed")
        .map((m: any) => m.skill_id)
    );

    setCompletedModules(prev => {
      const next = new Set<string>();
      prev.forEach(id => {
        if (currentModuleIds.has(id)) next.add(id);
      });

      const merged = new Set<string>([...next, ...serverCompleted]);
      saveProgress(newPathway.role, Array.from(merged));
      return merged;
    });

    // Persist updated pathway to sessionStorage
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("onboarding_results");
      if (stored) {
        const data = JSON.parse(stored);
        data.pathway = newPathway;
        sessionStorage.setItem("onboarding_results", JSON.stringify(data));
      }
    }
  }, []);

  if (!pathway || !progressLoaded) {
    return (
      <div className="loading-overlay">
        <span className="spinner" />
        <p>Loading roadmap…</p>
      </div>
    );
  }

  const completionPct =
    pathway.total_modules > 0
      ? Math.round((completedModules.size / pathway.total_modules) * 100)
      : 0;

  const priorityBadgeClass: Record<string, string> = {
    core: "badge-core",
    recommended: "badge-recommended",
    prerequisite: "badge-prerequisite",
  };

  const typeIcons: Record<string, React.ReactNode> = {
    course: <GraduationCap size={16} />,
    documentation: <BookOpen size={16} />,
    interactive: <Puzzle size={16} />,
    video: <PlayCircle size={16} />,
  };

  const ts = pathway.time_savings;

  return (
    <main style={{ padding: "60px 0", position: "relative", zIndex: 1 }}>
      <div className="container" style={{ maxWidth: "900px" }}>
        {/* Header */}
        <div className="section-header animate-in" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <h1>Learning Roadmap</h1>
            <p>
              Your personalized pathway to becoming a{" "}
              <strong>{pathway.role}</strong>
            </p>
          </div>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <button 
              onClick={() => window.print()}
              className="btn btn-primary"
              style={{ display: "flex", gap: "8px", alignItems: "center", fontSize: "0.9rem" }}
            >
              <Printer size={18} /> Save as PDF
            </button>
            <button 
              onClick={handleExportICS}
              className="btn btn-primary"
              style={{ display: "flex", gap: "8px", alignItems: "center", fontSize: "0.9rem", background: "var(--accent-1)", borderColor: "var(--accent-1)" }}
            >
              <Calendar size={18} /> Export to Calendar
            </button>
            {completedModules.size > 0 && (
              <button
                onClick={clearProgress}
                className="btn btn-secondary"
                style={{
                  padding: "6px 14px",
                  fontSize: "0.80rem",
                  opacity: 0.8,
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: "6px" }}><RefreshCw size={14} /> Reset Progress</span>
              </button>
            )}
          </div>
        </div>

        {/* Time Savings Banner */}
        {ts && ts.hours_saved > 0 && (
          <div
            className="animate-in animate-delay-1"
            style={{
              background:
                "linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(6, 182, 212, 0.10))",
              border: "1px solid rgba(16, 185, 129, 0.25)",
              borderRadius: "var(--radius-lg)",
              padding: "20px 24px",
              marginBottom: "24px",
              display: "flex",
              alignItems: "center",
              gap: "20px",
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#34d399",
              }}
            >
              <Timer size={40} />
            </div>
            <div style={{ flex: 1, minWidth: "200px" }}>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: "1rem",
                  color: "#34d399",
                  marginBottom: "4px",
                }}
              >
                {ts.hours_saved}h saved vs. generic onboarding
              </div>
              <div
                style={{
                  fontSize: "0.88rem",
                  color: "var(--text-secondary)",
                  lineHeight: 1.5,
                }}
              >
                {ts.message}
              </div>
            </div>
            <div
              style={{
                display: "flex",
                gap: "16px",
                flexWrap: "wrap",
              }}
            >
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontSize: "1.4rem",
                    fontWeight: 800,
                    color: "var(--text-muted)",
                    textDecoration: "line-through",
                    opacity: 0.6,
                  }}
                >
                  {ts.generic_hours}h
                </div>
                <div
                  style={{
                    fontSize: "0.7rem",
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Generic
                </div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontSize: "1.4rem",
                    fontWeight: 800,
                    color: "#34d399",
                  }}
                >
                  {ts.personalized_hours}h
                </div>
                <div
                  style={{
                    fontSize: "0.7rem",
                    color: "#34d399",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Yours
                </div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontSize: "1.4rem",
                    fontWeight: 800,
                    background:
                      "linear-gradient(135deg, var(--accent-1), var(--accent-3))",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  {ts.percentage_saved}%
                </div>
                <div
                  style={{
                    fontSize: "0.7rem",
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Saved
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Progress Bar + Stats */}
        <div
          className="glass-card animate-in animate-delay-1"
          style={{ marginBottom: "32px", padding: "24px 28px" }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "12px",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <span style={{ fontWeight: 700 }}>
              Progress: {completedModules.size} / {pathway.total_modules}{" "}
              modules
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <span style={{ color: "var(--text-muted)", fontSize: "0.88rem" }}>
                {pathway.total_estimated_hours}h total · ~
                {pathway.estimated_weeks} weeks @ 20h/week
              </span>
            </div>
          </div>
          <div
            style={{
              height: "10px",
              background: "rgba(148, 163, 184, 0.1)",
              borderRadius: "9999px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${completionPct}%`,
                background:
                  "linear-gradient(90deg, var(--accent-1), var(--accent-3))",
                borderRadius: "9999px",
                transition: "width 0.5s ease",
              }}
            />
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "0.82rem",
              color: "var(--text-muted)",
              marginTop: "6px",
            }}
          >
            <span>
              {completedModules.size > 0
                ? "✅ Progress saved automatically"
                : ""}
            </span>
            <span>{completionPct}% complete</span>
          </div>
        </div>

        {/* Reasoning Trace Toggle */}
        <div
          className="animate-in animate-delay-2"
          style={{ marginBottom: "24px" }}
        >
          <button
            className="btn btn-secondary"
            onClick={() => setShowReasoning(!showReasoning)}
            style={{ fontSize: "0.88rem" }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}><BrainCircuit size={16} /> {showReasoning ? "Hide" : "Show"} Reasoning Trace</span>
          </button>

          {showReasoning && (
            <div className="reasoning-trace" style={{ marginTop: "16px" }}>
              <h3 style={{ display: "flex", alignItems: "center", gap: "8px" }}><BrainCircuit size={18} color="var(--accent-3)" /> Why This Order?</h3>
              {pathway.reasoning_trace.map((t, i) => (
                <div className="trace-step" key={i}>
                  <span className="step-label">{t.step}</span>
                  <span>{t.message}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Timeline */}
        <div className="roadmap-timeline">
          {pathway.modules.map((mod) => {
            const isCompleted = completedModules.has(mod.skill_id);
            return (
              <div
                key={mod.skill_id}
                className={`timeline-node ${isCompleted ? "completed" : ""}`}
                style={{ animationDelay: `${mod.order * 0.05}s` }}
              >
                <div className="node-content">
                  <div className="node-header">
                    <span className="node-order">Module {mod.order}</span>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <span
                        className={`badge ${
                          priorityBadgeClass[mod.priority] || "badge-recommended"
                        }`}
                      >
                        {mod.priority}
                      </span>
                      <span className="badge badge-domain">{mod.category}</span>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      marginBottom: "4px",
                    }}
                  >
                    <button
                      onClick={() => toggleModule(mod.skill_id)}
                      style={{
                        width: "24px",
                        height: "24px",
                        borderRadius: "6px",
                        border: isCompleted
                          ? "2px solid var(--success)"
                          : "2px solid var(--border)",
                        background: isCompleted
                          ? "var(--success)"
                          : "transparent",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        fontSize: "0.7rem",
                        fontWeight: 700,
                        flexShrink: 0,
                        transition: "all var(--transition-fast)",
                      }}
                    >
                      {isCompleted ? "✓" : ""}
                    </button>
                    <span
                      className="node-title"
                      style={{
                        textDecoration: isCompleted ? "line-through" : "none",
                        opacity: isCompleted ? 0.6 : 1,
                      }}
                    >
                      {mod.skill_name}
                    </span>
                  </div>

                  <div className="node-meta">
                    <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><Timer size={14} /> {mod.estimated_hours}h estimated</span>
                    {mod.prerequisites_in_pathway.length > 0 && (
                      <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <Lock size={14} /> Prerequisites:{" "}
                        {mod.prerequisites_in_pathway.join(", ")}
                      </span>
                    )}
                  </div>

                  {/* Resources */}
                  {mod.resources.length > 0 && (
                    <div
                      style={{
                        marginTop: "14px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "6px",
                      }}
                    >
                      {mod.resources.map((r, i) => (
                        <a
                          key={i}
                          href={r.url}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            color: "var(--text-accent)",
                            fontSize: "0.85rem",
                            padding: "6px 10px",
                            background: "var(--bg-glass)",
                            borderRadius: "var(--radius-sm)",
                            transition:
                              "background var(--transition-fast)",
                          }}
                          onMouseOver={(e) =>
                            ((e.currentTarget.style.background =
                              "var(--bg-glass-hover)"))
                          }
                          onMouseOut={(e) =>
                            ((e.currentTarget.style.background =
                              "var(--bg-glass)"))
                          }
                        >
                          <span>{typeIcons[r.type] || "📚"}</span>
                          <span>{r.title}</span>
                          <span
                            style={{
                              color: "var(--text-muted)",
                              fontSize: "0.78rem",
                              marginLeft: "auto",
                            }}
                          >
                            {r.hours}h
                          </span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Back to Dashboard */}
        <div
          style={{
            display: "flex",
            gap: "16px",
            justifyContent: "center",
            marginTop: "48px",
          }}
        >
          <button
            className="btn btn-secondary"
            onClick={() => router.push("/dashboard")}
          >
            ← Back to Dashboard
          </button>
          <button
            className="btn btn-primary"
            onClick={() => router.push("/upload")}
          >
            🔄 Analyze Another Resume
          </button>
        </div>
      </div>

      {/* AI Mentor Chatbot */}
      <Chatbot pathway={pathway} onUpdatePathway={handleUpdatePathway} />
    </main>
  );
}
