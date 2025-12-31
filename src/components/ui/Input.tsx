import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export function Input({
  label,
  error,
  helperText,
  className = "",
  id,
  ...props
}: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-text-primary dark:text-text-dark-primary"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`
          px-3 py-2 rounded-lg
          bg-surface-base dark:bg-surface-dark-subtle
          border-2 border-surface-border dark:border-surface-dark-border
          text-text-primary dark:text-text-dark-primary
          placeholder-text-muted dark:placeholder-text-dark-muted
          focus:outline-none focus:ring-2 focus:ring-primary-DEFAULT focus:border-transparent
          dark:focus:ring-blue-500
          transition-all duration-200
          disabled:opacity-50 disabled:cursor-not-allowed
          ${error ? "border-status-error dark:border-red-600" : ""}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="text-xs text-status-error dark:text-red-400">{error}</p>
      )}
      {helperText && !error && (
        <p className="text-xs text-text-secondary dark:text-text-dark-secondary">
          {helperText}
        </p>
      )}
    </div>
  );
}

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export function Textarea({
  label,
  error,
  helperText,
  className = "",
  id,
  ...props
}: TextareaProps) {
  const textareaId = id || label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label
          htmlFor={textareaId}
          className="block text-sm font-medium text-text-primary dark:text-text-dark-primary"
        >
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        className={`
          px-3 py-2 rounded-lg
          bg-surface-base dark:bg-surface-dark-subtle
          border-2 border-surface-border dark:border-surface-dark-border
          text-text-primary dark:text-text-dark-primary
          placeholder-text-muted dark:placeholder-text-dark-muted
          focus:outline-none focus:ring-2 focus:ring-primary-DEFAULT focus:border-transparent
          dark:focus:ring-blue-500
          transition-all duration-200
          disabled:opacity-50 disabled:cursor-not-allowed
          resize-none
          ${error ? "border-status-error dark:border-red-600" : ""}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="text-xs text-status-error dark:text-red-400">{error}</p>
      )}
      {helperText && !error && (
        <p className="text-xs text-text-secondary dark:text-text-dark-secondary">
          {helperText}
        </p>
      )}
    </div>
  );
}
