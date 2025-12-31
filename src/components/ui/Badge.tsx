import React from "react";

type BadgeVariant = "primary" | "success" | "warning" | "error" | "info" | "neutral";
type BadgeSize = "sm" | "md";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  children: React.ReactNode;
}

export function Badge({
  variant = "primary",
  size = "sm",
  children,
  className = "",
  ...props
}: BadgeProps) {
  const baseClasses = "font-medium rounded-full inline-flex items-center justify-center";

  const variantClasses: Record<BadgeVariant, string> = {
    primary: "bg-primary-50 dark:bg-primary-900 text-primary-DEFAULT dark:text-blue-200",
    success:
      "bg-green-50 dark:bg-green-900 text-status-success dark:text-green-200",
    warning:
      "bg-amber-50 dark:bg-amber-900 text-status-warning dark:text-amber-200",
    error: "bg-red-50 dark:bg-red-900 text-status-error dark:text-red-200",
    info: "bg-blue-50 dark:bg-blue-900 text-status-info dark:text-blue-200",
    neutral:
      "bg-surface-muted dark:bg-surface-dark-muted text-text-secondary dark:text-text-dark-secondary",
  };

  const sizeClasses: Record<BadgeSize, string> = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-1.5 text-sm",
  };

  return (
    <span
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
