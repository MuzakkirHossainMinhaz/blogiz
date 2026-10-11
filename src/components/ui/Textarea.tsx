"use client";

import { FieldRequiredMark } from "@/components/ui/FieldRequiredMark";
import { controlClassName, fieldErrorClassName, fieldLabelClassName } from "@/lib/field-styles";
import { cn } from "@/lib/utils";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  /** Grow to fill available height in a flex parent. */
  fill?: boolean;
}

export function Textarea({
  label,
  error,
  fill = false,
  className,
  disabled,
  required,
  id,
  name,
  rows = 4,
  ...props
}: TextareaProps) {
  const fieldId = id || name;

  return (
    <div className={cn(fill && "flex min-h-0 flex-1 flex-col", className)}>
      {label ? (
        <label htmlFor={fieldId} className={fieldLabelClassName}>
          {label}
          {required ? <FieldRequiredMark /> : null}
        </label>
      ) : null}
      <textarea
        id={fieldId}
        name={name}
        rows={fill ? undefined : rows}
        disabled={disabled}
        required={required}
        aria-required={required || undefined}
        className={controlClassName({
          error: Boolean(error),
          className: cn(
            "leading-relaxed",
            fill ? "min-h-24 flex-1 resize-none" : "min-h-24 resize-y"
          ),
        })}
        {...props}
      />
      {error && <p className={fieldErrorClassName}>{error}</p>}
    </div>
  );
}
