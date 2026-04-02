"use client";

import { useModalStore } from "@/stores/useModalStore";
import { PencilLine } from "lucide-react";

export default function FloatMenu() {

    const { openWrite } = useModalStore();

    return(
        <div className="fixed bottom-6 right-6 z-50">
            <button type="button" className="rounded-4xl bg-blue-500 p-5 shadow-blue-400 shadow-md" onClick={() => openWrite()}>
                <PencilLine className="text-white text-2xl" size={28} strokeWidth={2} />
            </button>
        </div>
    )
}