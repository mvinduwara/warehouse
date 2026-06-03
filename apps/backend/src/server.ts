import { buildApp } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./lib/prisma.js";
import { startScheduler, stopScheduler } from "./jobs/scheduler.js";

async function start() {
  const app = await buildApp();

  try {
    await prisma.$connect();
    app.log.info("✅ Database connected");
  } catch (err) {
    app.log.error("❌ Database connection failed:", err);
    process.exit(1);
  }

  startScheduler();

  try {
    await app.listen({ port: env.PORT, host: env.HOST });
    app.log.info(`🚀 Server running at http://${env.HOST}:${env.PORT}`);
    app.log.info(`📖 API docs at   http://${env.HOST}:${env.PORT}/docs`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }

  const shutdown = async (signal: string) => {
    app.log.info(`\n${signal} received — shutting down gracefully`);
    stopScheduler();
    await app.close();
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("uncaughtException", (err) => {
    app.log.error("Uncaught exception:", err);
    process.exit(1);
  });
  process.on("unhandledRejection", (reason) => {
    app.log.error("Unhandled rejection:", reason);
    process.exit(1);
  });
}

start();