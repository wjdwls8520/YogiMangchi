import { InputHTMLAttributes, forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";

const inputVariants = cva(
  // 공통 클래스: 둥근 모서리, 기본 테두리, 포커스 시 부드러운 전환 효과, 비활성화(disabled) 상태
  "flex w-full rounded-xl border bg-white text-gray-900 placeholder:text-gray-400 transition-all focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500",
  {
    variants: {
      // ⭐️ 인풋은 색상보다는 '상태(정상/에러)'가 중요합니다!
      variant: {
        default: "border-gray-200 focus:border-[#0058FF] focus:ring-[#0058FF]",
        error: "border-red-500 focus:border-red-500 focus:ring-red-500 text-red-900 placeholder:text-red-300",
      },
      // ⭐️ 버튼의 h-9, h-11, h-14와 완벽하게 똑같이 맞춥니다.
      size: {
        sm: "h-9 px-3 text-xs",
        md: "h-11 px-4 text-sm",
        lg: "h-14 px-5 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

export interface InputProps
  // HTML 기본 input 속성에서 'size'만 쏙 빼고 가져옵니다 (충돌 방지)
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof inputVariants> {}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={inputVariants({ variant, size, className })}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";
export default Input;