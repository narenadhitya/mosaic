from fastapi import APIRouter, Query
from app.graph_engine import analyze_payment_graph

router = APIRouter(prefix="/api/graph", tags=["Knowledge Graph"])

@router.get("")
def get_payment_graph(fraud_scenario: bool = Query(False, description="Whether to include fraud scenario nodes")):
    return analyze_payment_graph(include_fraud=fraud_scenario)
