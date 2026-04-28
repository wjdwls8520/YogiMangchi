import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UserData {
  memberId: number;
  provider: string;
  nickname: string;
  profileImgUrl: string;
  profileMsg: string;
  bestCount: number;
  followerCount: number;
  followingCount: number;
  term_agree: boolean;
  private_agree: boolean;
  role: "USER" | "VERIFIED_USER" | "ADMIN";
}

interface AuthState {
  isLogin: boolean;
  hasHydrated: boolean;
  isAuthResolved: boolean;
  user: UserData | null; // 유저 정보를 담을 빈 칸 추가
  login: (data: UserData) => void; // 로그인 시 유저 데이터를 받도록 수정
  logout: () => void;
  setHasHydrated: (hasHydrated: boolean) => void;
  setAuthResolved: (isAuthResolved: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isLogin: false,
      hasHydrated: false,
      isAuthResolved: false,
      user: null, // 초기값은 아무도 없는 상태
      // 로그인 시 데이터를 받아서 주머니에 쏙 넣음
      login: (data: UserData) =>
        set({ isLogin: true, user: data, isAuthResolved: true }),
      // 로그아웃 시 주머니를 비움
      logout: () => set({ isLogin: false, user: null, isAuthResolved: true }),
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
      setAuthResolved: (isAuthResolved) => set({ isAuthResolved }),
    }),
    {
      name: "auth",
      partialize: (state) => ({
        isLogin: state.isLogin,
        user: state.user,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    } // 로컬 스토리지에 'auth'라는 이름으로 저장됨 (새로고침해도 유지!)
  )
);
