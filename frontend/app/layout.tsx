import type { Metadata } from "next";
import { BrainCircuit } from "lucide-react";
import ThemeToggle from "../components/ThemeToggle";
import "./globals.css";

export const metadata: Metadata = {
  title: "AdaptOnboard — AI-Adaptive Onboarding Engine",
  description:
    "Parse resumes, identify skill gaps, and generate personalized learning pathways using AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <nav className="navbar">
          <div className="container">
            <a href="/" className="navbar-brand">
              <span className="logo-icon">
                <BrainCircuit size={20} color="white" />
              </span>
              AdaptOnboard
            </a>
            <ul className="navbar-links" style={{ display: "flex", alignItems: "center", gap: "24px", listStyle: "none", margin: 0, padding: 0 }}>
              <li>
                <a href="/">Home</a>
              </li>
              <li>
                <a href="/upload">Get Started</a>
              </li>
              <li>
                <ThemeToggle />
              </li>
            </ul>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
