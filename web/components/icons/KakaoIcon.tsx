// components/icons/KakaoIcon.tsx
interface IconProps {
  className?: string;
}

export default function KakaoIcon({ className = "w-6 h-6" }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className} // 👈 밖에서 스타일을 주입받을 수 있게 열어둡니다.
    >
      <path d="M12 3C6.477 3 2 6.53 2 10.885c0 2.768 1.761 5.19 4.417 6.551-.237.818-.857 2.973-.883 3.084-.035.156.052.222.164.148.087-.058 3.518-2.383 4.887-3.321.46.068.932.104 1.415.104 5.523 0 10-3.53 10-7.885C22 6.53 17.523 3 12 3z" />
    </svg>
  );
}