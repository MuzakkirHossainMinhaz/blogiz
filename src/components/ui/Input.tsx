"use client";

import { fieldErrorClassName, fieldLabelClassName, controlClassName } from "@/lib/field-styles";
import { useState } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
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
  id,
  name,
  ...props
}: InputProps) {
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = type === "password";
  const inputType = isPassword && showTogglePassword ? (showPassword ? "text" : "password") : type;
  const fieldId = id || name;

  return (
    <div className={className}>
      {label ? (
        <label htmlFor={fieldId} className={fieldLabelClassName}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      ) : null}
      <div className="relative">
        {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">{icon}</span>}
        <input
          id={fieldId}
          name={name}
          type={inputType}
          disabled={disabled}
          required={required}
          className={controlClassName({
            error: Boolean(error),
            withIcon: Boolean(icon),
            withTrailing: isPassword && showTogglePassword,
            className: type === "date" ? "scheme-light" : undefined,
          })}
          {...props}
        />
        {isPassword && showTogglePassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-2 sm:pr-3 flex items-center text-neutral-400 hover:text-neutral-600 min-w-11 justify-center touch-manipulation"
            disabled={disabled}
            tabIndex={-1}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
          </button>
        )}
      </div>
      {error && <p className={fieldErrorClassName}>{error}</p>}
    </div>
  );
}
