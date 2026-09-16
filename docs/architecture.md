# FitNation AI — System Architecture Specification

## 1. System Overview
FitNation AI is a modular, production-ready full-stack AI fitness platform engineered to deliver personalized fitness coaching, intelligent workout generation, real-time exercise form feedback via computer vision, nutrition intelligence, community gamification, and progress tracking.

```
                                  +---------------------------+
                                  |   Web Client (React/Vite) |
                                  |   Mobile (React Native)   |
                                  +-------------+-------------+
                                                |  HTTPS / WSS / JWT
                                                v
+--------------------------------------------------------------------------------------------+
|                                    BACKEND API GATEWAY                                     |
|  [Helmet / CORS / Rate Limiting / Body Parser (50kb - 5mb for pose) / Structured Logger]   |
+-----------------------------------------------+--------------------------------------------+
                                                |
                                                v
+--------------------------------------------------------------------------------------------+
|                                 AUTHENTICATION & CONTEXT                                    |
|   authenticate() [Firebase Admin JWT]  --->  requireUser() [Resolved PostgreSQL User Context]|
|   requireRole(['admin', 'member'])     --->  IDOR Guard (Owner / Membership Verification)   |
+-----------------------------------------------+--------------------------------------------+
                                                |
                                                v
+--------------------------------------------------------------------------------------------+
|                                   DOMAIN MODULE LAYER                                      |
|                                                                                            |
|  +--------------------+  +---------------------+  +--------------------+                   |
|  | Auth & Users       |  | Workout Engine      |  | AI Coach           |                   |
|  | - Sync & Profile   |  | - Catalog & Splits  |  | - Context Assembly |                   |
|  | - Assessment Store |  | - Generator Pipeline|  | - Guardrails & FAQ |                   |
|  +--------------------+  +---------------------+  +--------------------+                   |
|                                                                                            |
|  +--------------------+  +---------------------+  +--------------------+                   |
|  | Form Analysis      |  | Nutrition Engine    |  | Gamification       |                   |
|  | - Vector Kinematics|  | - Food Logs & Macros|  | - Idempotent Awards|                   |
|  | - Rep State Machine|  | - AI Calorie Parser |  | - Ledger & Streaks |                   |
|  +--------------------+  +---------------------+  +--------------------+                   |
|                                                                                            |
|  +--------------------+  +---------------------+  +--------------------+                   |
|  | Activity & Health  |  | Community & Groups  |  | Notifications      |                   |
|  | - Daily Aggregation|  | - RBAC & Invites    |  | - FCM Tokens       |                   |
|  | - 7d/30d/90d Trends|  | - Group Podium      |  | - Push Reminders   |                   |
|  +--------------------+  +---------------------+  +--------------------+                   |
+-----------------------------------------------+--------------------------------------------+
                                                |
                        +-----------------------+-----------------------+
                        |                                               |
                        v                                               v
+-----------------------------------------------+   +---------------------------------------+
|              DATA ACCESS LAYER                |   |          EXTERNAL PROVIDERS           |
|  - Repositories with Parameterized Queries    |   |  - AI Provider (OpenAI / Mock fallback|
|  - ACID Transactions (BEGIN/COMMIT/ROLLBACK)  |   |  - Firebase Auth & Admin SDK          |
|  - Connection Pooling with pg                 |   |  - Firebase Cloud Messaging (FCM)     |
|  - Primary PostgreSQL + In-Memory Test Driver |   |  - Sentry Error Monitoring            |
+-----------------------------------------------+   +---------------------------------------+
```

---

## 2. Directory Structure
```text
fitnation-ai/
├── apps/
│   └── web/                     # React 18 + Vite Web App
├── backend/
│   ├── src/
│   │   ├── config/              # Validated environment configuration, DB pool, Firebase, Sentry
│   │   ├── middleware/          # authenticate, requireUser, rateLimit, validate, errorHandler
│   │   ├── modules/
│   │   │   ├── auth/            # Firebase token verification, session sync
│   │   │   ├── users/           # Profile CRUD, settings, avatar
│   │   │   ├── assessment/      # Multi-step onboarding, assessment history
│   │   │   ├── activity/        # Activity logs, range queries, daily rollups
│   │   │   ├── workouts/        # Exercise catalog, plans, sessions, exercise tracking
│   │   │   ├── exercise-form/   # Biomechanical kinematic engine (Squat, Pushup, Lunge, Plank, Curl)
│   │   │   ├── ai-coach/        # Provider abstraction, safe context assembly, chat
│   │   │   ├── nutrition/       # Food logging, macro breakdown, AI food parser
│   │   │   ├── challenges/      # Idempotent challenge progression, transactional rewards
│   │   │   ├── leaderboard/     # Multi-tier leaderboards (Global, College, City, State)
│   │   │   ├── groups/          # RBAC groups (Owner, Admin, Member), group leaderboards
│   │   │   ├── notifications/   # FCM device tokens, notification preferences
│   │   │   └── analytics/       # Aggregated progress metrics across 7d, 30d, 90d, 1y
│   │   ├── services/            # AI provider (OpenAI + MockAIProvider), Storage, FCM
│   │   ├── utils/               # Biomechanics math, geometry, responses, logger
│   │   ├── app.js               # Express app setup with security, CORS, routes
│   │   └── server.js            # Server bootstrap & graceful shutdown
│   ├── tests/                   # Automated tests (Unit, Integration, Auth, IDOR)
│   ├── migrations/              # Versioned SQL migration scripts
│   ├── seeds/                   # Production-ready catalog seed data
│   ├── package.json
│   └── .env.example
├── docs/                        # architecture.md, database.md, api.md, ai.md
├── docker-compose.yml
└── README.md
```

---

## 3. Security & Insecure Direct Object Reference (IDOR) Protections
1. **Zero-Trust Client Identity**: User IDs are never accepted from client query/params when they represent the authenticated actor. The identity is cryptographically determined from the Firebase JWT Bearer token and resolved into the local PostgreSQL `users.id`.
2. **Resource Ownership Verification**:
   - Every mutation and sensitive read verifies that the target resource belongs to `req.user.id`.
   - Exercise set updates verify: `set -> session -> user_id = req.user.id`.
   - Workout plan updates verify: `plan -> user_id = req.user.id`.
   - Food and activity logs verify: `log -> user_id = req.user.id`.
   - Group settings mutations verify: `group_members.role IN ('owner', 'admin')`.
3. **Defense-in-Depth Pipeline**:
   - Helmet for secure HTTP response headers.
   - CORS policy configuration.
   - Tiered rate limiters: General API, Auth sync, AI endpoints.
   - Zod request validation on body, query, and params.
   - Parameterized SQL queries preventing SQL injection.
   - Centralized error handling masking internal stack traces in production.

---

## 4. Resilience & Fallback Design
- **Offline / Local Testing**: In environments without a live PostgreSQL instance, the database layer transparently utilizes an in-memory SQL repository ensuring 100% test pass rates and instant developer setup.
- **AI Provider Abstraction**: Switchable between `openai` and `mock`. If `OPENAI_API_KEY` is omitted or provider times out, `MockAIProvider` generates realistic structured workouts, nutrition insights, and coaching responses.
- **Firebase Auth Bypass in Dev/Test**: A development header / mock token parser enables full integration testing without contacting external Firebase servers.
