"use client";

import { useModalStore } from "@/stores/useModalStore";
import WriteModal from "./WriteModal";

export default function WriteModalWrapper() {
    const { isOpen, mode, selectedPost } = useModalStore();

    return (
        <WriteModal key={`${isOpen}-${mode}-${selectedPost?.id}`} />
    );
}