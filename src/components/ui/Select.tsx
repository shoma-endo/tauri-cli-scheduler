import React from "react";

interface SelectOption {
  value: string | number;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  error?: string;
  helperText?: string;
}

export function Select({
  label,
  options,
  error,
  helperText,
  className = "",
  id,
  ...props
}: SelectProps) {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label
          htmlFor={selectId}
          className="block text-sm font-medium text-text-primary dark:text-text-dark-primary"
        >
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={`
          px-3 py-2 rounded-lg
          bg-surface-base dark:bg-surface-dark-subtle
          border-2 border-surface-border dark:border-surface-dark-border
          text-text-primary dark:text-text-dark-primary
          focus:outline-none focus:ring-2 focus:ring-primary-DEFAULT focus:border-transparent focus:shadow-lg
          dark:focus:ring-blue-500
          transition-all duration-200
          disabled:opacity-50 disabled:cursor-not-allowed
          appearance-none
          cursor-pointer
          bg-no-repeat
          bg-[length:1.5em_1.5em]
          bg-[position:right_0.5rem_center]
          pr-9
          ${error ? "border-status-error dark:border-red-600" : ""}
          ${className}
        `}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E")`,
        }}
        {...props}
      >
        <option value="">-- 選択してください --</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
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
