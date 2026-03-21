"use client";

import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, BrainCircuit, Sparkles } from "lucide-react";

interface Pathway {
  role: string;
  total_modules: number;
  total_estimated_hours: number;
  [key: string]: any;
}

interface ChatbotProps {
  pathway: Pathway | null;
  onUpdatePathway: (newPathway: Pathway) => void;
}

interface Message {
  role: "user" | "assistant";
  text: string;
}

export default function Chatbot({ pathway, onUpdatePathway }: ChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "Hi! I'm your AdaptOnboard AI Mentor. I can answer questions about your pathway or modify it for you (e.g., 'Add a module on React', 'Remove the CSS module'). What do you need?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  if (!pathway) return null;

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    
    const userMessage = input.trim();
    setMessages((prev) => [...prev, { role: "user", text: userMessage }]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage, pathway }),
      });

      if (!response.ok) throw new Error("Network response was not ok");
      
      const data = await response.json();
      
      let replyText = data.reply;
      
      if (data.updated_pathway) {
        onUpdatePathway(data.updated_pathway);
        replyText += "\n\n*(✨ I've updated your roadmap!)*";
      }

      setMessages((prev) => [...prev, { role: "assistant", text: replyText }]);
    } catch (error) {
      setMessages((prev) => [...prev, { role: "assistant", text: "Sorry, I had trouble connecting to the AI Mentor." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: "fixed", bottom: "32px", right: "32px", zIndex: 9999 }}>
      {/* Chat Window */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            bottom: "70px",
            right: "0",
            width: "380px",
            height: "500px",
            background: "var(--bg-secondary)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg)",
            boxShadow: "var(--shadow-elevated)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            animation: "fadeInUp 0.3s ease-out",
          }}
        >
          {/* Header */}
          <div
            style={{
              background: "linear-gradient(135deg, var(--bg-card), rgba(108, 92, 231, 0.15))",
              padding: "16px 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, var(--accent-1), var(--accent-3))",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                }}
              >
                <BrainCircuit size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: "1rem", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>AI Mentor</h3>
                <span style={{ fontSize: "0.75rem", color: "var(--success)" }}>● Online</span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--text-muted)",
                cursor: "pointer",
                padding: "4px",
              }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages Area */}
          <div
            style={{
              flex: 1,
              padding: "20px",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                  maxWidth: "85%",
                  background: msg.role === "user" ? "linear-gradient(135deg, var(--accent-1), var(--accent-2))" : "var(--bg-card)",
                  color: msg.role === "user" ? "white" : "var(--text-primary)",
                  padding: "12px 16px",
                  borderRadius: "16px",
                  borderBottomRightRadius: msg.role === "user" ? "4px" : "16px",
                  borderBottomLeftRadius: msg.role === "assistant" ? "4px" : "16px",
                  border: msg.role === "assistant" ? "1px solid var(--border)" : "none",
                  fontSize: "0.9rem",
                  lineHeight: 1.5,
                  whiteSpace: "pre-wrap",
                }}
              >
                {msg.text}
              </div>
            ))}
            {loading && (
              <div
                style={{
                  alignSelf: "flex-start",
                  background: "var(--bg-card)",
                  padding: "12px 20px",
                  borderRadius: "16px",
                  borderBottomLeftRadius: "4px",
                  border: "1px solid var(--border)",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span className="spinner" style={{ width: "16px", height: "16px", borderWidth: "2px" }} />
                <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Thinking...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div
            style={{
              padding: "16px",
              borderTop: "1px solid var(--border)",
              background: "var(--bg-primary)",
            }}
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage();
              }}
              style={{
                display: "flex",
                gap: "12px",
                alignItems: "center",
              }}
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask or tell me to update..."
                style={{
                  flex: 1,
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  borderRadius: "999px",
                  padding: "12px 20px",
                  color: "var(--text-primary)",
                  outline: "none",
                  fontSize: "0.9rem",
                }}
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                style={{
                  background: input.trim() && !loading ? "var(--accent-1)" : "var(--bg-glass)",
                  color: "white",
                  border: "none",
                  borderRadius: "50%",
                  width: "42px",
                  height: "42px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: input.trim() && !loading ? "pointer" : "not-allowed",
                  transition: "all var(--transition-fast)",
                }}
              >
                <Send size={18} style={{ marginLeft: "2px" }} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: "60px",
          height: "60px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, var(--accent-1), var(--accent-3))",
          border: "none",
          color: "white",
          cursor: "pointer",
          boxShadow: "0 10px 30px rgba(108, 92, 231, 0.4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
          transform: isOpen ? "scale(0.9)" : "scale(1)",
        }}
      >
        {isOpen ? <X size={28} /> : <MessageSquare size={28} />}
      </button>
    </div>
  );
}
