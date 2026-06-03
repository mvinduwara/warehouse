import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { usersService } from "./users.service.js";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { sendError } from "../../lib/errors.js";

const inviteSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  role: z.enum(["admin", "manager", "operator", "viewer"]),
});

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  role: z.enum(["admin", "manager", "operator", "viewer"]).optional(),
  isActive: z.boolean().optional(),
});

export async function usersRoutes(fastify: FastifyInstance) {
  const auth = { preHandler: [authenticate] };
  const authAdmin = { preHandler: [authenticate, authorize("admin")] };
  const authMgr = { preHandler: [authenticate, authorize("manager")] };

  fastify.get("/users", authMgr, async (_req, reply) => {
    try {
      return reply.send(await usersService.getUsers());
    } catch (err) {
      return sendError(reply, err);
    }
  });

  fastify.post("/users/invite", authAdmin, async (request, reply) => {
    try {
      const body = inviteSchema.safeParse(request.body);
      if (!body.success) return reply.status(400).send({ message: body.error.errors[0]?.message });
      return reply.status(201).send(await usersService.inviteUser(body.data));
    } catch (err) {
      return sendError(reply, err);
    }
  });

  fastify.patch("/users/:id", authMgr, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const body = updateSchema.safeParse(request.body);
      if (!body.success) return reply.status(400).send({ message: body.error.errors[0]?.message });
      return reply.send(await usersService.updateUser(id, body.data));
    } catch (err) {
      return sendError(reply, err);
    }
  });

  fastify.patch("/users/:id/deactivate", authAdmin, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      return reply.send(await usersService.updateUser(id, { isActive: false }));
    } catch (err) {
      return sendError(reply, err);
    }
  });

  fastify.get("/settings/api-key", authAdmin, async (_req, reply) => {
    try {
      return reply.send(await usersService.getApiKey());
    } catch (err) {
      return sendError(reply, err);
    }
  });

  fastify.post("/settings/api-key/regenerate", authAdmin, async (_req, reply) => {
    try {
      return reply.send(await usersService.regenerateApiKey());
    } catch (err) {
      return sendError(reply, err);
    }
  });

  fastify.put("/settings/webhook", authMgr, async (request, reply) => {
    try {
      const body = z.object({ url: z.string().url() }).safeParse(request.body);
      if (!body.success) return reply.status(400).send({ message: body.error.errors[0]?.message });
      return reply.send(await usersService.updateWebhook(body.data.url));
    } catch (err) {
      return sendError(reply, err);
    }
  });

  fastify.post("/settings/webhook/test", authMgr, async (_req, reply) => {
    try {
      return reply.send(await usersService.testWebhook());
    } catch (err) {
      return sendError(reply, err);
    }
  });
}