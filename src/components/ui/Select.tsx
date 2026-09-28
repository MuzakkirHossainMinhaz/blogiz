"use client";

import { controlClassName, fieldErrorClassName, fieldLabelClassName } from "@/lib/field-styles";
import { cn } from "@/lib/utils";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type Ref,
} from "react";
import { FiCheck, FiChevronDown } from "react-icons/fi";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  label?: string;
  error?: string;
  options: SelectOption[];
  icon?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  name?: string;
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  "aria-label"?: string;
  onChange?: (event: { target: { name?: string; value: string } }) => void;
  onBlur?: (event: { target: { name?: string } }) => void;
  ref?: Ref<HTMLInputElement>;
}

export function Select({
  label,
  error,
  options,
  icon,
  className,
  disabled,
  required,
  id,
  name,
  value,
  defaultValue,
  placeholder = "Select an option",
  "aria-label": ariaLabel,
  onChange,
  onBlur,
  ref,
}: SelectProps) {
  const reactId = useId();
  const fieldId = id || name || reactId;
  const listboxId = `${fieldId}-listbox`;
  const isControlled = value !== undefined;
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue ?? options[0]?.value ?? "");
  const selectedValue = isControlled ? value : uncontrolledValue;
  const [open, setOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const selectedOption = options.find((option) => option.value === selectedValue);

  const openMenu = () => {
    if (disabled) return;
    const index = options.findIndex((option) => option.value === selectedValue);
    setHighlightIndex(index >= 0 ? index : 0);
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const frame = window.requestAnimationFrame(() => listRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [open]);

  const commit = (nextValue: string) => {
    if (!isControlled) setUncontrolledValue(nextValue);
    onChange?.({ target: { name, value: nextValue } });
    setOpen(false);
  };

  const onTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;

    if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openMenu();
      return;
    }

    if (event.key === "Escape") {
      setOpen(false);
    }
  };

  const onListKeyDown = (event: KeyboardEvent<HTMLUListElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightIndex((index) => (index + 1) % options.length);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightIndex((index) => (index - 1 + options.length) % options.length);
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      const option = options[highlightIndex];
      if (option) commit(option.value);
    }
  };

  return (
    <div className={className} ref={rootRef}>
      {label ? (
        <label htmlFor={fieldId} className={fieldLabelClassName}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      ) : null}

      <div className="relative">
        <input
          ref={ref}
          id={fieldId}
          type="hidden"
          name={name}
          value={selectedValue}
          required={required}
          disabled={disabled}
          readOnly
        />

        {icon && (
          <span className="absolute left-3 top-1/2 z-10 -translate-y-1/2 text-neutral-400 pointer-events-none">
            {icon}
          </span>
        )}

        <button
          type="button"
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-label={ariaLabel || label || placeholder}
          onClick={() => (open ? setOpen(false) : openMenu())}
          onKeyDown={onTriggerKeyDown}
          onBlur={() => onBlur?.({ target: { name } })}
          className={controlClassName({
            error: Boolean(error),
            withIcon: Boolean(icon),
            withTrailing: true,
            className: cn(
              "text-left flex items-center cursor-pointer",
              !selectedOption && "text-neutral-400"
            ),
          })}
        >
          <span className="truncate">{selectedOption?.label || placeholder}</span>
        </button>

        <span
          className={cn(
            "absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none transition-transform",
            open && "rotate-180"
          )}
        >
          <FiChevronDown className="w-5 h-5" />
        </span>

        {open && (
          <ul
            ref={listRef}
            id={listboxId}
            role="listbox"
            tabIndex={-1}
            aria-activedescendant={`${listboxId}-option-${highlightIndex}`}
            onKeyDown={onListKeyDown}
            className="absolute z-50 mt-2 max-h-60 w-full overflow-auto rounded-xl border border-neutral-200 bg-white p-1.5 shadow-soft-lg focus:outline-none"
          >
            {options.map((option, index) => {
              const selected = option.value === selectedValue;
              const highlighted = index === highlightIndex;

              return (
                <li
                  key={option.value}
                  id={`${listboxId}-option-${index}`}
                  role="option"
                  aria-selected={selected}
                  onMouseEnter={() => setHighlightIndex(index)}
                  onClick={() => commit(option.value)}
                  className={cn(
                    "flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                    highlighted && "bg-primary-50 text-primary-800",
                    selected && !highlighted && "bg-neutral-50 text-neutral-900",
                    !highlighted && !selected && "text-neutral-700 hover:bg-neutral-50"
                  )}
                >
                  <span className="min-w-0 flex-1 break-words">{option.label}</span>
                  {selected ? <FiCheck className="size-4 shrink-0 text-primary-600" /> : null}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {error && <p className={fieldErrorClassName}>{error}</p>}
    </div>
  );
}
