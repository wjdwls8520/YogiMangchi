interface IconProps {
  className?: string;
}

export default function TurtleIcon({ className = "w-6 h-6" }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className={className}>
  
  {/* <!-- 멀리 있는 뒷다리 (어둡게 처리하여 원근감 표현) --> */}
  <rect x="35" y="65" width="10" height="18" rx="5" fill="#1B5E20" />
  <rect x="65" y="65" width="10" height="18" rx="5" fill="#1B5E20" />
  
  {/* <!-- 짧고 귀여운 꼬리 --> */}
  <path d="M 20 65 Q 5 65 8 72 Q 18 70 22 68 Z" fill="#388E3C" />
  
  {/* <!-- 머리 및 목 (등딱지 가장자리 아래에서 나옴) --> */}
  <g id="turtle-head">
    <ellipse cx="85" cy="65" rx="12" ry="7" fill="#388E3C" />
    {/* <!-- 눈 --> */}
    <circle cx="92" cy="62" r="1.5" fill="#FFFFFF" />
    <circle cx="92.5" cy="62" r="0.8" fill="#000000" />
    {/* <!-- 발그레한 볼 --> */}
    <circle cx="89" cy="65.5" r="2" fill="#FF8A80" opacity="0.7" />
    {/* <!-- 옅은 미소 (입) --> */}
    <path d="M 93 68 Q 95 68 96 66" fill="none" stroke="#1B5E20" stroke-width="1.5" stroke-linecap="round" />
  </g>

  {/* <!-- 가까이 있는 앞다리 --> */}
  <rect x="25" y="62" width="12" height="22" rx="6" fill="#388E3C" />
  <rect x="58" y="62" width="12" height="22" rx="6" fill="#388E3C" />
  
  {/* <!-- 등딱지 윗부분 (Dome) --> */}
  <path d="M 20 62 C 20 20, 80 20, 80 62 Z" fill="#81C784" />
  
  {/* <!-- 등딱지 무늬 (측면 곡선 패턴) --> */}
  <path d="M 35 62 C 35 38, 65 38, 65 62" fill="none" stroke="#2E7D32" stroke-width="3" stroke-linecap="round" />
  <path d="M 50 49 L 50 62" fill="none" stroke="#2E7D32" stroke-width="3" stroke-linecap="round" />
  <path d="M 22 56 Q 35 52 35 62" fill="none" stroke="#2E7D32" stroke-width="3" stroke-linecap="round" />
  <path d="M 78 56 Q 65 52 65 62" fill="none" stroke="#2E7D32" stroke-width="3" stroke-linecap="round" />
  
  {/* <!-- 등딱지 하단 두꺼운 테두리 --> */}
  <rect x="15" y="60" width="70" height="9" rx="4.5" fill="#2E7D32" />
  
</svg>


  );
}
