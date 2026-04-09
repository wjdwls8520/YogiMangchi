"use client";
import { useState } from "react";
import { Trophy } from "lucide-react";
import ContestDetailModal from "./ContestDetailModal";
import { useAuthStore } from "@/stores/useAuthStore";
import { useRouter } from "next/navigation";

export default function ContestFloatingButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const isLogin = useAuthStore((state) => state.isLogin);
  const user = useAuthStore((state) => state.user);
  const router = useRouter();

  const handleOpenModal = () => {
    if (!isLogin || !user) {
      alert("로그인이 필요한 서비스입니다.");
      router.push("/login");
      return;
    }

    if (user.role === "USER") {
      alert("본인인증이 필요한 서비스입니다.");
      router.push("/verify");
      return;
    }

    setIsModalOpen(true);
  };

  return (
    <>
      <button
        onClick={handleOpenModal}
        className="fixed bottom-8 right-8 z-40 flex items-center gap-2 px-6 py-4 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-2xl hover:scale-110 transition-all active:scale-95 group"
      >
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
        </span>
        <Trophy className="w-5 h-5" />
        <span className="font-bold text-sm">모의투자 대회 신청</span>
      </button>

      {/* 상세 정보 모달 */}
      {isModalOpen && <ContestDetailModal onClose={() => setIsModalOpen(false)} />}
    </>
  );
}
