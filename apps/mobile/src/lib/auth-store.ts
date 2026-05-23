/**
 * Authentication store using Zustand
 */

import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

import { login as apiLogin, logout as apiLogout, signup as apiSignup, checkAuth } from '@/api/auth';
import { STORAGE_KEYS } from '@/constants/config';
import { clearQueryCache } from '@/lib/query-client';
import type { User, LoginCredentials, SignupData, AuthTokens } from '@/types/user';

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
  login: (credentials: LoginCredentials) => Promise<void>;
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
      const accessToken = await SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
      const refreshToken = await SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN);

      if (user && accessToken && refreshToken) {
        set({
          user,
          tokens: { access: accessToken, refresh: refreshToken },
          isAuthenticated: true,
          isLoading: false,
          isInitialized: true,
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

      const { user, tokens } = await apiLogin(credentials);

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
        error: error instanceof Error ? error.message : 'Login failed',
      });
      throw error;
    }
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

    // Set state atomically to prevent multiple re-renders
    set({
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });

    // Then perform cleanup in background (don't block UI)
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
export const selectIsAuthenticated = (state: AuthStore) => state.isAuthenticated;
export const selectIsLoading = (state: AuthStore) => state.isLoading;
export const selectAuthError = (state: AuthStore) => state.error;
