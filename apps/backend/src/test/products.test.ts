import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getTestApp, getAuthToken, cleanupTestProducts } from "./helpers.js";
import type { FastifyInstance } from "fastify";

let app: FastifyInstance;
let adminToken: string;
let viewerToken: string;
const testSkus = ["TEST-001", "TEST-002"];

beforeAll(async () => {
  app = await getTestApp();
  adminToken = await getAuthToken("admin");
  viewerToken = await getAuthToken("viewer");
});

afterAll(async () => {
  await cleanupTestProducts(testSkus);
});

describe("GET /products", () => {
  it("returns paginated product list for authenticated users", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/products",
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body).toHaveProperty("data");
    expect(body).toHaveProperty("total");
    expect(body).toHaveProperty("page");
    expect(body).toHaveProperty("totalPages");
    expect(Array.isArray(body.data)).toBe(true);
  });

  it("returns 401 for unauthenticated request", async () => {
    const res = await app.inject({ method: "GET", url: "/products" });
    expect(res.statusCode).toBe(401);
  });

  it("filters by category", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/products?category=Electronics",
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    body.data.forEach((p: { category: string }) => {
      expect(p.category).toBe("Electronics");
    });
  });
});

describe("POST /products", () => {
  it("creates a product as admin/operator", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/products",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json",
      },
      payload: {
        sku: "TEST-001",
        name: "Test Product One",
        category: "Electronics",
        unitOfMeasure: "ea",
        unitCost: 10,
        sellingPrice: 25,
        reorderPoint: 20,
        initialQty: 100,
        locationZone: "Zone A",
      },
    });

    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body.sku).toBe("TEST-001");
    expect(body.totalOnHand).toBe(100);
  });

  it("returns 409 for duplicate SKU", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/products",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json",
      },
      payload: {
        sku: "TEST-001",
        name: "Duplicate",
        category: "Electronics",
        unitOfMeasure: "ea",
        unitCost: 10,
        sellingPrice: 20,
        reorderPoint: 10,
        initialQty: 0,
        locationZone: "Zone A",
      },
    });
    expect(res.statusCode).toBe(409);
  });

  it("returns 403 for viewer role", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/products",
      headers: {
        Authorization: `Bearer ${viewerToken}`,
        "Content-Type": "application/json",
      },
      payload: {
        sku: "TEST-002",
        name: "Should Fail",
        category: "Electronics",
        unitOfMeasure: "ea",
        unitCost: 10,
        sellingPrice: 20,
        reorderPoint: 10,
        initialQty: 0,
        locationZone: "Zone A",
      },
    });
    expect(res.statusCode).toBe(403);
  });
});

describe("GET /inventory-levels/low-stock", () => {
  it("returns products at or below reorder point", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/inventory-levels/low-stock",
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(Array.isArray(body)).toBe(true);
    body.forEach((p: { stockStatus: string }) => {
      expect(["low", "critical", "out_of_stock"]).toContain(p.stockStatus);
    });
  });
});