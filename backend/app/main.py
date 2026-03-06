"""FastAPI application entry point."""

import logging

from app.config import get_settings
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("cafe_kaya")
from app.routers import auth, contact, gallery, menu, reviews
from app.routers import settings as settings_router
from app.routers import upload as upload_router

config = get_settings()

app = FastAPI(
    title=config.app_name,
    version="1.0.0",
    docs_url="/docs" if config.debug else None,
    redoc_url="/redoc" if config.debug else None,
)

if config.jwt_secret == "change-me-in-production":
    logger.warning(
        "JWT_SECRET is using the default value. Set a secure secret in production!"
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Root: links to API docs and health check."""
    return {"docs": "/docs", "health": "/health"}


@app.get("/health")
async def health():
    """Health check for load balancers and monitoring."""
    logger.debug("Health check")
    return {"status": "ok"}


# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(menu.router, prefix="/api/menu", tags=["menu"])
app.include_router(gallery.router, prefix="/api/gallery", tags=["gallery"])
app.include_router(reviews.router, prefix="/api/reviews", tags=["reviews"])
app.include_router(contact.router, prefix="/api/contact", tags=["contact"])
app.include_router(settings_router.router, prefix="/api/settings", tags=["settings"])
app.include_router(upload_router.router, prefix="/api/upload", tags=["upload"])
