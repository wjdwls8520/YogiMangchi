import { Post } from "@/app/(default)/community/types/post";
import { create } from "zustand";

interface ModalState {
  isOpen: boolean;

  // 🔥 추가
  mode: "create" | "edit" | null;
  selectedPost: Post | null;

  // 🔥 open 확장
  open: (params?: { mode?: "create" | "edit"; post?: Post }) => void;
  close: () => void;
}

export const useModalStore = create<ModalState>((set) => ({
  isOpen: false,
  mode: null,
  selectedPost: null,

  open: (params) =>
    set({
      isOpen: true,
      mode: params?.mode ?? null,
      selectedPost: params?.post ?? null,
    }),

  close: () =>
    set({
      isOpen: false,
      selectedPost: null,
      mode: null,
    }),
}));