import React from "react";

interface ToolSettingsSectionProps {
  toolName: string;
  toolIcon: React.ReactNode;
  children: React.ReactNode;
}

export function ToolSettingsSection({
  toolName,
  toolIcon,
  children,
}: ToolSettingsSectionProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        {toolIcon}
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          {toolName} 設定
        </h3>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}
