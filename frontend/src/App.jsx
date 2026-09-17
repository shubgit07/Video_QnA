import { useState } from "react";

// Backend base URL. On Vercel set VITE_BACKEND_URL to the Render service URL,
// e.g. https://video-qna.onrender.com (no trailing slash).
// Empty string = same origin (local dev against `ytrag serve` via proxy).
const API = (import.meta.env.VITE_BACKEND_URL || "").replace(/\/$/, "");

async function post(path, question) {
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

export default function App() {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState(null);
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");

  async function run(mode) {
    const q = question.trim();
    if (!q || loading) return;
    setLoading(true);
    setError("");
    setAnswer(null);
    setResults([]);
    try {
      if (mode === "ask") {
        const data = await post("/ask", q);
        setAnswer(data.answer);
        setResults(data.citations || []);
      } else {
        const data = await post("/search", q);
        setResults(data.results || []);
      }
    } catch (e) {
      setError(`Backend unreachable (${e.message}). Check VITE_BACKEND_URL.`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <header>
        <h1>Video QnA</h1>
        <p>Ask a DSA question, jump to the exact second it was explained.</p>
      </header>

      <div className="ask-row">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && run("search")}
          placeholder="e.g. memoization aur tabulation ka difference?"
        />
        <button onClick={() => run("search")} disabled={loading}>
          {loading ? "..." : "Search"}
        </button>
        <button onClick={() => run("ask")} disabled={loading}>
          Ask AI
        </button>
      </div>

      {error && <p className="error">{error}</p>}

      {answer && (
        <div className="card">
          <h2>Answer</h2>
          <p>{answer}</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="card">
          <h2>Sources</h2>
          <ul>
            {results.map((r, i) => (
              <li key={i}>
                <a href={r.url} target="_blank" rel="noreferrer">
                  [{i + 1}] {r.title} @ {r.timestamp}
                </a>
                {r.preview && <p className="preview">{r.preview}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
