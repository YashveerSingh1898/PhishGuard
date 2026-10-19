"""PhishGuard API Entrypoint.

FastAPI application configuration, middleware, and base routing.
Detection endpoints and automata transformation services will be mounted here in Phase 2.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="PhishGuard API",
    description="Dual-Layer Phishing Detection Engine combining Automata Theory and NLP",
    version="0.1.0-alpha",
)

# Configure Cross-Origin Resource Sharing (CORS) for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health", tags=["System"])
async def health_check():
    """Health check endpoint to verify backend operational readiness."""
    return {
        "status": "healthy",
        "service": "PhishGuard API",
        "version": "0.1.0-alpha",
        "phase": "Phase 1: Project Scaffolding",
    }


from app.api import api_router
app.include_router(api_router, prefix="/api")
