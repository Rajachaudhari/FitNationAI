# Implementation Plan — FitNation AI Platform

FitNation AI is a full-stack, production-grade, AI-powered fitness ecosystem featuring intelligent workout generation, real-time computer-vision exercise form analysis, personalized conversational AI coaching, automated nutrition intelligence, gamification with idempotent rewards and audit trails, activity tracking, community groups, and multi-tier leaderboards.

---

## 1. Reference Project Audit & Gap Analysis

An in-depth code audit of `AlgiGenAI-main` revealed critical architectural defects, missing features, security vulnerabilities, and logic bugs that will be replaced and corrected:

### A. Vulnerabilities & Security Flaws in Reference
1. **Committed Production Secrets**: Reference `.env` had hardcoded private keys (`FIREBASE_PRIVATE_KEY`) and database credentials committed into git.
2. **Insecure Direct Object Reference (IDOR)**:
   - `PATCH /api/workouts/exercise/:id` updated `is_done` purely by exercise UUID without verifying ownership through `plan -> user_id`.
   - Food logs, chat history, and activity logs lacked ownership verification on deletions and updates.
3. **Missing Authentication Context Resolution**:
   - Every route executed ad-hoc queries `SELECT id FROM users WHERE firebase_uid = $1`. If the user was not yet synchronized in PostgreSQL, `userId` was `undefined`, triggering unhandled 500 errors.
4. **Denial of Service & Injection**:
   - `express.json({ limit: "5mb" })` without rate limiting (`express-rate-limit`) or input sanitization.
   - No HTTP security headers (`helmet`).
   - Open CORS policy allowing arbitrary origin requests.

### B. Severe Logic Bugs in Reference
1. **Infinite Point Glitch (Challenge Reward Duplication)**:
   - In `routes/challenges.js`, calling `POST /api/challenges/:id/join` repeatedly incremented progress and awarded points on every single call past `total_units` with no idempotency or `completed_at` guard.
2. **Missing Database Transactions**:
   - Creating a workout plan looped through exercise inserts sequentially without a `BEGIN ... COMMIT` block. Partial failures left orphan records.
   - Challenge completions modified `user_challenges` and `users.points` across separate queries without atomicity.
3. **Broken Leaderboard Linkage**:
   - Leaderboard read from an isolated `leaderboard_scope` table that was never updated when users earned points from workouts or challenges.

### C. Missing Core Functionality in Reference
1. **No AI Workout Generator**: No endpoints or prompt pipelines existed for generating personalized workout plans.
2. **Fake Form Check Scoring**: `scoreSquatKeypoints()` was a mock returning hardcoded `0.85`. No landmark normalization, 3D/2D joint angle geometry, phase tracking, or rep counting existed.
3. **No Exercise Catalog**: Exercises were merely freeform text strings; there was no structured catalog with muscle groups, instructions, cautions, and difficulty levels.
4. **No Gamification Audit Trail**: Points were stored only as an incremented integer on `users.points` with no immutable `point_transactions` ledger.
5. **No AI Provider Abstraction**: Direct dependency on OpenAI with hardcoded model strings, preventing mocking, fallback, or testing.
6. **No Request Validation**: No schema validation (Zod) on request bodies, parameters, or queries.
7. **Zero Frontend & Zero Tests**: The reference repo was a bare prototype backend with 0 automated tests and no UI.

---

## 2. Proposed Architecture & System Design

```
fitmed/
├── apps/
│   └── web/                            # Modern React 18 + Vite + Tailwind/Vanilla CSS SPA
│       ├── src/
│       │   ├── components/             # Glassmorphic UI components, charts, pose canvas
│       │   ├── pages/                  # Dashboard, Workout, FormCheck, AICoach, Nutrition, etc.
│       │   ├── services/               # API clients with JWT injection & fallback mode
│       │   └── hooks/                  # Form check hook, auth hook, websocket/polling
├── backend/
│   ├── src/
│   │   ├── config/                     # Environment, DB pool, Firebase Admin, Sentry, Logger
│   │   ├── middleware/                 # authenticate, requireUser, rateLimit, validate, errorHandler
│   │   ├── modules/
│   │   │   ├── auth/                   # Firebase token verification, session sync
│   │   │   ├── users/                  # Profile CRUD, settings, avatar
│   │   │   ├── assessment/             # Multi-step onboarding, assessment history
│   │   │   ├── activity/               # Activity logs, range queries, daily rollups
│   │   │   ├── workouts/               # Exercise catalog, plans, sessions, exercise tracking
│   │   │   ├── exercise-form/          # Biomechanical kinematic engine (Squat, Pushup, Lunge, Plank, Curl)
│   │   │   ├── ai-coach/               # Provider abstraction, safe context assembly, chat
│   │   │   ├── nutrition/              # Food logging, macro breakdown, AI food parser
│   │   │   ├── challenges/             # Idempotent challenge progression, transactional rewards
│   │   │   ├── leaderboard/            # Multi-tier leaderboards (Global, College, City, State)
│   │   │   ├── groups/                 # RBAC groups (Owner, Admin, Member), group leaderboards
│   │   │   ├── notifications/          # FCM device tokens, notification preferences
│   │   │   └── analytics/              # Aggregated progress metrics across 7d, 30d, 90d, 1y
│   │   ├── services/                   # AI provider (OpenAI + MockAIProvider), Storage, FCM
│   │   ├── utils/                      # Biomechanics math, geometry, responses, logger
│   │   ├── app.js                      # Express app setup with security, CORS, routes
│   │   └── server.js                   # Server bootstrap & graceful shutdown
│   ├── tests/                          # Automated tests (Unit, Integration, Auth, IDOR)
│   ├── migrations/                     # Versioned SQL migration scripts
│   ├── seeds/                          # Production-ready catalog seed data
│   ├── package.json
│   └── .env.example
├── docs/                               # architecture.md, database.md, api.md, ai.md
├── docker-compose.yml
└── README.md
```

---

## 3. Database Schema Design (PostgreSQL)

Tables to create:
1. `users`: UUID pk, `firebase_uid` UNIQUE, name, email, student_id, gender, age, height_cm, weight_kg, fitness_level, goal, activity_level, experience, points, level, streak_days, last_active_date, avatar_url, role, timestamps.
2. `fitness_assessments`: UUID pk, user_id (FK), answers (JSONB), fitness_score, recommended_split, timestamps.
3. `exercises`: UUID pk, name, slug UNIQUE, category, target_muscles (TEXT[]), secondary_muscles (TEXT[]), equipment, difficulty, instructions (JSONB), common_mistakes (JSONB), cautions, video_url, thumbnail_url.
4. `workout_plans`: UUID pk, user_id (FK), title, description, duration_min, difficulty, split_type, is_custom, is_active, timestamps.
5. `workout_plan_exercises`: UUID pk, plan_id (FK), exercise_id (FK), day_of_week, order_index, sets, reps, rest_seconds, notes.
6. `workout_sessions`: UUID pk, user_id (FK), plan_id (FK nullable), started_at, completed_at, duration_sec, total_calories_burned, status ('in_progress','completed','abandoned').
7. `workout_session_sets`: UUID pk, session_id (FK), exercise_id (FK), set_number, target_reps, completed_reps, weight_kg, rpe, is_completed.
8. `activity_logs`: UUID pk, user_id (FK), log_date, steps, distance_km, calories, active_minutes, source, UNIQUE(user_id, log_date).
9. `food_logs`: UUID pk, user_id (FK), meal ('breakfast','lunch','dinner','snack'), description, calories, protein_g, carbs_g, fat_g, serving_size, logged_at.
10. `challenges`: UUID pk, title, subtitle, description, challenge_type, target_units, unit_label, reward_points, starts_at, ends_at, is_active.
11. `user_challenges`: UUID pk, user_id (FK), challenge_id (FK), progress, completed_at, reward_claimed, UNIQUE(user_id, challenge_id).
12. `point_transactions`: UUID pk, user_id (FK), amount, source ('workout_completed','challenge_reward','daily_streak','activity_milestone'), reference_id, created_at.
13. `achievements`: UUID pk, code UNIQUE, title, description, badge_icon, points_reward.
14. `user_achievements`: UUID pk, user_id (FK), achievement_id (FK), unlocked_at, UNIQUE(user_id, achievement_id).
15. `groups`: UUID pk, name, description, avatar_url, created_by (FK), is_private, invite_code UNIQUE, created_at.
16. `group_members`: group_id (FK), user_id (FK), role ('owner','admin','member'), joined_at, PRIMARY KEY (group_id, user_id).
17. `chat_messages`: UUID pk, user_id (FK), role ('user','assistant','system'), content, tokens_used, created_at.
18. `form_check_sessions`: UUID pk, user_id (FK), exercise_id (FK nullable), exercise_name, rep_count, avg_score, form_breakdown (JSONB), detected_flaws (TEXT[]), feedback, created_at.
19. `device_tokens`: UUID pk, user_id (FK), token UNIQUE, platform ('web','ios','android'), updated_at.
20. `notifications`: UUID pk, user_id (FK), title, body, data (JSONB), is_read, created_at.

---

## 4. Biomechanical Form Analysis Engine Specification

Unlike the placeholder `0.85` in the reference repo, we implement a full trigonometric and kinematic vector analysis module:
- **Vector Math**: Angle computation $\theta = \arccos\left(\frac{\mathbf{u} \cdot \mathbf{v}}{\|\mathbf{u}\| \|\mathbf{v}\|}\right)$ using 2D/3D landmarks.
- **Supported Exercises**:
  1. **Squat**: Hip angle (shoulder-hip-knee), knee angle (hip-knee-ankle), torso inclination, depth classification (parallel, deep, partial), knee-valgus tracking.
  2. **Push-up**: Elbow angle (shoulder-elbow-wrist), shoulder flare angle (elbow-shoulder-hip), hip alignment angle (shoulder-hip-ankle to prevent sagging).
  3. **Lunge**: Front knee angle (90 deg target), back knee clearance, trunk erectness.
  4. **Plank**: Spinal alignment (shoulder-hip-ankle line deviation), hold duration, tremor/sag detection.
  5. **Bicep Curl**: Elbow flexion-extension cycle, upper-arm stability (detecting swinging).
  6. **Shoulder Press**: Elbow-to-overhead lockout, lumbar arching detection.
- **Hysteresis Rep-Counter State Machine**: States: `START` -> `INFLECTION / BOTTOM` -> `COMPLETION` with confidence gating ($> 0.65$) to eliminate jitter and duplicate rep triggers.
- **Scoring Algorithm**: Composite score ($0 - 100$) weighted by joint angle correctness, range of motion, and stability, with actionable corrective cues.

---

## 5. AI Coach & Workout Engine Specification

- **Provider Abstraction Layer**:
  - `AIProvider` abstract interface.
  - `OpenAIProvider`: Implements structured completion with JSON mode, retries, and rate limit backoff.
  - `MockAIProvider`: High-fidelity deterministic generator providing realistic workout routines, nutrition insights, and coaching responses for tests and offline/dev mode without incurring API costs.
- **Workout Generator Pipeline**:
  - Input: User profile, assessment data, goals, available equipment, target duration, previous session logs.
  - LLM Prompt with strict Zod JSON schema validation.
  - Safety & Catalog Reconciliation: Validates that exercises map to known safe movements and adhere to user limitations.
- **Conversational Coach Guardrails**:
  - System prompt injecting user context (fitness level, goals, recent workouts, streak).
  - Safety filter intercepting medical queries ("chest pain", "eating disorder", "prescription") with appropriate health disclaimers.

---

## 6. Frontend Architecture (Web App)

A modern, responsive, high-aesthetic web application built with React, Vite, and modern CSS:
- **Design System**: Deep obsidian dark theme (`#0a0b0e`, `#12141a`), electric cyan/emerald accents (`#00f0ff`, `#00e676`, `#7000ff`), frosted glassmorphism, subtle micro-animations, modern typography.
- **Core Views**:
  1. **Authentication & Welcome**: Firebase Auth with Mock/Dev login switcher for instant evaluation.
  2. **Onboarding Assessment**: 8-step visual questionnaire with progress indicator.
  3. **Dashboard / Home**: Daily activity rings, workout streak tracker, quick AI coach prompt, active challenge banner, quick start workout.
  4. **Workout Studio**: Interactive workout player with timers, set/rep logging, exercise video/animation demos, and AI plan generator.
  5. **Live Form Check Studio**: WebCam stream with canvas pose landmark overlay, real-time joint angle readouts, rep counter, and instant voice/visual feedback cues.
  6. **AI Coach Chat**: Conversational interface with markdown rendering, suggested prompts, and contextual awareness.
  7. **Nutrition Tracker**: Macro breakdown (protein, carbs, fat, calories), meal timeline, and AI meal estimator.
  8. **Challenges & Gamification**: Challenge cards, progress bars, points wallet, achievement badges, and streak milestones.
  9. **Leaderboard**: Filterable tabs (Global, College, City, State) with top 3 podium display and authenticated user rank highlight.
  10. **Community Groups**: Group discovery, creation, member lists, and internal group leaderboards.
  11. **Profile & Analytics**: Interactive charts (Steps, Calories, Workouts over 7d/30d/90d), metrics editor, and export data.

---

## 7. Verification & Testing Plan

### Automated Test Suites
1. **Auth & Middleware Tests**:
   - Token validation, missing token (401), invalid token (401).
   - Local user synchronization and role checks.
2. **Authorization & IDOR Protection Tests**:
   - User B attempts to toggle or modify User A's workout exercise -> 403 Forbidden.
   - User B attempts to read or mutate User A's food logs or activity logs -> 403 Forbidden.
3. **Challenge Idempotency Tests**:
   - Verify completing a challenge awards points once. Repeated calls do NOT duplicate rewards.
4. **AI Output & Provider Tests**:
   - Schema validation with Zod on AI workout payloads. Handling malformed responses gracefully.
5. **Form Analysis Kinematic Unit Tests**:
   - Mathematical verification of joint angle calculations on landmark vectors.
   - Rep counter state machine transitions on simulated movement waveforms.
6. **Activity & Aggregation Tests**:
   - Upsert activity logs without duplication. Verify aggregate queries over 7d, 30d, 90d.

### Manual Verification
1. Verify server boots with zero errors and connects to DB (or in-memory mock DB).
2. Verify interactive web UI loads on dev server.
3. Test complete user flow: Sign up -> Onboarding Assessment -> Generate AI Workout -> Complete Session -> Check Form -> Chat with Coach -> Log Meal -> Join Challenge -> Verify Leaderboard rank.
