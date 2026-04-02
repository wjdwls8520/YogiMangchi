"use client";
import { IoCloseOutline } from "react-icons/io5";
import Button from "../ui/Button";
import { useAuthStore } from "@/stores/useAuthStore";
import { useRouter } from "next/navigation";


export default function ContestDetailModal({ onClose }: { onClose: () => void }) {
    const { isLogin, user } = useAuthStore();
    const router = useRouter();
    

    const handleApply = async () => {
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

        try {
            // await applyContest();
            alert("대회 신청이 완료되었습니다.");
            onClose();
        } catch (error) {
            alert("대회 신청에 실패했습니다. 잠시 후 다시 시도해주세요.");
        }
    };



  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* 배경 (Dim) */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      {/* 모달 콘텐츠 */}
      <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-zinc-900 p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
        <button onClick={onClose} className="absolute right-6 top-6 text-gray-400 hover:text-zinc-900 dark:hover:text-white">
          <IoCloseOutline className="w-8 h-8" />
        </button>

        <div className="mb-6">
          <span className="inline-block px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold mb-3">
            제 1회 요기망치 모의투자 대회
          </span>
          <h2 className="text-2xl font-black text-zinc-900 dark:text-white">대회 상세 정보</h2>
        </div>

        <div className="space-y-4 mb-8 text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
          <p>• <strong>대회 기간 :</strong> 2026. 04. 01 오전10시 ~ 2026. 04. 08 오후10시</p>
          <p>• <strong>참여 대상 :</strong> 요기망치 인증회원</p>
          <div>• <strong>대회 상금</strong>
            <ul className="list-none list-inside mt-2 ml-3">
              <li>1등 : 2만원</li>
              <li>2등 : 1만원</li>
              <li>3등 : 오천원</li>
              <li>4~7등 : 이천원</li>
              <li>8_10등 : 천원</li>
              <li>참가상 : 1,000YD</li>
            </ul>
          </div>
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-zinc-800 text-xs mt-4">
            * 대회 시작 전까지 신청이 가능하며, 시작 후에는 중도 참여가 불가능합니다.
          </div>
        </div>

        <Button
          onClick={handleApply}
          size="lg"
          fullWidth
        >
          지금 바로 참여 신청하기
        </Button>
      </div>
    </div>
  );
}