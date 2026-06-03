import { describe, it, expect, beforeAll } from "vitest";
import { getTestApp, getAuthToken } from "./helpers.js";
import type { FastifyInstance } from "fastify";

let app: FastifyInstance;
let adminToken: string;

beforeAll(async () => {
  app = await getTestApp();
  adminToken = await getAuthToken("admin");
});

describe("GET /purchase-orders", () => {
  it("returns purchase orders list", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/purchase-orders",
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body).toHaveProperty("data");
    expect(Array.isArray(body.data)).toBe(true);
  });

  it("filters by status", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/purchase-orders?status=received",
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    body.data.forEach((po: { status: string }) => {
      expect(po.status).toBe("received");
    });
  });
});

describe("GET /sales-orders", () => {
  it("returns sales orders list", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/sales-orders",
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body).toHaveProperty("data");
  });
});

describe("GET /suppliers", () => {
  it("returns supplier list", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/suppliers",
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
  });
});