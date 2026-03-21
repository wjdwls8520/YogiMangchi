import MainCandleChart from "@/components/MainCandleChart";
import Button from "@/components/ui/Button";
// (혹시 버튼 컴포넌트를 따로 만들어두셨다면 그걸 import 해서 쓰셔도 됩니다!)

export default function MainPage() {
  return (
    <div className="min-h-screen bg-white">
      
      {/* 🌟 1. 메인 히어로 섹션 (시안의 타이틀과 버튼) */}
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
          <Button size="lg">
            트레이딩 시작하기
          </Button>
          <Button size="lg" variant="sky">
            차티스트 보기
          </Button>
        </div>
      </section>

      {/* 🌟 2. 실시간 비트코인 캔들 차트 섹션 (풀 사이즈) */}
      <section className="w-full max-w-7xl mx-auto px-4 mb-24">
        {/* 방금 만든 차트 컴포넌트를 여기에 쏙 넣습니다 */}
        <MainCandleChart />
      </section>

      {/* 이 아래부터는 시안에 있는 '시장 지표', '오늘의 인기 종목' 등을 쭉쭉 추가해 나가시면 됩니다! */}
      
    </div>
  );
}