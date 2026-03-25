"use client";

import { useState } from "react";
import { LuPenLine } from "react-icons/lu";

interface MenuProps {
  onOpenLayer?: () => void;
}

export default function FloatMenu({ onOpenLayer }: MenuProps) {

    return(
        <div className="fixed bottom-6 right-6 z-50">
            <button type="button" className="rounded-4xl bg-blue-500 p-5 shadow-blue-400 shadow-md" onClick={onOpenLayer}>
                <LuPenLine className="text-white text-2xl" />
            </button>
        </div>
    )
}