from fastapi import APIRouter, Query
from app.services.engine_runner import get_strategy_recommendations

router = APIRouter()

@router.get("/recommendations")
def recommendations(driver: str = Query(default="LEC")):
    return get_strategy_recommendations(driver)
