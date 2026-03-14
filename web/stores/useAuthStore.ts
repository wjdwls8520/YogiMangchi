import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  isLogin: boolean;
  login: () => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isLogin: false,
      login: () => set({ isLogin: true }),
      logout: () => set({ isLogin: false }),
    }),
    { name: 'auth' }
  )
);