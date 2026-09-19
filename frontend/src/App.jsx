import { useEffect, useState } from "react";

// Backend base URL. On Vercel set VITE_BACKEND_URL to the Render service URL,
// e.g. https://video-qna.onrender.com (no trailing slash).
// Empty string = same origin (local dev against `ytrag serve` via proxy).
const API = (import.meta.env.VITE_BACKEND_URL || "").replace(/\/$/, "");

async function post(path, payload) {
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    const err = new Error(`${res.status}: ${text.slice(0, 200)}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

export default function App() {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState(null);
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState({});
  const [playlists, setPlaylists] = useState({});
  const [playlist, setPlaylist] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [error, setError] = useState("");

  // --- BYO API key (Ask AI only; Search needs no key) ---
  // Model choices per provider. Defaults match the server env defaults
  // (backend/ytrag/config.py: GROQ_MODEL / GEMINI_MODEL).
  // Model choices per provider — verified Sept 2026 against the official
  // docs (console.groq.com/docs/deprecations, ai.google.dev/gemini-api/docs).
  // Groq retired llama-3.3-70b-versatile, qwen3-32b and kimi-k2-instruct;
  // Google shut down gemini-2.0-flash(-lite). Two best live picks each.
  const MODELS = {
    groq: [
      "openai/gpt-oss-120b",
      "openai/gpt-oss-20b",
    ],
    gemini: [
      "gemini-2.5-flash",
      "gemini-2.5-flash-lite",
    ],
  };
  const [provider, setProvider] = useState(
    () => localStorage.getItem("ytrag_provider") || "groq"
  );
  const [model, setModel] = useState(
    () => localStorage.getItem("ytrag_model") || MODELS[localStorage.getItem("ytrag_provider") || "groq"][0]
  );
  // Applied (hidden) key vs. what is currently typed. Once applied the key
  // is never displayed again — only Clear + repaste.
  const [apiKey, setApiKey] = useState(
    () => localStorage.getItem("ytrag_api_key") || ""
  );
  const [draftKey, setDraftKey] = useState("");

  const playlistIds = Object.keys(playlists);

  useEffect(() => {
    fetch(`${API}/meta`)
      .then((r) => (r.ok ? r.json() : null))
      .then((m) => {
        if (m && m.playlists) {
          setPlaylists(m.playlists);
          const ids = Object.keys(m.playlists);
          // Single-selection enforced: always land on exactly one playlist.
          if (ids.length > 0) setPlaylist((prev) => prev || ids[0]);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    localStorage.setItem("ytrag_provider", provider);
    localStorage.setItem("ytrag_model", model);
  }, [provider, model]);

  useEffect(() => {
    if (apiKey) localStorage.setItem("ytrag_api_key", apiKey);
    else localStorage.removeItem("ytrag_api_key");
  }, [apiKey]);

  function switchProvider(p) {
    setProvider(p);
    // Reset to that provider's default model; key is provider-specific.
    setModel(MODELS[p][0]);
    setApiKey("");
    setDraftKey("");
    localStorage.removeItem("ytrag_api_key");
  }

  function applyKey() {
    const k = draftKey.trim();
    if (!k) return;
    setApiKey(k);
    setDraftKey("");
    setError("");
  }

  function toggle(key, e) {
    e.preventDefault();
    e.stopPropagation();
    setOpen((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function pickPlaylist(id) {
    setPlaylist(id);
    setPickerOpen(false);
    setResults([]);
    setAnswer(null);
    setError("");
  }

  function clearKey() {
    setApiKey("");
    setDraftKey("");
    localStorage.removeItem("ytrag_api_key");
  }

  async function run(mode) {
    const q = question.trim();
    if (!q || loading) return;
    if (!playlist) {
      setError("Please choose a playlist / video first.");
      return;
    }
    if (mode === "ask" && !apiKey.trim()) {
      setError("Paste your API key to use Ask AI — Search is free and needs no key.");
      return;
    }
    setLoading(true);
    setError("");
    setAnswer(null);
    setResults([]);
    try {
      if (mode === "ask") {
        const data = await post("/ask", {
          question: q,
          playlist,
          llm_api_key: apiKey.trim(),
          llm_backend: provider,
          llm_model: model,
        });
        setAnswer(data.answer);
        setResults(data.citations || []);
      } else {
        const data = await post("/search", { question: q, playlist });
        setResults(data.results || []);
      }
    } catch (e) {
      if (e.status === 401) {
        setError(
          `Invalid ${provider === "groq" ? "Groq" : "Gemini"} API key. Check it and try again.`
        );
      } else if (e.status === 400) {
        setError("Please choose a valid playlist / video first.");
      } else {
        setError(`Backend unreachable (${e.message}). Check VITE_BACKEND_URL.`);
      }
    } finally {
      setLoading(false);
    }
  }

  const selected = playlists[playlist];
  const ready = playlistIds.length > 0 && !!playlist;

  return (
    <div className="page">
      <header>
        <h1>
          Choose your playlist / video given and ask questions from it and jump
          straight to the exact time stamp of video
        </h1>
        <p>Ask a DSA question, jump to the exact second it was explained.</p>
      </header>

      {/* ---- Single-select playlist picker ---- */}
      <div className="picker-block">
        <button
          className="picker-toggle"
          onClick={() => setPickerOpen((v) => !v)}
          disabled={playlistIds.length === 0}
        >
          <span className="picker-label">Choose playlist / video</span>
          <span className="picker-current">
            {selected
              ? `${playlist} (${selected.chunks} moments)`
              : playlistIds.length === 0
                ? "No playlists indexed yet"
                : "Select one"}
          </span>
          <span className="picker-chevron">{pickerOpen ? "▴" : "▾"}</span>
        </button>
        {pickerOpen && playlistIds.length > 0 && (
          <div className="picker-list" role="radiogroup" aria-label="Playlist">
            {playlistIds.map((id) => {
              const p = playlists[id];
              const active = id === playlist;
              return (
                <button
                  key={id}
                  role="radio"
                  aria-checked={active}
                  className={`picker-item${active ? " active" : ""}`}
                  onClick={() => pickPlaylist(id)}
                >
                  <span className="picker-radio">{active ? "●" : "○"}</span>
                  <span className="picker-name">{id}</span>
                  <span className="picker-meta">
                    {p.videos} video{p.videos > 1 ? "s" : ""} · {p.chunks} moments
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ---- BYO key for Ask AI ---- */}
      <div className="key-card">
        <div className="key-top">
          <span className="key-title">AI setup <em>(only for Ask AI — Search is free)</em></span>
          <div className="provider-toggle" role="group" aria-label="AI provider">
            {["groq", "gemini"].map((p) => (
              <button
                key={p}
                className={`provider-btn${provider === p ? " active" : ""}`}
                onClick={() => switchProvider(p)}
              >
                {p === "groq" ? "Groq" : "Gemini"}
              </button>
            ))}
          </div>
        </div>
        <div className="model-row">
          <label htmlFor="model">Model</label>
          <select
            id="model"
            value={model}
            onChange={(e) => setModel(e.target.value)}
          >
            {MODELS[provider].map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
        {apiKey ? (
          <div className="key-locked">
            <span className="key-dots">••••••••••••</span>
            <span className="key-ok">Key saved for {provider === "groq" ? "Groq" : "Gemini"} · {model}</span>
            <button className="ghost-btn danger" onClick={clearKey}>
              Clear &amp; repaste
            </button>
          </div>
        ) : (
          <div className="key-row">
            <input
              type="password"
              value={draftKey}
              onChange={(e) => setDraftKey(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applyKey()}
              placeholder={`Paste your ${provider === "groq" ? "Groq" : "Gemini"} API key, then Apply`}
              autoComplete="off"
              spellCheck={false}
            />
            <button className="apply-btn" onClick={applyKey} disabled={!draftKey.trim()}>
              Apply
            </button>
          </div>
        )}
        <p className="key-hint">
          Applied key is hidden and stays in your browser only, sent with Ask AI
          requests. Get one: console.groq.com / aistudio.google.com
        </p>
      </div>

      <div className="ask-row">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && run("search")}
          placeholder="e.g. memoization aur tabulation ka difference?"
        />
        <button onClick={() => run("search")} disabled={loading || !ready}>
          {loading ? "..." : "Search"}
        </button>
        <button onClick={() => run("ask")} disabled={loading || !ready}>
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
                {g.items.map((r, i) => {
                  const key = `${r.video_id}:${r.start_sec}`;
                  const isOpen = !!open[key];
                  const long = (r.preview || "").length > 140;
                  return (
                    <div key={i} className="trow">
                      <a
                        className="pill"
                        href={r.url}
                        target="_blank"
                        rel="noreferrer"
                        title="Jump to this second"
                      >
                        {r.timestamp}
                      </a>
                      {r.preview && (
                        <span className={`tpreview${isOpen ? " open" : ""}`}>
                          {r.preview}
                        </span>
                      )}
                      {long && (
                        <button
                          className="morebtn"
                          onClick={(e) => toggle(key, e)}
                        >
                          {isOpen ? "less" : "more"}
                        </button>
                      )}
                      <a
                        className="watch"
                        href={r.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        ▶
                      </a>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        );
      })()}
    </div>
  );
}
