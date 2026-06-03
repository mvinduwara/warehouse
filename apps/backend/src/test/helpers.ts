import { buildApp } from "../app.js";
import type { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma.js";
import bcrypt from "bcryptjs";

let app: FastifyInstance;

export async function getTestApp(): Promise<FastifyInstance> {
  if (!app) {
    app = await buildApp();
    await app.ready();
  }
  return app;
}

export async function getAuthToken(role: "admin" | "manager" | "operator" | "viewer" = "admin"): Promise<string> {
  const email = `test-${role}@wms-test.com`;
  await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      name: `Test ${role}`,
      email,
      passwordHash: await bcrypt.hash("test-password", 4),
      role,
      avatarInitials: "TS",
    },
  });

  const server = await getTestApp();
  const response = await server.inject({
    method: "POST",
    url: "/auth/login",
    payload: { email, password: "test-password" },
  });

  const body = JSON.parse(response.body);
  return body.token as string;
}

export async function cleanupTestProducts(skus: string[]) {
  await prisma.product.deleteMany({ where: { sku: { in: skus } } });
}