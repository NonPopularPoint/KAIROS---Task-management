import { forwardRef } from "react";
import { Loader2 } from "lucide-react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "icon";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  pill?: boolean;
}

const variants: Record<Variant, string> = {
  primary: "bg-kairos-600 text-white hover:bg-kairos-700 focus-visible:ring-kairos-500",
  secondary: "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 focus-visible:ring-gray-400",
  ghost: "text-kairos-600 hover:bg-kairos-50 focus-visible:ring-kairos-500",
  danger: "bg-coral-500 text-white hover:bg-coral-600 focus-visible:ring-coral-500",
  icon: "text-gray-500 hover:bg-gray-100 focus-visible:ring-gray-400",
};

const sizes: Record<Size, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
};

const iconSizes: Record<Size, string> = {
  sm: "p-1.5",
  md: "p-2",
  lg: "p-3",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", loading, pill, className = "", children, disabled, ...props }, ref) => {
    const isIcon = variant === "icon";
    const base = isIcon
      ? `inline-flex items-center justify-center rounded-lg ${iconSizes[size]} ${variants.icon}`
      : `inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 ${pill ? "rounded-full" : "rounded-lg"} ${variants[variant]} ${sizes[size]} active:scale-[0.98] disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed disabled:border-gray-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-opacity-20`;

    return (
      <button ref={ref} className={`${base} ${className}`} disabled={disabled || loading} {...props}>
        {loading && <Loader2 size={size === "sm" ? 14 : 16} className="animate-spin" />}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
