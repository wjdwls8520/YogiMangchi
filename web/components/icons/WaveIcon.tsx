interface IconProps {
  className?: string;
}

export default function WaveIcon({ className = "w-6 h-6" }: IconProps) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" // 👈 파도는 선 스타일로 그렸습니다.
      stroke="currentColor" // 👈 부모의 text 컬러를 따라갑니다 (예: text-blue-500)
      strokeWidth={1.5}
      className={className}
    >
      <path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.5 0 2.5 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>
      <path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.5 0 2.5 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>
      <path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.5 0 2.5 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>
    </svg>
  );
}

