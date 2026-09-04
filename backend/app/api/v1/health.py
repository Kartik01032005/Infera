from fastapi import APIRouter

router = APIRouter()


@router.get("/health", summary="Health Check")
def get_health():
    """Operational health check endpoint for Infera API."""
    return {
        "status": "SUCCESS",
        "data": {
            "status": "healthy",
        },
    }
