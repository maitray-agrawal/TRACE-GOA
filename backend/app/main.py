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
logger = logging.getLogger("TRACE//GOA")

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing TRACE//GOA Engine...")
    trace_mode = os.getenv("TRACE_MODE", "competition").lower()
    try:
        if trace_mode == "competition":
            from scripts.setup.clean_and_seed_cases import sync_competition_cases
            sync_competition_cases()
            logger.info("TRACE//GOA Competition Store Synchronized: 20 Official HHG Benchmark Cases.")
        else:
            build_and_seed_dataset()
            logger.info("TRACE//GOA Graph Engine & Dev Benchmark Dataset Seeded.")
    except Exception as e:
        logger.warning(f"Startup seed notice: {e}")
    yield

app = FastAPI(
    title="TRACE//GOA — Agentic Fraud Investigation & Next-Best Action Engine",
    description="Graph-native agentic fraud investigation engine with TigerGraph GSQL/MCP, GraphRAG, uncertainty loops, and SHA-256 Decision Ledgers. Trace the signal. Find the network. Make the move.",
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
