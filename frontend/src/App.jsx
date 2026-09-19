import { useEffect, useState } from "react";
import {
  PlaySquare,
  Search,
  Sparkles,
  Zap,
  FolderGit2,
  ChevronDown,
  ChevronUp,
  Check,
  KeyRound,
  ShieldCheck,
  Copy,
  Play,
  ExternalLink,
  SlidersHorizontal,
  Film,
  Bot,
  AlertCircle,
} from "lucide-react";

// Backend base URL. On Vercel set VITE_BACKEND_URL to the Render/Azure service URL.
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
  const [copied, setCopied] = useState(false);
  const [meta, setMeta] = useState({ lectures: 0, hours: 0 });

  // --- BYO API key (Ask AI only; Search needs no key) ---
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
    () =>
      localStorage.getItem("ytrag_model") ||
      MODELS[localStorage.getItem("ytrag_provider") || "groq"][0]
  );
  const [apiKey, setApiKey] = useState(
    () => localStorage.getItem("ytrag_api_key") || ""
  );
  const [draftKey, setDraftKey] = useState("");

  const playlistIds = Object.keys(playlists);

  useEffect(() => {
    fetch(`${API}/meta`)
      .then((r) => (r.ok ? r.json() : null))
      .then((m) => {
        if (m) {
          setMeta({ lectures: m.lectures || 0, hours: m.hours || 0 });
          if (m.playlists) {
            setPlaylists(m.playlists);
            const ids = Object.keys(m.playlists);
            if (ids.length > 0) setPlaylist((prev) => prev || ids[0]);
          }
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

  function handleCopy() {
    if (!answer) return;
    navigator.clipboard.writeText(answer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
    <>
      {/* ---- Claude-Inspired Sticky Navbar (Native Dark) ---- */}
      <nav className="top-nav">
        <div className="nav-container">
          <div className="nav-brand">
            <div className="brand-icon">
              <PlaySquare size={17} />
            </div>
            <div className="brand-title">
              Video Q&amp;A
              <span className="brand-badge">Video RAG</span>
            </div>
          </div>

          <div className="nav-center">
            <span className="pulse-dot"></span>
            <span>
              {meta.lectures > 0
                ? `${meta.lectures} Lectures · ${meta.hours}h Indexed`
                : "68.7h Lectures Indexed"}
            </span>
          </div>

          <div className="nav-actions">
            <span className="nav-tag-pill">
              <Sparkles size={12} />
              <span>Grounded AI</span>
            </span>
          </div>
        </div>
      </nav>

      <div className="page">
        {/* ---- Hero Section: Immediate Value Clarity ---- */}
        <section className="hero">
          <div className="hero-tag">
            <PlaySquare size={13} />
            <span>Second-Accurate Video Pinpointer</span>
          </div>
          <h1>Search &amp; Ask Across Video Lectures</h1>
          <p>
            Pinpoint the exact second any concept was explained. Ask in English
            or Hinglish to get AI-grounded explanations with direct YouTube
            timestamp links.
          </p>
          <div className="feature-chips">
            <span className="feature-chip">
              <Play size={12} />
              <span>Exact Second Jump Links</span>
            </span>
            <span className="feature-chip">
              <Search size={12} />
              <span>Instant Search (Free)</span>
            </span>
            <span className="feature-chip">
              <Sparkles size={12} />
              <span>Zero-Hallucination Grounding</span>
            </span>
          </div>
        </section>

        {/* ---- Single-Select Playlist Picker ---- */}
        <div className="picker-block">
          <button
            className="picker-toggle"
            onClick={() => setPickerOpen((v) => !v)}
            disabled={playlistIds.length === 0}
          >
            <span className="picker-label-chip">
              <FolderGit2 size={13} />
              <span>Playlist</span>
            </span>
            <span className="picker-current">
              {selected
                ? `${playlist} (${selected.chunks} moments)`
                : playlistIds.length === 0
                ? "No playlists indexed yet"
                : "Select one"}
            </span>
            <span className="picker-chevron">
              {pickerOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </span>
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
                    <span className="picker-radio-icon">
                      {active ? <Check size={16} /> : null}
                    </span>
                    <span className="picker-name">{id}</span>
                    <span className="picker-meta">
                      {p.videos} video{p.videos > 1 ? "s" : ""} · {p.chunks}{" "}
                      moments
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ---- BYO Key Card for Ask AI ---- */}
        <div className="key-card">
          <div className="key-top">
            <span className="key-title">
              <SlidersHorizontal size={14} />
              AI Engine Setup <em>(only for Ask AI — Search is free)</em>
            </span>
            <div
              className="provider-toggle"
              role="group"
              aria-label="AI provider"
            >
              {["groq", "gemini"].map((p) => (
                <button
                  key={p}
                  className={`provider-btn${provider === p ? " active" : ""}`}
                  onClick={() => switchProvider(p)}
                >
                  {p === "groq" ? <Zap size={12} /> : <Sparkles size={12} />}
                  <span>{p === "groq" ? "Groq" : "Gemini"}</span>
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
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          {apiKey ? (
            <div className="key-locked">
              <div className="key-locked-badge">
                <ShieldCheck size={16} />
                <span>
                  Key active for {provider === "groq" ? "Groq" : "Gemini"} ·{" "}
                  {model}
                </span>
              </div>
              <button className="ghost-btn danger" onClick={clearKey}>
                <KeyRound size={13} />
                <span>Clear &amp; repaste</span>
              </button>
            </div>
          ) : (
            <div className="key-row">
              <input
                type="password"
                value={draftKey}
                onChange={(e) => setDraftKey(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && applyKey()}
                placeholder={`Paste your ${
                  provider === "groq" ? "Groq" : "Gemini"
                } API key, then click Apply`}
                autoComplete="off"
                spellCheck={false}
              />
              <button
                className="apply-btn"
                onClick={applyKey}
                disabled={!draftKey.trim()}
              >
                <KeyRound size={13} />
                <span>Apply</span>
              </button>
            </div>
          )}
          <p className="key-hint">
            Applied key is stored only in your browser (localStorage) and never
            saved on the server. Free keys: console.groq.com / aistudio.google.com
          </p>
        </div>

        {/* ---- Unified Query Bar ---- */}
        <div className="ask-container">
          <div className="query-input-wrapper">
            <Search size={16} className="query-input-icon" />
            <input
              className="query-input"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && run("search")}
              placeholder="e.g. memoization aur tabulation ka difference?"
            />
          </div>
          <button
            className="search-btn"
            onClick={() => run("search")}
            disabled={loading || !ready}
            title="Instant vector search (no LLM, no key needed)"
          >
            <Search size={14} />
            <span>Search</span>
          </button>
          <button
            className="ask-btn"
            onClick={() => run("ask")}
            disabled={loading || !ready}
            title="Synthesize an answer with AI"
          >
            <Sparkles size={14} />
            <span>{loading ? "Thinking..." : "Ask AI"}</span>
          </button>
        </div>

        {/* ---- Error Banner ---- */}
        {error && (
          <div className="error-banner">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* ---- Grounded AI Answer Card ---- */}
        {answer && (
          <div className="answer-card">
            <div className="answer-header">
              <div className="answer-tag">
                <Bot size={17} />
                <span>Grounded Answer</span>
              </div>
              <button
                className="copy-btn"
                onClick={handleCopy}
                title="Copy answer to clipboard"
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
                <span>{copied ? "Copied!" : "Copy"}</span>
              </button>
            </div>
            <p className="answer-body">{answer}</p>
          </div>
        )}

        {/* ---- Video Sources & Timelines ---- */}
        {results.length > 0 &&
          (() => {
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
                  <h2 className="sources-title">
                    <Film size={15} />
                    <span>Where this was explained</span>
                  </h2>
                  <span className="sources-count-badge">
                    {moments} moment{moments > 1 ? "s" : ""} · {groups.length}{" "}
                    video{groups.length > 1 ? "s" : ""}
                  </span>
                </div>
                {groups.map((g, gi) => (
                  <div key={gi} className="vgroup">
                    <div className="vtitle">
                      <Film size={15} />
                      <span>{g.title}</span>
                    </div>
                    <div className="vmeta">
                      {g.items.length} moment{g.items.length > 1 ? "s" : ""} in
                      this lecture
                    </div>
                    {g.items.map((r, i) => {
                      const key = `${r.video_id}:${r.start_sec}`;
                      const isOpen = !!open[key];
                      const long = (r.preview || "").length > 140;
                      return (
                        <div key={i} className="trow">
                          <a
                            className="pill-timestamp"
                            href={r.url}
                            target="_blank"
                            rel="noreferrer"
                            title="Play lecture from this exact second"
                          >
                            <Play size={10} fill="currentColor" />
                            <span>{r.timestamp}</span>
                          </a>
                          {r.preview && (
                            <span
                              className={`tpreview${isOpen ? " open" : ""}`}
                            >
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
                            className="watch-link"
                            href={r.url}
                            target="_blank"
                            rel="noreferrer"
                            title="Open in YouTube"
                          >
                            <ExternalLink size={15} />
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
    </>
  );
}
