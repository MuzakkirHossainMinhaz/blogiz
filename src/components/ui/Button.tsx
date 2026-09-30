import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, ReactNode, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { children, variant = "primary", size = "md", isLoading = false, fullWidth = false, className, disabled, ...props },
    ref
  ) => {
    const variants = {
      primary: "bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700 shadow-soft",
      secondary: "bg-accent-500 text-white hover:bg-accent-600 active:bg-accent-700",
      outline: "border border-primary-300 text-primary-800 hover:bg-primary-50 active:bg-primary-100",
      ghost: "text-primary-700 hover:bg-primary-50 active:bg-primary-100",
      danger: "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-soft focus-visible:ring-red-500",
    };

    const sizes = {
      sm: "px-3 py-1.5 text-sm min-h-9",
      md: "px-4 py-2.5 text-base min-h-11",
      lg: "px-6 py-3 text-lg min-h-12",
    };

    const buttonClasses = cn(
      "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 ease-out",
      "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2",
      "disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] motion-reduce:active:scale-100",
      variants[variant],
      sizes[size],
      fullWidth && "w-full",
      className
    );

    return (
      <button ref={ref} className={buttonClasses} disabled={disabled || isLoading} {...props}>
        {isLoading && (
          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
