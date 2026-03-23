# Cafe Kaya API

FastAPI backend for the Cafe Kaya website: menu, gallery, reviews, contact, and site settings.

## Setup

1. Create a virtualenv and install dependencies:
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate  # or .venv\Scripts\activate on Windows
   pip install -r requirements.txt
   ```

2. Copy `.env.example` to `.env` and set at least:
   - `CAFE_DATABASE_URL` — PostgreSQL URL; the app accepts `postgresql://` or `postgresql+asyncpg://` (see `app/config.py`)
   - `JWT_SECRET` — a long random string for production

3. (Optional) Run PostgreSQL via Docker:
   ```bash
   docker compose up -d
   ```
   If your system says "Unable to locate package docker-compose-plugin", add Docker's repo and install the plugin by running (from the `backend` directory):
   ```bash
   bash scripts/install-docker-compose-plugin.sh
   ```
   If `docker compose` still fails, try `docker-compose up -d` (standalone Compose).

4. Run migrations:
   ```bash
   alembic upgrade head
   ```

5. Create an admin user (for protected routes):
   ```bash
   python -m scripts.create_admin admin@cafekaya.com yourpassword
   ```

6. Start the server:
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

- API docs: http://localhost:8000/docs
- Health: http://localhost:8000/health

## Project structure

- `app/main.py` — FastAPI app, CORS, router includes, logging
- `app/config.py` — Settings from env
- `app/db.py` — Async SQLAlchemy engine and session
- `app/dependencies.py` — get_db, get_current_user (JWT)
- `app/routers/` — auth, menu, gallery, reviews, contact, settings, upload
- `app/models/` — SQLAlchemy ORM
- `app/schemas/` — Pydantic request/response
- `app/services/` — auth (password, JWT), upload (Cloudinary), optional email
- `migrations/` — Alembic

## Deployment

- **Rate limiting:** Use your host (e.g. Render, Cloudflare) or add `slowapi` for in-app rate limiting.
- **Production:** Set `JWT_SECRET` to a long random value; set `CORS_ORIGINS` to your frontend origin(s) (comma-separated or JSON array); use a managed PostgreSQL (Supabase, Neon, Render).
- **Images:** Set `CLOUDINARY_*` env vars to enable admin image uploads; otherwise store image URLs manually.

### Render (Blueprint)

The repo root [`render.yaml`](../render.yaml) defines:

- **Postgres:** `cafe-kaya-db` (database `cafe_kaya`)
- **Web service:** `cafe-kaya-api` (Docker build from [`Dockerfile`](Dockerfile), context `backend/`)
- **`preDeployCommand`:** `alembic upgrade head` (runs before each deploy; same as Render dashboard “Pre-Deploy Command”)
- **Env:** `CAFE_DATABASE_URL` from the database `connectionString`, `JWT_SECRET` generated, `DEBUG=false`, `CORS_ORIGINS=https://cafe-kaya.onrender.com` (change this if your frontend URL differs, then sync the Blueprint or edit env in the dashboard)

**After the first successful deploy**

1. Open the **Shell** tab for service `cafe-kaya-api` and create an admin user:

   ```bash
   python -m scripts.create_admin admin@cafekaya.com yourpassword
   ```

2. Point the Vite frontend at the API: in the repo root [`.env.production`](../.env.production), `VITE_API_URL` should match your Render URL (default in the blueprint: `https://cafe-kaya-api.onrender.com`).

**Local check (optional):** To confirm migrations work the same way as on Render’s pre-deploy step, build the image from the repo root and run Alembic inside the container with a reachable Postgres `CAFE_DATABASE_URL` (e.g. a test DB on the host).
