"use client";

import { X } from "lucide-react";
import CoinList from "./CoinList";
import { cn } from "@/lib/utils/cs";

interface CoinListDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: "mock" | "trade" | "contest";
  holdingSymbols?: string[];
  isParticipated?: boolean;
  marketMode?: "spot" | "futures";
}

export default function CoinListDrawer({
  isOpen,
  onClose,
  mode = "trade",
  holdingSymbols = [],
  isParticipated = false,
  marketMode = "spot",
}: CoinListDrawerProps) {
  if (!isOpen) return null;

  const isFutures = mode === "contest" || marketMode === "futures";

  return (
    <div className={cn("lg:hidden fixed inset-0 z-[200] flex flex-col animate-in fade-in duration-200", isFutures ? "bg-futures-trade text-white" : "bg-white dark:bg-zinc-950 text-slate-900 dark:text-gray-100")}>
      {/* Slim Header */}
      <div className={cn("flex items-center justify-between px-4 py-2 border-b shrink-0", isFutures ? "border-futures-border" : "border-gray-100 dark:border-gray-800")}>
        <h2 className={cn("text-base font-black", isFutures ? "text-white" : "text-slate-900 dark:text-gray-100")}>코인 목록</h2>
        <button
          onClick={onClose}
          className={cn("p-1.5 transition-colors", isFutures ? "text-gray-500 hover:text-white" : "text-slate-400 hover:text-slate-900 dark:hover:text-gray-100")}
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        <CoinList
          mode={mode}
          availableMarketTypes={[marketMode]}
          holdingSymbols={holdingSymbols}
          isParticipated={isParticipated}
          onSelect={onClose}
        />
      </div>
    </div>
  );
}
