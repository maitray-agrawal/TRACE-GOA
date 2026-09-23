"""Main FastAPI Application Entrypoint."""

import os
import sys
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

# Ensure root is in PYTHONPATH
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from backend.app.api.routes import router as api_router
from scripts.ingest.generate_seed_dataset import build_and_seed_dataset

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("HHGOA-Server")

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing HHGOA Fraud Platform...")
    try:
        build_and_seed_dataset()
        logger.info("HHGOA Graph Engine & Benchmark Dataset Seeded.")
    except Exception as e:
        logger.warning(f"Startup seed notice: {e}")
    yield

app = FastAPI(
    title="TigerGraph Agentic Fraud Investigation & Next-Best Action API — HHGOA",
    description="Enterprise API powering autonomous fraud investigation agents with TigerGraph, GraphRAG, and decision ledgers.",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)


@app.get("/health")
def health_check():
    return {"status": "HEALTHY", "service": "HHGOA Fraud Investigation Engine", "version": "1.0.0"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
