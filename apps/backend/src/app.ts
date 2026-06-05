import Fastify from "fastify";
import fastifyCors from "@fastify/cors";
import fastifyMultipart from "@fastify/multipart";
import { env } from "./config/env.js";
import authPlugin from "./plugins/auth.plugin.js";
import swaggerPlugin from "./plugins/swagger.plugin.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { productsRoutes } from "./modules/products/products.routes.js";
import { dashboardRoutes } from "./modules/dashboard/dashboard.routes.js";
import { ordersRoutes } from "./modules/orders/orders.routes.js";
import { warehouseRoutes } from "./modules/warehouse/warehouse.routes.js";
import { reportsRoutes } from "./modules/reports/reports.routes.js";
import { usersRoutes } from "./modules/users/users.routes.js";
import { sseRoutes } from "./modules/realtime/sse.routes.js";

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: env.NODE_ENV === "production" ? "warn" : "info",
      transport:
        env.NODE_ENV !== "production"
          ? {
              target: "pino-pretty",
              options: { colorize: true, translateTime: "HH:MM:ss" },
            }
          : undefined,
    },
    trustProxy: true,
  });

  // CORS
  await app.register(fastifyCors, {
    origin: env.CORS_ORIGIN.split(",").map((o) => o.trim()),
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });

  // Multipart (CSV upload)
  await app.register(fastifyMultipart, {
    limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  });

  // Plugins
  await app.register(authPlugin);
  await app.register(swaggerPlugin);

  // Health check
  app.get("/health", async () => ({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    env: env.NODE_ENV,
  }));

  // Routes
  await app.register(authRoutes);
  await app.register(productsRoutes);
  await app.register(dashboardRoutes);
  await app.register(ordersRoutes);
  await app.register(warehouseRoutes);
  await app.register(reportsRoutes);
  await app.register(usersRoutes);
  await app.register(sseRoutes);

  // Global error handler
  app.setErrorHandler((error, _request, reply) => {
    app.log.error(error);
    reply.status(error.statusCode ?? 500).send({
      statusCode: error.statusCode ?? 500,
      error: error.name,
      message: error.message,
    });
  });

  // 404 handler
  app.setNotFoundHandler((_request, reply) => {
    reply.status(404).send({
      statusCode: 404,
      error: "NOT_FOUND",
      message: "Route not found.",
    });
  });

  return app;
}