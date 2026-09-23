"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "dark" | "light" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary:
    "bg-zw-red-600 text-white hover:bg-zw-red-700 border border-transparent",
  dark: "bg-zw-ink text-white hover:bg-zw-grey-800 border border-transparent",
  // Kirmizi/koyu zeminlerde kullanilir. className ile bg ezmek Tailwind'de
  // guvenilir degil (kural sirasi belirleyici), bu yuzden ayri varyant.
  light: "bg-white text-zw-red-700 hover:bg-zw-grey-100 border border-transparent",
  outline:
    "bg-white text-zw-ink border border-zw-grey-300 hover:border-zw-ink hover:bg-zw-grey-50",
  ghost: "bg-transparent text-zw-ink hover:bg-zw-grey-100 border border-transparent",
  danger: "bg-white text-zw-red-700 border border-zw-red-200 hover:bg-zw-red-50",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-14 px-7 text-base",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  fullWidth,
  leftIcon,
  rightIcon,
  className = "",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={[
        "inline-flex items-center justify-center gap-2 rounded-[4px] font-semibold uppercase tracking-wide",
        "transition-colors duration-150 zw-focus disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        fullWidth ? "w-full" : "",
        className,
      ].join(" ")}
      {...rest}
    >
      {leftIcon}
      {children}
      {rightIcon}
    </button>
  );
}
