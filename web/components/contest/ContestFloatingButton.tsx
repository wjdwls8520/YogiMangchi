"use client";
import { useState } from "react";
import { HiOutlineTrophy } from "react-icons/hi2";
import ContestDetailModal from "./ContestDetailModal";

export default function ContestFloatingButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-8 right-8 z-40 flex items-center gap-2 px-6 py-4 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-2xl hover:scale-110 transition-all active:scale-95 group"
      >
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
        </span>
        
        <HiOutlineTrophy className="w-5 h-5" />
        <span className="font-bold text-sm">모의투자 대회 신청</span>
      </button>

      {/* 상세 정보 모달 */}
      {isModalOpen && <ContestDetailModal onClose={() => setIsModalOpen(false)} />}
    </>
  );
}