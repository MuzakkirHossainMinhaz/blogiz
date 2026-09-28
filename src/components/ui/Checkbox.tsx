"use client";

import { cn } from "@/lib/utils";
import { FiCheck } from "react-icons/fi";

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
}

export function Checkbox({ label, className, disabled, id, name, ...props }: CheckboxProps) {
  const fieldId = id || name;

  return (
    <label
      htmlFor={fieldId}
      className={cn(
        "inline-flex items-center gap-2.5 select-none",
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
        className
      )}
    >
      <span className="relative size-5 shrink-0">
        <input
          id={fieldId}
          name={name}
          type="checkbox"
          disabled={disabled}
          className="peer absolute inset-0 z-10 size-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
          {...props}
        />
        <span
          aria-hidden
          className={cn(
            "pointer-events-none flex size-5 items-center justify-center rounded-md border-2 bg-white transition-colors",
            "border-neutral-300",
            "peer-checked:border-primary-600 peer-checked:bg-primary-600 peer-checked:[&_svg]:opacity-100",
            "peer-focus-visible:ring-2 peer-focus-visible:ring-primary-500 peer-focus-visible:ring-offset-2"
          )}
        >
          <FiCheck className="size-3.5 text-white opacity-0 transition-opacity" strokeWidth={3} />
        </span>
      </span>
      <span className="text-sm text-neutral-700">{label}</span>
    </label>
  );
}
