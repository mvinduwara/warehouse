import type { FastifyRequest, FastifyReply } from "fastify";
import { ForbiddenError, sendError } from "../lib/errors.js";
import type { Role } from "@prisma/client";

const ROLE_HIERARCHY: Record<Role, number> = {
  admin: 4,
  manager: 3,
  operator: 2,
  viewer: 1,
};

export function authorize(minRole: Role) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const userRole = request.user.role as Role;
    if (!userRole || ROLE_HIERARCHY[userRole] < ROLE_HIERARCHY[minRole]) {
      return sendError(
        reply,
        new ForbiddenError(`Requires at least ${minRole} role.`)
      );
    }
  };
}