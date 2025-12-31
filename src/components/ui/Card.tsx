import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  hoverable?: boolean;
  elevated?: boolean;
}

export function Card({
  children,
  hoverable = false,
  elevated = false,
  className = "",
  ...props
}: CardProps) {
  const baseClasses =
    "bg-surface-base dark:bg-surface-dark-base rounded-lg border-2 border-surface-border dark:border-surface-dark-border p-4 shadow-card dark:shadow-sm";

  const hoverClasses = hoverable
    ? "transition-all duration-200 hover:shadow-card-hover dark:hover:shadow-md cursor-pointer"
    : "";

  const elevatedClasses = elevated ? "shadow-lg dark:shadow-lg" : "";

  return (
    <div
      className={`${baseClasses} ${hoverClasses} ${elevatedClasses} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function CardHeader({ children, className = "", ...props }: CardHeaderProps) {
  return (
    <div className={`flex items-center gap-3 mb-4 ${className}`} {...props}>
      {children}
    </div>
  );
}

interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
}

export function CardTitle({ children, className = "", ...props }: CardTitleProps) {
  return (
    <h3
      className={`text-sm font-semibold text-text-primary dark:text-text-dark-primary flex-1 ${className}`}
      {...props}
    >
      {children}
    </h3>
  );
}

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function CardContent({ children, className = "", ...props }: CardContentProps) {
  return (
    <div className={`space-y-4 ${className}`} {...props}>
      {children}
    </div>
  );
}

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function CardFooter({ children, className = "", ...props }: CardFooterProps) {
  return (
    <div className={`flex items-center justify-between gap-3 mt-4 pt-4 border-t border-surface-border dark:border-surface-dark-border ${className}`} {...props}>
      {children}
    </div>
  );
}
