import { Post } from "@/app/(default)/community/types/post";
import { create } from "zustand";

interface ModalState {
  // 글쓰기, 수정 모달
  writeModal: {
    isOpen: boolean;
    mode: "create" | "edit" | null;
    selectedPost: Post | null;
  };

  // 신고 모달
  reportModal: {
    isOpen: boolean;
    targetId: number; // postId or commentId
  };

  // 글쓰기, 수정 열기, 닫기
  openWrite: (params?: { mode?: "create" | "edit"; post?: Post }) => void;
  closeWrite: () => void;

  // 신고 열기, 닫기
  openReport: (targetId: number) => void;
  closeReport: () => void;
}

export const useModalStore = create<ModalState>((set) => ({
  // 초기 상태
  writeModal: {
    isOpen: false,
    mode: null,
    selectedPost: null,
  },

  reportModal: {
    isOpen: false,
    targetId: null,
  },

  // 글쓰기
  openWrite: (params) =>
    set({
      writeModal: {
        isOpen: true,
        mode: params?.mode ?? "create",
        selectedPost: params?.post ?? null,
      },
    }),

  closeWrite: () =>
    set({
      writeModal: {
        isOpen: false,
        mode: null,
        selectedPost: null,
      },
    }),

  // 신고
  openReport: (targetId) =>
    set({
      reportModal: {
        isOpen: true,
        targetId,
      },
    }),

  closeReport: () =>
    set({
      reportModal: {
        isOpen: false,
        targetId: null,
      },
    }),
}));