"use client";

import { cn } from "@/lib/utils";
import { FiChevronDown } from "react-icons/fi";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  options: SelectOption[];
  icon?: React.ReactNode;
}

export function Select({ label, error, options, icon, className, disabled, required, ...props }: SelectProps) {
  return (
    <div className={className}>
      <label htmlFor={props.id || props.name} className="block text-sm font-medium text-neutral-700 mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="relative">
        {icon && <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400">{icon}</span>}
        <select
          disabled={disabled}
          className={cn(
            "w-full border rounded-lg font-medium transition-all duration-200 appearance-none",
            "focus:outline-none focus:ring-2 focus:border-transparent",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "bg-white",
            icon ? "pl-10" : "pl-4",
            "pr-12 py-3",
            error
              ? "border-red-300 text-red-900 focus:ring-red-500"
              : "border-neutral-300 text-neutral-900 focus:ring-primary-500"
          )}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 pointer-events-none">
          <FiChevronDown className="w-5 h-5" />
        </span>
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
