import React from "react";

interface ConditionalSettingsIndicatorProps {
  visible: boolean;
  condition: string;
  children: React.ReactNode;
}

export function ConditionalSettingsIndicator({
  visible,
  condition,
  children,
}: ConditionalSettingsIndicatorProps) {
  if (visible) {
    return <>{children}</>;
  }

  return (
    <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg border-2 border-orange-200 dark:border-orange-700/50 p-4">
      <div className="flex items-center gap-2">
        <svg
          className="w-5 h-5 text-orange-600 dark:text-orange-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4v2m0 0v2m0-6v-2m0 6v2M7 12a5 5 0 1110 0 5 5 0 01-10 0z"
          />
        </svg>
        <div className="flex-1">
          <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
            この設定は条件付きです
          </p>
          <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
            {condition}
          </p>
        </div>
      </div>
    </div>
  );
}
