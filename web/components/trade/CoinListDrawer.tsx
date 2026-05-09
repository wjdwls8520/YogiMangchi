"use client";

import { X } from "lucide-react";
import CoinList from "./CoinList";

interface CoinListDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: "mock" | "trade";
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

  return (
    <div className="lg:hidden fixed inset-0 z-[200] bg-white flex flex-col animate-in fade-in duration-200">
      {/* Slim Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 shrink-0">
        <h2 className="text-base font-black text-slate-900">코인 목록</h2>
        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-slate-900 transition-colors"
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
