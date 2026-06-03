import type { FastifyInstance } from "fastify";
import { sseHub } from "./sse.service.js";
import { authenticate } from "../../middleware/authenticate.js";
import { sendError } from "../../lib/errors.js";

export async function sseRoutes(fastify: FastifyInstance) {
  fastify.get(
    "/events",
    { preHandler: [authenticate] },
    async (request, reply) => {
      try {
        reply.raw.setHeader("Content-Type", "text/event-stream");
        reply.raw.setHeader("Cache-Control", "no-cache");
        reply.raw.setHeader("Connection", "keep-alive");
        reply.raw.setHeader("X-Accel-Buffering", "no");
        reply.raw.flushHeaders();

        const clientId = sseHub.addClient(request.user.sub, reply);

        // Send initial ping so the client knows connection is live
        reply.raw.write(`event: ping\ndata: ${JSON.stringify({ connected: true, clientId })}\n\n`);

        // Keep-alive ping every 30 seconds
        const ping = setInterval(() => {
          try {
            reply.raw.write(`event: ping\ndata: ${JSON.stringify({ ts: Date.now() })}\n\n`);
          } catch {
            clearInterval(ping);
          }
        }, 30_000);

        request.raw.on("close", () => {
          clearInterval(ping);
          sseHub.removeClient(clientId);
        });

        request.raw.on("error", () => {
          clearInterval(ping);
          sseHub.removeClient(clientId);
        });

        // Keep the connection open (never resolve)
        await new Promise<void>((resolve) => {
          request.raw.on("close", resolve);
        });
      } catch (err) {
        return sendError(reply, err);
      }
    }
  );
}