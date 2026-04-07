// actionMenu 하나만 뜨게 하기 위한 상태 관리
import { create } from "zustand";

interface CommentUIState {
    openId: number | null;
    setOpenId: (id: number | null) => void;

    openActionMenu: number | null;
    setActionMenu: (id: number | null) => void;
}



export const useActionMenuUIStore = create<CommentUIState>((set) => ({
    openId: null,
    setOpenId: (id) => set({openId: id}),

    openActionMenu: null,
    setActionMenu: (id) => set({openActionMenu: id}),
}))