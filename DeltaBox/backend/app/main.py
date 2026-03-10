from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.strategy import router as strategy_router

app = FastAPI(title="DeltaBox API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(strategy_router, prefix="/api/strategy", tags=["strategy"])
