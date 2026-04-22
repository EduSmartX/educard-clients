/**
 * Shared API - Auth Endpoints
 */

import type { AxiosInstance } from "axios";
import type { AuthResponse, LoginCredentials, SignupData } from "../types";

/**
 * Create auth API functions
 * Takes an axios instance so it works with both web and mobile clients
 */
export function createAuthApi(client: AxiosInstance) {
  return {
    /**
     * Login with email and password
     */
    async login(credentials: LoginCredentials): Promise<AuthResponse> {
      const response = await client.post<AuthResponse>(
        "/auth/login/",
        credentials,
      );
      return response.data;
    },

    /**
     * Register new user
     */
    async signup(data: SignupData): Promise<AuthResponse> {
      const response = await client.post<AuthResponse>("/auth/register/", data);
      return response.data;
    },

    /**
     * Logout user
     */
    async logout(refreshToken: string): Promise<void> {
      await client.post("/auth/logout/", { refresh: refreshToken });
    },

    /**
     * Request password reset email
     */
    async forgotPassword(email: string): Promise<void> {
      await client.post("/auth/password-reset/", { email });
    },

    /**
     * Reset password with token
     */
    async resetPassword(token: string, password: string): Promise<void> {
      await client.post("/auth/password-reset/confirm/", { token, password });
    },

    /**
     * Refresh access token
     */
    async refreshToken(
      refreshToken: string,
    ): Promise<{ access: string; refresh?: string }> {
      const response = await client.post("/auth/token/refresh/", {
        refresh: refreshToken,
      });
      return response.data;
    },

    /**
     * Get current user profile
     */
    async getProfile(): Promise<AuthResponse["user"]> {
      const response = await client.get("/auth/profile/");
      return response.data;
    },

    /**
     * Update user profile
     */
    async updateProfile(
      data: Partial<AuthResponse["user"]>,
    ): Promise<AuthResponse["user"]> {
      const response = await client.patch("/auth/profile/", data);
      return response.data;
    },

    /**
     * Change password
     */
    async changePassword(
      oldPassword: string,
      newPassword: string,
    ): Promise<void> {
      await client.post("/auth/change-password/", {
        old_password: oldPassword,
        new_password: newPassword,
      });
    },
  };
}

export type AuthApi = ReturnType<typeof createAuthApi>;
