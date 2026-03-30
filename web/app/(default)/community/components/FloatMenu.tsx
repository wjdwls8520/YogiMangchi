"use client";

import { useModalStore } from "@/stores/useModalStore";
import { LuPenLine } from "react-icons/lu";

export default function FloatMenu() {

    const { open } = useModalStore();

    return(
        <div className="fixed bottom-6 right-6 z-50">
            <button type="button" className="rounded-4xl bg-blue-500 p-5 shadow-blue-400 shadow-md" onClick={open}>
                <LuPenLine className="text-white text-2xl" />
            </button>
        </div>
    )
}