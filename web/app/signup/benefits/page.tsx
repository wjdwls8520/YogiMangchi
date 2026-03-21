"use client";

import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { HiGift, HiMiniSparkles } from "react-icons/hi2";
import { HiOutlineCheck } from "react-icons/hi";

export default function VerifyPage() {
  const router = useRouter();

  const handleVerify = () => {
    router.push("/verify");
  };

  const handleSkip = () => {
    // TODO: 일반 회원 상태로 온보딩 완료 처리 후 메인 페이지로 이동
    router.push("/");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8F9FA] px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-[480px] rounded-2xl bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:p-12">
        
        {/* 상단 아이콘 및 타이틀 */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
            <span className="text-3xl"><HiGift /></span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">
            잠깐! <span className="text-[#0058FF]">인증 회원</span>이 되고<br />
            실제 혜택을 누려보세요
          </h1>
          <p className="mt-4 text-sm text-gray-500">
            안전한 이벤트 참여와 경품 지급을 위해<br />
            딱 한 번, 본인 확인이 필요합니다.
          </p>
        </div>

        {/* 혜택 안내 리스트 */}
        <div className="mb-10 rounded-xl bg-gray-50 p-6">
          <h3 className="flex mb-4 text-sm font-bold text-gray-900">
            <HiMiniSparkles className="h-5 w-5 mr-3 shrink-0 text-[#fcff39]"/>인증 회원 전용 특별 혜택
          </h3>
          <ul className="space-y-3">
            <li className="flex items-start gap-3 text-sm text-gray-700">
              <HiOutlineCheck className="h-5 w-5 shrink-0 text-[#0058FF]"/>
              <span>주간 수익률 랭킹전 공식 참가 자격 부여</span>
            </li>
            <li className="flex items-start gap-3 text-sm text-gray-700">
              <HiOutlineCheck className="h-5 w-5 shrink-0 text-[#0058FF]"/>
              <span>랭킹 보상 (치킨, 커피 기프티콘 등) 수령 가능</span>
            </li>
            <li className="flex items-start gap-3 text-sm text-gray-700">
              <HiOutlineCheck className="h-5 w-5 shrink-0 text-[#0058FF]"/>
              <span>요기망치 프리미엄 차티스트 배지 획득 기회</span>
            </li>
          </ul>
        </div>

        <div className="flex flex-col gap-3">
          <Button onClick={handleVerify} size="lg">지금 30초 만에 인증하기</Button>
          <Button onClick={handleSkip} variant="ghost" size="lg">다음에 하기 (일반 회원으로 시작)</Button>
        </div>

      </div>
    </div>
  );
}