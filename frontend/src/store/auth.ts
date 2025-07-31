import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: number;
  email: string;
  name: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthLoading: boolean;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  setAuthLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthLoading: true,
      isAuthenticated: false,
      login: (user, token) =>
        set({ user, token, isAuthenticated: true, isAuthLoading: false }),
      logout: () =>
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isAuthLoading: false,
        }),
      updateUser: (updatedUser) =>
        set({ user: { ...get().user!, ...updatedUser } }),
      setAuthLoading: (isAuthLoading) => set({ isAuthLoading }),
    }),
    {
      name: 'auth-storage',
      onRehydrateStorage: () => (state) => {
        // After Zustand loads from localStorage, set loading to false
        state?.setAuthLoading(false);
      },
    }
  )
);
