-- Hours sync schema (Cloudflare D1 / SQLite)
-- Every row is scoped to a Stack Auth user id (the JWT `sub`). Sync is
-- last-write-wins by `updated_at` (ISO 8601 string, lexicographically sortable).

CREATE TABLE IF NOT EXISTS sessions (
  id            TEXT NOT NULL,
  user_id       TEXT NOT NULL,
  activity_name TEXT NOT NULL,
  category_id   TEXT NOT NULL,
  start_time    TEXT NOT NULL,
  end_time      TEXT NOT NULL,
  duration_ms   INTEGER NOT NULL,
  notes         TEXT,
  tags          TEXT NOT NULL DEFAULT '[]',  -- JSON array
  source        TEXT NOT NULL DEFAULT 'timer',
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL,
  PRIMARY KEY (user_id, id)
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

CREATE TABLE IF NOT EXISTS categories (
  id          TEXT NOT NULL,
  user_id     TEXT NOT NULL,
  name        TEXT NOT NULL,
  identity    TEXT NOT NULL,
  color       TEXT NOT NULL,
  tone        TEXT NOT NULL DEFAULT 'neutral',
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL,
  PRIMARY KEY (user_id, id)
);
CREATE INDEX IF NOT EXISTS idx_categories_user ON categories(user_id);

CREATE TABLE IF NOT EXISTS goals (
  id           TEXT NOT NULL,
  user_id      TEXT NOT NULL,
  title        TEXT NOT NULL,
  type         TEXT NOT NULL,
  period       TEXT NOT NULL,
  target_value REAL NOT NULL,
  category_id  TEXT,
  identity     TEXT,
  created_at   TEXT NOT NULL,
  is_active    INTEGER NOT NULL DEFAULT 1,
  updated_at   TEXT NOT NULL,
  PRIMARY KEY (user_id, id)
);
CREATE INDEX IF NOT EXISTS idx_goals_user ON goals(user_id);

-- Single settings row per user.
CREATE TABLE IF NOT EXISTS settings (
  user_id             TEXT PRIMARY KEY,
  daily_target_hours  REAL NOT NULL DEFAULT 6,
  week_starts_on      INTEGER NOT NULL DEFAULT 1,
  desired_identities  TEXT NOT NULL DEFAULT '[]',  -- JSON array
  theme               TEXT NOT NULL DEFAULT 'dark',
  updated_at          TEXT NOT NULL
);
