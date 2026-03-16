import TermsContent from "./policy/TermsContent";
import PrivacyContent from "./policy/PrivacyContent"

interface PolicyModalProps {
  // terms면 이용약관, privacy면 개인정보, null이면 닫힘 상태
  type: "terms" | "privacy" | null; 
  onClose: () => void;
}

export default function PolicyModal({ type, onClose }: PolicyModalProps) {
  if (!type) return null; // type이 없으면 아무것도 안 그림 (모달 닫힘)

  // type에 따라 모달 제목 설정
  const title = type === "terms" ? "이용약관" : "개인정보 처리방침";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-2xl">
        
        {/* 헤더 */}
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 px-6 py-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
             닫기
          </button>
        </div>

        {/* 본문: type에 따라 다른 알맹이를 조건부 렌더링! */}
        <div className="max-h-[60vh] overflow-y-auto px-6 py-5">
          {type === "terms" && <TermsContent />}
          {type === "privacy" && <PrivacyContent />}
        </div>

        {/* 푸터 */}
        <div className="border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-6 py-4">
          <button onClick={onClose} className="w-full rounded-xl bg-[#0058FF] py-3.5 font-bold text-white">
            확인했습니다
          </button>
        </div>
        
      </div>
    </div>
  );
}