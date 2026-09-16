# FitNation AI — REST API Specification

## 1. Conventions & Standards
- **Base URL**: `/api`
- **Authentication**: `Authorization: Bearer <Firebase_ID_Token>`
- **Content-Type**: `application/json`
- **Standard Success Response**:
  ```json
  {
    "success": true,
    "data": {},
    "message": "Optional status message"
  }
  ```
- **Standard Error Response**:
  ```json
  {
    "success": false,
    "error": {
      "code": "VALIDATION_ERROR | UNAUTHORIZED | FORBIDDEN | NOT_FOUND | CONFLICT | INTERNAL_SERVER_ERROR",
      "message": "Human-readable explanation",
      "details": []
    }
  }
  ```

---

## 2. API Endpoints Catalog

### 2.1 Auth & Users (`/api/users`)
- `POST /api/users/sync`
  - Body: `{ "name": "John Doe", "avatar_url": "https://..." }`
  - Desc: Synchronizes authenticated Firebase user into PostgreSQL. Idempotent upsert.
- `GET /api/users/me`
  - Desc: Returns the full profile of the authenticated user.
- `PATCH /api/users/me`
  - Body (Zod validated): `{ "age": 25, "height_cm": 178, "weight_kg": 76, "fitness_level": "Intermediate", "goal": "Muscle building" }`
  - Desc: Updates profile metrics.
- `POST /api/users/assessment`
  - Body: `{ "experience": "Intermediate", "goal": "Strength", "available_days": 4, "equipment": ["dumbbells", "barbell"], "duration_min": 45, "limitations": [] }`
  - Desc: Saves structured fitness assessment and recalculates recommended split.
- `GET /api/users/assessment/history`
  - Desc: Retrieves past assessment submissions.

### 2.2 Activity & Progress (`/api/activity`)
- `POST /api/activity`
  - Body: `{ "log_date": "2026-09-16", "steps": 8500, "distance_km": 6.2, "calories": 480, "active_minutes": 55, "source": "manual" }`
  - Desc: Upserts daily activity entry. Prevents duplicate rows per user/day.
- `GET /api/activity/range?from=YYYY-MM-DD&to=YYYY-MM-DD`
  - Desc: Retrieves daily activity logs for charts and trend tracking.
- `GET /api/activity/today`
  - Desc: Fetches today's activity metrics.
- `GET /api/activity/summary?period=7d|30d|90d`
  - Desc: Returns aggregated metrics (total steps, average daily calories, active minutes).

### 2.3 Workouts & Catalog (`/api/workouts`)
- `GET /api/workouts/exercises`
  - Query: `category`, `difficulty`, `search`
  - Desc: Returns list of exercises from the standardized catalog.
- `GET /api/workouts/today`
  - Desc: Returns the user's active workout plan for today including ordered exercise list.
- `POST /api/workouts/generate`
  - Body: `{ "goal": "Strength", "equipment": ["dumbbells"], "duration_min": 45, "focus": "Upper Body" }`
  - Desc: AI-powered generation pipeline with strict JSON schema validation and catalog reconciliation.
- `POST /api/workouts`
  - Body: `{ "title": "Push Day A", "duration_min": 50, "exercises": [{ "name": "Bench Press", "sets": 4, "reps": 8, "rest_seconds": 90 }] }`
  - Desc: Transactional creation of a custom workout plan.
- `PATCH /api/workouts/exercise/:id`
  - Body: `{ "is_done": true }`
  - Desc: Toggles completion state. **Protected by IDOR verification**: verifies exercise belongs to a plan owned by `req.user.id`.
- `POST /api/workouts/sessions/start`
  - Body: `{ "plan_id": "uuid" }`
  - Desc: Starts a live workout session.
- `POST /api/workouts/sessions/:id/complete`
  - Body: `{ "duration_sec": 2400, "calories": 320 }`
  - Desc: Completes session, records point transaction (50 XP), advances streak.

### 2.4 Exercise Form Analysis (`/api/form-check`)
- `POST /api/form-check/analyze`
  - Body: `{ "exercise": "squat|pushup|lunge|plank|bicep_curl", "pose_keypoints": { "landmarks": [...] }, "state": "down|up" }`
  - Desc: Evaluates joint angles, checks depth, body alignment, knee-tracking, and computes rep completion with score (0-100) and corrective cues.
- `GET /api/form-check/history`
  - Desc: Retrieves recent form check session scores and feedback.

### 2.5 AI Fitness Coach (`/api/ai`)
- `POST /api/ai/chat`
  - Body: `{ "message": "How do I progress on bench press safely?" }`
  - Desc: Context-aware conversational AI coach with safety filters and conversation persistence.
- `GET /api/ai/chat/history`
  - Desc: Returns the user's persistent chat history.
- `POST /api/ai/parse-food`
  - Body: `{ "text": "2 rotis, bowl of dal and grilled paneer" }`
  - Desc: Natural language food parser extracting estimated calories and macronutrients with confidence.

### 2.6 Nutrition (`/api/nutrition`)
- `POST /api/nutrition`
  - Body: `{ "meal": "lunch", "description": "Grilled Chicken Salad", "calories": 420, "protein_g": 38, "carbs_g": 18, "fat_g": 12 }`
  - Desc: Logs a meal item.
- `GET /api/nutrition/today`
  - Desc: Returns today's logged meals and macro distribution totals.
- `GET /api/nutrition/history?from=YYYY-MM-DD&to=YYYY-MM-DD`
  - Desc: Historical nutrition trends.
- `DELETE /api/nutrition/:id`
  - Desc: Deletes meal log. **Protected by IDOR verification**: verifies meal belongs to `req.user.id`.

### 2.7 Challenges & Gamification (`/api/challenges` & `/api/gamification`)
- `GET /api/challenges`
  - Desc: Returns all active challenges annotated with user progress and claim status.
- `POST /api/challenges/:id/join`
  - Desc: Joins a challenge.
- `POST /api/challenges/:id/progress`
  - Body: `{ "increment": 1 }`
  - Desc: **Idempotent progression**: increments units. If target reached, completes and awards points atomically without double-reward vulnerabilities.
- `GET /api/gamification/status`
  - Desc: Returns user points, level, streak, and recent point transactions ledger.
- `GET /api/gamification/achievements`
  - Desc: Lists all achievements with user unlock status.

### 2.8 Leaderboards (`/api/leaderboard`)
- `GET /api/leaderboard?scope=global|college|city|state&scope_value=DSCodeTech&timeframe=all_time|weekly|monthly`
  - Desc: High-performance ranked query from verified points. Includes user's own ranking.

### 2.9 Community Groups (`/api/groups`)
- `GET /api/groups`
  - Desc: Lists groups the user is a member of.
- `GET /api/groups/discover`
  - Desc: Lists public groups.
- `POST /api/groups`
  - Body: `{ "name": "Campus Runners", "description": "Daily 5k crew", "is_private": false }`
  - Desc: Creates group and sets creator as 'owner'.
- `POST /api/groups/:id/join`
  - Desc: Joins a public group or applies invite code.
- `POST /api/groups/:id/leave`
  - Desc: Leaves group.
- `GET /api/groups/:id/leaderboard`
  - Desc: Leaderboard ranking specifically for members of the group.

### 2.10 Notifications (`/api/notifications`)
- `POST /api/notifications/device-token`
  - Body: `{ "token": "fcm_token_string", "platform": "web" }`
  - Desc: Registers device FCM token.
- `GET /api/notifications`
  - Desc: Retrieves unread notifications.
- `PATCH /api/notifications/:id/read`
  - Desc: Marks notification as read.
