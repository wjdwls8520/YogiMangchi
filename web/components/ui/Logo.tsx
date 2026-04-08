import Image from "next/image";
import { cn } from "@/lib/utils/cs";

type LogoProps = {
  className?: string;
};

export default function Logo({ className = "" }: LogoProps) {
  return (
    <div
      className={cn(
        "relative inline-block shrink-0 h-9 aspect-[1100/291]", //비율고정 크기바꿀땐 h만 바꾸면됨.
        className
      )}
    >
      <Image
        src="/logo.png"
        alt="요기망치 로고"
        fill
        sizes="136px"
        priority
        className="dark:hidden"
      />
      <Image
        src="/logo_dark.png"
        alt="요기망치 로고 다크 모드"
        fill
        sizes="136px"
        priority
        className="hidden dark:block"
      />
    </div>
  );
}
