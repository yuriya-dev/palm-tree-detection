import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Auth store – persisted to localStorage so the user stays logged in
 * across page refreshes.
 *
 * Shape of `user`:  { id, name?, email, role }
 */
export const useAuthStore = create(
  persist(
    (set) => ({
      token: null,
      user: null,

      /** Call this after a successful POST /api/v1/auth/login */
      setAuth: (token, user) => set({ token, user }),

      /** Clear everything on logout */
      logout: () => set({ token: null, user: null }),

      /** Convenience */
      isAuthenticated: () => {
        // Getter inside a store isn't reactive, so we expose a selector instead.
        // Use the `token` key directly when you need reactivity.
      },
    }),
    {
      name: 'nyawit-auth', // localStorage key
      partialize: (state) => ({ token: state.token, user: state.user }),
    },
  ),
)
