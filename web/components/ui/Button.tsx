import { ButtonHTMLAttributes, forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
  "inline-flex shrink-0 whitespace-nowrap items-center justify-center rounded-xl font-bold transition-all cursor-pointer focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        blue: "bg-[#0058FF] text-white hover:bg-blue-700 shadow-md",
        gray: "bg-gray-100 text-gray-900 hover:bg-gray-200",
        white: "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400",
        red: "bg-red-500 text-white hover:bg-red-600",
        sky: "bg-blue-100 text-[#0058FF] hover:bg-blue-200",
        yellow: "bg-[#FEE500] text-[#000000] hover:bg-[#E6CF00]",
        ghost: "bg-transparent text-gray-700 hover:bg-gray-100",
      },
      size: {
        sm: "h-9 px-4 text-xs min-w-[72px]",
        md: "h-11 px-6 text-sm min-w-[100px]", 
        lg: "h-14 px-8 text-base min-w-[120px]",
      },
      fullWidth: {
        true: "w-full",
      },
    },
    defaultVariants: {
      variant: "blue",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  fullWidth?: boolean; 
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  // cva는 className 프롭스를 객체 안에 넣으면 알아서 기존 클래스들과 합쳐줍니다!
  ({ className, variant, size, fullWidth, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={buttonVariants({ variant, size, fullWidth, className })}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
export default Button;