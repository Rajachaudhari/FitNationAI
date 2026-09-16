# FitNation AI — Next-Gen AI Fitness Platform

[![Tests](https://img.shields.io/badge/tests-21%20passing-brightgreen.svg)]()
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)]()
[![Node](https://img.shields.io/badge/Node.js-v20%2B-blue.svg)]()
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue.svg)]()
[![React](https://img.shields.io/badge/React-18.3-61dafb.svg)]()

FitNation AI is a full-stack, production-grade fitness ecosystem featuring real-time computer-vision exercise form analysis, personalized AI workout generation, conversational AI coaching with medical guardrails, natural language nutrition intelligence, community gamification with idempotent rewards, and multi-tier leaderboards.

---

## 1. System Architecture

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

## 2. Key Improvements Over Reference Implementation

| Domain | Reference Prototype (`AlgiGenAI-main`) | FitNation AI Platform |
| :--- | :--- | :--- |
| **Form Analysis** | Hardcoded mock `return 0.85;` | Real 2D/3D vector angle trigonometry (Squat, Push-up, Lunge, Plank, Bicep Curl), depth tracking, knee valgus detection, and rep counting |
| **Challenge Rewards** | Infinite point glitch: repeated requests multiplied XP infinitely | Idempotent transactional reward claim with atomic check constraint and audit trail |
| **IDOR Protection** | Missing: any user could modify another user's exercise by ID | Strict resource ownership verification on exercises, food logs, and groups |
| **AI Workout Generation** | Missing completely | Structured LLM generation with Zod schema validation and catalog reconciliation |
| **AI Coach** | Hardcoded OpenAI call without guardrails | Provider abstraction (`OpenAIProvider` + `MockAIProvider`), medical safety filters, and context injection |
| **Nutrition Intelligence**| Free-text string logging only | AI natural language food parser estimating calories, protein, carbs, and fat |
| **Database Design** | Missing exercise catalog, audit ledgers, sessions | 20 normalized PostgreSQL tables with foreign key cascades, unique constraints, and B-Tree indexes |
| **Testing** | 0 tests | 21 automated unit, integration, IDOR, and idempotency tests passing with 100% success rate |

---

## 3. Quick Start Guide

### Prerequisites
- Node.js v18+ (tested on Node v24)
- npm v9+
- Docker & Docker Compose (optional, for local PostgreSQL)

### Option A: Local Development (Instant Setup)
The backend features an intelligent fallback storage engine, allowing you to run, explore, and test the full application immediately without installing external database services:

1. **Install Backend Dependencies**:
   ```bash
   cd backend
   npm install
   ```

2. **Run Automated Test Suite**:
   ```bash
   npm test
   # Output: 21 tests passed (0 failures)
   ```

3. **Start Backend Server**:
   ```bash
   npm run dev
   # Listening on http://localhost:4000
   ```

4. **Start Web Frontend**:
   ```bash
   cd ../apps/web
   npm install
   npm run dev
   # Listening on http://localhost:3000
   ```

### Option B: Docker Compose (Full Stack with PostgreSQL)
```bash
docker compose up -d
```
Starts:
- PostgreSQL 16 on port 5432 with auto-migration of `001_initial_schema.sql` and `001_seed_data.sql`
- FitNation AI Backend on port 4000

---

## 4. Environment Variables

Create `.env` in `backend/` based on `backend/.env.example`:

```env
PORT=4000
NODE_ENV=development
DATABASE_URL=postgres://postgres:postgres@localhost:5432/fitnation_ai
PGSSL=false

# Firebase Admin
FIREBASE_PROJECT_ID=fitnation-dev
FIREBASE_CLIENT_EMAIL=admin@fitnation-dev.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_STORAGE_BUCKET=fitnation-dev.appspot.com

# AI Provider ("openai" or "mock")
AI_PROVIDER=mock
AI_MODEL=gpt-4o-mini
OPENAI_API_KEY=sk-...

# Observability
SENTRY_DSN=
```

---

## 5. REST API Documentation Summary

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/users/sync` | Sync Firebase user into PostgreSQL | Bearer JWT |
| `GET` | `/api/users/me` | Full profile of authenticated user | Bearer JWT |
| `PATCH` | `/api/users/me` | Update athlete metrics (height, weight, age) | Bearer JWT |
| `POST` | `/api/users/assessment` | Save multi-step onboarding assessment | Bearer JWT |
| `POST` | `/api/activity` | Upsert daily step, calorie, and distance log | Bearer JWT |
| `GET` | `/api/activity/range` | Range query for progress charts | Bearer JWT |
| `GET` | `/api/workouts/today` | Today's active workout plan | Bearer JWT |
| `POST` | `/api/workouts/generate` | AI workout generation pipeline | Bearer JWT |
| `PATCH` | `/api/workouts/exercise/:id` | Toggle exercise completion (IDOR protected) | Bearer JWT |
| `POST` | `/api/form-check/analyze` | MediaPipe pose landmark biomechanical analysis | Bearer JWT |
| `POST` | `/api/ai/chat` | Conversational coach with medical guardrails | Bearer JWT |
| `POST` | `/api/ai/parse-food` | Natural language food to macro parser | Bearer JWT |
| `POST` | `/api/challenges/:id/progress` | Idempotent challenge progress and XP reward | Bearer JWT |
| `GET` | `/api/leaderboard` | Multi-tier leaderboard (Global, College, City) | Bearer JWT |

For full details, refer to `docs/api.md`, `docs/architecture.md`, and `docs/database.md`.
