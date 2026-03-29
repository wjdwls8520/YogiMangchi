import Link from "next/link";
import Button from "@/components/ui/Button";

export default function MainPage() {
  return (
    <div className="min-h-screen bg-white">
      
      {/* 메인 히어로 섹션 */}
      <section className="flex flex-col items-center justify-center pt-24 pb-16 text-center px-4">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight leading-tight mb-4">
          나의 욕망을 실현할 곳,<br />
          <span className="text-[#0058FF]">요기망치</span>
        </h1>
        
        <p className="mt-2 text-base text-gray-500 mb-8 max-w-lg">
          당신의 투자 성향, 모의투자와 요기망치 커뮤니티로 실현해보세요.
        </p>
        
        {/* 버튼 그룹 */}
        <div className="flex items-center gap-3">
          <Link href="/trading">
            <Button size="lg">
              트레이딩 시작하기
            </Button>
          </Link>
          <Link href="/mock">
            <Button size="lg" variant="sky">
              모의투자 연습하기
            </Button>
          </Link>
        </div>
      </section>
      
    </div>
  );
}