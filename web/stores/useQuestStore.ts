import { create } from "zustand";

interface QuestState {
  practiceOrderCount: number;
  isVerified: boolean;
  isUnlocked: boolean;
  isModalOpen: boolean;
  isLoading: boolean;
}

interface QuestActions {
  setPracticeOrderCount: (count: number) => void;
  setIsVerified: (isVerified: boolean) => void;
  setIsUnlocked: (isUnlocked: boolean) => void;
  setIsModalOpen: (isOpen: boolean) => void;
  setIsLoading: (isLoading: boolean) => void;
  updateQuestStatus: (status: Partial<QuestState>) => void;
}

export const useQuestStore = create<QuestState & QuestActions>((set) => ({
  practiceOrderCount: 0,
  isVerified: false,
  isUnlocked: false,
  isModalOpen: false,
  isLoading: true,

  setPracticeOrderCount: (count) => set({ practiceOrderCount: count }),
  setIsVerified: (isVerified) => set({ isVerified }),
  setIsUnlocked: (isUnlocked) => set({ isUnlocked }),
  setIsModalOpen: (isOpen) => set({ isModalOpen: isOpen }),
  setIsLoading: (isLoading) => set({ isLoading }),
  updateQuestStatus: (status) => set((state) => ({ ...state, ...status })),
}));
