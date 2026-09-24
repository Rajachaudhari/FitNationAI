import assert from "node:assert/strict";
import test, { describe } from "node:test";
import request from "supertest";
import app from "../src/app.js";

describe("8. Complete Authentication System Endpoints", () => {
  const testUser = {
    name: "Rohit Sharma",
    email: "rohit.sharma@fitnation.ai",
    phone: "9876543211",
    age: 28,
    gender: "male",
    password: "Password@123",
    confirmPassword: "Password@123",
    terms: true,
  };

  let authToken = "";

  test("POST /api/auth/register fails if required fields or terms are missing", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Rohit",
        email: "invalid-email",
        phone: "123", // Invalid phone
        age: 8, // Invalid age < 10
        password: "123", // Too short
        terms: false,
      });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, "VALIDATION_ERROR");
  });

  test("POST /api/auth/register successfully creates user and returns JWT token", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send(testUser);

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.token);
    assert.equal(res.body.data.user.email, testUser.email);
    assert.equal(res.body.data.user.name, testUser.name);
    assert.equal(res.body.data.user.phone, testUser.phone);
    assert.equal(res.body.data.user.points, 100);

    authToken = res.body.data.token;
  });

  test("POST /api/auth/register rejects duplicate registration", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send(testUser);

    assert.equal(res.status, 409);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, "CONFLICT");
  });

  test("POST /api/auth/login successfully logs in with email", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        identifier: testUser.email,
        password: testUser.password,
        rememberMe: true,
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.token);
    assert.equal(res.body.data.user.email, testUser.email);
  });

  test("POST /api/auth/login successfully logs in with 10-digit mobile number", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        identifier: testUser.phone,
        password: testUser.password,
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.token);
    assert.equal(res.body.data.user.name, testUser.name);
  });

  test("POST /api/auth/login rejects incorrect password", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        identifier: testUser.email,
        password: "WrongPassword999",
      });

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, "AUTHENTICATION_ERROR");
  });

  test("GET /api/auth/me returns authenticated user details using JWT token", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set({ Authorization: `Bearer ${authToken}` });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.email, testUser.email);
    assert.equal(res.body.data.name, testUser.name);
  });

  test("POST /api/auth/logout succeeds", async () => {
    const res = await request(app).post("/api/auth/logout");
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
  });
});
