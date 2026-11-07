"""
Paisa Saathi — FastAPI backend entry point.
"""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

app = FastAPI(
    title="Paisa Saathi",
    description="Hindi voice banking companion for irregular-income customers",
    version="0.1.0",
)

# Allow frontend dev server and production origins
origins_env = os.getenv("ALLOWED_ORIGINS", "")
allowed_origins = [o.strip() for o in origins_env.split(",") if o.strip()] if origins_env else ["http://localhost:5173", "http://localhost:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins if allowed_origins else ["*"],
    allow_origin_regex=r"^https?://.*" if not origins_env else None,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "paisa-saathi"}


from backend.routes import fraud, journey, recommendations, stress, voice

app.include_router(voice.router)
app.include_router(recommendations.router)
app.include_router(stress.router)
app.include_router(fraud.router)
app.include_router(journey.router)

# Mount frontend build in production if present; otherwise provide a landing JSON response
frontend_dist = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend", "dist")
if os.path.exists(frontend_dist) and os.path.isdir(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="frontend")
else:
    @app.get("/")
    async def root():
        return {
            "status": "online",
            "service": "Paisa Saathi Backend API",
            "version": "0.1.0",
            "health_check": "/health",
            "api_docs": "/docs",
            "message": "FastAPI backend is running! Connect your Vercel frontend or visit /docs to test endpoints.",
        }
