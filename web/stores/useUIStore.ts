import { create } from 'zustand';

interface UIState {
  isMenuOpen: boolean; // 모바일 메뉴
  toggleMenu: () => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  currentMenu: string;
  setCurrentMenu: (menu: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isMenuOpen: false,
  toggleMenu: () => set((state) => ({ isMenuOpen: !state.isMenuOpen })), // 이전 상태 기반 업데이트
  isDarkMode: false,
  toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
  currentMenu: 'Home',
  setCurrentMenu: (menu: string) => set({ currentMenu: menu }) // 매개변수 기반 업데이트
}));