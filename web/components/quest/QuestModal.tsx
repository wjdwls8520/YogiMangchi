"use client";

import { useQuestStore } from "@/stores/useQuestStore";
import { useRealTradingQuest } from "@/hooks/useRealTradingQuest";
import BaseModal from "@/components/ui/BaseModal";
import Button from "@/components/ui/Button";
import { CheckCircle2, Circle, Lock, Rocket, ShieldCheck, TrendingUp, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";

export default function QuestModal() {
  const { isModalOpen, setIsModalOpen, practiceOrderCount, isVerified, isUnlocked } = useQuestStore();
  const router = useRouter();
  
  // 데이터 동기화 유지
  useRealTradingQuest();

  if (!isModalOpen) return null;

  const handleGoVerify = () => {
    setIsModalOpen(false);
    router.push("/verify?source=quest");
  };

  const handleGoMockTrading = () => {
    setIsModalOpen(false);
    router.push("/mock");
  };

  return (
    <BaseModal
      title="본투자 해금 퀘스트"
      onClose={() => setIsModalOpen(false)}
      size="compact"
      chrome="minimal"
    >
      <div className="space-y-6 sm:space-y-8 pb-4">
        {/* 헤더 섹션 */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg mb-2 sm:mb-4 animate-bounce-slow">
            {isUnlocked ? <Rocket className="w-6 h-6 sm:w-8 sm:h-8" /> : <Lock className="w-6 h-6 sm:w-8 sm:h-8" />}
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">
            {isUnlocked ? "본투자가 해금되었습니다!" : "진정한 고수가 되는 길"}
          </h3>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium break-keep">
            실전 선물/현물 거래를 시작하려면 아래 조건을 완료하세요.
          </p>
        </div>

        {/* 퀘스트 카드 리스트 */}
        <div className="space-y-3 sm:space-y-4">
          {/* 퀘스트 1: 인증 */}
          <div className={`relative p-4 sm:p-5 rounded-xl sm:rounded-2xl border-2 transition-all ${
            isVerified 
              ? "border-green-100 bg-green-50/30 dark:border-green-900/30 dark:bg-green-900/10" 
              : "border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-800/50"
          }`}>
            <div className="flex items-center gap-3 sm:gap-4">
              <div className={`w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-lg sm:rounded-xl flex items-center justify-center ${
                isVerified ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"
              }`}>
                <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-bold text-sm sm:text-base text-gray-900 dark:text-white truncate pr-2">본인 인증 완료하기</h4>
                  {isVerified ? (
                    <span className="text-[11px] sm:text-xs font-bold text-green-600 flex items-center gap-1 shrink-0">
                      <CheckCircle2 size={14} /> 완료
                    </span>
                  ) : (
                    <span className="text-[11px] sm:text-xs font-bold text-gray-400 shrink-0">미완료</span>
                  )}
                </div>
                <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 truncate">안전한 거래를 위해 본인 확인이 필요합니다.</p>
              </div>
              {!isVerified && (
                <button 
                  onClick={handleGoVerify}
                  className="p-1.5 sm:p-2 shrink-0 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-blue-600 transition-colors"
                >
                  <ChevronRight size={20} />
                </button>
              )}
            </div>
          </div>

          {/* 퀘스트 2: 모의투자 */}
          <div className={`relative p-4 sm:p-5 rounded-xl sm:rounded-2xl border-2 transition-all ${
            practiceOrderCount >= 3 
              ? "border-green-100 bg-green-50/30 dark:border-green-900/30 dark:bg-green-900/10" 
              : "border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-800/50"
          }`}>
            <div className="flex items-center gap-3 sm:gap-4">
              <div className={`w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-lg sm:rounded-xl flex items-center justify-center ${
                practiceOrderCount >= 3 ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"
              }`}>
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-sm sm:text-base text-gray-900 dark:text-white truncate pr-2">모의투자 3회 연습하기</h4>
                  <span className={`text-[11px] sm:text-xs font-bold shrink-0 ${practiceOrderCount >= 3 ? "text-green-600" : "text-blue-600"}`}>
                    {practiceOrderCount} / 3
                  </span>
                </div>
                {/* 프로그레스 바 */}
                <div className="w-full h-1.5 sm:h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500"
                    style={{ width: `${(practiceOrderCount / 3) * 100}%` }}
                  />
                </div>
              </div>
              {practiceOrderCount < 3 && (
                <button 
                  onClick={handleGoMockTrading}
                  className="p-1.5 sm:p-2 shrink-0 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-blue-600 transition-colors"
                >
                  <ChevronRight size={20} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 하단 액션 버튼 */}
        <div className="pt-2">
          {isUnlocked ? (
            <Button 
              fullWidth 
              size="lg" 
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-xl shadow-blue-500/20"
              onClick={() => setIsModalOpen(false)}
            >
              지금 바로 거래 시작하기
            </Button>
          ) : (
            <Button 
              fullWidth 
              variant="gray"
              size="lg"
              disabled
              className="cursor-not-allowed opacity-60"
            >
              모든 퀘스트를 완료해 주세요
            </Button>
          )}
        </div>

        <p className="text-center text-[10px] text-gray-400 break-keep">
          * 해금 조건 충족 시 시스템에서 자동으로 본투자 계좌를 활성화합니다.
        </p>
      </div>
    </BaseModal>
  );
}
