import { create } from 'zustand';
import { persist } from "zustand/middleware";

interface UIState {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  currentMenu: string;
  setCurrentMenu: (menu: string) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      isDarkMode: false,
      toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
      currentMenu: '',
      setCurrentMenu: (menu: string) => set({ currentMenu: menu }) // 매개변수 기반 업데이트
    }),
    { name: 'ui-store' }
  )  
);