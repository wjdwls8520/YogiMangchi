"use client";

import { useModalStore } from "@/stores/useModalStore";
import WriteModal from "./WriteModal";

export default function WriteModalWrapper() {
    const isOpen = useModalStore((state) => state.writeModal.isOpen);
    const mode = useModalStore((state) => state.writeModal.mode);
    const selectedPost = useModalStore((state) => state.writeModal.selectedPost);

    return (
        <WriteModal key={`${isOpen}-${mode}-${selectedPost?.id}`} />
    );
}