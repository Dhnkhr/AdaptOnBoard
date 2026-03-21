"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Check local storage or system preference
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light") {
      setTheme("light");
      document.body.classList.add("light-theme");
    } else {
      document.body.classList.remove("light-theme");
    }
    setMounted(true);
  }, []);

  if (!mounted) {
    // Ensure no hydration mismatch flash
    return <div style={{ width: 36, height: 36 }} />;
  }

  const toggleTheme = () => {
    if (theme === "dark") {
      setTheme("light");
      localStorage.setItem("theme", "light");
      document.body.classList.add("light-theme");
    } else {
      setTheme("dark");
      localStorage.setItem("theme", "dark");
      document.body.classList.remove("light-theme");
    }
  };

  return (
    <button
      onClick={toggleTheme}
      style={{
        width: "36px",
        height: "36px",
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        color: "var(--text-primary)",
        cursor: "pointer",
        transition: "all var(--transition-fast)",
      }}
      aria-label="Toggle Theme"
      title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
    >
      {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
