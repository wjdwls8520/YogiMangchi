"use client";

import { useRealTradingQuest } from "@/hooks/useRealTradingQuest";
import QuestModal from "@/components/quest/QuestModal";

/**
 * 전역에서 퀘스트 상태를 동기화하고 모달을 렌더링하는 초기화 컴포넌트
 */
export default function QuestInitializer() {
  // 훅을 호출하여 실시간 데이터 동기화 시작
  useRealTradingQuest();

  return <QuestModal />;
}
