# Deployment Guide

Production deployment for Cafe Kaya using **Vercel** (frontend), **Render** (backend), and **PostgreSQL** (database).

---

## Prerequisites

| Service    | Purpose           | Sign-up URL                          |
|------------|-------------------|--------------------------------------|
| Vercel     | Frontend hosting  | https://vercel.com                   |
| Render     | Backend hosting   | https://render.com                   |
| Supabase   | PostgreSQL DB     | https://supabase.com                 |
| Cloudinary | Image storage     | https://cloudinary.com               |

Render PostgreSQL can be used instead of Supabase if preferred.

---

## 1. Database Setup

### Option A: Supabase

1. Create a new project at https://supabase.com.
2. Go to **Settings > Database** and copy the **Connection string (URI)**.
3. Replace `[YOUR-PASSWORD]` with the database password you chose.
4. Convert to async format: change `postgresql://` to `postgresql+asyncpg://`.
5. If the URI includes `?sslmode=...`, keep it as-is.

Example:

```
postgresql+asyncpg://user:YOUR_PASSWORD@your-project.pooler.supabase.com:5432/postgres
```

### Option B: Render PostgreSQL

1. Go to **Render Dashboard > New > PostgreSQL**.
2. Choose a plan and create the database.
3. Copy the **Internal Database URL** (for services on Render) or **External Database URL** (for external access).
4. Convert to async format: change `postgresql://` to `postgresql+asyncpg://`.

---

## 2. Backend Deployment (Render)

### Create the Web Service

1. Go to **Render Dashboard > New > Web Service**.
2. Connect your GitHub repository.
3. Configure:
   - **Name**: `cafe-kaya-api`
   - **Root Directory**: `backend`
   - **Environment**: `Docker`
   - **Dockerfile Path**: `Dockerfile`
   - **Plan**: Free or Starter

### Set Environment Variables

In the Render service settings, add these environment variables:

| Variable                | Value                                           |
|-------------------------|--------------------------------------------------|
| `APP_NAME`              | `Cafe Kaya API`                                  |
| `DEBUG`                 | `false`                                          |
| `CAFE_DATABASE_URL`     | Your PostgreSQL connection string (async format) |
| `JWT_SECRET`            | A long random string (use `openssl rand -hex 32`) |
| `CORS_ORIGINS`          | `https://your-app.vercel.app`                    |
| `CLOUDINARY_CLOUD_NAME` | Your Cloudinary cloud name                       |
| `CLOUDINARY_API_KEY`    | Your Cloudinary API key                          |
| `CLOUDINARY_API_SECRET` | Your Cloudinary API secret                       |

### Run Database Migrations

After the first deploy, open the Render **Shell** tab and run:

```bash
alembic upgrade head
```

Or add a **Pre-deploy Command** in Render settings:

```bash
alembic upgrade head
```

This runs migrations automatically before each deploy.

### Create Admin User

From the Render Shell:

```bash
python -m app.seed
```

(If a seed script exists, or use the application's admin creation endpoint.)

### Verify

```bash
curl https://your-api.onrender.com/health
# Expected: {"status":"ok"}
```

---

## 3. Frontend Deployment (Vercel)

### Import Project

1. Go to **Vercel Dashboard > Add New > Project**.
2. Import your GitHub repository.
3. Configure:
   - **Root Directory**: `.` (project root)
   - **Framework Preset**: Vite (auto-detected)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### Set Environment Variables

| Variable       | Value                                        |
|----------------|----------------------------------------------|
| `VITE_API_URL` | `https://your-api.onrender.com` (backend URL) |

### Deploy

Click **Deploy**. Vercel will build and deploy automatically.

### Verify

1. Visit your Vercel URL.
2. Confirm the homepage loads.
3. Navigate to `/admin` and verify client-side routing works.
4. Test login functionality.

---

## 4. Cloudinary Setup

1. Sign up at https://cloudinary.com.
2. From the **Dashboard**, copy:
   - Cloud Name
   - API Key
   - API Secret
3. Add these as environment variables in your Render backend service (see table above).

Image uploads from the admin panel will be stored in Cloudinary automatically.

---

## 5. Environment Variables Reference

### Backend (Render)

| Variable                 | Required | Default                        | Description                        |
|--------------------------|----------|--------------------------------|------------------------------------|
| `APP_NAME`               | No       | `Cafe Kaya API`                | Application display name           |
| `DEBUG`                  | No       | `false`                        | Enable debug mode and API docs     |
| `CAFE_DATABASE_URL`      | Yes      | —                              | PostgreSQL connection string       |
| `JWT_SECRET`             | Yes      | —                              | Secret key for JWT tokens          |
| `JWT_ALGORITHM`          | No       | `HS256`                        | JWT signing algorithm              |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | No  | `1440`                         | Token expiry (default 24 hours)    |
| `CORS_ORIGINS`           | Yes      | localhost origins               | Comma-separated allowed origins    |
| `CLOUDINARY_CLOUD_NAME`  | No       | —                              | Cloudinary cloud name              |
| `CLOUDINARY_API_KEY`     | No       | —                              | Cloudinary API key                 |
| `CLOUDINARY_API_SECRET`  | No       | —                              | Cloudinary API secret              |

### Frontend (Vercel)

| Variable       | Required | Description                       |
|----------------|----------|-----------------------------------|
| `VITE_API_URL` | Yes      | Full URL to the backend API       |

---

## 6. Post-Deployment Checklist

- [ ] Backend health check returns `{"status": "ok"}`
- [ ] Database migrations ran successfully (`alembic upgrade head`)
- [ ] Frontend loads at the Vercel URL
- [ ] Client-side routing works (e.g., `/admin` direct access)
- [ ] Login works with valid credentials
- [ ] CORS is configured correctly (no browser console errors)
- [ ] Image uploads work via Cloudinary
- [ ] JWT_SECRET is set to a unique, strong value
- [ ] DEBUG is set to `false` in production
- [ ] API docs are not publicly accessible (disabled when DEBUG=false)

---

## 7. Troubleshooting

### CORS Errors

Verify `CORS_ORIGINS` in Render matches your Vercel domain exactly (including `https://`).

### Database Connection Failures

- Ensure the connection string uses `postgresql+asyncpg://` (async driver).
- If using Supabase, ensure the password is URL-encoded if it contains special characters.
- Check that the database is accessible from Render (use External URL for cross-provider).

### 502 / Service Unavailable on Render

- Check Render logs for startup errors.
- Ensure all required environment variables are set.
- Verify the Docker build succeeds locally: `docker build -t test ./backend`

### Build Failures on Vercel

- Ensure `VITE_API_URL` is set in the Vercel environment variables.
- Check that `npm run build` succeeds locally.

### Render Free Tier Cold Starts

Render free-tier services spin down after inactivity. The first request after idle takes 30-60 seconds. Upgrade to a paid plan for always-on availability.
