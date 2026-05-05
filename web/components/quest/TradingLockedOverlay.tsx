"use client";

import { useQuestStore } from "@/stores/useQuestStore";
import { Lock, Sparkles } from "lucide-react";
import Button from "../ui/Button";

export default function TradingLockedOverlay() {
  const { isUnlocked, setIsModalOpen } = useQuestStore();

  if (isUnlocked) return null;

  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
      {/* 배경 블러 효과를 위한 딤드 처리 */}
      <div className="absolute inset-0 bg-white/60 dark:bg-gray-900/80 backdrop-blur-md rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700" />
      
      {/* 콘텐츠 */}
      <div className="relative z-10 space-y-4">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mb-2">
          <Lock size={28} />
        </div>
        
        <div className="space-y-1">
          <h4 className="text-lg font-black text-gray-900 dark:text-white">본투자 계좌가 잠겨있습니다</h4>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium max-w-[240px] mx-auto leading-relaxed">
            인증과 연습 거래를 완료하고 실전 투자의 세계로 진입하세요!
          </p>
        </div>

        <Button 
          size="sm" 
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 shadow-lg shadow-blue-500/30"
          onClick={() => setIsModalOpen(true)}
        >
          <Sparkles size={16} className="mr-2" />
          해금 퀘스트 확인하기
        </Button>
      </div>
    </div>
  );
}
