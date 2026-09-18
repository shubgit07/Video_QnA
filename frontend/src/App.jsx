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

      {results.length > 0 && (() => {
        const groups = [];
        const byId = new Map();
        results.forEach((r) => {
          const key = r.video_id || r.title;
          if (!byId.has(key)) {
            const g = { title: r.title, items: [] };
            byId.set(key, g);
            groups.push(g);
          }
          byId.get(key).items.push(r);
        });
        groups.forEach((g) =>
          g.items.sort((a, b) => (a.start_sec ?? 0) - (b.start_sec ?? 0))
        );
        const moments = groups.reduce((n, g) => n + g.items.length, 0);
        return (
          <div className="sources">
            <div className="sources-head">
              <h2>Where this was explained</h2>
              <span className="count">
                {moments} moment{moments > 1 ? "s" : ""} · {groups.length} video
                {groups.length > 1 ? "s" : ""}
              </span>
            </div>
            {groups.map((g, gi) => (
              <div key={gi} className="vgroup">
                <div className="vtitle">{g.title}</div>
                <div className="vmeta">
                  {g.items.length} moment{g.items.length > 1 ? "s" : ""} in this video
                </div>
                {g.items.map((r, i) => (
                  <a
                    key={i}
                    className="trow"
                    href={r.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span className="pill">{r.timestamp}</span>
                    {r.preview && <span className="tpreview">{r.preview}</span>}
                    <span className="watch">▶</span>
                  </a>
                ))}
              </div>
            ))}
          </div>
        );
      })()}
    </div>
  );
}
