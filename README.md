# Cafe Kaya

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A modern, full-stack cafe website built with React and FastAPI. Cafe Kaya delivers an immersive digital experience that showcases the cafe's atmosphere, menu, gallery, and location through visual storytelling and intuitive navigation.

---

## Live Application

| Service  | URL                          |
| -------- | ---------------------------- |
| Frontend | `https://your-frontend-url`  |
| Backend  | `https://your-api-url`       |
| API Docs | `https://your-api-url/docs`  |

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Security](#security)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Deployment](#deployment)
- [Developer](#developer)
- [Contributing](#contributing)
- [License](#license)

---

## Features

### Core Features

- **Immersive Landing Page** -- Hero section, about, experience, and call-to-action sections with smooth scroll animations powered by Framer Motion
- **Menu Display** -- Browse categorized menu items with images, descriptions, and pricing; admin CRUD for categories and items
- **Image Gallery** -- Masonry-style gallery with drag-and-drop reorder support in the admin panel
- **Customer Reviews** -- Public review submission with moderation workflow (pending, approved, rejected) and aggregate ratings
- **Contact Form** -- Visitors can submit messages; admins can view and mark messages as read
- **Admin Dashboard** -- Protected panel for managing menu, gallery, reviews, messages, and site settings
- **JWT Authentication** -- Secure token-based auth with protected routes and role-based access
- **Image Uploads** -- Cloudinary integration for optimized image storage and delivery
- **Responsive Design** -- Mobile-first UI built with Tailwind CSS and shadcn/ui components
- **Dark Mode** -- Class-based theme switching with custom color tokens
- **Location & Contact Info** -- Configurable site settings for address, phone, hours, and social links

### Future Features

- Online reservations and table booking
- Online ordering and checkout
- Analytics dashboard with visitor and order metrics
- Email notifications for new messages and reviews
- Multi-language support

---

## Tech Stack

### Frontend

| Technology          | Purpose                        |
| ------------------- | ------------------------------ |
| React 18            | UI framework                   |
| TypeScript          | Type safety                    |
| Vite 5              | Build tool and dev server      |
| Tailwind CSS 3      | Utility-first styling          |
| shadcn/ui + Radix   | Accessible component library   |
| React Router v6     | Client-side routing            |
| TanStack React Query| Server state management        |
| React Context API   | Auth state management          |
| React Hook Form     | Form handling                  |
| Zod                 | Schema validation              |
| Framer Motion       | Animations                     |
| Lucide React        | Icon library                   |
| Recharts            | Admin dashboard charts         |
| Vitest              | Unit testing                   |
| Testing Library     | Component testing              |

### Backend

| Technology          | Purpose                        |
| ------------------- | ------------------------------ |
| Python 3.12         | Runtime                        |
| FastAPI             | Web framework                  |
| Uvicorn             | ASGI server                    |
| SQLAlchemy 2.0      | Async ORM                      |
| asyncpg             | PostgreSQL async driver        |
| Alembic             | Database migrations            |
| Pydantic v2         | Data validation and schemas    |
| python-jose         | JWT token handling             |
| passlib + bcrypt    | Password hashing               |
| Cloudinary SDK      | Image upload and CDN           |
| Pytest              | Testing framework              |

### Infrastructure

| Technology          | Purpose                        |
| ------------------- | ------------------------------ |
| PostgreSQL 16       | Relational database            |
| Docker              | Backend containerization       |
| Docker Compose      | Local database orchestration   |
| Git + GitHub        | Version control                |

---

## Architecture

```
┌─────────────────┐       ┌─────────────────┐       ┌──────────────┐
│                 │       │                 │       │              │
│   React Client  │──────▶│  FastAPI Server  │──────▶│  PostgreSQL  │
│   (Vite Dev)    │  /api │  (Uvicorn)      │       │  Database    │
│                 │       │                 │       │              │
└─────────────────┘       └────────┬────────┘       └──────────────┘
                                   │
                                   │ Upload
                                   ▼
                          ┌─────────────────┐
                          │                 │
                          │   Cloudinary    │
                          │   (Image CDN)   │
                          │                 │
                          └─────────────────┘
```

In development, Vite proxies `/api` requests to the FastAPI backend on `localhost:8000`. In production, the frontend and backend are deployed independently with CORS configured between them.

---

## Installation

### Prerequisites

- Node.js 18+ and npm
- Python 3.12+
- PostgreSQL 16 (or Docker)

### 1. Clone the Repository

```bash
git clone https://github.com/Ndet0/cafe-kaya.git
cd cafe-kaya
```

### 2. Start the Database

```bash
cd backend
docker compose up -d
```

This starts a PostgreSQL 16 instance on port `5432` with database `cafe_kaya`.

### 3. Set Up the Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # then edit .env with your values
alembic upgrade head
python scripts/create_admin.py
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000` with interactive docs at `http://localhost:8000/docs`.

### 4. Set Up the Frontend

Open a new terminal from the project root:

```bash
npm install
cp .env.example .env   # leave VITE_API_URL empty for local dev (Vite proxy handles it)
npm run dev
```

The frontend will be available at `http://localhost:8080`.

---

## Environment Variables

### Frontend (`.env`)

| Variable       | Description                                    | Default        |
| -------------- | ---------------------------------------------- | -------------- |
| `VITE_API_URL` | Backend API origin; leave empty in dev to use Vite proxy | *(empty)* |

### Backend (`backend/.env`)

| Variable                     | Description                                | Example                                                  |
| ---------------------------- | ------------------------------------------ | -------------------------------------------------------- |
| `APP_NAME`                   | Application name                           | `Cafe Kaya API`                                          |
| `DEBUG`                      | Enable debug mode                          | `false`                                                  |
| `CAFE_DATABASE_URL`          | PostgreSQL connection string (async); **required** | `postgresql+asyncpg://USER:PASSWORD@localhost:5432/DBNAME` |
| `JWT_SECRET`                 | Secret key for signing JWT tokens; **required**, min. 32 characters | *(generate a long random string)*                      |
| `JWT_ALGORITHM`              | JWT signing algorithm                      | `HS256`                                                  |
| `ACCESS_TOKEN_EXPIRE_MINUTES`| Token expiration in minutes                | `1440`                                                   |
| `CORS_ORIGINS`               | Allowed origins (comma-separated)          | `http://localhost:8080,http://localhost:5173`             |
| `CLOUDINARY_CLOUD_NAME`      | Cloudinary cloud name (optional)           | `your-cloud-name`                                        |
| `CLOUDINARY_API_KEY`         | Cloudinary API key (optional)              | `your-api-key`                                           |
| `CLOUDINARY_API_SECRET`      | Cloudinary API secret (optional)           | `your-api-secret`                                        |

---

## Security

- **Never commit `.env` files** — they contain secrets. Use `.env.example` as a template.
- **Always use GitHub Secrets** for production credentials in CI/CD workflows.
- **Never hardcode credentials** in workflow files or application code.

---

## API Documentation

The backend exposes interactive API documentation at `/docs` (Swagger UI) and `/redoc` (ReDoc). Below is a summary of all endpoints.

### Health

| Method | Endpoint   | Description     | Auth     |
| ------ | ---------- | --------------- | -------- |
| GET    | `/`        | Root info       | Public   |
| GET    | `/health`  | Health check    | Public   |

### Authentication

| Method | Endpoint         | Description             | Auth     |
| ------ | ---------------- | ----------------------- | -------- |
| POST   | `/api/auth/login`| Login, returns JWT      | Public   |
| GET    | `/api/auth/me`   | Get current user        | Admin    |

### Menu

| Method | Endpoint                  | Description              | Auth     |
| ------ | ------------------------- | ------------------------ | -------- |
| GET    | `/api/menu/categories`    | List all categories      | Public   |
| GET    | `/api/menu`               | List menu items          | Public   |
| GET    | `/api/menu/{item_id}`     | Get single menu item     | Public   |
| POST   | `/api/menu/categories`    | Create category          | Admin    |
| POST   | `/api/menu`               | Create menu item         | Admin    |
| PUT    | `/api/menu/{item_id}`     | Update menu item         | Admin    |
| DELETE | `/api/menu/{item_id}`     | Delete menu item         | Admin    |

### Gallery

| Method | Endpoint                  | Description              | Auth     |
| ------ | ------------------------- | ------------------------ | -------- |
| GET    | `/api/gallery`            | List gallery images      | Public   |
| POST   | `/api/gallery`            | Add gallery image        | Admin    |
| PUT    | `/api/gallery/reorder`    | Reorder images           | Admin    |
| PUT    | `/api/gallery/{image_id}` | Update image metadata    | Admin    |
| DELETE | `/api/gallery/{image_id}` | Delete gallery image     | Admin    |

### Reviews

| Method | Endpoint                      | Description              | Auth     |
| ------ | ----------------------------- | ------------------------ | -------- |
| GET    | `/api/reviews`                | List approved reviews    | Public   |
| GET    | `/api/reviews/rating`         | Get aggregate rating     | Public   |
| POST   | `/api/reviews`                | Submit a review          | Public   |
| GET    | `/api/reviews/pending`        | List pending reviews     | Admin    |
| PATCH  | `/api/reviews/{review_id}`    | Approve or reject        | Admin    |
| DELETE | `/api/reviews/{review_id}`    | Delete review            | Admin    |

### Contact

| Method | Endpoint                            | Description              | Auth     |
| ------ | ----------------------------------- | ------------------------ | -------- |
| POST   | `/api/contact`                      | Submit contact message   | Public   |
| GET    | `/api/contact`                      | List all messages        | Admin    |
| PATCH  | `/api/contact/{message_id}/read`    | Mark message as read     | Admin    |

### Settings

| Method | Endpoint                  | Description                     | Auth     |
| ------ | ------------------------- | ------------------------------- | -------- |
| GET    | `/api/settings/contact`   | Get contact and location info   | Public   |
| PUT    | `/api/settings/contact`   | Update contact and location     | Admin    |

### Upload

| Method | Endpoint        | Description                  | Auth     |
| ------ | --------------- | ---------------------------- | -------- |
| POST   | `/api/upload`   | Upload image (multipart)     | Admin    |

---

## Project Structure

```
cafe-kaya/
├── index.html                  # HTML entry point
├── package.json                # Frontend dependencies
├── vite.config.ts              # Vite configuration
├── vitest.config.ts            # Test configuration
├── tsconfig.json               # TypeScript configuration
├── tailwind.config.ts          # Tailwind CSS configuration
├── postcss.config.js           # PostCSS plugins
├── eslint.config.js            # ESLint configuration
├── components.json             # shadcn/ui configuration
├── .env.example                # Frontend env template
│
├── src/
│   ├── main.tsx                # Application entry point
│   ├── App.tsx                 # Root component with routing
│   ├── index.css               # Global styles and theme tokens
│   │
│   ├── components/             # Reusable UI components
│   │   ├── Navbar.tsx
│   │   ├── Footer.tsx
│   │   ├── HeroSection.tsx
│   │   ├── AboutSection.tsx
│   │   ├── MenuSection.tsx
│   │   ├── GallerySection.tsx
│   │   ├── ExperienceSection.tsx
│   │   ├── ReviewsSection.tsx
│   │   ├── LocationSection.tsx
│   │   ├── CTASection.tsx
│   │   ├── NavLink.tsx
│   │   ├── ProtectedRoute.tsx
│   │   └── ui/                 # shadcn/ui primitives
│   │
│   ├── pages/                  # Route-level components
│   │   ├── Index.tsx           # Public landing page
│   │   ├── Login.tsx           # Admin login
│   │   ├── NotFound.tsx        # 404 page
│   │   ├── Admin.tsx           # Admin layout
│   │   └── admin/              # Admin sub-pages
│   │       ├── AdminOverview.tsx
│   │       ├── AdminMenuPage.tsx
│   │       ├── AdminGalleryPage.tsx
│   │       ├── AdminMessagesPage.tsx
│   │       ├── AdminReviewsPage.tsx
│   │       └── AdminSettingsPage.tsx
│   │
│   ├── contexts/               # React context providers
│   │   └── AuthContext.tsx
│   │
│   ├── hooks/                  # Custom React hooks
│   │   ├── use-mobile.tsx
│   │   └── use-toast.ts
│   │
│   ├── lib/                    # Utilities and API client
│   │   ├── api.ts              # Backend API functions
│   │   └── utils.ts            # Shared helpers
│   │
│   └── test/                   # Test setup
│       ├── setup.ts
│       └── example.test.ts
│
└── backend/
    ├── Dockerfile              # Backend container image
    ├── docker-compose.yml      # PostgreSQL service
    ├── requirements.txt        # Python dependencies
    ├── alembic.ini             # Migration configuration
    ├── pytest.ini              # Test configuration
    ├── .env.example            # Backend env template
    │
    ├── app/
    │   ├── main.py             # FastAPI application
    │   ├── config.py           # Settings (pydantic-settings)
    │   ├── db.py               # Database engine and session
    │   ├── dependencies.py     # Dependency injection
    │   │
    │   ├── models/             # SQLAlchemy models
    │   │   ├── user.py
    │   │   ├── menu.py         # Category, MenuItem
    │   │   ├── gallery.py
    │   │   ├── review.py
    │   │   ├── contact.py
    │   │   └── settings.py
    │   │
    │   ├── routers/            # API route handlers
    │   │   ├── auth.py
    │   │   ├── menu.py
    │   │   ├── gallery.py
    │   │   ├── reviews.py
    │   │   ├── contact.py
    │   │   ├── settings.py
    │   │   └── upload.py
    │   │
    │   ├── schemas/            # Pydantic request/response models
    │   │   ├── auth.py
    │   │   ├── menu.py
    │   │   ├── gallery.py
    │   │   ├── review.py
    │   │   ├── contact.py
    │   │   └── settings.py
    │   │
    │   └── services/           # Business logic
    │       ├── auth.py         # Password hashing, JWT
    │       └── upload.py       # Cloudinary integration
    │
    ├── migrations/             # Alembic migrations
    │   └── versions/
    │
    ├── scripts/                # Utility scripts
    │   └── create_admin.py     # Seed admin user
    │
    └── tests/                  # Backend tests
        ├── conftest.py
        └── test_health.py
```

---

## Deployment

### Recommended Production Stack

| Layer     | Service                  | Notes                                    |
| --------- | ------------------------ | ---------------------------------------- |
| Frontend  | [Vercel](https://vercel.com) | Deploy from GitHub; set `VITE_API_URL` to backend origin |
| Backend   | [Render](https://render.com) | Web Service from Dockerfile; set all backend env vars |
| Database  | [Supabase](https://supabase.com) or Render PostgreSQL | Managed PostgreSQL instance |
| Storage   | [Cloudinary](https://cloudinary.com) | Image uploads and CDN delivery |

### Frontend Deployment (Vercel)

1. Import the repository on Vercel.
2. Set the **Root Directory** to `.` (project root).
3. Set the **Build Command** to `npm run build`.
4. Set the **Output Directory** to `dist`.
5. Add the environment variable `VITE_API_URL` pointing to your backend URL.

### Backend Deployment (Render)

1. Create a new **Web Service** on Render connected to this repository.
2. Set the **Root Directory** to `backend`.
3. Set the **Dockerfile Path** to `Dockerfile`.
4. Add all backend environment variables from the table above.
5. Run database migrations on deploy: `alembic upgrade head`.

---

## Developer

This project was fully designed and developed by:

**Festus Ndeto**

| | |
| --- | --- |
| GitHub | [github.com/Ndet0](https://github.com/Ndet0) |
| Portfolio | [festusdev.netlify.app](https://festusdev.netlify.app) |

**Roles:**
- Full Stack Developer
- UI/UX Engineer
- System Architect

---

## Contributing

Contributions are welcome. To get started:

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/your-feature`.
3. Commit your changes: `git commit -m "Add your feature"`.
4. Push to the branch: `git push origin feature/your-feature`.
5. Open a Pull Request.

Please ensure your code follows the existing style conventions, includes appropriate tests, and passes all linting checks before submitting.

---

## License

MIT License

Copyright (c) 2026 Festus Ndeto

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
