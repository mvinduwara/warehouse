import bcrypt from "bcryptjs";
import { prisma } from "../../lib/prisma.js";
import { NotFoundError, ConflictError } from "../../lib/errors.js";
import { env } from "../../config/env.js";
import type { Role } from "@prisma/client";

export interface InviteUserInput {
  email: string;
  name: string;
  role: Role;
}

export interface UpdateUserInput {
  name?: string;
  role?: Role;
  isActive?: boolean;
}

export const usersService = {
  async getUsers() {
    return prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarInitials: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
      orderBy: { name: "asc" },
    }).then((users) =>
      users.map((u) => ({
        ...u,
        createdAt: u.createdAt.toISOString(),
        lastLoginAt: u.lastLoginAt?.toISOString(),
      }))
    );
  },

async inviteUser(input: InviteUserInput) {
  const exists = await prisma.user.findUnique({ where: { email: input.email } });
  if (exists) throw new ConflictError(`User with email "${input.email}" already exists.`);

  const tempPassword = Math.random().toString(36).slice(-10) + "A1!";
  const passwordHash = await bcrypt.hash(tempPassword, env.BCRYPT_ROUNDS);
  const initials = input.name
    .split(" ")
    .map((w) => w[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("");

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash,
      role: input.role,
      avatarInitials: initials,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatarInitials: true,
      isActive: true,
      createdAt: true,
    },
  });

  const warehouseSetting = await prisma.setting.findUnique({ where: { key: "warehouse_name" } });
  const { inviteUserTemplate } = await import("../../lib/email-templates.js");
  const { sendEmail } = await import("../../lib/mailer.js");

  const template = inviteUserTemplate({
    name: input.name,
    email: input.email,
    role: input.role,
    tempPassword,
    warehouseName: warehouseSetting?.value ?? "WarehouseOS",
    loginUrl: env.FRONTEND_URL + "/login",
  });

  await sendEmail({ to: input.email, ...template }).catch((err) => {
    console.error("[invite] Email failed (user still created):", err);
  });

  return { ...user, createdAt: user.createdAt.toISOString() };
},

  async updateUser(id: string, input: UpdateUserInput) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundError("User");

    const updated = await prisma.user.update({
      where: { id },
      data: input,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarInitials: true,
        isActive: true,
        createdAt: true,
      },
    });

    return { ...updated, createdAt: updated.createdAt.toISOString() };
  },

  async getApiKey() {
    const setting = await prisma.setting.findUnique({ where: { key: "api_key" } });
    return { key: setting?.value ?? "wms_live_sk_default" };
  },

  async regenerateApiKey() {
    const newKey = `wms_live_sk_${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;
    await prisma.setting.upsert({
      where: { key: "api_key" },
      update: { value: newKey },
      create: { key: "api_key", value: newKey },
    });
    return { key: newKey };
  },

  async updateWebhook(url: string) {
    await prisma.setting.upsert({
      where: { key: "webhook_url" },
      update: { value: url },
      create: { key: "webhook_url", value: url },
    });
    return { url };
  },

  async testWebhook() {
    const setting = await prisma.setting.findUnique({ where: { key: "webhook_url" } });
    if (!setting?.value) {
      return { success: false, error: "No webhook URL configured." };
    }
    return { success: true };
  },
};