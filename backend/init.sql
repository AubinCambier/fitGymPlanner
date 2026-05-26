-- ============================================================
-- FitGym Planner — PostgreSQL Database Initialization
-- ============================================================

BEGIN;

-- ========================
-- RESET (idempotent)
-- ========================

DROP TABLE IF EXISTS reviews, payments, preferences, sanctions, coach_requests, memberships, pricing, bookings, sessions, session_types, users CASCADE;
DROP TYPE IF EXISTS user_role, payment_mode, membership_status, session_status, booking_status, request_status, sanction_type, intensity_level CASCADE;

-- ========================
-- TYPES ENUM
-- ========================

CREATE TYPE user_role AS ENUM ('ADMIN', 'COACH', 'MEMBER');
CREATE TYPE payment_mode AS ENUM ('MONTHLY', 'PAY_PER_SESSION');
CREATE TYPE membership_status AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELLED');
CREATE TYPE session_status AS ENUM ('SCHEDULED', 'CANCELLED', 'COMPLETED');
CREATE TYPE booking_status AS ENUM ('CONFIRMED', 'CANCELLED');
CREATE TYPE request_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE sanction_type AS ENUM ('WARNING', 'SUSPENSION', 'BAN');
CREATE TYPE intensity_level AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- ========================
-- TABLES
-- ========================

-- Users (admin, coach, member)
CREATE TABLE users (
    id              SERIAL PRIMARY KEY,
    email           VARCHAR(255) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    first_name      VARCHAR(100) NOT NULL,
    last_name       VARCHAR(100) NOT NULL,
    role            user_role NOT NULL DEFAULT 'MEMBER',
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Session types (Yoga, CrossFit, Pilates, etc.)
CREATE TABLE session_types (
    id      SERIAL PRIMARY KEY,
    name    VARCHAR(100) UNIQUE NOT NULL,
    description TEXT
);

-- Training sessions
CREATE TABLE sessions (
    id              SERIAL PRIMARY KEY,
    title           VARCHAR(255) NOT NULL,
    description     TEXT,
    session_type_id INTEGER NOT NULL REFERENCES session_types(id) ON DELETE RESTRICT,
    coach_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    start_time      TIMESTAMPTZ NOT NULL,
    end_time        TIMESTAMPTZ NOT NULL,
    capacity        INTEGER NOT NULL CHECK (capacity > 0),
    intensity       intensity_level NOT NULL DEFAULT 'MEDIUM',
    status          session_status NOT NULL DEFAULT 'SCHEDULED',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_session_dates CHECK (end_time > start_time)
);

-- Bookings (member <-> session)
CREATE TABLE bookings (
    id          SERIAL PRIMARY KEY,
    member_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id  INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    status      booking_status NOT NULL DEFAULT 'CONFIRMED',
    booked_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    cancelled_at TIMESTAMPTZ,

    CONSTRAINT uq_booking UNIQUE (member_id, session_id)
);

-- Pricing plans
CREATE TABLE pricing (
    id              SERIAL PRIMARY KEY,
    label           VARCHAR(100) NOT NULL,
    payment_mode    payment_mode NOT NULL,
    price           NUMERIC(8, 2) NOT NULL CHECK (price >= 0),
    currency        VARCHAR(3) NOT NULL DEFAULT 'EUR',
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Member memberships / subscriptions
-- end_date is set automatically: MONTHLY → start_date + 30 days, PAY_PER_SESSION → NULL
CREATE TABLE memberships (
    id              SERIAL PRIMARY KEY,
    member_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    pricing_id      INTEGER NOT NULL REFERENCES pricing(id) ON DELETE RESTRICT,
    payment_mode    payment_mode NOT NULL,
    status          membership_status NOT NULL DEFAULT 'ACTIVE',
    start_date      DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date        DATE GENERATED ALWAYS AS (
                        CASE WHEN payment_mode = 'MONTHLY'
                             THEN (start_date + INTERVAL '30 days')::DATE
                             ELSE NULL
                        END
                    ) STORED,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Session deletion requests (coach -> admin)
CREATE TABLE coach_requests (
    id              SERIAL PRIMARY KEY,
    coach_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id      INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    reason          TEXT NOT NULL,
    status          request_status NOT NULL DEFAULT 'PENDING',
    admin_id        INTEGER REFERENCES users(id) ON DELETE SET NULL,
    admin_comment   TEXT,
    decided_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_coach_request UNIQUE (coach_id, session_id)
);

-- Sanctions (admin -> user)
CREATE TABLE sanctions (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    issued_by       INTEGER NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    sanction_type   sanction_type NOT NULL,
    reason          TEXT NOT NULL,
    start_date      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_date        TIMESTAMPTZ,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Member preferences (for recommendations — Phase 6)
CREATE TABLE preferences (
    id              SERIAL PRIMARY KEY,
    member_id       INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    preferred_types INTEGER[] DEFAULT '{}',
    preferred_intensity intensity_level,
    preferred_days  VARCHAR(10)[] DEFAULT '{}',
    preferred_time_start TIME,
    preferred_time_end   TIME,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE payments (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount      NUMERIC(10, 2) NOT NULL,
    currency    VARCHAR(3) NOT NULL DEFAULT 'EUR',
    description TEXT NOT NULL,
    status      VARCHAR(10) NOT NULL DEFAULT 'SUCCESS',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE reviews (
    id           SERIAL PRIMARY KEY,
    booking_id   INTEGER NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
    member_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    coach_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating       SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment      TEXT,
    is_anonymous BOOLEAN NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ========================
-- INDEX
-- ========================

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_sessions_coach ON sessions(coach_id);
CREATE INDEX idx_sessions_type ON sessions(session_type_id);
CREATE INDEX idx_sessions_start ON sessions(start_time);
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_bookings_member ON bookings(member_id);
CREATE INDEX idx_bookings_session ON bookings(session_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_memberships_member ON memberships(member_id);
CREATE UNIQUE INDEX uq_active_membership ON memberships(member_id) WHERE status = 'ACTIVE';
CREATE INDEX idx_coach_requests_status ON coach_requests(status);
CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_reviews_coach ON reviews(coach_id);
CREATE INDEX idx_reviews_member ON reviews(member_id);
CREATE INDEX idx_sanctions_user ON sanctions(user_id);
CREATE INDEX idx_sanctions_active ON sanctions(is_active) WHERE is_active = TRUE;

-- ========================
-- TRIGGERS
-- ========================

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trg_sessions_updated
    BEFORE UPDATE ON sessions
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trg_memberships_updated
    BEFORE UPDATE ON memberships
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trg_preferences_updated
    BEFORE UPDATE ON preferences
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trg_reviews_updated
    BEFORE UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Prevent booking when session is full
CREATE OR REPLACE FUNCTION check_session_capacity()
RETURNS TRIGGER AS $$
DECLARE
    current_count INTEGER;
    max_capacity  INTEGER;
BEGIN
    SELECT COUNT(*) INTO current_count
    FROM bookings
    WHERE session_id = NEW.session_id AND status = 'CONFIRMED';

    SELECT capacity INTO max_capacity
    FROM sessions
    WHERE id = NEW.session_id;

    IF current_count >= max_capacity THEN
        RAISE EXCEPTION 'Session full: % / % spots', current_count, max_capacity;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_capacity
    BEFORE INSERT ON bookings
    FOR EACH ROW EXECUTE FUNCTION check_session_capacity();

-- Prevent coach from requesting deletion of another coach's session
CREATE OR REPLACE FUNCTION check_coach_owns_session()
RETURNS TRIGGER AS $$
DECLARE
    session_coach INTEGER;
BEGIN
    SELECT coach_id INTO session_coach
    FROM sessions
    WHERE id = NEW.session_id;

    IF session_coach != NEW.coach_id THEN
        RAISE EXCEPTION 'A coach can only request deletion of their own sessions';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_coach_owns_session
    BEFORE INSERT ON coach_requests
    FOR EACH ROW EXECUTE FUNCTION check_coach_owns_session();

-- ========================
-- SEED DATA
-- ========================

-- Default session types
INSERT INTO session_types (name, description) VALUES
    ('Yoga',        'Yoga session: flexibility, breathing and relaxation'),
    ('CrossFit',    'High intensity training combining cardio and strength'),
    ('Pilates',     'Core and deep muscle strengthening exercises'),
    ('Cardio',      'Cardiovascular activity: bike, run, rowing'),
    ('Weightlifting','Muscle strengthening with free weights or machines'),
    ('Boxing',      'Boxing class: technique and cardio'),
    ('Stretching',  'Stretching and muscle recovery');

-- Default pricing plans
INSERT INTO pricing (label, payment_mode, price) VALUES
    ('Monthly membership',         'MONTHLY',         29.99),
    ('Pay per session',            'PAY_PER_SESSION',   8.00),
    ('Premium monthly membership', 'MONTHLY',          49.99);

-- Default accounts (change passwords in production!)
-- admin password: admin123 — coach password: password123
INSERT INTO users (email, password_hash, first_name, last_name, role) VALUES
    ('admin@fitgym.com', '$2b$12$txhIwfCXVlVUtCk.xrNexeu.UcU/w0vWBReRhu8wSQYX7ADG1ekKO', 'Admin', 'FitGym', 'ADMIN'),
    ('coach@fitgym.com', '$2b$12$ardfn3KoVHwWEUaNk5MKwewLsgf4enveTCw8DuN8YCyldtmJCoKrW', 'Coach', 'FitGym', 'COACH');

-- Demo sessions (coach_id=2, session_type_ids: 1=Yoga 2=CrossFit 3=Pilates 4=Cardio 5=Weightlifting 6=Boxing 7=Stretching)
INSERT INTO sessions (title, description, session_type_id, coach_id, start_time, end_time, capacity, intensity) VALUES
    ('Morning Yoga Flow',
     'Start your day with a gentle flow to awaken your body and calm your mind. All levels welcome.',
     1, 2, '2026-06-02 08:00:00+02', '2026-06-02 09:00:00+02', 15, 'LOW'),

    ('CrossFit WOD — Strength & Cardio',
     'High-intensity workout of the day combining Olympic lifting and metabolic conditioning.',
     2, 2, '2026-06-03 07:00:00+02', '2026-06-03 08:00:00+02', 12, 'HIGH'),

    ('Core Pilates',
     'Deep core engagement and controlled movements to build stability and improve posture. Beginners welcome.',
     3, 2, '2026-06-04 10:00:00+02', '2026-06-04 11:00:00+02', 10, 'MEDIUM'),

    ('Cardio Blast',
     'Bike, rowing and running intervals to push your cardiovascular endurance to the limit.',
     4, 2, '2026-06-05 06:30:00+02', '2026-06-05 07:30:00+02', 20, 'HIGH'),

    ('Upper Body Strength',
     'Focused session on chest, back, shoulders and arms using free weights and cables.',
     5, 2, '2026-06-06 11:00:00+02', '2026-06-06 12:30:00+02', 8, 'MEDIUM'),

    ('Boxing Fundamentals',
     'Learn the basics: stance, jab, cross, hooks and footwork. Great for cardio and coordination.',
     6, 2, '2026-06-07 18:00:00+02', '2026-06-07 19:00:00+02', 10, 'MEDIUM'),

    ('Power Lifting — Lower Body',
     'Squats, deadlifts and accessory work. Technique focus with progressive overload.',
     5, 2, '2026-06-09 17:00:00+02', '2026-06-09 18:30:00+02', 6, 'HIGH'),

    ('Flexibility & Recovery',
     'Guided stretching and myofascial release to reduce soreness and improve mobility.',
     7, 2, '2026-06-10 19:00:00+02', '2026-06-10 19:45:00+02', 20, 'LOW'),

    ('HIIT Cardio Circuit',
     'Alternating work and rest intervals with bodyweight and light equipment. Maximum calorie burn.',
     4, 2, '2026-06-11 07:00:00+02', '2026-06-11 08:00:00+02', 15, 'HIGH'),

    ('Vinyasa Yoga',
     'Dynamic flow linking breath to movement. Builds strength, flexibility and mindfulness.',
     1, 2, '2026-06-12 09:00:00+02', '2026-06-12 10:00:00+02', 12, 'MEDIUM'),

    ('Advanced CrossFit — Olympic Lifting',
     'Snatches, clean & jerk and complex barbell cycling. For experienced athletes only.',
     2, 2, '2026-06-14 18:00:00+02', '2026-06-14 19:00:00+02', 10, 'HIGH'),

    ('Pilates for Beginners',
     'Introduction to the Pilates method. Slow pace, clear cues, focus on breathing and alignment.',
     3, 2, '2026-06-16 11:00:00+02', '2026-06-16 12:00:00+02', 12, 'LOW');

-- Demo member account (password: password123) — id=3
INSERT INTO users (email, password_hash, first_name, last_name, role) VALUES
    ('member@fitgym.com', '$2b$12$ardfn3KoVHwWEUaNk5MKwewLsgf4enveTCw8DuN8YCyldtmJCoKrW', 'Alex', 'Johnson', 'MEMBER');

-- Past sessions (COMPLETED) — ids 13–17
INSERT INTO sessions (title, description, session_type_id, coach_id, start_time, end_time, capacity, intensity, status) VALUES
    ('Morning Yoga Flow',        'Gentle flow session for mind and body.',            1, 2, '2026-01-12 08:00:00+01', '2026-01-12 09:00:00+01', 15, 'LOW',    'COMPLETED'),
    ('CrossFit WOD — Strength',  'High intensity workout of the day.',                2, 2, '2026-01-26 07:00:00+01', '2026-01-26 08:00:00+01', 12, 'HIGH',   'COMPLETED'),
    ('Core Pilates',             'Deep core and stability work.',                     3, 2, '2026-02-09 10:00:00+01', '2026-02-09 11:00:00+01', 10, 'MEDIUM', 'COMPLETED'),
    ('Cardio Blast',             'High intensity cardio circuit.',                    4, 2, '2026-02-23 06:30:00+01', '2026-02-23 07:30:00+01', 20, 'HIGH',   'COMPLETED'),
    ('Boxing Fundamentals',      'Boxing technique and cardio conditioning.',         6, 2, '2026-03-09 18:00:00+01', '2026-03-09 19:00:00+01', 10, 'MEDIUM', 'COMPLETED');

-- Active monthly membership for demo member (starts May 10 → expires June 9)
INSERT INTO memberships (member_id, pricing_id, payment_mode, status, start_date) VALUES
    (3, 1, 'MONTHLY', 'ACTIVE', '2026-05-10');

-- Bookings: 5 past sessions + 2 upcoming — ids 1–7
INSERT INTO bookings (member_id, session_id, status) VALUES
    (3, 13, 'CONFIRMED'),
    (3, 14, 'CONFIRMED'),
    (3, 15, 'CONFIRMED'),
    (3, 16, 'CONFIRMED'),
    (3, 17, 'CONFIRMED'),
    (3,  1, 'CONFIRMED'),
    (3,  3, 'CONFIRMED');

-- Payment history: 4 pay-per-session + 1 membership subscription
INSERT INTO payments (user_id, amount, description) VALUES
    (3,  8.00, 'Session booking: Morning Yoga Flow — Jan 12'),
    (3,  8.00, 'Session booking: CrossFit WOD — Jan 26'),
    (3,  8.00, 'Session booking: Core Pilates — Feb 9'),
    (3,  8.00, 'Session booking: Cardio Blast — Feb 23'),
    (3, 29.99, 'Monthly membership subscription — May 2026');

-- Reviews for 4 completed sessions (booking ids 1–4)
INSERT INTO reviews (booking_id, member_id, coach_id, rating, comment, is_anonymous) VALUES
    (1, 3, 2, 5, 'Amazing session! Very motivating and the flow was perfect for a Monday morning. Will definitely be back.', FALSE),
    (2, 3, 2, 4, 'Tough but rewarding. Great intensity and good pacing throughout.', FALSE),
    (3, 3, 2, 5, 'Loved the core work. My posture and stability have improved a lot since starting these sessions.', TRUE),
    (4, 3, 2, 3, 'Good session but started a bit late. Would appreciate more personalized feedback.', FALSE);

COMMIT;
