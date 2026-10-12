from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.database import init_db
from app.routers import health, consumer, dashboard, invoices, payments, transactions, qr, merkle, dpdp, recon

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database and populate seed data if not present
    init_db()
    yield

app = FastAPI(
    title="Mosaic Backend API",
    description="Consumer-first home and gated community living platform with invisible institutional financial security",
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

# Register routers
app.include_router(health.router)
app.include_router(consumer.router)
app.include_router(dashboard.router)
app.include_router(invoices.router)
app.include_router(payments.router)
app.include_router(transactions.router)
app.include_router(qr.router)
app.include_router(merkle.router)
app.include_router(dpdp.router)
app.include_router(recon.router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
