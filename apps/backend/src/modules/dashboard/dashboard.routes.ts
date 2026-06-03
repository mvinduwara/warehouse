import type { FastifyInstance } from "fastify";
import { dashboardService } from "./dashboard.service.js";
import { authenticate } from "../../middleware/authenticate.js";
import { sendError } from "../../lib/errors.js";

export async function dashboardRoutes(fastify: FastifyInstance) {
  const auth = { preHandler: [authenticate] };

  fastify.get("/dashboard/stats", auth, async (_req, reply) => {
    try {
      return reply.send(await dashboardService.getStats());
    } catch (err) {
      return sendError(reply, err);
    }
  });

  fastify.get("/dashboard/trend", auth, async (request, reply) => {
    try {
      const q = request.query as { days?: string };
      const days = Math.min(90, Math.max(7, Number(q.days ?? 30)));
      return reply.send(await dashboardService.getStockTrend(days));
    } catch (err) {
      return sendError(reply, err);
    }
  });

  fastify.get("/dashboard/activity", auth, async (request, reply) => {
    try {
      const q = request.query as { limit?: string };
      const limit = Math.min(50, Math.max(1, Number(q.limit ?? 10)));
      return reply.send(await dashboardService.getRecentActivity(limit));
    } catch (err) {
      return sendError(reply, err);
    }
  });

  fastify.get("/dashboard/top-products", auth, async (request, reply) => {
    try {
      const q = request.query as { limit?: string };
      const limit = Math.min(20, Math.max(1, Number(q.limit ?? 5)));
      return reply.send(await dashboardService.getTopProducts(limit));
    } catch (err) {
      return sendError(reply, err);
    }
  });

  fastify.get("/dashboard/categories", auth, async (_req, reply) => {
    try {
      return reply.send(await dashboardService.getCategoryDistribution());
    } catch (err) {
      return sendError(reply, err);
    }
  });
}