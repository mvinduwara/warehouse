import type { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../lib/prisma.js";
import { UnauthorizedError, sendError } from "../lib/errors.js";

export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    await request.jwtVerify();
    const user = await prisma.user.findUnique({
      where: { id: request.user.sub },
      select: { id: true, role: true, isActive: true },
    });
    if (!user || !user.isActive) {
      return sendError(reply, new UnauthorizedError("Account not found or deactivated."));
    }
  } catch (err) {
    return sendError(reply, new UnauthorizedError("Invalid or expired token."));
  }
}