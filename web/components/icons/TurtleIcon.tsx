interface IconProps {
  className?: string;
}

export default function TurtleIcon({ className = "w-6 h-6" }: IconProps) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" // 👈 거북이도 선 스타일로 그렸습니다.
      stroke="currentColor" // 👈 부모의 text 컬러를 따라갑니다 (예: text-green-500)
      strokeWidth={1.5}
      className={className}
    >
      <path d="M12 4 C 7.5 4, 3 8, 3 13 L 21 13 C 21 8, 16.5 4, 12 4 Z" fill="none"/>
  
      <path d="M 21.1 14.1 L 20.3 13.3 C 19.9 12.9, 19.4 12.7, 18.8 12.7 H 17.7 C 17.1 13.5, 16.3 14.1, 15.5 14.7 H 19.2 C 20.2 14.7, 21.2 15.4, 21.2 16.4 C 21.2 16.7, 21.2 17.1, 21.1 17.3 C 21.0 17.6, 20.8 17.9, 20.5 18.0 L 20.2 18.2 S 20.3 18.3, 20.4 18.3 H 20.8 C 21.9 18.3, 22.9 17.4, 22.9 16.3 C 22.9 15.7, 22.6 15.2, 22.1 14.9 Z" fill="currentColor"/>
      
      <circle cx="20" cy="16" r="0.8" fill="#1B5E20"/>
      
      <path d="M 4 14 L 3 17.5 C 2.8 18.2, 3.3 19.0, 4 19.0 H 5.5 L 6.5 14 H 4 Z" fill="none"/>
      <path d="M 9 14 L 10 19 H 13 L 14 14 H 9 Z" fill="none"/>
      <path d="M 16 14 L 17 18 S 17.1 18.5, 17.3 18.7 C 17.6 19.0, 17.9 19.0, 17.9 19.0 H 19.0 L 20 14 H 16 Z" fill="none"/>
      <path d="M 2.4 14 L 2.0 14.9 C 1.7 15.6, 2.2 16.0, 2.8 16.0 H 3.5 L 3.1 14 H 2.4 Z" fill="none"/>
    </svg>
  );
}
