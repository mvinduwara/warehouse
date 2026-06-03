import { describe, it, expect, beforeAll } from "vitest";
import { getTestApp } from "./helpers.js";
import type { FastifyInstance } from "fastify";

let app: FastifyInstance;

beforeAll(async () => {
  app = await getTestApp();
});

describe("POST /auth/login", () => {
  it("returns 200 and a token for valid credentials", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email: "admin@wms.com", password: "password123" },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body).toHaveProperty("token");
    expect(body.user).toMatchObject({
      email: "admin@wms.com",
      role: "admin",
    });
  });

  it("returns 401 for wrong password", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email: "admin@wms.com", password: "wrongpassword" },
    });
    expect(res.statusCode).toBe(401);
  });

  it("returns 401 for unknown email", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email: "nobody@wms.com", password: "password123" },
    });
    expect(res.statusCode).toBe(401);
  });

  it("returns 400 for invalid email format", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email: "not-an-email", password: "password123" },
    });
    expect(res.statusCode).toBe(400);
  });
});

describe("GET /auth/me", () => {
  it("returns the current user for a valid token", async () => {
    const loginRes = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email: "admin@wms.com", password: "password123" },
    });
    const { token } = JSON.parse(loginRes.body);

    const res = await app.inject({
      method: "GET",
      url: "/auth/me",
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body).toMatchObject({ email: "admin@wms.com", role: "admin" });
    expect(body).not.toHaveProperty("passwordHash");
  });

  it("returns 401 without a token", async () => {
    const res = await app.inject({ method: "GET", url: "/auth/me" });
    expect(res.statusCode).toBe(401);
  });
});