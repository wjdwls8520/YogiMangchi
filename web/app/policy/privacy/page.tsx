import PrivacyContent from "@/components/policy/PrivacyContent";
import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-gray-900 py-12 px-4">
      <div className="mx-auto max-w-3xl rounded-2xl bg-white dark:bg-gray-800 p-8 shadow-sm border border-gray-100 dark:border-gray-700">
        
        <div className="mb-8 border-b border-gray-100 dark:border-gray-700 pb-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">개인정보 처리방침</h1>
          {/* 뒤로 가기 또는 메인으로 가는 버튼 */}
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white">
            메인으로
          </Link>
        </div>

        {/* ⭐️ 여기에 알맹이를 렌더링합니다 */}
        <PrivacyContent /> 
        
      </div>
    </div>
  );
}