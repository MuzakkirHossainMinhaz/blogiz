"use client";

import { cn } from "@/lib/utils";
import { useState } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  icon?: React.ReactNode;
  showTogglePassword?: boolean;
}

export function Input({
  label,
  error,
  icon,
  type = "text",
  showTogglePassword = false,
  className,
  disabled,
  required,
  ...props
}: InputProps) {
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = type === "password";
  const inputType = isPassword && showTogglePassword ? (showPassword ? "text" : "password") : type;

  return (
    <div className={className}>
      <label htmlFor={props.id || props.name} className="block text-sm font-medium text-neutral-700 mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="relative">
        {icon && <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400">{icon}</span>}
        <input
          type={inputType}
          disabled={disabled}
          className={cn(
            "w-full border rounded-lg font-medium transition-all duration-200",
            "focus:outline-none focus:ring-2 focus:border-transparent",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            icon ? "pl-10" : "pl-4",
            isPassword && showTogglePassword ? "pr-12" : "pr-4",
            "py-3",
            error
              ? "border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500"
              : "border-neutral-300 text-neutral-900 placeholder-neutral-400 focus:ring-primary-500"
          )}
          {...props}
        />
        {isPassword && showTogglePassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-neutral-600"
            disabled={disabled}
            tabIndex={-1}
          >
            {showPassword ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
          </button>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
