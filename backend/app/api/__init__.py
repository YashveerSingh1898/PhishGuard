"""API router package for PhishGuard."""

from fastapi import APIRouter
from app.api.automata import router as automata_router

api_router = APIRouter()
api_router.include_router(automata_router)

__all__ = ["api_router"]
