import os
import subprocess
import uvicorn


def run_migrations():
    """Run alembic migrations on startup in production."""
    print("Running database migrations...")
    result = subprocess.run(
        ["python", "-m", "alembic", "upgrade", "head"],
        capture_output=True, text=True,
    )
    if result.returncode != 0:
        print(f"Migration warning: {result.stderr}")
    else:
        print("Migrations complete.")


def run_seed():
    """Seed demo data (idempotent — safe to re-run)."""
    print("Running seed...")
    from seed import seed
    seed()


if __name__ == "__main__":
    if os.getenv("ENV") == "production":
        run_migrations()
        run_seed()

    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=False)
