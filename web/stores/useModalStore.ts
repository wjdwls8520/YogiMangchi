import { Post } from "@/app/(default)/community/types/post";
import { create } from "zustand";

interface ModalState {
  isOpen: boolean;
  openMenuId: number | null;
  isMenuOpen?: boolean;
  mode: "create" | "edit" | null;
  selectedPost: Post | null;

  open: (params?: { mode?: "create" | "edit"; post?: Post }) => void;
  close: () => void;
  toggleMenu: (arg0: number) => void;
}

export const useModalStore = create<ModalState>((set, get) => ({
  isOpen: false,
  openMenuId: null,
  mode: null,
  selectedPost: null,

  open: (params) =>
    set({
      isOpen: true,
      mode: params?.mode ?? null,
      selectedPost: params?.post ?? null,
      openMenuId: null,
    }),

  close: () =>
    set({
      isOpen: false,
      selectedPost: null,
      mode: null,
      openMenuId: null,
    }),

  toggleMenu: (postId) => 
    set((state) => ({
      openMenuId: state.openMenuId === postId ? null : postId
    })),
  closeMenu: () => set({ openMenuId: null }),
}));