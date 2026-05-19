# FitGym Planner

A fullstack gym management web application built with Node.js, Express, PostgreSQL and Vue 3.

Three roles with distinct permissions: **ADMIN**, **COACH**, **MEMBER**.

---

## Tech Stack

| Layer      | Technology                              |
|------------|-----------------------------------------|
| Runtime    | Node.js 22                              |
| Framework  | Express + TypeScript (strict mode)      |
| Database   | PostgreSQL 16 — raw SQL, no ORM         |
| Auth       | JWT (`jsonwebtoken`)                    |
| Validation | Zod                                     |
| Emails     | Nodemailer                              |
| Frontend   | Vue 3 + Vite + TypeScript               |
| State      | Pinia                                   |
| Routing    | Vue Router 4                            |
| Tests      | Vitest (frontend) + Bruno (API)         |
| Infra      | Docker + Docker Compose                 |

---

## Project Structure

```
fitGymPlanner/
├── backend/
│   ├── src/
│   │   ├── config/         ← PostgreSQL pool
│   │   ├── controllers/    ← request/response logic
│   │   ├── middlewares/    ← authenticate, authorize, checkActive, validateBody, errorHandler
│   │   ├── models/         ← raw SQL queries
│   │   ├── routes/         ← URL binding + middleware chaining
│   │   ├── utils/          ← JwtManager, AppError, mailer
│   │   └── validators/     ← Zod schemas
│   ├── bruno/              ← 141 API test requests (Bruno)
│   ├── init.sql            ← full DB schema, enums, triggers, seed data
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/            ← fetch wrappers per module
│   │   ├── components/     ← reusable components
│   │   ├── router/         ← Vue Router with role-based guards
│   │   ├── stores/         ← Pinia auth store
│   │   └── views/          ← pages split by role (admin/, coach/, member/)
│   └── package.json
├── docker-compose.yml
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js 22+
- Docker + Docker Compose

### 1. Start the database

```bash
docker compose up -d db
```

PostgreSQL starts on port `5433`. The `init.sql` schema is applied automatically on first start.

### 2. Start the backend

```bash
cd backend
cp .env.example .env   # fill in JWT_SECRET and mail credentials
npm install
npm run dev
```

API available at `http://localhost:3000`.

### 3. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend available at `http://localhost:5173`.

---

## Environment Variables

Create `backend/.env` from `backend/.env.example`:

```env
DATABASE_URL=postgresql://fitgym:fitgym@localhost:5433/fitgym
JWT_SECRET=your_secret_here
PORT=3000
MAIL_HOST=smtp.example.com
MAIL_PORT=587
MAIL_USER=your@email.com
MAIL_PASS=your_password
MAIL_FROM=noreply@fitgym.com
```

---

## Database

11 tables: `users`, `session_types`, `sessions`, `bookings`, `pricing`, `memberships`, `coach_requests`, `sanctions`, `preferences`, `payments`, `reviews`.

PostgreSQL enums: `user_role`, `payment_mode`, `membership_status`, `session_status`, `booking_status`, `request_status`, `sanction_type`, `intensity_level`.

3 PL/pgSQL triggers:
- `update_timestamp` — auto-updates `updated_at` on every row change
- `check_session_capacity` — blocks booking inserts when session is full
- `check_coach_owns_session` — blocks deletion requests for sessions the coach doesn't own

---

## API Reference

Base URL: `/api/v1`

### Auth — public
| Method | Route              | Description                  |
|--------|--------------------|------------------------------|
| POST   | `/auth/register`   | Register a new member        |
| POST   | `/auth/login`      | Login, returns JWT (rate-limited: 10 req/15 min) |
| GET    | `/auth/me`         | Get current user profile     |
| PUT    | `/auth/me`         | Update profile / password    |

### Session Types
| Method | Route                        | Role   |
|--------|------------------------------|--------|
| GET    | `/session-types`             | All    |
| POST   | `/admin/session-types`       | ADMIN  |
| PUT    | `/admin/session-types/:id`   | ADMIN  |
| DELETE | `/admin/session-types/:id`   | ADMIN  |

### Sessions
| Method | Route                          | Role              |
|--------|--------------------------------|-------------------|
| GET    | `/sessions`                    | All (`?type=&date=&coach_id=`) |
| GET    | `/sessions/:id`                | All               |
| POST   | `/sessions`                    | ADMIN, COACH      |
| PUT    | `/sessions/:id`                | ADMIN, COACH (owner) |
| DELETE | `/sessions/:id`                | ADMIN             |
| GET    | `/sessions/:id/participants`   | ADMIN, COACH (owner) |

### Bookings
| Method | Route                    | Role   |
|--------|--------------------------|--------|
| GET    | `/bookings`              | MEMBER |
| POST   | `/bookings`              | MEMBER |
| PATCH  | `/bookings/:id/cancel`   | MEMBER |

### Pricing
| Method | Route                          | Role   |
|--------|--------------------------------|--------|
| GET    | `/pricing`                     | All    |
| POST   | `/admin/pricing`               | ADMIN  |
| PUT    | `/admin/pricing/:id`           | ADMIN  |
| PATCH  | `/admin/pricing/:id/status`    | ADMIN  |

### Memberships
| Method | Route                   | Role   |
|--------|-------------------------|--------|
| GET    | `/memberships/me`       | MEMBER |
| POST   | `/memberships`          | MEMBER |
| PATCH  | `/memberships/me/cancel`| MEMBER |

### Admin — Users
| Method | Route                        | Role  |
|--------|------------------------------|-------|
| GET    | `/admin/users`               | ADMIN (`?role=&active=`) |
| GET    | `/admin/users/:id`           | ADMIN |
| POST   | `/admin/users`               | ADMIN |
| PUT    | `/admin/users/:id`           | ADMIN |
| PATCH  | `/admin/users/:id/status`    | ADMIN |

### Admin — Sanctions
| Method | Route                    | Role  |
|--------|--------------------------|-------|
| GET    | `/admin/sanctions`       | ADMIN |
| GET    | `/admin/sanctions/:id`   | ADMIN |
| POST   | `/admin/sanctions`       | ADMIN |
| PATCH  | `/admin/sanctions/:id`   | ADMIN |

### Admin — Coach Requests
| Method | Route                      | Role  |
|--------|----------------------------|-------|
| GET    | `/admin/requests`          | ADMIN (`?status=PENDING`) |
| PATCH  | `/admin/requests/:id`      | ADMIN |

### Coach
| Method | Route                               | Role  |
|--------|-------------------------------------|-------|
| GET    | `/coach/sessions`                   | COACH |
| GET    | `/coach/sessions/:id/participants`  | COACH (owner) |
| GET    | `/coach/requests`                   | COACH |
| POST   | `/coach/requests`                   | COACH |

### Payments
| Method | Route           | Role   |
|--------|-----------------|--------|
| POST   | `/payments`     | MEMBER |
| GET    | `/payments/me`  | MEMBER |

### Reviews
| Method | Route                       | Role         |
|--------|-----------------------------|--------------|
| POST   | `/reviews`                  | MEMBER       |
| PUT    | `/reviews/:id`              | MEMBER (own) |
| GET    | `/reviews/mine`             | MEMBER       |
| GET    | `/reviews/coach/:coachId`   | Public       |

---

## Roles & Permissions

| Feature                        | MEMBER | COACH | ADMIN |
|--------------------------------|:------:|:-----:|:-----:|
| Browse sessions                | ✓      | ✓     | ✓     |
| Book / cancel a session        | ✓      |       |       |
| Manage membership              | ✓      |       |       |
| Simulate payments              | ✓      |       |       |
| Rate completed sessions        | ✓      |       |       |
| View coach profile & reviews   | ✓      | ✓     | ✓     |
| Create / edit sessions         |        | ✓     | ✓     |
| View session participants      |        | ✓     | ✓     |
| Submit deletion requests       |        | ✓     |       |
| Approve / reject requests      |        |       | ✓     |
| Manage all users               |        |       | ✓     |
| Apply / lift sanctions         |        |       | ✓     |
| Manage session types           |        |       | ✓     |
| Manage pricing plans           |        |       | ✓     |

---

## Authentication

All protected routes require:
```
Authorization: Bearer <token>
```

The token contains `id`, `role`, `email` and a fingerprint derived from the password hash — changing the password instantly invalidates all existing tokens.

Middleware chain for protected routes: `authenticate → checkActive → authorize(role)`

- `authenticate` — verifies the JWT, loads the user, blocks disabled accounts
- `checkActive` — auto-lifts expired suspensions; blocks accounts with an active SUSPENSION or BAN
- `authorize` — checks the user's role against the required role

---

## Testing

### Bruno (API tests — backend)

165 request files organized by module. Open the `backend/bruno/` folder in [Bruno](https://www.usebruno.com/) and run the `Local` environment.

Covers: authentication, RBAC (role-based access), CRUD operations, Zod validation, business rules, edge cases and error handling.

### Vitest (frontend)

```bash
cd frontend
npm run test:unit
```

88 tests across 13 files: Pinia store, API wrappers, components, views.

---

## Scripts

```bash
# Backend
npm run dev       # dev with hot reload (tsx watch)
npm run build     # compile TypeScript → dist/

# Frontend
npm run dev       # Vite dev server
npm run build     # production build
npm run test:unit # run Vitest tests

# Docker
docker compose up -d          # start db + app
docker compose down -v        # stop and delete volumes
docker compose exec db psql -U fitgym -d fitgym   # psql shell
```
