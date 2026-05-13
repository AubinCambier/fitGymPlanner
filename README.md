# FitGym Planner

REST API for gym management with a web frontend.
3 roles: ADMIN, COACH, MEMBER.

## Stack

| Layer | Tech |
|---|---|
| Runtime | Node.js 22 |
| Framework | Express + TypeScript |
| Database | PostgreSQL 16 |
| Auth | JWT (jsonwebtoken) |
| Frontend | Vue 3 + Vite + TypeScript |

## Project Structure

```
fitGymPlanner/
├── backend/        ← Express REST API
│   ├── src/
│   ├── bruno/      ← API tests (Bruno)
│   ├── init.sql    ← DB schema + seed data
│   └── package.json
├── frontend/       ← Vue 3 web app
│   └── package.json
└── docker-compose.yml
```

## Getting Started

### Prerequisites

- Node.js 22+
- Docker + Docker Compose

### Run the backend

```bash
# Start PostgreSQL
docker compose up -d db

# Install dependencies
cd backend
cp .env.example .env
npm install
npm run dev
```

API available at `http://localhost:3000`.

### Run the frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend available at `http://localhost:5173`.

## Environment Variables

Create `backend/.env` from `backend/.env.example`:

```
DATABASE_URL=postgresql://fitgym:fitgym@localhost:5433/fitgym
JWT_SECRET=your_secret_here
PORT=3000
```

## API

Base URL: `/api/v1`

Main routes:
- `POST /auth/login` — login, returns JWT
- `GET /sessions` — list sessions
- `POST /bookings` — book a session (MEMBER)
- `GET /coach/sessions` — coach's own sessions (COACH)
- `GET /admin/users` — list all users (ADMIN)

See `docs/` for full API reference and architecture.

## Scripts

```bash
# Backend
npm run dev     # dev with hot reload
npm run build   # compile TS → JS

# Docker
docker compose up -d          # start everything
docker compose down -v        # stop + delete volumes
```
