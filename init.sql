-- ============================================================
-- FitGym Planner — PostgreSQL Database Initialization
-- ============================================================

BEGIN;

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

-- Utilisateurs (admin, coach, membre)
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

-- Types de session (Yoga, CrossFit, Pilates, etc.)
CREATE TABLE session_types (
    id      SERIAL PRIMARY KEY,
    name    VARCHAR(100) UNIQUE NOT NULL,
    description TEXT
);

-- Sessions de cours
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

-- Réservations (membre <-> session)
CREATE TABLE bookings (
    id          SERIAL PRIMARY KEY,
    member_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id  INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    status      booking_status NOT NULL DEFAULT 'CONFIRMED',
    booked_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    cancelled_at TIMESTAMPTZ,

    CONSTRAINT uq_booking UNIQUE (member_id, session_id)
);

-- Tarifs
CREATE TABLE pricing (
    id              SERIAL PRIMARY KEY,
    label           VARCHAR(100) NOT NULL,
    payment_mode    payment_mode NOT NULL,
    price           NUMERIC(8, 2) NOT NULL CHECK (price >= 0),
    currency        VARCHAR(3) NOT NULL DEFAULT 'EUR',
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Abonnements / adhésions des membres
CREATE TABLE memberships (
    id              SERIAL PRIMARY KEY,
    member_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    pricing_id      INTEGER NOT NULL REFERENCES pricing(id) ON DELETE RESTRICT,
    payment_mode    payment_mode NOT NULL,
    status          membership_status NOT NULL DEFAULT 'ACTIVE',
    start_date      DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date        DATE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Demandes de suppression de session (coach -> admin)
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

-- Sanctions (admin -> utilisateur)
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

-- Préférences des membres (pour les recommandations — Phase 6)
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
CREATE INDEX idx_coach_requests_status ON coach_requests(status);
CREATE INDEX idx_sanctions_user ON sanctions(user_id);
CREATE INDEX idx_sanctions_active ON sanctions(is_active) WHERE is_active = TRUE;

-- ========================
-- TRIGGERS
-- ========================

-- Mise à jour automatique de updated_at
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

-- Vérifier que la capacité n'est pas dépassée avant un booking
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
        RAISE EXCEPTION 'Session complète : % / % places', current_count, max_capacity;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_capacity
    BEFORE INSERT ON bookings
    FOR EACH ROW EXECUTE FUNCTION check_session_capacity();

-- Vérifier qu'un coach ne crée des sessions que pour lui-même
CREATE OR REPLACE FUNCTION check_coach_owns_session()
RETURNS TRIGGER AS $$
DECLARE
    session_coach INTEGER;
BEGIN
    SELECT coach_id INTO session_coach
    FROM sessions
    WHERE id = NEW.session_id;

    IF session_coach != NEW.coach_id THEN
        RAISE EXCEPTION 'Un coach ne peut demander la suppression que de ses propres sessions';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_coach_owns_session
    BEFORE INSERT ON coach_requests
    FOR EACH ROW EXECUTE FUNCTION check_coach_owns_session();

-- ========================
-- DONNÉES INITIALES
-- ========================

-- Types de session par défaut
INSERT INTO session_types (name, description) VALUES
    ('Yoga',       'Séance de yoga : souplesse, respiration et relaxation'),
    ('CrossFit',   'Entraînement haute intensité mêlant cardio et renforcement'),
    ('Pilates',    'Exercices de gainage et renforcement musculaire profond'),
    ('Cardio',     'Activité cardiovasculaire : vélo, course, rameur'),
    ('Musculation','Renforcement musculaire avec charges libres ou machines'),
    ('Boxing',     'Cours de boxe : technique et cardio'),
    ('Stretching', 'Étirements et récupération musculaire');

-- Tarifs par défaut
INSERT INTO pricing (label, payment_mode, price) VALUES
    ('Abonnement mensuel',      'MONTHLY',         29.99),
    ('Séance à l''unité',       'PAY_PER_SESSION',   8.00),
    ('Abonnement mensuel premium', 'MONTHLY',       49.99);

-- Compte admin par défaut (mot de passe à changer en prod !)
-- hash = bcrypt('admin123')
INSERT INTO users (email, password_hash, first_name, last_name, role) VALUES
    ('admin@fitgym.com', '$2b$10$placeholder_hash_change_me', 'Admin', 'FitGym', 'ADMIN');

COMMIT;
