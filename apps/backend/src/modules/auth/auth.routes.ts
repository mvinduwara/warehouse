import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { authService } from "./auth.service.js";
import { authenticate } from "../../middleware/authenticate.js";
import { sendError } from "../../lib/errors.js";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function authRoutes(fastify: FastifyInstance) {
  fastify.post("/auth/login", async (request, reply) => {
    const body = loginSchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ message: "Invalid request body." });
    }
    try {
      const result = await authService.login(
        body.data.email,
        body.data.password,
        (payload) => fastify.jwt.sign(payload)
      );
      return reply.status(200).send(result);
    } catch (err) {
      return sendError(reply, err);
    }
  });

  fastify.get(
    "/auth/me",
    { preHandler: [authenticate] },
    async (request, reply) => {
      try {
        const user = await authService.getMe(request.user.sub);
        return reply.send(user);
      } catch (err) {
        return sendError(reply, err);
      }
    }
  );

  fastify.post(
    "/auth/logout",
    { preHandler: [authenticate] },
    async (_request, reply) => {
      return reply.status(204).send();
    }
  );
}