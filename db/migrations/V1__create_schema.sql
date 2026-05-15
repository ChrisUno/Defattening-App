CREATE TABLE users (
    id          VARCHAR(64) PRIMARY KEY,
    email       VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name        VARCHAR(255) NOT NULL,
    avatar_color VARCHAR(20) NOT NULL DEFAULT '#2563EB',
    role        VARCHAR(10) NOT NULL CHECK (role IN ('admin', 'user')),
    height_cm   INTEGER,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE sessions (
    id                    VARCHAR(64) PRIMARY KEY,
    name                  VARCHAR(255) NOT NULL,
    description           TEXT NOT NULL DEFAULT '',
    weeks                 INTEGER NOT NULL,
    weigh_in_day_of_week  INTEGER NOT NULL,
    weigh_in_note         TEXT NOT NULL DEFAULT '',
    start_date            TIMESTAMPTZ NOT NULL,
    status                VARCHAR(20) NOT NULL CHECK (status IN ('active', 'completed', 'upcoming')),
    created_by            VARCHAR(64) NOT NULL REFERENCES users(id)
);

CREATE TABLE participations (
    id              VARCHAR(64) PRIMARY KEY,
    user_id         VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id      VARCHAR(64) NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    start_weight_kg DOUBLE PRECISION NOT NULL,
    goal_weight_kg  DOUBLE PRECISION NOT NULL,
    joined_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, session_id)
);

CREATE TABLE weigh_ins (
    id           VARCHAR(64) PRIMARY KEY,
    user_id      VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id   VARCHAR(64) NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    weight_kg    DOUBLE PRECISION NOT NULL,
    body_fat_pct DOUBLE PRECISION,
    week_index   INTEGER NOT NULL,
    measured_at  TIMESTAMPTZ NOT NULL,
    recorded_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, session_id, week_index)
);

CREATE TABLE journals (
    id          VARCHAR(64) PRIMARY KEY,
    user_id     VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id  VARCHAR(64) NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    week_index  INTEGER NOT NULL,
    content     TEXT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, session_id, week_index)
);

CREATE TABLE activity_entries (
    id              VARCHAR(64) PRIMARY KEY,
    type            VARCHAR(20) NOT NULL DEFAULT 'overtake',
    occurred_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    session_id      VARCHAR(64) NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    actor_user_id   VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_user_id  VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    actor_pct       DOUBLE PRECISION NOT NULL,
    target_pct      DOUBLE PRECISION NOT NULL
);

CREATE TABLE http_sessions (
    sid    VARCHAR NOT NULL PRIMARY KEY,
    sess   JSON NOT NULL,
    expire TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_http_sessions_expire ON http_sessions (expire);
