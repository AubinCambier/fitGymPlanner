# FitGym Planner — Frontend Design

## Context

Web frontend for the FitGym Planner REST API (Express + PostgreSQL).
3 roles on the backend: ADMIN, COACH, MEMBER.
Initial scope: MEMBER role only. COACH and ADMIN added afterwards.

---

## Tech Stack

| Tool | Role |
|---|---|
| Vue 3 + Vite + TypeScript | Framework + bundler + typing |
| Vue Router | Navigation between pages |
| Pinia | Global state (JWT token, logged-in user) |
| CSS scoped (`<style scoped>`) | Per-component styles, no CSS framework |
| Native Fetch | HTTP calls to the API |

Vue 3 chosen over React: gentler learning curve, more readable syntax, easier to explain.
Plain CSS chosen: no extra dependency, full control, consistent with the provided login mockup.

---

## Repo Organisation

Monorepo: backend and frontend in the same Git repository.

```
fitGymPlanner/
├── backend/        ← Express API (existing)
├── frontend/       ← Vue 3 (to be created)
├── docker-compose.yml
├── CLAUDE.md
└── README.md
```

The frontend has its own `package.json` and `node_modules`.
API runs on `http://localhost:3000`, frontend on `http://localhost:5173` (Vite default).

---

## Frontend Architecture

4-layer architecture, inspired by the backend MVC:

| Layer | Folder | Responsibility |
|---|---|---|
| API | `src/api/` | Fetch functions to the backend |
| Global state | `src/stores/` | JWT token + user (Pinia) |
| Routing | `src/router/` | Routes + navigation guard |
| UI | `src/views/` + `src/components/` | Pages and reusable components |

---

## File Structure

```
frontend/src/
├── api/
│   ├── auth.ts          ← login, register, getMe, updateProfile
│   ├── sessions.ts      ← getSessions, getSessionById
│   ├── bookings.ts      ← getBookings, createBooking, cancelBooking
│   └── membership.ts    ← getMembership, subscribe, cancelMembership
│
├── stores/
│   └── auth.ts          ← { token, user } + login(), logout()
│
├── router/
│   └── index.ts         ← routes + navigation guard
│
├── views/
│   ├── LoginView.vue
│   ├── RegisterView.vue
│   └── member/
│       ├── DashboardView.vue
│       ├── SessionsView.vue
│       ├── BookingsView.vue
│       ├── MembershipView.vue
│       └── ProfileView.vue
│
├── components/
│   ├── AppHeader.vue
│   ├── SessionCard.vue
│   └── BookingCard.vue
│
├── App.vue
└── main.ts
```

---

## Pages — MEMBER Scope

| Route | View | Access | Description |
|---|---|---|---|
| `/login` | `LoginView.vue` | Public | Login form |
| `/register` | `RegisterView.vue` | Public | Registration form |
| `/member/dashboard` | `DashboardView.vue` | MEMBER | Summary: upcoming bookings, membership status |
| `/member/sessions` | `SessionsView.vue` | MEMBER | Available sessions list + book button |
| `/member/bookings` | `BookingsView.vue` | MEMBER | My bookings + cancel button |
| `/member/membership` | `MembershipView.vue` | MEMBER | My membership + subscribe / cancel |
| `/member/profile` | `ProfileView.vue` | MEMBER | Edit name, email, password |

---

## JWT Token Management

**Storage:** `localStorage` (persists after browser close).

**Login flow:**
1. Login → API returns `{ token, user }`
2. Pinia store saves `token` and `user`
3. `localStorage.setItem('token', ...)` + `localStorage.setItem('user', ...)`
4. Redirect to `/member/dashboard` based on role

**Logout flow:**
1. `logout()` called on Pinia store
2. Clears `token` and `user` from the store
3. `localStorage.removeItem('token')` + `localStorage.removeItem('user')`
4. Redirect to `/login`

**Startup hydration:**
In `main.ts` or `App.vue`: read `localStorage` and rehydrate the Pinia store if a token exists.

**Navigation guard (router):**
```ts
router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.token) {
    return '/login'
  }
})
```

**Sending the token in every request:**
```ts
// api/auth.ts — pattern repeated in every api/ file
const token = useAuthStore().token
fetch(url, {
  headers: { Authorization: `Bearer ${token}` }
})
```

---

## Visual Design

Reference: provided login mockup (plain HTML/CSS).
- Palette: white background / dark navy (`#0F172A`) + emerald green (`#10B981`)
- Fonts: Outfit (headings) + DM Sans (body)
- Style: clean cards, inputs with icons, buttons with loading state

Each Vue component uses `<style scoped>` with the same CSS variables:
```css
:root {
  --primary: #0F172A;
  --accent: #10B981;
  --accent-hover: #059669;
  --border: #E2E8F0;
  --text-muted: #64748B;
}
```

These variables are defined in a global `src/assets/main.css` file imported in `main.ts`.

---

## Implementation Order

1. Vite + Vue Router + Pinia setup
2. `stores/auth.ts` + `api/auth.ts`
3. `LoginView.vue` (based on the mockup)
4. `RegisterView.vue`
5. Navigation guard + `AppHeader.vue`
6. `api/sessions.ts` + `SessionsView.vue`
7. `api/bookings.ts` + `BookingsView.vue`
8. `DashboardView.vue` (aggregates sessions + bookings)
9. `api/membership.ts` + `MembershipView.vue`
10. `ProfileView.vue`

---

## Future Extensions (out of initial scope)

- COACH dashboard: own sessions, participants, cancellation requests
- ADMIN dashboard: users, sanctions, pricing, session types
- Mobile app (React Native or Flutter) consuming the same REST backend
