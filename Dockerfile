# Deploy: same 126 transcripts, no re-transcribe. CPU-only, ~500MB RAM.
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000

WORKDIR /app

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

COPY backend/pyproject.toml backend/uv.lock backend/.python-version ./
RUN uv sync --frozen --no-install-project

COPY backend/ytrag ./ytrag
COPY backend/api ./api
COPY backend/main.py ./
COPY backend/transcripts ./transcripts
COPY backend/index ./index
COPY backend/eval ./eval
COPY SETUP.md ./
RUN uv sync --frozen

EXPOSE 8000

# Load prebuilt vectors into ephemeral local Qdrant, then serve (single worker).
CMD ["sh", "-c", "uv run ytrag load && exec uv run ytrag serve --host 0.0.0.0 --port ${PORT:-8000}"]
