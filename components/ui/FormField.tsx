import { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, ReactNode, useId } from "react";

/**
 * Consistent, accessible form field wrapper: connects a visible <label> to
 * its control via htmlFor/id, and surfaces an error message through
 * aria-describedby + role="alert" so screen readers announce it.
 */

const controlClasses =
  "block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 disabled:bg-gray-100";

interface FieldWrapperProps {
  label: string;
  error?: string;
  hint?: string;
  children: (ids: { inputId: string; describedBy: string | undefined }) => ReactNode;
}

function FieldWrapper({ label, error, hint, children }: FieldWrapperProps) {
  const inputId = useId();
  const errorId = `${inputId}-error`;
  const hintId = `${inputId}-hint`;
  const describedBy = error ? errorId : hint ? hintId : undefined;

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
        {label}
      </label>
      {children({ inputId, describedBy })}
      {hint && !error && (
        <p id={hintId} className="text-xs text-gray-500">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-xs font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  hint?: string;
};

export function TextField({ label, error, hint, className = "", ...props }: InputProps) {
  return (
    <FieldWrapper label={label} error={error} hint={hint}>
      {({ inputId, describedBy }) => (
        <input
          id={inputId}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          className={`${controlClasses} ${className}`}
          {...props}
        />
      )}
    </FieldWrapper>
  );
}

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  error?: string;
  hint?: string;
};

export function SelectField({ label, error, hint, className = "", children, ...props }: SelectProps) {
  return (
    <FieldWrapper label={label} error={error} hint={hint}>
      {({ inputId, describedBy }) => (
        <select
          id={inputId}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          className={`${controlClasses} bg-white ${className}`}
          {...props}
        >
          {children}
        </select>
      )}
    </FieldWrapper>
  );
}

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  error?: string;
  hint?: string;
};

export function TextareaField({ label, error, hint, className = "", ...props }: TextareaProps) {
  return (
    <FieldWrapper label={label} error={error} hint={hint}>
      {({ inputId, describedBy }) => (
        <textarea
          id={inputId}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          className={`${controlClasses} resize-none ${className}`}
          {...props}
        />
      )}
    </FieldWrapper>
  );
}
