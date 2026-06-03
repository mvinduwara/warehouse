import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { warehouseService } from "./warehouse.service.js";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { sendError } from "../../lib/errors.js";

const createTransferSchema = z.object({
  fromLocationId: z.string().min(1),
  toLocationId: z.string().min(1),
  productId: z.string().min(1),
  quantity: z.number().int().positive(),
  reason: z.string().min(1),
});

export async function warehouseRoutes(fastify: FastifyInstance) {
  const auth = { preHandler: [authenticate] };
  const authOp = { preHandler: [authenticate, authorize("operator")] };

  fastify.get("/zones", auth, async (_req, reply) => {
    try {
      return reply.send(await warehouseService.getZones());
    } catch (err) {
      return sendError(reply, err);
    }
  });

  fastify.get("/zones/:id", auth, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      return reply.send(await warehouseService.getZone(id));
    } catch (err) {
      return sendError(reply, err);
    }
  });

  fastify.get("/locations", auth, async (request, reply) => {
    try {
      const q = request.query as { zoneId?: string };
      return reply.send(await warehouseService.getLocations(q.zoneId));
    } catch (err) {
      return sendError(reply, err);
    }
  });

  fastify.get("/locations/rack-map", auth, async (_req, reply) => {
    try {
      return reply.send(await warehouseService.getRackMap());
    } catch (err) {
      return sendError(reply, err);
    }
  });

  fastify.get("/transfers", auth, async (request, reply) => {
    try {
      const q = request.query as { status?: string };
      return reply.send(await warehouseService.getTransfers(q.status));
    } catch (err) {
      return sendError(reply, err);
    }
  });

  fastify.get("/transfers/:id", auth, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      return reply.send(await warehouseService.getTransfer(id));
    } catch (err) {
      return sendError(reply, err);
    }
  });

  fastify.post("/transfers", authOp, async (request, reply) => {
    try {
      const body = createTransferSchema.safeParse(request.body);
      if (!body.success) return reply.status(400).send({ message: body.error.errors[0]?.message });
      return reply.status(201).send(await warehouseService.createTransfer(body.data, request.user.sub));
    } catch (err) {
      return sendError(reply, err);
    }
  });

  fastify.patch("/transfers/:id/confirm", authOp, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      return reply.send(await warehouseService.confirmTransfer(id));
    } catch (err) {
      return sendError(reply, err);
    }
  });

  fastify.patch("/transfers/:id/complete", authOp, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      return reply.send(await warehouseService.completeTransfer(id));
    } catch (err) {
      return sendError(reply, err);
    }
  });

  fastify.patch("/transfers/:id/cancel", authOp, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      return reply.send(await warehouseService.cancelTransfer(id));
    } catch (err) {
      return sendError(reply, err);
    }
  });
}