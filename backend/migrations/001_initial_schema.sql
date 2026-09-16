-- FitNation AI — Production PostgreSQL Schema Migration 001
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users
CREATE TABLE IF NOT EXISTS users (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  firebase_uid        TEXT UNIQUE NOT NULL,
  name                TEXT NOT NULL,
  email               TEXT UNIQUE NOT NULL,
  student_id          TEXT,
  gender              TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
  age                 INT CHECK (age >= 10 AND age <= 120),
  height_cm           NUMERIC CHECK (height_cm > 50 AND height_cm < 300),
  weight_kg           NUMERIC CHECK (weight_kg > 20 AND weight_kg < 500),
  fitness_level       TEXT CHECK (fitness_level IN ('Beginner', 'Intermediate', 'Advanced')),
  goal                TEXT,
  activity_level      TEXT CHECK (activity_level IN ('sedentary', 'lightly_active', 'moderately_active', 'very_active')),
  experience          TEXT,
  points              INT NOT NULL DEFAULT 0 CHECK (points >= 0),
  level               INT NOT NULL DEFAULT 1 CHECK (level >= 1),
  streak_days         INT NOT NULL DEFAULT 0 CHECK (streak_days >= 0),
  last_active_date    DATE,
  avatar_url          TEXT,
  role                TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'admin', 'coach')),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Fitness Assessments
CREATE TABLE IF NOT EXISTS fitness_assessments (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  answers             JSONB NOT NULL,
  fitness_score       NUMERIC,
  recommended_split   TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Exercise Catalog
CREATE TABLE IF NOT EXISTS exercises (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                TEXT NOT NULL,
  slug                TEXT UNIQUE NOT NULL,
  category            TEXT NOT NULL CHECK (category IN ('Chest', 'Back', 'Shoulders', 'Arms', 'Legs', 'Core', 'Full Body', 'Cardio', 'Mobility')),
  target_muscles      TEXT[] NOT NULL DEFAULT '{}',
  secondary_muscles    TEXT[] NOT NULL DEFAULT '{}',
  equipment           TEXT NOT NULL DEFAULT 'Bodyweight',
  difficulty          TEXT NOT NULL CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced')),
  instructions        JSONB NOT NULL DEFAULT '[]',
  common_mistakes     JSONB NOT NULL DEFAULT '[]',
  cautions            TEXT,
  video_url           TEXT,
  thumbnail_url       TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Workout Plans
CREATE TABLE IF NOT EXISTS workout_plans (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title               TEXT NOT NULL,
  description         TEXT,
  duration_min        INT CHECK (duration_min > 0),
  difficulty          TEXT CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced')),
  split_type          TEXT,
  is_custom           BOOLEAN NOT NULL DEFAULT false,
  is_active           BOOLEAN NOT NULL DEFAULT true,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Workout Plan Exercises
CREATE TABLE IF NOT EXISTS workout_plan_exercises (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id             UUID NOT NULL REFERENCES workout_plans(id) ON DELETE CASCADE,
  exercise_id         UUID REFERENCES exercises(id) ON DELETE SET NULL,
  name                TEXT NOT NULL,
  detail              TEXT,
  day_of_week         INT CHECK (day_of_week BETWEEN 1 AND 7),
  order_index         INT NOT NULL DEFAULT 0,
  sets                INT NOT NULL DEFAULT 3 CHECK (sets > 0),
  reps                INT NOT NULL DEFAULT 10 CHECK (reps > 0),
  rest_seconds        INT NOT NULL DEFAULT 60 CHECK (rest_seconds >= 0),
  is_done             BOOLEAN NOT NULL DEFAULT false
);

-- 6. Workout Sessions
CREATE TABLE IF NOT EXISTS workout_sessions (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id             UUID REFERENCES workout_plans(id) ON DELETE SET NULL,
  started_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at        TIMESTAMPTZ,
  duration_sec        INT DEFAULT 0,
  total_calories      NUMERIC DEFAULT 0,
  status              TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned'))
);

-- 7. Workout Session Sets
CREATE TABLE IF NOT EXISTS workout_session_sets (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id          UUID NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
  exercise_id         UUID REFERENCES exercises(id) ON DELETE SET NULL,
  exercise_name       TEXT NOT NULL,
  set_number          INT NOT NULL CHECK (set_number > 0),
  target_reps         INT,
  completed_reps      INT CHECK (completed_reps >= 0),
  weight_kg           NUMERIC DEFAULT 0 CHECK (weight_kg >= 0),
  rpe                 INT CHECK (rpe BETWEEN 1 AND 10),
  is_completed        BOOLEAN NOT NULL DEFAULT false
);

-- 8. Activity Logs
CREATE TABLE IF NOT EXISTS activity_logs (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  log_date            DATE NOT NULL,
  steps               INT NOT NULL DEFAULT 0 CHECK (steps >= 0),
  distance_km         NUMERIC NOT NULL DEFAULT 0 CHECK (distance_km >= 0),
  calories            NUMERIC NOT NULL DEFAULT 0 CHECK (calories >= 0),
  active_minutes      INT NOT NULL DEFAULT 0 CHECK (active_minutes >= 0),
  source              TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'health_api', 'wearable', 'google_maps')),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, log_date)
);

-- 9. Food Logs
CREATE TABLE IF NOT EXISTS food_logs (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  meal                TEXT NOT NULL CHECK (meal IN ('breakfast', 'lunch', 'dinner', 'snack')),
  description         TEXT NOT NULL,
  calories            NUMERIC NOT NULL CHECK (calories >= 0),
  protein_g           NUMERIC NOT NULL DEFAULT 0 CHECK (protein_g >= 0),
  carbs_g             NUMERIC NOT NULL DEFAULT 0 CHECK (carbs_g >= 0),
  fat_g               NUMERIC NOT NULL DEFAULT 0 CHECK (fat_g >= 0),
  serving_size        TEXT,
  logged_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. Challenges
CREATE TABLE IF NOT EXISTS challenges (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title               TEXT NOT NULL,
  subtitle            TEXT,
  description         TEXT,
  category            TEXT NOT NULL DEFAULT 'steps',
  total_units         INT NOT NULL CHECK (total_units > 0),
  unit_label          TEXT NOT NULL,
  reward_points       INT NOT NULL DEFAULT 0 CHECK (reward_points >= 0),
  starts_at           DATE,
  ends_at             DATE,
  is_active           BOOLEAN NOT NULL DEFAULT true
);

-- 11. User Challenges
CREATE TABLE IF NOT EXISTS user_challenges (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  challenge_id        UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  progress            INT NOT NULL DEFAULT 0 CHECK (progress >= 0),
  joined_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at        TIMESTAMPTZ,
  reward_claimed      BOOLEAN NOT NULL DEFAULT false,
  UNIQUE (user_id, challenge_id)
);

-- 12. Point Transactions (Immutable Audit Ledger)
CREATE TABLE IF NOT EXISTS point_transactions (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount              INT NOT NULL,
  source              TEXT NOT NULL CHECK (source IN ('workout_completed', 'challenge_reward', 'daily_streak', 'activity_milestone', 'admin_adjustment')),
  reference_id        UUID,
  description         TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 13. Achievements
CREATE TABLE IF NOT EXISTS achievements (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code                TEXT UNIQUE NOT NULL,
  title               TEXT NOT NULL,
  description         TEXT NOT NULL,
  icon                TEXT,
  points_reward       INT NOT NULL DEFAULT 0
);

-- 14. User Achievements
CREATE TABLE IF NOT EXISTS user_achievements (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id      UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, achievement_id)
);

-- 15. Groups
CREATE TABLE IF NOT EXISTS groups (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                TEXT NOT NULL,
  description         TEXT,
  avatar_url          TEXT,
  created_by          UUID REFERENCES users(id) ON DELETE SET NULL,
  is_private          BOOLEAN NOT NULL DEFAULT false,
  invite_code         TEXT UNIQUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 16. Group Members
CREATE TABLE IF NOT EXISTS group_members (
  group_id            UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role                TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (group_id, user_id)
);

-- 17. Form Check Sessions
CREATE TABLE IF NOT EXISTS form_check_sessions (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  exercise            TEXT NOT NULL,
  rep_count           INT NOT NULL DEFAULT 0,
  score               NUMERIC NOT NULL CHECK (score >= 0 AND score <= 100),
  feedback            TEXT NOT NULL,
  detected_flaws      TEXT[] NOT NULL DEFAULT '{}',
  pose_keypoints      JSONB,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 18. Chat Messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role                TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content             TEXT NOT NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 19. Device Tokens
CREATE TABLE IF NOT EXISTS device_tokens (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token               TEXT UNIQUE NOT NULL,
  platform            TEXT NOT NULL CHECK (platform IN ('web', 'ios', 'android')),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 20. Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title               TEXT NOT NULL,
  body                TEXT NOT NULL,
  data                JSONB,
  is_read             BOOLEAN NOT NULL DEFAULT false,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_firebase_uid ON users(firebase_uid);
CREATE INDEX IF NOT EXISTS idx_users_points ON users(points DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_date ON activity_logs(user_id, log_date);
CREATE INDEX IF NOT EXISTS idx_workout_plans_user ON workout_plans(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_food_logs_user ON food_logs(user_id, logged_at DESC);
CREATE INDEX IF NOT EXISTS idx_point_transactions_user ON point_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user ON chat_messages(user_id, created_at ASC);
