"use client";

import { useEffect, useRef, useState } from "react";

const PROVIDERS = [
  { id: "anthropic", name: "Anthropic", model: "Claude", color: "#d97757" },
  { id: "openai", name: "OpenAI", model: "GPT", color: "#10a37f" },
  { id: "gemini", name: "Gemini", model: "Google", color: "#4285f4" },
  { id: "perplexity", name: "Perplexity", model: "Sonar", color: "#20b8cd" },
  { id: "kimi", name: "Kimi K3", model: "Moonshot", color: "#7c3aed" },
  { id: "grok", name: "Grok", model: "xAI", color: "#71717a" },
];

interface AnswerState {
  status: "idle" | "loading" | "done" | "error";
  answer?: string;
  model?: string;
  ms?: number;
  error?: string;
}

export default function AskPage() {
  const [question, setQuestion] = useState("");
  const [askedQuestion, setAskedQuestion] = useState("");
  const [answers, setAnswers] = useState<Record<string, AnswerState>>({});
  const [configured, setConfigured] = useState<Record<string, boolean> | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const runIdRef = useRef(0);

  useEffect(() => {
    fetch("/api/ask")
      .then((r) => r.json())
      .then((data) => setConfigured(data.configured || {}))
      .catch(() => setConfigured({}));
  }, []);

  const isAsking = Object.values(answers).some((a) => a.status === "loading");

  const ask = async () => {
    const q = question.trim();
    if (!q || isAsking) return;

    const runId = ++runIdRef.current;
    setAskedQuestion(q);

    const active = PROVIDERS.filter((p) => configured?.[p.id] !== false);
    const initial: Record<string, AnswerState> = {};
    for (const p of PROVIDERS) {
      initial[p.id] = active.includes(p) ? { status: "loading" } : { status: "idle" };
    }
    setAnswers(initial);

    active.forEach(async (p) => {
      try {
        const response = await fetch("/api/ask", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ provider: p.id, question: q }),
        });
        const data = await response.json();
        if (runIdRef.current !== runId) return;
        setAnswers((prev) => ({
          ...prev,
          [p.id]: data.error
            ? { status: "error", error: data.error, ms: data.ms }
            : { status: "done", answer: data.answer, model: data.model, ms: data.ms },
        }));
      } catch {
        if (runIdRef.current !== runId) return;
        setAnswers((prev) => ({
          ...prev,
          [p.id]: { status: "error", error: "Network error" },
        }));
      }
    });
  };

  const copyAnswer = (id: string, text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(id);
      setTimeout(() => setCopied((c) => (c === id ? null : c)), 1500);
    });
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            Ask Every <span className="text-emerald-400">AI</span>
          </h1>
          <p className="text-gray-400 mt-2">
            One question, answered by Anthropic, OpenAI, Gemini, Perplexity, Kimi and Grok — side by side.
          </p>
        </header>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 mb-8">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                ask();
              }
            }}
            placeholder="Type your question… (Ctrl+Enter to ask)"
            rows={3}
            className="w-full bg-transparent resize-none outline-none placeholder-gray-500 text-lg"
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-500">
              {configured === null
                ? "Checking configured providers…"
                : `${PROVIDERS.filter((p) => configured[p.id]).length} of ${PROVIDERS.length} providers configured`}
            </span>
            <button
              onClick={ask}
              disabled={!question.trim() || isAsking}
              className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-gray-950 font-semibold px-6 py-2 rounded-xl transition-colors"
            >
              {isAsking ? "Asking…" : "Ask all AIs"}
            </button>
          </div>
        </div>

        {askedQuestion && (
          <p className="text-sm text-gray-500 mb-4">
            Q: <span className="text-gray-300">{askedQuestion}</span>
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {PROVIDERS.map((p) => {
            const state = answers[p.id] || { status: "idle" };
            const notConfigured = configured !== null && configured[p.id] === false;
            return (
              <div
                key={p.id}
                className={`bg-gray-900 border border-gray-800 rounded-2xl p-4 flex flex-col ${
                  notConfigured ? "opacity-50" : ""
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: p.color }}
                    />
                    <span className="font-semibold">{p.name}</span>
                    <span className="text-xs text-gray-500">{state.model || p.model}</span>
                  </div>
                  {state.status === "done" && (
                    <div className="flex items-center gap-2">
                      {state.ms !== undefined && (
                        <span className="text-xs text-gray-500">
                          {(state.ms / 1000).toFixed(1)}s
                        </span>
                      )}
                      <button
                        onClick={() => copyAnswer(p.id, state.answer || "")}
                        className="text-xs text-gray-400 hover:text-gray-200 border border-gray-700 rounded-md px-2 py-0.5"
                      >
                        {copied === p.id ? "Copied!" : "Copy"}
                      </button>
                    </div>
                  )}
                </div>

                <div className="text-sm leading-relaxed flex-1 min-h-16">
                  {notConfigured ? (
                    <span className="text-gray-500 italic">
                      No API key configured for this provider.
                    </span>
                  ) : state.status === "idle" ? (
                    <span className="text-gray-600 italic">Waiting for a question…</span>
                  ) : state.status === "loading" ? (
                    <span className="flex items-center gap-2 text-gray-400">
                      <span className="w-4 h-4 border-2 border-gray-600 border-t-emerald-400 rounded-full animate-spin" />
                      Thinking…
                    </span>
                  ) : state.status === "error" ? (
                    <span className="text-red-400 break-words">{state.error}</span>
                  ) : (
                    <div className="whitespace-pre-wrap break-words max-h-96 overflow-y-auto pr-1">
                      {state.answer}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <footer className="text-center text-xs text-gray-600 mt-10">
          Answers come straight from each provider&apos;s API. Configure keys via environment
          variables — see the README.
        </footer>
      </div>
    </div>
  );
}
