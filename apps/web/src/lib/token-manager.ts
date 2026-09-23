/**
 * In-memory token manager.
 *
 * Access tokens are stored ONLY in memory (never localStorage) to prevent
 * XSS attacks from stealing them. On page refresh the token is lost and
 * must be re-obtained via the HttpOnly refresh cookie.
 */

let accessToken: string | null = null;

export const tokenManager = {
  getAccessToken: (): string | null => accessToken,

  setAccessToken: (token: string | null): void => {
    accessToken = token;
  },

  clear: (): void => {
    accessToken = null;
  },

  isAuthenticated: (): boolean => !!accessToken,
};
