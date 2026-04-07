// 로그인 전 실행한 함수를 저장하는 state
// 로그인 후 함수 실행

import { create } from "zustand";

type Action = () => void;

interface AuthActionState {
  action: Action | null;
  setAction: (action: Action) => void;
  runAction: () => void;
  clearAction: () => void;
}

export const useAuthActionStore = create<AuthActionState>((set, get) => ({
  action: null,

  setAction: (action) => set({ action }),

  runAction: () => {
    const action = get().action;
    if (action) action();
    set({ action: null });
  },

  clearAction: () => set({ action: null }),
}));