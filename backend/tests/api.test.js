import assert from "node:assert/strict";
import test, { describe } from "node:test";
import request from "supertest";
import app from "../src/app.js";

// Helper headers for authenticated dev users
const userAHeaders = {
  Authorization: "Bearer dev-token:user-alpha:alpha@fitnation.ai:Alpha Athlete",
};

const userBHeaders = {
  Authorization: "Bearer dev-token:user-beta:beta@fitnation.ai:Beta Athlete",
};

describe("1. Health & Core Gateway Endpoints", () => {
  test("GET /health returns 200 and operational status", async () => {
    const res = await request(app).get("/health");
    assert.equal(res.status, 200);
    assert.equal(res.body.ok, true);
    assert.equal(res.body.service, "FitNation AI Backend");
  });

  test("GET /api/test returns 200 message", async () => {
    const res = await request(app).get("/api/test");
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
  });

  test("GET /api/unknown-endpoint returns 404 with structured error envelope", async () => {
    const res = await request(app).get("/api/unknown-endpoint");
    assert.equal(res.status, 404);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, "NOT_FOUND");
  });
});

describe("2. Authentication & User Profile", () => {
  test("GET /api/users/me without token fails with 401", async () => {
    const res = await request(app).get("/api/users/me");
    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  test("POST /api/users/sync creates and synchronizes user row", async () => {
    const res = await request(app)
      .post("/api/users/sync")
      .set(userAHeaders)
      .send({ name: "Alpha Athlete" });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.name, "Alpha Athlete");
  });

  test("GET /api/users/me returns authenticated profile", async () => {
    const res = await request(app).get("/api/users/me").set(userAHeaders);
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.name, "Alpha Athlete");
  });

  test("PATCH /api/users/me updates profile with validation", async () => {
    const res = await request(app)
      .patch("/api/users/me")
      .set(userAHeaders)
      .send({
        age: 26,
        height_cm: 180,
        weight_kg: 78,
        fitness_level: "Intermediate",
        goal: "Muscle building",
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
  });

  test("PATCH /api/users/me rejects invalid data types", async () => {
    const res = await request(app)
      .patch("/api/users/me")
      .set(userAHeaders)
      .send({
        age: -5, // Invalid: must be >= 10
      });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, "VALIDATION_ERROR");
  });
});

describe("3. Insecure Direct Object Reference (IDOR) Protection", () => {
  let userAExerciseId;
  let userAMealId;

  test("User A creates a workout plan with exercises", async () => {
    const res = await request(app)
      .post("/api/workouts")
      .set(userAHeaders)
      .send({
        title: "Alpha Heavy Upper",
        duration_min: 45,
        is_custom: true,
        exercises: [
          { name: "Bench Press", sets: 3, reps: 8, rest_seconds: 90 },
          { name: "Overhead Press", sets: 3, reps: 10, rest_seconds: 60 },
        ],
      });

    assert.equal(res.status, 201);
    assert.ok(res.body.data.exercises.length >= 2);
    userAExerciseId = res.body.data.exercises[0].id;
    assert.ok(userAExerciseId);
  });

  test("User B cannot modify User A's workout exercise (403 Forbidden)", async () => {
    const res = await request(app)
      .patch(`/api/workouts/exercise/${userAExerciseId}`)
      .set(userBHeaders)
      .send({ is_done: true });

    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, "FORBIDDEN");
  });

  test("User A can successfully update their own workout exercise (200 OK)", async () => {
    const res = await request(app)
      .patch(`/api/workouts/exercise/${userAExerciseId}`)
      .set(userAHeaders)
      .send({ is_done: true });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.is_done, true);
  });

  test("User A logs a meal and User B cannot delete it (403 Forbidden)", async () => {
    const mealRes = await request(app)
      .post("/api/nutrition")
      .set(userAHeaders)
      .send({
        meal: "lunch",
        description: "Alpha Protein Bowl",
        calories: 550,
        protein_g: 45,
        carbs_g: 50,
        fat_g: 15,
      });

    assert.equal(mealRes.status, 201);
    userAMealId = mealRes.body.data.id;

    const delRes = await request(app)
      .delete(`/api/nutrition/${userAMealId}`)
      .set(userBHeaders);

    assert.equal(delRes.status, 403);
    assert.equal(delRes.body.success, false);
  });
});

describe("4. Challenge Idempotency & Reward Duplication Prevention", () => {
  let challengeId;

  test("Fetch active challenges list", async () => {
    const res = await request(app).get("/api/challenges").set(userAHeaders);
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.data.length > 0);
    challengeId = res.body.data[0].id;
  });

  test("Completing challenge awards points on first completion", async () => {
    const res = await request(app)
      .post(`/api/challenges/${challengeId}/progress`)
      .set(userAHeaders)
      .send({ increment: 10 }); // Exceeds target to trigger completion

    assert.equal(res.status, 200);
    assert.equal(res.body.data.reward_awarded, true);
    assert.ok(res.body.data.reward_points > 0);
  });

  test("Repeating completion request does NOT duplicate reward points (Idempotency Guard)", async () => {
    const res = await request(app)
      .post(`/api/challenges/${challengeId}/progress`)
      .set(userAHeaders)
      .send({ increment: 1 });

    assert.equal(res.status, 200);
    assert.equal(res.body.data.reward_awarded, false);
    assert.equal(res.body.data.reward_points, 0);
  });
});

describe("5. Biomechanical Form Analysis Engine", () => {
  test("Analyzes squat keypoints and computes score and angles", async () => {
    // Generate simulated 33 MediaPipe landmarks for a parallel squat
    const dummyLandmarks = Array.from({ length: 33 }, (_, i) => ({
      x: 0.5,
      y: 0.5,
      z: 0.0,
      visibility: 0.99,
    }));

    // Position Left Hip (23), Left Knee (25), Left Ankle (27) to form ~90 deg angle
    dummyLandmarks[23] = { x: 0.5, y: 0.5, z: 0.0, visibility: 0.99 }; // Hip
    dummyLandmarks[25] = { x: 0.5, y: 0.7, z: 0.0, visibility: 0.99 }; // Knee
    dummyLandmarks[27] = { x: 0.3, y: 0.7, z: 0.0, visibility: 0.99 }; // Ankle (90 deg)

    const res = await request(app)
      .post("/api/form-check/analyze")
      .set(userAHeaders)
      .send({
        exercise: "Squat",
        pose_keypoints: { landmarks: dummyLandmarks },
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.exercise, "Squat");
    assert.ok(res.body.data.score >= 0 && res.body.data.score <= 100);
    assert.ok(res.body.data.feedback);
  });
});

describe("6. AI Coach & Safety Guardrails", () => {
  test("AI coach responds to general training questions", async () => {
    const res = await request(app)
      .post("/api/ai/chat")
      .set(userAHeaders)
      .send({ message: "How do I improve my squat depth?" });

    assert.equal(res.status, 200);
    assert.ok(res.body.data.reply.length > 20);
  });

  test("AI coach triggers medical safety disclaimer on acute health queries", async () => {
    const res = await request(app)
      .post("/api/ai/chat")
      .set(userAHeaders)
      .send({ message: "I am having severe chest pain during bench press" });

    assert.equal(res.status, 200);
    assert.ok(res.body.data.reply.includes("Medical Advisory"));
    assert.ok(res.body.data.reply.includes("healthcare professional"));
  });

  test("AI natural language food parser returns estimated macros", async () => {
    const res = await request(app)
      .post("/api/ai/parse-food")
      .set(userAHeaders)
      .send({ text: "2 rotis and paneer curry with bowl of rice" });

    assert.equal(res.status, 200);
    assert.ok(res.body.data.estimated_calories > 200);
    assert.ok(res.body.data.protein_g > 10);
  });
});

describe("7. Activity Tracking & Leaderboard", () => {
  test("Upserts activity log without duplication", async () => {
    const today = new Date().toISOString().slice(0, 10);
    const res1 = await request(app)
      .post("/api/activity")
      .set(userAHeaders)
      .send({
        log_date: today,
        steps: 8000,
        distance_km: 6.0,
        calories: 450,
        active_minutes: 50,
      });
    assert.equal(res1.status, 200);

    const res2 = await request(app)
      .post("/api/activity")
      .set(userAHeaders)
      .send({
        log_date: today,
        steps: 9500,
        distance_km: 7.2,
        calories: 520,
        active_minutes: 65,
      });
    assert.equal(res2.status, 200);
    assert.equal(res2.body.data.steps, 9500);
  });

  test("GET /api/leaderboard returns ranked list with user rank", async () => {
    const res = await request(app).get("/api/leaderboard").set(userAHeaders);
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.data.leaders));
    assert.ok(res.body.data.user_rank);
  });
});
