"use client";

import { useRouter } from "next/navigation";
import { Rocket, FileText, Target, Map, Terminal, Briefcase, Wrench } from "lucide-react";

export default function Home() {
  const router = useRouter();

  return (
    <main>
      {/* Hero Section */}
      <section
        style={{
          minHeight: "calc(100vh - 70px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Animated orbs */}
        <div
          style={{
            position: "absolute",
            width: "500px",
            height: "500px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(108,92,231,0.12) 0%, transparent 70%)",
            top: "-100px",
            right: "-100px",
            animation: "bgPulse 6s ease-in-out infinite alternate",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(6,182,212,0.10) 0%, transparent 70%)",
            bottom: "-80px",
            left: "-80px",
            animation: "bgPulse 8s ease-in-out infinite alternate-reverse",
          }}
        />

        <div
          className="container"
          style={{ maxWidth: "800px", position: "relative", zIndex: 1 }}
        >
          <div className="animate-in" style={{ marginBottom: "20px" }}>
            <span
              className="badge badge-domain"
              style={{ fontSize: "0.85rem", padding: "6px 16px", display: "inline-flex", gap: "6px", alignItems: "center" }}
            >
              <Rocket size={16} /> AI-Powered Onboarding
            </span>
          </div>

          <h1
            className="animate-in animate-delay-1"
            style={{
              fontSize: "3.5rem",
              fontWeight: 900,
              lineHeight: 1.1,
              marginBottom: "24px",
              background:
                "linear-gradient(135deg, #f1f5f9 0%, #a78bfa 50%, #22d3ee 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Your Career Roadmap,
            <br />
            Intelligently Mapped.
          </h1>

          <p
            className="animate-in animate-delay-2"
            style={{
              fontSize: "1.2rem",
              color: "var(--text-secondary)",
              maxWidth: "600px",
              margin: "0 auto 40px",
              lineHeight: 1.7,
            }}
          >
            Upload your resume, pick your target role, and let AI analyze your
            skill gaps — then follow a{" "}
            <strong style={{ color: "var(--text-accent)" }}>
              personalized learning pathway
            </strong>{" "}
            to get role-ready faster.
          </p>

          <div
            className="animate-in animate-delay-3"
            style={{ display: "flex", gap: "16px", justifyContent: "center" }}
          >
            <button
              className="btn btn-primary btn-lg"
              onClick={() => router.push("/upload")}
            >
              <FileText size={20} /> Upload Resume
            </button>
            <button
              className="btn btn-secondary btn-lg"
              onClick={() => {
                document
                  .getElementById("features")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Learn More ↓
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        style={{
          padding: "80px 0",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div className="container">
          <div
            className="section-header"
            style={{ textAlign: "center", marginBottom: "48px" }}
          >
            <h2
              style={{
                fontSize: "2rem",
                fontWeight: 800,
                background:
                  "linear-gradient(135deg, var(--text-primary), var(--text-accent))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                marginBottom: "12px",
              }}
            >
              How It Works
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "1.05rem" }}>
              Three simple steps to your personalized onboarding pathway
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "24px",
            }}
          >
            {[
              {
                icon: <FileText size={40} strokeWidth={1.5} color="var(--accent-1)" />,
                title: "Upload Resume",
                desc: "Upload your resume as a PDF. Our AI extracts your skills, experience, and education using advanced NLP.",
              },
              {
                icon: <Target size={40} strokeWidth={1.5} color="var(--accent-3)" />,
                title: "Skill-Gap Analysis",
                desc: "Select your target job role. We compare your skills against role requirements and identify exact gaps.",
              },
              {
                icon: <Map size={40} strokeWidth={1.5} color="var(--accent-2)" />,
                title: "Learning Pathway",
                desc: "Get a personalized, ordered roadmap with curated resources, estimated timelines, and dependency tracking.",
              },
            ].map((feature, i) => (
              <div
                key={i}
                className={`glass-card animate-in animate-delay-${i + 1}`}
                style={{ textAlign: "center", padding: "40px 28px" }}
              >
                <div style={{ fontSize: "2.5rem", marginBottom: "16px" }}>
                  {feature.icon}
                </div>
                <h3
                  style={{
                    fontSize: "1.15rem",
                    fontWeight: 700,
                    marginBottom: "12px",
                  }}
                >
                  {feature.title}
                </h3>
                <p
                  style={{
                    color: "var(--text-secondary)",
                    fontSize: "0.92rem",
                    lineHeight: 1.7,
                  }}
                >
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Domains Section */}
      <section
        style={{
          padding: "60px 0 100px",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div className="container">
          <div
            className="section-header"
            style={{ textAlign: "center", marginBottom: "48px" }}
          >
            <h2
              style={{
                fontSize: "2rem",
                fontWeight: 800,
                background:
                  "linear-gradient(135deg, var(--text-primary), var(--accent-3))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                marginBottom: "12px",
              }}
            >
              Infinity-Domain Scalability
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "1.05rem" }}>
              Our LLM-driven engine dynamically constructs specialized curricula for *any* role imaginable.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "24px",
            }}
          >
            {[
              {
                icon: <Terminal size={32} color="var(--accent-1)" />,
                domain: "Emerging Tech",
                roles: [
                  "Quantum Computing Researcher",
                  "AI Ethics Specialist",
                  "Blockchain Architect",
                  "Prompt Engineer",
                ],
                color: "var(--accent-1)",
              },
              {
                icon: <Briefcase size={32} color="var(--accent-3)" />,
                domain: "Strategic Business",
                roles: [
                  "Sustainability Consultant",
                  "Growth Hacker",
                  "Customer Success Manager",
                  "Venture Designer",
                ],
                color: "var(--accent-3)",
              },
              {
                icon: <Wrench size={32} color="var(--accent-2)" />,
                domain: "Advanced Industry",
                roles: [
                  "Robotics Technician",
                  "Precision Agriculturist",
                  "Renewable Energy lead",
                  "Smart City Coordinator",
                ],
                color: "var(--accent-2)",
              },
            ].map((d, i) => (
              <div key={i} className="glass-card" style={{ padding: "32px" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    marginBottom: "20px",
                  }}
                >
                  <span style={{ fontSize: "2rem" }}>{d.icon}</span>
                  <h3 style={{ fontWeight: 700, fontSize: "1.1rem" }}>
                    {d.domain}
                  </h3>
                </div>
                <ul
                  style={{
                    listStyle: "none",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  {d.roles.map((role, j) => (
                    <li
                      key={j}
                      style={{
                        color: "var(--text-secondary)",
                        fontSize: "0.9rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <span
                        style={{
                          width: "6px",
                          height: "6px",
                          borderRadius: "50%",
                          background: d.color,
                          display: "inline-block",
                        }}
                      />
                      {role}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          borderTop: "1px solid var(--border)",
          padding: "32px 0",
          textAlign: "center",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div className="container">
          <p
            style={{
              color: "var(--text-muted)",
              fontSize: "0.85rem",
            }}
          >
            Built for Hackathon — AI-Adaptive Onboarding Engine © 2026
          </p>
        </div>
      </footer>
    </main>
  );
}
