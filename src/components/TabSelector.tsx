import { ToolType, TOOL_DISPLAY_NAMES } from "../types/tools";

interface TabSelectorProps {
  activeTab: ToolType;
  onTabChange: (tab: ToolType) => void;
  disabled?: boolean;
}

export function TabSelector({
  activeTab,
  onTabChange,
  disabled = false,
}: TabSelectorProps) {
  const tabs: ToolType[] = ["claude", "codex"];

  return (
    <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
      {tabs.map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => onTabChange(tab)}
          disabled={disabled}
          className={`px-6 py-3 text-sm font-medium transition-colors duration-200 border-b-2 -mb-px ${
            activeTab === tab
              ? "border-blue-500 text-blue-600 dark:text-blue-400"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {TOOL_DISPLAY_NAMES[tab]}
        </button>
      ))}
    </div>
  );
}
