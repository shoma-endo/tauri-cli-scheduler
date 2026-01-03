import { ToolType, RunningStatus, TOOL_DISPLAY_NAMES } from "../types/tools";

interface TabSelectorProps {
  activeTab: ToolType;
  onTabChange: (tab: ToolType) => void;
  disabled?: boolean;
  runningStatus?: RunningStatus;
}

export function TabSelector({
  activeTab,
  onTabChange,
  disabled = false,
  runningStatus,
}: TabSelectorProps) {
  const tabs: ToolType[] = ["claude", "codex", "gemini"];

  return (
    <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
      {tabs.map((tab) => {
        const isRunning = runningStatus?.[tab] ?? false;
        return (
          <button
            key={tab}
            type="button"
            onClick={() => onTabChange(tab)}
            disabled={disabled}
            className={`relative px-6 py-3 text-sm font-medium transition-colors duration-200 border-b-2 -mb-px ${
              activeTab === tab
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {TOOL_DISPLAY_NAMES[tab]}
            {isRunning && (
              <span className="absolute top-1 right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
