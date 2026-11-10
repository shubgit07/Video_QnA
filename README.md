# 🎥 LectureLens — YouTube Video Q&A & Semantic Search

> **Ask questions about any video lecture in plain English or Hinglish, get an instant grounded answer, and jump to the exact second the instructor explains it.**

[![Python 3.11](https://img.shields.io/badge/Python-3.11-3776AB?style=flat&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Backend-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-Frontend-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![Docker](https://img.shields.io/badge/Docker-Containerized-2496ED?style=flat&logo=docker&logoColor=white)](https://www.docker.com/)
[![Azure](https://img.shields.io/badge/Azure-Deployed-0078D4?style=flat&logo=microsoftazure&logoColor=white)](https://azure.microsoft.com/)
[![Qdrant](https://img.shields.io/badge/Vector_DB-Qdrant-DC2626?style=flat)](https://qdrant.tech/)

---

## 💡 What Is This? (In Simple Words)

When you study from long YouTube playlists (like a 70-hour course on Data Structures & Algorithms), finding where a specific topic was explained is painful:
- You spend hours scrubbing through video timelines.
- YouTube search only looks at titles and tags, not what the teacher actually said out loud.
- Asking ChatGPT gives you a generic textbook answer, but it cannot tell you: *"Where did my teacher explain this in their course?"*

**LectureLens solves this:**
1. You ask a question in **natural Hinglish or English** (e.g. *"bhai memoization aur tabulation me kya difference hai?"*).
2. The AI searches through **68+ hours of spoken lecture audio**.
3. You get a **3-sentence direct answer** plus **interactive timestamp buttons**.
4. Clicking a timestamp opens the video and **starts playing at the exact second** the topic is discussed.

---

## 🏗️ How It Works (High-Level Flow)

```mermaid
flowchart LR
    A["🎓 Student asks question\n(Hinglish / English)"] --> B["🔍 Smart Search\n(Qdrant Vector DB)"]
    B --> C{"Is topic in\nplaylist?"}
    C -- No --> D["🛑 Instant Refusal\n'Topic not covered'\n(Zero AI Cost)"]
    C -- Yes --> E["🤖 AI Synthesizer\n(Groq / Google Gemini)"]
    E --> F["✅ Grounded Answer\n+ Deep-Link Video Timestamps"]
    F --> G["▶️ Plays Video at Exact Second\nin Built-in Player"]
```

---

## ⚙️ System Architecture

```mermaid
flowchart TD
    subgraph AudioPipeline ["1. Ingestion & Transcription Engine"]
        YT["YouTube Playlist"] -->|yt-dlp stream| PyAV["PyAV In-Memory Decode\n(Zero WAV files, saves 8GB disk)"]
        PyAV --> VAD["Silero VAD\n(Strips silent pauses)"]
        VAD --> FW["faster-whisper large-v3\n(CTranslate2 float16, batch=8)\n3.2x faster"]
        FW --> Cache["Atomic Disk Cache\n(JSON files via .tmp rename)"]
    end

    subgraph VectorEngine ["2. Time-Domain Chunking & Search"]
        Cache --> Chunk["Time Chunker\n(75s window, 15s overlap)"]
        Chunk --> RepFilt{"Repetition Filter\n(Kills Whisper loops)"}
        RepFilt --> TitleBoost["Macro Title Injection\n[f'{title}\n\n{text}']"]
        TitleBoost --> Embed["SentenceTransformer\n(all-MiniLM-L6-v2 / bge-m3)"]
        Embed --> Qdrant[("Qdrant Vector Store\n(Payload: start_sec, video_id)")]
    end

    subgraph AzureCloud ["3. Production Serving on Azure"]
        Client["React Web App (Vite)\nYouTube IFrame Embed"] <-->|REST API| FastAPI["FastAPI Backend (Azure App Service)"]
        FastAPI --> RateLimit["Sliding-Window Rate Limiter"]
        RateLimit --> Hybrid["Hybrid Search:\nVector Distance - (0.08 * Title Overlap)"]
        Hybrid <--> Qdrant
        Hybrid --> Guard1{"Guard 1: Distance <= 0.65?"}
        Guard1 -- No --> Reject["Instant Rejection\n(No LLM called)"]
        Guard1 -- Yes --> LLM["LLM (Groq / Gemini)"]
        LLM --> Guard2["Guard 2: Citation Verification & Renumbering"]
        Guard2 --> Rewind["Rewind 5s for context"]
        Rewind --> Response["Grounded Answer + Timestamps"]
        Reject --> Response
        Response --> Client
    end
```

---

## 📊 Core Data Types (Schema)

The entire system moves data through three clean, typed models:

```mermaid
classDiagram
    class Video {
        +str video_id
        +str title
        +int duration
        +url() str
    }
    class Segment {
        +float start
        +float end
        +str text
    }
    class Chunk {
        +str chunk_id
        +str video_id
        +str video_title
        +int start_sec
        +int end_sec
        +str text
        +point_id() str (Deterministic UUIDv5)
        +link_sec() int (Rewound by 5s)
        +url() str
    }
    class AskResponse {
        +str answer
        +List citations
        +bool grounded
        +int retrieved
    }
    Video "1" --> "*" Segment : transcribes to
    Segment "*" --> "1" Chunk : merges into
    Chunk --> AskResponse : grounded in
```

### Python Types Definition (`ytrag/models.py`)

- **`Video`**: Represents the YouTube lecture (`video_id`, `title`, `duration`).
- **`Segment`**: Raw speech utterance from Whisper (`start`, `end`, `text`).
- **`Chunk`**: Overlapping 75-second audio window with title injection for search indexing.
- **`AskRequest`**: User query payload (`question`, `playlist`, `top_k`, optional BYO API key).
- **`AskResponse`**: Structured answer (`answer`, `citations` with video seconds, `grounded` flag).

---

## 🚀 Key Engineering Highlights

1. **3.2x Faster Transcription:**  
   Standard Whisper takes ~27 hours for 68 hours of audio. By using `faster-whisper` (CTranslate2 `float16`) with Voice Activity Detection (VAD) and batching (`batch_size=8`), processing dropped to **~8.5 hours**.
2. **Zero Disk WAV Files:**  
   Decodes `.m4a` streams directly in memory using `PyAV`. This eliminated **8 GB+ of temporary disk writes**.
3. **95% Top-k Retrieval Accuracy (from 65%):**  
   Pure vector search often misranks speech. A **lexical title-boost reranker** (`distance - 0.08 * title_overlap`) ensures lectures explicitly titled with the topic rank first.
4. **Dual Hallucination Guard:**  
   - **Guard 1 (Pre-LLM):** If vector distance > 0.65, questions like *"How do React hooks work?"* are declined immediately without calling the LLM ($0 API cost).  
   - **Guard 2 (Post-LLM):** Citations are verified using regex and pruned. Answers without valid citations are flagged ungrounded.
5. **Rewound Deep Links:**  
   Timestamps automatically rewind by 5 seconds so the video starts just before the speaker begins the sentence, not mid-word.

---

## ☁️ Azure Cloud Deployment

The production backend runs inside a container on **Azure App Service**:

```mermaid
flowchart LR
    Git["GitHub Repo"] -->|Push to main| Action["GitHub Actions CI/CD"]
    Action -->|Docker Build & Push| GHCR["GitHub Container Registry\n(ghcr.io)"]
    GHCR -->|Deploy| Azure["Azure App Service (Linux)\nFastAPI + Uvicorn"]
    Azure <--> Qdrant["Qdrant Cloud"]
    Azure <--> LLM["Groq / Gemini APIs"]
    Client["React Frontend (Vercel / Azure)"] <-->|HTTPS| Azure
```

- **Containerized:** Docker multi-stage build running `python:3.11-slim` with Astral `uv`.
- **Pre-baked Vectors:** Pre-computed vectors (`vectors.npz`) load in 20 seconds at container boot.
- **Cold-Start Handling:** The React UI automatically polls Azure with up to 30 retries (90s window) and displays a clean waiting indicator if the server is waking up.

---

## 📡 API Reference

### `POST /ask`
Ask a question and receive a grounded explanation + video links.

```json
// Request
{
  "question": "memoization vs tabulation kya difference hai?",
  "playlist": "pratyush-dsa-playlist",
  "top_k": 6
}

// Response (200 OK)
{
  "answer": "Memoization top-down approach hai [1], jabki tabulation bottom-up [2].",
  "citations": [
    {
      "title": "DP Lecture 3 — Memoization Deep Dive",
      "timestamp": "12:04",
      "start_sec": 724,
      "video_id": "-AEEZEWOA-E",
      "distance": 0.38,
      "url": "https://www.youtube.com/watch?v=-AEEZEWOA-E&t=724s"
    }
  ],
  "grounded": true,
  "retrieved": 6
}
```

### `POST /search`
Instant vector search returning timestamps only (no LLM, 0s latency, free).

### `GET /health`
Returns backend status and loaded AI model information.

---

## 💻 Quickstart (Run Locally in 3 Minutes)

You don't need a GPU. 126 lecture transcripts and a prebuilt search index are included.

```bash
# 1. Clone & install
git clone <REPO_URL>
cd week3/ytscraper/backend
uv sync

# 2. Add ONE free key to .env (Groq or Google Gemini)
cp .env.example .env
# Edit .env -> GEMINI_API_KEY=... or GROQ_API_KEY=...

# 3. Load prebuilt vectors (Takes 20 seconds, CPU only)
uv run ytrag load

# 4. Start app
uv run ytrag serve
```
Open **`http://127.0.0.1:8000`** in your browser.

---

## 🛠️ CLI Commands Cheat Sheet

| Command | What It Does |
|---|---|
| `uv run ytrag load` | Loads prebuilt 126-lecture index in 20 seconds |
| `uv run ytrag search "sliding window"` | Instant terminal search (timestamps only) |
| `uv run ytrag ask "kadane intuition"` | Terminal Q&A with explanation and links |
| `uv run ytrag serve` | Starts web server & interactive video UI |
| `uv run ytrag eval` | Runs accuracy benchmark against golden test set |
| `uv run ytrag stats` | Shows indexed videos and chunk counts |
| `uv run ytrag preflight` | Diagnostic check of keys, models, and network |

---

