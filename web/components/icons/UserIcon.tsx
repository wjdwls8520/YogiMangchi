interface IconProps {
  className?: string;
}

export default function UserIcon({ className = "w-6 h-6" }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className}>
  <defs>

    <clipPath id="avatar-clip">
      <circle cx="12" cy="12" r="11" />
    </clipPath>
  </defs>

  <circle cx="12" cy="12" r="11" fill="#B3B8C2" stroke="#8E95A3" strokeWidth="1.5" />

  <g clipPath="url(#avatar-clip)">

    <circle cx="12" cy="8.5" r="3.5" fill="#FFFFFF" />

    <path d="M 12 13.5 C 6.5 13.5 3 17 3 22.5 L 3 24 L 21 24 L 21 22.5 C 21 17 17.5 13.5 12 13.5 Z" fill="#FFFFFF" />
  </g>
</svg>
  );
}