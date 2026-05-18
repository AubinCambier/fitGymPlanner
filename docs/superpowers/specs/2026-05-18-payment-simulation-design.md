# Payment Simulation — Design Spec

## Goal

Allow members to pay for bookings (when no active monthly membership) and for subscriptions via a simulated credit card flow. All transactions are recorded in the database.

---

## 1. Architecture

- **`PaymentModal.vue`** — reusable modal component. Takes `amount` and `description` as props. Shows a fake card form, a 2-second processing animation, then a success screen. Emits `success` or `cancel`.
- **Booking flow**: before creating a booking, check if the member has an active MONTHLY membership (via Pinia store). If not, open `PaymentModal`. On `success`: create booking + record payment via `POST /payments`.
- **Subscription flow**: before subscribing, open `PaymentModal` with the plan price. On `success`: create subscription + record payment via `POST /payments`.
- **Payment history**: visible in member profile via `GET /payments/me`.

---

## 2. Database

New table added to `init.sql`:

```sql
CREATE TABLE payments (
  id           SERIAL PRIMARY KEY,
  user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount       NUMERIC(10, 2) NOT NULL,
  currency     VARCHAR(3) NOT NULL DEFAULT 'EUR',
  description  TEXT NOT NULL,
  status       VARCHAR(10) NOT NULL DEFAULT 'SUCCESS',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

- `amount` in euros (e.g. `12.99`)
- `description` carries context: `"Session booking #42"` or `"Monthly membership — FitGym Pro"`
- `status` is always `'SUCCESS'` (simulation — no failure path)
- No FK to `bookings` or `memberships` — decoupled by design

---

## 3. Backend API

**Routes** (both MEMBER only, behind `authenticate → checkActive → authorize('MEMBER')`):

| Method | Path           | Description                        |
|--------|----------------|------------------------------------|
| POST   | /payments      | Record a payment                   |
| GET    | /payments/me   | Get authenticated member's history |

**POST /payments body:**
```json
{ "amount": 12.99, "description": "Session booking #42" }
```

**Response format** (all endpoints):
```json
{ "status": "success", "data": { ... } }
```

**Files:**
- `backend/src/models/paymentModel.ts` — `create()`, `findByUser(userId)`
- `backend/src/controllers/paymentController.ts` — `create`, `getMyPayments`
- `backend/src/validators/paymentValidator.ts` — Zod schema for POST body
- `backend/src/routes/paymentRoutes.ts` — route wiring

---

## 4. Frontend

### `PaymentModal.vue`

Props: `amount: number`, `description: string`
Emits: `success`, `cancel`

States:
1. **Form** — fake card fields (number, expiry, CVV, cardholder name). "Pay €X.XX" button.
2. **Processing** — 2-second spinner animation after submit.
3. **Success** — checkmark + "Payment confirmed" message. Emits `success`.

```
┌─────────────────────────────────┐
│  Payment                        │
│  Session booking · €12.99       │
│                                 │
│  Card number                    │
│  [1234 5678 9012 3456        ]  │
│                                 │
│  Expiry          CVV            │
│  [MM/YY      ]  [123   ]        │
│                                 │
│  Cardholder name                │
│  [John Doe                   ]  │
│                                 │
│  [Cancel]    [Pay €12.99 →]     │
└─────────────────────────────────┘
```

### Integration points

- **`MemberSessionsView.vue`** (or `SessionCard`): check active MONTHLY membership in Pinia store before booking. If none → open `PaymentModal`. On `success` → `apiCreateBooking` + `apiCreatePayment`.
- **`MemberMembershipView.vue`**: before subscribing → open `PaymentModal` with plan price. On `success` → subscribe API + `apiCreatePayment`.
- **`MemberProfileView.vue`**: new "Payment history" section, fetches `apiGetMyPayments`.

### New files

- `frontend/src/api/payments.ts` — `apiCreatePayment(data)`, `apiGetMyPayments()`

---

## 5. Tests

### Bruno API tests (`bruno/Payments/`)

| # | Test |
|---|------|
| 01 | Create payment — success (member) |
| 02 | Create payment — access denied (coach) |
| 03 | Create payment — access denied (admin) |
| 04 | Create payment — no token |
| 05 | Create payment — invalid body |
| 06 | Get my payments — success |
| 07 | Get my payments — access denied (coach) |
| 08 | Get my payments — no token |

### Vitest frontend tests

**`frontend/src/components/__tests__/PaymentModal.test.ts`:**
- renders `amount` and `description` correctly
- shows spinner on submit, then emits `success` after animation
- emits `cancel` when cancel button is clicked

**`frontend/src/api/__tests__/payments.test.ts`:**
- `apiCreatePayment` sends correct POST body with auth headers
- `apiGetMyPayments` returns payment array

---

## Out of Scope

- Real payment provider (Stripe, PayPal)
- Payment failure paths
- Admin payment dashboard
- PDF receipts
