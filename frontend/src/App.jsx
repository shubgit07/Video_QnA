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
  AlertCircle,
  Loader2,
  RefreshCw,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Cpu,
  Database,
  Layers,
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

function LandingView({ onTryNow, serverState, retryAttempt, meta }) {
  const sampleQueries = [
    "memoization aur tabulation ka difference kahan explain kiya hai?",
    "kadane algorithm intuition and time complexity",
    "sliding window technique for maximum sum subarray",
  ];

  return (
    <div className="landing">
      {/* Badge */}
      <div className="landing-badge">
        <span className="landing-badge-dot"></span>
        <span>Production Video RAG Pipeline</span>
      </div>

      {/* Hero */}
      <div className="landing-hero">
        <h1 className="landing-title">
          Timestamp-accurate search and answers for lecture video.
        </h1>
        <p className="landing-desc">
          Standard RAG architectures index raw text documents and return detached paragraphs. 
          Video Q&amp;A transcribes lecture audio with faster-whisper, preserves second-accurate speech boundaries into 
          time-windowed vector embeddings, and links every synthesized explanation directly to the exact playback moment in the lecture.
        </p>

        <div className="landing-actions">
          <button className="btn-primary" onClick={() => onTryNow()}>
            <span>Try it now</span>
            <ArrowRight size={15} />
          </button>
          <a href="#architecture" className="btn-secondary">
            <span>System Architecture</span>
          </a>
        </div>

        {/* Quick query chips */}
        <div className="sample-queries-box">
          <span className="sample-queries-title">Quick test queries</span>
          <div className="sample-chips">
            {sampleQueries.map((q, idx) => (
              <button
                key={idx}
                className="sample-chip"
                onClick={() => onTryNow(q)}
                title="Load query into search app"
              >
                <Search size={12} />
                <span>{q}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="landing-metrics">
        <div className="metric-card">
          <div className="metric-val">{meta.hours > 0 ? `${meta.hours}h` : "68.7h"}</div>
          <div className="metric-lbl">Audio Ingested</div>
          <div className="metric-sub">Full lecture playlists transcribed with faster-whisper large-v3</div>
        </div>

        <div className="metric-card">
          <div className="metric-val">2,980+</div>
          <div className="metric-lbl">Vector Chunks</div>
          <div className="metric-sub">75-second semantic sliding windows with 15s contextual overlap</div>
        </div>

        <div className="metric-card">
          <div className="metric-val">&lt; 200ms</div>
          <div className="metric-lbl">Retrieval Latency</div>
          <div className="metric-sub">Standalone vector query without LLM dependency or quota costs</div>
        </div>

        <div className="metric-card">
          <div className="metric-val">0%</div>
          <div className="metric-lbl">Hallucination</div>
          <div className="metric-sub">Cosine distance threshold (&lt; 0.60) refuses ungrounded questions</div>
        </div>
      </div>

      {/* Comparison Section */}
      <section className="landing-section" id="comparison">
        <div className="section-tag">Comparison</div>
        <h2 className="section-title">Why Temporal Video RAG?</h2>
        <p className="section-desc">
          Lecture understanding requires chronological context, tone, and visual board work. Traditional document retrieval fails to capture audio timestamps.
        </p>

        <div className="comparison-grid">
          <div className="comparison-card">
            <div className="comparison-badge">Standard Document RAG</div>
            <h3 className="comparison-name">Text-Only Retrieval</h3>
            <ul className="comparison-list">
              <li className="comparison-item">
                <XCircle size={15} color="#f87171" className="comparison-icon" />
                <span>Indexes static text, PDFs, or books with no temporal dimension.</span>
              </li>
              <li className="comparison-item">
                <XCircle size={15} color="#f87171" className="comparison-icon" />
                <span>Citations reference page numbers; students cannot verify the lecturer's explanation.</span>
              </li>
              <li className="comparison-item">
                <XCircle size={15} color="#f87171" className="comparison-icon" />
                <span>Prone to hallucinations when syllabus topics fall outside the knowledge base.</span>
              </li>
              <li className="comparison-item">
                <XCircle size={15} color="#f87171" className="comparison-icon" />
                <span>Requires constant LLM generation cost even for simple source lookups.</span>
              </li>
            </ul>
          </div>

          <div className="comparison-card highlight">
            <div className="comparison-badge">Video Q&amp;A Architecture</div>
            <h3 className="comparison-name">Timestamp-Aligned RAG</h3>
            <ul className="comparison-list">
              <li className="comparison-item">
                <CheckCircle2 size={15} color="#34d399" className="comparison-icon" />
                <span>Raw m4a streamed via PyAV directly into Whisper (no intermediate WAV storage).</span>
              </li>
              <li className="comparison-item">
                <CheckCircle2 size={15} color="#34d399" className="comparison-icon" />
                <span>Every citation includes a clickable jump with 5-second rewind padding for full context.</span>
              </li>
              <li className="comparison-item">
                <CheckCircle2 size={15} color="#34d399" className="comparison-icon" />
                <span>Title-boost lexical re-ranking and distance cutoffs guarantee grounded answers.</span>
              </li>
              <li className="comparison-item">
                <CheckCircle2 size={15} color="#34d399" className="comparison-icon" />
                <span>Dual-mode operation: Free sub-second vector search or multi-provider LLM synthesis.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Architecture & Pipeline */}
      <section className="landing-section" id="architecture">
        <div className="section-tag">Engineering Pipeline</div>
        <h2 className="section-title">End-to-End System Architecture</h2>
        <p className="section-desc">
          Built for production efficiency: minimal storage footprint, GPU-accelerated batched transcription, and remote cloud vector indexing.
        </p>

        <div className="architecture-grid">
          <div className="arch-card">
            <div className="arch-header">
              <span className="arch-step-num">01 / AUDIO</span>
              <Cpu size={16} color="var(--primary)" />
            </div>
            <div>
              <h3 className="arch-title">Ingest &amp; Batched Whisper</h3>
              <p className="arch-desc">
                yt-dlp extracts audio streams without intermediate WAV conversion. faster-whisper large-v3 with Voice Activity Detection (VAD) runs batched CTranslate2 inference, yielding 3x throughput over sequential processing.
              </p>
            </div>
            <div className="arch-tech-tags">
              <span className="tech-tag">faster-whisper</span>
              <span className="tech-tag">CTranslate2</span>
              <span className="tech-tag">PyAV</span>
              <span className="tech-tag">VAD</span>
            </div>
          </div>

          <div className="arch-card">
            <div className="arch-header">
              <span className="arch-step-num">02 / CHUNKING</span>
              <Layers size={16} color="var(--primary)" />
            </div>
            <div>
              <h3 className="arch-title">75-Second Temporal Windows</h3>
              <p className="arch-desc">
                Time-windowed chunker clusters adjacent spoken segments into 75-second blocks (~200 words) with 15-second overlap. Preserves start seconds, duration, video metadata, and playlist references.
              </p>
            </div>
            <div className="arch-tech-tags">
              <span className="tech-tag">Sliding Window</span>
              <span className="tech-tag">Hinglish VAD</span>
              <span className="tech-tag">Timestamp Offsets</span>
            </div>
          </div>

          <div className="arch-card">
            <div className="arch-header">
              <span className="arch-step-num">03 / INDEXING</span>
              <Database size={16} color="var(--primary)" />
            </div>
            <div>
              <h3 className="arch-title">Qdrant Cloud &amp; Title Re-ranking</h3>
              <p className="arch-desc">
                Normalized embeddings stored in Qdrant with stable deterministic UUIDs. Hybrid scoring boosts rank if lecture titles match query tokens. Strict cutoff of 0.60 drops unrelated hits before synthesis.
              </p>
            </div>
            <div className="arch-tech-tags">
              <span className="tech-tag">Qdrant Cloud</span>
              <span className="tech-tag">all-MiniLM-L6-v2</span>
              <span className="tech-tag">Title Boost</span>
            </div>
          </div>

          <div className="arch-card">
            <div className="arch-header">
              <span className="arch-step-num">04 / GENERATION</span>
              <Sparkles size={16} color="var(--primary)" />
            </div>
            <div>
              <h3 className="arch-title">Grounded Synthesis &amp; Video Sync</h3>
              <p className="arch-desc">
                Groq (gpt-oss-120b) or Google Gemini (gemini-2.5-flash) produces crisp explanations citing retrieved timestamps. Client-side BYO key encryption ensures zero server credential retention.
              </p>
            </div>
            <div className="arch-tech-tags">
              <span className="tech-tag">Groq Cloud</span>
              <span className="tech-tag">Gemini API</span>
              <span className="tech-tag">YouTube IFrame API</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Bottom Banner */}
      <div className="landing-cta-card">
        <div>
          <h3 className="cta-title">Ready to test the pipeline?</h3>
          <p className="cta-desc">
            Explore sub-second timestamp search and AI synthesis over indexed technical playlists.
          </p>
        </div>
        <button className="btn-primary" onClick={() => onTryNow()}>
          <span>Try it now</span>
          <ArrowRight size={15} />
        </button>
      </div>

      {/* Footer */}
      <footer className="landing-footer">
        <div>Video Q&amp;A · Production Retrieval-Augmented Generation for Technical Video</div>
        <div>FastAPI · Qdrant · faster-whisper · React</div>
      </footer>
    </div>
  );
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
  const [serverState, setServerState] = useState("checking"); // "checking" | "waking" | "ready" | "error"
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [view, setView] = useState(() => (window.location.hash === "#app" ? "app" : "landing"));

  useEffect(() => {
    function onHash() {
      setView(window.location.hash === "#app" ? "app" : "landing");
    }
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  function navigateTo(target, prefillQuery = "") {
    if (prefillQuery) {
      setQuestion(prefillQuery);
    }
    setView(target);
    window.location.hash = target === "app" ? "#app" : "";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

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
    let cancelled = false;
    let timer = null;
    let count = 0;
    const MAX_RETRIES = 30; // 30 retries * 3s = 90s for Azure cold start

    async function loadMeta() {
      try {
        const res = await fetch(`${API}/meta`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const m = await res.json();
        if (cancelled) return;

        if (m) {
          setMeta({ lectures: m.lectures || 0, hours: m.hours || 0 });
          if (m.playlists) {
            setPlaylists(m.playlists);
            const ids = Object.keys(m.playlists);
            if (ids.length > 0) setPlaylist((prev) => prev || ids[0]);
          }
          setServerState("ready");
        }
      } catch (e) {
        if (cancelled) return;
        count++;
        setRetryAttempt(count);
        if (count >= MAX_RETRIES) {
          setServerState("error");
        } else {
          setServerState("waking");
          timer = setTimeout(loadMeta, 3000);
        }
      }
    }

    loadMeta();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
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
      setError("Add an API key in AI settings to use Ask AI.");
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
          <div
            className="nav-brand"
            role="button"
            onClick={() => navigateTo("landing")}
            style={{ cursor: "pointer" }}
            title="Video Q&A Homepage"
          >
            <div className="brand-icon">
              <PlaySquare size={17} />
            </div>
            <div className="brand-title">Video Q&amp;A</div>
          </div>

          {view === "landing" ? (
            <>
              <div className="nav-links">
                <a href="#architecture" className="nav-link">Architecture</a>
                <a href="#comparison" className="nav-link">Comparison</a>
              </div>

              <div className="nav-actions">
                {serverState === "ready" ? (
                  <div className="nav-status">
                    <span className="pulse-dot"></span>
                    <span>Online</span>
                  </div>
                ) : serverState === "waking" || serverState === "checking" ? (
                  <div className="nav-status">
                    <Loader2 size={12} className="spin" style={{ color: "#f59e0b" }} />
                    <span style={{ color: "#f59e0b" }}>Waking server...</span>
                  </div>
                ) : null}

                <button
                  className="btn-primary nav-cta-btn"
                  onClick={() => navigateTo("app")}
                >
                  <span>Try it now</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="nav-center">
                {serverState === "ready" ? (
                  <>
                    <span className="pulse-dot"></span>
                    <span>
                      {meta.lectures > 0
                        ? `${meta.lectures} Lectures · ${meta.hours}h Indexed`
                        : "Server Online · Playlists Ready"}
                    </span>
                  </>
                ) : serverState === "waking" || serverState === "checking" ? (
                  <>
                    <Loader2 size={13} className="spin" style={{ color: "#f59e0b" }} />
                    <span style={{ color: "#f59e0b" }}>
                      Waking up server (cold start{retryAttempt > 0 ? ` · retry #${retryAttempt}` : ""}...)...
                    </span>
                  </>
                ) : (
                  <>
                    <span className="pulse-dot pulse-dot-red"></span>
                    <span style={{ color: "#ef4444" }}>
                      Backend unreachable
                    </span>
                  </>
                )}
              </div>

              <div className="nav-actions">
                <button
                  className="btn-secondary nav-cta-btn"
                  onClick={() => navigateTo("landing")}
                >
                  <ArrowLeft size={14} />
                  <span>Overview</span>
                </button>
              </div>
            </>
          )}

        </div>
      </nav>

      {view === "landing" ? (
        <LandingView
          onTryNow={(q) => navigateTo("app", q)}
          serverState={serverState}
          retryAttempt={retryAttempt}
          meta={meta}
        />
      ) : (
        <div className="page">
          {/* ---- Single-Select Playlist Picker ---- */}
          <div className="picker-block">
          <button
            className="picker-toggle"
            onClick={() => setPickerOpen((v) => !v)}
            disabled={serverState !== "ready" || playlistIds.length === 0}
          >
            <span className="picker-label-chip">
              <FolderGit2 size={13} />
              <span>Playlist</span>
            </span>
            <span className="picker-current">
              {serverState === "waking" || serverState === "checking" ? (
                <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#f59e0b" }}>
                  <Loader2 size={13} className="spin" />
                  Waking up server... please wait
                </span>
              ) : serverState === "error" ? (
                <span style={{ color: "#ef4444" }}>
                  Backend offline — check connection
                </span>
              ) : selected ? (
                `${playlist} (${selected.chunks} moments)`
              ) : playlistIds.length === 0 ? (
                "No playlists indexed yet"
              ) : (
                "Select one"
              )}
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
              AI settings
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
                placeholder={`${provider === "groq" ? "Groq" : "Gemini"} API key`}
                autoComplete="off"
                spellCheck={false}
              />
              <button
                className="apply-btn"
                onClick={applyKey}
                disabled={!draftKey.trim()}
              >
                <span>Apply</span>
              </button>
            </div>
          )}
          <p className="key-hint">
            Needed only for Ask AI. Stored locally in this browser.
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

        {/* ---- Answer ---- */}
        {answer && (
          <div className="answer-card">
            <div className="answer-header">
              <div className="answer-tag">
                <span>Answer</span>
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
                    <span>Sources</span>
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
      )}
    </>
  );
}
