import { api } from "./api";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "admin" | "manager" | "operator" | "viewer";
  avatarInitials: string;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export const authService = {
  login: (payload: LoginPayload) =>
    api.post<LoginResponse>("/auth/login", payload),

  me: () => api.get<AuthUser>("/auth/me"),

  logout: () => api.post<void>("/auth/logout", {}),
};