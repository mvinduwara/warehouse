import { api } from "./api";
import type { AuthUser } from "./auth.service";

export interface User extends AuthUser {
  createdAt: string;
  lastLoginAt?: string;
  isActive: boolean;
}

export interface InviteUserPayload {
  email: string;
  name: string;
  role: "admin" | "manager" | "operator" | "viewer";
}

export interface UpdateUserPayload {
  name?: string;
  role?: "admin" | "manager" | "operator" | "viewer";
  isActive?: boolean;
}

export const usersService = {
  getUsers: () => api.get<User[]>("/users"),

  inviteUser: (payload: InviteUserPayload) =>
    api.post<User>("/users/invite", payload),

  updateUser: (id: string, payload: UpdateUserPayload) =>
    api.patch<User>(`/users/${id}`, payload),

  deactivateUser: (id: string) => api.patch<User>(`/users/${id}/deactivate`, {}),

  getApiKey: () => api.get<{ key: string }>("/settings/api-key"),

  regenerateApiKey: () => api.post<{ key: string }>("/settings/api-key/regenerate", {}),

  updateWebhook: (url: string) =>
    api.put<{ url: string }>("/settings/webhook", { url }),

  testWebhook: () => api.post<{ success: boolean }>("/settings/webhook/test", {}),
};