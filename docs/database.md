# FitNation AI — Database Design & Schema Specification

## 1. Overview
The FitNation AI database is built on PostgreSQL with UUID primary keys, strict foreign key constraints, check constraints, composite unique indexes, and audit logs.

---

## 2. Entity Relationship Model

```
   +-----------------------------------------------------------+
   |                           USERS                           |
   | id (UUID PK), firebase_uid (UQ), name, email (UQ),        |
   | age, height_cm, weight_kg, fitness_level, goal,           |
   | points, level, streak_days, avatar_url, created_at        |
   +-----+----------------------+------------------------+-----+
         | 1                    | 1                      | 1
         |                      |                        |
         v *                    v *                      v *
+-----------------+   +--------------------+   +-------------------+
| FITNESS_        |   | ACTIVITY_LOGS      |   | FOOD_LOGS         |
| ASSESSMENTS     |   | user_id, log_date  |   | user_id, meal,    |
| user_id, answers|   | steps, distance,   |   | calories, protein,|
| score, split    |   | calories, minutes  |   | carbs, fat, logged|
+-----------------+   +--------------------+   +-------------------+
         | 1                    | 1                      | 1
         v *                    v *                      v *
+-----------------+   +--------------------+   +-------------------+
| WORKOUT_PLANS   |   | POINT_TRANSACTIONS |   | FORM_CHECK_       |
| user_id, title, |   | user_id, amount,   |   | SESSIONS          |
| duration, split |   | source, ref_id     |   | user_id, exercise,|
+--------+--------+   +--------------------+   | rep_count, score  |
         | 1                                   +-------------------+
         v *
+-----------------------+
| WORKOUT_PLAN_EXERCISES|
| plan_id, exercise_id  |
| sets, reps, rest_sec  |
+-----------+-----------+
            | *
            v 1
+-----------------------+
| EXERCISES (Catalog)   |
| id, name, slug, group,|
| difficulty, cautions  |
+-----------+-----------+
            | 1
            v *
+-----------------------+
| WORKOUT_SESSIONS      |
| user_id, plan_id,     |
| duration, calories    |
+-----------+-----------+
            | 1
            v *
+-----------------------+
| WORKOUT_SESSION_SETS  |
| session_id, exercise  |
| set_num, reps, weight |
+-----------------------+
```

---

## 3. Schema Definitions

### 3.1 Core Users & Profiles
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
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

CREATE INDEX idx_users_firebase_uid ON users(firebase_uid);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_points ON users(points DESC);
```

### 3.2 Fitness Assessments
```sql
CREATE TABLE fitness_assessments (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  answers             JSONB NOT NULL,
  fitness_score       NUMERIC,
  recommended_split   TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_assessments_user_created ON fitness_assessments(user_id, created_at DESC);
```

### 3.3 Exercise Catalog
```sql
CREATE TABLE exercises (
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

CREATE INDEX idx_exercises_category ON exercises(category);
CREATE INDEX idx_exercises_difficulty ON exercises(difficulty);
```

### 3.4 Workouts & Session Tracking
```sql
CREATE TABLE workout_plans (
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

CREATE TABLE workout_plan_exercises (
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

CREATE TABLE workout_sessions (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id             UUID REFERENCES workout_plans(id) ON DELETE SET NULL,
  started_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at        TIMESTAMPTZ,
  duration_sec        INT DEFAULT 0,
  total_calories      NUMERIC DEFAULT 0,
  status              TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned'))
);

CREATE TABLE workout_session_sets (
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

CREATE INDEX idx_workout_plans_user ON workout_plans(user_id, created_at DESC);
CREATE INDEX idx_workout_sessions_user ON workout_sessions(user_id, started_at DESC);
```

### 3.5 Activity & Nutrition
```sql
CREATE TABLE activity_logs (
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

CREATE TABLE food_logs (
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

CREATE INDEX idx_activity_user_date ON activity_logs(user_id, log_date);
CREATE INDEX idx_food_logs_user_logged ON food_logs(user_id, logged_at DESC);
```

### 3.6 Gamification, Challenges & Ledger
```sql
CREATE TABLE challenges (
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

CREATE TABLE user_challenges (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  challenge_id        UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  progress            INT NOT NULL DEFAULT 0 CHECK (progress >= 0),
  joined_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at        TIMESTAMPTZ,
  reward_claimed      BOOLEAN NOT NULL DEFAULT false,
  UNIQUE (user_id, challenge_id)
);

CREATE TABLE point_transactions (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount              INT NOT NULL,
  source              TEXT NOT NULL CHECK (source IN ('workout_completed', 'challenge_reward', 'daily_streak', 'activity_milestone', 'admin_adjustment')),
  reference_id        UUID,
  description         TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE achievements (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code                TEXT UNIQUE NOT NULL,
  title               TEXT NOT NULL,
  description         TEXT NOT NULL,
  icon                TEXT,
  points_reward       INT NOT NULL DEFAULT 0
);

CREATE TABLE user_achievements (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id      UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, achievement_id)
);

CREATE INDEX idx_user_challenges_user ON user_challenges(user_id);
CREATE INDEX idx_point_transactions_user ON point_transactions(user_id, created_at DESC);
```

### 3.7 Groups & Community
```sql
CREATE TABLE groups (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                TEXT NOT NULL,
  description         TEXT,
  avatar_url          TEXT,
  created_by          UUID REFERENCES users(id) ON DELETE SET NULL,
  is_private          BOOLEAN NOT NULL DEFAULT false,
  invite_code         TEXT UNIQUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE group_members (
  group_id            UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role                TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (group_id, user_id)
);
```

### 3.8 AI Form Check, Chat & Notifications
```sql
CREATE TABLE form_check_sessions (
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

CREATE TABLE chat_messages (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role                TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content             TEXT NOT NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE device_tokens (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token               TEXT UNIQUE NOT NULL,
  platform            TEXT NOT NULL CHECK (platform IN ('web', 'ios', 'android')),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE notifications (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title               TEXT NOT NULL,
  body                TEXT NOT NULL,
  data                JSONB,
  is_read             BOOLEAN NOT NULL DEFAULT false,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_chat_user_created ON chat_messages(user_id, created_at ASC);
CREATE INDEX idx_form_check_user ON form_check_sessions(user_id, created_at DESC);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read, created_at DESC);
```

---

## 4. ACID Transaction Guarantees
Operations that mutate multiple tables execute within explicit transactions:
1. **Challenge Completion**:
   ```sql
   BEGIN;
   -- 1. Check if progress >= total_units AND reward_claimed = false
   UPDATE user_challenges SET completed_at = now(), reward_claimed = true WHERE id = $1 AND reward_claimed = false RETURNING *;
   -- 2. If row was updated, record point transaction
   INSERT INTO point_transactions (user_id, amount, source, reference_id) VALUES ($2, $3, 'challenge_reward', $4);
   -- 3. Atomically increment user points
   UPDATE users SET points = points + $3 WHERE id = $2;
   COMMIT;
   ```
2. **Workout Creation**:
   Inserts the `workout_plans` header followed by multi-row `workout_plan_exercises` atomically.
3. **Workout Session Completion**:
   Marks session completed, records `point_transactions` (e.g. 50 XP), updates `users.points`, checks and updates user streak.
