"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DemoNoticeBar() {
  const router = useRouter();
  
  // 🌟 TODO: 나중에 useMockWalletStore의 값으로 교체할 임시 상태입니다!
  // false면 '지갑 없음(보라색)', true면 '지갑 있음(다크그레이)' 모드가 됩니다.
  const [hasWallet, setHasWallet] = useState(false); 
  const mockBalance = 10000;

  return (
    // 🌟 접근성(a11y): 페이지의 부가적인 안내 영역이므로 <aside> 사용
    <aside
      aria-label="모의투자 상태 안내 배너"
      className={`w-full px-4 py-3 mb-5 flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors duration-300 shrink-0 shadow-sm z-50 relative
        ${hasWallet ? "bg-gray-800 text-white" : "bg-[#8B5CF6] text-white"}
      `}
    >
      {/* ================== 좌측: 안내 문구 ================== */}
      <div className="flex items-center gap-2 text-sm font-bold text-center sm:text-left w-full sm:w-auto justify-center sm:justify-start">
        {hasWallet ? (
          <>
            <span aria-hidden="true" className="text-lg">🚨</span>
            <p>
              현재 <span className="text-yellow-300 font-black">모의투자(연습)</span> 모드로 접속 중입니다. 실제 자산이 소모되지 않습니다.
            </p>
          </>
        ) : (
          <>
            <span aria-hidden="true" className="text-lg animate-bounce">💡</span>
            <p>요기망치 모의투자에 오신 것을 환영합니다! 초기 자금을 받고 투자를 연습해 보세요.</p>
          </>
        )}
      </div>

      {/* ================== 우측: 컨트롤 버튼들 ================== */}
      <div className="flex items-center gap-3 w-full sm:w-auto justify-center sm:justify-end shrink-0">
        
        {hasWallet ? (
          /* 지갑이 있을 때: 잔고 표시 & 초기화 버튼 */
          <div className="flex items-center gap-2">
            <div 
              aria-label={`현재 모의 잔고는 ${mockBalance.toLocaleString()} 테더입니다`}
              className="flex items-center gap-1.5 text-xs sm:text-sm font-medium bg-gray-900/50 px-3 py-1.5 rounded-full border border-gray-700"
            >
              <span className="text-gray-300">잔고:</span>
              <strong className="text-[#00C087] font-black">{mockBalance.toLocaleString()}</strong>
              <span className="text-gray-400 text-[10px] sm:text-xs">USDT</span>
            </div>
            
            <button
              onClick={() => {
                if(confirm("모든 투자 내역을 삭제하고 10,000 USDT로 다시 시작하시겠습니까?")) {
                  alert("초기화 되었습니다!"); // 나중에 스토어 초기화 함수로 변경
                }
              }}
              aria-label="모의투자 지갑 초기화 및 재도전"
              className="p-1.5 hover:bg-gray-700 rounded-full transition-colors group"
              title="재도전(초기화)"
            >
              <span className="block transition-transform group-hover:rotate-180">🔄</span>
            </button>
          </div>
        ) : (
          /* 지갑이 없을 때: 지원금 받기 버튼 */
          <button
            onClick={() => setHasWallet(true)} // 🌟 나중에 '팝업 띄우기' 함수로 변경될 자리입니다!
            aria-label="초기 지원금 1만 테더 받기"
            className="shrink-0 px-4 py-1.5 bg-white text-[#8B5CF6] text-sm font-black rounded-full shadow-sm hover:bg-purple-50 hover:scale-105 transition-all active:scale-95 flex items-center gap-1"
          >
            10,000 USDT 받기
          </button>
        )}

        {/* 구분선 (PC에서만 보임) */}
        <div className="w-px h-4 bg-white/20 hidden sm:block mx-1"></div>

        {/* 실전 탈출구 */}
        <button
          onClick={() => router.push('/trading')}
          aria-label="실전 트레이딩 페이지로 이동"
          className="shrink-0 text-[11px] sm:text-xs font-bold opacity-70 hover:opacity-100 underline underline-offset-2 transition-opacity flex items-center gap-1"
        >
          실전 트레이딩 시작
        </button>

      </div>
    </aside>
  );
}