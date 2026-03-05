from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from app.routers import claims, adjuster

load_dotenv()

app = FastAPI(title="ClaimPath API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://claimpath.ai"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health():
    return {"status": "ok"}

app.include_router(claims.router, prefix="/api/claims", tags=["claims"])
app.include_router(adjuster.router, prefix="/api/adjuster", tags=["adjuster"])
