/**
 * Authentication store using Zustand
 */

import { create } from 'zustand';

import {
  login as apiLogin,
  logout as apiLogout,
  signup as apiSignup,
  selectProfile as apiSelectProfile,
  switchProfile as apiSwitchProfile,
  checkAuth,
  type LoginResult,
} from '@/api/auth';
import { getUserProfile } from '@/api/profile';
import { STORAGE_KEYS } from '@/constants/config';
import { clearScreenFilters } from '@/hooks/useScreenFilters';
import { clearQueryCache } from '@/lib/query-client';
import * as SecureStore from '@/lib/secure-store';
import type {
  User,
  LoginCredentials,
  SignupData,
  AuthTokens,
} from '@/types/user';

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
}

interface AuthActions {
  initialize: () => Promise<void>;
  login: (credentials: LoginCredentials) => Promise<LoginResult>;
  selectProfile: (
    selectionToken: string,
    userPublicId: string,
  ) => Promise<void>;
  switchProfile: (userPublicId: string) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
  clearError: () => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>((set, _get) => ({
  // Initial state
  user: null,
  tokens: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
  error: null,

  // Initialize auth state from stored tokens
  initialize: async () => {
    try {
      set({ isLoading: true, error: null });

      const user = await checkAuth();
      const accessToken = await SecureStore.getItemAsync(
        STORAGE_KEYS.ACCESS_TOKEN,
      );
      const refreshToken = await SecureStore.getItemAsync(
        STORAGE_KEYS.REFRESH_TOKEN,
      );

      if (user && accessToken && refreshToken) {
        set({
          user,
          tokens: { access: accessToken, refresh: refreshToken },
          isAuthenticated: true,
          isLoading: false,
          isInitialized: true,
        });

        // Best-effort refresh so a stale verification banner self-heals on app load.
        getUserProfile()
          .then(profile => {
            set(state =>
              state.user
                ? {
                    user: {
                      ...state.user,
                      email: profile.email,
                      phone: profile.phone ?? state.user.phone,
                      is_email_verified: profile.is_email_verified,
                      is_mobile_verified: profile.is_mobile_verified,
                    },
                  }
                : {},
            );
          })
          .catch(() => {
            // Keep the cached user if the refresh fails.
          });
      } else {
        set({
          user: null,
          tokens: null,
          isAuthenticated: false,
          isLoading: false,
          isInitialized: true,
        });
      }
    } catch (error) {
      set({
        user: null,
        tokens: null,
        isAuthenticated: false,
        isLoading: false,
        isInitialized: true,
        error: error instanceof Error ? error.message : 'Failed to initialize',
      });
    }
  },

  // Login
  login: async (credentials: LoginCredentials) => {
    try {
      set({ isLoading: true, error: null });

      const result = await apiLogin(credentials);

      if (result.requiresProfileSelection) {
        // Do not authenticate yet - caller navigates to the profile picker.
        set({ isLoading: false });
        return result;
      }

      // Drop any cached data from a previous session before the new user loads.
      clearQueryCache();
      clearScreenFilters();

      set({
        user: result.user,
        tokens: result.tokens,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      return result;
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Login failed',
      });
      throw error;
    }
  },

  // Complete a shared-email login by picking a specific student profile
  selectProfile: async (selectionToken: string, userPublicId: string) => {
    try {
      set({ isLoading: true, error: null });

      const { user, tokens } = await apiSelectProfile({
        selection_token: selectionToken,
        user_public_id: userPublicId,
      });

      // Drop any cached data from a previous session before the new profile loads.
      clearQueryCache();
      clearScreenFilters();

      set({
        user,
        tokens,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      set({
        isLoading: false,
        error:
          error instanceof Error ? error.message : 'Unable to select profile',
      });
      throw error;
    }
  },

  // Switch an authenticated student session to another linked profile
  switchProfile: async (userPublicId: string) => {
    const { user, tokens } = await apiSwitchProfile({
      user_public_id: userPublicId,
    });

    // Reset cached data so the new profile starts clean (mirrors web's full reload).
    clearQueryCache();
    clearScreenFilters();

    set({
      user,
      tokens,
      isAuthenticated: true,
      error: null,
    });
  },

  // Signup
  signup: async (data: SignupData) => {
    try {
      set({ isLoading: true, error: null });

      const { user, tokens } = await apiSignup(data);

      set({
        user,
        tokens,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Signup failed',
      });
      throw error;
    }
  },

  // Logout
  logout: async () => {
    clearQueryCache();
    clearScreenFilters();

    set({
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });

    try {
      await apiLogout();
    } catch {
      // Ignore logout API errors - local state is already cleared
    }
  },

  // Set user
  setUser: (user: User | null) => {
    set({ user, isAuthenticated: !!user });
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },
}));

// Selectors
export const selectUser = (state: AuthStore) => state.user;
export const selectIsAuthenticated = (state: AuthStore) =>
  state.isAuthenticated;
export const selectIsLoading = (state: AuthStore) => state.isLoading;
export const selectAuthError = (state: AuthStore) => state.error;

// Single source of truth for per-user cleanup: whenever the authenticated
// user's identity changes (login, logout, profile switch, signup), drop cached
// screen filters and queries so nothing leaks across accounts.
useAuthStore.subscribe((state, prevState) => {
  const nextUserId = state.user?.public_id ?? null;
  const prevUserId = prevState.user?.public_id ?? null;
  if (nextUserId !== prevUserId) {
    clearScreenFilters();
    clearQueryCache();
  }
});
