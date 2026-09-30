"use client";

import { FieldRequiredMark } from "@/components/ui/FieldRequiredMark";
import { controlClassName, fieldErrorClassName, fieldLabelClassName } from "@/lib/field-styles";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({ label, error, className, disabled, required, id, name, rows = 4, ...props }: TextareaProps) {
  const fieldId = id || name;

  return (
    <div className={className}>
      {label ? (
        <label htmlFor={fieldId} className={fieldLabelClassName}>
          {label}
          {required ? <FieldRequiredMark /> : null}
        </label>
      ) : null}
      <textarea
        id={fieldId}
        name={name}
        rows={rows}
        disabled={disabled}
        required={required}
        aria-required={required || undefined}
        className={controlClassName({
          error: Boolean(error),
          className: "resize-y min-h-24 leading-relaxed",
        })}
        {...props}
      />
      {error && <p className={fieldErrorClassName}>{error}</p>}
    </div>
  );
}
