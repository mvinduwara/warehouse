import bcrypt from "bcryptjs";
import { prisma } from "../../lib/prisma.js";
import { UnauthorizedError, NotFoundError } from "../../lib/errors.js";
import { env } from "../../config/env.js";

export interface LoginResult {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    avatarInitials: string;
  };
}

export const authService = {
  async login(
    email: string,
    password: string,
    signToken: (payload: object) => string
  ): Promise<LoginResult> {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) {
      throw new UnauthorizedError("Invalid email or password.");
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedError("Invalid email or password.");
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const token = signToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarInitials: user.avatarInitials,
      },
    };
  },

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarInitials: true,
      },
    });
    if (!user) throw new NotFoundError("User");
    return user;
  },
};