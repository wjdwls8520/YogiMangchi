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
        dark: "bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white border border-white/10",
      },
      size: {
        xs: "h-9 px-4 text-xs min-w-[48px]",
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
  isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, fullWidth, isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={isLoading || disabled}
        className={buttonVariants({ variant, size, fullWidth, className })}
        {...props}
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 animate-spin text-current" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>{children}</span>
          </div>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
export default Button;